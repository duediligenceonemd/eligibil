'use strict';

/**
 * gmail-poller.js
 *
 * Connects to Gmail via IMAP, fetches unseen messages from the configured
 * label (default: "grants-new"), pipes each one through the grant processor,
 * and marks them as processed.
 *
 * SETUP (one-time):
 *   1. Generate Gmail App Password: https://myaccount.google.com/apppasswords
 *   2. Add to .env:
 *        GMAIL_USER=tu@gmail.com
 *        GMAIL_APP_PASSWORD=xxxx-xxxx-xxxx-xxxx
 *        GMAIL_LABEL=grants-new
 *   3. In Gmail: create label "grants-new" + filter rules for funding emails
 *
 * Usage:
 *   node scripts/gmail-poller.js              # process unseen messages
 *   node scripts/gmail-poller.js --dry-run    # don't mark seen
 *   node scripts/gmail-poller.js --since 7d   # last 7 days only
 */

require('dotenv').config();

const { ImapFlow }    = require('imapflow');
const { simpleParser } = require('mailparser');

const { processInput } = require('./process-grants-inbox');

const GMAIL_HOST  = 'imap.gmail.com';
const GMAIL_PORT  = 993;
const LABEL       = process.env.GMAIL_LABEL || 'grants-new';
const PROCESSED   = process.env.GMAIL_PROCESSED_LABEL || 'grants-processed';

function parseSinceArg() {
  const idx = process.argv.indexOf('--since');
  if (idx === -1) return null;
  const val = process.argv[idx + 1] || '7d';
  const m = val.match(/^(\d+)([dh])$/);
  if (!m) return null;
  const n = parseInt(m[1], 10);
  const ms = m[2] === 'd' ? n * 86400_000 : n * 3600_000;
  return new Date(Date.now() - ms);
}

async function pollGmail(opts = {}) {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;

  if (!user || !pass) {
    console.log('⏭  Gmail skipped: GMAIL_USER / GMAIL_APP_PASSWORD not set');
    return { skipped: true, reason: 'no-credentials' };
  }

  const dryRun = opts.dryRun || process.argv.includes('--dry-run');
  const since = opts.since || parseSinceArg();

  console.log(`📬 Gmail: connecting as ${user}...`);

  const client = new ImapFlow({
    host: GMAIL_HOST,
    port: GMAIL_PORT,
    secure: true,
    auth: { user, pass },
    logger: false,
  });

  await client.connect();
  console.log('   ✓ Connected');

  let stats = { processed: 0, skipped: 0, failed: 0 };

  try {
    // Gmail labels are exposed as IMAP folders
    const lock = await client.getMailboxLock(LABEL).catch(err => {
      console.error(`   ❌ Cannot open label "${LABEL}". Available folders:`);
      return null;
    });

    if (!lock) {
      const list = await client.list();
      console.error('     ' + list.map(f => f.path).join('\n     '));
      await client.logout();
      return { failed: true, reason: `Label "${LABEL}" not found` };
    }

    try {
      // Build search criteria: UNSEEN, optionally with date filter
      const search = { seen: false };
      if (since) search.since = since;

      const uids = await client.search(search, { uid: true });
      console.log(`   📥 ${uids.length} unseen message(s) to process`);

      if (uids.length === 0) {
        return stats;
      }

      for (const uid of uids) {
        try {
          // Fetch full message source
          const msg = await client.fetchOne(uid, { source: true, envelope: true }, { uid: true });
          const parsed = await simpleParser(msg.source);

          const subject = parsed.subject || '(no subject)';
          const body = (parsed.text || parsed.html || '').trim();

          if (!body || body.length < 50) {
            console.log(`   ⏭  [${uid}] Empty: ${subject}`);
            stats.skipped++;
            continue;
          }

          console.log(`\n   ─── [${uid}] ${subject.slice(0, 60)} ───`);

          const result = await processInput({
            body,
            subject,
            label: `gmail:${uid}`,
            sourceType: 'email',
            sourceId: parsed.messageId || `gmail-${uid}`,
          }, { dryRun });

          if (result.ok) stats.processed++;
          else if (result.skipped) stats.skipped++;
          else stats.failed++;

          // Mark message as seen + processed (Gmail label)
          if (!dryRun) {
            await client.messageFlagsAdd(uid, ['\\Seen'], { uid: true });
            // Apply Gmail-specific label via IMAP move/copy
            // Gmail's IMAP exposes labels as folders; we copy to "processed" label
            try {
              await client.messageMove(uid, PROCESSED, { uid: true });
            } catch (_) {
              // If processed label doesn't exist, just leave it seen
            }
          }
        } catch (err) {
          console.error(`   ❌ [${uid}] Error: ${err.message}`);
          stats.failed++;
        }
      }
    } finally {
      lock.release();
    }
  } finally {
    await client.logout().catch(() => {});
  }

  console.log(`\n   ✓ Gmail done: ${stats.processed} processed · ${stats.skipped} skipped · ${stats.failed} failed`);
  return stats;
}

async function main() {
  console.log('╔══════════════════════════════════════════╗');
  console.log('║       eligibil.org — Gmail IMAP Poller    ║');
  console.log('╚══════════════════════════════════════════╝');
  try {
    const stats = await pollGmail();
    if (stats.skipped) console.log('Skipped:', stats.reason);
  } catch (err) {
    console.error('FATAL:', err.message);
    process.exit(1);
  }
}

if (require.main === module) main();

module.exports = { pollGmail };
