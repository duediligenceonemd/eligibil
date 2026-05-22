/**
 * chat-widget.js — Standalone AI Chat Widget
 * Works on any page without React. Reads window.__GRANT_DATA__ for context.
 * Calls POST /api/chat — route is in routes/chat.js.
 */
(function () {
  'use strict';

  // Don't double-init
  if (document.getElementById('gcw-root')) return;

  // ── Config ──────────────────────────────────────────────────────────────────
  const MAX_HISTORY = 8;
  const SUGGESTIONS = [
    'Ce granturi sunt disponibile pentru Moldova?',
    'Cum aleg între grant și accelerator?',
    'Care sunt documentele necesare în general?',
    'Există granturi pentru AI / SaaS startups?',
  ];
  const GRANT_SUGGESTIONS = [
    'Sunt eligibil pentru acest grant?',
    'Ce documente trebuie să pregătesc?',
    'Care sunt pașii de aplicare?',
    'Care sunt criteriile de evaluare?',
  ];

  // ── State ────────────────────────────────────────────────────────────────────
  let open    = false;
  let loading = false;
  let history = [];
  const grantData = window.__GRANT_DATA__ || null;
  const suggestions = grantData ? GRANT_SUGGESTIONS : SUGGESTIONS;

  // ── DOM ──────────────────────────────────────────────────────────────────────
  const root = document.createElement('div');
  root.id = 'gcw-root';
  root.setAttribute('data-no-translate', '');  // prevent lang.js from translating widget text
  root.innerHTML = `
    <style>
      #gcw-root { position:fixed; bottom:24px; right:24px; z-index:9999; font-family:'Inter',sans-serif; }
      #gcw-btn { width:52px; height:52px; border-radius:50%; background:var(--accent,#1f3a5f); color:#fff; border:none; cursor:pointer; font-size:22px; box-shadow:0 4px 16px rgba(0,0,0,.25); display:flex; align-items:center; justify-content:center; position:relative; transition:transform .15s; }
      #gcw-btn:hover { transform:scale(1.08); }
      #gcw-btn.open  { background:#444; }
      #gcw-badge { position:absolute; top:-4px; right:-4px; background:#22c55e; color:#fff; font-size:9px; font-weight:700; border-radius:8px; padding:1px 5px; letter-spacing:.04em; }
      #gcw-panel { display:none; position:absolute; bottom:64px; right:0; width:360px; max-width:calc(100vw - 32px); background:var(--bg,#fff); border:1px solid var(--border-soft,#e2e8f0); border-radius:16px; box-shadow:0 8px 40px rgba(0,0,0,.18); flex-direction:column; overflow:hidden; animation:gcw-in .15s ease; }
      #gcw-panel.visible { display:flex; }
      @keyframes gcw-in { from{opacity:0;transform:translateY(12px) scale(.97)} to{opacity:1;transform:none} }
      #gcw-head { background:var(--accent,#1f3a5f); color:#fff; padding:14px 16px; display:flex; align-items:center; gap:10px; }
      #gcw-head-icon { font-size:20px; }
      .gcw-head-t { font-weight:600; font-size:14px; }
      .gcw-head-s { font-size:11px; opacity:.75; margin-top:1px; }
      #gcw-close { margin-left:auto; background:none; border:none; color:#fff; cursor:pointer; font-size:16px; opacity:.75; padding:4px; }
      #gcw-close:hover { opacity:1; }
      #gcw-msgs { flex:1; overflow-y:auto; padding:16px; max-height:340px; min-height:160px; display:flex; flex-direction:column; gap:12px; }
      .gcw-welcome { text-align:center; padding:8px 0; }
      .gcw-welcome-t { font-size:14px; font-weight:600; color:var(--ink,#1a1a1a); margin-bottom:4px; }
      .gcw-chips { display:flex; flex-wrap:wrap; gap:6px; justify-content:center; margin-top:10px; }
      .gcw-chip { font-size:11.5px; padding:5px 10px; border-radius:20px; border:1px solid var(--border-soft,#e2e8f0); background:var(--surface,#f8fafc); color:var(--ink,#1a1a1a); cursor:pointer; transition:background .12s; }
      .gcw-chip:hover { background:var(--accent,#1f3a5f); color:#fff; border-color:var(--accent,#1f3a5f); }
      .gcw-msg { display:flex; gap:8px; align-items:flex-start; }
      .gcw-msg.user { flex-direction:row-reverse; }
      .gcw-avatar { font-size:18px; flex-shrink:0; margin-top:2px; }
      .gcw-bubble { padding:9px 13px; border-radius:12px; font-size:13.5px; line-height:1.55; max-width:88%; white-space:pre-wrap; }
      .gcw-msg.user .gcw-bubble { background:var(--accent,#1f3a5f); color:#fff; border-radius:12px 12px 2px 12px; }
      .gcw-msg.bot  .gcw-bubble { background:var(--surface,#f8fafc); color:var(--ink,#1a1a1a); border:1px solid var(--border-soft,#e2e8f0); border-radius:12px 12px 12px 2px; }
      .gcw-dots { display:flex; gap:4px; align-items:center; padding:12px 14px; }
      .gcw-dot { width:7px; height:7px; border-radius:50%; background:var(--muted,#94a3b8); animation:gcw-dot 1.2s infinite; }
      .gcw-dot:nth-child(2){animation-delay:.2s} .gcw-dot:nth-child(3){animation-delay:.4s}
      @keyframes gcw-dot { 0%,80%,100%{opacity:.25;transform:scale(.9)} 40%{opacity:1;transform:scale(1.1)} }
      .gcw-error { font-size:12px; color:#dc2626; background:#fef2f2; border:1px solid #fecaca; border-radius:8px; padding:8px 12px; }
      #gcw-input-row { padding:12px; border-top:1px solid var(--border-soft,#e2e8f0); display:flex; gap:8px; align-items:flex-end; }
      #gcw-input { flex:1; resize:none; border:1px solid var(--border-soft,#e2e8f0); border-radius:10px; padding:8px 12px; font-size:13px; font-family:'Inter',sans-serif; line-height:1.45; background:var(--bg,#fff); color:var(--ink,#1a1a1a); outline:none; }
      #gcw-input:focus { border-color:var(--accent,#1f3a5f); }
      #gcw-send { width:36px; height:36px; border-radius:10px; flex-shrink:0; background:var(--accent,#1f3a5f); color:#fff; border:none; cursor:pointer; font-size:16px; font-weight:700; display:flex; align-items:center; justify-content:center; transition:opacity .12s; }
      #gcw-send:disabled { opacity:.4; cursor:not-allowed; }
      #gcw-send:not(:disabled):hover { opacity:.85; }
      .dark #gcw-panel { background:#1e293b; border-color:#334155; }
      .dark .gcw-msg.bot .gcw-bubble { background:#0f172a; border-color:#334155; color:#e2e8f0; }
      .dark .gcw-chip { background:#1e293b; border-color:#334155; color:#e2e8f0; }
      .dark #gcw-input { background:#0f172a; border-color:#334155; color:#e2e8f0; }
      .dark #gcw-input-row { border-color:#334155; }
      @media(max-width:480px){#gcw-root{bottom:16px;right:16px} #gcw-panel{width:calc(100vw - 32px);bottom:68px}}
    </style>

    <button id="gcw-btn" title="Consilier AI granturi" aria-label="Deschide chat AI">
      💬<span id="gcw-badge">AI</span>
    </button>

    <div id="gcw-panel" role="dialog" aria-label="AI Chat">
      <div id="gcw-head">
        <div id="gcw-head-icon">🤖</div>
        <div>
          <div class="gcw-head-t">Consilier AI</div>
          <div class="gcw-head-s">${grantData ? (grantData.nume_program || 'Grant advisor') : 'Caută finanțare'}</div>
        </div>
        <button id="gcw-close" aria-label="Închide chat">✕</button>
      </div>

      <div id="gcw-msgs">
        <div class="gcw-welcome">
          <div class="gcw-welcome-t">Bună! Cu ce te pot ajuta?</div>
          <div class="gcw-chips">
            ${suggestions.map(s => `<button class="gcw-chip" data-q="${s.replace(/"/g, '&quot;')}">${s}</button>`).join('')}
          </div>
        </div>
      </div>

      <div id="gcw-input-row">
        <textarea id="gcw-input" rows="2" placeholder="Întreabă despre granturi, eligibilitate..." maxlength="1500"></textarea>
        <button id="gcw-send" disabled title="Trimite">→</button>
      </div>
    </div>
  `;
  document.body.appendChild(root);

  // ── Elements ─────────────────────────────────────────────────────────────────
  const btn    = document.getElementById('gcw-btn');
  const badge  = document.getElementById('gcw-badge');
  const panel  = document.getElementById('gcw-panel');
  const msgs   = document.getElementById('gcw-msgs');
  const input  = document.getElementById('gcw-input');
  const send   = document.getElementById('gcw-send');
  const close  = document.getElementById('gcw-close');

  // ── Toggle ────────────────────────────────────────────────────────────────────
  function toggleOpen() {
    open = !open;
    panel.classList.toggle('visible', open);
    btn.classList.toggle('open', open);
    btn.textContent = open ? '✕' : '💬';
    if (open) {
      if (!open) btn.appendChild(badge);
      input.focus();
      scrollBottom();
    } else {
      btn.appendChild(badge);
    }
  }
  btn.addEventListener('click', toggleOpen);
  close.addEventListener('click', toggleOpen);

  // ── Message rendering ─────────────────────────────────────────────────────────
  function appendMsg(role, content) {
    // Remove welcome on first message
    const welcome = msgs.querySelector('.gcw-welcome');
    if (welcome && history.length <= 1) welcome.remove();

    const div = document.createElement('div');
    div.className = `gcw-msg ${role === 'user' ? 'user' : 'bot'}`;
    if (role !== 'user') div.innerHTML = `<span class="gcw-avatar">🤖</span>`;
    const bubble = document.createElement('div');
    bubble.className = 'gcw-bubble';
    bubble.textContent = content;
    div.appendChild(bubble);
    msgs.appendChild(div);
    scrollBottom();
    return div;
  }

  function appendLoading() {
    const div = document.createElement('div');
    div.className = 'gcw-msg bot';
    div.innerHTML = `<span class="gcw-avatar">🤖</span><div class="gcw-bubble gcw-dots"><span class="gcw-dot"></span><span class="gcw-dot"></span><span class="gcw-dot"></span></div>`;
    msgs.appendChild(div);
    scrollBottom();
    return div;
  }

  function appendError(text) {
    const div = document.createElement('div');
    div.className = 'gcw-error';
    div.textContent = text;
    msgs.appendChild(div);
    scrollBottom();
  }

  function scrollBottom() {
    msgs.scrollTop = msgs.scrollHeight;
  }

  // ── Send message ──────────────────────────────────────────────────────────────
  async function sendMessage(text) {
    const msg = (text || input.value || '').trim();
    if (!msg || loading) return;
    input.value = '';
    send.disabled = true;
    loading = true;

    history.push({ role: 'user', content: msg });
    appendMsg('user', msg);
    const loadingEl = appendLoading();

    try {
      const body = {
        message:  msg,
        grantId:  grantData ? (grantData.id || null) : null,
        history:  history.slice(-MAX_HISTORY * 2),
        language: 'ro',
      };
      const res  = await fetch('/api/chat', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(body),
      });
      const data = await res.json();

      loadingEl.remove();

      if (!res.ok) {
        history.pop();
        appendError(data.error || 'Eroare server. Încearcă din nou.');
      } else {
        history.push({ role: 'assistant', content: data.reply });
        appendMsg('assistant', data.reply);
      }
    } catch (err) {
      loadingEl.remove();
      history.pop();
      appendError('Eroare de conexiune. Verifică internetul și încearcă din nou.');
    } finally {
      loading = false;
      send.disabled = !input.value.trim();
    }
  }

  // ── Events ────────────────────────────────────────────────────────────────────
  input.addEventListener('input', () => { send.disabled = !input.value.trim(); });
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  });
  send.addEventListener('click', () => sendMessage());

  // Suggestion chips
  msgs.addEventListener('click', (e) => {
    const chip = e.target.closest('.gcw-chip');
    if (chip) sendMessage(chip.dataset.q);
  });

})();
