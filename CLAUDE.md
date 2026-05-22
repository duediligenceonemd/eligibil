# eligibil.org — Project Guide

AI-powered grant matching platform for startups in Moldova, Romania & EU.
Live: https://eligibil.org | Supabase project: `wkajytbxbjbpeuqolkwh`

---

## Quick Start

```bash
npm install
cp .env.example .env   # fill SUPABASE_URL, SUPABASE_SERVICE_KEY, SESSION_SECRET
npm run dev             # http://localhost:3000 (auto-reload)
```

Required env vars: `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `SESSION_SECRET`
Recommended: `RESEND_API_KEY`, `ADMIN_TOKEN`, `ADMIN_EMAILS`, `SENTRY_DSN`
Optional AI: `OPENAI_API_KEY` (embeddings), `ANTHROPIC_API_KEY` (grant extraction)

---

## Stack & Architecture

| Layer | Technology |
|-------|-----------|
| Server | Express 4.22 (Node.js) |
| Database | Supabase PostgreSQL + pgvector |
| Frontend | Vanilla HTML/JS — JSX via Preact (unpkg CDN), NOT React/Next.js |
| Auth | bcrypt + express-session (custom, NOT Supabase Auth) |
| Email | Resend (`lib/email/resend.js` + `lib/email/templates.js`) |
| Search | pgvector cosine similarity + full-text fallback |
| AI | OpenAI text-embedding-3-small, Claude API (grant extraction/enrichment) |
| i18n | `lang.js` — 4 languages (RO, EN, RU, UA) |
| Monitoring | Sentry (`instrument.js`), Google Analytics, Microsoft Clarity |
| Security | Helmet, rate limiting, brute-force protection, CORS |

**Key architectural decisions:**
- Server-side rendering for SEO (grant detail pages, programmatic `/ro/granturi-SECTOR-COUNTRY` listings)
- Client-side SPA for interactive pages (search, dashboard, profile)
- DB adapter pattern: `db.findOne('users', { email })` queries `profiles` table via `db/users-supabase.js`
- Supabase service-role key on server (bypasses RLS)

---

## Directory Structure

```
ELIGIBIL/
├── server.js              # Express entrypoint — mounts routes, serves HTML, SSR
├── instrument.js          # Sentry setup + reportError() helper
├── routes/                # API endpoints (11 files)
│   ├── admin.js           #   /api/admin — grants queue CRUD, stats
│   ├── api.js             #   /api — profile, grants, comments, reactions, notifications
│   ├── artefacts.js       #   /api/artefacts — pitch deck upload + AI analysis
│   ├── auth.js            #   /api/auth — register, login, logout, password reset
│   ├── events.js          #   /api/events — public events by country/type
│   ├── feedback.js        #   /api/feedback — user feedback
│   ├── feeds.js           #   /stiri, /news, /blog — RSS feeds
│   ├── newsletter.js      #   /api/newsletter — subscribe (double opt-in)
│   ├── seo.js             #   /sitemap.xml, /robots.txt
│   ├── unsubscribe.js     #   /api/unsubscribe — email opt-out
│   └── waitlist.js        #   /api/waitlist — pre-launch signup
├── lib/                   # Shared modules (15 files)
│   ├── admin-auth.js      #   Admin detection (is_admin, ADMIN_EMAILS, token)
│   ├── email/resend.js    #   sendEmail(), queueEmail(), unsubscribeUrl()
│   ├── email/templates.js #   8 HTML email templates (multilingual)
│   ├── env-validation.js  #   Startup env checks
│   ├── login-protection.js#   Brute-force: 5 attempts/15min → lockout
│   ├── rate-limit.js      #   Express rate limiters (API, auth, newsletter, upload)
│   ├── render-*.js        #   SSR for grant pages, content pages, SEO listings
│   ├── request-security.js#   Helmet, CORS, same-origin guard
│   ├── schemas.js         #   validate() middleware factory
│   ├── score-engine.js    #   Grant readiness/confidence scoring
│   ├── supabase-session-store.js # Express sessions in Supabase
│   ├── validate-env.js    #   Required/recommended env var checker
│   └── validation.js      #   Zod schemas + parseBody() + cleanString()
├── db/                    # Data access (6 files)
│   ├── supabase.js        #   getSupabase() — Supabase client singleton
│   ├── users-supabase.js  #   User adapter: 'users' → profiles table
│   ├── database.js        #   JSON file store fallback
│   ├── profile-sync.js    #   Profile sync for scoring
│   ├── obsidian.js        #   Supabase ↔ Obsidian vault sync
│   └── eligibil.json      #   Local data store
├── scripts/               # ETL, migrations, maintenance (24 JS + 18 SQL)
├── *.html                 # 28 public pages (index, search, dashboard, admin, etc.)
├── *.jsx                  # 18 Preact components (grant, search, dashboard, etc.)
├── lang.js                # i18n dictionary (~735KB, 4 languages)
└── *.js                   # Client-side JS (analytics, auth, data, widgets)
```

---

## Code Patterns & Conventions

### Validation
```js
// Use parseBody() — NOT middleware
const { parseBody, registerSchema } = require('../lib/validation');
const parsed = parseBody(registerSchema, req.body || {});
if (!parsed.ok) return res.status(400).json({ error: '...', fields: parsed.error.fieldErrors });
const { email, password } = parsed.data;
```

### Error Reporting
```js
const { reportError } = require('../instrument');
reportError(err, { tags: { area: 'auth', action: 'login' }, extra: { ip } });
```

### Email (fire-and-forget)
```js
const { sendEmail, queueEmail } = require('../lib/email/resend');
sendEmail({ to, subject, html, type: 'welcome', language: 'ro' }).catch(() => {});
queueEmail({ userId, recipient, type: 'onboarding_day3', scheduledFor: new Date(...) }).catch(() => {});
```

### Database Queries
```js
const db = require('../db/users-supabase');
const user = await db.findOne('users', { email });     // queries 'profiles' table
const startup = await db.findOne('startups', { user_id: user.id });
await db.insert('users', { email, password_hash, first_name, last_name, role });
await db.update('users', { id }, { password_hash: newHash });
```

### Direct Supabase
```js
const { getSupabase } = require('../db/supabase');
const sb = getSupabase();
const { data, error } = await sb.from('grants').select('*').eq('id', id);
```

### Admin Auth
```js
const adminAuth = require('../lib/admin-auth');
router.use(adminAuth.requireAdmin);  // checks is_admin flag OR ADMIN_EMAILS OR x-admin-token
```

### Rate Limiting
```js
const { apiLimiter, authLoginLimiter } = require('../lib/rate-limit');
app.use('/api', apiLimiter);
app.use('/api/auth/login', authLoginLimiter);
```

---

## Database Tables (Supabase)

| Table | Rows | Purpose |
|-------|------|---------|
| grants | 70 | Grant programs with pgvector embeddings |
| profiles | ~0 | User accounts (maps to 'users' in code) |
| startups | ~0 | Startup profiles linked to users |
| events | 26 | Funding events/webinars |
| funding_resources | 567 | Startup resource links |
| grants_staging | ~0 | Admin queue for AI-extracted grants |
| newsletter_subscribers | 1 | Email newsletter list |
| waitlist | ~0 | Pre-launch signups |
| email_logs | ~0 | Sent email records |
| email_queue | ~0 | Scheduled emails (onboarding) |
| password_reset_tokens | ~0 | Password reset flow |
| app_sessions | ~0 | Express sessions in Supabase |
| feedback | ~0 | User feedback submissions |
| comments | ~0 | Grant comments |
| notifications | ~0 | User notifications |
| artefacts | ~0 | Uploaded pitch decks |

SQL schemas: `scripts/supabase-*.sql`

---

## npm Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Dev server with auto-reload |
| `npm run build` | Validate required files + lang parity |
| `npm start` | Production server |
| `npm run verify:prod` | Production readiness check |
| `npm run seed` | Import grants from Excel → Supabase (with embeddings) |
| `npm run grants:process` | ETL: inbox/ emails → grants_staging |
| `npm run grants:enrich` | Backfill grant fields via Claude API |
| `npm run grants:gmail` | Fetch from Gmail IMAP |
| `npm run grants:scrape` | Scrape grants from web |
| `npm run grants:fetch` | Unified cron (all sources) |
| `npm run grants:sync` | Supabase ↔ Obsidian vault sync |
| `npm run emails:deadline-alerts` | Send deadline reminder emails |
| `npm run resources:import` | Import funding resources from Excel |
| `npm run stats:refresh` | Recompute user pool stats |
| `npm run audit:i18n` | Check translation key parity |
| `npm run smoke:pages` | QA smoke test top 5 pages |

---

## Pending Tasks

- [x] Password reset flow — end-to-end verified (register→forgot→verify→reset→login)
- [x] RLS policies — all 26 tables have RLS enabled; sensitive tables locked (no GRANTs)
- [ ] Deadline alerts — test `scripts/send-deadline-alerts.js` with real data
- [x] SEO structured data — JSON-LD on 9 pages + hreflang on 5 bilingual pages
- [ ] Resource enrichment — AI descriptions for 567 funding_resources
- [ ] Native RU/UA copy — replace EN fallback strings with proper translations
- [ ] DNS records — configure SPF, DKIM, DMARC for eligibil.org (Resend)
- [ ] Stripe integration — payment flow (future)
- [ ] Content pages — /stiri, /blog with CMS-like admin

---

## Security Notes

- **RLS**: Enabled on all 26 tables; sensitive tables (waitlist, email_logs, etc.) have zero GRANTs to anon/authenticated
- **Auth**: bcrypt 12 rounds, brute-force lockout (5 attempts/15min per IP+email)
- **Sessions**: express-session with Supabase store, `elig.sid` cookie
- **Email tokens**: HMAC-SHA256 signed (not JWT), `UNSUBSCRIBE_SECRET`
- **Password reset**: SHA256 hashed tokens, configurable TTL (default 30min)
- **Rate limiting**: Different limits per route (auth stricter than API)
- **Headers**: Helmet CSP, HSTS in production, X-Frame-Options SAMEORIGIN
- **Secrets**: Service-role key server-only, never exposed to client

---

## Deployment

- **Hosting**: Cloud Run (trust proxy enabled)
- **Domain**: eligibil.org
- **CI**: GitHub Actions (`.github/workflows/` — build, security, smoke, audits)
- **Monitoring**: Sentry (errors + profiling), GA4, Clarity
