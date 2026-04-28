// Profile components — app.eligibil.eu
const { useState, useEffect, useRef, useCallback } = React;

// ── Constants ─────────────────────────────────────────────────────────────────
const SECTORS = [
  'AI & ML', 'Biotech & Health', 'Climate Tech', 'Fintech', 'EdTech',
  'Deep Tech', 'Hardware & IoT', 'SaaS & Web', 'AgriFood', 'Space',
  'Social Impact', 'Altele',
];

const STAGES = [
  'Idee', 'Pre-seed', 'Seed', 'Seria A', 'Seria B', 'Seria C+',
  'Growth', 'Scale-up',
];

const COUNTRIES = [
  'România', 'Moldova', 'Bulgaria', 'Ungaria', 'Polonia', 'Cehia',
  'Slovacia', 'Austria', 'Germania', 'Franța', 'Spania', 'Italia',
  'Olanda', 'Belgia', 'Suedia', 'Danemarca', 'Finlanda', 'Estonia',
  'Letonia', 'Lituania', 'Altă țară UE', 'Altă țară',
];

const GOALS = [
  'Granturi UE', 'Granturi naționale', 'Capital non-dilutiv',
  'Accelerator', 'Consorții R&D', 'Competiții', 'Fonduri VC',
];

const AMOUNT_LABELS = [
  '< €50k', '€50k–200k', '€200k–500k',
  '€500k–1M', '€1M–3M', '€3M–10M', '> €10M',
];

const TABS = [
  { id: 'info',       label: 'Info' },
  { id: 'echipa',     label: 'Echipă' },
  { id: 'obiective',  label: 'Obiective' },
  { id: 'artefacte',  label: 'Artefacte' },
  { id: 'confidence', label: 'Confidence' },
];

const ARTEFACTS = [
  {
    id: 'pitchDeck',
    icon: '◱',
    name: 'Pitch Deck',
    desc: 'Prezentare investitori, max 20 slide-uri',
    impact: 'high',
    impactLabel: '+18 pts',
    type: 'file',
  },
  {
    id: 'videoPitch',
    icon: '▶',
    name: 'Video Pitch',
    desc: 'Demo / founder video, 2–5 minute',
    impact: 'high',
    impactLabel: '+14 pts',
    type: 'file',
  },
  {
    id: 'whitepaper',
    icon: '☰',
    name: 'Whitepaper / Dosar tehnic',
    desc: 'Documentație tehnică sau cercetare',
    impact: 'medium',
    impactLabel: '+10 pts',
    type: 'file',
  },
  {
    id: 'websiteGithub',
    icon: '⌘',
    name: 'Website / GitHub',
    desc: 'URL-ul principal al produsului sau repo public',
    impact: 'medium',
    impactLabel: '+8 pts',
    type: 'link',
  },
];

const CONFIDENCE_FIELDS = [
  { key: 'email',       label: 'Email',        impact: 'high',   check: f => !!(f._email) },
  { key: 'startupName', label: 'Startup name', impact: 'high',   check: f => !!(f.startupName?.trim()) },
  { key: 'pitch',       label: 'Pitch',        impact: 'high',   check: f => !!(f.pitch?.trim()) },
  { key: 'sector',      label: 'Sector',       impact: 'high',   check: f => !!(f.sector) },
  { key: 'stage',       label: 'Etapă',        impact: 'high',   check: f => !!(f.stage) },
  { key: 'trl',         label: 'TRL',          impact: 'medium', check: f => !!(f.trl) },
  { key: 'country',     label: 'Țară',         impact: 'medium', check: f => !!(f.country) },
  { key: 'teamSize',    label: 'Team size',    impact: 'medium', check: f => !!(f.teamSize) },
  { key: 'goals',       label: 'Obiective',    impact: 'high',   check: f => !!(f.goals?.length) },
  { key: 'github',      label: 'GitHub/Web',   impact: 'medium', check: f => !!(f.websiteGithub?.trim() || f.website?.trim()) },
];

// ── Default form state ────────────────────────────────────────────────────────
const DEFAULT_FORM = {
  startupName:    '',
  website:        '',
  pitch:          '',
  sector:         '',
  stage:          '',
  trl:            '',
  country:        'România',
  teamSize:       '',
  team:           [{ name: '', role: '', linkedin: '' }],
  goals:          [],
  amountIdx:      2,
  horizon:        '',
  priority:       '',
  pitchDeck:      '',
  videoPitch:     '',
  whitepaper:     '',
  websiteGithub:  '',
  _email:         '',
};

// ── Utility ───────────────────────────────────────────────────────────────────
function computeConfidence(form) {
  const filled = CONFIDENCE_FIELDS.filter(f => f.check(form)).length;
  return Math.round((filled / CONFIDENCE_FIELDS.length) * 100);
}

// ── Field components ──────────────────────────────────────────────────────────
function Field({ label, required, children, full }) {
  return (
    <div className={`profile__field${full ? ' profile__field--full' : ''}`}>
      <label className="profile__label">
        {label}
        {required && <span className="profile__label-req">*</span>}
      </label>
      {children}
    </div>
  );
}

// ── Tab: Info ─────────────────────────────────────────────────────────────────
function TabInfo({ form, onChange, onBlur }) {
  return (
    <div>
      <div className="profile__section">
        <h2 className="profile__section-h">Informații startup</h2>
        <p className="profile__section-sub">Date de bază despre compania ta — folosite pentru matching și eligibilitate.</p>
        <div className="profile__grid">
          <Field label="Nume startup" required>
            <input
              className="profile__input"
              value={form.startupName}
              placeholder="ex. TechVenture SRL"
              onChange={e => onChange('startupName', e.target.value)}
              onBlur={onBlur}
            />
          </Field>
          <Field label="Website">
            <input
              className="profile__input"
              value={form.website}
              placeholder="https://startup.ro"
              onChange={e => onChange('website', e.target.value)}
              onBlur={onBlur}
            />
          </Field>
          <Field label="Sector" required>
            <select
              className="profile__select"
              value={form.sector}
              onChange={e => onChange('sector', e.target.value)}
              onBlur={onBlur}
            >
              <option value="">— Selectează sector —</option>
              {SECTORS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </Field>
          <Field label="Etapă de dezvoltare" required>
            <select
              className="profile__select"
              value={form.stage}
              onChange={e => onChange('stage', e.target.value)}
              onBlur={onBlur}
            >
              <option value="">— Selectează etapă —</option>
              {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </Field>
          <Field label="Nivel TRL (1–9)">
            <input
              className="profile__input"
              type="number"
              min="1"
              max="9"
              value={form.trl}
              placeholder="ex. 4"
              onChange={e => onChange('trl', e.target.value)}
              onBlur={onBlur}
            />
          </Field>
          <Field label="Țară de înregistrare" required>
            <select
              className="profile__select"
              value={form.country}
              onChange={e => onChange('country', e.target.value)}
              onBlur={onBlur}
            >
              <option value="">— Selectează țara —</option>
              {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="Dimensiune echipă (FTE)">
            <input
              className="profile__input"
              type="number"
              min="1"
              value={form.teamSize}
              placeholder="ex. 5"
              onChange={e => onChange('teamSize', e.target.value)}
              onBlur={onBlur}
            />
          </Field>
        </div>
      </div>

      <div className="profile__section">
        <h2 className="profile__section-h">Pitch / Descriere</h2>
        <p className="profile__section-sub">O descriere clară a produsului, problemei și soluției. Max 500 caractere recomandat.</p>
        <div className="profile__grid profile__grid--full" style={{ marginTop: 20 }}>
          <Field label="Pitch (problema + soluție + piață)" required full>
            <textarea
              className="profile__textarea"
              value={form.pitch}
              placeholder="Descrieți succint ce problemă rezolvați, cum și pentru cine. ex. «Construim X pentru Y, deoarece Z.»"
              rows={5}
              onChange={e => onChange('pitch', e.target.value)}
              onBlur={onBlur}
            />
          </Field>
        </div>
        {form.pitch && (
          <div style={{
            fontFamily: 'JetBrains Mono, monospace', fontSize: 11,
            color: form.pitch.length > 500 ? 'var(--hot)' : 'var(--muted)',
            marginTop: 6, textAlign: 'right'
          }}>
            {form.pitch.length} / 500 caractere
          </div>
        )}
      </div>
    </div>
  );
}

// ── Tab: Echipă ───────────────────────────────────────────────────────────────
function TabEchipa({ form, onChange, onBlur }) {
  const addMember = () => {
    const team = [...(form.team || []), { name: '', role: '', linkedin: '' }];
    onChange('team', team);
  };

  const removeMember = (idx) => {
    const team = form.team.filter((_, i) => i !== idx);
    onChange('team', team.length ? team : [{ name: '', role: '', linkedin: '' }]);
    // Trigger save after removing
    setTimeout(onBlur, 10);
  };

  const updateMember = (idx, field, value) => {
    const team = form.team.map((m, i) => i === idx ? { ...m, [field]: value } : m);
    onChange('team', team);
  };

  return (
    <div className="profile__section">
      <h2 className="profile__section-h">Membrii echipei</h2>
      <p className="profile__section-sub">
        Listează co-fondatorii și membrii cheie. Profiluri LinkedIn cresc scorul de credibilitate.
      </p>
      <div style={{ marginTop: 20 }}>
        {(form.team || []).map((member, idx) => (
          <div className="profile__member" key={idx}>
            <Field label={idx === 0 ? 'Nume complet' : ''}>
              <input
                className="profile__input"
                value={member.name}
                placeholder="Ion Popescu"
                onChange={e => updateMember(idx, 'name', e.target.value)}
                onBlur={onBlur}
              />
            </Field>
            <Field label={idx === 0 ? 'Rol / Titlu' : ''}>
              <input
                className="profile__input"
                value={member.role}
                placeholder="CTO / Co-founder"
                onChange={e => updateMember(idx, 'role', e.target.value)}
                onBlur={onBlur}
              />
            </Field>
            <Field label={idx === 0 ? 'LinkedIn URL' : ''}>
              <input
                className="profile__input"
                value={member.linkedin}
                placeholder="https://linkedin.com/in/…"
                onChange={e => updateMember(idx, 'linkedin', e.target.value)}
                onBlur={onBlur}
              />
            </Field>
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
              {idx === 0 && (
                <label className="profile__label" style={{ visibility: 'hidden' }}>X</label>
              )}
              <button
                className="profile__member-remove"
                onClick={() => removeMember(idx)}
                title="Elimină membrul"
              >
                ✕
              </button>
            </div>
          </div>
        ))}
        <button className="profile__add-btn" onClick={addMember}>
          + Adaugă membru
        </button>
      </div>
    </div>
  );
}

// ── Tab: Obiective ────────────────────────────────────────────────────────────
function TabObiective({ form, onChange, onBlur }) {
  const toggleGoal = (goal) => {
    const goals = form.goals || [];
    const next = goals.includes(goal)
      ? goals.filter(g => g !== goal)
      : [...goals, goal];
    onChange('goals', next);
    setTimeout(onBlur, 10);
  };

  return (
    <div>
      <div className="profile__section">
        <h2 className="profile__section-h">Tipuri de finanțare urmărite</h2>
        <p className="profile__section-sub">
          Selectează instrumentele financiare relevante pentru tine. Acestea filtrează și prioritizează matchurile.
        </p>
        <div className="profile__goals">
          {GOALS.map(goal => {
            const active = (form.goals || []).includes(goal);
            return (
              <label key={goal} className={`profile__goal-item${active ? ' is-selected' : ''}`}>
                <input
                  type="checkbox"
                  checked={active}
                  onChange={() => toggleGoal(goal)}
                />
                {goal}
              </label>
            );
          })}
        </div>
      </div>

      <div className="profile__section">
        <h2 className="profile__section-h">Sumă și orizont de finanțare</h2>
        <p className="profile__section-sub">
          Estimările ajută algoritmul să filtreze programele după ticket size.
        </p>
        <div style={{ marginTop: 24 }}>
          <div className="profile__field">
            <label className="profile__label">Suma căutată</label>
            <input
              type="range"
              className="profile__range"
              min={0} max={6}
              value={form.amountIdx || 0}
              onChange={e => onChange('amountIdx', parseInt(e.target.value))}
              onMouseUp={onBlur}
              onTouchEnd={onBlur}
            />
            <div className="profile__range-label">{AMOUNT_LABELS[form.amountIdx || 0]}</div>
          </div>
        </div>
        <div className="profile__grid" style={{ marginTop: 20 }}>
          <Field label="Orizont de timp (ex. 12–18 luni)">
            <textarea
              className="profile__textarea"
              style={{ minHeight: 72 }}
              value={form.horizon}
              placeholder="ex. Căutăm finanțare în urmă­torii 12 luni pentru a lansa V2 și a intra pe piața germană."
              onChange={e => onChange('horizon', e.target.value)}
              onBlur={onBlur}
            />
          </Field>
          <Field label="Prioritate strategică">
            <textarea
              className="profile__textarea"
              style={{ minHeight: 72 }}
              value={form.priority}
              placeholder="ex. Prioritate: granturi non-dilutive UE, apoi acceleratoare cu focus deep tech."
              onChange={e => onChange('priority', e.target.value)}
              onBlur={onBlur}
            />
          </Field>
        </div>
      </div>
    </div>
  );
}

// ── Tab: Artefacte ────────────────────────────────────────────────────────────
function TabArtefacte({ form, onChange, onBlur }) {
  return (
    <div className="profile__section">
      <h2 className="profile__section-h">Artefacte startup</h2>
      <p className="profile__section-sub">
        Documentele și resursele online care susțin aplicațiile la granturi. Fiecare artefact crește scorul de Confidence.
      </p>
      <div style={{ marginTop: 24 }}>
        {ARTEFACTS.map(art => {
          const value = form[art.id] || '';
          const hasValue = !!value.trim();
          return (
            <div className="profile__artefact" key={art.id}>
              <div className="profile__artefact-icon">{art.icon}</div>
              <div className="profile__artefact-body">
                <h3 className="profile__artefact-name">{art.name}</h3>
                <p className="profile__artefact-desc">{art.desc}</p>
                <span className={`profile__artefact-impact ${art.impact}`}>
                  Impact: {art.impactLabel}
                </span>
                {art.type === 'link' && (
                  <div style={{ marginTop: 14 }}>
                    <input
                      className="profile__input"
                      value={value}
                      placeholder="https://…"
                      onChange={e => onChange(art.id, e.target.value)}
                      onBlur={onBlur}
                    />
                  </div>
                )}
                {art.type === 'file' && (
                  <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
                    <button className="profile__upload-btn">
                      ↑ Încarcă fișier
                    </button>
                    {hasValue && (
                      <span style={{
                        fontFamily: 'JetBrains Mono, monospace',
                        fontSize: 11.5,
                        color: 'var(--ink-2)',
                      }}>{value}</span>
                    )}
                  </div>
                )}
              </div>
              <div className={`profile__artefact-status ${hasValue ? 'uploaded' : 'missing'}`}>
                <span>{hasValue ? '✓ Încărcat' : '○ Lipsă'}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Tab: Confidence ───────────────────────────────────────────────────────────
function TabConfidence({ form }) {
  const pct = computeConfidence(form);
  const barClass = pct >= 75 ? 'high' : pct >= 40 ? 'medium' : 'low';

  return (
    <div>
      <div className="confidence-score">
        <div className="confidence-score__pct">{pct}%</div>
        <div className="confidence-score__body">
          <h2 className="confidence-score__title">
            {pct >= 75 ? 'Profil puternic' : pct >= 45 ? 'Profil în progres' : 'Profil incomplet'}
          </h2>
          <p className="confidence-score__sub">
            {pct >= 75
              ? 'Startup-ul tău este bine pregătit pentru matching. Continuă să adaugi artefacte pentru scoruri maxime.'
              : pct >= 45
              ? 'Completează câmpurile lipsă pentru a îmbunătăți calitatea matchurilor și vizibilitatea.'
              : 'Profilul are goluri majore. Completarea câmpurilor esențiale va debloca oportunități relevante.'}
          </p>
          <div className="confidence-bar" style={{ marginTop: 12 }}>
            <div className={`confidence-bar__fill ${barClass}`} style={{ width: `${pct}%` }} />
          </div>
        </div>
      </div>

      <div className="profile__section">
        <h2 className="profile__section-h">Detaliu câmpuri</h2>
        <p className="profile__section-sub">
          Starea fiecărui câmp cheie și impactul său asupra scorului de Confidence.
        </p>
        <div style={{ marginTop: 20 }}>
          <div className="confidence-item" style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 10.5,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: 'var(--muted)',
            paddingBottom: 8,
            borderBottom: '2px solid var(--border)',
          }}>
            <span>Câmp</span>
            <span style={{ textAlign: 'center' }}>Status</span>
            <span style={{ textAlign: 'right' }}>Impact</span>
          </div>
          {CONFIDENCE_FIELDS.map(field => {
            const done = field.check(form);
            return (
              <div className="confidence-item" key={field.key}>
                <span className="confidence-item__name">{field.label}</span>
                <span className={`confidence-item__status ${done ? 'is-done' : 'is-missing'}`}>
                  {done ? '✓ Completat' : '○ Lipsă'}
                </span>
                <span className={`confidence-item__impact ${field.impact}`}>
                  {field.impact === 'high' ? 'Ridicat' : 'Mediu'}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Save bar ──────────────────────────────────────────────────────────────────
function SaveBar({ saveStatus, onSaveNow }) {
  const statusText = {
    '':       '',
    saving:   'Se salvează…',
    saved:    'Salvat automat ✓',
    error:    'Eroare la salvare — reîncearcă',
  }[saveStatus];

  return (
    <div className="profile__save-bar">
      <span className={`profile__save-status${saveStatus ? ' ' + saveStatus : ''}`}>
        {statusText}
      </span>
      <button className="btn btn--accent btn--sm" onClick={onSaveNow}>
        Salvează acum
      </button>
    </div>
  );
}

// ── Main ProfileApp ───────────────────────────────────────────────────────────
function ProfileApp() {
  const [activeTab, setActiveTab] = useState('info');
  const [form, setForm] = useState(DEFAULT_FORM);
  const [saveStatus, setSaveStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const debounceRef = useRef(null);

  // ── Fetch profile on mount ──────────────────────────────────────────────────
  useEffect(() => {
    fetch('/api/profile')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) {
          setForm(prev => ({
            ...prev,
            ...data,
            team: data.team?.length ? data.team : prev.team,
            goals: data.goals || prev.goals,
          }));
        }
      })
      .catch(() => {
        // Silently ignore — use defaults
      })
      .finally(() => setLoading(false));

    // Pre-fill email from auth if available
    if (window.__USER?.email) {
      setForm(prev => ({ ...prev, _email: window.__USER.email }));
    }
    const handler = e => {
      if (e.detail?.user?.email) {
        setForm(prev => ({ ...prev, _email: e.detail.user.email }));
      }
    };
    window.addEventListener('auth-ready', handler);
    return () => window.removeEventListener('auth-ready', handler);
  }, []);

  // ── Field change ────────────────────────────────────────────────────────────
  const handleChange = useCallback((key, value) => {
    setForm(prev => ({ ...prev, [key]: value }));
  }, []);

  // ── Debounced save ──────────────────────────────────────────────────────────
  const debounceSave = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      performSave();
    }, 800);
  }, [form]); // eslint-disable-line

  const performSave = useCallback(() => {
    setSaveStatus('saving');
    // Use functional form to get latest form state
    setForm(currentForm => {
      const payload = { ...currentForm };
      delete payload._email; // Don't send internal tracking field
      fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
        .then(r => {
          if (r.ok) {
            setSaveStatus('saved');
            setTimeout(() => setSaveStatus(''), 3000);
          } else {
            setSaveStatus('error');
          }
        })
        .catch(() => setSaveStatus('error'));
      return currentForm; // no mutation
    });
  }, []);

  // ── Blur handler ────────────────────────────────────────────────────────────
  const handleBlur = useCallback(() => {
    debounceSave();
  }, [debounceSave]);

  // ── Manual save ─────────────────────────────────────────────────────────────
  const handleSaveNow = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    performSave();
  }, [performSave]);

  // ── Confidence pct for tab badge ────────────────────────────────────────────
  const pct = computeConfidence(form);

  // ── Render ──────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="profile">
        <Sidebar activePage="profile" />
        <div className="profile__main" style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--muted)', fontFamily: 'JetBrains Mono, monospace', fontSize: 13,
        }}>
          Se încarcă profilul…
        </div>
      </div>
    );
  }

  const renderTab = () => {
    switch (activeTab) {
      case 'info':       return <TabInfo      form={form} onChange={handleChange} onBlur={handleBlur} />;
      case 'echipa':     return <TabEchipa    form={form} onChange={handleChange} onBlur={handleBlur} />;
      case 'obiective':  return <TabObiective form={form} onChange={handleChange} onBlur={handleBlur} />;
      case 'artefacte':  return <TabArtefacte form={form} onChange={handleChange} onBlur={handleBlur} />;
      case 'confidence': return <TabConfidence form={form} />;
      default:           return null;
    }
  };

  return (
    <div className="profile">
      {/* Left sidebar */}
      <Sidebar activePage="profile" />

      {/* Right main area */}
      <div className="profile__main">

        {/* Topbar */}
        <div className="profile__topbar">
          <div className="profile__crumbs">
            <a href="/dashboard.html">Dashboard</a>
            <span className="profile__crumbs-sep">/</span>
            <strong>Profil startup</strong>
          </div>
          <a href="/dashboard.html" className="btn btn--ghost btn--sm">
            ← Dashboard
          </a>
        </div>

        {/* Tab row */}
        <div className="profile__tabs" role="tablist">
          {TABS.map(tab => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={activeTab === tab.id}
              className={`profile__tab${activeTab === tab.id ? ' is-active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
              {tab.id === 'confidence' && (
                <span className="profile__tab-count">{pct}%</span>
              )}
              {tab.id === 'echipa' && (
                <span className="profile__tab-count">{(form.team || []).filter(m => m.name).length}</span>
              )}
              {tab.id === 'obiective' && (
                <span className="profile__tab-count">{(form.goals || []).length}</span>
              )}
              {tab.id === 'artefacte' && (
                <span className="profile__tab-count">
                  {ARTEFACTS.filter(a => (form[a.id] || '').trim()).length}/{ARTEFACTS.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab body */}
        <div className="profile__body" role="tabpanel">
          {renderTab()}
        </div>

        {/* Save bar */}
        <SaveBar saveStatus={saveStatus} onSaveNow={handleSaveNow} />

      </div>
    </div>
  );
}

// ── Mount ─────────────────────────────────────────────────────────────────────
const _profileRoot = document.getElementById('profile-root');
if (_profileRoot) ReactDOM.createRoot(_profileRoot).render(<ProfileApp />);
