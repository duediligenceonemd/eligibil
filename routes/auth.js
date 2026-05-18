'use strict';

const express  = require('express');
const bcrypt   = require('bcryptjs');
const db       = require('../db/users-supabase');
const { reportError } = require('../instrument');
const {
  clearFailures,
  getProtectionStatus,
  registerFailure,
  sleep,
} = require('../lib/login-protection');
const { parseBody, loginSchema, registerSchema } = require('../lib/validation');
const { sendEmail, queueEmail, unsubscribeUrl } = require('../lib/email/resend');
const { welcome, T } = require('../lib/email/templates');

const router = express.Router();

function clientIp(req) {
  return String(req.ip || req.headers['x-forwarded-for'] || '').split(',')[0].trim().slice(0, 64);
}

function maskEmail(email) {
  const [local, domain] = String(email || '').split('@');
  if (!local || !domain) return 'unknown';
  return `${local.slice(0, 2)}***@${domain}`;
}

function sessionUser(user) {
  return {
    id: user.id,
    email: user.email,
    firstName: user.first_name,
    lastName: user.last_name,
    role: user.role,
  };
}

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const parsed = parseBody(registerSchema, req.body || {});
  if (!parsed.ok) {
    return res.status(400).json({ error: 'Date de înregistrare invalide', fields: parsed.error.fieldErrors });
  }

  const {
    email, password, firstName, lastName, role,
    startupName, website, pitch, sector, stage, trl, country,
    teamSize, github, goals, amountIdx, horizon, priority,
  } = parsed.data;

  try {
    if (await db.findOne('users', { email })) {
      return res.status(409).json({ error: 'Email deja înregistrat' });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await db.insert('users', {
      email,
      password_hash: passwordHash,
      first_name: firstName,
      last_name:  lastName,
      role: role || 'Fondator',
    });

    if (startupName) {
      await db.insert('startups', {
        user_id:    user.id,
        name:       startupName,
        website:    website || null,
        pitch:      pitch || null,
        sector:     sector || null,
        stage:      stage || null,
        trl:        trl != null ? Number(trl) : 5,
        country:    country || 'Moldova',
        team_size:  teamSize || null,
        github:     github || null,
        goals:      Array.isArray(goals) ? JSON.stringify(goals) : null,
        amount_idx: amountIdx != null ? Number(amountIdx) : 3,
        horizon:    horizon || null,
        priority:   priority || null,
      });
    }

    req.session.userId = user.id;
    req.session.userEmail = user.email;

    var lang = 'ro';
    sendEmail({
      to: email,
      subject: (T.welcome.subject[lang] || T.welcome.subject.ro),
      html: welcome({ language: lang, name: firstName, unsubscribeUrl: unsubscribeUrl(email, 'all') }),
      type: 'welcome',
      language: lang,
    }).catch(() => {});

    queueEmail({ userId: user.id, recipient: email, type: 'onboarding_day3', language: lang, scheduledFor: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) }).catch(() => {});
    queueEmail({ userId: user.id, recipient: email, type: 'onboarding_day7', language: lang, scheduledFor: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) }).catch(() => {});

    return res.json({ ok: true, user: sessionUser(user) });
  } catch (err) {
    console.error('Register error:', err.message);
    reportError(err, {
      tags: { area: 'auth', action: 'register' },
      extra: { hasStartup: !!startupName },
    });
    return res.status(500).json({ error: 'Eroare internă de server' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const parsed = parseBody(loginSchema, req.body || {});
  if (!parsed.ok) {
    return res.status(400).json({ error: 'Date de autentificare invalide', fields: parsed.error.fieldErrors });
  }

  const { email, password } = parsed.data;
  const ip = clientIp(req);
  const protection = getProtectionStatus(ip, email);

  if (!protection.allowed) {
    res.setHeader('Retry-After', String(protection.retryAfterSeconds));
    return res.status(429).json({ error: 'Prea multe încercări. Încearcă din nou mai târziu.' });
  }

  try {
    const user = await db.findOne('users', { email });
    if (!user) {
      const { delayMs, lockedUntil } = registerFailure(ip, email);
      await sleep(delayMs);
      if (lockedUntil) {
        console.warn(`Login locked for IP ${ip} after repeated failures for ${maskEmail(email)}`);
        res.setHeader('Retry-After', String(Math.ceil((lockedUntil - Date.now()) / 1000)));
        return res.status(429).json({ error: 'Contul sau IP-ul este temporar blocat după prea multe încercări eșuate.' });
      }
      return res.status(401).json({ error: 'Email sau parolă incorectă' });
    }

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) {
      const { delayMs, lockedUntil } = registerFailure(ip, email);
      await sleep(delayMs);
      if (lockedUntil) {
        console.warn(`Login locked for IP ${ip} after repeated failures for ${maskEmail(email)}`);
        res.setHeader('Retry-After', String(Math.ceil((lockedUntil - Date.now()) / 1000)));
        return res.status(429).json({ error: 'Contul sau IP-ul este temporar blocat după prea multe încercări eșuate.' });
      }
      return res.status(401).json({ error: 'Email sau parolă incorectă' });
    }

    clearFailures(ip, email);
    req.session.userId = user.id;
    req.session.userEmail = user.email;

    return res.json({ ok: true, user: sessionUser(user) });
  } catch (err) {
    console.error('Login error:', err.message);
    reportError(err, {
      tags: { area: 'auth', action: 'login' },
      extra: { ip, email_domain: String(email).split('@')[1] || 'unknown' },
    });
    return res.status(500).json({ error: 'Eroare internă de server' });
  }
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('elig.sid');
    res.clearCookie('connect.sid');
    res.json({ ok: true });
  });
});

// GET /api/auth/me
router.get('/me', async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (!req.session.userId) return res.json({ ok: false });

  try {
    const user = await db.findOne('users', { id: req.session.userId });
    if (!user) {
      req.session.destroy(() => {});
      return res.json({ ok: false });
    }

    const startup = await db.findOne('startups', { user_id: user.id });

    return res.json({
      ok: true,
      user: sessionUser(user),
      startup: startup ? {
        name:    startup.name,
        sector:  startup.sector,
        stage:   startup.stage,
        country: startup.country,
      } : null,
    });
  } catch (err) {
    console.error('/me error:', err.message);
    reportError(err, {
      tags: { area: 'auth', action: 'me' },
    });
    return res.json({ ok: false });
  }
});

module.exports = router;
