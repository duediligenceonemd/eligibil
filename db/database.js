'use strict';
// Pure-JS JSON file store — no native compilation required.
// Emulates basic table operations: insert, findOne, findAll, update, remove.

const fs   = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'eligibil.json');

const EMPTY_DB = {
  _seq: {},          // auto-increment counters per table
  users: [],
  startups: [],
  saved_grants: [],
  pipeline_items: [],
};

let _db = null;

function load() {
  if (_db) return _db;
  if (!fs.existsSync(DB_PATH)) {
    _db = JSON.parse(JSON.stringify(EMPTY_DB));
    save();
  } else {
    try {
      _db = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
      // back-fill any missing tables
      for (const key of Object.keys(EMPTY_DB)) {
        if (_db[key] === undefined) _db[key] = JSON.parse(JSON.stringify(EMPTY_DB[key]));
      }
    } catch {
      _db = JSON.parse(JSON.stringify(EMPTY_DB));
      save();
    }
  }
  return _db;
}

function save() {
  fs.writeFileSync(DB_PATH, JSON.stringify(_db, null, 2), 'utf8');
}

function nextId(table) {
  const db = load();
  db._seq[table] = (db._seq[table] || 0) + 1;
  return db._seq[table];
}

// ── Public API ───────────────────────────────────────────────────────────────

function init() {
  load();
  console.log('JSON store ready at', DB_PATH);
}

/** Insert a record. Returns the record with auto-assigned `id` and `created_at`. */
function insert(table, data) {
  const db = load();
  if (!db[table]) db[table] = [];
  const record = {
    id: nextId(table),
    created_at: new Date().toISOString(),
    ...data,
  };
  db[table].push(record);
  save();
  return record;
}

/** Find first record matching predicate object (exact key=value). */
function findOne(table, predicate) {
  const db = load();
  const rows = db[table] || [];
  return rows.find(r => matchesPredicate(r, predicate)) || null;
}

/** Find all records matching predicate object. */
function findAll(table, predicate = {}) {
  const db = load();
  const rows = db[table] || [];
  return rows.filter(r => matchesPredicate(r, predicate));
}

/** Update all records matching predicate. Returns first updated record or null. */
function update(table, predicate, data) {
  const db = load();
  const rows = db[table] || [];
  let updated = null;
  for (let i = 0; i < rows.length; i++) {
    if (matchesPredicate(rows[i], predicate)) {
      rows[i] = { ...rows[i], ...data, updated_at: new Date().toISOString() };
      updated = rows[i];
    }
  }
  if (updated) save();
  return updated;
}

/** Remove all records matching predicate. Returns count removed. */
function remove(table, predicate) {
  const db = load();
  const before = (db[table] || []).length;
  db[table] = (db[table] || []).filter(r => !matchesPredicate(r, predicate));
  const removed = before - db[table].length;
  if (removed) save();
  return removed;
}

function matchesPredicate(record, predicate) {
  return Object.entries(predicate).every(([k, v]) => record[k] === v);
}

module.exports = { init, insert, findOne, findAll, update, remove };
