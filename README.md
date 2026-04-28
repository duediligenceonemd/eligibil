# eligibil.eu — AI Grant Matching for Startups

> Find the right grants, faster. AI-powered matching for startups in Moldova, Romania & the EU.

[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=node.js&logoColor=white)](https://nodejs.org)
[![Express](https://img.shields.io/badge/Express-4.x-000000?logo=express&logoColor=white)](https://expressjs.com)
[![Supabase](https://img.shields.io/badge/Supabase-pgvector-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com)
[![OpenAI](https://img.shields.io/badge/OpenAI-Embeddings-412991?logo=openai&logoColor=white)](https://openai.com)
[![License](https://img.shields.io/badge/License-MIT-blue)](LICENSE)

---

## What is eligibil.eu?

**eligibil.eu** is an AI-powered grant discovery and matching platform designed for early-stage startups in Moldova, Romania, and the EU. Instead of spending weeks manually researching funding opportunities, founders describe their startup once — and the platform instantly surfaces the most relevant grants, accelerators, and investment programs.

### The Problem

Founders waste 20–40 hours per funding round researching eligibility across 70+ programs spread across government portals, accelerator websites, and EU databases. Most of the time, they apply to programs they don't actually qualify for.

### The Solution

eligibil.eu uses **vector embeddings + semantic search** to match startup profiles against a curated database of grants based on sector, stage, country, funding range, and eligibility criteria — not just keyword search.

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

## Roadmap

- [ ] Email deadline alerts
- [ ] Multi-language support (EN/RO/RU)
- [ ] Application document generator (AI-assisted)
- [ ] Partner accelerator integrations
- [ ] Mobile-responsive redesign
- [ ] Public API for grant data consumers

---

## Why We Need API Credits

eligibil.eu is at **MVP stage** with a working prototype serving early users. We use:

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

**eligibil.eu** is built by a team of founders who experienced the grant-hunting problem firsthand while building their own startup in Moldova. We believe access to funding information should be a right, not a privilege — especially for founders in emerging markets where institutional knowledge is scarce.

- **Website:** [eligibil.eu](https://eligibil.eu)
- **Contact:** hello@eligibil.eu
- **Stage:** MVP / Early Traction
- **Location:** Moldova 🇲🇩 / Romania 🇷🇴

---

## License

MIT — see [LICENSE](LICENSE)
