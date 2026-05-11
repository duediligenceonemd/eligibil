# Brief 05 — Design pagină Upload Artefact

**Pentru:** Claude Design (claude.ai/design)
**Output:** Mockup pentru `/upload-artefact.html` cu cele 4 stări (idle, uploading, processing, results)
**Durată:** 1 zi

---

## Cum folosești

1. claude.ai/design
2. Lipește textul de la "## Brief design" până la final ca prim mesaj
3. Iterează pe cele 4 stări
4. Export bundle → handoff Claude Code

---

## Brief design

Construiește pagina **`/upload-artefact`** pentru eligibil.org. Aceasta este momentul de adevăr al produsului: utilizatorul își încarcă pitch deck-ul PDF și AI-ul îl analizează în 30-60 secunde, returnând 3 scoruri și un breakdown detaliat.

Pagina trebuie să facă utilizatorul să simtă: **încredere** (datele mele sunt în siguranță), **anticipare** (scorul vine în câteva secunde) și **claritate** (înțeleg de ce am acest scor).

### Audiență

Fondator solo sau echipă mică (2-5 oameni), cu un pitch deck deja făcut, care vrea o opinie obiectivă rapidă. Probabil deja a aplicat la 1-2 granturi și vrea să știe unde stă.

### Constrângeri vizuale

Identice cu Brief 02 (pagina grantului):
- Space Grotesk + JetBrains Mono + Inter
- Warm off-white #f7f5f0, navy #1f3a5f, ink #0e1620
- Niciun emoji, niciun stock photo, niciun gradient slop, niciun drop shadow
- Brutalist-lite, ierarhie prin rules și type weight

### 4 stări de design

#### State 1 — Idle (default)

Layout single-column, max-width 720px, centrat:

1. **Header** scurt:
   - Eyebrow: `Pas 1 din 1`
   - H1 (Space Grotesk 600, ~40px): `Încarcă pitch deck-ul tău`
   - Sub-h1: `În ~60 secunde primești 3 scoruri AI și un breakdown pe 9 dimensiuni.`

2. **Drop zone** mare (min-height 280px, dashed border 2px, navy):
   - Iconiță SVG simplă: document cu săgeată sus
   - Text mare: `Trage PDF-ul aici sau`
   - Buton primar mare: `Selectează fișier`
   - Footer-text mic: `Doar PDF · Max 25 MB · Recomandat 10-20 pagini`

3. **Sub drop zone**, lista de garanții (3 puncte cu rule între):
   - **Confidențial** — Fișierul e șters automat după 7 zile. Doar tu vezi rezultatele.
   - **Anonim** — Pentru analiză inițială nu îți trebuie cont. Salvezi rezultatele cu cont.
   - **Rapid** — 30-60 secunde. Mai mic decât o pauză de cafea.

4. **FAQ scurt** (3 întrebări accordion):
   - "Ce face AI-ul cu deck-ul meu?"
   - "Pot încărca alt format (PowerPoint, Keynote)?"
   - "Ce primesc dacă scorurile sunt mici?"

5. **Trust footer**:
   - Logo "Powered by Anthropic Claude" (text only, no Anthropic logo)
   - Link `Politica de confidențialitate →`

#### State 2 — Uploading

După drag/select:

1. **Card mic** centrat:
   - File icon + nume fișier + size: `ax_pitch_deck_v3.pdf · 4.2 MB`
   - Progress bar liniar (navy, no percent text inside)
   - Sub bar: `Se încarcă... 67%`
   - Buton text: `[Anulează]` (gri, hover navy)

2. Restul paginii dim 50% opacity, non-interactive.

#### State 3 — Processing (cel mai important pentru UX)

Acesta e momentul critic — utilizatorul așteaptă AI. Trebuie să simtă progres, nu blocaj.

Layout:

1. **Card mare**, centrat:
   - Eyebrow mono: `STEP 2/3 · Analizez deck-ul`
   - Titlu: `Claude analizează pitch deck-ul tău`
   - Sub-titlu: `Asta durează ~30 secunde. Nu închide pagina.`

2. **Progress vizual** — NU un spinner generic. În loc, o secvență de pași care se schimbă:

```
✓ Citit 14 pagini din deck
✓ Detectat sectorul: AI/SaaS
✓ Detectat stadiul: MVP
⠋ Evaluez problem clarity...
   solution maturity
   market potential
   business model
   traction
   team capacity
   financial readiness
   technical maturity
   application completeness
```

Step-urile completate au check ✓ navy. Step-ul curent are spinner mono ⠋. Step-urile viitoare sunt gri 40% opacity.

Se updatează la fiecare ~3-5 secunde (chiar dacă în realitate Claude lucrează în paralel, simulează progres pentru perceived performance).

3. **Below progress**, text rotativ (la fiecare 4s):
   - "Identific KPI-urile menționate..."
   - "Caut traction signals..."
   - "Compar cu profilul declarat..."
   - "Calculez Match cu cele 70+ granturi din DB..."
   - "Generez breakdown pe dimensiuni..."

4. **NICIUN buton activ** — utilizatorul doar așteaptă. Asigură că ai fallback dacă durează > 90s: `Hmm, durează mai mult decât de obicei. Încearcă să refresh pagina sau să reîncarci deck-ul.`

#### State 4 — Results (cel mai bogat ecran)

Layout 3-column-ish, scrollable:

1. **Hero rezultat** (full width, sus):
   - Eyebrow: `Analiză completă · acum 2 minute`
   - H1: `Scoruri pentru pitch deck-ul tău`
   - 3 inele scor mari (size 140px), aliniate orizontal:
     - `Readiness 65/100` · color amber
     - `Completeness 78/100` · color green
     - `Fit 82/100` · color navy
   - Sub fiecare inel, microcopy 1 frază:
     - `Ai 4 lipsuri majore`
     - `Ai 8 din 10 elemente standard`
     - `Pitch-ul declarat se potrivește cu conținutul`

2. **Bara de cele 9 dimensiuni** (jos de scoruri, full width):
   - 9 bare orizontale, fiecare cu:
     - Label (Inter 500): `Problem clarity`
     - Bar (track gri, fill navy/amber/red după scor)
     - Score (mono): `75/100`
     - Hover/click expand: revelează observations + suggestions textual
   - Sortate descrescător după scor (sus = strengths, jos = gaps)

3. **3 coloane** below:

   **Coloana 1: ✓ Strengths** (max 4 bullets)
   - "Problema e clară și viața o experientă personală"
   - "Soluția are un MVP funcțional cu 50 useri"
   - "Echipa are background tehnic complementar"
   - "Deck-ul include slide standard pentru ask"

   **Coloana 2: × Gaps** (max 4 bullets)
   - "Lipsește slide-ul cu market sizing (TAM/SAM/SOM)"
   - "Financial projections incomplete"
   - "Nu menționezi competitorii direct"
   - "Defensibility / IP nedeclarate"

   **Coloana 3: ⚠ Red flags** (max 3, doar dacă există)
   - "Burn rate menționat sugerează runway < 6 luni"
   - "Tracțiunea declarată nu e susținută cu metrici"

4. **Section: Top 5 granturi recomandate** (full width):
   - Header: `Cu pitch deck-ul tău, ai cele mai bune șanse la:`
   - 5 carduri orizontale: nume grant, funder, sumă, deadline, match score (mare), readiness (același peste tot, calculat acum)
   - Hover: highlight + tooltip "De ce e potrivit"
   - Click: → `/ro/granturi/{slug}`

5. **CTA persistent** (sticky bottom right):
   - Card mic cu:
     - `Salvează rezultatele în cont` → trimite la /register cu artefact_id pre-fillat
     - `Reîncarcă altă versiune` → reset la State 1
     - `Descarcă raport PDF` → backend generează (Phase 2, în prima fază doar Save)

6. **Section: Ce să faci în continuare** (jos de tot):
   - 3 carduri:
     - **Repară primele 3 gaps** → `Vezi ghidul de pitch deck →`
     - **Completează profilul startupului** → ` Mergi la profil →`
     - **Setează alerte pentru deadline-uri** → `Setează alerte →`

### Microinteracțiuni

- Drop zone reacționează la dragover (border devine accent, background subtil tint)
- Inelele de scor se animează din 0 la valoarea finală (animation 800ms ease-out) când State 4 apare
- Bare dimensiuni se animează cu staggered delay (50ms între ele)
- Hover pe dimensiune: smooth expand textual cu transition 200ms
- Confetti SUBTILE doar dacă scor agregat > 85 (rar — 2 secunde, geometric, nu emoji)

### Date mock pentru prototip

Folosește acest set ca demo:

```javascript
const MOCK_RESULT = {
  artefact_id: 'art_abc123',
  uploaded_at: '2026-04-29T10:30:00Z',
  file_name: 'ax_pitch_deck_v3.pdf',
  page_count: 14,
  scores: {
    readiness_score: 65,
    completeness_score: 78,
    fit_score: 82,
  },
  dimensions: [
    { dim: 'Solution maturity', score: 88, observations: 'MVP funcțional cu 50 useri activi.', suggestions: 'Adaugă screenshots cu UX real.' },
    { dim: 'Team capacity', score: 85, observations: 'Founder + CTO + 2 engineers cu CV-uri solide.', suggestions: 'Menționează advisor-ii dacă există.' },
    { dim: 'Application completeness', score: 80 },
    { dim: 'Problem clarity', score: 75 },
    { dim: 'Business model', score: 70 },
    { dim: 'Traction', score: 60, observations: 'Numere prezente dar fără context (growth rate, churn).', suggestions: 'Adaugă cohort retention chart.' },
    { dim: 'Technical maturity', score: 55 },
    { dim: 'Market potential', score: 45, observations: 'TAM/SAM/SOM lipsă.', suggestions: 'Adaugă slide cu market sizing — folosește Statista sau Gartner.' },
    { dim: 'Financial readiness', score: 35, observations: 'Cifre vagi, fără projection.', suggestions: '3 ani de proiecție: revenue, COGS, burn, runway.' },
  ],
  extracted_entities: {
    sector: 'AI / SaaS',
    stage: 'MVP',
    team_size: 5,
    trl_estimate: 5,
    traction_summary: '50 active users, MoM growth 18%',
  },
  strengths: [
    'Problema e clară și provine din experiență personală',
    'Soluția are MVP funcțional cu 50 useri activi',
    'Echipa are background tehnic complementar',
    'Deck-ul include slide standard pentru ask',
  ],
  gaps: [
    'Lipsește slide-ul cu market sizing (TAM/SAM/SOM)',
    'Financial projections incomplete',
    'Nu menționezi competitorii direct',
    'Defensibility / IP nedeclarate',
  ],
  red_flags: [
    'Burn rate menționat sugerează runway < 6 luni',
  ],
  recommended_grants: [
    { id: 'EU012', slug_ro: 'eic-accelerator-2026', nume_program: 'EIC Accelerator', funder_name: 'EIC', suma_max: 2500000, deadline: '22 Mai 2026', match_score: 82 },
    { id: 'MD003', slug_ro: 'startup-moldova-2026', nume_program: 'Startup Moldova Grant', funder_name: 'ODIMM', suma_max: 50000, deadline: 'Rolling', match_score: 78 },
    { id: 'ACC005', slug_ro: 'techcelerator-batch-12', nume_program: 'Techcelerator Batch 12', funder_name: 'Techcelerator', suma_max: 100000, deadline: '15 Iun 2026', match_score: 75 },
    { id: 'ACC003', slug_ro: 'innovation-labs-md', nume_program: 'Innovation Labs Moldova', funder_name: 'IL', suma_max: 30000, deadline: '01 Sep 2026', match_score: 71 },
    { id: 'EU018', slug_ro: 'horizon-eic-pathfinder', nume_program: 'EIC Pathfinder', funder_name: 'EIC', suma_max: 4000000, deadline: '15 Oct 2026', match_score: 68 },
  ],
  llm: {
    model: 'claude-opus-4-5',
    cost_usd: 0.34,
    duration_ms: 28400,
  }
};
```

### Tweaks panel (pentru exploration)

- Density: spacious / balanced / dense
- Show llm cost: on / off (debug)
- Animation level: full / reduced / none

### Ce NU faci

- Niciun design "magic" sau "AI sparkle" — păstrează tonul factual
- Niciun emoji în titluri (X / ✓ / ⚠ sunt singurele caracter speciale acceptate)
- Niciun gradient pe inelele scor
- Niciun progress bar circular pentru tot ecranul (folosește step list textual)
- Niciun confetti agresiv (doar discret la scor mare)

### Output

Bundle export cu:
- `upload-artefact.html` — pagina cu toate cele 4 stări (toggle prin dev panel)
- CSS dedicat
- JSX cu componente: `Idle`, `Uploading`, `Processing`, `Results`
- Toate cele 4 stări vizibile prin URL hash (#idle, #uploading, etc.) pentru iterare ușoară cu Claude Code

---

## Iterare

După prima livrare, întreabă să:
1. Faci responsive 320-768px (drop zone full-width, inelele scor în coloană, dimensiuni cards stacked)
2. Adaugi varianta dark mode
3. Verifici accessibility: focus order, aria-labels pe drop zone, screen reader labels pe scoruri
4. Adaugi micro-state "Reupload" — când utilizatorul are deja un artefact și încarcă altul

---

*Brief 05 · v1 · sprint Mai 2026*
