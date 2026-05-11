# Instrucțiuni de implementare — eligibil.eu

**Sprint:** 4 săptămâni (Mai 2026)
**Decizii confirmate:**
- URL: `/ro/granturi/:slug` + `/en/grants/:slug` (bilingual)
- Artefact: PDF pitch deck (faza 1)
- Analiză: Anthropic Claude (`ANTHROPIC_API_KEY` deja în .env)

---

## Ordinea de execuție

**Săptămâna 1: Granturi + SEO + Search (cod)**
→ `01_granturi_search_codecode.md`

Fundația. Fără asta nu poți avea nici pagini de profil, nici search, nici trafic SEO. Și fără date bogate, analiza artefactului nu are de ce să se ataseze.

**Săptămâna 2: Pagini SEO grant + design (Claude Design)**
→ `02_design_grant_page.md`

După ce ai schema îmbogățită + slug bilingual + 60-100 granturi în Supabase, faci designul paginii detaliu. Claude Code o implementează din mockup.

**Săptămâna 3: Pipeline artefact → scoring (cod)**
→ `03_artefact_scoring_codecode.md`

Upload PDF → extract → Claude API analyzes → 3 scoruri (readiness, completeness, fit) salvate în Supabase, vizibile pe dashboard și pe fiecare grant.

**Săptămâna 4: Events SEO + design upload page**
→ `04_events_seo_codecode.md` + `05_design_upload_artefact.md`

Events refolosește pagina existentă cu pivot la grant deadlines + adaugă agenda externă. Pagina de upload artefact necesită design fresh pentru clarity (cele 3 scoruri vizibile mare).

---

## Ce livrezi la sfârșit de sprint

- [ ] Schema `grants` extinsă cu 12 câmpuri SEO/structurate
- [ ] Slug bilingual + sitemap.xml + hreflang
- [ ] `/ro/granturi/:slug` și `/en/grants/:slug` funcționale
- [ ] Pagină `/search` cu 8 filtre + sortare
- [ ] 60-100 granturi importate cu profil bogat
- [ ] `/upload-artefact` flow: PDF → analiză → 3 scoruri salvate
- [ ] Scoruri afișate pe dashboard și pe pagina fiecărui grant
- [ ] `/evenimente` (RO) + `/events` (EN) cu pivot la deadlines + agenda externă
- [ ] Sitemap programmatic cu pagini SEO țară × sector
- [ ] Mockup designs în Claude Design pentru cele 2 pagini noi

---

## Cum folosești fișierele

Fiecare brief e self-contained. Pentru Claude Code, copiezi tot conținutul fișierului în prompt și începi cu instrucțiunea de top. Pentru Claude Design, copiezi conținutul ca brief inițial, apoi iterezi prin chat.

Fișierele:

| # | Fișier | Pentru | Durată |
|---|---|---|---|
| 01 | `01_granturi_search_codecode.md` | Claude Code | 5-7 zile |
| 02 | `02_design_grant_page.md` | Claude Design | 2 zile |
| 03 | `03_artefact_scoring_codecode.md` | Claude Code | 5-6 zile |
| 04 | `04_events_seo_codecode.md` | Claude Code | 1-2 zile |
| 05 | `05_design_upload_artefact.md` | Claude Design | 1 zi |

---

## Reguli pentru toate brief-urile către Claude Code

Adaugă la începutul fiecărui prompt către Claude Code:

```
Working dir: C:\Users\Zinaida\ELIGIBIL
Stack: Node 18 + Express 4 + Supabase pgvector + vanilla JS frontend (NU React build)
Existing code: NU rescrie. Citește înainte de a modifica:
  - server.js, routes/api.js, routes/admin.js, routes/auth.js
  - db/database.js, db/supabase.js, db/profile-sync.js
  - scripts/supabase-schema.sql, scripts/supabase-staging-schema.sql
  - components-grant.jsx, components-dashboard.jsx
  - .env.example pentru variabile de mediu
Folosește framework-urile deja instalate (vezi package.json).
Pentru SQL: scrie migrare nouă, NU edita schema existentă.
Pentru API: extinde endpoint-uri existente, adaugă altele noi.
Pentru frontend: refolosește components-*.jsx + styles-*.css existente.
i18n: orice text nou se adaugă în lang.js (RO_TO_EN dictionary).
```

Asta previne ca Claude Code să rescrie lucruri funcționale.

---

## Limite & escalation

- Dacă Claude Code propune să rescrie ceva existent — refuză și cere doar extensia.
- Dacă Claude Design produce ceva care iese din paleta deja stabilită (Space Grotesk + JetBrains Mono + warm off-white #f7f5f0 + navy #1f3a5f) — cere să se alinieze cu sistemul existent.
- Dacă o sarcină ia mai mult de durata estimată × 1.5 — oprește, sumarizează, decide dacă merită continuat.

---

*Brief master · sprint Mai 2026 · v1*
