import type { VercelRequest, VercelResponse } from '@vercel/node';

const CALENDLY_PAT = process.env.CALENDLY_PAT ?? '';
const API_BASE = 'https://api.calendly.com';

interface CalendlyEvent {
  uri: string;
  name: string;
  status: string;
  start_time: string;
  end_time: string;
  event_type: string;
  location: { type: string; location?: string } | null;
  invitees_counter: { total: number; active: number; limit: number };
  created_at: string;
  updated_at: string;
}

interface CalendlyInvitee {
  uri: string;
  name: string;
  email: string;
  status: string;
  created_at: string;
  tracking: {
    utm_source: string | null;
    utm_content: string | null;
    utm_term: string | null;
  } | null;
}

/**
 * GET /api/calendly/events
 *
 * Returns upcoming Calendly scheduled events with invitee details.
 * Query params:
 *   - status: 'active' (default) | 'canceled'
 *   - count: number of events (default 20, max 50)
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!CALENDLY_PAT) {
    return res.status(500).json({ error: 'Calendly PAT not configured' });
  }

  try {
    // Step 1: Get current user URI
    const meRes = await fetch(`${API_BASE}/users/me`, {
      headers: { Authorization: `Bearer ${CALENDLY_PAT}` },
    });

    if (!meRes.ok) {
      return res.status(meRes.status).json({ error: 'Failed to fetch Calendly user' });
    }

    const meData = await meRes.json() as { resource: { uri: string } };
    const userUri = meData.resource.uri;

    // Step 2: Fetch scheduled events
    const status = (req.query.status as string) ?? 'active';
    const count = Math.min(Number(req.query.count) || 20, 50);
    const now = new Date().toISOString();

    const eventsUrl = new URL(`${API_BASE}/scheduled_events`);
    eventsUrl.searchParams.set('user', userUri);
    eventsUrl.searchParams.set('status', status);
    eventsUrl.searchParams.set('min_start_time', now);
    eventsUrl.searchParams.set('count', String(count));
    eventsUrl.searchParams.set('sort', 'start_time:asc');

    const eventsRes = await fetch(eventsUrl.toString(), {
      headers: { Authorization: `Bearer ${CALENDLY_PAT}` },
    });

    if (!eventsRes.ok) {
      return res.status(eventsRes.status).json({ error: 'Failed to fetch events' });
    }

    const eventsData = await eventsRes.json() as { collection: CalendlyEvent[] };

    // Step 3: Fetch invitees for each event
    const eventsWithInvitees = await Promise.all(
      eventsData.collection.map(async (event) => {
        const eventUuid = event.uri.split('/').pop();
        const inviteesRes = await fetch(
          `${API_BASE}/scheduled_events/${eventUuid}/invitees`,
          { headers: { Authorization: `Bearer ${CALENDLY_PAT}` } },
        );

        let invitees: CalendlyInvitee[] = [];
        if (inviteesRes.ok) {
          const invData = await inviteesRes.json() as { collection: CalendlyInvitee[] };
          invitees = invData.collection;
        }

        return {
          id: eventUuid,
          name: event.name,
          status: event.status,
          startTime: event.start_time,
          endTime: event.end_time,
          createdAt: event.created_at,
          invitees: invitees.map((inv) => ({
            name: inv.name,
            email: inv.email,
            status: inv.status,
            zones: inv.tracking?.utm_content ?? null,
            priceInfo: inv.tracking?.utm_term ?? null,
          })),
        };
      }),
    );

    // Cache for 60 seconds
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=120');
    return res.status(200).json({ events: eventsWithInvitees });
  } catch (err) {
    console.error('Calendly API error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
