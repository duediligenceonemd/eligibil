'use strict';

/**
 * routes/artefacts.js — pitch-deck upload + AI analysis pipeline.
 *
 *   POST /api/artefacts/upload  multipart/form-data { file: pitch.pdf }
 *   GET  /api/artefacts          → list (current user, last 20)
 *   GET  /api/artefacts/:id      → single artefact + scores
 *   POST /api/artefacts/:id/rescore → re-trigger analysis (admin / debug)
 *
 * Storage: local /tmp/uploads/<uuid>/<ts>_<name>.pdf — cleaned by a daily
 * cron (see scripts/cleanup-old-artefacts.js). Phase 2 → Supabase Storage.
 *
 * Analysis path:
 *   1. Save row with status='pending'
 *   2. analyzeArtefact() runs async (non-blocking response)
 *   3. If ANTHROPIC_API_KEY is set: call Claude, parse JSON, save scores
 *   4. If not: emit deterministic stub scores so the rest of the product
 *      (dashboard widget, grant page wiring) works end-to-end without
 *      paying for tokens. status='awaiting_credits' makes the UI honest.
 */

const express = require('express');
const multer  = require('multer');
const path    = require('path');
const fs      = require('fs');
const crypto  = require('crypto');

const usersDb           = require('../db/users-supabase');
const { getSupabase }   = require('../db/supabase');

const router = express.Router();

// ── Auth gate ─────────────────────────────────────────────────────────────
function requireAuth(req, res, next) {
  if (!req.session?.userId) return res.status(401).json({ error: 'Neautentificat' });
  next();
}
router.use(requireAuth);

// ── Multer storage ────────────────────────────────────────────────────────
const TMP_ROOT = path.join(__dirname, '..', 'tmp', 'uploads');
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const dir = path.join(TMP_ROOT, String(req.session.userId));
      fs.mkdirSync(dir, { recursive: true });
      cb(null, dir);
    },
    filename: (req, file, cb) => {
      const ts   = Date.now();
      const safe = (file.originalname || 'pitch.pdf').replace(/[^a-zA-Z0-9.-]/g, '_').slice(-80);
      cb(null, `${ts}_${safe}`);
    },
  }),
  limits: { fileSize: 25 * 1024 * 1024 },   // 25 MB
  fileFilter: (req, file, cb) => {
    // Accept PDF + Office docs for the per-product upload flow.
    const ACCEPTED = new Set([
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',  // pptx
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',    // docx
      'video/mp4', 'video/quicktime',
    ]);
    if (!ACCEPTED.has(file.mimetype)) {
      return cb(new Error('Format neacceptat. Folosește PDF, PPTX, DOCX, MP4 sau MOV.'));
    }
    cb(null, true);
  },
});

// Map slug → artefact_type column value. Falls back to pitch_deck for unknown.
const PRODUCT_TO_ARTEFACT_TYPE = {
  pitch: 'pitch_deck',
  video: 'video_pitch',
  wp:    'whitepaper',
  trl:   'trl_eval',
};

// ── AI provider: Bedrock → Anthropic SDK fallback ───────────────────────────
const { isBedrockEnabled, bedrockChat } = require('../lib/bedrock');

let _anthropic = null;
function getAnthropic() {
  if (_anthropic) return _anthropic;
  if (!process.env.ANTHROPIC_API_KEY) return null;
  const Anthropic = require('@anthropic-ai/sdk');
  _anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return _anthropic;
}
const ANALYSIS_MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-5-20250929';
const BEDROCK_ANALYSIS_MODEL = process.env.AWS_CHAT_MODEL || 'anthropic.claude-sonnet-4-5-20250929-v1:0';

// =============================================================================
// POST /api/artefacts/upload
// =============================================================================
router.post('/upload', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Nu s-a primit fișier' });

  const sb = getSupabase();
  if (!sb) {
    fs.unlinkSync(req.file.path);
    return res.status(503).json({ error: 'Supabase neconfigurat' });
  }

  try {
    const startup = await usersDb.findOne('startups', { user_id: req.session.userId });

    // Compute SHA-256
    const buffer = fs.readFileSync(req.file.path);
    const sha    = crypto.createHash('sha256').update(buffer).digest('hex');

    // Dedup
    const { data: existing } = await sb
      .from('artefacts')
      .select('id, status')
      .eq('user_id', req.session.userId)
      .eq('file_sha256', sha)
      .maybeSingle();
    if (existing) {
      fs.unlinkSync(req.file.path);
      return res.json({ ok: true, artefact_id: existing.id, deduped: true, status: existing.status });
    }

    // Resolve product slug → artefact_type. Stays compatible with the
    // pre-existing upload flow which doesn't pass ?product= at all.
    const productSlug = String(req.query.product || '').toLowerCase();
    const artefactType = PRODUCT_TO_ARTEFACT_TYPE[productSlug] || 'pitch_deck';
    const productKind  = PRODUCT_TO_ARTEFACT_TYPE[productSlug] ? productSlug : null;

    // Mark previous current artefact of THIS type as superseded
    await sb.from('artefacts')
      .update({ is_current: false })
      .eq('user_id', req.session.userId)
      .eq('artefact_type', artefactType)
      .eq('is_current', true);

    const { data: artefact, error } = await sb.from('artefacts').insert({
      user_id:         req.session.userId,
      startup_id:      startup?.id || null,
      artefact_type:   artefactType,
      product_kind:    productKind,
      file_name:       req.file.originalname,
      file_size_bytes: req.file.size,
      file_path:       req.file.path,
      file_sha256:     sha,
      status:          'pending',
      is_current:      true,
    }).select().single();
    if (error) throw error;

    // Fire-and-forget analysis
    analyzeArtefact(artefact.id, req.file.path, startup, req.session.userId)
      .catch(err => console.error(`Artefact ${artefact.id} analysis failed:`, err.message));

    res.json({ ok: true, artefact_id: artefact.id, status: 'pending' });
  } catch (err) {
    if (req.file?.path && fs.existsSync(req.file.path)) {
      try { fs.unlinkSync(req.file.path); } catch {}
    }
    console.error('POST /api/artefacts/upload error:', err);
    res.status(500).json({ error: err.message });
  }
});

// =============================================================================
// GET /api/artefacts — list (current user)
// =============================================================================
router.get('/', async (req, res) => {
  const sb = getSupabase();
  if (!sb) return res.status(503).json({ error: 'Supabase neconfigurat' });
  const { data, error } = await sb.from('artefacts')
    .select('id, artefact_type, file_name, file_size_bytes, page_count, status, uploaded_at, analyzed_at, is_current, error_message')
    .eq('user_id', req.session.userId)
    .order('uploaded_at', { ascending: false })
    .limit(20);
  if (error) return res.status(500).json({ error: error.message });
  res.json(data || []);
});

// =============================================================================
// GET /api/artefacts/current — current artefact + scores (for dashboard widget)
// =============================================================================
router.get('/current', async (req, res) => {
  const sb = getSupabase();
  if (!sb) return res.status(503).json({ error: 'Supabase neconfigurat' });

  const { data: artefact } = await sb.from('artefacts')
    .select('*')
    .eq('user_id', req.session.userId)
    .eq('is_current', true)
    .eq('artefact_type', 'pitch_deck')
    .maybeSingle();

  if (!artefact) return res.json({ artefact: null, scores: null });

  let scores = null;
  if (artefact.status === 'analyzed' || artefact.status === 'awaiting_credits') {
    const { data } = await sb.from('artefact_scores')
      .select('*')
      .eq('artefact_id', artefact.id)
      .maybeSingle();
    scores = data;
  }
  res.json({ artefact, scores });
});

// =============================================================================
// GET /api/artefacts/:id — full detail
// =============================================================================
router.get('/:id', async (req, res) => {
  const sb = getSupabase();
  if (!sb) return res.status(503).json({ error: 'Supabase neconfigurat' });

  const { data: artefact } = await sb.from('artefacts')
    .select('*')
    .eq('id', req.params.id)
    .eq('user_id', req.session.userId)
    .maybeSingle();
  if (!artefact) return res.status(404).json({ error: 'Not found' });

  let scores = null;
  if (artefact.status === 'analyzed' || artefact.status === 'awaiting_credits') {
    const { data } = await sb.from('artefact_scores')
      .select('*').eq('artefact_id', artefact.id).maybeSingle();
    scores = data;
  }
  res.json({ artefact, scores });
});

// =============================================================================
// Async analyzer — uses Claude when ANTHROPIC_API_KEY is set, else stub
// =============================================================================
async function analyzeArtefact(artefactId, filePath, startup, userId) {
  const sb = getSupabase();
  await sb.from('artefacts').update({ status: 'processing' }).eq('id', artefactId);

  let rawText = '';
  let pageCount = 0;
  try {
    const pdfParse = require('pdf-parse');
    const dataBuf  = fs.readFileSync(filePath);
    const out      = await pdfParse(dataBuf);
    rawText        = out.text || '';
    pageCount      = out.numpages || 0;
  } catch (err) {
    console.error('pdf-parse failed:', err.message);
    await sb.from('artefacts').update({
      status: 'failed',
      error_message: 'PDF extraction failed: ' + (err.message || '').slice(0, 300),
    }).eq('id', artefactId);
    return;
  }

  const anthropic = getAnthropic();
  const analysis  = anthropic
    ? await runClaudeAnalysis(anthropic, rawText, pageCount, startup)
    : buildStubAnalysis(rawText, pageCount, startup);

  const newStatus = anthropic ? 'analyzed' : 'awaiting_credits';

  await sb.from('artefact_scores').insert({
    artefact_id:        artefactId,
    readiness_score:    analysis.readiness_score,
    completeness_score: analysis.completeness_score,
    fit_score:          analysis.fit_score,
    dimensions:         analysis.dimensions || [],
    extracted_entities: analysis.extracted_entities || {},
    strengths:          analysis.strengths || [],
    gaps:               analysis.gaps || [],
    red_flags:          analysis.red_flags || [],
    llm_model:          analysis.llm_model || (anthropic ? ANALYSIS_MODEL : 'stub-v1'),
    llm_input_tokens:   analysis.input_tokens  || 0,
    llm_output_tokens:  analysis.output_tokens || 0,
    llm_cost_usd:       analysis.cost_usd      || 0,
  });

  await sb.from('artefacts').update({
    status:      newStatus,
    raw_text:    rawText.slice(0, 100000),
    page_count:  pageCount,
    analyzed_at: new Date().toISOString(),
  }).eq('id', artefactId);

  // Invalidate per-grant cache so dashboard reflects new artefact immediately
  await sb.from('user_grant_scores').delete().eq('user_id', userId);

  console.log(`[artefact] ${artefactId} → ${newStatus} (readiness=${analysis.readiness_score}, fit=${analysis.fit_score})`);
}

// Stub analyzer — deterministic scores derived from heuristics so the UI is
// populated and demo-able without burning Claude tokens. Once
// ANTHROPIC_API_KEY is set + has credit, this path is bypassed.
function buildStubAnalysis(rawText, pageCount, startup) {
  const text = (rawText || '').toLowerCase();
  const has  = (kw) => text.includes(kw) ? 1 : 0;

  const presence = {
    problem:  has('problem') + has('problema'),
    solution: has('solution') + has('soluție') + has('solutie'),
    market:   has('tam') + has('sam') + has('som') + has('market size'),
    business: has('business model') + has('revenue') + has('monetiz'),
    traction: has('users') + has('mrr') + has('arr') + has('pilot') + has('clienți'),
    team:     has('team') + has('echipă') + has('founders'),
    ask:      has('ask') + has('seeking') + has('raising'),
    trl:      has('trl'),
  };

  const baseScore = (k) => Math.min(95, 35 + presence[k] * 22);

  const dimensions = [
    { dim: 'problem_clarity',         score: baseScore('problem'),   observations: 'Stub — set ANTHROPIC_API_KEY for real analysis.', suggestions: 'Add 1 explicit problem statement slide.' },
    { dim: 'solution_maturity',       score: baseScore('solution'),  observations: 'Stub heuristic.', suggestions: 'Demo screenshots help.' },
    { dim: 'market_potential',        score: baseScore('market'),    observations: 'Stub heuristic.', suggestions: 'Quantify TAM/SAM/SOM.' },
    { dim: 'business_model',          score: baseScore('business'),  observations: 'Stub heuristic.', suggestions: 'Show unit economics.' },
    { dim: 'traction',                score: baseScore('traction'),  observations: 'Stub heuristic.', suggestions: 'Add KPI dashboard slide.' },
    { dim: 'team_capacity',           score: baseScore('team'),      observations: 'Stub heuristic.', suggestions: 'List founders + key hires.' },
    { dim: 'financial_readiness',     score: baseScore('ask'),       observations: 'Stub heuristic.', suggestions: 'State the ask + use of funds.' },
    { dim: 'technical_maturity',      score: baseScore('trl'),       observations: 'Stub heuristic.', suggestions: 'Declare TRL explicitly.' },
    { dim: 'application_completeness',score: Math.min(95, 30 + pageCount * 4), observations: 'Stub heuristic.', suggestions: '12–15 slides is the sweet spot.' },
  ];

  const avg = (arr) => Math.round(arr.reduce((s, x) => s + x, 0) / arr.length);
  const readiness    = avg(dimensions.map(d => d.score));
  const completeness = avg(Object.values(presence).map(v => Math.min(95, 30 + v * 25)));
  const fit          = readiness;

  return {
    readiness_score:    readiness,
    completeness_score: completeness,
    fit_score:          fit,
    dimensions,
    extracted_entities: {
      sector:        startup?.sector || null,
      stage:         startup?.stage  || null,
      trl_estimate:  null,
      team_size:     null,
      _stub:         true,
    },
    strengths: ['Conține text pe ' + pageCount + ' pagini', 'Format PDF parseabil'],
    gaps:      ['Analiza Claude indisponibilă — credit AWS în așteptare', 'Re-uploadează după activarea creditelor pentru scoruri reale'],
    red_flags: [],
    llm_model:     'stub-v1',
    input_tokens:  0,
    output_tokens: 0,
    cost_usd:      0,
  };
}

async function runClaudeAnalysis(anthropic, rawText, pageCount, startup) {
  const MAX_CHARS = 50000;
  const textForAnalysis = rawText.length > MAX_CHARS
    ? rawText.slice(0, MAX_CHARS) + '\n\n[...trunchiat...]'
    : rawText;

  const profileContext = JSON.stringify({
    sector:  startup?.sector,
    stage:   startup?.stage,
    country: startup?.country,
    pitch:   startup?.pitch,
    trl:     startup?.trl,
  }, null, 2);

  const systemPrompt = `Ești un expert în evaluarea pitch deck-urilor pentru aplicații la granturi și acceleratoare.
Primești profilul declarat al startupului și textul extras dintr-un pitch deck PDF.

Analizează pe 9 dimensiuni (fiecare: scor 0-100, observations 2-3 fraze factuale, suggestions 1-2 acțiuni concrete):
1. problem_clarity
2. solution_maturity
3. market_potential
4. business_model
5. traction
6. team_capacity
7. financial_readiness
8. technical_maturity
9. application_completeness

Apoi 3 scoruri agregate 0-100:
- readiness_score (media ponderată)
- completeness_score (procent elemente standard prezente)
- fit_score (potrivirea profil ↔ conținut deck)

Plus extracted_entities (factual din deck), strengths (2-4 bullets), gaps (2-4 bullets), red_flags (0-3).

Răspunde DOAR cu JSON valid (fără markdown, fără preamble) cu această schemă:
{
  "readiness_score": int, "completeness_score": int, "fit_score": int,
  "dimensions": [{"dim": "...", "score": int, "observations": "...", "suggestions": "..."}],
  "extracted_entities": {...},
  "strengths": ["..."], "gaps": ["..."], "red_flags": ["..."]
}`;

  const userPrompt = `## Profil declarat
\`\`\`json
${profileContext}
\`\`\`

## Text extras (${pageCount} pagini)
${textForAnalysis}

Returnează JSON conform schemei.`;

  let text, usage, modelUsed;

  // 1. Try AWS Bedrock
  if (isBedrockEnabled('chat')) {
    try {
      const result = await bedrockChat({
        model: BEDROCK_ANALYSIS_MODEL,
        maxTokens: 4000,
        system: systemPrompt,
        userMessage: userPrompt,
      });
      text = result.text.trim();
      usage = result.usage;
      modelUsed = BEDROCK_ANALYSIS_MODEL;
    } catch (err) {
      console.error('Bedrock analysis error, falling back to Anthropic:', err.message);
    }
  }

  // 2. Fallback to Anthropic SDK
  if (!text && anthropic) {
    const response = await anthropic.messages.create({
      model:      ANALYSIS_MODEL,
      max_tokens: 4000,
      system:     systemPrompt,
      messages:   [{ role: 'user', content: userPrompt }],
    });
    text = response.content[0].text.trim();
    usage = response.usage;
    modelUsed = ANALYSIS_MODEL;
  }

  if (!text) throw new Error('No AI provider available for analysis (set AWS or ANTHROPIC keys)');

  const clean  = text.replace(/^```json\s*/, '').replace(/\s*```$/, '');
  const parsed = JSON.parse(clean);

  // Cost estimate
  const m = modelUsed;
  const inRate  = m.includes('opus') ? 15 : 3;
  const outRate = m.includes('opus') ? 75 : 15;
  const cost = ((usage.input_tokens || 0) * inRate + (usage.output_tokens || 0) * outRate) / 1e6;

  return {
    ...parsed,
    llm_model:     modelUsed,
    input_tokens:  usage.input_tokens || 0,
    output_tokens: usage.output_tokens || 0,
    cost_usd:      Number(cost.toFixed(4)),
  };
}

module.exports = router;
