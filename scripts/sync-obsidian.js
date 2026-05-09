'use strict';

/**
 * sync-obsidian.js
 *
 * Bidirectional sync between Supabase grants and Obsidian vault.
 *
 *   Supabase → Obsidian:
 *     - Pull all grants from grants_staging (status=pending) → drafts/
 *     - Pull all grants from grants (status=Activ)           → published/
 *
 *   Obsidian → Supabase:
 *     - If a draft note was moved to ignored/ → mark staging row rejected
 *     - If a draft note was moved to published/ → call approve_grant_from_staging
 *
 * Usage:
 *   node scripts/sync-obsidian.js              # full sync (both ways)
 *   node scripts/sync-obsidian.js --pull       # Supabase → Obsidian only
 *   node scripts/sync-obsidian.js --push       # Obsidian → Supabase only
 */

require('dotenv').config();

const fs   = require('fs');
const path = require('path');
const { getSupabase } = require('../db/supabase');
const obsidian = require('../db/obsidian');

// =============================================================================
// PULL: Supabase → Obsidian
// =============================================================================
async function pull() {
  const supabase = getSupabase();
  obsidian.ensureVault();

  console.log('⬇ Pulling Supabase → Obsidian...');

  // Pending staging → drafts/
  const { data: staging, error: stagingErr } = await supabase
    .from('grants_staging')
    .select('*')
    .in('status', ['pending', 'pending_update'])
    .order('relevance_score', { ascending: false });

  if (stagingErr) {
    console.error('  ❌', stagingErr.message);
  } else {
    let count = 0;
    for (const row of staging || []) {
      obsidian.writeGrantNote(row, { folder: 'drafts' });
      count++;
    }
    console.log(`  ✓ Drafts: ${count} grants`);
  }

  // Active grants → published/
  const { data: active, error: activeErr } = await supabase
    .from('grants')
    .select('*')
    .eq('status', 'Activ')
    .order('updated_at', { ascending: false });

  if (activeErr) {
    console.error('  ❌', activeErr.message);
  } else {
    let count = 0;
    for (const row of active || []) {
      obsidian.writeGrantNote({ ...row, status: 'published' }, { folder: 'published' });
      count++;
    }
    console.log(`  ✓ Published: ${count} grants`);
  }

  // Update dashboard
  obsidian.writeIndex(obsidian.getStats());
  console.log(`  ✓ Dashboard updated: ${obsidian.VAULT_ROOT}/_index.md`);
}

// =============================================================================
// PUSH: Obsidian → Supabase
// =============================================================================
async function push() {
  const supabase = getSupabase();
  obsidian.ensureVault();

  console.log('⬆ Pushing Obsidian → Supabase...');

  // Files in published/ that came from drafts/ → approve their staging row
  const publishedDir = path.join(obsidian.VAULT_ROOT, 'published');
  const ignoredDir   = path.join(obsidian.VAULT_ROOT, 'ignored');

  let approved = 0, rejected = 0;

  // PUBLISHED — approve via RPC
  if (fs.existsSync(publishedDir)) {
    const files = fs.readdirSync(publishedDir).filter(f => f.endsWith('.md'));
    for (const file of files) {
      const fm = obsidian.parseNote(path.join('published', file));
      if (!fm?.fingerprint || fm.status === 'published') continue;

      // Find staging row by fingerprint
      const { data: staging } = await supabase
        .from('grants_staging')
        .select('id')
        .eq('fingerprint', fm.fingerprint)
        .in('status', ['pending', 'pending_update'])
        .maybeSingle();

      if (staging) {
        const { data: newId, error } = await supabase
          .rpc('approve_grant_from_staging', {
            staging_id: staging.id,
            reviewer: 'obsidian-sync',
          });
        if (!error) {
          console.log(`  ✓ Approved ${file} → grants.${newId}`);
          approved++;
        } else {
          console.log(`  ⚠ Failed to approve ${file}: ${error.message}`);
        }
      }
    }
  }

  // IGNORED — mark staging row as rejected
  if (fs.existsSync(ignoredDir)) {
    const files = fs.readdirSync(ignoredDir).filter(f => f.endsWith('.md'));
    for (const file of files) {
      const fm = obsidian.parseNote(path.join('ignored', file));
      if (!fm?.fingerprint) continue;

      const { error } = await supabase
        .from('grants_staging')
        .update({
          status: 'rejected',
          reject_reason: 'Manually moved to ignored/',
          reviewed_by: 'obsidian-sync',
          reviewed_at: new Date().toISOString(),
        })
        .eq('fingerprint', fm.fingerprint)
        .in('status', ['pending', 'pending_update']);

      if (!error) {
        console.log(`  ✓ Rejected ${file}`);
        rejected++;
      }
    }
  }

  console.log(`  ✓ Approved: ${approved} · Rejected: ${rejected}`);
}

// =============================================================================
// Main
// =============================================================================
async function main() {
  const args = process.argv.slice(2);
  const pullOnly = args.includes('--pull');
  const pushOnly = args.includes('--push');

  console.log('╔══════════════════════════════════════════╗');
  console.log('║  eligibil.org — Obsidian ↔ Supabase Sync ║');
  console.log('╚══════════════════════════════════════════╝');
  console.log(`Vault: ${obsidian.VAULT_ROOT}\n`);

  try {
    if (!pullOnly) await push();
    if (!pushOnly) await pull();
    console.log('\n✓ Sync complete\n');
  } catch (err) {
    console.error('\nFATAL:', err.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { pull, push };
