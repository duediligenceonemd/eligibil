const { useState: useStateProduse, useEffect: useEffectProduse } = React;

function ProductListPage() {
  const products = window.ORG_PRODUCTS || [];
  return (
    <section className="section" data-screen-label="Toate produsele">
      <div className="container">
        <div className="section__label">PRODUSE · 5 INSTRUMENTE AI</div>
        <div className="section__head">
          <h1 className="section__title">Produse AI pentru fondatori care vor să devină eligibili mai repede.</h1>
          <p className="section__sub">
            Cele 5 instrumente eligibil.org care îți analizează pitch deck-ul, video pitch-ul, whitepaper-ul, estimează TRL-ul și identifică consorțiul potrivit. Fiecare produs are pagină dedicată cu descriere, FAQ și posibilitatea de a încărca documentul direct.
          </p>
        </div>

        <div className="products" style={{ marginTop: 32 }}>
          {products.map((p, i) => (
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

        <div style={{ marginTop: 48, padding: 28, background: 'var(--bg-2)', border: '1px solid var(--border-soft)' }}>
          <h3 style={{ fontSize: 22, marginBottom: 8 }}>Începe analiza startupului tău</h3>
          <p style={{ color: 'var(--ink-2)', fontSize: 14, marginBottom: 16 }}>
            Creează cont gratuit în 30 de secunde, încarcă pitch deck-ul sau whitepaper-ul și primește primul raport AI cu scoruri de pregătire, recomandări de granturi și pași concreți de aplicare.
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <a className="btn btn--accent" href="/register.html">Înregistrează startupul →</a>
            <a className="btn btn--ghost" href="/produs/pitch">Analizează pitch deck</a>
            <a className="btn btn--ghost" href="/search">Vezi catalogul de granturi</a>
          </div>
        </div>
      </div>
    </section>
  );
}

function App() {
  const [lang, setLangState] = useStateProduse((window.getLanguage && window.getLanguage()) || 'RO');
  const setLang = (l) => { setLangState(l); if (window.setLanguage) window.setLanguage(l); };
  useEffectProduse(() => {
    const onLang = (e) => setLangState(e.detail.lang);
    window.addEventListener('languagechange', onLang);
    return () => window.removeEventListener('languagechange', onLang);
  }, []);
  return (
    <>
      <NavOrg lang={lang} setLang={setLang} />
      <ProductListPage />
      <FooterOrg lang={lang} setLang={setLang} />
    </>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
