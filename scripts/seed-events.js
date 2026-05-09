'use strict';
require('dotenv').config();

// Brief 04 Pas 2 — seed ~15 known external events for the CEE / EU
// startup scene. Idempotent: upserts on slug_ro.
//
// Run after applying scripts/supabase-events-schema.sql:
//   node scripts/seed-events.js
//
// To refresh in the future, edit SEED below and re-run — slug_ro is the
// conflict key, so existing rows get updated rather than duplicated.

const { getSupabase } = require('../db/supabase');

const SEED = [
  // ── Romania ──────────────────────────────────────────────────────────────
  {
    slug_ro: 'how-to-web-2026',
    title: 'How to Web 2026',
    event_type: 'conference',
    start_date: '2026-10-08T09:00:00+03:00',
    end_date:   '2026-10-09T18:00:00+03:00',
    is_online: false,
    city: 'București', country: 'România',
    venue: 'Palatul Parlamentului',
    short_summary_ro: 'Cea mai mare conferință de tech și startup-uri din Europa de Est. 3000+ participanți, 200+ speakeri.',
    short_summary_en: 'Largest tech and startup conference in Eastern Europe. 3000+ attendees, 200+ speakers.',
    organizer_name: 'How to Web',
    organizer_url:  'https://howtoweb.co',
    is_free: false, price_eur: 350,
    registration_url: 'https://howtoweb.co/2026',
    audience: ['founders', 'investors'],
    topics: ['AI', 'startup', 'fintech', 'saas'],
    stages: ['mvp', 'pre-seed', 'seed', 'series-a'],
    source_url: 'https://howtoweb.co/2026',
    source_name: 'How to Web official',
    evidence_status: 'verified_primary',
    is_featured: true,
  },
  {
    slug_ro: 'techsylvania-2026',
    title: 'Techsylvania 2026',
    event_type: 'conference',
    start_date: '2026-06-20T09:00:00+03:00',
    end_date:   '2026-06-21T18:00:00+03:00',
    is_online: false,
    city: 'Cluj-Napoca', country: 'România',
    short_summary_ro: 'Conferință tech anuală în Cluj cu accent pe AI, web3 și SaaS. 1500+ participanți.',
    short_summary_en: 'Annual tech conference in Cluj focused on AI, web3 and SaaS. 1500+ attendees.',
    organizer_name: 'Techsylvania',
    organizer_url:  'https://techsylvania.co',
    is_free: false, price_eur: 250,
    registration_url: 'https://techsylvania.co',
    audience: ['founders', 'investors'],
    topics: ['AI', 'web3', 'saas'],
    evidence_status: 'verified_primary',
  },
  {
    slug_ro: 'bucharest-tech-week-2026',
    title: 'Bucharest Tech Week 2026',
    event_type: 'conference',
    start_date: '2026-05-19T09:00:00+03:00',
    end_date:   '2026-05-23T18:00:00+03:00',
    is_online: false,
    city: 'București', country: 'România',
    short_summary_ro: 'Cea mai mare săptămână tech din Europa de Est: conferințe, workshop-uri, hackathons și expo.',
    short_summary_en: 'Largest tech week in Eastern Europe: conferences, workshops, hackathons and expo.',
    organizer_name: 'Universum Events',
    organizer_url:  'https://www.bucharesttechweek.com',
    is_free: false, price_eur: 195,
    registration_url: 'https://www.bucharesttechweek.com',
    topics: ['AI', 'fintech', 'startup', 'web3'],
    audience: ['founders', 'investors'],
    evidence_status: 'verified_primary',
  },
  {
    slug_ro: 'innovation-labs-demo-day-ro',
    title: 'Innovation Labs Demo Day România',
    event_type: 'pitch_event',
    start_date: '2026-07-15T18:00:00+03:00',
    is_online: false,
    city: 'București', country: 'România',
    short_summary_ro: 'Demo day final al programului Innovation Labs România — startup-uri pre-seed își prezintă produsele.',
    short_summary_en: 'Final demo day of Romania\'s Innovation Labs program — pre-seed startups present their products.',
    organizer_name: 'Innovation Labs',
    organizer_url:  'https://www.innovationlabs.ro',
    is_free: true,
    audience: ['founders', 'investors'],
    topics: ['startup', 'AI', 'fintech', 'edtech'],
    stages: ['idea', 'mvp', 'pre-seed'],
    evidence_status: 'ai_extracted_unverified',
  },

  // ── Moldova ──────────────────────────────────────────────────────────────
  {
    slug_ro: 'tekwill-tech-summit-2026',
    title: 'Tekwill Tech Summit 2026',
    event_type: 'conference',
    start_date: '2026-09-15T09:00:00+03:00',
    end_date:   '2026-09-16T18:00:00+03:00',
    is_online: false,
    city: 'Chișinău', country: 'Moldova',
    venue: 'Tekwill Center',
    short_summary_ro: 'Cel mai mare eveniment tech din Moldova. Workshop-uri, demo day Tekwill, networking cu fonduri și acceleratoare.',
    short_summary_en: 'Largest tech event in Moldova. Workshops, Tekwill demo day, networking with funds and accelerators.',
    organizer_name: 'Tekwill',
    organizer_url:  'https://tekwill.md',
    is_free: true,
    audience: ['founders', 'students', 'researchers'],
    topics: ['AI', 'startup', 'edtech'],
    evidence_status: 'verified_primary',
    is_featured: true,
  },
  {
    slug_ro: 'innovation-labs-demo-day-md',
    title: 'Innovation Labs Demo Day Moldova',
    event_type: 'pitch_event',
    start_date: '2026-09-20T17:00:00+03:00',
    is_online: false,
    city: 'Chișinău', country: 'Moldova',
    venue: 'Tekwill',
    short_summary_ro: 'Demo day pentru cohorta Innovation Labs Moldova. 8-10 startup-uri prezintă în fața unui juriu de investitori.',
    short_summary_en: 'Demo day for Moldova\'s Innovation Labs cohort. 8-10 startups pitch in front of a panel of investors.',
    organizer_name: 'Innovation Labs Moldova',
    is_free: true,
    audience: ['founders', 'investors'],
    stages: ['idea', 'mvp'],
    evidence_status: 'ai_extracted_unverified',
  },
  {
    slug_ro: 'md-startup-champions-2026',
    title: 'MD Startup Champions 2026',
    event_type: 'pitch_event',
    start_date: '2026-11-12T18:00:00+02:00',
    is_online: false,
    city: 'Chișinău', country: 'Moldova',
    short_summary_ro: 'Competiție națională de startup-uri din Moldova cu premii și acces la programe internaționale de accelerare.',
    short_summary_en: 'National Moldovan startup competition with prizes and access to international accelerator programs.',
    organizer_name: 'ODIMM',
    organizer_url: 'https://odimm.md',
    is_free: true,
    audience: ['founders'],
    stages: ['idea', 'mvp', 'pre-seed'],
    evidence_status: 'ai_extracted_unverified',
  },

  // ── Wider EU ─────────────────────────────────────────────────────────────
  {
    slug_ro: 'web-summit-2026',
    title: 'Web Summit 2026',
    event_type: 'conference',
    start_date: '2026-11-09T09:00:00+00:00',
    end_date:   '2026-11-12T18:00:00+00:00',
    is_online: false,
    city: 'Lisabona', country: 'Portugalia',
    short_summary_ro: '70K+ participanți, premier global tech event. Aplicații pentru program START dedicate startup-urilor early-stage.',
    short_summary_en: '70K+ attendees, premier global tech event. START program applications dedicated to early-stage startups.',
    organizer_name: 'Web Summit',
    organizer_url:  'https://websummit.com',
    is_free: false, price_eur: 1095,
    registration_url: 'https://websummit.com',
    audience: ['founders', 'investors'],
    topics: ['AI', 'climate', 'fintech', 'deep-tech'],
    stages: ['seed', 'series-a', 'series-b'],
    evidence_status: 'verified_primary',
  },
  {
    slug_ro: 'slush-2026',
    title: 'Slush 2026',
    event_type: 'conference',
    start_date: '2026-11-19T09:00:00+02:00',
    end_date:   '2026-11-20T18:00:00+02:00',
    is_online: false,
    city: 'Helsinki', country: 'Finlanda',
    short_summary_ro: 'Una dintre cele mai mari conferințe tech din Europa. Networking premium cu fonduri Tier-1 și founders nordici.',
    short_summary_en: 'One of Europe\'s largest tech conferences. Premium networking with Tier-1 funds and Nordic founders.',
    organizer_name: 'Slush',
    organizer_url:  'https://slush.org',
    is_free: false, price_eur: 1095,
    registration_url: 'https://slush.org',
    audience: ['founders', 'investors'],
    topics: ['AI', 'climate', 'deep-tech', 'fintech'],
    stages: ['seed', 'series-a'],
    evidence_status: 'verified_primary',
  },
  {
    slug_ro: 'vivatech-2026',
    title: 'VivaTech 2026',
    event_type: 'conference',
    start_date: '2026-06-11T09:00:00+02:00',
    end_date:   '2026-06-13T18:00:00+02:00',
    is_online: false,
    city: 'Paris', country: 'Franța',
    short_summary_ro: 'Cel mai mare eveniment tech din Europa: 150K+ participanți, 13K+ startup-uri, fonduri din întreaga lume.',
    short_summary_en: 'Europe\'s largest tech event: 150K+ attendees, 13K+ startups, funds from around the world.',
    organizer_name: 'Viva Technology',
    organizer_url:  'https://vivatechnology.com',
    is_free: false, price_eur: 880,
    registration_url: 'https://vivatechnology.com',
    audience: ['founders', 'investors'],
    topics: ['AI', 'climate', 'deep-tech', 'mobility'],
    evidence_status: 'verified_primary',
  },
  {
    slug_ro: 'techbbq-2026',
    title: 'TechBBQ 2026',
    event_type: 'conference',
    start_date: '2026-09-09T09:00:00+02:00',
    end_date:   '2026-09-10T18:00:00+02:00',
    is_online: false,
    city: 'Copenhaga', country: 'Danemarca',
    short_summary_ro: 'Conferința ecosistemului nordic de startup-uri. Network access la fonduri scandinave și Tier-1 europene.',
    short_summary_en: 'Nordic startup ecosystem conference. Network access to Scandinavian funds and European Tier-1 VCs.',
    organizer_name: 'TechBBQ',
    organizer_url:  'https://techbbq.dk',
    is_free: false, price_eur: 695,
    registration_url: 'https://techbbq.dk',
    audience: ['founders', 'investors'],
    evidence_status: 'verified_primary',
  },
  {
    slug_ro: 'pirate-summit-2026',
    title: 'Pirate Summit 2026',
    event_type: 'conference',
    start_date: '2026-09-03T09:00:00+02:00',
    end_date:   '2026-09-04T22:00:00+02:00',
    is_online: false,
    city: 'Köln', country: 'Germania',
    short_summary_ro: 'Conferință cu vibe rebel pentru founders early-stage. Renumită pentru party-uri și deal-flow autentic.',
    short_summary_en: 'Rebel-vibe conference for early-stage founders. Famous for parties and authentic deal-flow.',
    organizer_name: 'Pirate Summit',
    organizer_url:  'https://piratesummit.com',
    is_free: false, price_eur: 599,
    registration_url: 'https://piratesummit.com',
    audience: ['founders', 'investors'],
    stages: ['idea', 'mvp', 'pre-seed', 'seed'],
    evidence_status: 'verified_primary',
  },
  {
    slug_ro: 'eu-startups-summit-2026',
    title: 'EU-Startups Summit 2026',
    event_type: 'conference',
    start_date: '2026-04-23T09:00:00+02:00',
    end_date:   '2026-04-24T18:00:00+02:00',
    is_online: false,
    city: 'Malta', country: 'Malta',
    short_summary_ro: 'Conferință european-startup focused. Pitch competition pentru founders early-stage cu premii și conexiuni la fonduri UE.',
    short_summary_en: 'European-startup focused conference. Pitch competition for early-stage founders with prizes and EU fund connections.',
    organizer_name: 'EU-Startups',
    organizer_url:  'https://www.eu-startups.com/summit/',
    is_free: false, price_eur: 449,
    registration_url: 'https://www.eu-startups.com/summit/',
    audience: ['founders', 'investors'],
    stages: ['mvp', 'pre-seed', 'seed'],
    evidence_status: 'verified_primary',
  },

  // ── Online webinars / accelerator calls (placeholders, evidence flagged low) ─
  {
    slug_ro: 'eic-accelerator-q&a-2026',
    title: 'EIC Accelerator — Q&A live cu evaluator',
    event_type: 'webinar',
    start_date: '2026-05-15T15:00:00+03:00',
    is_online: true,
    online_url: 'https://eic.ec.europa.eu',
    short_summary_ro: 'Webinar oficial EIC: cum e structurată evaluarea Stage 1 și ce caută evaluatorii. Q&A live cu participanții.',
    short_summary_en: 'Official EIC webinar: how Stage 1 evaluation is structured and what evaluators look for. Live Q&A with participants.',
    organizer_name: 'European Innovation Council',
    organizer_url: 'https://eic.ec.europa.eu',
    is_free: true,
    audience: ['founders'],
    topics: ['deep-tech', 'AI'],
    stages: ['pre-seed', 'seed', 'series-a'],
    evidence_status: 'hypothesis',
  },
  {
    slug_ro: 'startup-moldova-info-session-2026',
    title: 'Startup Moldova Grant — sesiune info',
    event_type: 'webinar',
    start_date: '2026-06-05T17:00:00+03:00',
    is_online: true,
    short_summary_ro: 'Sesiune informativă online despre programul Startup Moldova: criterii eligibilitate, documente, deadline.',
    short_summary_en: 'Online info session about the Startup Moldova program: eligibility criteria, documents, deadline.',
    organizer_name: 'ODIMM',
    organizer_url: 'https://odimm.md',
    is_free: true,
    audience: ['founders'],
    stages: ['idea', 'mvp'],
    evidence_status: 'hypothesis',
  },
];

(async () => {
  let sb;
  try { sb = getSupabase(); }
  catch (e) {
    console.error('✗ Supabase not configured:', e.message);
    process.exit(1);
  }

  console.log(`Seeding ${SEED.length} events...\n`);
  let ok = 0, fail = 0;

  for (const e of SEED) {
    // Defaults: slug_en falls back to slug_ro; title_en to title; etc.
    const row = {
      ...e,
      slug_en:          e.slug_en          || e.slug_ro,
      title_en:         e.title_en         || e.title,
      short_summary_en: e.short_summary_en || e.short_summary_ro,
      description_en:   e.description_en   || e.description_ro,
    };
    const { error } = await sb.from('events').upsert(row, { onConflict: 'slug_ro' });
    if (error) {
      console.error(`✗ ${e.slug_ro}: ${error.message}`);
      fail++;
    } else {
      console.log(`✓ ${e.slug_ro}`);
      ok++;
    }
  }

  console.log(`\nDone. ${ok} succeeded, ${fail} failed.`);
})().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
