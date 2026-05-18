(function () {
  'use strict';

  var pageTracked = false;
  var configured = false;

  function consentAllowsAnalytics() {
    return !!(window.__COOKIE_CONSENT__ && window.__COOKIE_CONSENT__.analytics);
  }

  function config() {
    return window.__APP_CONFIG__ || {};
  }

  function gaId() {
    return String(config().gaMeasurementId || '').trim();
  }

  function loadGtag() {
    if (configured || !consentAllowsAnalytics() || !gaId()) return false;
    configured = true;
    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', gaId(), {
      anonymize_ip: true,
      send_page_view: false,
      transport_type: 'beacon',
    });

    var script = document.createElement('script');
    script.async = true;
    script.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(gaId());
    document.head.appendChild(script);
    return true;
  }

  function trackPageView() {
    if (pageTracked || !loadGtag()) return;
    pageTracked = true;
    window.gtag('event', 'page_view', {
      page_title: document.title,
      page_location: window.location.href,
      page_path: window.location.pathname + window.location.search,
      language: window.__LANG__ || document.documentElement.lang || 'ro',
    });
  }

  function safePayload(payload) {
    var next = Object.assign({}, payload || {});
    delete next.email;
    delete next.phone;
    delete next.name;
    delete next.password;
    delete next.document;
    return next;
  }

  function track(eventName, payload) {
    var detail = safePayload(payload);
    if (!consentAllowsAnalytics()) {
      return false;
    }
    if (!loadGtag()) return false;
    window.gtag('event', eventName, detail);
    return true;
  }

  window.eligibilAnalytics = {
    track: track,
    trackPageView: trackPageView,
  };

  window.addEventListener('cookie-consent-updated', function () {
    if (consentAllowsAnalytics()) {
      trackPageView();
    }
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', trackPageView);
  } else {
    trackPageView();
  }
})();

