const { useState: useStatePt, useEffect: useEffectPt } = React;

const DIACRITICS = { 'ă':'a','â':'a','î':'i','ș':'s','ț':'t' };
function slugify(s) {
  return (s || '').toLowerCase().replace(/[ăâîșț]/g, c => DIACRITICS[c] || c)
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

function PartnerPage() {
  const slug = (location.pathname.match(/^\/parteneri\/([a-z0-9-]+)/i) || [])[1];
  const partners = window.ORG_PARTNERS || [];
  const p = partners.find(x => slugify(x.name) === slug);

  if (!p) {
    return (
      <section className="section">
        <div className="container">
          <div className="pt__crumbs"><a href="/">Acasă</a> › <a href="/parteneri">Parteneri</a></div>
          <h1 className="pt__title">Partener negăsit</h1>
          <p className="pt__desc">Slug-ul <code>/parteneri/{slug || '(gol)'}</code> nu corespunde niciunui partener listat. Vezi <a href="/parteneri">catalogul complet</a>.</p>
        </div>
      </section>
    );
  }

  const programs = p.programs || [];

  return (
    <>
      <section className="pt__hero">
        <div className="container">
          <div className="pt__crumbs">
            <a href="/">Acasă</a> › <a href="/parteneri">Parteneri</a> › <span>{p.name}</span>
          </div>
          <div className="pt__head">
            <div className="pt__logo"><Thumb kind={p.thumb} seed={p.name.length} /></div>
            <div className="pt__meta">
              <div>
                {p.verified && <span className="pt__verified">✓ Verified</span>}
                <span className="pt__region">{p.flag} {p.region}</span>
              </div>
              <h1 className="pt__title">{p.name}</h1>
              <div className="pt__sub">{p.type}</div>
              <p className="pt__desc">{p.desc}</p>
              <div className="pt__tags">
                {p.tags?.map(t => <span className="pt__tag" key={t}>{t}</span>)}
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="container pt__body">
        <div>
          <div className="pt__section">
            <div className="pt__sidehead">Despre organizație</div>
            <h3>Ce face {p.name}</h3>
            <p>
              {p.about || `${p.name} este un ${p.type.toLowerCase()} cu sediul în ${p.region}, activ în ecosistemul de finanțare pentru startupuri. Lucrează cu fondatori, cercetători și echipe care vor să acceseze granturi, capital non-dilutiv, programe colaborative europene sau acceleratoare.`}
            </p>
            <p>
              {p.focus || `Focusul principal include sectoarele ${(p.tags || []).join(', ')} și colaborări cu programe europene precum Horizon Europe, EIC sau parteneriate cu fonduri și universități din regiune.`}
            </p>
          </div>

          {programs.length > 0 && (
            <div className="pt__section">
              <div className="pt__sidehead">Programe active</div>
              <h3>Apeluri și inițiative</h3>
              {programs.map((pr, i) => (
                <div key={i} style={{ padding: '14px 0', borderBottom: '1px solid var(--border-soft)' }}>
                  <strong>{pr.name}</strong> — <span style={{ color: 'var(--ink-2)' }}>{pr.desc}</span>
                </div>
              ))}
            </div>
          )}

          <div className="pt__section">
            <div className="pt__sidehead">Cum poți colabora</div>
            <h3>Următorii pași</h3>
            <p>
              Dacă ești fondator care vrea să aplice la programe susținute de {p.name}, începe prin a încărca pitch deck-ul sau whitepaper-ul în eligibil.org. Vei primi un raport cu Match Score față de tipologia partenerului, plus recomandări concrete pentru îmbunătățirea aplicării.
            </p>
            <div className="pt__cta-row">
              <a className="btn btn--accent" href="/register.html">Înregistrează startupul →</a>
              <a className="btn btn--ghost" href="/upload-artefact">Analizează pitch deck</a>
              <a className="btn btn--ghost" href={`/search?q=${encodeURIComponent(p.name)}`}>Granturi asociate</a>
            </div>
          </div>

          <EmailCapture
            context={`partener:${slug}`}
            heading={`Update-uri de la ${p.name}`}
            sub={`Primește notificări când ${p.name} lansează apeluri noi, programe sau evenimente publice. Frecvență redusă, fără spam.`}
          />
        </div>

        <aside>
          <div className="pt__aside">
            <dl style={{ margin: 0 }}>
              <dt>Tip organizație</dt>
              <dd>{p.type}</dd>
              <dt>Regiune</dt>
              <dd>{p.flag} {p.region}</dd>
              <dt>Status</dt>
              <dd>{p.verified ? 'Verificat eligibil.org ✓' : 'În verificare'}</dd>
              <dt>Sectoare</dt>
              <dd>{(p.tags || []).join(', ') || '—'}</dd>
              {p.website && (<><dt>Website</dt><dd><a href={p.website} target="_blank" rel="noopener">{p.website}</a></dd></>)}
              {p.email && (<><dt>Contact</dt><dd><a href={`mailto:${p.email}`}>{p.email}</a></dd></>)}
            </dl>
            <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--border-soft)' }}>
              <a className="btn btn--ghost btn--sm" href="/parteneri" style={{ width: '100%', justifyContent: 'center' }}>← Toți partenerii</a>
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}

function App() {
  const [lang, setLangState] = useStatePt((window.getLanguage && window.getLanguage()) || 'RO');
  const setLang = (l) => { setLangState(l); if (window.setLanguage) window.setLanguage(l); };
  useEffectPt(() => {
    const onLang = (e) => setLangState(e.detail.lang);
    window.addEventListener('languagechange', onLang);
    return () => window.removeEventListener('languagechange', onLang);
  }, []);
  return (
    <>
      <NavOrg lang={lang} setLang={setLang} />
      <PartnerPage />
      <FooterOrg lang={lang} setLang={setLang} />
    </>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
