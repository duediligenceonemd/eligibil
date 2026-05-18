'use strict';

const https = require('https');

const BASE_URL = process.env.PROD_BASE_URL || 'https://eligibil.org';

const ENDPOINTS = [
  '/',
  '/search',
  '/resurse',
  '/en/resources',
  '/api/health',
  '/api/resources/overview',
  '/sitemap.xml',
  '/llms.txt',
];

function fetchUrl(pathname) {
  const url = new URL(pathname, BASE_URL);

  return new Promise((resolve, reject) => {
    const req = https.request(url, { method: 'GET', timeout: 15000 }, (res) => {
      let body = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => resolve({
        url: url.toString(),
        status: res.statusCode || 0,
        body,
        headers: res.headers,
      }));
    });

    req.on('timeout', () => {
      req.destroy(new Error(`Timeout for ${url}`));
    });
    req.on('error', reject);
    req.end();
  });
}

function parseJsonSafe(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

async function main() {
  const failures = [];
  const results = [];

  for (const pathname of ENDPOINTS) {
    try {
      const response = await fetchUrl(pathname);
      results.push(response);
      if (response.status < 200 || response.status >= 400) {
        failures.push(`${pathname} -> HTTP ${response.status}`);
      }
    } catch (error) {
      failures.push(`${pathname} -> ${error.message}`);
    }
  }

  console.log(`Production verification for ${BASE_URL}`);
  console.log('');

  for (const result of results) {
    console.log(`${result.url} -> ${result.status}`);
  }

  const health = results.find((item) => item.url === new URL('/api/health', BASE_URL).toString());
  if (health) {
    const parsed = parseJsonSafe(health.body);
    if (parsed) {
      console.log('');
      console.log('Health summary:');
      console.log(`- status: ${parsed.status}`);
      console.log(`- supabase: ${parsed.services?.supabase?.ok === true ? 'ok' : 'not ok'}`);
      console.log(`- analytics: ${parsed.services?.analytics?.ok === true ? 'ok' : 'not configured'}`);
      console.log(`- sentry: ${parsed.services?.sentry?.ok === true ? 'ok' : 'not configured'}`);
    }
  }

  const resources = results.find((item) => item.url === new URL('/api/resources/overview', BASE_URL).toString());
  if (resources) {
    const parsed = parseJsonSafe(resources.body);
    if (parsed && typeof parsed.total === 'number') {
      console.log('');
      console.log('Resources summary:');
      console.log(`- total: ${parsed.total}`);
      console.log(`- with website: ${parsed.rows_with_website}`);
      console.log(`- grant-like: ${parsed.grant_like_rows}`);
    }
  }

  if (failures.length) {
    console.error('');
    console.error('Failures:');
    for (const failure of failures) {
      console.error(`- ${failure}`);
    }
    process.exit(1);
  }

  console.log('');
  console.log('Production verification passed.');
}

main().catch((error) => {
  console.error(`verify-production failed: ${error.message}`);
  process.exit(1);
});
