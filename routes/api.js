'use strict';

const express         = require('express');
const db              = require('../db/users-supabase');
const { getSupabase } = require('../db/supabase');
const { isAdminRequest } = require('../lib/admin-auth');
const { reportError } = require('../instrument');
const {
  commentSchema,
  parseBody,
  pipelineSchema,
  profileSchema,
  reactionSchema,
} = require('../lib/validation');

const router = express.Router();

// ── Auth guard ────────────────────────────────────────────────────────────────
// Applied per-route below. Public routes: GET /grants (catalog browsing for
// /search), GET /grants/:id (grant detail). Everything else still requires
// auth — including /grants/match which is profile-personalized.
function requireAuth(req, res, next) {
  if (!req.session?.userId) return res.status(401).json({ error: 'Neautentificat' });
  next();
}

// ── Supabase — graceful degradation ──────────────────────────────────────────
// Returns null if env vars not set (allows server to start without Supabase).
function tryGetSupabase() {
  try { return getSupabase(); } catch { return null; }
}

function isMissingRelation(error) {
  return /relation .* does not exist|Could not find the table .* in the schema cache/i.test(error?.message || '');
}

const RESOURCE_TYPE_ALIASES = {
  grant_program: 'grant_database',
  capital_provider: 'capital_resource',
  support_program: 'funding_resource',
  technical_support: 'technical_resource',
};

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
// Pas 1 columns (slug_*, short_summary_*, funder_*, evidence_status,
// application_languages) are added via a second list and concatenated; if the
// Pas 1 migration hasn't been applied yet, Supabase returns an error and the
// /grants endpoint serves an empty list — degrades cleanly rather than crashing.
const GRANT_SELECT_BASE = [
  'id', 'nume_program', 'organizatie', 'tara', 'tip',
  'dilutiv', 'suma_min', 'suma_max', 'stadiu', 'sector',
  'deadline', 'luna', 'dificultate', 'zile_min', 'zile_max',
  'cerinte', 'descriere', 'website', 'status',
];
// Only the enrichment columns that actually exist on `grants` today.
// The wider set (nume_program_en, short_summary_*, funder_name, evidence_status,
// application_languages) was scoped for a follow-up Pas 1 extension and would
// trigger the "column does not exist" fallback to BASE — losing slugs too.
const GRANT_SELECT_PAS1 = [
  'slug_ro', 'slug_en',
  'trl_min', 'trl_max',
  'amount_min_eur', 'amount_max_eur',
  'sectors_en', 'application_url', 'is_equity_free',
  'funder_id', 'enriched_at',
  'application_languages', 'eligibility_rules',
];
const GRANT_SELECT      = GRANT_SELECT_BASE.join(', ');
const GRANT_SELECT_FULL = GRANT_SELECT_BASE.concat(GRANT_SELECT_PAS1).join(', ');

// =============================================================================
// GET /api/grants — PUBLIC (catalog browsing for /search)
// Query params:
//   ?sector= &tara= &stadiu= &tip= &min= &max= &dilutiv=  (existing)
//   &q=                  free-text search across nume_program / descriere / funder_name
//   &language=           filter on application_languages (e.g. 'en')
//   &sort=               'difficulty' (default) | 'amount' (suma_max desc) | 'name'
//   &limit=              cap rows (default 100, max 200)
// =============================================================================
router.get('/grants', async (req, res) => {
  const supabase = tryGetSupabase();
  if (!supabase) return res.status(503).json({ error: 'Supabase neconfigurat. Adaugă credențialele în .env' });

  try {
    const {
      sector, tara, stadiu, min, max, dilutiv, tip,
      q, language, sort,
    } = req.query;
    const limit = Math.min(Number(req.query.limit) || 100, 200);

    // Try the enriched select first; fall back to the base select if Pas 1
    // columns aren't applied yet (column-not-found errors from Postgres).
    async function runQuery(selectCols) {
      let query = supabase
        .from('grants')
        .select(selectCols)
        .eq('status', 'Activ')
        .limit(limit);

      if (tara)    query = query.ilike('tara',   `%${tara}%`);
      if (sector)  query = query.ilike('sector', `%${sector}%`);
      if (stadiu)  query = query.ilike('stadiu', `%${stadiu}%`);
      if (tip)     query = query.ilike('tip',    `%${tip}%`);
      if (min)     query = query.gte('suma_max', Number(min));
      if (max)     query = query.lte('suma_min', Number(max));
      if (dilutiv !== undefined && dilutiv !== '')
        query = query.eq('dilutiv', dilutiv === 'true');
      if (language && selectCols.includes('application_languages'))
        query = query.contains('application_languages', [String(language).toLowerCase()]);
      if (q) {
        const term = `%${q}%`;
        // funder_name only exists in the enriched select; or-clause still works
        // because PostgREST .or accepts unknown columns at parse-time but the
        // outer fallback handles the column-missing case.
        if (selectCols.includes('funder_name')) {
          query = query.or(`nume_program.ilike.${term},descriere.ilike.${term},funder_name.ilike.${term}`);
        } else {
          query = query.or(`nume_program.ilike.${term},descriere.ilike.${term}`);
        }
      }

      // Sort
      if (sort === 'amount') {
        query = query.order('suma_max', { ascending: false, nullsFirst: false });
      } else if (sort === 'name') {
        query = query.order('nume_program', { ascending: true });
      } else {
        query = query.order('dificultate', { ascending: true });
      }

      return query;
    }

    let { data, error } = await runQuery(GRANT_SELECT_FULL);
    if (error && /column .* does not exist/i.test(error.message || '')) {
      // Pas 1 not applied yet — degrade to base columns.
      ({ data, error } = await runQuery(GRANT_SELECT));
    }
    if (error) throw error;

    res.json(data || []);
  } catch (err) {
    console.error('GET /api/grants error:', err.message);
    reportError(err, {
      tags: { area: 'api', route: 'grants_list' },
      extra: { query: req.query },
    });
    res.status(500).json({ error: 'Eroare la încărcarea granturilor' });
  }
});

// =============================================================================
// GET /api/resources — PUBLIC catalog for support resources / directories
// Query params:
//   ?q=              free text over title/category/description
//   ?region_group=
//   ?resource_type=
//   ?category=
//   ?is_grant_like=  true|false
//   ?limit=          default 120, max 300
// =============================================================================
router.get('/resources', async (req, res) => {
  const supabase = tryGetSupabase();
  if (!supabase) return res.status(503).json({ error: 'Supabase neconfigurat. Adaugă credențialele în .env' });

  try {
    const { q, region_group, resource_type, category, is_grant_like } = req.query;
    const limit = Math.min(Number(req.query.limit) || 120, 300);

    let query = supabase
      .from('funding_resources')
      .select('id, title, amount_raw, category, description, website, region_group, resource_type, is_grant_like, sheet_name, row_number')
      .order('sheet_name', { ascending: true })
      .order('row_number', { ascending: true })
      .limit(limit);

    if (region_group) query = query.eq('region_group', region_group);
    if (resource_type) {
      const normalizedResourceType = RESOURCE_TYPE_ALIASES[resource_type] || resource_type;
      query = query.eq('resource_type', normalizedResourceType);
    }
    if (category) query = query.ilike('category', `%${category}%`);
    if (is_grant_like !== undefined && is_grant_like !== '') {
      query = query.eq('is_grant_like', String(is_grant_like) === 'true');
    }
    if (q) {
      const term = `%${q}%`;
      query = query.or(`title.ilike.${term},category.ilike.${term},description.ilike.${term}`);
    }

    const { data, error } = await query;
    if (error) {
      if (isMissingRelation(error)) return res.json([]);
      return res.status(500).json({ error: error.message });
    }
    res.json(data || []);
  } catch (err) {
    reportError(err, {
      tags: { area: 'api', route: 'resources_list' },
      extra: { query: req.query },
    });
    res.status(500).json({ error: err.message });
  }
});

router.get('/resources/overview', async (req, res) => {
  const supabase = tryGetSupabase();
  if (!supabase) {
    return res.status(503).json({
      error: 'Supabase neconfigurat. Adaugă credențialele în .env',
      total: 0,
      rows_with_website: 0,
      grant_like_rows: 0,
      by_region: {},
      by_type: {},
    });
  }

  try {
    const { data, error } = await supabase
      .from('funding_resources')
      .select('region_group, resource_type, website, is_grant_like');

    if (error) {
      if (isMissingRelation(error)) {
        return res.json({
          total: 0,
          rows_with_website: 0,
          grant_like_rows: 0,
          by_region: {},
          by_type: {},
        });
      }
      return res.status(500).json({ error: error.message });
    }

    const summary = {
      total: 0,
      rows_with_website: 0,
      grant_like_rows: 0,
      by_region: {},
      by_type: {},
    };

    for (const row of data || []) {
      summary.total += 1;
      if (row.website) summary.rows_with_website += 1;
      if (row.is_grant_like) summary.grant_like_rows += 1;
      const region = row.region_group || 'Unknown';
      const type = row.resource_type || 'unknown';
      summary.by_region[region] = (summary.by_region[region] || 0) + 1;
      summary.by_type[type] = (summary.by_type[type] || 0) + 1;
    }

    res.json(summary);
  } catch (err) {
    reportError(err, {
      tags: { area: 'api', route: 'resources_overview' },
    });
    res.status(500).json({ error: err.message });
  }
});

router.get('/resources/:id', async (req, res) => {
  const supabase = tryGetSupabase();
  if (!supabase) return res.status(503).json({ error: 'Supabase neconfigurat. Adaugă credențialele în .env' });

  try {
    const { data, error } = await supabase
      .from('funding_resources')
      .select('id, title, amount_raw, category, description, website, region_group, resource_type, is_grant_like, sheet_name, row_number')
      .eq('id', req.params.id)
      .maybeSingle();

    if (error) {
      if (isMissingRelation(error)) return res.status(404).json({ error: 'Resource not found' });
      return res.status(500).json({ error: error.message });
    }
    if (!data) return res.status(404).json({ error: 'Resource not found' });
    res.json(data);
  } catch (err) {
    reportError(err, {
      tags: { area: 'api', route: 'resource_detail' },
      extra: { id: req.params.id },
    });
    res.status(500).json({ error: err.message });
  }
});

// =============================================================================
// GET /api/grants/stats — PUBLIC (homepage real numbers, prep for Pas 7)
// Returns total active grants + how many are evidence-verified.
// =============================================================================
router.get('/grants/stats', async (req, res) => {
  const supabase = tryGetSupabase();
  if (!supabase) return res.json({ total: 0, verified: 0 });
  try {
    const { count: total } = await supabase
      .from('grants').select('*', { count: 'exact', head: true })
      .eq('status', 'Activ');
    let verified = 0;
    try {
      const { count } = await supabase
        .from('grants').select('*', { count: 'exact', head: true })
        .eq('status', 'Activ')
        .in('evidence_status', ['verified_primary', 'verified_secondary']);
      verified = count || 0;
    } catch { /* evidence_status column may not exist pre-Pas 1 */ }
    res.json({ total: total || 0, verified });
  } catch (err) {
    console.error('GET /api/grants/stats error:', err.message);
    reportError(err, {
      tags: { area: 'api', route: 'grants_stats' },
    });
    res.json({ total: 0, verified: 0 });
  }
});

// =============================================================================
// GET /api/grants/match
// Returns top matching grants for the authenticated user's startup profile.
// Uses vector search (if OpenAI key set) or FTS fallback.
// MUST be registered BEFORE /grants/:id so Express doesn't capture "match" as :id
// =============================================================================
router.get('/grants/match', requireAuth, async (req, res) => {
  const supabase = tryGetSupabase();
  if (!supabase) return res.status(503).json({ error: 'Supabase neconfigurat' });

  try {
    const startup = await db.findOne('startups', { user_id: req.session.userId });
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
    reportError(err, {
      tags: { area: 'api', route: 'grants_match' },
      extra: { user_id: req.session?.userId || null },
    });
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

    // Per-user scores: computed (and cached 7 days) only when authenticated.
    // Anonymous visitors get the raw grant row — UI shows "log in for scores".
    let user_scores = null;
    if (req.session?.userId) {
      try {
        const { computeUserGrantScores } = require('../lib/score-engine');
        user_scores = await computeUserGrantScores(req.session.userId, req.params.id);
      } catch (e) {
        console.error('user_grant_scores compute error:', e.message);
      }
    }

    res.json({ ...data, user_scores });
  } catch (err) {
    console.error('GET /api/grants/:id error:', err.message);
    reportError(err, {
      tags: { area: 'api', route: 'grant_detail' },
      extra: { id: req.params.id },
    });
    res.status(500).json({ error: 'Eroare internă' });
  }
});

// =============================================================================
// GET /api/events — PUBLIC (Brief 04)
// Combines two sources:
//   1. events table — manually-curated external events (conferences, webinars,
//      pitch nights, hackathons)
//   2. grant deadlines — synthesized at request time from the grants table
//      where deadline parses to a future ISO date
// Query params:
//   ?country=    ilike filter on country / funder_country
//   ?type=       'conference' | 'pitch_event' | 'webinar' | 'workshop' |
//                'networking' | 'hackathon' | 'accelerator_call' | 'grant_deadline'
//   ?topic=      array contains
//   ?lang=       'ro' (default) | 'en' — controls grant link path
// =============================================================================
const RO_MONTHS = { ian:0, feb:1, mar:2, apr:3, mai:4, iun:5, iul:6, aug:7, sep:8, oct:9, noi:10, dec:11 };
function _parseEventsDeadline(s) {
  if (!s) return null;
  // ISO first
  let d = new Date(s);
  if (!isNaN(d) && d.getFullYear() > 2000) return d;
  // Romanian "22 Mai 2026"
  const m = String(s).match(/(\d{1,2})\s+(\w+)\s+(\d{4})/);
  if (m) {
    const month = RO_MONTHS[m[2].toLowerCase().slice(0, 3)];
    if (month !== undefined) {
      d = new Date(parseInt(m[3], 10), month, parseInt(m[1], 10));
      return isNaN(d) ? null : d;
    }
  }
  return null;
}

router.get('/events', async (req, res) => {
  const sb = tryGetSupabase();
  if (!sb) return res.json({ events: [], grant_deadlines: [] });

  const { country, type, topic } = req.query;
  const lang = (req.query.lang === 'en') ? 'en' : 'ro';

  // ── 1. External events from the events table ──────────────────────────────
  let events = [];
  if (type !== 'grant_deadline') {  // skip the table query if user only wants grant deadlines
    let q = sb.from('events')
      .select('*')
      .eq('status', 'upcoming')
      .gte('start_date', new Date().toISOString())
      .order('start_date', { ascending: true })
      .limit(100);
    if (country) q = q.ilike('country', `%${country}%`);
    if (type)    q = q.eq('event_type', type);
    if (topic)   q = q.contains('topics', [topic]);
    const { data, error } = await q;
    if (error) {
      // Pre-Brief-04 schema (events table missing): degrade to empty list.
      if (!/relation .* does not exist/i.test(error.message || '')) {
        console.error('GET /api/events events query error:', error.message);
      }
      events = [];
    } else {
      events = data || [];
    }
  }

  // ── 2. Grant deadlines synthesized as virtual events ──────────────────────
  let grantDeadlines = [];
  if (!type || type === 'grant_deadline') {  // skip when filtering to a non-deadline type
    try {
      let gq = sb.from('grants')
        .select('id, slug_ro, slug_en, nume_program, nume_program_en, ' +
                'short_summary_ro, short_summary_en, funder_name, funder_country, ' +
                'tara, deadline, suma_max, sector, application_url, evidence_status')
        .eq('status', 'Activ')
        .not('deadline', 'is', null)
        .limit(100);
      if (country) gq = gq.or(`tara.ilike.%${country}%,funder_country.ilike.%${country}%`);
      const { data: grants, error: gerr } = await gq;
      if (gerr) {
        if (!/column .* does not exist/i.test(gerr.message || '')) {
          console.error('GET /api/events grants query error:', gerr.message);
        }
        // Pre-Pas-1 columns missing → no grant deadlines emitted.
      } else {
        grantDeadlines = (grants || [])
          .map(g => ({ g, parsedDate: _parseEventsDeadline(g.deadline) }))
          .filter(x => x.parsedDate && x.parsedDate > new Date())
          .map(({ g, parsedDate }) => ({
            id:           'grant_' + g.id,
            slug_ro:      g.slug_ro,
            slug_en:      g.slug_en,
            title:        lang === 'en' ? (g.nume_program_en || g.nume_program) : g.nume_program,
            short_summary: lang === 'en' ? g.short_summary_en : g.short_summary_ro,
            event_type:   'grant_deadline',
            start_date:   parsedDate.toISOString(),
            country:      g.funder_country || g.tara || null,
            organizer_name: g.funder_name || null,
            max_amount:   g.suma_max,
            sector:       g.sector,
            url:          g.slug_ro
              ? (lang === 'en' && g.slug_en ? `/en/grants/${g.slug_en}` : `/ro/granturi/${g.slug_ro}`)
              : `/grant.html?id=${encodeURIComponent(g.id)}`,
            external_url: g.application_url,
            evidence_status: g.evidence_status,
          }))
          .sort((a, b) => new Date(a.start_date) - new Date(b.start_date));
      }
    } catch (err) {
      console.error('GET /api/events grant deadlines unexpected error:', err.message);
    }
  }

  res.json({ events, grant_deadlines: grantDeadlines });
});

// =============================================================================
// COMMENTS + REACTIONS — public read, auth write
// Polymorphic on (content_type, content_id). content_type ∈
// {'grant','blog_post','news_article'}; content_id is TEXT (UUIDs cast).
// =============================================================================
const VALID_CONTENT_TYPES = ['grant', 'blog_post', 'news_article'];
function _validateTarget(req, res) {
  const parsed = parseBody(
    req.method === 'GET' ? reactionSchema : commentSchema.pick({ content_type: true, content_id: true }),
    {
      content_type: req.query.content_type || req.body?.content_type,
      content_id: req.query.content_id || req.body?.content_id,
    }
  );
  if (!parsed.ok) {
    res.status(400).json({ error: 'invalid target', fields: parsed.error.fieldErrors });
    return null;
  }
  if (!VALID_CONTENT_TYPES.includes(parsed.data.content_type)) {
    res.status(400).json({ error: 'invalid content_type' });
    return null;
  }
  return parsed.data;
}

// GET /api/comments?content_type=...&content_id=... — public list
router.get('/comments', async (req, res) => {
  const sb = tryGetSupabase();
  if (!sb) return res.json({ comments: [], reactions: { like: 0 }, my_reaction: null });
  const t = _validateTarget(req, res);
  if (!t) return;
  try {
    const [{ data: comments }, { count }] = await Promise.all([
      sb.from('comments')
        .select('id, user_name, body, created_at')
        .eq('content_type', t.content_type)
        .eq('content_id', t.content_id)
        .eq('status', 'approved')
        .order('created_at', { ascending: true })
        .limit(200),
      sb.from('reactions')
        .select('*', { count: 'exact', head: true })
        .eq('content_type', t.content_type)
        .eq('content_id', t.content_id)
        .eq('kind', 'like'),
    ]);
    let myReaction = null;
    if (req.session?.userId) {
      const { data } = await sb.from('reactions')
        .select('id, kind')
        .eq('content_type', t.content_type)
        .eq('content_id', t.content_id)
        .eq('user_id', req.session.userId)
        .eq('kind', 'like')
        .maybeSingle();
      myReaction = data ? data.kind : null;
    }
    res.json({ comments: comments || [], reactions: { like: count || 0 }, my_reaction: myReaction });
  } catch (err) {
    if (/relation .* does not exist/i.test(err.message || '')) {
      return res.json({ comments: [], reactions: { like: 0 }, my_reaction: null });
    }
    console.error('GET /api/comments', err);
    res.status(500).json({ error: 'internal' });
  }
});

// POST /api/comments — auth required
router.post('/comments', requireAuth, async (req, res) => {
  const sb = tryGetSupabase();
  if (!sb) return res.status(503).json({ error: 'Supabase neconfigurat' });
  const t = _validateTarget(req, res);
  if (!t) return;
  const parsed = parseBody(commentSchema, { ...t, body: req.body?.body });
  if (!parsed.ok) return res.status(400).json({ error: 'Comentariu invalid', fields: parsed.error.fieldErrors });
  const { body } = parsed.data;
  // Look up user for denormalised email/name
  const user = await db.findOne('users', { id: req.session.userId });
  const userName = user ? [user.first_name, user.last_name].filter(Boolean).join(' ') : '';
  try {
    const { data, error } = await sb.from('comments').insert({
      content_type: parsed.data.content_type,
      content_id:   parsed.data.content_id,
      user_id:      req.session.userId,
      user_email:   user?.email || null,
      user_name:    userName || user?.email || 'Utilizator',
      body,
    }).select().maybeSingle();
    if (error) throw error;
    res.json({ ok: true, comment: data });
  } catch (err) {
    console.error('POST /api/comments', err);
    reportError(err, {
      tags: { area: 'api', route: 'comments_create' },
      extra: { user_id: req.session?.userId || null, content_type: parsed.data.content_type },
    });
    res.status(500).json({ error: 'Nu am putut salva comentariul' });
  }
});

// DELETE /api/comments/:id — author or admin only
router.delete('/comments/:id', requireAuth, async (req, res) => {
  const sb = tryGetSupabase();
  if (!sb) return res.status(503).json({ error: 'Supabase neconfigurat' });
  try {
    const { data: c } = await sb.from('comments').select('user_id').eq('id', req.params.id).maybeSingle();
    if (!c) return res.status(404).json({ error: 'not found' });
    if (c.user_id !== req.session.userId) {
      const admin = await isAdminRequest(req);
      if (!admin) return res.status(403).json({ error: 'forbidden' });
    }
    const { error } = await sb.from('comments').update({ status: 'deleted' }).eq('id', req.params.id);
    if (error) throw error;
    return res.json({ ok: true });
  } catch (err) {
    console.error('DELETE /api/comments secure', err.message);
    reportError(err, {
      tags: { area: 'api', route: 'comments_delete' },
      extra: { id: req.params.id, user_id: req.session?.userId || null },
    });
    return res.status(500).json({ error: 'Nu am putut șterge comentariul' });
  }
});

// POST /api/reactions/toggle — auth required, idempotent like-toggle
router.post('/reactions/toggle', requireAuth, async (req, res) => {
  const sb = tryGetSupabase();
  if (!sb) return res.status(503).json({ error: 'Supabase neconfigurat' });
  const t = _validateTarget(req, res);
  if (!t) return;
  const parsed = parseBody(reactionSchema, t);
  if (!parsed.ok) return res.status(400).json({ error: 'Reacție invalidă', fields: parsed.error.fieldErrors });
  try {
    const { data: existing } = await sb.from('reactions')
      .select('id')
      .eq('content_type', parsed.data.content_type)
      .eq('content_id', parsed.data.content_id)
      .eq('user_id', req.session.userId)
      .eq('kind', 'like')
      .maybeSingle();
    if (existing) {
      await sb.from('reactions').delete().eq('id', existing.id);
      res.json({ ok: true, reacted: false });
    } else {
      await sb.from('reactions').insert({
        content_type: parsed.data.content_type,
        content_id:   parsed.data.content_id,
        user_id:      req.session.userId,
        kind:         'like',
      });
      res.json({ ok: true, reacted: true });
    }
  } catch (err) {
    console.error('POST /api/reactions/toggle', err);
    reportError(err, {
      tags: { area: 'api', route: 'reactions_toggle' },
      extra: { user_id: req.session?.userId || null, content_type: parsed.data.content_type },
    });
    res.status(500).json({ error: 'Nu am putut salva reacția' });
  }
});

// =============================================================================
// GET /api/profile
// =============================================================================
router.get('/profile', requireAuth, async (req, res) => {
  const user    = await db.findOne('users',    { id: req.session.userId });
  const startup = await db.findOne('startups', { user_id: req.session.userId });
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
router.put('/profile', requireAuth, async (req, res) => {
  const parsed = parseBody(profileSchema, req.body || {});
  if (!parsed.ok) {
    return res.status(400).json({ error: 'Profil invalid', fields: parsed.error.fieldErrors });
  }

  const {
    startupName, website, pitch, sector, stage, trl, country,
    teamSize, github, goals, amountIdx, horizon, priority,
  } = parsed.data;

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

  const existing = await db.findOne('startups', { user_id: req.session.userId });
  let startup;
  if (existing) {
    startup = await db.update('startups', { user_id: req.session.userId }, data);
  } else {
    startup = await db.insert('startups', { user_id: req.session.userId, ...data });
  }

  // Sync to Supabase for Scoring v2 (best-effort, non-blocking)
  try {
    const user = await db.findOne('users', { id: req.session.userId });
    const { syncProfile } = require('../db/profile-sync');
    syncProfile(req.session.userId, user?.email, {
      startupName, website, pitch, sector, stage, trl, country,
      teamSize, github, goals, amountIdx, horizon, priority,
    }).catch(err => console.warn('profile sync failed:', err.message));
  } catch (_) { /* non-fatal */ }

  res.json({ ok: true, startup });
});

router.delete('/profile', requireAuth, async (req, res) => {
  try {
    await db.remove('pipeline_items', { user_id: req.session.userId });
    await db.remove('saved_grants', { user_id: req.session.userId });
    await db.remove('startups', { user_id: req.session.userId });
    await db.remove('users', { id: req.session.userId });
    req.session.destroy(() => {});
    res.clearCookie('elig.sid');
    res.json({ ok: true });
  } catch (err) {
    console.error('DELETE /api/profile', err.message);
    reportError(err, {
      tags: { area: 'api', route: 'profile_delete' },
      extra: { user_id: req.session?.userId || null },
    });
    res.status(500).json({ error: 'Nu am putut șterge contul' });
  }
});

// =============================================================================
// DELETE /api/profile — GDPR right to erasure
// Cascaded deletion of all user data, then session destruction.
// =============================================================================
router.delete('/profile', requireAuth, async (req, res) => {
  const sb = tryGetSupabase();
  if (!sb) return res.status(503).json({ error: 'Supabase neconfigurat' });

  const userId = req.session.userId;
  try {
    // Order matters: children before parents
    await sb.from('pipeline_items').delete().eq('user_id', userId);
    await sb.from('reactions').delete().eq('user_id', userId);
    await sb.from('comments').update({ user_name: 'Utilizator sters', user_email: null, user_id: null }).eq('user_id', userId);
    await sb.from('saved_grants').delete().eq('user_id', userId);
    await sb.from('user_grant_scores').delete().eq('user_id', userId);
    await sb.from('user_profiles').delete().eq('user_id', userId);
    await sb.from('startups').delete().eq('user_id', userId);
    await sb.from('profiles').delete().eq('id', userId);

    req.session.destroy(() => {
      res.clearCookie('connect.sid');
      res.json({ ok: true, message: 'Toate datele au fost sterse' });
    });
  } catch (err) {
    console.error('DELETE /api/profile error:', err);
    res.status(500).json({ error: 'Eroare la stergerea datelor' });
  }
});

// =============================================================================
// GET /api/dashboard
// Returns readiness + completeness + top 3 matched grants + alerts
// =============================================================================
router.get('/dashboard', requireAuth, async (req, res) => {
  const startup  = await db.findOne('startups', { user_id: req.session.userId });
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
      reportError(err, {
        tags: { area: 'api', route: 'dashboard_matching' },
        extra: { user_id: req.session?.userId || null },
      });
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
router.get('/pipeline', requireAuth, async (req, res) => {
  const items = await db.findAll('pipeline_items', { user_id: req.session.userId });
  res.json({ ok: true, items });
});

// =============================================================================
// POST /api/pipeline
// =============================================================================
router.post('/pipeline', requireAuth, async (req, res) => {
  const parsed = parseBody(pipelineSchema, req.body || {});
  if (!parsed.ok) {
    return res.status(400).json({ error: 'Element pipeline invalid', fields: parsed.error.fieldErrors });
  }
  const { grantId, grantName, stage, notes, deadline } = parsed.data;
  const item = await db.insert('pipeline_items', {
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
