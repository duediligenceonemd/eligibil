const { useState: useStateP, useEffect: useEffectP, useRef: useRefP } = React;

function ProductPage() {
  const slug = (location.pathname.match(/^\/produs\/([a-z]+)/) || [])[1];
  const p = (window.ORG_PRODUCTS || []).find(x => x.id === slug);

  const [state, setState] = useStateP('idle'); // idle | uploading | processing | results | error
  const [errMsg, setErrMsg] = useStateP('');
  const [result, setResult] = useStateP(null);
  const fileInputRef = useRefP(null);

  if (!p) {
    return (
      <section className="section">
        <div className="container">
          <div className="pp__crumbs"><a href="/">Acasă</a> › <a href="/#products">Produse</a></div>
          <h1 className="pp__title">Produs negăsit</h1>
          <p className="pp__desc">Slug-ul <code>/produs/{slug || '(gol)'}</code> nu corespunde niciunui produs activ. Vezi <a href="/#products">lista de produse</a>.</p>
        </div>
      </section>
    );
  }

  async function handleFile(file) {
    if (p.maxMb && file.size > p.maxMb * 1024 * 1024) {
      setState('error');
      setErrMsg('Fișierul depășește ' + p.maxMb + ' MB.');
      return;
    }
    setState('uploading');
    const fd = new FormData();
    fd.append('file', file);

    let resp, body;
    try {
      resp = await fetch('/api/artefacts/upload?product=' + encodeURIComponent(p.id), {
        method: 'POST', body: fd, credentials: 'same-origin'
      });
    } catch (e) {
      setState('error'); setErrMsg('Eroare de rețea: ' + e.message); return;
    }
    if (resp.status === 401) {
      // Anonymous — push to register flow
      location.href = '/register.html?next=' + encodeURIComponent('/produs/' + p.id);
      return;
    }
    try { body = await resp.json(); } catch { body = {}; }
    if (!resp.ok) {
      setState('error');
      setErrMsg(body?.error || ('Upload eșuat (' + resp.status + ')'));
      return;
    }

    setState('processing');
    const artefactId = body.artefact_id;
    for (let tries = 0; tries < 40; tries++) {
      await new Promise(r => setTimeout(r, 1500));
      let st;
      try {
        const r = await fetch('/api/artefacts/' + artefactId, { credentials: 'same-origin' });
        st = await r.json();
      } catch { continue; }
      if (st.artefact?.status === 'analyzed' || st.artefact?.status === 'awaiting_credits') {
        setResult(st);
        setState('results');
        return;
      }
      if (st.artefact?.status === 'failed') {
        setState('error');
        setErrMsg(st.artefact.error_message || 'Analiza a eșuat.');
        return;
      }
    }
    setState('error');
    setErrMsg('Timeout — analiza durează prea mult. Verifică în dashboard.');
  }

  function onDrop(e) {
    e.preventDefault();
    if (e.dataTransfer.files?.length) handleFile(e.dataTransfer.files[0]);
  }
  function onChange(e) {
    if (e.target.files?.length) handleFile(e.target.files[0]);
  }

  return (
    <>
      <section className="pp__hero" data-screen-label={`Produs · ${p.code}`}>
        <div className="container">
          <div className="pp__crumbs">
            <a href="/">Acasă</a> › <a href="/#products">Produse</a> › <span>{p.name}</span>
          </div>
          <div className="pp__code">{p.n} / 05 · {p.code}</div>
          <h1 className="pp__title">{p.name}</h1>
          <div className="pp__tag">{p.tag}</div>
          <div className="pp__fmt">{p.formats}</div>
          <p className="pp__desc">{p.descLong || p.desc}</p>
        </div>
      </section>

      <section className="section" style={{ padding: 0 }}>
        <div className="container pp__grid">
          <div>
            <div className="pp__deliver-h">Ce primești în raport</div>
            <ul className="pp__deliver" style={{ padding: 0, margin: 0 }}>
              {p.deliver.map(d => <li key={d}>{d}</li>)}
            </ul>
          </div>

          <div className="pp__upload" id="upload">
            <div className="pp__deliver-h" style={{ marginBottom: 16 }}>
              {p.interactive ? 'Completează profilul' : 'Încarcă documentul'}
            </div>

            {p.interactive ? (
              <ConsortiumForm />
            ) : state === 'idle' ? (
              <>
                <label className="pp__drop" htmlFor="pp-file">
                  <strong>Trage fișierul aici sau apasă pentru a selecta</strong>
                  <small>{p.acceptHint}</small>
                  <input id="pp-file" ref={fileInputRef} type="file" accept={p.acceptMime} onChange={onChange} />
                </label>
                <div className="pp__flow">
                  <span>Upload</span>
                  <span>→</span>
                  <span>Register</span>
                  <span>→</span>
                  <span>Raport AI</span>
                </div>
                <p style={{ fontSize: 12, color: 'var(--ink-2)', marginTop: 12 }}>
                  Fără cont? Vei fi redirecționat la înregistrare după ce încarci fișierul.
                  Fișierul tău rămâne privat, criptat și accesibil doar din contul tău.
                </p>
              </>
            ) : state === 'uploading' ? (
              <div className="pp__processing">
                <strong>Se încarcă…</strong>
                <div style={{ fontSize: 13, color: 'var(--ink-2)', marginTop: 4 }}>Te rugăm așteaptă</div>
              </div>
            ) : state === 'processing' ? (
              <div className="pp__processing">
                <strong>AI analizează documentul…</strong>
                <div style={{ fontSize: 13, color: 'var(--ink-2)', marginTop: 4 }}>Estimat 30–60 secunde</div>
              </div>
            ) : state === 'error' ? (
              <div className="pp__err">{errMsg}<br /><button className="btn btn--ghost btn--sm" style={{ marginTop: 8 }} onClick={() => setState('idle')}>Încearcă din nou</button></div>
            ) : null}
          </div>
        </div>
      </section>

      {state === 'results' && result && <ResultsPanel result={result} />}

      <section className="pp__faq" data-screen-label="FAQ produs">
        <div className="container">
          <h2>Întrebări frecvente</h2>
          {(p.faq || []).map((f, i) => (
            <details key={i}>
              <summary>{f.q}</summary>
              <p>{f.a}</p>
            </details>
          ))}
        </div>
      </section>
    </>
  );
}

function ResultsPanel({ result }) {
  const a = result.artefact || {};
  const s = result.scores || {};
  return (
    <section className="section pp__results" data-screen-label="Rezultat analiză">
      <div className="container">
        <div className="section__label">REZULTAT · ANALIZĂ AI</div>
        <h2 style={{ fontSize: 28, margin: '8px 0 8px' }}>Raportul tău</h2>
        <p style={{ color: 'var(--ink-2)', fontSize: 14, marginBottom: 24 }}>
          Generat în {a.analyzed_at ? new Date(a.analyzed_at).toLocaleString('ro-RO') : 'câteva secunde'}.
          {a.status === 'awaiting_credits' && ' Notă: scoruri stub — analiza completă AI va relua când plătim creditele.'}
        </p>
        <div className="pp__scores">
          <div className="pp__score">
            <div className="pp__score-v">{s.readiness_score ?? '—'}<small>/100</small></div>
            <div className="pp__score-l">Readiness</div>
          </div>
          <div className="pp__score">
            <div className="pp__score-v">{s.completeness_score ?? '—'}<small>/100</small></div>
            <div className="pp__score-l">Completeness</div>
          </div>
          <div className="pp__score">
            <div className="pp__score-v">{s.fit_score ?? '—'}<small>/100</small></div>
            <div className="pp__score-l">Fit</div>
          </div>
        </div>
        <div className="pp__bullets">
          <h4>Puncte tari</h4>
          <ul>{(s.strengths || []).map((x, i) => <li key={i}>{x}</li>) }
            {!s.strengths?.length && <li style={{ color: 'var(--ink-2)' }}>— niciunul detectat —</li>}</ul>
          <h4>Lipsuri</h4>
          <ul>{(s.gaps || []).map((x, i) => <li key={i}>{x}</li>) }
            {!s.gaps?.length && <li style={{ color: 'var(--ink-2)' }}>— niciuna detectată —</li>}</ul>
          {s.red_flags?.length > 0 && (<>
            <h4 style={{ color: '#c24a1e' }}>Red flags</h4>
            <ul>{s.red_flags.map((x, i) => <li key={i}>{x}</li>)}</ul>
          </>)}
        </div>
        <div style={{ marginTop: 32, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <a className="btn btn--accent" href="/dashboard.html">Vezi în dashboard →</a>
          <a className="btn btn--ghost" href="/search">Granturi recomandate</a>
        </div>
      </div>
    </section>
  );
}

function ConsortiumForm() {
  const [sent, setSent] = useStateP(false);
  const [data, setData] = useStateP({ sector: '', country: '', budget: '', trl: '', have: '' });
  const onChange = (k) => (e) => setData({ ...data, [k]: e.target.value });
  async function submit(e) {
    e.preventDefault();
    if (!window.__USER) {
      location.href = '/register.html?next=' + encodeURIComponent('/produs/cons');
      return;
    }
    setSent(true);
    // Real call lands later; for now the registered profile is enough.
  }
  if (sent) {
    return (
      <div className="pp__processing">
        <strong>Mulțumim — primim datele.</strong>
        <div style={{ fontSize: 13, color: 'var(--ink-2)', marginTop: 4 }}>
          Echipa eligibil.org va reveni cu recomandări de consorțiu în 1–2 zile lucrătoare.
        </div>
      </div>
    );
  }
  return (
    <form onSubmit={submit}>
      <div className="pp__form-grid">
        <label>Sector
          <select required value={data.sector} onChange={onChange('sector')}>
            <option value="">— alege —</option>
            <option>AI / ML</option>
            <option>Biotech / Health</option>
            <option>Climate / Energy</option>
            <option>Deep tech / Hardware</option>
            <option>SaaS / Digital</option>
            <option>AgriTech / FoodTech</option>
          </select>
        </label>
        <label>Țară
          <select required value={data.country} onChange={onChange('country')}>
            <option value="">— alege —</option>
            <option>Moldova</option>
            <option>România</option>
            <option>Ucraina</option>
            <option>Alta UE</option>
            <option>Alta</option>
          </select>
        </label>
        <label>Buget total proiect
          <select required value={data.budget} onChange={onChange('budget')}>
            <option value="">— alege —</option>
            <option>&lt; €500K</option>
            <option>€500K – €2M</option>
            <option>€2M – €5M</option>
            <option>€5M+</option>
          </select>
        </label>
        <label>TRL actual
          <select required value={data.trl} onChange={onChange('trl')}>
            <option value="">— alege —</option>
            <option>TRL 1–2 (cercetare de bază)</option>
            <option>TRL 3–4 (prototip)</option>
            <option>TRL 5–6 (validare)</option>
            <option>TRL 7–9 (producție)</option>
          </select>
        </label>
        <label style={{ gridColumn: '1 / -1' }}>Ce parteneri ai deja
          <input value={data.have} onChange={onChange('have')} placeholder="ex: Universitatea Tehnică din Moldova, fondatorul nostru tehnic, …" />
        </label>
      </div>
      <button type="submit" className="btn btn--accent" style={{ marginTop: 16 }}>Cere recomandare consorțiu →</button>
      <p style={{ fontSize: 12, color: 'var(--ink-2)', marginTop: 12 }}>
        Recomandările sunt gratuite. Pentru introduceri facilitate, oferim un plan separat.
      </p>
    </form>
  );
}

function App() {
  const [lang, setLangState] = useStateP((window.getLanguage && window.getLanguage()) || 'RO');
  const setLang = (l) => { setLangState(l); if (window.setLanguage) window.setLanguage(l); };
  useEffectP(() => {
    const onLang = (e) => setLangState(e.detail.lang);
    window.addEventListener('languagechange', onLang);
    return () => window.removeEventListener('languagechange', onLang);
  }, []);
  return (
    <>
      <NavOrg lang={lang} setLang={setLang} />
      <ProductPage />
      <FooterOrg lang={lang} setLang={setLang} />
    </>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
