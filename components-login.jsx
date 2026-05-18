// Login page — eligibil.org
const { useState, useEffect } = React;

function LoginApp() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  // If already logged in, redirect to dashboard
  useEffect(() => {
    fetch('/api/auth/me', { credentials: 'same-origin' })
      .then(r => r.json())
      .then(d => { if (d.ok) window.location.href = '/dashboard.html'; })
      .catch(() => {});
  }, []);

  function safeNextPath(raw) {
    const value = String(raw || '');
    if (!value.startsWith('/')) return '/dashboard.html';
    if (value.startsWith('//')) return '/dashboard.html';
    return value;
  }

  const next = (() => {
    const params = new URLSearchParams(window.location.search);
    return safeNextPath(params.get('next') || '/dashboard.html');
  })();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      setError('Introdu un email valid.');
      setLoading(false);
      return;
    }
    if (password.length < 8) {
      setError('Parola trebuie să aibă minimum 8 caractere.');
      setLoading(false);
      return;
    }
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Eroare la autentificare');
      } else {
        window.location.href = next;
      }
    } catch {
      setError('Eroare de rețea. Încearcă din nou.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '440px 1fr', minHeight: '100vh' }}>

      {/* Left rail — same dark style as register */}
      <div style={{
        background: 'var(--ink)', color: 'var(--bg)',
        padding: '48px 40px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        position: 'sticky', top: 0, height: '100vh'
      }}>
        <div>
          <a href="/index.html" style={{
            fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: 22,
            color: 'var(--bg)', textDecoration: 'none', letterSpacing: '-.02em'
          }}>
            eligibil<span style={{ color: 'var(--accent)' }}>.org</span>
          </a>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, textTransform: 'uppercase', letterSpacing: '.14em', color: 'rgba(255,255,255,.45)', marginTop: 8 }}>
            AI Readiness &amp; Funding
          </div>
        </div>

        <div>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, textTransform: 'uppercase', letterSpacing: '.14em', color: 'rgba(255,255,255,.45)', marginBottom: 16 }}>
            AUTENTIFICARE
          </div>
          <h2 style={{ fontSize: 'clamp(32px, 4vw, 48px)', lineHeight: 1, letterSpacing: '-.03em', marginBottom: 16 }}>
            Bine ai<br />revenit.
          </h2>
          <p style={{ color: 'rgba(255,255,255,.55)', fontSize: 15, lineHeight: 1.5 }}>
            Dashboard-ul tău te așteaptă cu cele mai noi match-uri de granturi, alerte și actualizări de pipeline.
          </p>
        </div>

        <div>
          <div style={{ borderTop: '1px solid rgba(255,255,255,.12)', paddingTop: 24, fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: 'rgba(255,255,255,.3)' }}>
            Nu ai cont? <a href="/register.html" style={{ color: 'rgba(255,255,255,.65)', textDecoration: 'underline' }}>Înregistrează-te gratuit →</a>
          </div>
        </div>
      </div>

      {/* Right — form */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 32px', background: 'var(--bg)' }}>
        <div style={{ width: '100%', maxWidth: 440 }}>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, textTransform: 'uppercase', letterSpacing: '.14em', color: 'var(--muted)', marginBottom: 32, display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ width: 28, height: 1, background: 'var(--ink)', display: 'inline-block' }}></span>
            Intră în cont
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div className="reg-field">
              <label className="reg-label">Email</label>
              <input
                className="reg-input"
                type="email"
                placeholder="tu@startup.md"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div className="reg-field">
              <label className="reg-label">Parolă</label>
              <input
                className="reg-input"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>

            {error && (
              <div style={{ padding: '12px 16px', background: 'rgba(194,74,30,.08)', border: '1px solid var(--hot)', color: 'var(--hot)', fontFamily: 'JetBrains Mono, monospace', fontSize: 12 }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              className="btn btn--accent"
              style={{ marginTop: 8, padding: '14px 24px', fontSize: 15, fontWeight: 600 }}
              disabled={loading}
            >
              {loading ? 'Se autentifică…' : 'Intră în cont →'}
            </button>

            <div style={{ textAlign: 'center', fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: 'var(--muted)' }}>
              Nu ai cont?{' '}
              <a href="/register.html" style={{ color: 'var(--accent)', textDecoration: 'underline' }}>
                Înregistrare gratuită
              </a>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('login-root')).render(<LoginApp />);
