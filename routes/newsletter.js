'use strict';

const express = require('express');
const crypto = require('crypto');
const { getSupabase } = require('../db/supabase');
const { reportError } = require('../instrument');
const { newsletterSchema, parseBody } = require('../lib/validation');
const { sendEmail, unsubscribeUrl } = require('../lib/email/resend');
const { newsletterConfirm, T } = require('../lib/email/templates');

const router = express.Router();

router.post('/subscribe', async (req, res) => {
  const parsed = parseBody(newsletterSchema, req.body || {});
  if (!parsed.ok) {
    return res.status(400).json({ error: 'Adresă de email invalidă', fields: parsed.error.fieldErrors });
  }

  const { email, context } = parsed.data;
  const sb = getSupabase();
  if (!sb) return res.status(503).json({ error: 'Supabase neconfigurat' });

  try {
    const { data: existing } = await sb
      .from('newsletter_subscribers')
      .select('id, status')
      .eq('email', email)
      .maybeSingle();

    if (existing) {
      if (existing.status === 'active') return res.status(409).json({ ok: true, deduped: true });
      return res.json({ ok: true, pending: true });
    }

    const confirmToken = crypto.randomBytes(32).toString('hex');

    const { error } = await sb.from('newsletter_subscribers').insert({
      email,
      context,
      status: 'pending',
      confirm_token: confirmToken,
      ip: (req.headers['x-forwarded-for'] || req.ip || '').toString().slice(0, 64),
      user_agent: (req.headers['user-agent'] || '').slice(0, 200),
    });
    if (error) throw error;

    var base = process.env.BASE_URL || 'https://eligibil.org';
    var confirmUrl = base + '/api/newsletter/confirm/' + confirmToken;
    var lang = 'ro';

    sendEmail({
      to: email,
      subject: (T.newsletterConfirm.subject[lang] || T.newsletterConfirm.subject.ro),
      html: newsletterConfirm({ language: lang, confirmUrl: confirmUrl }),
      type: 'newsletter_confirm',
      language: lang,
    }).catch(() => {});

    res.json({ ok: true });
  } catch (err) {
    console.error('POST /api/newsletter/subscribe error:', err.message);
    reportError(err, {
      tags: { area: 'newsletter', action: 'subscribe' },
      extra: { context },
    });
    res.status(500).json({ error: 'Eroare internă de server' });
  }
});

router.get('/confirm/:token', async (req, res) => {
  const { token } = req.params;
  if (!token || token.length < 32) return res.status(400).send('Token invalid');

  const sb = getSupabase();
  if (!sb) return res.status(503).send('Serviciu indisponibil');

  try {
    const { data, error } = await sb
      .from('newsletter_subscribers')
      .update({ status: 'active', confirmed_at: new Date().toISOString() })
      .eq('confirm_token', token)
      .select('email')
      .single();

    if (error || !data) return res.status(404).send('Token invalid sau expirat');

    res.send('<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Confirmat!</title><style>body{font-family:Arial,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#f7f5f0;color:#0e1620;text-align:center;}div{padding:40px;max-width:400px;}.check{font-size:48px;margin-bottom:16px;}h1{font-size:24px;margin:0 0 8px;}p{color:#6a7381;font-size:15px;margin:0 0 24px;}a{display:inline-block;padding:12px 24px;background:#0e1620;color:#f7f5f0;text-decoration:none;font-weight:500;}</style></head><body><div><div class="check">✓</div><h1>Email confirmat!</h1><p>Abonarea ta la newsletter-ul eligibil.org a fost confirmată.</p><a href="/">Înapoi la eligibil.org</a></div></body></html>');
  } catch (err) {
    console.error('Newsletter confirm error:', err.message);
    res.status(500).send('Eroare internă');
  }
});

module.exports = router;
