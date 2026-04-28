'use strict';

/**
 * compute-user-stats.js
 *
 * Refreshes user_pool_stats aggregate table from user_profiles.
 * Call this:
 *   - After importing many profiles
 *   - On a daily cron job
 *   - Before rescoring all grants
 *
 * Also offers --rescore flag to immediately recompute relevance scores
 * for all pending staging grants using the new pool stats.
 *
 * Usage:
 *   node scripts/compute-user-stats.js               # refresh stats only
 *   node scripts/compute-user-stats.js --rescore     # also rescore staging
 *   node scripts/compute-user-stats.js --sync-json   # sync local JSON profiles → Supabase first
 */

require('dotenv').config();

const fs = require('fs');
const path = require('path');

const { getSupabase }       = require('../db/supabase');
const { syncProfile, refreshPoolStats } = require('../db/profile-sync');

async function syncFromJson() {
  const jsonPath = path.join(__dirname, '..', 'db', 'eligibil.json');
  if (!fs.existsSync(jsonPath)) {
    console.log('   ⚠ db/eligibil.json not found, skipping JSON sync');
    return 0;
  }
  const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  const startups = data.startups || [];
  const users    = data.users    || [];
  const usersById = Object.fromEntries(users.map(u => [u.id, u]));

  console.log(`   Found ${startups.length} startup profiles in JSON store`);

  let synced = 0;
  for (const s of startups) {
    const user = usersById[s.user_id];
    const result = await syncProfile(s.user_id, user?.email, {
      startupName: s.name,
      website:    s.website,
      pitch:      s.pitch,
      sector:     s.sector,
      stage:      s.stage,
      trl:        s.trl,
      country:    s.country,
      teamSize:   s.team_size,
      github:     s.github,
      goals:      s.goals ? (typeof s.goals === 'string' ? JSON.parse(s.goals) : s.goals) : null,
      amountIdx:  s.amount_idx,
      horizon:    s.horizon,
      priority:   s.priority,
    });
    if (result.ok) {
      synced++;
      const tag = result.hasEmbedding ? '+embed' : 'no-embed';
      console.log(`   ✓ ${s.name || s.user_id} (${tag})`);
    } else {
      console.log(`   ⏭ ${s.user_id}: ${result.reason}`);
    }
  }
  return synced;
}

async function rescoreStaging() {
  const supabase = getSupabase();
  const { data, error } = await supabase.rpc('rescore_all_staging');
  if (error) throw new Error(error.message);
  return data;
}

async function main() {
  const args = process.argv.slice(2);
  const doSyncJson = args.includes('--sync-json');
  const doRescore = args.includes('--rescore');

  console.log('╔══════════════════════════════════════════╗');
  console.log('║   eligibil.eu — User Stats Refresh       ║');
  console.log('╚══════════════════════════════════════════╝');

  const supabase = getSupabase();

  if (doSyncJson) {
    console.log('\n1. Syncing local JSON profiles → Supabase user_profiles...');
    const synced = await syncFromJson();
    console.log(`   ✓ Synced ${synced} profiles`);
  }

  console.log('\n2. Recomputing user pool stats...');
  const stats = await refreshPoolStats();
  if (!stats) {
    console.error('   ❌ Failed to refresh stats');
    process.exit(1);
  }

  console.log(`   ✓ ${stats.total_users} total users`);
  console.log(`   ✓ Top countries:`,
    (stats.top_countries || []).slice(0, 5).map(c => `${c.value} (${c.pct}%)`).join(', '));
  console.log(`   ✓ Top sectors:`,
    (stats.top_sectors || []).slice(0, 5).map(s => `${s.value} (${s.pct}%)`).join(', '));
  console.log(`   ✓ Top stages:`,
    (stats.top_stages || []).slice(0, 3).map(s => `${s.value} (${s.pct}%)`).join(', '));
  console.log(`   ✓ Centroid embedding: ${stats.centroid_embedding ? 'computed' : 'none (no profile embeddings yet)'}`);

  if (doRescore) {
    console.log('\n3. Rescoring all pending staging grants with v2...');
    const count = await rescoreStaging();
    console.log(`   ✓ Rescored ${count} grants`);
  }

  console.log('\n══════════════════════════════════════════');
  console.log('✓ Done\n');
}

if (require.main === module) {
  main().catch(err => {
    console.error('FATAL:', err.message);
    process.exit(1);
  });
}

module.exports = { syncFromJson, rescoreStaging };
