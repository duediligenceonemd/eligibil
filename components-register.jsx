// Registration / Onboarding — app.eligibil.org/register
const { useState, useEffect, useRef } = React;

function trackRegisterAnalytics(eventName, payload) {
  if (!window.eligibilAnalytics || typeof window.eligibilAnalytics.track !== 'function') return;
  window.eligibilAnalytics.track(eventName, payload || {});
}

const REG_SECTORS = [
  { id: 'ai', name: 'AI & ML', n: 142 },
  { id: 'bio', name: 'Biotech & Health', n: 98 },
  { id: 'climate', name: 'Climate Tech', n: 87 },
  { id: 'fin', name: 'Fintech', n: 76 },
  { id: 'edu', name: 'EdTech', n: 54 },
  { id: 'deep', name: 'Deep Tech', n: 112 },
  { id: 'hw', name: 'Hardware & IoT', n: 63 },
  { id: 'saas', name: 'SaaS & Web', n: 58 },
  { id: 'agri', name: 'AgriFood', n: 34 },
  { id: 'space', name: 'Space', n: 21 },
  { id: 'soc', name: 'Social Impact', n: 45 },
  { id: 'other', name: 'Altele', n: 0 },
];

const REG_STAGES = [
  { id: 'idea', h: 'Idea Stage', d: 'Ai o ipoteză și poate un MVP conceptual. Cauți validare și primii bani.', range: '€0–€50K' },
  { id: 'early', h: 'Early-stage / Pre-seed', d: 'Produs în piață, primii utilizatori sau pilot. Cauți runway pentru tracțiune.', range: '€50K–€500K' },
  { id: 'seed', h: 'Seed / Post-MVP', d: 'Revenue sau tracțiune reală. Echipa formată. Pregătești Serie A sau creștere.', range: '€250K–€2M' },
  { id: 'growth', h: 'Growth', d: 'Scale-up cu model validat. Cauți capital non-dilutiv, granturi mari, expansiune.', range: '€1M–€10M' },
  { id: 'rd', h: 'R&D / Cercetare', d: 'Spin-out academic sau deep-tech. TRL 3–6. Cauți granturi de cercetare și consorții.', range: '€100K–€15M' },
];

const REG_COUNTRIES = [
  { c: '🇲🇩', name: 'Moldova' }, { c: '🇷🇴', name: 'România' }, { c: '🇺🇦', name: 'Ucraina' },
  { c: '🇧🇬', name: 'Bulgaria' }, { c: '🇬🇪', name: 'Georgia' }, { c: '🇦🇲', name: 'Armenia' },
  { c: '🇩🇪', name: 'Germania' }, { c: '🇫🇷', name: 'Franța' }, { c: '🇳🇱', name: 'Olanda' },
  { c: '🇺🇸', name: 'SUA' }, { c: '🇬🇧', name: 'UK' }, { c: '🌐', name: 'Altă țară' },
];

const REG_GOALS = ['Granturi UE', 'Granturi naționale', 'SBIR / STTR', 'Capital non-dilutiv', 'Accelerator', 'Consorții R&D', 'Competiții', 'Fonduri VC'];

const REG_VERTICALS = ['B2B SaaS', 'B2C', 'Enterprise', 'Deep Tech', 'Developer Tools', 'Marketplace', 'Hardware', 'Mobile', 'API', 'Infra'];

function RingMini({ value = 60, size = 100, stroke = 8, color = 'var(--accent)' }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const dash = (value / 100) * c;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--bg-2)" strokeWidth={stroke} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={`${dash} ${c}`}
        transform={`rotate(-90 ${size/2} ${size/2})`} />
    </svg>
  );
}

const STEPS = [
  { n: '01', t: 'Cont', sub: 'Email & parolă' },
  { n: '02', t: 'Startup', sub: 'Nume, sector, stadiu' },
  { n: '03', t: 'Echipă', sub: 'Fondatori & roluri' },
  { n: '04', t: 'Artefacte', sub: 'Deck, video, whitepaper' },
  { n: '05', t: 'Obiectiv', sub: 'Țintă & finanțare' },
  { n: '06', t: 'Review', sub: 'Confirmare & pornire' },
];

function StepRail({ active }) {
  return (
    <aside className="reg__rail">
      <div className="reg__brand">
        <a href="/index.html" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div className="reg__brand-logo">eligibil<span>.org</span></div>
        </a>
        <span className="reg__brand-env">APP · REGISTER</span>
      </div>

      <div className="reg__intro-label">Onboarding · ~5 minute</div>
      <h1 className="reg__intro-h">Construim <em>profilul AI</em><br/>al startupului tău.</h1>
      <p className="reg__intro-p">
        Răspunde la 6 pași simpli. La final primești readiness score, top-ul de granturi potrivite și un plan clar de ce să îmbunătățești primul.
      </p>

      <div className="reg__steps">
        {STEPS.map((s, i) => (
          <div key={i} className={`reg__step ${i === active ? 'is-active' : ''} ${i < active ? 'is-done' : ''}`}>
            <div className="reg__step-num">{i < active ? '✓' : s.n}</div>
            <div className="reg__step-body">
              <div className="reg__step-t">{s.t}</div>
              <div className="reg__step-sub">{s.sub}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="reg__rail-foot">
        <strong>Datele sunt criptate</strong>
        GDPR compliant · nu sunt partajate cu terți · nu sunt folosite pentru antrenament AI fără consimțământ. <a href="#">Politica →</a>
        <div style={{ marginTop: 14, borderTop: '1px solid rgba(255,255,255,.1)', paddingTop: 14, fontSize: 12 }}>
          Ai deja cont? <a href="/login.html" style={{ color: 'rgba(255,255,255,.65)', textDecoration: 'underline' }}>Autentifică-te →</a>
        </div>
      </div>
    </aside>
  );
}

function Topbar({ step, totalSteps }) {
  const pct = Math.round(((step + 1) / totalSteps) * 100);
  return (
    <div className="reg__topbar">
      <div>
        <div className="reg__progress-txt">Pas <strong>{step + 1}</strong> din {totalSteps} · <strong>{pct}%</strong> completat</div>
        <div className="reg__progress-bar" style={{ marginTop: 8 }}>
          <div className="reg__progress-bar__fill" style={{ width: pct + '%' }}></div>
        </div>
      </div>
      <div className="reg__actions-top">
        <div className="reg__save-note"><span className="reg__save-dot"></span>Salvat automat</div>
      </div>
    </div>
  );
}

/* ------------------- Step 1: Account --------------- */
function StepAccount({ v, set }) {
  return (
    <>
      <div className="reg__step-label">Pas 01 · Cont</div>
      <h2 className="reg__step-h">Începem cu câteva date de bază.</h2>
      <p className="reg__step-sub-txt">
        Contul e legat de emailul tău și poate fi partajat cu echipa mai târziu. Fără card, fără angajament — ești la <strong>planul FREE</strong>.
      </p>

      <div className="field">
        <div className="field__label">
          <span className="field__label-t">Emailul tău<span className="req">*</span></span>
          <span className="field__label-hint">folosit pentru login</span>
        </div>
        <input className="input" type="email" value={v.email} onChange={e => set('email', e.target.value)} placeholder="nume@startup.eu" />
        <div className="field__hint">Îți trimitem un cod de verificare în 60 de secunde.</div>
      </div>

      <div className="input-row cols-2">
        <div className="field" style={{ marginBottom: 0 }}>
          <div className="field__label"><span className="field__label-t">Nume<span className="req">*</span></span></div>
          <input className="input" value={v.firstName} onChange={e => set('firstName', e.target.value)} placeholder="Andrei" />
        </div>
        <div className="field" style={{ marginBottom: 0 }}>
          <div className="field__label"><span className="field__label-t">Prenume<span className="req">*</span></span></div>
          <input className="input" value={v.lastName} onChange={e => set('lastName', e.target.value)} placeholder="Popescu" />
        </div>
      </div>

      <div className="field" style={{ marginTop: 28 }}>
        <div className="field__label">
          <span className="field__label-t">Parolă<span className="req">*</span></span>
          <span className="field__label-hint">min. 10 caractere</span>
        </div>
        <input className="input" type="password" value={v.password} onChange={e => set('password', e.target.value)} placeholder="••••••••••" />
      </div>

      <div className="field">
        <div className="field__label"><span className="field__label-t">Rolul tău în startup</span></div>
        <div className="chips-multi">
          {['Fondator', 'CTO', 'COO', 'Business Dev', 'Grant Officer', 'Consultant', 'Altul'].map(r => (
            <div key={r} className={`chip-opt ${v.role === r ? 'is-active' : ''}`} onClick={() => set('role', r)}>
              {v.role === r && <span className="chip-opt__check">◉</span>} {r}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

/* ------------------- Step 2: Startup --------------- */
function StepStartup({ v, set }) {
  return (
    <>
      <div className="reg__step-label">Pas 02 · Startup</div>
      <h2 className="reg__step-h">Despre startupul tău.</h2>
      <p className="reg__step-sub-txt">
        Aceste date determină la ce granturi ești eligibil, ce criterii se aplică și cum se calculează scorurile Match / Readiness.
      </p>

      <div className="field">
        <div className="field__label"><span className="field__label-t">Numele startupului<span className="req">*</span></span></div>
        <input className="input" value={v.startupName} onChange={e => set('startupName', e.target.value)} placeholder="Axon Labs" />
      </div>

      <div className="field">
        <div className="field__label">
          <span className="field__label-t">Website</span>
          <span className="field__label-hint">opțional — pentru audit automat</span>
        </div>
        <div className="input-wrap">
          <span className="input-wrap__pre">https://</span>
          <input value={v.website} onChange={e => set('website', e.target.value)} placeholder="axonlabs.md" />
          <span className="input-wrap__post">.eu / .md / .com</span>
        </div>
      </div>

      <div className="field">
        <div className="field__label">
          <span className="field__label-t">Descriere scurtă<span className="req">*</span></span>
          <span className="field__label-hint">{v.pitch.length}/180</span>
        </div>
        <textarea className="textarea" maxLength={180} value={v.pitch} onChange={e => set('pitch', e.target.value)}
          placeholder="Ce faceți, pentru cine și de ce contează — în 1–2 propoziții." />
        <div className="field__hint">Folosit ca prima descriere în profilul AI. Poți edita oricând.</div>
      </div>

      <div className="field">
        <div className="field__label">
          <span className="field__label-t">Sector principal<span className="req">*</span></span>
          <span className="field__label-hint">alege unul</span>
        </div>
        <div className="tiles cols-4">
          {REG_SECTORS.map(s => (
            <div key={s.id} className={`tile ${v.sector === s.id ? 'is-active' : ''}`} onClick={() => set('sector', s.id)}>
              <div className="tile__check">◉</div>
              <div className="tile__name">{s.name}</div>
              <div className="tile__meta">{s.n} granturi</div>
            </div>
          ))}
        </div>
      </div>

      <div className="field">
        <div className="field__label">
          <span className="field__label-t">Verticale secundare</span>
          <span className="field__label-hint">opțional · max 4</span>
        </div>
        <div className="chips-multi">
          {REG_VERTICALS.map(t => {
            const on = v.verticals.includes(t);
            return <div key={t} className={`chip-opt ${on ? 'is-active' : ''}`}
              onClick={() => {
                if (on) set('verticals', v.verticals.filter(x => x !== t));
                else if (v.verticals.length < 4) set('verticals', [...v.verticals, t]);
              }}>
              {on ? '◉' : '○'} {t}
            </div>;
          })}
        </div>
      </div>

      <div className="field">
        <div className="field__label">
          <span className="field__label-t">Țara de înregistrare<span className="req">*</span></span>
          <span className="field__label-hint">determină eligibilitatea naționala</span>
        </div>
        <div className="tiles cols-4">
          {REG_COUNTRIES.map(c => (
            <div key={c.name} className={`tile ${v.country === c.name ? 'is-active' : ''}`} onClick={() => set('country', c.name)}>
              <div className="tile__check">◉</div>
              <div className="tile__name">{c.c} {c.name}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="field">
        <div className="field__label">
          <span className="field__label-t">Stadiu curent<span className="req">*</span></span>
          <span className="field__label-hint">alege unul</span>
        </div>
        <div className="radio-cards">
          {REG_STAGES.map(s => (
            <div key={s.id} className={`rc ${v.stage === s.id ? 'is-active' : ''}`} onClick={() => set('stage', s.id)}>
              <div className="rc__dot"></div>
              <div className="rc__body">
                <div className="rc__h">{s.h}</div>
                <div className="rc__d">{s.d}</div>
              </div>
              <div className="rc__range">{s.range}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="field">
        <div className="field__label">
          <span className="field__label-t">TRL estimat (nivel de maturitate tehnologică)</span>
          <span className="field__label-hint">poți lăsa AI-ul să estimeze</span>
        </div>
        <div className="range-wrap">
          <div className="range-vals">
            <span>Minim</span>
            <strong>TRL {v.trl}</strong>
            <span>Maxim</span>
          </div>
          <input type="range" className="range" min="1" max="9" value={v.trl} onChange={e => set('trl', +e.target.value)} />
          <div className="range-scale">
            <span>1 idee</span><span>3 POC</span><span>5 pilot</span><span>7 demo</span><span>9 prod</span>
          </div>
        </div>
      </div>
    </>
  );
}

/* ------------------- Step 3: Team --------------- */
function StepTeam({ v, set }) {
  const addMember = () => set('team', [...v.team, { name: '', role: '', linkedin: '' }]);
  const removeMember = (i) => set('team', v.team.filter((_, j) => j !== i));
  const updateMember = (i, k, val) => {
    const t = [...v.team]; t[i] = { ...t[i], [k]: val }; set('team', t);
  };
  return (
    <>
      <div className="reg__step-label">Pas 03 · Echipă</div>
      <h2 className="reg__step-h">Cine formează echipa fondatoare?</h2>
      <p className="reg__step-sub-txt">
        Minim 1 persoană. Multe granturi cer structură de echipă — diversitate de roluri, background tehnic + business, experiență precedentă.
      </p>

      <div className="field">
        <div className="field__label">
          <span className="field__label-t">Membrii echipei<span className="req">*</span></span>
          <span className="field__label-hint">{v.team.length} membri</span>
        </div>
        <div className="team">
          {v.team.map((m, i) => {
            const initials = (m.name || '?').split(' ').map(x => x[0]).slice(0, 2).join('').toUpperCase();
            return (
              <div className="team-row" key={i}>
                <div className="team-avatar">{initials || '??'}</div>
                <input placeholder="Nume complet" value={m.name} onChange={e => updateMember(i, 'name', e.target.value)} />
                <input placeholder="Rol (CEO, CTO…)" value={m.role} onChange={e => updateMember(i, 'role', e.target.value)} />
                <input placeholder="LinkedIn URL" value={m.linkedin} onChange={e => updateMember(i, 'linkedin', e.target.value)} />
                {v.team.length > 1 && <div className="team-row__x" onClick={() => removeMember(i)}>✕</div>}
              </div>
            );
          })}
        </div>
        <button className="team__add" onClick={addMember}>+ Adaugă fondator</button>
      </div>

      <div className="field">
        <div className="field__label">
          <span className="field__label-t">Dimensiune echipă totală</span>
        </div>
        <div className="tiles cols-4">
          {['1', '2–3', '4–6', '7–10', '11–20', '21–50', '50+', 'N/A'].map(s => (
            <div key={s} className={`tile ${v.teamSize === s ? 'is-active' : ''}`} onClick={() => set('teamSize', s)}>
              <div className="tile__check">◉</div>
              <div className="tile__name">{s} persoane</div>
            </div>
          ))}
        </div>
      </div>

      <div className="field">
        <div className="field__label">
          <span className="field__label-t">Background-uri relevante</span>
          <span className="field__label-hint">ajută la scor de consorțiu</span>
        </div>
        <div className="chips-multi">
          {['PhD / cercetare', 'Exit precedent', 'Big Tech', 'Domeniu regulat', 'Diaspora', 'Academic spinout', 'Corporate innovation', 'Investment banking', 'Clinical / medical'].map(t => {
            const on = v.background.includes(t);
            return <div key={t} className={`chip-opt ${on ? 'is-active' : ''}`}
              onClick={() => {
                if (on) set('background', v.background.filter(x => x !== t));
                else set('background', [...v.background, t]);
              }}>
              {on ? '◉' : '○'} {t}
            </div>;
          })}
        </div>
      </div>
    </>
  );
}

/* ------------------- Step 4: Artefacts --------------- */
function StepArtefacts({ v, set }) {
  const toggleFile = (key, file) => {
    const next = { ...v.files };
    if (next[key]) delete next[key]; else next[key] = file;
    set('files', next);
  };
  const drops = [
    { key: 'deck', icon: '01', h: 'Pitch Deck', d: 'PDF sau PPTX, max 30 slides. Analizat în 90s.', spec: 'PDF · PPTX · ≤50MB', sample: 'AxonLabs_Deck_v3.pdf' },
    { key: 'video', icon: '02', h: 'Video Pitch', d: 'Max 3 min. Transcript + scoring automat.', spec: 'MP4 · MOV · ≤500MB', sample: 'pitch_2min40.mp4' },
    { key: 'whitepaper', icon: '03', h: 'Whitepaper', d: 'Document tehnic, max 10 pagini. TRL extras auto.', spec: 'PDF · DOCX · ≤30MB', sample: 'AxonLabs_WP_tech.pdf' },
    { key: 'financials', icon: '04', h: 'Financial model', d: 'Excel cu MRR, runway, unit economics.', spec: 'XLSX · CSV · ≤10MB', sample: 'financial_model.xlsx' },
  ];
  return (
    <>
      <div className="reg__step-label">Pas 04 · Artefacte</div>
      <h2 className="reg__step-h">Încarcă ce ai — analizăm tot în 90s.</h2>
      <p className="reg__step-sub-txt">
        Fiecare artefact crește <strong>Confidence Score</strong> cu 10–20 puncte. Minim 1 artefact pentru matching inițial, ideal toate 4.
        Poți adăuga mai târziu — nu ratezi nimic dacă sari acum.
      </p>

      <div className="drops">
        {drops.map(d => {
          const loaded = v.files[d.key];
          return (
            <div key={d.key} className={`drop ${loaded ? 'is-loaded' : ''}`} onClick={() => !loaded && toggleFile(d.key, { name: d.sample, size: '2.4 MB' })}>
              <div className="drop__icon">{d.icon} · {loaded ? 'ÎNCĂRCAT' : 'DRAG & DROP'}</div>
              <div className="drop__h">{d.h}</div>
              <div className="drop__d">{d.d}</div>
              {loaded ? (
                <div className="drop__file">
                  <div className="drop__file-icon">{d.key === 'video' ? 'MP4' : d.key === 'financials' ? 'XLS' : 'PDF'}</div>
                  <div className="drop__file-body">
                    <strong>{loaded.name}</strong>
                    <span>{loaded.size} · uploaded 00:07</span>
                  </div>
                  <div className="drop__file-x" onClick={(e) => { e.stopPropagation(); toggleFile(d.key, null); }}>✕</div>
                </div>
              ) : (
                <div className="drop__spec">{d.spec}</div>
              )}
            </div>
          );
        })}
      </div>

      <div className="field" style={{ marginTop: 36 }}>
        <div className="field__label">
          <span className="field__label-t">GitHub / repo public (opțional)</span>
          <span className="field__label-hint">pentru audit de digital maturity</span>
        </div>
        <div className="input-wrap">
          <span className="input-wrap__pre">github.com/</span>
          <input value={v.github} onChange={e => set('github', e.target.value)} placeholder="axon-labs/core" />
        </div>
        <div className="field__hint">Analizăm activitate commits, issues, README, licențe, CI/CD.</div>
      </div>
    </>
  );
}

/* ------------------- Step 5: Goals --------------- */
function StepGoals({ v, set }) {
  const amtLabels = ['< €50K', '€50K', '€250K', '€500K', '€1M', '€2.5M', '€5M', '€10M+'];
  return (
    <>
      <div className="reg__step-label">Pas 05 · Obiectiv</div>
      <h2 className="reg__step-h">Ce cauți și cât de repede?</h2>
      <p className="reg__step-sub-txt">
        Asta ghidează matching-ul: câte granturi îți arătăm, cu ce prioritate, și ce ordine în plan.
      </p>

      <div className="field">
        <div className="field__label">
          <span className="field__label-t">Tipuri de finanțare<span className="req">*</span></span>
          <span className="field__label-hint">selectează tot ce te interesează</span>
        </div>
        <div className="chips-multi">
          {REG_GOALS.map(g => {
            const on = v.goals.includes(g);
            return <div key={g} className={`chip-opt ${on ? 'is-active' : ''}`}
              onClick={() => {
                if (on) set('goals', v.goals.filter(x => x !== g));
                else set('goals', [...v.goals, g]);
              }}>
              {on ? '◉' : '○'} {g}
            </div>;
          })}
        </div>
      </div>

      <div className="field">
        <div className="field__label">
          <span className="field__label-t">Sumă țintă</span>
          <span className="field__label-hint">ghidat, aproximativ</span>
        </div>
        <div className="range-wrap">
          <div className="range-vals">
            <span>De la</span>
            <strong>{amtLabels[v.amountIdx]}</strong>
            <span>până la</span>
          </div>
          <input type="range" className="range" min="0" max="7" value={v.amountIdx} onChange={e => set('amountIdx', +e.target.value)} />
          <div className="range-scale">
            {amtLabels.map((l, i) => <span key={i}>{l}</span>)}
          </div>
        </div>
      </div>

      <div className="field">
        <div className="field__label"><span className="field__label-t">Orizont de aplicare</span></div>
        <div className="tiles cols-4">
          {['Lună curentă', '3 luni', '6 luni', '12 luni'].map(t => (
            <div key={t} className={`tile ${v.horizon === t ? 'is-active' : ''}`} onClick={() => set('horizon', t)}>
              <div className="tile__check">◉</div>
              <div className="tile__name">{t}</div>
              <div className="tile__meta">{t === 'Lună curentă' ? 'Urgent' : t === '3 luni' ? 'Rapid' : t === '6 luni' ? 'Planificat' : 'Strategic'}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="field">
        <div className="field__label">
          <span className="field__label-t">Ce vrei să rezolvi primul?</span>
          <span className="field__label-hint">opțional — prioritizează recomandările</span>
        </div>
        <div className="radio-cards">
          {[
            { id: 'first-grant', h: 'Să câștig primul grant', d: 'Recomandări tweakate pentru aplicare completă și scor ridicat de Confidence.' },
            { id: 'map', h: 'Să văd toată harta', d: 'Browse complet 735+ surse. Fără prioritizare agresivă. Explore mode.' },
            { id: 'readiness', h: 'Să devin aplicabil la granturi mari', d: 'Plan de 3–6 luni: artefacte, parteneri, milestone-uri pentru EIC / Horizon.' },
            { id: 'consortium', h: 'Să formez un consorțiu', d: 'ResearchMatch + parteneri industriali. Focus pe Horizon colaborative.' },
          ].map(o => (
            <div key={o.id} className={`rc ${v.priority === o.id ? 'is-active' : ''}`} onClick={() => set('priority', o.id)}>
              <div className="rc__dot"></div>
              <div className="rc__body">
                <div className="rc__h">{o.h}</div>
                <div className="rc__d">{o.d}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

/* ------------------- Step 6: Review --------------- */
function StepReview({ v, set, goTo }) {
  const filesCount = Object.values(v.files).filter(Boolean).length;
  const score = Math.min(95,
    30 +
    (v.email ? 5 : 0) +
    (v.startupName ? 8 : 0) +
    (v.sector ? 8 : 0) +
    (v.stage ? 8 : 0) +
    (v.country ? 5 : 0) +
    (v.team.filter(t => t.name).length >= 2 ? 10 : v.team.filter(t => t.name).length >= 1 ? 5 : 0) +
    filesCount * 8 +
    (v.goals.length ? 5 : 0)
  );
  const stageObj = REG_STAGES.find(s => s.id === v.stage) || {};
  const sectorObj = REG_SECTORS.find(s => s.id === v.sector) || {};

  return (
    <>
      <div className="reg__step-label">Pas 06 · Review</div>
      <h2 className="reg__step-h">Gata. Verificăm ce avem.</h2>
      <p className="reg__step-sub-txt">
        Asta e ce vede AI-ul despre startupul tău. După confirmare, pornim matching-ul și primești top 5 granturi în 90 de secunde.
      </p>

      <div className="summary">
        <div className="summary__head">
          <div className="summary__score">
            <RingMini value={score} size={100} stroke={8} />
            <div className="summary__score-val">
              <strong>{score}</strong><span>profile score</span>
            </div>
          </div>
          <div>
            <div className="summary__head-t">{v.startupName || 'Startupul tău'}</div>
            <div className="summary__head-d">
              {sectorObj.name || '—'} · {stageObj.h || '—'} · TRL {v.trl} · {v.country || '—'}
              {v.pitch && <div style={{ marginTop: 6, fontSize: 13 }}>"{v.pitch}"</div>}
            </div>
          </div>
          <div className="summary__head-cta">
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10.5, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.1em' }}>Confidence</div>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 22, fontWeight: 500 }}>{filesCount >= 2 ? 'High' : filesCount >= 1 ? 'Medium' : 'Low'}</div>
          </div>
        </div>

        <div className="summary__grid">
          <div className="summary__col">
            <div className="summary__col-t">
              <span>Profil completat</span>
              <span className="summary__row-edit" onClick={() => goTo(1)}>Editează</span>
            </div>
            <div className="summary__row"><span className="summary__row-icon">✓</span><span className="summary__row-k">Nume startup</span><span className="summary__row-v">{v.startupName || '—'}</span></div>
            <div className={`summary__row ${v.website ? '' : 'miss'}`}><span className="summary__row-icon">{v.website ? '✓' : '○'}</span><span className="summary__row-k">Website</span><span className="summary__row-v">{v.website || 'nesetat'}</span></div>
            <div className="summary__row"><span className="summary__row-icon">✓</span><span className="summary__row-k">Sector</span><span className="summary__row-v">{sectorObj.name || '—'}</span></div>
            <div className="summary__row"><span className="summary__row-icon">✓</span><span className="summary__row-k">Verticale</span><span className="summary__row-v">{v.verticals.length || 0} selectate</span></div>
            <div className="summary__row"><span className="summary__row-icon">✓</span><span className="summary__row-k">Țară</span><span className="summary__row-v">{v.country || '—'}</span></div>
            <div className="summary__row"><span className="summary__row-icon">✓</span><span className="summary__row-k">Stadiu</span><span className="summary__row-v">{stageObj.h || '—'}</span></div>
            <div className="summary__row"><span className="summary__row-icon">✓</span><span className="summary__row-k">TRL</span><span className="summary__row-v">TRL {v.trl}</span></div>
          </div>
          <div className="summary__col">
            <div className="summary__col-t">
              <span>Echipă & artefacte</span>
              <span className="summary__row-edit" onClick={() => goTo(2)}>Editează</span>
            </div>
            <div className="summary__row"><span className="summary__row-icon">✓</span><span className="summary__row-k">Fondatori</span><span className="summary__row-v">{v.team.filter(t => t.name).length} / {v.team.length}</span></div>
            <div className="summary__row"><span className="summary__row-icon">✓</span><span className="summary__row-k">Dimensiune echipă</span><span className="summary__row-v">{v.teamSize || '—'}</span></div>
            <div className={`summary__row ${v.files.deck ? '' : 'miss'}`}><span className="summary__row-icon">{v.files.deck ? '✓' : '○'}</span><span className="summary__row-k">Pitch Deck</span><span className="summary__row-v">{v.files.deck?.name || 'lipsă'}</span></div>
            <div className={`summary__row ${v.files.video ? '' : 'miss'}`}><span className="summary__row-icon">{v.files.video ? '✓' : '○'}</span><span className="summary__row-k">Video Pitch</span><span className="summary__row-v">{v.files.video?.name || 'lipsă'}</span></div>
            <div className={`summary__row ${v.files.whitepaper ? '' : 'miss'}`}><span className="summary__row-icon">{v.files.whitepaper ? '✓' : '○'}</span><span className="summary__row-k">Whitepaper</span><span className="summary__row-v">{v.files.whitepaper?.name || 'lipsă'}</span></div>
            <div className={`summary__row ${v.files.financials ? '' : 'miss'}`}><span className="summary__row-icon">{v.files.financials ? '✓' : '○'}</span><span className="summary__row-k">Financial model</span><span className="summary__row-v">{v.files.financials?.name || 'lipsă'}</span></div>
            <div className="summary__row"><span className="summary__row-icon">✓</span><span className="summary__row-k">Obiective</span><span className="summary__row-v">{v.goals.length} selectate</span></div>
          </div>
        </div>

        <div className="match-preview">
          <div className="match-preview__h">
            <span>PREVIEW · top 3 granturi potrivite</span>
            <span>calculat acum</span>
          </div>
          <div className="match-preview__list">
            <div className="mp-grant">
              <div className="mp-grant__name">EIC Accelerator 2026<br/>Cut-off Mai</div>
              <div className="mp-grant__meta">🇪🇺 EU · €2.5M · 15 Mai</div>
              <div className="mp-grant__score">MATCH {Math.min(82, score + 8)}%</div>
            </div>
            <div className="mp-grant">
              <div className="mp-grant__name">Startup Moldova 2026<br/>Ediția a III-a</div>
              <div className="mp-grant__meta">🇲🇩 MD · 200K MDL · 1 Iul</div>
              <div className="mp-grant__score">MATCH {Math.min(78, score + 4)}%</div>
            </div>
            <div className="mp-grant">
              <div className="mp-grant__name">Google for Startups<br/>AI Accelerator</div>
              <div className="mp-grant__meta">🌐 Global · Credits · Rolling</div>
              <div className="mp-grant__score">MATCH {Math.min(81, score + 6)}%</div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ marginTop: 28, padding: 18, border: '1px solid var(--border)', background: 'var(--bg-2)', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: 'var(--accent)', whiteSpace: 'nowrap', marginTop: 2 }}>GDPR · TERMS</div>
        <label style={{ fontSize: 13, lineHeight: 1.5, display: 'flex', gap: 10, cursor: 'pointer' }}>
          <input type="checkbox" checked={v.consent} onChange={e => set('consent', e.target.checked)} style={{ marginTop: 3 }} />
          <span>Sunt de acord cu <a style={{ color: 'var(--accent)', borderBottom: '1px solid var(--accent)', paddingBottom: 1 }}>Termenii</a> și <a style={{ color: 'var(--accent)', borderBottom: '1px solid var(--accent)', paddingBottom: 1 }}>Politica de confidențialitate</a>. Datele mele nu sunt folosite pentru antrenament AI fără consimțământ explicit suplimentar.</span>
        </label>
      </div>
    </>
  );
}

/* ------------------- App ------------------ */
const DEFAULT_STATE = {
  email: '', firstName: '', lastName: '', password: '', role: 'Fondator',
  startupName: '', website: '', pitch: '', sector: '', verticals: [], country: '', stage: '', trl: 5,
  team: [{ name: '', role: 'CEO / Fondator', linkedin: '' }],
  teamSize: '', background: [],
  files: {}, github: '',
  goals: [], amountIdx: 3, horizon: '', priority: '',
  consent: false,
};

function RegisterApp() {
  const [step, setStep] = useState(0);
  const [state, setState] = useState(() => {
    try {
      const saved = localStorage.getItem('reg-state');
      if (saved) return { ...DEFAULT_STATE, ...JSON.parse(saved) };
    } catch (e) {}
    return DEFAULT_STATE;
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const signupStartedRef = useRef(false);

  useEffect(() => {
    try { localStorage.setItem('reg-state', JSON.stringify(state)); } catch (e) {}
  }, [state]);

  useEffect(() => {
    try { localStorage.setItem('reg-step', String(step)); } catch (e) {}
  }, [step]);

  useEffect(() => {
    try {
      const s = localStorage.getItem('reg-step');
      if (s !== null) setStep(parseInt(s) || 0);
    } catch (e) {}
    // If already logged in, redirect to dashboard
    fetch('/api/auth/me', { credentials: 'same-origin' })
      .then(r => r.json())
      .then(d => { if (d.ok) window.location.href = '/dashboard.html'; })
      .catch(() => {});
  }, []);

  const set = (k, v) => setState(s => ({ ...s, [k]: v }));

  const next = () => {
    if (!signupStartedRef.current) {
      signupStartedRef.current = true;
      trackRegisterAnalytics('signup_started', {
        entry_step: step + 1,
        result_context: 'register_onboarding',
      });
    }
    setStep(s => Math.min(s + 1, STEPS.length - 1));
  };
  const prev = () => setStep(s => Math.max(s - 1, 0));

  function validateBeforeSubmit() {
    if (!/^\S+@\S+\.\S+$/.test(state.email || '')) return 'Introdu un email valid.';
    if ((state.firstName || '').trim().length < 2) return 'Numele trebuie să aibă minimum 2 caractere.';
    if ((state.lastName || '').trim().length < 2) return 'Prenumele trebuie să aibă minimum 2 caractere.';
    if ((state.password || '').length < 10) return 'Parola trebuie să aibă minimum 10 caractere.';
    if (!/[A-Z]/.test(state.password || '') || !/[a-z]/.test(state.password || '') || !/[0-9]/.test(state.password || '')) {
      return 'Parola trebuie să conțină literă mare, literă mică și cifră.';
    }
    return '';
  }

  async function handleFinish() {
    if (!state.consent || submitting) return;
    const validationError = validateBeforeSubmit();
    if (validationError) {
      setSubmitError(validationError);
      return;
    }
    setSubmitting(true);
    setSubmitError('');
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({
          email:       state.email,
          password:    state.password,
          firstName:   state.firstName,
          lastName:    state.lastName,
          role:        state.role,
          startupName: state.startupName,
          website:     state.website,
          pitch:       state.pitch,
          sector:      state.sector,
          stage:       state.stage,
          trl:         state.trl,
          country:     state.country,
          teamSize:    state.teamSize,
          github:      state.github,
          goals:       state.goals,
          amountIdx:   state.amountIdx,
          horizon:     state.horizon,
          priority:    state.priority,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSubmitError(data.error || 'Eroare la înregistrare');
        setSubmitting(false);
        return;
      }
      trackRegisterAnalytics('signup_completed', {
        result_context: 'register_onboarding',
        has_startup_name: !!state.startupName,
        has_pitch: !!state.pitch,
        has_goals: Array.isArray(state.goals) && state.goals.length > 0,
        selected_sector: !!state.sector,
        selected_country: !!state.country,
      });
      // Clear saved draft
      try { localStorage.removeItem('reg-state'); localStorage.removeItem('reg-step'); } catch (e) {}
      window.location.href = '/dashboard.html';
    } catch {
      setSubmitError('Eroare de rețea. Încearcă din nou.');
      setSubmitting(false);
    }
  }

  return (
    <div className="reg">
      <StepRail active={step} />
      <div className="reg__main">
        <Topbar step={step} totalSteps={STEPS.length} />
        {step === 0 && <StepAccount v={state} set={set} />}
        {step === 1 && <StepStartup v={state} set={set} />}
        {step === 2 && <StepTeam v={state} set={set} />}
        {step === 3 && <StepArtefacts v={state} set={set} />}
        {step === 4 && <StepGoals v={state} set={set} />}
        {step === 5 && <StepReview v={state} set={set} goTo={setStep} />}

        {submitError && (
          <div style={{ margin: '0 0 16px', padding: '12px 16px', background: 'rgba(194,74,30,.08)', border: '1px solid var(--hot)', color: 'var(--hot)', fontFamily: 'JetBrains Mono, monospace', fontSize: 12 }}>
            {submitError}
          </div>
        )}

        <div className="reg__nav">
          <div className="reg__nav-info">
            {step < STEPS.length - 1 ? `Următorul pas: ${STEPS[step + 1].t}` : 'Ultimul pas · gata să începi'}
          </div>
          <div className="reg__nav-btns">
            {step > 0 && <button className="btn btn--ghost" onClick={prev}>← Înapoi</button>}
            {step < STEPS.length - 1 ? (
              <button className="btn btn--accent" onClick={next}>Continuă →</button>
            ) : (
              <button className="btn btn--accent" onClick={handleFinish}
                disabled={!state.consent || submitting}
                style={{ opacity: (state.consent && !submitting) ? 1 : 0.5 }}>
                {submitting ? 'Se creează contul…' : 'Pornește matching-ul →'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('reg-root')).render(<RegisterApp />);
