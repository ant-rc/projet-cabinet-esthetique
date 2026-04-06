/**
 * Maps total session duration (minutes) to the closest Calendly event type slug.
 * The user must create matching event types in their Calendly dashboard.
 *
 * Base URL is read from VITE_CALENDLY_URL env var (e.g. https://calendly.com/aalasermed).
 */

const CALENDLY_BASE = (import.meta.env.VITE_CALENDLY_URL as string | undefined) ?? '';

/** Available durations and their Calendly event slugs */
const DURATION_SLUGS: { maxMinutes: number; slug: string }[] = [
  { maxMinutes: 15, slug: 'seance-15' },
  { maxMinutes: 20, slug: 'seance-20' },
  { maxMinutes: 25, slug: 'seance-25' },
  { maxMinutes: 30, slug: 'seance-30' },
  { maxMinutes: 35, slug: 'seance-35' },
  { maxMinutes: 40, slug: 'seance-40' },
  { maxMinutes: 45, slug: 'seance-45' },
  { maxMinutes: 60, slug: 'seance-60' },
  { maxMinutes: 75, slug: 'seance-75' },
  { maxMinutes: Infinity, slug: 'seance-75' }, // fallback to longest
];

/**
 * Get the Calendly event URL for a given total duration.
 *
 * On the free plan, only one event type is available.
 * All bookings point to the single active event ("consultation").
 * When more event types are created, uncomment the duration-based logic.
 */
export function getCalendlyEventUrl(_durationMinutes: number, _isConsultation: boolean): string {
  if (!CALENDLY_BASE) return '';

  // Free plan: single event type for everything
  return `${CALENDLY_BASE}/consultation`;

  // Uncomment when multiple event types are available:
  // if (isConsultation) return `${CALENDLY_BASE}/consultation`;
  // const match = DURATION_SLUGS.find((d) => durationMinutes <= d.maxMinutes);
  // return `${CALENDLY_BASE}/${match?.slug ?? 'seance-30'}`;
}

/**
 * Build UTM parameters to pass service info to Calendly.
 * These appear in the webhook payload under `tracking`.
 */
export function buildCalendlyUtm(zones: string[], totalPrice: number, totalDuration: number): Record<string, string> {
  return {
    utmSource: 'aalasermed-website',
    utmMedium: 'booking',
    utmContent: zones.join(' | '),
    utmTerm: `${totalPrice}€ - ${totalDuration}min`,
    utmCampaign: 'reservation',
  };
}
