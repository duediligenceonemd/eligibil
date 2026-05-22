// Search page — eligibil.org
// Public catalog browser. Reads /api/grants (now public) with filters,
// debounces input, syncs URL params for shareable searches, renders
// result cards linking to /ro/granturi/<slug> from Pas 2.
const { useState, useEffect, useMemo, useRef } = React;

// ── Filter option lists. Free-form text columns in DB so we use ilike,
//    these are convenience presets — users typing "AI" still works.
const SECTORS  = ['', 'AI', 'Biotech', 'Climate', 'Climate-tech', 'Deep Tech', 'Edtech', 'Fintech', 'Healthtech', 'IoT', 'Mobility', 'SaaS'];
const STADII   = ['', 'Idee', 'MVP', 'Pre-seed', 'Seed', 'Series A', 'Series B'];
const TARI     = ['', 'Moldova', 'România', 'EU', 'Global'];
const TIPURI   = ['', 'Grant', 'Accelerator', 'Equity', 'Loan', 'VC Fund', 'Competiție'];
const LANGUAGES = ['', 'en', 'ro', 'fr', 'de'];
const SORTS = [
  { v: 'difficulty', label: 'Dificultate (ușor → greu)' },
  { v: 'amount',     label: 'Sumă (mare → mic)' },
  { v: 'name',       label: 'Nume (A → Z)' },
];

const DEFAULT_FILTERS = {
  q: '', sector: '', tara: '', stadiu: '', tip: '',
  min: '', max: '', dilutiv: '', language: '',
  sort: 'difficulty',
};

function trackAnalytics(eventName, payload) {
  if (window.eligibilAnalytics && typeof window.eligibilAnalytics.track === 'function') {
    window.eligibilAnalytics.track(eventName, payload);
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatAmount(min, max) {
  const fmt = (n) => n >= 1_000_000 ? `€${(n / 1_000_000).toFixed(1).replace('.0', '')}M`
                   : n >= 1000      ? `€${Math.round(n / 1000)}K`
                                    : `€${n}`;
  if (min && max && min !== max) return `${fmt(min)} – ${fmt(max)}`;
  if (max) return `până la ${fmt(max)}`;
  if (min) return `de la ${fmt(min)}`;
  return '—';
}

const RO_MONTHS = { ian:0, feb:1, mar:2, apr:3, mai:4, iun:5, iul:6, aug:7, sep:8, oct:9, noi:10, dec:11 };

function parseDeadline(str) {
  if (!str) return null;
  const m = String(str).match(/(\d{1,2})\s+(\w+)\s+(\d{4})/);
  if (!m) return null;
  const month = RO_MONTHS[m[2].toLowerCase().slice(0, 3)];
  if (month === undefined) return null;
  const d = new Date(parseInt(m[3], 10), month, parseInt(m[1], 10));
  return isNaN(d) ? null : d;
}

function daysUntil(date) {
  if (!date) return null;
  return Math.ceil((date - new Date()) / (1000 * 60 * 60 * 24));
}

function deadlineChip(deadline) {
  const d = parseDeadline(deadline);
  if (!d) return { text: deadline || 'Rolling', cls: '' };
  const days = daysUntil(d);
  if (days < 0)  return { text: 'Închis', cls: '' };
  if (days < 7)  return { text: `${days} zile`, cls: 'sb__chip--deadline-crit' };
  if (days < 14) return { text: `${days} zile`, cls: 'sb__chip--deadline-soon' };
  return { text: `${days} zile`, cls: '' };
}

function evidenceLabel(status) {
  switch (status) {
    case 'verified_primary':         return 'Verified';
    case 'verified_secondary':       return 'Cross-checked';
    case 'ai_extracted_unverified':  return 'AI extras';
    case 'hypothesis':               return 'Ipoteză';
    default:                         return null;
  }
}

function detailUrl(grant) {
  if (grant.slug_ro) return `/ro/granturi/${grant.slug_ro}`;
  // Pas 1 not applied yet — fall back to legacy detail page so cards still work.
  return `/grant.html?id=${encodeURIComponent(grant.id)}`;
}

function readUrlFilters() {
  if (typeof window === 'undefined') return DEFAULT_FILTERS;
  const p = new URLSearchParams(window.location.search);
  const out = { ...DEFAULT_FILTERS };
  for (const k of Object.keys(DEFAULT_FILTERS)) {
    if (p.has(k)) out[k] = p.get(k);
  }
  return out;
}

function writeUrlFilters(filters) {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(filters)) {
    if (v !== '' && v != null && !(k === 'sort' && v === DEFAULT_FILTERS.sort)) p.set(k, v);
  }
  const qs = p.toString();
  const next = qs ? `?${qs}` : window.location.pathname;
  window.history.replaceState(null, '', next);
}

// ── Components ────────────────────────────────────────────────────────────────
function Topbar() {
  const lang = (typeof window !== 'undefined' && window.__LANG__) || 'ro';
  const resourcesHref = lang === 'en' ? '/en/resources' : '/resurse';
  const eventsHref = lang === 'en' ? '/events' : '/evenimente';
  return (
    <header className="sb__top">
      <a className="sb__brand" href="/">eligibil<span>.org</span></a>
      <nav className="sb__nav">
        <a href="/">Acasă</a>
        <a href="/search">Caută</a>
        <a href={resourcesHref}>{lang === 'en' ? 'Resources' : 'Resurse'}</a>
        <a href={eventsHref}>{lang === 'en' ? 'Events' : 'Evenimente'}</a>
        <a className="sb__cta" href="/register.html">Începe gratuit →</a>
      </nav>
    </header>
  );
}

function Hero({ count, q, onQ }) {
  return (
    <section className="sb__hero">
      <h1>Caută finanțare pentru startupul tău</h1>
      <p>Granturi, acceleratoare și capital non-dilutiv pentru Moldova, România și UE. Filtrele se sincronizează în URL — share linkul direct.</p>
      <div className="sb__searchwrap">
        <input
          className="sb__search"
          type="search"
          placeholder="Caută după nume, descriere sau funder…"
          value={q}
          onChange={(e) => onQ(e.target.value)}
          autoComplete="off"
        />
        <span className="sb__count">{count == null ? '…' : `${count} rezultate`}</span>
      </div>
    </section>
  );
}

function FilterRail({ filters, set, onReset }) {
  const u = (k) => (e) => set({ [k]: e.target.value });
  return (
    <aside className="sb__filters">
      <div className="sb__filterset">
        <label htmlFor="f-sector">Sector</label>
        <select id="f-sector" value={filters.sector} onChange={u('sector')}>
          {SECTORS.map(s => <option key={s} value={s}>{s || 'Oricare'}</option>)}
        </select>
      </div>
      <div className="sb__filterset">
        <label htmlFor="f-tara">Țară</label>
        <select id="f-tara" value={filters.tara} onChange={u('tara')}>
          {TARI.map(s => <option key={s} value={s}>{s || 'Oricare'}</option>)}
        </select>
      </div>
      <div className="sb__filterset">
        <label htmlFor="f-stadiu">Stadiu</label>
        <select id="f-stadiu" value={filters.stadiu} onChange={u('stadiu')}>
          {STADII.map(s => <option key={s} value={s}>{s || 'Oricare'}</option>)}
        </select>
      </div>
      <div className="sb__filterset">
        <label htmlFor="f-tip">Tip</label>
        <select id="f-tip" value={filters.tip} onChange={u('tip')}>
          {TIPURI.map(s => <option key={s} value={s}>{s || 'Oricare'}</option>)}
        </select>
      </div>
      <div className="sb__filterset">
        <label>Sumă (EUR)</label>
        <div className="sb__amount-row">
          <input type="number" placeholder="min" value={filters.min} onChange={u('min')} />
          <input type="number" placeholder="max" value={filters.max} onChange={u('max')} />
        </div>
      </div>
      <div className="sb__filterset">
        <label htmlFor="f-dilutiv">Tip capital</label>
        <select id="f-dilutiv" value={filters.dilutiv} onChange={u('dilutiv')}>
          <option value="">Oricare</option>
          <option value="false">Non-dilutiv</option>
          <option value="true">Dilutiv</option>
        </select>
      </div>
      <div className="sb__filterset">
        <label htmlFor="f-lang">Limba aplicării</label>
        <select id="f-lang" value={filters.language} onChange={u('language')}>
          {LANGUAGES.map(s => <option key={s} value={s}>{s || 'Oricare'}</option>)}
        </select>
      </div>
      <button className="sb__reset" onClick={onReset}>Reset filtre</button>
    </aside>
  );
}

function ResultCard({ g }) {
  const lang = (typeof window !== 'undefined' && window.__LANG__) || 'ro';
  const isEn = lang === 'en';
  const name    = isEn ? (g.nume_program_en || g.nume_program) : g.nume_program;
  const summary = isEn ? (g.short_summary_en || g.short_summary_ro) : (g.short_summary_ro || g.short_summary_en);
  const funder  = g.funder_name || g.organizatie || '';
  const country = g.funder_country || g.tara || '';
  const dl      = deadlineChip(g.deadline);
  const ev      = evidenceLabel(g.evidence_status);

  return (
    <a className="sb__card" href={detailUrl(g)} onClick={() => trackAnalytics('funding_viewed', {
      funding_id: g.id,
      funding_type: g.tip || '',
      country: g.tara || '',
      has_deadline: !!g.deadline,
    })}>
      <div className="sb__card-row1">
        <div className="sb__card-name">{name}</div>
        <div className="sb__card-amount">{formatAmount(g.suma_min, g.suma_max)}</div>
      </div>
      <div className="sb__card-row2">
        {funder && <span>{funder}</span>}
        {funder && country && <span className="sep">·</span>}
        {country && <span>{country}</span>}
        {g.tip && <><span className="sep">·</span><span>{g.tip}</span></>}
      </div>
      {summary && <p className="sb__card-summary">{summary}</p>}
      <div className="sb__card-row3">
        <span className={`sb__chip ${dl.cls}`}>{dl.text}</span>
        {ev && <span className={`sb__chip sb__chip--evidence-${g.evidence_status}`}>{ev}</span>}
        {g.dilutiv === false && <span className="sb__chip">Non-dilutiv</span>}
      </div>
    </a>
  );
}

function SearchApp() {
  const [filters, setFilters] = useState(readUrlFilters);
  const [results, setResults] = useState(null);   // null = initial loading
  const [error, setError]     = useState(null);
  const debounceRef = useRef(null);
  const firstRunRef = useRef(true);

  const set = (patch) => setFilters((f) => ({ ...f, ...patch }));
  const reset = () => setFilters({ ...DEFAULT_FILTERS });

  // Debounced fetch + URL sync
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      writeUrlFilters(filters);
      setError(null);
      try {
        const p = new URLSearchParams();
        for (const [k, v] of Object.entries(filters)) {
          if (v !== '' && v != null && k !== 'sort') p.set(k, v);
        }
        if (filters.sort) p.set('sort', filters.sort);
        p.set('limit', '60');
        const r = await fetch(`/api/grants?${p.toString()}`);
        if (!r.ok) throw new Error(`API ${r.status}`);
        const data = await r.json();
        setResults(Array.isArray(data) ? data : []);
        if (!firstRunRef.current) {
          trackAnalytics(filters.q ? 'search_performed' : 'filter_used', {
            query_length: (filters.q || '').trim().length,
            has_sector: !!filters.sector,
            has_country: !!filters.tara,
            has_stage: !!filters.stadiu,
            has_type: !!filters.tip,
            result_count: Array.isArray(data) ? data.length : 0,
            result_context: 'grants',
          });
        }
      } catch (err) {
        setError(err.message || 'Eroare necunoscută');
        setResults([]);
      }
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [filters]);

  useEffect(() => {
    firstRunRef.current = false;
  }, []);

  const count = results == null ? null : results.length;

  return (
    <div className="sb">
      <Topbar />
      <Hero count={count} q={filters.q} onQ={(v) => set({ q: v })} />
      <main className="sb__body">
        <FilterRail filters={filters} set={set} onReset={reset} />
        <section className="sb__results">
          <div className="sb__sortbar">
            <div className="sb__sortbar-l">
              {error ? `Eroare: ${error}` : count == null ? 'Se încarcă…' : `${count} granturi`}
            </div>
            <select value={filters.sort} onChange={(e) => set({ sort: e.target.value })}>
              {SORTS.map(s => <option key={s.v} value={s.v}>{s.label}</option>)}
            </select>
          </div>

          {results == null && <div className="sb__loading">Se încarcă granturile…</div>}

          {results != null && results.length === 0 && !error && (
            <div className="sb__empty">
              <h3>Niciun grant găsit</h3>
              <p>Încearcă să elimini un filtru sau să cauți cu un termen mai general.</p>
              <button className="sb__reset" onClick={reset}>Reset toate filtrele</button>
            </div>
          )}

          {results != null && results.map((g) => <ResultCard key={g.id} g={g} />)}
        </section>
      </main>
    </div>
  );
}

// ── AI Chat Widget (shared with grant page) ───────────────────────────────────
function SearchChatWidget() {
  const { useState, useEffect, useRef } = React;
  const [open, setOpen]       = useState(false);
  const [input, setInput]     = useState('');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [error, setError]     = useState(null);
  const bottomRef             = useRef(null);
  const inputRef              = useRef(null);

  const SUGGESTIONS = [
    'Ce granturi sunt disponibile pentru Moldova?',
    'Cum aleg între grant și accelerator?',
    'Ce documente am nevoie în general?',
    'Granturi pentru AI startups?',
  ];

  useEffect(() => {
    if (open && bottomRef.current) bottomRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [history, open]);
  useEffect(() => { if (open && inputRef.current) inputRef.current.focus(); }, [open]);

  async function send(text) {
    const msg = (text || input).trim();
    if (!msg || loading) return;
    setInput(''); setError(null);
    const newHistory = [...history, { role: 'user', content: msg }];
    setHistory(newHistory); setLoading(true);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg, history: newHistory.slice(-8), language: 'ro' }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Eroare'); setHistory(p => p.slice(0, -1)); }
      else setHistory(p => [...p, { role: 'assistant', content: data.reply }]);
    } catch { setError('Eroare conexiune.'); setHistory(p => p.slice(0, -1)); }
    finally { setLoading(false); }
  }

  return (
    <div className="gchat">
      <button className={`gchat__btn${open ? ' gchat__btn--open' : ''}`} onClick={() => setOpen(v => !v)} title="Consilier AI granturi">
        {open ? '✕' : '💬'}
        {!open && <span className="gchat__badge">AI</span>}
      </button>
      {open && (
        <div className="gchat__panel">
          <div className="gchat__head">
            <div className="gchat__head-icon">🤖</div>
            <div><div className="gchat__head-t">Consilier AI</div><div className="gchat__head-s">Întreabă despre granturi</div></div>
            <button className="gchat__close" onClick={() => setOpen(false)}>✕</button>
          </div>
          <div className="gchat__msgs">
            {history.length === 0 && (
              <div className="gchat__welcome">
                <div className="gchat__welcome-t">Bună! Cu ce te pot ajuta?</div>
                <div className="gchat__chips">
                  {SUGGESTIONS.map((s, i) => <button key={i} className="gchat__chip" onClick={() => send(s)}>{s}</button>)}
                </div>
              </div>
            )}
            {history.map((m, i) => (
              <div key={i} className={`gchat__msg gchat__msg--${m.role}`}>
                {m.role === 'assistant' && <span className="gchat__avatar">🤖</span>}
                <div className="gchat__bubble">{m.content}</div>
              </div>
            ))}
            {loading && <div className="gchat__msg gchat__msg--assistant"><span className="gchat__avatar">🤖</span><div className="gchat__bubble gchat__bubble--loading"><span className="gchat__dot"/><span className="gchat__dot"/><span className="gchat__dot"/></div></div>}
            {error && <div className="gchat__error">{error}</div>}
            <div ref={bottomRef}/>
          </div>
          <div className="gchat__input-row">
            <textarea ref={inputRef} className="gchat__input" rows={2} placeholder="Întreabă despre granturi, eligibilitate..." value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key==='Enter'&&!e.shiftKey){e.preventDefault();send();}}} disabled={loading} maxLength={1500}/>
            <button className="gchat__send" onClick={() => send()} disabled={loading||!input.trim()}>{loading?'…':'→'}</button>
          </div>
        </div>
      )}
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('search-root'));
root.render(<SearchApp />);

if (document.getElementById('search-chat-root')) {
  ReactDOM.createRoot(document.getElementById('search-chat-root')).render(<SearchChatWidget />);
}
