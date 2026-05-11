# Brief 01 — Granturi + Search + SEO bilingual

**Pentru:** Claude Code
**Working dir:** `C:\Users\Zinaida\ELIGIBIL`
**Durată estimată:** 5-7 zile
**Output:** Schema îmbogățită + slug bilingual + `/search` + sitemap + 4 pagini SEO programmatic

---

## Context

eligibil.org are deja:
- Tabel `grants` cu 24 câmpuri (vezi `scripts/supabase-schema.sql`)
- Vector search funcțional cu pgvector HNSW + OpenAI embeddings
- `/api/grants` endpoint cu filtre (sector, tara, stadiu, sumă, dilutiv, tip)
- `grant.html` + `components-grant.jsx` (824 LOC) ca pagină detaliu cu mock data
- i18n RO/EN runtime via `lang.js`
- 70 granturi importate prin `seed-grants.js`

**Problema actuală:**
1. Pagina grantului folosește query params, nu slug. Nu e SEO-friendly.
2. Lipsește pagina dedicată `/search` cu filtre — momentan doar API.
3. Schema grants e prea slabă pentru SEO bogat (lipsesc: requirements structurate, eligibility rules, source URL, last_checked_at vizibil în UI, slug, lang).
4. Nu există sitemap.xml, hreflang, OG tags per grant.
5. Promisiunea "735+" pe homepage e falsă (există ~70 reale).

---

## Pas 1 — Migrare schemă (1 zi)

Creează `scripts/supabase-grants-enrich-schema.sql` cu:

```sql
-- ============================================================================
-- eligibil.org — Grants schema enrichment v2
-- Adds: bilingual slugs, structured eligibility, SEO meta, evidence tracking
-- Run AFTER supabase-schema.sql
-- ============================================================================

-- Bilingual slugs (URL-friendly)
ALTER TABLE grants ADD COLUMN IF NOT EXISTS slug_ro TEXT UNIQUE;
ALTER TABLE grants ADD COLUMN IF NOT EXISTS slug_en TEXT UNIQUE;

-- Bilingual content (Romanian primary, English secondary)
ALTER TABLE grants ADD COLUMN IF NOT EXISTS nume_program_en TEXT;
ALTER TABLE grants ADD COLUMN IF NOT EXISTS descriere_en TEXT;
ALTER TABLE grants ADD COLUMN IF NOT EXISTS cerinte_en TEXT;
ALTER TABLE grants ADD COLUMN IF NOT EXISTS short_summary_ro TEXT;  -- <160 chars for SEO meta
ALTER TABLE grants ADD COLUMN IF NOT EXISTS short_summary_en TEXT;

-- Structured eligibility rules (rule engine + UI breakdown)
ALTER TABLE grants ADD COLUMN IF NOT EXISTS eligibility_rules JSONB DEFAULT '[]'::jsonb;
-- Format: [{type:'country', value:['MD','RO'], required:true},
--         {type:'stage', value:['MVP','Pre-seed','Seed'], required:true},
--         {type:'sector', value:['AI','Deep Tech'], required:false},
--         {type:'trl_min', value:6, required:true},
--         {type:'team_size_min', value:2, required:false},
--         {type:'company_age_max_months', value:60, required:false},
--         {type:'cofinancing_pct', value:25, required:true}]

-- Documents required (for Workspace + checklist auto-gen)
ALTER TABLE grants ADD COLUMN IF NOT EXISTS documents_required JSONB DEFAULT '[]'::jsonb;
-- Format: [{name:'Pitch deck', required:true, format:'pdf', max_pages:15},
--         {name:'Business plan', required:true, format:'pdf'},
--         {name:'Financial projections', required:true, format:'xlsx'},
--         {name:'Team CVs', required:true, format:'pdf'}]

-- Evaluation criteria (used by AI scoring + UI explanations)
ALTER TABLE grants ADD COLUMN IF NOT EXISTS evaluation_criteria JSONB DEFAULT '[]'::jsonb;
-- Format: [{name:'Innovation', weight:30, description:'Novelty of approach'},
--         {name:'Market potential', weight:25},
--         {name:'Team', weight:20},
--         {name:'Feasibility', weight:15},
--         {name:'Impact', weight:10}]

-- Source & evidence (TRUST signals)
ALTER TABLE grants ADD COLUMN IF NOT EXISTS source_url TEXT;
ALTER TABLE grants ADD COLUMN IF NOT EXISTS source_name TEXT;
ALTER TABLE grants ADD COLUMN IF NOT EXISTS evidence_status TEXT
  CHECK (evidence_status IN ('verified_primary', 'verified_secondary', 'ai_extracted_unverified', 'hypothesis'))
  DEFAULT 'ai_extracted_unverified';
ALTER TABLE grants ADD COLUMN IF NOT EXISTS last_checked_at TIMESTAMPTZ DEFAULT now();

-- Application URL (where the user actually applies)
ALTER TABLE grants ADD COLUMN IF NOT EXISTS application_url TEXT;

-- Funder / program metadata
ALTER TABLE grants ADD COLUMN IF NOT EXISTS funder_name TEXT;        -- e.g. "European Innovation Council"
ALTER TABLE grants ADD COLUMN IF NOT EXISTS program_name TEXT;       -- e.g. "EIC Accelerator 2026"
ALTER TABLE grants ADD COLUMN IF NOT EXISTS funder_logo_url TEXT;
ALTER TABLE grants ADD COLUMN IF NOT EXISTS funder_country TEXT;

-- Languages of application
ALTER TABLE grants ADD COLUMN IF NOT EXISTS application_languages TEXT[]; -- ['en','ro','fr']

-- Cofinancing & equity
ALTER TABLE grants ADD COLUMN IF NOT EXISTS cofinancing_pct INTEGER;     -- 0-100
ALTER TABLE grants ADD COLUMN IF NOT EXISTS equity_pct INTEGER;          -- 0-100 (for accelerators/VC)
ALTER TABLE grants ADD COLUMN IF NOT EXISTS consortium_required BOOLEAN DEFAULT false;
ALTER TABLE grants ADD COLUMN IF NOT EXISTS consortium_min_partners INTEGER;

-- TRL (Technology Readiness Level) bounds
ALTER TABLE grants ADD COLUMN IF NOT EXISTS trl_min SMALLINT CHECK (trl_min BETWEEN 1 AND 9);
ALTER TABLE grants ADD COLUMN IF NOT EXISTS trl_max SMALLINT CHECK (trl_max BETWEEN 1 AND 9);

-- Tags (for SEO + filtering)
ALTER TABLE grants ADD COLUMN IF NOT EXISTS tags TEXT[];

-- Indexes
CREATE INDEX IF NOT EXISTS grants_slug_ro_idx ON grants (slug_ro);
CREATE INDEX IF NOT EXISTS grants_slug_en_idx ON grants (slug_en);
CREATE INDEX IF NOT EXISTS grants_evidence_status_idx ON grants (evidence_status);
CREATE INDEX IF NOT EXISTS grants_funder_country_idx ON grants (funder_country);
CREATE INDEX IF NOT EXISTS grants_tags_idx ON grants USING GIN (tags);
CREATE INDEX IF NOT EXISTS grants_eligibility_rules_idx ON grants USING GIN (eligibility_rules);

-- Slug auto-generation function (Romanian-aware)
CREATE OR REPLACE FUNCTION generate_slug(input_text TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN regexp_replace(
    regexp_replace(
      regexp_replace(
        unaccent(lower(input_text)),
        '[^a-z0-9\s\-]', '', 'g'
      ),
      '\s+', '-', 'g'
    ),
    '-+', '-', 'g'
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Backfill slugs for existing grants (one-time)
-- Rulează manual după migrare:
-- UPDATE grants SET slug_ro = generate_slug(nume_program) WHERE slug_ro IS NULL;
-- UPDATE grants SET slug_en = generate_slug(COALESCE(nume_program_en, nume_program)) WHERE slug_en IS NULL;
```

**Apoi rulează:**
```bash
node scripts/push-schema.js scripts/supabase-grants-enrich-schema.sql
```

Și backfill manual în SQL Editor:
```sql
UPDATE grants SET
  slug_ro = generate_slug(nume_program),
  slug_en = generate_slug(COALESCE(nume_program_en, nume_program))
WHERE slug_ro IS NULL;
```

---

## Pas 2 — Slug routing bilingual (4-6h)

În `server.js` adaugă **înainte** de `app.use(express.static(...))`:

```javascript
// Bilingual grant detail routing
app.get('/ro/granturi/:slug', async (req, res) => {
  const sb = require('./db/supabase').getSupabase();
  const { data } = await sb
    .from('grants')
    .select('id, slug_ro, slug_en, nume_program, short_summary_ro, funder_name')
    .eq('slug_ro', req.params.slug)
    .single();

  if (!data) return res.status(404).sendFile(path.join(__dirname, 'public', '404.html'));

  // Inject SEO meta server-side via template
  const html = await renderGrantPage(data, 'ro');
  res.send(html);
});

app.get('/en/grants/:slug', async (req, res) => {
  const sb = require('./db/supabase').getSupabase();
  const { data } = await sb
    .from('grants')
    .select('id, slug_ro, slug_en, nume_program, nume_program_en, short_summary_en, funder_name')
    .eq('slug_en', req.params.slug)
    .single();

  if (!data) return res.status(404).sendFile(path.join(__dirname, 'public', '404.html'));

  const html = await renderGrantPage(data, 'en');
  res.send(html);
});

// Legacy redirect: /grant.html?id=EU012 → /ro/granturi/<slug>
app.get('/grant.html', async (req, res) => {
  if (!req.query.id) return res.redirect(301, '/');
  const sb = require('./db/supabase').getSupabase();
  const { data } = await sb
    .from('grants')
    .select('slug_ro')
    .eq('id', req.query.id)
    .single();
  if (data?.slug_ro) return res.redirect(301, `/ro/granturi/${data.slug_ro}`);
  res.redirect(301, '/');
});
```

Creează `lib/render-grant-page.js` care citește `grant.html`, injectează în `<head>`:

```html
<link rel="canonical" href="https://eligibil.org/{lang}/{path}/{slug}" />
<link rel="alternate" hreflang="ro" href="https://eligibil.org/ro/granturi/{slug_ro}" />
<link rel="alternate" hreflang="en" href="https://eligibil.org/en/grants/{slug_en}" />
<link rel="alternate" hreflang="x-default" href="https://eligibil.org/ro/granturi/{slug_ro}" />
<title>{nume_program} — {funder_name} | eligibil.org</title>
<meta name="description" content="{short_summary}" />
<meta property="og:title" content="{nume_program}" />
<meta property="og:description" content="{short_summary}" />
<meta property="og:url" content="https://eligibil.org/{lang}/{path}/{slug}" />
<meta property="og:type" content="article" />
<meta name="robots" content="index, follow" />

<!-- JSON-LD GrantsProgram schema -->
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "GrantingAgency",
  "name": "{funder_name}",
  "offers": {
    "@type": "Offer",
    "name": "{nume_program}",
    "url": "https://eligibil.org/{lang}/{path}/{slug}",
    "validThrough": "{deadline_iso}"
  }
}
</script>
```

Și injectează `window.__GRANT_DATA__` ca primul script ca să nu mai fac un fetch suplimentar:

```html
<script>
  window.__GRANT_DATA__ = { /* full grant object */ };
  window.__LANG__ = "{lang}";
</script>
```

În `components-grant.jsx`, modifică `GRANTS = { ... }` să citească preferențial din `window.__GRANT_DATA__`.

---

## Pas 3 — Pagina `/search` (2-3 zile)

Creează `search.html`:

```html
<!DOCTYPE html>
<html lang="ro">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Caută finanțare · eligibil.org</title>
<meta name="description" content="Caută granturi, acceleratoare, capital non-dilutiv pentru startupuri din Moldova, România și UE. Filtre după sector, țară, sumă, deadline." />
<link rel="canonical" href="https://eligibil.org/search" />
<link rel="stylesheet" href="/styles.css" />
<link rel="stylesheet" href="/styles-search.css" />
<script src="/lang.js" defer></script>
</head>
<body class="d-balanced">
<div id="search-root"></div>

<script src="https://unpkg.com/react@18.3.1/umd/react.development.js" crossorigin></script>
<script src="https://unpkg.com/react-dom@18.3.1/umd/react-dom.development.js" crossorigin></script>
<script src="https://unpkg.com/@babel/standalone@7.29.0/babel.min.js" crossorigin></script>
<script src="/auth.js"></script>
<script type="text/babel" src="/components-search.jsx"></script>
</body>
</html>
```

Creează `components-search.jsx` cu:

**Layout:**
- Header (Topbar reutilizabil din components-dashboard.jsx)
- Stânga: panel filtre (sector, țară, stadiu, sumă min/max, dilutiv, tip, deadline range, status, language)
- Centru: search bar + rezultate
- Dreapta: sidebar cu "Saved searches" + "Recent" (opțional faza 2)

**Comportament:**
- Filtrele actualizează URL params (`?sector=AI&tara=Moldova`) → shareable
- Pe input change → debounce 300ms → `fetch('/api/grants?...')`
- Sortare: relevanță / deadline asc / sumă desc / dificultate asc
- Card rezultat: nume, funder, țară, sumă, deadline countdown, evidence badge, [Vezi detalii] → `/ro/granturi/{slug_ro}`
- Empty state cu sugestii: "Încearcă să elimini filtrul X" sau "Vezi top 10 granturi populare"

**Endpoint extins în `routes/api.js`:**

```javascript
router.get('/grants', async (req, res) => {
  // Existing filtre + adaugă:
  const { q, deadline_from, deadline_to, language, sort, lang = 'ro' } = req.query;

  // Returnează slug_ro / slug_en + short_summary + evidence_status
  // Adaugă select pentru câmpurile noi din schema îmbogățită
});
```

---

## Pas 4 — Sitemap + robots.txt (3h)

Creează `routes/seo.js`:

```javascript
'use strict';
const express = require('express');
const router = express.Router();
const { getSupabase } = require('../db/supabase');

router.get('/sitemap.xml', async (req, res) => {
  const sb = getSupabase();
  const { data: grants } = await sb
    .from('grants')
    .select('slug_ro, slug_en, updated_at')
    .eq('status', 'Activ')
    .order('updated_at', { ascending: false });

  const urls = [];

  // Static pages
  ['', '/search', '/pricing', '/parteneri', '/about'].forEach(p => {
    urls.push(`<url><loc>https://eligibil.org${p}</loc><changefreq>weekly</changefreq></url>`);
    urls.push(`<url><loc>https://eligibil.org/en${p}</loc><changefreq>weekly</changefreq></url>`);
  });

  // Grant detail pages (bilingual with hreflang)
  (grants || []).forEach(g => {
    const lastmod = new Date(g.updated_at).toISOString().split('T')[0];
    if (g.slug_ro) {
      urls.push(`
        <url>
          <loc>https://eligibil.org/ro/granturi/${g.slug_ro}</loc>
          <lastmod>${lastmod}</lastmod>
          <changefreq>weekly</changefreq>
          <xhtml:link rel="alternate" hreflang="ro" href="https://eligibil.org/ro/granturi/${g.slug_ro}" />
          ${g.slug_en ? `<xhtml:link rel="alternate" hreflang="en" href="https://eligibil.org/en/grants/${g.slug_en}" />` : ''}
          <xhtml:link rel="alternate" hreflang="x-default" href="https://eligibil.org/ro/granturi/${g.slug_ro}" />
        </url>`);
    }
    if (g.slug_en) {
      urls.push(`
        <url>
          <loc>https://eligibil.org/en/grants/${g.slug_en}</loc>
          <lastmod>${lastmod}</lastmod>
          <changefreq>weekly</changefreq>
        </url>`);
    }
  });

  // SEO category pages (programmatic)
  const SECTORS = ['ai', 'biotech', 'climate', 'fintech', 'edtech', 'deep-tech'];
  const COUNTRIES = ['moldova', 'romania', 'ucraina', 'ue'];
  SECTORS.forEach(s => COUNTRIES.forEach(c => {
    urls.push(`<url><loc>https://eligibil.org/ro/granturi-${s}-${c}</loc><changefreq>weekly</changefreq></url>`);
    urls.push(`<url><loc>https://eligibil.org/en/grants-${s}-${c}</loc><changefreq>weekly</changefreq></url>`);
  }));

  res.type('application/xml');
  res.send(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
  ${urls.join('\n')}
</urlset>`);
});

router.get('/robots.txt', (req, res) => {
  res.type('text/plain');
  res.send(`User-agent: *
Allow: /
Disallow: /admin
Disallow: /api/
Disallow: /dashboard
Disallow: /profile
Disallow: /upload-artefact

Sitemap: https://eligibil.org/sitemap.xml`);
});

module.exports = router;
```

În `server.js` mounteaz-o:
```javascript
app.use('/', require('./routes/seo'));
```

---

## Pas 5 — Pagini SEO programmatic (1 zi)

Creează rută `/ro/granturi-:sector-:tara` și echivalent EN:

```javascript
app.get('/:lang(ro|en)/:type(granturi|grants)-:sector-:tara', async (req, res) => {
  const { lang, sector, tara } = req.params;
  const sb = getSupabase();

  const { data: grants } = await sb
    .from('grants')
    .select('id, slug_ro, slug_en, nume_program, nume_program_en, short_summary_ro, short_summary_en, funder_name, suma_min, suma_max, deadline')
    .ilike('sector', `%${sector}%`)
    .ilike('tara', `%${tara}%`)
    .eq('status', 'Activ')
    .limit(50);

  res.render('seo-listing', { lang, sector, tara, grants });
});
```

Pagina returnată: titlu H1 ("Granturi AI pentru startupuri din Moldova"), 200 cuvinte intro generic + 50 carduri grant + FAQ schema + CTA "Caută cu filtre avansate".

---

## Pas 6 — Backfill granturi cu date bogate (2-3 zile, parțial manual)

Pentru cele 70 granturi existente, completează:
- `slug_ro`, `slug_en` (auto via SQL function)
- `nume_program_en` (manual sau Claude API batch translation)
- `short_summary_ro`, `short_summary_en` (max 160 chars, manual + Claude review)
- `eligibility_rules` JSONB (manual structurat din `cerinte` text)
- `documents_required` JSONB (manual din analiza site-ului oficial)
- `source_url`, `application_url` (manual + verifică)
- `evidence_status` = 'verified_primary' dacă ai linkul oficial

Creează `scripts/enrich-grants-claude.js`:

```javascript
'use strict';
require('dotenv').config();
const Anthropic = require('@anthropic-ai/sdk');
const { getSupabase } = require('../db/supabase');

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

async function enrichGrant(grant) {
  const prompt = `Ai datele unui grant. Returnează JSON cu:
- nume_program_en: traducere oficială sau echivalent profesional
- short_summary_ro: <160 chars, factual, fără hype
- short_summary_en: <160 chars
- eligibility_rules: array de obiecte {type, value, required}, conform schemei
- documents_required: array de {name, required, format}
- evaluation_criteria: array de {name, weight, description}
- tags: array de keywords pentru SEO

Grant data:
${JSON.stringify(grant, null, 2)}

Răspunde DOAR cu JSON valid, fără markdown.`;

  const msg = await client.messages.create({
    model: 'claude-opus-4-5',
    max_tokens: 2000,
    messages: [{ role: 'user', content: prompt }],
  });

  return JSON.parse(msg.content[0].text);
}

(async () => {
  const sb = getSupabase();
  const { data: grants } = await sb.from('grants').select('*').is('eligibility_rules', null).limit(10);

  for (const g of grants) {
    try {
      const enriched = await enrichGrant(g);
      await sb.from('grants').update(enriched).eq('id', g.id);
      console.log(`✓ ${g.id} ${g.nume_program}`);
      await new Promise(r => setTimeout(r, 1000)); // rate limit
    } catch (e) {
      console.error(`✗ ${g.id}:`, e.message);
    }
  }
})();
```

Rulează în loturi de 10-20:
```bash
node scripts/enrich-grants-claude.js
```

**Cost estimat:** ~$0.15 per grant cu Claude Opus 4.5, deci ~$10-15 pentru 70 granturi.

---

## Pas 7 — Update homepage cu cifre reale (1h)

Editează `index.html` linia 7:
```html
<meta name="description" content="Granturi, competiții și capital non-dilutiv pentru Moldova, România și UE. Date verificate, actualizate săptămânal." />
```

Și înlocuiește "735+" în UI cu un counter dinamic care fetchează `/api/grants/stats`:
```javascript
// În components-v2.jsx sau components-a.jsx, în Hero:
const [stats, setStats] = useState({ total: 0, verified: 0 });
useEffect(() => {
  fetch('/api/grants/stats').then(r => r.json()).then(setStats);
}, []);
// Afișează: `${stats.verified}+ surse verificate · pipeline activ`
```

Adaugă endpoint în `routes/api.js`:
```javascript
router.get('/grants/stats', async (req, res) => {
  const sb = tryGetSupabase();
  if (!sb) return res.json({ total: 0, verified: 0 });
  const { count: total } = await sb.from('grants').select('*', { count: 'exact', head: true }).eq('status', 'Activ');
  const { count: verified } = await sb.from('grants').select('*', { count: 'exact', head: true })
    .eq('status', 'Activ')
    .in('evidence_status', ['verified_primary', 'verified_secondary']);
  res.json({ total: total || 0, verified: verified || 0 });
});
```

---

## Definition of Done

- [ ] Schema îmbogățită aplicată în Supabase, indexes create
- [ ] Toate granturile au `slug_ro` + `slug_en` populate
- [ ] `/ro/granturi/:slug` și `/en/grants/:slug` returnează 200 cu SEO meta corect
- [ ] hreflang vizibil în `view-source` pe ambele versiuni
- [ ] Legacy redirect `/grant.html?id=X` → 301 → noul slug
- [ ] `/search` funcțional cu 8 filtre, sortare, URL params shareable
- [ ] `/sitemap.xml` listează toate paginile, `/robots.txt` exclude admin/api
- [ ] `/ro/granturi-ai-moldova` și similar returnează 200 cu listing
- [ ] Cel puțin 30 granturi au `eligibility_rules` JSONB completat
- [ ] Homepage afișează numărul real de granturi verified
- [ ] `npm test` (dacă există) pasează; `node server.js` pornește fără eroare

---

## Ce NU faci în acest brief

- Nu rescrii `components-grant.jsx` complet (doar adaptezi să citească din `window.__GRANT_DATA__`)
- Nu adaugi pagina `/upload-artefact` (vine în Brief 03)
- Nu modifici flow-ul de auth
- Nu pivotezi Events (vine în Brief 04)

---

## Escalation

Dacă ceva ia mai mult de 1.5× estimarea, sumarizează ce e blocant și cere review înainte să continui. Probleme tipice:
- Backfill-ul Claude API consumă mai mult decât bugetul → reduce la 30 granturi inițial
- pgvector reindex e lent → exclude `embedding` din `ALTER TABLE` și fă-l separat
- React UMD nu randează `components-search.jsx` → verifică încărcarea Babel + ordinea scripturilor

---

*Brief 01 · v1 · sprint Mai 2026*
