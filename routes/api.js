'use strict';

const express         = require('express');
const db              = require('../db/database');
const { getSupabase } = require('../db/supabase');

const router = express.Router();

// ── Auth guard ────────────────────────────────────────────────────────────────
function requireAuth(req, res, next) {
  if (!req.session?.userId) return res.status(401).json({ error: 'Neautentificat' });
  next();
}
router.use(requireAuth);

// ── Supabase — graceful degradation ──────────────────────────────────────────
// Returns null if env vars not set (allows server to start without Supabase).
function tryGetSupabase() {
  try { return getSupabase(); } catch { return null; }
}

// ── OpenAI embedding helper ───────────────────────────────────────────────────
// Returns null if OPENAI_API_KEY not set (triggers FTS fallback).
async function getQueryEmbedding(text) {
  if (!process.env.OPENAI_API_KEY || !text) return null;
  try {
    const { OpenAI } = require('openai');
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const resp = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: text,
    });
    return resp.data[0].embedding;
  } catch (err) {
    console.error('OpenAI embedding error:', err.message);
    return null;
  }
}

// ── Build query text from startup profile ─────────────────────────────────────
function buildProfileQuery(startup) {
  const parts = [];
  if (startup.sector)    parts.push(`Sector: ${startup.sector}`);
  if (startup.stage)     parts.push(`Stadiu: ${startup.stage}`);
  if (startup.country)   parts.push(`Tara: ${startup.country}`);
  if (startup.trl)       parts.push(`TRL: ${startup.trl}`);
  if (startup.pitch)     parts.push(startup.pitch);
  if (startup.goals) {
    try {
      const goals = typeof startup.goals === 'string'
        ? JSON.parse(startup.goals)
        : startup.goals;
      if (Array.isArray(goals) && goals.length)
        parts.push(`Obiective: ${goals.join(', ')}`);
    } catch { /* ignore parse errors */ }
  }
  return parts.join('. ');
}

// ── Amount index → EUR range ──────────────────────────────────────────────────
const AMOUNT_RANGES = [
  { min: 0,        max: 10_000   },   // 0: micro (<10K)
  { min: 10_000,   max: 50_000   },   // 1: small
  { min: 50_000,   max: 250_000  },   // 2: medium
  { min: 0,        max: null     },   // 3: any (default)
  { min: 250_000,  max: 2_000_000 },  // 4: large
  { min: 1_000_000, max: null    },   // 5: very large
];

// ── Scoring formula: similarity [threshold, 1.0] → [50%, 100%] ───────────────
function toMatchPct(similarity, threshold = 0.25) {
  return Math.round(((similarity - threshold) / (1.0 - threshold)) * 50 + 50);
}

// ── Shared select columns (no embedding — large field) ────────────────────────
const GRANT_SELECT = [
  'id', 'nume_program', 'organizatie', 'tara', 'tip',
  'dilutiv', 'suma_min', 'suma_max', 'stadiu', 'sector',
  'deadline', 'luna', 'dificultate', 'zile_min', 'zile_max',
  'cerinte', 'descriere', 'website', 'status',
].join(', ');

// =============================================================================
// GET /api/grants
// Query params: ?sector= &tara= &stadiu= &min= &max= &dilutiv= &tip= &limit=
// =============================================================================
router.get('/grants', async (req, res) => {
  const supabase = tryGetSupabase();
  if (!supabase) return res.status(503).json({ error: 'Supabase neconfigurat. Adaugă credențialele în .env' });

  try {
    const { sector, tara, stadiu, min, max, dilutiv, tip, limit = 100 } = req.query;

    let query = supabase
      .from('grants')
      .select(GRANT_SELECT)
      .eq('status', 'Activ')
      .order('dificultate', { ascending: true })
      .limit(Number(limit));

    if (tara)    query = query.ilike('tara', `%${tara}%`);
    if (sector)  query = query.ilike('sector', `%${sector}%`);
    if (stadiu)  query = query.ilike('stadiu', `%${stadiu}%`);
    if (tip)     query = query.ilike('tip', `%${tip}%`);
    if (min)     query = query.gte('suma_max', Number(min));
    if (max)     query = query.lte('suma_min', Number(max));
    if (dilutiv !== undefined && dilutiv !== '')
      query = query.eq('dilutiv', dilutiv === 'true');

    const { data, error } = await query;
    if (error) throw error;

    res.json(data || []);
  } catch (err) {
    console.error('GET /api/grants error:', err.message);
    res.status(500).json({ error: 'Eroare la încărcarea granturilor' });
  }
});

// =============================================================================
// GET /api/grants/match
// Returns top matching grants for the authenticated user's startup profile.
// Uses vector search (if OpenAI key set) or FTS fallback.
// MUST be registered BEFORE /grants/:id so Express doesn't capture "match" as :id
// =============================================================================
router.get('/grants/match', async (req, res) => {
  const supabase = tryGetSupabase();
  if (!supabase) return res.status(503).json({ error: 'Supabase neconfigurat' });

  try {
    const startup = db.findOne('startups', { user_id: req.session.userId });
    if (!startup) return res.status(400).json({ error: 'Profil startup incomplet. Completează profilul mai întâi.' });

    const limit       = Math.min(Number(req.query.limit) || 10, 50);
    const amountRange = AMOUNT_RANGES[startup.amount_idx ?? 3] || AMOUNT_RANGES[3];
    const queryText   = buildProfileQuery(startup);
    const embedding   = await getQueryEmbedding(queryText);

    let results;
    let source;

    if (embedding) {
      // ── Vector similarity path ────────────────────────────────────────────
      const { data, error } = await supabase.rpc('match_grants', {
        query_embedding:  embedding,
        match_threshold:  0.20,
        match_count:      limit,
        filter_tara:      startup.country || null,
        filter_sector:    startup.sector  || null,
        filter_stadiu:    startup.stage   || null,
        filter_dilutiv:   null,
        filter_suma_min:  amountRange.min  || null,
        filter_suma_max:  amountRange.max  || null,
        filter_status:    'Activ',
      });

      if (error) throw error;

      results = (data || []).map(g => ({
        ...g,
        match: toMatchPct(g.similarity, 0.20),
      }));
      source = 'vector';

    } else {
      // ── Full-text search fallback ─────────────────────────────────────────
      const { data, error } = await supabase.rpc('search_grants_fts', {
        query_text:      queryText,
        match_count:     limit,
        filter_tara:     startup.country || null,
        filter_sector:   startup.sector  || null,
        filter_stadiu:   startup.stage   || null,
        filter_dilutiv:  null,
        filter_suma_min: amountRange.min  || null,
        filter_suma_max: amountRange.max  || null,
        filter_status:   'Activ',
      });

      if (error) throw error;

      // FTS rank → heuristic 60–85% match score
      results = (data || []).map((g, i) => ({
        ...g,
        match: Math.round(85 - (i / Math.max((data.length - 1), 1)) * 25),
      }));
      source = 'fts';
    }

    res.json({ ok: true, results, source, total: results.length });
  } catch (err) {
    console.error('GET /api/grants/match error:', err.message);
    res.status(500).json({ error: 'Eroare la calculul matchingului' });
  }
});

// =============================================================================
// GET /api/grants/:id
// =============================================================================
router.get('/grants/:id', async (req, res) => {
  const supabase = tryGetSupabase();
  if (!supabase) return res.status(503).json({ error: 'Supabase neconfigurat' });

  try {
    const { data, error } = await supabase
      .from('grants')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error || !data) return res.status(404).json({ error: 'Grant negăsit' });
    res.json(data);
  } catch (err) {
    console.error('GET /api/grants/:id error:', err.message);
    res.status(500).json({ error: 'Eroare internă' });
  }
});

// =============================================================================
// GET /api/profile
// =============================================================================
router.get('/profile', (req, res) => {
  const user    = db.findOne('users',    { id: req.session.userId });
  const startup = db.findOne('startups', { user_id: req.session.userId });
  if (!user) return res.status(404).json({ error: 'Utilizator negăsit' });

  res.json({
    ok: true,
    user: {
      id: user.id, email: user.email,
      firstName: user.first_name, lastName: user.last_name, role: user.role,
    },
    startup: startup ? {
      id:        startup.id,
      name:      startup.name,
      website:   startup.website,
      pitch:     startup.pitch,
      sector:    startup.sector,
      stage:     startup.stage,
      trl:       startup.trl,
      country:   startup.country,
      teamSize:  startup.team_size,
      github:    startup.github,
      goals:     startup.goals ? JSON.parse(startup.goals) : [],
      amountIdx: startup.amount_idx,
      horizon:   startup.horizon,
      priority:  startup.priority,
    } : null,
  });
});

// =============================================================================
// PUT /api/profile
// =============================================================================
router.put('/profile', (req, res) => {
  const {
    startupName, website, pitch, sector, stage, trl, country,
    teamSize, github, goals, amountIdx, horizon, priority,
  } = req.body;

  const data = {
    name:       startupName || null,
    website:    website     || null,
    pitch:      pitch       || null,
    sector:     sector      || null,
    stage:      stage       || null,
    trl:        trl != null ? Number(trl) : 5,
    country:    country     || 'Moldova',
    team_size:  teamSize    || null,
    github:     github      || null,
    goals:      Array.isArray(goals) ? JSON.stringify(goals) : (goals || null),
    amount_idx: amountIdx != null ? Number(amountIdx) : 3,
    horizon:    horizon     || null,
    priority:   priority    || null,
  };

  const existing = db.findOne('startups', { user_id: req.session.userId });
  let startup;
  if (existing) {
    startup = db.update('startups', { user_id: req.session.userId }, data);
  } else {
    startup = db.insert('startups', { user_id: req.session.userId, ...data });
  }

  res.json({ ok: true, startup });
});

// =============================================================================
// GET /api/dashboard
// Returns readiness + completeness + top 3 matched grants + alerts
// =============================================================================
router.get('/dashboard', async (req, res) => {
  const startup  = db.findOne('startups', { user_id: req.session.userId });
  const supabase = tryGetSupabase();

  let topGrants = [];

  if (supabase && startup) {
    try {
      const queryText   = buildProfileQuery(startup);
      const amountRange = AMOUNT_RANGES[startup.amount_idx ?? 3] || AMOUNT_RANGES[3];
      const embedding   = await getQueryEmbedding(queryText);

      if (embedding) {
        const { data } = await supabase.rpc('match_grants', {
          query_embedding:  embedding,
          match_threshold:  0.15,
          match_count:      3,
          filter_tara:      startup.country || null,
          filter_sector:    startup.sector  || null,
          filter_stadiu:    startup.stage   || null,
          filter_dilutiv:   null,
          filter_suma_min:  amountRange.min  || null,
          filter_suma_max:  amountRange.max  || null,
          filter_status:    'Activ',
        });

        topGrants = (data || []).map(g => ({
          id:       g.id,
          name:     g.nume_program,
          match:    toMatchPct(g.similarity, 0.15),
          status:   'Research',
          amount:   g.suma_max ? `€${Math.round(g.suma_max / 1000)}K` : 'N/A',
          deadline: g.deadline || 'Rolling',
        }));
      } else {
        // FTS fallback — use country + sector as filter, no query text
        const { data } = await supabase.rpc('search_grants_fts', {
          query_text:      queryText,
          match_count:     3,
          filter_tara:     startup.country || null,
          filter_sector:   startup.sector  || null,
          filter_status:   'Activ',
        });

        topGrants = (data || []).map((g, i) => ({
          id:       g.id,
          name:     g.nume_program,
          match:    85 - i * 5,
          status:   'Research',
          amount:   g.suma_max ? `€${Math.round(g.suma_max / 1000)}K` : 'N/A',
          deadline: g.deadline || 'Rolling',
        }));
      }
    } catch (err) {
      console.error('Dashboard grant matching error:', err.message);
      // topGrants stays [] — dashboard still works, just without matched grants
    }
  }

  res.json({
    readiness:    startup ? 73 : 0,
    completeness: startup ? 65 : 0,
    startupName:  startup?.name || null,
    topGrants,
    alerts: [
      { type: 'deadline', text: 'EIC Accelerator — Stage 1 se închide în 47 zile', urgency: 'medium' },
      { type: 'profile',  text: 'Profil incomplet: lipsesc 3 artefacte cheie',      urgency: 'high'   },
      { type: 'match',    text: 'Program nou match 89%: Eurostars-3 aplicații deschise', urgency: 'low' },
    ],
  });
});

// =============================================================================
// GET /api/pipeline
// =============================================================================
router.get('/pipeline', (req, res) => {
  const items = db.findAll('pipeline_items', { user_id: req.session.userId });
  res.json({ ok: true, items });
});

// =============================================================================
// POST /api/pipeline
// =============================================================================
router.post('/pipeline', (req, res) => {
  const { grantId, grantName, stage, notes, deadline } = req.body;
  const item = db.insert('pipeline_items', {
    user_id:    req.session.userId,
    grant_id:   grantId   || null,
    grant_name: grantName || null,
    stage:      stage     || 'research',
    notes:      notes     || null,
    deadline:   deadline  || null,
  });
  res.status(201).json({ ok: true, item });
});

module.exports = router;
