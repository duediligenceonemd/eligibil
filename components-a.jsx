// Main components for the eligibil.org prototype
const { useState, useEffect, useRef, useMemo } = React;

/* ---------- Discovery URL builders ----------
   Convert MegaMenu / grid labels into /search?... query strings so every
   homepage link lands the user inside the public catalog with the right
   filters pre-applied. */

function stripFlag(s) {
  // "🇲🇩 Moldova" → "Moldova"; "🌍 Global" → "Global"
  return s.replace(/^[\p{Emoji_Presentation}\p{Extended_Pictographic}️‍\u{1F1E6}-\u{1F1FF}]+\s*/u, '').replace(/\s*→\s*$/, '').trim();
}

function amountRangeQuery(label) {
  // "< €50K" / "€50K – €250K" / "€1M+" → min/max in EUR
  const norm = label.replace(/[€\s]/g, '').replace(/–|—|-/g, '-');
  const num = (s) => {
    const m = s.match(/(\d+(?:\.\d+)?)(K|M)?/);
    if (!m) return null;
    return Math.round(parseFloat(m[1]) * (m[2] === 'M' ? 1_000_000 : m[2] === 'K' ? 1_000 : 1));
  };
  if (norm.startsWith('<')) return `max=${num(norm.slice(1))}`;
  if (norm.endsWith('+'))  return `min=${num(norm.slice(0, -1))}`;
  const [a, b] = norm.split('-');
  return `min=${num(a)}&max=${num(b)}`;
}

const STADIU_MAP = {
  'Idea Stage': 'idea', 'Early-stage': 'early', 'Growth': 'growth',
  'Scale-up': 'growth', 'R&D / Cercetare': 'rd', 'Idea': 'idea', 'R&D': 'rd',
};

function megaItemUrl(colTitle, name) {
  const clean = name.replace(/\s*→\s*$/, '').trim();
  const ct = (colTitle || '').toLowerCase();

  // Resurse column routing (most specific first)
  if (ct.includes('evenimente') || ct.includes('webinar') || ct.includes('video & event')) {
    return /^toate\b/i.test(clean) ? '/evenimente' : `/evenimente?q=${encodeURIComponent(clean)}`;
  }
  if (ct === 'blog' || ct.includes('articol')) {
    return /^toate\b/i.test(clean) ? '/blog' : `/blog?q=${encodeURIComponent(clean)}`;
  }
  if (ct.includes('rapoarte') || ct.includes('whitepaper') || ct.includes('reports')) {
    return /^toate\b/i.test(clean) ? '/blog?cat=reports' : `/blog?cat=reports&q=${encodeURIComponent(clean)}`;
  }
  if (ct.includes('glosar') || ct.includes('glossary')) {
    return /^toate\b/i.test(clean) ? '/blog?cat=glosar' : `/blog?cat=glosar&q=${encodeURIComponent(clean)}`;
  }
  // Partners columns: acceleratoare / fonduri / programe donor / instituții
  if (ct.includes('accelerat') || ct.includes('fond') || ct.includes('donor') || ct.includes('instituți') || ct.includes('institut')) {
    return /^toate\b/i.test(clean) ? '/search?tip=Accelerator' : `/search?q=${encodeURIComponent(clean)}`;
  }

  // Catalog filter columns (Surse de finanțare + Programe active mega menus)
  if (/^toate\b/i.test(clean) || /^all\b/i.test(clean)) return '/search';
  if (ct === 'după sector' || ct === 'by sector')
    return `/search?sector=${encodeURIComponent(clean)}`;
  if (ct === 'după țară' || ct === 'by country')
    return `/search?tara=${encodeURIComponent(stripFlag(clean))}`;
  if (ct === 'după tip' || ct === 'by type')
    return `/search?tip=${encodeURIComponent(clean)}`;
  if (ct === 'după regiune' || ct === 'by region')
    return `/search?tara=${encodeURIComponent(stripFlag(clean))}`;
  if (ct === 'după stadiu' || ct === 'by stage') {
    const id = STADIU_MAP[clean] || clean.toLowerCase().split(/[\s/]/)[0];
    return `/search?stadiu=${encodeURIComponent(id)}`;
  }
  if (ct === 'după sumă' || ct === 'by amount')
    return `/search?${amountRangeQuery(clean)}`;
  if (ct === 'după deadline' || ct === 'by deadline')
    return `/search?sort=deadline`;
  if (ct === 'featured acum' || ct === 'featured now')
    return `/search?q=${encodeURIComponent(clean)}`;

  // Fallback: free-text search
  return `/search?q=${encodeURIComponent(stripFlag(clean))}`;
}

function megaBannerUrl(menuKey) {
  // The 4 top-level mega menus
  if (menuKey === 'finantari') return '/search';
  if (menuKey === 'programe')  return '/search?status=open&sort=deadline';
  if (menuKey === 'parteneri') return '/search?tip=Accelerator';
  if (menuKey === 'resurse')   return '/blog';
  return '/search';
}

/* ---------- Nav + Mega-menu ---------- */
function Nav({ lang, setLang }) {
  const [open, setOpen] = useState(null);
  const closeTimer = useRef(null);
  const openMenu = (k) => {
    clearTimeout(closeTimer.current);
    setOpen(k);
  };
  const scheduleClose = () => {
    closeTimer.current = setTimeout(() => setOpen(null), 120);
  };
  return (
    <nav className="nav" onMouseLeave={scheduleClose}>
      <div className="container">
        <div className="nav__inner">
          <div className="nav__brand">
            <div className="nav__logo">eligibil<span className="nav__logo-dot">.eu</span></div>
            <div className="nav__tag">AI Readiness &amp;<br/>Funding Orchestrator</div>
          </div>
          <div className="nav__links">
            <NavItem label="Surse de finanțare" k="finantari" open={open} openMenu={openMenu} />
            <NavItem label="Programe active" k="programe" open={open} openMenu={openMenu} />
            <NavItem label="Parteneri" k="parteneri" open={open} openMenu={openMenu} />
            <NavItem label="Resurse" k="resurse" open={open} openMenu={openMenu} />
          </div>
          <div className="nav__right">
            <div className="langmini" role="group" aria-label="Language">
              {['RO', 'EN', 'RU', 'UA'].map((l) => (
                <button key={l} className={lang === l ? 'is-active' : ''} onClick={() => setLang(l)}>{l}</button>
              ))}
            </div>
            <a href="/register.html" className="btn btn--ghost btn--sm">
              Analiză AI <span className="nav__badge">90s</span>
            </a>
            <a href="/login.html" className="btn btn--sm">Intră în cont</a>
          </div>
        </div>
      </div>
      {open && <MegaMenu k={open} onMouseEnter={() => openMenu(open)} onMouseLeave={scheduleClose} />}
    </nav>
  );
}

function NavItem({ label, k, open, openMenu }) {
  return (
    <button
      className={`nav__item ${open === k ? 'is-open' : ''}`}
      onMouseEnter={() => openMenu(k)}
    >
      {label} <span className="nav__caret">▾</span>
    </button>
  );
}

function MegaMenu({ k, onMouseEnter, onMouseLeave }) {
  const data = MEGA[k];
  if (!data) return null;
  return (
    <div className="mega" onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
      <div className="container">
        <div className="mega__grid">
          {data.cols.map((c, i) => (
            <div key={i}>
              <div className="mega__col-title">{c.t}</div>
              <div className="mega__list">
                {c.items.map(([name, n], j) => (
                  <a key={j} className="mega__link" href={megaItemUrl(c.t, name)}>
                    <span>{name}</span>
                    {n && <span className="mono">{n}</span>}
                  </a>
                ))}
              </div>
            </div>
          ))}
          <div className="mega__banner">
            <div>
              <h4>{data.banner.h}</h4>
              <div className="mega__banner-stats" style={{ marginTop: 8 }}>{data.banner.sub}</div>
            </div>
            <a href={megaBannerUrl(k)} style={{ color: 'var(--bg)', borderBottom: '1px solid var(--bg)', paddingBottom: 2, fontSize: 13, width: 'fit-content' }}>
              {data.banner.cta}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- Hero ---------- */
function Hero({ heroStyle, setSectorFilter }) {
  const [sector, setSector] = useState('');
  const [tara, setTara]     = useState('');
  const [tip, setTip]       = useState('');
  const [amount, setAmount] = useState('');
  const suggestions = ['Granturi AI Moldova', 'SBIR Phase I', 'EIC Accelerator 2026', 'Horizon Europe biotech', 'Capital non-dilutiv RO'];

  const onSubmit = (e) => {
    e.preventDefault();
    const p = new URLSearchParams();
    if (sector) p.set('sector', sector);
    if (tara)   p.set('tara', tara);
    if (tip)    p.set('tip', tip);
    if (amount) {
      const ar = amountRangeQuery(amount);
      for (const part of ar.split('&')) {
        const [k, v] = part.split('=');
        if (k && v) p.set(k, v);
      }
    }
    window.location.href = `/search?${p.toString()}`;
  };

  return (
    <section className="section hero" data-screen-label="01 Hero">
      <div className="container">
        <div className="hero__grid">
          <div className="hero__left">
            <div className="hero__eyebrow">
              <span className="hero__eyebrow-dot" />
              735 surse · actualizat acum 2 minute
            </div>
            <h1 className="hero__h1">
              Descoperă cele mai bune surse de finanțare pentru <em>startupul&nbsp;tău</em>.
            </h1>
            <p className="hero__sub">
              Agregatorul #1 de granturi, competiții și capital non-dilutiv pentru Moldova, România și Europa de Est. Peste 735 de oportunități verificate, actualizate zilnic, cu analiză AI de pregătire pentru fiecare.
            </p>

            <form className="search" onSubmit={onSubmit}>
              <div className="search__row">
                <div className="search__icon">
                  <svg width="16" height="16" viewBox="0 0 16 16"><circle cx="7" cy="7" r="5" fill="none" stroke="currentColor" strokeWidth="1.5"/><line x1="11" y1="11" x2="15" y2="15" stroke="currentColor" strokeWidth="1.5"/></svg>
                </div>
                <select className="search__select" value={sector} onChange={e => setSector(e.target.value)}>
                  <option value="">Sector</option>
                  {SECTORS.slice(0, 8).map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                </select>
                <select className="search__select" value={tara} onChange={e => setTara(e.target.value)}>
                  <option value="">Țară</option>
                  <option>Moldova</option><option>România</option><option>EU</option><option>SUA</option>
                </select>
                <select className="search__select" value={tip} onChange={e => setTip(e.target.value)}>
                  <option value="">Tip finanțare</option>
                  <option>Grant</option><option>SBIR</option><option>Equity</option><option>Non-dilutiv</option>
                </select>
                <select className="search__select" value={amount} onChange={e => setAmount(e.target.value)}>
                  <option value="">Sumă</option>
                  <option>&lt; €50K</option><option>€50K – €250K</option><option>€250K – €1M</option><option>€1M+</option>
                </select>
                <button type="submit" className="search__btn">Caută</button>
              </div>
            </form>

            <div className="search__suggest">
              <span className="search__suggest-label">Populare</span>
              {suggestions.map(s => (
                <a
                  key={s}
                  className="chip"
                  href={`/search?q=${encodeURIComponent(s)}`}
                >{s}</a>
              ))}
            </div>
          </div>

          <div className="hero__right">
            <div className="feed__head">
              <span className="feed__title">Deadline-uri apropiate</span>
              <span className="feed__live"><span className="feed__live-dot" /> Live</span>
            </div>
            <div className="feed__list">
              {PROGRAMS.slice(0, 5).map((p, i) => (
                <div className="feed__item" key={i}>
                  <div className="feed__date">
                    <span className="feed__date-d">{p.days ? p.days : '∞'}</span>
                    <span className="feed__date-m">{p.days ? 'zile' : 'rolling'}</span>
                  </div>
                  <div>
                    <div className="feed__name">{p.name}</div>
                    <div className="feed__meta">{p.flag} · {p.type}</div>
                  </div>
                  <div className="feed__amt">{p.amount.replace('Până la ', '≤')}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="trust">
          {[
            ['735+', 'Surse totale'],
            ['180+', 'Programe UE'],
            ['200+', 'Granturi SUA'],
            ['50+', 'Fonduri non-dilutive'],
            ['4', 'Limbi RO·EN·RU·UA'],
          ].map(([n, l]) => (
            <div className="trust__cell" key={l}>
              <span className="trust__num">{n}</span>
              <span className="trust__lbl">{l}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- Sectors ---------- */
function SectorGrid() {
  const [filter, setFilter] = useState('toate');
  const filtered = useMemo(() => {
    if (filter === 'toate') return SECTORS;
    if (filter === 'tech') return SECTORS.filter(s => ['ai', 'deep', 'hw', 'saas', 'space'].includes(s.id));
    if (filter === 'impact') return SECTORS.filter(s => ['climate', 'soc', 'edu', 'bio', 'agri'].includes(s.id));
    if (filter === 'finance') return SECTORS.filter(s => ['fin'].includes(s.id));
    return SECTORS;
  }, [filter]);
  const total = filtered.reduce((a, b) => a + b.n, 0);

  return (
    <section className="section" data-screen-label="02 Sectors">
      <div className="container">
        <div className="section__label">01 — Categorii</div>
        <div className="section__head">
          <h2 className="section__title">Găsește finanțare pentru verticala ta.</h2>
          <p className="section__sub">Peste 700 de surse clasificate pe 12 verticale. Fiecare categorie are propria pagină de catalog cu filtre avansate.</p>
        </div>

        <div className="grid-results-bar">
          <div className="tweaks-chips" style={{ gap: 6 }}>
            {[['toate', 'Toate'], ['tech', 'Tech & Deep Tech'], ['impact', 'Impact & Sustainability'], ['finance', 'Finance']].map(([id, l]) => (
              <button key={id} className={`chip ${filter === id ? 'is-active' : ''}`} onClick={() => setFilter(id)}>{l}</button>
            ))}
          </div>
          <span>{filtered.length} categorii · {total} surse</span>
        </div>

        <div className="grid-cats">
          {filtered.map((s, i) => (
            <a key={s.id} className="cat" href={`/search?sector=${encodeURIComponent(s.name)}`}>
              <div className="cat__thumb"><Thumb kind={s.thumb} seed={i + 3} /></div>
              <div className="cat__name">{s.name}</div>
              <div>
                <div className="cat__meta">{s.n} surse · {s.range}</div>
              </div>
              <div className="cat__cta">Explorează →</div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- Countries ---------- */
function CountryGrid() {
  return (
    <section className="section" data-screen-label="03 Countries">
      <div className="container">
        <div className="section__label">02 — Acoperire geografică</div>
        <div className="section__head">
          <h2 className="section__title">Finanțare disponibilă în țara ta și dincolo de ea.</h2>
          <p className="section__sub">60+ țări cu programe listate. Focus regional pe Moldova, România și CEE, extensii EU-27, SUA și global.</p>
        </div>
        <div className="countries">
          {Object.entries(COUNTRIES).map(([region, list]) => (
            <div className="country-region" key={region}>
              <div className="country-region__title">{region}</div>
              {list.map((c) => (
                <a className="country" href={`/search?tara=${encodeURIComponent(c.name)}`} key={c.name}>
                  <span>{c.flag} {c.name}</span>
                  <span className="country__n">{c.n}+</span>
                </a>
              ))}
            </div>
          ))}
        </div>
        <div style={{ marginTop: 20 }}>
          <a className="btn--link" href="/search">Vezi toate țările (60+) →</a>
        </div>
      </div>
    </section>
  );
}

/* ---------- Active Programs (tabs) ---------- */
function ActivePrograms() {
  const [tab, setTab] = useState('all');
  const filtered = useMemo(() => {
    if (tab === 'all') return PROGRAMS;
    return PROGRAMS.filter(p => p.stage === tab);
  }, [tab]);

  const tabs = [
    ['all', 'Toate', PROGRAMS.length],
    ['idea', 'Idea', PROGRAMS.filter(p=>p.stage==='idea').length],
    ['early', 'Early-stage', PROGRAMS.filter(p=>p.stage==='early').length],
    ['growth', 'Growth', PROGRAMS.filter(p=>p.stage==='growth').length],
    ['rd', 'R&D', PROGRAMS.filter(p=>p.stage==='rd').length],
  ];

  return (
    <section className="section" data-screen-label="04 Programs">
      <div className="container">
        <div className="section__label">03 — Actualizat acum</div>
        <div className="section__head">
          <h2 className="section__title">Programe deschise pentru aplicare.</h2>
          <p className="section__sub">Cele mai recente programe verificate în baza noastră de date. Actualizate zilnic · toate cu analiză AI de pregătire.</p>
        </div>

        <div className="tabs">
          {tabs.map(([id, l, n]) => (
            <button key={id} className={`tab ${tab === id ? 'is-active' : ''}`} onClick={() => setTab(id)}>
              {l} <span className="tab__count">[{n}]</span>
            </button>
          ))}
        </div>

        <div className="programs">
          {filtered.map((p, i) => (
            <div className="program" key={i}>
              <div className="program__status">
                <span className={`status-pill ${p.status}`}>
                  <span className="status-pill__dot" />
                  {p.status === 'live' ? 'Activ' : p.status === 'soon' ? 'În curând' : 'Închis'}
                </span>
                <div className="program__deadline">
                  Deadline
                  <strong>{p.deadline}</strong>
                </div>
              </div>
              <div className="program__main">
                <div className="program__from">De la {p.from} · {p.flag}</div>
                <h3 className="program__name">{p.name}</h3>
                <div className="mono" style={{ fontSize: 12, color: 'var(--ink-2)' }}>
                  {p.amount} · {p.type} · {p.trl}
                </div>
                <div className="program__tags">
                  {p.sectors.map(s => <span className="program__tag" key={s}>{s}</span>)}
                </div>
              </div>
              <div className="program__facts">
                <div className="program__fact">
                  <span className="program__fact-k">Match median</span>
                  <span className="program__fact-v mono">{p.matchScore}/100</span>
                </div>
                <div className="program__score">
                  <div className="score-bar"><div className="score-bar__fill" style={{ width: `${p.matchScore}%` }}/></div>
                </div>
                <div className="program__fact">
                  <span className="program__fact-k">Aplicanți tipici</span>
                  <span className="program__fact-v mono">{p.applicants}</span>
                </div>
                <div className="program__action-note">{p.note}</div>
              </div>
              <div className="program__action">
                <a className="btn btn--accent btn--sm" href={`/search?q=${encodeURIComponent(p.name)}`}>Vezi detalii →</a>
                <a className="btn btn--ghost btn--sm" href="/register.html">Analizează șansele</a>
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 28 }}>
          <a className="btn--link" href="/search?status=open&sort=deadline">Vezi toate programele active →</a>
        </div>
      </div>
    </section>
  );
}

Object.assign(window, { Nav, Hero, SectorGrid, CountryGrid, ActivePrograms });
