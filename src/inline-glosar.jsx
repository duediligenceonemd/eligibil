const { useState: useStateG, useEffect: useEffectG, useMemo: useMemoG } = React;

const DIACRITICS_MAP = { 'ă':'a','â':'a','î':'i','ș':'s','ț':'t','Ă':'A','Â':'A','Î':'I','Ș':'S','Ț':'T' };
function strip(s) { return (s || '').replace(/[ăâîșțĂÂÎȘȚ]/g, c => DIACRITICS_MAP[c] || c).toLowerCase(); }

function GlossaryPage() {
  const terms = window.ORG_GLOSAR || [];
  const tags  = window.GLOSAR_TAGS || [];
  const popular = window.GLOSAR_POPULAR || [];

  const [q, setQ] = useStateG('');
  const [activeTags, setActiveTags] = useStateG(new Set());

  // Open the term whose slug matches location.hash on first load
  useEffectG(() => {
    if (location.hash && location.hash.length > 1) {
      const el = document.getElementById(location.hash.slice(1));
      if (el) {
        if (el.tagName === 'DETAILS') el.open = true;
        setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'start' }), 150);
      }
    }
  }, []);

  const filtered = useMemoG(() => {
    const nq = strip(q);
    return terms.filter(t => {
      if (activeTags.size > 0 && !(t.tags || []).some(x => activeTags.has(x))) return false;
      if (!nq) return true;
      const hay = strip(t.term + ' ' + t.body + ' ' + (t.example || ''));
      return hay.includes(nq);
    });
  }, [q, activeTags, terms]);

  // Group by first letter (uppercase, diacritic-stripped)
  const grouped = useMemoG(() => {
    const m = {};
    for (const t of filtered) {
      const L = strip(t.term).charAt(0).toUpperCase() || '#';
      (m[L] = m[L] || []).push(t);
    }
    return m;
  }, [filtered]);

  const allLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  const availableLetters = new Set(Object.keys(grouped));

  function toggleTag(id) {
    const next = new Set(activeTags);
    next.has(id) ? next.delete(id) : next.add(id);
    setActiveTags(next);
  }

  return (
    <>
      <section className="gl__hero">
        <div className="container">
          <div className="gl__crumbs">
            <a href="/">Acasă</a> › <span>Glosar</span>
          </div>
          <h1 className="gl__title">Glosar de finanțare pentru startupuri</h1>
          <p className="gl__sub">
            Termeni esențiali explicați simplu pentru fondatori, cercetători, startupuri și echipe care caută granturi, acceleratoare, capital non-dilutiv, investiții, consorții sau finanțare europeană.
          </p>
          <p className="gl__intro">
            Finanțarea pentru startupuri vine cu un limbaj propriu: grant, equity, TRL, consorțiu, cofinanțare, readiness, impact, work packages, milestone-uri, blended finance, cap table, runway, PMF, CAC, LTV sau due diligence. Acest glosar explică termenii pe care îi vei întâlni când cauți, compari sau aplici la programe de finanțare prin eligibil.org.
          </p>

          <input
            type="text"
            className="gl__search"
            placeholder="Caută un termen…  ex: TRL, MVP, EIC, cofinanțare, runway"
            value={q}
            onChange={e => setQ(e.target.value)}
          />
          <div className="gl__count">{filtered.length} din {terms.length} termeni afișați</div>

          <div className="gl__pills">
            <span className={'gl__pill' + (activeTags.size === 0 ? ' active' : '')} onClick={() => setActiveTags(new Set())}>Toți termenii</span>
            {tags.map(t => (
              <span key={t.id} className={'gl__pill' + (activeTags.has(t.id) ? ' active' : '')} onClick={() => toggleTag(t.id)}>
                {t.label}
              </span>
            ))}
          </div>
        </div>
      </section>

      <div className="container">
        <nav className="gl__az" aria-label="A–Z navigation">
          {allLetters.map(L => (
            <a
              key={L}
              href={availableLetters.has(L) ? '#L-' + L : undefined}
              className={availableLetters.has(L) ? '' : 'disabled'}
            >
              {L}
            </a>
          ))}
        </nav>

        {filtered.length === 0 ? (
          <div className="gl__empty">
            Niciun termen nu corespunde căutării. Încearcă alt cuvânt sau resetează filtrele.
          </div>
        ) : (
          allLetters.filter(L => grouped[L]).map(L => (
            <section key={L} id={'L-' + L} className="gl__letter">
              <h2>{L}</h2>
              {grouped[L].map(t => (
                <details key={t.slug} id={t.slug} className="gl__term">
                  <summary>{t.term}</summary>
                  <p>{t.body}</p>
                  {t.example && <div className="gl__ex"><strong>Exemplu:</strong> {t.example}</div>}
                  {t.tags?.length > 0 && (
                    <div className="gl__tags">
                      {t.tags.map(x => <span key={x} className="gl__tag">{(tags.find(y => y.id === x) || {}).label || x}</span>)}
                    </div>
                  )}
                </details>
              ))}
            </section>
          ))
        )}
      </div>

      <section className="gl__popular">
        <div className="container">
          <h3>Căutări populare</h3>
          <div className="gl__popular-chips">
            {popular.map(p => (
              <span key={p} className="gl__popular-chip" onClick={() => setQ(p)}>{p}</span>
            ))}
          </div>
        </div>
      </section>

      <section className="gl__cta">
        <div className="container">
          <h2>Nu știi ce program ți se potrivește?</h2>
          <p>
            Folosește eligibil.org pentru a compara granturi, acceleratoare și surse de capital non-dilutiv. Încarcă pitch deck-ul, video-ul sau whitepaper-ul și primește scoruri de potrivire, pregătire și pași concreți pentru aplicare.
          </p>
          <div className="gl__cta-btns">
            <a className="btn btn--accent" href="/search">Caută finanțare →</a>
            <a className="btn btn--ghost" href="/upload-artefact">Analizează startupul meu</a>
            <a className="btn btn--ghost" href="/search">Vezi catalogul de granturi</a>
            <a className="btn btn--ghost" href="/register.html">Creează profil startup</a>
          </div>
        </div>
      </section>
    </>
  );
}

function App() {
  const [lang, setLangState] = useStateG((window.getLanguage && window.getLanguage()) || 'RO');
  const setLang = (l) => { setLangState(l); if (window.setLanguage) window.setLanguage(l); };
  useEffectG(() => {
    const onLang = (e) => setLangState(e.detail.lang);
    window.addEventListener('languagechange', onLang);
    return () => window.removeEventListener('languagechange', onLang);
  }, []);
  return (
    <>
      <NavOrg lang={lang} setLang={setLang} />
      <GlossaryPage />
      <FooterOrg lang={lang} setLang={setLang} />
    </>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
