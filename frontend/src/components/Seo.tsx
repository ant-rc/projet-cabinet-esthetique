import { useEffect } from 'react';

export const SITE_URL = 'https://aa-lasermed.com';

interface SeoProps {
  title: string;
  description: string;
  path: string;
  noindex?: boolean;
}

/**
 * Per-route document metadata, using React 19 native hoisting.
 *
 * The build also writes these same tags into one HTML file per route, so that
 * crawlers which do not execute JavaScript — social previews above all — see a
 * title and a description. React does not replace those static tags, it adds
 * its own alongside, which would emit two of each and leave crawlers reading
 * whichever came first. They are therefore marked at build time and removed
 * here, once React has committed its own.
 */
export default function Seo({ title, description, path, noindex = false }: SeoProps) {
  const url = `${SITE_URL}${path}`;

  useEffect(() => {
    document.querySelectorAll('head [data-prerendered]').forEach((el) => el.remove());
  }, []);

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
