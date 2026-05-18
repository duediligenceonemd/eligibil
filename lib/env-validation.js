'use strict';

function required(name, opts = {}) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  if (opts.minLength && value.length < opts.minLength) {
    throw new Error(`${name} must be at least ${opts.minLength} characters long`);
  }

  if (opts.forbid && opts.forbid.includes(value)) {
    throw new Error(`${name} is using an unsafe default/example value`);
  }

  if (opts.rejectPattern && opts.rejectPattern.test(value)) {
    throw new Error(`${name} is still using a placeholder value`);
  }

  return value;
}

function optional(name, opts = {}) {
  const value = process.env[name];
  if (!value) return null;

  if (opts.minLength && value.length < opts.minLength) {
    throw new Error(`${name} must be at least ${opts.minLength} characters long`);
  }

  return value;
}

function validateEnv() {
  required('SESSION_SECRET', {
    minLength: 32,
    forbid: ['eligibil-dev-secret-2026', 'change-me', 'your-secret-key-here-minimum-32-chars'],
  });

  const isProduction = process.env.NODE_ENV === 'production';

  if (isProduction) {
    required('SUPABASE_URL', { rejectPattern: /xxxxxxxx|placeholder/i });
    required('SUPABASE_SERVICE_KEY', {
      rejectPattern: /\.\.\.$|placeholder|^sb_publishable_|^sb_anon_/i,
    });
  } else {
    optional('SUPABASE_URL');
    optional('SUPABASE_SERVICE_KEY');
  }

  optional('ADMIN_TOKEN', { minLength: 24 });
}

validateEnv();
