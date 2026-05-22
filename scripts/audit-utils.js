'use strict';

const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const projectRoot = path.resolve(__dirname, '..');

function toProjectRelative(filePath) {
  return path.relative(projectRoot, filePath).replace(/\\/g, '/');
}

function extractConstObjectLiteral(source, constName) {
  // Support both `const X = {` and `window.X = {` patterns
  const anchors = [`const ${constName} = {`, `let ${constName} = {`, `window.${constName} = {`];
  let start = -1;
  for (const anchor of anchors) {
    start = source.indexOf(anchor);
    if (start !== -1) break;
  }
  if (start === -1) {
    throw new Error(`Could not find "${constName}" in source`);
  }

  const objectStart = source.indexOf('{', start);
  let depth = 0;
  let quote = null;
  let escaped = false;

  for (let index = objectStart; index < source.length; index += 1) {
    const char = source[index];

    if (quote) {
      if (escaped) {
        escaped = false;
        continue;
      }
      if (char === '\\') {
        escaped = true;
        continue;
      }
      if (char === quote) {
        quote = null;
      }
      continue;
    }

    if (char === '"' || char === '\'' || char === '`') {
      quote = char;
      continue;
    }

    if (char === '{') {
      depth += 1;
      continue;
    }

    if (char === '}') {
      depth -= 1;
      if (depth === 0) {
        return source.slice(objectStart, index + 1);
      }
    }
  }

  throw new Error(`Could not parse "${constName}" object literal`);
}

function parseObjectLiteral(literal, label) {
  return vm.runInNewContext(`(${literal})`, {}, { filename: label });
}

function readLangMaps() {
  const langPath = path.join(projectRoot, 'lang.js');
  const source = fs.readFileSync(langPath, 'utf8');

  // RU and UA dictionaries may be in separate chunk files (lazy-load split)
  const ruPath = path.join(projectRoot, 'lang-ru.js');
  const uaPath = path.join(projectRoot, 'lang-ua.js');
  const ruSource = fs.existsSync(ruPath) ? fs.readFileSync(ruPath, 'utf8') : source;
  const uaSource = fs.existsSync(uaPath) ? fs.readFileSync(uaPath, 'utf8') : source;

  // In chunk files the dictionaries are named __LANG_RU / __LANG_UA
  const ruConstName = ruSource === source ? 'RO_TO_RU' : '__LANG_RU';
  const uaConstName = uaSource === source ? 'RO_TO_UA' : '__LANG_UA';

  return {
    roToEn: parseObjectLiteral(extractConstObjectLiteral(source, 'RO_TO_EN'), 'RO_TO_EN'),
    roToRu: parseObjectLiteral(extractConstObjectLiteral(ruSource, ruConstName), ruConstName),
    roToUa: parseObjectLiteral(extractConstObjectLiteral(uaSource, uaConstName), uaConstName),
  };
}

module.exports = {
  projectRoot,
  readLangMaps,
  toProjectRelative,
};
