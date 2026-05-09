'use strict';

/**
 * push-schema.js
 *
 * Conectează direct la baza de date Supabase via PostgreSQL și rulează schema.
 *
 * Usage:
 *   node scripts/push-schema.js --password PAROLA_TA
 *   node scripts/push-schema.js --url "postgresql://postgres:PAROLA@db.xxx.supabase.co:5432/postgres"
 *
 * Parola se găsește în: Supabase Dashboard → Settings → Database → Database password
 */

require('dotenv').config();

const fs   = require('fs');
const path = require('path');
const { Client } = require('pg');

const SCHEMA_FILE = path.join(__dirname, 'supabase-schema.sql');

async function main() {
  // Parse --password or --url flags
  const args = process.argv.slice(2);
  const pwIdx = args.indexOf('--password');
  const urlIdx = args.indexOf('--url');

  let connectionString;

  if (urlIdx !== -1 && args[urlIdx + 1]) {
    connectionString = args[urlIdx + 1];
  } else {
    // Build from env + password flag
    const password = (pwIdx !== -1 && args[pwIdx + 1])
      ? args[pwIdx + 1]
      : process.env.DB_PASSWORD;

    if (!password) {
      console.error('❌ Parola bazei de date lipsă!');
      console.error('');
      console.error('Opțiuni:');
      console.error('  1. node scripts/push-schema.js --password PAROLA_TA');
      console.error('  2. Adaugă DB_PASSWORD=PAROLA_TA în .env și rulează din nou');
      console.error('  3. node scripts/push-schema.js --url "postgresql://postgres:PAROLA@db.wkajytbxbjbpeuqolkwh.supabase.co:5432/postgres"');
      console.error('');
      console.error('Parola: Supabase Dashboard → Settings → Database → Database password');
      process.exit(1);
    }

    connectionString = `postgresql://postgres:${encodeURIComponent(password)}@db.wkajytbxbjbpeuqolkwh.supabase.co:5432/postgres`;
  }

  console.log('╔══════════════════════════════════════════╗');
  console.log('║   eligibil.org — Schema Push              ║');
  console.log('╚══════════════════════════════════════════╝');
  console.log(`Fișier schema: ${SCHEMA_FILE}`);
  console.log(`Host: db.wkajytbxbjbpeuqolkwh.supabase.co`);
  console.log();

  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },  // Supabase requires SSL
  });

  try {
    console.log('1. Conectare la Supabase PostgreSQL...');
    await client.connect();
    console.log('   ✓ Conectat');
    console.log();

    console.log('2. Citesc schema SQL...');
    const sql = fs.readFileSync(SCHEMA_FILE, 'utf8');
    console.log(`   ✓ ${sql.split('\n').length} linii SQL`);
    console.log();

    console.log('3. Execut schema (poate dura 10-30 secunde)...');
    await client.query(sql);
    console.log('   ✓ Schema aplicată cu succes');
    console.log();

    // Verify
    console.log('4. Verificare...');
    const res = await client.query(`
      SELECT
        (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'grants' AND table_schema = 'public') AS table_exists,
        (SELECT COUNT(*) FROM grants) AS row_count
    `);
    const { table_exists, row_count } = res.rows[0];
    console.log(`   Tabel grants: ${table_exists === '1' ? '✓ există' : '✗ lipsă'}`);
    console.log(`   Rânduri existente: ${row_count}`);
    console.log();

    console.log('══════════════════════════════════════════');
    console.log('✓ Schema Supabase configurată cu succes!');
    console.log('');
    console.log('Pasul următor: importă granturile din Excel:');
    console.log('  node scripts/seed-grants.js');
    console.log('══════════════════════════════════════════');

  } catch (err) {
    console.error(`\n❌ Eroare: ${err.message}`);
    if (err.message.includes('password authentication failed')) {
      console.error('   → Parola este greșită. Verifică în Supabase Dashboard → Settings → Database');
    } else if (err.message.includes('ECONNREFUSED') || err.message.includes('getaddrinfo')) {
      console.error('   → Nu pot conecta la Supabase. Verifică SUPABASE_URL.');
    }
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
