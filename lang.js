/**
 * lang.js — Runtime i18n for eligibil.org
 *
 * Strategy: phrase-based translation dictionary applied to DOM text nodes.
 * Works with all existing React-rendered components without code changes.
 *
 * Usage:
 *   <script src="lang.js"></script>
 *   ...
 *   window.setLanguage('EN');  // switches everywhere
 *
 * Persists in localStorage. Auto-applies on page load.
 */

(function() {
  'use strict';

  // =============================================================================
  // RO → EN translation dictionary
  // =============================================================================
  const RO_TO_EN = {
    // ── Navigation / global
    'Intră în cont': 'Sign in',
    'Cont nou': 'Sign up',
    'Înregistrează-te': 'Sign up',
    'Înscrie-te gratuit': 'Sign up free',
    'Conectează-te': 'Log in',
    'Logare': 'Login',
    'Deconectează-te': 'Log out',
    'Salvează': 'Save',
    'Anulează': 'Cancel',
    'Încarcă': 'Upload',
    'Analizează': 'Analyze',
    'Trimite': 'Submit',
    'Aplică': 'Apply',
    'Continuă': 'Continue',
    'Înapoi': 'Back',
    'Începe': 'Start',
    'Vezi mai mult': 'See more',
    'Detalii': 'Details',
    'nou': 'new',
    'Activ': 'Active',
    'Inactiv': 'Inactive',
    'Toate': 'All',
    'Niciunul': 'None',

    // ── Hero
    'AI Readiness & Funding Orchestrator': 'AI Readiness & Funding Orchestrator',
    'Analiză AI · Gratuit în faza beta · Fără cont necesar': 'AI Analysis · Free during beta · No account required',
    'Încarcă. Analizează. Află exact unde ești ': 'Upload. Analyze. Find out exactly where you are ',
    'eligibil': 'eligible',
    'eligibil.org analizează artefactele startupului tău — pitch deck, video și whitepaper — identifică automat TRL-ul, calculează scorul de potrivire pentru peste 735 de granturi și îți livrează un plan concret să devii maxim eligibil.':
      'eligibil.org analyzes your startup artifacts — pitch deck, video, and whitepaper — automatically identifies the TRL, calculates the match score across 735+ grants, and delivers a concrete plan to maximize eligibility.',
    'Obține scorul tău de eligibilitate în 90 de secunde': 'Get your eligibility score in 90 seconds',
    'min. 1 necesar': 'min. 1 required',
    'gata pentru analiză': 'ready for analysis',
    'Pitch Deck': 'Pitch Deck',
    'Video Pitch': 'Pitch Video',
    'Whitepaper': 'Whitepaper',
    'Minimum ': 'Minimum ',
    ' pentru a începe': ' to start',
    '1 artefact': '1 artifact',
    'Datele tale nu sunt partajate, nu antrenăm AI-ul pe ele': 'Your data is not shared, we don\'t train AI on it',
    'sau ': 'or ',
    'completează formular minim (30s)': 'fill out a quick form (30s)',
    'ANALIZEAZĂ-MĂ ACUM →': 'ANALYZE ME NOW →',
    'Analiză AI': 'AI Analysis',

    // ── Stats
    'Surse indexate': 'Indexed sources',
    'Surse verificate': 'Verified sources',
    'Timp până la scor': 'Time to score',
    'Agenți AI de evaluare': 'AI evaluation agents',
    'Cost în faza beta': 'Cost during beta',
    'Limbi RO·EN·RU·UA': 'Languages RO·EN·RU·UA',
    'Surse de finanțare': 'Funding sources',
    'Programe active': 'Active programs',
    'Parteneri': 'Partners',
    'Resurse': 'Resources',

    // ── Auth
    'Email': 'Email',
    'Parolă': 'Password',
    'Confirmă parola': 'Confirm password',
    'Numele complet': 'Full name',
    'Numele tău': 'Your name',
    'Numele firmei': 'Company name',
    'Telefon': 'Phone',
    'Țară': 'Country',
    'Sector': 'Sector',
    'Stadiu': 'Stage',
    'Bună!': 'Welcome!',
    'Bun venit': 'Welcome',
    'Salut': 'Hi',
    'Nu ai cont?': 'No account?',
    'Ai deja cont?': 'Already have an account?',
    'Ai uitat parola?': 'Forgot password?',
    'Resetează parola': 'Reset password',
    'Neautentificat': 'Not authenticated',
    'Autentificare reușită': 'Login successful',
    'Cont creat': 'Account created',

    // ── Dashboard
    'Tablou de bord': 'Dashboard',
    'Profilul meu': 'My profile',
    'Granturi': 'Grants',
    'Pipeline': 'Pipeline',
    'Aplicații': 'Applications',
    'Evenimente': 'Events',
    'Notificări': 'Notifications',
    'Rapoarte': 'Reports',
    'Setări': 'Settings',
    'Top match-uri': 'Top matches',
    'Granturi recomandate': 'Recommended grants',
    'Următoarele deadline-uri': 'Upcoming deadlines',
    'Status profil': 'Profile status',
    'Completitudine profil': 'Profile completeness',
    'Match': 'Match',
    'Potrivire': 'Match',
    'Recomandare AI': 'AI Recommendation',

    // ── Grants
    'Sumă': 'Amount',
    'Suma': 'Amount',
    'Suma minimă': 'Min amount',
    'Suma maximă': 'Max amount',
    'Deadline': 'Deadline',
    'Termen limită': 'Deadline',
    'Cerințe': 'Requirements',
    'Eligibilitate': 'Eligibility',
    'Descriere': 'Description',
    'Organizație': 'Organization',
    'Tip program': 'Program type',
    'Dilutiv': 'Dilutive',
    'Nedilutiv': 'Non-dilutive',
    'Dificultate': 'Difficulty',
    'Zile pentru pregătire': 'Days to prepare',
    'Status': 'Status',
    'Aplică acum': 'Apply now',
    'Vezi grant': 'View grant',
    'Detalii grant': 'Grant details',
    'Înapoi la dashboard': 'Back to dashboard',
    'Adaugă în pipeline': 'Add to pipeline',
    'Marchează ca aplicat': 'Mark as applied',

    // ── Filters
    'Filtre': 'Filters',
    'Toate țările': 'All countries',
    'Toate sectoarele': 'All sectors',
    'Toate stadiile': 'All stages',
    'Sortează după': 'Sort by',
    'Cele mai noi': 'Newest',
    'Cele mai relevante': 'Most relevant',
    'Deadline apropiat': 'Closest deadline',
    'Caută': 'Search',
    'Caută granturi': 'Search grants',

    // ── Profile
    'Date generale': 'General info',
    'Despre proiect': 'About project',
    'Echipa': 'Team',
    'Documente': 'Documents',
    'Salvează modificările': 'Save changes',
    'Modificările au fost salvate': 'Changes saved',
    'Numele proiectului': 'Project name',
    'Anul fondării': 'Year founded',
    'Numărul de angajați': 'Number of employees',
    'TRL (Technology Readiness Level)': 'TRL (Technology Readiness Level)',
    'Website': 'Website',
    'Descrierea proiectului': 'Project description',
    'Pitch în 30 secunde': '30-second pitch',

    // ── Pipeline
    'Aplicații în pregătire': 'Applications in preparation',
    'Trimise': 'Submitted',
    'Aprobate': 'Approved',
    'Respinse': 'Rejected',
    'În evaluare': 'Under review',
    'Adaugă aplicație': 'Add application',
    'Status aplicație': 'Application status',
    'Note': 'Notes',
    'Documente atașate': 'Attached documents',

    // ── Common verbs/phrases
    'verificat': 'verified',
    'verificate': 'verified',
    'oportunități': 'opportunities',
    'oportunități verificate': 'verified opportunities',
    'granturi': 'grants',
    'startup-uri': 'startups',
    'startup-uri tech': 'tech startups',
    'AI de evaluare': 'evaluation AI',
    'în 90 de secunde': 'in 90 seconds',
    'gratuit': 'free',
    'beta': 'beta',
    'În faza beta': 'In beta phase',

    // ── Footer
    'Despre noi': 'About us',
    'Contact': 'Contact',
    'Termeni': 'Terms',
    'Confidențialitate': 'Privacy',
    'Politica de cookies': 'Cookie policy',
    'Toate drepturile rezervate': 'All rights reserved',
    'Făcut cu': 'Made with',
    'în Moldova și România': 'in Moldova and Romania',

    // ── Errors / messages
    'Eroare': 'Error',
    'A apărut o eroare': 'An error occurred',
    'Câmp obligatoriu': 'Required field',
    'Email invalid': 'Invalid email',
    'Parolă prea scurtă': 'Password too short',
    'Parolele nu coincid': 'Passwords don\'t match',
    'Email-ul există deja': 'Email already exists',
    'Date incorecte': 'Incorrect data',
    'Se încarcă...': 'Loading...',
    'Se procesează...': 'Processing...',
    'Niciun rezultat': 'No results',
    'Niciun grant găsit': 'No grants found',

    // ── Page titles (mismatched HTML attribute won't match but we handle inline)
    'eligibil.org — Încarcă. Analizează. Află unde ești eligibil.':
      'eligibil.org — Upload. Analyze. Find where you are eligible.',

    // ── Section labels (homepage flow)
    '01 — Flow-ul de analiză': '01 — Analysis flow',
    '02 — Preview': '02 — Preview',
    '03 — Terminologie': '03 — Terminology',
    '04 — Două moduri de utilizare': '04 — Two ways to use',
    '05 — AI Document Generation · strat premium': '05 — AI Document Generation · premium layer',
    '01 — Categorii': '01 — Categories',
    '02 — Acoperire geografică': '02 — Geographic coverage',
    '03 — Actualizat acum': '03 — Updated now',
    '07 — Knowledge Hub': '07 — Knowledge Hub',
    '08 — Verified Partners': '08 — Verified Partners',
    '09 — Blog & insights': '09 — Blog & insights',
    '10 — Get Listed': '10 — Get Listed',
    '11 — Data Quality': '11 — Data Quality',
    '12 — Întrebări frecvente': '12 — FAQ',
    '13 — Start acum': '13 — Start now',
    '13 — Începe acum': '13 — Start now',

    // ── Section H2 subtitles
    'De la upload la plan de eligibilitate. În 4 pași.': 'From upload to eligibility plan. In 4 steps.',
    'Iată ce primești după 90 de secunde.': 'Here’s what you get after 90 seconds.',
    'Ce este TRL și de ce contează atât de mult.': 'What TRL is and why it matters so much.',
    'Agregator de 735+ surse + motor de matching AI.': 'Aggregator of 735+ sources + AI matching engine.',
    'Găsește finanțare pentru verticala ta.': 'Find financing for your vertical.',
    'Finanțare disponibilă în țara ta și dincolo de ea.': 'Financing available in your country and beyond.',
    'Programe deschise pentru aplicare.': 'Programs open for application.',
    'Peste scoring, AI-ul îți scrie direct documentele.': 'Beyond scoring, AI writes the documents for you.',
    'Reports, whitepapers și insights despre piața finanțării.': 'Reports, whitepapers and insights about the funding market.',
    'Acceleratoarele și fondurile care construiesc ecosistemul.': 'Accelerators and funds building the ecosystem.',
    'Ultimele articole și analize.': 'Latest articles and analyses.',
    'Listează-te în catalog. Ajungi la fondatorii potriviți.': 'List yourself in the catalog. Reach the right founders.',
    'Obsesia noastră: zero linkuri moarte, zero informații expirate.': 'Our obsession: zero dead links, zero stale info.',
    'Cum funcționează matching-ul AI?': 'How does AI matching work?',

    // ── Pas (step) headers
    'Pas': 'Step',
    'Încarci artefactele': 'You upload artifacts',
    'AI-ul analizează și construiește profilul': 'AI analyzes and builds the profile',
    'Primești trei scoruri per program': 'You get three scores per program',
    'Plan de îmbunătățire: cum devii maxim eligibil': 'Improvement plan: how to become maximally eligible',
    'Formate acceptate': 'Accepted formats',

    // ── Hero upload panel / register CTAs
    'artefacte': 'artifacts',
    'fișier': 'file',
    'fișierul': 'the file',
    'Opțional': 'Optional',
    'Încărcat': 'Uploaded',
    'Încarcă fișier sau trage aici': 'Upload file or drag here',
    'Schimbă fișierul': 'Change file',
    'Încearcă gratuit →': 'Try free →',
    'Listează-te gratuit →': 'List yourself free →',
    'Listează-te gratuit': 'List yourself free',
    'Răsfoiește catalogul': 'Browse catalog',
    'Revendică profil': 'Claim profile',
    'Revendică profil existent': 'Claim existing profile',
    'Ești fondator sau cercetător?': 'Are you a founder or researcher?',
    'Reprezinți un accelerator, fond sau program?': 'Do you represent an accelerator, fund or program?',
    'Analizează-mi startupul gratuit →': 'Analyze my startup for free →',
    'Activează AI Document Generation →': 'Activate AI Document Generation →',
    'Generează →': 'Generate →',
    'Pentru fondatori': 'For founders',
    'Pentru parteneri': 'For partners',
    'Toate verticalele': 'All verticals',
    'Cohorte trimestriale · aplicare continuă': 'Quarterly cohorts · rolling applications',

    // ── Trust/stats grid
    'Surse': 'Sources',
    'Țări acoperite': 'Countries covered',
    'Programe verificate': 'Verified programs',

    // ── Footer
    'Start aici': 'Start here',
    'Listează-te': 'List yourself',
    'Revendică platformă': 'Claim platform',
    'Caută surse de finanțare': 'Search funding sources',
    'Knowledge': 'Knowledge',
    'Reports & whitepapers': 'Reports & whitepapers',
    'Blog': 'Blog',
    'Glosar de finanțare': 'Funding glossary',
    'Video & webinarii': 'Video & webinars',
    'Investește în Moldova': 'Invest in Moldova',
    'Ecosistem duediligence.one': 'duediligence.one ecosystem',
    'Scrie pentru noi': 'Write for us',
    'Press & Media': 'Press & Media',
    'Chat live (09:00–18:00 EET)': 'Live chat (09:00–18:00 EET)',
    'Cu cât mai multe artefacte încarci, cu atât mai precisă analiza.':
      'The more artifacts you upload, the more accurate the analysis.',
    'Un singur document e suficient pentru a începe — sistemul îți spune explicit ce scor câștigi dacă adaugi încă unul.':
      'A single document is enough to start — the system tells you exactly what score you gain by adding another one.',
    'gata pentru analiză': 'ready for analysis',
    'Timp până la scor': 'Time to score',
    'Agenți AI de evaluare': 'AI evaluation agents',
    'Cost în faza beta': 'Cost during beta',
    'PDF / PPTX · ≤50MB · max 30 slide': 'PDF / PPTX · ≤50MB · max 30 slides',
    'PDF / DOCX · ≤30MB · max 10 pag': 'PDF / DOCX · ≤30MB · max 10 pages',
    'MP4 / MOV · ≤500MB · max 3 min': 'MP4 / MOV · ≤500MB · max 3 min',
  };

  // EN → RO (auto-built from RO_TO_EN reverse)
  const EN_TO_RO = {};
  for (const [ro, en] of Object.entries(RO_TO_EN)) {
    EN_TO_RO[en] = ro;
  }

  // =============================================================================
  // RO → RU translation dictionary
  // =============================================================================
  const RO_TO_RU = {
    // ── Navigation / global
    'Intră în cont': 'Войти',
    'Cont nou': 'Регистрация',
    'Înregistrează-te': 'Зарегистрироваться',
    'Înscrie-te gratuit': 'Зарегистрироваться бесплатно',
    'Conectează-te': 'Войти',
    'Logare': 'Вход',
    'Deconectează-te': 'Выйти',
    'Salvează': 'Сохранить',
    'Anulează': 'Отмена',
    'Încarcă': 'Загрузить',
    'Analizează': 'Анализировать',
    'Trimite': 'Отправить',
    'Aplică': 'Подать заявку',
    'Continuă': 'Продолжить',
    'Înapoi': 'Назад',
    'Începe': 'Начать',
    'Vezi mai mult': 'Посмотреть больше',
    'Detalii': 'Подробности',
    'nou': 'новый',
    'Activ': 'Активный',
    'Inactiv': 'Неактивный',
    'Toate': 'Все',
    'Niciunul': 'Нет',

    // ── Hero
    'AI Readiness & Funding Orchestrator': 'AI Readiness & Funding Orchestrator',
    'Analiză AI · Gratuit în faza beta · Fără cont necesar': 'Анализ AI · Бесплатно в бета · Без регистрации',
    'Încarcă. Analizează. Află exact unde ești ': 'Загрузи. Анализируй. Узнай точно, где ты ',
    'eligibil': 'подходишь',
    'eligibil.org analizează artefactele startupului tău — pitch deck, video și whitepaper — identifică automat TRL-ul, calculează scorul de potrivire pentru peste 735 de granturi și îți livrează un plan concret să devii maxim eligibil.':
      'eligibil.org анализирует артефакты вашего стартапа — питч-дек, видео и whitepaper — автоматически определяет TRL, рассчитывает балл соответствия по более чем 735 грантам и предоставляет конкретный план для максимального соответствия.',
    'Obține scorul tău de eligibilitate în 90 de secunde': 'Получи свой балл соответствия за 90 секунд',
    'min. 1 necesar': 'мин. 1 обязательно',
    'gata pentru analiză': 'готово к анализу',
    'Pitch Deck': 'Pitch Deck',
    'Video Pitch': 'Video Pitch',
    'Whitepaper': 'Whitepaper',
    'Minimum ': 'Минимум ',
    ' pentru a începe': ' для начала',
    '1 artefact': '1 артефакт',
    'Datele tale nu sunt partajate, nu antrenăm AI-ul pe ele': 'Ваши данные не передаются, мы не обучаем на них AI',
    'sau ': 'или ',
    'completează formular minim (30s)': 'заполните краткую форму (30 сек)',
    'ANALIZEAZĂ-MĂ ACUM →': 'АНАЛИЗИРОВАТЬ СЕЙЧАС →',
    'Analiză AI': 'Анализ AI',

    // ── Stats
    'Surse indexate': 'Индексированные источники',
    'Surse verificate': 'Проверенные источники',
    'Timp până la scor': 'Время до результата',
    'Agenți AI de evaluare': 'Агенты AI оценки',
    'Cost în faza beta': 'Стоимость в бета-фазе',
    'Limbi RO·EN·RU·UA': 'Языки RO·EN·RU·UA',
    'Surse de finanțare': 'Источники финансирования',
    'Programe active': 'Активные программы',
    'Parteneri': 'Партнёры',
    'Resurse': 'Ресурсы',

    // ── Auth
    'Email': 'Email',
    'Parolă': 'Пароль',
    'Confirmă parola': 'Подтвердите пароль',
    'Numele complet': 'Полное имя',
    'Numele tău': 'Ваше имя',
    'Numele firmei': 'Название компании',
    'Telefon': 'Телефон',
    'Țară': 'Страна',
    'Sector': 'Сектор',
    'Stadiu': 'Стадия',
    'Bună!': 'Привет!',
    'Bun venit': 'Добро пожаловать',
    'Salut': 'Привет',
    'Nu ai cont?': 'Нет аккаунта?',
    'Ai deja cont?': 'Уже есть аккаунт?',
    'Ai uitat parola?': 'Забыли пароль?',
    'Resetează parola': 'Сбросить пароль',
    'Neautentificat': 'Не авторизован',
    'Autentificare reușită': 'Вход выполнен',
    'Cont creat': 'Аккаунт создан',

    // ── Dashboard
    'Tablou de bord': 'Панель управления',
    'Profilul meu': 'Мой профиль',
    'Granturi': 'Гранты',
    'Pipeline': 'Пайплайн',
    'Aplicații': 'Заявки',
    'Evenimente': 'События',
    'Notificări': 'Уведомления',
    'Rapoarte': 'Отчёты',
    'Setări': 'Настройки',
    'Top match-uri': 'Лучшие совпадения',
    'Granturi recomandate': 'Рекомендованные гранты',
    'Următoarele deadline-uri': 'Ближайшие дедлайны',
    'Status profil': 'Статус профиля',
    'Completitudine profil': 'Заполненность профиля',
    'Match': 'Совпадение',
    'Potrivire': 'Совпадение',
    'Recomandare AI': 'Рекомендация AI',

    // ── Grants
    'Sumă': 'Сумма',
    'Suma': 'Сумма',
    'Suma minimă': 'Мин. сумма',
    'Suma maximă': 'Макс. сумма',
    'Deadline': 'Дедлайн',
    'Termen limită': 'Срок подачи',
    'Cerințe': 'Требования',
    'Eligibilitate': 'Соответствие',
    'Descriere': 'Описание',
    'Organizație': 'Организация',
    'Tip program': 'Тип программы',
    'Dilutiv': 'Долевое',
    'Nedilutiv': 'Безвозмездное',
    'Dificultate': 'Сложность',
    'Zile pentru pregătire': 'Дней на подготовку',
    'Status': 'Статус',
    'Aplică acum': 'Подать сейчас',
    'Vezi grant': 'Посмотреть грант',
    'Detalii grant': 'Детали гранта',
    'Înapoi la dashboard': 'Назад на панель',
    'Adaugă în pipeline': 'Добавить в пайплайн',
    'Marchează ca aplicat': 'Отметить как поданный',

    // ── Filters
    'Filtre': 'Фильтры',
    'Toate țările': 'Все страны',
    'Toate sectoarele': 'Все сектора',
    'Toate stadiile': 'Все стадии',
    'Sortează după': 'Сортировать по',
    'Cele mai noi': 'Новейшие',
    'Cele mai relevante': 'Наиболее релевантные',
    'Deadline apropiat': 'Ближайший дедлайн',
    'Caută': 'Поиск',
    'Caută granturi': 'Поиск грантов',

    // ── Profile
    'Date generale': 'Общие данные',
    'Despre proiect': 'О проекте',
    'Echipa': 'Команда',
    'Documente': 'Документы',
    'Salvează modificările': 'Сохранить изменения',
    'Modificările au fost salvate': 'Изменения сохранены',
    'Numele proiectului': 'Название проекта',
    'Anul fondării': 'Год основания',
    'Numărul de angajați': 'Количество сотрудников',
    'TRL (Technology Readiness Level)': 'TRL (Technology Readiness Level)',
    'Website': 'Сайт',
    'Descrierea proiectului': 'Описание проекта',
    'Pitch în 30 secunde': 'Питч за 30 секунд',

    // ── Pipeline
    'Aplicații în pregătire': 'Заявки в подготовке',
    'Trimise': 'Отправленные',
    'Aprobate': 'Одобренные',
    'Respinse': 'Отклонённые',
    'În evaluare': 'На рассмотрении',
    'Adaugă aplicație': 'Добавить заявку',
    'Status aplicație': 'Статус заявки',
    'Note': 'Заметки',
    'Documente atașate': 'Прикреплённые документы',

    // ── Common verbs/phrases
    'verificat': 'проверено',
    'verificate': 'проверенные',
    'oportunități': 'возможности',
    'oportunități verificate': 'проверенные возможности',
    'granturi': 'гранты',
    'startup-uri': 'стартапы',
    'startup-uri tech': 'технологические стартапы',
    'AI de evaluare': 'AI оценки',
    'în 90 de secunde': 'за 90 секунд',
    'gratuit': 'бесплатно',
    'beta': 'бета',
    'În faza beta': 'В бета-фазе',

    // ── Footer
    'Despre noi': 'О нас',
    'Contact': 'Контакт',
    'Termeni': 'Условия',
    'Confidențialitate': 'Конфиденциальность',
    'Politica de cookies': 'Политика cookies',
    'Toate drepturile rezervate': 'Все права защищены',
    'Făcut cu': 'Сделано с',
    'în Moldova și România': 'в Молдове и Румынии',

    // ── Errors / messages
    'Eroare': 'Ошибка',
    'A apărut o eroare': 'Произошла ошибка',
    'Câmp obligatoriu': 'Обязательное поле',
    'Email invalid': 'Недействительный email',
    'Parolă prea scurtă': 'Пароль слишком короткий',
    'Parolele nu coincid': 'Пароли не совпадают',
    'Email-ul există deja': 'Email уже существует',
    'Date incorecte': 'Неверные данные',
    'Se încarcă...': 'Загрузка...',
    'Se procesează...': 'Обработка...',
    'Niciun rezultat': 'Нет результатов',
    'Niciun grant găsit': 'Грантов не найдено',

    // ── Page titles
    'eligibil.org — Încarcă. Analizează. Află unde ești eligibil.':
      'eligibil.org — Загружай. Анализируй. Узнай, где ты подходишь.',

    // ── Section labels (homepage flow)
    '01 — Flow-ul de analiză': '01 — Процесс анализа',
    '02 — Preview': '02 — Превью',
    '03 — Terminologie': '03 — Терминология',
    '04 — Două moduri de utilizare': '04 — Два режима использования',
    '05 — AI Document Generation · strat premium': '05 — AI Document Generation · премиум-слой',
    '01 — Categorii': '01 — Категории',
    '02 — Acoperire geografică': '02 — Географическое покрытие',
    '03 — Actualizat acum': '03 — Обновлено сейчас',
    '07 — Knowledge Hub': '07 — База знаний',
    '08 — Verified Partners': '08 — Проверенные партнёры',
    '09 — Blog & insights': '09 — Блог и аналитика',
    '10 — Get Listed': '10 — Разместить программу',
    '11 — Data Quality': '11 — Качество данных',
    '12 — Întrebări frecvente': '12 — Частые вопросы',
    '13 — Start acum': '13 — Начать сейчас',
    '13 — Începe acum': '13 — Начать сейчас',

    // ── Section H2 subtitles
    'De la upload la plan de eligibilitate. În 4 pași.': 'От загрузки до плана соответствия. За 4 шага.',
    'Iată ce primești după 90 de secunde.': 'Вот что вы получите через 90 секунд.',
    'Ce este TRL și de ce contează atât de mult.': 'Что такое TRL и почему это так важно.',
    'Agregator de 735+ surse + motor de matching AI.': 'Агрегатор 735+ источников + AI-движок подбора.',
    'Găsește finanțare pentru verticala ta.': 'Найдите финансирование для вашей вертикали.',
    'Finanțare disponibilă în țara ta și dincolo de ea.': 'Финансирование в вашей стране и за её пределами.',
    'Programe deschise pentru aplicare.': 'Открытые программы для подачи заявок.',
    'Peste scoring, AI-ul îți scrie direct documentele.': 'Помимо скоринга, AI пишет документы за вас.',
    'Reports, whitepapers și insights despre piața finanțării.': 'Отчёты, whitepaper и аналитика о рынке финансирования.',
    'Acceleratoarele și fondurile care construiesc ecosistemul.': 'Акселераторы и фонды, создающие экосистему.',
    'Ultimele articole și analize.': 'Последние статьи и аналитика.',
    'Listează-te în catalog. Ajungi la fondatorii potriviți.': 'Разместите программу в каталоге. Дойдите до нужных основателей.',
    'Obsesia noastră: zero linkuri moarte, zero informații expirate.': 'Наша одержимость: ноль мёртвых ссылок, ноль устаревшей информации.',
    'Cum funcționează matching-ul AI?': 'Как работает AI-подбор?',

    // ── Pas (step) headers
    'Pas': 'Шаг',
    'Încarci artefactele': 'Вы загружаете артефакты',
    'AI-ul analizează și construiește profilul': 'AI анализирует и строит профиль',
    'Primești trei scoruri per program': 'Вы получаете три балла на программу',
    'Plan de îmbunătățire: cum devii maxim eligibil': 'План улучшения: как стать максимально подходящим',
    'Formate acceptate': 'Поддерживаемые форматы',

    // ── Hero upload panel / register CTAs
    'artefacte': 'артефакта',
    'fișier': 'файл',
    'fișierul': 'файл',
    'Opțional': 'Опционально',
    'Încărcat': 'Загружено',
    'Încarcă fișier sau trage aici': 'Загрузите файл или перетащите сюда',
    'Schimbă fișierul': 'Заменить файл',
    'Încearcă gratuit →': 'Попробовать бесплатно →',
    'Cu cât mai multe artefacte încarci, cu atât mai precisă analiza.':
      'Чем больше артефактов вы загружаете, тем точнее анализ.',
    'Un singur document e suficient pentru a începe — sistemul îți spune explicit ce scor câștigi dacă adaugi încă unul.':
      'Достаточно одного документа для старта — система точно покажет, какой балл вы получите, добавив ещё один.',
    'gata pentru analiză': 'готово к анализу',
    'Timp până la scor': 'Время до результата',
    'Agenți AI de evaluare': 'Агенты AI оценки',
    'Cost în faza beta': 'Стоимость в бета-фазе',
    'PDF / PPTX · ≤50MB · max 30 slide': 'PDF / PPTX · ≤50MB · до 30 слайдов',
    'PDF / DOCX · ≤30MB · max 10 pag': 'PDF / DOCX · ≤30MB · до 10 стр',
    'MP4 / MOV · ≤500MB · max 3 min': 'MP4 / MOV · ≤500MB · до 3 мин',
    'Listează-te gratuit →': 'Разместить бесплатно →',
    'Listează-te gratuit': 'Разместить бесплатно',
    'Răsfoiește catalogul': 'Просмотреть каталог',
    'Revendică profil': 'Заявить профиль',
    'Revendică profil existent': 'Заявить существующий профиль',
    'Ești fondator sau cercetător?': 'Вы основатель или исследователь?',
    'Reprezinți un accelerator, fond sau program?': 'Вы представляете акселератор, фонд или программу?',
    'Analizează-mi startupul gratuit →': 'Проанализировать стартап бесплатно →',
    'Activează AI Document Generation →': 'Активировать AI Document Generation →',
    'Generează →': 'Сгенерировать →',
    'Pentru fondatori': 'Для основателей',
    'Pentru parteneri': 'Для партнёров',
    'Toate verticalele': 'Все вертикали',
    'Cohorte trimestriale · aplicare continuă': 'Ежеквартальные когорты · постоянный приём заявок',
    'Surse': 'Источников',
    'Țări acoperite': 'Стран охвачено',
    'Programe verificate': 'Проверенных программ',
    'Start aici': 'Начать здесь',
    'Listează-te': 'Разместиться',
    'Revendică platformă': 'Заявить платформу',
    'Caută surse de finanțare': 'Поиск источников финансирования',
    'Knowledge': 'Знания',
    'Reports & whitepapers': 'Отчёты и whitepaper',
    'Blog': 'Блог',
    'Glosar de finanțare': 'Глоссарий финансирования',
    'Video & webinarii': 'Видео и вебинары',
    'Investește în Moldova': 'Инвестируйте в Молдову',
    'Ecosistem duediligence.one': 'Экосистема duediligence.one',
    'Scrie pentru noi': 'Пишите для нас',
    'Press & Media': 'Пресса и медиа',
    'Chat live (09:00–18:00 EET)': 'Живой чат (09:00–18:00 EET)',
  };

  // =============================================================================
  // Translation engine
  // =============================================================================
  let CURRENT_LANG = (() => {
    try { return localStorage.getItem('eligibil_lang') || 'RO'; }
    catch { return 'RO'; }
  })();

  // Track originals so we can switch back
  const originalText = new WeakMap();

  // Word-boundary replacement: only replace `phrase` when not surrounded by
  // letters/digits. Prevents "Activ" from corrupting "Activează" → "Activeează".
  // Uses Unicode property escapes (\p{L}, \p{N}) so Romanian/Cyrillic diacritics
  // are correctly recognized as letters.
  const wbRegexCache = new Map();
  function escapeRe(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
  function wordBoundaryReplace(text, phrase, replacement) {
    let re = wbRegexCache.get(phrase);
    if (!re) {
      re = new RegExp('(?<![\\p{L}\\p{N}])' + escapeRe(phrase) + '(?![\\p{L}\\p{N}])', 'gu');
      wbRegexCache.set(phrase, re);
    }
    return text.replace(re, replacement);
  }

  function translateNode(node, targetLang) {
    if (!node || node.nodeType !== Node.TEXT_NODE) return;
    const text = node.nodeValue;
    if (!text || !text.trim()) return;

    // Save original on first encounter
    if (!originalText.has(node)) {
      originalText.set(node, text);
    }
    const original = originalText.get(node);
    const trimmed = original.trim();

    if (targetLang === 'RO') {
      // Restore original
      if (node.nodeValue !== original) node.nodeValue = original;
      return;
    }

    if (targetLang === 'EN') {
      // Try exact match first
      if (RO_TO_EN[trimmed]) {
        const leading = original.match(/^\s*/)[0];
        const trailing = original.match(/\s*$/)[0];
        const target = leading + RO_TO_EN[trimmed] + trailing;
        if (node.nodeValue !== target) node.nodeValue = target;
        return;
      }
      // Word-boundary partial replacement (longest phrases first).
      let result = original;
      for (const phrase of EN_KEYS_SORTED) {
        if (result.includes(phrase)) {
          result = wordBoundaryReplace(result, phrase, RO_TO_EN[phrase]);
        }
      }
      if (result !== original && node.nodeValue !== result) node.nodeValue = result;
    }

    if (targetLang === 'RU') {
      // Try exact match first
      if (RO_TO_RU[trimmed]) {
        const leading = original.match(/^\s*/)[0];
        const trailing = original.match(/\s*$/)[0];
        const target = leading + RO_TO_RU[trimmed] + trailing;
        if (node.nodeValue !== target) node.nodeValue = target;
        return;
      }
      // Word-boundary partial replacement (longest phrases first).
      let result = original;
      for (const phrase of RU_KEYS_SORTED) {
        if (result.includes(phrase)) {
          result = wordBoundaryReplace(result, phrase, RO_TO_RU[phrase]);
        }
      }
      if (result !== original && node.nodeValue !== result) node.nodeValue = result;
    }
  }

  // Pre-compute sorted key arrays once for the substring fallback hot path.
  const EN_KEYS_SORTED = Object.keys(RO_TO_EN).sort((a, b) => b.length - a.length);
  const RU_KEYS_SORTED = Object.keys(RO_TO_RU).sort((a, b) => b.length - a.length);

  function walkAndTranslate(root, targetLang) {
    if (!root) root = document.body;
    const walker = document.createTreeWalker(
      root,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode(node) {
          // Skip script/style/noscript
          const parent = node.parentElement;
          if (!parent) return NodeFilter.FILTER_REJECT;
          const tag = parent.tagName;
          if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'NOSCRIPT') {
            return NodeFilter.FILTER_REJECT;
          }
          if (parent.closest('[data-no-translate]')) {
            return NodeFilter.FILTER_REJECT;
          }
          return node.nodeValue.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
        }
      }
    );

    const nodes = [];
    let n;
    while ((n = walker.nextNode())) nodes.push(n);
    nodes.forEach(node => translateNode(node, targetLang));

    // Also translate placeholder, title, alt attributes
    const elements = root.querySelectorAll('[placeholder], [title], [alt]');
    elements.forEach(el => {
      ['placeholder', 'title', 'alt'].forEach(attr => {
        const val = el.getAttribute(attr);
        if (!val || !val.trim()) return;
        const key = `_${attr}_${val}`;
        if (!originalText.has(el)) originalText.set(el, {});
        const cache = originalText.get(el);
        if (typeof cache !== 'object') return;
        if (!cache[attr]) cache[attr] = val;
        const original = cache[attr];
        if (targetLang === 'RO') {
          if (val !== original) el.setAttribute(attr, original);
        } else if (targetLang === 'EN' && RO_TO_EN[original.trim()]) {
          el.setAttribute(attr, RO_TO_EN[original.trim()]);
        } else if (targetLang === 'RU' && RO_TO_RU[original.trim()]) {
          el.setAttribute(attr, RO_TO_RU[original.trim()]);
        }
      });
    });
  }

  // =============================================================================
  // MutationObserver — re-translate when React re-renders
  // =============================================================================
  let observer = null;
  function startObserver() {
    if (observer) return;
    // Re-translate the whole body on ANY DOM change (addedNodes OR characterData).
    // This ensures React in-place text-node updates don't silently restore Romanian.
    // The guard in translateNode (node.nodeValue !== target) breaks the feedback loop.
    observer = new MutationObserver(() => {
      if (CURRENT_LANG === 'RO') return;
      clearTimeout(window.__i18nDebounce);
      window.__i18nDebounce = setTimeout(() => {
        walkAndTranslate(document.body, CURRENT_LANG);
      }, 50);
    });
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
    });
  }

  // =============================================================================
  // Public API
  // =============================================================================
  window.setLanguage = function(lang) {
    lang = (lang || 'RO').toUpperCase();
    if (!['RO', 'EN', 'RU'].includes(lang)) {
      // UA falls back to RO until that dictionary exists
      console.warn('[i18n] Language not yet supported:', lang, '— falling back to RO');
      lang = 'RO';
    }
    CURRENT_LANG = lang;
    try { localStorage.setItem('eligibil_lang', lang); } catch {}
    document.documentElement.lang = lang.toLowerCase();
    walkAndTranslate(document.body, lang);
    // Second pass after React's async batch re-render settles
    setTimeout(() => walkAndTranslate(document.body, lang), 120);
    window.dispatchEvent(new CustomEvent('languagechange', { detail: { lang } }));
  };

  window.getLanguage = function() { return CURRENT_LANG; };
  window.t = function(text) {
    if (CURRENT_LANG === 'EN' && RO_TO_EN[text]) return RO_TO_EN[text];
    if (CURRENT_LANG === 'RU' && RO_TO_RU[text]) return RO_TO_RU[text];
    return text;
  };

  // =============================================================================
  // Boot
  // =============================================================================
  function injectFloatingSwitcher() {
    if (document.getElementById('i18n-floating-switcher')) return;
    const wrap = document.createElement('div');
    wrap.id = 'i18n-floating-switcher';
    wrap.setAttribute('data-no-translate', '');
    wrap.style.cssText = `
      position: fixed; bottom: 16px; right: 16px;
      background: rgba(0,0,0,0.85); color: white;
      border-radius: 24px; padding: 4px;
      display: flex; gap: 2px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
      z-index: 9999;
      font-family: -apple-system, BlinkMacSystemFont, sans-serif;
      font-size: 13px; font-weight: 600;
      backdrop-filter: blur(8px);
    `;
    ['RO', 'EN', 'RU'].forEach(code => {
      const btn = document.createElement('button');
      btn.textContent = code;
      btn.dataset.lang = code;
      btn.style.cssText = `
        background: transparent; color: inherit;
        border: none; padding: 6px 14px; cursor: pointer;
        border-radius: 20px; transition: 0.2s;
      `;
      const setActive = () => {
        wrap.querySelectorAll('button').forEach(b => {
          b.style.background = b.dataset.lang === CURRENT_LANG ? 'white' : 'transparent';
          b.style.color = b.dataset.lang === CURRENT_LANG ? 'black' : 'white';
        });
      };
      setActive();
      btn.onclick = () => {
        window.setLanguage(code);
        setActive();
      };
      window.addEventListener('languagechange', setActive);
      wrap.appendChild(btn);
    });
    document.body.appendChild(wrap);
  }

  function init() {
    startObserver();
    if (CURRENT_LANG !== 'RO') {
      walkAndTranslate(document.body, CURRENT_LANG);
    }
    // Hook all RO/EN buttons by class
    document.querySelectorAll('.langmini button, [data-lang]').forEach(btn => {
      const code = btn.dataset.lang || btn.textContent.trim();
      btn.addEventListener('click', () => window.setLanguage(code));
    });
    injectFloatingSwitcher();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  console.log('[i18n] eligibil.org language engine loaded · RO/EN/RU · current:', CURRENT_LANG);
})();
