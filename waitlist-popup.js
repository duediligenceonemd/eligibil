(function () {
  'use strict';

  // ── Texts (3 variants × 4 languages) ────────────────────────────────────────
  var T = {
    A: {
      title:   { ro: 'Lucrăm la ceva mai bun. Vrei să fii printre primii?', en: 'We’re building something better. Want early access?', ru: 'Мы создаём что-то лучше. Хотите ранний доступ?', ua: 'Ми створюємо щось краще. Бажаєте ранній доступ?' },
      sub:     { ro: 'eligibil.org e încă în construcție. Lansăm în mai 2026. Înscrie-te pe waitlist și primești acces prioritar + Ghidul Finanțărilor 2026 (PDF, gratuit).', en: 'eligibil.org is still under construction. We launch May 2026. Join the waitlist for priority access + Funding Guide 2026 (free PDF).', ru: 'eligibil.org ещё в разработке. Запуск в мае 2026. Запишитесь и получите приоритетный доступ + Гид по финансированию 2026 (PDF).', ua: 'eligibil.org ще в розробці. Запуск у травні 2026. Запишіться і отримайте пріоритетний доступ + Гід з фінансування 2026 (PDF).' },
      cta:     { ro: 'Adaugă-mă pe waitlist', en: 'Add me to waitlist', ru: 'Добавьте меня', ua: 'Додайте мене' },
      dismiss: { ro: 'Nu, mulțumesc', en: 'No thanks', ru: 'Нет, спасибо', ua: 'Ні, дякую' },
    },
    B: {
      title:   { ro: 'Primește lista granturilor active înainte de oricine', en: 'Get the list of active grants before anyone else', ru: 'Получите список активных грантов раньше всех', ua: 'Отримайте список активних грантів раніше за всіх' },
      sub:     { ro: '567+ programe de finanțare actualizate săptămânal. Lansăm în mai 2026. Înscrie-te acum, primești:', en: '567+ funding programs updated weekly. We launch May 2026. Sign up now, get:', ru: '567+ программ, обновляемых еженедельно. Запуск в мае 2026. Запишитесь:', ua: '567+ програм, оновлюваних щотижня. Запуск у травні 2026. Запишіться:' },
      benefits: {
        ro: ['Ghidul Finanțărilor 2026 (PDF, la înscriere)', 'Newsletter săptămânal cu noi oportunități', '30% reducere primul an la lansare'],
        en: ['Funding Guide 2026 (PDF, on signup)', 'Weekly newsletter with new opportunities', '30% off first year at launch'],
        ru: ['Гид по финансированию 2026 (PDF)', 'Еженедельный нюслеттер', 'Скидка 30% на первый год'],
        ua: ['Гід з фінансування 2026 (PDF)', 'Щотижневий нюслетер', 'Знижка 30% на перший рік'],
      },
      cta:     { ro: 'Da, vreau acces prioritar', en: 'Yes, I want priority access', ru: 'Да, хочу приоритетный доступ', ua: 'Так, хочу пріоритетний доступ' },
      dismiss: { ro: 'Mai târziu', en: 'Later', ru: 'Позже', ua: 'Пізніше' },
    },
    C: {
      title:   { ro: 'Înainte să pleci...', en: 'Before you go...', ru: 'Прежде чем уйти...', ua: 'Перш ніж піти...' },
      sub:     { ro: 'Trimitem o dată pe săptămână lista granturilor cu deadline apropiat. Fără promovări. Doar oportunități verificate.', en: 'We send once a week the list of grants with approaching deadlines. No promotions. Only verified opportunities.', ru: 'Раз в неделю отправляем список грантов с ближайшими дедлайнами. Без рекламы.', ua: 'Раз на тиждень надсилаємо список грантів з близькими дедлайнами. Без реклами.' },
      cta:     { ro: 'Trimiteți-mi lista', en: 'Send me the list', ru: 'Отправьте мне список', ua: 'Надішліть мені список' },
      dismiss: { ro: 'Continuă spre ieșire', en: 'Continue to exit', ru: 'Продолжить выход', ua: 'Продовжити вихід' },
    },
    input:     { ro: 'Email', en: 'Email', ru: 'Email', ua: 'Email' },
    disc:      { ro: 'Fără spam. Dezabonare oricând.', en: 'No spam. Unsubscribe anytime.', ru: 'Без спама. Отписка в любое время.', ua: 'Без спаму. Відписка будь-коли.' },
    success:   { ro: 'Ești pe listă!', en: 'You’re on the list!', ru: 'Вы в списке!', ua: 'Ви у списку!' },
    successSub:{ ro: 'Verifică inbox-ul — am trimis un link de confirmare.', en: 'Check your inbox — we sent a confirmation link.', ru: 'Проверьте почту — мы отправили ссылку.', ua: 'Перевірте пошту — ми надіслали посилання.' },
    errGeneric:{ ro: 'Ceva nu a funcționat. Încearcă din nou.', en: 'Something went wrong. Try again.', ru: 'Что-то пошло не так. Попробуйте снова.', ua: 'Щось пішло не так. Спробуйте ще.' },
    errEmail:  { ro: 'Introdu o adresă de email validă.', en: 'Enter a valid email address.', ru: 'Введите корректный email.', ua: 'Введіть коректний email.' },
  };

  // ── Helpers ──────────────────────────────────────────────────────────────────
  function getLang() {
    var l = (window.getLanguage ? window.getLanguage() : 'RO').toLowerCase();
    return { ro: 'ro', en: 'en', ru: 'ru', ua: 'ua' }[l] || 'ro';
  }

  function txt(obj, lang) { return obj[lang] || obj.ro; }

  function getCookie(name) {
    var m = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
    return m ? decodeURIComponent(m[1]) : null;
  }

  function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function lsSet(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  function ssGet(k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } }
  function ssSet(k, v) { try { sessionStorage.setItem(k, v); } catch (e) {} }

  function el(tag, style, attrs) {
    var e = document.createElement(tag);
    if (style) e.setAttribute('style', style);
    if (attrs) Object.keys(attrs).forEach(function (k) { e.setAttribute(k, attrs[k]); });
    return e;
  }

  // ── Pre-checks (fast exit) ──────────────────────────────────────────────────
  if (getCookie('eligibil_waitlist') || getCookie('eligibil_user')) return;
  if (ssGet('eligibil_popup_shown')) return;

  var dismissCount = parseInt(lsGet('eligibil_popup_dismissal_count') || '0', 10);
  if (dismissCount >= 2) return;

  var dismissedAt = parseInt(lsGet('eligibil_popup_dismissed_at') || '0', 10);
  if (dismissedAt && Date.now() - dismissedAt < 7 * 24 * 60 * 60 * 1000) return;

  var excluded = ['/privacy', '/politica-confidentialitate', '/login', '/register', '/dashboard', '/profile', '/admin', '/admin-queue', '/unsubscribe'];
  var path = window.location.pathname;
  for (var i = 0; i < excluded.length; i++) {
    if (path === excluded[i] || path.indexOf('/admin') === 0) return;
  }

  if (window.innerWidth < 360) return;

  // Debug: ?popup=test forces instant show
  if (/[?&]popup=test/.test(location.search)) {
    setTimeout(function () { showPopup(false); }, 300);
  }

  // ── Tracking state ──────────────────────────────────────────────────────────
  var state = {
    startTime: Date.now(),
    scrollDepth: 0,
    pastFold: false,
    navClicked: false,
    cardHovered: false,
    shown: false,
  };

  var hoverTimer = null;

  // Scroll tracking (throttled)
  var scrollThrottle = null;
  window.addEventListener('scroll', function () {
    if (scrollThrottle) return;
    scrollThrottle = setTimeout(function () {
      scrollThrottle = null;
      var docH = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight);
      var winH = window.innerHeight;
      var scrolled = window.scrollY + winH;
      state.scrollDepth = docH > 0 ? (scrolled / docH) : 0;
      if (window.scrollY > winH * 0.8) state.pastFold = true;
    }, 200);
  }, { passive: true });

  // Nav click tracking
  document.addEventListener('click', function (e) {
    var t = e.target;
    while (t && t !== document.body) {
      if (t.tagName === 'NAV' || (t.tagName === 'A' && t.closest && t.closest('nav'))) {
        state.navClicked = true;
        return;
      }
      t = t.parentElement;
    }
  }, { passive: true });

  // Card hover tracking (2s threshold)
  document.addEventListener('mouseover', function (e) {
    var t = e.target;
    while (t && t !== document.body) {
      if (t.hasAttribute && t.hasAttribute('data-card-program')) {
        hoverTimer = setTimeout(function () { state.cardHovered = true; }, 2000);
        return;
      }
      t = t.parentElement;
    }
  }, { passive: true });
  document.addEventListener('mouseout', function (e) {
    var t = e.target;
    while (t && t !== document.body) {
      if (t.hasAttribute && t.hasAttribute('data-card-program')) {
        if (hoverTimer) { clearTimeout(hoverTimer); hoverTimer = null; }
        return;
      }
      t = t.parentElement;
    }
  }, { passive: true });

  // ── Trigger check ───────────────────────────────────────────────────────────
  function checkTrigger() {
    if (state.shown) return;
    var elapsed = (Date.now() - state.startTime) / 1000;

    // Not bounce
    if (elapsed < 15) return;

    // Engagement minimum (40s OR scroll 60%)
    if (elapsed < 40 && state.scrollDepth < 0.6) return;

    // Interest verified
    if (!state.pastFold && !state.navClicked && !state.cardHovered) return;

    state.shown = true;
    showPopup(false);
  }

  var checkInterval = setInterval(function () {
    if (state.shown) { clearInterval(checkInterval); return; }
    checkTrigger();
  }, 5000);

  // ── Exit intent (desktop only) ──────────────────────────────────────────────
  if (window.innerWidth >= 1024) {
    document.addEventListener('mouseleave', function (e) {
      if (state.shown) return;
      if (e.clientY > 5) return;
      var elapsed = (Date.now() - state.startTime) / 1000;
      if (elapsed < 5) return;
      state.shown = true;
      showPopup(true);
    });
  }

  // ── Show popup ──────────────────────────────────────────────────────────────
  function showPopup(isExitIntent) {
    clearInterval(checkInterval);
    ssSet('eligibil_popup_shown', '1');

    var lang = getLang();
    var variant;

    if (isExitIntent) {
      variant = 'C';
    } else {
      variant = lsGet('eligibil_popup_variant');
      if (!variant || (variant !== 'A' && variant !== 'B')) {
        variant = Math.random() < 0.5 ? 'A' : 'B';
        lsSet('eligibil_popup_variant', variant);
      }
    }

    var v = T[variant];
    var source = isExitIntent ? 'exit_intent' : 'popup';
    var previousFocus = document.activeElement;

    // Overlay
    var overlay = el('div', 'position:fixed;inset:0;z-index:10000;background:rgba(14,22,32,0.6);backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;opacity:0;transition:opacity .2s ease;padding:16px;', {
      role: 'dialog',
      'aria-modal': 'true',
      'aria-labelledby': 'wl-title',
    });

    // Modal
    var modal = el('div', 'position:relative;max-width:480px;width:100%;background:var(--surface,#fffefb);border:1px solid var(--border-soft,#d9d3c5);padding:32px;box-shadow:0 24px 48px rgba(0,0,0,0.15);');

    // Close button
    var closeBtn = el('button', 'position:absolute;top:12px;right:12px;width:32px;height:32px;border:none;background:none;cursor:pointer;color:var(--muted,#6a7381);font-size:20px;display:flex;align-items:center;justify-content:center;', { 'aria-label': 'Close', tabindex: '0' });
    closeBtn.innerHTML = '&#x2715;';
    closeBtn.onmouseover = function () { closeBtn.style.color = 'var(--accent,#1f3a5f)'; };
    closeBtn.onmouseout = function () { closeBtn.style.color = 'var(--muted,#6a7381)'; };

    // Title
    var title = el('h2', "font-family:'Space Grotesk',system-ui,sans-serif;font-size:24px;font-weight:600;color:var(--ink,#0e1620);margin:0 0 12px;line-height:1.2;padding-right:32px;", { id: 'wl-title' });
    title.textContent = txt(v.title, lang);

    // Subtitle
    var sub = el('p', "font-family:'Inter',system-ui,sans-serif;font-size:15px;color:var(--muted,#6a7381);line-height:1.55;margin:0 0 20px;");
    sub.textContent = txt(v.sub, lang);

    modal.appendChild(closeBtn);
    modal.appendChild(title);
    modal.appendChild(sub);

    // Benefits list (variant B only)
    if (v.benefits) {
      var ul = el('ul', "font-family:'Inter',system-ui,sans-serif;font-size:14px;color:var(--ink-2,#2a3644);line-height:1.6;margin:0 0 20px;padding:0;list-style:none;");
      var bList = txt(v.benefits, lang);
      for (var bi = 0; bi < bList.length; bi++) {
        var li = el('li', 'padding:2px 0;');
        li.textContent = '✓  ' + bList[bi];
        ul.appendChild(li);
      }
      modal.appendChild(ul);
    }

    // Form container
    var form = el('div', 'margin:0 0 12px;');

    // Input
    var input = el('input', "width:100%;padding:12px;border:1px solid var(--border-soft,#d9d3c5);background:var(--bg,#f7f5f0);color:var(--ink,#0e1620);font-family:'Inter',system-ui,sans-serif;font-size:14px;box-sizing:border-box;outline:none;margin-bottom:12px;", {
      type: 'email',
      placeholder: txt(T.input, lang),
      autocomplete: 'email',
      'aria-label': txt(T.input, lang),
      tabindex: '0',
    });
    input.onfocus = function () { input.style.borderColor = 'var(--accent,#1f3a5f)'; };
    input.onblur = function () { input.style.borderColor = 'var(--border-soft,#d9d3c5)'; };

    // Error message (hidden)
    var errMsg = el('p', "font-family:'Inter',system-ui,sans-serif;font-size:13px;color:var(--hot,#c24a1e);margin:0 0 8px;display:none;");

    // Submit button
    var ctaBtn = el('button', "width:100%;padding:14px;background:var(--ink,#0e1620);color:var(--bg,#f7f5f0);border:1px solid var(--ink,#0e1620);font-family:'Inter',system-ui,sans-serif;font-weight:500;font-size:14px;cursor:pointer;transition:transform .08s ease,background .15s;", { tabindex: '0' });
    ctaBtn.textContent = txt(v.cta, lang);
    ctaBtn.onmouseover = function () { ctaBtn.style.transform = 'translate(-2px,-2px)'; ctaBtn.style.boxShadow = '4px 4px 0 0 var(--accent,#1f3a5f)'; };
    ctaBtn.onmouseout = function () { ctaBtn.style.transform = 'none'; ctaBtn.style.boxShadow = 'none'; };

    form.appendChild(input);
    form.appendChild(errMsg);
    form.appendChild(ctaBtn);
    modal.appendChild(form);

    // Dismiss link
    var dismissLink = el('button', "display:block;width:100%;text-align:center;background:none;border:none;font-family:'Inter',system-ui,sans-serif;font-size:13px;color:var(--muted,#6a7381);cursor:pointer;padding:8px 0;", { tabindex: '0' });
    dismissLink.textContent = txt(v.dismiss, lang);
    dismissLink.onmouseover = function () { dismissLink.style.color = 'var(--accent,#1f3a5f)'; };
    dismissLink.onmouseout = function () { dismissLink.style.color = 'var(--muted,#6a7381)'; };
    modal.appendChild(dismissLink);

    // Disclaimer
    var disc = el('p', "font-family:'JetBrains Mono',ui-monospace,monospace;font-size:10.5px;text-transform:uppercase;letter-spacing:0.1em;color:var(--muted,#6a7381);text-align:center;margin:12px 0 0;");
    disc.textContent = txt(T.disc, lang);
    modal.appendChild(disc);

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    // Fade in
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { overlay.style.opacity = '1'; });
    });

    // Focus input after animation
    setTimeout(function () { input.focus(); }, 300);

    // ── Close logic ──────────────────────────────────────────────────────────
    function closePopup() {
      lsSet('eligibil_popup_dismissed_at', String(Date.now()));
      lsSet('eligibil_popup_dismissal_count', String(dismissCount + 1));
      overlay.style.opacity = '0';
      setTimeout(function () {
        if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
        if (previousFocus && previousFocus.focus) previousFocus.focus();
      }, 200);
    }

    closeBtn.onclick = closePopup;
    dismissLink.onclick = closePopup;
    overlay.addEventListener('click', function (e) { if (e.target === overlay) closePopup(); });
    document.addEventListener('keydown', function onEsc(e) {
      if (e.key === 'Escape') {
        document.removeEventListener('keydown', onEsc);
        closePopup();
      }
    });

    // ── Focus trap ───────────────────────────────────────────────────────────
    var focusables = [input, ctaBtn, dismissLink, closeBtn];
    modal.addEventListener('keydown', function (e) {
      if (e.key !== 'Tab') return;
      var idx = focusables.indexOf(document.activeElement);
      if (e.shiftKey) {
        if (idx <= 0) { e.preventDefault(); focusables[focusables.length - 1].focus(); }
      } else {
        if (idx >= focusables.length - 1) { e.preventDefault(); focusables[0].focus(); }
      }
    });

    // ── Submit logic ─────────────────────────────────────────────────────────
    var submitting = false;
    function doSubmit() {
      if (submitting) return;
      var email = input.value.trim();
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        errMsg.textContent = txt(T.errEmail, lang);
        errMsg.style.display = 'block';
        input.style.borderColor = 'var(--hot,#c24a1e)';
        return;
      }
      errMsg.style.display = 'none';
      input.style.borderColor = 'var(--border-soft,#d9d3c5)';
      submitting = true;
      ctaBtn.textContent = '...';
      ctaBtn.style.opacity = '0.6';

      fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email, source: source, variant: variant, locale: lang }),
      })
        .then(function (r) { return r.json().then(function (d) { return { ok: r.ok, data: d }; }); })
        .then(function (res) {
          if (res.ok && res.data.ok) {
            // Success state
            title.textContent = txt(T.success, lang);
            sub.textContent = txt(T.successSub, lang);
            form.style.display = 'none';
            dismissLink.style.display = 'none';
            if (modal.contains(ul)) modal.removeChild(ul);
            disc.textContent = '';
            setTimeout(function () {
              overlay.style.opacity = '0';
              setTimeout(function () { if (overlay.parentNode) overlay.parentNode.removeChild(overlay); }, 200);
            }, 4000);
          } else {
            submitting = false;
            ctaBtn.textContent = txt(v.cta, lang);
            ctaBtn.style.opacity = '1';
            errMsg.textContent = (res.data && res.data.error) || txt(T.errGeneric, lang);
            errMsg.style.display = 'block';
          }
        })
        .catch(function () {
          submitting = false;
          ctaBtn.textContent = txt(v.cta, lang);
          ctaBtn.style.opacity = '1';
          errMsg.textContent = txt(T.errGeneric, lang);
          errMsg.style.display = 'block';
        });
    }

    ctaBtn.onclick = doSubmit;
    input.addEventListener('keydown', function (e) { if (e.key === 'Enter') doSubmit(); });

    // ul reference for cleanup in success
    var ul = modal.querySelector('ul');
  }
})();
