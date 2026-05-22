#!/usr/bin/env node
'use strict';

/**
 * Rewrite HTML files to use pre-built dist/ JS instead of runtime Babel.
 *
 * Changes:
 * 1. Remove <script src="...babel.min.js..."> line
 * 2. <script type="text/babel" src="X.jsx?v=..."> → <script src="/dist/X.js">
 * 3. <script type="text/babel" src="thumbs.js?v=..."> → <script src="/dist/thumbs.js">
 * 4. Inline <script type="text/babel">...</script> → <script src="/dist/inline-<page>.js"></script>
 *
 * Run after build-jsx.js.  Idempotent — won't double-rewrite.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const VERSION = '20260522a';

const htmlFiles = fs.readdirSync(ROOT)
  .filter(f => f.endsWith('.html'))
  .map(f => path.join(ROOT, f));

let changed = 0;

for (const htmlPath of htmlFiles) {
  const pageName = path.basename(htmlPath, '.html');
  let html = fs.readFileSync(htmlPath, 'utf8');
  const original = html;

  // Skip if already rewritten (no babel references)
  if (!html.includes('babel')) {
    continue;
  }

  // 1. Remove Babel standalone <script> line (with or without SRI)
  html = html.replace(/^.*<script[^>]*@babel\/standalone[^>]*><\/script>\s*\n?/gm, '');

  // 2. External JSX files: <script type="text/babel" src="[/]components-X.jsx[?v=...]">
  //    → <script src="/dist/components-X.js">
  html = html.replace(
    /<script type="text\/babel" src="[/]?([\w-]+)\.(jsx|js)\??[^"]*">\s*<\/script>/g,
    (match, name, ext) => {
      return `<script src="/dist/${name}.js?v=${VERSION}"></script>`;
    }
  );

  // 3. Replace inline <script type="text/babel">...</script> with external ref
  let inlineIdx = 0;
  html = html.replace(
    /<script type="text\/babel">([\s\S]*?)<\/script>/g,
    (match, code) => {
      if (!code.trim()) return '';
      const suffix = inlineIdx === 0 ? '' : `-${inlineIdx}`;
      inlineIdx++;
      return `<script src="/dist/inline-${pageName}${suffix}.js?v=${VERSION}"></script>`;
    }
  );

  if (html !== original) {
    fs.writeFileSync(htmlPath, html, 'utf8');
    console.log(`  ✓ ${pageName}.html rewritten`);
    changed++;
  }
}

console.log(`\nDone: ${changed} HTML files rewritten.`);
