'use strict';

const helmet = require('helmet');
const { getRequestUser, hasValidAdminToken, isAdminUser } = require('./admin-auth');

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

function getAllowedOrigins(req) {
  const current = `${req.protocol}://${req.get('host')}`;
  const configured = [
    process.env.SITE_URL,
    process.env.APP_URL,
    process.env.NEXTAUTH_URL,
    'https://eligibil.org',
    'https://www.eligibil.org',
  ].filter(Boolean);

  return new Set([current, ...configured].map((value) => {
    try { return new URL(value).origin; } catch { return null; }
  }).filter(Boolean));
}

function extractOrigin(headerValue) {
  if (!headerValue) return null;
  try { return new URL(headerValue).origin; } catch { return null; }
}

function sameOriginGuard(req, res, next) {
  if (SAFE_METHODS.has(req.method)) return next();
  if (hasValidAdminToken(req.headers['x-admin-token'])) return next();

  const allowed = getAllowedOrigins(req);
  const origin = extractOrigin(req.get('origin'));
  const referer = extractOrigin(req.get('referer'));
  const candidate = origin || referer;

  if (candidate && allowed.has(candidate)) return next();

  return res.status(403).json({
    error: 'Cross-site request blocked',
  });
}

function redirectToLogin(req, res, target = '/login.html') {
  const nextPath = encodeURIComponent(req.originalUrl || req.path || '/dashboard.html');
  res.redirect(`${target}?next=${nextPath}`);
}

function requirePageSession(req, res, next) {
  if (req.session?.userId) return next();
  return redirectToLogin(req, res);
}

async function requireAdminPage(req, res, next) {
  if (hasValidAdminToken(req.headers['x-admin-token'])) return next();
  if (!req.session?.userId) return redirectToLogin(req, res, '/login.html');

  try {
    const user = req.adminUser || await getRequestUser(req);
    if (user && isAdminUser(user)) return next();

    return res.redirect('/dashboard.html');
  } catch {
    return res.redirect('/login.html');
  }
}

const IS_PROD = process.env.NODE_ENV === 'production';
const cspDirectives = {
  defaultSrc: ["'self'"],
  scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", 'https://unpkg.com'],
  styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
  imgSrc: ["'self'", 'data:', 'blob:', 'https:'],
  connectSrc: ["'self'", 'https://api.openai.com'],
  fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
  objectSrc: ["'none'"],
  baseUri: ["'self'"],
  formAction: ["'self'"],
  frameAncestors: ["'none'"],
  frameSrc: ["'none'"],
};

if (IS_PROD) {
  cspDirectives.upgradeInsecureRequests = [];
}

const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: cspDirectives,
  },
  crossOriginEmbedderPolicy: false,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
});

module.exports = {
  requireAdminPage,
  requirePageSession,
  sameOriginGuard,
  securityHeaders,
};
