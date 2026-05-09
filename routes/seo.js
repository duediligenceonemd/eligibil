'use strict';

// SEO routes — sitemap.xml + robots.txt
// Mounted at the site root so URLs are /sitemap.xml and /robots.txt.
//
// The sitemap reads slug_ro / slug_en / updated_at from the grants table.
// Those columns land in Pas 1 — until then we silently skip grant entries
// so the sitemap remains valid (just static pages). The same column-missing
// regex check we use in routes/api.js is applied here.

const express = require('express');
const { getSupabase } = require('../db/supabase');

const router = express.Router();

const SITE_URL = process.env.SITE_URL || 'https://eligibil.eu';

function tryGetSupabase() {
  try { return getSupabase(); } catch { return null; }
}

function escapeXml(s) {
  if (s == null) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// ── Static pages — only routes that actually exist today.
// /evenimente + /events land in Brief 04; uncomment when those routes ship.
// /pricing /about /parteneri are placeholders in the brief but no routes
// exist yet — including them now would feed Google 404s.
const STATIC_PAGES = [
  { path: '/',       changefreq: 'daily'  },
  { path: '/search', changefreq: 'daily'  },
];

// ── /sitemap.xml ─────────────────────────────────────────────────────────────
router.get('/sitemap.xml', async (req, res) => {
  const urls = [];

  for (const p of STATIC_PAGES) {
    urls.push(
      `  <url><loc>${SITE_URL}${p.path}</loc><changefreq>${p.changefreq}</changefreq></url>`
    );
  }

  const sb = tryGetSupabase();
  if (sb) {
    try {
      const { data, error } = await sb
        .from('grants')
        .select('slug_ro, slug_en, updated_at')
        .eq('status', 'Activ');

      if (error) {
        if (!/column .* does not exist/i.test(error.message || '')) {
          console.error('GET /sitemap.xml grants query error:', error.message);
        }
        // Pas 1 not applied → skip grant entries, keep static pages.
      } else {
        for (const g of (data || [])) {
          const lastmod = g.updated_at
            ? new Date(g.updated_at).toISOString().split('T')[0]
            : null;

          if (g.slug_ro) {
            const slugRo = escapeXml(g.slug_ro);
            const slugEn = g.slug_en ? escapeXml(g.slug_en) : null;
            const lines = [];
            lines.push('  <url>');
            lines.push(`    <loc>${SITE_URL}/ro/granturi/${slugRo}</loc>`);
            if (lastmod) lines.push(`    <lastmod>${lastmod}</lastmod>`);
            lines.push('    <changefreq>weekly</changefreq>');
            lines.push(`    <xhtml:link rel="alternate" hreflang="ro" href="${SITE_URL}/ro/granturi/${slugRo}" />`);
            if (slugEn) {
              lines.push(`    <xhtml:link rel="alternate" hreflang="en" href="${SITE_URL}/en/grants/${slugEn}" />`);
            }
            lines.push(`    <xhtml:link rel="alternate" hreflang="x-default" href="${SITE_URL}/ro/granturi/${slugRo}" />`);
            lines.push('  </url>');
            urls.push(lines.join('\n'));
          }

          if (g.slug_en) {
            const slugEn = escapeXml(g.slug_en);
            const lines = [];
            lines.push('  <url>');
            lines.push(`    <loc>${SITE_URL}/en/grants/${slugEn}</loc>`);
            if (lastmod) lines.push(`    <lastmod>${lastmod}</lastmod>`);
            lines.push('    <changefreq>weekly</changefreq>');
            lines.push('  </url>');
            urls.push(lines.join('\n'));
          }
        }
      }
    } catch (err) {
      console.error('GET /sitemap.xml unexpected error:', err.message);
      // Fall through with whatever we have.
    }
  }

  res.type('application/xml');
  res.send(
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n' +
    '        xmlns:xhtml="http://www.w3.org/1999/xhtml">\n' +
    urls.join('\n') + '\n' +
    '</urlset>\n'
  );
});

// ── /robots.txt ──────────────────────────────────────────────────────────────
router.get('/robots.txt', (req, res) => {
  res.type('text/plain');
  res.send([
    'User-agent: *',
    'Allow: /',
    'Disallow: /admin',
    'Disallow: /admin-queue.html',
    'Disallow: /api/',
    'Disallow: /dashboard',
    'Disallow: /dashboard.html',
    'Disallow: /profile',
    'Disallow: /profile.html',
    'Disallow: /consortium.html',
    'Disallow: /upload-artefact',
    '',
    `Sitemap: ${SITE_URL}/sitemap.xml`,
    '',
  ].join('\n'));
});

module.exports = router;
