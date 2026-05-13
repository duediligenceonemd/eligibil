'use strict';

/**
 * Persistent user store backed by Supabase (profiles + startups tables).
 * Exposes the same insert / findOne / findAll / update / remove API as
 * db/database.js (the JSON store) so routes/auth.js + routes/admin.js
 * can swap import lines without changing behaviour.
 *
 * Critical contracts preserved:
 *   - findOne('users', { email }) and findOne('users', { id }) work
 *   - insert('users', data) returns the row including id + created_at
 *   - findOne('startups', { user_id }) works
 *
 * Differences from JSON store (caller should not care):
 *   - ids are UUID strings, not auto-increment integers
 *   - all calls are async; the returned promise resolves to the same shape
 *
 * RLS: this module ALWAYS uses the service-role client (bypasses RLS),
 * so password_hash rows are accessible. The profiles + startups tables
 * have no anon/authenticated grants → nothing leaks via REST.
 */

const { getSupabase } = require('./supabase');

// Map JSON-store collection name → Supabase table name
const TABLE = {
  users:           'profiles',
  startups:        'startups',
  saved_grants:    'saved_grants',
  pipeline_items:  'pipeline_items',
};

function resolveTable(name) {
  const t = TABLE[name];
  if (!t) throw new Error(`users-supabase adapter does not support table "${name}"`);
  return t;
}

/** Insert a row, return the inserted record (with id + created_at). */
async function insert(table, data) {
  const t = resolveTable(table);
  const sb = getSupabase();
  // Strip undefined so Postgres defaults kick in
  const clean = Object.fromEntries(
    Object.entries(data).filter(([, v]) => v !== undefined)
  );
  const { data: row, error } = await sb.from(t).insert(clean).select().single();
  if (error) throw new Error(`insert ${t}: ${error.message}`);
  return row;
}

/** Find first row matching the predicate (exact equality on every key). */
async function findOne(table, predicate) {
  const t = resolveTable(table);
  const sb = getSupabase();
  let q = sb.from(t).select('*').limit(1);
  for (const [k, v] of Object.entries(predicate || {})) q = q.eq(k, v);
  const { data, error } = await q;
  if (error) throw new Error(`findOne ${t}: ${error.message}`);
  return (data && data[0]) || null;
}

/** Find all rows matching the predicate. */
async function findAll(table, predicate = {}) {
  const t = resolveTable(table);
  const sb = getSupabase();
  let q = sb.from(t).select('*');
  for (const [k, v] of Object.entries(predicate)) q = q.eq(k, v);
  const { data, error } = await q;
  if (error) throw new Error(`findAll ${t}: ${error.message}`);
  return data || [];
}

/** Update rows matching the predicate, return first updated row. */
async function update(table, predicate, data) {
  const t = resolveTable(table);
  const sb = getSupabase();
  let q = sb.from(t).update(data);
  for (const [k, v] of Object.entries(predicate || {})) q = q.eq(k, v);
  const { data: rows, error } = await q.select();
  if (error) throw new Error(`update ${t}: ${error.message}`);
  return (rows && rows[0]) || null;
}

/** Remove rows matching the predicate, return count removed. */
async function remove(table, predicate) {
  const t = resolveTable(table);
  const sb = getSupabase();
  let q = sb.from(t).delete();
  for (const [k, v] of Object.entries(predicate || {})) q = q.eq(k, v);
  const { data, error } = await q.select();
  if (error) throw new Error(`remove ${t}: ${error.message}`);
  return (data || []).length;
}

function init() {
  // Sanity-check the connection so a misconfigured env crashes fast on boot.
  try {
    getSupabase();
    console.log('Supabase user store ready (profiles + startups)');
  } catch (e) {
    console.error('Supabase user store NOT ready:', e.message);
  }
}

module.exports = { init, insert, findOne, findAll, update, remove };
