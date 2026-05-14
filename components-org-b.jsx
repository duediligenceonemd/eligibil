// eligibil.org — Part B: Programs, DocGen, Upload, Sample Report, Verticals, Resources
const { useState: useStateOrgB, useMemo: useMemoOrgB } = React;

/* ============================================================
   Programs Open (section 7) — reuses ActivePrograms structure
   ============================================================ */
function ProgramsOrg() {
  const [tab, setTab] = useStateOrgB('all');
  const filtered = useMemoOrgB(() => {
    if (tab === 'all') return PROGRAMS;
    if (tab === 'cons') return PROGRAMS.filter(p => /consort/i.test(p.note) || /horizon|eic|pathfinder/i.test(p.name));
    if (tab === 'deep') return PROGRAMS.filter(p => p.sectors.some(s => /deep|hardware|space/i.test(s)));
    return PROGRAMS.filter(p => p.stage === tab);
  }, [tab]);

  const tabs = [
    ['all',    'Toate',        PROGRAMS.length],
    ['idea',   'Idea',         PROGRAMS.filter(p=>p.stage==='idea').length],
    ['early',  'Early-stage',  PROGRAMS.filter(p=>p.stage==='early').length],
    ['growth', 'Growth',       PROGRAMS.filter(p=>p.stage==='growth').length],
    ['rd',     'R&D',          PROGRAMS.filter(p=>p.stage==='rd').length],
    ['deep',   'Deep tech',    PROGRAMS.filter(p => p.sectors.some(s => /deep|hardware|space/i.test(s))).length],
    ['cons',   'Consorțiu',    PROGRAMS.filter(p => /consort/i.test(p.note) || /horizon|eic|pathfinder/i.test(p.name)).length],
  ];

  return (
    <section className="section" data-screen-label="07 Programs" id="programe">
      <div className="container">
        <div className="section__label">07 — Programe deschise</div>
        <div className="section__head">
          <h2 className="section__title">Programe deschise pentru aplicare.</h2>
          <p className="section__sub">Cele mai recente programe verificate în baza eligibil.org. Actualizate periodic și disponibile cu analiză AI de pregătire.</p>
        </div>

        <div className="tabs">
          {tabs.map(([id, l, n]) => (
            <button key={id} className={`tab ${tab === id ? 'is-active' : ''}`} onClick={() => setTab(id)}>
              {l} <span className="tab__count">[{n}]</span>
            </button>
          ))}
        </div>

        <div className="programs">
          {filtered.slice(0, 6).map((p, i) => (
            <div className="program" key={i}>
              <div className="program__status">
                <span className={`status-pill ${p.status}`}>
                  <span className="status-pill__dot" />
                  {p.status === 'live' ? 'Activ' : p.status === 'soon' ? 'În curând' : 'Închis'}
                </span>
                <div className="program__deadline">
                  Deadline
                  <strong>{p.deadline}</strong>
                </div>
              </div>
              <div className="program__main">
                <div className="program__from">De la {p.from} · {p.flag}</div>
                <h3 className="program__name">{p.name}</h3>
                <div className="mono" style={{ fontSize: 12, color: 'var(--ink-2)' }}>
                  {p.amount} · {p.type} · {p.trl}
                </div>
                <div className="program__tags">
                  {p.sectors.map(s => <span className="program__tag" key={s}>{s}</span>)}
                </div>
              </div>
              <div className="program__facts">
                <div className="program__fact">
                  <span className="program__fact-k">Match median</span>
                  <span className="program__fact-v mono">{p.matchScore}/100</span>
                </div>
                <div className="program__score">
                  <div className="score-bar"><div className="score-bar__fill" style={{ width: `${p.matchScore}%` }}/></div>
                </div>
                <div className="program__fact">
                  <span className="program__fact-k">Readiness median</span>
                  <span className="program__fact-v mono">{Math.max(20, p.matchScore - 12)}/100</span>
                </div>
                <div className="program__fact">
                  <span className="program__fact-k">Aplicanți tipici</span>
                  <span className="program__fact-v mono">{p.applicants}</span>
                </div>
              </div>
              <div className="program__action">
                <button className="btn btn--accent btn--sm">Vezi detalii →</button>
                <button className="btn btn--ghost btn--sm">Analizează șansele</button>
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 28 }}>
          <a className="btn--link" href="/search?status=open&sort=deadline">Vezi toate programele deschise →</a>
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   Doc generation blocks (section 8)
   ============================================================ */
function DocGenOrg() {
  return (
    <section className="section" data-screen-label="06 DocGen">
      <div className="container">
        <div className="section__label">06 — Document generation</div>
        <div className="section__head">
          <h2 className="section__title">Peste scoring, AI-ul te ajută să pregătești documentele.</h2>
          <p className="section__sub">Ai ales programul. Ai scorul. Acum ai nevoie de aplicația efectivă. eligibil.org te ajută să structurezi, rescrii și pregătești documentele necesare.</p>
        </div>

        <div className="docgen">
          {window.ORG_DOCGEN.map(d => (
            <div className="dgen" key={d.n}>
              <div className="dgen__n">{d.n}</div>
              <h3 className="dgen__name">{d.name}</h3>
              <p className="dgen__desc">{d.desc}</p>
              <div className="dgen__sample">{d.sample}</div>
              <div className="dgen__cta">
                <span>{d.cta}</span>
                <span>→</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   Upload section (section 9) — analiza în 90 secunde
   ============================================================ */
function UploadIcon({ kind }) {
  const stroke = '#0e1620';
  switch (kind) {
    case 'deck':
      return (
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
          <rect x="3" y="6" width="22" height="14" stroke={stroke} strokeWidth="1.6" />
          <line x1="3" y1="10" x2="25" y2="10" stroke={stroke} strokeWidth="1.6" />
          <line x1="11" y1="20" x2="11" y2="24" stroke={stroke} strokeWidth="1.6" />
          <line x1="17" y1="20" x2="17" y2="24" stroke={stroke} strokeWidth="1.6" />
        </svg>
      );
    case 'video':
      return (
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
          <rect x="3" y="6" width="17" height="16" stroke={stroke} strokeWidth="1.6" />
          <path d="M20 11l5-3v12l-5-3z" stroke={stroke} strokeWidth="1.6" fill="none" />
        </svg>
      );
    case 'doc':
      return (
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
          <path d="M6 4h12l4 4v16H6z" stroke={stroke} strokeWidth="1.6" fill="none" />
          <line x1="10" y1="13" x2="18" y2="13" stroke={stroke} strokeWidth="1.6" />
          <line x1="10" y1="17" x2="18" y2="17" stroke={stroke} strokeWidth="1.6" />
          <line x1="10" y1="21" x2="15" y2="21" stroke={stroke} strokeWidth="1.6" />
        </svg>
      );
    case 'form':
    default:
      return (
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
          <rect x="5" y="5" width="18" height="18" stroke={stroke} strokeWidth="1.6" />
          <circle cx="9" cy="11" r="1.2" fill={stroke} />
          <line x1="13" y1="11" x2="20" y2="11" stroke={stroke} strokeWidth="1.6" />
          <circle cx="9" cy="15" r="1.2" fill={stroke} />
          <line x1="13" y1="15" x2="20" y2="15" stroke={stroke} strokeWidth="1.6" />
          <circle cx="9" cy="19" r="1.2" fill={stroke} />
          <line x1="13" y1="19" x2="20" y2="19" stroke={stroke} strokeWidth="1.6" />
        </svg>
      );
  }
}

function UploadFlow() {
  const [slots, setSlots] = useStateOrgB({ deck: false, video: false, wp: false });
  const filled = Object.values(slots).filter(Boolean).length;
  const toggle = (k) => setSlots(s => ({ ...s, [k]: !s[k] }));

  return (
    <section className="section" data-screen-label="03 Upload" id="analiza">
      <div className="container">
        <div className="section__label">03 — Analiza AI · 90 secunde</div>
        <div className="section__head" style={{ textAlign: 'center', margin: '0 auto 36px', maxWidth: 920 }}>
          <h2 className="section__title" style={{ fontSize: 'clamp(36px, 4.8vw, 64px)' }}>
            Încarcă. Analizează. Află exact unde ești <em style={{ fontStyle: 'normal', color: 'var(--accent)' }}>eligibil.</em>
          </h2>
          <p className="section__sub" style={{ margin: '18px auto 0' }}>
            eligibil.org analizează artefactele startupului tău — pitch deck, video, whitepaper — identifică automat TRL-ul, calculează scorul de potrivire pentru peste 735 de surse de finanțare și îți livrează un plan concret pentru a deveni eligibil.
          </p>
        </div>

        <div className="upload-panel">
          <div className="upload-panel__head">
            <h3>Obține scorul tău de eligibilitate în 90 de secunde</h3>
            <div className="upload-panel__counter">
              {filled}/3 artefacte · {filled === 0 ? 'min. 1 necesar' : filled === 3 ? 'profil complet · maxim confidence' : 'gata pentru analiză'}
            </div>
          </div>
          <div className="upload-grid">
            <UploadSlotOrg id="deck"  label="Pitch Deck"  meta="PDF / PPTX · ≤50MB · max 30 slide"   code="01" filled={slots.deck}  onClick={() => toggle('deck')} />
            <UploadSlotOrg id="video" label="Video Pitch" meta="MP4 / MOV · ≤500MB · max 3 minute" code="02" filled={slots.video} onClick={() => toggle('video')} />
            <UploadSlotOrg id="wp"    label="Whitepaper"  meta="PDF / DOCX · ≤30MB · max 10 pagini" code="03" filled={slots.wp}    onClick={() => toggle('wp')} />
          </div>
          <div className="upload-panel__foot">
            <div className="upload-panel__foot-left">
              <span>✓ Minimum <strong>1 artefact</strong> pentru a începe</span>
              <span>✓ Datele tale nu sunt partajate · nu antrenăm modele AI pe ele</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
              <span className="upload-panel__alt">sau <a href="#form">completează formularul minim (30s)</a></span>
              <button className="upload-panel__cta" disabled={filled === 0}>
                ANALIZEAZĂ-MĂ ACUM →
              </button>
            </div>
          </div>
        </div>

        <div className="upload-microcopy">
          Cu cât mai multe artefacte încarci, cu atât crește Confidence Score-ul analizei.<br/>
          Un singur document este suficient pentru a începe — sistemul îți spune explicit ce câștigi adăugând următorul.
        </div>

        {/* extra: also a 4th tile for the form-only flow */}
        <div style={{ marginTop: 28, padding: '22px 24px', border: '1px solid var(--border)', background: 'var(--bg-2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 24, flexWrap: 'wrap' }} id="form">
          <div style={{ display: 'flex', gap: 18, alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ width: 44, height: 44, border: '1px solid var(--border)', background: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <UploadIcon kind="form" />
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 600 }}>Nu ai documente pregătite?</div>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11.5, color: 'var(--muted)', marginTop: 4 }}>
                12 întrebări · 3 minute · pornește de la idee sau MVP
              </div>
            </div>
          </div>
          <button className="btn btn--ghost btn--sm">Completează formular minim →</button>
        </div>
      </div>
    </section>
  );
}

function UploadSlotOrg({ label, meta, code, filled, onClick }) {
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

/* ============================================================
   Sample report (section 10)
   ============================================================ */
function SampleReportOrg() {
  const s = window.ORG_SAMPLE;
  return (
    <section className="section" data-screen-label="04 Report">
      <div className="container">
        <div className="section__label">04 — Raportul tău</div>
        <div className="section__head">
          <h2 className="section__title">Iată ce primești după analiză.</h2>
          <p className="section__sub">Un raport clar, structurat și orientat spre acțiune. Nu doar scoruri, ci pași concreți pentru a aplica mai bine.</p>
        </div>

        <div className="report-mock">
          <div className="rmock__head">
            <span>Raport startup · exemplu</span>
            <span className="rmock__chip"><span className="dot" /> Live preview</span>
          </div>
          <div className="rmock__grid">
            <div className="rmock__profile">
              <div className="rmock__profile-sub">PROFIL</div>
              <h3>{s.startup}</h3>
              <div className="rmock__profile-sub" style={{ marginTop: 4 }}>{s.sector}</div>

              <div className="rmock__facts">
                <div className="rmock__fact"><span className="rmock__fact-k">TRL</span><span><strong style={{ fontFamily: 'JetBrains Mono, monospace' }}>{s.trl}</strong> · {s.trlNote}</span></div>
                <div className="rmock__fact"><span className="rmock__fact-k">Stadiu</span><span>{s.stage}</span></div>
                <div className="rmock__fact"><span className="rmock__fact-k">Jurisdicție</span><span>{s.region}</span></div>
                <div className="rmock__fact"><span className="rmock__fact-k">Echipă</span><span>{s.team}</span></div>
                <div className="rmock__fact"><span className="rmock__fact-k">Ask</span><span style={{ fontFamily: 'JetBrains Mono, monospace' }}>{s.ask}</span></div>
                <div className="rmock__fact"><span className="rmock__fact-k">Capital</span><span>{s.capital}</span></div>
                <div className="rmock__fact"><span className="rmock__fact-k">Consorțiu</span><span>{s.consortium}</span></div>
              </div>
            </div>

            <div className="rmock__main">
              <div className="rmock__scores">
                <div className="rmock__score">
                  <div className="rmock__score-h">Match score</div>
                  <div className="rmock__score-n">82 <span style={{ fontSize: 14, color: 'var(--muted)' }}>/100</span></div>
                  <div className="rmock__score-d">Cât de bine se potrivește startupul cu programul selectat.</div>
                </div>
                <div className="rmock__score">
                  <div className="rmock__score-h">Readiness</div>
                  <div className="rmock__score-n">58 <span style={{ fontSize: 14, color: 'var(--muted)' }}>/100</span></div>
                  <div className="rmock__score-d">Cât de pregătită este aplicația și ce documente lipsesc.</div>
                </div>
                <div className="rmock__score">
                  <div className="rmock__score-h">Confidence</div>
                  <div className="rmock__score-n">88<span style={{ fontSize: 14, color: 'var(--muted)' }}>%</span></div>
                  <div className="rmock__score-d">Cât de sigure sunt datele pe baza cărora s-a făcut analiza.</div>
                </div>
              </div>

              <div className="rmock__table">
                <div className="rmock__table-h">
                  <span>Top programe recomandate</span>
                  <span>Regiune</span>
                  <span>Match</span>
                  <span>Ready</span>
                  <span>Conf</span>
                  <span>Acțiune</span>
                </div>
                {s.rows.map((r, i) => (
                  <div className={`rmock__row ${r.hot ? 'hot' : ''}`} key={i}>
                    <span>{r.flag} {r.name}</span>
                    <span style={{ color: 'var(--muted)' }}>{r.region}</span>
                    <span className="rmock__num">{r.match}</span>
                    <span className="rmock__num">{r.ready}</span>
                    <span className="rmock__num">{r.conf}%</span>
                    <span className="rmock__action">{r.action} →</span>
                  </div>
                ))}
              </div>

              <div className="rmock__actions">
                <div className="rmock__actions-h">Acțiuni AI sugerate</div>
                {s.actions.map(a => (
                  <button className="rmock__action-pill" key={a}>{a}</button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   Verticals (section 11)
   ============================================================ */
function VerticalsGrid() {
  return (
    <section className="section" data-screen-label="08 Verticals" id="catalog">
      <div className="container">
        <div className="section__label">08 — Catalog pe verticale</div>
        <div className="section__head section__head--row">
          <div>
            <h2 className="section__title">Găsește finanțare pentru verticala ta.</h2>
            <p className="section__sub">Peste 735 de surse clasificate pe verticale, regiuni, tip de capital, sume, stadiu și nivel de pregătire. Fiecare categorie are propria pagină de catalog cu filtre avansate.</p>
          </div>
          <a className="btn--link" href="/search">Vezi toate verticalele →</a>
        </div>

        <div className="verticals">
          {window.ORG_VERTICALS.map((v, i) => (
            <a className="vert" href={`/search?sector=${encodeURIComponent(v.name)}`} key={v.id}>
              <div className="vert__head">
                <div className="vert__thumb"><Thumb kind={v.thumb} seed={i + 91} /></div>
                <div className="vert__n">{String(i+1).padStart(2,'0')} / 11</div>
              </div>
              <div className="vert__name">{v.name}</div>
              <p className="vert__desc">{v.desc}</p>
              <div className="vert__meta">{v.n} surse · {v.range}</div>
              <div className="vert__cta">Explorează categoria →</div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   Resources (section 12) — tabbed: Blog / News / Partners / Startups / Onboarding
   ============================================================ */
function ResourcesOrg() {
  const [tab, setTab] = useStateOrgB('blog');

  const tabs = [
    ['blog',     'Blog'],
    ['news',     'Știri'],
    ['startups', 'Lista startupuri'],
    ['onb',      'Onboarding'],
  ];

  return (
    <section className="section" data-screen-label="11 Resources" id="resurse">
      <div className="container">
        <div className="section__label">11 — Resurse</div>
        <div className="section__head">
          <h2 className="section__title">Resurse pentru fondatori, cercetători și parteneri.</h2>
          <p className="section__sub">Ghiduri, știri, articole, rapoarte și materiale practice despre finanțări, granturi, aplicații și ecosistem.</p>
        </div>

        <div className="res-tabs">
          {tabs.map(([id, l]) => (
            <button key={id} className={`res-tab ${tab === id ? 'is-active' : ''}`} onClick={() => setTab(id)}>{l}</button>
          ))}
        </div>

        {tab === 'blog' && <ResBlog />}
        {tab === 'news' && <ResNews />}
        {tab === 'parteneri' && <ResPartners />}
        {tab === 'startups' && <ResStartups />}
        {tab === 'onb' && <ResOnboard />}
      </div>
    </section>
  );
}

function ResBlog() {
  return (
    <>
      <div className="blog">
        {window.ORG_POSTS.map((p, i) => (
          <a className="post" key={i} href={`/blog?q=${encodeURIComponent(p.title)}`}>
            <div className="post__cover"><Thumb kind={p.thumb} seed={i + 131} /></div>
            <div className="post__body">
              <div className="post__meta">
                <span className="post__cat">{p.cat}</span>
                <span>{p.time} citire</span>
              </div>
              <h3 className="post__title">{p.title}</h3>
              <p className="post__desc">{p.desc}</p>
              <div className="post__foot">{p.date} · Echipa eligibil.org</div>
            </div>
          </a>
        ))}
      </div>
      <div style={{ marginTop: 28 }}><a className="btn--link" href="/blog">Vezi blogul →</a></div>
    </>
  );
}

function ResNews() {
  return (
    <>
      <div className="news-list">
        {window.ORG_NEWS.map((n, i) => (
          <a className="news-item" key={i} href={`/stiri?q=${encodeURIComponent(n.title)}`}>
            <span className="news-item__tag">{n.tag}</span>
            <span className="news-item__date">{n.date}</span>
            <span className="news-item__title">{n.title}</span>
            <span className="news-item__src">{n.src} →</span>
          </a>
        ))}
      </div>
      <div style={{ marginTop: 28 }}><a className="btn--link" href="/stiri">Vezi toate știrile →</a></div>
    </>
  );
}

function ResPartners() {
  return (
    <>
      <div className="partners">
        {window.ORG_PARTNERS.map((p, i) => (
          <a className="partner" key={i} href={`/search?q=${encodeURIComponent(p.name)}`} style={{ textDecoration: 'none', color: 'inherit' }}>
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
                {p.tags.map(t => <span className="program__tag" key={t}>{t}</span>)}
              </div>
              <div className="partner__cta">
                <span>Vezi profil</span>
                <span>→</span>
              </div>
            </div>
          </a>
        ))}
      </div>
      <div style={{ marginTop: 28, display: 'flex', gap: 14, flexWrap: 'wrap' }}>
        <a className="btn--link" href="/search?tip=Accelerator">Vezi partenerii →</a>
        <a className="btn--link" href="/register.html?type=partner">Listează organizația ta →</a>
      </div>
    </>
  );
}

function ResStartups() {
  return (
    <>
      <div className="stab">
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
        {window.ORG_STARTUPS.map((s, i) => {
          const cls = s.cons === 'open' ? 'open' : s.cons === 'forming' ? 'forming' : 'closed';
          return (
            <a className="stab__row" key={i} href={`/search?q=${encodeURIComponent(s.name)}`} style={{ textDecoration: 'none', color: 'inherit' }}>
              <span className="stab__name">{s.flag} {s.name}</span>
              <span>{s.vert}</span>
              <span className="stab__cell-mono">{s.stage}</span>
              <span className="stab__cell-mono">TRL {s.trl}</span>
              <span>{s.looking}</span>
              <span className="stab__cell-mono">{s.ask}</span>
              <span><span className={`stab__pill ${cls}`}>{s.cons}</span></span>
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '.08em' }}>Profil →</span>
            </a>
          );
        })}
      </div>
      <div style={{ marginTop: 28, display: 'flex', gap: 14, flexWrap: 'wrap' }}>
        <a className="btn--link" href="/search">Explorează startupuri →</a>
        <a className="btn--link" href="/register.html">Listează startupul tău →</a>
      </div>
    </>
  );
}

function ResOnboard() {
  const founders = [
    'Creezi profilul startupului.',
    'Adaugi pitch deck, video sau whitepaper.',
    'Primești scoruri de eligibilitate.',
    'Alegi programele potrivite.',
    'Generezi sau îmbunătățești documentele.',
    'Aplici și urmărești progresul.',
  ];
  const partners = [
    'Creezi profilul organizației.',
    'Listezi programul sau fondul.',
    'Verifici informațiile publice.',
    'Primești badge de partener verificat.',
    'Primești aplicații mai relevante de la startupuri.',
  ];
  return (
    <div className="onboard">
      <div className="onb">
        <div className="onb__role">Pentru fondatori</div>
        <h3>Trasee de la idee la aplicație finanțabilă.</h3>
        <p style={{ fontSize: 14, color: 'var(--ink-2)', marginTop: 8 }}>6 pași esențiali, cu suport AI la fiecare etapă.</p>
        <div className="onb__steps">
          {founders.map(s => <div className="onb__step" key={s}><span>{s}</span></div>)}
        </div>
        <div style={{ marginTop: 24 }}><button className="btn btn--accent btn--sm">Începe onboarding →</button></div>
      </div>
      <div className="onb">
        <div className="onb__role">Pentru parteneri</div>
        <h3>De la listare la matching cu aplicanți pre-calificați.</h3>
        <p style={{ fontSize: 14, color: 'var(--ink-2)', marginTop: 8 }}>5 pași pentru acceleratoare, fonduri, instituții publice.</p>
        <div className="onb__steps">
          {partners.map(s => <div className="onb__step" key={s}><span>{s}</span></div>)}
        </div>
        <div style={{ marginTop: 24 }}><button className="btn btn--accent btn--sm">Listează-te →</button></div>
      </div>
    </div>
  );
}

Object.assign(window, { ProgramsOrg, DocGenOrg, UploadFlow, SampleReportOrg, VerticalsGrid, ResourcesOrg });
