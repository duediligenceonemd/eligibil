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
const crypto  = require('crypto');
const router  = express.Router();

const { getSupabase } = require('../db/supabase');
const obsidian       = require('../db/obsidian');
const adminAuth      = require('../lib/admin-auth');
const { reportError } = require('../instrument');
const { processInput } = require('../scripts/process-grants-inbox');
const { generateDescriptions } = require('../scripts/generate-resource-descriptions');
const { notifyGrant }         = require('../lib/indexnow');

function tryGetSupabase() {
  try { return getSupabase(); } catch { return null; }
}

function isMissingRelation(error) {
  return /relation .* does not exist/i.test(error?.message || '');
}

router.use(adminAuth.requireAdmin);

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

// ── FUNDING RESOURCES ─────────────────────────────────────────────────────────
router.get('/resources', async (req, res) => {
  const sb = tryGetSupabase();
  if (!sb) return res.status(503).json({ error: 'Supabase not configured' });

  const limit = Math.min(parseInt(req.query.limit || '1000', 10) || 1000, 2000);
  const page = Math.max(parseInt(req.query.page || '1', 10) || 1, 1);
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = sb
    .from('funding_resources')
    .select('*', { count: 'exact' })
    .order('sheet_name', { ascending: true })
    .order('row_number', { ascending: true })
    .range(from, to);

  if (req.query.sheet_name) query = query.eq('sheet_name', req.query.sheet_name);
  if (req.query.category) query = query.ilike('category', `%${req.query.category}%`);
  if (req.query.resource_type) query = query.eq('resource_type', req.query.resource_type);
  if (req.query.region_group) query = query.eq('region_group', req.query.region_group);
  if (req.query.is_grant_like !== undefined) {
    query = query.eq('is_grant_like', String(req.query.is_grant_like) === 'true');
  }

  const { data, error, count } = await query;
  if (error) {
    if (isMissingRelation(error)) {
      return res.json({ ok: true, items: [], total: 0, page, limit, schema_missing: true });
    }
    return res.status(500).json({ error: error.message });
  }

  res.json({
    ok: true,
    items: data || [],
    total: count || 0,
    page,
    limit,
  });
});

router.get('/resources/stats', async (req, res) => {
  const sb = tryGetSupabase();
  if (!sb) return res.status(503).json({ error: 'Supabase not configured' });

  const { data, error } = await sb
    .from('funding_resources')
    .select('sheet_name, website, is_grant_like');

  if (error) {
    if (isMissingRelation(error)) {
      return res.json({
        ok: true,
        total_rows: 0,
        rows_with_website: 0,
        grant_like_rows: 0,
        by_sheet: {},
        schema_missing: true,
      });
    }
    return res.status(500).json({ error: error.message });
  }

  const bySheet = {};
  let rowsWithWebsite = 0;
  let grantLikeRows = 0;

  for (const row of data || []) {
    bySheet[row.sheet_name] = (bySheet[row.sheet_name] || 0) + 1;
    if (row.website) rowsWithWebsite += 1;
    if (row.is_grant_like) grantLikeRows += 1;
  }

  res.json({
    ok: true,
    total_rows: (data || []).length,
    rows_with_website: rowsWithWebsite,
    grant_like_rows: grantLikeRows,
    by_sheet: bySheet,
  });
});

router.get('/resources/:id', async (req, res) => {
  const sb = tryGetSupabase();
  if (!sb) return res.status(503).json({ error: 'Supabase not configured' });

  const { data, error } = await sb
    .from('funding_resources')
    .select('*')
    .eq('id', req.params.id)
    .maybeSingle();

  if (error) {
    if (isMissingRelation(error)) {
      return res.status(503).json({ error: 'funding_resources schema missing', schema_missing: true });
    }
    return res.status(500).json({ error: error.message });
  }
  if (!data) return res.status(404).json({ error: 'Resource not found' });

  res.json({ ok: true, item: data });
});

router.post('/resources', async (req, res) => {
  const sb = tryGetSupabase();
  if (!sb) return res.status(503).json({ error: 'Supabase not configured' });

  const body = req.body || {};
  if (!body.title || !body.sheet_name || body.row_number == null || !body.resource_type) {
    return res.status(400).json({ error: 'title, sheet_name, row_number and resource_type are required' });
  }

  const insert = { ...body };
  delete insert.id;
  delete insert.created_at;
  delete insert.updated_at;

  const { data, error } = await sb
    .from('funding_resources')
    .insert(insert)
    .select()
    .maybeSingle();

  if (error) {
    if (isMissingRelation(error)) {
      return res.status(503).json({ error: 'funding_resources schema missing', schema_missing: true });
    }
    return res.status(500).json({ error: error.message });
  }

  res.json({ ok: true, item: data });
});

router.put('/resources/:id', async (req, res) => {
  const sb = tryGetSupabase();
  if (!sb) return res.status(503).json({ error: 'Supabase not configured' });

  const update = { ...(req.body || {}) };
  delete update.id;
  delete update.created_at;
  delete update.updated_at;

  const { data, error } = await sb
    .from('funding_resources')
    .update(update)
    .eq('id', req.params.id)
    .select()
    .maybeSingle();

  if (error) {
    if (isMissingRelation(error)) {
      return res.status(503).json({ error: 'funding_resources schema missing', schema_missing: true });
    }
    return res.status(500).json({ error: error.message });
  }
  if (!data) return res.status(404).json({ error: 'Resource not found' });

  res.json({ ok: true, item: data });
});

router.delete('/resources/:id', async (req, res) => {
  const sb = tryGetSupabase();
  if (!sb) return res.status(503).json({ error: 'Supabase not configured' });

  const { error } = await sb
    .from('funding_resources')
    .delete()
    .eq('id', req.params.id);

  if (error) {
    if (isMissingRelation(error)) {
      return res.status(503).json({ error: 'funding_resources schema missing', schema_missing: true });
    }
    return res.status(500).json({ error: error.message });
  }

  res.json({ ok: true });
});

router.post('/resources/generate-descriptions', async (req, res) => {
  try {
    const limit = Math.max(parseInt(String(req.body?.limit || '20'), 10) || 20, 1);
    const overwrite = !!req.body?.overwrite;
    const ids = Array.isArray(req.body?.ids) ? req.body.ids : [];
    const summary = await generateDescriptions({ limit, overwrite, ids, dryRun: false });
    res.json({ ok: true, ...summary });
  } catch (error) {
    reportError(error, {
      tags: { area: 'admin', action: 'generate_resource_descriptions' },
      extra: {
        limit: req.body?.limit || 20,
        overwrite: !!req.body?.overwrite,
        ids_count: Array.isArray(req.body?.ids) ? req.body.ids.length : 0,
      },
    });
    res.status(500).json({ error: error.message });
  }
});

// =============================================================================
// CRUD endpoints for the admin panel (Iteration 1: grants + events)
// =============================================================================
//
// Notes:
// - These endpoints reuse the same requireAdmin guard mounted at the top of
//   the file (any logged-in session OR ADMIN_TOKEN header).
// - GET endpoints select * to expose every column to the admin UI; the
//   public /api/grants endpoint stays restrictive.
// - Validation is intentionally light — the admin can edit any column,
//   trust is implicit. Add stricter validation if multi-user admin lands.
// =============================================================================

// ── GRANTS ────────────────────────────────────────────────────────────────────
router.get('/grants', async (req, res) => {
  const sb = tryGetSupabase();
  if (!sb) return res.status(503).json({ error: 'Supabase not configured' });
  const { data, error } = await sb.from('grants')
    // Skip embedding/fts (large) — admin doesn't need them in the list view
    .select('id, slug_ro, slug_en, nume_program, nume_program_en, organizatie, ' +
            'funder_name, funder_country, tara, tip, dilutiv, suma_min, suma_max, ' +
            'stadiu, sector, deadline, dificultate, status, evidence_status, ' +
            'short_summary_ro, short_summary_en, source_url, application_url, ' +
            'eligibility_rules, documents_required, evaluation_criteria, tags, ' +
            'cofinancing_pct, equity_pct, consortium_required, trl_min, trl_max, ' +
            'application_languages, descriere, descriere_en, cerinte, cerinte_en, ' +
            'website, verificat, last_checked_at, updated_at, created_at')
    .order('updated_at', { ascending: false })
    .limit(500);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true, items: data || [] });
});

router.get('/grants/:id', async (req, res) => {
  const sb = tryGetSupabase();
  if (!sb) return res.status(503).json({ error: 'Supabase not configured' });
  const { data, error } = await sb.from('grants').select('*').eq('id', req.params.id).maybeSingle();
  if (error) return res.status(500).json({ error: error.message });
  if (!data)  return res.status(404).json({ error: 'Grant not found' });
  // Strip the embedding (1536 floats) before returning — large + useless to UI
  delete data.embedding;
  delete data.fts;
  res.json({ ok: true, item: data });
});

router.post('/grants', async (req, res) => {
  const sb = tryGetSupabase();
  if (!sb) return res.status(503).json({ error: 'Supabase not configured' });
  const body = req.body || {};
  if (!body.id || !body.nume_program) {
    return res.status(400).json({ error: 'id and nume_program are required' });
  }
  // Strip read-only / computed fields
  const insert = { ...body };
  delete insert.embedding; delete insert.fts; delete insert.created_at; delete insert.updated_at;
  const { data, error } = await sb.from('grants').insert(insert).select().maybeSingle();
  if (error) return res.status(500).json({ error: error.message });
  // Notify search engines via IndexNow (fire-and-forget)
  if (data) notifyGrant(data).catch(() => {});
  res.json({ ok: true, item: data });
});

router.put('/grants/:id', async (req, res) => {
  const sb = tryGetSupabase();
  if (!sb) return res.status(503).json({ error: 'Supabase not configured' });
  const update = { ...(req.body || {}) };
  // The id of the row is the PK — never overwrite it via PUT body
  delete update.id;
  delete update.embedding; delete update.fts; delete update.created_at;
  update.updated_at = new Date().toISOString();
  const { data, error } = await sb.from('grants').update(update).eq('id', req.params.id).select().maybeSingle();
  if (error) return res.status(500).json({ error: error.message });
  if (!data)  return res.status(404).json({ error: 'Grant not found' });
  // Notify search engines via IndexNow (fire-and-forget)
  notifyGrant(data).catch(() => {});
  res.json({ ok: true, item: data });
});

router.delete('/grants/:id', async (req, res) => {
  const sb = tryGetSupabase();
  if (!sb) return res.status(503).json({ error: 'Supabase not configured' });
  const { error } = await sb.from('grants').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true });
});

// ── EVENTS (Brief 04) ─────────────────────────────────────────────────────────
router.get('/events', async (req, res) => {
  const sb = tryGetSupabase();
  if (!sb) return res.status(503).json({ error: 'Supabase not configured' });
  const { data, error } = await sb.from('events').select('*')
    .order('start_date', { ascending: true })
    .limit(500);
  if (error) {
    if (/relation .* does not exist/i.test(error.message || '')) {
      return res.json({ ok: true, items: [], schema_missing: true });
    }
    return res.status(500).json({ error: error.message });
  }
  res.json({ ok: true, items: data || [] });
});

router.get('/events/:id', async (req, res) => {
  const sb = tryGetSupabase();
  if (!sb) return res.status(503).json({ error: 'Supabase not configured' });
  const { data, error } = await sb.from('events').select('*').eq('id', req.params.id).maybeSingle();
  if (error) return res.status(500).json({ error: error.message });
  if (!data)  return res.status(404).json({ error: 'Event not found' });
  res.json({ ok: true, item: data });
});

router.post('/events', async (req, res) => {
  const sb = tryGetSupabase();
  if (!sb) return res.status(503).json({ error: 'Supabase not configured' });
  const body = req.body || {};
  if (!body.title || !body.event_type || !body.start_date) {
    return res.status(400).json({ error: 'title, event_type and start_date are required' });
  }
  const insert = { ...body };
  delete insert.id; delete insert.created_at; delete insert.updated_at;
  const { data, error } = await sb.from('events').insert(insert).select().maybeSingle();
  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true, item: data });
});

router.put('/events/:id', async (req, res) => {
  const sb = tryGetSupabase();
  if (!sb) return res.status(503).json({ error: 'Supabase not configured' });
  const update = { ...(req.body || {}) };
  delete update.id; delete update.created_at; delete update.updated_at;
  const { data, error } = await sb.from('events').update(update).eq('id', req.params.id).select().maybeSingle();
  if (error) return res.status(500).json({ error: error.message });
  if (!data)  return res.status(404).json({ error: 'Event not found' });
  res.json({ ok: true, item: data });
});

router.delete('/events/:id', async (req, res) => {
  const sb = tryGetSupabase();
  if (!sb) return res.status(503).json({ error: 'Supabase not configured' });
  const { error } = await sb.from('events').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true });
});

// ── FUNDERS / Donatori (Admin iter 2) ─────────────────────────────────────────
router.get('/funders', async (req, res) => {
  const sb = tryGetSupabase();
  if (!sb) return res.status(503).json({ error: 'Supabase not configured' });
  const { data, error } = await sb.from('funders').select('*')
    .order('updated_at', { ascending: false })
    .limit(500);
  if (error) {
    if (/relation .* does not exist/i.test(error.message || '')) {
      return res.json({ ok: true, items: [], schema_missing: true });
    }
    return res.status(500).json({ error: error.message });
  }
  res.json({ ok: true, items: data || [] });
});

router.get('/funders/:id', async (req, res) => {
  const sb = tryGetSupabase();
  if (!sb) return res.status(503).json({ error: 'Supabase not configured' });
  const { data, error } = await sb.from('funders').select('*').eq('id', req.params.id).maybeSingle();
  if (error) return res.status(500).json({ error: error.message });
  if (!data)  return res.status(404).json({ error: 'Funder not found' });
  res.json({ ok: true, item: data });
});

router.post('/funders', async (req, res) => {
  const sb = tryGetSupabase();
  if (!sb) return res.status(503).json({ error: 'Supabase not configured' });
  const body = req.body || {};
  if (!body.name) return res.status(400).json({ error: 'name is required' });
  const insert = { ...body };
  delete insert.id; delete insert.created_at; delete insert.updated_at;
  const { data, error } = await sb.from('funders').insert(insert).select().maybeSingle();
  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true, item: data });
});

router.put('/funders/:id', async (req, res) => {
  const sb = tryGetSupabase();
  if (!sb) return res.status(503).json({ error: 'Supabase not configured' });
  const update = { ...(req.body || {}) };
  delete update.id; delete update.created_at; delete update.updated_at;
  const { data, error } = await sb.from('funders').update(update).eq('id', req.params.id).select().maybeSingle();
  if (error) return res.status(500).json({ error: error.message });
  if (!data)  return res.status(404).json({ error: 'Funder not found' });
  res.json({ ok: true, item: data });
});

router.delete('/funders/:id', async (req, res) => {
  const sb = tryGetSupabase();
  if (!sb) return res.status(503).json({ error: 'Supabase not configured' });
  // ON DELETE SET NULL on grants.funder_id — safe to remove a funder; grants stay.
  const { error } = await sb.from('funders').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true });
});

// ── NEWS / BLOG (Admin iter 3) ─────────────────────────────────────────────
// Generic CRUD factory — same shape, two tables.
function makeContentCrud(table, requiredFields) {
  return {
    list: async (req, res) => {
      const sb = tryGetSupabase();
      if (!sb) return res.status(503).json({ error: 'Supabase not configured' });
      const { data, error } = await sb.from(table).select('*')
        .order('updated_at', { ascending: false }).limit(500);
      if (error) {
        if (/relation .* does not exist/i.test(error.message || '')) {
          return res.json({ ok: true, items: [], schema_missing: true });
        }
        return res.status(500).json({ error: error.message });
      }
      res.json({ ok: true, items: data || [] });
    },
    get: async (req, res) => {
      const sb = tryGetSupabase();
      if (!sb) return res.status(503).json({ error: 'Supabase not configured' });
      const { data, error } = await sb.from(table).select('*').eq('id', req.params.id).maybeSingle();
      if (error) return res.status(500).json({ error: error.message });
      if (!data)  return res.status(404).json({ error: 'Not found' });
      res.json({ ok: true, item: data });
    },
    create: async (req, res) => {
      const sb = tryGetSupabase();
      if (!sb) return res.status(503).json({ error: 'Supabase not configured' });
      const body = req.body || {};
      for (const f of requiredFields) {
        if (!body[f]) return res.status(400).json({ error: f + ' is required' });
      }
      const insert = { ...body };
      delete insert.id; delete insert.created_at; delete insert.updated_at;
      const { data, error } = await sb.from(table).insert(insert).select().maybeSingle();
      if (error) return res.status(500).json({ error: error.message });
      res.json({ ok: true, item: data });
    },
    update: async (req, res) => {
      const sb = tryGetSupabase();
      if (!sb) return res.status(503).json({ error: 'Supabase not configured' });
      const update = { ...(req.body || {}) };
      delete update.id; delete update.created_at; delete update.updated_at;
      const { data, error } = await sb.from(table).update(update).eq('id', req.params.id).select().maybeSingle();
      if (error) return res.status(500).json({ error: error.message });
      if (!data)  return res.status(404).json({ error: 'Not found' });
      res.json({ ok: true, item: data });
    },
    del: async (req, res) => {
      const sb = tryGetSupabase();
      if (!sb) return res.status(503).json({ error: 'Supabase not configured' });
      const { error } = await sb.from(table).delete().eq('id', req.params.id);
      if (error) return res.status(500).json({ error: error.message });
      res.json({ ok: true });
    },
  };
}

const newsCrud = makeContentCrud('news', ['slug_ro', 'title']);
router.get   ('/news',     newsCrud.list);
router.get   ('/news/:id', newsCrud.get);
router.post  ('/news',     newsCrud.create);
router.put   ('/news/:id', newsCrud.update);
router.delete('/news/:id', newsCrud.del);

const blogCrud = makeContentCrud('blog_posts', ['slug_ro', 'title']);
router.get   ('/blog',     blogCrud.list);
router.get   ('/blog/:id', blogCrud.get);
router.post  ('/blog',     blogCrud.create);
router.put   ('/blog/:id', blogCrud.update);
router.delete('/blog/:id', blogCrud.del);

// ── COMMENTS MODERATION ──────────────────────────────────────────────────────
router.get('/comments', async (req, res) => {
  const sb = tryGetSupabase();
  if (!sb) return res.status(503).json({ error: 'Supabase not configured' });
  const { data, error } = await sb.from('comments').select('*')
    .order('created_at', { ascending: false }).limit(500);
  if (error) {
    if (/relation .* does not exist/i.test(error.message || '')) {
      return res.json({ ok: true, items: [], schema_missing: true });
    }
    return res.status(500).json({ error: error.message });
  }
  res.json({ ok: true, items: data || [] });
});

router.get('/comments/:id', async (req, res) => {
  const sb = tryGetSupabase();
  if (!sb) return res.status(503).json({ error: 'Supabase not configured' });
  const { data, error } = await sb.from('comments').select('*').eq('id', req.params.id).maybeSingle();
  if (error) return res.status(500).json({ error: error.message });
  if (!data)  return res.status(404).json({ error: 'Not found' });
  res.json({ ok: true, item: data });
});

router.put('/comments/:id', async (req, res) => {
  const sb = tryGetSupabase();
  if (!sb) return res.status(503).json({ error: 'Supabase not configured' });
  // Whitelist mutable fields — admin can flip status only
  const update = {};
  if (req.body?.status) update.status = req.body.status;
  if (req.body?.body)   update.body   = req.body.body;
  const { data, error } = await sb.from('comments').update(update).eq('id', req.params.id).select().maybeSingle();
  if (error) return res.status(500).json({ error: error.message });
  if (!data)  return res.status(404).json({ error: 'Not found' });
  res.json({ ok: true, item: data });
});

router.delete('/comments/:id', async (req, res) => {
  const sb = tryGetSupabase();
  if (!sb) return res.status(503).json({ error: 'Supabase not configured' });
  const { error } = await sb.from('comments').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true });
});

// —— FEEDBACK MODERATION / REVIEW ——————————————————————————————————————————————
router.get('/feedback', async (req, res) => {
  const sb = tryGetSupabase();
  if (!sb) return res.status(503).json({ error: 'Supabase not configured' });
  const { data, error } = await sb.from('feedback').select('*')
    .order('created_at', { ascending: false })
    .limit(500);
  if (error) {
    if (isMissingRelation(error)) {
      return res.json({ ok: true, items: [], schema_missing: true });
    }
    return res.status(500).json({ error: error.message });
  }
  res.json({ ok: true, items: data || [] });
});

router.get('/feedback/:id', async (req, res) => {
  const sb = tryGetSupabase();
  if (!sb) return res.status(503).json({ error: 'Supabase not configured' });
  const { data, error } = await sb.from('feedback').select('*').eq('id', req.params.id).maybeSingle();
  if (error) return res.status(500).json({ error: error.message });
  if (!data) return res.status(404).json({ error: 'Feedback not found' });
  res.json({ ok: true, item: data });
});

router.put('/feedback/:id', async (req, res) => {
  const sb = tryGetSupabase();
  if (!sb) return res.status(503).json({ error: 'Supabase not configured' });
  const update = {};
  if (typeof req.body?.rating === 'string') update.rating = req.body.rating;
  if (typeof req.body?.funding_type_interest === 'string') update.funding_type_interest = req.body.funding_type_interest;
  if (typeof req.body?.message === 'string') update.message = req.body.message;
  if (typeof req.body?.page === 'string') update.page = req.body.page;
  if (typeof req.body?.language === 'string') update.language = req.body.language;
  const { data, error } = await sb.from('feedback').update(update).eq('id', req.params.id).select().maybeSingle();
  if (error) return res.status(500).json({ error: error.message });
  if (!data) return res.status(404).json({ error: 'Feedback not found' });
  res.json({ ok: true, item: data });
});

router.delete('/feedback/:id', async (req, res) => {
  const sb = tryGetSupabase();
  if (!sb) return res.status(503).json({ error: 'Supabase not configured' });
  const { error } = await sb.from('feedback').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true });
});

// =============================================================================
// GET /api/admin/stats — dashboard counts
// =============================================================================
router.get('/stats', async (req, res) => {
  const supabase = tryGetSupabase();
  if (!supabase) return res.status(503).json({ error: 'Supabase not configured' });

  const [staging, grants, resources, feedback] = await Promise.all([
    supabase.from('grants_staging').select('status', { count: 'exact', head: false }),
    supabase.from('grants').select('id', { count: 'exact', head: true }),
    supabase.from('funding_resources').select('id', { count: 'exact', head: true }),
    supabase.from('feedback').select('id', { count: 'exact', head: true }),
  ]);

  const stagingCounts = {};
  for (const row of staging.data || []) {
    stagingCounts[row.status] = (stagingCounts[row.status] || 0) + 1;
  }

  res.json({
    ok: true,
    grants_total: grants.count || 0,
    resources_total: resources.count || 0,
    feedback_total: feedback.count || 0,
    staging: stagingCounts,
    obsidian: obsidian.getStats(),
  });
});

module.exports = router;
