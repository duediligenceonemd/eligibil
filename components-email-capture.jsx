// EmailCapture — shared newsletter signup block.
// Usage: <EmailCapture context="blog" />
// Posts to POST /api/newsletter/subscribe { email, context }.
// Falls back to mailto: if endpoint missing.

const { useState: useStateEC } = React;

function trackAnalyticsEmail(eventName, payload) {
  if (window.eligibilAnalytics && typeof window.eligibilAnalytics.track === 'function') {
    window.eligibilAnalytics.track(eventName, payload);
  }
}

function EmailCapture({ context = 'page', heading, sub }) {
  const [email, setEmail] = useStateEC('');
  const [state, setState] = useStateEC('idle'); // idle | sending | ok | error
  const [msg, setMsg] = useStateEC('');

  async function submit(e) {
    e.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setState('error'); setMsg('Adresă de email invalidă.'); return;
    }
    setState('sending');
    try {
      const r = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ email, context }),
      });
      if (r.ok) {
        trackAnalyticsEmail('newsletter_signup', { context: context || 'page' });
        setState('ok'); setMsg('Te-ai abonat! Vei primi primul update în câteva zile.');
      } else if (r.status === 409) {
        setState('ok'); setMsg('Ești deja abonat. Mulțumim!');
      } else {
        const body = await r.json().catch(() => ({}));
        setState('error'); setMsg(body.error || 'Eroare. Încearcă din nou.');
      }
    } catch (err) {
      setState('error'); setMsg('Eroare de rețea. Încearcă mai târziu.');
    }
  }

  return (
    <div className="email-capture" style={{
      padding: 24,
      background: 'var(--bg-1)',
      border: '1px solid var(--border-soft)',
      borderRadius: 4,
      maxWidth: 580,
    }}>
      <div style={{
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: 11,
        color: 'var(--accent)',
        textTransform: 'uppercase',
        letterSpacing: '.1em',
        marginBottom: 8,
      }}>Newsletter · gratuit</div>
      <h3 style={{ fontSize: 20, margin: '0 0 6px', fontFamily: 'Space Grotesk, sans-serif' }}>
        {heading || 'Primește deadline-uri noi în fiecare săptămână'}
      </h3>
      <p style={{ fontSize: 14, color: 'var(--ink-2)', margin: '0 0 14px', lineHeight: 1.5 }}>
        {sub || 'Granturi, acceleratoare și apeluri noi pentru Moldova, România și Europa de Est — selectate manual, fără spam.'}
      </p>
      {state === 'ok' ? (
        <div style={{
          padding: 14,
          background: 'var(--bg-2)',
          borderLeft: '3px solid #0a5c3e',
          fontSize: 14,
          color: 'var(--ink-1)',
        }}>{msg}</div>
      ) : (
        <form onSubmit={submit} style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <input
            type="email"
            required
            placeholder="email@startupul-tau.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            disabled={state === 'sending'}
            style={{
              flex: '1 1 240px',
              minHeight: 44,
              padding: '10px 14px',
              border: '1px solid var(--border-soft)',
              background: 'var(--bg-2)',
              borderRadius: 4,
              fontFamily: 'inherit',
              fontSize: 14,
            }}
          />
          <button
            type="submit"
            className="btn btn--accent"
            disabled={state === 'sending'}
            style={{ minHeight: 44, flex: '0 0 auto' }}
          >
            {state === 'sending' ? 'Se trimite…' : 'Abonează-mă'}
          </button>
          {state === 'error' && (
            <div style={{ flex: '1 1 100%', fontSize: 13, color: '#c24a1e', marginTop: 6 }}>{msg}</div>
          )}
        </form>
      )}
      <p style={{ fontSize: 11, color: 'var(--ink-2)', margin: '12px 0 0' }}>
        Te poți dezabona oricând. Nu vindem datele tale. Frecvență: 1–2 emailuri pe săptămână.
      </p>
    </div>
  );
}

window.EmailCapture = EmailCapture;
