const { useState: useStateE, useEffect: useEffectE } = React;

const TYPE_LABEL = {
  conference: 'Conferință',
  pitch_event: 'Pitch event',
  webinar: 'Webinar',
  workshop: 'Workshop',
  networking: 'Networking',
  hackathon: 'Hackathon',
  accelerator_call: 'Accelerator',
};

function downloadIcs(ev) {
  const dtStart = new Date(ev.start_date).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const dtEnd   = new Date(ev.end_date || ev.start_date).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const ics = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//eligibil.org//EN',
    'BEGIN:VEVENT',
    'UID:' + ev.id + '@eligibil.org',
    'DTSTAMP:' + dtStart,
    'DTSTART:' + dtStart,
    'DTEND:' + dtEnd,
    'SUMMARY:' + (ev.title || '').replace(/\n/g, ' '),
    'DESCRIPTION:' + (ev.short_summary_ro || '').replace(/\n/g, ' '),
    'LOCATION:' + ([ev.venue, ev.city, ev.country].filter(Boolean).join(', ') || (ev.is_online ? 'Online' : '')),
    ev.registration_url ? 'URL:' + ev.registration_url : '',
    'END:VEVENT', 'END:VCALENDAR'
  ].filter(Boolean).join('\r\n');
  const blob = new Blob([ics], { type: 'text/calendar' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = (ev.slug_ro || 'eveniment') + '.ics';
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 500);
}

function EventPage() {
  const slug = (location.pathname.match(/^\/(?:evenimente|events)\/([a-z0-9-]+)/i) || [])[1];
  const [event, setEvent] = useStateE(null);
  const [similar, setSimilar] = useStateE([]);
  const [loading, setLoading] = useStateE(true);
  const [error, setError] = useStateE(null);

  useEffectE(() => {
    if (!slug) { setError('Slug invalid'); setLoading(false); return; }
    fetch('/api/events/' + slug)
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then(data => {
        setEvent(data);
        // Document head meta
        document.title = (data.title || 'Eveniment') + ' · eligibil.org';
        const desc = data.short_summary_ro || data.short_summary_en || '';
        const m = document.querySelector('meta[name="description"]');
        if (m) m.setAttribute('content', desc);
        // Similar events
        return fetch('/api/events?type=' + data.event_type + '&country=' + (data.country || ''));
      })
      .then(r => r && r.ok ? r.json() : null)
      .then(data => {
        if (data) setSimilar((data.events || []).filter(e => e.slug_ro !== slug).slice(0, 3));
      })
      .catch(() => setError('Eveniment negăsit.'))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return <div style={{padding:48,textAlign:'center'}}>Se încarcă…</div>;
  if (error || !event) return (
    <section className="section"><div className="container">
      <div className="ev-crumbs"><a href="/">Acasă</a> › <a href="/evenimente">Evenimente</a></div>
      <h1 className="ev-title">Eveniment negăsit</h1>
      <p>Slug-ul nu corespunde niciunui eveniment. Vezi <a href="/evenimente">toate evenimentele →</a></p>
    </div></section>
  );

  const e = event;
  const start = new Date(e.start_date);
  const end = e.end_date ? new Date(e.end_date) : null;
  const dateStr = start.toLocaleDateString('ro-RO', { day:'2-digit', month:'long', year:'numeric' });
  const endStr = end ? end.toLocaleDateString('ro-RO', { day:'2-digit', month:'long', year:'numeric' }) : null;

  return (
    <>
      <section className="ev-hero">
        <div className="container">
          <div className="ev-crumbs">
            <a href="/">Acasă</a> › <a href="/evenimente">Evenimente</a> › <span>{e.title}</span>
          </div>
          <span className="ev-type">{TYPE_LABEL[e.event_type] || e.event_type}</span>
          <h1 className="ev-title">{e.title}</h1>
          <div className="ev-meta">
            <span>📅 <strong>{dateStr}{endStr && endStr !== dateStr ? ' – ' + endStr : ''}</strong></span>
            <span>📍 <strong>{e.is_online ? 'Online' : [e.venue, e.city, e.country].filter(Boolean).join(', ')}</strong></span>
            <span>{e.is_free ? '💰 Gratuit' : (e.price_eur ? '💶 €' + e.price_eur : '')}</span>
            {e.organizer_name && <span>👤 <strong>{e.organizer_name}</strong></span>}
          </div>
        </div>
      </section>

      <div className="container ev-body">
        <div>
          <div className="ev-section">
            <h2>Despre eveniment</h2>
            <p>{e.description_ro || e.short_summary_ro || 'Detalii suplimentare disponibile pe pagina organizatorului.'}</p>
          </div>

          {e.topics && e.topics.length > 0 && (
            <div className="ev-section">
              <h2>Subiecte relevante</h2>
              <div className="ev-tags">
                {e.topics.map(t => <span className="ev-tag" key={t}>{t}</span>)}
              </div>
            </div>
          )}

          {e.audience && e.audience.length > 0 && (
            <div className="ev-section">
              <h2>Cui i se adresează</h2>
              <div className="ev-tags">
                {e.audience.map(a => <span className="ev-tag" key={a}>{a}</span>)}
              </div>
            </div>
          )}

          <div className="ev-section" style={{marginTop:40}}>
            <EmailCapture
              context={`event:${slug}`}
              heading="Vrei să afli de evenimente noi?"
              sub="Primește săptămânal lista cu conferințe, deadline-uri și pitch events pentru fondatori din Moldova, România și Europa de Est."
            />
          </div>
        </div>

        <aside>
          <div className="ev-aside">
            <dl style={{margin:0}}>
              <dt>Data</dt>
              <dd>{dateStr}{endStr && endStr !== dateStr ? ' – ' + endStr : ''}</dd>
              <dt>Locație</dt>
              <dd>{e.is_online ? 'Online' : [e.venue, e.city, e.country].filter(Boolean).join(', ')}</dd>
              <dt>Tip</dt>
              <dd>{TYPE_LABEL[e.event_type] || e.event_type}</dd>
              {e.organizer_name && (<><dt>Organizator</dt><dd>{e.organizer_url ? <a href={e.organizer_url} target="_blank" rel="noopener">{e.organizer_name} ↗</a> : e.organizer_name}</dd></>)}
              <dt>Cost</dt>
              <dd>{e.is_free ? 'Gratuit' : (e.price_eur ? `€${e.price_eur}` : '—')}</dd>
            </dl>
            <div className="ev-cta-row">
              {e.registration_url && <a className="btn btn--accent" href={e.registration_url} target="_blank" rel="noopener" style={{flex:'1 1 100%',textAlign:'center'}}>Înregistrează-te →</a>}
              <a className="btn btn--ghost" onClick={() => downloadIcs(e)} href="#" style={{flex:'1 1 100%',textAlign:'center'}}>Adaugă în calendar</a>
            </div>
          </div>
        </aside>
      </div>

      {similar.length > 0 && (
        <section className="ev-similar">
          <div className="container">
            <h2>Evenimente similare</h2>
            <div className="ev-similar-grid">
              {similar.map(s => (
                <a className="ev-similar-card" href={`/evenimente/${s.slug_ro}`} key={s.id}>
                  <h3>{s.title}</h3>
                  <p>{new Date(s.start_date).toLocaleDateString('ro-RO', {day:'2-digit',month:'short',year:'numeric'})} · {s.city || (s.is_online ? 'Online' : s.country)}</p>
                </a>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}

function App() {
  const [lang, setLangState] = useStateE((window.getLanguage && window.getLanguage()) || 'RO');
  const setLang = (l) => { setLangState(l); if (window.setLanguage) window.setLanguage(l); };
  useEffectE(() => {
    const onLang = (e) => setLangState(e.detail.lang);
    window.addEventListener('languagechange', onLang);
    return () => window.removeEventListener('languagechange', onLang);
  }, []);
  return (
    <>
      <NavOrg lang={lang} setLang={setLang} />
      <EventPage />
      <FooterOrg lang={lang} setLang={setLang} />
    </>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
