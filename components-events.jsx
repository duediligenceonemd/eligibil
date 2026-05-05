// Events page
const { useState, useMemo, useEffect } = React;

// ========== DATA ==========
const EVENTS = [];  // initial empty — populated via /api/events fetch in EventsApp

const TYPES = [
  { id: 'all', name: 'Toate' },
  { id: 'grant_deadline', name: 'Deadline-uri granturi' },
  { id: 'hackathon', name: 'Hackathons' },
  { id: 'workshop', name: 'Workshops' },
  { id: 'conference', name: 'Conferințe' },
  { id: 'pitch', name: 'Pitch Nights' },
  { id: 'demo-day', name: 'Demo Days' },
  { id: 'webinar', name: 'Webinarii' },
  { id: 'networking', name: 'Networking' },
];

const COUNTRIES = [
  { id: 'all', name: 'Toate țările', flag: '🌐' },
  { id: 'MD', name: 'Moldova', flag: '🇲🇩' },
  { id: 'RO', name: 'România', flag: '🇷🇴' },
  { id: 'BG', name: 'Bulgaria', flag: '🇧🇬' },
  { id: 'PL', name: 'Polonia', flag: '🇵🇱' },
  { id: 'EU', name: 'EU / Online', flag: '🇪🇺' },
  { id: 'BR', name: 'Global', flag: '🌍' },
];

const FORMATS = [
  { id: 'all', name: 'Toate' },
  { id: 'online', name: 'Online' },
  { id: 'offline', name: 'In-person' },
  { id: 'hybrid', name: 'Hibrid' },
];

const PARTNERS = [
  { name: 'Tekwill', sub: 'MD · Accelerator' },
  { name: 'EIC', sub: 'EU · Programme' },
  { name: 'Startup Blink', sub: 'RO · Community' },
  { name: 'ClujHub', sub: 'RO · Coworking' },
  { name: 'Impact Hub', sub: 'RO · Network' },
  { name: 'InnoEnergy', sub: 'EU · Climate' },
  { name: 'AGEPI', sub: 'MD · Gov' },
  { name: 'GapMinder', sub: 'RO · VC' },
  { name: 'Early Game', sub: 'CEE · VC' },
  { name: 'Atomico', sub: 'EU · VC' },
  { name: 'EIT Digital', sub: 'EU · Programme' },
  { name: 'Women in Tech', sub: 'CEE · Community' },
];

// Brief 04 — country / flag map for normalizing API rows back to the UI's id-based country chips
const COUNTRY_MAP = {
  'Moldova':'MD','Republica Moldova':'MD',
  'România':'RO','Romania':'RO',
  'Bulgaria':'BG','Polonia':'PL','Poland':'PL',
  'Portugalia':'EU','Finlanda':'EU','Franța':'EU','Germania':'EU','Danemarca':'EU','Malta':'EU',
  'Ucraina':'UA','Ukraine':'UA',
  'EU':'EU','UE':'EU',
};
const COUNTRY_FLAG = {
  MD:'🇲🇩', RO:'🇷🇴', BG:'🇧🇬',
  PL:'🇵🇱', UA:'🇺🇦', EU:'🇪🇺', BR:'🌍',
};
function flagFor(c) { return COUNTRY_FLAG[c] || '🌐'; }
function _initials(name) {
  return (name || '?').split(/s+/).map(s => s[0]).filter(Boolean).join('').slice(0, 3).toUpperCase();
}

const RO_MONTH_NAMES = ['Ianuarie','Februarie','Martie','Aprilie','Mai','Iunie','Iulie','August','Septembrie','Octombrie','Noiembrie','Decembrie'];
const RO_MONTH_SHORT = ['Ian','Feb','Mar','Apr','Mai','Iun','Iul','Aug','Sep','Oct','Noi','Dec'];

function _datesFrom(startIso, endIso) {
  const d = new Date(startIso);
  if (isNaN(d)) return { day:'??', month:'??', monthFull:'TBA', year:'', date:'TBA', time:'' };
  const day = String(d.getUTCDate()).padStart(2, '0');
  const month = RO_MONTH_SHORT[d.getUTCMonth()];
  const monthFull = RO_MONTH_NAMES[d.getUTCMonth()] + ' ' + d.getUTCFullYear();
  const year = String(d.getUTCFullYear());
  let date = d.getUTCDate() + ' ' + month + ' ' + year;
  if (endIso) {
    const e = new Date(endIso);
    if (!isNaN(e) && (e.getUTCDate() !== d.getUTCDate() || e.getUTCMonth() !== d.getUTCMonth())) {
      date = d.getUTCDate() + '–' + e.getUTCDate() + ' ' + month + ' ' + year;
    }
  }
  const hh = String(d.getUTCHours()).padStart(2, '0');
  const mm = String(d.getUTCMinutes()).padStart(2, '0');
  const time = (hh === '00' && mm === '00') ? '' : (hh + ':' + mm);
  return { day, month, monthFull, year, date, time };
}

function _normalizeEvent(e) {
  const cc = COUNTRY_MAP[e.country] || (e.country || 'EU').slice(0, 2).toUpperCase();
  const dates = _datesFrom(e.start_date, e.end_date);
  return Object.assign({
    id: e.id,
    source: 'event',
    title: e.title || '(no title)',
    desc: e.short_summary_ro || e.description_ro || '',
    type: ({ pitch_event: 'pitch', accelerator_call: 'pitch' })[e.event_type] || e.event_type || 'conference',
    format: e.is_online ? 'online' : 'offline',
    country: cc,
    city: [e.city, e.is_online ? 'Online' : null].filter(Boolean).join(' · '),
    flag: flagFor(cc),
    org: e.organizer_name || '',
    orgLogo: _initials(e.organizer_name),
    topics: Array.isArray(e.topics) ? e.topics : [],
    price: e.is_free ? 'Gratuit' : (e.price_eur ? '€' + e.price_eur : 'Vezi pentru preț'),
    priceKind: e.is_free ? 'free' : 'paid',
    featured: !!e.is_featured,
    registration_url: e.registration_url || e.online_url || '',
    evidence_status: e.evidence_status,
    _sortDate: e.start_date,
  }, dates);
}

function _normalizeDeadline(d) {
  const cc = COUNTRY_MAP[d.country] || (d.country || 'EU').slice(0, 2).toUpperCase();
  const dates = _datesFrom(d.start_date, null);
  return Object.assign({
    id: d.id,
    source: 'grant_deadline',
    title: d.title || '(no title)',
    desc: d.short_summary || '',
    type: 'grant_deadline',
    format: 'online',
    country: cc,
    city: d.country || 'Deadline',
    flag: flagFor(cc),
    org: d.organizer_name || '',
    orgLogo: _initials(d.organizer_name),
    topics: d.sector ? String(d.sector).split(/[,/]/).map(s => s.trim()).filter(Boolean).slice(0, 3) : [],
    price: d.max_amount ? ('până la €' + Math.round(d.max_amount / 1000) + 'K') : 'Vezi pentru sumă',
    priceKind: 'paid',
    featured: false,
    grant_url: d.url,
    registration_url: d.external_url || '',
    evidence_status: d.evidence_status,
    _sortDate: d.start_date,
  }, dates);
}

function normalizeApi(data) {
  const out = [
    ...((data.grant_deadlines || []).map(_normalizeDeadline)),
    ...((data.events || []).map(_normalizeEvent)),
  ];
  return out.sort((a, b) => new Date(a._sortDate) - new Date(b._sortDate));
}


// ========== COMPONENTS ==========
function Topbar() {
  return (
    <div className="ev__topbar">
      <div className="ev__crumbs">
        <a href="/dashboard.html">Dashboard</a> <span>/</span> <em>Evenimente</em>
      </div>
      <div className="ev__topbar-r">
        <button className="btn btn--ghost btn--sm">+ Abonează-te la calendar (.ics)</button>
        <button className="btn btn--ghost btn--sm">⚐ Alertele mele</button>
        <button className="btn btn--accent btn--sm">+ Propune eveniment</button>
      </div>
    </div>
  );
}

function Hero({ featured, onFeaturedClick }) {
  return (
    <section className="ev__hero">
      <div>
        <div className="ev__hero-label">EVENIMENTE PARTENERI · Q2 2026</div>
        <h1 className="ev__hero-title">Unde se întâmplă<br /><em>viitorul</em> în regiunea ta.</h1>
        <p className="ev__hero-sub">Hackathons, workshopuri, info days, pitch nights, demo days — toate evenimentele relevante pentru founder-ii din CEE, într-un singur calendar. Curate de partenerii eligibil.md.</p>
      </div>
      <div className="ev__hero-stats">
        <div className="ev__hero-stat"><div className="ev__hero-stat-k">evenimente Q2</div><div className="ev__hero-stat-v">64</div><div className="ev__hero-stat-sub">+12 vs Q1</div></div>
        <div className="ev__hero-stat"><div className="ev__hero-stat-k">țări acoperite</div><div className="ev__hero-stat-v">8</div><div className="ev__hero-stat-sub">+ 12 online</div></div>
        <div className="ev__hero-stat"><div className="ev__hero-stat-k">parteneri activi</div><div className="ev__hero-stat-v">42</div><div className="ev__hero-stat-sub">VC, acceleratori, gov</div></div>
        <div className="ev__hero-stat"><div className="ev__hero-stat-k">founders · ult. an</div><div className="ev__hero-stat-v">3.8K</div><div className="ev__hero-stat-sub">participanți</div></div>
      </div>
    </section>
  );
}

function FeaturedCard({ e }) {
  return (
    <div className="featured">
      <div className="featured__cal">
        <div>
          <div className="featured__cal-tag">FEATURED · DEMOREA</div>
          <div className="featured__cal-day">{e.day}</div>
          <div className="featured__cal-month">{e.month}</div>
          <div className="featured__cal-year">{e.year}</div>
        </div>
        <div className="featured__cal-time">
          <strong>{e.time.split(' ')[0]}</strong>
          <span>{e.time}</span>
        </div>
      </div>
      <div className="featured__body">
        <div className="featured__meta">
          <span className="featured__type">{e.type.toUpperCase()}</span>
          {e.live && <span className="featured__live">● LIVE SOON</span>}
          <span className="featured__meta-item">· {e.flag} {e.city}</span>
          <span className="featured__meta-item">· {e.format}</span>
        </div>
        <h2 className="featured__title">{e.title}</h2>
        <p className="featured__desc">{e.desc}</p>
        <div className="featured__org">
          <div className="featured__org-logo">{e.orgLogo}</div>
          <span>Organizat de <strong style={{ color: 'var(--ink)' }}>{e.org}</strong></span>
          <span style={{ marginLeft: 'auto' }}>#{e.topics.join(' #')}</span>
        </div>
      </div>
      <div className="featured__side">
        <div>
          <div className="featured__side-stat-k">Înscriși</div>
          <div className="featured__side-stat-v">{e.attending}<small style={{ fontSize: 13, color: 'var(--muted)', fontFamily: 'JetBrains Mono' }}> / {e.capacity}</small></div>
        </div>
        <div>
          <div className="featured__side-stat-k">Locuri rămase</div>
          <div className="featured__side-stat-v hot">{e.capacity - e.attending}</div>
        </div>
        <div>
          <div className="featured__side-stat-k">Speakers</div>
          <div className="featured__side-avatars">
            {e.speakers.map((s, i) => <div key={i} style={{ background: i % 2 ? 'var(--accent)' : 'var(--ink)' }}>{s}</div>)}
          </div>
        </div>
        <div className="featured__cta">
          <button className="btn btn--accent">Înscriere gratuită →</button>
          <button className="btn btn--ghost btn--sm">Adaugă în calendar</button>
        </div>
      </div>
    </div>
  );
}

function EvRow({ e }) {
  return (
    <div className="ev-row">
      <div className="ev-row__date">
        <span className="ev-row__date-d">{e.day}</span>
        <span className="ev-row__date-m">{e.month}</span>
      </div>
      <div className="ev-row__type">
        <span className={`type-badge ${e.type}`}>{e.type}</span>
        <span className={`format-badge ${e.format}`}>{e.format}</span>
      </div>
      <div>
        <div className="ev-row__main-t">{e.title}</div>
        <div className="ev-row__main-d">{e.desc}</div>
        <div className="ev-row__main-tags">
          {e.topics.map(t => <span key={t} className="topic-tag">#{t}</span>)}
        </div>
      </div>
      <div className="ev-row__org">
        <div className="ev-row__org-logo">{e.orgLogo}</div>
        <div className="ev-row__org-t">
          <strong>{e.org}</strong>
          <span>{e.flag} {e.country}</span>
        </div>
      </div>
      <div className="ev-row__loc">
        <strong>{e.city}</strong>
        <span>{e.date} · {e.time}</span>
      </div>
      <div className="ev-row__cta">
        <span className={`ev-row__price ${e.priceKind}`}>{e.price}</span>
        <button className="btn btn--ghost btn--sm">Detalii →</button>
      </div>
    </div>
  );
}

function EvCard({ e }) {
  return (
    <div className="ev-card">
      <div className="ev-card__top">
        <div className="ev-card__date-block">
          <span className="ev-card__date-d">{e.day}</span>
          <span className="ev-card__date-m">{e.month} {e.year}</span>
        </div>
        <div className="ev-card__badges">
          <span className={`type-badge ${e.type}`}>{e.type}</span>
          <span className={`format-badge ${e.format}`}>{e.format}</span>
        </div>
      </div>
      <div className="ev-card__body">
        <div className="ev-card__t">{e.title}</div>
        <div className="ev-card__d">{e.desc}</div>
        <div className="ev-card__tags">
          {e.topics.slice(0, 3).map(t => <span key={t} className="topic-tag">#{t}</span>)}
        </div>
      </div>
      <div className="ev-card__foot">
        <div className="ev-card__foot-l">{e.flag} <strong>{e.city.split(' · ')[0]}</strong></div>
        <span className={`ev-card__price ${e.priceKind}`}>{e.price}</span>
      </div>
    </div>
  );
}

function MapView({ events }) {
  const [activeId, setActiveId] = useState(events[0]?.id);
  // Fictional map coords per country
  const countryPos = {
    MD: { x: 66, y: 42 }, RO: { x: 58, y: 50 }, BG: { x: 58, y: 62 },
    PL: { x: 50, y: 25 }, EU: { x: 40, y: 38 }, BR: { x: 18, y: 75 },
  };
  // Group by country
  const grouped = {};
  events.forEach(e => { (grouped[e.country] ||= []).push(e); });

  return (
    <div className="ev-map">
      <div className="ev-map__list">
        {events.map(e => (
          <div key={e.id} className={`ev-map__item ${activeId === e.id ? 'is-active' : ''}`} onClick={() => setActiveId(e.id)}>
            <div className="ev-map__item-date">
              <strong>{e.day}</strong>
              <span>{e.month}</span>
            </div>
            <div>
              <div className="ev-map__item-t">{e.title}</div>
              <div className="ev-map__item-m">{e.flag} {e.city} · {e.format}</div>
            </div>
          </div>
        ))}
      </div>
      <div className="ev-map__canvas">
        {Object.entries(grouped).map(([c, list]) => {
          const pos = countryPos[c]; if (!pos) return null;
          const isActive = list.some(e => e.id === activeId);
          return (
            <div key={c} className={`ev-map__pin ${isActive ? 'is-active' : ''}`}
              style={{ left: pos.x + '%', top: pos.y + '%' }}
              onClick={() => setActiveId(list[0].id)}>
              {list[0].flag} {c}
              <span className="ev-map__pin-count">{list.length}</span>
            </div>
          );
        })}
        <div style={{ position: 'absolute', bottom: 12, right: 14, fontFamily: 'JetBrains Mono', fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.1em' }}>Schematic · coords aprox</div>
      </div>
    </div>
  );
}

// ========== APP ==========
function EventsApp() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState('all');
  const [country, setCountry] = useState('all');
  const [format, setFormat] = useState('all');
  const [view, setView] = useState('list');
  const [q, setQ] = useState('');

  useEffect(() => {
    const lang = window.location.pathname.startsWith('/events') ? 'en' : 'ro';
    fetch('/api/events?lang=' + lang)
      .then(r => r.ok ? r.json() : { events: [], grant_deadlines: [] })
      .then(data => setEvents(normalizeApi(data)))
      .catch(() => setEvents([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => events.filter(e => {
    if (e.featured) return false;
    if (type !== 'all' && e.type !== type) return false;
    if (country !== 'all' && e.country !== country) return false;
    if (format !== 'all' && e.format !== format) return false;
    if (q && !(e.title + ' ' + e.desc + ' ' + e.topics.join(' ')).toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  }), [type, country, format, q]);

  const byMonth = useMemo(() => {
    const m = {};
    filtered.forEach(e => { (m[e.monthFull] ||= []).push(e); });
    return m;
  }, [filtered]);

  const featured = events.find(e => e.featured);

  // Count per type
  const typeCounts = useMemo(() => {
    const c = { all: events.filter(e => !e.featured).length };
    events.forEach(e => { if (!e.featured) c[e.type] = (c[e.type] || 0) + 1; });
    return c;
  }, []);
  const countryCounts = useMemo(() => {
    const c = { all: events.filter(e => !e.featured).length };
    events.forEach(e => { if (!e.featured) c[e.country] = (c[e.country] || 0) + 1; });
    return c;
  }, []);

  return (
    <div className="ev">
      <Topbar />
      <Hero featured={featured} />

      {featured && <FeaturedCard e={featured} />}

      <div className="ev__filters">
        <div className="ev__filter-row">
          <span className="ev__filter-label">Țară</span>
          {COUNTRIES.map(c => (
            <button key={c.id} className={`chip alt ${country === c.id ? 'is-active' : ''}`} onClick={() => setCountry(c.id)}>
              <span className="chip__flag">{c.flag}</span>{c.name}
              <span className="chip__count">{countryCounts[c.id] || 0}</span>
            </button>
          ))}
        </div>
        <div className="ev__filter-row">
          <span className="ev__filter-label">Tip</span>
          {TYPES.map(t => (
            <button key={t.id} className={`chip ${type === t.id ? 'is-active' : ''}`} onClick={() => setType(t.id)}>
              {t.name} <span className="chip__count">{typeCounts[t.id] || 0}</span>
            </button>
          ))}
        </div>
        <div className="ev__filter-row">
          <span className="ev__filter-label">Format</span>
          {FORMATS.map(f => (
            <button key={f.id} className={`chip ${format === f.id ? 'is-active' : ''}`} onClick={() => setFormat(f.id)}>{f.name}</button>
          ))}
          <div className="ev__search">
            <input placeholder="Caută după titlu, topic, organizator..." value={q} onChange={e => setQ(e.target.value)} />
          </div>
          <div className="ev__view-toggle">
            <button className={view === 'list' ? 'is-active' : ''} onClick={() => setView('list')}>Listă</button>
            <button className={view === 'grid' ? 'is-active' : ''} onClick={() => setView('grid')}>Grilă</button>
            <button className={view === 'map' ? 'is-active' : ''} onClick={() => setView('map')}>Hartă</button>
          </div>
        </div>
      </div>

      <div className="ev__list-wrap">
        <div className="ev__list-head">
          <div className="ev__list-h">
            <strong>{filtered.length} evenimente</strong>
            {type !== 'all' && <span>· {TYPES.find(t => t.id === type)?.name}</span>}
            {country !== 'all' && <span>· {COUNTRIES.find(c => c.id === country)?.name}</span>}
            {format !== 'all' && <span>· {FORMATS.find(f => f.id === format)?.name}</span>}
          </div>
          <div className="ev__sort">
            Sortare:
            <select><option>Data (ascending)</option><option>Popularitate</option><option>Capacitate</option></select>
          </div>
        </div>

        {view === 'list' && Object.entries(byMonth).map(([m, list]) => (
          <div className="month-group" key={m}>
            <div className="month-group__h">
              <div className="month-group__title">{m}</div>
              <div className="month-group__sub">{list.length} evenimente</div>
            </div>
            {list.map(e => <EvRow key={e.id} e={e} />)}
          </div>
        ))}

        {view === 'grid' && (
          <div className="ev-grid">
            {filtered.map(e => <EvCard key={e.id} e={e} />)}
          </div>
        )}

        {view === 'map' && <MapView events={filtered} />}

        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '80px 20px', color: 'var(--muted)', fontFamily: 'JetBrains Mono', fontSize: 13 }}>
            Niciun eveniment nu corespunde filtrelor. <button className="btn btn--link" onClick={() => { setType('all'); setCountry('all'); setFormat('all'); setQ(''); }}>Resetează filtrele</button>
          </div>
        )}
      </div>

      <section className="partners">
        <div className="partners__h">PARTENERI · ORGANIZATORI VERIFICAȚI</div>
        <div className="partners__grid">
          {PARTNERS.map(p => (
            <div key={p.name} className="partners__cell">
              <div>{p.name}<small>{p.sub}</small></div>
            </div>
          ))}
        </div>
      </section>

      <section className="ev__submit-cta">
        <h2>Organizezi un eveniment pentru founders?</h2>
        <p>Propune-l în calendarul nostru și ajunge la 3,800+ founders activi din CEE. Review în 24h, complet gratuit pentru parteneri.</p>
        <div className="ev__submit-cta-actions">
          <button className="btn btn--accent">+ Propune eveniment</button>
          <button className="btn btn--ghost">Devino partener organizator</button>
        </div>
      </section>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('ev-root')).render(<EventsApp />);
