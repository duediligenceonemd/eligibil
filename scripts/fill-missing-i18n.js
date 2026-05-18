'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { projectRoot, readLangMaps } = require('./audit-utils');

const TARGETS = [
  { blockName: 'RO_TO_RU', label: 'RU' },
  { blockName: 'RO_TO_UA', label: 'UA' },
];

function injectMissingEntries(source, blockName, entries) {
  if (!entries.length) {
    return source;
  }

  const injection = '\n    // === auto-filled parity fallback 20260516 ===\n' +
    entries.map(({ key, value }) => `    ${JSON.stringify(key)}: ${JSON.stringify(value)},`).join('\n') +
    '\n\n  };';

  const pattern = new RegExp(`(const ${blockName} = \\{[\\s\\S]*?)\\n  \\};`, 'm');
  if (!pattern.test(source)) {
    throw new Error(`Could not find block ${blockName}`);
  }

  return source.replace(pattern, (_, prefix) => prefix + injection);
}

function main() {
  const langPath = path.join(projectRoot, 'lang.js');
  let source = fs.readFileSync(langPath, 'utf8');
  const { roToEn, roToRu, roToUa } = readLangMaps();
  const sourceKeys = Object.keys(roToEn);

  for (const target of TARGETS) {
    const comparisonMap = target.blockName === 'RO_TO_RU' ? roToRu : roToUa;
    const missing = sourceKeys
      .filter((key) => !(key in comparisonMap))
      .map((key) => ({ key, value: roToEn[key] }));

    source = injectMissingEntries(source, target.blockName, missing);
    console.log(`${target.label}: added ${missing.length} fallback entries`);
  }

  fs.writeFileSync(langPath, source);
}

main();
