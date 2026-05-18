const { useState, useEffect, useRef } = React;

const REGION_GROUPS = ['', 'US', 'EU', 'Government', 'Capital', 'Free Technical', 'Resources'];
const RESOURCE_TYPES = [
  { value: '', labelRo: 'Oricare', labelEn: 'Any' },
  { value: 'grant_database', labelRo: 'Baze de granturi', labelEn: 'Grant databases' },
  { value: 'government_program', labelRo: 'Programe guvernamentale', labelEn: 'Government programs' },
  { value: 'funding_resource', labelRo: 'Resurse de finanțare', labelEn: 'Funding resources' },
  { value: 'capital_resource', labelRo: 'Capital și investitori', labelEn: 'Capital resources' },
  { value: 'technical_resource', labelRo: 'Resurse tehnice', labelEn: 'Technical resources' },
  { value: 'resource_directory', labelRo: 'Directoare generale', labelEn: 'General directories' },
];

const DEFAULT_FILTERS = {
  q: '',
  region_group: '',
  resource_type: '',
  category: '',
  is_grant_like: '',
};

const RESOURCE_HIGHLIGHTS = {
  grant_database: { ro: 'Baze de granturi', en: 'Grant databases' },
  government_program: { ro: 'Programe guvernamentale', en: 'Government programs' },
  funding_resource: { ro: 'Resurse de finanțare', en: 'Funding resources' },
  capital_resource: { ro: 'Capital și investitori', en: 'Capital resources' },
  technical_resource: { ro: 'Resurse tehnice', en: 'Technical resources' },
  resource_directory: { ro: 'Directoare generale', en: 'General directories' },
};

function trackAnalytics(eventName, payload) {
  if (window.eligibilAnalytics && typeof window.eligibilAnalytics.track === 'function') {
    window.eligibilAnalytics.track(eventName, payload);
  }
}

function readUrlFilters() {
  if (typeof window === 'undefined') return DEFAULT_FILTERS;
  const params = new URLSearchParams(window.location.search);
  const next = { ...DEFAULT_FILTERS };
  for (const key of Object.keys(DEFAULT_FILTERS)) {
    if (params.has(key)) next[key] = params.get(key);
  }
  return next;
}

function writeUrlFilters(filters) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value !== '' && value != null) params.set(key, value);
  }
  const query = params.toString();
  const next = query ? `${window.location.pathname}?${query}` : window.location.pathname;
  window.history.replaceState(null, '', next);
}

function detectLang() {
  if (typeof window === 'undefined') return 'ro';
  return window.location.pathname.startsWith('/en/') ? 'en' : 'ro';
}

function resourceTypeLabel(value, lang) {
  const found = RESOURCE_TYPES.find((item) => item.value === value);
  if (found) return lang === 'en' ? found.labelEn : found.labelRo;
  return value || '';
}

const COPY = {
  ro: {
    navSearch: 'Caută',
    navResources: 'Resurse',
    navEvents: 'Evenimente',
    cta: 'Începe gratuit →',
    title: 'Resurse utile pentru startupuri',
    subtitle: 'Directoare, suport tehnic, capital și programe pe care le poți folosi imediat. Catalog separat de granturi, gândit pentru explorare rapidă.',
    dbTitle: 'Baza de date resurse',
    dbSubtitle: 'Importată din workbook-ul dedicat și publicată ca un catalog separat de granturi. Aici vezi rapid cât conține și cum este împărțită.',
    searchPlaceholder: 'Caută după titlu, categorie sau descriere…',
    results: 'rezultate',
    region: 'Regiune',
    type: 'Tip resursă',
    category: 'Categorie',
    grantLike: 'Doar oportunități de finanțare',
    any: 'Oricare',
    yes: 'Da',
    no: 'Nu',
    reset: 'Reset filtre',
    loading: 'Se încarcă resursele…',
    emptyTitle: 'Nicio resursă găsită',
    emptyText: 'Încearcă să elimini un filtru sau să cauți cu un termen mai general.',
    open: 'Deschide resursa',
    grantLikeBadge: 'Grant-like',
    noWebsite: 'Fără website',
    totalDb: 'total resurse',
    totalWebsites: 'cu website',
    totalGrantLike: 'oportunități grant-like',
    byType: 'Distribuție pe tip',
    byRegion: 'Distribuție pe regiune',
  },
  en: {
    navSearch: 'Search',
    navResources: 'Resources',
    navEvents: 'Events',
    cta: 'Get started free →',
    title: 'Useful resources for startups',
    subtitle: 'Directories, technical support, capital and programs you can use right away. A separate catalog from grants, built for quick discovery.',
    dbTitle: 'Resources database',
    dbSubtitle: 'Imported from the dedicated workbook and published as a catalog separate from grants. This gives a quick view of what the database contains.',
    searchPlaceholder: 'Search by title, category or description…',
    results: 'results',
    region: 'Region',
    type: 'Resource type',
    category: 'Category',
    grantLike: 'Funding opportunities only',
    any: 'Any',
    yes: 'Yes',
    no: 'No',
    reset: 'Reset filters',
    loading: 'Loading resources…',
    emptyTitle: 'No resources found',
    emptyText: 'Try removing a filter or searching with a broader term.',
    open: 'Open resource',
    grantLikeBadge: 'Grant-like',
    noWebsite: 'No website',
    totalDb: 'total resources',
    totalWebsites: 'with website',
    totalGrantLike: 'grant-like opportunities',
    byType: 'Breakdown by type',
    byRegion: 'Breakdown by region',
  },
};

function Topbar({ copy, lang }) {
  const resourcesHref = lang === 'en' ? '/en/resources' : '/resurse';
  const searchHref = '/search';
  const eventsHref = lang === 'en' ? '/events' : '/evenimente';
  return (
    <header className="sb__top">
      <a className="sb__brand" href="/">eligibil<span>.org</span></a>
      <nav className="sb__nav">
        <a href={searchHref}>{copy.navSearch}</a>
        <a href={resourcesHref}>{copy.navResources}</a>
        <a href={eventsHref}>{copy.navEvents}</a>
        <a className="sb__cta" href="/register.html">{copy.cta}</a>
      </nav>
    </header>
  );
}

function Hero({ copy, count, q, onQ }) {
  return (
    <section className="sb__hero">
      <h1>{copy.title}</h1>
      <p>{copy.subtitle}</p>
      <div className="sb__searchwrap">
        <input
          className="sb__search"
          type="search"
          placeholder={copy.searchPlaceholder}
          value={q}
          onChange={(e) => onQ(e.target.value)}
          autoComplete="off"
        />
        <span className="sb__count">{count == null ? '…' : `${count} ${copy.results}`}</span>
      </div>
    </section>
  );
}

function Overview({ copy, overview, lang }) {
  if (!overview) return null;

  const typeRows = Object.entries(overview.by_type || {})
    .sort((a, b) => b[1] - a[1]);
  const regionRows = Object.entries(overview.by_region || {})
    .sort((a, b) => b[1] - a[1]);

  return (
    <section className="sb__hero" style={{ paddingTop: 0 }}>
      <div style={{ marginTop: -8, marginBottom: 18 }}>
        <div className="sb__card-name" style={{ marginBottom: 6 }}>{copy.dbTitle}</div>
        <p className="sb__card-summary" style={{ margin: 0, maxWidth: 920 }}>{copy.dbSubtitle}</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 14, marginBottom: 18 }}>
        <div className="sb__card">
          <div className="sb__card-amount">{overview.total || 0}</div>
          <div className="sb__card-summary">{copy.totalDb}</div>
        </div>
        <div className="sb__card">
          <div className="sb__card-amount">{overview.rows_with_website || 0}</div>
          <div className="sb__card-summary">{copy.totalWebsites}</div>
        </div>
        <div className="sb__card">
          <div className="sb__card-amount">{overview.grant_like_rows || 0}</div>
          <div className="sb__card-summary">{copy.totalGrantLike}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 18 }}>
        <div className="sb__card">
          <div className="sb__card-name" style={{ marginBottom: 12 }}>{copy.byType}</div>
          {typeRows.map(([key, value]) => (
            <div key={key} className="sb__card-row2" style={{ justifyContent: 'space-between', marginBottom: 8 }}>
              <span>{(RESOURCE_HIGHLIGHTS[key] && RESOURCE_HIGHLIGHTS[key][lang]) || key}</span>
              <strong>{value}</strong>
            </div>
          ))}
        </div>
        <div className="sb__card">
          <div className="sb__card-name" style={{ marginBottom: 12 }}>{copy.byRegion}</div>
          {regionRows.map(([key, value]) => (
            <div key={key} className="sb__card-row2" style={{ justifyContent: 'space-between', marginBottom: 8 }}>
              <span>{key}</span>
              <strong>{value}</strong>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FilterRail({ copy, filters, set, onReset }) {
  const lang = detectLang();
  const update = (key) => (e) => set({ [key]: e.target.value });
  return (
    <aside className="sb__filters">
      <div className="sb__filterset">
        <label htmlFor="f-region">{copy.region}</label>
        <select id="f-region" value={filters.region_group} onChange={update('region_group')}>
          {REGION_GROUPS.map((value) => <option key={value} value={value}>{value || copy.any}</option>)}
        </select>
      </div>
      <div className="sb__filterset">
        <label htmlFor="f-type">{copy.type}</label>
        <select id="f-type" value={filters.resource_type} onChange={update('resource_type')}>
          {RESOURCE_TYPES.map((item) => (
            <option key={item.value} value={item.value}>
              {lang === 'en' ? item.labelEn : item.labelRo}
            </option>
          ))}
        </select>
      </div>
      <div className="sb__filterset">
        <label htmlFor="f-category">{copy.category}</label>
        <input id="f-category" type="text" value={filters.category} onChange={update('category')} placeholder={copy.category} />
      </div>
      <div className="sb__filterset">
        <label htmlFor="f-grantlike">{copy.grantLike}</label>
        <select id="f-grantlike" value={filters.is_grant_like} onChange={update('is_grant_like')}>
          <option value="">{copy.any}</option>
          <option value="true">{copy.yes}</option>
          <option value="false">{copy.no}</option>
        </select>
      </div>
      <button className="sb__reset" onClick={onReset}>{copy.reset}</button>
    </aside>
  );
}

function ResourceCard({ item, copy }) {
  const lang = detectLang();
  return (
    <article className="sb__card">
      <div className="sb__card-row1">
        <div className="sb__card-name">{item.title}</div>
        <div className="sb__card-amount">{item.amount_raw || '—'}</div>
      </div>
      <div className="sb__card-row2">
        {item.region_group && <span>{item.region_group}</span>}
        {item.region_group && item.category && <span className="sep">·</span>}
        {item.category && <span>{item.category}</span>}
        {item.resource_type && <><span className="sep">·</span><span>{resourceTypeLabel(item.resource_type, lang)}</span></>}
      </div>
      {item.description && <p className="sb__card-summary">{item.description}</p>}
      <div className="sb__card-row3">
        <span className="sb__chip">{item.sheet_name}</span>
        {item.is_grant_like && <span className="sb__chip sb__chip--evidence-verified_primary">{copy.grantLikeBadge}</span>}
      </div>
      <div style={{ marginTop: 12 }}>
        {item.website ? (
          <a
            className="sb__cta"
            href={item.website}
            target="_blank"
            rel="noreferrer"
            onClick={() => trackAnalytics('resource_opened', {
              resource_type: item.resource_type || '',
              region_group: item.region_group || '',
              has_website: true,
            })}
          >
            {copy.open}
          </a>
        ) : (
          <span className="sb__chip">{copy.noWebsite}</span>
        )}
      </div>
    </article>
  );
}

function ResourcesApp() {
  const lang = detectLang();
  const copy = COPY[lang];
  const [filters, setFilters] = useState(readUrlFilters);
  const [results, setResults] = useState(null);
  const [overview, setOverview] = useState(null);
  const [error, setError] = useState(null);
  const debounceRef = useRef(null);
  const firstRunRef = useRef(true);

  const set = (patch) => setFilters((current) => ({ ...current, ...patch }));
  const reset = () => setFilters({ ...DEFAULT_FILTERS });

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      writeUrlFilters(filters);
      setError(null);
      try {
        const params = new URLSearchParams();
        for (const [key, value] of Object.entries(filters)) {
          if (value !== '' && value != null) params.set(key, value);
        }
        params.set('limit', '180');
        const response = await fetch(`/api/resources?${params.toString()}`);
        if (!response.ok) throw new Error(`API ${response.status}`);
        const data = await response.json();
        setResults(Array.isArray(data) ? data : []);
        if (!firstRunRef.current) {
          trackAnalytics(filters.q ? 'resource_search_performed' : 'resource_filter_used', {
            query_length: (filters.q || '').trim().length,
            has_region: !!filters.region_group,
            has_type: !!filters.resource_type,
            has_category: !!filters.category,
            is_grant_like: filters.is_grant_like || '',
            result_count: Array.isArray(data) ? data.length : 0,
          });
        }
      } catch (err) {
        setError(err.message || 'Unknown error');
        setResults([]);
      }
    }, 250);
    return () => clearTimeout(debounceRef.current);
  }, [filters]);

  useEffect(() => {
    firstRunRef.current = false;
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/resources/overview')
      .then((response) => response.ok ? response.json() : Promise.reject(new Error(`API ${response.status}`)))
      .then((data) => {
        if (!cancelled) setOverview(data);
      })
      .catch(() => {
        if (!cancelled) setOverview(null);
      });
    return () => { cancelled = true; };
  }, []);

  const count = results == null ? null : results.length;

  return (
    <div className="sb">
      <Topbar copy={copy} lang={lang} />
      <Hero copy={copy} count={count} q={filters.q} onQ={(value) => set({ q: value })} />
      <Overview copy={copy} overview={overview} lang={lang} />
      <main className="sb__body">
        <FilterRail copy={copy} filters={filters} set={set} onReset={reset} />
        <section className="sb__results">
          <div className="sb__sortbar">
            <div className="sb__sortbar-l">
              {error ? `Error: ${error}` : count == null ? copy.loading : `${count} ${copy.results}`}
            </div>
          </div>

          {results == null && <div className="sb__loading">{copy.loading}</div>}

          {results != null && results.length === 0 && !error && (
            <div className="sb__empty">
              <h3>{copy.emptyTitle}</h3>
              <p>{copy.emptyText}</p>
              <button className="sb__reset" onClick={reset}>{copy.reset}</button>
            </div>
          )}

          {results != null && results.map((item) => <ResourceCard key={item.id} item={item} copy={copy} />)}
        </section>
      </main>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('resources-root')).render(<ResourcesApp />);
