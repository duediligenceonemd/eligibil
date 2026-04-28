// v2 components — hero upload, matching flow steps, sample report, TRL table, dual-mode, doc generation
const { useState: uS2 } = React;

/* Hero with upload panel -------------------------------------- */
function HeroV2() {
  const [slots, setSlots] = uS2({ deck: false, video: false, wp: false });
  const filled = Object.values(slots).filter(Boolean).length;
  const toggle = (k) => setSlots(s => ({ ...s, [k]: !s[k] }));

  return (
    <section className="section hero-v2" data-screen-label="01 Hero">
      <div className="container">
        <div className="hero-v2__inner">
          <div className="hero-v2__badge">
            <span className="hero-v2__badge-dot" />
            Analiză AI · Gratuit în faza beta · Fără cont necesar
          </div>
          <h1 className="hero-v2__h1">
            Încarcă. Analizează. Află exact unde ești <em>eligibil</em>.
          </h1>
          <p className="hero-v2__sub">
            eligibil.eu analizează artefactele startupului tău — pitch deck, video și whitepaper — identifică automat TRL-ul, calculează scorul de potrivire pentru peste 735 de granturi și îți livrează un plan concret să devii maxim eligibil.
          </p>

          <div className="upload-panel">
            <div className="upload-panel__head">
              <h3>Obține scorul tău de eligibilitate în 90 de secunde</h3>
              <div className="upload-panel__counter">
                {filled}/3 artefacte · {filled === 0 ? 'min. 1 necesar' : 'gata pentru analiză'}
              </div>
            </div>
            <div className="upload-grid">
              <UploadSlot id="deck" label="Pitch Deck" meta="PDF / PPTX · ≤50MB · max 30 slide" code="01" filled={slots.deck} onClick={() => toggle('deck')} />
              <UploadSlot id="video" label="Video Pitch" meta="MP4 / MOV · ≤500MB · max 3 min" code="02" filled={slots.video} onClick={() => toggle('video')} />
              <UploadSlot id="wp" label="Whitepaper" meta="PDF / DOCX · ≤30MB · max 10 pag" code="03" filled={slots.wp} onClick={() => toggle('wp')} />
            </div>
            <div className="upload-panel__foot">
              <div className="upload-panel__foot-left">
                <span>✓ Minimum <strong>1 artefact</strong> pentru a începe</span>
                <span>✓ Datele tale nu sunt partajate, nu antrenăm AI-ul pe ele</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
                <span className="upload-panel__alt">sau <a href="#">completează formular minim (30s)</a></span>
                <button className="upload-panel__cta" disabled={filled === 0}>
                  ANALIZEAZĂ-MĂ ACUM →
                </button>
              </div>
            </div>
          </div>

          <div className="upload-microcopy">
            Cu cât mai multe artefacte încarci, cu atât mai precisă analiza.<br/>
            Un singur document e suficient pentru a începe — sistemul îți spune explicit ce scor câștigi dacă adaugi încă unul.
          </div>
        </div>

        <div className="trust" style={{ marginTop: 0 }}>
          {[['735+','Surse indexate'],['90s','Timp până la scor'],['7','Agenți AI de evaluare'],['€0','Cost în faza beta'],['4','Limbi RO·EN·RU·UA']].map(([n,l]) => (
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

function UploadSlot({ label, meta, code, filled, onClick }) {
  return (
    <div className={`upload-slot ${filled ? 'is-filled' : ''}`} onClick={onClick}>
      <div className="upload-slot__status">{filled ? 'Încărcat' : 'Opțional'}</div>
      <div className="upload-slot__icon">{code}</div>
      <div>
        <div className="upload-slot__name">{label}</div>
        <div className="upload-slot__meta">{meta}</div>
      </div>
      <div className="upload-slot__drop">{filled ? 'Schimbă fișierul' : 'Încarcă fișier sau trage aici'}</div>
    </div>
  );
}

/* 4-step matching flow --------------------------------------- */
function MatchingFlow() {
  return (
    <section className="section" data-screen-label="02 How it works">
      <div className="container">
        <div className="section__label">01 — Flow-ul de analiză</div>
        <div className="section__head">
          <h2 className="section__title">De la upload la plan de eligibilitate. În 4 pași.</h2>
          <p className="section__sub">Un singur upload declanșează o analiză completă. Fără formulare interminabile, fără întrebări vagi. Sistemul extrage informația din documentele tale și o transformă în scor + plan de acțiune.</p>
        </div>

        <div className="steps">
          <div className="step">
            <div className="step__n"><small>Pas</small>01</div>
            <div className="step__body">
              <h3 className="step__h">Încarci artefactele</h3>
              <p className="step__d">Pitch deck, video pitch (≤3 min) sau whitepaper tehnic (≤10 pagini). Opțional, adaugi URL-uri pentru website, GitHub și LinkedIn-urile fondatorilor.</p>
              <p className="step__d" style={{ marginTop: 12 }}>Dacă nu ai niciunul, completezi un formular minim în 30 de secunde: sector, stadiu, geografie, echipă, sumă țintă. Primești oricum un scor de bază, cu Confidence mai mic.</p>
            </div>
            <div className="step__aside">
              <div className="step__aside-t">Formate acceptate</div>
              <ul className="step__aside-list">
                <li>Pitch Deck — PDF / PPTX · max 30 slide</li>
                <li>Video Pitch — MP4 / MOV / WebM · max 3 min</li>
                <li>Whitepaper — PDF / DOCX · max 10 pag</li>
                <li>URL website, GitHub, LinkedIn</li>
              </ul>
            </div>
          </div>

          <div className="step">
            <div className="step__n"><small>Pas</small>02</div>
            <div className="step__body">
              <h3 className="step__h">AI-ul analizează și construiește profilul</h3>
              <p className="step__d">7 agenți specializați extrag informația structurată din fiecare artefact, unifică rezultatele și construiesc profilul startupului tău.</p>

              <div className="extract-grid">
                <div className="extract-col">
                  <div className="extract-col__h">Din pitch deck</div>
                  <ul style={{padding:0,margin:0}}>
                    <li>Problema și soluția</li>
                    <li>TAM / SAM / SOM</li>
                    <li>Business model & tracțiune</li>
                    <li>Echipă și roluri</li>
                    <li>Ask financiar + milestone</li>
                  </ul>
                </div>
                <div className="extract-col">
                  <div className="extract-col__h">Din video</div>
                  <ul style={{padding:0,margin:0}}>
                    <li>Claritatea mesajului</li>
                    <li>Consistența cu deck-ul</li>
                    <li>Calitatea comunicării</li>
                    <li>Structura narativă</li>
                    <li>Keywords & terminologie</li>
                  </ul>
                </div>
                <div className="extract-col">
                  <div className="extract-col__h">Din whitepaper</div>
                  <ul style={{padding:0,margin:0}}>
                    <li><strong>TRL real (1–9)</strong></li>
                    <li>Profunzime științifică</li>
                    <li>IP & proprietate intelectuală</li>
                    <li>Diferențiere tehnică</li>
                    <li>Referințe & metodologie</li>
                  </ul>
                </div>
              </div>

              <div className="dimension-cloud">
                <strong>Profil AI unificat</strong>
                <span className="hi">Sector & subsector</span>
                <span>Stadiu business</span>
                <span className="hi">TRL estimat</span>
                <span>Geografie & jurisdicție</span>
                <span>Maturitate echipă</span>
                <span>Tip capital potrivit</span>
                <span>Disponibilitate consorțiu</span>
                <span>Calitate dovezi</span>
              </div>

              <div className="key-msg">
                <em>Mesaj-cheie:</em> TRL-ul este calculat automat — nu trebuie să-l declari tu. Sistemul deduce nivelul real de maturitate tehnologică din ce ai scris și ce ai arătat în materiale.
              </div>
            </div>
            <div className="step__aside">
              <div className="step__aside-t">Ce iese din acest pas</div>
              <ul className="step__aside-list">
                <li>Profil unificat (8 dimensiuni)</li>
                <li>TRL estimat obiectiv</li>
                <li>Confidence Score global</li>
                <li>Lista de semnale folosite</li>
                <li>Lacune identificate</li>
              </ul>
            </div>
          </div>

          <div className="step">
            <div className="step__n"><small>Pas</small>03</div>
            <div className="step__body">
              <h3 className="step__h">Primești trei scoruri per program</h3>
              <p className="step__d">Pentru fiecare dintre cele 735+ granturi din catalog, sistemul calculează simultan trei scoruri independente. Programele pentru care nu ești eligibil (jurisdicție, stadiu, sector exclus) sunt eliminate automat înainte de scoring.</p>

              <div className="scoring">
                <div className="scoring__col">
                  <div className="scoring__name">Match Score</div>
                  <div className="scoring__range">0 — 100</div>
                  <div className="scoring__d">Cât de bine te potrivești cu cerințele: sector, stadiu, sumă, geografie, TRL, echipă, consorțiu.</div>
                  <div className="scoring__viz">
                    <div className="score-bar"><div className="score-bar__fill" style={{ width: '82%' }}/></div>
                    82
                  </div>
                </div>
                <div className="scoring__col">
                  <div className="scoring__name">Readiness Score</div>
                  <div className="scoring__range">0 — 100</div>
                  <div className="scoring__d">Cât de pregătit ești să aplici acum: dovezi, buget, parteneri, articularea impactului.</div>
                  <div className="scoring__viz">
                    <div className="score-bar"><div className="score-bar__fill" style={{ width: '58%' }}/></div>
                    58
                  </div>
                </div>
                <div className="scoring__col">
                  <div className="scoring__name">Confidence Score</div>
                  <div className="scoring__range">0 — 100 %</div>
                  <div className="scoring__d">Cât de sigure sunt datele extrase din artefactele tale. Crește cu fiecare artefact încărcat.</div>
                  <div className="scoring__viz">
                    <div className="score-bar"><div className="score-bar__fill" style={{ width: '88%' }}/></div>
                    88%
                  </div>
                </div>
              </div>
            </div>
            <div className="step__aside">
              <div className="step__aside-t">Filtrare automată</div>
              <ul className="step__aside-list">
                <li>Jurisdicții excluse → afară</li>
                <li>Stadiu incompatibil → afară</li>
                <li>Sectoare excluse → afară</li>
                <li>Top 10 Match → evidențiate</li>
                <li>Deadline apropiat → bonus prioritate</li>
              </ul>
            </div>
          </div>

          <div className="step">
            <div className="step__n"><small>Pas</small>04</div>
            <div className="step__body">
              <h3 className="step__h">Plan de îmbunătățire: cum devii maxim eligibil</h3>
              <p className="step__d">Sistemul nu-ți dă doar un scor. Îți spune exact ce trebuie să faci pentru a crește scorul până la maxim — cu acțiuni numerotate, timp estimat și impact numeric per acțiune.</p>

              <div className="plan">
                <div className="plan__head">
                  <div className="plan__prog">Exemplu · EIC Accelerator 2026</div>
                  <div className="plan__h">De la Match 82 / Readiness 58 → aplicație competitivă</div>
                  <div className="plan__scores">
                    <span>Match actual: <strong>82</strong></span>
                    <span>Readiness actual: <strong>58</strong></span>
                    <span>Confidence: <strong>88%</strong></span>
                  </div>
                </div>
                <div className="plan__body">
                  <div className="action">
                    <div className="action__check">1</div>
                    <div className="action__body">
                      <h4>Ridică TRL-ul de la 4 la 6</h4>
                      <p>Rulează un pilot funcțional cu minim 10 utilizatori reali, documentează rezultatele. Timp: 3 săptămâni.</p>
                    </div>
                    <div className="action__impact">+15 Readiness</div>
                  </div>
                  <div className="action">
                    <div className="action__check">2</div>
                    <div className="action__body">
                      <h4>Adaugă slide competitori cu differentiators</h4>
                      <p>3 jucători direcți + 2 indirecți, highlight diferențiatorii tehnologici. Timp: 1 zi.</p>
                    </div>
                    <div className="action__impact">+8 Match</div>
                  </div>
                  <div className="action">
                    <div className="action__check">3</div>
                    <div className="action__body">
                      <h4>Articulează impactul măsurabil conform criteriilor EIC</h4>
                      <p>Rescrie secțiunea impact cu 3 KPI-uri cuantificabile și time horizon. Timp: 2 zile.</p>
                    </div>
                    <div className="action__impact">+12 Readiness</div>
                  </div>
                  <div className="plan__total">
                    <div className="plan__total-left">După acțiuni → <strong>Match 90 · Readiness 93</strong> · aplicație competitivă</div>
                    <button className="btn btn--accent btn--sm">Activează AI Document Generation →</button>
                  </div>
                </div>
              </div>
            </div>
            <div className="step__aside">
              <div className="step__aside-t">Caracteristici plan</div>
              <ul className="step__aside-list">
                <li>Acțiuni numerotate după prioritate</li>
                <li>Impact numeric per acțiune</li>
                <li>Timp estimat realist</li>
                <li>Re-scoring automat la finalizare</li>
                <li>Alertă când un program nou se potrivește</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* Sample report --------------------------------------------- */
function SampleReport() {
  const rows = [
    ['EIC Accelerator 2026', '🇪🇺 EU', 82, 58, 88, '15 Mai', 'prep', 'Plan pregătire'],
    ['NSF SBIR Phase I', '🇺🇸 SUA', 78, 68, 90, '5 Iun', 'prep', 'Buget + partener'],
    ['Google for Startups AI', '🌐 Global', 85, 82, 92, 'Rolling', 'go', 'Aplică acum'],
    ['Startup Moldova 2026', '🇲🇩 MD', 74, 88, 85, '1 Sep', 'go', 'Aplică acum'],
    ['Horizon EIC Pathfinder', '🇪🇺 EU', 72, 35, 78, '2 Oct', 'block', 'Consorțiu lipsă'],
  ];
  const tone = (n) => n >= 80 ? 'hi' : n >= 65 ? 'mid' : 'lo';
  return (
    <section className="section" data-screen-label="03 Sample">
      <div className="container">
        <div className="section__label">02 — Preview</div>
        <div className="section__head">
          <h2 className="section__title">Iată ce primești după 90 de secunde.</h2>
          <p className="section__sub">Exemplu real de output — generat pentru AxonAI Labs pe baza unui pitch deck + video + whitepaper încărcate împreună.</p>
        </div>

        <div className="report-mock">
          <div className="report-mock__head">
            <div>
              <h3>Raport AxonAI Labs · Analiza completă</h3>
              <div className="mono">Generat 22 Apr 2026 · Bazat pe: Pitch Deck + Video + Whitepaper</div>
            </div>
            <div className="report-mock__conf">
              <span>Confidence global</span>
              <strong>88%</strong>
              <span style={{opacity:.7, fontSize: 10}}>Date suficiente</span>
            </div>
          </div>

          <div className="profile-grid">
            {[
              ['Sector', 'AI & ML / Computer Vision', false],
              ['TRL estimat', '4 — Prototip laborator', true],
              ['Stadiu', 'Early-stage / Pre-seed', false],
              ['Jurisdicție', 'Moldova + echipă RO', false],
              ['Echipă', '3 fondatori (2 tech · 1 biz)', false],
              ['Ask', '€150K – €500K', false],
              ['Consorțiu', 'Deschis, neformat', false],
              ['Tip capital preferat', 'Grant non-dilutiv', false],
            ].map(([k, v, hl]) => (
              <div className={`profile-cell ${hl ? 'hl' : ''}`} key={k}>
                <div className="profile-cell__k">{k}</div>
                <div className="profile-cell__v">{v}</div>
              </div>
            ))}
          </div>

          <div className="report-mock__title2">TOP 5 programe potrivite</div>
          <table className="report-table">
            <thead>
              <tr>
                <th>Program</th><th>Țară</th><th>Match</th><th>Readiness</th><th>Confidence</th><th>Deadline</th><th>Acțiune</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i}>
                  <td className="prog-name">{r[0]}</td>
                  <td className="mono">{r[1]}</td>
                  <td><span className={`score-tag ${tone(r[2])}`}>{r[2]}</span></td>
                  <td><span className={`score-tag ${tone(r[3])}`}>{r[3]}</span></td>
                  <td className="mono">{r[4]}%</td>
                  <td className="mono">{r[5]}</td>
                  <td><span className={`action-badge ${r[6]}`}>{r[7]}</span></td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="report-mock__actions">
            {[
              ['Acțiune AI', 'Rescrie pitch deck pentru EIC'],
              ['Acțiune AI', 'Generează aplicația Google for Startups'],
              ['ResearchMatch', 'Găsește 8 parteneri pentru Pathfinder'],
              ['Monitorizare', 'Alertă când Match nou > 80'],
            ].map(([k, v]) => (
              <div className="report-action" key={v}>
                <div className="report-action__k">{k}</div>
                <div className="report-action__v">{v} →</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* TRL explainer --------------------------------------------- */
function TRLSection() {
  return (
    <section className="section" data-screen-label="04 TRL">
      <div className="container">
        <div className="section__label">03 — Terminologie</div>
        <div className="section__head">
          <h2 className="section__title">Ce este TRL și de ce contează atât de mult.</h2>
          <p className="section__sub">TRL (Technology Readiness Level) este scara de maturitate tehnologică folosită de EU, NASA, NSF și aproape toți finanțatorii de deep tech. Majoritatea programelor mari au cerințe stricte de TRL minim. Dacă nu știi unde ești, nu știi ce poți aplica.</p>
        </div>
        <table className="trl-table">
          <thead>
            <tr><th>TRL</th><th>Stadiu</th><th>Ce înseamnă</th><th>Programe potrivite</th></tr>
          </thead>
          <tbody>
            <tr><td>1–2</td><td>Cercetare de bază</td><td>Principii observate, concept formulat</td><td>ERC Starting Grant, granturi academice</td></tr>
            <tr><td>3–4</td><td>Proof of concept</td><td>Funcție validată în laborator</td><td>EIC Pathfinder, Horizon Cluster</td></tr>
            <tr className="accent"><td>5–6</td><td>Validare tehnologică</td><td>Prototip demonstrat în mediu relevant</td><td>EIC Transition, NSF SBIR Phase I</td></tr>
            <tr><td>7–8</td><td>Demonstrare sistem</td><td>Sistem complet în mediu operațional</td><td>EIC Accelerator, SBIR Phase II</td></tr>
            <tr><td>9</td><td>Sistem operațional</td><td>Produs dovedit în producție comercială</td><td>VC growth, Horizon scale-up</td></tr>
          </tbody>
        </table>
        <div className="key-msg" style={{ marginTop: 24 }}>
          <em>De ce contează analiza automată de TRL:</em> Majoritatea fondatorilor supraestimează TRL-ul propriu din entuziasm sau îl subestimează din modestie. Sistemul îl calculează obiectiv din ce ai scris în whitepaper și ce ai arătat în deck — reducând riscul aplicărilor respinse automat pentru "TRL sub minim".
        </div>
      </div>
    </section>
  );
}

/* Dual mode ------------------------------------------------- */
function DualMode() {
  return (
    <section className="section" data-screen-label="05 Dual mode">
      <div className="container">
        <div className="section__label">04 — Două moduri de utilizare</div>
        <div className="section__head">
          <h2 className="section__title">Agregator de 735+ surse + motor de matching AI.</h2>
          <p className="section__sub">eligibil.eu combină cel mai complet catalog de finanțare pentru Europa de Est cu un motor de analiză AI care transformă o listă de oportunități într-un plan personalizat. Folosește oricare dintre cele două moduri — sau ambele.</p>
        </div>
        <div className="dual-mode">
          <div className="dmode">
            <div className="dmode__tag">● Mod Catalog — gratuit, fără cont</div>
            <h3>Răsfoiește liber catalogul.</h3>
            <p style={{ color: 'var(--ink-2)', fontSize: 15, marginBottom: 0 }}>Perfect pentru research și explorare. Nu încarci nimic — vezi tot ce există.</p>
            <ul>
              <li>Răsfoiești toate cele 735+ surse</li>
              <li>Filtrezi după sector, țară, tip, sumă, TRL</li>
              <li>Salvezi favoritele într-un cont</li>
              <li>Primești alerte la deadline-uri</li>
              <li>Exporți listă în CSV / PDF</li>
            </ul>
            <button className="btn btn--ghost">Deschide catalogul →</button>
          </div>
          <div className="dmode">
            <div className="dmode__tag">● Mod Matching AI — gratuit în beta</div>
            <h3>Încarcă și primește scorurile tale.</h3>
            <p style={{ color: 'rgba(255,255,255,.75)', fontSize: 15, marginBottom: 0 }}>Perfect când ești gata să aplici. Upload → TRL → scoruri → plan.</p>
            <ul>
              <li>Încarci artefacte (deck · video · whitepaper)</li>
              <li>Sistemul extrage TRL + profil complet</li>
              <li>Primești scoruri per program (Match · Readiness · Confidence)</li>
              <li>Primești plan de îmbunătățire cu impact numeric</li>
              <li>Generare AI de documente pentru aplicare</li>
            </ul>
            <button className="btn btn--accent">Încarcă acum →</button>
          </div>
        </div>
      </div>
    </section>
  );
}

/* Doc Generation -------------------------------------------- */
function DocGen() {
  const items = [
    ['01', 'Rescriere Pitch Deck', 'Slide cu slide sau integral, optimizat pentru programul selectat. Păstrează tonul tău original.'],
    ['02', 'Aplicație Grant Completă', 'Executive summary, metodologie, work packages, buget, impact, CV-uri, LOI-uri și anexe.'],
    ['03', 'Whitepaper Tehnic', 'Structură EIC/Horizon, referințe, TRL framework, IP analysis, metodologie științifică.'],
    ['04', 'Business Plan & Model Financiar', 'Proiecții 3–5 ani, cost structure, break-even, runway, scenarii conservative/optimistice.'],
  ];
  return (
    <section className="section" data-screen-label="06 Doc Gen">
      <div className="container">
        <div className="section__label">05 — AI Document Generation · strat premium</div>
        <div className="section__head">
          <h2 className="section__title">Peste scoring, AI-ul îți scrie direct documentele.</h2>
          <p className="section__sub">Ai ales programul. Ai scorul. Acum ai nevoie de aplicația efectivă. Sistemul generează draft-ul complet — tu adaugi context și revizuiești.</p>
        </div>
        <div className="docgen">
          {items.map(([n, h, d]) => (
            <div className="docgen__col" key={n}>
              <div className="docgen__icon">{n}</div>
              <div className="docgen__h">{h}</div>
              <div className="docgen__d">{d}</div>
              <div className="mono" style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.1em' }}>Generează →</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

Object.assign(window, { HeroV2, MatchingFlow, SampleReport, TRLSection, DualMode, DocGen });
