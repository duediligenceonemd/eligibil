# eligibil.org — AI Grant Matching for Startups

> Find the right grants, faster. AI-powered matching for startups in Moldova, Romania & the EU.

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
SUPABASE_SERVICE_KEY=your_anon_or_service_key
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
