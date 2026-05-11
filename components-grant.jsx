// Grant Detail Page — supports 2 grants (EIC, Startup Moldova) + 2 modes (public, app)
// When server injects window.__GRANT_DATA__ (rendered via /ro/granturi/:slug or
// /en/grants/:slug), a 'live' overlay key is added below that overrides the
// surface-level fields with real DB values while keeping the EIC template
// for fields not yet carried by the schema (objectives, timeline, etc).
const { useState, useEffect, useRef } = React;

// ============== DATA ==============
const GRANTS = {
  eic: {
    id: 'eic',
    name: 'EIC Accelerator',
    cohort: 'Cut-off Mai 2026',
    org: 'European Innovation Council',
    orgShort: 'EIC',
    flag: '🇪🇺',
    region: 'EU',
    type: 'Grant + Equity',
    amountMin: '€500K',
    amountMax: '€2.5M',
    equityMax: '€15M',
    duration: '24–36 luni',
    cofinancing: '0%',
    deadline: '15 Mai 2026',
    daysLeft: 24,
    status: 'OPEN',
    statusKind: 'live',
    nextStep: 'Short Pitch',
    matchScore: 82,
    matchBars: [
      { k: 'Sector fit', v: 92, kind: 'ok' },
      { k: 'Stage / TRL', v: 78, kind: 'ok' },
      { k: 'Geographic', v: 88, kind: 'ok' },
      { k: 'Readiness', v: 65, kind: 'warn' },
      { k: 'Confidence', v: 72, kind: 'ok' },
    ],
    pitch: 'Finanțare combinată grant + equity pentru startup-uri deep-tech cu impact disruptiv la nivel european. Cel mai mare program de inovație din UE.',
    quickStats: [
      { k: 'Sumă grant', v: '€2.5M', sub: 'max non-dilutiv' },
      { k: 'Equity', v: '€15M', sub: 'opțional, blended' },
      { k: 'Cofinanțare', v: '0%', sub: 'nu cere match' },
      { k: 'Durată', v: '24–36', sub: 'luni proiect' },
      { k: 'Deadline', v: '24 zile', sub: '15 Mai 2026', hot: true },
    ],
    description: [
      'EIC Accelerator finanțează startup-uri și IMM-uri cu tehnologii inovatoare (TRL 5–8) și ambiție de creștere globală. Programul oferă o combinație unică de grant nerambursabil până la €2.5M pentru activități de inovație și investiție de equity până la €15M prin EIC Fund pentru scalare.',
      'Țintele primare sunt deep-tech, climate, biotech, semiconductori, AI critic și securitate. UE caută "campioni europeni" capabili să concureze global cu firme din SUA și Asia.',
    ],
    objectives: [
      { n: '01', t: 'Validare comercială', d: 'Trecerea de la prototip la primul produs scalabil pe piața europeană sau globală.' },
      { n: '02', t: 'Scaling capacity', d: 'Construirea capacității de operare și producție pentru cerere internațională.' },
      { n: '03', t: 'IP & defensibility', d: 'Protejarea proprietății intelectuale și consolidarea avantajului competitiv.' },
      { n: '04', t: 'Strategic autonomy EU', d: 'Reducerea dependenței UE de tehnologii non-europene în domenii critice.' },
    ],
    eligibility: [
      { t: 'Startup sau IMM înregistrat în UE / Asociat', d: 'Țări asociate: UK, Israel, Norvegia, Moldova (din 2024)', status: 'ok', note: '🇲🇩 Moldova OK' },
      { t: 'Tehnologie deep-tech la TRL 5–8', d: 'Validată în mediu relevant, demonstrare în mediu operațional', status: 'ok', note: 'TRL 6 ✓' },
      { t: 'Echipă fondatoare cu cel puțin 2 persoane', d: 'Diversitate de roluri: tehnic + business', status: 'ok', note: '4 fondatori ✓' },
      { t: 'Potențial de impact european / global', d: 'Demonstrabil prin TAM, scalabilitate, GTM strategy', status: 'warn', note: 'Necesită refinare' },
      { t: 'Cifră afaceri ≤ €50M, sub 250 angajați', d: 'Definiția UE de IMM', status: 'ok', note: 'Sub limită ✓' },
      { t: 'Nu este în dificultate financiară', d: 'Verificare automată din ultimul bilanț', status: 'miss', note: 'Bilanț lipsă' },
    ],
    timeline: [
      { t: 'Submit Short Application', d: '~5 pagini + video pitch 3 min', date: 'Acum', sub: 'Permanent open', state: 'now' },
      { t: 'Evaluare Step 1', d: '4 evaluatori independenți, scor pe 5 criterii', date: '+6 săpt', sub: 'Rata trecere ~30%' },
      { t: 'Full Application invite', d: 'Doar dacă treci de Step 1', date: '15 Mai 2026', sub: 'Cut-off principal' },
      { t: 'Submit Full Proposal', d: '~30 pagini + business plan + financial model', date: '+8 săpt', sub: 'După invitație' },
      { t: 'Evaluare Step 2', d: '3 experți + scor', date: '+10 săpt', sub: 'Trecere ~40%' },
      { t: 'Pitch interview Brussels', d: 'Jury panel 30 min', date: 'Iul 2026', sub: 'Față în față' },
      { t: 'Decizie finală', d: 'Grant Agreement Preparation', date: 'Sep 2026', sub: 'Plată în 4 tranșe' },
    ],
    docs: [
      { t: 'Pitch deck v3+', s: '20 slides, EN', status: 'have' },
      { t: 'Video pitch 3 min', s: 'subtitrat EN', status: 'have' },
      { t: 'Financial model 3Y', s: 'Excel, P&L + cash flow', status: 'gen' },
      { t: 'Business plan', s: '15–25 pagini', status: 'miss' },
      { t: 'CV-uri echipă cheie', s: 'PDF, max 2 pag/persoană', status: 'have' },
      { t: 'Letters of support', s: 'min 2 clienți / parteneri', status: 'miss' },
      { t: 'IP / patent strategy', s: 'PDF, 2–4 pag', status: 'gen' },
      { t: 'Audit financiar (dacă > €50K rev)', s: 'pe ultimii 2 ani', status: 'miss' },
    ],
    scoring: [
      { w: '40%', t: 'Excellence', d: 'Inovativitate, ambiție tehnologică, diferențiere față de SOTA, calitate științifică.' },
      { w: '30%', t: 'Impact', d: 'Potențial economic, social, de mediu. Strategie GTM, scalabilitate UE/global.' },
      { w: '30%', t: 'Implementation', d: 'Calitatea echipei, plan de lucru, eficiența costurilor, capacitate de execuție.' },
    ],
    evaluators: [
      { i: 'JM', n: 'Independent Experts', r: '4 evaluatori EU pool' },
      { i: 'EI', n: 'EIC Programme Manager', r: 'Asignat după Step 1' },
      { i: 'JU', n: 'Jury Panel (Step 2)', r: '7 industry leaders' },
      { i: 'AI', n: 'Validare automată', r: 'Compliance check' },
    ],
    funnel: [
      { t: 'Aplicații Step 1', count: '~4,200', pct: 100 },
      { t: 'Trecut Step 1', count: '~1,260', pct: 30 },
      { t: 'Trecut Step 2', count: '~500', pct: 12, kind: 'warn' },
      { t: 'Pitch interview', count: '~300', pct: 7, kind: 'warn' },
      { t: 'Finanțați', count: '~75', pct: 1.8, kind: 'ok' },
    ],
    stats: [
      { k: 'Aplicații / cohort', v: '4,200', sub: 'medie 2024' },
      { k: 'Rată succes', v: '1.8%', sub: 'din total submit' },
      { k: 'Sumă medie aprobată', v: '€2.4M', sub: 'grant only' },
      { k: 'Timp evaluare', v: '6–9 luni', sub: 'submit → contract' },
    ],
    cases: [
      { logo: 'BV', n: 'BiOVErse', m: '🇩🇪 DE · Biotech · 2023', q: 'Aplicarea EIC ne-a forțat să clarificăm GTM-ul european. Grantul a venit, dar valoarea reală a fost framework-ul.', s: [['Sumă', '€2.5M'], ['Equity', '€7M'], ['Followup', 'Serie A'] ] },
      { logo: 'NX', n: 'NexaQuant', m: '🇫🇷 FR · Quantum · 2024', q: 'Step 2 e brutal. Pregătirea pitch-ului din Bruxelles a luat 3 săptămâni de echipa fondatoare.', s: [['Sumă', '€2.1M'], ['Equity', '€10M'], ['Followup', 'Acquired'] ] },
    ],
    faq: [
      { q: 'Pot aplica dacă sunt din Moldova?', a: 'Da. Moldova este țară asociată Horizon Europe din 2024 și beneficiază de aceleași condiții ca statele membre UE pentru EIC Accelerator.' },
      { q: 'Trebuie să accept și componenta de equity?', a: 'Nu. Poți aplica doar pentru grant (până la €2.5M). Componenta de equity prin EIC Fund e opțională și se discută separat după aprobarea grantului.' },
      { q: 'Cât costă pregătirea unei aplicații?', a: 'Estimare: 200–400 ore de lucru intern + €5–15K consultanță externă (opțional). Pe eligibil.org, AI-ul nostru reduce timpul cu ~60% prin generarea draft-urilor.' },
      { q: 'Ce se întâmplă dacă pic Step 1?', a: 'Poți reaplica la cut-off-ul următor, dar trebuie să aduci modificări substanțiale (recomandat: 6+ luni între aplicări).' },
      { q: 'Cine deține IP-ul după finanțare?', a: 'Compania deține integral IP-ul. UE cere doar drepturi de utilizare pentru scopuri non-comerciale și diseminare.' },
    ],
    teamReq: {
      have: ['CEO / Fondator', 'CTO', 'Head of R&D', 'Business Dev'],
      miss: ['CFO sau Finance Lead', 'Regulatory expert (dacă health/medical)'],
    },
    insights: [
      { delta: '+12', t: 'Adaugă Letters of Support', d: 'Min 2 clienți / parteneri europeni cresc scorul de Impact cu ~12 puncte. Sugestie: Bosch, Siemens, EIT.' },
      { delta: '+8', t: 'Întărește IP strategy', d: 'Lipsă patent application. Generăm un draft de strategy în 5 minute pe baza whitepaper-ului tău.' },
      { delta: '+6', t: 'Refinează GTM european', d: 'Secțiunea Impact e thin. Aplican­ții reușiți au planuri detaliate pe 3 piețe-cheie cu pricing și sales motion.' },
      { delta: '+4', t: 'Demo video updated', d: 'Video-ul tău e din 2024. Refresh cu metrici actuale (MRR, customer logos) pentru +4 puncte Confidence.' },
    ],
    similar: [
      { n: 'EIC Pathfinder', meta: '🇪🇺 EU · €4M · Open', match: 76 },
      { n: 'Horizon Europe Cluster 4', meta: '🇪🇺 EU · €5–15M · Iun', match: 71 },
      { n: 'EIT Digital Challenge', meta: '🇪🇺 EU · €100K · Mar', match: 68 },
    ],
  },
  md: {
    id: 'md',
    name: 'Startup Moldova 2026',
    cohort: 'Ediția a III-a',
    org: 'AGEPI · MIEPO · Min. Economiei',
    orgShort: 'AGEPI',
    flag: '🇲🇩',
    region: 'MD',
    type: 'Grant nerambursabil',
    amountMin: '50K',
    amountMax: '200K',
    currency: 'MDL',
    cofinancing: '20%',
    duration: '12 luni',
    deadline: '1 Iulie 2026',
    daysLeft: 71,
    status: 'OPEN',
    statusKind: 'live',
    nextStep: 'Single application',
    matchScore: 91,
    matchBars: [
      { k: 'Sector fit', v: 88, kind: 'ok' },
      { k: 'Stage / TRL', v: 95, kind: 'ok' },
      { k: 'Geographic', v: 100, kind: 'ok' },
      { k: 'Readiness', v: 89, kind: 'ok' },
      { k: 'Confidence', v: 84, kind: 'ok' },
    ],
    pitch: 'Cel mai accesibil program de finanțare pentru startup-uri tech din Moldova. 200K MDL nerambursabil + mentoring + acces la accelerator național.',
    quickStats: [
      { k: 'Sumă maximă', v: '200K', sub: 'MDL nerambursabil' },
      { k: 'Cofinanțare', v: '20%', sub: 'din partea startup' },
      { k: 'Durată', v: '12', sub: 'luni proiect' },
      { k: 'Format', v: 'Single', sub: 'o aplicație' },
      { k: 'Deadline', v: '71 zile', sub: '1 Iul 2026', hot: false },
    ],
    description: [
      'Startup Moldova este programul-flagship al guvernului Republicii Moldova pentru sprijinirea ecosistemului antreprenorial tech. Editat anual din 2024, finanțează startup-uri rezidenți Moldova, în stadiu early sau pre-seed, cu produse cu potențial de export.',
      'Procesul e simplificat față de programele UE: o singură aplicație, decizie în 8 săptămâni, plata în 2 tranșe. Beneficiarii primesc bonus access la programul național de accelerare.',
    ],
    objectives: [
      { n: '01', t: 'Stimulare ecosistem local', d: 'Creșterea numărului de startup-uri tech viabile din Moldova de la <100 la >300 până în 2028.' },
      { n: '02', t: 'Reducere emigrare talent', d: 'Crearea de oportunități pentru fondatori și ingineri să rămână în țară.' },
      { n: '03', t: 'Export & valută', d: 'Susținerea companiilor cu potențial de venit din afaceri externe (B2B SaaS, IT services).' },
      { n: '04', t: 'Diaspora reconnection', d: 'Atragerea fondatorilor din diaspora pentru a relocaliza HQ-uri tech în Moldova.' },
    ],
    eligibility: [
      { t: 'Companie înregistrată în Republica Moldova', d: 'SRL sau SA, sediu principal pe teritoriu', status: 'ok', note: '🇲🇩 OK' },
      { t: 'Activitate economică < 36 luni', d: 'De la data înregistrării ONRC', status: 'ok', note: '14 luni ✓' },
      { t: 'Echipă min 2 persoane angajate', d: 'Inclusiv fondatorii dacă au contract', status: 'ok', note: '4 angajați ✓' },
      { t: 'Produs / serviciu tech sau cu componentă tech', d: 'Software, hardware, biotech, agritech', status: 'ok', note: 'AI/SaaS ✓' },
      { t: 'Plan financiar cu cofinanțare 20%', d: 'Demonstrabil: cont bancar, equity, venit', status: 'ok', note: 'Resurse ✓' },
      { t: 'Cifră afaceri < 5M MDL ultimul an', d: 'Verificare ANAF Moldova', status: 'ok', note: '1.2M MDL ✓' },
    ],
    timeline: [
      { t: 'Deschis aplicări', d: 'Single window, fără pre-screening', date: 'Acum', sub: 'Open until Jul 1', state: 'now' },
      { t: 'Submit aplicație', d: 'Online, ~10 secțiuni, video opțional', date: '1 Iul 2026', sub: 'Deadline final' },
      { t: 'Evaluare administrativă', d: 'Verificare eligibilitate documente', date: '+2 săpt', sub: 'Auto + manual' },
      { t: 'Evaluare tehnică', d: '3 evaluatori naționali, scor 0–100', date: '+4 săpt', sub: 'Trecere min 70 pct' },
      { t: 'Pitch panel local', d: '15 min în fața juriului din Chișinău', date: 'Aug 2026', sub: 'Top 30 finaliști' },
      { t: 'Decizie & contract', d: 'Plată tranșa 1 (60%) la semnare', date: 'Sep 2026', sub: 'Tranșa 2 la 6 luni' },
    ],
    docs: [
      { t: 'Cerere de finanțare (formular)', s: 'PDF semnat', status: 'gen' },
      { t: 'Pitch deck', s: 'min 10 slides, RO sau EN', status: 'have' },
      { t: 'Plan de afaceri 12 luni', s: '8–15 pagini', status: 'have' },
      { t: 'Buget detaliat (Excel)', s: 'cu cofinanțarea 20%', status: 'gen' },
      { t: 'Certificat ONRC', s: 'eliberat în ultimile 30 zile', status: 'miss' },
      { t: 'Certificat ANAF (fără datorii)', s: 'eliberat în ultimile 30 zile', status: 'miss' },
      { t: 'CV fondatori', s: 'PDF, max 1 pag/persoană', status: 'have' },
      { t: 'Declarație pe propria răspundere', s: 'template AGEPI', status: 'gen' },
    ],
    scoring: [
      { w: '35%', t: 'Inovație tehnologică', d: 'Diferențierea produsului, componenta tech, IP potențial.' },
      { w: '30%', t: 'Viabilitate piață', d: 'Validare client, model business, plan de venituri 12 luni.' },
      { w: '25%', t: 'Echipă & execuție', d: 'Background, complementaritate, capacitate de delivery.' },
      { w: '10%', t: 'Impact local', d: 'Locuri de muncă create, relocare diaspora, export potential.' },
    ],
    evaluators: [
      { i: 'AG', n: 'AGEPI', r: 'Validare juridică' },
      { i: 'TC', n: 'Tekwill / TI Cluster', r: 'Evaluare tehnică (2)' },
      { i: 'JE', n: 'Juriu antreprenori', r: '5 fondatori cu exit' },
      { i: 'IF', n: 'IFC / EBRD observator', r: 'Process witness' },
    ],
    funnel: [
      { t: 'Aplicații totale', count: '~280', pct: 100 },
      { t: 'Trecut administrativ', count: '~250', pct: 89 },
      { t: 'Trecut evaluare tehnică', count: '~85', pct: 30, kind: 'warn' },
      { t: 'Pitch panel', count: '~30', pct: 11, kind: 'warn' },
      { t: 'Finanțați', count: '~25', pct: 9, kind: 'ok' },
    ],
    stats: [
      { k: 'Aplicații / cohort', v: '~280', sub: 'medie 2025' },
      { k: 'Rată succes', v: '~9%', sub: 'din submit' },
      { k: 'Sumă medie', v: '180K', sub: 'MDL aprobat' },
      { k: 'Timp evaluare', v: '8 săpt', sub: 'submit → contract' },
    ],
    cases: [
      { logo: 'CV', n: 'Cuvinte', m: '🇲🇩 MD · EdTech · 2024', q: 'Banii ne-au dat 12 luni runway. Mai important: rețeaua de mentori și access la fonduri private RO/EU.', s: [['Sumă', '195K MDL'], ['Followup', '€80K seed'], ['Status', 'Active'] ] },
      { logo: 'AG', n: 'AgriBox', m: '🇲🇩 MD · AgriTech · 2025', q: 'Aplicarea a fost surprinzător de simplă. 3 săptămâni de pregătire, evaluare clară pe criterii publice.', s: [['Sumă', '200K MDL'], ['Followup', 'Pilot Carrefour'], ['Status', 'Scaling'] ] },
    ],
    faq: [
      { q: 'Pot aplica dacă sunt SRL fără angajați?', a: 'Nu. Trebuie minimum 2 persoane angajate cu contract individual de muncă la momentul aplicării. Fondatorii contează dacă au CIM încheiat.' },
      { q: 'Cum demonstrez cofinanțarea 20%?', a: 'Extras de cont bancar, contract de equity, sau venit din ultimele 6 luni. Banii nu trebuie cheltuiți înainte de aprobare.' },
      { q: 'Pot fi reziden­t fiscal RO și aplica pentru Startup Moldova?', a: 'Compania trebuie să fie înregistrată în RM. Fondatorii pot fi rezidenți oriunde. Multe startup-uri din diaspora aplică din această poziție.' },
      { q: 'Ce se întâmplă dacă proiectul nu se realizează?', a: 'Tranșa 1 (60%) se restituie pro-rata cu cheltuielile justificate. Există clauze de force majeure pentru pivot major.' },
      { q: 'Pot aplica de mai multe ori?', a: 'O dată per ediție. Companiile finanțate anterior nu pot reaplica timp de 24 de luni de la prima finanțare.' },
    ],
    teamReq: {
      have: ['CEO / Fondator', 'CTO', 'Head of R&D', 'Business Dev'],
      miss: ['Persoană cu rol Operations / Compliance'],
    },
    insights: [
      { delta: '+9', t: 'Obține Certificat ONRC + ANAF', d: 'Lipsă din checklist. Generează cerere automată — răspuns 24h de la AGEPI.' },
      { delta: '+7', t: 'Detaliază planul de export', d: 'Componenta de impact local punctează puternic prin venit din export. Adaugă pipeline RO/UA.' },
      { delta: '+5', t: 'Adaugă Letter of Intent client', d: 'Min 1 client semnat sau LOI crește scorul de viabilitate piață.' },
      { delta: '+3', t: 'Refinează bugetul cofinanțare', d: 'Detaliile sursei de cofinanțare 20% (extras cont) reduc riscul de respingere administrativă.' },
    ],
    similar: [
      { n: 'Tekwill Acceleration', meta: '🇲🇩 MD · 100K · Rolling', match: 86 },
      { n: 'Horizon EU Widening', meta: '🇪🇺 EU · €100K · Sep', match: 79 },
      { n: 'EBRD Star Venture', meta: '🌐 EBRD · $50K · Open', match: 74 },
    ],
  },
};

// Server-injected DB grant overlay. The Pas 2 SEO routes inject window.__GRANT_DATA__
// before this script loads, so by the time we're parsing GRANTS, that global is
// either present (real grant from /ro/granturi/:slug or /en/grants/:slug) or
// undefined (legacy /grant.html, dev mode, no server rendering). When present,
// we synthesise a 'live' entry that overrides the surface fields with DB values,
// falling back to the EIC template for fields the schema doesn't carry yet
// (objectives, eligibility breakdown, timeline, matchScore — those land in
// later sprint chunks).
if (typeof window !== 'undefined' && window.__GRANT_DATA__) {
  const _db   = window.__GRANT_DATA__;
  const _lang = window.__LANG__ || 'ro';
  const _isEn = _lang === 'en';
  const _name = _isEn ? (_db.nume_program_en || _db.nume_program) : _db.nume_program;
  const _org  = _db.funder_name || _db.organizatie || GRANTS.eic.org;
  const _initials = _org ? _org.split(/\s+/).map(w => w[0]).filter(Boolean).join('').slice(0, 4).toUpperCase() : GRANTS.eic.orgShort;
  const _pitch = (_isEn ? (_db.short_summary_en || _db.descriere_en) : (_db.short_summary_ro || _db.descriere)) || GRANTS.eic.pitch;
  const _fmt = (n) => (n == null ? null : (n >= 1_000_000 ? `€${(n/1_000_000).toFixed(1).replace('.0','')}M` : `€${Math.round(n/1000)}K`));

  GRANTS.live = {
    ...GRANTS.eic,
    id:        'live',
    name:      _name || GRANTS.eic.name,
    org:       _org,
    orgShort:  _initials || GRANTS.eic.orgShort,
    region:    _db.funder_country || _db.tara || GRANTS.eic.region,
    type:      _db.tip || GRANTS.eic.type,
    deadline:  _db.deadline || GRANTS.eic.deadline,
    pitch:     _pitch,
    amountMin: _fmt(_db.suma_min) || GRANTS.eic.amountMin,
    amountMax: _fmt(_db.suma_max) || GRANTS.eic.amountMax,
  };
}

// ============== HELPERS ==============
function Ring({ value, size = 80, stroke = 7, color = 'var(--accent)' }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const dash = (value / 100) * c;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--bg-2)" strokeWidth={stroke} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={`${dash} ${c}`} strokeLinecap="square"
        transform={`rotate(-90 ${size/2} ${size/2})`} />
    </svg>
  );
}

const SECTIONS = [
  { id: 'overview', n: '01', t: 'Despre program' },
  { id: 'objectives', n: '02', t: 'Obiective' },
  { id: 'eligibility', n: '03', t: 'Eligibilitate' },
  { id: 'timeline', n: '04', t: 'Timeline aplicare' },
  { id: 'docs', n: '05', t: 'Documente necesare' },
  { id: 'team', n: '06', t: 'Echipă & parteneri' },
  { id: 'process', n: '07', t: 'Proces evaluare' },
  { id: 'stats', n: '08', t: 'Statistici succes' },
  { id: 'cases', n: '09', t: 'Câștigători anteriori' },
  { id: 'insights', n: '10', t: 'AI Insights pentru tine' },
  { id: 'faq', n: '11', t: 'Întrebări frecvente' },
  { id: 'similar', n: '12', t: 'Granturi similare' },
];

// ============== COMPONENTS ==============
function ModeStrip({ mode, setMode, grantId, setGrantId }) {
  return (
    <div className="gp__mode">
      <div className="gp__mode-left">
        <span className="gp__mode-dot"></span>
        <span>{mode === 'app' ? 'app.eligibil.org/grants/' + grantId : 'eligibil.org/grants/' + grantId}</span>
      </div>
      <div className="gp__mode-grant">
        <button className={grantId === 'eic' ? 'is-active' : ''} onClick={() => setGrantId('eic')}>🇪🇺 EIC Accelerator</button>
        <button className={grantId === 'md' ? 'is-active' : ''} onClick={() => setGrantId('md')}>🇲🇩 Startup Moldova</button>
      </div>
      <div className="gp__mode-toggle">
        <button className={mode === 'public' ? 'is-active' : ''} onClick={() => setMode('public')}>Public</button>
        <button className={mode === 'app' ? 'is-active' : ''} onClick={() => setMode('app')}>App (Logged)</button>
      </div>
    </div>
  );
}

function AppTopbar({ g }) {
  return (
    <div className="gp__topbar">
      <div className="gp__crumbs">
        <a href="/dashboard.html">Dashboard</a> <span>/</span>
        <a href="/dashboard.html">Granturi</a> <span>/</span>
        <a href="/dashboard.html">{g.region}</a> <span>/</span>
        <em>{g.name}</em>
      </div>
      <div className="gp__topbar-r">
        <button className="btn btn--ghost btn--sm">⌥ Comparare</button>
        <button className="btn btn--ghost btn--sm">⤓ Export PDF</button>
        <button className="btn btn--accent btn--sm">+ Începe aplicarea →</button>
      </div>
    </div>
  );
}

function PublicNav({ g }) {
  return (
    <div className="gp__pubnav">
      <div className="gp__pubnav-brand">eligibil<span>.eu</span></div>
      <div className="gp__pubnav-links">
        <a href="/index.html">Cum funcționează</a>
        <a href="/index.html#granturi">Granturi</a>
        <a href="/index.html">Pricing</a>
        <a href="/index.html">Despre</a>
        <a href="/login.html">Login</a>
      </div>
      <div className="gp__pubnav-r">
        <a href="/register.html" className="btn btn--accent btn--sm">Începe gratuit →</a>
      </div>
    </div>
  );
}

function Hero({ g, mode }) {
  return (
    <div className="gp__hero">
      <div className="gp__hero-meta">
        <span className="gp__hero-flag">{g.flag} {g.region}</span>
        <span className={`gp__hero-status ${g.statusKind === 'warn' ? 'warn' : ''}`}>● {g.status}</span>
        <span>· {g.type} ·</span>
        <span><strong>{g.cohort}</strong></span>
        <span>· ID: <strong>{g.id.toUpperCase()}-2026-{g.id === 'eic' ? '03' : '01'}</strong></span>
      </div>
      <div className="gp__hero-grid">
        <div>
          <h1 className="gp__hero-title">{g.name}</h1>
          <div className="gp__hero-org">
            <span>Organizator: <strong>{g.org}</strong></span>
            <span>Limbă aplicare: <strong>EN{g.id === 'md' ? ' / RO' : ''}</strong></span>
            <span>Format: <strong>{g.nextStep}</strong></span>
          </div>
          <p className="gp__hero-lead">{g.pitch}</p>
        </div>

        {mode === 'app' ? (
          <div className="match-card">
            <div className="match-card__h"><span>SCOR DE MATCH</span><span>actualizat acum</span></div>
            <div className="match-card__ring">
              <Ring value={g.matchScore} size={86} stroke={8} color={g.matchScore >= 80 ? 'var(--live)' : 'var(--accent)'} />
              <div className="match-card__ring-val">
                <strong>{g.matchScore}<small style={{ fontSize: 14, color: 'var(--muted)' }}>/100</small></strong>
                <span>{g.matchScore >= 85 ? 'Foarte potrivit' : g.matchScore >= 70 ? 'Bună compatibilitate' : 'Compatibil parțial'}</span>
              </div>
            </div>
            <div className="match-card__bars">
              {g.matchBars.map(b => (
                <div className="match-card__bar" key={b.k}>
                  <div className="match-card__bar-h">
                    <span>{b.k}</span>
                    <span>{b.v}/100</span>
                  </div>
                  <div className="match-card__bar-track">
                    <div className={`match-card__bar-fill ${b.kind}`} style={{ width: b.v + '%' }}></div>
                  </div>
                </div>
              ))}
            </div>
            <div className="match-card__cta">
              <button className="btn btn--accent">Începe aplicarea →</button>
              <button className="btn btn--ghost btn--sm">+ Salvează în watchlist</button>
              <div className="match-card__cta-meta">profil 73% complet · refresh AI 2h ago</div>
            </div>
          </div>
        ) : (
          <div className="match-card">
            <div className="match-card__h"><span>VEZI SCORUL TĂU</span><span>gratuit · 90s</span></div>
            <div style={{ padding: '20px 0', textAlign: 'center', borderBottom: '1px solid var(--border-soft)' }}>
              <div style={{ fontSize: 42, fontFamily: 'Space Grotesk', fontWeight: 600, color: 'var(--muted)' }}>—</div>
              <div style={{ fontFamily: 'JetBrains Mono', fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>NEAUTENTIFICAT</div>
            </div>
            <p style={{ fontSize: 13, color: 'var(--ink-2)', padding: '14px 0', lineHeight: 1.5 }}>
              Înregistrează-te în 5 min ca să afli scorul tău personal de match cu acest grant și ce să îmbunătățești.
            </p>
            <div className="match-card__cta">
              <button className="btn btn--accent">Calculează scorul meu →</button>
              <button className="btn btn--ghost btn--sm">Vezi exemplu profil</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function QuickStats({ g }) {
  return (
    <div className="qstats">
      {g.quickStats.map(s => (
        <div className="qstats__cell" key={s.k}>
          <div className="qstats__k">{s.k}</div>
          <div className={`qstats__v ${s.hot ? 'hot' : ''}`}>
            {s.v}{s.k === 'Sumă maximă' ? <small>{g.currency}</small> : ''}
          </div>
          <div className="qstats__sub">{s.sub}</div>
        </div>
      ))}
    </div>
  );
}

function Anchors({ active, scrollTo }) {
  return (
    <aside className="anchors">
      <div className="anchors__h">Pe această pagină</div>
      {SECTIONS.map(s => (
        <div key={s.id} className={`anchors__link ${active === s.id ? 'is-active' : ''}`} onClick={() => scrollTo(s.id)}>
          <span className="anchors__link-num">{s.n}</span>
          <span>{s.t}</span>
        </div>
      ))}
    </aside>
  );
}

function ContentSection({ id, num, title, sub, children }) {
  return (
    <section className="content__sec" id={id}>
      <div className="content__sec-h">
        <div className="content__sec-num">{num} ·</div>
        <h2 className="content__sec-t">{title}</h2>
      </div>
      {sub && <div className="content__sec-sub">{sub}</div>}
      {children}
    </section>
  );
}

function FAQ({ items }) {
  const [open, setOpen] = useState(0);
  return (
    <div className="faq">
      {items.map((f, i) => (
        <div key={i} className={`faq__item ${open === i ? 'is-open' : ''}`}>
          <div className="faq__q" onClick={() => setOpen(open === i ? -1 : i)}>
            <span>{f.q}</span>
            <span className="faq__q-icon">{open === i ? '−' : '+'}</span>
          </div>
          <div className="faq__a">{f.a}</div>
        </div>
      ))}
    </div>
  );
}

function Aside({ g, mode }) {
  return (
    <aside className="aside">
      <div className="aside__card">
        <div className="aside__card-h"><span>DEADLINE</span><span>cohort curent</span></div>
        <div className="aside__deadline-big">{g.daysLeft}</div>
        <div className="aside__deadline-sub">zile rămase</div>
        <div className="aside__deadline-date">{g.deadline} · 23:59 CET</div>
      </div>

      {mode === 'app' && (
        <div className="aside__card">
          <div className="aside__card-h"><span>ACȚIUNI</span></div>
          <div className="aside__actions">
            <button className="aside__action primary"><span className="aside__action-icon">▶</span> Începe aplicarea</button>
            <button className="aside__action"><span className="aside__action-icon">+</span> Salvează în watchlist</button>
            <button className="aside__action"><span className="aside__action-icon">▥</span> Adaugă în pipeline</button>
            <button className="aside__action"><span className="aside__action-icon">◐</span> Generează docs cu AI</button>
            <button className="aside__action"><span className="aside__action-icon">⚐</span> Set deadline reminder</button>
            <button className="aside__action"><span className="aside__action-icon">⤓</span> Export PDF rezumat</button>
            <button className="aside__action"><span className="aside__action-icon">⇄</span> Compară cu altele</button>
          </div>
        </div>
      )}

      {mode === 'app' && (
        <div className="aside__card">
          <div className="aside__card-h"><span>COLABORATORI</span><span>3 pe acest grant</span></div>
          <div className="aside__collab-avatars">
            <div className="aside__collab-avatar">AP</div>
            <div className="aside__collab-avatar" style={{ background: '#6b46c1' }}>MR</div>
            <div className="aside__collab-avatar" style={{ background: '#0a5c3e' }}>DC</div>
            <div className="aside__collab-avatar add">+</div>
          </div>
          <button className="aside__action"><span className="aside__action-icon">@</span> Invită membru echipă</button>
        </div>
      )}

      <div className="aside__card">
        <div className="aside__card-h"><span>DISTRIBUIE</span></div>
        <div className="aside__share">
          <button>LI</button><button>X</button><button>EM</button><button>⎘</button>
        </div>
      </div>

      {mode === 'public' && (
        <div className="aside__card" style={{ background: 'var(--accent)', color: 'var(--accent-ink)', borderColor: 'var(--accent)' }}>
          <div className="aside__card-h" style={{ color: 'rgba(255,255,255,.7)' }}><span>FREE TRIAL</span></div>
          <div style={{ fontFamily: 'Space Grotesk', fontSize: 18, fontWeight: 600, marginBottom: 6 }}>Calculează match-ul tău</div>
          <div style={{ fontSize: 13, opacity: .85, marginBottom: 14 }}>5 min · fără card · 735+ granturi</div>
          <button className="btn" style={{ background: '#fff', color: 'var(--accent)', borderColor: '#fff', width: '100%', justifyContent: 'center' }}>Începe gratuit →</button>
        </div>
      )}
    </aside>
  );
}

// ============== APP ==============
function GrantApp() {
  const [mode, setMode] = useState(() => {
    try { return localStorage.getItem('gp-mode') || 'app'; } catch { return 'app'; }
  });
  const [grantId, setGrantId] = useState(() => {
    if (typeof window !== 'undefined' && window.__GRANT_DATA__) return 'live';
    try { return localStorage.getItem('gp-grant') || 'eic'; } catch { return 'eic'; }
  });
  const [active, setActive] = useState('overview');

  useEffect(() => { try { localStorage.setItem('gp-mode', mode); } catch {} }, [mode]);
  // Don't persist 'live' — it'd be wrong for the next visit (slug-specific).
  useEffect(() => { try { if (grantId !== 'live') localStorage.setItem('gp-grant', grantId); } catch {} }, [grantId]);

  const g = GRANTS[grantId];

  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) {
      const top = el.getBoundingClientRect().top + window.scrollY - 80;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    const onScroll = () => {
      const positions = SECTIONS.map(s => {
        const el = document.getElementById(s.id);
        if (!el) return { id: s.id, top: Infinity };
        return { id: s.id, top: el.getBoundingClientRect().top };
      });
      const visible = positions.filter(p => p.top < 200).pop();
      if (visible) setActive(visible.id);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="gp">
      <ModeStrip mode={mode} setMode={setMode} grantId={grantId} setGrantId={setGrantId} />
      {mode === 'app' ? <AppTopbar g={g} /> : <PublicNav g={g} />}
      <Hero g={g} mode={mode} />
      <QuickStats g={g} />

      <div className="gp__body">
        <Anchors active={active} scrollTo={scrollTo} />

        <div className="content">
          <ContentSection id="overview" num="01" title="Despre program" sub="Context complet, obiective și ce caută programul.">
            {g.description.map((p, i) => <p key={i}>{p}</p>)}
            {mode === 'app' && (
              <div className="disclaimer">
                AI summary: profilul tău se aliniază pe <strong>{g.matchScore}/100</strong>. Vezi secțiunea <a onClick={() => scrollTo('insights')} style={{ color: 'var(--accent)', cursor: 'pointer', borderBottom: '1px solid var(--accent)' }}>AI Insights</a> pentru cum poți crește scorul.
              </div>
            )}
          </ContentSection>

          <ContentSection id="objectives" num="02" title="Obiective program" sub="Ce încearcă programul să atingă strategic — aliniază pitch-ul tău.">
            <div className="obj-grid">
              {g.objectives.map(o => (
                <div className="obj-card" key={o.n}>
                  <div className="obj-card__n">OBIECTIV {o.n}</div>
                  <div className="obj-card__t">{o.t}</div>
                  <div className="obj-card__d">{o.d}</div>
                </div>
              ))}
            </div>
          </ContentSection>

          <ContentSection id="eligibility" num="03" title="Criterii de eligibilitate"
            sub={mode === 'app' ? 'Verificat automat pe profilul tău. Roșu = blocant, galben = de îmbunătățit.' : 'Trebuie îndeplinite toate condițiile pentru a aplica.'}>
            <div className="elig">
              {g.eligibility.map((e, i) => (
                <div className="elig__row" key={i}>
                  <div className={`elig__icon ${e.status}`}>{e.status === 'ok' ? '✓' : e.status === 'warn' ? '!' : '○'}</div>
                  <div className="elig__t">
                    <strong>{e.t}</strong>
                    <span>{e.d}</span>
                  </div>
                  <div className={`elig__status ${e.status}`}>
                    {mode === 'app' ? e.note : (e.status === 'ok' ? 'Required' : e.status === 'warn' ? 'Recomandat' : 'Required')}
                  </div>
                </div>
              ))}
              {mode === 'app' && (
                <div className="elig__summary">
                  <span>{g.eligibility.filter(e => e.status === 'ok').length} / {g.eligibility.length} îndeplinite</span>
                  <span>Status global: <strong>Aplicabil cu îmbunătățiri minore</strong></span>
                </div>
              )}
            </div>
          </ContentSection>

          <ContentSection id="timeline" num="04" title="Timeline aplicare" sub="Cronologia procesului — de la submit la decizie finală.">
            <div className="tl">
              {g.timeline.map((t, i) => (
                <div className={`tl__row ${t.state === 'now' ? 'is-now' : i === 0 ? '' : ''}`} key={i}>
                  <div className="tl__dot"></div>
                  <div>
                    <div className="tl__t">{t.t}</div>
                    <div className="tl__d">{t.d}</div>
                  </div>
                  <div className="tl__date">
                    <strong>{t.date}</strong>
                    {t.sub}
                  </div>
                </div>
              ))}
            </div>
          </ContentSection>

          <ContentSection id="docs" num="05" title="Documente necesare"
            sub={mode === 'app' ? 'Verde = ai deja, galben = generăm cu AI, gri = lipsește.' : 'Lista completă a documentelor pentru aplicare.'}>
            <div className="docs">
              {g.docs.map((d, i) => (
                <div className="doc" key={i}>
                  <div className="doc__icon">{d.t.includes('Excel') || d.t.includes('Buget') ? 'XLS' : d.t.includes('Video') ? 'MP4' : 'PDF'}</div>
                  <div className="doc__t">
                    <strong>{d.t}</strong>
                    <span>{d.s}</span>
                  </div>
                  {mode === 'app' && (
                    <div className={`doc__status ${d.status}`}>
                      {d.status === 'have' ? '✓ am' : d.status === 'gen' ? 'AI gen' : 'lipsă'}
                    </div>
                  )}
                  {mode === 'public' && <div className="doc__status miss">required</div>}
                </div>
              ))}
            </div>
          </ContentSection>

          <ContentSection id="team" num="06" title="Echipă & parteneri necesari" sub="Roluri și competențe pe care evaluatorii le caută.">
            <div className="team-req">
              <div className="team-req__card">
                <div className="team-req__h">ROLURI ACOPERITE {mode === 'app' && '(de echipa ta)'}</div>
                <div className="team-req__roles">
                  {g.teamReq.have.map(r => <span key={r} className="team-req__role have">✓ {r}</span>)}
                </div>
              </div>
              <div className="team-req__card">
                <div className="team-req__h">{mode === 'app' ? 'LIPSESC / DE ADĂUGAT' : 'ROLURI RECOMANDATE'}</div>
                <div className="team-req__roles">
                  {g.teamReq.miss.map(r => <span key={r} className="team-req__role miss">○ {r}</span>)}
                </div>
              </div>
            </div>
          </ContentSection>

          <ContentSection id="process" num="07" title="Procesul de evaluare" sub="Cine evaluează și cum se calculează scorul.">
            <div style={{ marginBottom: 18, fontFamily: 'JetBrains Mono', fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.1em' }}>Criterii scoring</div>
            <div className="scoring">
              {g.scoring.map((s, i) => (
                <div className="scoring__card" key={i}>
                  <div className="scoring__card-h"><span>CRITERIU 0{i + 1}</span><span className="scoring__card-w">{s.w}</span></div>
                  <div className="scoring__card-t">{s.t}</div>
                  <div className="scoring__card-d">{s.d}</div>
                </div>
              ))}
            </div>
            <div style={{ margin: '24px 0 12px', fontFamily: 'JetBrains Mono', fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.1em' }}>Cine evaluează</div>
            <div className="evaluators">
              {g.evaluators.map(e => (
                <div className="evaluator" key={e.n}>
                  <div className="evaluator__avatar">{e.i}</div>
                  <div className="evaluator__t">
                    <strong>{e.n}</strong>
                    <span>{e.r}</span>
                  </div>
                </div>
              ))}
            </div>
          </ContentSection>

          <ContentSection id="stats" num="08" title="Statistici succes" sub="Date din cohorta anterioară — cât de competitiv e programul.">
            <div className="stats">
              {g.stats.map(s => (
                <div className="stats__cell" key={s.k}>
                  <div className="stats__k">{s.k}</div>
                  <div className="stats__v">{s.v}</div>
                  <div className="stats__sub">{s.sub}</div>
                </div>
              ))}
            </div>
            <div className="funnel">
              <div className="funnel__h">FUNNEL APLICAȚII → APROBARE</div>
              {g.funnel.map((f, i) => (
                <div className="funnel__row" key={i}>
                  <div className="funnel__t">{f.t}</div>
                  <div className="funnel__bar">
                    <div className={`funnel__bar-fill ${f.kind || ''}`} style={{ width: f.pct + '%' }}>
                      <span className="funnel__bar-label">{f.count}</span>
                    </div>
                  </div>
                  <div className="funnel__pct">{f.pct}%</div>
                </div>
              ))}
            </div>
          </ContentSection>

          <ContentSection id="cases" num="09" title="Câștigători anteriori" sub="Ce au făcut bine startup-urile finanțate în cohortele trecute.">
            <div className="cases">
              {g.cases.map(c => (
                <div className="case" key={c.n}>
                  <div className="case__head">
                    <div className="case__logo">{c.logo}</div>
                    <div>
                      <div className="case__name">{c.n}</div>
                      <div className="case__meta">{c.m}</div>
                    </div>
                  </div>
                  <div className="case__quote">"{c.q}"</div>
                  <div className="case__stats">
                    {c.s.map((s, i) => (
                      <div key={i}>
                        <div className="case__stat-k">{s[0]}</div>
                        <div className="case__stat-v">{s[1]}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </ContentSection>

          {mode === 'app' && (
            <ContentSection id="insights" num="10" title="AI Insights — pentru profilul tău" sub="Acțiuni concrete care îți cresc scorul de match. Ordonate după impact.">
              <div className="insights">
                {g.insights.map((i, idx) => (
                  <div className="insight" key={idx}>
                    <div className="insight__delta">{i.delta} pct</div>
                    <div>
                      <div className="insight__t">{i.t}</div>
                      <div className="insight__d">{i.d}</div>
                    </div>
                    <button className="btn btn--ghost btn--sm">Aplică →</button>
                  </div>
                ))}
              </div>
            </ContentSection>
          )}

          {mode === 'public' && (
            <ContentSection id="insights" num="10" title="Vezi insight-uri AI personalizate" sub="Cu un cont gratuit, primești recomandări concrete pentru a-ți crește șansele.">
              <div style={{ border: '1px solid var(--accent)', background: 'var(--bg-2)', padding: '32px', textAlign: 'center' }}>
                <div style={{ fontFamily: 'Space Grotesk', fontSize: 22, fontWeight: 600, marginBottom: 10 }}>4 acțiuni concrete blocate</div>
                <p style={{ color: 'var(--ink-2)', maxWidth: 480, margin: '0 auto 20px', fontSize: 14 }}>
                  AI-ul nostru analizează profilul tău și îți dă lista exactă de îmbunătățiri pentru acest grant. Fără cont, nu putem personaliza.
                </p>
                <button className="btn btn--accent">Înregistrează-te gratuit →</button>
              </div>
            </ContentSection>
          )}

          <ContentSection id="faq" num="11" title="Întrebări frecvente" sub="Răspunsuri la cele mai comune întrebări despre program.">
            <FAQ items={g.faq} />
          </ContentSection>

          <ContentSection id="similar" num="12" title="Granturi similare" sub="Alte programe care s-ar potrivi profilului tău.">
            <div className="similar">
              {g.similar.map((s, i) => (
                <div className="sim" key={i}>
                  <div className="sim__head">
                    <span>{s.meta.split(' · ')[0]}</span>
                    {mode === 'app' && <span className="sim__match">{s.match}% match</span>}
                  </div>
                  <div className="sim__t">{s.n}</div>
                  <div className="sim__meta">{s.meta.split(' · ').slice(1).join(' · ')}</div>
                  <div className="sim__bottom">
                    <span>Vezi detalii</span>
                    <span>→</span>
                  </div>
                </div>
              ))}
            </div>
          </ContentSection>
        </div>

        <Aside g={g} mode={mode} />
      </div>

      {mode === 'public' && (
        <div className="public-cta">
          <div className="public-cta__label">— GATA SĂ APLICI? —</div>
          <h2 className="public-cta__t">Vezi dacă te potrivești la {g.name}.</h2>
          <p className="public-cta__d">Înregistrează-te gratuit, completează profilul în 5 minute și primești scor personalizat + plan de acțiune AI.</p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <button className="btn" style={{ background: '#fff', color: 'var(--ink)', borderColor: '#fff' }}>Începe gratuit →</button>
            <button className="btn btn--ghost" style={{ color: '#fff', borderColor: 'rgba(255,255,255,.3)' }}>Vorbește cu un consultant</button>
          </div>
        </div>
      )}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('grant-root')).render(<GrantApp />);
