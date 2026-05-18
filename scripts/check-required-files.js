'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { projectRoot } = require('./audit-utils');

const REQUIRED_AUDIT_FILES = [
  'CLAUDE.md',
  'BROKEN_PAGES_AUDIT.md',
  'TRANSLATION_AUDIT.md',
  'MOBILE_AUDIT.md',
  'FIXES_LOG.md',
];

const REQUIRED_WORKFLOWS = [
  'build.yml',
  'audits.yml',
  'smoke-pages.yml',
];

function exists(relativePath) {
  return fs.existsSync(path.join(projectRoot, relativePath));
}

function main() {
  const missing = [];

  for (const file of REQUIRED_AUDIT_FILES) {
    if (!exists(file)) {
      missing.push(file);
    }
  }

  const workflowDir = path.join(projectRoot, '.github', 'workflows');
  if (!fs.existsSync(workflowDir)) {
    missing.push('.github/workflows/');
  } else {
    for (const file of REQUIRED_WORKFLOWS) {
      if (!fs.existsSync(path.join(workflowDir, file))) {
        missing.push(`.github/workflows/${file}`);
      }
    }
  }

  if (missing.length) {
    console.error('Missing required project files:');
    for (const entry of missing) {
      console.error(`- ${entry}`);
    }
    process.exit(1);
  }

  console.log('All required audit files and workflow files are present.');
}

main();
