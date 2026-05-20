'use strict';

const crypto = require('crypto');
const usersDb = require('../db/users-supabase');

function isAdminTokenAuthEnabled() {
  return String(process.env.ALLOW_ADMIN_TOKEN_AUTH || '').toLowerCase() === 'true';
}

function isAdminUser(user) {
  if (!user) return false;
  if (user.is_admin === true) return true;

  const allowlist = String(process.env.ADMIN_EMAILS || '')
    .toLowerCase()
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  return allowlist.includes(String(user.email || '').toLowerCase());
}

function hasValidAdminToken(token) {
  if (!isAdminTokenAuthEnabled()) return false;

  const expected = process.env.ADMIN_TOKEN;
  if (!expected || !token) return false;

  const a = Buffer.from(String(token));
  const b = Buffer.from(String(expected));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

async function getRequestUser(req) {
  if (!req.session?.userId) return null;
  return usersDb.findOne('users', { id: req.session.userId });
}

async function isAdminRequest(req) {
  if (hasValidAdminToken(req.headers['x-admin-token'])) return true;
  const user = await getRequestUser(req);
  return isAdminUser(user);
}

async function requireAdmin(req, res, next) {
  if (hasValidAdminToken(req.headers['x-admin-token'])) return next();

  if (!req.session?.userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const user = await getRequestUser(req);
    if (!user) {
      return res.status(401).json({ error: 'Session user not found' });
    }
    if (!isAdminUser(user)) {
      return res.status(403).json({ error: 'Admin privilege required' });
    }
    req.adminUser = user;
    next();
  } catch (err) {
    console.error('requireAdmin error:', err.message);
    return res.status(500).json({ error: 'Auth check failed' });
  }
}

module.exports = {
  getRequestUser,
  hasValidAdminToken,
  isAdminTokenAuthEnabled,
  isAdminRequest,
  isAdminUser,
  requireAdmin,
};

