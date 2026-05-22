'use strict';
require('dotenv').config();

// Brief 01 Pas 6 — backfills the Pas 1 enriched fields (nume_program_en,
// short_summary_ro/en, eligibility_rules, documents_required,
// evaluation_criteria, tags) on existing grants by asking Claude to extract
// them from cerinte/descriere/etc.
//
// Uses raw fetch against the Anthropic Messages API (matching the existing
// scripts/grant-extractor.js pattern) so no new dependency is needed.
// Prompt caching is enabled on the system prompt — significant savings
// across the ~70-grant batch since the schema instructions are identical
// every call.
//
// CLI:
//   node scripts/enrich-grants-claude.js --dry-run        // no API, no writes
//   node scripts/enrich-grants-claude.js --limit=10        // first 10 unenriched
//   node scripts/enrich-grants-claude.js --id=EU012        // one grant
//   node scripts/enrich-grants-claude.js --force --limit=5 // re-enrich (skip nullable filter)
//
// IMPORTANT: this script costs real money. Default limit is 10 (≈$2 with
// claude-opus-4-7) so a typo won't burn the whole catalog. Run with --dry-run
// first to confirm what would be processed.
//
// Pre-flight requirements:
//   - ANTHROPIC_API_KEY set in .env
//   - Supabase configured (SUPABASE_URL + SUPABASE_SERVICE_KEY)
//   - Pas 1 schema migration applied (eligibility_rules column must exist)

const { getSupabase } = require('../db/supabase');

// ─── CLI args ────────────────────────────────────────────────────────────────
const argv = process.argv.slice(2);
function flag(name)   { return argv.includes('--' + name); }
function arg(name, dflt) {
  const found = argv.find(a => a.startsWith('--' + name + '='));
  return found ? found.slice(name.length + 3) : dflt;
}

const DRY_RUN = flag('dry-run');
const FORCE   = flag('force');
const LIMIT   = parseInt(arg('limit', '10'), 10);
const ONLY_ID = arg('id', null);

// ─── Config ──────────────────────────────────────────────────────────────────
const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';
// Default to Opus for one-shot extraction quality; user can override to Sonnet
// for ~5× cheaper if quality is acceptable.
const MODEL   = process.env.ANTHROPIC_MODEL || 'claude-opus-4-7';
const API_KEY = process.env.ANTHROPIC_API_KEY;
const BEDROCK_MODEL = process.env.AWS_CHAT_MODEL || 'anthropic.claude-sonnet-4-5-20250929-v1:0';

const { isBedrockEnabled, bedrockChat } = require('../lib/bedrock');

// USD per million tokens. Adjust if Anthropic publishes new prices.
const PRICING = {
  'claude-opus-4-7':            { in: 15,   out: 75 },
  'claude-sonnet-4-6':          { in: 3,    out: 15 },
  'claude-haiku-4-5-20251001':  { in: 0.8,  out: 4 },
};

// ─── Prompt ──────────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `Ești un analist de granturi care îmbogățește metadatele unui program de finanțare. Returnezi DOAR un obiect JSON valid, fără markdown, fără preamble, fără text suplimentar.

Schema output (toate câmpurile obligatorii):
{
  "nume_program_en": string,
  "short_summary_ro": string,
  "short_summary_en": string,
  "eligibility_rules": [
    {"type": "country|stage|sector|trl_min|team_size_min|cofinancing_pct|company_age_max_months|consortium",
     "value": any,
     "required": boolean}
  ],
  "documents_required": [
    {"name": string, "required": boolean, "format": "pdf|xlsx|docx|url"}
  ],
  "evaluation_criteria": [
    {"name": string, "weight": number, "description": string}
  ],
  "tags": [string, ...]
}

Reguli stricte:
- nume_program_en: traducere oficială sau echivalent profesional al numelui programului
- short_summary_ro și short_summary_en: factual, fără hype, sub 160 caractere fiecare
- eligibility_rules: 4-8 reguli concrete (țară, stadiu, TRL, etc.)
- documents_required: 3-6 documente standard (pitch deck, business plan, etc.)
- evaluation_criteria: 3-6 criterii cu pondere care însumează 100
- tags: 4-8 keywords relevante pentru SEO și filtrare
- Nu inventa date care nu sunt sugerate de inputul primit; pentru câmpuri necunoscute folosește valori conservative bazate pe tipul de program
- Răspunsul TREBUIE să fie un singur obiect JSON, parsabil cu JSON.parse direct`;

function buildUserMessage(grant) {
  // Trim to relevant fields — embedding/fts/large columns excluded.
  const lean = {
    id: grant.id,
    nume_program: grant.nume_program,
    organizatie: grant.organizatie,
    funder_name: grant.funder_name,
    tara: grant.tara,
    funder_country: grant.funder_country,
    tip: grant.tip,
    suma_min: grant.suma_min,
    suma_max: grant.suma_max,
    stadiu: grant.stadiu,
    sector: grant.sector,
    deadline: grant.deadline,
    cerinte: grant.cerinte,
    descriere: grant.descriere,
    website: grant.website,
    source_url: grant.source_url,
  };
  return `Analizează acest grant și returnează JSON conform schemei:\n\n` +
         JSON.stringify(lean, null, 2);
}

// ─── AI call: Bedrock → Anthropic API fallback ──────────────────────────────
async function callClaude(grant) {
  const userMessage = buildUserMessage(grant);

  // 1. Try AWS Bedrock
  if (isBedrockEnabled('chat')) {
    try {
      const result = await bedrockChat({
        model: BEDROCK_MODEL,
        maxTokens: 2000,
        system: SYSTEM_PROMPT,
        userMessage,
      });
      const text = result.text;
      if (!text) throw new Error('No text in Bedrock response');
      const clean = text.trim().replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '');
      return { parsed: JSON.parse(clean), usage: result.usage, via: 'bedrock' };
    } catch (err) {
      console.error('  Bedrock error, falling back to Anthropic:', err.message);
    }
  }

  // 2. Fallback to Anthropic direct API
  if (!API_KEY) throw new Error('No AI provider available (set AWS or ANTHROPIC keys)');

  const body = {
    model: MODEL,
    max_tokens: 2000,
    system: [
      { type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } },
    ],
    messages: [{ role: 'user', content: userMessage }],
  };

  const r = await fetch(CLAUDE_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type':      'application/json',
      'x-api-key':         API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify(body),
  });

  if (!r.ok) {
    const errText = await r.text().catch(() => '');
    throw new Error(`Anthropic API ${r.status}: ${errText.slice(0, 300)}`);
  }

  const data = await r.json();
  const text = data.content?.[0]?.text;
  if (!text) throw new Error('No text in Claude response');

  const clean = text.trim().replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '');
  return { parsed: JSON.parse(clean), usage: data.usage || {}, via: 'anthropic' };
}

function validateEnriched(e) {
  const errors = [];
  if (typeof e.nume_program_en !== 'string' || !e.nume_program_en.trim())
    errors.push('nume_program_en missing/empty');
  if (typeof e.short_summary_ro !== 'string' || e.short_summary_ro.length > 220)
    errors.push('short_summary_ro missing or > 220 chars');
  if (typeof e.short_summary_en !== 'string' || e.short_summary_en.length > 220)
    errors.push('short_summary_en missing or > 220 chars');
  if (!Array.isArray(e.eligibility_rules) || e.eligibility_rules.length === 0)
    errors.push('eligibility_rules missing/empty');
  if (!Array.isArray(e.documents_required) || e.documents_required.length === 0)
    errors.push('documents_required missing/empty');
  if (!Array.isArray(e.evaluation_criteria) || e.evaluation_criteria.length === 0)
    errors.push('evaluation_criteria missing/empty');
  if (!Array.isArray(e.tags) || e.tags.length === 0)
    errors.push('tags missing/empty');
  return errors;
}

// Cost estimate (USD). Accounts for cache read/write multipliers.
function estimateCost(usage) {
  const p = PRICING[MODEL] || PRICING['claude-opus-4-7'];
  const inputTok =
    (usage.input_tokens                 || 0) +
    (usage.cache_creation_input_tokens  || 0) * 1.25 +
    (usage.cache_read_input_tokens      || 0) * 0.1;
  const outputTok = usage.output_tokens || 0;
  return (inputTok * p.in + outputTok * p.out) / 1_000_000;
}

// ─── Main ────────────────────────────────────────────────────────────────────
(async () => {
  // Preflight
  if (!API_KEY && !DRY_RUN) {
    console.error('✗ ANTHROPIC_API_KEY not set in .env. Use --dry-run to preview without API calls.');
    process.exit(1);
  }
  if (!Number.isFinite(LIMIT) || LIMIT <= 0 || LIMIT > 200) {
    console.error('✗ --limit must be 1..200');
    process.exit(1);
  }

  console.log('eligibil — Pas 6 grant enrichment');
  console.log('Model:  ' + MODEL + (process.env.ANTHROPIC_MODEL ? ' (from .env)' : ' (default)'));
  console.log('Mode:   ' + (DRY_RUN ? 'DRY RUN — no API calls, no DB writes' : 'LIVE — real API calls cost money'));
  console.log('Limit:  ' + LIMIT + (ONLY_ID ? ' (or single id=' + ONLY_ID + ')' : ''));
  console.log('Filter: ' + (FORCE ? 'all active grants (--force)' : 'grants where eligibility_rules IS NULL'));
  console.log('');

  let sb;
  try { sb = getSupabase(); }
  catch (e) {
    console.error('✗ Supabase not configured:', e.message);
    process.exit(1);
  }

  let q = sb.from('grants').select('*').eq('status', 'Activ');
  if (ONLY_ID) {
    q = q.eq('id', ONLY_ID);
  } else if (!FORCE) {
    q = q.is('eligibility_rules', null);
  }
  q = q.limit(LIMIT);

  const { data: grants, error } = await q;
  if (error) {
    if (/column .* does not exist/i.test(error.message || '')) {
      console.error('✗ Pas 1 schema not applied. Run scripts/supabase-grants-enrich-schema.sql in Supabase SQL Editor first.');
      process.exit(1);
    }
    console.error('✗ Supabase query failed:', error.message);
    process.exit(1);
  }

  console.log('Selected ' + (grants?.length || 0) + ' grant(s).');
  if (!grants || grants.length === 0) {
    console.log('Nothing to do — exit clean.');
    return;
  }
  console.log('');

  let successes = 0, failures = 0, totalCost = 0;
  for (const g of grants) {
    const idLabel = '[' + g.id + '] ' + (g.nume_program || '(no name)').slice(0, 60);
    process.stdout.write(idLabel + ' ... ');

    if (DRY_RUN) {
      console.log('skipped (--dry-run)');
      continue;
    }

    try {
      const { parsed, usage } = await callClaude(g);
      const validationErrors = validateEnriched(parsed);
      if (validationErrors.length) {
        console.log('✗ schema invalid: ' + validationErrors.join('; '));
        failures++;
        continue;
      }

      const update = {
        nume_program_en:     parsed.nume_program_en,
        short_summary_ro:    parsed.short_summary_ro,
        short_summary_en:    parsed.short_summary_en,
        eligibility_rules:   parsed.eligibility_rules,
        documents_required:  parsed.documents_required,
        evaluation_criteria: parsed.evaluation_criteria,
        tags:                parsed.tags,
      };

      const { error: upErr } = await sb.from('grants').update(update).eq('id', g.id);
      if (upErr) {
        console.log('✗ DB update failed: ' + upErr.message);
        failures++;
        continue;
      }

      const cost = estimateCost(usage);
      totalCost += cost;
      successes++;
      console.log('✓ $' + cost.toFixed(4) +
                  ' (' + (usage.input_tokens || 0) + ' in / ' +
                         (usage.output_tokens || 0) + ' out)');
    } catch (err) {
      console.log('✗ ' + (err.message || 'unknown error'));
      failures++;
    }

    // Conservative rate-limit: ~50 req/min. Most tiers handle higher,
    // but better to under-shoot than hit a 429 mid-batch.
    await new Promise(r => setTimeout(r, 1200));
  }

  console.log('');
  console.log('────────────────────────────────────────────');
  console.log('Successes: ' + successes);
  console.log('Failures:  ' + failures);
  console.log('Est. cost: $' + totalCost.toFixed(2) + ' (model ' + MODEL + ')');
  console.log('────────────────────────────────────────────');
})().catch(e => {
  console.error('Fatal:', e);
  process.exit(1);
});
