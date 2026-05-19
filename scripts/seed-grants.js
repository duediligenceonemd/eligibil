'use strict';

/**
 * seed-grants.js
 *
 * ETL: Excel grants database → OpenAI embeddings → Supabase pgvector
 *
 * Usage:
 *   node scripts/seed-grants.js                    # full seed with embeddings
 *   node scripts/seed-grants.js --dry-run          # parse only, no DB writes
 *   node scripts/seed-grants.js --skip-embeddings  # upsert without embeddings
 *
 * Prerequisites:
 *   1. Run scripts/supabase-schema.sql in Supabase SQL Editor
 *   2. Copy .env.example to .env and fill in SUPABASE_URL + SUPABASE_SERVICE_KEY
 *   3. Optionally set OPENAI_API_KEY for vector embeddings
 */

require('dotenv').config();

const path  = require('path');
const { getSupabase } = require('../db/supabase');
const { readWorkbookRows } = require('./excel-utils');

// ── Config ────────────────────────────────────────────────────────────────────

// Căutăm fișierul Excel în Downloads (sau override via env var EXCEL_PATH)
const EXCEL_PATH = process.env.EXCEL_PATH || path.join(
  process.env.USERPROFILE || process.env.HOME || '',
  'Downloads',
  'eligibil eu database master v1 (1).xlsx'
);

// Sheet indexes (0-based) care conțin date de granturi
// Sheet 0 = Dashboard (skip), sheets 1-6 = Moldova, Romania, EU+CEE, TechCredits, Accelerators, Angel+VC
const DATA_SHEET_INDEXES = [1, 2, 3, 4, 5, 6];

// Ordinea coloanelor în Excel (corespunde cu COL_NAMES din schema)
const COL_MAP = [
  'id', 'nume_program', 'organizatie', 'tara', 'tip', 'dilutiv',
  'suma_min', 'suma_max', 'stadiu', 'sector', 'deadline', 'luna',
  'dificultate', 'zile_min', 'zile_max', 'cerinte', 'descriere',
  'website', 'verificat', 'status',
];

const OPENAI_MODEL  = 'text-embedding-3-small';
const EMBED_BATCH   = 20;   // granturi per request OpenAI
const UPSERT_BATCH  = 50;   // rânduri per upsert Supabase

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Parsează "AI / SaaS / Deep Tech" → ['AI', 'SaaS', 'Deep Tech'] */
function parseSlash(raw) {
  if (!raw || String(raw).trim() === '' || String(raw).trim() === 'nan') return [];
  return [...new Set(
    String(raw).split('/').map(s => s.trim()).filter(Boolean)
  )];
}

/** Construiește textul care se trimite la OpenAI pentru embedding. */
function buildEmbedText(g) {
  return [
    `Program: ${g.nume_program}`,
    `Organizatie: ${g.organizatie}`,
    `Tip: ${g.tip}`,
    `Tara: ${g.tara}`,
    `Stadiu eligibil: ${g.stadiu}`,
    `Sector: ${g.sector}`,
    g.suma_min != null && g.suma_max != null
      ? `Finantare: ${g.suma_min}–${g.suma_max} EUR`
      : null,
    `Cerinte: ${g.cerinte}`,
    `Descriere: ${g.descriere}`,
  ]
    .filter(l => l && !l.includes('null') && !l.includes('undefined'))
    .join('. ');
}

// ── Parse Excel ───────────────────────────────────────────────────────────────

async function readExcelGrants() {
  console.log(`  Citesc: ${EXCEL_PATH}`);

  let workbook;
  try {
    workbook = await readWorkbookRows(EXCEL_PATH);
  } catch (err) {
    throw new Error(
      `Nu pot citi fișierul Excel: ${err.message}\n` +
      `Verifică că fișierul există la: ${EXCEL_PATH}\n` +
      `Sau setează variabila de mediu EXCEL_PATH cu calea corectă.`
    );
  }

  const grants = [];
  const seenIds = new Set();

  for (const sheetIdx of DATA_SHEET_INDEXES) {
    const sheetName = workbook.sheetNames[sheetIdx];
    if (!sheetName) {
      console.warn(`  [SKIP] Sheet index ${sheetIdx} nu există`);
      continue;
    }

    const rows = workbook.getRows(sheetName);

    // Găsim dinamic rândul header (unde prima celulă = 'ID')
    const headerIdx = rows.findIndex(r => String(r[0] ?? '').trim() === 'ID');
    if (headerIdx === -1) {
      console.warn(`  [SKIP] Sheet "${sheetName}" — nu am găsit header row cu 'ID'`);
      continue;
    }

    let count = 0;
    for (const raw of rows.slice(headerIdx + 1)) {
      const id = String(raw[0] ?? '').trim();

      // Acceptăm doar rânduri cu ID valid: litere mari + cifre (ex: MD001, EU012)
      if (!/^[A-Z]{2,}\d+$/.test(id)) continue;

      if (seenIds.has(id)) {
        console.warn(`  [DUP] ID duplicat ignorat: ${id}`);
        continue;
      }
      seenIds.add(id);

      // Mapăm coloanele la obiect
      const row = {};
      COL_MAP.forEach((name, i) => { row[name] = raw[i] ?? null; });

      const dilutivRaw = String(row.dilutiv ?? '').trim().toLowerCase();

      const grant = {
        id,
        nume_program: String(row.nume_program  ?? '').trim() || null,
        organizatie:  String(row.organizatie   ?? '').trim() || null,
        tara:         String(row.tara           ?? '').trim() || null,
        tip:          String(row.tip            ?? '').trim() || null,
        dilutiv:      dilutivRaw === 'da' || dilutivRaw === 'partial',
        suma_min:     row.suma_min  != null ? Math.round(Number(row.suma_min))  : null,
        suma_max:     row.suma_max  != null ? Math.round(Number(row.suma_max))  : null,
        stadiu:       String(row.stadiu  ?? '').trim() || null,
        sector:       String(row.sector  ?? '').trim() || null,
        stadiu_arr:   parseSlash(row.stadiu),
        sector_arr:   parseSlash(row.sector),
        deadline:     String(row.deadline ?? '').trim() || null,
        luna:         row.luna       != null ? Number(row.luna)       : null,
        // Schema check constraint: dificultate ∈ [1, 3]. Excel uses 1–5, so
        // 4–5 (very-hard / impossible-solo) collapse onto 3.
        dificultate:  row.dificultate != null
          ? Math.max(1, Math.min(3, Number(row.dificultate)))
          : null,
        zile_min:     row.zile_min  != null ? Number(row.zile_min)   : null,
        zile_max:     row.zile_max  != null ? Number(row.zile_max)   : null,
        cerinte:      String(row.cerinte   ?? '').trim() || null,
        descriere:    String(row.descriere ?? '').trim() || null,
        website:      String(row.website   ?? '').trim() || null,
        verificat:    row.verificat ? String(row.verificat).trim().slice(0, 10) : null,
        status:       String(row.status ?? 'Activ').trim() || 'Activ',
        embedding:    null,              // completat ulterior de generateEmbeddings()
        _embedText:   buildEmbedText(row), // câmp temporar, nu se trimite în DB
      };

      grants.push(grant);
      count++;
    }

    console.log(`  Sheet "${sheetName}": ${count} granturi`);
  }

  return grants;
}

// ── Generate Embeddings ───────────────────────────────────────────────────────

async function generateEmbeddings(grants) {
  const { OpenAI } = require('openai');
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const total  = grants.length;

  for (let i = 0; i < total; i += EMBED_BATCH) {
    const batch  = grants.slice(i, i + EMBED_BATCH);
    const inputs = batch.map(g => g._embedText);
    const end    = Math.min(i + EMBED_BATCH, total);

    process.stdout.write(`  Batch embeddings ${i + 1}–${end}/${total}... `);

    const response = await openai.embeddings.create({
      model: OPENAI_MODEL,
      input: inputs,
    });

    response.data.forEach((item, j) => {
      batch[j].embedding = item.embedding;
    });

    console.log('✓');
  }
}

// ── Upsert to Supabase ────────────────────────────────────────────────────────

async function upsertGrants(grants) {
  const supabase = getSupabase();

  // Eliminăm câmpul temporar _embedText înainte de upsert
  const rows = grants.map(g => {
    const row = { ...g };
    delete row._embedText;
    return row;
  });

  for (let i = 0; i < rows.length; i += UPSERT_BATCH) {
    const batch = rows.slice(i, i + UPSERT_BATCH);
    const end   = Math.min(i + UPSERT_BATCH, rows.length);

    process.stdout.write(`  Upsert ${i + 1}–${end}/${rows.length}... `);

    const { error } = await supabase
      .from('grants')
      .upsert(batch, { onConflict: 'id' });

    if (error) {
      console.error(`\n  [EROARE] Upsert eșuat la batch ${i + 1}: ${error.message}`);
      throw error;
    }

    console.log('✓');
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const dryRun         = process.argv.includes('--dry-run');
  const skipEmbeddings = process.argv.includes('--skip-embeddings');
  const hasOpenAI      = !!process.env.OPENAI_API_KEY;

  console.log('╔══════════════════════════════════════════╗');
  console.log('║   eligibil.org — Grant Seeder v1.0        ║');
  console.log('╚══════════════════════════════════════════╝');
  console.log(`Dry run    : ${dryRun ? 'DA (nu se scrie în DB)' : 'nu'}`);
  console.log(`Embeddings : ${(skipEmbeddings || !hasOpenAI) ? 'SKIP' + (!hasOpenAI ? ' (OPENAI_API_KEY lipsă)' : '') : 'da (' + OPENAI_MODEL + ')'}`);
  console.log(`Supabase   : ${process.env.SUPABASE_URL || '⚠ SUPABASE_URL lipsă!'}`);
  console.log();

  // ── 1. Parse Excel
  console.log('1. Citesc fișierul Excel...');
  const grants = await readExcelGrants();
  console.log(`   Total granturi parsate: ${grants.length}`);
  console.log();

  if (dryRun) {
    console.log('── DRY RUN — granturi parsate: ──────────────');
    grants.forEach(g => console.log(`  ${g.id.padEnd(8)} ${g.tara?.padEnd(10)} ${g.nume_program}`));
    console.log(`\n[DRY RUN] Nu s-a scris nimic în Supabase.`);
    return;
  }

  // ── 2. Generate embeddings
  if (!skipEmbeddings && hasOpenAI) {
    console.log(`2. Generez embeddings via OpenAI (${OPENAI_MODEL})...`);
    await generateEmbeddings(grants);
    console.log(`   Embeddings generate: ${grants.filter(g => g.embedding).length}/${grants.length}`);
  } else {
    console.log('2. [SKIP] Embeddings — granturi vor fi indexate prin full-text search.');
  }
  console.log();

  // ── 3. Upsert to Supabase
  console.log('3. Upsert în Supabase...');
  await upsertGrants(grants);
  console.log();

  console.log('══════════════════════════════════════════');
  console.log(`✓ ${grants.length} granturi importate cu succes în Supabase!`);
  if (!hasOpenAI) {
    console.log('  ℹ Pentru căutare vectorială, adaugă OPENAI_API_KEY în .env');
    console.log('    și rulează din nou: node scripts/seed-grants.js');
  }
  console.log('══════════════════════════════════════════');
}

main().catch(err => {
  console.error('\n❌ Eroare fatală:', err.message);
  if (err.message.includes('supabase-schema.sql')) {
    console.error('   → Rulează scripts/supabase-schema.sql în Supabase SQL Editor mai întâi.');
  }
  process.exit(1);
});
