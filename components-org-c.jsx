// eligibil.org — Part C: Reports, Verified Partners, Data Quality, About, FAQ, Final CTA, Footer
const { useState: useStateOrgC } = React;

/* ============================================================
   Reports (section 13)
   ============================================================ */
function ReportsOrg() {
  return (
    <section className="section" data-screen-label="12 Reports">
      <div className="container">
        <div className="section__label">12 — Knowledge hub</div>
        <div className="section__head section__head--row">
          <div>
            <h2 className="section__title">Rapoarte, whitepapers și insights despre piața finanțării.</h2>
            <p className="section__sub">Analize aprofundate realizate de echipa eligibil.org și parteneri, disponibile pentru fondatori, cercetători, acceleratoare și instituții.</p>
          </div>
          <button className="btn--link">Vezi toate rapoartele →</button>
        </div>
        <div className="reports">
          {window.ORG_REPORTS.map((r, i) => (
            <div className="report" key={i}>
              <div className="report__cover">
                <Thumb kind={r.thumb} seed={i + 211} />
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
      </div>
    </section>
  );
}

/* ============================================================
   Verified Partners (section 14) — banner + grid (reuses partners cards)
   ============================================================ */
function VerifiedPartners() {
  return (
    <section className="section" data-screen-label="10 Partners">
      <div className="container">
        <div className="section__label">10 — Verified partners</div>
        <div className="section__head">
          <h2 className="section__title">Acceleratoarele, fondurile și instituțiile care construiesc ecosistemul.</h2>
          <p className="section__sub">Partenerii eligibil.org sunt organizații care susțin startupurile prin finanțare, mentorat, programe, infrastructură, cercetare sau acces la rețele internaționale.</p>
        </div>
        <div className="partners">
          {window.ORG_PARTNERS.map((p, i) => (
            <div className="partner" key={i}>
              <div className="partner__logo"><Thumb kind={p.thumb} seed={i + 241} /></div>
              <div>
                <div className="partner__head">
                  <span className="partner__verified">✓ Verified</span>
                  <span className="partner__country">{p.flag} {p.region}</span>
                </div>
                <h3 className="partner__name">{p.name}</h3>
                <div className="partner__sub">{p.type}</div>
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
        <div style={{ marginTop: 28, display: 'flex', gap: 14, flexWrap: 'wrap' }}>
          <button className="btn btn--accent btn--sm">Listează organizația ta →</button>
          <button className="btn--link">Vezi toți partenerii (60+) →</button>
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   Data Quality (section 15)
   ============================================================ */
function DataQualityOrg() {
  return (
    <section className="section" data-screen-label="13 Quality">
      <div className="container">
        <div className="section__label">13 — Data quality</div>
        <div className="section__head">
          <h2 className="section__title">Zero linkuri moarte. Zero informații expirate. Zero oportunități neverificate.</h2>
          <p className="section__sub">
            Un singur deadline greșit sau un criteriu expirat poate face un fondator să piardă timp critic. De aceea, eligibil.org folosește un sistem de verificare continuă a surselor.
          </p>
        </div>
        <div className="quality">
          {[
            ['01', 'Verificare automată', 'Sistemul monitorizează sursele oficiale și detectează modificări de deadline, sumă, criterii, status sau documente necesare.'],
            ['02', 'Verificare manuală', 'Echipa eligibil.org verifică periodic programele importante, mai ales cele cu apeluri recurente sau criterii complexe.'],
            ['03', 'Feedback comunitate', 'Fondatorii, partenerii și utilizatorii pot raporta surse noi, informații expirate sau discrepanțe. Fiecare raport este revizuit.'],
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

/* ============================================================
   About (section 16)
   ============================================================ */
function AboutOrg() {
  const what = [
    'agregă surse de finanțare',
    'verifică datele și deadline-urile',
    'analizează startupurile cu AI',
    'calculează scoruri de eligibilitate',
    'identifică documente lipsă',
    'recomandă programe potrivite',
    'ajută la pregătirea aplicațiilor',
    'conectează fondatori cu parteneri și consorții',
  ];
  const audience = ['startupuri', 'fondatori early-stage', 'echipe deep tech', 'cercetători', 'spinout-uri universitare', 'IMM-uri inovatoare', 'acceleratoare', 'fonduri', 'instituții publice', 'programe de finanțare'];
  const benefits = [
    'vezi rapid ce programe sunt relevante',
    'înțelegi ce documente îți lipsesc',
    'primești scoruri de potrivire și pregătire',
    'poți genera sau îmbunătăți documente de aplicare',
    'poți identifica parteneri pentru consorții',
    'poți urmări deadline-uri și programe noi',
  ];

  return (
    <section className="section" data-screen-label="09 About" id="about">
      <div className="container">
        <div className="section__label">09 — Despre eligibil.org</div>
        <div className="about-grid">
          <div>
            <h2 className="section__title">Agregatorul de finanțare pentru startupuri, cercetători și fondatori din Europa de Est.</h2>
            <p className="section__sub" style={{ maxWidth: 'none' }}>
              eligibil.org reduce distanța dintre startupuri și finanțarea potrivită. Fondatorii pierd prea mult timp căutând granturi, citind PDF-uri lungi, verificând criterii și încercând să înțeleagă dacă au șanse reale. Noi transformăm acest proces într-un flux clar: cauți, analizezi, înțelegi ce lipsește, aplici mai bine.
            </p>
            <div style={{ marginTop: 28 }}>
              <div className="section__label" style={{ margin: 0 }}>Misiune</div>
              <p style={{ marginTop: 12, fontSize: 18, fontFamily: 'Space Grotesk, sans-serif', letterSpacing: '-.01em', lineHeight: 1.32, fontWeight: 500 }}>
                Să facem finanțarea non-dilutivă mai accesibilă pentru startupurile din Moldova, România și Europa de Est.
              </p>
            </div>
            <div style={{ marginTop: 28 }}>
              <div className="section__label" style={{ margin: 0 }}>Cu eligibil.org poți</div>
              <div className="posi__keys" style={{ marginTop: 8 }}>
                {benefits.map((b, i) => (
                  <div className="posi__key" key={b}>
                    <span className="posi__key-n">0{i+1}</span>
                    <span>{b}</span>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ marginTop: 32, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <button className="btn btn--accent">Caută finanțare →</button>
              <button className="btn btn--ghost">Analizează startupul meu</button>
            </div>
          </div>
          <div>
            <div className="mono" style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.12em', marginBottom: 12 }}>Ce face eligibil.org</div>
            <ul className="about-list">
              {what.map(u => <li key={u}>{u}</li>)}
            </ul>
            <div style={{ marginTop: 32 }}>
              <div className="mono" style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.12em', marginBottom: 12 }}>Pentru cine este</div>
              <div className="vertical-cloud">
                {audience.map(a => <span key={a}>{a}</span>)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   FAQ (section 17)
   ============================================================ */
function FAQOrg() {
  const [open, setOpen] = useStateOrgC(0);
  return (
    <section className="section" data-screen-label="14 FAQ">
      <div className="container">
        <div className="section__label">14 — Întrebări frecvente</div>
        <div className="faq-grid">
          <div>
            <h2 className="section__title">Întrebări frecvente.</h2>
            <p className="section__sub">Despre platformă, scoruri, upload, securitate și planuri.</p>
          </div>
          <div className="faq">
            {window.ORG_FAQS.map((f, i) => (
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

/* ============================================================
   Final CTA (section 18) — 3 buttons
   ============================================================ */
function FinalCTAOrg() {
  return (
    <section className="section" data-screen-label="15 CTA">
      <div className="container">
        <div className="section__label">15 — Începe acum</div>
        <div className="cta-tri">
          <div className="mono" style={{ fontSize: 11, opacity: .6, textTransform: 'uppercase', letterSpacing: '.12em', marginBottom: 14 }}>eligibil.org · 735+ surse · 5 produse AI</div>
          <h2>Începe cu startupul tău. Află unde ești eligibil.</h2>
          <p>Caută printre sute de oportunități, încarcă documentele startupului și primește o analiză clară despre programele potrivite, documentele lipsă și următorii pași.</p>
          <div className="cta-tri__btns">
            <button className="btn btn--accent">Caută finanțare →</button>
            <button className="btn btn--ghost">Analizează startupul meu</button>
            <button className="btn btn--ghost">Listează un program</button>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   Footer (section 19)
   ============================================================ */
function FooterOrg({ lang, setLang }) {
  return (
    <footer className="footer" data-screen-label="16 Footer">
      <div className="container">
        <div className="footer__top">
          <div>
            <div className="footer__brand">eligibil<span style={{ color: 'var(--accent)' }}>.org</span></div>
            <div className="footer__tag">AI Readiness &amp; Funding Orchestrator</div>
            <p style={{ fontSize: 13.5, color: 'var(--ink-2)', marginTop: 16, maxWidth: 300 }}>
              AI Readiness &amp; Funding Orchestrator pentru startupuri, cercetători și parteneri din Moldova, România și Europa de Est.
            </p>
          </div>
          <div className="footer__col">
            <h5>Începe aici</h5>
            <a href="/search">Caută surse de finanțare</a>
            <a href="/upload-artefact">Analizează startupul</a>
            <a href="/register.html">Listează startupul</a>
            <a href="/register.html?type=partner">Listează un program</a>
            <a href="/register.html">Onboarding</a>
          </div>
          <div className="footer__col">
            <h5>Produse</h5>
            <a href="#prod-pitch">Analiză pitch</a>
            <a href="#prod-video">Analiză video</a>
            <a href="#prod-wp">Analiză whitepaper</a>
            <a href="#prod-trl">Evaluare TRL</a>
            <a href="#prod-cons">Identificare consorțiu</a>
          </div>
          <div className="footer__col">
            <h5>Resurse</h5>
            <a href="/blog">Blog</a>
            <a href="/stiri">Știri</a>
            <a href="/parteneri">Parteneri</a>
            <a href="/startupuri">Lista startupuri</a>
            <a href="/blog?cat=reports">Rapoarte &amp; whitepapers</a>
            <a href="/glosar">Glosar de finanțare</a>
            <a href="/evenimente">Video &amp; webinarii</a>
          </div>
          <div className="footer__col">
            <h5>eligibil.org</h5>
            <a href="#about">About</a>
            <a href="mailto:info@eligibil.org">Contact</a>
            <a href="/blog?cat=metodologie">Metodologie</a>
            <a href="/blog?cat=data-quality">Calitatea datelor</a>
            <a href="mailto:info@eligibil.org?subject=Scrie%20pentru%20noi">Scrie pentru noi</a>
            <a href="mailto:info@eligibil.org?subject=Press">Press &amp; Media</a>
          </div>
          <div className="footer__col">
            <h5>Contact</h5>
            <a href="mailto:info@eligibil.org">info@eligibil.org</a>
            <a href="mailto:info@eligibil.org?subject=Chat%20live">Chat live · 09:00–18:00 EET</a>
            <div style={{ marginTop: 14, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {[
                ['LinkedIn', 'https://www.linkedin.com/company/eligibil'],
                ['YouTube',  'https://www.youtube.com/@eligibil'],
                ['X',        'https://x.com/eligibil_org'],
                ['Telegram', 'https://t.me/eligibil'],
              ].map(([s, url]) => (
                <a key={s} href={url} target="_blank" rel="noopener" style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, textTransform: 'uppercase', letterSpacing: '.08em', borderBottom: '1px solid currentColor', paddingBottom: 2 }}>{s}</a>
              ))}
            </div>
          </div>
        </div>
        <div className="footer__bottom">
          <div>© 2026 eligibil.org · RO · EN · RU · UA</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <div className="lang-sw">
              {[['RO', '🇷🇴 RO'], ['EN', '🇬🇧 EN'], ['RU', '🇷🇺 RU'], ['UA', '🇺🇦 UA']].map(([k, l]) => (
                <button key={k} className={lang === k ? 'is-active' : ''} onClick={() => setLang(k)}>{l}</button>
              ))}
            </div>
          </div>
          <div>
            <a href="/legal/imprint">Imprint</a>
            <a href="/legal/disclaimer">Disclaimer</a>
            <a href="/legal/privacy">Privacy Policy</a>
            <a href="/legal/cookie">Cookies</a>
            <a href="/legal/terms">Terms of Use</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

Object.assign(window, { ReportsOrg, VerifiedPartners, DataQualityOrg, AboutOrg, FAQOrg, FinalCTAOrg, FooterOrg });
