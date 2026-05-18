#!/usr/bin/env node
'use strict';

require('dotenv').config();
const { getSupabase } = require('../db/supabase');
const { sendEmail, unsubscribeUrl } = require('../lib/email/resend');
const templates = require('../lib/email/templates');

function formatDate(lang) {
  var d = new Date();
  var months = {
    ro: ['Ianuarie','Februarie','Martie','Aprilie','Mai','Iunie','Iulie','August','Septembrie','Octombrie','Noiembrie','Decembrie'],
    en: ['January','February','March','April','May','June','July','August','September','October','November','December'],
  };
  var m = (months[lang] || months.ro)[d.getMonth()];
  return d.getDate() + ' ' + m + ' ' + d.getFullYear();
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function sendNewsletter() {
  var sb = getSupabase();
  if (!sb) { console.error('Supabase not configured'); process.exit(1); }

  var now = new Date();
  var twoWeeks = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
  var oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  var { data: expiring } = await sb.from('grants')
    .select('name, amount, deadline, slug_ro')
    .gte('deadline', now.toISOString().split('T')[0])
    .lte('deadline', twoWeeks.toISOString().split('T')[0])
    .order('deadline', { ascending: true })
    .limit(3);

  var { data: newGrants } = await sb.from('grants')
    .select('name, amount, deadline, slug_ro, created_at')
    .gte('created_at', oneWeekAgo.toISOString())
    .order('created_at', { ascending: false })
    .limit(5);

  var base = process.env.BASE_URL || 'https://eligibil.org';
  function mapGrant(g) {
    return { title: g.name, amount: g.amount, deadline: g.deadline, url: g.slug_ro ? (base + '/grant/' + g.slug_ro) : base + '/search' };
  }

  var expiringList = (expiring || []).map(mapGrant);
  var newGrantsList = (newGrants || []).map(mapGrant);

  if (!expiringList.length && !newGrantsList.length) {
    console.log('No grants to include in newsletter, skipping.');
    return;
  }

  var { data: subscribers, error } = await sb.from('newsletter_subscribers')
    .select('email')
    .eq('status', 'active');

  if (error) { console.error('Fetch subscribers error:', error.message); process.exit(1); }
  if (!subscribers || !subscribers.length) { console.log('No active subscribers.'); return; }

  console.log(`Sending newsletter to ${subscribers.length} subscribers...`);
  console.log(`  Expiring soon: ${expiringList.length} grants`);
  console.log(`  New this week: ${newGrantsList.length} grants`);

  var batchSize = 50;
  var sent = 0;
  var failed = 0;

  for (var i = 0; i < subscribers.length; i += batchSize) {
    var batch = subscribers.slice(i, i + batchSize);

    var promises = batch.map(function(sub) {
      var lang = 'ro';
      var date = formatDate(lang);
      var subject = (templates.T.newsletterWeekly.subject[lang] || templates.T.newsletterWeekly.subject.ro).replace('{date}', date);
      var html = templates.newsletterWeekly({
        language: lang,
        date: date,
        expiring: expiringList,
        newGrants: newGrantsList,
        unsubscribeUrl: unsubscribeUrl(sub.email, 'newsletter'),
      });
      return sendEmail({ to: sub.email, subject: subject, html: html, type: 'newsletter_weekly', language: lang });
    });

    var results = await Promise.all(promises);
    results.forEach(function(r) { if (r.ok) sent++; else failed++; });

    if (i + batchSize < subscribers.length) await sleep(1000);
  }

  console.log(`Newsletter complete: ${sent} sent, ${failed} failed out of ${subscribers.length} total.`);
}

sendNewsletter().catch(function(err) { console.error('Fatal:', err); process.exit(1); });
