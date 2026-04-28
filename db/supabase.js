'use strict';

const { createClient } = require('@supabase/supabase-js');

let _client = null;

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

  if (!url || !key) {
    throw new Error(
      'Missing SUPABASE_URL or SUPABASE_SERVICE_KEY. ' +
      'Copy .env.example to .env and fill in your Supabase credentials.'
    );
  }

  _client = createClient(url, key, {
    auth: { persistSession: false },
  });

  return _client;
}

module.exports = { getSupabase };
