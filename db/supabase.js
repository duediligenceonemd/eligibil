'use strict';

const { createClient } = require('@supabase/supabase-js');

let _client = null;

function classifySupabaseKey(key) {
  const normalized = String(key || '').trim().toLowerCase();
  if (!normalized) return 'missing';
  if (normalized.startsWith('sb_publishable_')) return 'publishable';
  if (normalized.startsWith('sb_anon_')) return 'anon';
  if (normalized.startsWith('eyj')) return 'jwt';
  return 'service_role';
}

/**
 * Returns a singleton Supabase client using the SERVICE ROLE key.
 * The service key bypasses Row Level Security — safe for server-side use only.
 * Never expose this key to the browser.
 *
 * Throws if SUPABASE_URL or SUPABASE_SERVICE_KEY env vars are missing.
 */
function getSupabase() {
  if (_client) return _client;

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  const keyType = classifySupabaseKey(key);

  if (!url || !key) {
    throw new Error(
      'Missing SUPABASE_URL or SUPABASE_SERVICE_KEY. ' +
      'Copy .env.example to .env and fill in your Supabase credentials.'
    );
  }

  if (keyType === 'publishable' || keyType === 'anon') {
    throw new Error(
      'SUPABASE_SERVICE_KEY must be a server-side service role key, not a publishable/anon key. ' +
      'Update the deployment environment before using DB-backed server routes.'
    );
  }

  _client = createClient(url, key, {
    auth: { persistSession: false },
  });

  return _client;
}

module.exports = { getSupabase, classifySupabaseKey };
