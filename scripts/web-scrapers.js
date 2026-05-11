'use strict';

/**
 * web-scrapers.js
 *
 * Pulls grant announcements from public funder websites and RSS feeds,
 * pipes each one through the standard processInput pipeline.
 *
 * Sources:
 *   - EIC (RSS)
 *   - Cordis Horizon Europe (RSS)
 *   - ODIMM Moldova (HTML)
 *   - Startup Moldova (HTML)
 *   - AIPA Moldova (HTML)
 *   - Fonduri UE Romania (HTML)
 *
 * Each scraper returns: [{ title, body, url, date }]
 *
 * Usage:
 *   node scripts/web-scrapers.js              # all sources
 *   node scripts/web-scrapers.js --only=eic   # specific source
 *   node scripts/web-scrapers.js --dry-run    # extract but don't write
 */

require('dotenv').config();

const Parser   = require('rss-parser');
const cheerio  = require('cheerio');

const { getSupabase } = require('../db/supabase');
const { processInput } = require('./process-grants-inbox');

const rss = new Parser({
  timeout: 15000,
  headers: { 'User-Agent': 'eligibil.org-bot/1.0 (+https://eligibil.org)' },
});

const FETCH_TIMEOUT = 15000;
async function fetchHTML(url) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: { 'User-Agent': 'eligibil.org-bot/1.0', 'Accept-Language': 'ro,en;q=0.9' },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.text();
  } finally {
    clearTimeout(timer);
  }
}

// =============================================================================
// SOURCE: EIC (European Innovation Council) — RSS
// =============================================================================
async function scrapeEIC() {
  const URL = 'https://eic.ec.europa.eu/news_en/rss.xml';
  try {
    const feed = await rss.parseURL(URL);
    return (feed.items || []).slice(0, 20).map(item => ({
      title: item.title,
      body: `${item.title}\n\n${item.contentSnippet || item.content || ''}\n\nSource: ${item.link}`,
      url:  item.link,
      date: item.pubDate ? new Date(item.pubDate) : new Date(),
      sourceId: item.guid || item.link,
    }));
  } catch (err) {
    console.error('   ❌ EIC failed:', err.message);
    return [];
  }
}

// =============================================================================
// SOURCE: Cordis (Horizon Europe news) — RSS
// =============================================================================
async function scrapeCordis() {
  const URL = 'https://cordis.europa.eu/news/rcn.rss';
  try {
    const feed = await rss.parseURL(URL);
    return (feed.items || []).slice(0, 20).map(item => ({
      title: item.title,
      body: `${item.title}\n\n${item.contentSnippet || item.content || ''}\n\nSource: ${item.link}`,
      url:  item.link,
      date: item.pubDate ? new Date(item.pubDate) : new Date(),
      sourceId: item.guid || item.link,
    }));
  } catch (err) {
    console.error('   ❌ Cordis failed:', err.message);
    return [];
  }
}

// =============================================================================
// SOURCE: ODIMM Moldova — HTML
// =============================================================================
async function scrapeOdimm() {
  const URL = 'https://odimm.md/ro/granturi/';
  try {
    const html = await fetchHTML(URL);
    const $ = cheerio.load(html);
    const items = [];
    // ODIMM lists grants in article cards or list items — try multiple selectors
    $('article, .entry, .post, .news-item, .grant-item').each((_, el) => {
      const title = $(el).find('h2, h3, .title').first().text().trim();
      const link  = $(el).find('a').first().attr('href');
      const summary = $(el).find('p, .excerpt, .description').first().text().trim();
      if (title && title.length > 10 && link) {
        const fullUrl = link.startsWith('http') ? link : new URL(link, URL).href;
        items.push({
          title,
          body: `${title}\n\n${summary}\n\nSource: ${fullUrl}`,
          url:  fullUrl,
          date: new Date(),
          sourceId: fullUrl,
        });
      }
    });
    return items.slice(0, 15);
  } catch (err) {
    console.error('   ❌ ODIMM failed:', err.message);
    return [];
  }
}

// =============================================================================
// SOURCE: Startup Moldova — HTML
// =============================================================================
async function scrapeStartupMoldova() {
  const URL = 'https://startupmoldova.md/calls/';
  try {
    const html = await fetchHTML(URL);
    const $ = cheerio.load(html);
    const items = [];
    $('article, .call, .event, .post, .grant').each((_, el) => {
      const title = $(el).find('h1, h2, h3, .title').first().text().trim();
      const link  = $(el).find('a').first().attr('href');
      const summary = $(el).find('p, .summary, .excerpt').first().text().trim();
      if (title && link) {
        const fullUrl = link.startsWith('http') ? link : new URL(link, URL).href;
        items.push({
          title,
          body: `${title}\n\n${summary}\n\nSource: ${fullUrl}`,
          url:  fullUrl,
          date: new Date(),
          sourceId: fullUrl,
        });
      }
    });
    return items.slice(0, 15);
  } catch (err) {
    console.error('   ❌ Startup Moldova failed:', err.message);
    return [];
  }
}

// =============================================================================
// SOURCE: AIPA Moldova — HTML
// =============================================================================
async function scrapeAipa() {
  const URL = 'https://aipa.gov.md/anunturi/';
  try {
    const html = await fetchHTML(URL);
    const $ = cheerio.load(html);
    const items = [];
    $('.news-item, .anunt, article, .item').each((_, el) => {
      const title = $(el).find('h2, h3, .title, a').first().text().trim();
      const link  = $(el).find('a').first().attr('href');
      const summary = $(el).find('p, .excerpt').first().text().trim();
      if (title && link && /grant|finantare|apel|subvenții/i.test(title + summary)) {
        const fullUrl = link.startsWith('http') ? link : new URL(link, URL).href;
        items.push({
          title,
          body: `${title}\n\n${summary}\n\nSource: ${fullUrl}`,
          url:  fullUrl,
          date: new Date(),
          sourceId: fullUrl,
        });
      }
    });
    return items.slice(0, 15);
  } catch (err) {
    console.error('   ❌ AIPA failed:', err.message);
    return [];
  }
}

// =============================================================================
// SOURCE: Fonduri UE Romania — HTML
// =============================================================================
async function scrapeFonduriUe() {
  const URL = 'https://www.fonduri-ue.ro/programe';
  try {
    const html = await fetchHTML(URL);
    const $ = cheerio.load(html);
    const items = [];
    $('.program, article, .card, .news-item').each((_, el) => {
      const title = $(el).find('h2, h3, .title, .name').first().text().trim();
      const link  = $(el).find('a').first().attr('href');
      const summary = $(el).find('p, .description').first().text().trim();
      if (title && link) {
        const fullUrl = link.startsWith('http') ? link : new URL(link, URL).href;
        items.push({
          title,
          body: `${title}\n\n${summary}\n\nSource: ${fullUrl}`,
          url:  fullUrl,
          date: new Date(),
          sourceId: fullUrl,
        });
      }
    });
    return items.slice(0, 15);
  } catch (err) {
    console.error('   ❌ Fonduri UE failed:', err.message);
    return [];
  }
}

// =============================================================================
// Source registry
// =============================================================================
const SCRAPERS = {
  eic:        { name: 'EIC',              fn: scrapeEIC },
  cordis:     { name: 'Cordis',           fn: scrapeCordis },
  odimm:      { name: 'ODIMM',            fn: scrapeOdimm },
  startupmd:  { name: 'Startup Moldova',  fn: scrapeStartupMoldova },
  aipa:       { name: 'AIPA',             fn: scrapeAipa },
  fonduriue:  { name: 'Fonduri UE',       fn: scrapeFonduriUe },
};

// =============================================================================
// Main: run all scrapers, send each item through processInput
// =============================================================================
async function runAll(opts = {}) {
  const onlyArg = (process.argv.find(a => a.startsWith('--only=')) || '').split('=')[1];
  const dryRun = opts.dryRun || process.argv.includes('--dry-run');

  const supabase = !opts.dryRun && (() => { try { return getSupabase(); } catch { return null; }})();

  const sources = onlyArg
    ? [[onlyArg, SCRAPERS[onlyArg]]].filter(([, v]) => v)
    : Object.entries(SCRAPERS);

  if (!sources.length) {
    console.error(`Unknown source. Available: ${Object.keys(SCRAPERS).join(', ')}`);
    return;
  }

  let totalItems = 0, processed = 0, skipped = 0;

  for (const [key, { name, fn }] of sources) {
    console.log(`\n🌐 Scraping ${name}...`);

    // Get last_check from grant_sources (so we only process new items)
    let lastCheck = null;
    if (supabase) {
      const { data } = await supabase
        .from('grant_sources')
        .select('last_check')
        .eq('funder_name', name)
        .maybeSingle();
      lastCheck = data?.last_check ? new Date(data.last_check) : null;
    }

    const items = await fn();
    console.log(`   📥 ${items.length} item(s) found`);
    totalItems += items.length;

    // Filter by date
    const fresh = lastCheck
      ? items.filter(i => i.date > lastCheck)
      : items;

    if (lastCheck && fresh.length < items.length) {
      console.log(`   ⏭  ${items.length - fresh.length} skipped (already seen)`);
    }

    for (const item of fresh) {
      try {
        const result = await processInput({
          body: item.body,
          subject: item.title,
          label: `${key}:${item.sourceId.slice(0, 60)}`,
          sourceType: 'scraper',
          sourceId: item.sourceId,
        }, { dryRun });

        if (result.ok) processed++;
        else if (result.skipped) skipped++;
      } catch (err) {
        console.error(`   ❌ Item failed: ${err.message}`);
      }
    }

    // Update last_check
    if (supabase && fresh.length) {
      await supabase
        .from('grant_sources')
        .update({ last_check: new Date().toISOString() })
        .eq('funder_name', name);
    }
  }

  console.log('\n══════════════════════════════════════════');
  console.log(`✓ Scrapers done: ${totalItems} found · ${processed} processed · ${skipped} skipped`);
  console.log('══════════════════════════════════════════\n');

  return { totalItems, processed, skipped };
}

if (require.main === module) {
  runAll().catch(err => {
    console.error('FATAL:', err);
    process.exit(1);
  });
}

module.exports = { runAll, SCRAPERS };
