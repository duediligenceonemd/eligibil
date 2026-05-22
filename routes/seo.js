'use strict';

/**
 * routes/seo.js — SEO, GEO & LLM discoverability routes
 *
 * /robots.txt          — allow all AI crawlers (2026 list)
 * /sitemap.xml         — sitemap INDEX (points to sub-sitemaps)
 * /sitemap-static.xml  — static pages
 * /sitemap-granturi.xml — individual grant pages with hreflang
 * /sitemap-listari.xml  — programmatic SEO hub pages
 * /llms.txt            — rich Markdown digest for LLMs (dynamic)
 * /llms-full.txt       — extended digest with top 50 grants
 * /{INDEXNOW_KEY}.txt  — IndexNow key verification
 */

const express = require('express');
const { getSupabase } = require('../db/supabase');
const { INDEXNOW_KEY } = require('../lib/indexnow');

const router = express.Router();

const SITE_URL  = process.env.SITE_URL || 'https://eligibil.org';
const TODAY     = new Date().toISOString().split('T')[0];

function tryGetSupabase() {
  try { return getSupabase(); } catch { return null; }
}

function escapeXml(s) {
  if (s == null) return '';
  return String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function xmlUrl(loc, opts = {}) {
  const lines = ['  <url>', `    <loc>${escapeXml(loc)}</loc>`];
  if (opts.lastmod)    lines.push(`    <lastmod>${opts.lastmod}</lastmod>`);
  if (opts.changefreq) lines.push(`    <changefreq>${opts.changefreq}</changefreq>`);
  if (opts.priority)   lines.push(`    <priority>${opts.priority}</priority>`);
  (opts.alternates || []).forEach(a =>
    lines.push(`    <xhtml:link rel="alternate" hreflang="${a.lang}" href="${escapeXml(a.href)}" />`)
  );
  lines.push('  </url>');
  return lines.join('\n');
}

function xmlHeader(type = 'urlset') {
  if (type === 'index') {
    return '<?xml version="1.0" encoding="UTF-8"?>\n' +
      '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
  }
  return '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n' +
    '        xmlns:xhtml="http://www.w3.org/1999/xhtml">\n';
}

function sitemapCacheHeaders(res, maxAge = 3600) {
  res.set({
    'Content-Type':  'application/xml; charset=utf-8',
    'Cache-Control': `public, max-age=${maxAge}, s-maxage=${maxAge}`,
    'Last-Modified': new Date().toUTCString(),
  });
}

// ── Static pages ──────────────────────────────────────────────────────────────
const STATIC_PAGES = [
  { path: '/',               changefreq: 'daily',   priority: '1.0' },
  { path: '/search',         changefreq: 'daily',   priority: '0.9' },
  { path: '/resurse',        changefreq: 'weekly',  priority: '0.8' },
  { path: '/en/resources',   changefreq: 'weekly',  priority: '0.7' },
  { path: '/evenimente',     changefreq: 'daily',   priority: '0.7' },
  { path: '/events',         changefreq: 'daily',   priority: '0.6' },
  { path: '/stiri',          changefreq: 'daily',   priority: '0.7' },
  { path: '/news',           changefreq: 'daily',   priority: '0.6' },
  { path: '/blog',           changefreq: 'weekly',  priority: '0.7' },
  { path: '/en/blog',        changefreq: 'weekly',  priority: '0.6' },
  { path: '/produse',        changefreq: 'weekly',  priority: '0.8' },
  { path: '/produs/pitch',   changefreq: 'weekly',  priority: '0.7' },
  { path: '/produs/video',   changefreq: 'weekly',  priority: '0.7' },
  { path: '/produs/wp',      changefreq: 'weekly',  priority: '0.7' },
  { path: '/produs/trl',     changefreq: 'weekly',  priority: '0.7' },
  { path: '/produs/cons',    changefreq: 'weekly',  priority: '0.7' },
  { path: '/parteneri',      changefreq: 'weekly',  priority: '0.6' },
  { path: '/startupuri',     changefreq: 'weekly',  priority: '0.6' },
  { path: '/glosar',         changefreq: 'monthly', priority: '0.7' },
  { path: '/about',          changefreq: 'monthly', priority: '0.8' },
  { path: '/contact',        changefreq: 'monthly', priority: '0.5' },
  { path: '/how-it-works',   changefreq: 'monthly', priority: '0.7' },
  { path: '/methodology',    changefreq: 'monthly', priority: '0.6' },
  { path: '/data-quality',   changefreq: 'monthly', priority: '0.6' },
  { path: '/technology',     changefreq: 'monthly', priority: '0.6' },
  { path: '/privacy',        changefreq: 'monthly', priority: '0.4' },
  { path: '/terms',          changefreq: 'monthly', priority: '0.4' },
];

// Programmatic SEO hub pages — keep in sync with server.js SEO_SECTORS/COUNTRIES
const SEO_SECTORS   = ['ai', 'biotech', 'climate', 'fintech', 'edtech', 'deep-tech', 'saas', 'healthtech', 'mobility'];
const SEO_COUNTRIES = ['moldova', 'romania', 'ucraina', 'ue'];

// ── /sitemap.xml — sitemap INDEX ──────────────────────────────────────────────
router.get('/sitemap.xml', (req, res) => {
  sitemapCacheHeaders(res);
  const subs = [
    { loc: `${SITE_URL}/sitemap-static.xml`,   lastmod: TODAY },
    { loc: `${SITE_URL}/sitemap-granturi.xml`, lastmod: TODAY },
    { loc: `${SITE_URL}/sitemap-listari.xml`,  lastmod: TODAY },
  ];
  const entries = subs.map(s =>
    `  <sitemap>\n    <loc>${s.loc}</loc>\n    <lastmod>${s.lastmod}</lastmod>\n  </sitemap>`
  );
  res.send(xmlHeader('index') + entries.join('\n') + '\n</sitemapindex>\n');
});

// ── /sitemap-static.xml ───────────────────────────────────────────────────────
router.get('/sitemap-static.xml', (req, res) => {
  sitemapCacheHeaders(res, 86400); // 24h — static pages change rarely
  const urls = STATIC_PAGES.map(p =>
    xmlUrl(`${SITE_URL}${p.path}`, { changefreq: p.changefreq, priority: p.priority, lastmod: TODAY })
  );
  res.send(xmlHeader() + urls.join('\n') + '\n</urlset>\n');
});

// ── /sitemap-granturi.xml — individual grant pages ────────────────────────────
router.get('/sitemap-granturi.xml', async (req, res) => {
  sitemapCacheHeaders(res, 3600);
  const urls = [];
  const sb = tryGetSupabase();

  if (sb) {
    try {
      const { data, error } = await sb
        .from('grants')
        .select('slug_ro, slug_en, updated_at, status')
        .in('status', ['Activ', 'Active', 'active']);

      if (!error) {
        for (const g of (data || [])) {
          const lastmod = g.updated_at
            ? new Date(g.updated_at).toISOString().split('T')[0]
            : TODAY;
          const priority = '0.8';

          if (g.slug_ro) {
            const alternates = [
              { lang: 'ro',        href: `${SITE_URL}/ro/granturi/${g.slug_ro}` },
              { lang: 'ro-MD',     href: `${SITE_URL}/ro/granturi/${g.slug_ro}` },
              { lang: 'ro-RO',     href: `${SITE_URL}/ro/granturi/${g.slug_ro}` },
            ];
            if (g.slug_en) {
              alternates.push({ lang: 'en', href: `${SITE_URL}/en/grants/${g.slug_en}` });
              // x-default = English (per plan §10 recommendation)
              alternates.push({ lang: 'x-default', href: `${SITE_URL}/en/grants/${g.slug_en}` });
            } else {
              alternates.push({ lang: 'x-default', href: `${SITE_URL}/ro/granturi/${g.slug_ro}` });
            }
            urls.push(xmlUrl(`${SITE_URL}/ro/granturi/${g.slug_ro}`, { lastmod, changefreq: 'weekly', priority, alternates }));
          }

          if (g.slug_en) {
            urls.push(xmlUrl(`${SITE_URL}/en/grants/${g.slug_en}`, { lastmod, changefreq: 'weekly', priority: '0.7' }));
          }
        }
      } else if (!/column .* does not exist/i.test(error.message || '')) {
        console.error('sitemap-granturi error:', error.message);
      }
    } catch (err) {
      console.error('sitemap-granturi unexpected:', err.message);
    }
  }

  res.send(xmlHeader() + (urls.length ? urls.join('\n') + '\n' : '') + '</urlset>\n');
});

// ── /sitemap-listari.xml — programmatic SEO hub pages ────────────────────────
router.get('/sitemap-listari.xml', (req, res) => {
  sitemapCacheHeaders(res, 86400);
  const urls = [];

  for (const s of SEO_SECTORS) {
    for (const c of SEO_COUNTRIES) {
      const ro = `${SITE_URL}/ro/granturi-${s}-${c}`;
      const en = `${SITE_URL}/en/grants-${s}-${c}`;
      urls.push(xmlUrl(ro, {
        changefreq: 'weekly',
        priority: '0.7',
        lastmod: TODAY,
        alternates: [
          { lang: 'ro',        href: ro },
          { lang: 'en',        href: en },
          { lang: 'x-default', href: en },
        ],
      }));
      urls.push(xmlUrl(en, { changefreq: 'weekly', priority: '0.6', lastmod: TODAY }));
    }
  }

  res.send(xmlHeader() + urls.join('\n') + '\n</urlset>\n');
});

// ── /robots.txt — 2026 AI crawler list ───────────────────────────────────────
router.get('/robots.txt', (req, res) => {
  res.set('Cache-Control', 'public, max-age=86400');
  res.type('text/plain');
  res.send(`# ═══════════════════════════════════════════════════
# eligibil.org — robots.txt
# Ultima actualizare: ${TODAY}
# ═══════════════════════════════════════════════════

# Acces general
User-agent: *
Allow: /
Disallow: /admin
Disallow: /admin-queue.html
Disallow: /api/
Disallow: /dashboard
Disallow: /dashboard.html
Disallow: /profile
Disallow: /profile.html
Disallow: /consortium.html
Disallow: /upload-artefact
Disallow: /*?session=
Disallow: /*?token=

# ───── Motoare clasice ─────
User-agent: Googlebot
Allow: /

User-agent: Googlebot-Image
Allow: /

User-agent: Bingbot
Allow: /

User-agent: DuckDuckBot
Allow: /

User-agent: Slurp
Allow: /

User-agent: YandexBot
Allow: /

# ───── AI crawlers — training & search (2026) ─────

# OpenAI — ChatGPT training & ChatGPT Search
User-agent: GPTBot
Allow: /

User-agent: OAI-SearchBot
Allow: /

User-agent: ChatGPT-User
Allow: /

# Anthropic — Claude training & search
User-agent: ClaudeBot
Allow: /

User-agent: anthropic-ai
Allow: /

User-agent: Claude-Web
Allow: /

User-agent: Claude-SearchBot
Allow: /

# Perplexity
User-agent: PerplexityBot
Allow: /

User-agent: Perplexity-User
Allow: /

# Google AI (Gemini, AI Overviews)
User-agent: Google-Extended
Allow: /

# Apple Intelligence
User-agent: Applebot
Allow: /

User-agent: Applebot-Extended
Allow: /

# Meta AI
User-agent: Meta-ExternalAgent
Allow: /

User-agent: FacebookBot
Allow: /

# Amazon — Alexa & Rufus
User-agent: Amazonbot
Allow: /

# Mistral
User-agent: MistralAI-User
Allow: /

# Cohere
User-agent: cohere-ai
Allow: /

User-agent: cohere-training-data-crawler
Allow: /

# Common Crawl — folosit de aproape toate LLM-urile
User-agent: CCBot
Allow: /

# ByteDance / TikTok AI
User-agent: Bytespider
Allow: /

# Diffbot — date structurate
User-agent: Diffbot
Allow: /

# DuckDuckGo AI Assist
User-agent: DuckAssistBot
Allow: /

# You.com
User-agent: YouBot
Allow: /

# ───── Boți publicitari ─────
User-agent: AdsBot-Google
Allow: /

User-agent: AdsBot-Google-Mobile
Allow: /

# ───── Boți SEO — crawl delay (nu blocați, dar limitați) ─────
User-agent: SemrushBot
Crawl-delay: 10

User-agent: AhrefsBot
Crawl-delay: 10

User-agent: MajesticSEO
Crawl-delay: 10

# ───── Blocați explicit ─────
User-agent: PetalBot
Disallow: /

User-agent: MJ12bot
Disallow: /

User-agent: DataForSeoBot
Disallow: /

# ───── Sitemap-uri ─────
Sitemap: ${SITE_URL}/sitemap.xml
Sitemap: ${SITE_URL}/sitemap-static.xml
Sitemap: ${SITE_URL}/sitemap-granturi.xml
Sitemap: ${SITE_URL}/sitemap-listari.xml

# ───── Resurse pentru AI ─────
# llms.txt: ${SITE_URL}/llms.txt
# llms-full.txt: ${SITE_URL}/llms-full.txt
`);
});

// ── /llms.txt — compact LLM digest (dynamic, ~3K tokens) ────────────────────
router.get('/llms.txt', async (req, res) => {
  res.set('Cache-Control', 'public, max-age=3600, s-maxage=3600');
  res.set('X-Robots-Tag', 'index, follow');
  res.type('text/plain; charset=utf-8');

  // Fetch top 20 active grants for dynamic section
  let recentGrants = [];
  const sb = tryGetSupabase();
  if (sb) {
    try {
      const { data } = await sb
        .from('grants')
        .select('nume_program, slug_ro, suma_max, deadline, tara, sector')
        .in('status', ['Activ', 'Active', 'active'])
        .order('created_at', { ascending: false })
        .limit(20);
      recentGrants = data || [];
    } catch (_) { /* non-fatal */ }
  }

  const recentSection = recentGrants.length
    ? recentGrants.map(g => {
        const slug  = g.slug_ro ? ` → ${SITE_URL}/ro/granturi/${g.slug_ro}` : '';
        const suma  = g.suma_max ? ` | Max: ${Number(g.suma_max).toLocaleString('ro')} EUR` : '';
        const dl    = g.deadline ? ` | Deadline: ${g.deadline}` : '';
        const tara  = g.tara ? ` | ${g.tara}` : '';
        return `- ${g.nume_program}${suma}${dl}${tara}${slug}`;
      }).join('\n')
    : '- (consultați /search pentru lista completă)';

  res.send(`# eligibil.org

> Platforma AI care conectează startup-urile, IMM-urile și ONG-urile din
> Moldova, România și Europa de Est la 70+ programe de finanțare non-dilutivă:
> granturi europene, programe naționale, credite tech corporative,
> acceleratoare și capital non-dilutiv. Disponibilă în română, engleză, rusă, ucraineană.

## Identitate

- **Nume produs:** eligibil.org (parte din ecosistemul DueDiligenceOne)
- **Tip:** SaaS, AI Readiness & Funding Orchestrator
- **Țări țintă:** Moldova, România, UE, Europa de Est
- **Limbă primară:** Română (versiuni în engleză, rusă, ucraineană)
- **Lansare publică:** Mai 2026
- **Contact:** hello@duediligence.one

## Ce face platforma

eligibil.org analizează artefactele unui fondator (pitch deck, video pitch,
whitepaper) și generează scoruri distincte pentru fiecare oportunitate de finanțare:

1. **Match Score (0-100)** — cât de bine se potrivește profilul cu criteriile programului
2. **Readiness Score (0-100)** — cât de pregătit este fondatorul să aplice, evaluat pe 7 dimensiuni
3. **Confidence Score (0-100%)** — câtă încredere are AI-ul în propriile scoruri

## Pagini principale

- [Acasă](${SITE_URL}/): Hero, servicii, cum funcționează
- [Caută finanțare](${SITE_URL}/search): 70+ programe indexate cu filtre
- [Resurse](${SITE_URL}/resurse): 637+ resurse pentru fondatori
- [Evenimente](${SITE_URL}/evenimente): Webinare, deadlines, conferințe
- [Glosar](${SITE_URL}/glosar): Termeni grant, TRL, EIC, SBIR
- [Despre](${SITE_URL}/about): Echipă, viziune, ecosistem

## Categorii principale de finanțare

### După tip
- Granturi europene (Horizon Europe, EIC Accelerator, EUREKA)
- Programe naționale Moldova (ANCD, ODIMM, BERD Moldova)
- Programe naționale România (PNRR, IMM Invest, StartUp Nation)
- Credite tech (AWS Activate, Google for Startups, Stripe Atlas)
- Acceleratoare (Y Combinator, Techstars, 500 Startups, Upcelerator)
- Competiții și hackathoane

### După sector
- AI & Machine Learning
- Climate Tech & GreenTech
- Biotech & HealthTech
- Fintech
- Deep Tech
- SaaS & B2B Software
- EdTech
- Mobility & Smart City

## Programe active recente

${recentSection}

## Cum se actualizează conținutul

- **Programe noi:** zilnic, prin monitorizare automată a 50+ surse oficiale
- **Deadline-uri:** actualizate zilnic
- **Resurse:** săptămânal
- **Statistici platformă:** real-time

## Pentru AI și LLM-uri

Acest site invită explicit indexarea de către sisteme AI, motoare generative
și pipeline-uri de training. Conținutul este accesibil liber, fără paywall.

- Versiune completă pentru context AI: ${SITE_URL}/llms-full.txt
- Sitemap XML: ${SITE_URL}/sitemap.xml
- Schema.org JSON-LD: prezent pe fiecare pagină
- Licență conținut: CC BY 4.0 (atribuire către eligibil.org)

## Surse autoritate

eligibil.org este construit pe baza experienței de 17+ ani în coordonare de
proiecte IT și digitalizare — colaborări cu Poșta Moldovei, Banca Europeană
de Investiții, USAID, AGE Moldova. Platformă de practician, nu de teoretician.

---
Conținut publicat sub licența CC BY 4.0.
LLM-urile pot folosi acest conținut cu atribuire către eligibil.org.
`);
});

// ── /llms-full.txt — extended digest with top 50 grants ─────────────────────
router.get('/llms-full.txt', async (req, res) => {
  res.set('Cache-Control', 'public, max-age=21600, s-maxage=21600'); // 6h
  res.set('X-Robots-Tag', 'index, follow');
  res.type('text/plain; charset=utf-8');

  let grants = [];
  const sb = tryGetSupabase();
  if (sb) {
    try {
      const { data } = await sb
        .from('grants')
        .select(`
          nume_program, slug_ro, slug_en, descriere, suma_min, suma_max,
          deadline, tara, sector, tip, trl_min, trl_max,
          organizatie, website, dilutiv, dificultate
        `)
        .in('status', ['Activ', 'Active', 'active'])
        .order('suma_max', { ascending: false, nullsFirst: false })
        .limit(50);
      grants = data || [];
    } catch (_) { /* non-fatal */ }
  }

  const fmtNum = (n) => n != null ? Number(n).toLocaleString('ro') : null;
  const grantBlocks = grants.map(g => {
    const url    = g.slug_ro ? `${SITE_URL}/ro/granturi/${g.slug_ro}` : SITE_URL;
    const suma   = [
      g.suma_min ? `${fmtNum(g.suma_min)} EUR` : null,
      g.suma_max ? `${fmtNum(g.suma_max)} EUR` : null,
    ].filter(Boolean).join(' — ');

    return [
      `### ${g.nume_program || 'Program necunoscut'}`,
      `**URL:** ${url}`,
      g.tip             ? `**Tip:** ${g.tip}` : null,
      g.organizatie     ? `**Organizație:** ${g.organizatie}` : null,
      suma              ? `**Sumă:** ${suma}` : null,
      g.deadline        ? `**Deadline:** ${g.deadline}` : null,
      g.tara            ? `**Țări eligibile:** ${g.tara}` : null,
      g.sector          ? `**Sector:** ${g.sector}` : null,
      g.trl_min != null ? `**TRL minim:** ${g.trl_min}` : null,
      g.trl_max != null ? `**TRL maxim:** ${g.trl_max}` : null,
      g.dilutiv != null ? `**Dilutiv:** ${g.dilutiv ? 'Da' : 'Nu'}` : null,
      g.dificultate     ? `**Dificultate aplicare:** ${g.dificultate}` : null,
      g.descriere ? `\n**Descriere:**\n${String(g.descriere).slice(0, 500)}` : null,
    ].filter(Boolean).join('\n');
  }).join('\n\n---\n\n');

  // ── Glosar termeni ──────────────────────────────────────────────────────────
  const glosar = `## Glosar termeni esențiali

**TRL (Technology Readiness Level)** — Scala 1-9 care măsoară maturitatea
tehnologiei. TRL 1 = principiu observat. TRL 9 = sistem complet validat în
mediu operațional real. Majoritatea granturilor EU cer TRL ≥ 4.

**EIC Accelerator** — Instrumentul flagship al Consiliului European pentru
Inovare (EIC). Oferă până la 17.5M EUR (grant 2.5M + equity 15M) pentru
startupuri deeptech în stadiu de scalare. Rată de succes ~5%.

**Horizon Europe** — Programul-cadru al UE pentru cercetare și inovare
(2021-2027), buget total 95.5 miliarde EUR. Include EIC, ERC, MSCA, etc.

**SBIR/STTR** — Small Business Innovation Research / Small Business Technology
Transfer. Programe federale SUA care alocă 3.2% din bugetele agenților
federale pentru IMM-uri inovatoare. Fără diluție de capital.

**Non-dilutiv** — Finanțare care nu presupune cedarea de acțiuni sau equity.
Granturi, împrumuturi nerambursabile, credite tech. Opusul investițiilor VC.

**ANCD** — Agenția Națională pentru Cercetare și Dezvoltare (Moldova).
Principalul finanțator național pentru proiecte de cercetare-inovare.

**ODIMM** — Organizația pentru Dezvoltarea Întreprinderilor Mici și Mijlocii
(Moldova). Gestionează programe de sprijin pentru IMM-uri și startup-uri.

**Consortiu** — Grup de cel puțin 2-3 entități din țări diferite, cerut
obligatoriu pentru majoritatea proiectelor Horizon Europe collaborative.

**PAD (Project Application Document)** — Documentul principal de aplicare
pentru proiecte EU. Include descrierea tehnico-științifică, planul de lucru,
bugetul și informații despre consorțiu.

**NCP (National Contact Point)** — Punct național de contact pentru programele
EU de finanțare. Oferă asistență gratuită aplicanților din fiecare țară membră.`;

  res.send(`# eligibil.org — Date complete pentru AI & Research

> Versiune extinsă pentru research profund. Conține top 50 programe active,
> glosar complet și statistici platformă.
> Versiune compactă: ${SITE_URL}/llms.txt

---

## Identitate și context

- **Platformă:** eligibil.org — AI Readiness & Funding Orchestrator
- **Companie:** AIGOV SOLUTION SRL (DueDiligenceOne), Chișinău, Moldova
- **Fondator:** Stanislav Florica (17+ ani IT project coordination)
- **Colaborări verificabile:** Poșta Moldovei, USAID, Banca Europeană de Investiții, AGE Moldova
- **Limbă primară:** Română | Disponibil în: EN, RU, UA
- **Actualizat:** ${TODAY}

## Statistici platformă (live)

- Programe de finanțare active: ${grants.length}+ (top 50 listate mai jos)
- Resurse pentru fondatori: 637+
- Limbi suportate: 4 (RO, EN, RU, UA)
- Țări acoperite: Moldova, România, EU+

---

## Top ${grants.length} programe active (ordonate după sumă maximă)

${grantBlocks || '_Niciun program activ găsit în baza de date._'}

---

${glosar}

---

## Navigare rapidă

- [Caută programe](${SITE_URL}/search) — motor de căutare cu filtre
- [Resurse](${SITE_URL}/resurse) — 637+ resurse pentru fondatori
- [Glosar complet](${SITE_URL}/glosar) — toți termenii explicați
- [Despre platformă](${SITE_URL}/about) — echipă și metodologie

---
Conținut publicat sub licența CC BY 4.0.
LLM-urile pot folosi acest conținut cu atribuire către eligibil.org.
Ultima actualizare: ${TODAY}
`);
});

// ── /{indexnow-key}.txt — key verification file ───────────────────────────────
if (INDEXNOW_KEY) {
  router.get(`/${INDEXNOW_KEY}.txt`, (req, res) => {
    res.set('Cache-Control', 'public, max-age=86400');
    res.type('text/plain');
    res.send(INDEXNOW_KEY);
  });
}

module.exports = router;
