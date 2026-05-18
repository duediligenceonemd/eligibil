'use strict';

const express = require('express');
const crypto = require('crypto');
const { getSupabase } = require('../db/supabase');
const { validate, waitlistSchema } = require('../lib/schemas');

const router = express.Router();

function hashIP(req) {
  const raw = (req.headers['x-forwarded-for'] || req.ip || '').toString().split(',')[0].trim();
  if (!raw) return null;
  return crypto.createHash('sha256').update(raw).digest('hex');
}

function detectDevice(ua) {
  if (!ua) return 'desktop';
  if (/mobile|android.*mobile|iphone|ipod/i.test(ua)) return 'mobile';
  if (/tablet|ipad|android(?!.*mobile)/i.test(ua)) return 'tablet';
  return 'desktop';
}

router.post('/', validate(waitlistSchema), async (req, res) => {
  const { email, source, variant, locale } = req.body;

  const sb = getSupabase();
  if (!sb) return res.status(503).json({ error: 'Supabase neconfigurat' });

  try {
    const { data: existing } = await sb
      .from('waitlist')
      .select('id, status')
      .eq('email', email)
      .maybeSingle();

    if (existing) {
      res.cookie('eligibil_waitlist', '1', {
        maxAge: 365 * 24 * 60 * 60 * 1000,
        httpOnly: false,
        sameSite: 'lax',
      });
      if (existing.status === 'confirmed') {
        return res.json({ ok: true, already: true });
      }
      return res.json({ ok: true, id: existing.id });
    }

    const ua = (req.headers['user-agent'] || '').slice(0, 300);

    const { data, error } = await sb.from('waitlist').insert({
      email,
      source,
      variant: variant || null,
      locale,
      ip_hash: hashIP(req),
      user_agent: ua,
      device: detectDevice(ua),
      referrer_url: (req.headers.referer || '').slice(0, 500) || null,
    }).select('id').single();

    if (error) throw error;

    res.cookie('eligibil_waitlist', '1', {
      maxAge: 365 * 24 * 60 * 60 * 1000,
      httpOnly: false,
      sameSite: 'lax',
    });

    res.json({ ok: true, id: data.id });
  } catch (err) {
    console.error('POST /api/waitlist error:', err.message);
    res.status(500).json({ error: 'Eroare internă' });
  }
});

module.exports = router;
