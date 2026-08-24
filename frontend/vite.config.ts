import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import type { Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

import { serviceUrls } from './src/lib/serviceRoutes'
import { faqUrls } from './src/data/faqPages'

const SITE_URL = 'https://aa-lasermed.com'

/** Public routes only. Private areas are disallowed in robots.txt. */
const ROUTES: { path: string; priority: string; changefreq: string }[] = [
  { path: '/', priority: '1.0', changefreq: 'monthly' },
  { path: '/tarifs', priority: '0.9', changefreq: 'monthly' },
  { path: '/reservation', priority: '0.9', changefreq: 'monthly' },
  { path: '/contact', priority: '0.7', changefreq: 'yearly' },
  { path: '/faq', priority: '0.7', changefreq: 'monthly' },
  { path: '/mentions-legales', priority: '0.2', changefreq: 'yearly' },
  // Service and FAQ pages come from the same modules the router uses, so the
  // published list cannot drift from the pages actually served.
  ...serviceUrls.map((path) => ({ path, priority: '0.8', changefreq: 'monthly' })),
  ...faqUrls.map((path) => ({ path, priority: '0.6', changefreq: 'yearly' })),
]

/**
 * Emits sitemap.xml at build time so the URL list can never drift from the
 * routes actually shipped.
 */
function sitemap(): Plugin {
  return {
    name: 'generate-sitemap',
    apply: 'build',
    closeBundle() {
      const lastmod = new Date().toISOString().split('T')[0]
      const urls = ROUTES.map(
        ({ path, priority, changefreq }) =>
          `  <url>\n` +
          `    <loc>${SITE_URL}${path}</loc>\n` +
          `    <lastmod>${lastmod}</lastmod>\n` +
          `    <changefreq>${changefreq}</changefreq>\n` +
          `    <priority>${priority}</priority>\n` +
          `  </url>`,
      ).join('\n')

      const xml =
        `<?xml version="1.0" encoding="UTF-8"?>\n` +
        `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
        `${urls}\n` +
        `</urlset>\n`

      writeFileSync(resolve(__dirname, 'dist/sitemap.xml'), xml, 'utf-8')
      console.log(`✓ sitemap.xml — ${ROUTES.length} URLs`)
    },
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), sitemap()],
  resolve: {
    alias: {
      '@': '/src',
    },
  },
})
