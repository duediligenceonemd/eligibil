'use strict';
(function () {
  if (localStorage.getItem('cookie_consent')) return;

  var banner = document.createElement('div');
  banner.id = 'cookie-banner';
  banner.setAttribute('style',
    'position:fixed;bottom:0;left:0;right:0;z-index:9999;' +
    'background:#1a1a1a;color:#e0e0e0;padding:14px 24px;' +
    'font-family:Inter,system-ui,sans-serif;font-size:13px;line-height:1.5;' +
    'display:flex;align-items:center;justify-content:space-between;gap:16px;' +
    'flex-wrap:wrap;box-shadow:0 -2px 12px rgba(0,0,0,.25)');

  var text = document.createElement('span');
  text.textContent = window.__cookieLang === 'en'
    ? 'This site uses a single session cookie required for authentication. No tracking cookies are used.'
    : 'Acest site folosește un singur cookie de sesiune necesar autentificării. Nu folosim cookie-uri de tracking.';

  var links = document.createElement('a');
  links.href = '/privacy';
  links.textContent = window.__cookieLang === 'en' ? 'Privacy policy' : 'Politica de confidențialitate';
  links.setAttribute('style', 'color:#7eb8ff;margin-left:8px;text-decoration:underline;white-space:nowrap');

  var btn = document.createElement('button');
  btn.textContent = window.__cookieLang === 'en' ? 'Accept' : 'Accept';
  btn.setAttribute('style',
    'background:#2563eb;color:#fff;border:none;padding:8px 20px;' +
    'font-size:13px;font-weight:600;cursor:pointer;white-space:nowrap;' +
    'font-family:inherit');
  btn.onclick = function () {
    localStorage.setItem('cookie_consent', 'accepted');
    banner.remove();
  };

  text.appendChild(links);
  banner.appendChild(text);
  banner.appendChild(btn);
  document.body.appendChild(banner);
})();
