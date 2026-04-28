'use strict';

/**
 * routes/admin.js — Admin queue API for grants_staging
 *
 * Endpoints:
 *   GET  /api/admin/queue          — list pending staging entries
 *   GET  /api/admin/queue/:id      — single entry detail
 *   POST /api/admin/queue/:id/approve  — promote to grants table
 *   POST /api/admin/queue/:id/reject   — mark rejected
 *   POST /api/admin/queue/:id/edit     — update fields before approve
 *   POST /api/admin/inbox          — paste raw text → process inline
 *   GET  /api/admin/stats          — dashboard counts
 *
 * Mounted at /api/admin in server.js
 */

const express = require('express');
const router  = express.Router();

const { getSupabase } = require('../db/supabase');
const obsidian        = require('../db/obsidian');
const { processInput } = require('../scripts/process-grants-inbox');

function tryGetSupabase() {
  try { return getSupabase(); } catch { return null; }
}

// =============================================================================
// Simple admin guard — for now, any logged-in session OR ADMIN_TOKEN header
// =============================================================================
function requireAdmin(req, res, next) {
  const token = req.headers['x-admin-token'];
  if (process.env.ADMIN_TOKEN && token === process.env.ADMIN_TOKEN) return next();
  if (req.session?.userId) return next();
  return res.status(401).json({ error: 'Admin authentication required' });
}

router.use(requireAdmin);

// =============================================================================
// GET /api/admin/queue — list pending
// =============================================================================
router.get('/queue', async (req, res) => {
  const supabase = tryGetSupabase();
  if (!supabase) return res.status(503).json({ error: 'Supabase not configured' });

  const limit = parseInt(req.query.limit || '50', 10);

  const { data, error } = await supabase.rpc('pending_queue', { max_count: limit });
  if (error) return res.status(500).json({ error: error.message });

  res.json({ ok: true, count: data?.length || 0, queue: data || [] });
});

// =============================================================================
// GET /api/admin/queue/:id — full detail
// =============================================================================
router.get('/queue/:id', async (req, res) => {
  const supabase = tryGetSupabase();
  if (!supabase) return res.status(503).json({ error: 'Supabase not configured' });

  const { data, error } = await supabase
    .from('grants_staging')
    .select('*')
    .eq('id', req.params.id)
    .single();

  if (error) return res.status(404).json({ error: error.message });
  res.json({ ok: true, grant: data });
});

// =============================================================================
// POST /api/admin/queue/:id/approve
//   body: { id_override?: string }
// =============================================================================
router.post('/queue/:id/approve', async (req, res) => {
  const supabase = tryGetSupabase();
  if (!supabase) return res.status(503).json({ error: 'Supabase not configured' });

  const reviewer = req.session?.email || 'admin';
  const idOverride = req.body?.id_override || null;

  const { data: newId, error } = await supabase.rpc('approve_grant_from_staging', {
    staging_id: req.params.id,
    grant_id_override: idOverride,
    reviewer,
  });

  if (error) return res.status(500).json({ error: error.message });

  // Move Obsidian note: drafts/ → published/
  try {
    const { data: row } = await supabase
      .from('grants_staging')
      .select('obsidian_path')
      .eq('id', req.params.id)
      .single();
    if (row?.obsidian_path) obsidian.moveNote(row.obsidian_path, 'published');
  } catch (_) { /* non-fatal */ }

  res.json({ ok: true, grant_id: newId });
});

// =============================================================================
// POST /api/admin/queue/:id/reject
//   body: { reason?: string }
// =============================================================================
router.post('/queue/:id/reject', async (req, res) => {
  const supabase = tryGetSupabase();
  if (!supabase) return res.status(503).json({ error: 'Supabase not configured' });

  const reviewer = req.session?.email || 'admin';
  const reason = req.body?.reason || 'Manually rejected';

  const { data: row } = await supabase
    .from('grants_staging')
    .select('obsidian_path')
    .eq('id', req.params.id)
    .single();

  const { error } = await supabase
    .from('grants_staging')
    .update({
      status: 'rejected',
      reject_reason: reason,
      reviewed_by: reviewer,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', req.params.id);

  if (error) return res.status(500).json({ error: error.message });

  // Move Obsidian note: drafts/ → ignored/
  if (row?.obsidian_path) {
    try { obsidian.moveNote(row.obsidian_path, 'ignored'); } catch (_) {}
  }

  res.json({ ok: true });
});

// =============================================================================
// POST /api/admin/queue/:id/edit
//   body: { field: value, ... }
// =============================================================================
router.post('/queue/:id/edit', async (req, res) => {
  const supabase = tryGetSupabase();
  if (!supabase) return res.status(503).json({ error: 'Supabase not configured' });

  const ALLOWED = ['nume_program','organizatie','tara','tip','dilutiv','suma_min','suma_max',
                   'stadiu','sector','deadline','luna','dificultate','zile_min','zile_max',
                   'cerinte','descriere','website','relevance_score'];
  const updates = {};
  for (const k of ALLOWED) {
    if (req.body[k] !== undefined) updates[k] = req.body[k];
  }

  const { error } = await supabase
    .from('grants_staging')
    .update(updates)
    .eq('id', req.params.id);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true, updated: Object.keys(updates) });
});

// =============================================================================
// POST /api/admin/inbox — paste raw text, extract inline
//   body: { text: string, subject?: string }
// =============================================================================
router.post('/inbox', async (req, res) => {
  const { text, subject } = req.body || {};
  if (!text || text.length < 30) {
    return res.status(400).json({ error: 'Text too short (min 30 chars)' });
  }

  try {
    const result = await processInput({
      body: text,
      subject: subject || 'Manual paste',
      label: 'admin-paste',
      sourceType: 'manual',
      sourceId: `paste-${Date.now()}`,
    }, { dryRun: false });

    res.json({ ok: true, result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =============================================================================
// POST /api/admin/recompute-scores — refresh user pool + rescore all staging
// =============================================================================
router.post('/recompute-scores', async (req, res) => {
  const supabase = tryGetSupabase();
  if (!supabase) return res.status(503).json({ error: 'Supabase not configured' });

  try {
    // 1. Refresh pool stats from current user_profiles
    const { data: stats, error: statsErr } = await supabase.rpc('compute_pool_stats');
    if (statsErr) throw new Error('compute_pool_stats: ' + statsErr.message);

    // 2. Rescore all pending staging grants
    const { data: count, error: rescoreErr } = await supabase.rpc('rescore_all_staging');
    if (rescoreErr) throw new Error('rescore_all_staging: ' + rescoreErr.message);

    res.json({
      ok: true,
      pool_stats: {
        total_users: stats?.total_users || 0,
        top_countries: (stats?.top_countries || []).slice(0, 5),
        top_sectors:   (stats?.top_sectors   || []).slice(0, 5),
        top_stages:    (stats?.top_stages    || []).slice(0, 3),
        has_centroid:  !!stats?.centroid_embedding,
      },
      grants_rescored: count,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =============================================================================
// GET /api/admin/pool-stats — current user pool composition
// =============================================================================
router.get('/pool-stats', async (req, res) => {
  const supabase = tryGetSupabase();
  if (!supabase) return res.status(503).json({ error: 'Supabase not configured' });

  const { data, error } = await supabase
    .from('user_pool_stats')
    .select('*')
    .eq('id', 1)
    .maybeSingle();

  if (error) return res.status(500).json({ error: error.message });
  if (!data) return res.json({ ok: true, total_users: 0, top_countries: [], top_sectors: [], top_stages: [] });

  res.json({
    ok: true,
    total_users:   data.total_users,
    top_countries: data.top_countries || [],
    top_sectors:   data.top_sectors   || [],
    top_stages:    data.top_stages    || [],
    trl_distribution: data.trl_distribution || [],
    has_centroid:  !!data.centroid_embedding,
    computed_at:   data.computed_at,
  });
});

// =============================================================================
// GET /api/admin/stats — dashboard counts
// =============================================================================
router.get('/stats', async (req, res) => {
  const supabase = tryGetSupabase();
  if (!supabase) return res.status(503).json({ error: 'Supabase not configured' });

  const [staging, grants] = await Promise.all([
    supabase.from('grants_staging').select('status', { count: 'exact', head: false }),
    supabase.from('grants').select('id', { count: 'exact', head: true }),
  ]);

  const stagingCounts = {};
  for (const row of staging.data || []) {
    stagingCounts[row.status] = (stagingCounts[row.status] || 0) + 1;
  }

  res.json({
    ok: true,
    grants_total: grants.count || 0,
    staging: stagingCounts,
    obsidian: obsidian.getStats(),
  });
});

module.exports = router;
