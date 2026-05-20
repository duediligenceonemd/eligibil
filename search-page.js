'use strict';

(function () {
  const root = document.getElementById('search-root');
  if (!root) return;

  const DEFAULT_FILTERS = {
    q: '',
    sector: '',
    tara: '',
    stadiu: '',
    tip: '',
    min: '',
    max: '',
    dilutiv: '',
    language: '',
    sort: 'difficulty',
  };

  const SECTORS = ['', 'AI', 'Biotech', 'Climate', 'Climate-tech', 'Deep Tech', 'Edtech', 'Fintech', 'Healthtech', 'IoT', 'Mobility', 'SaaS'];
  const STADII = ['', 'Idee', 'MVP', 'Pre-seed', 'Seed', 'Series A', 'Series B'];
  const TARI = ['', 'Moldova', 'Romania', 'EU', 'Global'];
  const TIPURI = ['', 'Grant', 'Accelerator', 'Equity', 'Loan', 'VC Fund', 'Competitie'];
  const LANGUAGES = ['', 'en', 'ro', 'fr', 'de'];
  const SORTS = [
    { value: 'difficulty', label: 'Dificultate (usor -> greu)' },
    { value: 'amount', label: 'Suma (mare -> mic)' },
    { value: 'name', label: 'Nume (A -> Z)' },
  ];

  const RO_MONTHS = { ian: 0, feb: 1, mar: 2, apr: 3, mai: 4, iun: 5, iul: 6, aug: 7, sep: 8, oct: 9, noi: 10, dec: 11 };

  let filters = readUrlFilters();
  let results = null;
  let error = '';
  let debounceTimer = null;
  let firstAnalyticsRun = true;

  function trackAnalytics(eventName, payload) {
    if (window.eligibilAnalytics && typeof window.eligibilAnalytics.track === 'function') {
      window.eligibilAnalytics.track(eventName, payload);
    }
  }

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function formatAmount(min, max) {
    function fmt(n) {
      if (n >= 1000000) return 'EUR' + String((n / 1000000).toFixed(1)).replace(/\.0$/, '') + 'M';
      if (n >= 1000) return 'EUR' + String(Math.round(n / 1000)) + 'K';
      return 'EUR' + String(n);
    }
    if (min && max && min !== max) return fmt(min) + ' - ' + fmt(max);
    if (max) return 'pana la ' + fmt(max);
    if (min) return 'de la ' + fmt(min);
    return '—';
  }

  function parseDeadline(value) {
    if (!value) return null;
    if (String(value).toLowerCase() === 'rolling' || String(value).toLowerCase() === 'annual') return null;
    const match = String(value).match(/(\d{1,2})\s+(\w+)\s+(\d{4})/);
    if (!match) return null;
    const month = RO_MONTHS[String(match[2]).toLowerCase().slice(0, 3)];
    if (month === undefined) return null;
    const date = new Date(Number(match[3]), month, Number(match[1]));
    return Number.isNaN(date.getTime()) ? null : date;
  }

  function daysUntil(date) {
    return Math.ceil((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  }

  function deadlineChip(deadline) {
    const parsed = parseDeadline(deadline);
    if (!parsed) return { text: deadline || 'Rolling', cls: '' };
    const days = daysUntil(parsed);
    if (days < 0) return { text: 'Inchis', cls: '' };
    if (days < 7) return { text: String(days) + ' zile', cls: 'sb__chip--deadline-crit' };
    if (days < 14) return { text: String(days) + ' zile', cls: 'sb__chip--deadline-soon' };
    return { text: String(days) + ' zile', cls: '' };
  }

  function evidenceLabel(status) {
    if (status === 'verified_primary') return 'Verified';
    if (status === 'verified_secondary') return 'Cross-checked';
    if (status === 'ai_extracted_unverified') return 'AI extras';
    if (status === 'hypothesis') return 'Ipoteza';
    return '';
  }

  function detailUrl(grant) {
    if (grant.slug_ro) return '/ro/granturi/' + encodeURIComponent(grant.slug_ro);
    return '/grant.html?id=' + encodeURIComponent(grant.id);
  }

  function readUrlFilters() {
    const params = new URLSearchParams(window.location.search);
    const next = Object.assign({}, DEFAULT_FILTERS);
    Object.keys(DEFAULT_FILTERS).forEach((key) => {
      if (params.has(key)) next[key] = params.get(key);
    });
    return next;
  }

  function writeUrlFilters() {
    const params = new URLSearchParams();
    Object.keys(filters).forEach((key) => {
      const value = filters[key];
      if (value !== '' && value != null && !(key === 'sort' && value === DEFAULT_FILTERS.sort)) {
        params.set(key, value);
      }
    });
    const query = params.toString();
    const next = query ? '?' + query : window.location.pathname;
    window.history.replaceState(null, '', next);
  }

  function optionMarkup(options, value, emptyLabel) {
    return options.map((option) => {
      const label = option || emptyLabel;
      const selected = option === value ? ' selected' : '';
      return '<option value="' + escapeHtml(option) + '"' + selected + '>' + escapeHtml(label) + '</option>';
    }).join('');
  }

  function sortMarkup() {
    return SORTS.map((sort) => {
      const selected = sort.value === filters.sort ? ' selected' : '';
      return '<option value="' + escapeHtml(sort.value) + '"' + selected + '>' + escapeHtml(sort.label) + '</option>';
    }).join('');
  }

  function renderShell() {
    root.innerHTML = [
      '<div class="sb">',
      '  <header class="sb__top">',
      '    <a class="sb__brand" href="/">eligibil<span>.org</span></a>',
      '    <nav class="sb__nav">',
      '      <a href="/">Acasa</a>',
      '      <a href="/search">Cauta</a>',
      '      <a href="/resurse">Resurse</a>',
      '      <a href="/evenimente">Evenimente</a>',
      '      <a class="sb__cta" href="/register.html">Incepe gratuit -></a>',
      '    </nav>',
      '  </header>',
      '  <section class="sb__hero">',
      '    <h1>Cauta finantare pentru startupul tau</h1>',
      '    <p>Granturi, acceleratoare si capital non-dilutiv pentru Moldova, Romania si UE. Filtrele se sincronizeaza in URL pentru linkuri usor de distribuit.</p>',
      '    <div class="sb__searchwrap">',
      '      <input id="sb-q" class="sb__search" type="search" placeholder="Cauta dupa nume, descriere sau funder..." autocomplete="off" />',
      '      <span id="sb-count" class="sb__count">...</span>',
      '    </div>',
      '  </section>',
      '  <main class="sb__body">',
      '    <aside class="sb__filters">',
      '      <div class="sb__filterset"><label for="sb-sector">Sector</label><select id="sb-sector"></select></div>',
      '      <div class="sb__filterset"><label for="sb-tara">Tara</label><select id="sb-tara"></select></div>',
      '      <div class="sb__filterset"><label for="sb-stadiu">Stadiu</label><select id="sb-stadiu"></select></div>',
      '      <div class="sb__filterset"><label for="sb-tip">Tip</label><select id="sb-tip"></select></div>',
      '      <div class="sb__filterset">',
      '        <label>Suma (EUR)</label>',
      '        <div class="sb__amount-row">',
      '          <input id="sb-min" type="number" placeholder="min" />',
      '          <input id="sb-max" type="number" placeholder="max" />',
      '        </div>',
      '      </div>',
      '      <div class="sb__filterset"><label for="sb-dilutiv">Tip capital</label><select id="sb-dilutiv"><option value="">Oricare</option><option value="false">Non-dilutiv</option><option value="true">Dilutiv</option></select></div>',
      '      <div class="sb__filterset"><label for="sb-language">Limba aplicarii</label><select id="sb-language"></select></div>',
      '      <button id="sb-reset" class="sb__reset" type="button">Reset filtre</button>',
      '    </aside>',
      '    <section class="sb__results">',
      '      <div class="sb__sortbar">',
      '        <div id="sb-status" class="sb__sortbar-l">Se incarca...</div>',
      '        <select id="sb-sort">' + sortMarkup() + '</select>',
      '      </div>',
      '      <div id="sb-results"></div>',
      '    </section>',
      '  </main>',
      '</div>',
    ].join('');

    document.getElementById('sb-sector').innerHTML = optionMarkup(SECTORS, filters.sector, 'Oricare');
    document.getElementById('sb-tara').innerHTML = optionMarkup(TARI, filters.tara, 'Oricare');
    document.getElementById('sb-stadiu').innerHTML = optionMarkup(STADII, filters.stadiu, 'Oricare');
    document.getElementById('sb-tip').innerHTML = optionMarkup(TIPURI, filters.tip, 'Oricare');
    document.getElementById('sb-language').innerHTML = optionMarkup(LANGUAGES, filters.language, 'Oricare');

    document.getElementById('sb-q').value = filters.q;
    document.getElementById('sb-min').value = filters.min;
    document.getElementById('sb-max').value = filters.max;
    document.getElementById('sb-dilutiv').value = filters.dilutiv;
    document.getElementById('sb-sort').value = filters.sort;

    bindEvents();
    renderResults();
  }

  function bindEvents() {
    document.getElementById('sb-q').addEventListener('input', function (event) {
      setFilters({ q: event.target.value });
    });
    document.getElementById('sb-sector').addEventListener('change', function (event) {
      setFilters({ sector: event.target.value });
    });
    document.getElementById('sb-tara').addEventListener('change', function (event) {
      setFilters({ tara: event.target.value });
    });
    document.getElementById('sb-stadiu').addEventListener('change', function (event) {
      setFilters({ stadiu: event.target.value });
    });
    document.getElementById('sb-tip').addEventListener('change', function (event) {
      setFilters({ tip: event.target.value });
    });
    document.getElementById('sb-min').addEventListener('input', function (event) {
      setFilters({ min: event.target.value });
    });
    document.getElementById('sb-max').addEventListener('input', function (event) {
      setFilters({ max: event.target.value });
    });
    document.getElementById('sb-dilutiv').addEventListener('change', function (event) {
      setFilters({ dilutiv: event.target.value });
    });
    document.getElementById('sb-language').addEventListener('change', function (event) {
      setFilters({ language: event.target.value });
    });
    document.getElementById('sb-sort').addEventListener('change', function (event) {
      setFilters({ sort: event.target.value });
    });
    document.getElementById('sb-reset').addEventListener('click', function () {
      filters = Object.assign({}, DEFAULT_FILTERS);
      syncInputs();
      scheduleFetch();
    });
  }

  function syncInputs() {
    document.getElementById('sb-q').value = filters.q;
    document.getElementById('sb-sector').value = filters.sector;
    document.getElementById('sb-tara').value = filters.tara;
    document.getElementById('sb-stadiu').value = filters.stadiu;
    document.getElementById('sb-tip').value = filters.tip;
    document.getElementById('sb-min').value = filters.min;
    document.getElementById('sb-max').value = filters.max;
    document.getElementById('sb-dilutiv').value = filters.dilutiv;
    document.getElementById('sb-language').value = filters.language;
    document.getElementById('sb-sort').value = filters.sort;
  }

  function setFilters(patch) {
    filters = Object.assign({}, filters, patch);
    syncInputs();
    scheduleFetch();
  }

  function renderResults() {
    const countNode = document.getElementById('sb-count');
    const statusNode = document.getElementById('sb-status');
    const resultsNode = document.getElementById('sb-results');

    if (!countNode || !statusNode || !resultsNode) return;

    if (error) {
      countNode.textContent = '0 rezultate';
      statusNode.textContent = 'Eroare: ' + error;
      resultsNode.innerHTML = '<div class="sb__empty"><h3>Nu am putut incarca rezultatele</h3><p>Incearca din nou sau reseteaza filtrele.</p><button id="sb-inline-reset" class="sb__reset" type="button">Reset toate filtrele</button></div>';
      const resetButton = document.getElementById('sb-inline-reset');
      if (resetButton) {
        resetButton.addEventListener('click', function () {
          filters = Object.assign({}, DEFAULT_FILTERS);
          syncInputs();
          scheduleFetch();
        });
      }
      return;
    }

    if (results === null) {
      countNode.textContent = '...';
      statusNode.textContent = 'Se incarca...';
      resultsNode.innerHTML = '<div class="sb__loading">Se incarca granturile...</div>';
      return;
    }

    countNode.textContent = String(results.length) + ' rezultate';
    statusNode.textContent = String(results.length) + ' granturi';

    if (!results.length) {
      resultsNode.innerHTML = '<div class="sb__empty"><h3>Niciun grant gasit</h3><p>Incearca sa elimini un filtru sau sa cauti cu un termen mai general.</p><button id="sb-inline-reset" class="sb__reset" type="button">Reset toate filtrele</button></div>';
      const resetButton = document.getElementById('sb-inline-reset');
      if (resetButton) {
        resetButton.addEventListener('click', function () {
          filters = Object.assign({}, DEFAULT_FILTERS);
          syncInputs();
          scheduleFetch();
        });
      }
      return;
    }

    resultsNode.innerHTML = results.map(function (grant) {
      const name = grant.nume_program || '';
      const summary = grant.short_summary_ro || grant.short_summary_en || grant.descriere || '';
      const funder = grant.funder_name || grant.organizatie || '';
      const country = grant.funder_country || grant.tara || '';
      const deadline = deadlineChip(grant.deadline);
      const evidence = evidenceLabel(grant.evidence_status);
      return [
        '<a class="sb__card" href="' + escapeHtml(detailUrl(grant)) + '" data-funding-id="' + escapeHtml(grant.id || '') + '" data-funding-type="' + escapeHtml(grant.tip || '') + '" data-funding-country="' + escapeHtml(grant.tara || '') + '">',
        '  <div class="sb__card-row1">',
        '    <div class="sb__card-name">' + escapeHtml(name) + '</div>',
        '    <div class="sb__card-amount">' + escapeHtml(formatAmount(grant.suma_min, grant.suma_max)) + '</div>',
        '  </div>',
        '  <div class="sb__card-row2">',
              (funder ? '<span>' + escapeHtml(funder) + '</span>' : ''),
              (funder && country ? '<span class="sep">·</span>' : ''),
              (country ? '<span>' + escapeHtml(country) + '</span>' : ''),
              (grant.tip ? '<span class="sep">·</span><span>' + escapeHtml(grant.tip) + '</span>' : ''),
        '  </div>',
              (summary ? '<p class="sb__card-summary">' + escapeHtml(summary) + '</p>' : ''),
        '  <div class="sb__card-row3">',
        '    <span class="sb__chip ' + escapeHtml(deadline.cls) + '">' + escapeHtml(deadline.text) + '</span>',
              (evidence ? '<span class="sb__chip sb__chip--evidence-' + escapeHtml(grant.evidence_status || '') + '">' + escapeHtml(evidence) + '</span>' : ''),
              (grant.dilutiv === false ? '<span class="sb__chip">Non-dilutiv</span>' : ''),
        '  </div>',
        '</a>',
      ].join('');
    }).join('');

    Array.prototype.forEach.call(resultsNode.querySelectorAll('.sb__card'), function (card) {
      card.addEventListener('click', function () {
        trackAnalytics('funding_viewed', {
          funding_id: card.getAttribute('data-funding-id') || '',
          funding_type: card.getAttribute('data-funding-type') || '',
          country: card.getAttribute('data-funding-country') || '',
          result_context: 'grants',
        });
      });
    });
  }

  function scheduleFetch() {
    writeUrlFilters();
    error = '';
    results = null;
    renderResults();
    window.clearTimeout(debounceTimer);
    debounceTimer = window.setTimeout(fetchResults, 250);
  }

  async function fetchResults() {
    try {
      const params = new URLSearchParams();
      Object.keys(filters).forEach(function (key) {
        const value = filters[key];
        if (value !== '' && value != null && key !== 'sort') params.set(key, value);
      });
      params.set('sort', filters.sort || DEFAULT_FILTERS.sort);
      params.set('limit', '60');

      const response = await fetch('/api/grants?' + params.toString(), { credentials: 'same-origin' });
      if (!response.ok) throw new Error('API ' + response.status);

      const payload = await response.json();
      results = Array.isArray(payload) ? payload : [];
      error = '';
      renderResults();

      if (!firstAnalyticsRun) {
        trackAnalytics(filters.q ? 'search_performed' : 'filter_used', {
          query_length: String(filters.q || '').trim().length,
          has_sector: !!filters.sector,
          has_country: !!filters.tara,
          has_stage: !!filters.stadiu,
          has_type: !!filters.tip,
          result_count: results.length,
          result_context: 'grants',
        });
      }
      firstAnalyticsRun = false;
    } catch (fetchError) {
      results = [];
      error = fetchError && fetchError.message ? fetchError.message : 'Eroare necunoscuta';
      renderResults();
    }
  }

  renderShell();
  fetchResults();
})();
