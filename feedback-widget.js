(function () {
  'use strict';

  var STORAGE_KEY = 'eligibil_feedback_closed_v1';
  var FEEDBACK_DELAY_MS = 4000;

  var COPY = {
    ro: {
      button: 'Feedback',
      title: 'Feedback rapid',
      subtitle: 'Vrem să știm dacă ai găsit o finanțare relevantă pentru tine.',
      question1: 'Ai găsit o finanțare relevantă pentru tine?',
      yes: 'Da',
      no: 'Nu',
      unsure: 'Nu sunt sigur',
      question2: 'Ce tip de finanțare cauți?',
      grant: 'Grant',
      accelerator: 'Accelerator',
      investor: 'Investitor',
      credit: 'Credit / garanție',
      european_program: 'Program european',
      unknown: 'Nu știu încă',
      question3: 'Ce ar trebui să îmbunătățim?',
      placeholder: 'Scrie pe scurt ce lipsește sau ce te-a încurcat…',
      send: 'Trimite feedback',
      sending: 'Se trimite…',
      thanks: 'Mulțumim! Feedback-ul tău ne ajută să facem eligibil.org mai util.',
      error: 'Nu am putut trimite feedback-ul acum. Încearcă din nou mai târziu.',
      close: 'Închide',
    },
    en: {
      button: 'Feedback',
      title: 'Quick feedback',
      subtitle: 'We want to know whether you found funding that feels relevant to you.',
      question1: 'Did you find funding that feels relevant to you?',
      yes: 'Yes',
      no: 'No',
      unsure: 'Not sure',
      question2: 'What type of funding are you looking for?',
      grant: 'Grant',
      accelerator: 'Accelerator',
      investor: 'Investor',
      credit: 'Credit / guarantee',
      european_program: 'European program',
      unknown: 'I do not know yet',
      question3: 'What should we improve?',
      placeholder: 'Briefly tell us what felt missing or confusing…',
      send: 'Send feedback',
      sending: 'Sending…',
      thanks: 'Thank you! Your feedback helps us make eligibil.org more useful.',
      error: 'We could not submit feedback right now. Please try again later.',
      close: 'Close',
    },
    ru: {
      button: 'Feedback',
      title: 'Быстрый отзыв',
      subtitle: 'Нам важно понять, нашли ли вы подходящую для себя возможность финансирования.',
      question1: 'Удалось ли вам найти подходящую возможность финансирования?',
      yes: 'Да',
      no: 'Нет',
      unsure: 'Не уверен',
      question2: 'Какой тип финансирования вы ищете?',
      grant: 'Грант',
      accelerator: 'Акселератор',
      investor: 'Инвестор',
      credit: 'Кредит / гарантия',
      european_program: 'Европейская программа',
      unknown: 'Пока не знаю',
      question3: 'Что нам стоит улучшить?',
      placeholder: 'Кратко напишите, чего не хватило или что вызвало путаницу…',
      send: 'Отправить',
      sending: 'Отправляем…',
      thanks: 'Спасибо! Ваш отзыв помогает сделать eligibil.org полезнее.',
      error: 'Не удалось отправить отзыв. Попробуйте позже.',
      close: 'Закрыть',
    },
  };

  function detectLang() {
    if (window.__LANG__) return String(window.__LANG__).toLowerCase();
    if (document.documentElement.lang) return document.documentElement.lang.toLowerCase();
    if (window.location.pathname.indexOf('/en/') === 0) return 'en';
    if ((navigator.language || '').toLowerCase().indexOf('ru') === 0) return 'ru';
    return 'ro';
  }

  function copy() {
    var lang = detectLang();
    if (lang.indexOf('en') === 0) return COPY.en;
    if (lang.indexOf('ru') === 0) return COPY.ru;
    return COPY.ro;
  }

  function track(eventName, payload) {
    if (window.eligibilAnalytics && typeof window.eligibilAnalytics.track === 'function') {
      window.eligibilAnalytics.track(eventName, payload);
    }
  }

  function closedRecently() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return false;
      var ts = Number(raw);
      return Number.isFinite(ts) && (Date.now() - ts) < (7 * 24 * 60 * 60 * 1000);
    } catch (err) {
      return false;
    }
  }

  function rememberClosed() {
    try { localStorage.setItem(STORAGE_KEY, String(Date.now())); } catch (err) {}
  }

  function injectStyles() {
    if (document.getElementById('feedback-widget-styles')) return;
    var style = document.createElement('style');
    style.id = 'feedback-widget-styles';
    style.textContent = [
      '.fbw-button{position:fixed;right:20px;bottom:78px;z-index:9997;border:none;background:#1f3a5f;color:#fff;border-radius:999px;padding:12px 16px;font:600 13px/1 Inter,sans-serif;box-shadow:0 12px 28px rgba(0,0,0,.18);cursor:pointer;}',
      '.fbw-wrap{position:fixed;right:20px;bottom:130px;z-index:9997;width:min(380px,calc(100vw - 24px));background:#fff;color:#0e1620;border:1px solid rgba(14,22,32,.08);border-radius:16px;box-shadow:0 20px 60px rgba(0,0,0,.18);padding:18px;}',
      '.fbw-title{margin:0 0 6px;font:700 20px/1.1 "Space Grotesk",sans-serif;}',
      '.fbw-sub{margin:0 0 16px;color:#556070;font:400 14px/1.55 Inter,sans-serif;}',
      '.fbw-label{display:block;margin:0 0 8px;font:600 13px/1.3 Inter,sans-serif;}',
      '.fbw-row{margin-bottom:14px;}',
      '.fbw-options{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;}',
      '.fbw-option,.fbw-type{border:1px solid rgba(14,22,32,.12);background:#f7f5f0;color:#0e1620;border-radius:10px;padding:10px 12px;font:600 12px/1.2 Inter,sans-serif;cursor:pointer;}',
      '.fbw-option.is-active,.fbw-type.is-active{background:#1f3a5f;color:#fff;border-color:#1f3a5f;}',
      '.fbw-types{display:grid;grid-template-columns:repeat(2,1fr);gap:8px;}',
      '.fbw-text{width:100%;min-height:92px;border:1px solid rgba(14,22,32,.12);border-radius:12px;padding:12px;font:400 14px/1.45 Inter,sans-serif;resize:vertical;}',
      '.fbw-actions{display:flex;gap:10px;align-items:center;justify-content:space-between;}',
      '.fbw-send{border:none;background:#0e1620;color:#fff;border-radius:999px;padding:11px 16px;font:600 13px/1 Inter,sans-serif;cursor:pointer;}',
      '.fbw-close{background:none;border:none;color:#6a7381;font:600 12px/1 Inter,sans-serif;cursor:pointer;}',
      '.fbw-status{margin-top:10px;font:500 13px/1.45 Inter,sans-serif;color:#556070;}',
      '@media (max-width:640px){.fbw-button{right:12px;bottom:74px}.fbw-wrap{right:12px;bottom:126px;width:calc(100vw - 24px)}.fbw-options,.fbw-types{grid-template-columns:1fr}}'
    ].join('');
    document.head.appendChild(style);
  }

  function init() {
    injectStyles();
    var t = copy();
    var open = false;
    var sending = false;
    var state = {
      rating: 'unsure',
      funding_type_interest: 'grant',
      message: '',
    };

    var button = document.createElement('button');
    button.type = 'button';
    button.className = 'fbw-button';
    button.textContent = t.button;

    var panel = document.createElement('div');
    panel.className = 'fbw-wrap';
    panel.style.display = 'none';

    panel.innerHTML = [
      '<h3 class="fbw-title">' + t.title + '</h3>',
      '<p class="fbw-sub">' + t.subtitle + '</p>',
      '<div class="fbw-row">',
      '<label class="fbw-label">' + t.question1 + '</label>',
      '<div class="fbw-options">',
      '<button type="button" class="fbw-option" data-rating="yes">' + t.yes + '</button>',
      '<button type="button" class="fbw-option" data-rating="no">' + t.no + '</button>',
      '<button type="button" class="fbw-option is-active" data-rating="unsure">' + t.unsure + '</button>',
      '</div></div>',
      '<div class="fbw-row">',
      '<label class="fbw-label">' + t.question2 + '</label>',
      '<div class="fbw-types">',
      '<button type="button" class="fbw-type is-active" data-type="grant">' + t.grant + '</button>',
      '<button type="button" class="fbw-type" data-type="accelerator">' + t.accelerator + '</button>',
      '<button type="button" class="fbw-type" data-type="investor">' + t.investor + '</button>',
      '<button type="button" class="fbw-type" data-type="credit">' + t.credit + '</button>',
      '<button type="button" class="fbw-type" data-type="european_program">' + t.european_program + '</button>',
      '<button type="button" class="fbw-type" data-type="unknown">' + t.unknown + '</button>',
      '</div></div>',
      '<div class="fbw-row">',
      '<label class="fbw-label">' + t.question3 + '</label>',
      '<textarea class="fbw-text" maxlength="1200" placeholder="' + t.placeholder + '"></textarea>',
      '</div>',
      '<div class="fbw-actions">',
      '<button type="button" class="fbw-close">' + t.close + '</button>',
      '<button type="button" class="fbw-send">' + t.send + '</button>',
      '</div>',
      '<div class="fbw-status" aria-live="polite"></div>'
    ].join('');

    function setOpen(next) {
      open = next;
      panel.style.display = open ? 'block' : 'none';
      button.style.display = open ? 'none' : 'block';
    }

    function updateActive(selector, value, attr) {
      Array.prototype.forEach.call(panel.querySelectorAll(selector), function (node) {
        node.classList.toggle('is-active', node.getAttribute(attr) === value);
      });
    }

    panel.addEventListener('click', function (event) {
      var rating = event.target.getAttribute('data-rating');
      var type = event.target.getAttribute('data-type');
      if (rating) {
        state.rating = rating;
        updateActive('.fbw-option', rating, 'data-rating');
      }
      if (type) {
        state.funding_type_interest = type;
        updateActive('.fbw-type', type, 'data-type');
      }
    });

    panel.querySelector('.fbw-text').addEventListener('input', function (event) {
      state.message = event.target.value.slice(0, 1200);
    });

    panel.querySelector('.fbw-close').addEventListener('click', function () {
      rememberClosed();
      setOpen(false);
    });

    panel.querySelector('.fbw-send').addEventListener('click', async function () {
      if (sending) return;
      sending = true;
      var status = panel.querySelector('.fbw-status');
      var sendButton = panel.querySelector('.fbw-send');
      sendButton.textContent = t.sending;
      status.textContent = '';

      try {
        var response = await fetch('/api/feedback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'same-origin',
          body: JSON.stringify({
            rating: state.rating,
            funding_type_interest: state.funding_type_interest,
            message: state.message,
            page: window.location.pathname + window.location.search,
            language: detectLang(),
          }),
        });

        if (!response.ok) throw new Error('API ' + response.status);

        status.textContent = t.thanks;
        track('feedback_submitted', {
          rating: state.rating,
          funding_type_interest: state.funding_type_interest,
          page: window.location.pathname,
        });
        rememberClosed();
        setTimeout(function () { setOpen(false); }, 1400);
      } catch (err) {
        status.textContent = t.error;
      } finally {
        sending = false;
        sendButton.textContent = t.send;
      }
    });

    button.addEventListener('click', function () {
      setOpen(true);
    });

    document.body.appendChild(button);
    document.body.appendChild(panel);

    if (!closedRecently()) {
      setTimeout(function () { setOpen(true); }, FEEDBACK_DELAY_MS);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
