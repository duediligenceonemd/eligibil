'use strict';

/**
 * lib/indexnow.js — IndexNow protocol client
 *
 * Notifies Bing (which feeds ChatGPT Search) and other engines instantly
 * when content is published or updated. ~30-second indexing vs days.
 *
 * Setup:
 *   1. Set INDEXNOW_KEY in .env / Cloud Run (generate any UUID)
 *   2. The key verification file is served at /{key}.txt by routes/seo.js
 *   3. Submit to Bing Webmaster Tools once to activate
 *
 * Docs: https://www.indexnow.org/documentation
 */

const { reportError } = require('../instrument');

const INDEXNOW_HOST    = 'https://api.indexnow.org/IndexNow';
const SITE_HOST        = process.env.SITE_URL || 'https://eligibil.org';
const INDEXNOW_KEY     = process.env.INDEXNOW_KEY || null;

/**
 * Notify IndexNow about one or more URLs.
 * @param {string|string[]} urls  - absolute URLs that changed
 * @returns {Promise<boolean>}
 */
async function notifyIndexNow(urls) {
  if (!INDEXNOW_KEY) return false;

  const urlList = (Array.isArray(urls) ? urls : [urls]).filter(Boolean);
  if (!urlList.length) return false;

  try {
    const body = {
      host:        SITE_HOST.replace(/^https?:\/\//, ''),
      key:         INDEXNOW_KEY,
      keyLocation: `${SITE_HOST}/${INDEXNOW_KEY}.txt`,
      urlList,
    };

    const res = await fetch(INDEXNOW_HOST, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body:    JSON.stringify(body),
      signal:  AbortSignal.timeout(8000),
    });

    if (!res.ok && res.status !== 202) {
      const text = await res.text().catch(() => '');
      console.warn(`[indexnow] HTTP ${res.status}: ${text.slice(0, 200)}`);
    }

    console.log(`[indexnow] notified ${urlList.length} URL(s) → ${res.status}`);
    return res.ok || res.status === 202;
  } catch (err) {
    // Non-fatal — indexing delay is the only downside
    reportError(err, { tags: { area: 'indexnow' }, extra: { urlList } });
    return false;
  }
}

/**
 * Build canonical grant URL from slug.
 */
function grantUrl(slugRo, slugEn) {
  const urls = [];
  if (slugRo) urls.push(`${SITE_HOST}/ro/granturi/${slugRo}`);
  if (slugEn) urls.push(`${SITE_HOST}/en/grants/${slugEn}`);
  return urls;
}

/**
 * Convenience: notify when a grant is created or updated.
 */
function notifyGrant(grant) {
  if (!grant) return Promise.resolve(false);
  const urls = grantUrl(grant.slug_ro, grant.slug_en);
  if (!urls.length) return Promise.resolve(false);
  return notifyIndexNow(urls);
}

/**
 * Convenience: notify hub/listing pages (programmatic SEO).
 */
function notifyHubs(slugs) {
  const urls = (slugs || []).map(s => `${SITE_HOST}${s}`);
  return notifyIndexNow(urls);
}

module.exports = { notifyIndexNow, notifyGrant, notifyHubs, INDEXNOW_KEY };
