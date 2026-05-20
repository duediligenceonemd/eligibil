'use strict';

(function () {
  if (window.__homepageEnFixLoaded) return;
  window.__homepageEnFixLoaded = true;

  const EXACT_REPLACEMENTS = new Map([
    ['735 surse В· 5 produse AI В· actualizat acum 2 minute', '735 sources В· 5 AI products В· updated 2 minutes ago'],
    ['Populare', 'Popular'],
    ['Sau Г®ncarcДѓ deck-ul direct mai jos', 'Or upload your deck directly below'],
    ['Live В· ecosistem eligibil.org', 'Live В· eligibil.org ecosystem'],
    ['analizate astДѓzi', 'analyzed today'],
    ['programe noi В· 7 zile', 'new programs В· 7 days'],
    ['produse AI active', 'active AI products'],
    ['Activitate recentДѓ', 'Recent activity'],
    ['EIC Pathfinder В· call deschis', 'EIC Pathfinder В· open call'],
    ['SBIR Phase I В· 44 zile', 'SBIR Phase I В· 44 days'],
    ['analizДѓ', 'analysis'],
    ['AxonAI Labs В· TRL 4 estimat', 'AxonAI Labs В· estimated TRL 4'],
    ['verif', 'verify'],
    ['Startup Moldova В· deadline confirmat', 'Startup Moldova В· deadline confirmed'],
    ['Surse de finanИ›are verificate', 'Verified funding sources'],
    ['Programe europene', 'European programs'],
    ['Granturi internaИ›ionale', 'International grants'],
    ['Fonduri & acceleratoare', 'Funds & accelerators'],
    ['4 limbi disponibile', '4 languages available'],
    ['02 вЂ” Termene importante', '02 вЂ” Important deadlines'],
    ['Deadline-uri apropiate', 'Upcoming deadlines'],
    ['Programe active И™i oportunitДѓИ›i cu deadline-uri importante. Actualizate И™i verificate periodic.', 'Active programs and opportunities with important deadlines. Updated and checked regularly.'],
    ['Vezi calendar complet в†’', 'See full calendar →'],
    ['Activ', 'Active'],
    ['ГЋn curГўnd', 'Coming soon'],
    ['ГЋnchis', 'Closed'],
    ['Tip', 'Type'],
    ['SumДѓ', 'Amount'],
    ['Potrivit', 'Fit'],
    ['CautДѓ', 'Search'],
    ['Capital non-dilutiv RO', 'Non-dilutive capital RO'],
    ['Granturi AI Moldova', 'AI Moldova Grants'],
    ['AnalizeazДѓ startupul meu в†“', 'Analyze my startup ↓'],
    ['03 вЂ” Analiza AI В· 90 secunde', '03 — AI Analysis · 90 seconds'],
    ['ГЋncarcДѓ. AnalizeazДѓ. AflДѓ exact unde eИ™ti ', 'Upload. Analyze. Find out exactly where you are '],
    ['ObИ›ine scorul tДѓu de eligibilitate Г®n 90 de secunde', 'Get your eligibility score in 90 seconds'],
    ['min. 1 necesar', 'min. 1 required'],
    ['gata pentru analizДѓ', 'ready for analysis'],
    ['profil complet В· maxim confidence', 'complete profile · maximum confidence'],
    ['pentru a Г®ncepe', 'to start'],
    ['Datele tale nu sunt partajate В· nu antrenДѓm modele AI pe ele', 'Your data is not shared · we do not train AI models on it'],
    ['completeazДѓ formularul minim (30s)', 'fill out the minimum form (30s)'],
    ['Cu cГўt mai multe artefacte Г®ncarci, cu atГўt creИ™te Confidence Score-ul analizei.', 'The more artifacts you upload, the more the analysis Confidence Score increases.'],
    ['Un singur document este suficient pentru a Г®ncepe вЂ” sistemul Г®И›i spune explicit ce cГўИ™tigi adДѓugГўnd urmДѓtorul.', 'A single document is enough to get started — the system explicitly tells you what you gain by adding the next one.'],
    ['Nu ai documente pregДѓtite?', "Don't have your documents ready?"],
    ['12 Г®ntrebДѓri В· 3 minute В· porneИ™te de la idee sau MVP', '12 questions · 3 minutes · starts from the idea or MVP'],
    ['CompleteazДѓ formular minim в†’', 'Fill out the minimum form →'],
    ['04 вЂ” Raportul tДѓu', '04 — Your report'],
    ['IatДѓ ce primeИ™ti dupДѓ analizДѓ.', "Here's what you get after the analysis."],
    ['Un raport clar, structurat И™i orientat spre acИ›iune. Nu doar scoruri, ci paИ™i concreИ›i pentru a aplica mai bine.', 'A clear, structured, and action-oriented report. Not just scores, but concrete steps to help you apply better.'],
    ['Raport startup В· exemplu', 'Startup report · example'],
    ['JurisdicИ›ie', 'Jurisdiction'],
    ['EchipДѓ', 'Team'],
    ['ConsorИ›iu', 'Consortium'],
    ['deschis В· neformat', 'open · not formed'],
    ['Regiune', 'Region'],
    ['Buget + partener в†’', 'Budget + partner →'],
    ['05 вЂ” Produse AI', '05 — AI Products'],
    ['produse AI В· beta gratuitДѓ', 'AI products · free beta'],
    ['07 вЂ” Programe deschise', '07 — Open programs'],
    ['Programe deschise pentru aplicare.', 'Programs open for application.'],
    ['Cele mai recente programe verificate Г®n baza eligibil.org. Actualizate periodic И™i disponibile cu analizДѓ AI de pregДѓtire.', 'The latest programs verified on eligibil.org. Regularly updated and available with AI readiness analysis.'],
    ['Toate', 'All'],
    ['AplicanИ›i tipici', 'Typical applicants'],
    ['Vezi detalii в†’', 'See details →'],
    ['AnalizeazДѓ И™ansele', 'Analyze the chances'],
    ['Vezi toate programele deschise в†’', 'See all open programs →'],
    ['09 вЂ” Despre eligibil.org', '09 — About eligibil.org'],
    ['Misiune', 'Mission'],
    ['Cu eligibil.org poИ›i', 'With eligibil.org you can'],
    ['Ce face eligibil.org', 'What eligibil.org does'],
    ['Pentru cine este', 'Who it is for'],
    ['10 вЂ” Verified partners', '10 — Verified partners'],
    ['Vezi profil', 'View profile'],
    ['ListeazДѓ organizaИ›ia ta в†’', 'List your organization →'],
    ['Vezi toИ›i partenerii (60+) в†’', 'See all partners (60+) →'],
    ['11 вЂ” Resurse', '11 — Resources'],
    ['Lista startupuri', 'Startup list'],
    ['8 min citire', '8 min read'],
    ['6 min citire', '6 min read'],
    ['5 min citire', '5 min read'],
    ['10 min citire', '10 min read'],
    ['Vezi blogul в†’', 'See the blog →'],
    ['12 вЂ” Knowledge hub', '12 — Knowledge hub'],
    ['Vezi toate rapoartele в†’', 'See all reports →'],
    ['pagini', 'pages'],
    ['DescarcДѓ raport', 'Download report'],
    ['13 вЂ” Data quality', '13 — Data quality'],
    ['Feedback comunitate', 'Community feedback'],
    ['14 вЂ” ГЋntrebДѓri frecvente', '14 — Frequently Asked Questions'],
    ['ГЋntrebДѓri frecvente.', 'Frequently asked questions.'],
    ['Despre platformДѓ, scoruri, upload, securitate И™i planuri.', 'About the platform, scores, upload, security, and plans.'],
    ['15 вЂ” ГЋncepe acum', '15 — Start now'],
    ['ГЋncepe cu startupul tДѓu. AflДѓ unde eИ™ti eligibil.', 'Start with your startup. Find out where you are eligible.'],
    ['CautДѓ finanИ›are в†’', 'Search for funding →'],
    ['AnalizeazДѓ startupul meu', 'Analyze my startup'],
    ['ListeazДѓ un program', 'List a program'],
    ['ГЋncepe aici', 'Start here'],
    ['Produse', 'Products'],
    ['AnalizДѓ pitch', 'Pitch analysis'],
    ['AnalizДѓ video', 'Video analysis'],
    ['AnalizДѓ whitepaper', 'Whitepaper analysis'],
    ['Evaluare TRL', 'TRL assessment'],
    ['Identificare consorИ›iu', 'Consortium identification'],
    ['Иtiri', 'News'],
    ['Rapoarte & whitepapers', 'Reports & whitepapers'],
    ['Glosar de finanИ›are', 'Funding glossary'],
    ['Video & webinarii', 'Video & webinars'],
    ['Calitatea datelor', 'Data quality'],
    ['Scrie pentru noi', 'Write for us'],
  ]);

  const SUBSTRING_REPLACEMENTS = [
    ['DescoperДѓ cele mai bune surse de finanИ›are pentru', 'Discover the best funding sources for'],
    ['startupul tДѓu.', 'your startup.'],
    ['Agregatorul de granturi, competiИ›ii И™i capital non-dilutiv', 'The aggregator of grants, competitions, and non-dilutive capital'],
    ['pentru Moldova, RomГўnia И™i Europa de Est.', 'for Moldova, Romania, and Eastern Europe.'],
    ['Peste 735 de oportunitДѓИ›i verificate, actualizate zilnic, cu analizДѓ AI de pregДѓtire pentru fiecare.', 'Over 735 verified opportunities, updated daily, with AI readiness analysis for each one.'],
    ['eligibil.org analizeazДѓ artefactele startupului tДѓu', 'eligibil.org analyzes your startup artifacts'],
    ['identificДѓ automat TRL-ul', 'automatically identifies the TRL'],
    ['calculeazДѓ scorul de potrivire', 'calculates the match score'],
    ['surse de finanИ›are', 'funding sources'],
    ['И™i Г®И›i livreazДѓ un plan concret pentru a deveni eligibil.', 'and gives you a concrete plan to become eligible.'],
    ['artefacte', 'artifacts'],
    ['ГЋncДѓrcat', 'Uploaded'],
    ['OpИ›ional', 'Optional'],
    ['ГЋncarcДѓ fiИ™ier sau trage aici', 'Upload file or drag here'],
    ['SchimbДѓ fiИ™ierul', 'Replace file'],
    ['max 10 pagini', 'max 10 pages'],
    ['Top programe recomandate', 'Top recommended programs'],
    ['CГўt de bine se potriveИ™te startupul cu programul selectat.', 'How well the startup fits the selected program.'],
    ['CГўt de pregДѓtitДѓ este aplicaИ›ia И™i ce documente lipsesc.', 'How ready the application is and which documents are missing.'],
    ['CГўt de sigure sunt datele pe baza cДѓrora s-a fДѓcut analiza.', 'How reliable the data behind the analysis is.'],
    ['Document tehnic', 'Technical document'],
    ['Whitepaper tehnic', 'Technical whitepaper'],
    ['Rapoarte, whitepapers И™i insights despre piaИ›a finanИ›Дѓrii.', 'Reports, whitepapers, and insights about the funding market.'],
    ['Analize aprofundate realizate de echipa eligibil.org И™i parteneri, disponibile pentru fondatori, cercetДѓtori, acceleratoare И™i instituИ›ii.', 'In-depth analyses produced by the eligibil.org team and partners, available to founders, researchers, accelerators, and institutions.'],
    ['Acceleratoarele, fondurile И™i instituИ›iile care construiesc ecosistemul.', 'The accelerators, funds, and institutions that build the ecosystem.'],
    ['Partenerii eligibil.org sunt organizaИ›ii care susИ›in startupurile prin finanИ›are, mentorat, programe, infrastructurДѓ, cercetare sau acces la reИ›ele internaИ›ionale.', 'eligibil.org partners are organizations that support startups through funding, mentoring, programs, infrastructure, research, or access to international networks.'],
    ['Zero linkuri moarte. Zero informaИ›ii expirate. Zero oportunitДѓИ›i neverificate.', 'Zero dead links. Zero expired information. Zero unverified opportunities.'],
    ['Un singur deadline greИ™it sau un criteriu expirat poate face un fondator sДѓ piardДѓ timp critic.', 'A single wrong deadline or expired criterion can make a founder lose critical time.'],
    ['De aceea, eligibil.org foloseИ™te un sistem de verificare continuДѓ a surselor.', 'That is why eligibil.org uses a system of continuous source verification.'],
    ['Verificare automatДѓ', 'Automatic verification'],
    ['Verificare manualДѓ', 'Manual verification'],
    ['Agregatorul de finanИ›are pentru startupuri, cercetДѓtori И™i fondatori din Europa de Est.', 'The funding aggregator for startups, researchers, and founders in Eastern Europe.'],
    ['eligibil.org reduce distanИ›a dintre startupuri И™i finanИ›area potrivitДѓ.', 'eligibil.org reduces the distance between startups and the right funding.'],
    ['Fondatorii pierd prea mult timp cДѓutГўnd granturi, citind PDF-uri lungi, verificГўnd criterii И™i Г®ncercГўnd sДѓ Г®nИ›eleagДѓ dacДѓ au И™anse reale.', 'Founders lose too much time searching for grants, reading long PDFs, checking criteria, and trying to understand whether they have a real chance.'],
    ['Noi transformДѓm acest proces Г®ntr-un flux clar: cauИ›i, analizezi, Г®nИ›elegi ce lipseИ™te, aplici mai bine.', 'We turn this process into a clear flow: search, analyze, understand what is missing, apply better.'],
    ['SДѓ facem finanИ›area non-dilutivДѓ mai accesibilДѓ pentru startupurile din Moldova, RomГўnia И™i Europa de Est.', 'To make non-dilutive funding more accessible to startups in Moldova, Romania, and Eastern Europe.'],
    ['startupuri', 'startups'],
    ['cercetДѓtori', 'researchers'],
    ['fondatori', 'founders'],
    ['fonduri', 'funds'],
    ['instituИ›ii publice', 'public institutions'],
    ['programe de finanИ›are', 'funding programs'],
    ['CautДѓ surse de finanИ›are', 'Search funding sources'],
    ['AnalizeazДѓ startupul', 'Analyze the startup'],
    ['ListeazДѓ startupul', 'List the startup'],
  ];

  const VISIBLE_EXACT_REPLACEMENTS = new Map([
    ['Catalog finanțări', 'Funding catalog'],
    ['Produse ▾', 'Products ▾'],
    ['Vezi detalii →', 'See details →'],
    ['LISTA STARTUPURI', 'STARTUP LIST'],
    ['PRODUSE', 'PRODUCTS'],
    ['Evaluare TRL', 'TRL assessment'],
    ['Metodologie', 'Methodology'],
    ['Calitatea datelor', 'Data quality'],
    ['MISIUNE', 'MISSION'],
    ['05 — PRODUSE AI', '05 — AI PRODUCTS'],
    ['Deadline-uri apropiate', 'Upcoming deadlines'],
    ['FONDURI & ACCELERATOARE', 'FUNDS & ACCELERATORS'],
    ['4 LIMBI DISPONIBILE', '4 LANGUAGES AVAILABLE'],
    ['DOCUMENT TEHNIC', 'TECHNICAL DOCUMENT'],
    ['estimare TRL', 'TRL estimate'],
    ['TRL estimat (1–9)', 'Estimated TRL (1–9)'],
    ['PARTNERS & ROLURI', 'PARTNERS & ROLES'],
    ['WITH ELIGIBLIJ.ORG YOU CAN', 'WITH ELIGIBIL.ORG YOU CAN'],
  ]);

  const VISIBLE_SUBSTRING_REPLACEMENTS = [
    ['735 SURSE · 5 PRODUSE AI · ACTUALIZAT ACUM 2 MINUTE', '735 SOURCES · 5 AI PRODUCTS · UPDATED 2 MINUTES AGO'],
    ['Descoperă cele mai bune surse de finanțare pentru startupul tău.', 'Discover the best funding sources for your startup.'],
    ['Agregatorul de grants, competiții and capital non-dilutiv pentru Moldova, Romania and Europa de Est.', 'The aggregator of grants, competitions, and non-dilutive capital for Moldova, Romania, and Eastern Europe.'],
    ['Peste 735 de verified opportunities, actualizate zilnic, cu analysis AI de pregătire pentru fiecare.', 'Over 735 verified opportunities, updated daily, with AI readiness analysis for each one.'],
    ['Agregatorul de granturi, competiții și capital non-dilutiv pentru Moldova, România și Europa de Est.', 'The aggregator of grants, competitions, and non-dilutive capital for Moldova, Romania, and Eastern Europe.'],
    ['Peste 735 de oportunități verificate, actualizate zilnic, cu analiză AI de pregătire pentru fiecare.', 'Over 735 verified opportunities, updated daily, with AI readiness analysis for each one.'],
    ['fill out the form in minimum (30s)', 'fill out the minimum form (30s)'],
    ['For deep tech startups, researchers and spinouts, eligibil.org analyzes the technical whitepaper, methodology, TRL level, intellectual property, impact, risks and compatibility with programs such as EIC, Horizon Europe, Pathfinder or R&D grants.', 'For deep tech startups, researchers, and spinouts, eligibil.org analyzes the technical whitepaper, methodology, TRL level, intellectual property, impact, risks, and fit with programs such as EIC, Horizon Europe, Pathfinder, or R&D grants.'],
    ['eligib.org estimates your startup\'s Technology Readiness Level based on uploaded documents, product description, prototype, technical validations, and existing traction.', 'eligibil.org estimates your startup\'s Technology Readiness Level based on uploaded documents, product description, prototype, technical validation, and existing traction.'],
    ['The funding aggregator for startups, researchers and founders in Eastern Europe.', 'The funding aggregator for startups, researchers, and founders in Eastern Europe.'],
    ['The accelerators, funds and institutions that build the ecosystem.', 'The accelerators, funds, and institutions that build the ecosystem.'],
    ['Reports, whitepapers and insights about the financing market.', 'Reports, whitepapers, and insights about the funding market.'],
  ];

  function replaceText(text) {
    let next = text;
    const trimmed = next.trim();

    if (EXACT_REPLACEMENTS.has(trimmed)) {
      return next.replace(trimmed, EXACT_REPLACEMENTS.get(trimmed));
    }

    if (VISIBLE_EXACT_REPLACEMENTS.has(trimmed)) {
      return next.replace(trimmed, VISIBLE_EXACT_REPLACEMENTS.get(trimmed));
    }

    for (const [from, to] of SUBSTRING_REPLACEMENTS) {
      if (next.includes(from)) {
        next = next.split(from).join(to);
      }
    }

    for (const [from, to] of VISIBLE_SUBSTRING_REPLACEMENTS) {
      if (next.includes(from)) {
        next = next.split(from).join(to);
      }
    }

    return next;
  }

  function translateNode(node) {
    if (!node || !node.nodeValue) return;
    const next = replaceText(node.nodeValue);
    if (next !== node.nodeValue) {
      node.nodeValue = next;
    }
  }

  function walk(root) {
    if (!root) return;

    if (document.createTreeWalker) {
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      let current;
      while ((current = walker.nextNode())) {
        translateNode(current);
      }
      return;
    }

    const stack = [root];
    while (stack.length) {
      const current = stack.pop();
      if (!current) continue;
      if (current.nodeType === Node.TEXT_NODE) {
        translateNode(current);
        continue;
      }
      if (current.childNodes && current.childNodes.length) {
        for (let i = current.childNodes.length - 1; i >= 0; i -= 1) {
          stack.push(current.childNodes[i]);
        }
      }
    }
  }

  function setText(selector, text, index) {
    const nodes = document.querySelectorAll(selector);
    const node = typeof index === 'number' ? nodes[index] : nodes[0];
    if (node && node.textContent !== text) {
      node.textContent = text;
    }
  }

  function replaceElementText(selector) {
    document.querySelectorAll(selector).forEach((node) => {
      const next = replaceText(node.textContent);
      if (next !== node.textContent) {
        node.textContent = next;
      }
    });
  }

  function applyTargetedOverrides() {
    setText('.hero__eyebrow', '735 SOURCES · 5 AI PRODUCTS · UPDATED 2 MINUTES AGO');
    setText('.org-hero__h1', 'Discover the best funding sources for your startup.');
    setText('.org-hero__sub', 'The aggregator of grants, competitions, and non-dilutive capital for Moldova, Romania, and Eastern Europe. Over 735 verified opportunities, updated daily, with AI readiness analysis for each one.');
    setText('.org-trust__lbl', 'FUNDS & ACCELERATORS', 3);
    setText('.org-trust__lbl', '4 LANGUAGES AVAILABLE', 4);
    setText('.section__label', '05 — AI PRODUCTS', 3);
    setText('.section__label', 'MISSION', 8);
    setText('.section__label', 'WITH ELIGIBIL.ORG YOU CAN', 9);
    setText('.section__title', 'Upcoming deadlines', 0);

    replaceElementText('button, a, p, h1, h2, h3, h4, h5, h6, span, li, strong, small');
  }

  function apply() {
    if (window.getLanguage && window.getLanguage() !== 'EN') return;
    if (window.location.pathname !== '/' && window.location.pathname !== '/en') return;
    document.documentElement.lang = 'en';
    document.title = 'eligibil.org — Discover the best funding sources for your startup';
    applyTargetedOverrides();
    walk(document.body);
    applyTargetedOverrides();
    if (document.body) {
      document.body.classList.remove('en-shell-pending');
      document.body.classList.add('en-shell-ready');
    }
  }

  const observer = new MutationObserver(() => {
    apply();
  });

  window.addEventListener('languagechange', apply);
  document.addEventListener('DOMContentLoaded', () => {
    apply();
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
  });

  if (document.body) {
    apply();
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
  }
})();
