// More components: About, Advantages, AI layer, Reports, Partners, Blog, Get Listed, Quality, FAQ, CTA, Footer
const { useState: useStateB, useEffect: useEffectB } = React;

/* ---------- About ---------- */
function About() {
  const uses = [
    'Granturi publice naționale (MD, RO, EU)',
    'Programe europene (Horizon, EIC, Interreg, Erasmus+)',
    'Granturi SUA (SBIR, STTR, NSF, NIH, DARPA)',
    'Capital non-dilutiv (foundations, donor programs)',
    'Competiții, hackathoane și challenge-uri corporate',
    'Acceleratoare și programe de mentorat',
    'Fonduri de investiții dilutive (angel, VC)',
    'Programe guvernamentale regionale',
  ];
  const verticals = ['Real estate', 'Startup-uri', 'IMM', 'Sustenabilitate', 'Energie verde', 'Health & Science', 'Logistică', 'Artă', 'Social', 'Educație', 'Agricultură', 'Sport', 'Maritim', 'Fintech', 'Defense', 'Space'];
  return (
    <section className="section" data-screen-label="05 About">
      <div className="container">
        <div className="section__label">04 — Despre</div>
        <div className="about-grid">
          <div>
            <h2 className="section__title">Agregatorul #1 de finanțare pentru startup-uri din Europa de Est.</h2>
            <p className="section__sub">
              eligibil.eu unește peste 735 de surse de finanțare într-un singur loc și oferă fondatorilor claritate asupra oportunităților potrivite contextului lor. Pentru fiecare program, nu doar un link — ci o analiză completă de potrivire, pregătire și pași următori.
            </p>
            <div style={{ marginTop: 32 }}>
              <div className="section__label" style={{ margin: 0 }}>Verticale acoperite</div>
              <div className="vertical-cloud">
                {verticals.map(v => <span key={v}>{v}</span>)}
              </div>
            </div>
          </div>
          <div>
            <div className="mono" style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.12em', marginBottom: 12 }}>Poate fi folosit pentru</div>
            <ul className="about-list">
              {uses.map(u => <li key={u}>{u}</li>)}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------- Advantages ---------- */
function Advantages() {
  const items = [
    ['01', 'Țară și tip de investiție', 'Dilutiv/non-dilutiv, grant/equity/debt — clar etichetat pe fiecare card.'],
    ['02', 'Sector și sumă minimă/maximă', 'Fiecare program este etichetat cu verticale principale și benzi de sumă.'],
    ['03', 'Eligibilitate geografică și de stadiu', 'Vezi imediat dacă țara și TRL-ul tău se potrivesc.'],
    ['04', 'Cerințe de consorțiu', 'Parteneri minimi, compoziție necesară, linkuri către matchmaking.'],
    ['05', 'Status regulatoriu și credibilitate', 'Scor de încredere al finanțatorului + istoric de call-uri.'],
    ['06', 'Evaluation criteria oficiale', 'Pentru fiecare program — așa cum apar în documentele oficiale.'],
    ['07', 'Data ultimei verificări', 'Nu linkuri moarte. Fiecare card arată "verificat acum X zile".'],
    ['08', 'Statistici rată de succes', 'Când sunt publice — rata de aplicare → finanțare pe ultimii 3 ani.'],
    ['09', 'Timp estimat de pregătire', 'Ore realiste pentru aplicație, pe baza complexității documentației.'],
    ['10', 'Bonusuri, premii și condiții', 'Ce primești în plus — mentorat, cloud credits, piloți, etc.'],
  ];
  return (
    <section className="section" data-screen-label="06 Advantages">
      <div className="container">
        <div className="section__label">05 — De ce eligibil.eu</div>
        <div className="section__head">
          <h2 className="section__title">Nu doar o listă. O infrastructură de decizie.</h2>
          <p className="section__sub">
            Alte directoare îți dau o listă. eligibil.eu îți dă context, scor și pași concreți. Pentru fiecare program găsești informații structurate care te ajută să decizi dacă merită să aplici.
          </p>
        </div>
        <div className="advantages">
          {items.map(([n, h, d]) => (
            <div className="adv" key={n}>
              <div className="adv__num">{n}</div>
              <div>
                <div className="adv__h">{h}</div>
                <div className="adv__d">{d}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- AI Layer ---------- */
function AISection({ showAI }) {
  if (!showAI) return null;
  return (
    <section className="section" data-screen-label="07 AI">
      <div className="container">
        <div className="section__label">06 — Strat produs peste agregator</div>
        <div className="section__head">
          <h2 className="section__title">Peste catalog, un strat AI care îți calculează șansele.</h2>
          <p className="section__sub">Răsfoirea liberă e gratuită pentru toți. Pentru fondatorii care vor mai mult decât o listă, eligibil.eu oferă un strat de analiză AI: încarci artefactele startup-ului (deck, video, whitepaper, site) și primești pentru fiecare program trei scoruri individuale și un plan de acțiune.</p>
        </div>
        <div className="ai-hero">
          <div className="ai-hero__inner">
            <div className="ai-hero__label">Extra — analiză AI · beta gratuită</div>
            <h2>Trei scoruri. Un plan de acțiune. 90 de secunde.</h2>
            <p>Încarci deck, whitepaper sau pitch video. Noi extragem contextul, îl confruntăm cu cerințele oficiale ale programului și îți spunem unde ești puternic, unde ai lipsuri și cât durează să acoperi diferența.</p>

            <div className="ai-scores">
              {[
                ['01', 'Match Score', 'Cât de bine se potrivește programul cu startupul tău?'],
                ['02', 'Readiness Score', 'Cât ești de pregătit să aplici — ce lipsește din dosar?'],
                ['03', 'Confidence Score', 'Cât de sigure sunt datele pe care am luat decizia?'],
              ].map(([n, h, d]) => (
                <div className="ai-score" key={n}>
                  <div className="ai-score__icon">{n} / 03</div>
                  <div className="ai-score__name">{h}</div>
                  <div className="ai-score__d">{d}</div>
                </div>
              ))}
            </div>

            <div className="ai-docs">
              <strong>+ Generare AI de documente</strong>
              Pitch deck rescris · aplicație grant completă · whitepaper optimizat · business plan · financial model · impact report
            </div>

            <div className="ai-hero__cta">
              <button className="btn btn--accent">Încearcă analiza AI în 90 de secunde →</button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------- Reports ---------- */
function Reports() {
  return (
    <section className="section" data-screen-label="08 Reports">
      <div className="container">
        <div className="section__label">07 — Knowledge Hub</div>
        <div className="section__head">
          <h2 className="section__title">Rapoarte, whitepapers și insights despre piața finanțării.</h2>
          <p className="section__sub">Analize aprofundate realizate de echipa eligibil.eu și parteneri academici. Descărcare gratuită pentru utilizatori înregistrați.</p>
        </div>
        <div className="reports">
          {REPORTS.map((r, i) => (
            <div className="report" key={i}>
              <div className="report__cover">
                <Thumb kind={r.thumb} seed={i + 11} />
              </div>
              <div className="report__body">
                <div className="report__meta">
                  <span>{r.pages} pagini</span>
                  <span>{r.kind}</span>
                </div>
                <h3 className="report__title">{r.title}</h3>
                <p className="report__desc">{r.desc}</p>
                <div className="report__cta">
                  <span>Descarcă raport</span>
                  <span>→</span>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 28 }}>
          <button className="btn--link">Vezi toate rapoartele →</button>
        </div>
      </div>
    </section>
  );
}

/* ---------- Partners ---------- */
function Partners() {
  return (
    <section className="section" data-screen-label="09 Partners">
      <div className="container">
        <div className="section__label">08 — Verified Partners</div>
        <div className="section__head">
          <h2 className="section__title">Acceleratoarele și fondurile care construiesc ecosistemul.</h2>
          <p className="section__sub">48 de parteneri verificați — programe publice, fonduri private, acceleratoare și instituții care își mențin activ profilul.</p>
        </div>
        <div className="partners">
          {PARTNERS.map((p, i) => (
            <div className="partner" key={i}>
              <div className="partner__logo"><Thumb kind={p.thumb} seed={i + 21} /></div>
              <div>
                <div className="partner__head">
                  {p.verified && <span className="partner__verified">✓ Verified</span>}
                  <span className="partner__country">{p.flag} {p.country}</span>
                </div>
                <h3 className="partner__name">{p.name}</h3>
                <div className="partner__sub">{p.sub}</div>
                <p className="partner__desc">{p.desc}</p>
                <div className="partner__tags">
                  {p.tags.map(t => <span className="program__tag" key={t}>{t}</span>)}
                </div>
                <div className="partner__cta">
                  <span>Vezi profil</span>
                  <span>→</span>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 28 }}>
          <button className="btn--link">Vezi toți partenerii verificați (48+) →</button>
        </div>
      </div>
    </section>
  );
}

/* ---------- Blog ---------- */
function Blog() {
  return (
    <section className="section" data-screen-label="10 Blog">
      <div className="container">
        <div className="section__label">09 — Blog & insights</div>
        <div className="section__head">
          <h2 className="section__title">Ultimele articole și analize.</h2>
          <p className="section__sub">Publicăm săptămânal — analize de programe, interviuri cu fondatori care au obținut finanțare, tendințe în ecosistem.</p>
        </div>
        <div className="blog">
          {POSTS.map((p, i) => (
            <a className="post" key={i} href="#">
              <div className="post__cover"><Thumb kind={p.thumb} seed={i + 31} /></div>
              <div className="post__body">
                <div className="post__meta">
                  <span className="post__cat">{p.cat}</span>
                  <span>{p.time} citire</span>
                </div>
                <h3 className="post__title">{p.title}</h3>
                <p className="post__desc">{p.desc}</p>
                <div className="post__foot">{p.date} · Echipa eligibil.eu</div>
              </div>
            </a>
          ))}
        </div>
        <div style={{ marginTop: 28 }}>
          <button className="btn--link">Citește toate articolele →</button>
        </div>
      </div>
    </section>
  );
}

/* ---------- Get Listed ---------- */
function GetListed() {
  const benefits = [
    ['Profil complet gratuit', 'Logo, descriere, call-uri active, statistici, pagină cu URL dedicat.'],
    ['Badge "Verified"', 'După confirmarea reprezentantului oficial. Apare în catalog și căutări.'],
    ['Apariție prioritară', 'În căutări și categorii relevante pentru programul tău.'],
    ['Acces la analize', 'Ce fondatori te caută, pe ce criterii, din ce regiuni.'],
    ['Integrare cu matching AI', 'Primești aplicanți pre-calificați cu Match Score peste prag.'],
    ['Publicare de conținut', 'Rapoarte, whitepapers și articole în hub-ul de resurse.'],
  ];
  return (
    <section className="section" data-screen-label="11 Get Listed">
      <div className="container">
        <div className="section__label">10 — Get Listed</div>
        <div className="listed-grid">
          <div className="listed-left">
            <h2 className="section__title">Listează-te în catalog. Ajungi la fondatorii potriviți.</h2>
            <p className="section__sub">
              Fondatorii, cercetătorii și startup-urile vin pe eligibil.eu pentru a găsi cele mai bune oportunități de finanțare. Apari în catalog și fii descoperit — gratuit. Crește vizibilitatea programului tău în Moldova, România, Europa de Est și mai departe.
            </p>
            <div style={{ display: 'flex', gap: 12, marginTop: 28, flexWrap: 'wrap' }}>
              <button className="btn btn--accent">Listează-te gratuit →</button>
              <button className="btn btn--ghost">Revendică profil existent</button>
            </div>
          </div>
          <div className="listed-right">
            <div className="section__label" style={{ margin: '0 0 20px' }}>Beneficii pentru parteneri</div>
            <ul className="benefits" style={{ padding: 0, margin: 0 }}>
              {benefits.map(([h, d]) => (
                <li key={h}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 15 }}>{h}</div>
                    <div style={{ fontSize: 13.5, color: 'var(--ink-2)', marginTop: 2 }}>{d}</div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------- Data Quality ---------- */
function DataQuality() {
  return (
    <section className="section" data-screen-label="12 Data Quality">
      <div className="container">
        <div className="section__label">11 — Data Quality</div>
        <div className="section__head">
          <h2 className="section__title">Obsesia noastră: zero linkuri moarte, zero informații expirate.</h2>
          <p className="section__sub">
            Un singur match greșit sau expirat distruge încrederea utilizatorului. Folosim un sistem triplu de verificare.
          </p>
        </div>
        <div className="quality">
          {[
            ['01', 'Crawling automat zilnic', 'Sistemul nostru verifică zilnic site-urile oficiale și detectează modificări de deadline, sumă, criterii sau status. Orice schimbare declanșează o re-evaluare și notificare utilizatorilor afectați.'],
            ['02', 'Verificare manuală săptămânală', 'Echipa noastră verifică manual programele cu activitate frecventă sau call-uri multiple pe an. Partenerii verificați primesc badge "Verified" când își asumă responsabilitatea de a-și menține profilul actualizat.'],
            ['03', 'Feedback din comunitate', 'Utilizatorii raportează surse noi, informații expirate sau discrepanțe. Fiecare raport e verificat în 48 de ore. Fiecare oportunitate are un indicator de prospețime — "ultima verificare: acum 3 zile".'],
          ].map(([n, h, p]) => (
            <div className="qcol" key={n}>
              <div className="qcol__num">{n}</div>
              <div className="qcol__h">{h}</div>
              <div className="qcol__p">{p}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- FAQ ---------- */
function FAQ() {
  const [open, setOpen] = useStateB(0);
  return (
    <section className="section" data-screen-label="13 FAQ">
      <div className="container">
        <div className="section__label">12 — Întrebări frecvente</div>
        <div className="faq-grid">
          <div>
            <h2 className="section__title">Ce este eligibil.eu?</h2>
            <p className="section__sub">Răspundem întrebărilor pe care ni le pun cel mai des fondatorii, cercetătorii și partenerii.</p>
          </div>
          <div className="faq">
            {FAQS.map((f, i) => (
              <div className={`faq__item ${open === i ? 'is-open' : ''}`} key={i}>
                <button className="faq__q" onClick={() => setOpen(open === i ? -1 : i)}>
                  <span>{f.q}</span>
                  <span className="faq__plus">+</span>
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

/* ---------- Final CTA ---------- */
function FinalCTA() {
  return (
    <section className="section" data-screen-label="14 CTA">
      <div className="container">
        <div className="section__label">13 — Începe acum</div>
        <div className="cta-dual">
          <div className="cta-card">
            <div className="mono" style={{ fontSize: 11, opacity: .6, textTransform: 'uppercase', letterSpacing: '.12em', marginBottom: 14 }}>Pentru fondatori</div>
            <h3>Cauți finanțare?</h3>
            <p>Răsfoiește 735+ oportunități verificate, salvează favoritele tale și primește analiză AI de pregătire pentru fiecare program.</p>
            <div className="cta-card__btns">
              <button className="btn btn--accent">Explorează catalogul →</button>
              <button className="btn btn--ghost" style={{ color: 'var(--bg)', borderColor: 'var(--bg)' }}>Încearcă analiza AI</button>
            </div>
          </div>
          <div className="cta-card">
            <div className="mono" style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.12em', marginBottom: 14 }}>Pentru parteneri</div>
            <h3>Reprezinți un program sau fond?</h3>
            <p>Listează-te gratuit în catalog și ajunge la mii de fondatori, cercetători și startup-uri din Moldova, România și Europa de Est.</p>
            <div className="cta-card__btns">
              <button className="btn btn--accent">Listează-te gratuit →</button>
              <button className="btn btn--ghost">Revendică profil</button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------- Footer ---------- */
function Footer({ lang, setLang }) {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer__top">
          <div>
            <div className="footer__brand">eligibil<span style={{ color: 'var(--accent)' }}>.eu</span></div>
            <div className="footer__tag">AI Readiness &amp; Funding Orchestrator</div>
            <p style={{ fontSize: 13.5, color: 'var(--ink-2)', marginTop: 16, maxWidth: 300 }}>
              Agregatorul #1 de granturi, competiții și capital non-dilutiv pentru Moldova, România și Europa de Est.
            </p>
          </div>
          <div className="footer__col">
            <h5>Începe aici</h5>
            <a href="/register.html">Listează-te</a>
            <a href="/register.html">Revendică platformă</a>
            <a href="/grant.html">Caută surse de finanțare</a>
            <a href="/register.html">Analiză AI</a>
          </div>
          <div className="footer__col">
            <h5>Knowledge</h5>
            <a href="#">Rapoarte &amp; whitepapers</a>
            <a href="#">Blog</a>
            <a href="#">Glosar de finanțare</a>
            <a href="#">Video &amp; webinarii</a>
            <a href="#">Investește în Moldova</a>
          </div>
          <div className="footer__col">
            <h5>eligibil.eu</h5>
            <a href="#">Despre noi</a>
            <a href="#">Contact</a>
            <a href="#">Ecosistem duediligence.one</a>
            <a href="#">Scrie pentru noi</a>
            <a href="#">Press &amp; Media</a>
          </div>
          <div className="footer__col">
            <h5>Contact</h5>
            <a href="mailto:hello@eligibil.eu">hello@eligibil.eu</a>
            <a href="#">Chat live (09:00–18:00 EET)</a>
            <div style={{ marginTop: 14, display: 'flex', gap: 12 }}>
              {['LinkedIn', 'YouTube', 'X', 'Telegram'].map(s => (
                <a key={s} href="#" style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, textTransform: 'uppercase', letterSpacing: '.08em', borderBottom: '1px solid currentColor', paddingBottom: 2 }}>{s}</a>
              ))}
            </div>
          </div>
        </div>
        <div className="footer__bottom">
          <div>© 2026 eligibil.eu · duediligence.one SRL + eligibil Foundation · IT Park Moldova</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <div className="lang-sw">
              {[['RO', '🇷🇴 RO'], ['EN', '🇬🇧 EN'], ['RU', '🇷🇺 RU'], ['UA', '🇺🇦 UA']].map(([k, l]) => (
                <button key={k} className={lang === k ? 'is-active' : ''} onClick={() => setLang(k)}>{l}</button>
              ))}
            </div>
          </div>
          <div>
            <a href="#">Imprint</a>
            <a href="#">Disclaimer</a>
            <a href="#">Cookie policy</a>
            <a href="#">Privacy policy</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

Object.assign(window, { About, Advantages, AISection, Reports, Partners, Blog, GetListed, DataQuality, FAQ, FinalCTA, Footer });
