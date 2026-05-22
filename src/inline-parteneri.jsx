const { useState: useStatePartners, useEffect: useEffectPartners } = React;

function PartnersListPage() {
  return (
    <section className="section" data-screen-label="Lista parteneri">
      <div className="container">
        <div className="section__label">PARTENERI · VERIFICAȚI</div>
        <div className="section__head">
          <h1 className="section__title">Acceleratoare, fonduri și organizații care construiesc ecosistemul.</h1>
          <p className="section__sub">
            {window.ORG_PARTNERS?.length || 0} parteneri verificați — programe publice, fonduri private, acceleratoare și instituții care își mențin activ profilul. Toți sunt eligibili să primească aplicații pre-calificate prin eligibil.org.
          </p>
        </div>

        <div className="partners" style={{ marginTop: 32 }}>
          {(window.ORG_PARTNERS || []).map((p, i) => {
            const slug = (p.name || '').toLowerCase()
              .replace(/[ăâîșț]/g, c => ({'ă':'a','â':'a','î':'i','ș':'s','ț':'t'}[c] || c))
              .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
            return (
            <a className="partner" key={i} href={`/parteneri/${slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
              <div className="partner__logo"><Thumb kind={p.thumb} seed={i + 161} /></div>
              <div>
                <div className="partner__head">
                  {p.verified && <span className="partner__verified">✓ Verified</span>}
                  <span className="partner__country">{p.flag} {p.region}</span>
                </div>
                <h3 className="partner__name">{p.name}</h3>
                <div className="partner__sub">{p.type}</div>
                <p className="partner__desc">{p.desc}</p>
                <div className="partner__tags">
                  {p.tags?.map(t => <span className="program__tag" key={t}>{t}</span>)}
                </div>
                <div className="partner__cta">
                  <span>Vezi profil</span>
                  <span>→</span>
                </div>
              </div>
            </a>
            );
          })}
        </div>

        <div style={{ marginTop: 32 }}>
          <EmailCapture
            context="parteneri"
            heading="Update-uri despre parteneri și consorții"
            sub="Notificări când acceleratoarele, fondurile și universitățile din rețea lansează apeluri sau caută parteneri pentru consorții."
          />
        </div>

        <div style={{ marginTop: 48, padding: 28, background: 'var(--bg-2)', border: '1px solid var(--border-soft)' }}>
          <h3 style={{ fontSize: 22, marginBottom: 8 }}>Ești accelerator, fond sau program?</h3>
          <p style={{ color: 'var(--ink-2)', fontSize: 14, marginBottom: 16 }}>
            Listează-te gratuit în catalog, primește badge "Verified" după confirmare, și ajunge la aplicanți pre-calificați.
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <a className="btn btn--accent" href="/register.html?type=partner">Listează organizația →</a>
            <a className="btn btn--ghost" href="/register.html?claim=1">Revendică profil existent</a>
          </div>
        </div>
      </div>
    </section>
  );
}

function App() {
  const [lang, setLangState] = useStatePartners((window.getLanguage && window.getLanguage()) || 'RO');
  const setLang = (l) => { setLangState(l); if (window.setLanguage) window.setLanguage(l); };
  useEffectPartners(() => {
    const onLang = (e) => setLangState(e.detail.lang);
    window.addEventListener('languagechange', onLang);
    return () => window.removeEventListener('languagechange', onLang);
  }, []);
  return (
    <>
      <NavOrg lang={lang} setLang={setLang} />
      <PartnersListPage />
      <FooterOrg lang={lang} setLang={setLang} />
    </>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
