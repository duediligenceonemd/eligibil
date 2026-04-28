/**
 * auth.js — shared client-side auth helper
 * Include on every app page (dashboard, grant, events, consortium).
 * Checks session, populates window.__USER, redirects to /login.html if needed.
 */
(function () {
  'use strict';

  // Pages that don't require auth (marketing + auth pages themselves)
  const PUBLIC_PAGES = ['/', '/index.html', '/login.html', '/register.html'];
  const isPublic = PUBLIC_PAGES.some(p =>
    window.location.pathname === p || window.location.pathname.endsWith(p)
  );

  if (isPublic) return;

  // Fetch current session from server
  fetch('/api/auth/me', { credentials: 'same-origin' })
    .then(r => r.json())
    .then(data => {
      if (!data.ok) {
        // Not logged in → redirect to login
        window.location.href = '/login.html?next=' + encodeURIComponent(window.location.pathname);
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
