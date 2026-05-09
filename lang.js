/**
 * lang.js — Runtime i18n for eligibil.org
 *
 * Strategy: phrase-based translation dictionary applied to DOM text nodes.
 * Works with all existing React-rendered components without code changes.
 *
 * Usage:
 *   <script src="lang.js"></script>
 *   ...
 *   window.setLanguage('EN');  // switches everywhere
 *
 * Persists in localStorage. Auto-applies on page load.
 */

(function() {
  'use strict';

  // =============================================================================
  // RO → EN translation dictionary
  // =============================================================================
  const RO_TO_EN = {
    // ── Navigation / global
    'Intră în cont': 'Sign in',
    'Cont nou': 'Sign up',
    'Înregistrează-te': 'Sign up',
    'Înscrie-te gratuit': 'Sign up free',
    'Conectează-te': 'Log in',
    'Logare': 'Login',
    'Deconectează-te': 'Log out',
    'Salvează': 'Save',
    'Anulează': 'Cancel',
    'Încarcă': 'Upload',
    'Analizează': 'Analyze',
    'Trimite': 'Submit',
    'Aplică': 'Apply',
    'Continuă': 'Continue',
    'Înapoi': 'Back',
    'Începe': 'Start',
    'Vezi mai mult': 'See more',
    'Detalii': 'Details',
    'nou': 'new',
    'Activ': 'Active',
    'Inactiv': 'Inactive',
    'Toate': 'All',
    'Niciunul': 'None',

    // ── Hero
    'AI Readiness & Funding Orchestrator': 'AI Readiness & Funding Orchestrator',
    'Analiză AI · Gratuit în faza beta · Fără cont necesar': 'AI Analysis · Free during beta · No account required',
    'Încarcă. Analizează. Află exact unde ești ': 'Upload. Analyze. Find out exactly where you are ',
    'eligibil': 'eligible',
    'eligibil.org analizează artefactele startupului tău — pitch deck, video și whitepaper — identifică automat TRL-ul, calculează scorul de potrivire pentru peste 735 de granturi și îți livrează un plan concret să devii maxim eligibil.':
      'eligibil.org analyzes your startup artifacts — pitch deck, video, and whitepaper — automatically identifies the TRL, calculates the match score across 735+ grants, and delivers a concrete plan to maximize eligibility.',
    'Obține scorul tău de eligibilitate în 90 de secunde': 'Get your eligibility score in 90 seconds',
    'min. 1 necesar': 'min. 1 required',
    'gata pentru analiză': 'ready for analysis',
    'Pitch Deck': 'Pitch Deck',
    'Video Pitch': 'Pitch Video',
    'Whitepaper': 'Whitepaper',
    'Minimum ': 'Minimum ',
    ' pentru a începe': ' to start',
    '1 artefact': '1 artifact',
    'Datele tale nu sunt partajate, nu antrenăm AI-ul pe ele': 'Your data is not shared, we don\'t train AI on it',
    'sau ': 'or ',
    'completează formular minim (30s)': 'fill out a quick form (30s)',
    'ANALIZEAZĂ-MĂ ACUM →': 'ANALYZE ME NOW →',
    'Analiză AI': 'AI Analysis',

    // ── Stats
    'Surse indexate': 'Indexed sources',
    'Surse verificate': 'Verified sources',
    'Timp până la scor': 'Time to score',
    'Agenți AI de evaluare': 'AI evaluation agents',
    'Cost în faza beta': 'Cost during beta',
    'Limbi RO·EN·RU·UA': 'Languages RO·EN·RU·UA',
    'Surse de finanțare': 'Funding sources',
    'Programe active': 'Active programs',
    'Parteneri': 'Partners',
    'Resurse': 'Resources',

    // ── Auth
    'Email': 'Email',
    'Parolă': 'Password',
    'Confirmă parola': 'Confirm password',
    'Numele complet': 'Full name',
    'Numele tău': 'Your name',
    'Numele firmei': 'Company name',
    'Telefon': 'Phone',
    'Țară': 'Country',
    'Sector': 'Sector',
    'Stadiu': 'Stage',
    'Bună!': 'Welcome!',
    'Bun venit': 'Welcome',
    'Salut': 'Hi',
    'Nu ai cont?': 'No account?',
    'Ai deja cont?': 'Already have an account?',
    'Ai uitat parola?': 'Forgot password?',
    'Resetează parola': 'Reset password',
    'Neautentificat': 'Not authenticated',
    'Autentificare reușită': 'Login successful',
    'Cont creat': 'Account created',

    // ── Dashboard
    'Tablou de bord': 'Dashboard',
    'Profilul meu': 'My profile',
    'Granturi': 'Grants',
    'Pipeline': 'Pipeline',
    'Aplicații': 'Applications',
    'Evenimente': 'Events',
    'Notificări': 'Notifications',
    'Rapoarte': 'Reports',
    'Setări': 'Settings',
    'Top match-uri': 'Top matches',
    'Granturi recomandate': 'Recommended grants',
    'Următoarele deadline-uri': 'Upcoming deadlines',
    'Status profil': 'Profile status',
    'Completitudine profil': 'Profile completeness',
    'Match': 'Match',
    'Potrivire': 'Match',
    'Recomandare AI': 'AI Recommendation',

    // ── Grants
    'Sumă': 'Amount',
    'Suma': 'Amount',
    'Suma minimă': 'Min amount',
    'Suma maximă': 'Max amount',
    'Deadline': 'Deadline',
    'Termen limită': 'Deadline',
    'Cerințe': 'Requirements',
    'Eligibilitate': 'Eligibility',
    'Descriere': 'Description',
    'Organizație': 'Organization',
    'Tip program': 'Program type',
    'Dilutiv': 'Dilutive',
    'Nedilutiv': 'Non-dilutive',
    'Dificultate': 'Difficulty',
    'Zile pentru pregătire': 'Days to prepare',
    'Status': 'Status',
    'Aplică acum': 'Apply now',
    'Vezi grant': 'View grant',
    'Detalii grant': 'Grant details',
    'Înapoi la dashboard': 'Back to dashboard',
    'Adaugă în pipeline': 'Add to pipeline',
    'Marchează ca aplicat': 'Mark as applied',

    // ── Filters
    'Filtre': 'Filters',
    'Toate țările': 'All countries',
    'Toate sectoarele': 'All sectors',
    'Toate stadiile': 'All stages',
    'Sortează după': 'Sort by',
    'Cele mai noi': 'Newest',
    'Cele mai relevante': 'Most relevant',
    'Deadline apropiat': 'Closest deadline',
    'Caută': 'Search',
    'Caută granturi': 'Search grants',

    // ── Profile
    'Date generale': 'General info',
    'Despre proiect': 'About project',
    'Echipa': 'Team',
    'Documente': 'Documents',
    'Salvează modificările': 'Save changes',
    'Modificările au fost salvate': 'Changes saved',
    'Numele proiectului': 'Project name',
    'Anul fondării': 'Year founded',
    'Numărul de angajați': 'Number of employees',
    'TRL (Technology Readiness Level)': 'TRL (Technology Readiness Level)',
    'Website': 'Website',
    'Descrierea proiectului': 'Project description',
    'Pitch în 30 secunde': '30-second pitch',

    // ── Pipeline
    'Aplicații în pregătire': 'Applications in preparation',
    'Trimise': 'Submitted',
    'Aprobate': 'Approved',
    'Respinse': 'Rejected',
    'În evaluare': 'Under review',
    'Adaugă aplicație': 'Add application',
    'Status aplicație': 'Application status',
    'Note': 'Notes',
    'Documente atașate': 'Attached documents',

    // ── Common verbs/phrases
    'verificat': 'verified',
    'verificate': 'verified',
    'oportunități': 'opportunities',
    'oportunități verificate': 'verified opportunities',
    'granturi': 'grants',
    'startup-uri': 'startups',
    'startup-uri tech': 'tech startups',
    'AI de evaluare': 'evaluation AI',
    'în 90 de secunde': 'in 90 seconds',
    'gratuit': 'free',
    'beta': 'beta',
    'În faza beta': 'In beta phase',

    // ── Footer
    'Despre noi': 'About us',
    'Contact': 'Contact',
    'Termeni': 'Terms',
    'Confidențialitate': 'Privacy',
    'Politica de cookies': 'Cookie policy',
    'Toate drepturile rezervate': 'All rights reserved',
    'Făcut cu': 'Made with',
    'în Moldova și România': 'in Moldova and Romania',

    // ── Errors / messages
    'Eroare': 'Error',
    'A apărut o eroare': 'An error occurred',
    'Câmp obligatoriu': 'Required field',
    'Email invalid': 'Invalid email',
    'Parolă prea scurtă': 'Password too short',
    'Parolele nu coincid': 'Passwords don\'t match',
    'Email-ul există deja': 'Email already exists',
    'Date incorecte': 'Incorrect data',
    'Se încarcă...': 'Loading...',
    'Se procesează...': 'Processing...',
    'Niciun rezultat': 'No results',
    'Niciun grant găsit': 'No grants found',

    // ── Page titles (mismatched HTML attribute won't match but we handle inline)
    'eligibil.org — Încarcă. Analizează. Află unde ești eligibil.':
      'eligibil.org — Upload. Analyze. Find where you are eligible.',
  };

  // EN → RO (auto-built from RO_TO_EN reverse)
  const EN_TO_RO = {};
  for (const [ro, en] of Object.entries(RO_TO_EN)) {
    EN_TO_RO[en] = ro;
  }

  // =============================================================================
  // Translation engine
  // =============================================================================
  let CURRENT_LANG = (() => {
    try { return localStorage.getItem('eligibil_lang') || 'RO'; }
    catch { return 'RO'; }
  })();

  // Track originals so we can switch back
  const originalText = new WeakMap();

  function translateNode(node, targetLang) {
    if (!node || node.nodeType !== Node.TEXT_NODE) return;
    const text = node.nodeValue;
    if (!text || !text.trim()) return;

    // Save original on first encounter
    if (!originalText.has(node)) {
      originalText.set(node, text);
    }
    const original = originalText.get(node);
    const trimmed = original.trim();

    if (targetLang === 'RO') {
      // Restore original
      if (node.nodeValue !== original) node.nodeValue = original;
      return;
    }

    if (targetLang === 'EN') {
      // Try exact match first
      if (RO_TO_EN[trimmed]) {
        const leading = original.match(/^\s*/)[0];
        const trailing = original.match(/\s*$/)[0];
        node.nodeValue = leading + RO_TO_EN[trimmed] + trailing;
        return;
      }
      // Try partial replacements (longest phrases first)
      let result = original;
      const phrases = Object.keys(RO_TO_EN).sort((a, b) => b.length - a.length);
      for (const phrase of phrases) {
        if (result.includes(phrase)) {
          result = result.split(phrase).join(RO_TO_EN[phrase]);
        }
      }
      if (result !== original) node.nodeValue = result;
    }
  }

  function walkAndTranslate(root, targetLang) {
    if (!root) root = document.body;
    const walker = document.createTreeWalker(
      root,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode(node) {
          // Skip script/style/noscript
          const parent = node.parentElement;
          if (!parent) return NodeFilter.FILTER_REJECT;
          const tag = parent.tagName;
          if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'NOSCRIPT') {
            return NodeFilter.FILTER_REJECT;
          }
          if (parent.closest('[data-no-translate]')) {
            return NodeFilter.FILTER_REJECT;
          }
          return node.nodeValue.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
        }
      }
    );

    const nodes = [];
    let n;
    while ((n = walker.nextNode())) nodes.push(n);
    nodes.forEach(node => translateNode(node, targetLang));

    // Also translate placeholder, title, alt attributes
    const elements = root.querySelectorAll('[placeholder], [title], [alt]');
    elements.forEach(el => {
      ['placeholder', 'title', 'alt'].forEach(attr => {
        const val = el.getAttribute(attr);
        if (!val || !val.trim()) return;
        const key = `_${attr}_${val}`;
        if (!originalText.has(el)) originalText.set(el, {});
        const cache = originalText.get(el);
        if (typeof cache !== 'object') return;
        if (!cache[attr]) cache[attr] = val;
        const original = cache[attr];
        if (targetLang === 'RO') {
          if (val !== original) el.setAttribute(attr, original);
        } else if (targetLang === 'EN' && RO_TO_EN[original.trim()]) {
          el.setAttribute(attr, RO_TO_EN[original.trim()]);
        }
      });
    });
  }

  // =============================================================================
  // MutationObserver — re-translate when React re-renders
  // =============================================================================
  let observer = null;
  function startObserver() {
    if (observer) return;
    observer = new MutationObserver((mutations) => {
      if (CURRENT_LANG === 'RO') return;
      // Debounce — wait for batch of changes to settle
      clearTimeout(window.__i18nDebounce);
      window.__i18nDebounce = setTimeout(() => {
        for (const m of mutations) {
          for (const node of m.addedNodes) {
            if (node.nodeType === Node.ELEMENT_NODE) {
              walkAndTranslate(node, CURRENT_LANG);
            } else if (node.nodeType === Node.TEXT_NODE) {
              translateNode(node, CURRENT_LANG);
            }
          }
        }
      }, 50);
    });
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
    });
  }

  // =============================================================================
  // Public API
  // =============================================================================
  window.setLanguage = function(lang) {
    lang = (lang || 'RO').toUpperCase();
    if (!['RO', 'EN'].includes(lang)) {
      // For RU/UA fallback to RO until those dictionaries exist
      console.warn('[i18n] Language not yet supported:', lang, '— falling back to RO');
      lang = 'RO';
    }
    CURRENT_LANG = lang;
    try { localStorage.setItem('eligibil_lang', lang); } catch {}
    document.documentElement.lang = lang.toLowerCase();
    walkAndTranslate(document.body, lang);
    window.dispatchEvent(new CustomEvent('languagechange', { detail: { lang } }));
  };

  window.getLanguage = function() { return CURRENT_LANG; };
  window.t = function(text) {
    if (CURRENT_LANG === 'EN' && RO_TO_EN[text]) return RO_TO_EN[text];
    return text;
  };

  // =============================================================================
  // Boot
  // =============================================================================
  function injectFloatingSwitcher() {
    if (document.getElementById('i18n-floating-switcher')) return;
    const wrap = document.createElement('div');
    wrap.id = 'i18n-floating-switcher';
    wrap.setAttribute('data-no-translate', '');
    wrap.style.cssText = `
      position: fixed; bottom: 16px; right: 16px;
      background: rgba(0,0,0,0.85); color: white;
      border-radius: 24px; padding: 4px;
      display: flex; gap: 2px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
      z-index: 9999;
      font-family: -apple-system, BlinkMacSystemFont, sans-serif;
      font-size: 13px; font-weight: 600;
      backdrop-filter: blur(8px);
    `;
    ['RO', 'EN'].forEach(code => {
      const btn = document.createElement('button');
      btn.textContent = code;
      btn.dataset.lang = code;
      btn.style.cssText = `
        background: transparent; color: inherit;
        border: none; padding: 6px 14px; cursor: pointer;
        border-radius: 20px; transition: 0.2s;
      `;
      const setActive = () => {
        wrap.querySelectorAll('button').forEach(b => {
          b.style.background = b.dataset.lang === CURRENT_LANG ? 'white' : 'transparent';
          b.style.color = b.dataset.lang === CURRENT_LANG ? 'black' : 'white';
        });
      };
      setActive();
      btn.onclick = () => {
        window.setLanguage(code);
        setActive();
      };
      window.addEventListener('languagechange', setActive);
      wrap.appendChild(btn);
    });
    document.body.appendChild(wrap);
  }

  function init() {
    startObserver();
    if (CURRENT_LANG !== 'RO') {
      walkAndTranslate(document.body, CURRENT_LANG);
    }
    // Hook all RO/EN buttons by class
    document.querySelectorAll('.langmini button, [data-lang]').forEach(btn => {
      const code = btn.dataset.lang || btn.textContent.trim();
      btn.addEventListener('click', () => window.setLanguage(code));
    });
    injectFloatingSwitcher();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  console.log('[i18n] eligibil.org language engine loaded · current:', CURRENT_LANG);
})();
