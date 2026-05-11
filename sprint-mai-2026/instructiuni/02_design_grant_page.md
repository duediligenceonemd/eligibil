# Brief 02 — Design pagină detaliu grant

**Pentru:** Claude Design (claude.ai/design)
**Output:** Mockup HTML/CSS/JS pentru `/ro/granturi/:slug` și `/en/grants/:slug`
**Durată:** 2 zile (incluzând iterare)

---

## Cum folosești acest brief

1. Mergi la claude.ai/design
2. Lipește textul de mai jos (de la "## Brief design" până la final) ca primul mesaj
3. Răspunde la întrebările Claude Design despre tweaks (folosește valorile din "Constrângeri")
4. Iterează pe scroll până ești mulțumit
5. Exportează bundle-ul → trimite la Claude Code pentru implementare

---

## Brief design

Construiește pagina de detaliu pentru un grant pe **eligibil.eu** — platforma AI care ajută startupurile din Moldova, România și UE să găsească finanțare.

Această pagină este **convertorul principal** al portalului: un vizitator SEO ajunge aici dintr-o căutare Google ("granturi AI Moldova") și trebuie să decidă în 30 de secunde dacă produsul merită un cont.

### Audiență

Fondatori de startup-uri early-stage (MVP, Pre-seed, Seed). Citesc rapid, scanează, vor răspunsuri concrete: pot aplica? cât costă? cât timp îmi ia? cu ce documente?

### Constrângeri vizuale (NEGOCIABILE NU)

- **Aesthetic:** Eastern European tech, brutalist-lite. Confident, factual, cu ierarhie clară. Niciun gradient slop, niciun emoji, nicio iconiță stock.
- **Type:** Space Grotesk pentru display/UI, JetBrains Mono pentru numere/labels/data, Inter pentru body.
- **Palette:**
  - Background: warm off-white `#f7f5f0`
  - Ink: near-black `#0e1620`
  - Accent: deep navy `#1f3a5f` (default), dar adaugă tweak pentru forest `#0a5c3e`, rust `#c24a1e`, plum `#6b46c1`
  - Borders: muted gray `#d4cfc4`
  - Live status (open deadline): subtle green `#0a5c3e`
  - Warn (deadline soon, < 14 days): subtle amber `#b8730a`
  - Critical (deadline imminent, < 7 days): subtle red `#a8341e`
- **Imagery:** abstract geometric SVG generated thumbnails (dots, hex, grid, rules). Niciun stock photo.
- **Density:** balanced default, dar tweak la spacious / dense
- **Dark mode:** include dar opt-in
- **No drop shadows.** Folosește rules / borders pentru ierarhie.

### Structura paginii (16 secțiuni, scroll continuu)

1. **Header sticky** cu scroll-progress bar
   - Logo eligibil.eu stânga
   - Meniu: Caută · Granturi · Pentru tine · Resurse · Parteneri
   - Language switcher RO/EN/RU/UA dreapta
   - CTA primar "Verifică eligibilitatea" (deschide modal upload PDF)

2. **Breadcrumb minimal**
   - `Granturi → AI & Deep Tech → Moldova → EIC Accelerator 2026`
   - Mono font, navy underline pe hover

3. **Hero**
   - Stânga (60%):
     - Eyebrow mono: `EU012 · Verified · Updated 3 days ago`
     - H1 mare (Space Grotesk 600, ~48px): nume program
     - Sub-h1 (Inter regular, ~22px): funder + program type
     - Tags pill: `[AI/Deep Tech]` `[EU]` `[€2.5M]` `[Open]`
     - Două butoane primare: `Verifică potrivirea` (filled navy) + `Salvează în pipeline` (outline)
   - Dreapta (40%):
     - Quick Stats card (rules, no shadow):
       - **Sumă:** până la €2.5M
       - **Deadline:** 23 zile · 22 Mai 2026
       - **Tip:** Grant + equity opțional
       - **Eligibili:** UE + țări asociate
       - **Effort:** 8/10 · ~120 zile pregătire
       - **Aplicație:** EN obligatoriu

4. **Score band** (full-width, sticky offset)
   - 3 inele scor cu animație la scroll: **Match 82%** (navy), **Readiness 65%** (amber), **Confidence 74%** (navy)
   - Microcopy sub fiecare: "Profilul tău se potrivește bine" · "Ai 4 lipsuri majore" · "Date suficiente pentru estimare"
   - Buton text: `De ce aceste scoruri? →` deschide drawer cu breakdown
   - **Pre-login state:** afișează scoruri zero cu CTA "Conectează-te ca să-ți vezi scorurile personalizate"

5. **Snapshot eligibilitate** (CHECK / CROSS list)
   - Header H2: "Ești eligibil?"
   - Listă 6-10 reguli citite din `eligibility_rules`:
     - ✓ Țară eligibilă (Moldova → asociată UE)
     - ✓ Stadiu compatibil (MVP, Pre-seed, Seed)
     - ✗ TRL minim 6 — tu ai TRL 4
     - ✗ Consorțiu necesar — nu ai parteneri identificați
     - ⚠ Cofinanțare 25% — verifică dacă ai resurse
   - Pe mouseover regulă, popover cu explicație
   - Footer: `[Cum se calculează?]` link

6. **Cerințe documentare**
   - Tabel cu 2 coloane: Document · Status în profilul meu
   - Citește `documents_required` din schema:
     - Pitch deck PDF · ✓ Încărcat (acum 5 zile)
     - Business plan · ✗ Lipsă
     - Financial projections (xlsx) · ✗ Lipsă
     - Team CVs · ⚠ Doar 2/4 încărcate
   - CTA în jos: `[Generează cu AI →]` (pentru Phase 2)

7. **Timeline aplicare**
   - Bară orizontală cu 5-7 milestones:
     - Acum → Pregătire (60 zile) → Submission (deadline) → Evaluare (90 zile) → Decision (30 zile) → Contract (60 zile)
   - Fiecare cu data calculată din `deadline`
   - Highlight pe pasul curent

8. **Criterii de evaluare**
   - 5-7 bare orizontale cu peso (`evaluation_criteria` JSONB):
     - Innovation · 30%
     - Market potential · 25%
     - Team · 20%
     - Feasibility · 15%
     - Impact · 10%
   - Sub fiecare: 1 frază "Ce caută evaluatorii"

9. **Funder Intelligence**
   - Header H2: "Despre {funder_name}"
   - 3 coloane:
     - Cine sunt: 2 paragrafe scurte
     - Ce au finanțat: 4 carduri mini (programe similare anterioare)
     - Profil tipic beneficiar: bullet list scurt
   - Logo funder (din `funder_logo_url` dacă există)

10. **Oportunități similare**
    - 4 carduri orizontale: top 4 granturi cu match score >65% pentru profilul curent
    - Fiecare card: nume scurt, funder, sumă, deadline countdown, match%
    - Hover: highlight border + tooltip "De ce e similar"

11. **FAQ**
    - 6 întrebări frecvente per grant cu accordion
    - Schema.org FAQPage JSON-LD pentru SEO
    - Întrebări tipice:
      - "Cât durează evaluarea?"
      - "Pot aplica ca persoană fizică?"
      - "E nevoie de consorțiu?"
      - "Care e rata de succes?"

12. **Trust & Data Freshness**
    - Card cu 4 elemente:
      - Sursă oficială: `[Link extern către apel]` (icon external)
      - Ultima verificare: `28 Apr 2026 · acum 12 ore`
      - Confidence label: `Verified primary` (badge verde)
      - `[Raportează informație incorectă →]` link
    - Aceasta este secțiunea care diferențiază eligibil.eu de competitori. Trebuie vizibilă, nu îngropată.

13. **CTA mid-page** (full-width band)
    - "Vrei să vezi scorurile tale personalizate pentru acest grant?"
    - Buton mare: `Încarcă pitch deck-ul tău (90 secunde) →`
    - Sub: "Free · Anonim până te înregistrezi"

14. **Aside / sticky right** pe desktop (apare de la secțiune 5)
    - Card mic cu acțiuni rapide:
      - `Salvează în pipeline`
      - `Setează alert pentru deadline`
      - `Trimite la consultant`
      - `Compară cu alt grant`
    - Mini score widget (Match 82%) repetat
    - "Aplici la 22 Mai? Setează checklist-ul →"

15. **Pagina-footer adițional**
    - Disclaimer scurt: "Datele sunt orientative. Verifică sursa oficială înainte de aplicare."
    - Link la sursa oficială (repetat)

16. **Footer site**
    - Reutilizează footer-ul existent de pe homepage

### Microinteracțiuni necesare

- Score rings se animează când intră în viewport
- Sticky aside apare după ce treci de Hero
- FAQ accordion se deschide cu transition smooth
- Tabs pe "Programe similare" filtrează cu animație instant
- Tooltip pe eligibility rules (300ms delay, dismissable)
- Language switcher schimbă conținutul instant via lang.js (deja există)

### Date mock pentru prototip

Folosește acest grant ca exemplu live:

```javascript
{
  id: 'EU012',
  slug_ro: 'eic-accelerator-2026',
  slug_en: 'eic-accelerator-2026',
  nume_program: 'EIC Accelerator 2026',
  nume_program_en: 'EIC Accelerator 2026',
  funder_name: 'European Innovation Council',
  funder_country: 'EU',
  short_summary_ro: 'Grant + equity opțional până la €2.5M pentru deep-tech scaleups în UE.',
  tara: 'EU',
  tip: 'Grant + Equity',
  dilutiv: false,
  suma_min: 500000,
  suma_max: 2500000,
  cofinancing_pct: 0,
  equity_pct: 15,
  consortium_required: false,
  trl_min: 6,
  trl_max: 8,
  stadiu: 'Pre-seed / Seed / Series A',
  sector: 'AI / Deep Tech / SaaS / Climate',
  deadline: '22 Mai 2026',
  status: 'Open',
  evidence_status: 'verified_primary',
  source_url: 'https://eic.ec.europa.eu/eic-funding-opportunities/eic-accelerator_en',
  application_url: 'https://accelerator.eismea.eu/',
  application_languages: ['en'],
  matchScore: 82,
  readinessScore: 65,
  confidenceScore: 74,
  eligibility_rules: [
    { type: 'country', value: 'EU + associated', required: true, met: true },
    { type: 'stage', value: 'Pre-seed / Seed / Series A', required: true, met: true },
    { type: 'trl_min', value: 6, required: true, met: false, user_value: 4 },
    { type: 'consortium', value: false, required: false, met: true },
    { type: 'cofinancing_pct', value: 0, required: true, met: true },
  ],
  documents_required: [
    { name: 'Pitch deck', required: true, format: 'pdf', max_pages: 15, user_status: 'uploaded' },
    { name: 'Business plan', required: true, format: 'pdf', user_status: 'missing' },
    { name: 'Financial projections', required: true, format: 'xlsx', user_status: 'missing' },
    { name: 'Team CVs', required: true, format: 'pdf', user_status: 'partial', user_count: 2, total: 4 },
  ],
  evaluation_criteria: [
    { name: 'Innovation', weight: 30, description: 'Novelty and disruptive potential' },
    { name: 'Market potential', weight: 25, description: 'Size and accessibility of target market' },
    { name: 'Team', weight: 20, description: 'Skills, experience, complementarity' },
    { name: 'Feasibility', weight: 15, description: 'Technical and operational viability' },
    { name: 'Impact', weight: 10, description: 'European strategic value' },
  ]
}
```

### Tweaks Panel (pentru exploration)

- Accent color: navy / forest / rust / plum
- Density: spacious / balanced / dense
- Dark mode: light / dark
- Show AI scores: on / off (pentru variantă pre-login)
- Show sticky aside: on / off

### Ce NU faci

- Niciun stock photo
- Niciun emoji în titluri sau navigation
- Nicio iconiță Material/Font Awesome — doar custom SVG simple
- Niciun gradient pe text sau background mare
- Nicio animație flashy / parallax / hero video
- Niciun "AI sparkle" sau "magic" buttons

### Output așteptat

Bundle export cu:
- `index.html` — pagina ca single file (sau split: html + css + jsx)
- Imagery generated SVG inline
- Comentarii în cod care indică unde se citesc date din API real (vs mock)

Apoi handoff la Claude Code pentru implementare în structura existentă (`grant.html` + `components-grant.jsx`).

---

## Iterare cu Claude Design

După prima livrare, întreabă-l să:
1. Facă responsive pentru mobile (320-768px) — sticky aside dispare, score band devine cards orizontale scrollable
2. Adauge dark mode
3. Facă varianta pre-login (fără score-uri personale)
4. Verifice contrast accessibility (WCAG AA)

---

*Brief 02 · v1 · sprint Mai 2026*
