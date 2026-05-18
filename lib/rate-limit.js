'use strict';

const rateLimit = require('express-rate-limit');

const MESSAGES = {
  ro: 'Prea multe cereri. Încearcă din nou mai târziu.',
  en: 'Too many requests. Please try again later.',
  ru: 'Слишком много запросов. Повторите попытку позже.',
};

function detectLang(req) {
  const raw = String(req.headers['accept-language'] || '').toLowerCase();
  if (raw.includes('ru')) return 'ru';
  if (raw.includes('en')) return 'en';
  return 'ro';
}

function buildHandler(windowSeconds) {
  return (req, res) => {
    const lang = detectLang(req);
    res.setHeader('Retry-After', String(windowSeconds));
    res.status(429).json({
      error: MESSAGES[lang],
      messages: MESSAGES,
      retryAfter: windowSeconds,
    });
  };
}

function createLimiter({ windowMs, max }) {
  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    handler: buildHandler(Math.ceil(windowMs / 1000)),
  });
}

module.exports = {
  apiLimiter: createLimiter({ windowMs: 60 * 1000, max: 100 }),
  authLoginLimiter: createLimiter({ windowMs: 60 * 1000, max: 5 }),
  authRegisterLimiter: createLimiter({ windowMs: 60 * 60 * 1000, max: 3 }),
  newsletterLimiter: createLimiter({ windowMs: 60 * 60 * 1000, max: 3 }),
  uploadLimiter: createLimiter({ windowMs: 15 * 60 * 1000, max: 10 }),
};

