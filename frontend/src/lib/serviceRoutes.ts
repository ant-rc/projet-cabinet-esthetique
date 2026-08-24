import { servicesData } from '../data/pricing';
import type { DbService, Gender } from '../types';

/**
 * URL vocabulary for service pages.
 *
 * The gender segment is not decorative: service names repeat across the two
 * catalogues ("Nuque" exists at 40 € for women and 60 € for men), so the name
 * alone cannot identify a service. Keeping gender in the path is what makes
 * every URL resolve to exactly one price.
 *
 * This module is imported both by the app and by the sitemap generator in
 * vite.config.ts, so the published URL list can never drift from the routes
 * the router actually serves.
 */

export type GenderSlug = 'femme' | 'homme';

const GENDER_TO_SLUG: Record<Gender, GenderSlug> = { female: 'femme', male: 'homme' };
const SLUG_TO_GENDER: Record<GenderSlug, Gender> = { femme: 'female', homme: 'male' };

/** Unicode combining marks, left behind by NFD normalisation. */
const COMBINING_MARK_START = 0x0300;
const COMBINING_MARK_END = 0x036f;

/**
 * Accent-stripped, punctuation-free slug: "Lèvre supérieure" -> "levre-superieure".
 *
 * Diacritics are removed by code point rather than by a regex range: the range
 * is invisible in source once written literally, and a mangled one would
 * silently ship broken URLs.
 */
export function slugify(value: string): string {
  const withoutAccents = value
    .normalize('NFD')
    .split('')
    .filter((char) => {
      const code = char.charCodeAt(0);
      return code < COMBINING_MARK_START || code > COMBINING_MARK_END;
    })
    .join('');

  return withoutAccents
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function genderToSlug(gender: Gender): GenderSlug {
  return GENDER_TO_SLUG[gender];
}

export function parseGenderSlug(value: string | undefined): Gender | null {
  if (value === 'femme' || value === 'homme') return SLUG_TO_GENDER[value];
  return null;
}

export function servicePath(service: DbService): string {
  return `/tarifs/${GENDER_TO_SLUG[service.gender]}/${slugify(service.name)}`;
}

/** Returns null for any unknown gender or slug, so callers can render a 404. */
export function findService(
  genderSlug: string | undefined,
  slug: string | undefined,
): DbService | null {
  const gender = parseGenderSlug(genderSlug);
  if (!gender || !slug) return null;
  return servicesData.find((s) => s.gender === gender && slugify(s.name) === slug) ?? null;
}

/** Same gender and category, excluding the service itself. */
export function relatedServices(service: DbService, limit = 4): DbService[] {
  return servicesData
    .filter(
      (s) => s.gender === service.gender && s.category === service.category && s.id !== service.id,
    )
    .slice(0, limit);
}

/** Every service URL, for the sitemap. */
export const serviceUrls: string[] = servicesData.map(servicePath);
