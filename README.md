# eligibil.org — AI Grant Matching for Startups

> Find the right grants, faster. AI-powered matching for startups in Moldova, Romania & the EU.

## AWS Activate / Startup Positioning

Eligibil.org is being prepared as an early-stage, self-funded startup project for AWS Activate Founders. The product positioning is broader than a grant directory: it is an **AI-powered funding intelligence and eligibility matching platform** for startups, SMEs, NGOs, researchers, founders and ecosystem builders.

Current development status:

- MVP / early access in development.
- Public opportunity discovery and resource catalog are live.
- AI-assisted eligibility scoring, document readiness support, advanced recommendations and cloud-native ingestion workflows are part of the roadmap.
- Eligibil.org does not guarantee funding approval. Official providers make final eligibility and award decisions.

Target users:

- Early-stage startups and founders
- SMEs seeking non-dilutive funding
- NGOs and research teams
- Incubators, accelerators and ecosystem builders

AWS infrastructure roadmap:

- Amazon S3 for document and asset storage
- Amazon CloudFront for fast content delivery
- AWS Lambda and Amazon API Gateway for serverless backend workflows
- Amazon RDS PostgreSQL or DynamoDB for structured opportunity and user data
- Amazon OpenSearch for semantic/faceted funding search
- Amazon Bedrock for AI-assisted matching, summarization and eligibility scoring
- Amazon SES for notifications
- Amazon EventBridge for scheduled data ingestion
- Amazon CloudWatch for monitoring
- AWS Budgets for cost control

Security and cost-control notes:

- Use environment variables for all secrets.
- Never commit API keys, database credentials or service-role keys.
- Enable MFA on the AWS root account.
- Use AWS Budgets and alerts before enabling production-scale workloads.
- Keep document processing and AI workloads scoped by quotas and rate limits.

See also: `docs/aws-activate-application.md`.

[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=node.js&logoColor=white)](https://nodejs.org)
[![Express](https://img.shields.io/badge/Express-4.x-000000?logo=express&logoColor=white)](https://expressjs.com)
[![Supabase](https://img.shields.io/badge/Supabase-pgvector-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com)
[![OpenAI](https://img.shields.io/badge/OpenAI-Embeddings-412991?logo=openai&logoColor=white)](https://openai.com)
[![License](https://img.shields.io/badge/License-MIT-blue)](LICENSE)

---

## What is eligibil.org?

**eligibil.org** is an AI-powered grant discovery and matching platform designed for early-stage startups in Moldova, Romania, and the EU. Instead of spending weeks manually researching funding opportunities, founders describe their startup once — and the platform instantly surfaces the most relevant grants, accelerators, and investment programs.

### The Problem

Founders waste 20–40 hours per funding round researching eligibility across 70+ programs spread across government portals, accelerator websites, and EU databases. Most of the time, they apply to programs they don't actually qualify for.

### The Solution

eligibil.org uses **vector embeddings + semantic search** to match startup profiles against a curated database of grants based on sector, stage, country, funding range, and eligibility criteria — not just keyword search.

---

## Features

- **AI Matching** — OpenAI `text-embedding-3-small` + pgvector HNSW index for semantic grant matching
- **70+ Programs** — Grants, accelerators, VC funds, and cloud credit programs across Moldova, Romania, and the EU
- **Smart Filters** — Filter by country, sector, startup stage, funding range, and dilutive vs. non-dilutive
- **Readiness Score** — Tracks profile completeness to improve match quality
- **Pipeline Tracker** — Manage grant applications with status tracking
- **Full-text Fallback** — Works without OpenAI API key via PostgreSQL full-text search
- **Multilingual** — Romanian and English interface

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Backend** | Node.js 18+, Express 4 |
| **Database** | Supabase (PostgreSQL 15 + pgvector) |
| **AI / Embeddings** | OpenAI `text-embedding-3-small` (1536 dims) |
| **Vector Index** | HNSW (`m=16, ef_construction=64`) |
| **Full-text Search** | PostgreSQL `tsvector` + `plainto_tsquery` |
| **Auth** | Express sessions + bcrypt |
| **Frontend** | Vanilla JS, HTML5, CSS3 |
| **ETL** | `xlsx` parser + batched OpenAI embeddings |

---

## Architecture

```
Startup Profile (sector, stage, country, TRL)
        ↓
OpenAI Embedding (1536-dim vector)
        ↓
pgvector HNSW similarity search → top-N grants (cosine similarity)
        ↓
SQL post-filters (tara, suma, dilutiv, status)
        ↓
Scored results: match% = ((similarity − 0.25) / 0.75) × 50 + 50
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project with pgvector enabled
- (Optional) OpenAI API key for vector embeddings

### Installation

```bash
git clone https://github.com/duediligenceonemd/eligibil.git
cd eligibil
npm install
```

### Configuration

```bash
cp .env.example .env
# Edit .env with your credentials
```

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-supabase-service-role-key
OPENAI_API_KEY=sk-proj-...        # optional — falls back to FTS
SESSION_SECRET=your-secret
PORT=3000
```

### Database Setup

1. Open [Supabase SQL Editor](https://supabase.com/dashboard)
2. Run `scripts/supabase-schema.sql` (creates table, indexes, RPC functions)
3. Import grants data:

```bash
# Dry run — verify 70 grants parse correctly
node scripts/seed-grants.js --dry-run

# Real import (with OpenAI embeddings)
node scripts/seed-grants.js

# Import without embeddings (uses full-text search)
node scripts/seed-grants.js --skip-embeddings
```

### Run

```bash
npm start        # production
npm run dev      # development (auto-reload)
```

Open `http://localhost:3000`

## Runtime Configuration

Environment variables used by the current app layer:

```env
SESSION_SECRET=replace-with-a-long-random-secret
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_KEY=your-supabase-service-role-key
GA_MEASUREMENT_ID=
SITE_URL=https://eligibil.org
```

Notes:

- `GA_MEASUREMENT_ID` is optional and only used after cookie analytics consent.
- `SITE_URL` is used for SEO routes such as `sitemap.xml` and `llms.txt`.

## Health & SEO Endpoints

The app now exposes:

| Endpoint | Purpose |
|---|---|
| `/api/health` | Health check for uptime monitoring |
| `/sitemap.xml` | Search engine sitemap |
| `/robots.txt` | Crawl rules |
| `/llms.txt` | AI/search discovery guidance |

`/api/health` returns:

- `status`
- `timestamp`
- `environment`
- `response_time_ms`
- Supabase connectivity status

## Legal Pages

The app now includes public legal pages:

- `/privacy`
- `/legal/privacy`
- `/legal/cookie`
- `/terms`
- `/legal/terms`

These are static HTML documents and should still be reviewed by legal counsel before final sign-off.

## Password Reset

Transactional password reset is now implemented with token-based verification.

Endpoints:

- `POST /api/auth/forgot-password`
- `GET /api/auth/reset-password/verify?token=...`
- `POST /api/auth/reset-password`

Public page:

- `/forgot-password`
- `/reset-password`

Required Supabase schema:

- run `scripts/supabase-password-reset-schema.sql`

Optional env:

```env
PASSWORD_RESET_TTL_MINUTES=30
```

## Persistent Sessions

By default, local development can continue using the Express memory session store.

For production persistence across restarts and multiple instances:

1. Run `scripts/supabase-sessions-schema.sql` in Supabase.
2. Set:

```env
SESSION_STORE=supabase
SESSION_TABLE=app_sessions
SESSION_MAX_AGE_MS=86400000
```

The `app_sessions` table is private:

- `RLS ON`
- no `anon` / `authenticated` grants
- no public policies
- server-side access only through the Supabase service role

## Deadline Alerts

The email queue already supports `deadline_alert`. A producer script is now included to enqueue alerts for saved grants that are approaching their deadline.

Command:

```bash
npm run emails:deadline-alerts
```

Behavior:

- checks `saved_grants`
- joins to `profiles.email`
- looks for active grants whose deadline is in `14,7,3` days by default
- deduplicates against queued alerts and sent email logs
- enqueues `deadline_alert` emails into `email_queue`

Configuration:

```env
DEADLINE_ALERT_DAYS=14,7,3
```

Recommended schedule:

- run `npm run emails:deadline-alerts` daily
- run `node scripts/process-email-queue.js` shortly after

## GitHub Actions

Workflows currently included:

- `build.yml`
- `audits.yml`
- `smoke-pages.yml`
- `security.yml`
- `diagnostics.yml`

`diagnostics.yml` is intended for fast CI environment debugging:

- confirms runner/runtime versions
- checks key project files
- installs dependencies
- runs the build in isolation

## Resources Table Security

`funding_resources` is intended to be:

- publicly readable
- writable only from trusted server-side code using the Supabase service role

The schema now includes RLS hardening:

- `anon` and `authenticated` get `SELECT` only
- no public `INSERT`, `UPDATE`, or `DELETE`
- RLS policy allows public reads only

For existing databases, run:

- `scripts/supabase-resources-rls.sql`

## Private Operational Tables

The following tables should not be publicly accessible through Supabase client roles:

- `newsletter_subscribers`
- `waitlist`
- `email_logs`
- `email_queue`

The application already uses server-side service-role access for these flows, so the safe posture is:

- enable RLS
- revoke `anon` and `authenticated`
- do not create public policies

Prepared migration:

- `scripts/supabase-private-tables-rls.sql`

## Cookie Consent & Analytics

Frontend consent and analytics primitives are included:

- `cookie-consent.js`
- `analytics.js`
- `analytics-events.md`
- `/app-config.js`

Behavior:

- analytics are disabled until the user grants consent
- analytics payloads intentionally exclude personal data
- consent preferences are persisted client-side

## Sentry Monitoring

The Express runtime is prepared for Sentry with early bootstrap in:

- `instrument.js`

Configuration is read from environment variables:

- `SENTRY_DSN`
- `SENTRY_ENABLE_LOGS`
- `SENTRY_TRACES_SAMPLE_RATE`
- `SENTRY_PROFILE_SESSION_SAMPLE_RATE`
- `SENTRY_PROFILE_LIFECYCLE`
- `SENTRY_SEND_DEFAULT_PII`
- `ENABLE_SENTRY_DEBUG_ROUTE`

Behavior:

- Sentry initializes as early as possible
- Express errors are forwarded through the Sentry error handler
- sensitive request fields are redacted before sending
- `/debug-sentry` is enabled only outside production unless explicitly turned on

## Feedback Widget

A native feedback widget is now available on public pages.

It submits to:

- `POST /api/feedback`

Expected Supabase schema:

- run `scripts/supabase-feedback-schema.sql`

Stored fields:

- `rating`
- `funding_type_interest`
- `message`
- `page`
- `user_agent`
- `language`
- `created_at`

Admin review is also available via:

- `GET /api/admin/feedback`
- `GET /api/admin/feedback/:id`
- `PUT /api/admin/feedback/:id`
- `DELETE /api/admin/feedback/:id`
- `/admin` → tab `Feedback`

## Additional Supabase Schemas

Beyond the base grants schema, the repo now includes additional SQL files for operational features. Apply only the ones you need:

- `scripts/supabase-resources-schema.sql`
- `scripts/supabase-resources-descriptions-schema.sql`
- `scripts/supabase-feedback-schema.sql`

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/grants` | List grants with filters (`?sector=AI&tara=Moldova&min=10000`) |
| `GET` | `/api/grants/match` | AI-matched grants for current startup profile |
| `GET` | `/api/grants/:id` | Single grant details |
| `GET` | `/api/dashboard` | Dashboard data (top matches + alerts) |
| `GET/PUT` | `/api/profile` | Startup profile |
| `GET/POST` | `/api/pipeline` | Application pipeline |
| `POST` | `/api/auth/register` | Register |
| `POST` | `/api/auth/login` | Login |

---

## Production Verification

After a deploy, run:

```bash
npm run verify:prod
```

Optional:

```bash
PROD_BASE_URL=https://eligibil.org npm run verify:prod
```

The script checks:

- homepage
- search
- resources pages
- `/api/health`
- `/api/resources/overview`
- sitemap
- `llms.txt`

It also prints a small health summary for:

- Supabase
- Analytics
- Sentry

---

## Grant Database

The platform includes **70+ funding programs** across:

| Category | Examples |
|----------|---------|
| **Moldova Grants** | Startup Moldova, ODIMM, USAID BRITE, EIF Moldova |
| **Romanian Programs** | Start-Up Nation, IMM Invest, STS Romania |
| **EU Programs** | EIC Accelerator, Horizon Europe, EBRD StarVentures |
| **Accelerators** | Techcelerator, Innovation Labs, How to Web |
| **Cloud Credits** | AWS Activate, Google for Startups, Microsoft Founders Hub |

---

## Grants Intelligence Pipeline

Automated workflow for keeping the grants database fresh:

```
Email / RSS / Web scraper / Manual paste
        ↓
Claude API extraction → structured JSON
        ↓
SHA-256 fingerprint deduplication
        ↓
grants_staging (Supabase) + Obsidian draft
        ↓
[Auto-approve if score ≥ 85] OR [Admin queue review]
        ↓
grants table (production) + embedding regenerated
        ↓
Push notifications to matched users
```

**Run the pipeline:**

```bash
# === Manual / file-based ===
# Drop .eml files into ./inbox/, then:
npm run grants:process       # extract + stage + write Obsidian drafts

# === Automated sources ===
npm run grants:gmail         # poll Gmail IMAP (label: grants-new)
npm run grants:scrape        # scrape EIC/Cordis/ODIMM/AIPA/Startup Moldova
npm run grants:fetch         # ALL sources (cron-friendly orchestrator)

# === Obsidian sync ===
npm run grants:sync          # both directions
npm run grants:pull          # Supabase → Obsidian
npm run grants:push          # Obsidian → Supabase

# === Admin UI ===
open http://localhost:3000/admin-queue.html
```

**Schedule with Windows Task Scheduler (every 6h):**
```cmd
schtasks /create /tn "eligibil-grants-fetch" ^
  /tr "node C:\Users\Zinaida\ELIGIBIL\scripts\cron-fetch.js" ^
  /sc hourly /mo 6
```

**Schedule with cron (Linux/macOS):**
```cron
0 */6 * * * cd /path/to/eligibil && npm run grants:fetch >> logs/cron.log 2>&1
```

**Obsidian vault structure** (`~/eligibil-grants/`):
- `drafts/` — pending review (AI writes here)
- `published/` — live in Supabase grants table
- `applied/` — startups in pipeline
- `ignored/` — rejected
- `_index.md` — auto-generated dashboard

---

## Deploy

Production-ready configs for 4 platforms. Pick one and deploy in <5 minutes.

### One-click deploy buttons

[![Deploy on Railway](https://railway.com/button.svg)](https://railway.com/template/new?template=https%3A%2F%2Fgithub.com%2Fduediligenceonemd%2Feligibil)
[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/duediligenceonemd/eligibil)
[![Run on Google Cloud](https://deploy.cloud.run/button.svg)](https://deploy.cloud.run?git_repo=https://github.com/duediligenceonemd/eligibil)

### Manual deploy (PowerShell)

```powershell
# Google Cloud Run (currently live: europe-west1)
.\scripts\deploy.ps1 gcp

# Railway (no EU free tier, us-east1)
.\scripts\deploy.ps1 railway

# Render (Frankfurt, free tier sleeps after 15min idle)
.\scripts\deploy.ps1 render

# Fly.io (Frankfurt, scale-to-zero)
.\scripts\deploy.ps1 fly
```

### Platform comparison

| Platform | Region near MD/RO | Free tier | Cold start | Custom domain |
|----------|-------------------|-----------|------------|---------------|
| **Google Cloud Run** ⭐ | europe-west1 (Belgium) | 2M req/mo, scale-to-zero | ~1s | Free, auto SSL |
| **Fly.io** | fra (Frankfurt) | 3 VMs × 256MB | ~500ms | Free, auto SSL |
| **Render** | Frankfurt | 750h/mo (sleeps 15min) | ~30s on free | Free, auto SSL |
| **Railway** | us-east1 only | $5 credit/mo | ~1s | Free .up.railway.app |

**Recommendation:** Cloud Run (already live) or Fly.io for lowest latency to Eastern Europe users. Render free tier OK for testing only (sleeps).

### Config files

- `Dockerfile` — used by all 4 platforms
- `.dockerignore` — excludes secrets/local data from image
- `railway.toml` — Railway service config
- `render.yaml` — Render Blueprint
- `fly.toml` — Fly.io app config
- `scripts/deploy-cloudrun.ps1` — GCP deploy with env from `.env`
- `scripts/deploy.ps1` — multi-platform dispatcher

### Custom domain (eligibil.org)

After purchasing the domain, map it to your chosen platform:

```bash
# Google Cloud Run
gcloud beta run domain-mappings create --service=eligibil --domain=eligibil.org --region=europe-west1

# Fly.io
flyctl certs create eligibil.org

# Render: Settings → Custom Domains (web UI)
# Railway: Settings → Networking → Custom Domain (web UI)
```

All four issue automatic Let's Encrypt SSL certificates within ~10-30 minutes after DNS propagates.

---

## Roadmap

- [ ] Email deadline alerts
- [ ] Multi-language support (EN/RO/RU)
- [ ] Application document generator (AI-assisted)
- [ ] Partner accelerator integrations
- [ ] Mobile-responsive redesign
- [ ] Public API for grant data consumers

---

## Why We Need API Credits

eligibil.org is at **MVP stage** with a working prototype serving early users. We use:

- **LLM embeddings** — generating semantic vectors for 70+ grants + user profiles (`text-embedding-3-small`)
- **Semantic search** — matching startup profiles to relevant grants via cosine similarity
- **Document analysis** — planned feature for eligibility document parsing

We are applying for API/cloud credits to:
1. Scale the grant database to 500+ programs across all Eastern European markets
2. Add AI-powered eligibility pre-screening (LLM-based document analysis)
3. Build automated deadline monitoring and notification system
4. Support pilot users during the validation phase

**Estimated monthly usage at scale:** ~$200–500/month across embeddings, completions, and hosting.

---

## About

**eligibil.org** is built by a team of founders who experienced the grant-hunting problem firsthand while building their own startup in Moldova. We believe access to funding information should be a right, not a privilege — especially for founders in emerging markets where institutional knowledge is scarce.

- **Website:** [eligibil.org](https://eligibil.org)
- **Contact:** info@eligibil.org
- **Stage:** MVP / Early Traction
- **Location:** Moldova 🇲🇩 / Romania 🇷🇴

---

## License

MIT — see [LICENSE](LICENSE)
