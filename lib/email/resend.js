'use strict';

const { Resend } = require('resend');
const crypto = require('crypto');
const { getSupabase } = require('../../db/supabase');

let _resend = null;
function getResend() {
  if (!_resend) {
    const key = process.env.RESEND_API_KEY;
    if (!key) return null;
    _resend = new Resend(key);
  }
  return _resend;
}

const FROM = process.env.EMAIL_FROM || 'eligibil.org <noreply@eligibil.org>';
const REPLY_TO = process.env.EMAIL_REPLY_TO || 'contact@eligibil.org';
const UNSUB_SECRET = () => process.env.UNSUBSCRIBE_SECRET || 'eligibil-unsub-default-secret';

function makeUnsubToken(email, type) {
  const payload = JSON.stringify({ email, type, exp: Date.now() + 365 * 24 * 60 * 60 * 1000 });
  const hmac = crypto.createHmac('sha256', UNSUB_SECRET()).update(payload).digest('base64url');
  const data = Buffer.from(payload).toString('base64url');
  return `${data}.${hmac}`;
}

function verifyUnsubToken(token) {
  try {
    const [data, hmac] = token.split('.');
    if (!data || !hmac) return null;
    const payload = Buffer.from(data, 'base64url').toString('utf8');
    const expected = crypto.createHmac('sha256', UNSUB_SECRET()).update(payload).digest('base64url');
    if (hmac !== expected) return null;
    const parsed = JSON.parse(payload);
    if (parsed.exp && parsed.exp < Date.now()) return null;
    return parsed;
  } catch { return null; }
}

function unsubscribeUrl(email, type) {
  const base = process.env.BASE_URL || 'https://eligibil.org';
  const token = makeUnsubToken(email, type);
  return `${base}/api/unsubscribe?token=${encodeURIComponent(token)}`;
}

async function logEmail({ recipient, subject, type, language, status, resendId, error }) {
  try {
    const sb = getSupabase();
    if (!sb) return;
    await sb.from('email_logs').insert({
      recipient,
      subject: (subject || '').slice(0, 500),
      type,
      language: language || 'ro',
      status: status || 'sent',
      resend_id: resendId || null,
      error: error ? String(error).slice(0, 1000) : null,
    });
  } catch (e) {
    console.error('email log insert failed:', e.message);
  }
}

async function sendEmail({ to, subject, html, type, language }) {
  const r = getResend();
  if (!r) {
    console.warn(`[email] RESEND_API_KEY not set — skipping ${type} to ${to}`);
    return { ok: false, error: 'no_api_key' };
  }

  let lastErr = null;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const { data, error } = await r.emails.send({
        from: FROM,
        to,
        subject,
        html,
        reply_to: REPLY_TO,
      });

      if (error) throw new Error(error.message || JSON.stringify(error));

      await logEmail({ recipient: to, subject, type, language, status: 'sent', resendId: data?.id });
      return { ok: true, id: data?.id };
    } catch (err) {
      lastErr = err;
      if (attempt < 3) await new Promise(r => setTimeout(r, attempt * 1000));
    }
  }

  console.error(`[email] failed after 3 attempts (${type} → ${to}):`, lastErr?.message);
  await logEmail({ recipient: to, subject, type, language, status: 'failed', error: lastErr?.message });
  return { ok: false, error: lastErr?.message };
}

async function queueEmail({ userId, recipient, type, language, data, scheduledFor }) {
  try {
    const sb = getSupabase();
    if (!sb) return null;
    const { data: row, error } = await sb.from('email_queue').insert({
      user_id: userId || null,
      recipient,
      type,
      language: language || 'ro',
      data: data || null,
      scheduled_for: scheduledFor.toISOString(),
    }).select('id').single();
    if (error) throw error;
    return row?.id;
  } catch (e) {
    console.error('email queue insert failed:', e.message);
    return null;
  }
}

module.exports = { sendEmail, queueEmail, makeUnsubToken, verifyUnsubToken, unsubscribeUrl };
