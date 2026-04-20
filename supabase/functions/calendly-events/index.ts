// Supabase Edge Function: calendly-events
//
// Fetches upcoming Calendly scheduled events with invitee details.
// The Calendly PAT is kept server-side (never exposed to the browser).
//
// Deploy:
//   supabase functions deploy calendly-events --no-verify-jwt
//
// Set the secret:
//   supabase secrets set CALENDLY_PAT=your_token
//
// Call from frontend:
//   const { data } = await supabase.functions.invoke('calendly-events');
//
// Query params supported:
//   ?eventId=UUID  → fetch a single event
//   ?count=20      → max events to return

// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference types="https://esm.sh/v135/@supabase/functions-js@2.4.1/src/edge-runtime.d.ts" />

interface CalendlyEvent {
  uri: string;
  name: string;
  status: string;
  start_time: string;
  end_time: string;
  created_at: string;
}

interface CalendlyInvitee {
  name: string;
  email: string;
  status: string;
  tracking?: {
    utm_content?: string | null;
    utm_term?: string | null;
  } | null;
}

const CALENDLY_API = 'https://api.calendly.com';
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// @ts-expect-error Deno global is available in Supabase Edge Functions
Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: CORS_HEADERS });
  }

  // @ts-expect-error Deno global
  const pat = Deno.env.get('CALENDLY_PAT') ?? '';
  if (!pat) {
    return new Response(JSON.stringify({ error: 'CALENDLY_PAT not configured' }), {
      status: 500,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }

  const headers = { Authorization: `Bearer ${pat}` };
  const url = new URL(req.url);

  try {
    const eventId = url.searchParams.get('eventId');
    const action = url.searchParams.get('action');

    // Cancel a scheduled event
    if (eventId && action === 'cancel' && req.method === 'POST') {
      const cancelRes = await fetch(`${CALENDLY_API}/scheduled_events/${eventId}/cancellation`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'Annulé par le prestataire' }),
      });
      if (!cancelRes.ok) {
        const errText = await cancelRes.text();
        return new Response(JSON.stringify({ error: errText || 'Cancel failed' }), {
          status: cancelRes.status,
          headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
        });
      }
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }

    // Single event fetch
    if (eventId) {
      const res = await fetch(`${CALENDLY_API}/scheduled_events/${eventId}`, { headers });
      if (!res.ok) {
        return new Response(JSON.stringify({ error: 'Event not found' }), {
          status: res.status,
          headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
        });
      }
      const data = await res.json() as { resource: CalendlyEvent };
      const ev = data.resource;
      return new Response(JSON.stringify({
        event: {
          id: ev.uri.split('/').pop(),
          name: ev.name,
          status: ev.status,
          startTime: ev.start_time,
          endTime: ev.end_time,
        },
      }), { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } });
    }

    // List upcoming events
    const meRes = await fetch(`${CALENDLY_API}/users/me`, { headers });
    if (!meRes.ok) {
      return new Response(JSON.stringify({ error: 'Calendly auth failed' }), {
        status: meRes.status,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }
    const meData = await meRes.json() as { resource: { uri: string } };
    const count = Math.min(Number(url.searchParams.get('count')) || 20, 50);

    const eventsUrl = new URL(`${CALENDLY_API}/scheduled_events`);
    eventsUrl.searchParams.set('user', meData.resource.uri);
    eventsUrl.searchParams.set('status', 'active');
    eventsUrl.searchParams.set('min_start_time', new Date().toISOString());
    eventsUrl.searchParams.set('count', String(count));
    eventsUrl.searchParams.set('sort', 'start_time:asc');

    const eventsRes = await fetch(eventsUrl.toString(), { headers });
    if (!eventsRes.ok) {
      return new Response(JSON.stringify({ error: 'Failed to fetch events' }), {
        status: eventsRes.status,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }

    const eventsData = await eventsRes.json() as { collection: CalendlyEvent[] };

    const items = await Promise.all(
      eventsData.collection.map(async (ev) => {
        const uuid = ev.uri.split('/').pop()!;
        let invitees: { name: string; email: string; status: string; zones: string | null; priceInfo: string | null }[] = [];
        try {
          const invRes = await fetch(`${CALENDLY_API}/scheduled_events/${uuid}/invitees`, { headers });
          if (invRes.ok) {
            const invData = await invRes.json() as { collection: CalendlyInvitee[] };
            invitees = invData.collection.map((inv) => ({
              name: inv.name,
              email: inv.email,
              status: inv.status,
              zones: inv.tracking?.utm_content ?? null,
              priceInfo: inv.tracking?.utm_term ?? null,
            }));
          }
        } catch {
          // skip invitee errors
        }
        return {
          id: uuid,
          name: ev.name,
          status: ev.status,
          startTime: ev.start_time,
          endTime: ev.end_time,
          invitees,
        };
      }),
    );

    return new Response(JSON.stringify({ events: items }), {
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }
});
