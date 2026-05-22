const { useState: useStateStartups, useEffect: useEffectStartups } = React;

function StartupListPage() {
  const rows = window.ORG_STARTUPS || [];
  return (
    <section className="section" data-screen-label="Lista startupuri">
      <div className="container">
        <div className="section__label">STARTUPURI · CATALOG PUBLIC</div>
        <div className="section__head">
          <h1 className="section__title">Startupuri înregistrate pe eligibil.org.</h1>
          <p className="section__sub">
            {rows.length} startupuri caută finanțare, parteneri pentru consorții sau acces la programe specifice. Vezi profilul fiecăruia, sumele căutate și stadiul de deschidere pentru consorțiu.
          </p>
        </div>

        <div className="stab" style={{ marginTop: 32 }}>
          <div className="stab__head">
            <span>Startup</span>
            <span>Verticală</span>
            <span>Stadiu</span>
            <span>TRL</span>
            <span>Caută</span>
            <span>Sumă</span>
            <span>Consorțiu</span>
            <span>Acțiune</span>
          </div>
          {rows.map((s, i) => {
            const cls = s.cons === 'open' ? 'open' : s.cons === 'forming' ? 'forming' : 'closed';
            return (
              <a className="stab__row" key={i} href={`/search?q=${encodeURIComponent(s.name)}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                <span className="stab__name" data-label="Startup">{s.flag} {s.name}</span>
                <span data-label="Verticală">{s.vert}</span>
                <span className="stab__cell-mono" data-label="Stadiu">{s.stage}</span>
                <span className="stab__cell-mono" data-label="TRL">TRL {s.trl}</span>
                <span data-label="Caută">{s.looking}</span>
                <span className="stab__cell-mono" data-label="Sumă">{s.ask}</span>
                <span data-label="Consorțiu"><span className={`stab__pill ${cls}`}>{s.cons}</span></span>
                <span data-label="Acțiune" style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '.08em' }}>Profil →</span>
              </a>
            );
          })}
        </div>

        <div style={{ marginTop: 48, padding: 28, background: 'var(--bg-2)', border: '1px solid var(--border-soft)' }}>
          <h3 style={{ fontSize: 22, marginBottom: 8 }}>Ești startup în căutare de finanțare?</h3>
          <p style={{ color: 'var(--ink-2)', fontSize: 14, marginBottom: 16 }}>
            Listează-te în catalog, primește scoruri AI pe pitch deck-ul tău și acces la consorții care caută parteneri ca tine.
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <a className="btn btn--accent" href="/register.html">Listează startupul →</a>
            <a className="btn btn--ghost" href="/upload-artefact">Analizează pitch deck</a>
          </div>
        </div>
      </div>
    </section>
  );
}

function App() {
  const [lang, setLangState] = useStateStartups((window.getLanguage && window.getLanguage()) || 'RO');
  const setLang = (l) => { setLangState(l); if (window.setLanguage) window.setLanguage(l); };
  useEffectStartups(() => {
    const onLang = (e) => setLangState(e.detail.lang);
    window.addEventListener('languagechange', onLang);
    return () => window.removeEventListener('languagechange', onLang);
  }, []);
  return (
    <>
      <NavOrg lang={lang} setLang={setLang} />
      <StartupListPage />
      <FooterOrg lang={lang} setLang={setLang} />
    </>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
