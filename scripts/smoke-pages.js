'use strict';

const { spawn } = require('node:child_process');
const path = require('node:path');
const { projectRoot } = require('./audit-utils');

const PORT = Number(process.env.SMOKE_PORT || 3100);
const BASE_URL = `http://127.0.0.1:${PORT}`;
const PAGES = [
  { path: '/', label: 'Home' },
  { path: '/en', label: 'Home EN' },
  { path: '/about', label: 'About' },
  { path: '/parteneri', label: 'Parteneri' },
  { path: '/startupuri', label: 'Startupuri' },
  { path: '/produse', label: 'Produse' },
];

function sleep(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function waitForServer(timeoutMs) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(`${BASE_URL}/`);
      if (response.ok) {
        return;
      }
    } catch {}
    await sleep(250);
  }

  throw new Error(`Server did not become ready within ${timeoutMs}ms`);
}

function smokeEnv() {
  return {
    ...process.env,
    NODE_ENV: process.env.NODE_ENV || 'test',
    PORT: String(PORT),
    SESSION_SECRET: process.env.SESSION_SECRET || 'smoke-test-session-secret-32-chars-min',
  };
}

async function fetchPage(page) {
  const response = await fetch(`${BASE_URL}${page.path}`);
  const contentType = response.headers.get('content-type') || '';
  const body = await response.text();

  if (!response.ok) {
    throw new Error(`${page.label} returned HTTP ${response.status}`);
  }

  if (!contentType.includes('text/html')) {
    throw new Error(`${page.label} did not return HTML`);
  }

  if (/Cannot GET|Internal Server Error/i.test(body)) {
    throw new Error(`${page.label} rendered an error document`);
  }

  const titleMatch = body.match(/<title>([^<]+)<\/title>/i);
  return {
    ...page,
    title: titleMatch ? titleMatch[1].trim() : 'Untitled',
  };
}

async function main() {
  const child = spawn(process.execPath, ['server.js'], {
    cwd: projectRoot,
    env: smokeEnv(),
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  let stdout = '';
  let stderr = '';
  child.stdout.on('data', (chunk) => {
    stdout += chunk.toString();
  });
  child.stderr.on('data', (chunk) => {
    stderr += chunk.toString();
  });

  try {
    await waitForServer(20_000);

    for (const page of PAGES) {
      const result = await fetchPage(page);
      console.log(`${result.label}: OK (${result.path}) — ${result.title}`);
    }
  } finally {
    child.kill();
  }

  if (stdout.trim()) {
    console.log('Server stdout during smoke test:');
    console.log(stdout.trim());
  }

  if (stderr.trim()) {
    console.log('Server stderr during smoke test:');
    console.log(stderr.trim());
  }
}

main().catch((error) => {
  console.error(`Smoke pages failed: ${error.message}`);
  process.exit(1);
});
