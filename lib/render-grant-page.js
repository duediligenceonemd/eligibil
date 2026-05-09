'use strict';

// Renders grant.html with SEO meta, hreflang, JSON-LD, and window.__GRANT_DATA__
// injected server-side. The template is read once and cached per-process.
//
// grant.html uses relative asset paths (styles.css, auth.js, components-grant.jsx).
// From a URL like /ro/granturi/eic-accelerator-2026 those would resolve as
// /ro/granturi/styles.css → 404. We inject <base href="/"> as the first child
// of <head> so all relative URLs resolve from the site root.

const fs   = require('fs');
const path = require('path');

const SITE_URL = process.env.SITE_URL || 'https://eligibil.eu';
const TEMPLATE_PATH = path.join(__dirname, '..', 'grant.html');

let cachedTemplate = null;
function loadTemplate() {
  if (cachedTemplate === null) {
    cachedTemplate = fs.readFileSync(TEMPLATE_PATH, 'utf8');
  }
  return cachedTemplate;
}

function escapeHtml(s) {
  if (s == null) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// JSON safe to embed inside <script>...</script>. Escapes HTML-significant
// chars (so a stray "</script>" in the data can't terminate the script tag),
// plus U+2028/U+2029 (valid in JSON strings but illegal as raw chars in a JS
// string literal — would syntax-error the inline script). The line-separator
// chars are constructed via String.fromCharCode so this source file contains
// no literal U+2028/U+2029 bytes itself.
const _LS = String.fromCharCode(0x2028);
const _PS = String.fromCharCode(0x2029);
const _SCRIPT_RE = new RegExp('[<>&]|' + _LS + '|' + _PS, 'g');
// IMPORTANT: the values in _SCRIPT_ESC are 6-char strings (backslash + uXXXX).
// We construct them via String.fromCharCode(0x5c) so the source has no literal
// backslashes for a linter to 'simplify' away — that has happened twice in this
// codebase (see git history) and silently breaks the script-escape contract.
const _BS = String.fromCharCode(0x5c);
const _SCRIPT_ESC = {
  '<': _BS + 'u003c',
  '>': _BS + 'u003e',
  '&': _BS + 'u0026',
};
_SCRIPT_ESC[_LS] = _BS + 'u2028';
_SCRIPT_ESC[_PS] = _BS + 'u2029';

function safeJson(obj) {
  return JSON.stringify(obj).replace(_SCRIPT_RE, (c) => _SCRIPT_ESC[c]);
}

function renderGrantPage(grant, lang) {
  const isEn = lang === 'en';
  const pathSegment = isEn ? 'grants' : 'granturi';

  const slugRo = grant.slug_ro || '';
  const slugEn = grant.slug_en || slugRo;
  const currentSlug = isEn ? (slugEn || slugRo) : slugRo;

  const title = isEn
    ? (grant.nume_program_en || grant.nume_program || '')
    : (grant.nume_program || '');

  const description = isEn
    ? (grant.short_summary_en || grant.short_summary_ro || '')
    : (grant.short_summary_ro || grant.short_summary_en || '');

  const funderName = grant.funder_name || grant.organizatie || '';
  const seoTitle = funderName
    ? title + ' — ' + funderName + ' | eligibil.eu'
    : title + ' | eligibil.eu';

  const canonical = SITE_URL + '/' + lang + '/' + pathSegment + '/' + currentSlug;
  const roUrl = slugRo ? SITE_URL + '/ro/granturi/' + slugRo : null;
  const enUrl = slugEn ? SITE_URL + '/en/grants/' + slugEn : null;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'GrantingAgency',
    name: funderName || title,
    offers: {
      '@type': 'Offer',
      name: title,
      url: canonical,
    },
  };

  // <base> goes first so relative asset URLs resolve from the site root.
  const baseTag = '<base href="/" />';

  const seoTags = [
    '<link rel="canonical" href="' + escapeHtml(canonical) + '" />',
    roUrl ? '<link rel="alternate" hreflang="ro" href="' + escapeHtml(roUrl) + '" />' : '',
    enUrl ? '<link rel="alternate" hreflang="en" href="' + escapeHtml(enUrl) + '" />' : '',
    roUrl ? '<link rel="alternate" hreflang="x-default" href="' + escapeHtml(roUrl) + '" />' : '',
    '<meta property="og:title" content="' + escapeHtml(title) + '" />',
    '<meta property="og:description" content="' + escapeHtml(description) + '" />',
    '<meta property="og:url" content="' + escapeHtml(canonical) + '" />',
    '<meta property="og:type" content="article" />',
    '<meta name="robots" content="index, follow" />',
    '<script type="application/ld+json">' + safeJson(jsonLd) + '</script>',
  ].filter(Boolean).join('\n');

  // Strip the embedding/fts vector before serialization — large + useless to client.
  const safeGrant = Object.assign({}, grant);
  delete safeGrant.embedding;
  delete safeGrant.fts;

  const dataScript =
    '<script>window.__GRANT_DATA__=' + safeJson(safeGrant) + ';' +
    'window.__LANG__=' + safeJson(lang) + ';</script>';

  let html = loadTemplate();

  // Replace <html lang="..."> attribute
  html = html.replace(/<html\s+lang="[^"]*"/i, '<html lang="' + lang + '"');

  // Replace existing <title>
  html = html.replace(/<title>[\s\S]*?<\/title>/i, '<title>' + escapeHtml(seoTitle) + '</title>');

  // Replace existing <meta name="description" ...>
  html = html.replace(
    /<meta\s+name="description"[^>]*\/?>/i,
    '<meta name="description" content="' + escapeHtml(description) + '" />'
  );

  // Inject <base> as the first child of <head> so it precedes every relative URL.
  html = html.replace(/<head>\s*/i, '<head>\n' + baseTag + '\n');

  // Inject SEO meta + JSON-LD right before </head>
  html = html.replace('</head>', seoTags + '\n</head>');

  // Inject window.__GRANT_DATA__ + window.__LANG__ right after the mount point,
  // so it's defined before components-grant.jsx (which loads later via Babel) reads it.
  html = html.replace(
    '<div id="grant-root"></div>',
    '<div id="grant-root"></div>\n' + dataScript
  );

  return html;
}

module.exports = { renderGrantPage };
