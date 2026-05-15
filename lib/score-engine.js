'use strict';

/**
 * lib/score-engine.js — rule-based readiness/confidence calculator
 * combining the user's current pitch-deck artefact with the grant's
 * eligibility/evidence metadata.
 *
 * Stored in user_grant_scores with a 7-day expiry; recomputed when:
 *   - the user uploads a new artefact (analyzeArtefact deletes their cache)
 *   - the cached row is stale (expires_at < now())
 *
 * Returns the same shape regardless of whether an artefact exists, so the
 * grant page can render "pre-artefact" state (low scores + CTA) without
 * a special branch.
 */

const { getSupabase } = require('../db/supabase');

const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

// =============================================================================
// Readiness — "how prepared is the user to apply right now"
// =============================================================================
// Resolve a single eligibility rule against (startup, artefact entities) signals.
// Returns { met, evidence, reason }. Conservative: returns `met=null` (unknown)
// rather than false when we lack the signal to evaluate, so unknown rules don't
// unfairly drag the score down.
function evaluateRule(rule, ctx) {
  if (!rule || typeof rule !== 'object') return { met: null, reason: 'invalid_rule' };
  const { startup, entities } = ctx;
  const kind = rule.kind || rule.type;
  const val  = rule.value;

  switch (kind) {
    case 'country': {
      const startupCountry = (startup?.country || entities?.country || '').toLowerCase();
      if (!startupCountry) return { met: null, reason: 'startup_country_unknown' };
      const accepted = Array.isArray(val) ? val : [val];
      const hit = accepted.some(c => String(c || '').toLowerCase().includes(startupCountry) || startupCountry.includes(String(c || '').toLowerCase()));
      return { met: hit, evidence: `startup country = ${startupCountry}` };
    }
    case 'sector': {
      const s = String(startup?.sector || entities?.sector || '').toLowerCase();
      if (!s) return { met: null, reason: 'startup_sector_unknown' };
      const accepted = Array.isArray(val) ? val : [val];
      const hit = accepted.some(a => String(a || '').toLowerCase().includes(s) || s.includes(String(a || '').toLowerCase()));
      return { met: hit, evidence: `startup sector = ${s}` };
    }
    case 'stage': {
      const s = String(startup?.stage || entities?.stage || '').toLowerCase();
      if (!s) return { met: null, reason: 'startup_stage_unknown' };
      const accepted = Array.isArray(val) ? val : [val];
      const hit = accepted.some(a => String(a || '').toLowerCase().includes(s) || s.includes(String(a || '').toLowerCase()));
      return { met: hit, evidence: `startup stage = ${s}` };
    }
    case 'trl_min': {
      const t = parseInt(startup?.trl ?? entities?.trl_estimate, 10);
      if (isNaN(t)) return { met: null, reason: 'trl_unknown' };
      return { met: t >= parseInt(val, 10), evidence: `startup TRL = ${t}, required ≥ ${val}`, user_value: t };
    }
    case 'trl_max': {
      const t = parseInt(startup?.trl ?? entities?.trl_estimate, 10);
      if (isNaN(t)) return { met: null, reason: 'trl_unknown' };
      return { met: t <= parseInt(val, 10), evidence: `startup TRL = ${t}, required ≤ ${val}`, user_value: t };
    }
    case 'trl_range': {
      const t = parseInt(startup?.trl ?? entities?.trl_estimate, 10);
      if (isNaN(t)) return { met: null, reason: 'trl_unknown' };
      const min = val?.min, max = val?.max;
      return { met: t >= min && t <= max, evidence: `startup TRL = ${t}, range ${min}–${max}`, user_value: t };
    }
    case 'team_size_min': {
      const ts = parseInt(startup?.team_size ?? entities?.team_size, 10);
      if (isNaN(ts)) return { met: null, reason: 'team_size_unknown' };
      return { met: ts >= parseInt(val, 10), evidence: `team size = ${ts}, required ≥ ${val}`, user_value: ts };
    }
    case 'capital_type': {
      // Informational — always met if artefact present (user knows preference)
      return { met: !!entities, evidence: `capital type = ${val}` };
    }
    case 'consortium': {
      // No structured consortium field on startups yet — neutral unknown
      return { met: null, reason: 'consortium_data_unavailable' };
    }
    default:
      return { met: null, reason: `unsupported_rule_kind:${kind}` };
  }
}

async function computeReadiness(userId, grant) {
  const sb = getSupabase();

  // Fetch latest current artefact + its scores (incl extracted_entities)
  const { data: artefact } = await sb
    .from('artefacts')
    .select('id, status')
    .eq('user_id', userId)
    .eq('is_current', true)
    .eq('artefact_type', 'pitch_deck')
    .in('status', ['analyzed', 'awaiting_credits'])
    .maybeSingle();

  let artefactScores = null;
  let entities = {};
  if (artefact) {
    const { data } = await sb
      .from('artefact_scores')
      .select('readiness_score, completeness_score, fit_score, extracted_entities')
      .eq('artefact_id', artefact.id)
      .maybeSingle();
    artefactScores = data;
    entities = data?.extracted_entities || {};
  }

  // Startup profile for rule evaluation
  const { data: startup } = await sb
    .from('startups')
    .select('country, sector, stage, trl, team_size')
    .eq('user_id', userId)
    .maybeSingle();

  const ctx = { startup, entities };
  const breakdown = {};
  let score = 0;

  // Component 1 — artefact quality (40% weight)
  if (artefactScores) {
    const q = Math.round(
      (artefactScores.readiness_score + artefactScores.completeness_score + artefactScores.fit_score) / 3
    );
    score += q * 0.4;
    breakdown.artefact_quality = { value: q, weight: 0.4 };
  } else {
    breakdown.artefact_quality = { value: 0, weight: 0.4, reason: 'no_artefact_uploaded' };
  }

  // Component 2 — eligibility rules (40% weight)
  if (Array.isArray(grant?.eligibility_rules) && grant.eligibility_rules.length) {
    const rules    = grant.eligibility_rules;
    const evaluated = rules.map(r => ({ ...r, ...evaluateRule(r, ctx) }));

    const required  = evaluated.filter(r => r.required);
    const optional  = evaluated.filter(r => !r.required);

    // For required rules: met counts full, unknown counts half (conservative)
    const reqMet     = required.filter(r => r.met === true).length;
    const reqUnknown = required.filter(r => r.met === null).length;
    const reqEffective = reqMet + reqUnknown * 0.5;

    const optMet     = optional.filter(r => r.met === true).length;
    const optUnknown = optional.filter(r => r.met === null).length;
    const optEffective = optMet + optUnknown * 0.5;

    const reqRatio = required.length ? reqEffective / required.length : 1;
    const optRatio = optional.length ? optEffective / optional.length : 1;

    // Required = 80% of eligibility weight, optional = 20%
    const ruleScore = Math.round(reqRatio * 80 + optRatio * 20);
    score += ruleScore * 0.4;
    breakdown.eligibility = {
      value: ruleScore,
      weight: 0.4,
      required: required.length,
      required_met: reqMet,
      required_unknown: reqUnknown,
      optional: optional.length,
      optional_met: optMet,
      rules: evaluated.map(r => ({ kind: r.kind || r.type, rule: r.rule, required: !!r.required, met: r.met, evidence: r.evidence, reason: r.reason })),
    };
  } else {
    const neutral = artefactScores ? 60 : 30;
    score += neutral * 0.4;
    breakdown.eligibility = { value: neutral, weight: 0.4, reason: 'rules_unset' };
  }

  // Component 3 — documents present (20% weight)
  if (Array.isArray(grant?.documents_required) && grant.documents_required.length) {
    // For now only pitch_deck artefact type exists. Map presence.
    const docs = grant.documents_required;
    const haveTypes = artefact ? ['pitch_deck'] : [];
    const matched = docs.filter(d => {
      const name = String(d?.name || '').toLowerCase();
      return haveTypes.some(t => name.includes('pitch'));
    }).length;
    const docsScore = Math.round((matched / docs.length) * 100);
    score += docsScore * 0.2;
    breakdown.documents = { value: docsScore, weight: 0.2, have: matched, total: docs.length };
  } else {
    const docsScore = artefactScores ? 65 : 0;
    score += docsScore * 0.2;
    breakdown.documents = { value: docsScore, weight: 0.2, note: 'pitch_deck_only_phase_1' };
  }

  return { score: Math.round(score), breakdown };
}

// =============================================================================
// Confidence — "how much we trust our own readiness number"
// =============================================================================
async function computeConfidence(userId, grant) {
  const sb = getSupabase();

  // Profile completeness (proxy: how many startup fields are non-null)
  const { data: startup } = await sb
    .from('startups')
    .select('name, website, pitch, sector, stage, trl, country, team_size, github, goals')
    .eq('user_id', userId)
    .maybeSingle();

  const fields = ['name','website','pitch','sector','stage','trl','country','team_size','github','goals'];
  const filled = startup ? fields.filter(f => {
    const v = startup[f];
    return v !== null && v !== undefined && v !== '';
  }).length : 0;
  const profileCompl = Math.round((filled / fields.length) * 100);

  // Artefact presence — analyzed=full trust, awaiting_credits=partial, none=low
  const { data: artefact } = await sb
    .from('artefacts')
    .select('status')
    .eq('user_id', userId)
    .eq('is_current', true)
    .eq('artefact_type', 'pitch_deck')
    .maybeSingle();

  const artefactConf = artefact?.status === 'analyzed' ? 90
                    : artefact?.status === 'awaiting_credits' ? 55
                    : 20;

  // Grant data quality from evidence_status (Brief 04 added this enum)
  const evidenceMap = {
    verified_primary:        100,
    verified_secondary:       75,
    ai_extracted_unverified:  40,
    hypothesis:               20,
  };
  let grantQuality = evidenceMap[grant?.evidence_status] ?? 40;
  if (Array.isArray(grant?.eligibility_rules) && grant.eligibility_rules.length > 3) {
    grantQuality = Math.min(100, grantQuality + 10);
  }

  const breakdown = {
    grant_data: { value: grantQuality, weight: 0.4 },
    profile:    { value: profileCompl,  weight: 0.3, filled, total: fields.length },
    artefact:   { value: artefactConf,  weight: 0.3, status: artefact?.status || 'none' },
  };

  const score = Math.round(grantQuality * 0.4 + profileCompl * 0.3 + artefactConf * 0.3);
  return { score, breakdown };
}

// =============================================================================
// Match score — heuristic fallback if score_grant_v2 RPC unavailable
// =============================================================================
function computeMatchHeuristic(grant, startup) {
  if (!grant || !startup) return { score: 0, breakdown: { reason: 'missing_input' } };
  let score = 50;
  const reasons = [];
  // Country signal
  if (grant.tara && startup.country && grant.tara.toLowerCase().includes(startup.country.toLowerCase())) {
    score += 15; reasons.push('country_match');
  }
  // Sector signal
  if (grant.sector && startup.sector && String(grant.sector).toLowerCase().includes(startup.sector.toLowerCase())) {
    score += 20; reasons.push('sector_match');
  }
  // TRL signal
  if (grant.trl_min != null && grant.trl_max != null && startup.trl != null) {
    if (startup.trl >= grant.trl_min && startup.trl <= grant.trl_max) {
      score += 10; reasons.push('trl_in_range');
    } else {
      score -= 10; reasons.push('trl_out_of_range');
    }
  }
  return { score: Math.max(0, Math.min(100, score)), breakdown: { reasons, basis: 'heuristic' } };
}

// =============================================================================
// Cache + compute combined scores
// =============================================================================
async function computeUserGrantScores(userId, grantId) {
  const sb = getSupabase();

  // 1. Cache check
  const { data: cached } = await sb
    .from('user_grant_scores')
    .select('*')
    .eq('user_id', userId)
    .eq('grant_id', grantId)
    .gte('expires_at', new Date().toISOString())
    .maybeSingle();
  if (cached) return cached;

  // 2. Pull grant + startup once for downstream calls
  const { data: grant } = await sb
    .from('grants')
    .select('id, tara, sector, trl_min, trl_max, eligibility_rules, evidence_status, documents_required, evaluation_criteria')
    .eq('id', grantId)
    .maybeSingle();
  if (!grant) return null;

  const { data: startup } = await sb
    .from('startups')
    .select('country, sector, trl')
    .eq('user_id', userId)
    .maybeSingle();

  // 3. Compute (parallel)
  const [readiness, confidence] = await Promise.all([
    computeReadiness(userId, grant),
    computeConfidence(userId, grant),
  ]);
  const match = computeMatchHeuristic(grant, startup);

  const now = new Date();
  const row = {
    user_id:              userId,
    grant_id:             grantId,
    match_score:          match.score,
    readiness_score:      readiness.score,
    confidence_score:     confidence.score,
    effort_score:         null,
    urgency_score:        null,
    match_breakdown:      match.breakdown,
    readiness_breakdown:  readiness.breakdown,
    confidence_breakdown: confidence.breakdown,
    computed_at:          now.toISOString(),
    expires_at:           new Date(now.getTime() + CACHE_TTL_MS).toISOString(),
  };

  // 4. Upsert (so repeated calls don't pile up rows)
  await sb.from('user_grant_scores').upsert(row, { onConflict: 'user_id,grant_id' });

  return row;
}

module.exports = { computeReadiness, computeConfidence, computeUserGrantScores };
