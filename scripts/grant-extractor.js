'use strict';

/**
 * grant-extractor.js
 *
 * Takes raw text (email body, web page, manual paste) and extracts
 * structured grant data using Claude API (or heuristic fallback).
 *
 * Returns: { ok: bool, grant: {...}, fingerprint, relevance_score, reason? }
 */

const crypto = require('crypto');

const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';
const CLAUDE_MODEL   = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-5-20250929';

// =============================================================================
// Extraction prompt — instructs Claude to return strict JSON
// =============================================================================
const EXTRACTION_PROMPT = `You are a grant intelligence extractor for eligibil.eu, a platform that matches startups in Moldova, Romania, and the EU with funding programs.

Extract structured information from the text below. Return ONLY a JSON object — no prose, no markdown, no code fences.

Required schema:
{
  "nume_program": "string (exact program name)",
  "organizatie": "string (the funder — who provides the money, NOT the email sender)",
  "tara": "Moldova | Romania | EU | Global | <country>",
  "tip": "Grant | Accelerator | VC Fund | Loan | Equity | Hybrid",
  "dilutiv": false,
  "suma_min": 0,
  "suma_max": 0,
  "stadiu": "Idee / MVP / Pre-seed / Seed / Series A (slash-delimited)",
  "sector": "AI / SaaS / FinTech (slash-delimited)",
  "deadline": "YYYY-MM-DD or 'Rolling' or 'Annual'",
  "luna": 0,
  "dificultate": 1,
  "zile_min": 0,
  "zile_max": 0,
  "cerinte": "string (eligibility, max 500 chars)",
  "descriere": "string (what it funds, max 500 chars)",
  "website": "https://... (official URL only)",
  "_is_grant_announcement": true,
  "_confidence": 0.0
}

RULES:
- "_is_grant_announcement": false ONLY if text is newsletter/confirmation/unrelated
- "_confidence": 0.0–1.0 — how confident you are about extraction
- All amounts in EUR. Convert RON/USD/MDL using approx rates. Set 0 if unknown.
- "dilutiv": true if equity is taken (VC, accelerator equity), false if pure grant
- "dificultate": 1=easy form, 2=medium docs, 3=heavy proposal+budget+consortium
- "zile_min/max": estimated days to prepare application
- Use null for truly unknown text fields, 0 for unknown numbers, NEVER hallucinate URLs
- "tara": prefer specific country if mentioned; "EU" if open to multiple EU countries

TEXT TO ANALYZE:
---
{{TEXT}}
---

Return ONLY the JSON object.`;

// =============================================================================
// Call Claude API
// =============================================================================
async function extractWithClaude(text) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return { ok: false, reason: 'ANTHROPIC_API_KEY not set' };
  }

  const prompt = EXTRACTION_PROMPT.replace('{{TEXT}}', text.slice(0, 12000));

  try {
    const res = await fetch(CLAUDE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: CLAUDE_MODEL,
        max_tokens: 1500,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!res.ok) {
      const errBody = await res.text();
      return { ok: false, reason: `Claude API ${res.status}: ${errBody.slice(0, 200)}` };
    }

    const data = await res.json();
    const content = data.content?.[0]?.text || '';
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return { ok: false, reason: 'No JSON in Claude response' };

    const parsed = JSON.parse(jsonMatch[0]);
    return { ok: true, grant: parsed };
  } catch (err) {
    return { ok: false, reason: `Claude error: ${err.message}` };
  }
}

// =============================================================================
// Heuristic fallback (regex-based) — works without API key
// =============================================================================
function extractHeuristic(text) {
  const lower = text.toLowerCase();

  // Skip obvious non-grant emails
  if (/unsubscribe|newsletter|confirmare\s+inregistrare|registration\s+confirm/i.test(text)
      && !/grant|finantare|funding|apel|call\s+for/i.test(text)) {
    return { ok: true, grant: { _is_grant_announcement: false, _confidence: 0.9 } };
  }

  // Extract amounts (EUR / RON / USD)
  const amountMatch = text.match(/(?:€|EUR|euro)\s*([\d.,]+)\s*(?:[-–to până la]+\s*(?:€|EUR)?\s*([\d.,]+))?/i);
  const suma_min = amountMatch ? parseInt(amountMatch[1].replace(/[.,]/g, ''), 10) : 0;
  const suma_max = amountMatch && amountMatch[2] ? parseInt(amountMatch[2].replace(/[.,]/g, ''), 10) : suma_min;

  // Extract deadline
  const deadlineMatch = text.match(/(?:deadline|termen|aplicare?\s+până|application\s+due|expires?)[:\s]+(\d{1,2}[\s./-]\w+[\s./-]\d{2,4}|\d{4}-\d{2}-\d{2})/i);

  // Country detection
  let tara = 'Global';
  if (/moldova|md\b|kishinev|chisinau/i.test(lower)) tara = 'Moldova';
  else if (/romania|romanian|bucuresti|cluj/i.test(lower)) tara = 'Romania';
  else if (/european\s+union|\bEU\b|horizon|EIC|cordis/i.test(text)) tara = 'EU';

  // Type detection
  let tip = 'Grant';
  if (/accelerator|incubator/i.test(lower)) tip = 'Accelerator';
  else if (/venture\s+capital|VC\s+fund|equity\s+investment/i.test(text)) tip = 'VC Fund';

  // Sector keywords
  const sectorKeywords = ['AI','SaaS','FinTech','HealthTech','EdTech','CleanTech','AgriTech','Deep Tech'];
  const sectors = sectorKeywords.filter(s => new RegExp(`\\b${s}\\b`, 'i').test(text));

  // Title — use first heading-like line
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const titleLine = lines.find(l => l.length > 10 && l.length < 120 && !/^(re:|fwd:|from:|sent:|to:|subject:)/i.test(l));

  return {
    ok: true,
    grant: {
      nume_program: titleLine || 'Untitled grant',
      organizatie: null,
      tara,
      tip,
      dilutiv: tip !== 'Grant',
      suma_min,
      suma_max,
      stadiu: null,
      sector: sectors.join(' / '),
      deadline: deadlineMatch ? deadlineMatch[1] : null,
      cerinte: null,
      descriere: lines.slice(0, 3).join(' ').slice(0, 500),
      website: (text.match(/https?:\/\/[^\s<>"]+/) || [null])[0],
      _is_grant_announcement: !!(suma_min || sectors.length || /grant|finantare|funding|apel|call/i.test(text)),
      _confidence: 0.4,
    },
  };
}

// =============================================================================
// Main extract — tries Claude first, falls back to heuristic
// =============================================================================
async function extract(text, opts = {}) {
  if (!text || text.length < 30) {
    return { ok: false, reason: 'Text too short' };
  }

  let result;
  if (process.env.ANTHROPIC_API_KEY && !opts.skipClaude) {
    result = await extractWithClaude(text);
    if (!result.ok) {
      console.warn(`  ⚠ Claude failed (${result.reason}), falling back to heuristic`);
      result = extractHeuristic(text);
    }
  } else {
    result = extractHeuristic(text);
  }

  if (!result.ok) return result;
  if (!result.grant._is_grant_announcement) {
    return { ok: false, reason: 'Not a grant announcement' };
  }

  // Compute fingerprint
  result.fingerprint = computeFingerprint(result.grant);
  // Compute relevance score (V2 if user pool exists, else V1)
  result.relevance_score = await scoreRelevanceV2(result.grant);
  // Parse arrays
  result.grant.stadiu_arr = parseSlash(result.grant.stadiu);
  result.grant.sector_arr = parseSlash(result.grant.sector);

  return result;
}

// =============================================================================
// Fingerprint (deduplication)
// =============================================================================
function computeFingerprint(g) {
  const norm = s => String(s || '').toLowerCase().replace(/[^\w]/g, '');
  const year = (g.deadline || '').match(/20\d{2}/)?.[0] || 'rolling';
  const key = `${norm(g.organizatie)}|${norm(g.nume_program)}|${year}`;
  return crypto.createHash('sha256').update(key).digest('hex').slice(0, 32);
}

// =============================================================================
// Relevance score V2 — uses real user pool stats from Supabase
// Falls back to V1 heuristics if no users exist yet
// =============================================================================

// Cache pool stats for 5 minutes to avoid hammering Supabase
let _poolStatsCache = null;
let _poolStatsCachedAt = 0;
const POOL_CACHE_TTL = 5 * 60 * 1000;

async function getPoolStats() {
  const now = Date.now();
  if (_poolStatsCache && (now - _poolStatsCachedAt) < POOL_CACHE_TTL) {
    return _poolStatsCache;
  }
  try {
    const { getSupabase } = require('../db/supabase');
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('user_pool_stats')
      .select('*')
      .eq('id', 1)
      .maybeSingle();
    if (error || !data) return null;
    _poolStatsCache = data;
    _poolStatsCachedAt = now;
    return data;
  } catch {
    return null;
  }
}

/**
 * V2 scoring: uses actual user pool composition.
 * Returns 0-100 weighted by % of users that match each grant attribute.
 */
async function scoreRelevanceV2(g, opts = {}) {
  const stats = opts.poolStats || await getPoolStats();

  // Cold-start fallback: no users yet → use heuristics (v1)
  if (!stats || !stats.total_users) {
    return scoreRelevanceV1(g);
  }

  let score = 0;
  const tara = (g.tara || '').toLowerCase();
  const sector = (g.sector || '').toLowerCase();
  const stadiu = (g.stadiu || '').toLowerCase();

  // 1. Country match — up to 35 pts, weighted by % of users in that country
  for (const c of (stats.top_countries || [])) {
    const cv = (c.value || '').toLowerCase();
    if (tara.includes(cv) || cv.includes(tara) || tara.includes('eu') || tara.includes('global')) {
      score += Math.min(35, c.pct * 0.35);
      break;
    }
  }

  // 2. Sector match — up to 25 pts, sum of overlapping sectors
  let sectorPts = 0;
  for (const s of (stats.top_sectors || [])) {
    const sv = (s.value || '').toLowerCase();
    if (sector.includes(sv)) sectorPts += s.pct * 0.25;
  }
  score += Math.min(25, sectorPts);

  // 3. Stage match — up to 15 pts
  let stagePts = 0;
  for (const st of (stats.top_stages || [])) {
    const sv = (st.value || '').toLowerCase();
    if (stadiu.includes(sv)) stagePts += st.pct * 0.15;
  }
  score += Math.min(15, stagePts);

  // 4. Deadline bonus — up to 10 pts
  if (g.deadline) {
    if (/rolling|annual/i.test(g.deadline)) {
      score += 10;
    } else {
      const dDate = new Date(g.deadline);
      if (!isNaN(dDate)) {
        const days = (dDate - new Date()) / (1000 * 60 * 60 * 24);
        if (days < 0) score -= 30;          // expired
        else if (days < 14) score += 3;
        else if (days < 60) score += 8;
        else score += 10;
      }
    }
  }

  // 5. Bonuses
  if (g.dilutiv === false) score += 5;        // non-dilutive
  if (/AI|SaaS|tech|digital|innovation/i.test(g.sector || '')) score += 5;  // tech bonus

  return Math.max(0, Math.min(100, Math.round(score)));
}

/**
 * V1 scoring (legacy heuristic) — used as fallback when pool is empty
 */
function scoreRelevanceV1(g) {
  let score = 0;
  const tara = (g.tara || '').toLowerCase();

  if (tara.includes('moldova')) score += 25;
  else if (tara.includes('romania')) score += 20;
  else if (tara.includes('eu') || tara.includes('europe')) score += 15;

  if (g.tip && /grant|accelerator|fund/i.test(g.tip)) score += 15;

  const amt = g.suma_max || g.suma_min || 0;
  if (amt >= 50000 && amt <= 500000) score += 20;
  else if (amt >= 5000 && amt < 50000) score += 15;
  else if (amt > 500000) score += 10;
  else if (amt > 0) score += 5;

  if (g.deadline) {
    if (/rolling|annual/i.test(g.deadline)) score += 12;
    else {
      const dDate = new Date(g.deadline);
      if (!isNaN(dDate)) {
        const days = (dDate - new Date()) / (1000 * 60 * 60 * 24);
        if (days < 0) score -= 50;
        else if (days < 30) score += 5;
        else if (days < 60) score += 10;
        else score += 15;
      }
    }
  }

  if (g.dilutiv === false) score += 10;
  if (/AI|SaaS|tech|digital|innovation/i.test(g.sector || '')) score += 8;

  return Math.max(0, Math.min(100, Math.round(score)));
}

// Backward-compatible: scoreRelevance defaults to V2 (with V1 fallback inside)
function scoreRelevance(g) {
  // Synchronous quick path: if pool stats already cached, use them
  if (_poolStatsCache && (Date.now() - _poolStatsCachedAt) < POOL_CACHE_TTL) {
    // Inline V2 logic without await (cache is sync)
    const stats = _poolStatsCache;
    if (stats && stats.total_users) {
      let score = 0;
      const tara = (g.tara || '').toLowerCase();
      for (const c of (stats.top_countries || [])) {
        const cv = (c.value || '').toLowerCase();
        if (tara.includes(cv) || cv.includes(tara)) {
          score += Math.min(35, c.pct * 0.35);
          break;
        }
      }
      let sectorPts = 0;
      for (const s of (stats.top_sectors || [])) {
        if ((g.sector || '').toLowerCase().includes((s.value || '').toLowerCase())) {
          sectorPts += s.pct * 0.25;
        }
      }
      score += Math.min(25, sectorPts);
      if (g.dilutiv === false) score += 5;
      if (g.deadline && /rolling|annual/i.test(g.deadline)) score += 10;
      return Math.max(0, Math.min(100, Math.round(score)));
    }
  }
  // Fall back to V1
  return scoreRelevanceV1(g);
}

function parseSlash(s) {
  if (!s) return null;
  return [...new Set(String(s).split('/').map(x => x.trim()).filter(Boolean))];
}

module.exports = {
  extract,
  computeFingerprint,
  scoreRelevance,
  scoreRelevanceV1,
  scoreRelevanceV2,
  getPoolStats,
  extractWithClaude,
  extractHeuristic,
};

// =============================================================================
// CLI: pipe text in, get JSON out
//   echo "Grant text..." | node scripts/grant-extractor.js
// =============================================================================
if (require.main === module) {
  require('dotenv').config();
  let buf = '';
  process.stdin.on('data', chunk => buf += chunk);
  process.stdin.on('end', async () => {
    const result = await extract(buf);
    console.log(JSON.stringify(result, null, 2));
  });
}
