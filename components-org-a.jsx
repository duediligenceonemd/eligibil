// eligibil.org — Part A: Nav, Hero, Filters, Deadlines, Positioning, Products
const { useState: useStateOrgA, useEffect: useEffectOrgA, useRef: useRefOrgA } = React;

function trackAnalyticsOrg(eventName, payload) {
  if (window.eligibilAnalytics && typeof window.eligibilAnalytics.track === 'function') {
    window.eligibilAnalytics.track(eventName, payload);
  }
}

/* ============================================================
   Nav with .org menu (Catalog · Produse · Resurse · About)
   ============================================================ */
function NavOrg({ lang, setLang }) {
  const [open, setOpen] = useStateOrgA(null);
  const [mobileOpen, setMobileOpen] = useStateOrgA(false);
  const closeTimer = useRefOrgA(null);
  const openMenu = (k) => { clearTimeout(closeTimer.current); setOpen(k); };
  const scheduleClose = () => { closeTimer.current = setTimeout(() => setOpen(null), 150); };

  const products = window.ORG_PRODUCTS;
  const resourcesCatalogHref = lang === 'EN' ? '/en/resources' : '/resurse';
  const resources = [
    ['Catalog resurse', 'Directoare, suport tehnic, capital și oportunități utile pentru startupuri.', resourcesCatalogHref],
    ['Glosar', 'Termeni de finanțare explicați simplu — TRL, MVP, EIC, SBIR.', '/glosar'],
    ['Blog', 'Ghiduri, analize și explicații despre finanțări.', '/blog'],
    ['Știri', 'Programe noi, deadline-uri, politici și oportunități.', '/stiri'],
    ['Parteneri', 'Acceleratoare, fonduri, instituții, universități.', '/parteneri'],
    ['Lista startupuri', 'Catalog de startupuri cu profil, stadiu, nevoi.', '/startupuri'],
    ['Onboarding', 'Ghid pentru fondatori, parteneri și programe.', '/register.html'],
  ];

  // Close mobile panel when clicking a link inside it
  useEffectOrgA(() => {
    const onDocClick = (e) => {
      if (mobileOpen && !e.target.closest('.nav__inner')) setMobileOpen(false);
    };
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, [mobileOpen]);

  return (
    <nav className="nav" onMouseLeave={scheduleClose}>
      <div className="container">
        <div className="nav__inner">
          <a href="/" className="nav__brand" style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="nav__logo">eligibil<span className="nav__logo-dot">.org</span></div>
            <div className="nav__tag">AI Readiness &amp;<br/>Funding Orchestrator</div>
          </a>

          <button
            className="nav__toggle"
            aria-label="Menu"
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? '✕' : '☰'}
          </button>

          <div className={`nav__panel ${mobileOpen ? 'is-open' : ''}`}>
          <div className="nav__links">
            <a className="nav__item" href="/search" onMouseEnter={() => openMenu(null)}>
              Catalog finanțări
            </a>

            <div
              style={{ position: 'relative' }}
              onMouseEnter={() => openMenu('prod')}
            >
              <button
                className={`nav__item ${open === 'prod' ? 'is-open' : ''}`}
                onClick={(e) => { e.stopPropagation(); setOpen(open === 'prod' ? null : 'prod'); }}
              >
                Produse <span className="nav__caret">▾</span>
              </button>
              {open === 'prod' && (
                <div className="nav__dropdown" onMouseEnter={() => openMenu('prod')} onMouseLeave={scheduleClose}>
                  {products.map(p => (
                    <a className="nav__dropdown-item" href={`/produs/${p.id}`} key={p.id}>
                      <div className="nav__dropdown-name">
                        <span className="nav__dropdown-num">{p.n}</span>
                        {p.name}
                      </div>
                      <div className="nav__dropdown-desc">{p.tag}</div>
                    </a>
                  ))}
                  <a className="nav__dropdown-item" href="/produse" style={{ borderTop: '1px solid var(--border-soft)', fontWeight: 600 }}>
                    <div className="nav__dropdown-name">Toate produsele →</div>
                    <div className="nav__dropdown-desc">Vezi pagina dedicată cu toate cele 5 produse AI.</div>
                  </a>
                </div>
              )}
            </div>

            <div
              style={{ position: 'relative' }}
              onMouseEnter={() => openMenu('res')}
            >
              <button
                className={`nav__item ${open === 'res' ? 'is-open' : ''}`}
                onClick={(e) => { e.stopPropagation(); setOpen(open === 'res' ? null : 'res'); }}
              >
                Resurse <span className="nav__caret">▾</span>
              </button>
              {open === 'res' && (
                <div className="nav__dropdown" onMouseEnter={() => openMenu('res')} onMouseLeave={scheduleClose}>
                  {resources.map(([n, d, href]) => (
                    <a className="nav__dropdown-item" href={href} key={n}>
                      <div className="nav__dropdown-name">{n}</div>
                      <div className="nav__dropdown-desc">{d}</div>
                    </a>
                  ))}
                </div>
              )}
            </div>

            <a className="nav__item" href="/about" onMouseEnter={() => openMenu(null)}>
              About
            </a>
          </div>

          <div className="nav__right">
            <div className="langmini">
              {['RO','EN','RU','UA'].map(l => (
                <button
                  key={l}
                  className={lang === l ? 'is-active' : ''}
                  onClick={() => {
                    trackAnalyticsOrg('language_changed', { from_lang: String(lang || '').toLowerCase(), to_lang: l.toLowerCase() });
                    setLang(l);
                  }}
                >
                  {l}
                </button>
              ))}
            </div>
            <a className="btn btn--ghost btn--sm" href="/login.html">Intră în cont</a>
            <a className="btn btn--ghost btn--sm" href="/search">Caută finanțare</a>
            <a className="btn btn--sm btn--accent" href="/upload-artefact">Analizează startupul</a>
          </div>
          </div>
        </div>
      </div>
    </nav>
  );
}

/* ============================================================
   Hero (section 2) + trust strip
   ============================================================ */
function HeroOrg({ lang }) {
  const [activeChip, setActiveChip] = useStateOrgA(null);
  const resourcesHref = lang === 'EN' ? '/en/resources' : '/resurse';
  const popular = [
    'Granturi AI Moldova',
    'SBIR Phase I',
    'EIC Accelerator 2026',
    'Horizon Europe biotech',
    'Capital non-dilutiv RO',
  ];
  return (
    <section className="section org-hero" data-screen-label="01 Hero">
      <div className="container">
        <div className="org-hero__inner">
          <div className="org-hero__top">
            <div className="org-hero__copy">
              <div className="hero__eyebrow">
                <span className="hero__eyebrow-dot" />
                735 surse · 5 produse AI · actualizat acum 2 minute
              </div>
              <h1 className="org-hero__h1">
                Descoperă cele mai bune surse de finanțare pentru <em>startupul&nbsp;tău.</em>
              </h1>
              <p className="org-hero__sub">
                Agregatorul de granturi, competiții și capital non-dilutiv pentru Moldova, România și Europa de Est. Peste 735 de oportunități verificate, actualizate zilnic, cu analiză AI de pregătire pentru fiecare.
              </p>

              <div className="search" style={{ marginTop: 28 }}>
                <div className="search__row">
                  <div className="search__icon">
                    <svg width="16" height="16" viewBox="0 0 16 16"><circle cx="7" cy="7" r="5" fill="none" stroke="currentColor" strokeWidth="1.5"/><line x1="11" y1="11" x2="15" y2="15" stroke="currentColor" strokeWidth="1.5"/></svg>
                  </div>
                  <select className="search__select" defaultValue="">
                    <option value="">Sector</option>
                    {SECTORS.slice(0, 12).map(s => <option key={s.id}>{s.name}</option>)}
                  </select>
                  <select className="search__select" defaultValue="">
                    <option value="">Țară</option>
                    <option>Moldova</option><option>România</option><option>UE</option><option>SUA</option><option>Global</option>
                  </select>
                  <select className="search__select" defaultValue="">
                    <option value="">Tip finanțare</option>
                    <option>Grant</option><option>Accelerator</option><option>Competiție</option><option>SBIR</option><option>Equity</option><option>Non-dilutiv</option><option>Consorțiu</option>
                  </select>
                  <select className="search__select" defaultValue="">
                    <option value="">Sumă</option>
                    <option>&lt; €50K</option><option>€50K – €250K</option><option>€250K – €1M</option><option>€1M+</option>
                  </select>
                  <button className="search__btn">Caută</button>
                </div>
              </div>

              <div className="search__suggest" style={{ marginTop: 14 }}>
                <span className="search__suggest-label">Populare</span>
                {popular.map(s => (
                  <button
                    key={s}
                    className={`chip ${activeChip === s ? 'is-active' : ''}`}
                    onClick={() => setActiveChip(activeChip === s ? null : s)}
                  >{s}</button>
                ))}
              </div>

              <div className="org-hero__ctas" style={{ marginTop: 24 }}>
                <a className="btn btn--accent btn--sm" href={resourcesHref}>Explorează resursele →</a>
                <a className="btn btn--ghost btn--sm" href="#analiza">Analizează startupul meu ↓</a>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.08em', alignSelf: 'center' }}>
                  Sau încarcă deck-ul direct mai jos
                </span>
              </div>
            </div>

            <div className="org-hero__visual">
              <div className="org-hero__visual-head">
                <span>Live · ecosistem eligibil.org</span>
                <span className="live"><span className="dot" /> sync</span>
              </div>

              <div className="hero-stats">
                <div className="hero-stat">
                  <div className="hero-stat__n">47</div>
                  <div className="hero-stat__l">analizate astăzi</div>
                </div>
                <div className="hero-stat">
                  <div className="hero-stat__n">12</div>
                  <div className="hero-stat__l">programe noi · 7 zile</div>
                </div>
                <div className="hero-stat">
                  <div className="hero-stat__n">5/5</div>
                  <div className="hero-stat__l">produse AI active</div>
                </div>
              </div>

              <div className="hero-ticker">
                <div className="hero-ticker__h">Activitate recentă</div>
                <div className="hero-ticker__list">
                  <div className="hero-ticker__row"><span className="t">2m</span><span className="d">new</span><span>EIC Pathfinder · call deschis</span></div>
                  <div className="hero-ticker__row"><span className="t">18m</span><span className="d match">match</span><span>Horizon Health · 84 / 100</span></div>
                  <div className="hero-ticker__row"><span className="t">1h</span><span className="d warn">⏰</span><span>SBIR Phase I · 44 zile</span></div>
                  <div className="hero-ticker__row"><span className="t">2h</span><span className="d">analiză</span><span>AxonAI Labs · TRL 4 estimat</span></div>
                  <div className="hero-ticker__row"><span className="t">3h</span><span className="d">verif</span><span>Startup Moldova · deadline confirmat</span></div>
                  <div className="hero-ticker__row"><span className="t">5h</span><span className="d match">match</span><span>Google for Startups · 92 / 100</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="org-trust">
          {[
            ['735+', 'Surse de finanțare verificate'],
            ['180+', 'Programe europene'],
            ['200+', 'Granturi internaționale'],
            ['50+',  'Fonduri & acceleratoare'],
            ['RO·EN·RU·UA', '4 limbi disponibile'],
          ].map(([n, l]) => (
            <div className="org-trust__cell" key={l}>
              <span className="org-trust__num">{n}</span>
              <span className="org-trust__lbl">{l}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   Quick Filter section (3)
   ============================================================ */
function QuickFilters() {
  const [pick, setPick] = useStateOrgA({
    sector: 'AI & ML', region: 'Moldova', kind: 'Grant', amount: '€50K – €250K', stage: 'Early-stage',
  });

  const sectors  = ['AI & ML', 'Biotech', 'Climate', 'Fintech', 'EdTech', 'Deep Tech', 'Hardware', 'Social', 'SaaS', 'AgriFood', 'Space', 'Defense'];
  const regions  = ['Moldova', 'România', 'UE', 'SUA', 'Global'];
  const kinds    = ['Grant', 'Accelerator', 'Competiție', 'SBIR', 'Equity', 'Non-dilutiv', 'Consorțiu', 'R&D'];
  const amounts  = ['< €50K', '€50K – €250K', '€250K – €1M', '€1M+'];
  const stages   = ['Idea', 'MVP', 'Early-stage', 'Growth', 'R&D', 'Deep tech', 'Spinout'];

  const popular = [
    'Granturi AI Moldova', 'EIC Accelerator 2026', 'Horizon Europe biotech',
    'SBIR Phase I', 'Capital non-dilutiv România', 'Deep tech', 'Consorțiu Horizon',
  ];

  const Group = ({ k, label, opts }) => (
    <div className="qf__col">
      <h4>{label}</h4>
      <div className="qf__chips">
        {opts.map(o => (
          <button
            key={o}
            className={`qf__chip ${pick[k] === o ? 'is-active' : ''}`}
            onClick={() => setPick({ ...pick, [k]: pick[k] === o ? '' : o })}
          >{o}</button>
        ))}
      </div>
    </div>
  );

  return (
    <section className="section" data-screen-label="02 Filters">
      <div className="container">
        <div className="section__label">05 — Caută inteligent</div>
        <div className="qf">
          <div className="qf__head">
            <h2 className="display">Găsește oportunitatea potrivită în mai puțin de un minut.</h2>
            <p>5 filtre · 735 surse · 0 link-uri moarte</p>
          </div>
          <div className="qf__row">
            <Group k="sector" label="Sector"        opts={sectors} />
            <Group k="region" label="Țară / Regiune" opts={regions} />
            <Group k="kind"   label="Tip finanțare"  opts={kinds} />
            <Group k="amount" label="Sumă"           opts={amounts} />
            <Group k="stage"  label="Stadiu"         opts={stages} />
          </div>
          <div className="qf__foot">
            <div className="qf__pop">
              <span>Populare:</span>
              {popular.map(p => (
                <button key={p} className="qf__chip">{p}</button>
              ))}
            </div>
            <button className="btn btn--accent">Caută oportunități →</button>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   Deadlines (section 4)
   ============================================================ */
function Deadlines() {
  return (
    <section className="section" data-screen-label="02 Deadlines">
      <div className="container">
        <div className="section__label">02 — Termene importante</div>
        <div className="section__head section__head--row">
          <div>
            <h2 className="section__title">Deadline-uri apropiate</h2>
            <p className="section__sub">Programe active și oportunități cu termene importante. Actualizate și verificate periodic.</p>
          </div>
          <button className="btn--link">Vezi calendar complet →</button>
        </div>

        <div className="deadlines">
          {window.ORG_DEADLINES.map((d, i) => (
            <div className="deadline" key={i}>
              <div className="deadline__head">
                <div>
                  <span className={`status-pill ${d.status}`}>
                    <span className="status-pill__dot" />
                    {d.status === 'live' ? 'Activ' : 'În curând'}
                  </span>
                  <div className="deadline__name" style={{ marginTop: 10 }}>{d.name}</div>
                  <div className="deadline__region" style={{ marginTop: 4 }}>{d.flag} {d.region}</div>
                </div>
                <div className="deadline__count">
                  <span className="deadline__count-d">{d.days !== null ? d.days : '∞'}</span>
                  <span className="deadline__count-l">{d.days !== null ? 'zile rămase' : 'rolling'}</span>
                </div>
              </div>

              <div className="deadline__facts">
                <div className="deadline__fact"><span className="deadline__fact-k">Tip</span><span>{d.type}</span></div>
                <div className="deadline__fact"><span className="deadline__fact-k">Sumă</span><span>{d.amount}</span></div>
                <div className="deadline__fact"><span className="deadline__fact-k">Potrivit</span><span>{d.fit}</span></div>
                <div className="deadline__fact"><span className="deadline__fact-k">TRL</span><span>{d.trl}</span></div>
                <div className="deadline__fact"><span className="deadline__fact-k">Deadline</span><span style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 600 }}>{d.deadline}</span></div>
              </div>

              <div className="deadline__foot">
                <div className="deadline__tags">
                  {d.sectors.map(s => <span className="program__tag" key={s}>{s}</span>)}
                </div>
                <a href="#" style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, textTransform: 'uppercase', letterSpacing: '.1em', borderBottom: '1px solid var(--accent)', color: 'var(--accent)', paddingBottom: 2 }}>
                  Analizează →
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   Positioning (section 5)
   ============================================================ */
function Positioning() {
  const keys = [
    ['vezi rapid ce programe sunt relevante;'],
    ['înțelegi ce documente îți lipsesc;'],
    ['primești scoruri de potrivire și pregătire;'],
    ['poți genera sau îmbunătăți documente de aplicare;'],
    ['poți identifica parteneri pentru consorții;'],
    ['poți urmări deadline-uri și programe noi.'],
  ];
  return (
    <section className="section" data-screen-label="04 Positioning">
      <div className="container">
        <div className="section__label">10 — Poziționare</div>
        <div className="posi">
          <div className="posi__left">
            <h2 className="section__title">Agregatorul de finanțare pentru startupuri, cercetători și fondatori din Europa de Est.</h2>
            <p className="section__sub" style={{ maxWidth: 'none' }}>
              eligibil.org unește sute de surse de finanțare într-un singur loc și oferă fondatorilor claritate asupra oportunităților potrivite pentru contextul lor. Pentru fiecare program nu vezi doar un link, ci o analiză completă: eligibilitate, potrivire, pregătire, documente necesare, deadline și pași următori.
            </p>
            <div style={{ marginTop: 32, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <button className="btn btn--accent">Caută finanțare →</button>
              <button className="btn btn--ghost">Analizează startupul</button>
            </div>
          </div>
          <div className="posi__right">
            <div className="section__label" style={{ margin: '0 0 18px' }}>Cu eligibil.org poți</div>
            <div className="posi__keys">
              {keys.map(([k], i) => (
                <div className="posi__key" key={i}>
                  <span className="posi__key-n">0{i+1}</span>
                  <span>{k}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   Products (section 6) — 5 AI products
   ============================================================ */
function ProductsOrg() {
  return (
    <section className="section" data-screen-label="05 Products" id="products">
      <div className="container">
        <div className="section__label">05 — Produse AI</div>

        <div className="product-intro" style={{ marginBottom: 0 }}>
          <div>
            <h2>Produse AI pentru fondatori care vor să devină eligibili mai repede.</h2>
            <p>Nu este suficient să găsești un grant. Trebuie să înțelegi dacă ai șanse reale, ce lipsește și cum îți îmbunătățești aplicația.</p>
          </div>
          <div className="product-intro__counter">
            <strong>5</strong>
            produse AI · beta gratuită
          </div>
        </div>

        <div className="products">
          {window.ORG_PRODUCTS.map((p, i) => (
            <a className="product" key={p.id} id={`prod-${p.id}`} href={`/produs/${p.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
              <div className="product__head">
                <span className="product__n">{p.n} / 05</span>
                <span className="product__code">{p.code}</span>
              </div>
              <div className="product__thumb">
                <Thumb kind={p.thumb} seed={i + 51} />
              </div>
              <div className="product__body">
                <div>
                  <div className="product__tag">{p.tag}</div>
                  <h3 className="product__name">{p.name}</h3>
                </div>
                <div className="product__fmt">{p.formats}</div>
                <p className="product__desc">{p.desc}</p>
                <div className="product__deliver">
                  <div className="product__deliver-h">Ce primești</div>
                  {p.deliver.map(d => (
                    <div className="product__deliver-item" key={d}>{d}</div>
                  ))}
                </div>
              </div>
              <div className="product__foot">
                <span className="product__cta">{p.cta}</span>
                <span style={{ color: 'var(--accent)' }}>→</span>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

Object.assign(window, { NavOrg, HeroOrg, QuickFilters, Deadlines, Positioning, ProductsOrg });
