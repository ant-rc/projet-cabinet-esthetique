import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL ?? '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';

/**
 * POST /api/webhooks/calendly
 *
 * Receives Calendly webhook events (invitee.created, invitee.canceled)
 * and syncs appointment data to Supabase.
 *
 * Environment variables required:
 * - SUPABASE_URL
 * - SUPABASE_SERVICE_ROLE_KEY
 * - CALENDLY_WEBHOOK_SECRET (optional, for signature verification)
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase environment variables');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const { event, payload } = req.body as {
      event: string;
      payload: {
        event_type: { name: string; duration: number };
        invitee: {
          name: string;
          email: string;
          first_name: string;
          last_name: string;
          text_reminder_number: string | null;
        };
        scheduled_event: {
          start_time: string;
          end_time: string;
          uri: string;
        };
        tracking: {
          utm_source: string | null;
          utm_medium: string | null;
          utm_content: string | null;
          utm_term: string | null;
          utm_campaign: string | null;
        };
      };
    };

    if (event === 'invitee.created') {
      const { invitee, scheduled_event, tracking, event_type } = payload;

      // Parse date and time from the scheduled event
      const startDate = new Date(scheduled_event.start_time);
      const date = startDate.toISOString().split('T')[0];
      const time = startDate.toTimeString().slice(0, 5);

      const isConsultation = event_type.name.toLowerCase().includes('consultation');

      // Try to find the user by email
      const { data: users } = await supabase
        .from('users')
        .select('id')
        .eq('email', invitee.email)
        .limit(1);

      const userId = users?.[0]?.id ?? null;

      // Build notes with tracking info (zones, price from UTM params)
      const zones = tracking?.utm_content ?? '';
      const priceInfo = tracking?.utm_term ?? '';

      const notes = [
        `Calendly booking — ${event_type.name}`,
        zones ? `Zones: ${zones}` : '',
        priceInfo ? `Info: ${priceInfo}` : '',
        !userId ? `Guest: ${invitee.first_name} ${invitee.last_name} — ${invitee.email}` : '',
      ].filter(Boolean).join('\n');

      const { error } = await supabase.from('appointments').insert({
        user_id: userId,
        service_id: null,
        date,
        time,
        status: 'confirmed',
        is_first_consultation: isConsultation,
        notes,
      });

      if (error) {
        console.error('Supabase insert error:', error);
        return res.status(500).json({ error: 'Failed to save appointment' });
      }

      return res.status(200).json({ success: true, action: 'created' });
    }

    if (event === 'invitee.canceled') {
      const { invitee, scheduled_event } = payload;

      // Find and cancel the appointment
      const startDate = new Date(scheduled_event.start_time);
      const date = startDate.toISOString().split('T')[0];
      const time = startDate.toTimeString().slice(0, 5);

      // Find user
      const { data: users } = await supabase
        .from('users')
        .select('id')
        .eq('email', invitee.email)
        .limit(1);

      const userId = users?.[0]?.id;

      if (userId) {
        await supabase
          .from('appointments')
          .update({ status: 'cancelled' })
          .eq('user_id', userId)
          .eq('date', date)
          .eq('time', time)
          .eq('status', 'confirmed');
      }

      return res.status(200).json({ success: true, action: 'cancelled' });
    }

    // Unknown event
    return res.status(200).json({ success: true, action: 'ignored' });
  } catch (err) {
    console.error('Webhook error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
