'use strict';

/**
 * profile-sync.js
 *
 * Syncs user startup profiles from local JSON store → Supabase user_profiles
 * for use in dynamic relevance scoring (Scoring v2).
 *
 * Called from:
 *   - routes/api.js PUT /api/profile (per-user incremental)
 *   - scripts/compute-user-stats.js (full sync)
 */

const crypto = require('crypto');

let _supabase = null;
function getSupabaseSafe() {
  if (_supabase) return _supabase;
  try {
    _supabase = require('./supabase').getSupabase();
    return _supabase;
  } catch {
    return null;
  }
}

/**
 * Generate embedding for a profile — Bedrock Titan → OpenAI fallback
 */
async function embedProfile(profile) {
  const text = [
    `Startup: ${profile.startup_name || profile.startupName || ''}`,
    `Sector: ${profile.sector || ''}`,
    `Stage: ${profile.stage || ''}`,
    `Country: ${profile.country || 'Moldova'}`,
    `TRL: ${profile.trl || ''}`,
    `Pitch: ${profile.pitch || ''}`,
    profile.goals?.length ? `Goals: ${profile.goals.join(', ')}` : '',
  ].filter(Boolean).join('. ');

  if (!text || text.length < 30) return null;

  // 1. Try AWS Bedrock Titan Embed V2
  const { isBedrockEnabled, bedrockEmbed } = require('../lib/bedrock');
  if (isBedrockEnabled('embeddings')) {
    try {
      const vec = await bedrockEmbed(text);
      if (vec) return vec;
    } catch (err) {
      console.warn('[profile-sync] Bedrock embedding failed:', err.message);
    }
  }

  // 2. Fallback to OpenAI
  if (!process.env.OPENAI_API_KEY) return null;
  try {
    const res = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        input: text,
        model: 'text-embedding-3-small',
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.data?.[0]?.embedding || null;
  } catch (err) {
    console.warn('[profile-sync] embedding failed:', err.message);
    return null;
  }
}

/**
 * Upsert one profile to Supabase
 */
async function syncProfile(userId, email, profile) {
  const supabase = getSupabaseSafe();
  if (!supabase) return { skipped: true, reason: 'no-supabase' };

  if (!userId) return { skipped: true, reason: 'no-user-id' };

  const embedding = await embedProfile(profile);

  const row = {
    user_id:      String(userId),
    email:        email || null,
    startup_name: profile.startupName || profile.name || profile.startup_name || null,
    website:      profile.website || null,
    pitch:        profile.pitch || null,
    sector:       profile.sector || null,
    stage:        profile.stage || null,
    trl:          profile.trl != null ? Number(profile.trl) : null,
    country:      profile.country || 'Moldova',
    team_size:    profile.teamSize || profile.team_size || null,
    github:       profile.github || null,
    goals:        Array.isArray(profile.goals) ? profile.goals
                  : (typeof profile.goals === 'string' ? JSON.parse(profile.goals) : null),
    amount_idx:   profile.amountIdx != null ? Number(profile.amountIdx) : null,
    horizon:      profile.horizon || null,
    priority:     profile.priority || null,
    embedding:    embedding,
    updated_at:   new Date().toISOString(),
  };

  const { error } = await supabase
    .from('user_profiles')
    .upsert(row, { onConflict: 'user_id' });

  if (error) {
    console.warn('[profile-sync] upsert failed:', error.message);
    return { failed: true, reason: error.message };
  }

  return { ok: true, hasEmbedding: !!embedding };
}

/**
 * Trigger pool stats refresh — call after batch of profile updates
 */
async function refreshPoolStats() {
  const supabase = getSupabaseSafe();
  if (!supabase) return null;

  const { data, error } = await supabase.rpc('compute_pool_stats');
  if (error) {
    console.warn('[profile-sync] refresh failed:', error.message);
    return null;
  }
  return data;
}

module.exports = { syncProfile, refreshPoolStats, embedProfile };
