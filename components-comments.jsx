// Public comments + like reactions for content detail pages
// (grants, blog posts, news articles).
//
// Mounts at #comments-root which is server-rendered with two data attrs:
//   data-content-type="grant" | "blog_post" | "news_article"
//   data-content-id="<id>"
//
// Auth model: anyone can read; only logged-in users can like or comment.
// auth.js exposes window.__USER (or fires 'auth-ready' event) on pages that
// load it; pages that don't (e.g. content detail SSR) fetch /api/auth/me
// directly inside this component.

const { useState, useEffect, useCallback } = React;

function useAuthUser() {
  const [user, setUser] = useState(null);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    if (window.__USER) { setUser(window.__USER); setLoaded(true); return; }
    fetch('/api/auth/me', { credentials: 'same-origin' })
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.ok) { setUser(d.user); window.__USER = d.user; } })
      .finally(() => setLoaded(true));
  }, []);
  return { user, loaded };
}

function timeAgo(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const seconds = Math.floor((Date.now() - d.getTime()) / 1000);
  if (seconds < 60)    return 'acum';
  if (seconds < 3600)  return Math.floor(seconds / 60)    + ' min';
  if (seconds < 86400) return Math.floor(seconds / 3600)  + ' h';
  if (seconds < 2592000) return Math.floor(seconds / 86400) + ' zile';
  return d.toISOString().slice(0, 10);
}

function CommentsApp({ contentType, contentId }) {
  const { user, loaded: authLoaded } = useAuthUser();
  const [comments, setComments]    = useState(null);
  const [likeCount, setLikeCount]  = useState(0);
  const [myReaction, setMyReaction] = useState(null);
  const [draft, setDraft]          = useState('');
  const [posting, setPosting]      = useState(false);
  const [error, setError]          = useState(null);

  const refresh = useCallback(async () => {
    setError(null);
    try {
      const r = await fetch(`/api/comments?content_type=${encodeURIComponent(contentType)}&content_id=${encodeURIComponent(contentId)}`, {
        credentials: 'same-origin',
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || 'API ' + r.status);
      setComments(data.comments || []);
      setLikeCount(data.reactions?.like || 0);
      setMyReaction(data.my_reaction || null);
    } catch (err) {
      setError(err.message);
      setComments([]);
    }
  }, [contentType, contentId]);

  useEffect(() => { refresh(); }, [refresh]);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!draft.trim() || posting) return;
    setPosting(true);
    setError(null);
    try {
      const r = await fetch('/api/comments', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content_type: contentType, content_id: contentId, body: draft.trim() }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || 'API ' + r.status);
      setDraft('');
      await refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setPosting(false);
    }
  };

  const onLike = async () => {
    if (!user) {
      window.location.href = '/login.html?next=' + encodeURIComponent(location.pathname);
      return;
    }
    try {
      const r = await fetch('/api/reactions/toggle', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content_type: contentType, content_id: contentId }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || 'API ' + r.status);
      setMyReaction(data.reacted ? 'like' : null);
      setLikeCount(c => Math.max(0, c + (data.reacted ? 1 : -1)));
    } catch (err) {
      setError(err.message);
    }
  };

  const onDelete = async (id) => {
    if (!window.confirm('Ștergi comentariul?')) return;
    try {
      const r = await fetch('/api/comments/' + id, { method: 'DELETE', credentials: 'same-origin' });
      if (!r.ok) {
        const data = await r.json().catch(() => ({}));
        throw new Error(data.error || 'API ' + r.status);
      }
      await refresh();
    } catch (err) { setError(err.message); }
  };

  return (
    <section className="cm">
      <div className="cm__bar">
        <button
          className={'cm__like ' + (myReaction ? 'is-active' : '')}
          onClick={onLike}
          aria-pressed={!!myReaction}
        >
          {myReaction ? '♥' : '♡'} {likeCount}
        </button>
        <span className="cm__count">{comments == null ? '…' : (comments.length + ' comentarii')}</span>
      </div>

      {!authLoaded ? null : !user ? (
        <div className="cm__signin">
          <a href={'/login.html?next=' + encodeURIComponent(location.pathname)}>Conectează-te</a> ca să comentezi.
        </div>
      ) : (
        <form className="cm__form" onSubmit={onSubmit}>
          <textarea
            className="cm__input"
            rows={3}
            placeholder="Scrie un comentariu…"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            maxLength={5000}
          />
          <div className="cm__form-actions">
            <span className="cm__charcount">{draft.length} / 5000</span>
            <button className="cm__submit" disabled={!draft.trim() || posting}>
              {posting ? 'trimit…' : 'Trimite'}
            </button>
          </div>
        </form>
      )}

      {error && <div className="cm__error">{error}</div>}

      <ul className="cm__list">
        {comments == null && <li className="cm__loading">Se încarcă comentariile…</li>}
        {comments && comments.length === 0 && (
          <li className="cm__empty">Niciun comentariu — fii primul.</li>
        )}
        {(comments || []).map(c => (
          <li key={c.id} className="cm__item">
            <div className="cm__item-head">
              <strong>{c.user_name || 'Utilizator'}</strong>
              <span className="cm__item-time">· {timeAgo(c.created_at)}</span>
              {/* Author or admin can delete; server checks anyway */}
              {user && <button className="cm__del" onClick={() => onDelete(c.id)} aria-label="șterge">×</button>}
            </div>
            <div className="cm__item-body">{c.body}</div>
          </li>
        ))}
      </ul>
    </section>
  );
}

// Boot
(function () {
  const root = document.getElementById('comments-root');
  if (!root) return;
  const ct = root.getAttribute('data-content-type');
  const cid = root.getAttribute('data-content-id');
  if (!ct || !cid) { console.warn('comments-root missing data attrs'); return; }
  ReactDOM.createRoot(root).render(<CommentsApp contentType={ct} contentId={cid} />);
})();
