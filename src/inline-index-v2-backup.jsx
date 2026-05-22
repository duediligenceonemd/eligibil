const { useState, useEffect } = React;

function NavV2({ lang, setLang }) {
  const [open, setOpen] = useState(null);
  const timer = React.useRef(null);
  const openM = (k) => { clearTimeout(timer.current); setOpen(k); };
  const closeM = () => { timer.current = setTimeout(() => setOpen(null), 120); };
  return (
    <nav className="nav" onMouseLeave={closeM}>
      <div className="container">
        <div className="nav__inner">
          <div className="nav__brand">
            <div className="nav__logo">eligibil<span className="nav__logo-dot">.org</span></div>
            <div className="nav__tag">AI Readiness &amp;<br/>Funding Orchestrator</div>
          </div>
          <div className="nav__links">
            <button className="nav__item" onMouseEnter={() => openM(null)} style={{ color: 'var(--accent)', fontWeight: 600 }}>
              Analiză AI <span className="nav__badge">nou</span>
            </button>
            <NavItemV2 label="Surse de finanțare" k="finantari" open={open} openMenu={openM} />
            <NavItemV2 label="Programe active" k="programe" open={open} openMenu={openM} />
            <NavItemV2 label="Parteneri" k="parteneri" open={open} openMenu={openM} />
            <NavItemV2 label="Resurse" k="resurse" open={open} openMenu={openM} />
          </div>
          <div className="nav__right">
            <div className="langmini">
              {['RO','EN','RU','UA'].map(l => (
                <button key={l} className={lang === l ? 'is-active' : ''} onClick={() => setLang(l)}>{l}</button>
              ))}
            </div>
            <a href="/login.html" className="btn btn--ghost btn--sm">Intră în cont</a>
            <a href="/register.html" className="btn btn--sm btn--accent">Încearcă gratuit →</a>
          </div>
        </div>
      </div>
      {open && <MegaMenuV2 k={open} onMouseEnter={() => openM(open)} onMouseLeave={closeM} />}
    </nav>
  );
}

function NavItemV2({ label, k, open, openMenu }) {
  return (
    <button className={`nav__item ${open === k ? 'is-open' : ''}`} onMouseEnter={() => openMenu(k)}>
      {label} <span className="nav__caret">▾</span>
    </button>
  );
}

function MegaMenuV2({ k, onMouseEnter, onMouseLeave }) {
  const data = MEGA[k];
  if (!data) return null;
  // megaItemUrl / megaBannerUrl are defined globally in components-a.jsx
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
                    <span>{name}</span>{n && <span className="mono">{n}</span>}
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
            <a href={megaBannerUrl(k)} style={{ color: 'var(--bg)', borderBottom: '1px solid var(--bg)', paddingBottom: 2, fontSize: 13, width: 'fit-content' }}>{data.banner.cta}</a>
          </div>
        </div>
      </div>
    </div>
  );
}

function FAQV2() {
  const [open, setOpen] = useState(0);
  const all = [...FAQS_V2_EXTRA, ...FAQS];
  return (
    <section className="section" data-screen-label="13 FAQ">
      <div className="container">
        <div className="section__label">12 — Întrebări frecvente</div>
        <div className="faq-grid">
          <div>
            <h2 className="section__title">Cum funcționează matching-ul AI?</h2>
            <p className="section__sub">Răspundem întrebărilor pe care ni le pun cel mai des fondatorii — despre upload, TRL, scoruri, plan și securitate.</p>
          </div>
          <div className="faq">
            {all.map((f, i) => (
              <div className={`faq__item ${open === i ? 'is-open' : ''}`} key={i}>
                <button className="faq__q" onClick={() => setOpen(open === i ? -1 : i)}>
                  <span>{f.q}</span><span className="faq__plus">+</span>
                </button>
                <div className="faq__a">{f.a}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function FinalCTAV2() {
  return (
    <section className="section" data-screen-label="14 CTA">
      <div className="container">
        <div className="section__label">13 — Începe acum</div>
        <div className="cta-dual">
          <div className="cta-card">
            <div className="mono" style={{ fontSize: 11, opacity: .6, textTransform: 'uppercase', letterSpacing: '.12em', marginBottom: 14 }}>Pentru fondatori</div>
            <h3>Ești fondator sau cercetător?</h3>
            <p>Încarcă pitch deck-ul, video-ul sau whitepaper-ul. În 90 de secunde afli la ce granturi ești eligibil și exact ce trebuie să faci să devii maxim competitiv.</p>
            <div className="cta-card__btns">
              <a href="/upload-artefact" className="btn btn--accent">Analizează-mi startupul gratuit →</a>
              <a href="/search" className="btn btn--ghost" style={{ color: 'var(--bg)', borderColor: 'var(--bg)' }}>Răsfoiește catalogul</a>
            </div>
          </div>
          <div className="cta-card">
            <div className="mono" style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.12em', marginBottom: 14 }}>Pentru parteneri</div>
            <h3>Reprezinți un accelerator, fond sau program?</h3>
            <p>Listează-te gratuit în catalog și ajunge la mii de fondatori pre-calificați din Moldova, România și Europa de Est.</p>
            <div className="cta-card__btns">
              <a href="/register.html" className="btn btn--accent">Listează-te gratuit →</a>
              <a href="/register.html" className="btn btn--ghost">Revendică profil</a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function App() {
  const [lang, setLangState] = useState((window.getLanguage && window.getLanguage()) || 'RO');
  const setLang = (l) => {
    setLangState(l);
    if (window.setLanguage) window.setLanguage(l);
  };
  const [showAI, setShowAI] = useState(window.__TWEAKS?.showAI ?? true);
  useEffect(() => {
    const onT = (e) => setShowAI(e.detail.showAI);
    window.addEventListener('tweaks-change', onT);
    const onLang = (e) => setLangState(e.detail.lang);
    window.addEventListener('languagechange', onLang);
    return () => {
      window.removeEventListener('tweaks-change', onT);
      window.removeEventListener('languagechange', onLang);
    };
  }, []);
  return (
    <>
      <NavV2 lang={lang} setLang={setLang} />
      <HeroV2 />
      <MatchingFlow />
      <SampleReport />
      <TRLSection />
      <DualMode />
      <SectorGrid />
      <CountryGrid />
      <ActivePrograms />
      {showAI && <DocGen />}
      <Reports />
      <Partners />
      <Blog />
      <GetListed />
      <DataQuality />
      <FAQV2 />
      <FinalCTAV2 />
      <Footer lang={lang} setLang={setLang} />
    </>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
