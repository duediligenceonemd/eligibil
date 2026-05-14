// Merge _translations_<lang>.json into the corresponding RO_TO_* block in lang.js
// Usage: node _merge_translations.js <en|ru|uk>
const fs = require('fs');

const argLang = process.argv[2] || 'en';
const blockName =
  argLang === 'en' ? 'RO_TO_EN' :
  argLang === 'ru' ? 'RO_TO_RU' :
  'RO_TO_UA';
const transFile = `_translations_${argLang}.json`;

const trans = JSON.parse(fs.readFileSync(transFile, 'utf8'));
let lang = fs.readFileSync('lang.js', 'utf8');

// Strip HTML entities the Translation API sometimes injects (&#39; for ')
function decodeEntities(s) {
  return s
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ');
}

// Filter pairs: drop any with suspicious content (HTML fragments, etc.)
function isCleanValue(v) {
  if (!v || typeof v !== 'string') return false;
  if (v.length > 600) return false;
  if (/[<>{}`]/.test(v)) return false;
  if (v.includes('${')) return false;
  return true;
}

let kept = 0, dropped = 0;
const lines = [];
for (const [ro, raw] of Object.entries(trans)) {
  const v = decodeEntities(raw);
  if (!isCleanValue(v)) { dropped++; continue; }
  if (!isCleanValue(ro)) { dropped++; continue; }
  // JSON.stringify gives a fully-escaped JS string literal
  lines.push(`    ${JSON.stringify(ro)}: ${JSON.stringify(v)},`);
  kept++;
}
console.error(`Kept ${kept}, dropped ${dropped} (HTML/entity/length filter)`);

const injection = '\n    // === auto-translated bulk pass 20260514b ===\n' +
  lines.join('\n') + '\n\n  };';

// Replace the closing `};` of the target block with our injection + `};`
const re = new RegExp(
  `(const ${blockName} = \\{[\\s\\S]*?)\\n  \\};`,
  'm'
);
if (!re.test(lang)) {
  console.error(`Could not find block ${blockName}`);
  process.exit(1);
}
// Use replacement function so $1, $2 inside translated values are not
// interpreted as regex backreferences.
lang = lang.replace(re, (_, p1) => p1 + injection);

fs.writeFileSync('lang.js', lang);
console.error(`Injected ${kept} new pairs into ${blockName}.`);
