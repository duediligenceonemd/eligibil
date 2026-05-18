'use strict';

const express = require('express');
const { getSupabase } = require('../db/supabase');
const { reportError } = require('../instrument');
const { feedbackSchema, parseBody } = require('../lib/validation');

const router = express.Router();

router.post('/', async (req, res) => {
  const parsed = parseBody(feedbackSchema, req.body || {});
  if (!parsed.ok) {
    return res.status(400).json({ error: 'Feedback invalid', fields: parsed.error.fieldErrors });
  }

  const sb = getSupabase();
  if (!sb) return res.status(503).json({ error: 'Supabase neconfigurat' });

  const { rating, funding_type_interest, message, page, language } = parsed.data;

  try {
    const { error } = await sb.from('feedback').insert({
      rating,
      funding_type_interest,
      message: message || null,
      page,
      language,
      user_agent: String(req.headers['user-agent'] || '').slice(0, 300),
    });

    if (error) throw error;
    return res.json({ ok: true });
  } catch (err) {
    console.error('POST /api/feedback error:', err.message);
    reportError(err, {
      tags: { area: 'feedback', action: 'create' },
      extra: { page, language, rating, funding_type_interest },
    });
    return res.status(500).json({ error: 'Nu am putut salva feedback-ul' });
  }
});

module.exports = router;
