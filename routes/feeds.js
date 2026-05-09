'use strict';

// RSS feeds for /stiri, /news, /blog. One file, three endpoints. Each emits
// RSS 2.0 with the latest 30 published items. No new dependencies — XML
// is hand-built with the same escapeXml helper used in routes/seo.js.

const express = require('express');
const { getSupabase } = require('../db/supabase');

const router = express.Router();
const SITE_URL = process.env.SITE_URL || 'https://eligibil.org';

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

// RFC-822 date for RSS pubDate
function rfc822(d) {
  if (!d) return '';
  const date = new Date(d);
  return isNaN(date) ? '' : date.toUTCString();
}

const FEEDS = {
  stiri: {
    table: 'news', lang: 'ro', path: '/stiri',
    title: 'eligibil.org — Știri',
    desc:  'Anunțuri și update-uri despre granturi, programe și ecosistemul de finanțare pentru startup-uri din Moldova, România și UE.',
  },
  news: {
    table: 'news', lang: 'en', path: '/news',
    title: 'eligibil.org — News',
    desc:  'Announcements and updates about grants, programs, and the startup funding ecosystem in Moldova, Romania, and the EU.',
  },
  blog: {
    table: 'blog_posts', lang: 'ro', path: '/blog',
    title: 'eligibil.org — Blog',
    desc:  'Tutoriale, opinii și studii de caz despre eligibilitate, pregătire pentru aplicații și matching AI.',
  },
};

async function buildFeed(req, res, key) {
  const cfg = FEEDS[key];
  const sb = tryGetSupabase();
  let items = [];
  if (sb) {
    try {
      const { data, error } = await sb.from(cfg.table)
        .select('slug_ro, slug_en, title, title_en, excerpt_ro, excerpt_en, ' +
                'author, published_at, updated_at, hero_image')
        .eq('status', 'published')
        .not('published_at', 'is', null)
        .lte('published_at', new Date().toISOString())
        .order('published_at', { ascending: false })
        .limit(30);
      if (!error) items = data || [];
      // Silently degrade if relation missing (pre-Iter-3)
    } catch { /* ignore */ }
  }

  const isEn = cfg.lang === 'en';
  const channel = {
    title: cfg.title,
    link:  SITE_URL + cfg.path,
    description: cfg.desc,
    language: cfg.lang,
    lastBuild: rfc822(new Date()),
  };

  const xmlItems = items.map((it) => {
    const slug = isEn ? (it.slug_en || it.slug_ro) : it.slug_ro;
    const link = SITE_URL + cfg.path + '/' + slug;
    const title = isEn ? (it.title_en || it.title) : it.title;
    const desc  = isEn ? (it.excerpt_en || it.excerpt_ro) : (it.excerpt_ro || it.excerpt_en);
    const pub   = rfc822(it.published_at);
    return [
      '    <item>',
      '      <title>' + escapeXml(title || '') + '</title>',
      '      <link>' + escapeXml(link) + '</link>',
      '      <guid isPermaLink="true">' + escapeXml(link) + '</guid>',
      pub ? '      <pubDate>' + pub + '</pubDate>' : '',
      it.author ? '      <author>noreply@eligibil.org (' + escapeXml(it.author) + ')</author>' : '',
      desc ? '      <description>' + escapeXml(desc) + '</description>' : '',
      it.hero_image ? '      <enclosure url="' + escapeXml(it.hero_image) + '" type="image/jpeg" />' : '',
      '    </item>',
    ].filter(Boolean).join('\n');
  }).join('\n');

  const xml =
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">\n' +
    '  <channel>\n' +
    '    <title>' + escapeXml(channel.title) + '</title>\n' +
    '    <link>' + escapeXml(channel.link) + '</link>\n' +
    '    <description>' + escapeXml(channel.description) + '</description>\n' +
    '    <language>' + escapeXml(channel.language) + '</language>\n' +
    '    <lastBuildDate>' + channel.lastBuild + '</lastBuildDate>\n' +
    '    <atom:link href="' + escapeXml(SITE_URL + cfg.path + '/feed.xml') + '" rel="self" type="application/rss+xml" />\n' +
    xmlItems + (xmlItems ? '\n' : '') +
    '  </channel>\n' +
    '</rss>\n';

  res.type('application/rss+xml; charset=utf-8');
  res.send(xml);
}

router.get('/stiri/feed.xml', (req, res) => buildFeed(req, res, 'stiri'));
router.get('/news/feed.xml',  (req, res) => buildFeed(req, res, 'news'));
router.get('/blog/feed.xml',  (req, res) => buildFeed(req, res, 'blog'));

module.exports = router;
