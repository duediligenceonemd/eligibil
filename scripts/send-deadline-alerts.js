#!/usr/bin/env node
'use strict';

require('dotenv').config();

const { getSupabase } = require('../db/supabase');
const { queueEmail } = require('../lib/email/resend');
const templates = require('../lib/email/templates');

const ALERT_DAYS = String(process.env.DEADLINE_ALERT_DAYS || '14,7,3')
  .split(',')
  .map((value) => Number(String(value).trim()))
  .filter((value) => Number.isInteger(value) && value > 0)
  .sort((a, b) => b - a);

function dateOnly(date) {
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

function addDays(base, days) {
  const next = new Date(base);
  next.setDate(next.getDate() + days);
  return next;
}

function daysUntil(deadline) {
  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const end = new Date(deadline.getFullYear(), deadline.getMonth(), deadline.getDate());
  return Math.round((end.getTime() - start.getTime()) / 86400000);
}

function buildGrantUrl(grant) {
  const base = String(process.env.BASE_URL || 'https://eligibil.org').replace(/\/+$/, '');
  if (grant.slug_ro) return `${base}/ro/granturi/${grant.slug_ro}`;
  return `${base}/search`;
}

function buildGrantPayload(grant) {
  return {
    id: grant.id,
    title: grant.nume_program || grant.name || 'Grant',
    amount: grant.suma_max ? `€${Number(grant.suma_max).toLocaleString('en-US')}` : null,
    deadline: grant.deadline,
    description: grant.short_summary_ro || grant.short_summary_en || grant.short_summary || '',
    url: buildGrantUrl(grant),
  };
}

function buildSubject(language, grantTitle, days) {
  return (templates.T.deadlineAlert.subject[language] || templates.T.deadlineAlert.subject.ro)
    .replace('{grant}', grantTitle)
    .replace('{days}', String(days));
}

function queueKey(recipient, grantId, days) {
  return `${recipient}::${grantId}::${days}`;
}

async function loadExistingAlerts(sb) {
  const pendingKeys = new Set();
  const sentKeys = new Set();

  const { data: queued } = await sb
    .from('email_queue')
    .select('recipient, type, data, status')
    .eq('type', 'deadline_alert')
    .in('status', ['pending', 'sent']);

  for (const item of queued || []) {
    const grantId = item?.data?.grant?.id || item?.data?.grantId || null;
    const days = Number(item?.data?.days || 0);
    if (!item.recipient || !grantId || !days) continue;
    pendingKeys.add(queueKey(item.recipient, grantId, days));
  }

  const { data: logs } = await sb
    .from('email_logs')
    .select('recipient, subject, type')
    .eq('type', 'deadline_alert');

  for (const item of logs || []) {
    if (!item.recipient || !item.subject) continue;
    sentKeys.add(`${item.recipient}::${item.subject}`);
  }

  return { pendingKeys, sentKeys };
}

async function sendDeadlineAlerts() {
  const sb = getSupabase();
  if (!sb) {
    console.error('Supabase not configured');
    process.exit(1);
  }

  const today = new Date();
  const maxDays = ALERT_DAYS.length ? ALERT_DAYS[0] : 14;
  const windowStart = dateOnly(today);
  const windowEnd = dateOnly(addDays(today, maxDays));

  const { pendingKeys, sentKeys } = await loadExistingAlerts(sb);

  const { data: saved, error } = await sb
    .from('saved_grants')
    .select('user_id, grant_id, profiles!saved_grants_user_id_fkey(id, email), grants!saved_grants_grant_id_fkey(id, nume_program, slug_ro, suma_max, deadline, short_summary_ro, short_summary_en, status)')
    .gte('grants.deadline', windowStart)
    .lte('grants.deadline', windowEnd)
    .eq('grants.status', 'Activ');

  if (error) {
    console.error('Failed to load saved grants for alerts:', error.message);
    process.exit(1);
  }

  let queuedCount = 0;
  let skippedCount = 0;

  for (const row of saved || []) {
    const user = row.profiles;
    const grant = row.grants;

    if (!user?.email || !grant?.deadline || !grant?.id) {
      skippedCount++;
      continue;
    }

    const days = daysUntil(new Date(grant.deadline));
    if (!ALERT_DAYS.includes(days)) {
      skippedCount++;
      continue;
    }

    const subject = buildSubject('ro', grant.nume_program || 'Grant', days);
    const dedupeKey = queueKey(user.email, grant.id, days);
    const sentKey = `${user.email}::${subject}`;

    if (pendingKeys.has(dedupeKey) || sentKeys.has(sentKey)) {
      skippedCount++;
      continue;
    }

    const payload = {
      days,
      grantId: grant.id,
      grant: buildGrantPayload(grant),
    };

    const queuedId = await queueEmail({
      userId: row.user_id,
      recipient: user.email,
      type: 'deadline_alert',
      language: 'ro',
      data: payload,
      scheduledFor: new Date(),
    });

    if (queuedId) {
      pendingKeys.add(dedupeKey);
      queuedCount++;
      console.log(`Queued ${days}-day alert for ${user.email} → ${grant.nume_program}`);
    } else {
      skippedCount++;
    }
  }

  console.log(`Deadline alerts complete: ${queuedCount} queued, ${skippedCount} skipped.`);
}

sendDeadlineAlerts().catch((err) => {
  console.error('Fatal deadline alert error:', err);
  process.exit(1);
});
