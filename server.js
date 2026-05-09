'use strict';
require('dotenv').config();

const express = require('express');
const session = require('express-session');
const path    = require('path');

const app  = express();
const PORT = process.env.PORT || 3000;

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session middleware (MemoryStore — fine for dev/prototype)
app.use(session({
  secret: process.env.SESSION_SECRET || 'eligibil-dev-secret-2026',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
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

// /search — public catalog page. Static file served via the catch-all that
// follows; we just need an explicit route ahead of the index.html fallback.
app.get('/search', (req, res) => res.sendFile(path.join(__dirname, 'search.html')));

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
app.use('/api/auth', require('./routes/auth'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api', require('./routes/api'));

// Catch-all: serve index.html for non-API routes
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Initialise DB and start server
require('./db/database').init();

// Bind to 0.0.0.0 for Cloud Run / Docker (default localhost-only would not accept external requests)
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
