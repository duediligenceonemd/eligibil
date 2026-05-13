#!/usr/bin/env node
'use strict';

/**
 * Removes PDF artefact files from tmp/uploads/ that are older than 7 days.
 * Raw text is already persisted in artefacts.raw_text (first 100 kB), so the
 * file is redundant after analysis settles. Re-uploads create fresh files.
 *
 * Run manually (`node scripts/cleanup-uploads.js`) or wire into Cloud Scheduler
 * once Cloud Run filesystem grows large enough to matter.
 */

const fs   = require('fs');
const path = require('path');

const TMP_DIR        = path.join(__dirname, '..', 'tmp', 'uploads');
const SEVEN_DAYS_MS  = 7 * 24 * 60 * 60 * 1000;

function cleanup() {
  if (!fs.existsSync(TMP_DIR)) {
    console.log('[cleanup-uploads] tmp/uploads not present — nothing to do');
    return { dirs: 0, files: 0, deleted: 0 };
  }

  const userDirs = fs.readdirSync(TMP_DIR);
  let files = 0, deleted = 0;
  const now = Date.now();

  for (const uid of userDirs) {
    const dir = path.join(TMP_DIR, uid);
    let stat;
    try { stat = fs.statSync(dir); } catch { continue; }
    if (!stat.isDirectory()) continue;

    for (const f of fs.readdirSync(dir)) {
      const fp = path.join(dir, f);
      files++;
      try {
        const age = now - fs.statSync(fp).mtimeMs;
        if (age > SEVEN_DAYS_MS) {
          fs.unlinkSync(fp);
          deleted++;
        }
      } catch (e) {
        console.warn('[cleanup-uploads] could not stat/unlink', fp, e.message);
      }
    }

    // Remove empty user dirs
    try {
      if (!fs.readdirSync(dir).length) fs.rmdirSync(dir);
    } catch {}
  }

  console.log(`[cleanup-uploads] scanned ${userDirs.length} dirs, ${files} files, deleted ${deleted}`);
  return { dirs: userDirs.length, files, deleted };
}

if (require.main === module) cleanup();
module.exports = { cleanup };
