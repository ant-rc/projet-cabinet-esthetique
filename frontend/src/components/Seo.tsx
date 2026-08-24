/**
 * Per-route document metadata.
 *
 * React 19 hoists <title>, <meta> and <link> rendered anywhere in the tree
 * into <head>, so no external helmet library is needed.
 */

export const SITE_URL = 'https://aa-lasermed.com';

interface SeoProps {
  /** Page title. Aim for 55-60 characters. */
  title: string;
  /** Meta description. Aim for 150-160 characters. */
  description: string;
  /** Route path, leading slash included (e.g. '/tarifs'). */
  path: string;
  /** Excludes the page from search results. Use on private and account pages. */
  noindex?: boolean;
}

export default function Seo({ title, description, path, noindex = false }: SeoProps) {
  const url = `${SITE_URL}${path}`;

  return (
    <>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      {noindex && <meta name="robots" content="noindex, nofollow" />}

      <meta property="og:type" content="website" />
      <meta property="og:site_name" content="AA Laser Med" />
      <meta property="og:locale" content="fr_FR" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta name="twitter:card" content="summary" />
    </>
  );
}
