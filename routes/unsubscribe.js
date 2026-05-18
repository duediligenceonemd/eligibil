'use strict';

const express = require('express');
const { getSupabase } = require('../db/supabase');
const { verifyUnsubToken } = require('../lib/email/resend');

const router = express.Router();

router.get('/', async (req, res) => {
  const { token } = req.query;
  if (!token) return res.status(400).send('Token lipsă');

  const payload = verifyUnsubToken(token);
  if (!payload || !payload.email) return res.status(400).send('Token invalid sau expirat');

  const sb = getSupabase();
  if (!sb) return res.status(503).send('Serviciu indisponibil');

  const { email, type } = payload;

  try {
    if (type === 'newsletter' || type === 'all') {
      await sb.from('newsletter_subscribers')
        .update({ status: 'unsubscribed' })
        .eq('email', email);
    }

    if (type === 'waitlist' || type === 'all') {
      await sb.from('waitlist')
        .update({ status: 'unsubscribed', unsubscribed_at: new Date().toISOString() })
        .eq('email', email);
    }

    res.send('<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Dezabonat</title><style>body{font-family:Arial,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#f7f5f0;color:#0e1620;text-align:center;}div{padding:40px;max-width:440px;}h1{font-size:24px;margin:0 0 8px;}p{color:#6a7381;font-size:15px;margin:0 0 24px;line-height:1.5;}a{display:inline-block;padding:12px 24px;background:#0e1620;color:#f7f5f0;text-decoration:none;font-weight:500;}</style></head><body><div><h1>Te-ai dezabonat</h1><p>Nu vei mai primi emailuri de la eligibil.org. Ne pare rău să te vedem plecând.</p><a href="/">Înapoi la eligibil.org</a></div></body></html>');
  } catch (err) {
    console.error('Unsubscribe error:', err.message);
    res.status(500).send('Eroare internă');
  }
});

module.exports = router;
