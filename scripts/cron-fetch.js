'use strict';

/**
 * cron-fetch.js
 *
 * Unified orchestrator that runs ALL grant sources in sequence:
 *   1. Folder inbox (existing files dropped manually)
 *   2. Gmail IMAP poller
 *   3. Web scrapers (EIC, Cordis, ODIMM, AIPA, etc.)
 *
 * All sources feed into the same processInput pipeline, which writes to:
 *   - Supabase grants_staging
 *   - Obsidian vault drafts/
 *
 * Run manually:
 *   npm run grants:fetch
 *
 * Schedule with Windows Task Scheduler (every 6h):
 *   schtasks /create /tn "eligibil-grants-fetch" \
 *     /tr "node C:\Users\Zinaida\ELIGIBIL\scripts\cron-fetch.js" \
 *     /sc hourly /mo 6
 *
 * Or with cron (Linux/macOS):
 *   0 */6 * * * cd /path/to/eligibil && node scripts/cron-fetch.js >> logs/cron.log 2>&1
 */

require('dotenv').config();

const fs   = require('fs');
const path = require('path');

const obsidian = require('../db/obsidian');

async function runInboxFolder() {
  // Run via child process to keep stdout clean
  const inboxDir = process.env.GRANTS_INBOX || path.join(__dirname, '..', 'inbox');
  const files = fs.existsSync(inboxDir)
    ? fs.readdirSync(inboxDir).filter(f => /\.(eml|txt|md)$/i.test(f))
    : [];

  if (files.length === 0) {
    console.log('📁 Inbox folder: empty\n');
    return { processed: 0 };
  }

  console.log(`📁 Inbox folder: ${files.length} file(s)`);

  // Spawn the inbox processor
  const { spawn } = require('child_process');
  return new Promise(resolve => {
    const proc = spawn(process.execPath, [path.join(__dirname, 'process-grants-inbox.js')], {
      stdio: 'inherit',
      cwd: path.dirname(__dirname),
    });
    proc.on('close', code => resolve({ processed: code === 0 ? files.length : 0 }));
  });
}

async function runGmail() {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    console.log('📬 Gmail: SKIPPED (no credentials in .env)\n');
    return { skipped: true };
  }
  try {
    const { pollGmail } = require('./gmail-poller');
    return await pollGmail();
  } catch (err) {
    console.error(`📬 Gmail FAILED: ${err.message}\n`);
    return { failed: true, reason: err.message };
  }
}

async function runScrapers() {
  try {
    const { runAll } = require('./web-scrapers');
    return await runAll();
  } catch (err) {
    console.error(`🌐 Scrapers FAILED: ${err.message}\n`);
    return { failed: true, reason: err.message };
  }
}

async function main() {
  const startTime = Date.now();

  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║       eligibil.org — Grants Fetch Orchestrator             ║');
  console.log(`║       ${new Date().toISOString().padEnd(50)}║`);
  console.log('╚═══════════════════════════════════════════════════════════╝\n');

  const results = {
    inbox:    await runInboxFolder(),
    gmail:    await runGmail(),
    scrapers: await runScrapers(),
  };

  // Update Obsidian dashboard
  try {
    obsidian.writeIndex(obsidian.getStats());
    console.log(`📊 Obsidian dashboard updated: ${obsidian.VAULT_ROOT}/_index.md`);
  } catch (err) {
    console.warn(`⚠ Obsidian update failed: ${err.message}`);
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

  console.log('\n╔═══════════════════════════════════════════════════════════╗');
  console.log('║                       SUMMARY                              ║');
  console.log('╠═══════════════════════════════════════════════════════════╣');
  console.log(`║  📁 Inbox:    ${String(results.inbox.processed || 0).padStart(3)} files processed                          ║`);
  console.log(`║  📬 Gmail:    ${String(results.gmail.processed || 0).padStart(3)} emails processed                         ║`);
  console.log(`║  🌐 Scrapers: ${String(results.scrapers.processed || 0).padStart(3)} items processed                          ║`);
  console.log(`║  ⏱  Time:     ${elapsed}s                                      ║`);
  console.log('╚═══════════════════════════════════════════════════════════╝');

  // Log to file (cron-friendly)
  const logsDir = path.join(__dirname, '..', 'logs');
  if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true });
  fs.appendFileSync(
    path.join(logsDir, 'cron-fetch.log'),
    `${new Date().toISOString()} | inbox=${results.inbox.processed || 0} gmail=${results.gmail.processed || 0} scrapers=${results.scrapers.processed || 0} ${elapsed}s\n`
  );
}

if (require.main === module) {
  main().catch(err => {
    console.error('FATAL:', err);
    process.exit(1);
  });
}

module.exports = { main };
