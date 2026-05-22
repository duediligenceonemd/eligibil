#!/usr/bin/env node
'use strict';

/**
 * Pre-build JSX → JS for all client-side React components.
 *
 * Eliminates the 3 MB @babel/standalone dependency from the browser.
 * Run: node scripts/build-jsx.js
 *
 * Sources:
 *   *.jsx           → dist/*.js          (component files)
 *   thumbs.js       → dist/thumbs.js     (contains JSX)
 *   src/inline-*.jsx → dist/inline-*.js  (page-level app shells)
 */

const fs = require('fs');
const path = require('path');
const babel = require('@babel/core');

const ROOT = path.resolve(__dirname, '..');
const SRC  = path.join(ROOT, 'src');
const DIST = path.join(ROOT, 'dist');

if (!fs.existsSync(DIST)) fs.mkdirSync(DIST);

const BABEL_OPTS = {
  plugins: [
    ['@babel/plugin-transform-react-jsx', {
      pragma: 'React.createElement',
      pragmaFrag: 'React.Fragment',
    }],
  ],
  sourceType: 'script',
};

function compile(code, filename) {
  return babel.transformSync(code, { ...BABEL_OPTS, filename }).code;
}

let ok = 0;
let fail = 0;

// ── Phase 1: Root .jsx files + thumbs.js ─────────────────────────────────────
console.log('Phase 1: External .jsx + thumbs.js');

const jsxFiles = fs.readdirSync(ROOT)
  .filter(f => f.endsWith('.jsx'))
  .map(f => path.join(ROOT, f));
jsxFiles.push(path.join(ROOT, 'thumbs.js'));

for (const src of jsxFiles) {
  const basename = path.basename(src);
  const outName = basename.replace(/\.jsx$/, '.js');
  const dest = path.join(DIST, outName);

  try {
    const code = fs.readFileSync(src, 'utf8');
    const result = compile(code, basename);
    fs.writeFileSync(dest, result, 'utf8');
    const srcKB = (Buffer.byteLength(code) / 1024).toFixed(1);
    const outKB = (Buffer.byteLength(result) / 1024).toFixed(1);
    console.log(`  ✓ ${basename} → dist/${outName}  (${srcKB}KB → ${outKB}KB)`);
    ok++;
  } catch (err) {
    console.error(`  ✗ ${basename}: ${err.message}`);
    fail++;
  }
}

// ── Phase 2: src/inline-*.jsx → dist/inline-*.js ────────────────────────────
console.log('\nPhase 2: src/inline-*.jsx (page app shells)');

if (fs.existsSync(SRC)) {
  const srcFiles = fs.readdirSync(SRC).filter(f => f.endsWith('.jsx'));
  for (const f of srcFiles) {
    const src = path.join(SRC, f);
    const outName = f.replace(/\.jsx$/, '.js');
    const dest = path.join(DIST, outName);

    try {
      const code = fs.readFileSync(src, 'utf8');
      const result = compile(code, f);
      fs.writeFileSync(dest, result, 'utf8');
      const outKB = (Buffer.byteLength(result) / 1024).toFixed(1);
      console.log(`  ✓ src/${f} → dist/${outName}  (${outKB}KB)`);
      ok++;
    } catch (err) {
      console.error(`  ✗ src/${f}: ${err.message}`);
      fail++;
    }
  }
} else {
  console.log('  (no src/ directory — skipped)');
}

console.log(`\nDone: ${ok} compiled, ${fail} failed.`);
if (fail > 0) process.exit(1);
