// Data for the eligibil.org prototype
// Sectors, countries, programs, reports, partners, posts, FAQ

const SECTORS = [
  { id: 'ai', name: 'AI & Machine Learning', n: 142, range: '€5K – €2.5M', thumb: 'grid' },
  { id: 'bio', name: 'Biotech & Health', n: 98, range: '€10K – €17.5M', thumb: 'circles' },
  { id: 'climate', name: 'Climate & Sustainability', n: 87, range: '€15K – €5M', thumb: 'stacks' },
  { id: 'fin', name: 'Fintech', n: 76, range: '€25K – €3M', thumb: 'bars' },
  { id: 'edu', name: 'EdTech', n: 54, range: '€10K – €800K', thumb: 'cross' },
  { id: 'deep', name: 'Deep Tech', n: 112, range: '€50K – €15M', thumb: 'hex' },
  { id: 'hw', name: 'Hardware & IoT', n: 63, range: '€20K – €4M', thumb: 'diag' },
  { id: 'soc', name: 'Social Impact', n: 45, range: '€5K – €500K', thumb: 'ring' },
  { id: 'saas', name: 'SaaS & Web', n: 58, range: '€10K – €2M', thumb: 'squareNest' },
  { id: 'agri', name: 'AgriFood', n: 34, range: '€15K – €1.2M', thumb: 'triangle' },
  { id: 'space', name: 'Space & Aerospace', n: 21, range: '€100K – €10M', thumb: 'dots' },
  { id: 'mar', name: 'Maritime & Logistics', n: 19, range: '€20K – €3M', thumb: 'bisect' },
];

const COUNTRIES = {
  'Europa de Est & CSI': [
    { flag: '🇲🇩', name: 'Moldova', n: 15 },
    { flag: '🇷🇴', name: 'România', n: 25 },
    { flag: '🇺🇦', name: 'Ucraina', n: 22 },
    { flag: '🇬🇪', name: 'Georgia', n: 8 },
    { flag: '🇦🇲', name: 'Armenia', n: 6 },
    { flag: '🇧🇬', name: 'Bulgaria', n: 11 },
  ],
  'UE Centru & Vest': [
    { flag: '🇫🇷', name: 'Franța', n: 48 },
    { flag: '🇩🇪', name: 'Germania', n: 62 },
    { flag: '🇳🇱', name: 'Olanda', n: 34 },
    { flag: '🇧🇪', name: 'Belgia', n: 18 },
    { flag: '🇪🇸', name: 'Spania', n: 29 },
    { flag: '🇮🇹', name: 'Italia', n: 31 },
  ],
  'UE Nord & Baltice': [
    { flag: '🇸🇪', name: 'Suedia', n: 24 },
    { flag: '🇫🇮', name: 'Finlanda', n: 19 },
    { flag: '🇩🇰', name: 'Danemarca', n: 17 },
    { flag: '🇪🇪', name: 'Estonia', n: 12 },
    { flag: '🇱🇻', name: 'Letonia', n: 9 },
    { flag: '🇱🇹', name: 'Lituania', n: 10 },
  ],
  'America & Global': [
    { flag: '🇺🇸', name: 'SUA', n: 200 },
    { flag: '🇨🇦', name: 'Canada', n: 22 },
    { flag: '🇬🇧', name: 'Marea Britanie', n: 41 },
    { flag: '🇮🇱', name: 'Israel', n: 15 },
    { flag: '🌐', name: 'Programe globale', n: 38 },
    { flag: '🇯🇵', name: 'Japonia', n: 8 },
  ],
};

const PROGRAMS = [
  {
    status: 'live', deadline: '15 Mai 2026', days: 23,
    name: 'EIC Accelerator 2026 — Cut-off Mai',
    from: 'European Innovation Council', flag: '🇪🇺 EU',
    amount: 'Până la €2.5M', type: 'Grant + equity opțional',
    trl: 'TRL 6–8', sectors: ['AI & ML', 'Deep Tech', 'Biotech'],
    matchScore: 72, applicants: '1,200+',
    note: 'Dintre utilizatorii noștri: 8 aplicări active, 2 cu scor >85',
    stage: 'growth',
  },
  {
    status: 'live', deadline: '5 Iunie 2026', days: 44,
    name: 'NSF SBIR Phase I — Ciclul Iunie',
    from: 'National Science Foundation', flag: '🇺🇸 SUA',
    amount: 'Până la $275K', type: 'Grant 100% non-dilutiv',
    trl: 'TRL 3–5', sectors: ['Deep Tech', 'AI', 'Hardware'],
    matchScore: 68, applicants: '3,500+',
    note: 'Colaborări cu entități SUA via prime contractor acceptate',
    stage: 'early',
  },
  {
    status: 'live', deadline: 'Rolling', days: null,
    name: 'Google for Startups — AI Accelerator',
    from: 'Google', flag: '🌐 Global',
    amount: 'Cloud credits + mentorat', type: 'Non-dilutiv',
    trl: 'Toate stadiile', sectors: ['AI & ML', 'SaaS'],
    matchScore: 81, applicants: '800+',
    note: 'Cohorte trimestriale · aplicare continuă',
    stage: 'early',
  },
  {
    status: 'soon', deadline: '1 Iulie 2026', days: 70,
    name: 'Startup Moldova 2026 — Ediția a III-a',
    from: 'ODA + IT Park Moldova', flag: '🇲🇩 Moldova',
    amount: 'Până la 200.000 MDL', type: 'Grant',
    trl: 'Early-stage', sectors: ['Toate verticalele'],
    matchScore: 78, applicants: '400+',
    note: 'Pre-înregistrare deschisă până pe 15 iunie',
    stage: 'idea',
  },
  {
    status: 'live', deadline: '30 Mai 2026', days: 38,
    name: 'Horizon Europe — Cluster Health Call',
    from: 'European Commission', flag: '🇪🇺 EU',
    amount: '€3M – €8M consortium', type: 'Grant colaborativ',
    trl: 'TRL 4–7', sectors: ['Biotech & Health'],
    matchScore: 64, applicants: '600+',
    note: 'Cerință consorțiu: 3+ țări UE · minim 1 SME',
    stage: 'rd',
  },
  {
    status: 'live', deadline: '12 Mai 2026', days: 20,
    name: 'Techcelerator Cohort #14',
    from: 'Techcelerator', flag: '🇷🇴 România',
    amount: '€30K – €100K pre-seed', type: 'Equity (5–8%)',
    trl: 'Early-stage', sectors: ['SaaS', 'Fintech', 'AI'],
    matchScore: 74, applicants: '250+',
    note: 'Demo Day pe 15 septembrie · acces VC Balcani',
    stage: 'early',
  },
];

const REPORTS = [
  { title: 'Piața granturilor din Moldova & România — 2026', pages: 48, kind: 'PDF',
    desc: 'O analiză completă a ecosistemului de finanțare non-dilutivă din MD și RO. Harta programelor naționale și europene, tendințe 2025, previziuni 2026–2028.', thumb: 'grid' },
  { title: 'Ghidul complet Horizon Europe pentru startup-uri', pages: 72, kind: 'PDF',
    desc: 'Clusterele, tipurile de call-uri, structura consorțiilor, criteriile de evaluare, bugete eligibile și erori comune. Plus template-uri de aplicație.', thumb: 'stacks' },
  { title: 'SBIR Roadmap 2026 — De la Phase I la Phase III', pages: 56, kind: 'PDF',
    desc: 'Ghid pentru startup-uri din afara SUA care vor să acceseze SBIR/STTR. Eligibilitate, parteneriate, timeline-uri și costuri.', thumb: 'cross' },
  { title: 'Deep Tech în Europa de Est — Industry Overview', pages: 64, kind: 'PDF',
    desc: 'Profil de piață, investitori activi, granturi specializate, TRL benchmarks, case studies din 5 țări CEE.', thumb: 'hex' },
  { title: 'State of Funding 2025 — Raport anual eligibil.org', pages: 32, kind: 'PDF',
    desc: 'Cifre cheie, cele mai căutate programe, rate de succes, lecții învățate din 5.000+ analize AI realizate în 2025.', thumb: 'bars' },
  { title: 'De la spinout la grant — ghid pentru cercetători', pages: 40, kind: 'PDF',
    desc: 'Cum traduci TRL-ul real în limbajul evaluatorilor. IP landscape, ResearchMatch, strategia de consorțiu.', thumb: 'squareNest' },
];

const PARTNERS = [
  { name: 'Upcelerator', verified: true, country: 'Moldova', flag: '🇲🇩', sub: 'Accelerator · Early-stage · MD & RO',
    desc: 'Programul de accelerare al ecosistemului Moldova Growth Plan. Cohorte de 3–4 luni, mentorat, Demo Day și acces la rețea de investitori. Integrat nativ cu eligibil.org.',
    tags: ['AI', 'SaaS', 'Fintech', 'Deep Tech'], thumb: 'ring' },
  { name: 'How to Web Spotlight', verified: true, country: 'România', flag: '🇷🇴', sub: 'Accelerator · Growth · RO + CEE',
    desc: 'Unul dintre acceleratoarele de referință din CEE. 3 luni intensive cu mentori internaționali, acces la investitori top-tier din regiune.',
    tags: ['Toate verticalele'], thumb: 'triangle' },
  { name: 'EIC — European Innovation Council', verified: true, country: 'EU', flag: '🇪🇺', sub: 'Fond public · TRL 5–9 · EU',
    desc: 'Cel mai mare finanțator public european pentru deep tech. Accelerator (€2.5M grant + €15M equity), Pathfinder (€3–4M consortium), Transition.',
    tags: ['Deep Tech', 'Biotech', 'Climate'], thumb: 'hex' },
  { name: 'NSF SBIR — National Science Foundation', verified: true, country: 'SUA', flag: '🇺🇸', sub: 'Program federal · Deep tech · SUA',
    desc: "America's Seed Fund. $275K Phase I, $2M Phase II. 100% non-dilutiv. Acceptă și colaborări cu entități non-SUA via prime contractors.",
    tags: ['AI', 'Hardware', 'Biotech'], thumb: 'cross' },
];

const POSTS = [
  { cat: 'Granturi', time: '5 min', date: '18 Apr 2026',
    title: 'EIC Accelerator 2026: Ce s-a schimbat la cut-off-ul din Mai',
    desc: 'Analiză a modificărilor din call-ul curent: noi teme strategice, praguri TRL ridicate, așteptări sporite pe impact.', thumb: 'grid' },
  { cat: 'SBIR', time: '7 min', date: '12 Apr 2026',
    title: 'Cum accesezi SBIR dacă ești startup din Moldova sau România',
    desc: 'Ghid practic pentru collaborare cu entități SUA, prime contractor routes, și ce funcționează real pentru echipele non-US.', thumb: 'cross' },
  { cat: 'Interviu', time: '4 min', date: '3 Apr 2026',
    title: 'Cum a câștigat Axon Labs €800K prin Horizon Europe — în prima aplicare',
    desc: 'Interviu cu co-fondatorul unui spinout universitar despre strategia de consorțiu, timeline-ul real și erorile evitate.', thumb: 'circles' },
  { cat: 'Analiză', time: '6 min', date: '27 Mar 2026',
    title: 'Moldova Growth Plan: €1.9 miliarde pentru 2025–2027',
    desc: 'Breakdown pe domenii, granturi deschise fondatorilor, acceleratoare finanțate, oportunități de consorțiu.', thumb: 'bars' },
];

const FAQS = [
  { q: 'Ce este eligibil.org?',
    a: 'eligibil.org este un agregator de surse de finanțare care face mai ușor să găsești programe relevante pentru startupul tău, bazat pe țară, sector, tip de finanțare și stadiu. Fiecare oportunitate include metadate complete — eligibilitate, sumă, deadline, criterii — și poate fi analizată AI pentru a calcula scorul tău de potrivire și pregătire.' },
  { q: 'Trebuie să plătesc pentru a folosi eligibil.org?',
    a: 'Răsfoirea catalogului este 100% gratuită, fără cont necesar. Crearea unui cont de utilizator îți oferă beneficii — salvarea oportunităților, notificări de deadline, istoric de aplicări. Analiza AI (Match, Readiness, Confidence + generare documente) e în faza beta gratuită acum.' },
  { q: 'Poți recomanda programul potrivit pentru obiectivele mele?',
    a: 'Ca agregator, eligibil.org nu oferă consultanță financiară directă. Oferim însă o colecție vastă de surse filtrabile pe multiple criterii și un sistem de scoring AI care calculează potrivirea ta cu fiecare program. Decizia finală îți aparține — recomandăm totuși să consulți un consilier înainte de aplicări la programe dilutive.' },
  { q: 'Cum vă asigurați că informațiile sunt actualizate?',
    a: 'Folosim monitorizare automată zilnică (crawlers care verifică site-urile oficiale și detectează modificări), colaborare cu reprezentanții programelor (partenerii verificați își mențin profilurile), feedback din comunitate (oricine poate raporta inadvertențe sau programe noi) și audit periodic trimestrial.' },
  { q: 'Cum sunt selectate programele din catalog?',
    a: 'Adăugăm programe publice naționale (MD, RO, EU, SUA), programe UE (Horizon, EIC, Interreg, Erasmus+), competiții corporate, acceleratoare verificate, fonduri de investiții cu track record, și surse de capital non-dilutiv. Fiecare adăugare trece prin verificare manuală.' },
  { q: 'Din ce regiuni sunt listate programele?',
    a: 'Acoperire globală cu focus regional pe Moldova, România, Europa Centrală și de Est, EU-27 complet, SUA (SBIR/STTR federal + programe statale), și selectiv Global. Extindem constant în Caucaz, Balcani și Asia Centrală.' },
  { q: 'Trebuie să am cont pentru a folosi platforma?',
    a: 'Nu pentru răsfoirea catalogului. Da pentru: analiza AI a startupului tău, salvarea favoritelor, alerte de deadline, pipeline tracking, și generare de documente AI.' },
  { q: 'Ce primesc ca accelerator sau fond dacă mă listez?',
    a: 'Profil gratuit complet (logo, descriere, call-uri active), badge "Verified", apariție prioritară în căutări relevante, acces la analize despre fondatorii interesați, și — opțional — integrare cu sistemul de matching AI care îți trimite aplicanți pre-calificați.' },
  { q: 'Am găsit o informație incorectă sau lipsă. Ce fac?',
    a: 'Trimite-ne un mesaj la info@eligibil.org sau folosește butonul "Raportează" de pe cardul oricărei oportunități. Orice raport e verificat în 48 de ore.' },
  { q: 'În ce limbi funcționează platforma?',
    a: 'Română · Engleză · Rusă · Ucraineană. Analiza AI a artefactelor (deck, video, whitepaper) funcționează indiferent de limba documentului.' },
  { q: 'Cum sunt protejate datele startupului meu?',
    a: 'Datele încărcate pentru analiză AI nu sunt partajate cu terți și nu sunt folosite pentru antrenament AI fără consimțământ explicit. Răsfoirea catalogului e anonimă și nu necesită cont.' },
];

const MEGA = {
  finantari: {
    cols: [
      { t: 'După sector', items: [
        ['AI & Machine Learning', '142'], ['Biotech & Health', '98'], ['Climate Tech', '87'],
        ['Fintech', '76'], ['EdTech', '54'], ['Deep Tech', '112'], ['Hardware & IoT', '63'],
        ['Social Impact', '45'], ['Toate verticalele →', ''],
      ]},
      { t: 'După țară', items: [
        ['🇲🇩 Moldova', '15'], ['🇷🇴 România', '25'], ['🇪🇺 Uniunea Europeană', '180'],
        ['🇺🇦 Ucraina', '22'], ['🇺🇸 Statele Unite', '200'], ['🇫🇷 Franța', '48'],
        ['🇩🇪 Germania', '62'], ['Toate țările →', ''],
      ]},
      { t: 'După tip', items: [
        ['Granturi naționale', '218'], ['Programe UE', '180'], ['SBIR / STTR', '95'],
        ['Programe guvernamentale', '78'], ['Capital non-dilutiv', '64'], ['Competiții & hackathoane', '47'],
        ['Acceleratoare', '52'], ['Toate tipurile →', ''],
      ]},
      { t: 'După regiune', items: [
        ['🇪🇺 Europa', '345'], ['🇺🇸 America de Nord', '222'], ['🌍 Global', '68'],
        ['🌏 Balcani & Est-EU', '94'], ['🏔️ Caucaz', '22'], ['🌐 Asia', '41'],
      ]},
    ],
    banner: { h: '735+ surse verificate', sub: 'Actualizate zilnic · 4 limbi · Gratuit pentru răsfoire', cta: 'Vezi catalogul complet →' },
  },
  programe: {
    cols: [
      { t: 'După stadiu', items: [
        ['Idea Stage', '88'], ['Early-stage', '245'], ['Growth', '162'],
        ['Scale-up', '98'], ['R&D / Cercetare', '142'],
      ]},
      { t: 'După sumă', items: [
        ['< €50K', '112'], ['€50K – €250K', '198'], ['€250K – €1M', '175'],
        ['€1M – €10M', '134'], ['€10M+', '42'],
      ]},
      { t: 'După deadline', items: [
        ['Deadline în 7 zile', '12'], ['Deadline în 30 zile', '38'],
        ['Deadline în 90 zile', '124'], ['Rolling / continuu', '87'],
      ]},
      { t: 'Featured acum', items: [
        ['EIC Accelerator Mai', ''], ['NSF SBIR Phase I', ''], ['Horizon Health', ''],
        ['Startup Moldova 2026', ''], ['Techcelerator #14', ''],
      ]},
    ],
    banner: { h: 'Programe deschise ACUM', sub: 'Livrate cu analiză AI de pregătire pentru fiecare', cta: 'Vezi programele active →' },
  },
  parteneri: {
    cols: [
      { t: 'Acceleratoare', items: [['Upcelerator (MD)', ''], ['How to Web Spotlight (RO)', ''], ['Techcelerator (RO)', ''], ['Founder Institute', ''], ['DreaMUsUp', '']] },
      { t: 'Fonduri', items: [['EIC (EU)', ''], ['Horizon Europe', ''], ['NSF SBIR (US)', ''], ['Google for Startups', ''], ['EIT KIC-uri', '']] },
      { t: 'Programe donor', items: [['USAID Moldova', ''], ['EBRD', ''], ['Banca Mondială', ''], ['UNDP', ''], ['EU Moldova Growth Plan', '']] },
      { t: 'Instituții', items: [['IT Park Moldova', ''], ['ANCD', ''], ['UTM, ASM', ''], ['CODIT', ''], ['Toate →', '']] },
    ],
    banner: { h: 'Ești accelerator sau fond?', sub: 'Listează-te gratuit · badge Verified · aplicanți pre-calificați', cta: 'Listează-te gratuit →' },
  },
  resurse: {
    cols: [
      { t: 'Rapoarte & whitepapers', items: [['Piața granturilor MD/RO 2026', ''], ['Ghid Horizon Europe', ''], ['SBIR Roadmap 2026', ''], ['Deep Tech CEE Overview', ''], ['State of Funding 2025', '']] },
      { t: 'Blog', items: [['Analize săptămânale', ''], ['Interviuri fondatori', ''], ['Tendințe finanțare', ''], ['Ghiduri aplicare', ''], ['Toate articolele →', '']] },
      { t: 'Glosar', items: [['TRL', ''], ['EIC', ''], ['Attractiveness Score', ''], ['Consorțiu', ''], ['Dilutiv vs non-dilutiv', '']] },
      { t: 'Video & evenimente', items: [['Pitch deck pentru SBIR', ''], ['Demo Day tips', ''], ['Webinar Horizon', ''], ['Conferințe 2026', ''], ['Toate evenimentele →', '']] },
    ],
    banner: { h: 'Knowledge Hub', sub: '48+ rapoarte · blog săptămânal · glosar de peste 120 de termeni', cta: 'Explorează resursele →' },
  },
};

Object.assign(window, { SECTORS, COUNTRIES, PROGRAMS, REPORTS, PARTNERS, POSTS, FAQS, MEGA });
