# Brief 04 — Events SEO: pivot la grant deadlines + agenda externă

**Pentru:** Claude Code
**Working dir:** `C:\Users\Zinaida\ELIGIBIL`
**Durată estimată:** 1-2 zile
**Output:** `/evenimente` (RO) + `/events` (EN) cu trei axe: deadline-uri granturi, conferințe externe, webinarii proprii

---

## Context

Ai deja `events.html` + `components-events.jsx` (525 LOC) cu mock data pentru evenimente. Pagina e bine construită vizual: Hero featured, FeaturedCard, EvRow, EvCard, MapView. Problema: nu aduce trafic SEO real pentru că nu agreghează ceva valoros pentru utilizator real.

**Pivot strategic:**
- 60% din pagină = grant deadlines (din baza de date proprie, automat)
- 30% = conferințe externe (Web Summit, Slush, How to Web, etc. — manual/scraping)
- 10% = webinarii proprii (gol acum, populezi când lansezi)

Asta dă pagini SEO native ("deadline-uri granturi 2026", "evenimente startup România") + un motiv real de revizit săptămânal.

---

## Pas 1 — Schema externă events (3h)

Creează `scripts/supabase-events-schema.sql`:

```sql
CREATE TABLE IF NOT EXISTS events (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identity
  slug_ro         TEXT UNIQUE,
  slug_en         TEXT UNIQUE,
  title           TEXT NOT NULL,
  title_en        TEXT,

  -- Type
  event_type      TEXT NOT NULL CHECK (event_type IN (
    'grant_deadline',     -- generated from grants table (NOT stored, computed)
    'conference',         -- physical conference / summit
    'pitch_event',        -- pitch competition / demo day
    'webinar',            -- online seminar
    'workshop',           -- training
    'networking',         -- mixer / meetup
    'hackathon',          -- competition
    'accelerator_call'    -- accelerator application opens
  )),

  -- When & where
  start_date      TIMESTAMPTZ NOT NULL,
  end_date        TIMESTAMPTZ,
  timezone        TEXT DEFAULT 'Europe/Chisinau',
  is_online       BOOLEAN DEFAULT false,
  city            TEXT,
  country         TEXT,
  venue           TEXT,
  online_url      TEXT,

  -- Content
  description_ro  TEXT,
  description_en  TEXT,
  short_summary_ro TEXT,
  short_summary_en TEXT,
  agenda          JSONB,             -- [{time, title, speaker}]

  -- Organizer
  organizer_name  TEXT,
  organizer_url   TEXT,
  organizer_logo  TEXT,

  -- Pricing
  is_free         BOOLEAN DEFAULT true,
  price_eur       INTEGER,
  registration_url TEXT,

  -- Targeting
  audience        TEXT[],            -- ['founders', 'investors', 'researchers', 'students']
  topics          TEXT[],            -- ['AI', 'biotech', 'climate', ...]
  stages          TEXT[],            -- ['idea', 'mvp', 'pre-seed', 'seed']

  -- Source
  source_url      TEXT,
  source_name     TEXT,
  evidence_status TEXT DEFAULT 'ai_extracted_unverified',

  -- Status
  status          TEXT DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'live', 'past', 'cancelled')),
  is_featured     BOOLEAN DEFAULT false,

  -- Audit
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS events_start_idx ON events (start_date);
CREATE INDEX IF NOT EXISTS events_country_idx ON events (country);
CREATE INDEX IF NOT EXISTS events_type_idx ON events (event_type);
CREATE INDEX IF NOT EXISTS events_topics_idx ON events USING GIN (topics);
CREATE INDEX IF NOT EXISTS events_status_start_idx ON events (status, start_date) WHERE status = 'upcoming';
```

Aplică:
```bash
node scripts/push-schema.js scripts/supabase-events-schema.sql
```

---

## Pas 2 — Seed event-uri externe (4-6h)

Creează `scripts/seed-events.js` cu o listă manuală (~20 evenimente cunoscute pentru regiunea ta):

```javascript
'use strict';
require('dotenv').config();
const { getSupabase } = require('../db/supabase');

const SEED = [
  {
    slug_ro: 'how-to-web-2026',
    slug_en: 'how-to-web-2026',
    title: 'How to Web 2026',
    title_en: 'How to Web 2026',
    event_type: 'conference',
    start_date: '2026-10-08T09:00:00+03:00',
    end_date: '2026-10-09T18:00:00+03:00',
    is_online: false,
    city: 'București',
    country: 'România',
    venue: 'Palatul Parlamentului',
    short_summary_ro: 'Cea mai mare conferință de tech și startup-uri din Europa de Est. 3000+ participanți, 200+ speakeri.',
    short_summary_en: 'Largest tech and startup conference in Eastern Europe. 3000+ attendees, 200+ speakers.',
    organizer_name: 'How to Web',
    organizer_url: 'https://howtoweb.co',
    is_free: false,
    price_eur: 350,
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
    slug_ro: 'web-summit-2026',
    slug_en: 'web-summit-2026',
    title: 'Web Summit 2026',
    event_type: 'conference',
    start_date: '2026-11-09T09:00:00+00:00',
    end_date: '2026-11-12T18:00:00+00:00',
    city: 'Lisabona',
    country: 'Portugalia',
    short_summary_ro: '70K+ participanți, premier global tech event. Aplicații pentru program START.',
    organizer_name: 'Web Summit',
    organizer_url: 'https://websummit.com',
    is_free: false,
    price_eur: 1095,
    registration_url: 'https://websummit.com',
    audience: ['founders', 'investors'],
    topics: ['AI', 'climate', 'fintech', 'deep-tech'],
    stages: ['seed', 'series-a', 'series-b'],
    evidence_status: 'verified_primary',
  },
  {
    slug_ro: 'tekwill-tech-summit-2026',
    title: 'Tekwill Tech Summit 2026',
    event_type: 'conference',
    start_date: '2026-09-15T09:00:00+03:00',
    city: 'Chișinău',
    country: 'Moldova',
    short_summary_ro: 'Cel mai mare eveniment tech din Moldova. Workshop-uri, demo day Tekwill, networking.',
    organizer_name: 'Tekwill',
    organizer_url: 'https://tekwill.md',
    audience: ['founders', 'students', 'researchers'],
    topics: ['AI', 'startup', 'edtech'],
    is_free: true,
    evidence_status: 'verified_primary',
    is_featured: true,
  },
  // ... adaugă 15-20 evenimente:
  // - Slush Helsinki
  // - VivaTech Paris
  // - TechBBQ Copenhagen
  // - Pirate Summit Cologne
  // - Sigma Europe Malta
  // - Startup Ole Spain
  // - EU-Startups Summit
  // - DealRoom Innovation Summit
  // - Innovation Labs Demo Day (RO/MD)
  // - Techsylvania Cluj
  // - TechMatch (RO)
  // - MD Startup Champions
  // - Diaspora Engagement Hub events
  // - EBRD Star Venture pitch nights
  // - EIC Tech.eu events
  // - CESEEcom (Central & Eastern Europe SE)
];

(async () => {
  const sb = getSupabase();
  for (const e of SEED) {
    e.slug_en = e.slug_en || e.slug_ro;
    e.title_en = e.title_en || e.title;
    e.short_summary_en = e.short_summary_en || e.short_summary_ro;
    const { error } = await sb.from('events').upsert(e, { onConflict: 'slug_ro' });
    if (error) console.error(`✗ ${e.slug_ro}:`, error.message);
    else console.log(`✓ ${e.slug_ro}`);
  }
})();
```

Rulează:
```bash
node scripts/seed-events.js
```

---

## Pas 3 — API endpoint (2h)

În `routes/api.js` adaugă (NU în requireAuth — public):

```javascript
// =============================================================================
// GET /api/events — public, pentru pagina /evenimente
// Combină: 1) events table  2) grant deadlines computed from grants table
// =============================================================================

const eventsRouter = express.Router();

eventsRouter.get('/', async (req, res) => {
  const sb = tryGetSupabase();
  if (!sb) return res.json({ events: [], grant_deadlines: [] });

  const { country, type, topic, lang = 'ro' } = req.query;

  // Future events
  let q = sb.from('events')
    .select('*')
    .eq('status', 'upcoming')
    .gte('start_date', new Date().toISOString())
    .order('start_date', { ascending: true })
    .limit(100);

  if (country) q = q.ilike('country', `%${country}%`);
  if (type) q = q.eq('event_type', type);
  if (topic) q = q.contains('topics', [topic]);

  const { data: events } = await q;

  // Grant deadlines as virtual events
  const { data: grants } = await sb
    .from('grants')
    .select('id, slug_ro, slug_en, nume_program, nume_program_en, short_summary_ro, short_summary_en, funder_name, funder_country, deadline, suma_max, sector, tara, application_url, evidence_status')
    .eq('status', 'Activ')
    .not('deadline', 'is', null)
    .limit(100);

  const grantDeadlines = (grants || [])
    .filter(g => isValidFutureDate(g.deadline))
    .map(g => ({
      id: `grant_${g.id}`,
      slug: lang === 'en' ? g.slug_en : g.slug_ro,
      title: lang === 'en' ? (g.nume_program_en || g.nume_program) : g.nume_program,
      summary: lang === 'en' ? g.short_summary_en : g.short_summary_ro,
      event_type: 'grant_deadline',
      start_date: parseDate(g.deadline),
      country: g.funder_country || g.tara,
      organizer_name: g.funder_name,
      max_amount: g.suma_max,
      sector: g.sector,
      url: lang === 'en'
        ? `/en/grants/${g.slug_en}`
        : `/ro/granturi/${g.slug_ro}`,
      external_url: g.application_url,
      evidence_status: g.evidence_status,
    }));

  res.json({ events: events || [], grant_deadlines: grantDeadlines });
});

function isValidFutureDate(deadlineStr) {
  if (!deadlineStr || /rolling/i.test(deadlineStr) || /annual/i.test(deadlineStr)) return false;
  try {
    const d = parseDate(deadlineStr);
    return d && d > new Date();
  } catch { return false; }
}

function parseDate(deadlineStr) {
  // Try ISO first
  let d = new Date(deadlineStr);
  if (!isNaN(d)) return d.toISOString();
  // Try Romanian format "22 Mai 2026"
  const RO_MONTHS = {
    'ian': 0, 'feb': 1, 'mar': 2, 'apr': 3, 'mai': 4, 'iun': 5,
    'iul': 6, 'aug': 7, 'sep': 8, 'oct': 9, 'noi': 10, 'dec': 11
  };
  const m = deadlineStr.match(/(\d+)\s+(\w+)\s+(\d{4})/);
  if (m) {
    const month = RO_MONTHS[m[2].toLowerCase().slice(0, 3)];
    if (month !== undefined) {
      d = new Date(parseInt(m[3]), month, parseInt(m[1]));
      return d.toISOString();
    }
  }
  return null;
}

app.use('/api/events', eventsRouter);
```

În `server.js` mounteaz-o **înainte** de `app.use('/api', requireAuthMiddleware)` ca să fie public.

---

## Pas 4 — Pivot UI events.html (4-6h)

În `components-events.jsx`, înlocuiește `EVENTS = [...]` static cu fetch din API:

```javascript
function EventsApp() {
  const [data, setData] = useState({ events: [], grant_deadlines: [] });
  const [filters, setFilters] = useState({ country: '', type: 'all', topic: '' });

  useEffect(() => {
    const params = new URLSearchParams(filters);
    fetch(`/api/events?${params}`)
      .then(r => r.json())
      .then(setData);
  }, [filters]);

  // Combinăm și sortăm cronologic
  const combined = [
    ...data.grant_deadlines.map(g => ({ ...g, kind: 'deadline' })),
    ...data.events.map(e => ({ ...e, kind: 'event' })),
  ].sort((a, b) => new Date(a.start_date) - new Date(b.start_date));

  // ... restul UI:
  // Hero: 1 featured event manual (sau primul deadline apropiat dacă nu există)
  // Tabs: Toate / Deadline-uri / Conferințe / Webinarii / Pitch events
  // List: cronologic, badge pentru tip ('🎯 Deadline grant' / '📅 Conferință' / etc.)
  // MapView: doar pentru events fizice
  // ...
}
```

**Schimbări UI principale:**

1. **Hero** rămâne, dar primul featured devine deadline-ul cel mai apropiat dacă e <14 zile, altfel cel mai mare conference.

2. **Tabs** noi:
   - Toate
   - Deadline-uri (filter event_type === 'grant_deadline')
   - Conferințe (filter event_type === 'conference')
   - Webinarii & online (is_online === true)
   - Pitch & competiții (event_type IN ['pitch_event', 'hackathon'])

3. **Cards** disting vizual:
   - `grant_deadline` → border navy, badge `🎯 DEADLINE GRANT`, sumă mare, link `/ro/granturi/{slug}`
   - `conference` → border accent, badge `📅 CONFERINȚĂ`, oraș + dată, link extern
   - `webinar` → border verde, badge `💻 ONLINE`, durată, link înregistrare

4. **MapView** filtrează doar evenimente fizice (is_online === false), grupează pe oraș.

---

## Pas 5 — Routing bilingual + SEO (2h)

În `server.js`:

```javascript
app.get('/evenimente', (req, res) => res.sendFile(path.join(__dirname, 'events.html')));
app.get('/events', (req, res) => res.sendFile(path.join(__dirname, 'events.html')));

// Per-event detail (Phase 2 — momentan redirectează la registration_url)
app.get('/evenimente/:slug', async (req, res) => {
  const sb = require('./db/supabase').getSupabase();
  const { data } = await sb.from('events').select('registration_url, source_url').eq('slug_ro', req.params.slug).single();
  if (data?.registration_url) return res.redirect(data.registration_url);
  if (data?.source_url) return res.redirect(data.source_url);
  res.redirect('/evenimente');
});
```

Update `events.html` cu meta tags SEO:

```html
<title>Evenimente startup și deadline-uri granturi · eligibil.org</title>
<meta name="description" content="Calendar live cu deadline-uri pentru granturi, conferințe startup și webinarii pentru fondatori din Moldova, România și UE." />
<link rel="canonical" href="https://eligibil.org/evenimente" />
<link rel="alternate" hreflang="ro" href="https://eligibil.org/evenimente" />
<link rel="alternate" hreflang="en" href="https://eligibil.org/events" />
```

---

## Pas 6 — Update sitemap (30 min)

În `routes/seo.js` (creat în Brief 01), adaugă:

```javascript
// Add events to sitemap
const { data: events } = await sb
  .from('events')
  .select('slug_ro, slug_en, updated_at')
  .eq('status', 'upcoming');

(events || []).forEach(e => {
  if (e.slug_ro) urls.push(`<url><loc>https://eligibil.org/evenimente/${e.slug_ro}</loc><changefreq>weekly</changefreq></url>`);
  if (e.slug_en) urls.push(`<url><loc>https://eligibil.org/events/${e.slug_en}</loc><changefreq>weekly</changefreq></url>`);
});

// Plus listing pages
urls.push(`<url><loc>https://eligibil.org/evenimente</loc><changefreq>daily</changefreq></url>`);
urls.push(`<url><loc>https://eligibil.org/events</loc><changefreq>daily</changefreq></url>`);
```

---

## Pas 7 — Schema.org Event JSON-LD (30 min)

În `events.html`, sub `</head>`, adaugă script care injectează ItemList:

```html
<script>
window.addEventListener('load', async () => {
  const r = await fetch('/api/events');
  const data = await r.json();
  const items = [...data.events, ...data.grant_deadlines].slice(0, 20);
  const json = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    'itemListElement': items.map((e, i) => ({
      '@type': 'ListItem',
      'position': i + 1,
      'item': {
        '@type': e.event_type === 'grant_deadline' ? 'Thing' : 'Event',
        'name': e.title || e.nume_program,
        'startDate': e.start_date,
        'location': e.city || 'Online',
        'url': `https://eligibil.org${e.url || '/evenimente/' + e.slug_ro}`,
      }
    }))
  };
  const s = document.createElement('script');
  s.type = 'application/ld+json';
  s.textContent = JSON.stringify(json);
  document.head.appendChild(s);
});
</script>
```

---

## Definition of Done

- [ ] Schema `events` aplicată
- [ ] 15-20 evenimente seed (conferințe + 1-2 webinarii placeholder)
- [ ] `GET /api/events` returnează deadline-uri din `grants` + events din tabel, sortate cronologic
- [ ] `/evenimente` (RO) și `/events` (EN) afișează combined list
- [ ] Filtre funcționale: country, type, topic
- [ ] Card-urile de deadline grant linkează la `/ro/granturi/{slug}`
- [ ] Card-urile de conferință linkează la sursa externă
- [ ] sitemap.xml include eventele și paginile de listing
- [ ] hreflang corect între RO/EN
- [ ] JSON-LD ItemList prezent

---

## Ce NU faci

- Nu construiești `/evenimente/:slug` ca pagina detaliu (Phase 2 — redirect la URL extern e suficient)
- Nu adaugi Eventbrite/Meetup API integrations (Phase 2)
- Nu permiți users să adauge evenimente (B2B feature, Phase 2)
- Nu storezi imagini event banner (folosește placeholder geometric SVG ca pe homepage)

---

## Rate of update

- Grant deadlines: automat din `grants` table (oricând se updatează un grant)
- Events: manual (rulezi `seed-events.js` cu o lista nouă lunar) sau adaugi formular admin separat
- Status update: cron job `update-event-status.js` care rulează zilnic și marchează `status='past'` evenimentele cu `start_date < now()`

---

*Brief 04 · v1 · sprint Mai 2026*
