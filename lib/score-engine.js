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
async function computeReadiness(userId, grant) {
  const sb = getSupabase();

  // Fetch latest current artefact + its scores
  const { data: artefact } = await sb
    .from('artefacts')
    .select('id, status')
    .eq('user_id', userId)
    .eq('is_current', true)
    .eq('artefact_type', 'pitch_deck')
    .in('status', ['analyzed', 'awaiting_credits'])
    .maybeSingle();

  let artefactScores = null;
  if (artefact) {
    const { data } = await sb
      .from('artefact_scores')
      .select('readiness_score, completeness_score, fit_score')
      .eq('artefact_id', artefact.id)
      .maybeSingle();
    artefactScores = data;
  }

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

  // Component 2 — eligibility rules met (40% weight)
  // grant.eligibility_rules may not exist yet (Pas 1 didn't land it); default neutral 50.
  if (Array.isArray(grant?.eligibility_rules) && grant.eligibility_rules.length) {
    const rules    = grant.eligibility_rules;
    const required = rules.filter(r => r && r.required);
    const optional = rules.filter(r => r && !r.required);
    // Heuristic — without per-rule check, assume artefact presence covers half
    const ratio = artefactScores ? 0.65 : 0.25;
    const ruleScore = required.length
      ? Math.round(ratio * 80 + (optional.length ? ratio * 20 : 20))
      : 70;
    score += ruleScore * 0.4;
    breakdown.eligibility = { value: ruleScore, weight: 0.4, required: required.length, optional: optional.length };
  } else {
    const neutral = artefactScores ? 60 : 30;
    score += neutral * 0.4;
    breakdown.eligibility = { value: neutral, weight: 0.4, reason: 'rules_unset' };
  }

  // Component 3 — documents present (20% weight)
  // Only pitch deck is supported as artefact type today.
  const docsScore = artefactScores ? 65 : 0;
  score += docsScore * 0.2;
  breakdown.documents = { value: docsScore, weight: 0.2, note: 'pitch_deck_only_phase_1' };

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
    .select('id, tara, sector, trl_min, trl_max, eligibility_rules, evidence_status')
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
