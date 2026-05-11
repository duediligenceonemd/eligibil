# Brief 03 — Pipeline artefact: PDF pitch deck → analiză Claude → 3 scoruri

**Pentru:** Claude Code
**Working dir:** `C:\Users\Zinaida\ELIGIBIL`
**Durată estimată:** 5-6 zile
**Output:** Upload PDF → extract → Claude API → scoruri salvate → afișate pe dashboard și pe pagina grantului

---

## Context

Decizii confirmate:
- Doar **PDF pitch deck** în prima fază (NU video, NU whitepaper, NU website)
- Analiză cu **Anthropic Claude** (`ANTHROPIC_API_KEY` deja există în `.env`)
- Output: 3 scoruri normalizate 0-100 + breakdown per dimensiune

eligibil.org are deja:
- Schema `grants` îmbogățită (după Brief 01) cu `evaluation_criteria` JSONB
- Schema `user_profiles` cu embedding via `db/profile-sync.js`
- Tabel `user_pool_stats` cu agregate
- `score_grant_v2()` pentru Match Score dinamic
- Grant detail page cu placeholder pentru Readiness + Confidence

---

## Arhitectură

```
User uploads PDF
       ↓
Multer middleware → /tmp/uploads/{userId}/{timestamp}.pdf
       ↓
pdf-parse extrage text + metadata
       ↓
Anthropic Claude API (claude-opus-4-5 sau claude-sonnet-4-5)
   • Analizează pe 9 dimensiuni
   • Returnează JSON structurat
       ↓
Salvează în Supabase: artefacts + artefact_scores
       ↓
Trigger recompute: per (user, grant) → readiness + confidence
       ↓
Dashboard + grant page citesc scorurile noi
```

---

## Pas 1 — Schema (1 zi)

Creează `scripts/supabase-artefacts-schema.sql`:

```sql
-- ============================================================================
-- eligibil.org — Artefacts schema
-- Stores user-uploaded artefacts (pitch deck PDF) + AI analysis results
-- ============================================================================

CREATE TABLE IF NOT EXISTS artefacts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         INTEGER NOT NULL,                  -- references local users
  startup_id      INTEGER NOT NULL,                  -- references local startups

  -- File metadata
  artefact_type   TEXT NOT NULL CHECK (artefact_type IN ('pitch_deck', 'whitepaper', 'video_url', 'website_url')),
  file_name       TEXT,
  file_size_bytes INTEGER,
  file_path       TEXT,                              -- where stored (local /tmp or S3)
  file_sha256     TEXT,                              -- dedup same file uploaded twice

  -- Extracted content
  raw_text        TEXT,                              -- full extracted text
  page_count      INTEGER,
  language_detected TEXT,                            -- 'ro' | 'en' | 'mixed'

  -- Status
  status          TEXT NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending', 'processing', 'analyzed', 'failed')),
  error_message   TEXT,

  -- Audit
  uploaded_at     TIMESTAMPTZ DEFAULT now(),
  analyzed_at     TIMESTAMPTZ,
  superseded_by   UUID REFERENCES artefacts(id) ON DELETE SET NULL,  -- new upload replaces old
  is_current      BOOLEAN DEFAULT true               -- only latest per user is "current"
);

CREATE INDEX IF NOT EXISTS artefacts_user_id_idx ON artefacts (user_id);
CREATE INDEX IF NOT EXISTS artefacts_startup_id_idx ON artefacts (startup_id);
CREATE INDEX IF NOT EXISTS artefacts_status_idx ON artefacts (status);
CREATE INDEX IF NOT EXISTS artefacts_current_idx ON artefacts (user_id, is_current) WHERE is_current = true;
CREATE UNIQUE INDEX IF NOT EXISTS artefacts_sha_idx ON artefacts (user_id, file_sha256) WHERE file_sha256 IS NOT NULL;

-- ============================================================================
-- Artefact analysis scores (one row per artefact, JSONB for flexible dimensions)
-- ============================================================================

CREATE TABLE IF NOT EXISTS artefact_scores (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artefact_id     UUID NOT NULL REFERENCES artefacts(id) ON DELETE CASCADE,

  -- Top-level scores (0-100)
  readiness_score    SMALLINT CHECK (readiness_score BETWEEN 0 AND 100),
  completeness_score SMALLINT CHECK (completeness_score BETWEEN 0 AND 100),
  fit_score          SMALLINT CHECK (fit_score BETWEEN 0 AND 100),

  -- Detailed breakdown (one entry per dimension)
  -- Format: [
  --   {dim: 'Problem clarity', score: 75, observations: '...', suggestions: '...'},
  --   {dim: 'Solution maturity', score: 60, ...},
  --   ...
  -- ]
  dimensions      JSONB NOT NULL DEFAULT '[]'::jsonb,

  -- Extracted entities (used for cross-check with grant requirements)
  -- Format: {sector: 'AI', stage: 'MVP', traction_summary: '...', team_size: 5,
  --          trl_estimate: 4, ip_status: 'pending', revenue_summary: '...', ...}
  extracted_entities JSONB DEFAULT '{}'::jsonb,

  -- Strengths and gaps (for UI display)
  strengths       TEXT[],
  gaps            TEXT[],
  red_flags       TEXT[],

  -- Meta
  llm_model       TEXT,                              -- 'claude-opus-4-5'
  llm_input_tokens  INTEGER,
  llm_output_tokens INTEGER,
  llm_cost_usd    NUMERIC(8,4),
  analyzed_at     TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS artefact_scores_artefact_idx ON artefact_scores (artefact_id);

-- ============================================================================
-- Per-grant readiness/confidence scores (computed combining artefact + grant requirements)
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_grant_scores (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         INTEGER NOT NULL,
  grant_id        TEXT NOT NULL REFERENCES grants(id) ON DELETE CASCADE,

  match_score     SMALLINT CHECK (match_score BETWEEN 0 AND 100),
  readiness_score SMALLINT CHECK (readiness_score BETWEEN 0 AND 100),
  confidence_score SMALLINT CHECK (confidence_score BETWEEN 0 AND 100),
  effort_score    SMALLINT CHECK (effort_score BETWEEN 0 AND 100),
  urgency_score   SMALLINT CHECK (urgency_score BETWEEN 0 AND 100),

  -- Why? Breakdown
  match_breakdown      JSONB,
  readiness_breakdown  JSONB,
  confidence_breakdown JSONB,

  -- Cache invalidation
  computed_at     TIMESTAMPTZ DEFAULT now(),
  expires_at      TIMESTAMPTZ DEFAULT (now() + interval '7 days'),

  UNIQUE(user_id, grant_id)
);

CREATE INDEX IF NOT EXISTS user_grant_scores_user_idx ON user_grant_scores (user_id);
CREATE INDEX IF NOT EXISTS user_grant_scores_grant_idx ON user_grant_scores (grant_id);
CREATE INDEX IF NOT EXISTS user_grant_scores_expires_idx ON user_grant_scores (expires_at);
```

Aplică:
```bash
node scripts/push-schema.js scripts/supabase-artefacts-schema.sql
```

---

## Pas 2 — Upload endpoint (1 zi)

Instalează dependențe noi:
```bash
npm install multer @anthropic-ai/sdk pdf-parse
```

Creează `routes/artefacts.js`:

```javascript
'use strict';

const express = require('express');
const multer  = require('multer');
const path    = require('path');
const fs      = require('fs');
const crypto  = require('crypto');
const pdf     = require('pdf-parse');
const Anthropic = require('@anthropic-ai/sdk');

const db = require('../db/database');
const { getSupabase } = require('../db/supabase');

const router = express.Router();

// Auth
function requireAuth(req, res, next) {
  if (!req.session?.userId) return res.status(401).json({ error: 'Neautentificat' });
  next();
}
router.use(requireAuth);

// Storage config — local /tmp dir, will move to S3/Supabase Storage in Phase 2
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const dir = path.join(__dirname, '..', 'tmp', 'uploads', String(req.session.userId));
      fs.mkdirSync(dir, { recursive: true });
      cb(null, dir);
    },
    filename: (req, file, cb) => {
      const ts = Date.now();
      const safe = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
      cb(null, `${ts}_${safe}`);
    },
  }),
  limits: { fileSize: 25 * 1024 * 1024 }, // 25 MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== 'application/pdf') {
      return cb(new Error('Doar PDF acceptat în această fază'));
    }
    cb(null, true);
  },
});

// Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const ANALYSIS_MODEL = process.env.ANTHROPIC_MODEL || 'claude-opus-4-5';

// ============================================================================
// POST /api/artefacts/upload
// Body: multipart/form-data with field "file"
// ============================================================================
router.post('/upload', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Nu s-a primit fișier' });

  const sb = getSupabase();
  if (!sb) {
    fs.unlinkSync(req.file.path);
    return res.status(503).json({ error: 'Supabase neconfigurat' });
  }

  const startup = db.findOne('startups', { user_id: req.session.userId });
  if (!startup) {
    fs.unlinkSync(req.file.path);
    return res.status(400).json({ error: 'Profil startup incomplet' });
  }

  try {
    // 1. Compute SHA-256 of uploaded file
    const buffer = fs.readFileSync(req.file.path);
    const sha = crypto.createHash('sha256').update(buffer).digest('hex');

    // 2. Check if already uploaded (dedup)
    const { data: existing } = await sb
      .from('artefacts')
      .select('id, status')
      .eq('user_id', req.session.userId)
      .eq('file_sha256', sha)
      .maybeSingle();

    if (existing) {
      fs.unlinkSync(req.file.path);
      return res.json({ ok: true, artefact_id: existing.id, deduped: true });
    }

    // 3. Mark previous artefact as not current
    await sb
      .from('artefacts')
      .update({ is_current: false })
      .eq('user_id', req.session.userId)
      .eq('artefact_type', 'pitch_deck')
      .eq('is_current', true);

    // 4. Insert pending row
    const { data: artefact, error } = await sb
      .from('artefacts')
      .insert({
        user_id: req.session.userId,
        startup_id: startup.id,
        artefact_type: 'pitch_deck',
        file_name: req.file.originalname,
        file_size_bytes: req.file.size,
        file_path: req.file.path,
        file_sha256: sha,
        status: 'pending',
        is_current: true,
      })
      .select()
      .single();

    if (error) throw error;

    // 5. Kick off async analysis (non-blocking)
    analyzeArtefact(artefact.id, req.file.path, startup).catch(err => {
      console.error(`Artefact ${artefact.id} analysis failed:`, err);
    });

    res.json({ ok: true, artefact_id: artefact.id, status: 'pending' });
  } catch (err) {
    if (req.file.path && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    console.error('POST /api/artefacts/upload error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ============================================================================
// GET /api/artefacts/:id — status + scores
// ============================================================================
router.get('/:id', async (req, res) => {
  const sb = getSupabase();
  const { data: artefact } = await sb
    .from('artefacts')
    .select('*')
    .eq('id', req.params.id)
    .eq('user_id', req.session.userId)
    .single();

  if (!artefact) return res.status(404).json({ error: 'Not found' });

  let scores = null;
  if (artefact.status === 'analyzed') {
    const { data } = await sb
      .from('artefact_scores')
      .select('*')
      .eq('artefact_id', artefact.id)
      .single();
    scores = data;
  }

  res.json({ artefact, scores });
});

// ============================================================================
// GET /api/artefacts — list current user artefacts
// ============================================================================
router.get('/', async (req, res) => {
  const sb = getSupabase();
  const { data } = await sb
    .from('artefacts')
    .select('id, artefact_type, file_name, status, uploaded_at, analyzed_at, is_current')
    .eq('user_id', req.session.userId)
    .order('uploaded_at', { ascending: false })
    .limit(20);
  res.json(data || []);
});

// ============================================================================
// Async analysis function
// ============================================================================
async function analyzeArtefact(artefactId, filePath, startup) {
  const sb = getSupabase();

  await sb.from('artefacts').update({ status: 'processing' }).eq('id', artefactId);

  try {
    // 1. Extract text
    const dataBuffer = fs.readFileSync(filePath);
    const pdfData = await pdf(dataBuffer);
    const rawText = pdfData.text;
    const pageCount = pdfData.numpages;

    // Truncate if too long (Claude context limit safety)
    const MAX_CHARS = 50000;
    const textForAnalysis = rawText.length > MAX_CHARS
      ? rawText.slice(0, MAX_CHARS) + '\n\n[...trunchiat...]'
      : rawText;

    // 2. Build profile context
    const profileContext = JSON.stringify({
      sector: startup.sector,
      stage: startup.stage,
      country: startup.country,
      pitch: startup.pitch,
      trl: startup.trl,
    }, null, 2);

    // 3. Call Claude
    const systemPrompt = `Ești un expert în evaluarea pitch deck-urilor pentru aplicații la granturi și acceleratoare.
Vei primi:
1. Profilul declarat al startupului (sector, stadiu, țară, pitch text)
2. Textul extras dintr-un pitch deck PDF

Sarcina ta: analizează pe 9 dimensiuni și returnează JSON strict structurat.

Cele 9 dimensiuni:
1. problem_clarity — Cât de clară e problema rezolvată?
2. solution_maturity — Cât de matură e soluția (concept / prototip / produs / scaling)?
3. market_potential — Mărimea TAM/SAM/SOM și accesibilitatea pieței
4. business_model — Cum câștigă bani; e validat?
5. traction — KPI-uri, useri, revenue, partneri, pilot results
6. team_capacity — Skill-uri, experiență, completitudine
7. financial_readiness — Buget, runway, burn rate, ask clar
8. technical_maturity — TRL, IP, defensibility tehnică
9. application_completeness — Are deck-ul toate elementele standard pentru aplicații la granturi?

Pentru FIECARE dimensiune dă: scor 0-100, observations (2-3 fraze factuale), suggestions (1-2 acțiuni concrete).

Apoi calculează 3 scoruri agregate (toate 0-100):
- readiness_score = media ponderată a celor 9 (cu peso egal)
- completeness_score = câte elemente standard sunt prezente / câte ar trebui (procent)
- fit_score = potrivirea declarată între profil și conținutul deck-ului (e startupul ce zice că e?)

Plus extracted_entities (ce ai detectat factual din deck): {sector, stage, trl_estimate, team_size, traction_summary, ...}.

Plus strengths (2-4 bullet-uri), gaps (2-4 bullet-uri), red_flags (0-3 lucruri care ar fi probleme la review).

Răspunde DOAR cu JSON valid, fără markdown, fără preamble.`;

    const userPrompt = `## Profil declarat al startupului
\`\`\`json
${profileContext}
\`\`\`

## Text extras din pitch deck (${pageCount} pagini)
${textForAnalysis}

Returnează JSON conform schemei.`;

    const response = await anthropic.messages.create({
      model: ANALYSIS_MODEL,
      max_tokens: 4000,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    });

    const text = response.content[0].text.trim();
    // Strip markdown code fences if present
    const clean = text.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    const analysis = JSON.parse(clean);

    // 4. Save scores
    await sb.from('artefact_scores').insert({
      artefact_id: artefactId,
      readiness_score: analysis.readiness_score,
      completeness_score: analysis.completeness_score,
      fit_score: analysis.fit_score,
      dimensions: analysis.dimensions || [],
      extracted_entities: analysis.extracted_entities || {},
      strengths: analysis.strengths || [],
      gaps: analysis.gaps || [],
      red_flags: analysis.red_flags || [],
      llm_model: ANALYSIS_MODEL,
      llm_input_tokens: response.usage.input_tokens,
      llm_output_tokens: response.usage.output_tokens,
      llm_cost_usd: estimateCost(response.usage, ANALYSIS_MODEL),
    });

    // 5. Update artefact status + raw text
    await sb.from('artefacts').update({
      status: 'analyzed',
      raw_text: rawText.slice(0, 100000), // store first 100k chars for re-analysis
      page_count: pageCount,
      analyzed_at: new Date().toISOString(),
    }).eq('id', artefactId);

    // 6. Invalidate user_grant_scores cache for this user
    await sb.from('user_grant_scores').delete().eq('user_id', startup.user_id);

    console.log(`✓ Artefact ${artefactId} analyzed: readiness=${analysis.readiness_score}, completeness=${analysis.completeness_score}, fit=${analysis.fit_score}`);
  } catch (err) {
    console.error(`Artefact ${artefactId} analysis error:`, err);
    await sb.from('artefacts').update({
      status: 'failed',
      error_message: err.message?.slice(0, 500),
    }).eq('id', artefactId);
  }
}

function estimateCost(usage, model) {
  // Claude Opus 4.5 pricing (approx, verifies in real env)
  if (model.includes('opus')) {
    return (usage.input_tokens * 15 / 1e6) + (usage.output_tokens * 75 / 1e6);
  }
  // Sonnet
  return (usage.input_tokens * 3 / 1e6) + (usage.output_tokens * 15 / 1e6);
}

module.exports = router;
```

În `server.js` mounteaz-o:
```javascript
app.use('/api/artefacts', require('./routes/artefacts'));
```

---

## Pas 3 — Upload page UI (1 zi)

Creează `upload-artefact.html`:

```html
<!DOCTYPE html>
<html lang="ro">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Încarcă pitch deck · eligibil.org</title>
<link rel="stylesheet" href="/styles.css" />
<link rel="stylesheet" href="/styles-upload.css" />
<script src="/lang.js" defer></script>
</head>
<body class="d-balanced">
<div id="upload-root"></div>

<script src="https://unpkg.com/react@18.3.1/umd/react.development.js" crossorigin></script>
<script src="https://unpkg.com/react-dom@18.3.1/umd/react-dom.development.js" crossorigin></script>
<script src="https://unpkg.com/@babel/standalone@7.29.0/babel.min.js" crossorigin></script>
<script src="/auth.js"></script>
<script type="text/babel" src="/components-upload.jsx"></script>
</body>
</html>
```

Creează `components-upload.jsx` cu:

**Stări:**
1. **Idle** — drag & drop area + "Selectează PDF" button
2. **Uploading** — progress bar
3. **Processing** — animație "Claude analizează deck-ul tău..." cu mesaje rotative ("Citim 12 pagini...", "Detectăm sectorul...", "Calculăm scorurile...")
4. **Success** — afișează cele 3 scoruri mari + breakdown 9 dimensiuni + strengths + gaps
5. **Error** — mesaj clar + buton retry

**Polling pattern:**
```javascript
async function pollStatus(id) {
  const r = await fetch(`/api/artefacts/${id}`);
  const data = await r.json();
  if (data.artefact.status === 'analyzed') return data;
  if (data.artefact.status === 'failed') throw new Error(data.artefact.error_message);
  await new Promise(r => setTimeout(r, 2000));
  return pollStatus(id);
}
```

UI scoruri (vezi Brief 02 pentru style):
- 3 inele circulare mari: Readiness · Completeness · Fit
- Sub fiecare: 1 frază microcopy
- Below: 9 bare orizontale cu scorul per dimensiune + observations expandable
- Stânga: "✓ Strengths" listă scurtă
- Dreapta: "× Gaps" listă scurtă
- Sus: "⚠ Red flags" dacă există

---

## Pas 4 — Calcul Readiness + Confidence per (user × grant) (1 zi)

Creează `lib/score-engine.js`:

```javascript
'use strict';

const { getSupabase } = require('../db/supabase');

/**
 * Compute Readiness score for (user, grant) combo.
 * Rule-based, transparent, reproducible.
 */
async function computeReadiness(userId, grantId) {
  const sb = getSupabase();

  // 1. Get latest analyzed artefact for user
  const { data: artefact } = await sb
    .from('artefacts')
    .select('id, artefact_scores!inner(*)')
    .eq('user_id', userId)
    .eq('is_current', true)
    .eq('status', 'analyzed')
    .single();

  // 2. Get grant requirements
  const { data: grant } = await sb
    .from('grants')
    .select('id, eligibility_rules, documents_required, evaluation_criteria, trl_min, trl_max')
    .eq('id', grantId)
    .single();

  if (!grant) return { score: 0, breakdown: { reason: 'grant_not_found' } };

  const breakdown = {};
  let score = 0;

  // Component 1: Artefact analysis quality (40 pct max)
  if (artefact?.artefact_scores) {
    const a = artefact.artefact_scores;
    const artefactQuality = (a.readiness_score + a.completeness_score + a.fit_score) / 3;
    score += artefactQuality * 0.4;
    breakdown.artefact_quality = { value: artefactQuality, weight: 0.4 };
  } else {
    breakdown.artefact_quality = { value: 0, weight: 0.4, reason: 'no_artefact_uploaded' };
  }

  // Component 2: Eligibility rules met (40 pct max)
  if (grant.eligibility_rules?.length) {
    const required = grant.eligibility_rules.filter(r => r.required);
    const optional = grant.eligibility_rules.filter(r => !r.required);
    // Simplified: assume met = entities match (full check in production)
    const requiredMet = required.length; // TODO: actual check vs profile/artefact entities
    const optionalMet = optional.length;
    const ruleScore = required.length
      ? (requiredMet / required.length) * 80 + (optionalMet / Math.max(optional.length, 1)) * 20
      : 100;
    score += ruleScore * 0.4;
    breakdown.eligibility = { value: ruleScore, weight: 0.4, met: requiredMet, total: required.length };
  }

  // Component 3: Documents present (20 pct max)
  if (grant.documents_required?.length) {
    const docTypes = grant.documents_required.map(d => d.name.toLowerCase());
    let docsScore = 0;
    if (artefact && docTypes.some(t => t.includes('pitch'))) docsScore += 100 / docTypes.length;
    // TODO: extend to check website, business_plan, financial_model when added
    score += docsScore * 0.2;
    breakdown.documents = { value: docsScore, weight: 0.2 };
  }

  return {
    score: Math.round(score),
    breakdown,
  };
}

/**
 * Compute Confidence score: how much we trust our own assessment.
 */
async function computeConfidence(userId, grantId) {
  const sb = getSupabase();

  const { data: grant } = await sb
    .from('grants')
    .select('evidence_status, last_checked_at, eligibility_rules, descriere, cerinte')
    .eq('id', grantId)
    .single();

  const { data: profile } = await sb
    .from('user_profiles')
    .select('completeness_score')
    .eq('user_id', userId)
    .maybeSingle();

  const { data: artefact } = await sb
    .from('artefacts')
    .select('artefact_scores!inner(confidence_score)')
    .eq('user_id', userId)
    .eq('is_current', true)
    .eq('status', 'analyzed')
    .maybeSingle();

  const breakdown = {};
  let score = 0;

  // Grant data quality (40 pct)
  let grantQuality = 0;
  if (grant?.evidence_status === 'verified_primary') grantQuality = 100;
  else if (grant?.evidence_status === 'verified_secondary') grantQuality = 75;
  else if (grant?.evidence_status === 'ai_extracted_unverified') grantQuality = 40;
  else grantQuality = 20;
  if (grant?.eligibility_rules?.length > 3) grantQuality = Math.min(100, grantQuality + 10);
  score += grantQuality * 0.4;
  breakdown.grant_data = { value: grantQuality, weight: 0.4 };

  // Profile completeness (30 pct)
  const profileCompl = profile?.completeness_score || 0;
  score += profileCompl * 0.3;
  breakdown.profile = { value: profileCompl, weight: 0.3 };

  // Artefact presence (30 pct)
  const artefactConf = artefact ? 80 : 20;
  score += artefactConf * 0.3;
  breakdown.artefact = { value: artefactConf, weight: 0.3 };

  return {
    score: Math.round(score),
    breakdown,
  };
}

/**
 * Cache + compute combined scores
 */
async function computeUserGrantScores(userId, grantId) {
  const sb = getSupabase();

  // Check cache
  const { data: cached } = await sb
    .from('user_grant_scores')
    .select('*')
    .eq('user_id', userId)
    .eq('grant_id', grantId)
    .gte('expires_at', new Date().toISOString())
    .maybeSingle();

  if (cached) return cached;

  // Compute
  const readiness = await computeReadiness(userId, grantId);
  const confidence = await computeConfidence(userId, grantId);

  const result = {
    user_id: userId,
    grant_id: grantId,
    readiness_score: readiness.score,
    confidence_score: confidence.score,
    readiness_breakdown: readiness.breakdown,
    confidence_breakdown: confidence.breakdown,
    computed_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  };

  // Upsert
  await sb.from('user_grant_scores').upsert(result, { onConflict: 'user_id,grant_id' });

  return result;
}

module.exports = { computeReadiness, computeConfidence, computeUserGrantScores };
```

---

## Pas 5 — Wire scoruri în API + UI (1 zi)

Modifică `routes/api.js` `/grants/:id` să întoarcă și scorurile per user:

```javascript
const { computeUserGrantScores } = require('../lib/score-engine');

router.get('/grants/:id', async (req, res) => {
  // ... existing fetch ...

  // ADD: per-user scores
  let userScores = null;
  if (req.session?.userId) {
    try {
      userScores = await computeUserGrantScores(req.session.userId, req.params.id);
    } catch (e) {
      console.error('user_grant_scores error:', e.message);
    }
  }

  res.json({ ...grant, user_scores: userScores });
});
```

Modifică `components-grant.jsx` linia ~67 (unde sunt `matchScore` și `matchBars` hardcoded):

```javascript
// VECHI:
matchScore: 82,
matchBars: [
  { k: 'Readiness', v: 65, kind: 'warn' },
  { k: 'Confidence', v: 72, kind: 'ok' },
  ...
]

// NOU: citește din window.__GRANT_DATA__ + fetchScores()
const [scores, setScores] = useState({
  match: window.__GRANT_DATA__?.user_scores?.match_score || 0,
  readiness: window.__GRANT_DATA__?.user_scores?.readiness_score || 0,
  confidence: window.__GRANT_DATA__?.user_scores?.confidence_score || 0,
});
```

---

## Pas 6 — Dashboard widget pentru artefact (4h)

În `components-dashboard.jsx`, adaugă:

```javascript
function ArtefactCard({ userId }) {
  const [artefact, setArtefact] = useState(null);
  const [scores, setScores] = useState(null);

  useEffect(() => {
    fetch('/api/artefacts')
      .then(r => r.json())
      .then(list => {
        const current = list.find(a => a.is_current && a.status === 'analyzed');
        if (current) {
          setArtefact(current);
          return fetch(`/api/artefacts/${current.id}`).then(r => r.json());
        }
      })
      .then(d => d?.scores && setScores(d.scores));
  }, [userId]);

  if (!artefact) {
    return (
      <div className="card">
        <h3>Pitch deck</h3>
        <p>Încarcă-l ca să primești scoruri pentru fiecare grant.</p>
        <a href="/upload-artefact.html" className="btn-primary">Încarcă PDF</a>
      </div>
    );
  }

  return (
    <div className="card">
      <h3>Pitch deck analizat</h3>
      <div className="rings">
        <Ring value={scores?.readiness_score} label="Readiness" />
        <Ring value={scores?.completeness_score} label="Completeness" />
        <Ring value={scores?.fit_score} label="Fit" />
      </div>
      <a href="/upload-artefact.html">Reanalizează →</a>
    </div>
  );
}
```

Inserează `<ArtefactCard userId={userId} />` în grid-ul de pe Dashboard.

---

## Pas 7 — Cleanup local files (30 min)

Adaugă cron job `scripts/cleanup-uploads.js` care șterge fișiere PDF locale după 7 zile (raw text e oricum în Supabase):

```javascript
const fs = require('fs');
const path = require('path');

const TMP_DIR = path.join(__dirname, '..', 'tmp', 'uploads');
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

function cleanup() {
  if (!fs.existsSync(TMP_DIR)) return;
  const userDirs = fs.readdirSync(TMP_DIR);
  let deleted = 0;
  userDirs.forEach(uid => {
    const dir = path.join(TMP_DIR, uid);
    fs.readdirSync(dir).forEach(f => {
      const fp = path.join(dir, f);
      const age = Date.now() - fs.statSync(fp).mtimeMs;
      if (age > SEVEN_DAYS_MS) {
        fs.unlinkSync(fp);
        deleted++;
      }
    });
  });
  console.log(`Cleaned ${deleted} files`);
}

cleanup();
```

Adaugă în `package.json`:
```json
"scripts": {
  ...
  "cleanup:uploads": "node scripts/cleanup-uploads.js"
}
```

---

## Definition of Done

- [ ] Schema `artefacts` + `artefact_scores` + `user_grant_scores` aplicată
- [ ] `POST /api/artefacts/upload` acceptă PDF, returnează `artefact_id`
- [ ] Status devine `analyzed` automat în 30-60s pentru un PDF tipic
- [ ] `artefact_scores` populat cu 9 dimensiuni + extracted_entities + strengths/gaps
- [ ] `/upload-artefact.html` afișează: idle → uploading → processing → results
- [ ] Dashboard arată ArtefactCard cu cele 3 scoruri
- [ ] Pagina `/ro/granturi/:slug` afișează Readiness + Confidence reale (nu hardcoded) după ce userul are artefact
- [ ] Pre-artefact: scoruri 0 cu CTA "Încarcă pitch deck"
- [ ] Cost mediu per analiză logat în `artefact_scores.llm_cost_usd`
- [ ] Fișiere PDF locale șterse după 7 zile

---

## Buget LLM estimat

- Pitch deck tipic: 12-20 pagini → ~5,000-15,000 tokens input
- Output JSON: ~2,000 tokens
- Cu Claude Opus 4.5: ~$0.20-0.40 per analiză
- Pentru 50 utilizatori în beta = ~$10-20/lună
- Recomandare: pentru beta, folosește **Claude Sonnet** (~$0.05/analiză) → 4× ieftin, calitate suficient de bună

Schimbă în `.env`:
```
ANTHROPIC_MODEL=claude-sonnet-4-5-20250929
```

---

## Ce NU faci în acest brief

- Nu implementezi video / whitepaper / website analysis (Phase 2)
- Nu trimiți raw_text la fiecare interogare în Claude (folosește scorurile cached din artefact_scores)
- Nu blochezi UI-ul în await (totul e async cu polling)
- Nu salvezi PDF-uri permanent local — doar în /tmp pentru analiză, apoi cleanup
- Nu scoți `evaluation_criteria` din schema grants (necesar pentru Confidence)

---

## Escalation

- Dacă pdf-parse eșuează pe deck-uri scanned (image-only): adaugă OCR cu `tesseract.js` ca fallback (Phase 2)
- Dacă Claude returnează JSON invalid: adaugă retry o dată cu instrucțiune mai strictă
- Dacă cost-urile sar peste $50/lună: switch la Sonnet și/sau cache analiza per SHA-256

---

*Brief 03 · v1 · sprint Mai 2026*
