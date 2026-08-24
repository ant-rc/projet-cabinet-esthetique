import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { defineConfig } from 'vite'
import type { Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { ALL_PAGES } from './src/lib/pageMeta'
import type { PageMeta } from './src/lib/pageMeta'

const SITE_URL = 'https://aa-lasermed.com'

/** Priority and change frequency by route shape, for the sitemap. */
function sitemapWeight(path: string): { priority: string; changefreq: string } {
  if (path === '/') return { priority: '1.0', changefreq: 'monthly' }
  if (path === '/mentions-legales') return { priority: '0.2', changefreq: 'yearly' }
  if (path.startsWith('/faq/')) return { priority: '0.6', changefreq: 'yearly' }
  if (path.startsWith('/tarifs/')) return { priority: '0.8', changefreq: 'monthly' }
  if (path === '/tarifs' || path === '/reservation') return { priority: '0.9', changefreq: 'monthly' }
  return { priority: '0.7', changefreq: 'monthly' }
}

/** Private routes stay out of the sitemap; robots.txt disallows them too. */
const indexablePages = ALL_PAGES.filter((page) => !page.noindex)

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/**
 * Head tags written into the prerendered HTML.
 *
 * Every tag carries data-prerendered so the Seo component can remove them once
 * React has committed its own; without that marker the page would carry two
 * titles and two descriptions, and crawlers read whichever comes first.
 */
function headTags(page: PageMeta): string {
  const url = `${SITE_URL}${page.path}`
  const title = escapeHtml(page.title)
  const description = escapeHtml(page.description)

  const tags = [
    `<title data-prerendered>${title}</title>`,
    `<meta data-prerendered name="description" content="${description}" />`,
    `<link data-prerendered rel="canonical" href="${url}" />`,
    page.noindex ? `<meta data-prerendered name="robots" content="noindex, nofollow" />` : null,
    `<meta data-prerendered property="og:type" content="website" />`,
    `<meta data-prerendered property="og:site_name" content="AA Laser Med" />`,
    `<meta data-prerendered property="og:locale" content="fr_FR" />`,
    `<meta data-prerendered property="og:title" content="${title}" />`,
    `<meta data-prerendered property="og:description" content="${description}" />`,
    `<meta data-prerendered property="og:url" content="${url}" />`,
    `<meta data-prerendered name="twitter:card" content="summary" />`,
  ].filter(Boolean)

  return tags.map((tag) => `    ${tag}`).join('\n')
}

/**
 * Writes one HTML file per route, each carrying its own metadata.
 *
 * The app is a single page application with no server rendering, so the served
 * HTML used to be identical for every url and carried no title at all. Crawlers
 * that execute JavaScript recovered the real tags; social preview crawlers do
 * not execute any, so shared links showed nothing. Vercel checks the filesystem
 * before applying its rewrite, so a file at dist/tarifs/index.html is served
 * for /tarifs and the rewrite never fires.
 */
function prerender(): Plugin {
  return {
    name: 'prerender-routes',
    apply: 'build',
    closeBundle() {
      const distDir = resolve(__dirname, 'dist')
      const template = readFileSync(resolve(distDir, 'index.html'), 'utf-8')

      if (!template.includes('</head>')) {
        throw new Error('prerender: no </head> in the built index.html')
      }

      for (const page of ALL_PAGES) {
        const html = template.replace('</head>', `${headTags(page)}\n  </head>`)
        // "/" is the template itself and also the SPA fallback target.
        const file =
          page.path === '/'
            ? resolve(distDir, 'index.html')
            : resolve(distDir, `.${page.path}`, 'index.html')

        mkdirSync(dirname(file), { recursive: true })
        writeFileSync(file, html, 'utf-8')
      }

      console.log(`✓ prerender — ${ALL_PAGES.length} pages`)
    },
  }
}

/**
 * Emits sitemap.xml at build time from the same page list the router serves,
 * so the URL list can never drift from the pages actually shipped.
 */
function sitemap(): Plugin {
  return {
    name: 'generate-sitemap',
    apply: 'build',
    closeBundle() {
      const lastmod = new Date().toISOString().split('T')[0]
      const urls = indexablePages
        .map((page) => {
          const { priority, changefreq } = sitemapWeight(page.path)
          return (
            `  <url>\n` +
            `    <loc>${SITE_URL}${page.path}</loc>\n` +
            `    <lastmod>${lastmod}</lastmod>\n` +
            `    <changefreq>${changefreq}</changefreq>\n` +
            `    <priority>${priority}</priority>\n` +
            `  </url>`
          )
        })
        .join('\n')

      const xml =
        `<?xml version="1.0" encoding="UTF-8"?>\n` +
        `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
        `${urls}\n` +
        `</urlset>\n`

      writeFileSync(resolve(__dirname, 'dist/sitemap.xml'), xml, 'utf-8')
      console.log(`✓ sitemap.xml — ${indexablePages.length} URLs`)
    },
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), sitemap(), prerender()],
  resolve: {
    alias: {
      '@': '/src',
    },
  },
})
