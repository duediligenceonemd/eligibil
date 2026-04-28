// Events page
const { useState, useMemo, useEffect } = React;

// ========== DATA ==========
const EVENTS = [
  {
    id: 'e01', featured: true,
    title: 'EIC Accelerator Masterclass: Pregătire Stage 1 aplicație',
    desc: 'Workshop intensiv de 4 ore cu ex-evaluator EIC. Vei înțelege cum se scoring-uie aplicația ta și vei primi un template validat. Include 1:1 de 30 min după workshop.',
    type: 'workshop', format: 'online',
    date: '28 Apr 2026', day: '28', month: 'Apr', year: '2026', monthFull: 'Aprilie 2026', time: '14:00–18:00 EET', timeSub: 'Online · via Zoom',
    country: 'EU', city: 'Online (EN)', flag: '🇪🇺',
    org: 'EIC Community', orgLogo: 'EC',
    topics: ['EIC', 'Grant writing', 'Deep-tech'],
    price: 'Gratuit pentru membri', priceKind: 'free',
    attending: 247, capacity: 500, live: true,
    speakers: ['JM', 'AC', 'KL'],
  },
  // Mai 2026
  {
    id: 'e02', title: 'Hackathon Moldova Tech 2026', desc: 'Hackathon național 48h, 3 tracks: FinTech, HealthTech, GovTech. Premii 500K MDL + mentoring + follow-on funding.',
    type: 'hackathon', format: 'offline',
    day: '03', month: 'Mai', year: '2026', monthFull: 'Mai 2026', date: '3–5 Mai 2026', time: '48h non-stop',
    country: 'MD', city: 'Chișinău · Tekwill', flag: '🇲🇩',
    org: 'Tekwill', orgLogo: 'TW',
    topics: ['FinTech', 'HealthTech', 'Hackathon'],
    price: 'Gratuit', priceKind: 'free',
    attending: 184, capacity: 300,
  },
  {
    id: 'e03', title: 'StartupBlink Summit · București 2026', desc: 'Cea mai mare conferință de startup din Balcani. 80+ speakers, 1,200 atendees, 40 VCs prezenți, demo area cu 60 startup-uri.',
    type: 'conference', format: 'offline',
    day: '08', month: 'Mai', year: '2026', monthFull: 'Mai 2026', date: '8–9 Mai 2026', time: '09:00–19:00',
    country: 'RO', city: 'București · Radisson', flag: '🇷🇴',
    org: 'StartupBlink RO', orgLogo: 'SB',
    topics: ['Conference', 'VC', 'Networking'],
    price: '€180 / €95 student', priceKind: 'paid',
    attending: 890, capacity: 1200,
  },
  {
    id: 'e04', title: 'Pitch Night #42 — AI & ML Startups', desc: '6 startup-uri AI/ML din CEE își prezintă produsele în fața unui panel de 5 VCs. Networking + beer după pitch-uri.',
    type: 'pitch', format: 'hybrid',
    day: '12', month: 'Mai', year: '2026', monthFull: 'Mai 2026', date: '12 Mai 2026', time: '18:00–21:00 EET',
    country: 'RO', city: 'Cluj-Napoca · Impact Hub', flag: '🇷🇴',
    org: 'ClujHub + GapMinder VC', orgLogo: 'CH',
    topics: ['AI/ML', 'Pitch', 'VC'],
    price: 'Gratuit', priceKind: 'free',
    attending: 96, capacity: 120,
  },
  {
    id: 'e05', title: 'Horizon Europe — Info Day pentru Cluster 4', desc: 'Sesiune oficială de informare a Comisiei Europene. Priorități 2026, buget, condiții participare consorții. Întrebări live la NCP.',
    type: 'webinar', format: 'online',
    day: '15', month: 'Mai', year: '2026', monthFull: 'Mai 2026', date: '15 Mai 2026', time: '10:00–13:00 CET',
    country: 'EU', city: 'Online (EN)', flag: '🇪🇺',
    org: 'European Commission', orgLogo: 'EC',
    topics: ['Horizon Europe', 'R&D', 'Grants'],
    price: 'Gratuit', priceKind: 'free',
    attending: 1240,
  },
  {
    id: 'e06', title: 'How To Raise Pre-Seed în 2026 — Workshop', desc: 'Cum să structurezi runda pre-seed: term sheet, valuation, SAFE vs. equity, cum să găsești angels în CEE.',
    type: 'workshop', format: 'online',
    day: '18', month: 'Mai', year: '2026', monthFull: 'Mai 2026', date: '18 Mai 2026', time: '15:00–17:30 EET',
    country: 'EU', city: 'Online (RO)', flag: '🇪🇺',
    org: 'eligibil.md + Early Game VC', orgLogo: 'EG',
    topics: ['Fundraising', 'Pre-seed'],
    price: 'Gratuit abonați · €29 public', priceKind: 'paid',
    attending: 340, capacity: 500,
  },
  {
    id: 'e07', title: 'Demo Day Tekwill Accelerator · Cohort 7', desc: '16 startup-uri de la Tekwill Accelerator își fac exit-ul din program. VCs, angels și press prezenți. Meet-and-greet după demos.',
    type: 'demo-day', format: 'hybrid',
    day: '22', month: 'Mai', year: '2026', monthFull: 'Mai 2026', date: '22 Mai 2026', time: '17:00–22:00 EET',
    country: 'MD', city: 'Chișinău · Tekwill', flag: '🇲🇩',
    org: 'Tekwill Accelerator', orgLogo: 'TA',
    topics: ['Demo Day', 'Accelerator', 'VC'],
    price: 'Invitați only', priceKind: 'free',
    attending: 220, capacity: 250,
  },
  {
    id: 'e08', title: 'Women in Tech Breakfast · Sofia', desc: 'Networking matinal pentru founder-ele din Balcani. Keynote de 20 min + discuții round-table. Croissants + espresso.',
    type: 'networking', format: 'offline',
    day: '25', month: 'Mai', year: '2026', monthFull: 'Mai 2026', date: '25 Mai 2026', time: '08:30–11:00 EET',
    country: 'BG', city: 'Sofia · Betahaus', flag: '🇧🇬',
    org: 'Women In Tech BG', orgLogo: 'WT',
    topics: ['Women', 'Networking'],
    price: '€12', priceKind: 'paid',
    attending: 48, capacity: 60,
  },
  // Iunie
  {
    id: 'e09', title: 'Startup Moldova 2026 — Q&A oficial cu AGEPI', desc: 'Director AGEPI răspunde live la întrebări despre aplicarea la programul Startup Moldova 2026. Includ formular tips.',
    type: 'webinar', format: 'online',
    day: '04', month: 'Iun', year: '2026', monthFull: 'Iunie 2026', date: '4 Iun 2026', time: '16:00–17:30 EET',
    country: 'MD', city: 'Online (RO)', flag: '🇲🇩',
    org: 'AGEPI + ODA', orgLogo: 'AG',
    topics: ['Startup Moldova', 'AGEPI', 'Grant'],
    price: 'Gratuit', priceKind: 'free',
    attending: 420, capacity: 1000,
  },
  {
    id: 'e10', title: 'Web Summit Rio — Side Event CEE', desc: 'Delegație de 40 startup-uri din Europa Centrală și de Est la Web Summit Rio. Pre-schedule meetings cu 200+ VCs internaționali.',
    type: 'conference', format: 'offline',
    day: '10', month: 'Iun', year: '2026', monthFull: 'Iunie 2026', date: '10–12 Iun 2026', time: '3 zile',
    country: 'BR', city: 'Rio de Janeiro', flag: '🇧🇷',
    org: 'InvestEU + Web Summit', orgLogo: 'WS',
    topics: ['Conference', 'Global', 'VC'],
    price: '€890 / €450 early', priceKind: 'paid',
    attending: 38, capacity: 40,
  },
  {
    id: 'e11', title: 'AI Romania — Bootcamp pentru Founders', desc: 'Intensive 3-day bootcamp în Cluj. AI infra, modele open-source, fine-tuning, GTM pentru AI products. Max 30 participanți.',
    type: 'workshop', format: 'offline',
    day: '15', month: 'Iun', year: '2026', monthFull: 'Iunie 2026', date: '15–17 Iun 2026', time: '09:00–18:00 EET',
    country: 'RO', city: 'Cluj-Napoca · ClujHub', flag: '🇷🇴',
    org: 'AI Romania', orgLogo: 'AI',
    topics: ['AI/ML', 'Bootcamp'],
    price: '€450', priceKind: 'paid',
    attending: 22, capacity: 30,
  },
  {
    id: 'e12', title: 'Climate Tech Pitch Night · Warsaw', desc: '8 climate-tech startup-uri din regiunea DACH+CEE pitch în fața InnoEnergy + EIT Climate. Focus hard-tech, nu software.',
    type: 'pitch', format: 'hybrid',
    day: '20', month: 'Iun', year: '2026', monthFull: 'Iunie 2026', date: '20 Iun 2026', time: '17:00–21:00 CET',
    country: 'PL', city: 'Warsaw · CambridgeInno', flag: '🇵🇱',
    org: 'InnoEnergy + EIT', orgLogo: 'IE',
    topics: ['Climate', 'Hard-tech', 'Pitch'],
    price: 'Gratuit pentru founders', priceKind: 'free',
    attending: 110, capacity: 150,
  },
  {
    id: 'e13', title: 'Serie A Masterclass · cu Atomico Partner', desc: 'Partner senior de la Atomico prezintă: ce face diferența la Serie A în 2026, ce metrici contează, common mistakes.',
    type: 'workshop', format: 'online',
    day: '25', month: 'Iun', year: '2026', monthFull: 'Iunie 2026', date: '25 Iun 2026', time: '17:00–19:00 CET',
    country: 'EU', city: 'Online (EN)', flag: '🇪🇺',
    org: 'Atomico + eligibil.md', orgLogo: 'AT',
    topics: ['Series A', 'VC', 'Fundraising'],
    price: '€49 / gratuit Pro', priceKind: 'paid',
    attending: 180, capacity: 400,
  },
];

const TYPES = [
  { id: 'all', name: 'Toate' },
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
  const [type, setType] = useState('all');
  const [country, setCountry] = useState('all');
  const [format, setFormat] = useState('all');
  const [view, setView] = useState('list');
  const [q, setQ] = useState('');

  const filtered = useMemo(() => EVENTS.filter(e => {
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

  const featured = EVENTS.find(e => e.featured);

  // Count per type
  const typeCounts = useMemo(() => {
    const c = { all: EVENTS.filter(e => !e.featured).length };
    EVENTS.forEach(e => { if (!e.featured) c[e.type] = (c[e.type] || 0) + 1; });
    return c;
  }, []);
  const countryCounts = useMemo(() => {
    const c = { all: EVENTS.filter(e => !e.featured).length };
    EVENTS.forEach(e => { if (!e.featured) c[e.country] = (c[e.country] || 0) + 1; });
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
