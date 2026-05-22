const { useState: useStateA, useEffect: useEffectA } = React;

function AboutPage() {
  return (
    <>
      <section className="ab__hero">
        <div className="container">
          <div className="ab__crumbs"><a href="/">Acasă</a> › <span>Despre</span></div>
          <h1 className="ab__title">Construim infrastructura de finanțare pentru startupuri din Europa de Est.</h1>
          <p className="ab__lead">
            eligibil.org este o platformă AI care ajută fondatorii să găsească granturi, capital non-dilutiv, parteneri pentru consorții și să-și pregătească aplicații competitive — în Moldova, România, Ucraina și Europa de Est.
          </p>
        </div>
      </section>

      <section className="ab__grid">
        <div>
          <div className="ab__sidehead">Founder note</div>
          <h2 className="ab__h2">Stanislav Florica</h2>
        </div>
        <div className="ab__prose">
          <p>Eligibil.org este construit ca un MVP early-stage pentru a reduce frictiunea dintre fondatorii de startupuri si sursele reale de finantare. Viziunea porneste din Moldova, se extinde spre Romania si apoi spre piata UE. Entitate juridica: <strong>AIGOV SOLUTION SRL</strong>, Chisinau, Republica Moldova.</p>
          <p>Platforma nu este un consultant care promite castigarea unui grant. Este infrastructura software pentru funding discovery, AI-assisted eligibility matching, document readiness si recomandari mai clare.</p>
        </div>
      </section>

      <div className="container">
        <div className="ab__grid">
          <div>
            <div className="ab__sidehead">Misiune</div>
            <h2 className="ab__h2">De ce existăm</h2>
          </div>
          <div className="ab__prose">
            <p>
              În fiecare an, sute de miliarde de euro din granturi europene, programe naționale și fonduri non-dilutive sunt distribuite startupurilor. Dar accesul la aceste resurse e dezechilibrat: ecosistemele mature (Berlin, Paris, Amsterdam) au consultanți, advisori și rețele care fac diferența. Fondatorii din Moldova, România, Ucraina și restul Europei de Est rămân subreprezentați.
            </p>
            <p>
              Construim instrumentele care egalizează acest acces. AI care citește pitch deck-ul tău și îți spune unde ești eligibil. Match Score pe baza datelor reale, nu a presupunerilor. Glosar deschis cu termeni explicați simplu. Catalog de parteneri verificați. Și o comunitate de fondatori care nu mai pierd timp căutând pe pagini web obscure.
            </p>
          </div>
        </div>

        <div className="ab__stats">
          <div className="ab__stat">
            <div className="ab__stat-v">630+</div>
            <div className="ab__stat-l">Surse de finanțare în catalog</div>
          </div>
          <div className="ab__stat">
            <div className="ab__stat-v">4</div>
            <div className="ab__stat-l">Limbi acoperite (RO/EN/RU/UA)</div>
          </div>
          <div className="ab__stat">
            <div className="ab__stat-v">5</div>
            <div className="ab__stat-l">Produse AI live</div>
          </div>
          <div className="ab__stat">
            <div className="ab__stat-v">140+</div>
            <div className="ab__stat-l">Termeni în glosar</div>
          </div>
          <div className="ab__stat">
            <div className="ab__stat-v">3</div>
            <div className="ab__stat-l">Țări prioritare</div>
          </div>
          <div className="ab__stat">
            <div className="ab__stat-v">2026</div>
            <div className="ab__stat-l">Lansare publică</div>
          </div>
        </div>

        <div className="ab__grid">
          <div>
            <div className="ab__sidehead">Cum funcționează</div>
            <h2 className="ab__h2">Trei produse de bază</h2>
          </div>
          <div className="ab__prose">
            <p>
              <strong>1. Catalog public de granturi.</strong> Bază de date verificată cu deadline-uri, sume, criterii de eligibilitate, sectoare și țări. Filtrabilă, fără cont necesar.
            </p>
            <p>
              <strong>2. Analiză AI a startupului.</strong> Încarci pitch deck, video sau whitepaper. Sistemul scorează pregătirea (Readiness), potrivirea cu programe (Match), completitudinea (Confidence) și sugerează acțiuni concrete.
            </p>
            <p>
              <strong>3. Consorții și parteneri.</strong> Listă verificată de acceleratoare, fonduri, universități și RTO-uri. Recomandări de parteneri pentru proiecte colaborative europene (Horizon, EIC, Eureka).
            </p>
          </div>
        </div>

        <div className="ab__sidehead" style={{ marginTop: 32 }}>Valori</div>
        <h2 className="ab__h2">Cum lucrăm</h2>
        <div className="ab__values">
          <div className="ab__value">
            <h4>Calitatea datelor</h4>
            <p>Fiecare grant, partener, eveniment trece printr-un proces de verificare. Erorile se corectează rapid și transparent.</p>
          </div>
          <div className="ab__value">
            <h4>Acces deschis</h4>
            <p>Catalogul, glosarul și informațiile de bază sunt gratuite. Cont necesar doar pentru analize AI personalizate.</p>
          </div>
          <div className="ab__value">
            <h4>Privacy first</h4>
            <p>Documentele tale (pitch deck, whitepaper) rămân criptate, accesibile doar din contul tău. Nu le partajăm cu nimeni fără acordul tău explicit.</p>
          </div>
          <div className="ab__value">
            <h4>Local + global</h4>
            <p>Acoperim deopotrivă programe naționale (ANCD, Innofund, USAID, GIZ) și europene (EIC, Horizon, ERDF). Interfață în RO, EN, RU, UA.</p>
          </div>
          <div className="ab__value">
            <h4>AI explicabil</h4>
            <p>Fiecare scor are o explicație. Nu spunem doar "Readiness: 72/100" — arătăm ce contribuie la el și ce poți face să crești.</p>
          </div>
          <div className="ab__value">
            <h4>Open ecosystem</h4>
            <p>Acceleratoarele, fondurile și partenerii își pot lista profilul gratuit. Parteneriat win-win cu ecosistemul, nu silos închis.</p>
          </div>
        </div>
      </div>

      <section className="ab__cta">
        <div className="container">
          <div className="ab__sidehead">Contact</div>
          <h2>Vrei să colaborezi sau să te listezi?</h2>
          <p style={{ fontSize: 16, color: 'var(--ink-2)', maxWidth: 640 }}>
            Suntem deschiși pentru parteneriate cu acceleratoare, fonduri, instituții publice și programe donor. Scrie-ne pe admin@eligibil.org sau abonează-te la newsletter pentru update-uri de produs.
          </p>
          <div className="ab__cta-btns">
            <a className="btn btn--accent" href="/register.html">Înregistrează startupul →</a>
            <a className="btn btn--ghost" href="mailto:admin@eligibil.org">admin@eligibil.org</a>
            <a className="btn btn--ghost" href="/register.html?type=partner">Listează organizația</a>
          </div>
          <div style={{ marginTop: 32 }}>
            <EmailCapture context="about" />
          </div>
        </div>
      </section>
    </>
  );
}

function App() {
  const [lang, setLangState] = useStateA((window.getLanguage && window.getLanguage()) || 'RO');
  const setLang = (l) => { setLangState(l); if (window.setLanguage) window.setLanguage(l); };
  useEffectA(() => {
    const onLang = (e) => setLangState(e.detail.lang);
    window.addEventListener('languagechange', onLang);
    return () => window.removeEventListener('languagechange', onLang);
  }, []);
  return (
    <>
      <NavOrg lang={lang} setLang={setLang} />
      <AboutPage />
      <FooterOrg lang={lang} setLang={setLang} />
    </>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
