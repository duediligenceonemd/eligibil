'use strict';
require('dotenv').config();
require('./lib/validate-env');

const express     = require('express');
const session     = require('express-session');
const helmet      = require('helmet');
const rateLimit   = require('express-rate-limit');
const path        = require('path');

const app  = express();
const PORT = process.env.PORT || 3000;

// Cloud Run terminates TLS at the load balancer — trust X-Forwarded-* headers
app.set('trust proxy', 1);

// Security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc:  ["'self'", "'unsafe-inline'", "https://unpkg.com"],
      styleSrc:   ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc:    ["'self'", "https://fonts.gstatic.com"],
      imgSrc:     ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: 'Prea multe încercări. Reîncercați în 15 minute.' },
  standardHeaders: true,
  legacyHeaders: false,
});
const newsletterLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: { error: 'Prea multe cereri. Reîncercați mai târziu.' },
  standardHeaders: true,
  legacyHeaders: false,
});
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Prea multe cereri. Reîncercați în 15 minute.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Session middleware (MemoryStore — fine for dev/prototype)
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  },
}));

// Bilingual grant detail routes — must come BEFORE express.static so that
// /grant.html (legacy) hits our redirect handler instead of being served as
// a static file. /ro/granturi/:slug and /en/grants/:slug have no static
// counterparts; they're listed alongside for locality.
const { renderGrantPage } = require('./lib/render-grant-page');
function tryGetSupabase() {
  try { return require('./db/supabase').getSupabase(); } catch { return null; }
}
const GRANT_SELECT_FULL = '*';

async function serveGrantPage(req, res, lang, slugColumn) {
  const sb = tryGetSupabase();
  if (!sb) return res.status(503).sendFile(path.join(__dirname, '404.html'));

  try {
    const { data, error } = await sb
      .from('grants')
      .select(GRANT_SELECT_FULL)
      .eq(slugColumn, req.params.slug)
      .maybeSingle();
    if (error) throw error;
    if (!data) return res.status(404).sendFile(path.join(__dirname, '404.html'));

    const html = renderGrantPage(data, lang);
    res.type('html').send(html);
  } catch (err) {
    console.error(`GET /${lang}/.../${req.params.slug} error:`, err.message);
    res.status(500).sendFile(path.join(__dirname, '404.html'));
  }
}

app.get('/ro/granturi/:slug', (req, res) => serveGrantPage(req, res, 'ro', 'slug_ro'));
app.get('/en/grants/:slug',  (req, res) => serveGrantPage(req, res, 'en', 'slug_en'));

// Programmatic SEO listings — /ro/granturi-:sector-:tara + /en/grants-:sector-:tara.
// Distinct from the slug routes above (slash separator vs. dash). The regex
// requires a dash immediately after granturi/grants so there's no collision
// with /ro/granturi/<slug>. Allowlist of valid (sector, country) pairs is
// enforced at request time — combinations not on the list fall through to 404.
const { renderSeoListing } = require('./lib/render-seo-listing');
const SEO_SECTORS = {
  'ai':         { ro: 'AI',         en: 'AI',         ilike: '%AI%' },
  'biotech':    { ro: 'biotech',    en: 'biotech',    ilike: '%biotech%' },
  'climate':    { ro: 'climate',    en: 'climate',    ilike: '%climate%' },
  'fintech':    { ro: 'fintech',    en: 'fintech',    ilike: '%fintech%' },
  'edtech':     { ro: 'edtech',     en: 'edtech',     ilike: '%edtech%' },
  'deep-tech':  { ro: 'deep tech',  en: 'deep tech',  ilike: '%deep%' },
  'saas':       { ro: 'SaaS',       en: 'SaaS',       ilike: '%SaaS%' },
  'healthtech': { ro: 'healthtech', en: 'healthtech', ilike: '%health%' },
  'mobility':   { ro: 'mobility',   en: 'mobility',   ilike: '%mobility%' },
};
const SEO_COUNTRIES = {
  'moldova': { ro: 'Moldova', en: 'Moldova', ilike: '%Moldova%' },
  'romania': { ro: 'România', en: 'Romania', ilike: '%Romania%' },
  'ucraina': { ro: 'Ucraina', en: 'Ukraine', ilike: '%Ukraine%' },
  'ue':      { ro: 'UE',      en: 'EU',      ilike: '%EU%' },
};

app.get(/^\/(ro|en)\/(granturi|grants)-(.+)$/, async (req, res, next) => {
  const lang = req.params[0];
  const type = req.params[1];
  const rest = req.params[2];
  if ((lang === 'ro' && type !== 'granturi') ||
      (lang === 'en' && type !== 'grants'))   return next();

  // Peel country (single-token) from the END so compound sectors like
  // "deep-tech" parse correctly: "deep-tech-moldova" → sector=deep-tech, c=moldova.
  let sectorKey = null, countryKey = null;
  for (const c of Object.keys(SEO_COUNTRIES)) {
    if (rest.endsWith('-' + c)) {
      const candidate = rest.slice(0, -(c.length + 1));
      if (SEO_SECTORS[candidate]) { sectorKey = candidate; countryKey = c; break; }
    }
  }
  // Unknown sector or country — serve the 404 directly. Calling next() would
  // bounce through to the catch-all that serves index.html (homepage), which
  // is wrong UX and bad for SEO (Google would dedupe many URLs to the same
  // homepage content and penalize the listings).
  if (!sectorKey || !countryKey) {
    return res.status(404).sendFile(path.join(__dirname, '404.html'));
  }

  const sb = tryGetSupabase();
  if (!sb) return res.status(503).sendFile(path.join(__dirname, '404.html'));

  const sectorMeta  = SEO_SECTORS[sectorKey];
  const countryMeta = SEO_COUNTRIES[countryKey];

  try {
    // Trim to columns that exist on `grants` today. Future Pas 1 extension
    // can add nume_program_en, short_summary_*, funder_name, evidence_status.
    const { data, error } = await sb.from('grants')
      .select('id, slug_ro, slug_en, nume_program, ' +
              'organizatie, tara, tip, suma_min, suma_max, deadline, ' +
              'dilutiv, dificultate, descriere, cerinte')
      .eq('status', 'Activ')
      .ilike('sector', sectorMeta.ilike)
      .ilike('tara',   countryMeta.ilike)
      .order('dificultate', { ascending: true })
      .limit(50);

    if (error) {
      // Pas 1 columns missing → graceful 404 rather than 500.
      if (/column .* does not exist/i.test(error.message || '')) {
        return res.status(404).sendFile(path.join(__dirname, '404.html'));
      }
      console.error('SEO listing query error:', error.message);
      return res.status(500).sendFile(path.join(__dirname, '404.html'));
    }

    const html = renderSeoListing({
      lang,
      sectorKey,  sectorLabel:  sectorMeta[lang],
      countryKey, countryLabel: countryMeta[lang],
      grants: data || [],
    });
    res.type('html').send(html);
  } catch (err) {
    console.error('SEO listing unexpected error:', err.message);
    res.status(500).sendFile(path.join(__dirname, '404.html'));
  }
});

// /search — public catalog page. Static file served via the catch-all that
// follows; we just need an explicit route ahead of the index.html fallback.
app.get('/search', (req, res) => res.sendFile(path.join(__dirname, 'search.html')));
app.get('/upload-artefact', (req, res) => res.sendFile(path.join(__dirname, 'upload-artefact.html')));
app.get('/parteneri',  (req, res) => res.sendFile(path.join(__dirname, 'parteneri.html')));
app.get('/parteneri/:slug', (req, res) => res.sendFile(path.join(__dirname, 'partener.html')));
app.get('/startupuri', (req, res) => res.sendFile(path.join(__dirname, 'startupuri.html')));
app.get('/about', (req, res) => res.sendFile(path.join(__dirname, 'about.html')));
app.get('/produs/:slug', (req, res) => res.sendFile(path.join(__dirname, 'produs.html')));
app.get('/glosar', (req, res) => res.sendFile(path.join(__dirname, 'glosar.html')));
app.get('/produse', (req, res) => res.sendFile(path.join(__dirname, 'produse.html')));
app.get('/privacy', (req, res) => res.sendFile(path.join(__dirname, 'privacy.html')));
app.get('/politica-confidentialitate', (req, res) => res.sendFile(path.join(__dirname, 'privacy.html')));

// /evenimente (RO) + /events (EN) — public events listing page (Brief 04).
// Both routes serve the same events.html shell; components-events.jsx
// detects the URL path to flip language.
app.get('/evenimente', (req, res) => res.sendFile(path.join(__dirname, 'events.html')));
app.get('/events',     (req, res) => res.sendFile(path.join(__dirname, 'events.html')));

// /admin — protected admin panel (CRUD over grants + events). The page
// loads auth.js which redirects anonymous visitors to /login.html, and
// every API call enforces requireAdmin server-side.
app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, 'admin.html')));

// /stiri (RO) + /news (EN) listing + detail. /blog detail+listing same lang
// in both URLs (brand convention). All public; auth.js whitelists below.
const { renderListingPage, renderDetailPage } = require('./lib/render-content-page');

async function serveContentListing(req, res, kind, lang) {
  const sb = tryGetSupabase();
  if (!sb) return res.status(503).sendFile(path.join(__dirname, '404.html'));
  const table = kind === 'news' ? 'news' : 'blog_posts';
  try {
    const { data, error } = await sb.from(table)
      .select('id, slug_ro, slug_en, title, title_en, excerpt_ro, excerpt_en, ' +
              'hero_image, author, category, tags, published_at, ' +
              (kind === 'blog' ? 'reading_time_min, is_featured, ' : '') +
              'status, updated_at')
      .eq('status', 'published')
      .not('published_at', 'is', null)
      .lte('published_at', new Date().toISOString())
      .order('published_at', { ascending: false })
      .limit(50);
    if (error) {
      // Pre-Iter-3 schema (table missing) → empty list (still renders the page)
      if (/relation .* does not exist|Could not find the table .* in the schema cache/i.test(error.message || '')) {
        return res.type('html').send(renderListingPage({ kind, lang, items: [] }));
      }
      throw error;
    }
    res.type('html').send(renderListingPage({ kind, lang, items: data || [] }));
  } catch (err) {
    console.error('content listing error', err);
    res.status(500).sendFile(path.join(__dirname, '404.html'));
  }
}

async function serveContentDetail(req, res, kind, lang, slugColumn) {
  const sb = tryGetSupabase();
  if (!sb) return res.status(503).sendFile(path.join(__dirname, '404.html'));
  const table = kind === 'news' ? 'news' : 'blog_posts';
  try {
    const { data, error } = await sb.from(table).select('*')
      .eq(slugColumn, req.params.slug)
      .eq('status', 'published')
      .maybeSingle();
    if (error) {
      if (/relation .* does not exist|Could not find the table .* in the schema cache/i.test(error.message || '')) {
        return res.status(404).sendFile(path.join(__dirname, '404.html'));
      }
      throw error;
    }
    if (!data) return res.status(404).sendFile(path.join(__dirname, '404.html'));
    res.type('html').send(renderDetailPage({ kind, lang, item: data }));
  } catch (err) {
    console.error('content detail error', err);
    res.status(500).sendFile(path.join(__dirname, '404.html'));
  }
}

// RSS feeds at /stiri/feed.xml, /news/feed.xml, /blog/feed.xml — mounted
// BEFORE the /:slug routes so "feed.xml" isn't captured as a slug.
app.use('/', require('./routes/feeds'));

// Listings
app.get('/stiri',    (req, res) => serveContentListing(req, res, 'news', 'ro'));
app.get('/news',     (req, res) => serveContentListing(req, res, 'news', 'en'));
app.get('/blog',     (req, res) => serveContentListing(req, res, 'blog', 'ro'));
app.get('/en/blog',  (req, res) => serveContentListing(req, res, 'blog', 'en'));

// Detail. /stiri/:slug → news (RO). /news/:slug → news (EN).
// /blog/:slug → blog (RO). /en/blog/:slug → blog (EN).
app.get('/stiri/:slug',    (req, res) => serveContentDetail(req, res, 'news', 'ro', 'slug_ro'));
app.get('/news/:slug',     (req, res) => serveContentDetail(req, res, 'news', 'en', 'slug_en'));
app.get('/blog/:slug',     (req, res) => serveContentDetail(req, res, 'blog', 'ro', 'slug_ro'));
app.get('/en/blog/:slug',  (req, res) => serveContentDetail(req, res, 'blog', 'en', 'slug_en'));

// SEO routes — /sitemap.xml + /robots.txt. Mounted before express.static
// so they're guaranteed to win over any static file with the same name.
app.use('/', require('./routes/seo'));

// Legacy redirect: /grant.html?id=EU012 → /ro/granturi/<slug>
app.get('/grant.html', async (req, res, next) => {
  if (!req.query.id) return res.redirect(301, '/');
  const sb = tryGetSupabase();
  if (!sb) return next(); // fall through to static file
  try {
    const { data } = await sb
      .from('grants')
      .select('slug_ro')
      .eq('id', req.query.id)
      .maybeSingle();
    if (data?.slug_ro) return res.redirect(301, `/ro/granturi/${data.slug_ro}`);
  } catch (err) {
    console.error('GET /grant.html legacy redirect error:', err.message);
  }
  return res.redirect(301, '/');
});

// Static files served from project root
app.use(express.static(__dirname));

// API routes (with rate limiting)
app.use('/api/auth/login',    authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/auth', require('./routes/auth'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/artefacts', require('./routes/artefacts'));
app.use('/api/newsletter', newsletterLimiter, require('./routes/newsletter'));
app.use('/api/events', require('./routes/events'));
app.use('/api', apiLimiter, require('./routes/api'));

// Catch-all: serve index.html for non-API routes
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Initialise DB and start server
require('./db/users-supabase').init();

// Bind to 0.0.0.0 for Cloud Run / Docker (default localhost-only would not accept external requests)
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
