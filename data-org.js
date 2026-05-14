// Data for eligibil.org homepage

/* ---------- 5 AI Products ---------- */
const ORG_PRODUCTS = [
  {
    id: 'pitch',
    n: '01',
    code: 'PITCH-ANALYZE',
    name: 'Analiză pitch',
    tag: 'Pitch deck',
    formats: 'PDF · PPTX',
    desc: 'Încarci pitch deck-ul, iar eligibil.org analizează structura, claritatea, problema, soluția, piața, modelul de business, echipa, tracțiunea și ask-ul financiar. Primești recomandări concrete pentru granturi, acceleratoare și investitori.',
    deliver: [
      'scor de claritate',
      'scor de pregătire pentru aplicare',
      'recomandări slide cu slide',
      'identificarea punctelor slabe',
      'sugestii pentru granturi și acceleratoare',
      'variantă rescrisă pentru programul selectat',
    ],
    cta: 'Analizează pitch deck',
    thumb: 'grid',
    descLong: 'Algoritmul AI parcurge fiecare slide al pitch deck-ului tău și evaluează cele 9 dimensiuni standard pe care le caută evaluatorii de granturi și investitorii: problemă, soluție, piață, model de business, tracțiune, echipă, financiar, competiție și ask. Primești scoruri 0–100 pentru fiecare dimensiune plus recomandări concrete de îmbunătățire — slide cu slide — și o variantă rescrisă pentru programul specific pe care vrei să aplici (EIC, Horizon, accelerator local etc.).',
    acceptMime: 'application/pdf,application/vnd.openxmlformats-officedocument.presentationml.presentation',
    acceptHint: 'PDF sau PPTX · max 25 MB',
    maxMb: 25,
    faq: [
      { q: 'Cât durează analiza?', a: 'Sub 60 de secunde pentru un deck standard de 10–15 slide-uri. Decks mai lungi (până la 40 slide-uri) durează 2–3 minute.' },
      { q: 'Pitch deck-ul meu rămâne privat?', a: 'Da. Fișierul tău este stocat criptat, accesibil doar din contul tău. Nu îl partajăm cu investitori sau parteneri fără acordul tău explicit.' },
      { q: 'Pot reîncărca o versiune îmbunătățită?', a: 'Da. Fiecare upload generează un raport nou. Le poți compara în dashboard pentru a vedea progresul.' },
      { q: 'Funcționează pentru pitch deck-uri în engleză?', a: 'Da. Modelul analizează deck-uri în română, engleză, rusă și ucraineană. Recomandările sunt livrate în limba contului tău.' },
      { q: 'Ce e diferit față de un audit uman?', a: 'AI-ul detectează lipsuri structurale și benchmark-ează împotriva a mii de pitch deck-uri finanțate. Pentru un audit uman expert, oferim sesiune 1:1 separat.' },
    ],
  },
  {
    id: 'video',
    n: '02',
    code: 'VIDEO-PITCH',
    name: 'Analiză video',
    tag: 'Video pitch',
    formats: 'MP4 · MOV · ≤ 3 min',
    desc: 'Încarci un video pitch de până la 3 minute, iar sistemul analizează mesajul, structura, expresivitatea, claritatea, coerența și capacitatea de a convinge un evaluator, mentor sau investitor.',
    deliver: [
      'transcriere și rezumat',
      'evaluarea mesajului principal',
      'puncte unde pierzi atenția',
      'recomandări de storytelling',
      'sugestii pentru un pitch mai clar',
      'scor de încredere și coerență',
    ],
    cta: 'Analizează video pitch',
    thumb: 'bars',
    descLong: 'Sistemul transcrie automat video-ul, analizează ritm, claritate, structura narativă și impact emoțional. Identifică momentele în care pierzi atenția evaluatorului și sugerează ajustări concrete de storytelling. Primești un scor de încredere, un transcript editabil, și o variantă optimizată a scriptului pentru un pitch mai convingător.',
    acceptMime: 'video/mp4,video/quicktime',
    acceptHint: 'MP4 sau MOV · max 200 MB · până la 3 minute',
    maxMb: 200,
    faq: [
      { q: 'Cât de lung poate fi video-ul?', a: 'Recomandăm 90 secunde – 3 minute. Video-urile mai lungi de 3 minute sunt acceptate dar analiza se concentrează pe primele 3 minute.' },
      { q: 'Ce calitate audio trebuie?', a: 'Orice nivel decent — microfon de telefon e suficient. Evităm doar zgomote de fundal puternice sau muzică suprapusă pe voce.' },
      { q: 'Care e dimensiunea maximă a fișierului?', a: 'Până la 200 MB pentru MP4/MOV. Pentru fișiere mai mari, folosește upload prin link (Drive/Vimeo) — în curând.' },
      { q: 'Analizezi și limbajul corporal?', a: 'Pentru moment, ne concentrăm pe audio și conținutul vorbit. Analiza vizuală a expresivității vine în Q3.' },
      { q: 'Pot folosi raportul pentru a-mi pregăti un pitch live?', a: 'Da. Recomandările de timing, accentuare și transcript optimizat sunt direct aplicabile unei prezentări demo day.' },
    ],
  },
  {
    id: 'wp',
    n: '03',
    code: 'WHITEPAPER',
    name: 'Analiză whitepaper',
    tag: 'Document tehnic',
    formats: 'PDF · DOCX',
    desc: 'Pentru startupuri deep tech, cercetători și spinout-uri, eligibil.org analizează whitepaper-ul tehnic, metodologia, nivelul TRL, proprietatea intelectuală, impactul, riscurile și compatibilitatea cu programe precum EIC, Horizon Europe, Pathfinder sau granturi R&D.',
    deliver: [
      'evaluare tehnică',
      'estimare TRL',
      'analiză IP',
      'identificarea lipsurilor metodologice',
      'recomandări pentru granturi R&D',
      'structură îmbunătățită pentru evaluatori',
    ],
    cta: 'Analizează whitepaper',
    thumb: 'hex',
    descLong: 'Pentru deep tech, biotech și spinout-uri universitare, analizăm rigurozitatea metodologică, claritatea inovației, poziționarea TRL, statutul IP (brevete, licențe, freedom-to-operate) și fit-ul cu programe de grant R&D — EIC Pathfinder, Horizon Europe Cluster 4/5, ERC, Eureka. Identificăm gap-urile pe care evaluatorii le caută și sugerăm structura optimă pentru un dosar competitiv.',
    acceptMime: 'application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    acceptHint: 'PDF sau DOCX · max 25 MB',
    maxMb: 25,
    faq: [
      { q: 'Ce tip de whitepaper analizezi?', a: 'Whitepaper-uri tehnice (1–30 pagini): metodologie de cercetare, descriere produs/tehnologie, business case, market analysis pentru deep tech.' },
      { q: 'Analizezi și brevete?', a: 'Da, dar nu căutăm prior art (nu suntem patent searchers). Verificăm dacă poziționarea IP din whitepaper este coerentă și completă.' },
      { q: 'Cât de detaliată e estimarea TRL?', a: 'Folosim scala 1–9 EU, cu justificare per criteriu și diferența față de TRL minim cerut de programele majore.' },
      { q: 'E util și pentru spinout-uri academice?', a: 'Da, în special. Acoperim întreaga tranziție de la cercetare publicată la propunere comercială.' },
      { q: 'Pot încărca și articole publicate în reviste?', a: 'Da, dar recomandăm să încarci documentul tehnic intern, nu doar publicația — versiunile publicate sunt deseori reduse pentru spațiu.' },
    ],
  },
  {
    id: 'trl',
    n: '04',
    code: 'TRL-EVAL',
    name: 'Evaluare TRL',
    tag: 'Technology Readiness',
    formats: 'din artefacte încărcate',
    desc: 'eligibil.org estimează nivelul Technology Readiness Level al startupului tău pe baza documentelor încărcate, a descrierii produsului, a prototipului, a validărilor tehnice și a tracțiunii existente.',
    deliver: [
      'TRL estimat (1–9)',
      'explicație pentru nivelul ales',
      'diferența față de TRL cerut de programe',
      'pași pentru creșterea TRL',
      'recomandări de programe potrivite',
      'riscuri tehnice și de validare',
    ],
    cta: 'Evaluează TRL',
    thumb: 'stacks',
    descLong: 'Pe baza documentelor pe care le-ai încărcat anterior (pitch deck, whitepaper, video) plus o descriere scurtă a prototipului și validărilor existente, estimăm Technology Readiness Level (1–9, scala UE) al startupului. Comparăm cu nivelul minim cerut de fiecare program major (EIC Accelerator cere TRL 5+, Horizon Pathfinder TRL 2–4, etc.) și îți recomandăm pașii pentru a urca o treaptă.',
    acceptMime: 'application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.presentationml.presentation',
    acceptHint: 'Orice artefact tehnic — PDF, DOCX, PPTX · max 25 MB',
    maxMb: 25,
    faq: [
      { q: 'Am nevoie să încarc ceva nou?', a: 'Nu obligatoriu. Dacă ai uploads anterioare (pitch deck, whitepaper), folosim acelea. Poți adăuga un document tehnic suplimentar dacă vrei o estimare mai precisă.' },
      { q: 'Cum verifici acuratețea?', a: 'Comparăm semnalele extrase din documentele tale cu definițiile oficiale ale Comisiei Europene pentru fiecare TRL. Justificăm fiecare punct cu citate din documentul tău.' },
      { q: 'Diferă scala TRL între programe?', a: 'Da. Scala UE (1–9) e standard, dar interpretarea variază — EIC e mai strict pe validare comercială, ARC mai strict pe rigoarea științifică. Raportul nostru detaliază.' },
      { q: 'Estimezi și TRL pentru servicii software (SaaS)?', a: 'Da. Folosim definiția adaptată pentru software/digital, unde TRL 7+ înseamnă deployment în producție cu utilizatori reali.' },
      { q: 'Pot să urc de la TRL 4 la 7 în 6 luni?', a: 'Posibil dar rar — depinde de pivot, validări de piață și buget. Raportul îți oferă roadmap-ul cu milestone-urile clare.' },
    ],
  },
  {
    id: 'cons',
    n: '05',
    code: 'CONSORTIUM-MATCH',
    name: 'Identificare consorțiu',
    tag: 'Parteneri & roluri',
    formats: 'Horizon · EIC · Pathfinder',
    desc: 'Pentru granturi colaborative, eligibil.org te ajută să identifici ce tipuri de parteneri îți lipsesc: universități, institute de cercetare, companii, IMM-uri, acceleratoare, autorități publice sau organizații sectoriale.',
    deliver: [
      'profil ideal de consorțiu',
      'roluri lipsă',
      'recomandări de parteneri',
      'țări relevante',
      'justificare pentru fiecare partener',
      'strategie de contact și colaborare',
    ],
    cta: 'Găsește parteneri',
    thumb: 'circles',
    descLong: 'Granturile colaborative europene (Horizon Europe, EIC Pathfinder, EUREKA, Eurostars) cer consorții de 3–6 parteneri din țări diferite, cu roluri complementare. Pe baza sectorului tău, țării, TRL-ului și obiectivelor proiectului, recomandăm profilul ideal de consorțiu, identificăm rolurile lipsă și sugerăm parteneri concreți din rețeaua noastră de universități, RTO-uri, IMM-uri și acceleratoare verificate.',
    interactive: true,
    acceptMime: '',
    acceptHint: 'Completează formularul — fără upload',
    maxMb: 0,
    faq: [
      { q: 'E necesar să am parteneri înainte să aplic?', a: 'Pentru majoritatea programelor colaborative — da. Recomandăm formarea consorțiului cu 6–9 luni înainte de deadline.' },
      { q: 'Cât costă să găsești parteneri?', a: 'Recomandările de bază sunt gratuite. Pentru introduceri facilitate prin eligibil.org, oferim un plan separat.' },
      { q: 'Acoperiți și parteneri din afara UE?', a: 'Da. Pentru programe ca Horizon Europe Associated Countries, includem parteneri din Moldova, Ucraina, Turcia, UK, Israel etc.' },
      { q: 'Ce e un "RTO" și de ce am nevoie de unul?', a: 'Research and Technology Organization (Fraunhofer, TNO, CEA, …). Majoritatea grant-urilor R&D cer cel puțin un RTO sau universitate ca partener cu credibilitate științifică.' },
      { q: 'Pot lista propriul startup pentru ca alții să mă găsească?', a: 'Da. Înregistrează-te și marchează profilul ca "deschis pentru consorții" — vei apărea în recomandările altor aplicanți.' },
    ],
  },
];

/* ---------- Deadline cards (section 4) ---------- */
const ORG_DEADLINES = [
  {
    name: 'EIC Accelerator 2026 — Cut-off Mai',
    region: 'Uniunea Europeană',
    flag: '🇪🇺',
    type: 'Grant + equity opțional',
    amount: 'până la €2.5M',
    fit: 'Deep tech · AI · Biotech · Climate tech',
    trl: 'TRL 6–8',
    deadline: '15 Mai 2026',
    days: 23,
    status: 'live',
    sectors: ['AI', 'Deep Tech', 'Biotech'],
  },
  {
    name: 'NSF SBIR Phase I',
    region: 'SUA',
    flag: '🇺🇸',
    type: 'Grant non-dilutiv',
    amount: 'până la $275K',
    fit: 'R&D · Deep tech · Hardware · AI',
    trl: 'TRL 3–5',
    deadline: '5 Iunie 2026',
    days: 44,
    status: 'live',
    sectors: ['R&D', 'Deep Tech', 'Hardware'],
  },
  {
    name: 'Google for Startups — AI Accelerator',
    region: 'Global',
    flag: '🌐',
    type: 'Accelerator non-dilutiv',
    amount: 'cloud credits + mentorat',
    fit: 'AI · SaaS · ML infrastructure',
    trl: 'orice stadiu',
    deadline: 'Rolling',
    days: null,
    status: 'live',
    sectors: ['AI', 'SaaS'],
  },
  {
    name: 'Startup Moldova 2026',
    region: 'Moldova',
    flag: '🇲🇩',
    type: 'Grant / program startup',
    amount: 'până la 200.000 MDL',
    fit: 'Early-stage · Founder rezident MD',
    trl: 'TRL 2–5',
    deadline: '30 Iulie 2026',
    days: 99,
    status: 'live',
    sectors: ['Early-stage'],
  },
  {
    name: 'Horizon Europe — Cluster Health',
    region: 'Uniunea Europeană',
    flag: '🇪🇺',
    type: 'Grant colaborativ · consorțiu',
    amount: '€3M – €8M / consorțiu',
    fit: 'Biotech · Health · Research · Medtech',
    trl: 'TRL 4–7',
    deadline: '12 Sep 2026',
    days: 142,
    status: 'soon',
    sectors: ['Biotech', 'Health', 'Research'],
  },
];

/* ---------- Document generation blocks (section 8) ---------- */
const ORG_DOCGEN = [
  {
    n: '01',
    name: 'Rescriere pitch deck',
    desc: 'Pitch deck optimizat pentru programul selectat. Slide cu slide sau integral, păstrând tonul fondatorului.',
    cta: 'Generează pitch deck',
    sample: 'PITCH-V2.pptx · 14 slide · EIC tonality',
  },
  {
    n: '02',
    name: 'Aplicație grant completă',
    desc: 'Executive summary, obiective, metodologie, impact, work packages, buget, echipă, riscuri și anexe.',
    cta: 'Generează aplicație',
    sample: 'GRANT-PACK.zip · 11 documente · 84 pag.',
  },
  {
    n: '03',
    name: 'Whitepaper tehnic',
    desc: 'Structură tehnică pentru EIC, Horizon, R&D grants, cu TRL, IP, metodologie și argument științific.',
    cta: 'Generează whitepaper',
    sample: 'WP-TECH.pdf · 8 pag. · IEEE-style',
  },
  {
    n: '04',
    name: 'Business plan & model financiar',
    desc: 'Proiecții, costuri, venituri, runway, break-even, scenarii și justificare financiară.',
    cta: 'Generează business plan',
    sample: 'BP-FIN.xlsx + BP.pdf · 3 scenarii',
  },
  {
    n: '05',
    name: 'Strategie de consorțiu',
    desc: 'Roluri, parteneri, țări, justificare, mesaj de contact și pași de construire a consorțiului.',
    cta: 'Construiește consorțiu',
    sample: 'CONS-PLAN.pdf · 6 roluri · 12 organizații',
  },
];

/* ---------- Upload artifact cards (section 9) ---------- */
const ORG_UPLOADS = [
  {
    n: '01', kind: 'Pitch Deck', icon: 'deck',
    fmt: 'PDF / PPTX · max. 30 slide-uri',
    cta: 'Încarcă pitch deck',
    note: 'recomandat 10–15 slide-uri',
  },
  {
    n: '02', kind: 'Video Pitch', icon: 'video',
    fmt: 'MP4 / MOV · max. 3 minute',
    cta: 'Încarcă video',
    note: 'AI transcriere + analiză tonalitate',
  },
  {
    n: '03', kind: 'Whitepaper', icon: 'doc',
    fmt: 'PDF / DOCX · max. 10 pagini',
    cta: 'Încarcă whitepaper',
    note: 'pentru deep tech & R&D',
  },
  {
    n: '04', kind: 'Formular minim', icon: 'form',
    fmt: 'Nu ai documente? 12 întrebări · 3 min',
    cta: 'Completează formular',
    note: 'pornește de la idee',
  },
];

/* ---------- Verticals catalog (section 11) — 11 categories ---------- */
const ORG_VERTICALS = [
  { id: 'ai',      name: 'AI & Machine Learning',     n: 142, range: '€5K – €2.5M',  desc: 'Granturi, acceleratoare și programe pentru AI, ML, computer vision, NLP, automation și AI infrastructure.', thumb: 'grid' },
  { id: 'bio',     name: 'Biotech & Health',          n: 98,  range: '€10K – €17.5M', desc: 'Finanțări pentru medtech, biotech, healthtech, diagnostic, cercetare clinică și soluții medicale digitale.', thumb: 'circles' },
  { id: 'climate', name: 'Climate & Sustainability',  n: 87,  range: '€15K – €5M',   desc: 'Granturi și programe pentru energie verde, sustenabilitate, circular economy, ESG și climate tech.', thumb: 'stacks' },
  { id: 'fin',     name: 'Fintech',                   n: 76,  range: '€25K – €3M',   desc: 'Programe pentru plăți, banking, regtech, insurtech, embedded finance și infrastructură financiară.', thumb: 'bars' },
  { id: 'edu',     name: 'EdTech',                    n: 54,  range: '€10K – €800K', desc: 'Oportunități pentru educație digitală, training, reskilling, learning platforms și soluții pentru școli.', thumb: 'cross' },
  { id: 'deep',    name: 'Deep Tech',                 n: 112, range: '€50K – €15M',  desc: 'Finanțări pentru tehnologii avansate, R&D, hardware, materiale, robotics, spinout-uri și IP tehnologic.', thumb: 'hex' },
  { id: 'hw',      name: 'Hardware & IoT',            n: 63,  range: '€20K – €4M',   desc: 'Granturi și acceleratoare pentru dispozitive, senzori, edge computing, robotics și infrastructură conectată.', thumb: 'diag' },
  { id: 'soc',     name: 'Social Impact',             n: 45,  range: '€5K – €500K',  desc: 'Programe pentru incluziune, educație, sănătate, comunități vulnerabile și impact social măsurabil.', thumb: 'ring' },
  { id: 'agri',    name: 'AgriFood',                  n: 34,  range: '€15K – €1.2M', desc: 'Finanțări pentru agricultură, foodtech, lanțuri de aprovizionare, procesare și tehnologii agricole.', thumb: 'triangle' },
  { id: 'space',   name: 'Space & Aerospace',         n: 21,  range: '€100K – €10M', desc: 'Granturi și programe pentru spațiu, sateliți, aerospace, defense dual-use și infrastructură tehnologică.', thumb: 'dots' },
  { id: 'mar',     name: 'Maritime & Logistics',      n: 19,  range: '€20K – €3M',   desc: 'Finanțări pentru transport, logistică, maritime, supply chain și infrastructură operațională.', thumb: 'bisect' },
];

/* ---------- Sample report data (section 10) ---------- */
const ORG_SAMPLE = {
  startup: 'AxonAI Labs',
  sector: 'AI & Machine Learning · Computer Vision',
  trl: 4,
  trlNote: 'prototip de laborator',
  stage: 'early-stage · pre-seed',
  region: 'Moldova + România',
  team: '3 fondatori',
  ask: '€150K – €500K',
  capital: 'grant non-dilutiv',
  consortium: 'deschis · neformat',
  rows: [
    { name: 'EIC Accelerator',         flag: '🇪🇺', region: 'UE',      match: 82, ready: 58, conf: 88, action: 'Plan pregătire',     hot: true },
    { name: 'NSF SBIR Phase I',        flag: '🇺🇸', region: 'SUA',     match: 78, ready: 68, conf: 90, action: 'Buget + partener',   hot: false },
    { name: 'Google for Startups AI',  flag: '🌐', region: 'Global',  match: 85, ready: 82, conf: 92, action: 'Aplică acum',        hot: true },
    { name: 'Startup Moldova',         flag: '🇲🇩', region: 'Moldova', match: 74, ready: 88, conf: 85, action: 'Aplică acum',        hot: false },
    { name: 'Horizon Pathfinder',      flag: '🇪🇺', region: 'UE',      match: 72, ready: 35, conf: 78, action: 'Caută consorțiu',    hot: false },
  ],
  actions: [
    'Rescrie pitch deck pentru EIC',
    'Generează aplicația pentru accelerator',
    'Evaluează TRL-ul real',
    'Găsește parteneri pentru consorțiu',
    'Setează alertă pentru programe cu match peste 80',
  ],
};

/* ---------- News (section 12.2) ---------- */
const ORG_NEWS = [
  { tag: 'POLICY',  date: '12 Mai 2026', title: 'Noi apeluri Horizon Europe deschise pentru startupuri și consorții', src: 'Comisia Europeană' },
  { tag: 'PROGRAM', date: '08 Mai 2026', title: 'Programe noi pentru digitalizare și AI în Europa de Est',          src: 'DG CONNECT' },
  { tag: 'REGION',  date: '03 Mai 2026', title: 'Granturi regionale pentru startupuri din Moldova și România',      src: 'eligibil insights' },
  { tag: 'GLOBAL',  date: '28 Apr 2026', title: 'Acceleratoare internaționale cu aplicare deschisă în mai 2026',    src: 'eligibil insights' },
  { tag: 'DEEP',    date: '21 Apr 2026', title: 'Actualizări despre fonduri non-dilutive pentru deep tech',         src: 'EIC Council' },
];

/* ---------- Startups list (section 12.4) ---------- */
const ORG_STARTUPS = [
  { name: 'AxonAI Labs',        flag: '🇲🇩', vert: 'AI · CV',         stage: 'MVP',     trl: 4, looking: 'Grant',         ask: '€150K–€500K', cons: 'open' },
  { name: 'Verdara',            flag: '🇷🇴', vert: 'Climate',         stage: 'Pilot',   trl: 5, looking: 'Grant + equity', ask: '€500K–€1M',   cons: 'forming' },
  { name: 'Heliometric',        flag: '🇺🇦', vert: 'Space',           stage: 'R&D',     trl: 3, looking: 'Grant R&D',     ask: '€250K–€800K', cons: 'open' },
  { name: 'OrbitMed',           flag: '🇷🇴', vert: 'Biotech',         stage: 'Early',   trl: 4, looking: 'Non-dilutiv',   ask: '€300K',       cons: 'closed' },
  { name: 'Tarna Tools',        flag: '🇲🇩', vert: 'SaaS · DevTools', stage: 'Growth',  trl: 7, looking: 'Accelerator',   ask: '—',            cons: '—' },
  { name: 'Polypath Materials', flag: '🇧🇬', vert: 'Deep Tech',       stage: 'R&D',     trl: 3, looking: 'Grant + IP',    ask: '€600K',       cons: 'open' },
];

/* ---------- Reports list (section 13) — re-using cover thumbs ---------- */
const ORG_REPORTS = [
  { title: 'Piața granturilor din Moldova și România',        desc: 'Analiză a ecosistemului de finanțare non-dilutivă, programe active, tendințe și previziuni.', pages: 48, kind: 'Market report', thumb: 'bars' },
  { title: 'Ghidul complet Horizon Europe pentru startupuri', desc: 'Structura programelor, consorții, bugete eligibile, criterii de evaluare și greșeli comune.',   pages: 76, kind: 'Playbook',      thumb: 'grid' },
  { title: 'SBIR Roadmap',                                    desc: 'Cum pot startupurile din afara SUA să colaboreze cu entități americane pentru SBIR / STTR.',   pages: 32, kind: 'Roadmap',       thumb: 'cross' },
  { title: 'Deep Tech în Europa de Est',                      desc: 'Profil de piață, granturi, investitori, TRL benchmarks și exemple de startupuri.',             pages: 54, kind: 'Industry',      thumb: 'hex' },
];

/* ---------- Verified partners (section 14) ---------- */
const ORG_PARTNERS = [
  { name: 'Upcelerator',          type: 'Accelerator',   region: 'Moldova',  flag: '🇲🇩', desc: 'Accelerator regional pentru startupuri early-stage din MD și RO, cu focus pe AI și SaaS.', tags: ['AI', 'SaaS', 'Early'], verified: true, thumb: 'grid' },
  { name: 'TechAngels CEE',       type: 'Fond',          region: 'România',  flag: '🇷🇴', desc: 'Rețea de business angels din Europa Centrală și de Est, investiții pre-seed și seed.',     tags: ['Pre-seed', 'Seed'],   verified: true, thumb: 'dots' },
  { name: 'EIT Health Hub',       type: 'Program public',region: 'UE',       flag: '🇪🇺', desc: 'Program european pentru startupuri în health & biotech, granturi colaborative și mentorat.', tags: ['Health', 'Biotech'],   verified: true, thumb: 'circles' },
  { name: 'Politehnica Bucharest',type: 'Universitate',  region: 'România',  flag: '🇷🇴', desc: 'Universitate tehnică, spinout-uri deep tech, parteneriate pentru granturi Horizon.',       tags: ['Deep Tech', 'R&D'],   verified: true, thumb: 'hex' },
  { name: 'IT Park Moldova',      type: 'Hub',           region: 'Moldova',  flag: '🇲🇩', desc: 'Parc tehnologic cu rezidență fiscală preferențială pentru companii IT și deep tech.',     tags: ['IT', 'Tax'],          verified: true, thumb: 'squareNest' },
  { name: 'Climate-KIC',          type: 'Program',       region: 'UE',       flag: '🇪🇺', desc: 'Cea mai mare comunitate de inovație climatică din UE, granturi și acceleratoare green tech.', tags: ['Climate', 'Green'],   verified: true, thumb: 'stacks' },
];

/* ---------- Blog posts (section 12.1) ---------- */
const ORG_POSTS = [
  { cat: 'GRANTS',     time: '8 min',  date: '10 Mai 2026', title: 'EIC Accelerator 2026: ce trebuie să pregătească startupurile deep tech',     desc: 'Ghid practic pentru cut-off-urile din 2026 — TRL, consorțiu, financials, IP, timeline.', thumb: 'grid' },
  { cat: 'SBIR',       time: '6 min',  date: '02 Mai 2026', title: 'Cum accesezi finanțare SBIR dacă ești startup din Moldova sau România',     desc: 'Strategii de colaborare cu entități SUA, prime contractor, dual entity setup.',           thumb: 'cross' },
  { cat: 'PITCH',      time: '5 min',  date: '24 Apr 2026', title: 'Cum construiești un pitch deck pentru granturi, nu doar pentru investitori', desc: 'Diferențe de tonalitate, structură, KPI-uri și ce caută evaluatorii vs. VC-iștii.',       thumb: 'bars' },
  { cat: 'HORIZON',    time: '10 min', date: '15 Apr 2026', title: 'Cele mai frecvente greșeli în aplicațiile Horizon Europe',                  desc: 'Eligibilitate, work packages, buget, impact — 12 capcane pe care le repară AI-ul nostru.', thumb: 'hex' },
];

/* ---------- FAQ (section 17) ---------- */
const ORG_FAQS = [
  { q: 'Ce este eligibil.org?',
    a: 'eligibil.org este o platformă care ajută startupurile să găsească surse de finanțare relevante și să înțeleagă cât de pregătite sunt pentru a aplica. Platforma combină un catalog de oportunități cu analiză AI pentru pitch, video, whitepaper, TRL și consorții.' },
  { q: 'Este gratuit?',
    a: 'Catalogul poate fi explorat gratuit. Funcțiile avansate de analiză, generare de documente, monitorizare și potrivire pot fi oferite în planuri separate sau în beta.' },
  { q: 'Ce pot încărca pentru analiză?',
    a: 'Poți încărca pitch deck (PDF/PPTX), video pitch (MP4/MOV, max 3 min), whitepaper (PDF/DOCX) sau poți completa un formular scurt despre startup.' },
  { q: 'Ce este Match Score?',
    a: 'Match Score arată cât de bine se potrivește startupul tău cu cerințele unui program de finanțare — sector, stadiu, TRL, geografie, sume.' },
  { q: 'Ce este Readiness Score?',
    a: 'Readiness Score arată cât de pregătit este dosarul tău pentru aplicare și ce documente sau informații lipsesc din pachet.' },
  { q: 'Ce este Confidence Score?',
    a: 'Confidence Score arată cât de sigure sunt datele pe baza cărora a fost făcută analiza — cu cât încarci mai multe artefacte, cu atât crește.' },
  { q: 'Pot identifica parteneri pentru consorțiu?',
    a: 'Da. eligibil.org poate recomanda tipuri de parteneri și organizații relevante pentru programe colaborative precum Horizon Europe sau EIC Pathfinder.' },
  { q: 'Datele mele sunt protejate?',
    a: 'Da. Documentele încărcate sunt folosite pentru analiză și nu sunt partajate public fără acordul tău. Nu antrenăm modele AI cu datele tale.' },
  { q: 'Pot lista un program sau accelerator?',
    a: 'Da. Organizațiile pot crea profil de partener și pot lista programe, fonduri sau apeluri active. Profilele verificate primesc badge dedicat.' },
];

window.ORG_PRODUCTS = ORG_PRODUCTS;
window.ORG_DEADLINES = ORG_DEADLINES;
window.ORG_DOCGEN = ORG_DOCGEN;
window.ORG_UPLOADS = ORG_UPLOADS;
window.ORG_VERTICALS = ORG_VERTICALS;
window.ORG_SAMPLE = ORG_SAMPLE;
window.ORG_NEWS = ORG_NEWS;
window.ORG_STARTUPS = ORG_STARTUPS;
window.ORG_REPORTS = ORG_REPORTS;
window.ORG_PARTNERS = ORG_PARTNERS;
window.ORG_POSTS = ORG_POSTS;
window.ORG_FAQS = ORG_FAQS;
