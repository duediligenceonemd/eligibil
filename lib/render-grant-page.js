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

const SITE_URL = process.env.SITE_URL || 'https://eligibil.org';
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
    ? title + ' — ' + funderName + ' | eligibil.org'
    : title + ' | eligibil.org';

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
    '<div id="grant-root"></div>\n' + dataScript + '\n' + renderEnhancedSections(grant, lang)
  );

  return html;
}

// =============================================================================
// renderEnhancedSections — 6 SEO + product sections appended after React mount
//   1. ScoreBand placeholder (hydrated by inline JS from /api/grants/:id)
//   2. EligibilityList — ✓/✗/⚠ for each rule in eligibility_rules
//   3. DocumentsTable — required docs from documents_required
//   4. Timeline — application milestones computed from deadline
//   5. CriteriaBars — evaluation_criteria weighted bars
//   6. TrustCard — evidence_status + source_url + last_checked_at
// =============================================================================
function renderEnhancedSections(g, lang) {
  const isEn = lang === 'en';
  const T = (ro, en) => isEn ? en : ro;

  const rules    = Array.isArray(g.eligibility_rules)   ? g.eligibility_rules   : [];
  const docs     = Array.isArray(g.documents_required)  ? g.documents_required  : [];
  const criteria = Array.isArray(g.evaluation_criteria) ? g.evaluation_criteria : [];

  const deadline = g.deadline ? String(g.deadline) : '';
  const sourceUrl = g.source_url || '';
  const evidence = g.evidence_status || '';
  const lastChecked = g.last_checked_at || g.updated_at || '';

  // ── Compute timeline milestones (5 steps, relative to deadline) ────────────
  function tryParseDeadline(s) {
    if (!s) return null;
    let d = new Date(s);
    if (!isNaN(d.getTime())) return d;
    const RO = {'ian':0,'feb':1,'mar':2,'apr':3,'mai':4,'iun':5,'iul':6,'aug':7,'sep':8,'oct':9,'noi':10,'dec':11};
    const m = s.match(/(\d{1,2})\s+(\w+)\s+(\d{4})/);
    if (m) {
      const month = RO[m[2].toLowerCase().slice(0,3)];
      if (month !== undefined) return new Date(parseInt(m[3]), month, parseInt(m[1]));
    }
    return null;
  }
  const deadlineDate = tryParseDeadline(deadline);
  const fmt = (d) => d ? d.toLocaleDateString(isEn ? 'en-US' : 'ro-RO', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

  const now = new Date();
  const milestones = [];
  if (deadlineDate) {
    const prep = new Date(deadlineDate.getTime() - 60 * 86400000);
    const eval_ = new Date(deadlineDate.getTime() + 90 * 86400000);
    const decision = new Date(deadlineDate.getTime() + 120 * 86400000);
    const contract = new Date(deadlineDate.getTime() + 180 * 86400000);
    milestones.push({ label: T('Acum', 'Now'), date: now, active: true });
    milestones.push({ label: T('Pregătire', 'Preparation'), date: prep });
    milestones.push({ label: T('Submission', 'Submission'), date: deadlineDate, deadline: true });
    milestones.push({ label: T('Evaluare', 'Evaluation'), date: eval_ });
    milestones.push({ label: T('Decizie', 'Decision'), date: decision });
    milestones.push({ label: T('Contract', 'Contract'), date: contract });
  }

  // ── helpers ────────────────────────────────────────────────────────────────
  const E = escapeHtml;
  const evidenceLabel = {
    verified_primary:        T('Sursă oficială primară',   'Primary verified source'),
    verified_secondary:      T('Sursă verificată secundar', 'Secondary verified source'),
    ai_extracted_unverified: T('Extras AI · neverificat',   'AI-extracted · unverified'),
    hypothesis:              T('Ipoteză · în curs',         'Hypothesis · in progress'),
  }[evidence] || T('Status necunoscut', 'Unknown status');
  const evidenceColor = evidence === 'verified_primary' ? '#0a5c3e'
                      : evidence === 'verified_secondary' ? '#1f3a5f'
                      : '#b8730a';

  return `
<style>
  .gp-enh { max-width: 1200px; margin: 0 auto; padding: 48px 24px; font-family: Inter, system-ui, sans-serif; }
  .gp-enh__sec { padding: 32px 0; border-top: 1px solid #d4cfc4; }
  .gp-enh__lbl { font-family: 'JetBrains Mono', monospace; font-size: 11px; color: #1f3a5f; text-transform: uppercase; letter-spacing: .12em; margin-bottom: 8px; }
  .gp-enh h2 { font-family: 'Space Grotesk', sans-serif; font-size: 28px; margin: 4px 0 20px; color: #0e1620; }
  .gp-enh ul { list-style: none; padding: 0; margin: 0; }
  .gp-enh__rule { display: flex; gap: 12px; padding: 12px 0; border-bottom: 1px solid #ede9df; align-items: flex-start; }
  .gp-enh__rule-icon { width: 24px; height: 24px; flex-shrink: 0; display: inline-flex; align-items: center; justify-content: center; font-weight: 700; }
  .gp-enh__rule-icon.met { color: #0a5c3e; }
  .gp-enh__rule-icon.miss { color: #a8341e; }
  .gp-enh__rule-icon.unknown { color: #b8730a; }
  .gp-enh__rule-body { flex: 1; }
  .gp-enh__rule-name { font-weight: 600; color: #0e1620; font-size: 15px; }
  .gp-enh__rule-req { font-family: 'JetBrains Mono', monospace; font-size: 10px; padding: 2px 6px; background: #f7f5f0; border: 1px solid #d4cfc4; border-radius: 2px; text-transform: uppercase; letter-spacing: .08em; color: #555; margin-left: 8px; }
  .gp-enh__rule-evidence { font-size: 13px; color: #555; margin-top: 4px; }
  .gp-enh__doc { display: grid; grid-template-columns: 1fr auto auto; gap: 16px; padding: 14px 0; border-bottom: 1px solid #ede9df; align-items: center; }
  .gp-enh__doc-name { font-weight: 600; color: #0e1620; font-size: 15px; }
  .gp-enh__doc-fmt { font-family: 'JetBrains Mono', monospace; font-size: 11px; color: #666; text-transform: uppercase; }
  .gp-enh__doc-req { padding: 3px 8px; font-family: 'JetBrains Mono', monospace; font-size: 10px; border-radius: 2px; text-transform: uppercase; }
  .gp-enh__doc-req.required { background: #fef3c7; color: #92400e; border: 1px solid #fde68a; }
  .gp-enh__doc-req.optional { background: #f7f5f0; color: #555; border: 1px solid #d4cfc4; }
  .gp-enh__timeline { position: relative; padding: 32px 0 16px; }
  .gp-enh__timeline-line { position: absolute; top: 50px; left: 24px; right: 24px; height: 2px; background: #d4cfc4; }
  .gp-enh__timeline-track { display: grid; grid-template-columns: repeat(${milestones.length || 1}, 1fr); gap: 8px; position: relative; }
  .gp-enh__milestone { text-align: center; position: relative; padding-top: 28px; }
  .gp-enh__milestone-dot { position: absolute; top: 14px; left: 50%; transform: translateX(-50%); width: 14px; height: 14px; border-radius: 50%; background: #fff; border: 2px solid #1f3a5f; }
  .gp-enh__milestone.active .gp-enh__milestone-dot { background: #1f3a5f; }
  .gp-enh__milestone.deadline .gp-enh__milestone-dot { background: #a8341e; border-color: #a8341e; }
  .gp-enh__milestone-label { font-family: 'JetBrains Mono', monospace; font-size: 10px; color: #555; text-transform: uppercase; letter-spacing: .06em; }
  .gp-enh__milestone-date { font-size: 12px; color: #0e1620; margin-top: 2px; font-weight: 600; }
  .gp-enh__crit { display: grid; grid-template-columns: 180px 1fr 60px; gap: 12px; padding: 10px 0; align-items: center; }
  .gp-enh__crit-name { font-weight: 600; color: #0e1620; font-size: 14px; }
  .gp-enh__crit-bar-track { height: 14px; background: #f7f5f0; border: 1px solid #d4cfc4; position: relative; overflow: hidden; }
  .gp-enh__crit-bar-fill { height: 100%; background: #1f3a5f; }
  .gp-enh__crit-weight { font-family: 'JetBrains Mono', monospace; font-size: 12px; color: #1f3a5f; text-align: right; font-weight: 700; }
  .gp-enh__crit-desc { grid-column: 2 / 4; font-size: 12px; color: #666; margin-top: -2px; padding-bottom: 8px; }
  .gp-enh__trust { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; padding: 24px; background: #f7f5f0; border: 1px solid #d4cfc4; border-radius: 4px; }
  .gp-enh__trust-item dt { font-family: 'JetBrains Mono', monospace; font-size: 11px; color: #555; text-transform: uppercase; letter-spacing: .08em; }
  .gp-enh__trust-item dd { margin: 4px 0 0; font-size: 14px; color: #0e1620; }
  .gp-enh__trust-badge { display: inline-flex; padding: 4px 10px; font-family: 'JetBrains Mono', monospace; font-size: 11px; text-transform: uppercase; letter-spacing: .08em; border-radius: 3px; color: #fff; }
  .gp-enh__report { font-size: 13px; color: #1f3a5f; text-decoration: underline; }
  .gp-enh__cta-mid { padding: 36px 28px; background: #1f3a5f; color: #fff; margin: 32px 0; text-align: center; border-radius: 4px; }
  .gp-enh__cta-mid h3 { font-family: 'Space Grotesk', sans-serif; font-size: 24px; margin: 0 0 12px; color: #fff; }
  .gp-enh__cta-mid p { font-size: 14px; color: rgba(255,255,255,.85); margin: 0 0 18px; }
  .gp-enh__cta-mid a { display: inline-block; padding: 14px 28px; background: #fff; color: #1f3a5f; text-decoration: none; font-weight: 700; border-radius: 3px; }
  @media (max-width: 768px) {
    .gp-enh { padding: 32px 16px; }
    .gp-enh__doc { grid-template-columns: 1fr; gap: 6px; }
    .gp-enh__crit { grid-template-columns: 1fr; gap: 4px; }
    .gp-enh__crit-desc { grid-column: 1; }
    .gp-enh__trust { grid-template-columns: 1fr; }
    .gp-enh__timeline-line { display: none; }
    .gp-enh__timeline-track { grid-template-columns: 1fr; }
    .gp-enh__milestone { padding-top: 0; padding-left: 28px; text-align: left; padding-bottom: 12px; }
    .gp-enh__milestone-dot { top: 4px; left: 0; transform: none; }
  }
</style>

<div class="gp-enh">

  ${rules.length ? `
  <section class="gp-enh__sec" id="enh-eligibility">
    <div class="gp-enh__lbl">${T('Eligibilitate · reguli structurate', 'Eligibility · structured rules')}</div>
    <h2>${T('Ești eligibil?', 'Are you eligible?')}</h2>
    <ul>
      ${rules.map(r => {
        const required = r.required ? T('OBLIGATORIU', 'REQUIRED') : T('OPȚIONAL', 'OPTIONAL');
        return `<li class="gp-enh__rule">
          <span class="gp-enh__rule-icon unknown" title="${T('Necesită autentificare pentru a verifica', 'Requires login to evaluate')}">?</span>
          <div class="gp-enh__rule-body">
            <span class="gp-enh__rule-name">${E(r.rule || r.kind || r.type || '—')}</span>
            <span class="gp-enh__rule-req">${E(required)}</span>
            ${r.value && typeof r.value !== 'object' ? `<div class="gp-enh__rule-evidence">${T('Cerință', 'Requirement')}: ${E(String(r.value))}</div>` : ''}
          </div>
        </li>`;
      }).join('')}
    </ul>
    <p style="font-size:13px;color:#555;margin-top:16px">
      ${T('Conectează-te ca să vezi câte reguli îndeplinești cu profilul tău actual.', 'Sign in to see how many rules your current profile meets.')}
    </p>
  </section>` : ''}

  ${docs.length ? `
  <section class="gp-enh__sec" id="enh-documents">
    <div class="gp-enh__lbl">${T('Cerințe documentare', 'Documentation requirements')}</div>
    <h2>${T('Ce documente îți trebuie', 'What documents you need')}</h2>
    ${docs.map(d => `<div class="gp-enh__doc">
      <span class="gp-enh__doc-name">${E(d.name || '—')}</span>
      <span class="gp-enh__doc-fmt">${E(d.format || '')}${d.max_pages ? ` · ${T('max', 'max')} ${d.max_pages} ${T('pag', 'pp')}` : ''}</span>
      <span class="gp-enh__doc-req ${d.required ? 'required' : 'optional'}">${d.required ? T('OBLIGATORIU', 'REQUIRED') : T('OPȚIONAL', 'OPTIONAL')}</span>
    </div>`).join('')}
  </section>` : ''}

  ${milestones.length ? `
  <section class="gp-enh__sec" id="enh-timeline">
    <div class="gp-enh__lbl">${T('Timeline aplicare', 'Application timeline')}</div>
    <h2>${T('Pașii principali până la contract', 'Main milestones to contract')}</h2>
    <div class="gp-enh__timeline">
      <div class="gp-enh__timeline-line"></div>
      <div class="gp-enh__timeline-track">
        ${milestones.map(m => `<div class="gp-enh__milestone ${m.active ? 'active' : ''} ${m.deadline ? 'deadline' : ''}">
          <span class="gp-enh__milestone-dot"></span>
          <div class="gp-enh__milestone-label">${E(m.label)}</div>
          <div class="gp-enh__milestone-date">${E(fmt(m.date))}</div>
        </div>`).join('')}
      </div>
    </div>
  </section>` : ''}

  ${criteria.length ? `
  <section class="gp-enh__sec" id="enh-criteria">
    <div class="gp-enh__lbl">${T('Criterii de evaluare', 'Evaluation criteria')}</div>
    <h2>${T('Ce caută evaluatorii', 'What evaluators look for')}</h2>
    ${criteria.map(c => {
      const w = parseInt(c.weight, 10) || 0;
      return `<div class="gp-enh__crit">
        <span class="gp-enh__crit-name">${E(c.name || '—')}</span>
        <div class="gp-enh__crit-bar-track"><div class="gp-enh__crit-bar-fill" style="width:${w}%"></div></div>
        <span class="gp-enh__crit-weight">${w}%</span>
        ${c.description ? `<div class="gp-enh__crit-desc">${E(c.description)}</div>` : ''}
      </div>`;
    }).join('')}
  </section>` : ''}

  <section class="gp-enh__cta-mid" id="enh-cta">
    <h3>${T('Vrei să vezi scorurile tale pentru acest grant?', 'Want to see your scores for this grant?')}</h3>
    <p>${T('Încarcă pitch deck-ul · 90 secunde · gratuit · anonim până te înregistrezi', 'Upload your pitch deck · 90 seconds · free · anonymous until you sign up')}</p>
    <a href="/produs/pitch">${T('Analizează pitch deck →', 'Analyze pitch deck →')}</a>
  </section>

  <section class="gp-enh__sec" id="enh-trust">
    <div class="gp-enh__lbl">${T('Sursă & prospețime date', 'Source & data freshness')}</div>
    <h2>${T('De unde știm asta', 'Where this data comes from')}</h2>
    <div class="gp-enh__trust">
      <div class="gp-enh__trust-item">
        <dt>${T('Status evidență', 'Evidence status')}</dt>
        <dd><span class="gp-enh__trust-badge" style="background:${evidenceColor}">${E(evidenceLabel)}</span></dd>
        <dt style="margin-top:14px">${T('Ultima verificare', 'Last checked')}</dt>
        <dd>${E(lastChecked ? new Date(lastChecked).toLocaleDateString(isEn ? 'en-US' : 'ro-RO', { day:'2-digit', month:'short', year:'numeric' }) : '—')}</dd>
      </div>
      <div class="gp-enh__trust-item">
        ${sourceUrl ? `<dt>${T('Sursă oficială', 'Official source')}</dt>
        <dd><a href="${E(sourceUrl)}" target="_blank" rel="noopener" style="color:#1f3a5f">${E(sourceUrl)} ↗</a></dd>` : ''}
        ${g.application_url ? `<dt style="margin-top:14px">${T('URL aplicare', 'Application URL')}</dt>
        <dd><a href="${E(g.application_url)}" target="_blank" rel="noopener" style="color:#1f3a5f">${E(g.application_url)} ↗</a></dd>` : ''}
        <dt style="margin-top:14px">${T('Raportezi o eroare?', 'Report incorrect data?')}</dt>
        <dd><a href="mailto:info@eligibil.org?subject=${encodeURIComponent('Grant: ' + (g.nume_program || g.id || ''))}" class="gp-enh__report">${T('Scrie-ne →', 'Email us →')}</a></dd>
      </div>
    </div>
  </section>

</div>
`;
}

module.exports = { renderGrantPage };
