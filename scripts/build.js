'use strict';

const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { projectRoot, readLangMaps, toProjectRelative } = require('./audit-utils');

const REQUIRED_ENTRY_FILES = [
  'index.html',
  'about.html',
  'parteneri.html',
  'startupuri.html',
  'glosar.html',
  'produse.html',
  'lang.js',
  'server.js',
];

const CODE_DIRECTORIES = ['db', 'lib', 'routes', 'scripts'];
const BROWSER_TRANSPILED_FILES = new Set(['thumbs.js']);

function collectRootScripts() {
  return fs.readdirSync(projectRoot, { withFileTypes: true })
    .filter((entry) => entry.isFile() && /\.(js|jsx)$/i.test(entry.name))
    .map((entry) => path.join(projectRoot, entry.name));
}

function collectDirectoryScripts(directoryPath) {
  const collected = [];

  for (const entry of fs.readdirSync(directoryPath, { withFileTypes: true })) {
    const fullPath = path.join(directoryPath, entry.name);
    if (entry.isDirectory()) {
      collected.push(...collectDirectoryScripts(fullPath));
      continue;
    }
    if (entry.isFile() && /\.(js|jsx)$/i.test(entry.name)) {
      collected.push(fullPath);
    }
  }

  return collected;
}

function collectCodeFiles() {
  const files = new Set(collectRootScripts());
  for (const directory of CODE_DIRECTORIES) {
    const directoryPath = path.join(projectRoot, directory);
    if (fs.existsSync(directoryPath)) {
      for (const file of collectDirectoryScripts(directoryPath)) {
        files.add(file);
      }
    }
  }
  return Array.from(files).sort();
}

function parseScript(filePath) {
  const source = fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, '');
  new vm.Script(source, { filename: filePath });
}

function main() {
  const failures = [];
  const checkedFiles = collectCodeFiles();
  let skippedBrowserFiles = 0;

  for (const relativePath of REQUIRED_ENTRY_FILES) {
    const absolutePath = path.join(projectRoot, relativePath);
    if (!fs.existsSync(absolutePath)) {
      failures.push(`Missing required entry file: ${relativePath}`);
    }
  }

  for (const filePath of checkedFiles) {
    const ext = path.extname(filePath).toLowerCase();
    const baseName = path.basename(filePath);

    // Browser-only sources are transpiled by @babel/standalone in the public pages.
    if (ext === '.jsx' || BROWSER_TRANSPILED_FILES.has(baseName)) {
      skippedBrowserFiles += 1;
      continue;
    }

    try {
      parseScript(filePath);
    } catch (error) {
      failures.push(`Syntax error in ${toProjectRelative(filePath)}: ${error.message}`);
    }
  }

  try {
    const { roToEn, roToRu } = readLangMaps();
    const roKeys = Object.keys(roToEn);
    const ruKeys = Object.keys(roToRu);
    const missingInRu = roKeys.filter((key) => !(key in roToRu));
    const extraInRu = ruKeys.filter((key) => !(key in roToEn));

    if (roKeys.length !== ruKeys.length || missingInRu.length || extraInRu.length) {
      failures.push(
        `i18n parity failed: RO/EN has ${roKeys.length} keys, RU has ${ruKeys.length}, ` +
        `${missingInRu.length} missing in RU, ${extraInRu.length} extra in RU`
      );
    }
  } catch (error) {
    failures.push(`Could not audit i18n dictionaries: ${error.message}`);
  }

  if (failures.length) {
    console.error('Build validation failed:');
    for (const failure of failures) {
      console.error(`- ${failure}`);
    }
    process.exit(1);
  }

  console.log(`Build validation passed for ${checkedFiles.length - skippedBrowserFiles} server/runtime JS files.`);
  console.log(`Skipped ${skippedBrowserFiles} browser-transpiled JSX files handled at runtime.`);
  console.log(`Verified ${REQUIRED_ENTRY_FILES.length} required entry files.`);
}

main();
