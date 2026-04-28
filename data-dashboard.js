// Dashboard data — app.eligibil.eu
const DASH_GRANTS = [
  { name: 'EIC Accelerator 2026 — Cut-off Mai', from: 'European Innovation Council', flag: '🇪🇺 EU',
    amount: '€2.5M max', match: 82, readiness: 68, confidence: 74,
    deadline: '15 Mai', days: 23, status: 'live' },
  { name: 'Google for Startups AI Accelerator', from: 'Google', flag: '🌐 Global',
    amount: 'Cloud + mentor', match: 81, readiness: 88, confidence: 79,
    deadline: 'Rolling', days: null, status: 'live' },
  { name: 'Startup Moldova 2026 — Ediția III', from: 'ODA + IT Park', flag: '🇲🇩 MD',
    amount: '200K MDL', match: 78, readiness: 72, confidence: 81,
    deadline: '1 Iul', days: 70, status: 'soon' },
  { name: 'Techcelerator Cohort #14', from: 'Techcelerator', flag: '🇷🇴 RO',
    amount: '€30K–100K', match: 74, readiness: 64, confidence: 70,
    deadline: '12 Mai', days: 20, status: 'live' },
  { name: 'NSF SBIR Phase I — Iunie', from: 'National Science Foundation', flag: '🇺🇸 US',
    amount: '$275K', match: 68, readiness: 45, confidence: 62,
    deadline: '5 Iun', days: 44, status: 'live' },
];

const DASH_ALERTS = [
  { kind: 'danger', title: 'Deadline EIC în 23 zile', sub: 'Aplicația ta e la 60% · gap critic: financial model', meta: 'urgent' },
  { kind: 'warn', title: 'Pitch deck nereactualizat de 42 zile', sub: 'Re-analizează pentru scor actualizat', meta: 'stale' },
  { kind: 'info', title: '3 granturi noi potrivite profilului', sub: 'Match mediu 72%. Click pentru review', meta: 'nou' },
  { kind: 'warn', title: 'Lipsește partener UE pentru Horizon', sub: 'ResearchMatch: 12 candidați găsiți', meta: 'acțiune' },
];

const DASH_PIPELINE = [
  { col: 'Descoperit', n: 12, items: [
    { name: 'Horizon Cluster Health', meta: '30 Mai · 64%', pct: 20 },
    { name: 'Climate-KIC', meta: '15 Iun · 58%', pct: 15 },
  ]},
  { col: 'Pregătire', n: 4, items: [
    { name: 'EIC Accelerator', meta: '15 Mai · 82%', pct: 60 },
    { name: 'Techcelerator #14', meta: '12 Mai · 74%', pct: 45 },
  ]},
  { col: 'Gata', n: 2, items: [
    { name: 'Startup Moldova', meta: '1 Iul · 78%', pct: 92 },
  ]},
  { col: 'Trimis', n: 3, items: [
    { name: 'Google for Startups', meta: 'Apr 12 · review', pct: 100 },
    { name: 'EIT Digital', meta: 'Mar 28 · review', pct: 100 },
  ]},
  { col: 'Aprobat', n: 1, items: [
    { name: 'ODA Innovation Voucher', meta: 'Mar 05 · active', pct: 100 },
  ]},
];

const DASH_ACTIVITY = [
  { kind: 'live', txt: 'Analiză Pitch Deck v3 finalizată', sub: 'Scor: 78 (+6 față de v2)', time: 'acum 2h' },
  { kind: '', txt: 'Noul grant adăugat la pipeline', sub: 'NSF SBIR Phase I — Iunie', time: 'acum 5h' },
  { kind: 'warn', txt: 'Deadline EIC în 23 zile', sub: 'Gap critic semnalat: financial model', time: 'ieri' },
  { kind: '', txt: 'Document generat: LOI Upcelerator', sub: 'Draft revizuit manual', time: 'ieri' },
  { kind: 'live', txt: 'Partener confirmat: TU Delft', sub: 'Consorțiu Horizon Health complet 3/4', time: '2 zile' },
  { kind: '', txt: 'Whitepaper v2 încărcat', sub: 'Analiză automată în curs (ETA 90s)', time: '2 zile' },
];

const DASH_ARTEFACTS = [
  { name: 'Pitch Deck', score: 78, v: 'v3 · 14 slides', date: 'acum 2h', status: 'up', cta: 'Re-analizează' },
  { name: 'Video Pitch', score: 72, v: 'v1 · 2:40', date: 'mar 28', status: 'stale', cta: 'Actualizează' },
  { name: 'Whitepaper', score: null, v: 'v2 · se procesează', date: '2 zile', status: 'miss', cta: 'În analiză…' },
  { name: 'Website / GH', score: 64, v: 'axonlabs.md', date: 'apr 01', status: 'up', cta: 'Audit nou' },
];

const DASH_QUICK = [
  { icon: '01', h: 'Încarcă artefact nou', d: 'Deck, video, whitepaper sau URL website pentru audit.', cta: 'Upload →' },
  { icon: '02', h: 'Caută granturi', d: 'Exploreaz ă 735+ surse cu filtre pe sector, țară, sumă.', cta: 'Catalog →' },
  { icon: '03', h: 'Generează document AI', d: 'Aplicație grant, one-pager, LOI, financial model.', cta: 'Generate →' },
  { icon: '04', h: 'Găsește parteneri', d: 'ResearchMatch pentru consorții Horizon sau ERC.', cta: 'Match →' },
];

Object.assign(window, { DASH_GRANTS, DASH_ALERTS, DASH_PIPELINE, DASH_ACTIVITY, DASH_ARTEFACTS, DASH_QUICK });
