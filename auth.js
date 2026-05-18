/**
 * auth.js — shared client-side auth helper
 * Include on every app page (dashboard, grant, events, consortium).
 * Checks session, populates window.__USER, redirects to /login.html if needed.
 */
(function () {
  'use strict';

  // Pages that don't require auth (marketing + auth pages + public catalog).
  // /search, the bilingual grant detail pages (/ro/granturi/*, /en/grants/*),
  // and the programmatic SEO listings (/ro/granturi-* and /en/grants-*) are
  // meant for SEO traffic — anonymous visitors must be able to browse.
  // Note: the listing prefixes use a dash separator (matching the route
  // pattern in server.js) which is distinct from the slash-based slug routes.
  const PUBLIC_PAGES = ['/', '/index.html', '/login.html', '/register.html',
                        '/search', '/search.html',
                        '/resurse', '/resources.html', '/en/resources',
                        '/evenimente', '/events', '/events.html',
                        '/stiri', '/news', '/blog', '/en/blog',
                        '/parteneri', '/startupuri', '/glosar', '/produse', '/about'];
  const PUBLIC_PREFIXES = ['/ro/granturi/', '/en/grants/', '/ro/granturi-', '/en/grants-',
                           '/stiri/', '/news/', '/blog/', '/en/blog/',
                           '/produs/', '/parteneri/', '/evenimente/', '/events/'];
  // Pages where the upload flow is the primary action — anonymous users get
  // bounced to /register.html (sign-up first) instead of /login.html.
  const REGISTER_FIRST_PAGES = ['/upload-artefact'];
  const REGISTER_FIRST_PREFIXES = ['/produs/'];
  const path = window.location.pathname;
  const isPublic =
    PUBLIC_PAGES.some(p => path === p || path.endsWith(p)) ||
    PUBLIC_PREFIXES.some(p => path.startsWith(p));

  if (isPublic) return;

  // Fetch current session from server
  fetch('/api/auth/me', { credentials: 'same-origin' })
    .then(r => r.json())
    .then(data => {
      if (!data.ok) {
        // Not logged in → register-first pages bounce to /register, others to /login.
        const wantsRegister =
          REGISTER_FIRST_PAGES.includes(path) ||
          REGISTER_FIRST_PREFIXES.some(p => path.startsWith(p));
        const target = wantsRegister ? '/register.html' : '/login.html';
        window.location.href = target + '?next=' + encodeURIComponent(window.location.pathname);
        return;
      }

      // Expose user globally so React components can read it
      window.__USER    = data.user;
      window.__STARTUP = data.startup;

      // Dispatch event so React components can react if already mounted
      window.dispatchEvent(new CustomEvent('auth-ready', { detail: data }));

      // Update any static user-display slots
      document.querySelectorAll('[data-user-name]').forEach(el => {
        el.textContent = data.startup?.name || data.user.firstName || data.user.email;
      });
      document.querySelectorAll('[data-user-email]').forEach(el => {
        el.textContent = data.user.email;
      });
    })
    .catch(() => {
      // Network error — let page load but without user data
    });

  // Global logout helper — call window.__logout() from any button
  window.__logout = function () {
    fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' })
      .finally(() => { window.location.href = '/login.html'; });
  };
})();
