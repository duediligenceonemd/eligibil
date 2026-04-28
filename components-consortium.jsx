// Consortium page
const { useState, useMemo } = React;

const OPPS = [
  { id: 'o1', t: 'Consorțiu Horizon Europe · Cluster 4 — AI pentru diagnostic medical', grant: 'HORIZON-HLTH-2026-AI-01', grantShort: 'Horizon EU', amount: '€5–8M', deadline: '15 Sep 2026', lead: 'TU Munich', leadLogo: 'TM', leadMeta: '🇩🇪 DE · Research Institute', match: 87,
    desc: 'Construim consorțiu de 7 parteneri pentru aplicație Horizon. Avem deja lead-ul universitar, 2 spitale și 1 SME. Căutăm 3 parteneri complementari pentru completarea rolurilor critice.',
    needs: [{ t: 'SME cu MVP AI medical', kind: 'fit' }, { t: 'Spital/Clinică UE', kind: 'hot' }, { t: 'SME validation & ethics', kind: '' }, { t: 'Data infrastructure partner', kind: '' }],
    members: 4, targetMembers: 7, countries: ['DE', 'NL', 'ES', 'FR'] },
  { id: 'o2', t: 'Climate-KIC — Energie regenerabilă pentru IMM-uri rurale', grant: 'EIT Climate-KIC · RURAL-2026', grantShort: 'EIT', amount: '€2M', deadline: '30 Iun 2026', lead: 'ClujTech Hub', leadLogo: 'CH', leadMeta: '🇷🇴 RO · Innovation Hub', match: 76,
    desc: 'Proiect pilot în 4 țări CEE pentru instalare de sisteme solare hibride pentru IMM-uri din zone rurale. Avem granturile pentru RO și BG; căutăm parteneri pentru MD și UA.',
    needs: [{ t: 'Implementation partner MD', kind: 'hot' }, { t: 'Implementation partner UA', kind: 'hot' }, { t: 'Energy consultant certified', kind: '' }],
    members: 5, targetMembers: 8, countries: ['RO', 'BG', 'MD', 'UA'] },
  { id: 'o3', t: 'Eurostars-3 — Platformă SaaS pentru conformitate ESG în manufacturing', grant: 'EUREKA Eurostars-3', grantShort: 'Eurostars', amount: '€500K–€1.2M', deadline: '2 Iulie 2026', lead: 'GreenOps SRL', leadLogo: 'GO', leadMeta: '🇷🇴 RO · Scale-up', match: 92,
    desc: 'SaaS B2B pentru ESG compliance. Avem produs și primii clienți. Căutăm partener R&D academic (reducerea emisiilor) și SME-uri din 2 țări EU pentru validare pilot.',
    needs: [{ t: 'University R&D (EU)', kind: 'fit' }, { t: 'SaaS pilot SME (DACH)', kind: '' }, { t: 'SaaS pilot SME (Nordic)', kind: '' }],
    members: 2, targetMembers: 5, countries: ['RO', 'DE', 'SE'] },
  { id: 'o4', t: 'Digital Europe Programme — Cybersecurity pentru instituții publice regionale', grant: 'DIGITAL-2026-CYB-05', grantShort: 'Digital EU', amount: '€3.5M', deadline: '10 Aug 2026', lead: 'CERT-RO + Bitdefender', leadLogo: 'CR', leadMeta: '🇷🇴 RO · Public-Private', match: 68,
    desc: 'Deployment de soluții cybersecurity în 12 municipalități din RO + MD + BG. Consorțiu are deja operatorul + vendor. Căutăm training partner și auditor independent.',
    needs: [{ t: 'Cybersecurity training SME', kind: '' }, { t: 'Independent audit firm', kind: 'hot' }],
    members: 3, targetMembers: 5, countries: ['RO', 'MD', 'BG'] },
  { id: 'o5', t: 'Interreg NEXT · Cultural heritage cu AR/VR', grant: 'Interreg-NEXT-CUL-2026', grantShort: 'Interreg', amount: '€800K', deadline: '20 Iun 2026', lead: 'Muzeul Național RO', leadLogo: 'MN', leadMeta: '🇷🇴 RO · Public Institution', match: 74,
    desc: 'Digitalizare + experiențe AR/VR pentru 5 muzee în RO, MD, UA. Avem muzeele; căutăm studio tech AR/VR și expert UX heritage.',
    needs: [{ t: 'AR/VR studio (CEE)', kind: 'fit' }, { t: 'Heritage UX specialist', kind: '' }],
    members: 5, targetMembers: 7, countries: ['RO', 'MD', 'UA'] },
  { id: 'o6', t: 'Horizon Widening — Boost pentru startup-uri biotech CEE', grant: 'HORIZON-WIDERA-2026', grantShort: 'Horizon EU', amount: '€1.8M', deadline: '12 Oct 2026', lead: 'BioHub Warsaw', leadLogo: 'BW', leadMeta: '🇵🇱 PL · Cluster', match: 81,
    desc: 'Program de mentoring + acces la infrastructură biotech pentru 40 startup-uri din Widening countries. Avem cluster PL + HU; căutăm parteneri RO + MD + BG.',
    needs: [{ t: 'Biotech cluster RO', kind: 'hot' }, { t: 'Biotech cluster MD', kind: 'hot' }, { t: 'Commercialization advisor', kind: '' }],
    members: 3, targetMembers: 6, countries: ['PL', 'HU', 'RO', 'MD'] },
];

const PARTNERS = [
  { i: 'AX', n: 'Axon Labs', meta: '🇲🇩 MD · AI/ML SME', bio: 'Startup AI pentru NLP în română. MVP cu 4 clienți enterprise. Căutăm consorții Horizon cluster 4 sau Digital Europe.', tags: ['AI/ML', 'NLP', 'SaaS'], stats: [['3', 'consortii'], ['2', 'grants'], ['12', 'echipă']], avail: 'Disponibil', kind: 'SME' },
  { i: 'TM', n: 'TU Munich — Chair of AI Medicine', meta: '🇩🇪 DE · University', bio: 'Grup de cercetare cu 14 PhD, publicații în Nature Medicine. Participare în 9 Horizon-uri. Oferă consorții lead + R&D support.', tags: ['Research', 'Medical AI', 'Horizon'], stats: [['9', 'Horizon-uri'], ['4', 'lead role'], ['14', 'PhD']], avail: 'Limited', kind: 'Research', busy: true },
  { i: 'CT', n: 'CleanTech RO', meta: '🇷🇴 RO · Energy Scale-up', bio: 'Implementăm sisteme solare hibride. 120 installații în RO. Vrem să intrăm pe MD + UA prin consorții Interreg sau Climate-KIC.', tags: ['Climate', 'Solar', 'CEE'], stats: [['5', 'consortii'], ['€4M', 'grants'], ['45', 'echipă']], avail: 'Disponibil' },
  { i: 'BD', n: 'Bitdefender Labs', meta: '🇷🇴 RO · Corporate R&D', bio: 'Divizia R&D a Bitdefender. Participare în consorții cybersec EU. Oferă vendor role + R&D component.', tags: ['Cybersec', 'Corporate R&D'], stats: [['12', 'Horizon-uri'], ['€28M', 'grants'], ['~200', 'R&D']], avail: 'Limited', busy: true },
  { i: 'TK', n: 'Tekwill Innovation', meta: '🇲🇩 MD · Cluster', bio: 'Cel mai mare cluster IT din Moldova. 250+ membri. Rol de ecosystem partner pentru validare pilot sau acces startup-uri.', tags: ['Cluster', 'MD', 'Validation'], stats: [['7', 'consortii'], ['250+', 'membri'], ['€2M', 'grants']], avail: 'Disponibil' },
  { i: 'IH', n: 'Impact Hub Bucharest', meta: '🇷🇴 RO · Community', bio: 'Rețea de antreprenori + acces la 400 SME-uri active. Participare ca community engagement partner.', tags: ['Community', 'SME'], stats: [['4', 'consortii'], ['400+', 'SME'], ['12', 'echipă']], avail: 'Disponibil' },
  { i: 'GO', n: 'GreenOps SRL', meta: '🇷🇴 RO · SaaS Scale-up', bio: 'SaaS ESG compliance, 60 clienți enterprise în DACH. Căutăm R&D partner și pilot partners pentru Eurostars.', tags: ['SaaS', 'ESG', 'Scale-up'], stats: [['2', 'consortii'], ['€1.2M', 'grants'], ['38', 'echipă']], avail: 'Disponibil' },
  { i: 'AU', n: 'AgroUTM', meta: '🇲🇩 MD · University', bio: 'Universitatea Agrară de Stat. Laboratoare AgriTech + 40 ani experiență research. Participare lead sau partner R&D.', tags: ['AgriTech', 'Research'], stats: [['3', 'consortii'], ['€650K', 'grants'], ['22', 'researchers']], avail: 'Disponibil' },
  { i: 'BV', n: 'BioVera', meta: '🇵🇱 PL · Biotech SME', bio: 'Biotech de diagnostic molecular. Participare ca tech partner sau validation partner în consorții medicale.', tags: ['Biotech', 'Diagnostic'], stats: [['6', 'consortii'], ['€8M', 'grants'], ['28', 'echipă']], avail: 'Limited', busy: true },
];

const MY_CONSORTIA = [
  { id: 'mc1', t: 'AI Medical Diagnostic Consortium', grant: 'HORIZON-HLTH-2026-AI-01', grantShort: 'Horizon EU', status: 'Activ · Deadline 15 Sep', statusKind: '',
    progress: 65, progressKind: 'pregătire',
    deadline: '15 Sep 2026', budget: '€5.2M', role: 'SME Validator',
    members: [
      { i: 'TM', n: 'TU Munich', role: 'Lead + R&D', flag: '🇩🇪', lead: true },
      { i: 'AX', n: 'Axon Labs', role: 'SME Validator', flag: '🇲🇩', self: true },
      { i: 'UK', n: 'UKE Hamburg', role: 'Clinical Pilot', flag: '🇩🇪' },
      { i: 'CR', n: 'Clinica Reg. BCN', role: 'Clinical Pilot', flag: '🇪🇸' },
      { i: 'SU', n: 'SciendLab', role: 'Data partner', flag: '🇳🇱' },
    ],
    slotsOpen: 2 },
  { id: 'mc2', t: 'Climate Solar CEE — Pilot 4 țări', grant: 'EIT Climate-KIC · RURAL-2026', grantShort: 'EIT', status: 'Recruitare', statusKind: 'open',
    progress: 38, progressKind: 'recruitare',
    deadline: '30 Iun 2026', budget: '€2M', role: 'Co-lead MD',
    members: [
      { i: 'CT', n: 'CleanTech RO', role: 'Lead', flag: '🇷🇴', lead: true },
      { i: 'AX', n: 'Axon Labs', role: 'Co-lead MD', flag: '🇲🇩', self: true },
      { i: 'BG', n: 'SofiaEnergy', role: 'Implementation BG', flag: '🇧🇬' },
    ],
    slotsOpen: 3 },
  { id: 'mc3', t: 'Cybersec Muni — 12 orașe CEE', grant: 'DIGITAL-2026-CYB-05', grantShort: 'Digital EU', status: 'Draft', statusKind: 'draft',
    progress: 20, progressKind: 'draft',
    deadline: '10 Aug 2026', budget: '€3.5M', role: 'Training SME (propus)',
    members: [
      { i: 'AX', n: 'Axon Labs', role: 'Training (propus)', flag: '🇲🇩', self: true },
    ],
    slotsOpen: 4 },
];

const INVITES = [
  { id: 'i1', unread: true, from: 'TU', fromName: 'TU Munich', t: 'Invitație: Consorțiu Horizon Europe AI Medical', d: 'Dr. Klaus Brandstätter te invită să participi ca SME Validator în consorțiul pentru HORIZON-HLTH-2026-AI-01. Budget alocat ție: €480K.', date: 'Acum 2 ore', actions: ['accept', 'decline', 'discuss'] },
  { id: 'i2', unread: true, from: 'CT', fromName: 'CleanTech RO', t: 'Cerere de colaborare: Climate-KIC Solar Pilot', d: 'Bogdan Iliescu — "Avem granturile pentru RO și BG, căutăm co-lead pentru MD. Vezi profilul tău și vrem să vorbim."', date: 'Ieri', actions: ['accept', 'discuss'] },
  { id: 'i3', unread: false, from: 'GO', fromName: 'GreenOps SRL', t: 'Respins: Eurostars-3 ESG Platform', d: 'Andra Popescu — "Mulțumim pentru timp. Din păcate am ales alt partener cu focus mai strict pe compliance. Rămânem în contact pentru viitor."', date: 'Acum 3 zile', actions: ['archive'] },
  { id: 'i4', unread: false, from: 'EC', fromName: 'EU Grants Finder', t: 'Match nou: Ești potrivit pentru consorțiul Interreg NEXT Cultural Heritage', d: 'Bazat pe profilul tău AI/NLP, Muzeul Național RO caută tech partner pentru consorțiu. Match 74%.', date: 'Săpt. trecută', actions: ['view', 'dismiss'] },
];

function NetworkViz() {
  const nodes = [
    { x: 50, y: 50, s: 'lead', i: 'AX' }, { x: 20, y: 30, i: 'TM' }, { x: 80, y: 25, i: 'CT' },
    { x: 15, y: 75, i: 'GO' }, { x: 85, y: 70, i: 'TK' }, { x: 50, y: 12, i: 'BV' },
    { x: 35, y: 88, i: 'IH' }, { x: 70, y: 90, i: 'BD' },
  ];
  return (
    <svg viewBox="0 0 100 100" className="co__hero-net-svg" preserveAspectRatio="xMidYMid meet">
      {nodes.slice(1).map((n, i) => (
        <line key={i} x1="50" y1="50" x2={n.x} y2={n.y} stroke="var(--border)" strokeWidth=".3" strokeDasharray="1,1" />
      ))}
      {nodes.map((n, i) => (
        <g key={i}>
          <rect x={n.x - 4.5} y={n.y - 3} width="9" height="6"
            fill={n.s === 'lead' ? 'var(--accent)' : 'var(--ink)'} />
          <text x={n.x} y={n.y + 1.3} textAnchor="middle" fontFamily="JetBrains Mono"
            fontSize="2.5" fill={n.s === 'lead' ? 'var(--accent-ink)' : 'var(--bg)'}>{n.i}</text>
        </g>
      ))}
    </svg>
  );
}

function Hero() {
  return (
    <section className="co__hero">
      <div>
        <div className="co__hero-label">CONSORȚII · PARTNER MATCHING</div>
        <h1 className="co__hero-title">Construiește consorțiul<br /><em>potrivit.</em> În săptămâni, nu luni.</h1>
        <p className="co__hero-sub">Horizon Europe, Interreg, Digital EU, Climate-KIC — toate cer consorții. Aici găsești parteneri, alături de ce caută și pe ce grant, cu match scoring AI pe profilul tău.</p>
      </div>
      <div className="co__hero-net">
        <div className="co__hero-net-h"><span>REȚEAUA TA · LIVE</span><span>8 conexiuni · 3 active</span></div>
        <NetworkViz />
        <div className="co__hero-net-legend">
          <span><i style={{ background: 'var(--accent)' }}></i> Tu</span>
          <span><i style={{ background: 'var(--ink)' }}></i> Parteneri</span>
          <span>— Colaborări active</span>
        </div>
      </div>
    </section>
  );
}

function Stats() {
  return (
    <div className="co__stats">
      <div className="co__stat"><div className="co__stat-k">Parteneri verificați</div><div className="co__stat-v">2,140</div><div className="co__stat-sub">în 28 țări</div></div>
      <div className="co__stat"><div className="co__stat-k">Consorții active</div><div className="co__stat-v">186</div><div className="co__stat-sub">caută completare</div></div>
      <div className="co__stat"><div className="co__stat-k">Match-uri săpt.</div><div className="co__stat-v">+64</div><div className="co__stat-sub">ultima săptămână</div></div>
      <div className="co__stat"><div className="co__stat-k">Consorții closed</div><div className="co__stat-v">312</div><div className="co__stat-sub">prin platformă, 2025</div></div>
      <div className="co__stat"><div className="co__stat-k">Volum finanțat</div><div className="co__stat-v">€840M</div><div className="co__stat-sub">total EU grants</div></div>
    </div>
  );
}

function HowItWorks() {
  const steps = [
    { n: '01', i: '◉', t: 'Profil detaliat & expertise', d: 'Completezi profilul cu roluri ce poți acoperi, experiență în consorții, disponibilitate pentru grant-uri. AI indexează capabilitățile.' },
    { n: '02', i: '◎', t: 'Găsești oportunități relevante', d: 'Browse oppotunități publice + match-uri AI pe grant + profilul tău. Ordonate după fit, urgență, buget.' },
    { n: '03', i: '◈', t: 'Inițiezi colaborare privat', d: 'Invitație cu NDA opțional. Discuții în thread privat. Document shared space pentru scope, budget, roluri.' },
    { n: '04', i: '◆', t: 'Semnare + aplicare comună', d: 'Grant Agreement template, repartiție buget. Submit direct din platformă pe portalurile EU/naționale.' },
  ];
  return (
    <section className="co__how">
      <div style={{ maxWidth: 780 }}>
        <div className="co__hero-label">CUM FUNCȚIONEAZĂ</div>
        <h2 style={{ fontSize: 'clamp(28px, 3vw, 40px)', lineHeight: 1.1 }}>De la profil la consorțiu semnat.</h2>
        <p style={{ color: 'var(--ink-2)', fontSize: 15, marginTop: 12, maxWidth: 640 }}>Construim punctul unic de contact între partenerii din CEE și granturile care cer consorții. AI-ul face matching-ul; tu decizi colaborările.</p>
      </div>
      <div className="co__how-grid">
        {steps.map(s => (
          <div className="how-step" key={s.n}>
            <div className="how-step__i">{s.i}</div>
            <div className="how-step__n">PAS {s.n}</div>
            <div className="how-step__t">{s.t}</div>
            <div className="how-step__d">{s.d}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function OppCard({ o }) {
  return (
    <div className="opp">
      <div className="opp__head">
        <div>
          <div className="opp__t">{o.t}</div>
          <div className="opp__grant">
            <span>{o.grantShort} · <em>{o.grant}</em></span>
          </div>
        </div>
        <div className="opp__match">
          <div className="opp__match-v">{o.match}%</div>
          <div className="opp__match-k">match</div>
        </div>
      </div>
      <div className="opp__by">
        <div className="opp__by-logo">{o.leadLogo}</div>
        <div className="opp__by-t">
          <strong>{o.lead}</strong>
          <span>{o.leadMeta}</span>
        </div>
      </div>
      <p className="opp__desc">{o.desc}</p>
      <div className="opp__needs">
        <div className="opp__needs-h">CAUTĂ · {o.targetMembers - o.members} poziții deschise</div>
        <div className="opp__needs-tags">
          {o.needs.map((n, i) => <span key={i} className={`opp__need ${n.kind}`}>{n.kind === 'fit' ? '✓ ' : n.kind === 'hot' ? '! ' : ''}{n.t}</span>)}
        </div>
      </div>
      <div className="opp__foot">
        <div className="opp__foot-meta">
          <span>Buget: <strong>{o.amount}</strong></span>
          <span>Deadline: <strong>{o.deadline}</strong></span>
          <span>Țări: <strong>{o.countries.join(', ')}</strong></span>
        </div>
        <button className="btn btn--accent btn--sm">Aplică în consorțiu →</button>
      </div>
    </div>
  );
}

function PartnerCard({ p }) {
  return (
    <div className="prt">
      <div className="prt__head">
        <div className={`prt__logo ${p.busy ? '' : 'alt'}`}>{p.i}</div>
        <div>
          <div className="prt__t">{p.n}</div>
          <div className="prt__m">{p.meta}</div>
        </div>
      </div>
      <div className="prt__tags">
        {p.tags.map(t => <span key={t} className="prt__tag">{t}</span>)}
      </div>
      <p className="prt__bio">{p.bio}</p>
      <div className="prt__stats">
        {p.stats.map((s, i) => (
          <div key={i}>
            <div className="prt__stat-v">{s[0]}</div>
            <div className="prt__stat-k">{s[1]}</div>
          </div>
        ))}
      </div>
      <div className="prt__foot">
        <span className={`prt__avail ${p.busy ? 'busy' : ''}`}>● {p.avail}</span>
        <button className="btn btn--ghost btn--sm">Contactează →</button>
      </div>
    </div>
  );
}

function MyConsortium({ mc }) {
  return (
    <div className="mc">
      <div>
        <div className="mc__head">
          <div>
            <div className="mc__t">{mc.t}</div>
            <div className="mc__grant">{mc.grantShort} · {mc.grant.match(/\w+-\d{4}-\w+-\d+/)?.[0] || mc.grant} · Buget total {mc.budget}</div>
          </div>
          <span className={`mc__status ${mc.statusKind}`}>{mc.status}</span>
        </div>
        <div className="mc__members-h">MEMBRII ({mc.members.length}/{mc.members.length + mc.slotsOpen})</div>
        <div className="mc__members">
          {mc.members.map((m, i) => (
            <div key={i} className="mc__member">
              <div className={`mc__member-logo ${m.lead ? 'lead' : ''}`}>{m.i}</div>
              <div className="mc__member-t">
                <strong>{m.flag} {m.n}{m.self ? ' (tu)' : ''}</strong>
                <span>{m.role}</span>
              </div>
            </div>
          ))}
          {Array.from({ length: mc.slotsOpen }).map((_, i) => (
            <div key={i} className="mc__member slot">+ Invită partener</div>
          ))}
        </div>
      </div>
      <div className="mc__side">
        <div className="mc__progress">
          <div className="mc__progress-h">Stare {mc.progressKind}</div>
          <div className="mc__progress-v">{mc.progress}%</div>
          <div className="mc__progress-track"><div className="mc__progress-fill" style={{ width: mc.progress + '%' }}></div></div>
        </div>
        <div className="mc__meta">
          Rol: <strong>{mc.role}</strong><br />
          Deadline: <strong>{mc.deadline}</strong><br />
          Buget: <strong>{mc.budget}</strong>
        </div>
        <div className="mc__actions">
          <button className="btn btn--accent btn--sm">Deschide workspace →</button>
          <button className="btn btn--ghost btn--sm">+ Invită partener</button>
          <button className="btn btn--ghost btn--sm">Export docs</button>
        </div>
      </div>
    </div>
  );
}

function Invite({ inv }) {
  return (
    <div className={`inv ${inv.unread ? 'unread' : ''}`}>
      <div className="inv__icon">{inv.from}</div>
      <div>
        <div className="inv__t">{inv.t}</div>
        <div className="inv__d">{inv.d}</div>
        <div className="inv__meta">De la <strong>{inv.fromName}</strong> · {inv.date}</div>
      </div>
      <div className="inv__actions">
        {inv.actions.includes('accept') && <button className="btn btn--accent btn--sm">Accept</button>}
        {inv.actions.includes('discuss') && <button className="btn btn--ghost btn--sm">Discută</button>}
        {inv.actions.includes('view') && <button className="btn btn--accent btn--sm">Vezi</button>}
        {inv.actions.includes('decline') && <button className="btn btn--ghost btn--sm">Refuză</button>}
        {inv.actions.includes('dismiss') && <button className="btn btn--ghost btn--sm">Respinge</button>}
        {inv.actions.includes('archive') && <button className="btn btn--ghost btn--sm">Arhivă</button>}
      </div>
    </div>
  );
}

function ConsortiumApp() {
  const [tab, setTab] = useState('browse');
  const [country, setCountry] = useState('all');
  const [type, setType] = useState('all');

  const countries = [
    { id: 'all', n: 'Toate', flag: '🌐' }, { id: 'MD', n: 'Moldova', flag: '🇲🇩' }, { id: 'RO', n: 'România', flag: '🇷🇴' },
    { id: 'DE', n: 'Germania', flag: '🇩🇪' }, { id: 'PL', n: 'Polonia', flag: '🇵🇱' }, { id: 'BG', n: 'Bulgaria', flag: '🇧🇬' },
    { id: 'HU', n: 'Ungaria', flag: '🇭🇺' }, { id: 'FR', n: 'Franța', flag: '🇫🇷' }, { id: 'NL', n: 'Olanda', flag: '🇳🇱' },
  ];
  const types = [
    { id: 'all', n: 'Toate tipurile' }, { id: 'sme', n: 'SME' }, { id: 'research', n: 'Research' },
    { id: 'ngo', n: 'NGO' }, { id: 'public', n: 'Public' }, { id: 'cluster', n: 'Cluster' },
  ];

  return (
    <div className="co">
      <div className="co__topbar">
        <div className="co__crumbs"><a href="/dashboard.html" style={{ color: 'var(--ink-2)' }}>Dashboard</a> <span>/</span> <em>Consorții</em></div>
        <div className="co__topbar-r">
          <button className="btn btn--ghost btn--sm">Editează profilul meu de partener</button>
          <button className="btn btn--accent btn--sm">+ Creează consorțiu</button>
        </div>
      </div>

      <Hero />
      <Stats />
      <HowItWorks />

      <div className="co__tabs">
        <button className={`co__tab ${tab === 'browse' ? 'is-active' : ''}`} onClick={() => setTab('browse')}>
          Oportunități deschise <span className="co__tab-count">{OPPS.length}</span>
        </button>
        <button className={`co__tab ${tab === 'partners' ? 'is-active' : ''}`} onClick={() => setTab('partners')}>
          Directorul de parteneri <span className="co__tab-count">2,140</span>
        </button>
        <button className={`co__tab ${tab === 'my' ? 'is-active' : ''}`} onClick={() => setTab('my')}>
          Consorțiile mele <span className="co__tab-count">{MY_CONSORTIA.length}</span>
        </button>
        <button className={`co__tab ${tab === 'inbox' ? 'is-active' : ''}`} onClick={() => setTab('inbox')}>
          Invitații <span className="co__tab-count">{INVITES.filter(i => i.unread).length}</span>
        </button>
      </div>

      <div className="co__body">
        {tab === 'browse' && (
          <>
            <div className="co__filters">
              <span style={{ fontFamily: 'JetBrains Mono', fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '.1em', color: 'var(--muted)', marginRight: 6 }}>Țară lead</span>
              {countries.slice(0, 6).map(c => (
                <button key={c.id} className={`chip alt ${country === c.id ? 'is-active' : ''}`} onClick={() => setCountry(c.id)}>
                  <span>{c.flag}</span>{c.n}
                </button>
              ))}
              <div style={{ width: 1, background: 'var(--border-soft)', alignSelf: 'stretch', margin: '0 8px' }}></div>
              <span style={{ fontFamily: 'JetBrains Mono', fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '.1em', color: 'var(--muted)', marginRight: 6 }}>Grant</span>
              <button className="chip is-active">Toate</button>
              <button className="chip">Horizon Europe</button>
              <button className="chip">Interreg</button>
              <button className="chip">Digital EU</button>
              <button className="chip">Climate-KIC</button>
              <button className="chip">Eurostars</button>
              <div style={{ marginLeft: 'auto', fontFamily: 'JetBrains Mono', fontSize: 11, color: 'var(--muted)' }}>
                Sort: <select style={{ background: 'transparent', border: '1px solid var(--border-soft)', padding: '4px 6px', font: 'inherit', fontSize: 11, color: 'var(--ink)' }}><option>Match scor</option><option>Deadline</option><option>Buget</option></select>
              </div>
            </div>
            <div className="opps">
              {OPPS.map(o => <OppCard key={o.id} o={o} />)}
            </div>
          </>
        )}

        {tab === 'partners' && (
          <>
            <div className="co__filters">
              <span style={{ fontFamily: 'JetBrains Mono', fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '.1em', color: 'var(--muted)', marginRight: 6 }}>Țară</span>
              {countries.map(c => (
                <button key={c.id} className={`chip alt ${country === c.id ? 'is-active' : ''}`} onClick={() => setCountry(c.id)}>
                  <span>{c.flag}</span>{c.n}
                </button>
              ))}
              <div style={{ width: 1, background: 'var(--border-soft)', alignSelf: 'stretch', margin: '0 8px' }}></div>
              <span style={{ fontFamily: 'JetBrains Mono', fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '.1em', color: 'var(--muted)', marginRight: 6 }}>Tip</span>
              {types.map(t => <button key={t.id} className={`chip ${type === t.id ? 'is-active' : ''}`} onClick={() => setType(t.id)}>{t.n}</button>)}
            </div>
            <div className="prt-dir">
              {PARTNERS.map(p => <PartnerCard key={p.i} p={p} />)}
            </div>
          </>
        )}

        {tab === 'my' && (
          <div className="my-cons">
            {MY_CONSORTIA.map(mc => <MyConsortium key={mc.id} mc={mc} />)}
          </div>
        )}

        {tab === 'inbox' && (
          <div className="inbox">
            {INVITES.map(i => <Invite key={i.id} inv={i} />)}
          </div>
        )}
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('co-root')).render(<ConsortiumApp />);
