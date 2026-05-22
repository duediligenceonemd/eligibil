'use strict';
const { Sentry, sentryEnabled, reportError } = require('./instrument');
require('./lib/env-validation');

const express = require('express');
const helmet = require('helmet');
const session = require('express-session');
const path    = require('path');
const { SupabaseSessionStore } = require('./lib/supabase-session-store');
const {
  apiLimiter,
  authLoginLimiter,
  authRegisterLimiter,
  newsletterLimiter,
  uploadLimiter,
} = require('./lib/rate-limit');
const compression = require('compression');
const {
  requireAdminPage,
  requirePageSession,
  sameOriginGuard,
  securityHeaders,
} = require('./lib/request-security');

const app  = express();
const PORT = process.env.PORT || 3000;
const IS_PROD = process.env.NODE_ENV === 'production';
const SESSION_MAX_AGE_MS = Number(process.env.SESSION_MAX_AGE_MS || 24 * 60 * 60 * 1000);

app.disable('x-powered-by');
app.set('trust proxy', 1);
app.use(compression());
app.use(securityHeaders);
app.use((req, res, next) => {
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(self), payment=(self)');
  res.setHeader('X-DNS-Prefetch-Control', 'on');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  if (IS_PROD) {
    res.setHeader('Strict-Transport-Security', 'max-age=15552000; includeSubDomains');
  }
  next();
});

// Cloud Run terminates TLS at the load balancer — trust X-Forwarded-* headers
app.set('trust proxy', 1);

// Security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc:  ["'self'", "'unsafe-inline'", "https://unpkg.com", "https://www.clarity.ms", "https://scripts.clarity.ms", "https://static.cloudflareinsights.com", "https://www.googletagmanager.com"],
      styleSrc:   ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc:    ["'self'", "https://fonts.gstatic.com"],
      imgSrc:     ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://www.clarity.ms", "https://scripts.clarity.ms", "https://www.google-analytics.com", "https://www.googletagmanager.com"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// Body parsing
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '50kb' }));

function createSessionStore() {
  if (String(process.env.SESSION_STORE || '').toLowerCase() !== 'supabase') {
    return undefined;
  }

  return new SupabaseSessionStore({
    table: process.env.SESSION_TABLE || 'app_sessions',
    ttlMs: SESSION_MAX_AGE_MS,
  });
}

// Session middleware. Use SESSION_STORE=supabase in production for persistence.
app.use(session({
  name: 'elig.sid',
  store: createSessionStore(),
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  rolling: true,
  unset: 'destroy',
  proxy: IS_PROD,
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    secure: IS_PROD,
    maxAge: SESSION_MAX_AGE_MS,
  },
}));
app.use('/api', sameOriginGuard);

// Bilingual grant detail routes — must come BEFORE express.static so that
// /grant.html (legacy) hits our redirect handler instead of being served as
// a static file. /ro/granturi/:slug and /en/grants/:slug have no static
// counterparts; they're listed alongside for locality.
const { renderGrantPage } = require('./lib/render-grant-page');
function tryGetSupabase() {
  try { return require('./db/supabase').getSupabase(); } catch { return null; }
}
const GRANT_SELECT_FULL = '*';

app.get('/app-config.js', (req, res) => {
  res.type('application/javascript').send(
    [
      '(function () {',
      '  window.__APP_CONFIG__ = {',
      `    gaMeasurementId: ${JSON.stringify(process.env.GA_MEASUREMENT_ID || '')},`,
      `    environment: ${JSON.stringify(process.env.NODE_ENV || 'development')},`,
      `    siteUrl: ${JSON.stringify(process.env.SITE_URL || 'https://eligibil.org')}`,
      '  };',
      '})();',
    ].join('\n')
  );
});

app.get('/api/health', async (req, res) => {
  const startedAt = Date.now();
  const supabase = tryGetSupabase();
  let supabaseOk = false;
  let supabaseError = null;
  const analyticsConfigured = !!String(process.env.GA_MEASUREMENT_ID || '').trim();
  const sentryConfigured = !!String(process.env.SENTRY_DSN || '').trim();

  if (supabase) {
    try {
      const { error } = await supabase.from('grants').select('id').limit(1);
      if (error) throw error;
      supabaseOk = true;
    } catch (err) {
      supabaseError = err.message;
    }
  } else {
    supabaseError = 'Supabase not configured';
  }

  const payload = {
    status: supabaseOk ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    response_time_ms: Date.now() - startedAt,
    services: {
      supabase: {
        ok: supabaseOk,
      },
      analytics: {
        ok: analyticsConfigured,
      },
      sentry: {
        ok: sentryConfigured,
      },
    },
  };

  if (!supabaseOk && supabaseError) {
    payload.services.supabase.error = supabaseError;
  }

  res.status(supabaseOk ? 200 : 503).json(payload);
});

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

    // Funder Intelligence — fetch up to 4 other grants from same funder
    let related = [];
    if (data.funder_name) {
      const { data: rel } = await sb
        .from('grants')
        .select('id, slug_ro, slug_en, nume_program, nume_program_en, short_summary_ro, short_summary_en, suma_max, deadline, status')
        .eq('funder_name', data.funder_name)
        .neq('id', data.id)
        .eq('status', 'Activ')
        .limit(4);
      related = rel || [];
    }
    data.related_grants = related;

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
app.get('/en', (req, res) => res.sendFile(path.join(__dirname, 'en.html')));
app.get('/search', (req, res) => res.sendFile(path.join(__dirname, 'search.html')));
app.get('/resurse', (req, res) => res.sendFile(path.join(__dirname, 'resources.html')));
app.get('/en/resources', (req, res) => res.sendFile(path.join(__dirname, 'resources-en.html')));
app.get('/parteneri',  (req, res) => res.sendFile(path.join(__dirname, 'parteneri.html')));
app.get('/parteneri/:slug', (req, res) => res.sendFile(path.join(__dirname, 'partener.html')));
app.get('/startupuri', (req, res) => res.sendFile(path.join(__dirname, 'startupuri.html')));
app.get('/about', (req, res) => res.sendFile(path.join(__dirname, 'about.html')));
app.get('/contact', (req, res) => res.sendFile(path.join(__dirname, 'contact.html')));
app.get('/how-it-works', (req, res) => res.sendFile(path.join(__dirname, 'how-it-works.html')));
app.get('/methodology', (req, res) => res.sendFile(path.join(__dirname, 'methodology.html')));
app.get('/data-quality', (req, res) => res.sendFile(path.join(__dirname, 'data-quality.html')));
app.get('/technology', (req, res) => res.sendFile(path.join(__dirname, 'technology.html')));
app.get('/evenimente/:slug', (req, res) => res.sendFile(path.join(__dirname, 'eveniment.html')));
app.get('/events/:slug',     (req, res) => res.sendFile(path.join(__dirname, 'eveniment.html')));
app.get('/produs/:slug', (req, res) => res.sendFile(path.join(__dirname, 'produs.html')));
app.get('/glosar', (req, res) => res.sendFile(path.join(__dirname, 'glosar.html')));
app.get('/produse', (req, res) => res.sendFile(path.join(__dirname, 'produse.html')));
app.get('/privacy', (req, res) => res.sendFile(path.join(__dirname, 'privacy.html')));
app.get('/politica-confidentialitate', (req, res) => res.sendFile(path.join(__dirname, 'privacy.html')));
app.get('/terms', (req, res) => res.sendFile(path.join(__dirname, 'terms.html')));
app.get('/termeni-si-conditii', (req, res) => res.sendFile(path.join(__dirname, 'terms.html')));
app.get('/register', (req, res) => res.sendFile(path.join(__dirname, 'register.html')));
app.get('/login', (req, res) => res.sendFile(path.join(__dirname, 'login.html')));
app.get('/cookies', (req, res) => res.sendFile(path.join(__dirname, 'cookies.html')));
app.get('/forgot-password', (req, res) => res.sendFile(path.join(__dirname, 'reset-password.html')));
app.get('/reset-password', (req, res) => res.sendFile(path.join(__dirname, 'reset-password.html')));

// /evenimente (RO) + /events (EN) — public events listing page (Brief 04).
// Both routes serve the same events.html shell; components-events.jsx
// detects the URL path to flip language.
app.get('/evenimente', (req, res) => res.sendFile(path.join(__dirname, 'events.html')));
app.get('/events',     (req, res) => res.sendFile(path.join(__dirname, 'events.html')));

// /admin — protected admin panel (CRUD over grants + events). The page
// loads auth.js which redirects anonymous visitors to /login.html, and
// every API call enforces requireAdmin server-side.
app.get('/legal/privacy', (req, res) => res.sendFile(path.join(__dirname, 'privacy.html')));
app.get('/legal/cookie', (req, res) => res.sendFile(path.join(__dirname, 'cookies.html')));
app.get('/legal/terms', (req, res) => res.sendFile(path.join(__dirname, 'terms.html')));

app.get(['/dashboard', '/dashboard.html'], requirePageSession, (req, res) =>
  res.sendFile(path.join(__dirname, 'dashboard.html'))
);
app.get(['/profile', '/profile.html'], requirePageSession, (req, res) =>
  res.sendFile(path.join(__dirname, 'profile.html'))
);
app.get(['/consortium', '/consortium.html'], requirePageSession, (req, res) =>
  res.sendFile(path.join(__dirname, 'consortium.html'))
);
app.get(['/upload-artefact', '/upload-artefact.html'], requirePageSession, (req, res) =>
  res.sendFile(path.join(__dirname, 'upload-artefact.html'))
);
app.get(['/admin', '/admin.html', '/admin-queue.html'], requireAdminPage, (req, res) => {
  const fileName = req.path.endsWith('admin-queue.html') ? 'admin-queue.html' : 'admin.html';
  res.sendFile(path.join(__dirname, fileName));
});

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

// API routes
app.use('/api/auth/login', authLoginLimiter);
app.use('/api/auth/register', authRegisterLimiter);
app.use('/api/auth/forgot-password', authRegisterLimiter);
app.use('/api/auth/reset-password', authLoginLimiter);
app.use('/api/auth', require('./routes/auth'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/artefacts', uploadLimiter, require('./routes/artefacts'));
app.use('/api/feedback', require('./routes/feedback'));
app.use('/api/newsletter', newsletterLimiter, require('./routes/newsletter'));
app.use('/api/waitlist', require('./routes/waitlist'));
app.use('/api/unsubscribe', require('./routes/unsubscribe'));
app.use('/api/events', require('./routes/events'));
app.use('/api', apiLimiter, require('./routes/api'));

if (!IS_PROD || process.env.ENABLE_SENTRY_DEBUG_ROUTE === 'true') {
  app.get('/debug-sentry', (req, res) => {
    Sentry.logger.info('User triggered test error', {
      action: 'test_error_endpoint',
      path: req.path,
    });
    Sentry.metrics.count('debug_sentry_requests', 1);
    Sentry.startSpan({ name: 'debug-sentry-route' }, () => {
      throw new Error('My first Sentry error!');
    });
    res.status(204).end();
  });
}

// API 404 — unknown API endpoints
app.all('/api/*', (req, res) => {
  res.status(404).json({ error: 'Endpoint inexistent' });
});

// Page 404 — unknown pages get the 404 page, not index.html
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, '404.html'));
});

// Global error handler — catches unhandled throws in route handlers
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  if (req.path.startsWith('/api')) {
    return res.status(500).json({ error: 'Eroare internă de server' });
  }
  res.status(500).sendFile(path.join(__dirname, '404.html'));
});

Sentry.setupExpressErrorHandler(app);

app.use((err, req, res, next) => {
  if (res.headersSent) return next(err);
  console.error('Unhandled application error:', err.message);
  reportError(err, {
    tags: { area: 'server', route: 'unhandled_error' },
    extra: { path: req.path, method: req.method },
  });
  res.status(500).json({
    error: 'Internal server error',
    sentry_id: res.sentry || null,
  });
});

// Initialise DB and start server
require('./db/users-supabase').init();

// Bind to 0.0.0.0 for Cloud Run / Docker (default localhost-only would not accept external requests)
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  if (sentryEnabled) {
    Sentry.logger.info('Sentry initialized for eligibil.org', {
      environment: process.env.NODE_ENV || 'development',
      port: PORT,
    });
  }
});
