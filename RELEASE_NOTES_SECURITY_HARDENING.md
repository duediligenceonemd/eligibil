# Release Notes — Security Hardening

## Suggested Commit

```bash
git add .env.example .github/workflows/audits.yml .github/workflows/build.yml .github/workflows/security.yml .github/workflows/smoke-pages.yml .github/workflows/diagnostics.yml README.md SECURITY_AUDIT.md SECURITY_STATUS.md TODAY_IMPLEMENTED.md components-login.jsx lib/email/templates.js lib/validation.js lib/supabase-session-store.js package.json routes/auth.js scripts/supabase-resources-schema.sql scripts/supabase-resources-rls.sql scripts/supabase-private-tables-rls.sql scripts/supabase-password-reset-schema.sql scripts/supabase-sessions-schema.sql scripts/send-deadline-alerts.js scripts/verify-production.js server.js reset-password.html terms.html waitlist-popup.js RELEASE_NOTES_SECURITY_HARDENING.md
git commit -m "security: harden Supabase RLS, auth flows, and CI workflows"
git push origin master
```

## Summary

This release closes the main post-launch security and operations gaps for `eligibil.org`.

## Included

- Supabase RLS hardening for `funding_resources`
- Supabase RLS hardening for private operational tables:
  - `newsletter_subscribers`
  - `waitlist`
  - `email_logs`
  - `email_queue`
- password reset flow:
  - `POST /api/auth/forgot-password`
  - `GET /api/auth/reset-password/verify`
  - `POST /api/auth/reset-password`
- public reset page: `reset-password.html`
- public terms page: `terms.html`
- deadline alert queue producer: `npm run emails:deadline-alerts`
- persistent session store option:
  - `SESSION_STORE=supabase`
  - `scripts/supabase-sessions-schema.sql`
- GitHub Actions modernization:
  - `actions/checkout@v5`
  - `actions/setup-node@v5`
  - Node 24 action runtime compatibility
  - minimal permissions
  - concurrency
  - timeouts
  - diagnostics workflow
- security documentation:
  - `SECURITY_AUDIT.md`
  - `SECURITY_STATUS.md`

## Verification

- `npm run build` passes locally.
- Supabase RLS was applied and verified live for `funding_resources`.
- Supabase RLS was applied and verified live for private operational tables.
- `anon` and `authenticated` no longer have grants on private operational tables.

## Known Follow-Up

- Git in the current local environment cannot create `.git/index.lock` because of a permission issue. The working tree is ready, but staging/commit must be run once local Git permissions recover.
- Supabase Advisor still reports informational `RLS enabled, no policy` notices for private operational tables. This is intentional because those tables should have no public PostgREST access.
- Supabase Advisor still reports `vector` and `citext` extensions in `public`. This is a structural hardening follow-up, not an immediate data exposure issue.
- `xlsx` still has an npm advisory with no public fix available.
