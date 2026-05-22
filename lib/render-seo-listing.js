'use strict';

// Renders a programmatic SEO listing page for a (sector, country) combo.
// Distinct from /search (the React-mounted catalog browser): these pages
// are server-rendered HTML — Google needs to see the full content without
// running JS, and the SEO use case wants stable URLs like
// /ro/granturi-ai-moldova that match how people search.
//
// The script-escape map is constructed via String.fromCharCode(0x5c) so the
// source has no literal backslashes — see lib/render-grant-page.js for the
// rationale (a linter has stripped these twice in this codebase).

const SITE_URL = process.env.SITE_URL || 'https://eligibil.org';

// ─── Escape helpers (mirrors lib/render-grant-page.js) ───────────────────────
function escapeHtml(s) {
  if (s == null) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const _LS = String.fromCharCode(0x2028);
const _PS = String.fromCharCode(0x2029);
const _BS = String.fromCharCode(0x5c);
const _SCRIPT_RE = new RegExp('[<>&]|' + _LS + '|' + _PS, 'g');
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

// ─── Card / chip helpers ─────────────────────────────────────────────────────
const RO_MONTHS = { ian:0, feb:1, mar:2, apr:3, mai:4, iun:5, iul:6, aug:7, sep:8, oct:9, noi:10, dec:11 };

function parseDeadline(str) {
  if (!str) return null;
  const m = String(str).match(/(\d{1,2})\s+(\w+)\s+(\d{4})/);
  if (!m) return null;
  const month = RO_MONTHS[m[2].toLowerCase().slice(0, 3)];
  if (month === undefined) return null;
  const d = new Date(parseInt(m[3], 10), month, parseInt(m[1], 10));
  return isNaN(d) ? null : d;
}

function deadlineChip(deadline) {
  const d = parseDeadline(deadline);
  if (!d) return { text: deadline || 'Rolling', cls: '' };
  const days = Math.ceil((d - new Date()) / (1000 * 60 * 60 * 24));
  if (days < 0)  return { text: 'Închis', cls: '' };
  if (days < 7)  return { text: `${days} zile`, cls: 'sb__chip--deadline-crit' };
  if (days < 14) return { text: `${days} zile`, cls: 'sb__chip--deadline-soon' };
  return { text: `${days} zile`, cls: '' };
}

function formatAmount(min, max) {
  const fmt = (n) => n >= 1_000_000 ? `€${(n / 1_000_000).toFixed(1).replace('.0', '')}M`
                   : n >= 1000      ? `€${Math.round(n / 1000)}K`
                                    : `€${n}`;
  if (min && max && min !== max) return `${fmt(min)} – ${fmt(max)}`;
  if (max) return `până la ${fmt(max)}`;
  if (min) return `de la ${fmt(min)}`;
  return '—';
}

const EVIDENCE_LABEL = {
  ro: {
    verified_primary:        'Verificat',
    verified_secondary:      'Verificat din surse secundare',
    ai_extracted_unverified: 'AI extras',
    hypothesis:              'Ipoteză',
  },
  en: {
    verified_primary:        'Verified',
    verified_secondary:      'Cross-checked',
    ai_extracted_unverified: 'AI extracted',
    hypothesis:              'Hypothesis',
  },
};

function detailUrl(grant, lang) {
  if (lang === 'en' && grant.slug_en) return '/en/grants/' + grant.slug_en;
  if (grant.slug_ro) return '/ro/granturi/' + grant.slug_ro;
  return '/grant.html?id=' + encodeURIComponent(grant.id);
}

// ─── i18n strings (per-page; no lang.js runtime translation needed since the
//    URL already encodes the language) ────────────────────────────────────────
const STR = {
  ro: {
    nav_home: 'Acasă',
    nav_search: 'Caută',
    nav_events: 'Evenimente',
    nav_cta: 'Începe gratuit →',
    crumbs_root: 'Granturi',
    breadcrumb_arrow: '›',
    sub_count: (n) => `${n} programe active · actualizat săptămânal`,
    sub_count_zero: 'Nicio sursă activă în acest moment · revin săptămânal',
    intro_h: (s, c) => `Granturi ${s} pentru startupuri din ${c}`,
    cta_title: 'Vrei filtre mai precise?',
    cta_body: 'Folosește căutarea avansată cu 7 filtre (sumă, dilutiv, limbă, deadline) și URL shareable.',
    cta_btn: 'Caută cu filtre avansate →',
    funder: 'Funder',
    deadline_label: 'Deadline',
    faq_h: 'Întrebări frecvente',
    no_results_h: 'Nicio finanțare activă pe acest filtru',
    no_results_p: 'Programele se pot deschide periodic — verifică săptămânal sau caută cu filtre mai largi.',
    catalog_link: 'Vezi tot catalogul →',
  },
  en: {
    nav_home: 'Home',
    nav_search: 'Search',
    nav_events: 'Events',
    nav_cta: 'Start free →',
    crumbs_root: 'Grants',
    breadcrumb_arrow: '›',
    sub_count: (n) => `${n} active programs · updated weekly`,
    sub_count_zero: 'No active sources right now · check back weekly',
    intro_h: (s, c) => `${s} grants for startups in ${c}`,
    cta_title: 'Want sharper filters?',
    cta_body: 'Use advanced search with 7 filters (amount, dilutive, language, deadline) and shareable URLs.',
    cta_btn: 'Search with advanced filters →',
    funder: 'Funder',
    deadline_label: 'Deadline',
    faq_h: 'Frequently asked questions',
    no_results_h: 'No active funding for this filter right now',
    no_results_p: 'Programs open periodically — check back weekly or broaden your filters.',
    catalog_link: 'Browse all programs →',
  },
};

// ─── 4 FAQ entries per page, templated to interpolate sector + country ───────
function faqEntries(lang, sectorLabel, countryLabel) {
  if (lang === 'en') return [
    {
      q: `Where can a ${countryLabel}-based ${sectorLabel} startup find non-dilutive funding?`,
      a: `Local programs (national agencies and EU regional funds), pan-European programs like Horizon Europe / EIC, and accelerators with ${sectorLabel} cohorts. The list above shows what's currently active for ${countryLabel}-based founders working in ${sectorLabel}; each card links to a dedicated page with eligibility, deadline, and required documents.`,
    },
    {
      q: `How fresh is the ${sectorLabel} grants list for ${countryLabel}?`,
      a: `Sources are checked weekly. The "Verified" chip on a card means we've confirmed the program against the official funder URL within the last 30 days; "AI extracted" means the entry came from automated extraction and is awaiting manual review.`,
    },
    {
      q: `What does TRL mean in the eligibility criteria?`,
      a: `Technology Readiness Level — a 1-9 scale where 1 is basic research and 9 is a market-deployed product. Most ${sectorLabel} grants target TRL 4-7 (validated prototype to demonstrated system). The detail page of each grant shows the exact TRL window the funder accepts.`,
    },
    {
      q: `How does eligibil.org's match score work?`,
      a: `Each program is scored against your declared profile (sector, stage, country, TRL, team size). The score reflects how well the program's stated eligibility rules overlap with your profile — not your odds of approval. For approval-likelihood scoring, upload your pitch deck and we run the readiness analysis.`,
    },
    {
      q: `What is the difference between dilutive and non-dilutive funding?`,
      a: `Non-dilutive funding (grants, subsidies, tech credits) does not require giving up equity. Dilutive funding (VC, angel investment) involves selling shares. Most programs listed for ${sectorLabel} on this page are non-dilutive — check the "Non-dilutive" chip on each card.`,
    },
    {
      q: `Can a startup from ${countryLabel} apply to EU-wide programs?`,
      a: `Yes. ${countryLabel}-based startups are eligible for Horizon Europe, EIC Accelerator, COSME, and other EU programs if they meet the specific eligibility criteria (legal entity, sector, TRL stage). Some programs require a consortium with partners from other EU/Associated countries.`,
    },
  ];
  return [
    {
      q: `De unde poate atrage un startup ${sectorLabel} din ${countryLabel} finanțare non-dilutivă?`,
      a: `Programe locale (agenții naționale și fonduri UE regionale), programe pan-europene tip Horizon Europe / EIC, și acceleratoare cu cohorte ${sectorLabel}. Lista de mai sus arată ce e activ în prezent pentru fondatorii din ${countryLabel} care lucrează în ${sectorLabel}; fiecare card duce la o pagină dedicată cu eligibilitate, deadline și documente cerute.`,
    },
    {
      q: `Cât de actuală e lista de granturi ${sectorLabel} pentru ${countryLabel}?`,
      a: `Sursele sunt verificate săptămânal. Chip-ul "Verificat" de pe un card înseamnă că am confirmat programul cu URL-ul oficial al funderului în ultimele 30 de zile; "AI extras" înseamnă că intrarea provine din extracție automată și așteaptă revizuire manuală.`,
    },
    {
      q: `Ce înseamnă TRL în criteriile de eligibilitate?`,
      a: `Technology Readiness Level — o scală 1-9 unde 1 e cercetare de bază și 9 e produs lansat pe piață. Majoritatea granturilor ${sectorLabel} țintesc TRL 4-7 (prototip validat până la sistem demonstrat). Pagina de detaliu a fiecărui grant arată fereastra exactă de TRL pe care o acceptă funder-ul.`,
    },
    {
      q: `Cum funcționează scorul de potrivire eligibil.org?`,
      a: `Fiecare program e scorat în raport cu profilul tău declarat (sector, stadiu, țară, TRL, mărime echipă). Scorul reflectă cât de bine se suprapun regulile de eligibilitate ale programului cu profilul tău — nu șansele tale de aprobare. Pentru scor de șansă-de-aprobare, încarcă pitch deck-ul și rulăm analiza de readiness.`,
    },
    {
      q: `Care e diferența dintre finanțare dilutivă și non-dilutivă?`,
      a: `Finanțarea non-dilutivă (granturi, subvenții, credite tech) nu presupune cedarea de acțiuni din companie. Finanțarea dilutivă (VC, angel investment) implică vânzarea de acțiuni. Majoritatea programelor listate pentru ${sectorLabel} pe această pagină sunt non-dilutive — verifică chip-ul "Non-dilutiv" pe fiecare card.`,
    },
    {
      q: `Poate un startup din ${countryLabel} aplica la programe pan-europene?`,
      a: `Da. Startupurile din ${countryLabel} sunt eligibile pentru Horizon Europe, EIC Accelerator, COSME și alte programe UE dacă îndeplinesc criteriile specifice (entitate juridică, sector, stadiu TRL). Unele programe necesită un consortiu cu parteneri din alte țări UE/Asociate.`,
    },
  ];
}

// ─── Intro paragraph (~150 words, templated) ─────────────────────────────────
function introParagraph(lang, sectorLabel, countryLabel, n) {
  if (lang === 'en') {
    return (
      `This page lists ${n} active funding programs for ${sectorLabel} startups based in or eligible from ${countryLabel}. ` +
      `Sources include national agencies, EU regional funds, pan-European programs (Horizon Europe, EIC, COSME), and private accelerators ` +
      `with ${sectorLabel}-themed cohorts. Each card shows the funder, the eligible amount range, the next deadline, and an evidence ` +
      `chip indicating whether we've verified the listing against the official source. Clicking through to a grant's detail page ` +
      `reveals the eligibility rules, required documents, and our match-score breakdown for your profile if you're signed in. ` +
      `If you're early in your funding journey and don't yet know which programs fit, the search page lets you filter by amount, ` +
      `dilutive vs. non-dilutive, application language, and TRL — and saves the filter combo as a shareable URL. ` +
      `New programs are added weekly; the list reflects what's open today.`
    );
  }
  return (
    `Această pagină listează ${n} programe active de finanțare pentru startupurile ${sectorLabel} înregistrate sau eligibile din ${countryLabel}. ` +
    `Sursele includ agenții naționale, fonduri UE regionale, programe pan-europene (Horizon Europe, EIC, COSME) și acceleratoare private ` +
    `cu cohorte tematice ${sectorLabel}. Fiecare card arată funder-ul, intervalul de sumă eligibilă, următorul deadline și un chip de evidență ` +
    `care indică dacă am verificat listingul împotriva sursei oficiale. Click pe pagina de detaliu a unui grant dezvăluie regulile de ` +
    `eligibilitate, documentele cerute și breakdown-ul scorului tău de potrivire dacă ești autentificat. ` +
    `Dacă ești la începutul drumului de finanțare și încă nu știi ce programe ți se potrivesc, pagina de căutare permite filtrare după sumă, ` +
    `dilutiv vs non-dilutiv, limba aplicării și TRL — și salvează combinația de filtre ca URL shareable. ` +
    `Programele noi se adaugă săptămânal; lista reflectă ce e deschis azi.`
  );
}

// ─── Render a single grant card to HTML ──────────────────────────────────────
function renderCard(g, lang) {
  const isEn = lang === 'en';
  const name = isEn ? (g.nume_program_en || g.nume_program) : g.nume_program;
  const summary = isEn ? (g.short_summary_en || g.short_summary_ro) : (g.short_summary_ro || g.short_summary_en);
  const funder = g.funder_name || g.organizatie || '';
  const country = g.funder_country || g.tara || '';
  const dl = deadlineChip(g.deadline);
  const evLabel = g.evidence_status ? (EVIDENCE_LABEL[lang][g.evidence_status] || null) : null;

  const meta = [];
  if (funder)  meta.push(escapeHtml(funder));
  if (country) meta.push(escapeHtml(country));
  if (g.tip)   meta.push(escapeHtml(g.tip));

  const chips = [];
  chips.push('<span class="sb__chip ' + dl.cls + '">' + escapeHtml(dl.text) + '</span>');
  if (evLabel) {
    chips.push('<span class="sb__chip sb__chip--evidence-' + escapeHtml(g.evidence_status) + '">' + escapeHtml(evLabel) + '</span>');
  }
  if (g.dilutiv === false) {
    chips.push('<span class="sb__chip">' + (isEn ? 'Non-dilutive' : 'Non-dilutiv') + '</span>');
  }

  return (
    '<a class="sb__card" href="' + escapeHtml(detailUrl(g, lang)) + '">' +
      '<div class="sb__card-row1">' +
        '<div class="sb__card-name">' + escapeHtml(name || '') + '</div>' +
        '<div class="sb__card-amount">' + escapeHtml(formatAmount(g.suma_min, g.suma_max)) + '</div>' +
      '</div>' +
      '<div class="sb__card-row2">' + meta.map((m, i) => (i > 0 ? '<span class="sep">·</span>' : '') + '<span>' + m + '</span>').join('') + '</div>' +
      (summary ? '<p class="sb__card-summary">' + escapeHtml(summary) + '</p>' : '') +
      '<div class="sb__card-row3">' + chips.join('') + '</div>' +
    '</a>'
  );
}

// ─── TL;DR aggregate stats from grants ──────────────────────────────────────
function computeStats(grants) {
  let totalMaxAmount = 0;
  let nearestDeadline = null;
  let nearestDeadlineName = null;
  for (const g of grants) {
    if (g.suma_max) totalMaxAmount += g.suma_max;
    const d = parseDeadline(g.deadline);
    if (d && d > new Date()) {
      if (!nearestDeadline || d < nearestDeadline) {
        nearestDeadline = d;
        nearestDeadlineName = g.nume_program;
      }
    }
  }
  return { totalMaxAmount, nearestDeadline, nearestDeadlineName };
}

function formatTotalAmount(n) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace('.0', '') + 'M EUR';
  if (n >= 1000) return Math.round(n / 1000) + 'K EUR';
  return n + ' EUR';
}

// ─── Related hub links (other sectors for same country + other countries for same sector) ─
const ALL_SECTORS = {
  ai: { ro: 'AI', en: 'AI' },
  biotech: { ro: 'Biotech', en: 'Biotech' },
  climate: { ro: 'Climate', en: 'Climate' },
  fintech: { ro: 'Fintech', en: 'Fintech' },
  edtech: { ro: 'EdTech', en: 'EdTech' },
  'deep-tech': { ro: 'Deep Tech', en: 'Deep Tech' },
  saas: { ro: 'SaaS', en: 'SaaS' },
  healthtech: { ro: 'HealthTech', en: 'HealthTech' },
  mobility: { ro: 'Mobility', en: 'Mobility' },
};
const ALL_COUNTRIES = {
  moldova: { ro: 'Moldova', en: 'Moldova' },
  romania: { ro: 'România', en: 'Romania' },
  ucraina: { ro: 'Ucraina', en: 'Ukraine' },
  ue: { ro: 'UE', en: 'EU' },
};

function relatedHubs(lang, currentSector, currentCountry) {
  const isEn = lang === 'en';
  const pathPrefix = isEn ? '/en/grants-' : '/ro/granturi-';
  const links = [];

  // Other sectors for same country
  for (const [sk, labels] of Object.entries(ALL_SECTORS)) {
    if (sk === currentSector) continue;
    links.push({
      href: pathPrefix + sk + '-' + currentCountry,
      text: (isEn ? labels.en + ' grants in ' : 'Granturi ' + labels.ro + ' ') + ALL_COUNTRIES[currentCountry][lang],
    });
  }
  // Other countries for same sector
  for (const [ck, labels] of Object.entries(ALL_COUNTRIES)) {
    if (ck === currentCountry) continue;
    links.push({
      href: pathPrefix + currentSector + '-' + ck,
      text: (isEn ? ALL_SECTORS[currentSector].en + ' grants in ' : 'Granturi ' + ALL_SECTORS[currentSector].ro + ' ') + labels[lang],
    });
  }
  return links;
}

// ─── Related hubs HTML ──────────────────────────────────────────────────────
function buildRelatedHubs(lang, currentSector, currentCountry) {
  const isEn = lang === 'en';
  const links = relatedHubs(lang, currentSector, currentCountry);
  if (!links.length) return '';

  const linksHtml = links.map(l =>
    '<a href="' + escapeHtml(l.href) + '">' + escapeHtml(l.text) + '</a>'
  ).join('\n');

  return (
    '<section class="sl__related">\n' +
      '<h2>' + (isEn ? 'Related funding pages' : 'Pagini conexe de finanțare') + '</h2>\n' +
      '<div class="sl__related-grid">\n' + linksHtml + '\n</div>\n' +
    '</section>\n'
  );
}

// ─── TL;DR block ────────────────────────────────────────────────────────────
function buildTldr(isEn, n, stats, sectorLabel, countryLabel) {
  const parts = [];
  parts.push(isEn
    ? `<strong>At a glance:</strong> ${n} active program${n > 1 ? 's' : ''} for ${sectorLabel} startups in ${countryLabel}.`
    : `<strong>Pe scurt:</strong> ${n} program${n > 1 ? 'e' : ''} activ${n > 1 ? 'e' : ''} pentru startupuri ${sectorLabel} din ${countryLabel}.`);

  if (stats.totalMaxAmount > 0) {
    parts.push(isEn
      ? `Total available funding: up to ${formatTotalAmount(stats.totalMaxAmount)}.`
      : `Finanțare totală disponibilă: până la ${formatTotalAmount(stats.totalMaxAmount)}.`);
  }
  if (stats.nearestDeadline && stats.nearestDeadlineName) {
    const dlStr = stats.nearestDeadline.toLocaleDateString(isEn ? 'en-GB' : 'ro-RO', { day: 'numeric', month: 'long', year: 'numeric' });
    parts.push(isEn
      ? `Nearest deadline: ${stats.nearestDeadlineName} (${dlStr}).`
      : `Deadline cel mai apropiat: ${stats.nearestDeadlineName} (${dlStr}).`);
  }

  return '<div class="sl__tldr"><p>' + parts.join(' ') + '</p></div>\n';
}

// ─── Main: render the full page ──────────────────────────────────────────────
function renderSeoListing({ lang, sectorKey, sectorLabel, countryKey, countryLabel, grants }) {
  const t = STR[lang] || STR.ro;
  const isEn = lang === 'en';
  const path = isEn ? 'grants' : 'granturi';
  const slug = sectorKey + '-' + countryKey;
  const canonical = SITE_URL + '/' + lang + '/' + path + '-' + slug;
  const altRo = SITE_URL + '/ro/granturi-' + slug;
  const altEn = SITE_URL + '/en/grants-' + slug;

  const n = grants.length;
  const stats = computeStats(grants);
  const today = new Date().toISOString().split('T')[0];

  const seoTitle = (isEn
    ? sectorLabel + ' grants for startups in ' + countryLabel + ' 2026'
    : 'Granturi ' + sectorLabel + ' pentru startupuri din ' + countryLabel + ' 2026'
  ) + ' | eligibil.org';

  const seoDesc = isEn
    ? `${n} active funding programs for ${sectorLabel} startups in ${countryLabel}. Total available: ${formatTotalAmount(stats.totalMaxAmount)}. Verified weekly.`
    : `${n} programe active de finanțare pentru startupurile ${sectorLabel} din ${countryLabel}. Total disponibil: ${formatTotalAmount(stats.totalMaxAmount)}. Verificat săptămânal.`;

  // noindex thin pages with < 3 grants
  const robotsMeta = n < 3 ? 'noindex, follow' : 'index, follow';

  const itemList = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: grants.map((g, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: SITE_URL + detailUrl(g, lang),
      name: (isEn ? (g.nume_program_en || g.nume_program) : g.nume_program) || '',
    })),
  };

  const breadcrumbList = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'eligibil.org', item: SITE_URL + '/' },
      { '@type': 'ListItem', position: 2, name: (isEn ? 'Grants' : 'Granturi'), item: SITE_URL + '/search' },
      { '@type': 'ListItem', position: 3, name: sectorLabel + ' / ' + countryLabel },
    ],
  };

  const faqs = faqEntries(lang, sectorLabel, countryLabel);
  const faqPage = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };

  const cardsHtml = n > 0
    ? grants.map((g) => renderCard(g, lang)).join('\n')
    : '<div class="sb__empty"><h3>' + escapeHtml(t.no_results_h) + '</h3><p>' + escapeHtml(t.no_results_p) + '</p>' +
      '<a class="sb__reset" href="/search">' + escapeHtml(t.catalog_link) + '</a></div>';

  const faqHtml = faqs.map((f, i) => (
    '<details class="sb__faq-item"' + (i === 0 ? ' open' : '') + '>' +
      '<summary>' + escapeHtml(f.q) + '</summary>' +
      '<div>' + escapeHtml(f.a) + '</div>' +
    '</details>'
  )).join('\n');

  return (
    '<!DOCTYPE html>\n' +
    '<html lang="' + escapeHtml(lang) + '">\n' +
    '<head>\n' +
    '<base href="/" />\n' +
    '<meta charset="UTF-8" />\n' +
    '<meta name="viewport" content="width=device-width, initial-scale=1.0" />\n' +
    '<title>' + escapeHtml(seoTitle) + '</title>\n' +
    '<meta name="description" content="' + escapeHtml(seoDesc) + '" />\n' +
    '<link rel="canonical" href="' + escapeHtml(canonical) + '" />\n' +
    '<link rel="alternate" hreflang="ro" href="' + escapeHtml(altRo) + '" />\n' +
    '<link rel="alternate" hreflang="en" href="' + escapeHtml(altEn) + '" />\n' +
    '<link rel="alternate" hreflang="x-default" href="' + escapeHtml(altRo) + '" />\n' +
    '<meta property="og:title" content="' + escapeHtml(seoTitle) + '" />\n' +
    '<meta property="og:description" content="' + escapeHtml(seoDesc) + '" />\n' +
    '<meta property="og:url" content="' + escapeHtml(canonical) + '" />\n' +
    '<meta property="og:type" content="article" />\n' +
    '<meta name="robots" content="' + robotsMeta + '" />\n' +
    '<link rel="preconnect" href="https://fonts.googleapis.com">\n' +
    '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n' +
    '<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">\n' +
    '<link rel="stylesheet" href="/styles.css" />\n' +
    '<link rel="stylesheet" href="/styles-search.css" />\n' +
    '<style>\n' +
      '.sl__intro{max-width:760px;margin:0 0 32px;font-size:16px;line-height:1.6;color:var(--sb-ink)}\n' +
      '.sl__cta{margin-top:48px;padding:32px;background:var(--sb-surface);border:1px solid var(--sb-rule)}\n' +
      '.sl__cta h3{font-family:\'Space Grotesk\',sans-serif;font-weight:600;font-size:22px;margin:0 0 8px}\n' +
      '.sl__cta p{margin:0 0 16px;color:var(--sb-muted);font-size:15px}\n' +
      '.sl__cta a{display:inline-block;padding:10px 16px;background:var(--sb-accent);color:var(--sb-bg);text-decoration:none;font-size:14px}\n' +
      '.sl__faq{margin-top:48px;padding-top:32px;border-top:1px solid var(--sb-rule-soft)}\n' +
      '.sl__faq h2{font-family:\'Space Grotesk\',sans-serif;font-weight:600;font-size:24px;margin:0 0 24px}\n' +
      '.sb__faq-item{padding:16px 0;border-bottom:1px solid var(--sb-rule-soft)}\n' +
      '.sb__faq-item summary{cursor:pointer;font-weight:500;font-size:15px;list-style:none;display:flex;justify-content:space-between;align-items:center}\n' +
      '.sb__faq-item summary::after{content:"+";font-family:\'JetBrains Mono\',monospace;color:var(--sb-muted)}\n' +
      '.sb__faq-item[open] summary::after{content:"−"}\n' +
      '.sb__faq-item div{margin-top:12px;font-size:14px;line-height:1.55;color:var(--sb-muted)}\n' +
      '.sl__crumbs{font-family:\'JetBrains Mono\',monospace;font-size:12px;color:var(--sb-muted);margin-bottom:8px;letter-spacing:0.04em}\n' +
      '.sl__crumbs a{color:var(--sb-muted);text-decoration:none}\n' +
      '.sl__crumbs a:hover{color:var(--sb-accent)}\n' +
      '.sl__tldr{background:var(--sb-surface);border:1px solid var(--sb-rule-soft);padding:16px 20px;margin:0 0 28px;font-size:15px;line-height:1.55}\n' +
      '.sl__tldr strong{color:var(--sb-accent)}\n' +
      '.sl__updated{font-size:12px;color:var(--sb-muted);margin-bottom:16px;font-family:\"JetBrains Mono\",monospace;letter-spacing:.03em}\n' +
      '.sl__related{margin-top:48px;padding-top:32px;border-top:1px solid var(--sb-rule-soft)}\n' +
      '.sl__related h2{font-family:\"Space Grotesk\",sans-serif;font-weight:600;font-size:20px;margin:0 0 16px}\n' +
      '.sl__related-grid{display:flex;flex-wrap:wrap;gap:8px}\n' +
      '.sl__related-grid a{font-size:13px;padding:6px 12px;border:1px solid var(--sb-rule-soft);color:var(--sb-ink);text-decoration:none;transition:border-color .12s,background .12s}\n' +
      '.sl__related-grid a:hover{border-color:var(--sb-accent);background:var(--sb-surface)}\n' +
    '</style>\n' +
    '<script type="application/ld+json">' + safeJson(itemList) + '</script>\n' +
    '<script type="application/ld+json">' + safeJson(faqPage) + '</script>\n' +
    '<script type="application/ld+json">' + safeJson(breadcrumbList) + '</script>\n' +
    '</head>\n' +
    '<body class="d-balanced">\n' +
    '<div class="sb">\n' +
    '<header class="sb__top">\n' +
      '<a class="sb__brand" href="/">eligibil<span>.org</span></a>\n' +
      '<nav class="sb__nav">\n' +
        '<a href="/">' + escapeHtml(t.nav_home) + '</a>\n' +
        '<a href="/search">' + escapeHtml(t.nav_search) + '</a>\n' +
        '<a href="/evenimente">' + escapeHtml(t.nav_events) + '</a>\n' +
        '<a class="sb__cta" href="/register.html">' + escapeHtml(t.nav_cta) + '</a>\n' +
      '</nav>\n' +
    '</header>\n' +
    '<section class="sb__hero">\n' +
      '<div class="sl__crumbs"><a href="/">eligibil.org</a> ' + escapeHtml(t.breadcrumb_arrow) + ' <a href="/search">' + escapeHtml(t.crumbs_root) + '</a> ' + escapeHtml(t.breadcrumb_arrow) + ' <span>' + escapeHtml(sectorLabel) + ' / ' + escapeHtml(countryLabel) + '</span></div>\n' +
      '<h1>' + escapeHtml(t.intro_h(sectorLabel, countryLabel)) + '</h1>\n' +
      '<p>' + escapeHtml(n > 0 ? t.sub_count(n) : t.sub_count_zero) + '</p>\n' +
    '</section>\n' +
    '<main class="sb__body" style="grid-template-columns:1fr;max-width:920px">\n' +
      '<section class="sb__results">\n' +
        (n > 0 ? buildTldr(isEn, n, stats, sectorLabel, countryLabel) : '') +
        '<div class="sl__updated"><time datetime="' + today + '">' +
          (isEn ? 'Updated: ' : 'Actualizat: ') + today + '</time></div>\n' +
        '<p class="sl__intro">' + escapeHtml(introParagraph(lang, sectorLabel, countryLabel, n)) + '</p>\n' +
        cardsHtml + '\n' +
        '<aside class="sl__cta">\n' +
          '<h3>' + escapeHtml(t.cta_title) + '</h3>\n' +
          '<p>' + escapeHtml(t.cta_body) + '</p>\n' +
          '<a href="/search?sector=' + escapeHtml(encodeURIComponent(sectorKey)) + '&tara=' + escapeHtml(encodeURIComponent(countryKey)) + '">' + escapeHtml(t.cta_btn) + '</a>\n' +
        '</aside>\n' +
        '<section class="sl__faq">\n' +
          '<h2>' + escapeHtml(t.faq_h) + '</h2>\n' +
          faqHtml + '\n' +
        '</section>\n' +
        buildRelatedHubs(lang, sectorKey, countryKey) +
      '</section>\n' +
    '</main>\n' +
    '</div>\n' +
    '<script src="/app-config.js" defer></script>\n' +
    '<script src="/analytics.js" defer></script>\n' +
    '<script src="/cookie-consent.js" defer></script>\n' +
    '<script src="/chat-widget.js?v=20260522b" defer></script>\n' +
    '</body>\n' +
    '</html>\n'
  );
}

module.exports = { renderSeoListing };
