'use strict';

const session = require('express-session');
const { getSupabase } = require('../db/supabase');

class SupabaseSessionStore extends session.Store {
  constructor(options = {}) {
    super();
    this.table = options.table || 'app_sessions';
    this.ttlMs = Number(options.ttlMs || 24 * 60 * 60 * 1000);
  }

  expiresAt(sess) {
    const maxAge = sess?.cookie?.maxAge;
    const ttl = Number.isFinite(maxAge) && maxAge > 0 ? maxAge : this.ttlMs;
    return new Date(Date.now() + ttl).toISOString();
  }

  get(sid, callback) {
    getSupabase()
      .from(this.table)
      .select('sess, expires_at')
      .eq('sid', sid)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) return callback(error);
        if (!data) return callback(null, null);
        if (new Date(data.expires_at).getTime() <= Date.now()) {
          this.destroy(sid, () => callback(null, null));
          return;
        }
        callback(null, data.sess);
      })
      .catch(callback);
  }

  set(sid, sess, callback = () => {}) {
    getSupabase()
      .from(this.table)
      .upsert({
        sid,
        sess,
        expires_at: this.expiresAt(sess),
        updated_at: new Date().toISOString(),
      }, { onConflict: 'sid' })
      .then(({ error }) => callback(error || null))
      .catch(callback);
  }

  destroy(sid, callback = () => {}) {
    getSupabase()
      .from(this.table)
      .delete()
      .eq('sid', sid)
      .then(({ error }) => callback(error || null))
      .catch(callback);
  }

  touch(sid, sess, callback = () => {}) {
    getSupabase()
      .from(this.table)
      .update({
        expires_at: this.expiresAt(sess),
        updated_at: new Date().toISOString(),
      })
      .eq('sid', sid)
      .then(({ error }) => callback(error || null))
      .catch(callback);
  }
}

module.exports = { SupabaseSessionStore };
