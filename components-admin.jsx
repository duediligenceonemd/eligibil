// Admin panel — eligibil.eu (Iteration 1)
// CRUD over /api/admin/grants and /api/admin/events. The page is gated
// client-side by auth.js (any logged-in session) and server-side by
// requireAdmin in routes/admin.js. Single-file React app, vanilla.

const { useState, useEffect, useMemo, useCallback } = React;

// ─── Field-shape utilities ────────────────────────────────────────────────────
//   type: 'text' | 'textarea' | 'number' | 'datetime' | 'select' | 'checkbox' | 'json'
//   group: section label inside the editor
//   options: for select fields
//   help: small helper text under the label
//   required: not enforced on edit, only flagged in UI for new rows

const GRANT_TYPE_OPTIONS = [
  '', 'Grant', 'Accelerator', 'VC Fund', 'Loan', 'Equity', 'Competiție', 'Hibrid',
];
const GRANT_STATUS_OPTIONS = ['Activ', 'Inactiv', 'Arhivat', 'Pending'];
const EVIDENCE_OPTIONS = ['', 'verified_primary', 'verified_secondary', 'ai_extracted_unverified', 'hypothesis'];
const EVENT_TYPE_OPTIONS = [
  'conference', 'pitch_event', 'webinar', 'workshop',
  'networking', 'hackathon', 'accelerator_call',
];
const EVENT_STATUS_OPTIONS = ['upcoming', 'live', 'past', 'cancelled'];
const FUNDER_TYPE_OPTIONS = [
  '', 'foundation', 'government', 'corporate', 'vc_fund',
  'accelerator', 'eu_program', 'dao', 'other',
];
const FUNDER_STATUS_OPTIONS = ['active', 'inactive', 'archived'];

const GRANTS_CONFIG = {
  title: 'Granturi',
  apiBase: '/api/admin/grants',
  pk: 'id',
  pkEditable: true,
  newDefaults: { id: '', status: 'Activ', dilutiv: false },
  searchKeys: ['id', 'nume_program', 'funder_name', 'organizatie'],
  listColumns: [
    { key: 'id',             label: 'ID',         mono: true,    width: 80 },
    { key: 'nume_program',   label: 'Nume',       primary: true            },
    { key: 'funder_name',    label: 'Funder',                               render: (v, row) => v || row.organizatie || '—' },
    { key: 'tara',           label: 'Țară',                       width: 100 },
    { key: 'tip',            label: 'Tip',                        width: 110 },
    { key: 'status',         label: 'Status',     chip: true,     width: 90  },
    { key: 'evidence_status',label: 'Evidence',   chipMap: { verified_primary: 'ok', verified_secondary: 'ok', hypothesis: 'warn' }, width: 130 },
  ],
  defaultSort: { key: 'updated_at', dir: 'desc' },
  fields: [
    { name: 'id',                label: 'ID',                   type: 'text',     group: 'Identitate', required: true, help: 'Cod scurt unic, ex: EU012, MD003' },
    { name: 'nume_program',      label: 'Nume program (RO)',    type: 'text',     group: 'Identitate', required: true },
    { name: 'nume_program_en',   label: 'Nume program (EN)',    type: 'text',     group: 'Identitate' },
    { name: 'slug_ro',           label: 'Slug RO',              type: 'text',     group: 'Identitate', help: 'URL-friendly. Lasă gol și se completează din nume_program la backfill.' },
    { name: 'slug_en',           label: 'Slug EN',              type: 'text',     group: 'Identitate' },

    { name: 'short_summary_ro',  label: 'Sumar scurt RO',       type: 'textarea', group: 'Conținut', help: '<160 chars pentru SEO meta' },
    { name: 'short_summary_en',  label: 'Sumar scurt EN',       type: 'textarea', group: 'Conținut' },
    { name: 'descriere',         label: 'Descriere completă',   type: 'textarea', group: 'Conținut' },
    { name: 'descriere_en',      label: 'Descriere EN',         type: 'textarea', group: 'Conținut' },
    { name: 'cerinte',           label: 'Cerințe',              type: 'textarea', group: 'Conținut' },
    { name: 'cerinte_en',        label: 'Cerințe (EN)',         type: 'textarea', group: 'Conținut' },

    { name: 'funder_name',       label: 'Funder name',          type: 'text',     group: 'Funder' },
    { name: 'funder_country',    label: 'Țara funder',          type: 'text',     group: 'Funder' },
    { name: 'organizatie',       label: 'Organizație (legacy)', type: 'text',     group: 'Funder', help: 'Câmp moștenit; preferă funder_name' },
    { name: 'tara',              label: 'Țară (filtru)',        type: 'text',     group: 'Funder' },

    { name: 'tip',               label: 'Tip',                  type: 'select',   group: 'Financiar', options: GRANT_TYPE_OPTIONS },
    { name: 'dilutiv',           label: 'Dilutiv',              type: 'checkbox', group: 'Financiar' },
    { name: 'suma_min',          label: 'Sumă min (EUR)',       type: 'number',   group: 'Financiar' },
    { name: 'suma_max',          label: 'Sumă max (EUR)',       type: 'number',   group: 'Financiar' },
    { name: 'cofinancing_pct',   label: 'Cofinanțare %',        type: 'number',   group: 'Financiar' },
    { name: 'equity_pct',        label: 'Equity %',             type: 'number',   group: 'Financiar' },

    { name: 'stadiu',            label: 'Stadiu (text)',        type: 'text',     group: 'Targeting' },
    { name: 'sector',            label: 'Sector (text)',        type: 'text',     group: 'Targeting' },
    { name: 'trl_min',           label: 'TRL min',              type: 'number',   group: 'Targeting', help: '1-9' },
    { name: 'trl_max',           label: 'TRL max',              type: 'number',   group: 'Targeting' },

    { name: 'deadline',          label: 'Deadline (text)',      type: 'text',     group: 'Status', help: 'Liber: "22 Mai 2026", "Rolling", "Annual"' },
    { name: 'status',            label: 'Status',               type: 'select',   group: 'Status', options: GRANT_STATUS_OPTIONS },
    { name: 'evidence_status',   label: 'Evidence status',      type: 'select',   group: 'Status', options: EVIDENCE_OPTIONS },
    { name: 'dificultate',       label: 'Dificultate (1-3)',    type: 'number',   group: 'Status' },

    { name: 'source_url',        label: 'Source URL',           type: 'text',     group: 'Linkuri' },
    { name: 'application_url',   label: 'Application URL',      type: 'text',     group: 'Linkuri' },
    { name: 'website',           label: 'Website',              type: 'text',     group: 'Linkuri' },

    { name: 'eligibility_rules',   label: 'Eligibility rules',    type: 'json',     group: 'JSONB / Array', help: 'Array de obiecte {type, value, required}' },
    { name: 'documents_required',  label: 'Documents required',   type: 'json',     group: 'JSONB / Array' },
    { name: 'evaluation_criteria', label: 'Evaluation criteria',  type: 'json',     group: 'JSONB / Array' },
    { name: 'tags',                label: 'Tags',                 type: 'json',     group: 'JSONB / Array', help: 'Array de string-uri' },
    { name: 'application_languages', label: 'App languages',      type: 'json',     group: 'JSONB / Array' },

    { name: 'consortium_required',     label: 'Consortium required', type: 'checkbox', group: 'Misc' },
    { name: 'consortium_min_partners', label: 'Consortium min partners', type: 'number', group: 'Misc' },
  ],
};

const EVENTS_CONFIG = {
  title: 'Evenimente',
  apiBase: '/api/admin/events',
  pk: 'id',
  pkEditable: false,    // events use UUID, generated server-side
  newDefaults: { event_type: 'conference', status: 'upcoming', is_online: false, is_free: true, is_featured: false },
  searchKeys: ['title', 'organizer_name', 'city', 'country'],
  listColumns: [
    { key: 'title',          label: 'Titlu',     primary: true },
    { key: 'event_type',     label: 'Tip',       chip: true,     width: 130 },
    { key: 'start_date',     label: 'Start',     mono: true,     width: 110, render: (v) => v ? new Date(v).toISOString().slice(0, 10) : '—' },
    { key: 'country',        label: 'Țară',                        width: 110 },
    { key: 'organizer_name', label: 'Organizer',                   width: 180 },
    { key: 'status',         label: 'Status',    chip: true,       width: 100 },
  ],
  defaultSort: { key: 'start_date', dir: 'asc' },
  fields: [
    { name: 'slug_ro',          label: 'Slug RO',       type: 'text',     group: 'Identitate' },
    { name: 'slug_en',          label: 'Slug EN',       type: 'text',     group: 'Identitate' },
    { name: 'title',            label: 'Titlu (RO)',    type: 'text',     group: 'Identitate', required: true },
    { name: 'title_en',         label: 'Titlu (EN)',    type: 'text',     group: 'Identitate' },

    { name: 'event_type',       label: 'Tip eveniment', type: 'select',   group: 'Tip', options: EVENT_TYPE_OPTIONS, required: true },
    { name: 'status',           label: 'Status',        type: 'select',   group: 'Tip', options: EVENT_STATUS_OPTIONS },
    { name: 'is_featured',      label: 'Featured',      type: 'checkbox', group: 'Tip' },

    { name: 'start_date',       label: 'Start (ISO)',   type: 'datetime', group: 'Când / Unde', required: true },
    { name: 'end_date',         label: 'End (ISO)',     type: 'datetime', group: 'Când / Unde' },
    { name: 'timezone',         label: 'Timezone',      type: 'text',     group: 'Când / Unde' },
    { name: 'is_online',        label: 'Online',        type: 'checkbox', group: 'Când / Unde' },
    { name: 'city',             label: 'Oraș',          type: 'text',     group: 'Când / Unde' },
    { name: 'country',          label: 'Țară',          type: 'text',     group: 'Când / Unde' },
    { name: 'venue',            label: 'Locație',       type: 'text',     group: 'Când / Unde' },
    { name: 'online_url',       label: 'Link online',   type: 'text',     group: 'Când / Unde' },

    { name: 'short_summary_ro', label: 'Sumar RO',      type: 'textarea', group: 'Conținut' },
    { name: 'short_summary_en', label: 'Sumar EN',      type: 'textarea', group: 'Conținut' },
    { name: 'description_ro',   label: 'Descriere RO',  type: 'textarea', group: 'Conținut' },
    { name: 'description_en',   label: 'Descriere EN',  type: 'textarea', group: 'Conținut' },
    { name: 'agenda',           label: 'Agendă',        type: 'json',     group: 'Conținut', help: 'Array de {time, title, speaker}' },

    { name: 'organizer_name',   label: 'Organizator',   type: 'text',     group: 'Organizator' },
    { name: 'organizer_url',    label: 'URL organizator', type: 'text',   group: 'Organizator' },
    { name: 'organizer_logo',   label: 'Logo URL',      type: 'text',     group: 'Organizator' },

    { name: 'is_free',          label: 'Gratuit',       type: 'checkbox', group: 'Preț' },
    { name: 'price_eur',        label: 'Preț (EUR)',    type: 'number',   group: 'Preț' },
    { name: 'registration_url', label: 'URL înregistrare', type: 'text', group: 'Preț' },

    { name: 'audience',         label: 'Audience',      type: 'json',     group: 'Targeting', help: 'Array string: ["founders","investors"]' },
    { name: 'topics',           label: 'Topics',        type: 'json',     group: 'Targeting' },
    { name: 'stages',           label: 'Stages',        type: 'json',     group: 'Targeting' },

    { name: 'source_url',       label: 'Source URL',    type: 'text',     group: 'Sursă' },
    { name: 'source_name',      label: 'Source name',   type: 'text',     group: 'Sursă' },
    { name: 'evidence_status',  label: 'Evidence status', type: 'select', group: 'Sursă', options: EVIDENCE_OPTIONS },
  ],
};

const FUNDERS_CONFIG = {
  title: 'Donatori',
  apiBase: '/api/admin/funders',
  pk: 'id',
  pkEditable: false,    // UUID, generated server-side
  newDefaults: { funder_type: 'foundation', status: 'active' },
  searchKeys: ['name', 'name_en', 'short_name', 'country', 'website'],
  listColumns: [
    { key: 'name',         label: 'Nume',         primary: true },
    { key: 'funder_type',  label: 'Tip',          chip: true,  width: 130 },
    { key: 'country',      label: 'Țară',                       width: 110 },
    { key: 'website',      label: 'Website',      width: 220, render: (v) => v ? new URL(v, 'http://x').hostname.replace(/^www\./, '') : '—' },
    { key: 'status',       label: 'Status',       chip: true,  width: 100 },
    { key: 'evidence_status', label: 'Evidence',
      chipMap: { verified_primary: 'ok', verified_secondary: 'ok', hypothesis: 'warn' }, width: 130 },
  ],
  defaultSort: { key: 'updated_at', dir: 'desc' },
  fields: [
    { name: 'slug',            label: 'Slug',                type: 'text',     group: 'Identitate', help: 'URL-friendly. Folosit pentru pagini publice viitoare /donatori/<slug>.' },
    { name: 'name',            label: 'Nume (RO)',           type: 'text',     group: 'Identitate', required: true },
    { name: 'name_en',         label: 'Nume (EN)',           type: 'text',     group: 'Identitate' },
    { name: 'short_name',      label: 'Acronim / nume scurt', type: 'text',    group: 'Identitate', help: 'Ex: EIC, ODIMM, NSF' },

    { name: 'funder_type',     label: 'Tip donator',         type: 'select',   group: 'Tip', options: FUNDER_TYPE_OPTIONS },
    { name: 'status',          label: 'Status',              type: 'select',   group: 'Tip', options: FUNDER_STATUS_OPTIONS },

    { name: 'country',         label: 'Țară (HQ)',           type: 'text',     group: 'Geografie' },
    { name: 'hq_city',         label: 'Oraș HQ',             type: 'text',     group: 'Geografie' },
    { name: 'countries_funded', label: 'Țări finanțate',     type: 'json',     group: 'Geografie', help: 'Array string: ["Moldova","România","UE"]' },

    { name: 'logo_url',        label: 'Logo URL',            type: 'text',     group: 'Branding' },
    { name: 'website',         label: 'Website',             type: 'text',     group: 'Branding' },
    { name: 'contact_email',   label: 'Email contact',       type: 'text',     group: 'Branding' },

    { name: 'short_summary_ro', label: 'Sumar scurt RO',     type: 'textarea', group: 'Conținut', help: '<160 chars pentru SEO meta' },
    { name: 'short_summary_en', label: 'Sumar scurt EN',     type: 'textarea', group: 'Conținut' },
    { name: 'description_ro',  label: 'Descriere RO',        type: 'textarea', group: 'Conținut' },
    { name: 'description_en',  label: 'Descriere EN',        type: 'textarea', group: 'Conținut' },

    { name: 'focus_areas',     label: 'Focus areas',         type: 'json',     group: 'Targeting', help: 'Array string: ["AI","climate","deep-tech"]' },
    { name: 'stages_funded',   label: 'Stages',              type: 'json',     group: 'Targeting' },

    { name: 'founded_year',    label: 'Înființat (an)',      type: 'number',   group: 'Track record' },
    { name: 'total_funding_eur', label: 'Total finanțat (EUR)', type: 'number', group: 'Track record', help: 'Suma agregată dezvăluită' },
    { name: 'notable_grantees', label: 'Beneficiari notabili', type: 'json',   group: 'Track record', help: 'Array de nume' },

    { name: 'evidence_status', label: 'Evidence status',     type: 'select',   group: 'Sursă', options: EVIDENCE_OPTIONS },
  ],
};

// ─── Field component ──────────────────────────────────────────────────────────
function Field({ field, value, onChange }) {
  const id = 'fld-' + field.name;
  const onText = (e) => onChange(field.name, e.target.value);
  const onNum  = (e) => onChange(field.name, e.target.value === '' ? null : Number(e.target.value));
  const onChk  = (e) => onChange(field.name, e.target.checked);

  if (field.type === 'checkbox') {
    return (
      <div className="ap-field ap-field--inline">
        <input id={id} type="checkbox" checked={!!value} onChange={onChk} />
        <label htmlFor={id}>{field.label} {field.help && <small>{field.help}</small>}</label>
      </div>
    );
  }
  return (
    <div className="ap-field">
      <label htmlFor={id}>{field.label}{field.required && <small style={{color:'var(--ap-crit)'}}>*</small>}{field.help && <small>{field.help}</small>}</label>
      {field.type === 'textarea' ? (
        <textarea id={id} rows={3} value={value || ''} onChange={onText} />
      ) : field.type === 'select' ? (
        <select id={id} value={value || ''} onChange={onText}>
          {(field.options || []).map(o => <option key={o} value={o}>{o || '—'}</option>)}
        </select>
      ) : field.type === 'number' ? (
        <input id={id} type="number" value={value == null ? '' : value} onChange={onNum} />
      ) : field.type === 'datetime' ? (
        <input id={id} type="datetime-local" value={value ? toLocalDt(value) : ''} onChange={(e) => onChange(field.name, e.target.value ? new Date(e.target.value).toISOString() : null)} />
      ) : field.type === 'json' ? (
        <JsonField name={field.name} value={value} onChange={onChange} />
      ) : (
        <input id={id} type="text" value={value || ''} onChange={onText} />
      )}
    </div>
  );
}

function toLocalDt(iso) {
  // Convert ISO string to "YYYY-MM-DDTHH:MM" for datetime-local input
  try {
    const d = new Date(iso);
    if (isNaN(d)) return '';
    const pad = (n) => String(n).padStart(2, '0');
    return d.getFullYear() + '-' + pad(d.getMonth()+1) + '-' + pad(d.getDate()) + 'T' + pad(d.getHours()) + ':' + pad(d.getMinutes());
  } catch { return ''; }
}

function JsonField({ name, value, onChange }) {
  const initial = value == null ? '' : (typeof value === 'string' ? value : JSON.stringify(value, null, 2));
  const [text, setText] = useState(initial);
  const [error, setError] = useState(null);

  // When the parent value changes (e.g. record reload), refresh local text
  useEffect(() => {
    setText(value == null ? '' : (typeof value === 'string' ? value : JSON.stringify(value, null, 2)));
    setError(null);
  }, [value]);

  const onText = (e) => {
    const t = e.target.value;
    setText(t);
    if (t.trim() === '') {
      setError(null);
      onChange(name, null);
      return;
    }
    try {
      const parsed = JSON.parse(t);
      setError(null);
      onChange(name, parsed);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div>
      <textarea rows={5} value={text} onChange={onText} />
      {error && <div className="ap-json-error">JSON invalid: {error}</div>}
    </div>
  );
}

// ─── Generic CRUD page ────────────────────────────────────────────────────────
function CrudPage({ config }) {
  const [items, setItems]       = useState(null);
  const [error, setError]       = useState(null);
  const [search, setSearch]     = useState('');
  const [sort, setSort]         = useState(config.defaultSort);
  const [selectedId, setSelectedId] = useState(null);
  const [editing, setEditing]   = useState(null);   // current draft (mutated by Field components)
  const [savingState, setSaving] = useState(null); // 'saving' | 'saved' | { error: string }
  const [schemaMissing, setSchemaMissing] = useState(false);

  const refresh = useCallback(async () => {
    setError(null);
    try {
      const r = await fetch(config.apiBase, { credentials: 'same-origin' });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || 'API ' + r.status);
      setSchemaMissing(!!data.schema_missing);
      setItems(data.items || []);
    } catch (err) {
      setError(err.message);
      setItems([]);
    }
  }, [config.apiBase]);

  useEffect(() => { refresh(); }, [refresh]);

  // Load full record when one is selected
  useEffect(() => {
    if (!selectedId) { setEditing(null); return; }
    if (selectedId === '__new__') {
      setEditing({ ...(config.newDefaults || {}) });
      return;
    }
    let cancelled = false;
    fetch(config.apiBase + '/' + encodeURIComponent(selectedId), { credentials: 'same-origin' })
      .then(r => r.json())
      .then(data => { if (!cancelled) setEditing(data.item || null); })
      .catch(() => { if (!cancelled) setEditing(null); });
    return () => { cancelled = true; };
  }, [selectedId, config.apiBase]);

  const filtered = useMemo(() => {
    if (!items) return [];
    let rows = items;
    if (search) {
      const q = search.toLowerCase();
      rows = rows.filter(r => (config.searchKeys || []).some(k => String(r[k] || '').toLowerCase().includes(q)));
    }
    if (sort?.key) {
      const k = sort.key;
      const dir = sort.dir === 'desc' ? -1 : 1;
      rows = [...rows].sort((a, b) => {
        const va = a[k]; const vb = b[k];
        if (va == null && vb == null) return 0;
        if (va == null) return 1 * dir;
        if (vb == null) return -1 * dir;
        if (typeof va === 'number' && typeof vb === 'number') return (va - vb) * dir;
        return String(va).localeCompare(String(vb)) * dir;
      });
    }
    return rows;
  }, [items, search, sort, config.searchKeys]);

  const onFieldChange = (name, value) => {
    setEditing((e) => ({ ...(e || {}), [name]: value }));
    setSaving(null);
  };

  const onSave = async () => {
    if (!editing) return;
    setSaving('saving');
    const isNew = selectedId === '__new__';
    const url = isNew
      ? config.apiBase
      : config.apiBase + '/' + encodeURIComponent(editing[config.pk] ?? selectedId);
    const method = isNew ? 'POST' : 'PUT';
    try {
      const r = await fetch(url, {
        method,
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editing),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || 'API ' + r.status);
      setSaving('saved');
      setTimeout(() => setSaving(null), 1500);
      await refresh();
      if (isNew && data.item?.[config.pk]) setSelectedId(data.item[config.pk]);
    } catch (err) {
      setSaving({ error: err.message });
    }
  };

  const onDelete = async () => {
    if (!editing || selectedId === '__new__') return;
    const id = editing[config.pk] ?? selectedId;
    if (!window.confirm('Sigur vrei să ștergi: ' + id + '?')) return;
    try {
      const r = await fetch(config.apiBase + '/' + encodeURIComponent(id), {
        method: 'DELETE', credentials: 'same-origin',
      });
      if (!r.ok) {
        const data = await r.json().catch(() => ({}));
        throw new Error(data.error || 'API ' + r.status);
      }
      setSelectedId(null);
      setEditing(null);
      await refresh();
    } catch (err) {
      setSaving({ error: err.message });
    }
  };

  // Group fields by section
  const grouped = useMemo(() => {
    const g = {};
    for (const f of config.fields) { (g[f.group || 'General'] = g[f.group || 'General'] || []).push(f); }
    return g;
  }, [config.fields]);

  const cycleSort = (key) => {
    setSort((s) => {
      if (s?.key !== key) return { key, dir: 'asc' };
      if (s.dir === 'asc')  return { key, dir: 'desc' };
      return null;
    });
  };

  return (
    <div className={'ap__split ' + (selectedId ? 'has-edit' : '')}>
      <div>
        <div className="ap__toolbar">
          <h2>{config.title}</h2>
          <div className="ap__toolbar-r">
            <input className="ap__search" type="search"
                   placeholder="Caută..."
                   value={search}
                   onChange={(e) => setSearch(e.target.value)} />
            <button className="ap-btn ap-btn--primary" onClick={() => setSelectedId('__new__')}>+ Adaugă nou</button>
          </div>
        </div>

        {schemaMissing && (
          <div className="ap__banner">
            Tabela încă nu există în Supabase. Aplică migrarea relevantă (vezi <code>scripts/supabase-events-schema.sql</code>) și revino.
          </div>
        )}
        {error && <div className="ap__banner is-error">Eroare API: {error}</div>}

        {items === null && <div className="ap__empty"><h3>Se încarcă...</h3></div>}
        {items && items.length === 0 && !schemaMissing && (
          <div className="ap__empty">
            <h3>Niciun rând</h3>
            <p>Adaugă unul cu butonul de mai sus.</p>
          </div>
        )}

        {items && items.length > 0 && (
          <div className="ap__table-wrap">
            <table className="ap__table">
              <thead>
                <tr>
                  {config.listColumns.map(col => (
                    <th key={col.key} onClick={() => cycleSort(col.key)} style={{ width: col.width || 'auto' }}>
                      {col.label}{sort?.key === col.key ? (sort.dir === 'asc' ? ' ↑' : ' ↓') : ''}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(row => {
                  const id = row[config.pk];
                  return (
                    <tr key={id}
                        className={selectedId === id ? 'is-selected' : ''}
                        onClick={() => setSelectedId(id)}>
                      {config.listColumns.map(col => {
                        const raw = row[col.key];
                        const display = col.render ? col.render(raw, row) : (raw == null ? '—' : String(raw));
                        const cls = [];
                        if (col.mono) cls.push('ap__cell-mono');
                        if (col.primary) cls.push('ap__cell-name');
                        if (col.chip || col.chipMap) {
                          let kind = '';
                          if (col.chipMap) kind = col.chipMap[raw] || '';
                          return (
                            <td key={col.key}>
                              <span className={'ap__chip ' + (kind ? 'ap__chip--' + kind : '')}>{display}</span>
                            </td>
                          );
                        }
                        return <td key={col.key} className={cls.join(' ')}>{display}</td>;
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedId && editing && (
        <aside className="ap__editor">
          <div className="ap__editor-head">
            <h3>{selectedId === '__new__' ? 'Adaugă ' + config.title.toLowerCase() : 'Editează'}</h3>
            <span className="ap__editor-id">{selectedId === '__new__' ? 'NOU' : (editing[config.pk] || selectedId)}</span>
          </div>

          {Object.entries(grouped).map(([group, fields]) => (
            <div key={group} className="ap-section">
              <h4>{group}</h4>
              {fields.map(f => {
                if (f.name === config.pk && !config.pkEditable && selectedId !== '__new__') return null;
                return <Field key={f.name} field={f} value={editing[f.name]} onChange={onFieldChange} />;
              })}
            </div>
          ))}

          <div className="ap__editor-actions">
            <div className={'ap__editor-status ' + (typeof savingState === 'object' && savingState ? 'is-error' : (savingState === 'saved' ? 'is-saved' : ''))}>
              {savingState === 'saving' ? 'salvez…' :
               savingState === 'saved' ? '✓ salvat' :
               (typeof savingState === 'object' && savingState?.error) ? 'eroare: ' + savingState.error : ''}
            </div>
            <div style={{display:'flex',gap:8}}>
              {selectedId !== '__new__' && (
                <button className="ap-btn ap-btn--danger" onClick={onDelete}>Șterge</button>
              )}
              <button className="ap-btn" onClick={() => { setSelectedId(null); setEditing(null); setSaving(null); }}>Anulează</button>
              <button className="ap-btn ap-btn--primary" onClick={onSave}>Salvează</button>
            </div>
          </div>
        </aside>
      )}
    </div>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
function Dashboard({ stats }) {
  if (!stats) return <div className="ap__empty">Se încarcă statistici...</div>;
  const cards = [
    { num: stats.grants_total || 0,       lbl: 'Granturi totale' },
    { num: (stats.staging?.pending || 0), lbl: 'Granturi pending (staging)' },
    { num: (stats.staging?.approved || 0), lbl: 'Granturi approved' },
    { num: (stats.staging?.rejected || 0), lbl: 'Granturi rejected' },
  ];
  return (
    <div>
      <div className="ap__toolbar"><h2>Dashboard</h2></div>
      <div className="ap__cards">
        {cards.map(c => (
          <div className="ap__card" key={c.lbl}>
            <div className="ap__card-num">{c.num}</div>
            <div className="ap__card-lbl">{c.lbl}</div>
          </div>
        ))}
      </div>
      <p style={{color:'var(--ap-muted)',fontSize:13}}>
        Restul (donatori, știri, blog) ajunge în iterații viitoare.
        Folosește meniul din stânga pentru CRUD pe granturi și evenimente.
      </p>
    </div>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────
function AdminApp() {
  const [tab, setTab] = useState('dashboard');
  const [stats, setStats] = useState(null);
  const [user, setUser] = useState(null);
  const [grantsCount, setGrantsCount] = useState(null);
  const [eventsCount, setEventsCount] = useState(null);
  const [fundersCount, setFundersCount] = useState(null);

  // Wait for auth.js to populate window.__USER (it dispatches 'auth-ready')
  useEffect(() => {
    if (window.__USER) setUser(window.__USER);
    const h = (e) => setUser(e.detail?.user || null);
    window.addEventListener('auth-ready', h);
    return () => window.removeEventListener('auth-ready', h);
  }, []);

  const loadCounts = useCallback(async () => {
    try {
      const r = await fetch('/api/admin/stats', { credentials: 'same-origin' });
      if (r.ok) setStats(await r.json());
    } catch {}
    try {
      const [g, e, f] = await Promise.all([
        fetch('/api/admin/grants',  { credentials: 'same-origin' }).then(r => r.json()),
        fetch('/api/admin/events',  { credentials: 'same-origin' }).then(r => r.json()),
        fetch('/api/admin/funders', { credentials: 'same-origin' }).then(r => r.json()),
      ]);
      setGrantsCount(g.items?.length ?? 0);
      setEventsCount(e.items?.length ?? 0);
      setFundersCount(f.items?.length ?? 0);
    } catch {}
  }, []);

  useEffect(() => { loadCounts(); }, [loadCounts, tab]);

  const tabs = [
    { id: 'dashboard', label: 'Dashboard',  count: null },
    { id: 'grants',    label: 'Granturi',   count: grantsCount },
    { id: 'events',    label: 'Evenimente', count: eventsCount },
    { id: 'funders',   label: 'Donatori',   count: fundersCount },
  ];

  return (
    <div className="ap">
      <div className="ap__shell">
        <aside className="ap__side">
          <div className="ap__brand">eligibil<span>.eu</span> · admin</div>
          <nav className="ap__nav">
            {tabs.map(t => (
              <button key={t.id} className={tab === t.id ? 'is-active' : ''} onClick={() => setTab(t.id)}>
                {t.label}
                {t.count != null && <span className="ap__count">{t.count}</span>}
              </button>
            ))}
          </nav>
          <div className="ap__user">
            {user ? (
              <>
                Conectat ca <strong>{user.email || user.firstName || 'admin'}</strong>
                <br/>
                <a href="/dashboard.html">→ App principal</a>
              </>
            ) : (
              <><a href="/login.html?next=/admin">Conectează-te</a> ca să gestionezi date.</>
            )}
          </div>
        </aside>
        <main className="ap__main">
          {tab === 'dashboard' && <Dashboard stats={stats} />}
          {tab === 'grants'    && <CrudPage config={GRANTS_CONFIG} />}
          {tab === 'events'    && <CrudPage config={EVENTS_CONFIG} />}
          {tab === 'funders'   && <CrudPage config={FUNDERS_CONFIG} />}
        </main>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('admin-root')).render(<AdminApp />);
