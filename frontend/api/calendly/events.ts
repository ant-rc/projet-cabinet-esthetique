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
 * Query params:
 *   - eventId: fetch a single event by UUID (returns { event: {...} })
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

  const headers = { Authorization: `Bearer ${CALENDLY_PAT}` };

  try {
    // Single event fetch by ID
    const eventId = req.query.eventId as string | undefined;
    if (eventId) {
      const eventRes = await fetch(`${API_BASE}/scheduled_events/${eventId}`, { headers });
      if (!eventRes.ok) {
        return res.status(eventRes.status).json({ error: 'Event not found' });
      }
      const eventData = await eventRes.json() as { resource: CalendlyEvent };
      const ev = eventData.resource;

      res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate=60');
      return res.status(200).json({
        event: {
          id: ev.uri.split('/').pop(),
          name: ev.name,
          status: ev.status,
          startTime: ev.start_time,
          endTime: ev.end_time,
        },
      });
    }

    // List upcoming events
    const meRes = await fetch(`${API_BASE}/users/me`, { headers });
    if (!meRes.ok) {
      return res.status(meRes.status).json({ error: 'Failed to fetch Calendly user' });
    }
    const meData = await meRes.json() as { resource: { uri: string } };
    const userUri = meData.resource.uri;

    const status = (req.query.status as string) ?? 'active';
    const count = Math.min(Number(req.query.count) || 20, 50);

    const eventsUrl = new URL(`${API_BASE}/scheduled_events`);
    eventsUrl.searchParams.set('user', userUri);
    eventsUrl.searchParams.set('status', status);
    eventsUrl.searchParams.set('min_start_time', new Date().toISOString());
    eventsUrl.searchParams.set('count', String(count));
    eventsUrl.searchParams.set('sort', 'start_time:asc');

    const eventsRes = await fetch(eventsUrl.toString(), { headers });
    if (!eventsRes.ok) {
      return res.status(eventsRes.status).json({ error: 'Failed to fetch events' });
    }

    const eventsData = await eventsRes.json() as { collection: CalendlyEvent[] };

    const eventsWithInvitees = await Promise.all(
      eventsData.collection.map(async (event) => {
        const eventUuid = event.uri.split('/').pop();
        const inviteesRes = await fetch(
          `${API_BASE}/scheduled_events/${eventUuid}/invitees`,
          { headers },
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

    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=120');
    return res.status(200).json({ events: eventsWithInvitees });
  } catch (err) {
    console.error('Calendly API error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
