'use strict';

// ── i18n texts ─────────────────────────────────────────────────────────────────
var T = {
  waitlistConfirm: {
    subject: { ro: 'Ești pe lista eligibil.org 🎯', en: 'You\'re on the eligibil.org waitlist 🎯', ru: 'Вы в списке ожидания eligibil.org 🎯', ua: 'Ви у списку очікування eligibil.org 🎯' },
    title:   { ro: 'Ai prins loc!', en: 'You\'re in!', ru: 'Вы в списке!', ua: 'Ви в списку!' },
    body:    { ro: 'Ești printre primii care vor afla când lansăm complet eligibil.org. Îți trimitem un email imediat ce platforma e gata.', en: 'You\'re among the first to know when we fully launch eligibil.org. We\'ll email you as soon as the platform is ready.', ru: 'Вы среди первых, кто узнает о полном запуске eligibil.org. Мы отправим письмо, когда платформа будет готова.', ua: 'Ви серед перших, хто дізнається про повний запуск eligibil.org. Ми надішлемо лист, коли платформа буде готова.' },
    ps:      { ro: 'Ai primit acest email pentru că ai completat formularul pe eligibil.org.', en: 'You received this email because you signed up on eligibil.org.', ru: 'Вы получили это письмо, потому что зарегистрировались на eligibil.org.', ua: 'Ви отримали цей лист, бо зареєструвалися на eligibil.org.' },
  },
  welcome: {
    subject: { ro: 'Bun venit la eligibil.org — să găsim finanțarea potrivită 🚀', en: 'Welcome to eligibil.org — let\'s find your funding 🚀', ru: 'Добро пожаловать в eligibil.org 🚀', ua: 'Ласкаво просимо до eligibil.org 🚀' },
    title:   { ro: 'Bun venit!', en: 'Welcome!', ru: 'Добро пожаловать!', ua: 'Ласкаво просимо!' },
    steps: {
      ro: ['Completează-ți profilul organizației', 'Explorează finanțările disponibile', 'Salvează la favorite și primești alerte deadline'],
      en: ['Complete your organization profile', 'Explore available funding', 'Save favorites and get deadline alerts'],
      ru: ['Заполните профиль организации', 'Изучите доступное финансирование', 'Сохраняйте избранное и получайте уведомления'],
      ua: ['Заповніть профіль організації', 'Досліджуйте доступне фінансування', 'Зберігайте обране та отримуйте сповіщення'],
    },
    cta:     { ro: 'Explorează finanțările', en: 'Explore funding', ru: 'Изучить финансирование', ua: 'Дослідити фінансування' },
  },
  onboardingDay3: {
    subject: { ro: 'Ai văzut aceste 3 finanțări pentru tine?', en: 'Have you seen these 3 funding opportunities?', ru: 'Вы видели эти 3 возможности финансирования?', ua: 'Ви бачили ці 3 можливості фінансування?' },
    title:   { ro: 'Selectate special pentru tine', en: 'Selected just for you', ru: 'Специально для вас', ua: 'Спеціально для вас' },
    cta:     { ro: 'Vezi toate finanțările', en: 'See all funding', ru: 'Все возможности', ua: 'Усі можливості' },
  },
  onboardingDay7: {
    subject: { ro: 'Sfat: cum să nu ratezi niciun deadline important', en: 'Tip: never miss an important funding deadline', ru: 'Совет: как не пропустить дедлайн', ua: 'Порада: як не пропустити дедлайн' },
    title:   { ro: 'Finanțările nu te așteaptă', en: 'Funding won\'t wait', ru: 'Финансирование не ждёт', ua: 'Фінансування не чекає' },
    body:    { ro: 'Salvează granturile care te interesează la favorite — primești automat alerte cu 14, 7 și 3 zile înainte de deadline.', en: 'Save grants you\'re interested in to favorites — you\'ll get automatic alerts 14, 7, and 3 days before the deadline.', ru: 'Сохраняйте интересные гранты в избранное — вы получите автоматические уведомления за 14, 7 и 3 дня до дедлайна.', ua: 'Зберігайте цікаві гранти в обране — ви отримаєте автоматичні сповіщення за 14, 7 та 3 дні до дедлайну.' },
    cta:     { ro: 'Activează alertele', en: 'Enable alerts', ru: 'Включить уведомления', ua: 'Увімкнути сповіщення' },
  },
  deadlineAlert: {
    subject: { ro: '⏰ {grant} — mai ai {days} zile să aplici', en: '⏰ {grant} — {days} days left to apply', ru: '⏰ {grant} — осталось {days} дней', ua: '⏰ {grant} — залишилось {days} днів' },
    banner:  { ro: 'DEADLINE ÎN {days} ZILE', en: 'DEADLINE IN {days} DAYS', ru: 'ДЕДЛАЙН ЧЕРЕЗ {days} ДНЕЙ', ua: 'ДЕДЛАЙН ЧЕРЕЗ {days} ДНІВ' },
    cta:     { ro: 'Aplică acum', en: 'Apply now', ru: 'Подать заявку', ua: 'Подати заявку' },
  },
  newsletterWeekly: {
    subject:  { ro: '📋 Finanțările săptămânii — {date}', en: '📋 This week\'s funding — {date}', ru: '📋 Финансирование недели — {date}', ua: '📋 Фінансування тижня — {date}' },
    expiring: { ro: '🔥 Expiră curând', en: '🔥 Expiring soon', ru: '🔥 Скоро истекает', ua: '🔥 Скоро спливає' },
    newGrants:{ ro: '✨ Adăugate această săptămână', en: '✨ Added this week', ru: '✨ Добавлено на этой неделе', ua: '✨ Додано цього тижня' },
  },
  launch: {
    subject: { ro: '🚀 eligibil.org s-a lansat — tu ești primul care știe', en: '🚀 eligibil.org is live — you\'re first to know', ru: '🚀 eligibil.org запущен — вы первый!', ua: '🚀 eligibil.org запущено — ви перший!' },
    title:   { ro: 'Am lansat!', en: 'We\'re live!', ru: 'Мы запустились!', ua: 'Ми запустились!' },
    body:    { ro: 'Ai așteptat — și noi apreciem. eligibil.org e acum live, cu acces complet la toate cele 735+ surse de finanțare.', en: 'You waited — and we appreciate it. eligibil.org is now live, with full access to all 735+ funding sources.', ru: 'Вы ждали — мы ценим это. eligibil.org теперь работает с полным доступом к 735+ источникам.', ua: 'Ви чекали — ми цінуємо це. eligibil.org тепер працює з повним доступом до 735+ джерел.' },
    cta:     { ro: 'Intră primul — acces prioritar', en: 'Get in first — priority access', ru: 'Войти первым', ua: 'Увійти першим' },
  },
  newsletterConfirm: {
    subject: { ro: 'Confirmă abonarea la newsletter eligibil.org', en: 'Confirm your eligibil.org newsletter subscription', ru: 'Подтвердите подписку eligibil.org', ua: 'Підтвердіть підписку eligibil.org' },
    title:   { ro: 'Confirmă emailul', en: 'Confirm your email', ru: 'Подтвердите email', ua: 'Підтвердіть email' },
    body:    { ro: 'Apasă butonul de mai jos pentru a confirma abonarea la newsletter-ul eligibil.org.', en: 'Click the button below to confirm your eligibil.org newsletter subscription.', ru: 'Нажмите кнопку ниже, чтобы подтвердить подписку.', ua: 'Натисніть кнопку нижче, щоб підтвердити підписку.' },
    cta:     { ro: 'Confirmă abonarea', en: 'Confirm subscription', ru: 'Подтвердить подписку', ua: 'Підтвердити підписку' },
  },
  footer: {
    unsub:   { ro: 'Dezabonare', en: 'Unsubscribe', ru: 'Отписаться', ua: 'Відписатися' },
    privacy: { ro: 'Politica de confidențialitate', en: 'Privacy Policy', ru: 'Политика конфиденциальности', ua: 'Політика конфіденційності' },
  },
};

function txt(obj, lang) { return obj[lang] || obj.ro; }

// ── Layout wrapper ─────────────────────────────────────────────────────────────
function layout(lang, unsubscribeUrl, content) {
  var base = process.env.BASE_URL || 'https://eligibil.org';
  return '<!DOCTYPE html><html lang="' + lang + '"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>eligibil.org</title></head><body style="margin:0;padding:0;background:#0e0e14;font-family:Arial,Helvetica,sans-serif;">' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0e0e14;"><tr><td align="center" style="padding:32px 16px;">' +
    '<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#1a1a24;border-radius:8px;overflow:hidden;">' +
    // Header
    '<tr><td style="padding:28px 32px 20px;border-bottom:1px solid #2a2a36;"><a href="' + base + '" style="text-decoration:none;font-family:Georgia,serif;font-size:22px;color:#e8c84a;font-weight:bold;">eligibil<span style="color:#f0f0f0;">.org</span></a></td></tr>' +
    // Body
    '<tr><td style="padding:32px;">' + content + '</td></tr>' +
    // Footer
    '<tr><td style="padding:20px 32px;border-top:1px solid #2a2a36;text-align:center;">' +
    '<p style="margin:0 0 8px;font-size:12px;color:#888;">&copy; ' + new Date().getFullYear() + ' eligibil.org</p>' +
    (unsubscribeUrl ? '<p style="margin:0;font-size:12px;"><a href="' + unsubscribeUrl + '" style="color:#888;text-decoration:underline;">' + txt(T.footer.unsub, lang) + '</a> &middot; <a href="' + base + '/privacy" style="color:#888;text-decoration:underline;">' + txt(T.footer.privacy, lang) + '</a></p>' : '<p style="margin:0;font-size:12px;"><a href="' + base + '/privacy" style="color:#888;text-decoration:underline;">' + txt(T.footer.privacy, lang) + '</a></p>') +
    '</td></tr>' +
    '</table></td></tr></table></body></html>';
}

function heading(text) {
  return '<h1 style="margin:0 0 16px;font-family:Georgia,serif;font-size:28px;color:#f0f0f0;font-weight:bold;">' + text + '</h1>';
}

function paragraph(text) {
  return '<p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#d0d0d0;">' + text + '</p>';
}

function button(url, text) {
  return '<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0;"><tr><td style="background:#e8c84a;border-radius:6px;"><a href="' + url + '" style="display:inline-block;padding:14px 32px;color:#0e0e14;font-size:15px;font-weight:bold;text-decoration:none;">' + text + '</a></td></tr></table>';
}

function smallText(text) {
  return '<p style="margin:16px 0 0;font-size:12px;color:#888;font-style:italic;">' + text + '</p>';
}

// ── Templates ──────────────────────────────────────────────────────────────────

function waitlistConfirm(opts) {
  var lang = opts.language || 'ro';
  var t = T.waitlistConfirm;
  var base = process.env.BASE_URL || 'https://eligibil.org';
  var content = heading(txt(t.title, lang)) + paragraph(txt(t.body, lang)) + smallText(txt(t.ps, lang));
  return layout(lang, opts.unsubscribeUrl, content);
}

function welcome(opts) {
  var lang = opts.language || 'ro';
  var t = T.welcome;
  var base = process.env.BASE_URL || 'https://eligibil.org';
  var name = opts.name || '';
  var title = name ? txt(t.title, lang).replace('!', ', ' + name + '!') : txt(t.title, lang);
  var stepsHtml = '<table role="presentation" cellpadding="0" cellspacing="0" style="margin:16px 0 24px;">';
  var steps = txt(t.steps, lang);
  for (var i = 0; i < steps.length; i++) {
    stepsHtml += '<tr><td style="padding:8px 12px 8px 0;vertical-align:top;"><span style="display:inline-block;width:28px;height:28px;background:#e8c84a;color:#0e0e14;border-radius:50%;text-align:center;line-height:28px;font-weight:bold;font-size:14px;">' + (i + 1) + '</span></td><td style="padding:8px 0;font-size:15px;color:#d0d0d0;line-height:1.5;">' + steps[i] + '</td></tr>';
  }
  stepsHtml += '</table>';
  var content = heading(title) + stepsHtml + button(base + '/search', txt(t.cta, lang));
  return layout(lang, opts.unsubscribeUrl, content);
}

function onboardingDay3(opts) {
  var lang = opts.language || 'ro';
  var t = T.onboardingDay3;
  var base = process.env.BASE_URL || 'https://eligibil.org';
  var grants = opts.grants || [];
  var cardsHtml = '';
  for (var i = 0; i < grants.length && i < 3; i++) {
    var g = grants[i];
    cardsHtml += '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 12px;background:#252530;border-radius:6px;"><tr><td style="padding:16px;">' +
      '<p style="margin:0 0 4px;font-size:16px;color:#e8c84a;font-weight:bold;">' + (g.title || g.name || '') + '</p>' +
      (g.amount ? '<p style="margin:0 0 4px;font-size:13px;color:#aaa;">' + g.amount + '</p>' : '') +
      (g.deadline ? '<p style="margin:0;font-size:13px;color:#aaa;">Deadline: ' + g.deadline + '</p>' : '') +
      '</td></tr></table>';
  }
  var content = heading(txt(t.title, lang)) + cardsHtml + button(base + '/search', txt(t.cta, lang));
  return layout(lang, opts.unsubscribeUrl, content);
}

function onboardingDay7(opts) {
  var lang = opts.language || 'ro';
  var t = T.onboardingDay7;
  var base = process.env.BASE_URL || 'https://eligibil.org';
  var content = heading(txt(t.title, lang)) + paragraph(txt(t.body, lang)) + button(base + '/search', txt(t.cta, lang));
  return layout(lang, opts.unsubscribeUrl, content);
}

function deadlineAlert(opts) {
  var lang = opts.language || 'ro';
  var t = T.deadlineAlert;
  var base = process.env.BASE_URL || 'https://eligibil.org';
  var grant = opts.grant || {};
  var days = opts.days || '?';
  var bannerText = txt(t.banner, lang).replace('{days}', days);
  var content =
    '<div style="background:#c24a1e;color:#fff;padding:12px 16px;border-radius:6px;text-align:center;font-size:14px;font-weight:bold;letter-spacing:0.05em;margin:0 0 24px;">' + bannerText + '</div>' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#252530;border-radius:6px;margin:0 0 16px;"><tr><td style="padding:20px;">' +
    '<p style="margin:0 0 8px;font-size:18px;color:#e8c84a;font-weight:bold;">' + (grant.title || grant.name || '') + '</p>' +
    (grant.description ? '<p style="margin:0 0 8px;font-size:14px;color:#d0d0d0;">' + grant.description.slice(0, 200) + '</p>' : '') +
    (grant.amount ? '<p style="margin:0 0 4px;font-size:13px;color:#aaa;">💰 ' + grant.amount + '</p>' : '') +
    (grant.deadline ? '<p style="margin:0;font-size:13px;color:#aaa;">📅 Deadline: ' + grant.deadline + '</p>' : '') +
    '</td></tr></table>' +
    button(grant.url || (base + '/search'), txt(t.cta, lang));
  return layout(lang, opts.unsubscribeUrl, content);
}

function newsletterWeekly(opts) {
  var lang = opts.language || 'ro';
  var t = T.newsletterWeekly;
  var base = process.env.BASE_URL || 'https://eligibil.org';
  var expiring = opts.expiring || [];
  var newGrants = opts.newGrants || [];
  var tip = opts.tip || '';

  var content = heading(txt(t.subject, lang).replace('{date}', opts.date || ''));

  if (expiring.length) {
    content += '<h2 style="margin:24px 0 12px;font-size:18px;color:#e8c84a;font-family:Georgia,serif;">' + txt(t.expiring, lang) + '</h2>';
    for (var i = 0; i < expiring.length && i < 3; i++) {
      var g = expiring[i];
      content += '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 8px;background:#252530;border-radius:4px;"><tr><td style="padding:12px 16px;">' +
        '<p style="margin:0;font-size:14px;"><a href="' + (g.url || base + '/search') + '" style="color:#e8c84a;text-decoration:none;font-weight:bold;">' + (g.title || g.name || '') + '</a>' +
        (g.deadline ? ' <span style="color:#c24a1e;font-size:12px;">— ' + g.deadline + '</span>' : '') + '</p>' +
        '</td></tr></table>';
    }
  }

  if (newGrants.length) {
    content += '<h2 style="margin:24px 0 12px;font-size:18px;color:#e8c84a;font-family:Georgia,serif;">' + txt(t.newGrants, lang) + '</h2>';
    for (var j = 0; j < newGrants.length && j < 5; j++) {
      var n = newGrants[j];
      content += '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 8px;background:#252530;border-radius:4px;"><tr><td style="padding:12px 16px;">' +
        '<p style="margin:0;font-size:14px;"><a href="' + (n.url || base + '/search') + '" style="color:#e8c84a;text-decoration:none;font-weight:bold;">' + (n.title || n.name || '') + '</a>' +
        (n.amount ? ' <span style="color:#aaa;font-size:12px;">— ' + n.amount + '</span>' : '') + '</p>' +
        '</td></tr></table>';
    }
  }

  if (tip) {
    content += '<div style="margin:24px 0 0;padding:16px;background:#252530;border-left:3px solid #e8c84a;border-radius:0 4px 4px 0;">' +
      '<p style="margin:0;font-size:14px;color:#d0d0d0;line-height:1.6;">💡 ' + tip + '</p></div>';
  }

  content += button(base + '/search', lang === 'ro' ? 'Vezi toate finanțările' : 'See all funding');
  return layout(lang, opts.unsubscribeUrl, content);
}

function launchAnnouncement(opts) {
  var lang = opts.language || 'ro';
  var t = T.launch;
  var base = process.env.BASE_URL || 'https://eligibil.org';
  var content = heading(txt(t.title, lang)) + paragraph(txt(t.body, lang)) + button(base + '/search', txt(t.cta, lang));
  return layout(lang, opts.unsubscribeUrl, content);
}

function newsletterConfirm(opts) {
  var lang = opts.language || 'ro';
  var t = T.newsletterConfirm;
  var content = heading(txt(t.title, lang)) + paragraph(txt(t.body, lang)) + button(opts.confirmUrl || '#', txt(t.cta, lang));
  return layout(lang, null, content);
}

module.exports = {
  T,
  waitlistConfirm,
  welcome,
  onboardingDay3,
  onboardingDay7,
  deadlineAlert,
  newsletterWeekly,
  launchAnnouncement,
  newsletterConfirm,
};
