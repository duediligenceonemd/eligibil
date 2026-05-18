'use strict';

const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const projectRoot = path.resolve(__dirname, '..');

function toProjectRelative(filePath) {
  return path.relative(projectRoot, filePath).replace(/\\/g, '/');
}

function extractConstObjectLiteral(source, constName) {
  const anchor = `const ${constName} = {`;
  const start = source.indexOf(anchor);
  if (start === -1) {
    throw new Error(`Could not find "${constName}" in lang.js`);
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

  return {
    roToEn: parseObjectLiteral(extractConstObjectLiteral(source, 'RO_TO_EN'), 'RO_TO_EN'),
    roToRu: parseObjectLiteral(extractConstObjectLiteral(source, 'RO_TO_RU'), 'RO_TO_RU'),
    roToUa: parseObjectLiteral(extractConstObjectLiteral(source, 'RO_TO_UA'), 'RO_TO_UA'),
  };
}

module.exports = {
  projectRoot,
  readLangMaps,
  toProjectRelative,
};
