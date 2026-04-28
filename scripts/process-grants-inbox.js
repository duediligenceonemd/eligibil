'use strict';

/**
 * process-grants-inbox.js
 *
 * Main processor: reads unprocessed inputs (emails, manual paste, scraped text),
 * extracts grants, deduplicates, writes to Supabase staging + Obsidian drafts.
 *
 * Sources supported:
 *   1. Folder of .eml/.txt files at INBOX_DIR (default: ./inbox)
 *   2. Stdin (single grant)
 *
 * Usage:
 *   node scripts/process-grants-inbox.js              # process inbox folder
 *   node scripts/process-grants-inbox.js --dry-run    # extract but don't write
 *   echo "..." | node scripts/process-grants-inbox.js --stdin
 *
 * Workflow:
 *   1. Read each input file
 *   2. Extract grant via grant-extractor.js
 *   3. Check fingerprint against grants + grants_staging (dedupe)
 *   4. INSERT into grants_staging
 *   5. Write Obsidian draft note
 *   6. Auto-approve if score ≥85 (configurable)
 *   7. Move processed input to inbox/processed/
 */

require('dotenv').config();

const fs   = require('fs');
const path = require('path');

const { getSupabase } = require('../db/supabase');
const { extract }    = require('./grant-extractor');
const obsidian       = require('../db/obsidian');

const INBOX_DIR     = process.env.GRANTS_INBOX || path.join(__dirname, '..', 'inbox');
const PROCESSED_DIR = path.join(INBOX_DIR, 'processed');
const FAILED_DIR    = path.join(INBOX_DIR, 'failed');
const AUTO_APPROVE_THRESHOLD = parseInt(process.env.AUTO_APPROVE_SCORE || '85', 10);

// =============================================================================
// Helpers
// =============================================================================
function ensureDirs() {
  for (const d of [INBOX_DIR, PROCESSED_DIR, FAILED_DIR]) {
    if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
  }
}

function readEmlContent(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  // Strip basic email headers if present (To:, From:, Subject:)
  const bodyStart = raw.search(/\n\n/);
  const subject = (raw.match(/^Subject:\s*(.+)$/im) || [, ''])[1];
  const body = bodyStart > 0 ? raw.slice(bodyStart + 2) : raw;
  return { subject, body };
}

// =============================================================================
// Process a single input
// =============================================================================
async function processInput(input, opts = {}) {
  const supabase = opts.dryRun ? null : getSupabase();

  console.log(`\n📨 Processing: ${input.label || 'stdin'}`);

  // 1. Extract
  const result = await extract(input.body);
  if (!result.ok) {
    console.log(`   ⏭  Skipped: ${result.reason}`);
    return { skipped: true, reason: result.reason };
  }

  const g = result.grant;
  console.log(`   ✓ Extracted: "${g.nume_program}" (${g.organizatie || '?'})`);
  console.log(`   📊 Score: ${result.relevance_score}/100 · Confidence: ${g._confidence}`);

  // 2. Dedupe check
  let updatesGrantId = null;
  if (supabase) {
    // Check grants table
    const { data: existing } = await supabase
      .from('grants')
      .select('id, nume_program')
      .or(`nume_program.ilike.%${g.nume_program?.slice(0, 30)}%`)
      .limit(1);

    if (existing?.length) {
      updatesGrantId = existing[0].id;
      console.log(`   🔄 Update detected: existing grant ${updatesGrantId}`);
    }

    // Check staging dedupe
    const { data: stagingDup } = await supabase
      .from('grants_staging')
      .select('id, status')
      .eq('fingerprint', result.fingerprint)
      .in('status', ['pending', 'pending_update'])
      .maybeSingle();

    if (stagingDup) {
      console.log(`   ⏭  Already in queue (${stagingDup.status})`);
      return { skipped: true, reason: 'duplicate-in-queue' };
    }
  }

  const stagingRow = {
    fingerprint:    result.fingerprint,
    nume_program:   g.nume_program,
    organizatie:    g.organizatie,
    tara:           g.tara,
    tip:            g.tip,
    dilutiv:        g.dilutiv,
    suma_min:       g.suma_min || null,
    suma_max:       g.suma_max || null,
    stadiu:         g.stadiu,
    sector:         g.sector,
    stadiu_arr:     g.stadiu_arr,
    sector_arr:     g.sector_arr,
    deadline:       g.deadline,
    luna:           g.luna || null,
    dificultate:    g.dificultate || null,
    zile_min:       g.zile_min || null,
    zile_max:       g.zile_max || null,
    cerinte:        g.cerinte,
    descriere:      g.descriere,
    website:        g.website,
    source_type:    input.sourceType || 'manual',
    source_id:      input.sourceId,
    source_subject: input.subject,
    source_snippet: input.body.slice(0, 500),
    source_url:     g.website,
    relevance_score: result.relevance_score,
    status:         updatesGrantId ? 'pending_update' : 'pending',
    updates_grant_id: updatesGrantId,
  };

  // 3. Write Obsidian draft
  const obsidianPath = obsidian.writeGrantNote({
    ...stagingRow,
    extracted_at: new Date().toISOString(),
  });
  stagingRow.obsidian_path = obsidianPath;
  console.log(`   📝 Obsidian: ${obsidianPath}`);

  // 4. Insert to Supabase
  if (!opts.dryRun && supabase) {
    const { data, error } = await supabase
      .from('grants_staging')
      .insert(stagingRow)
      .select('id')
      .single();
    if (error) {
      console.log(`   ❌ Supabase: ${error.message}`);
      return { failed: true, reason: error.message };
    }
    console.log(`   💾 Staged: ${data.id}`);

    // 5. Auto-approve if score is very high
    if (result.relevance_score >= AUTO_APPROVE_THRESHOLD && !updatesGrantId) {
      const { data: newId, error: approveErr } = await supabase
        .rpc('approve_grant_from_staging', {
          staging_id: data.id,
          reviewer: 'auto-approve',
        });
      if (approveErr) {
        console.log(`   ⚠ Auto-approve failed: ${approveErr.message}`);
      } else {
        console.log(`   🎯 AUTO-APPROVED → grants.${newId}`);
        // Move Obsidian note to published
        obsidian.moveNote(obsidianPath, 'published');
      }
    }
  }

  return { ok: true, score: result.relevance_score, fingerprint: result.fingerprint };
}

// =============================================================================
// Main
// =============================================================================
async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const useStdin = args.includes('--stdin');

  ensureDirs();
  obsidian.ensureVault();

  console.log('╔══════════════════════════════════════════╗');
  console.log('║   eligibil.eu — Grants Inbox Processor   ║');
  console.log('╚══════════════════════════════════════════╝');
  console.log(`Inbox:    ${INBOX_DIR}`);
  console.log(`Vault:    ${obsidian.VAULT_ROOT}`);
  console.log(`Mode:     ${dryRun ? 'DRY RUN' : 'LIVE'}`);
  console.log(`Auto-approve: score ≥ ${AUTO_APPROVE_THRESHOLD}`);

  let stats = { processed: 0, skipped: 0, failed: 0, autoApproved: 0 };

  if (useStdin) {
    const body = await new Promise(resolve => {
      let buf = '';
      process.stdin.on('data', c => buf += c);
      process.stdin.on('end', () => resolve(buf));
    });
    const result = await processInput({ body, label: 'stdin', sourceType: 'manual' }, { dryRun });
    if (result.ok) stats.processed++;
    else if (result.skipped) stats.skipped++;
    else stats.failed++;
  } else {
    // Folder mode
    const files = fs.readdirSync(INBOX_DIR).filter(f => /\.(eml|txt|md)$/i.test(f));
    if (!files.length) {
      console.log('\n📭 No files in inbox. Drop .eml/.txt/.md files into:');
      console.log(`   ${INBOX_DIR}\n`);
      return;
    }
    console.log(`\n📥 Found ${files.length} file(s) in inbox\n`);

    for (const file of files) {
      const filePath = path.join(INBOX_DIR, file);
      const { subject, body } = readEmlContent(filePath);

      try {
        const result = await processInput({
          body,
          subject,
          label: file,
          sourceType: 'email',
          sourceId: file,
        }, { dryRun });

        if (result.ok) {
          stats.processed++;
          if (result.score >= AUTO_APPROVE_THRESHOLD) stats.autoApproved++;
          if (!dryRun) fs.renameSync(filePath, path.join(PROCESSED_DIR, file));
        } else if (result.skipped) {
          stats.skipped++;
          if (!dryRun) fs.renameSync(filePath, path.join(PROCESSED_DIR, file));
        } else {
          stats.failed++;
          if (!dryRun) fs.renameSync(filePath, path.join(FAILED_DIR, file));
        }
      } catch (err) {
        console.error(`   ❌ Error processing ${file}: ${err.message}`);
        stats.failed++;
      }
    }
  }

  // Update Obsidian dashboard
  obsidian.writeIndex(obsidian.getStats());

  console.log('\n══════════════════════════════════════════');
  console.log(`✓ Done: ${stats.processed} processed (${stats.autoApproved} auto-approved), ${stats.skipped} skipped, ${stats.failed} failed`);
  console.log('══════════════════════════════════════════\n');
}

if (require.main === module) {
  main().catch(err => {
    console.error('FATAL:', err);
    process.exit(1);
  });
}

module.exports = { processInput };
