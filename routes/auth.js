'use strict';

const express = require('express');
const bcrypt  = require('bcryptjs');
const db      = require('../db/database');

const router = express.Router();

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const {
    email, password, firstName, lastName, role,
    startupName, website, pitch, sector, stage, trl, country,
    teamSize, github, goals, amountIdx, horizon, priority,
  } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email și parola sunt obligatorii' });
  }

  const normalEmail = email.toLowerCase().trim();

  // Duplicate check
  if (db.findOne('users', { email: normalEmail })) {
    return res.status(409).json({ error: 'Email deja înregistrat' });
  }

  try {
    const passwordHash = await bcrypt.hash(password, 10);

    const user = db.insert('users', {
      email: normalEmail,
      password_hash: passwordHash,
      first_name: firstName || null,
      last_name:  lastName  || null,
      role: role || 'Fondator',
    });

    if (startupName) {
      db.insert('startups', {
        user_id:    user.id,
        name:       startupName  || null,
        website:    website      || null,
        pitch:      pitch        || null,
        sector:     sector       || null,
        stage:      stage        || null,
        trl:        trl != null ? Number(trl) : 5,
        country:    country      || 'Moldova',
        team_size:  teamSize     || null,
        github:     github       || null,
        goals:      Array.isArray(goals) ? JSON.stringify(goals) : (goals || null),
        amount_idx: amountIdx != null ? Number(amountIdx) : 3,
        horizon:    horizon      || null,
        priority:   priority     || null,
      });
    }

    req.session.userId = user.id;

    return res.json({
      ok: true,
      user: { id: user.id, email: user.email, firstName: user.first_name, lastName: user.last_name, role: user.role },
    });
  } catch (err) {
    console.error('Register error:', err);
    return res.status(500).json({ error: 'Eroare internă de server' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email și parola sunt obligatorii' });
  }

  const user = db.findOne('users', { email: email.toLowerCase().trim() });
  if (!user) {
    return res.status(401).json({ error: 'Email sau parolă incorectă' });
  }

  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) {
    return res.status(401).json({ error: 'Email sau parolă incorectă' });
  }

  req.session.userId = user.id;

  return res.json({
    ok: true,
    user: { id: user.id, email: user.email, firstName: user.first_name, lastName: user.last_name, role: user.role },
  });
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('connect.sid');
    res.json({ ok: true });
  });
});

// GET /api/auth/me
router.get('/me', (req, res) => {
  if (!req.session.userId) return res.json({ ok: false });

  const user = db.findOne('users', { id: req.session.userId });
  if (!user) {
    req.session.destroy(() => {});
    return res.json({ ok: false });
  }

  const startup = db.findOne('startups', { user_id: user.id });

  return res.json({
    ok: true,
    user: { id: user.id, email: user.email, firstName: user.first_name, lastName: user.last_name, role: user.role },
    startup: startup ? {
      name:    startup.name,
      sector:  startup.sector,
      stage:   startup.stage,
      country: startup.country,
    } : null,
  });
});

module.exports = router;
