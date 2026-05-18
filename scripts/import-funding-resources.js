'use strict';

/**
 * import-funding-resources.js
 *
 * One-off / repeatable importer for the workbook:
 *   DB_Top Startup Grant resources.xlsx
 *
 * Usage:
 *   node scripts/import-funding-resources.js
 *   node scripts/import-funding-resources.js --dry-run
 *
 * Optional env:
 *   RESOURCE_EXCEL_PATH=C:\path\to\workbook.xlsx
 */

require('dotenv').config();

const path = require('node:path');
const crypto = require('node:crypto');
const XLSX = require('xlsx');
const { getSupabase } = require('../db/supabase');

const EXCEL_PATH = process.env.RESOURCE_EXCEL_PATH || path.join(
  process.env.USERPROFILE || process.env.HOME || '',
  'Downloads',
  'DB_Top Startup Grant resources.xlsx'
);

const UPSERT_BATCH = 100;

const SHEET_CONFIG = {
  US: { region_group: 'US', resource_type: 'grant_database', is_grant_like: true },
  EU: { region_group: 'EU', resource_type: 'grant_database', is_grant_like: true },
  Government: { region_group: 'Government', resource_type: 'government_program', is_grant_like: true },
  Capital: { region_group: 'Capital', resource_type: 'capital_resource', is_grant_like: true },
  'Funding Resourse': { region_group: 'Resources', resource_type: 'funding_resource', is_grant_like: false },
  'Free Technical': { region_group: 'Free Technical', resource_type: 'technical_resource', is_grant_like: false },
  Resoucrces: { region_group: 'Resources', resource_type: 'resource_directory', is_grant_like: false },
};

function normalizeHeader(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function detectHeaderRow(rows) {
  for (let index = 0; index < rows.length; index += 1) {
    const normalized = rows[index].map(normalizeHeader);
    const hasName = normalized.some((cell) => [
      'grant name',
      'program name',
      'fund program name',
      'program resource name',
      'competition name',
      'name',
      'title',
    ].includes(cell));
    const hasContext = normalized.some((cell) => [
      'description',
      'details',
      'notes',
      'eligibility',
      'country region',
      'funding type',
      'category',
      'type',
      'prize notes',
      'typical amount benefit',
      'application dates',
    ].includes(cell));
    if (hasName && hasContext) {
      return index;
    }
  }
  return -1;
}

function mapColumns(headerRow) {
  const columns = {};

  headerRow.forEach((raw, index) => {
    const cell = normalizeHeader(raw);
    if (cell === '#') columns.resource_index = index;
    else if ([
      'grant name',
      'program name',
      'fund program name',
      'program resource name',
      'competition name',
      'name',
      'title',
    ].includes(cell)) columns.title = index;
    else if ([
      'amount',
      'funding amount',
      'prize',
      'prize notes',
      'typical amount benefit',
    ].includes(cell)) columns.amount_raw = index;
    else if ([
      'category',
      'type',
      'country region',
      'funding type',
      'industry focus',
      'location',
    ].includes(cell)) columns.category = index;
    else if (cell === 'description' || cell === 'details') columns.description = index;
    else if (cell === 'website' || cell === 'url' || cell === 'link') columns.website = index;
    else if (cell === 'notes') columns.notes = index;
    else if (cell === 'eligibility') columns.eligibility = index;
    else if (cell === 'organizer') columns.organizer = index;
    else if (cell === 'entry deadline' || cell === 'application dates') columns.timeline = index;
    else if (cell === 'country region') columns.region = index;
  });

  return columns;
}

function isBlankRow(row) {
  return !row || row.every((cell) => {
    if (cell === null || cell === undefined) return true;
    return String(cell).trim() === '';
  });
}

function coerceText(value) {
  if (value === null || value === undefined) return null;
  const text = String(value).trim();
  return text ? text : null;
}

function compactParts(parts) {
  return parts
    .map(coerceText)
    .filter(Boolean)
    .join(' | ') || null;
}

function cleanWebsite(value) {
  const raw = coerceText(value);
  if (!raw) return null;

  const candidate = /^https?:\/\//i.test(raw) ? raw : (
    /^www\./i.test(raw) ? `https://${raw}` : raw
  );

  try {
    const url = new URL(candidate);
    if (!/^https?:$/i.test(url.protocol)) return null;
    return url.toString();
  } catch {
    return null;
  }
}

function readWorkbook() {
  let workbook;
  try {
    workbook = XLSX.readFile(EXCEL_PATH);
  } catch (error) {
    throw new Error(
      `Nu pot citi workbook-ul: ${error.message}\n` +
      `Verifică fișierul: ${EXCEL_PATH}`
    );
  }

  const sourceFile = path.basename(EXCEL_PATH);
  const importBatch = `resources-${new Date().toISOString()}-${crypto.randomUUID()}`;
  const rowsForInsert = [];
  const stats = [];

  for (const sheetName of workbook.SheetNames) {
    const config = SHEET_CONFIG[sheetName] || {
      region_group: sheetName,
      resource_type: 'resource',
      is_grant_like: false,
    };

    const worksheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: null });
    const headerRowIndex = detectHeaderRow(rows);

    if (headerRowIndex === -1) {
      stats.push({ sheetName, imported: 0, skipped: rows.length, reason: 'header-not-found' });
      continue;
    }

    const columns = mapColumns(rows[headerRowIndex]);
    let imported = 0;
    let skipped = 0;

    for (let index = headerRowIndex + 1; index < rows.length; index += 1) {
      const rawRow = rows[index];
      if (isBlankRow(rawRow)) {
        skipped += 1;
        continue;
      }

      const title = coerceText(rawRow[columns.title]);
      const description = compactParts([
        rawRow[columns.description],
        columns.notes !== undefined ? rawRow[columns.notes] : null,
        columns.eligibility !== undefined ? `Eligibility: ${rawRow[columns.eligibility]}` : null,
        columns.organizer !== undefined ? `Organizer: ${rawRow[columns.organizer]}` : null,
        columns.timeline !== undefined ? `Timeline: ${rawRow[columns.timeline]}` : null,
      ]);
      const website = cleanWebsite(rawRow[columns.website]);
      const category = compactParts([
        rawRow[columns.category],
        columns.region !== undefined ? rawRow[columns.region] : null,
      ]);
      const amountRaw = coerceText(rawRow[columns.amount_raw]);
      const resourceIndex = coerceText(rawRow[columns.resource_index]);

      if (!title) {
        skipped += 1;
        continue;
      }

      rowsForInsert.push({
        source_file: sourceFile,
        sheet_name: sheetName,
        row_number: index + 1,
        resource_index: resourceIndex,
        title,
        amount_raw: amountRaw,
        category,
        description,
        website,
        region_group: config.region_group,
        resource_type: config.resource_type,
        is_grant_like: config.is_grant_like,
        import_batch: importBatch,
      });
      imported += 1;
    }

    stats.push({ sheetName, imported, skipped, reason: 'ok' });
  }

  return { importBatch, sourceFile, rowsForInsert, stats };
}

async function upsertRows(rows) {
  const supabase = getSupabase();

  for (let index = 0; index < rows.length; index += UPSERT_BATCH) {
    const batch = rows.slice(index, index + UPSERT_BATCH);
    const { error } = await supabase
      .from('funding_resources')
      .upsert(batch, {
        onConflict: 'source_file,sheet_name,row_number',
      });

    if (error) {
      throw new Error(`Upsert funding_resources eșuat: ${error.message}`);
    }
  }
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const { importBatch, sourceFile, rowsForInsert, stats } = readWorkbook();

  console.log('╔══════════════════════════════════════════════╗');
  console.log('║   eligibil.org — Funding Resources Import   ║');
  console.log('╚══════════════════════════════════════════════╝');
  console.log(`Workbook : ${EXCEL_PATH}`);
  console.log(`Source   : ${sourceFile}`);
  console.log(`Dry run  : ${dryRun ? 'DA' : 'nu'}`);
  console.log(`Batch    : ${importBatch}`);
  console.log('');

  for (const sheet of stats) {
    console.log(
      `Sheet ${sheet.sheetName}: importate=${sheet.imported}, ` +
      `sărite=${sheet.skipped}, status=${sheet.reason}`
    );
  }

  console.log('');
  console.log(`Total rows pregătite: ${rowsForInsert.length}`);

  if (dryRun) {
    console.log('');
    rowsForInsert.slice(0, 10).forEach((row) => {
      console.log(`- [${row.sheet_name}] ${row.title} | ${row.website || 'fără website'}`);
    });
    console.log('\n[DRY RUN] Nu s-a scris nimic în Supabase.');
    return;
  }

  await upsertRows(rowsForInsert);
  console.log(`\n✓ ${rowsForInsert.length} resurse importate în funding_resources.`);
}

main().catch((error) => {
  console.error(`\n✗ ${error.message}`);
  process.exit(1);
});
