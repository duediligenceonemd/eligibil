'use strict';

/**
 * routes/events.js — public events API
 *
 * GET /api/events?country=…&type=…&topic=…&lang=ro
 *   Returns: { events: [...], grant_deadlines: [...] }
 *   - events: rows from public.events table (status='upcoming', start_date >= now)
 *   - grant_deadlines: virtual events computed from grants.deadline
 *
 * GET /api/events/:slug
 *   Returns the single event row, or 404.
 */

const express = require('express');
const { getSupabase } = require('../db/supabase');

const router = express.Router();

const RO_MONTHS = {
  'ian': 0, 'feb': 1, 'mar': 2, 'apr': 3, 'mai': 4, 'iun': 5,
  'iul': 6, 'aug': 7, 'sep': 8, 'oct': 9, 'noi': 10, 'dec': 11,
  // Full names too
  'ianuarie': 0, 'februarie': 1, 'martie': 2, 'aprilie': 3, 'iunie': 5,
  'iulie': 6, 'august': 7, 'septembrie': 8, 'octombrie': 9,
  'noiembrie': 10, 'decembrie': 11,
};

function parseDate(deadlineStr) {
  if (!deadlineStr) return null;
  // ISO
  let d = new Date(deadlineStr);
  if (!isNaN(d.getTime())) return d.toISOString();
  // Romanian: "22 Mai 2026" or "22 mai 2026"
  const m = String(deadlineStr).match(/(\d{1,2})\s+(\w+)\s+(\d{4})/);
  if (m) {
    const month = RO_MONTHS[m[2].toLowerCase().slice(0, 9)] ?? RO_MONTHS[m[2].toLowerCase().slice(0, 3)];
    if (month !== undefined) {
      d = new Date(Date.UTC(parseInt(m[3]), month, parseInt(m[1])));
      return d.toISOString();
    }
  }
  return null;
}

function isValidFutureDate(deadlineStr) {
  if (!deadlineStr || /rolling|annual|continuu|continuous/i.test(deadlineStr)) return false;
  const iso = parseDate(deadlineStr);
  if (!iso) return false;
  return new Date(iso) > new Date();
}

router.get('/', async (req, res) => {
  const sb = getSupabase();
  if (!sb) return res.json({ events: [], grant_deadlines: [] });

  const { country, type, topic, lang = 'ro' } = req.query;

  try {
    let q = sb.from('events')
      .select('*')
      .eq('status', 'upcoming')
      .gte('start_date', new Date().toISOString())
      .order('start_date', { ascending: true })
      .limit(100);

    if (country) q = q.ilike('country', `%${country}%`);
    if (type)    q = q.eq('event_type', type);
    if (topic)   q = q.contains('topics', [topic]);

    const { data: events, error } = await q;
    if (error) console.error('events query error:', error.message);

    // Grant deadlines as virtual events
    const { data: grants } = await sb
      .from('grants')
      .select('id, slug_ro, slug_en, nume_program, nume_program_en, short_summary_ro, short_summary_en, funder_name, funder_country, deadline, suma_max, sector, tara, application_url, evidence_status')
      .eq('status', 'Activ')
      .not('deadline', 'is', null)
      .limit(150);

    const grantDeadlines = (grants || [])
      .filter(g => isValidFutureDate(g.deadline))
      .map(g => ({
        id:           `grant_${g.id}`,
        slug:         lang === 'en' ? g.slug_en : g.slug_ro,
        title:        lang === 'en' ? (g.nume_program_en || g.nume_program) : g.nume_program,
        summary:      lang === 'en' ? (g.short_summary_en || g.short_summary_ro) : g.short_summary_ro,
        event_type:   'grant_deadline',
        start_date:   parseDate(g.deadline),
        country:      g.funder_country || g.tara,
        organizer_name: g.funder_name,
        max_amount:   g.suma_max,
        sector:       g.sector,
        url:          lang === 'en'
                        ? `/en/grants/${g.slug_en}`
                        : `/ro/granturi/${g.slug_ro}`,
        external_url: g.application_url,
        evidence_status: g.evidence_status,
      }))
      .sort((a, b) => new Date(a.start_date) - new Date(b.start_date));

    res.json({ events: events || [], grant_deadlines: grantDeadlines });
  } catch (err) {
    console.error('GET /api/events error:', err);
    res.status(500).json({ error: err.message });
  }
});

router.get('/:slug', async (req, res) => {
  const sb = getSupabase();
  if (!sb) return res.status(503).json({ error: 'Supabase neconfigurat' });
  const { data, error } = await sb.from('events')
    .select('*')
    .or(`slug_ro.eq.${req.params.slug},slug_en.eq.${req.params.slug}`)
    .maybeSingle();
  if (error) return res.status(500).json({ error: error.message });
  if (!data) return res.status(404).json({ error: 'Not found' });
  res.json(data);
});

module.exports = router;
