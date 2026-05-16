'use strict';

// POST /api/newsletter/subscribe { email, context }
// Stores subscription in Supabase `newsletter_subscribers`.
// Returns 200 on success, 409 if already subscribed, 400 on bad email.

const express = require('express');
const { getSupabase } = require('../db/supabase');
const { validate, newsletterSchema } = require('../lib/schemas');

const router = express.Router();

router.post('/subscribe', validate(newsletterSchema), async (req, res) => {
  const { email, context } = req.body;

  const sb = getSupabase();
  if (!sb) return res.status(503).json({ error: 'Supabase neconfigurat' });

  try {
    // Insert with upsert-like behavior: if exists, return 409.
    const { data: existing } = await sb
      .from('newsletter_subscribers')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (existing) return res.status(409).json({ ok: true, deduped: true });

    const { error } = await sb.from('newsletter_subscribers').insert({
      email,
      context,
      ip:        (req.headers['x-forwarded-for'] || req.ip || '').toString().slice(0, 64),
      user_agent: (req.headers['user-agent'] || '').slice(0, 200),
    });
    if (error) throw error;

    res.json({ ok: true });
  } catch (err) {
    console.error('POST /api/newsletter/subscribe error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
