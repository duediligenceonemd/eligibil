#!/usr/bin/env node
'use strict';

require('dotenv').config();
const { getSupabase } = require('../db/supabase');
const { sendEmail, unsubscribeUrl } = require('../lib/email/resend');
const templates = require('../lib/email/templates');

async function processQueue() {
  const sb = getSupabase();
  if (!sb) { console.error('Supabase not configured'); process.exit(1); }

  const { data: pending, error } = await sb
    .from('email_queue')
    .select('*')
    .eq('status', 'pending')
    .lte('scheduled_for', new Date().toISOString())
    .order('scheduled_for', { ascending: true })
    .limit(50);

  if (error) { console.error('Queue fetch error:', error.message); process.exit(1); }
  if (!pending || !pending.length) { console.log('No pending emails in queue.'); return; }

  console.log(`Processing ${pending.length} queued emails...`);

  for (const item of pending) {
    var unsubUrl = unsubscribeUrl(item.recipient, 'all');
    var opts = { language: item.language || 'ro', unsubscribeUrl: unsubUrl, ...(item.data || {}) };
    var html, subject;

    switch (item.type) {
      case 'onboarding_day3': {
        var grants = [];
        try {
          var { data: g } = await sb.from('grants').select('name, amount, deadline').order('deadline', { ascending: true }).limit(3);
          if (g) grants = g.map(r => ({ title: r.name, amount: r.amount, deadline: r.deadline }));
        } catch {}
        opts.grants = grants;
        html = templates.onboardingDay3(opts);
        subject = templates.T.onboardingDay3.subject[item.language] || templates.T.onboardingDay3.subject.ro;
        break;
      }
      case 'onboarding_day7':
        html = templates.onboardingDay7(opts);
        subject = templates.T.onboardingDay7.subject[item.language] || templates.T.onboardingDay7.subject.ro;
        break;
      case 'deadline_alert': {
        html = templates.deadlineAlert(opts);
        var grant = opts.grant || {};
        var days = opts.days || '?';
        subject = (templates.T.deadlineAlert.subject[item.language] || templates.T.deadlineAlert.subject.ro)
          .replace('{grant}', grant.title || grant.name || '')
          .replace('{days}', days);
        break;
      }
      case 'launch_announcement':
        html = templates.launchAnnouncement(opts);
        subject = templates.T.launch.subject[item.language] || templates.T.launch.subject.ro;
        break;
      default:
        console.warn(`Unknown queue type: ${item.type}, skipping`);
        await sb.from('email_queue').update({ status: 'failed' }).eq('id', item.id);
        continue;
    }

    var result = await sendEmail({ to: item.recipient, subject, html, type: item.type, language: item.language });

    await sb.from('email_queue').update({
      status: result.ok ? 'sent' : 'failed',
      sent_at: result.ok ? new Date().toISOString() : null,
    }).eq('id', item.id);

    console.log(`  ${result.ok ? '✓' : '✗'} ${item.type} → ${item.recipient}`);
  }

  console.log('Queue processing complete.');
}

processQueue().catch(err => { console.error('Fatal:', err); process.exit(1); });
