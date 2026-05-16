'use strict';

const REQUIRED = ['SESSION_SECRET', 'SUPABASE_URL', 'SUPABASE_SERVICE_KEY'];
const RECOMMENDED = ['ADMIN_TOKEN', 'ADMIN_EMAILS'];

const missing = REQUIRED.filter(k => !process.env[k]);
if (missing.length) {
  console.error(`\n  FATAL: Missing required environment variables:\n    ${missing.join('\n    ')}\n`);
  console.error('  Copy .env.example → .env and fill in the values.\n');
  process.exit(1);
}

for (const k of RECOMMENDED) {
  if (!process.env[k]) {
    console.warn(`  WARN: ${k} is not set — feature may be disabled`);
  }
}
