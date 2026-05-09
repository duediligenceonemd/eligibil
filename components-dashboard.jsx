// Dashboard components — app.eligibil.org
const { useState: _useState, useEffect: _useEffect } = React;

// ── Shared Sidebar (used on dashboard, grant, events, consortium) ─────────────
function Sidebar({ activePage = 'dashboard' }) {
  const [user, setUser]       = _useState(window.__USER    || null);
  const [startup, setStartup] = _useState(window.__STARTUP || null);

  _useEffect(() => {
    // Populate from already-resolved auth, or wait for auth-ready event
    if (window.__USER) { setUser(window.__USER); setStartup(window.__STARTUP); }
    const handler = e => { setUser(e.detail.user); setStartup(e.detail.startup); };
    window.addEventListener('auth-ready', handler);
    return () => window.removeEventListener('auth-ready', handler);
  }, []);

  const initials = startup?.name
    ? startup.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : (user ? (user.firstName?.[0] || user.email[0]).toUpperCase() : '?');

  const groups = [
    { t: 'Lucru', links: [
      { i: '◈', l: 'Dashboard',     href: '/dashboard.html',   page: 'dashboard' },
      { i: '✦', l: 'Profil startup', href: '/profile.html', badge: '65%', page: 'profile' },
    ]},
    { t: 'Analiză', links: [
      { i: '◱', l: 'Pitch Deck',     href: '#' },
      { i: '▶', l: 'Video Pitch',    href: '#' },
      { i: '☰', l: 'Whitepaper',     href: '#' },
      { i: '⌘', l: 'Website & GH',   href: '#' },
      { i: '⟳', l: 'Istoric analize',href: '#' },
    ]},
    { t: 'Finanțare', links: [
      { i: '★', l: 'Top matchuri',   href: '/grant.html',       badge: '12', page: 'grant' },
      { i: '⌬', l: 'Explorează',     href: '/grant.html' },
      { i: '⏰', l: 'Alerte',         href: '#',                 badge: '3' },
      { i: '♥', l: 'Salvate',         href: '#' },
    ]},
    { t: 'Acțiune', links: [
      { i: '✎', l: 'Documente',      href: '#' },
      { i: '≡', l: 'Pipeline',        href: '#',                 badge: '5' },
      { i: '⬡', l: 'Consorțiu',      href: '/consortium.html',  page: 'consortium' },
      { i: '↗', l: 'Roadmap',         href: '#' },
      { i: '⎙', l: 'Rapoarte donator',href: '#' },
    ]},
    { t: 'Informare', links: [
      { i: '◉', l: 'News & events',  href: '/events.html',      dot: true, page: 'events' },
      { i: '⚙', l: 'Setări',          href: '#' },
    ]},
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar__brand">
        <a href="/index.html" style={{ textDecoration: 'none' }}>
          <div className="sidebar__logo">eligibil<span style={{ color: 'var(--accent)' }}>.eu</span></div>
        </a>
        <span className="sidebar__env">APP</span>
      </div>
      {groups.map((g, i) => (
        <div className="sidebar__group" key={i}>
          <div className="sidebar__group-t">{g.t}</div>
          {g.links.map((l, j) => (
            <a
              key={j}
              href={l.href || '#'}
              className={`sidebar__link ${(l.page && l.page === activePage) ? 'is-active' : ''}`}
              style={{ textDecoration: 'none', color: 'inherit', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span className="sidebar__link-icon">{l.i}</span>
                <span>{l.l}</span>
              </div>
              {l.badge && <span className={`sidebar__badge ${l.dot ? 'alt' : ''}`}>{l.badge}</span>}
            </a>
          ))}
        </div>
      ))}
      <div className="sidebar__foot" style={{ cursor: 'pointer' }} onClick={() => window.__logout?.()}>
        <div className="sidebar__avatar">{initials}</div>
        <div className="sidebar__who">
          <strong data-user-name="">{startup?.name || user?.firstName || '…'}</strong>
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10 }}>{startup?.stage || ''} · {startup?.country || user?.email || ''}</span>
        </div>
      </div>
    </aside>
  );
}

function Topbar() {
  return (
    <div className="topbar">
      <div className="topbar__crumbs"><span>APP</span> / <strong>Dashboard</strong></div>
      <div className="topbar__search">
        <span style={{ color: 'var(--muted)', fontFamily: 'JetBrains Mono, monospace', fontSize: 12 }}>⌕</span>
        <input placeholder="Caută granturi, documente, parteneri…" />
        <span className="topbar__kbd">⌘K</span>
      </div>
      <div className="topbar__actions">
        <button className="topbar__icon" title="Alertele tale">
          <span style={{ fontFamily: 'JetBrains Mono, monospace' }}>⏰</span>
          <span className="topbar__icon-dot"></span>
        </button>
        <button className="topbar__icon" title="Notificări">
          <span style={{ fontFamily: 'JetBrains Mono, monospace' }}>◉</span>
        </button>
        <button className="btn btn--sm btn--accent">+ Artefact nou</button>
      </div>
    </div>
  );
}

function Ring({ value = 70, size = 140, stroke = 10, color = 'var(--accent)' }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const dash = (value / 100) * c;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--bg-2)" strokeWidth={stroke} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={`${dash} ${c}`} strokeDashoffset={0}
        strokeLinecap="butt"
        transform={`rotate(-90 ${size/2} ${size/2})`} />
    </svg>
  );
}

function ReadinessCell({ score }) {
  const val = score ?? 73;
  return (
    <div className="dash-cell">
      <div className="dash-cell__h"><span>Readiness Score</span><a href="#">Detalii →</a></div>
      <div className="readiness">
        <div className="ring">
          <Ring value={val} size={140} stroke={10} />
          <div className="ring__val">
            <strong>{val}</strong><span>/ 100</span>
          </div>
        </div>
        <div className="readiness__meta">
          <strong>Growth-ready</strong>
          Profilul tău e competitiv pentru programe de scale-up. Gap major pe financial model și impact.
          <div className="readiness__delta">▲ +6 · 7 zile</div>
        </div>
      </div>
    </div>
  );
}

function MetricsCell() {
  return (
    <div className="dash-cell">
      <div className="dash-cell__h"><span>Metrici cheie</span><span className="mono">7 zile</span></div>
      <div className="metrics">
        <div className="metric">
          <div className="metric__k">Match mediu</div>
          <div className="metric__v">74<span style={{fontSize:14, color:'var(--muted)'}}>/100</span></div>
          <div className="metric__d up">▲ +4 pct</div>
        </div>
        <div className="metric">
          <div className="metric__k">Docs analizate</div>
          <div className="metric__v">12</div>
          <div className="metric__d up">▲ +3 săpt</div>
        </div>
        <div className="metric">
          <div className="metric__k">Granturi pipeline</div>
          <div className="metric__v">22</div>
          <div className="metric__d">5 active</div>
        </div>
        <div className="metric">
          <div className="metric__k">Finanț. potențială</div>
          <div className="metric__v">€4.2M</div>
          <div className="metric__d">în pipeline</div>
        </div>
      </div>
    </div>
  );
}

function AlertsCell({ alerts }) {
  const items = alerts
    ? alerts.map(a => ({
        kind:  a.urgency === 'high' ? 'warn' : a.urgency === 'low' ? 'info' : '',
        title: a.text,
        sub:   '',
        meta:  a.type,
      }))
    : DASH_ALERTS;
  return (
    <div className="dash-cell">
      <div className="dash-cell__h"><span>Alerte & acțiuni</span><a href="#">Toate ({items.length}) →</a></div>
      <div className="alerts-list">
        {items.map((a, i) => (
          <div key={i} className={`alert ${a.kind === 'warn' ? 'warn' : a.kind === 'info' ? 'info' : ''}`}>
            <div className="alert__bar"></div>
            <div className="alert__body">
              <strong>{a.title}</strong>
              {a.sub && <span>{a.sub}</span>}
            </div>
            <div className="alert__meta">{a.meta}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TopGrants({ apiGrants }) {
  const grants = apiGrants
    ? apiGrants.map(g => {
        const local = DASH_GRANTS.find(d => d.id === g.id) || {};
        return {
          ...local,
          ...g,
          from:       g.from       ?? local.from       ?? '—',
          flag:       g.flag       ?? local.flag       ?? '',
          readiness:  g.readiness  ?? local.readiness  ?? g.match,
          confidence: g.confidence ?? local.confidence ?? Math.round(g.match * 0.9),
          days:       g.days       ?? local.days       ?? null,
        };
      })
    : DASH_GRANTS;
  return (
    <div className="dash-block">
      <div className="dash-block__head">
        <div>
          <div className="dash-block__h">Top 5 granturi recomandate AI</div>
          <div className="dash-block__sub">Calculat din profilul tău · actualizat acum 14 minute</div>
        </div>
        <div className="dash-block__actions">
          <a href="/grant.html" className="btn btn--ghost btn--sm">Explorează catalog</a>
          <button className="btn btn--sm btn--accent">+ Adaugă în pipeline</button>
        </div>
      </div>
      <div className="top-grants">
        {grants.map((g, i) => (
          <div className="tg-row" key={i}>
            <div className="tg-rank">#{String(i+1).padStart(2,'0')}</div>
            <div className="tg-main">
              <strong>{g.name}</strong>
              <span>{g.from} · {g.flag}</span>
            </div>
            <div className="tg-scores">
              <div className="tg-score"><span className="tg-score-k">Mat</span><div className="tg-bar"><div className="tg-bar__fill" style={{width: g.match + '%'}}/></div><span className="tg-score-v">{g.match}</span></div>
              <div className="tg-score"><span className="tg-score-k">Rdy</span><div className="tg-bar"><div className="tg-bar__fill" style={{width: g.readiness + '%', background: 'var(--live)'}}/></div><span className="tg-score-v">{g.readiness}</span></div>
              <div className="tg-score"><span className="tg-score-k">Cnf</span><div className="tg-bar"><div className="tg-bar__fill" style={{width: g.confidence + '%', background: 'var(--warn)'}}/></div><span className="tg-score-v">{g.confidence}</span></div>
            </div>
            <div className="tg-deadline">
              <strong>{g.deadline}</strong>
              <span>{g.days != null ? `în ${g.days} zile` : 'rolling'}</span>
              <div className={`tg-status ${g.status}`}><span className="status-pill__dot" style={{ marginRight: 4 }}></span>{g.status === 'live' ? 'Activ' : 'Curând'}</div>
            </div>
            <div className="tg-meta">{g.amount}</div>
            <div className="tg-cta">
              <a href="/grant.html" className="btn btn--ghost btn--sm">Detalii →</a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PipelineMini() {
  return (
    <div className="dash-block">
      <div className="dash-block__head">
        <div>
          <div className="dash-block__h">Pipeline aplicări</div>
          <div className="dash-block__sub">22 granturi · 10 stadii · drag &amp; drop</div>
        </div>
        <div className="dash-block__actions">
          <button className="btn btn--ghost btn--sm">Vezi Kanban complet →</button>
        </div>
      </div>
      <div className="pipeline-mini">
        {DASH_PIPELINE.map((c, i) => (
          <div className="pipe-col" key={i}>
            <div className="pipe-col__h">
              <span>{c.col}</span>
              <span className="pipe-col__n">{c.n}</span>
            </div>
            {c.items.map((it, j) => (
              <div className="pipe-card" key={j}>
                <strong>{it.name}</strong>
                <div className="pipe-card__meta"><span>{it.meta.split(' · ')[0]}</span><span>{it.meta.split(' · ')[1]}</span></div>
                <div className="pipe-card__bar"><div className="pipe-card__bar-fill" style={{width: it.pct + '%'}}/></div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function Activity() {
  return (
    <div className="dash-block" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div className="dash-block__head">
        <div>
          <div className="dash-block__h">Activitate recentă</div>
          <div className="dash-block__sub">Ultimele 7 zile</div>
        </div>
        <button className="btn btn--ghost btn--sm">Istoric complet →</button>
      </div>
      <div className="activity" style={{ flex: 1 }}>
        {DASH_ACTIVITY.map((a, i) => (
          <div className={`act ${a.kind}`} key={i}>
            <div className="act__dot"></div>
            <div className="act__body">
              <strong>{a.txt}</strong> — <span>{a.sub}</span>
            </div>
            <div className="act__time">{a.time}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function QuickActions() {
  return (
    <div className="dash-block">
      <div className="dash-block__head">
        <div>
          <div className="dash-block__h">Acțiuni rapide</div>
          <div className="dash-block__sub">Ce vrei să faci acum</div>
        </div>
      </div>
      <div className="quick">
        {DASH_QUICK.map((q, i) => (
          <div className="qa" key={i}>
            <div className="qa__icon">{q.icon}</div>
            <div className="qa__h">{q.h}</div>
            <div className="qa__d">{q.d}</div>
            <div className="qa__arrow">{q.cta}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Artefacts() {
  return (
    <>
      <div className="sec-h">
        <h2>Artefactele tale</h2>
        <span className="mono">4 / 4 · Profil AI construit</span>
      </div>
      <div className="artefacts">
        {DASH_ARTEFACTS.map((a, i) => (
          <div className="arte" key={i}>
            <div className="arte__head">
              <div className="arte__name">{a.name}</div>
              <span className={`arte__badge ${a.status}`}>{a.status === 'up' ? 'OK' : a.status === 'stale' ? 'Stale' : 'Proces.'}</span>
            </div>
            <div className="arte__score">
              {a.score != null ? <><strong>{a.score}</strong><span>/ 100</span></> : <span style={{fontSize:15,color:'var(--muted)',fontFamily:'JetBrains Mono'}}>— în analiză —</span>}
            </div>
            <div className="arte__meta"><span>{a.v}</span><span>{a.date}</span></div>
            <div className="arte__cta">{a.cta} →</div>
          </div>
        ))}
      </div>
    </>
  );
}

function CompleteBanner({ completeness }) {
  const pct = completeness ?? 65;
  return (
    <div className="complete-banner">
      <div className="complete-banner__body">
        <div className="complete-banner__pct">{pct}%</div>
        <div className="complete-banner__txt">
          <strong>Profilul tău este {pct}% complet</strong>
          <span>Adaugă financial model și 2 membri ai echipei pentru a debloca +14 granturi potrivite și +18% Readiness Score.</span>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button className="btn btn--ghost btn--sm">Mai târziu</button>
        <a href="/profile.html" className="btn btn--sm btn--accent">Completează profilul →</a>
      </div>
      <div className="complete-banner__bar"><div className="complete-banner__bar-fill" style={{ width: pct + '%' }}></div></div>
    </div>
  );
}

function DashApp() {
  const [user, setUser]       = _useState(window.__USER    || null);
  const [startup, setStartup] = _useState(window.__STARTUP || null);
  const [dashData, setDashData] = _useState(null);

  _useEffect(() => {
    // Pick up auth from auth.js
    if (window.__USER) { setUser(window.__USER); setStartup(window.__STARTUP); }
    const h = e => { setUser(e.detail.user); setStartup(e.detail.startup); };
    window.addEventListener('auth-ready', h);
    return () => window.removeEventListener('auth-ready', h);
  }, []);

  _useEffect(() => {
    // Load real dashboard data from API
    fetch('/api/dashboard', { credentials: 'same-origin' })
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setDashData(d); })
      .catch(() => {});
  }, []);

  const firstName = startup?.name || user?.firstName || 'tu';
  const today = new Date().toLocaleDateString('ro-RO', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <div className="app">
      <Sidebar activePage="dashboard" />
      <div className="main">
        <Topbar />
        <CompleteBanner completeness={dashData?.completeness} />

        <div className="sec-h">
          <h2>Bună, {firstName} 👋</h2>
          <span className="mono">{today}</span>
        </div>
        <div className="dash-grid">
          <ReadinessCell score={dashData?.readiness} />
          <MetricsCell />
          <AlertsCell alerts={dashData?.alerts} />
        </div>

        <TopGrants apiGrants={dashData?.topGrants} />
        <PipelineMini />

        <div className="row-2">
          <Activity />
          <QuickActions />
        </div>

        <Artefacts />
      </div>
    </div>
  );
}

const _dashRoot = document.getElementById('dash-root');
if (_dashRoot) ReactDOM.createRoot(_dashRoot).render(<DashApp />);
