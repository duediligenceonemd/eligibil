#!/usr/bin/env node
'use strict';

/**
 * scripts/migrate-embeddings.js
 *
 * Migrates grant embeddings from OpenAI text-embedding-3-small (1536-dim)
 * to AWS Bedrock Titan Embed Text V2 (1024-dim).
 *
 * IMPORTANT: Before running, update the Supabase vector column dimension:
 *   ALTER TABLE grants ALTER COLUMN embedding TYPE vector(1024)
 *     USING embedding::text::vector(1024);
 * (Truncates existing embeddings — re-generation overwrites them anyway.)
 *
 * Usage:
 *   node scripts/migrate-embeddings.js --dry-run      # count only, no writes
 *   node scripts/migrate-embeddings.js --limit=10     # first 10 grants
 *   node scripts/migrate-embeddings.js                # all active grants
 *   node scripts/migrate-embeddings.js --force        # re-embed even if already embedded
 *
 * Prerequisites:
 *   AWS_ACCESS_KEY_ID + AWS_SECRET_ACCESS_KEY + AWS_REGION in .env
 *   AWS_BEDROCK_EMBEDDINGS=1 in .env (enables Titan in the API layer too)
 *   Bedrock model access: amazon.titan-embed-text-v2:0 in us-east-1
 */

require('dotenv').config();

const { getSupabase } = require('../db/supabase');
const { bedrockEmbed, isBedrockEnabled } = require('../lib/bedrock');

// ── CLI args ─────────────────────────────────────────────────────────────────
const argv = process.argv.slice(2);
const DRY_RUN = argv.includes('--dry-run');
const FORCE   = argv.includes('--force');
const LIMIT   = parseInt((argv.find(a => a.startsWith('--limit=')) || '').replace('--limit=', '') || '9999', 10);

// ── Build embed text (same logic as seed-grants.js) ──────────────────────────
function buildEmbedText(g) {
  return [
    g.nume_program      ? `Program: ${g.nume_program}` : null,
    g.organizatie       ? `Organizatie: ${g.organizatie}` : null,
    g.tip               ? `Tip: ${g.tip}` : null,
    g.tara              ? `Tara: ${g.tara}` : null,
    g.stadiu            ? `Stadiu eligibil: ${g.stadiu}` : null,
    g.sector            ? `Sector: ${g.sector}` : null,
    g.suma_min != null && g.suma_max != null
      ? `Finantare: ${g.suma_min}–${g.suma_max} EUR` : null,
    g.cerinte           ? `Cerinte: ${String(g.cerinte).slice(0, 600)}` : null,
    g.descriere         ? `Descriere: ${String(g.descriere).slice(0, 600)}` : null,
    g.short_summary_ro  ? `Sumar: ${String(g.short_summary_ro).slice(0, 300)}` : null,
    g.tags && Array.isArray(g.tags) ? `Tags: ${g.tags.join(', ')}` : null,
  ]
    .filter(l => l && !l.includes('null') && !l.includes('undefined'))
    .join('. ');
}

async function main() {
  console.log('eligibil — Bedrock Titan Embed migration');
  console.log(`Mode:  ${DRY_RUN ? 'DRY RUN' : 'LIVE'}`);
  console.log(`Force: ${FORCE ? 'yes (re-embed all)' : 'no (skip already embedded)'}`);
  console.log(`Limit: ${LIMIT}`);
  console.log('');

  // ── Pre-flight checks ───────────────────────────────────────────────────────
  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    console.error('✗ AWS credentials not set. Add AWS_ACCESS_KEY_ID + AWS_SECRET_ACCESS_KEY to .env');
    process.exit(1);
  }

  // Force-enable Bedrock embeddings for this script regardless of env flag
  process.env.AWS_BEDROCK_EMBEDDINGS = '1';

  if (!isBedrockEnabled('embeddings')) {
    console.error('✗ Bedrock embeddings not enabled after force-set. Check lib/bedrock.js');
    process.exit(1);
  }

  const sb = getSupabase();
  if (!sb) {
    console.error('✗ Supabase not configured');
    process.exit(1);
  }

  // ── Fetch grants ─────────────────────────────────────────────────────────────
  let q = sb
    .from('grants')
    .select('id, nume_program, organizatie, tip, tara, stadiu, sector, suma_min, suma_max, cerinte, descriere, short_summary_ro, tags, embedding')
    .eq('status', 'Activ')
    .limit(LIMIT);

  if (!FORCE) {
    q = q.is('embedding', null);
  }

  const { data: grants, error } = await q;
  if (error) {
    console.error('✗ Failed to load grants:', error.message);
    process.exit(1);
  }

  const total = grants?.length || 0;
  console.log(`Found ${total} grant(s) to embed.`);
  if (total === 0) {
    console.log('Nothing to do. Use --force to re-embed existing embeddings.');
    return;
  }
  console.log('');

  let success = 0, failed = 0;

  for (const g of grants) {
    const label = `[${g.id}] ${(g.nume_program || '').slice(0, 50)}`;
    process.stdout.write(`${label} ... `);

    if (DRY_RUN) {
      const txt = buildEmbedText(g);
      console.log(`skip (dry-run) — text ${txt.length} chars`);
      continue;
    }

    try {
      const text = buildEmbedText(g);
      if (!text.trim()) {
        console.log('skip (empty text)');
        continue;
      }

      const embedding = await bedrockEmbed(text);
      if (!embedding || !Array.isArray(embedding)) {
        console.log('✗ null embedding returned');
        failed++;
        continue;
      }

      const { error: upErr } = await sb
        .from('grants')
        .update({ embedding })
        .eq('id', g.id);

      if (upErr) {
        console.log(`✗ DB update failed: ${upErr.message}`);
        failed++;
        continue;
      }

      success++;
      console.log(`✓ ${embedding.length}d`);

    } catch (err) {
      console.log(`✗ ${err.message}`);
      failed++;
    }

    // Titan rate limit: ~20 req/s — conservative 60ms gap
    await new Promise(r => setTimeout(r, 60));
  }

  console.log('');
  console.log('─────────────────────────────────────────────');
  console.log(`Success: ${success} / ${total}`);
  console.log(`Failed:  ${failed}`);
  if (success > 0) {
    console.log('');
    console.log('✓ Done. Set AWS_BEDROCK_EMBEDDINGS=1 in .env to use Titan for new searches.');
    console.log('  Run node scripts/migrate-embeddings.js --dry-run to preview remaining grants.');
  }
  console.log('─────────────────────────────────────────────');
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
