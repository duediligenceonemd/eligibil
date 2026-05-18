# Broken Pages Audit

Checked on May 16, 2026.

Method:

- `node scripts/smoke-pages.js`
- Browser verification on `http://127.0.0.1:3000` with console error inspection

Top 5 public pages:

| Page | Route | Result | Console errors |
|---|---|---|---|
| Home | `/` | OK | 0 |
| About | `/about` | OK | 0 |
| Parteneri | `/parteneri` | OK | 0 |
| Startupuri | `/startupuri` | OK | 0 |
| Produse | `/produse` | OK | 0 |

Observed titles:

- `/` → `eligibil.org — Descoperă cele mai bune surse de finanțare pentru startupul tău`
- `/about` → `Despre eligibil.org · AI Funding Orchestrator`
- `/parteneri` → `Parteneri verificați · eligibil.org`
- `/startupuri` → `Startupuri înregistrate · eligibil.org`
- `/produse` → `Produse AI · eligibil.org`

Result:

- No broken pages detected in the top 5 public routes reviewed in this pass.

Out of scope for this audit:

- Dynamic catalog/data routes such as `/search`, `/events`, `/stiri`, `/news`, and grant detail pages backed by live data
- Authenticated application flows
