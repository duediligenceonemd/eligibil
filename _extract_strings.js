// Extract Romanian strings from JSX/JS/HTML, filter to missing-from-lang.js,
// emit _missing_ro.json for translation.
const fs = require('fs');
const path = require('path');

const ALL_PAGES = [
  'data-org.js',
  'components-org-a.jsx',
  'components-org-b.jsx',
  'components-org-c.jsx',
  'index.html',
  'parteneri.html',
  'startupuri.html',
  'produs.html',
  'glosar.html',
  'data-glosar.js',
  'about.html',
  'partener.html',
  'produse.html',
  'grant.html',
  'dashboard.html',
  'profile.html',
  'events.html',
  'consortium.html',
  'login.html',
  'register.html',
  'upload-artefact.html',
  'search.html',
  'components-a.jsx',
  'components-b.jsx',
  'components-v2.jsx',
  'components-grant.jsx',
  'components-dashboard.jsx',
  'components-login.jsx',
  'components-register.jsx',
  'components-search.jsx',
  'components-events.jsx',
  'components-email-capture.jsx',
  'data.js',
  'lib/render-grant-page.js',
  'lib/render-content-page.js',
  'lib/render-seo-listing.js',
];

const HOMEPAGE_SCOPE = [
  'data-org.js',
  'components-org-a.jsx',
  'components-org-b.jsx',
  'components-org-c.jsx',
  'index.html',
];

// Load existing RO_TO_EN keys to filter out already-translated
const lang = fs.readFileSync('lang.js', 'utf8');
function extractKeys(name) {
  const m = lang.match(new RegExp("const " + name + " = \\{([\\s\\S]*?)\\n  \\};"));
  if (!m) return new Set();
  const body = m[1];
  const keys = new Set();
  // single-quoted keys
  for (const km of body.matchAll(/^\s*'((?:[^'\\]|\\.)*)'\s*:/gm)) {
    keys.add(km[1].replace(/\\'/g, "'").replace(/\\\\/g, "\\"));
  }
  // double-quoted keys
  for (const km of body.matchAll(/^\s*"((?:[^"\\]|\\.)*)"\s*:/gm)) {
    keys.add(km[1].replace(/\\"/g, '"').replace(/\\\\/g, "\\"));
  }
  return keys;
}

const EN_KEYS = extractKeys('RO_TO_EN');
const RU_KEYS = extractKeys('RO_TO_RU');
const UA_KEYS = extractKeys('RO_TO_UA');

console.error(`existing RO_TO_EN: ${EN_KEYS.size}, RO_TO_RU: ${RU_KEYS.size}, RO_TO_UA: ${UA_KEYS.size}`);

// Romanian diacritic detection — keep strings that contain at least one diacritic
// OR contain common Romanian words (so we catch sector names like "AgriTech și
// FoodTech" or plain words like "Startup")
const RO_DIACRITICS = /[ăâîșțĂÂÎȘȚ]/;
const RO_COMMON = /\b(și|sau|cu|în|de|la|pe|pentru|fără|prin|despre|este|sunt|are|au|fii|fie|când|cum|ce|care|mai|foarte|toate|toți|toate|orice|niciun|nicio|această|aceste|aceasta|acelaș|același|fiecare|datele|date|tine|tale|tău|ta|tale|noastra|noastre|nostru|noștri|companie|companii|finanțare|finanțări|startup|startup-uri|investitor|investitori|consultant|consultanți|consorțiu|consorții|pitch|deck|raport|rapoarte|antreprenor|antreprenori|fondator|fondatori|grant|granturi|sector|sectoare|vertical|verticală|verticale|industrie|industrii|tehnologie|tehnologii|deschidere|deschiderea|listează|listare|încarcă|încărcare|programe|catalog|moldova|romania|românia|ucraina|europa|axon|labs|verde|albastru|deep tech|deeptech|deep-tech)\b/i;

function isRomanian(s) {
  // strip leading/trailing whitespace
  const t = s.trim();
  if (!t) return false;
  if (t.length < 2) return false;
  if (t.length > 350) return false; // too long: drop
  // Filter code fragments
  if (/[<>{}[\]`]/.test(t)) return false;
  if (t.includes('\\n') || t.includes('\\t') || t.includes('\\r')) return false;
  if (t.includes('${')) return false;
  if (/  /.test(t)) return false; // multiple spaces
  if (/^[A-Z_][A-Z0-9_]*$/.test(t)) return false; // ALL_CAPS identifier
  if (/^https?:\/\//.test(t)) return false;
  if (/^[a-z0-9_-]+$/i.test(t) && t.length < 12) return false; // bare identifier
  if (/^\d+$/.test(t)) return false;
  if (/^[\d\s.,$€%+\-/×x*KMB]+$/i.test(t)) return false; // numeric-only / amounts
  if (/^[\s\W]+$/.test(t)) return false; // punctuation/symbols only
  // Must contain alpha
  if (!/[a-zA-ZăâîșțĂÂÎȘȚ]/.test(t)) return false;
  // Romanian if has diacritics OR enough Romanian words
  if (RO_DIACRITICS.test(t)) return true;
  if (RO_COMMON.test(t)) return true;
  // Mixed words but no diacritics → only keep if reasonably long sentence-like
  // and has at least 3 words (e.g., section labels)
  const words = t.split(/\s+/).filter(w => /[a-zA-Z]/.test(w));
  if (words.length >= 3) return true;
  return false;
}

function extractFromFile(filepath) {
  if (!fs.existsSync(filepath)) return [];
  const src = fs.readFileSync(filepath, 'utf8');
  const out = new Set();

  // 1. Single-quoted strings
  for (const m of src.matchAll(/'((?:[^'\\\n]|\\.)*)'/g)) {
    const s = m[1].replace(/\\'/g, "'");
    if (isRomanian(s)) out.add(s.trim());
  }
  // 2. Double-quoted strings
  for (const m of src.matchAll(/"((?:[^"\\\n]|\\.)*)"/g)) {
    const s = m[1].replace(/\\"/g, '"');
    if (isRomanian(s)) out.add(s.trim());
  }
  // 3. JSX text content (between > and <)
  for (const m of src.matchAll(/>([^<>{}\n]+)</g)) {
    const s = m[1].trim();
    if (isRomanian(s)) out.add(s);
  }
  return [...out];
}

const scope = process.argv[2] === 'homepage' ? HOMEPAGE_SCOPE : ALL_PAGES;
console.error('Scope:', scope.join(', '));

const all = new Set();
for (const f of scope) {
  const xs = extractFromFile(f);
  console.error(`  ${f}: ${xs.length} candidates`);
  xs.forEach(x => all.add(x));
}

const target = process.argv[3] || 'en';
const existing = target === 'en' ? EN_KEYS : target === 'ru' ? RU_KEYS : UA_KEYS;

const missing = [...all].filter(s => !existing.has(s));
console.error(`Total unique RO candidates: ${all.size}`);
console.error(`Missing from RO_TO_${target.toUpperCase()}: ${missing.length}`);

fs.writeFileSync('_missing_ro.json', JSON.stringify(missing, null, 2));
console.error('Wrote _missing_ro.json');
