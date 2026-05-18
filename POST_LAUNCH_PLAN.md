# Plan Post-Lansare — eligibil.org

> De la site lansat la platformă de matching pentru finanțări, granturi, acceleratoare și capital pentru startupuri, IMM-uri, ONG-uri și cercetători din România, Moldova și Europa.

## Scop

Transformarea `eligibil.org` dintr-un site de oportunități într-o platformă de încredere care:

- ajută utilizatorii să găsească rapid finanțarea potrivită
- colectează semnale reale despre interes și intenție
- convertește vizitatorii în conturi și abonați
- construiește un avantaj prin matching, deadline alerts și conținut indexabil

## Poziționare

`eligibil.org` este motorul de matching pentru finanțări:

- granturi
- acceleratoare
- programe europene
- capital non-dilutiv
- angel / VC
- resurse suport pentru aplicare

## Principiul de bază după lansare

După lansare, prioritatea nu mai este design-ul, ci:

1. să nu pierzi utilizatori din cauza erorilor
2. să înțelegi ce caută oamenii
3. să măsori comportamentul real
4. să crești indexarea în Google și AI Search
5. să convertești vizitatorii în utilizatori înregistrați
6. să validezi ce tipuri de finanțări generează interes și acțiune

## Notă de implementare pentru stack-ul actual

Repo-ul curent nu este Next.js. `eligibil.org` rulează acum pe:

- `Node.js + Express`
- pagini HTML statice + componente browser-side
- `Supabase`
- deploy pe `Cloud Run`

Asta înseamnă:

- pașii de produs și growth din acest plan rămân valabili
- exemplele Next.js / Vercel trebuie mapate pe Express sau pe o migrare viitoare
- pentru observability și analytics trebuie preferate integrări compatibile cu stack-ul curent

## Azi — Primele 2 Ore

### 1. Monitorizare erori

Prioritate critică.

Fără monitorizare, nu știm dacă utilizatorii lovesc erori la:

- înregistrare
- completarea profilului
- filtrarea finanțărilor
- salvarea oportunităților
- schimbarea limbii
- formulare
- pagini dinamice de granturi și resurse

#### Recomandare pentru stack-ul actual

Pe stack-ul curent, implementarea corectă este:

- `@sentry/node` pentru server
- `@sentry/browser` pentru client

Nu `@sentry/wizard -i nextjs`, decât dacă proiectul migrează în Next.js.

#### Cerințe

- DSN din variabilă de mediu
- erori server-side și client-side
- filtrare date sensibile în `beforeSend`
- fără email, telefon, nume, parolă, documente, pitch deck-uri sau payload-uri sensibile
- ignorare erori de rețea comune
- alertare pentru erori noi

### 2. Analytics real

Trebuie urmărite separat:

- vizualizare pagină finanțare
- click pe `Verifică eligibilitatea`
- click pe `Aplică`
- salvare finanțare
- căutare
- filtre după țară / tip / sumă / sector
- înscriere newsletter
- creare cont
- schimbare limbă
- completare profil

#### Recomandare pentru stack-ul actual

Opțiuni bune:

- `Google Analytics 4`
- `Plausible`
- `PostHog`

`Vercel Analytics` și `Speed Insights` sunt utile doar dacă aplicația este mutată sau servită prin Vercel.

### 3. Google Search Console

Acțiuni:

- adăugare proprietate `eligibil.org`
- verificare DNS TXT
- submit `https://eligibil.org/sitemap.xml`
- submit `https://eligibil.org/llms.txt` dacă este expus
- verificare indexabilitate pentru paginile de granturi și resurse
- verificare canonical, hreflang, coverage și pagini expirate

### 4. Bing Webmaster Tools

Important pentru ecosistemul AI Search.

Acțiuni:

- creare proprietate
- import din Search Console
- submit sitemap
- verificare indexare pentru paginile importante

### 5. Uptime Monitoring

Monitorizare recomandată:

- `https://eligibil.org`
- `https://eligibil.org/api/health`
- `https://eligibil.org/sitemap.xml`

#### Cerință tehnică

Endpoint `/api/health` care întoarce:

- `status`
- `timestamp`
- `environment`
- verificare Supabase
- timp de răspuns

## Săptămâna 1 — Stabilizare și Înțelegerea Utilizatorilor

### 1. Feedback comportamental

Trebuie să aflăm:

- înțeleg utilizatorii ce face produsul în primele secunde?
- găsesc și folosesc căutarea?
- înțeleg filtrele?
- dau click pe finanțări?
- abandonează înainte de înregistrare?
- există confuzie între grant, accelerator, investitor, program?

Întrebarea-cheie:

`Ai găsit o finanțare relevantă pentru tine?`

### 2. GA4 cu evenimente serioase

Evenimente recomandate:

- `funding_viewed`
- `funding_saved`
- `funding_apply_clicked`
- `eligibility_check_started`
- `eligibility_check_completed`
- `signup_started`
- `signup_completed`
- `search_performed`
- `filter_used`
- `language_changed`
- `newsletter_signup`

Condiție:

- fără evenimente înainte de consimțământ cookie
- fără date personale în payload

### 3. Email transacțional

Emailuri obligatorii:

1. bun venit după înregistrare
2. confirmare newsletter / whitelist
3. resetare parolă
4. notificare finanțare salvată
5. alertă deadline apropiat
6. recomandări săptămânale

#### Recomandare

`Resend` este potrivit pentru implementare rapidă.

### 4. Widget de feedback nativ

Întrebări recomandate:

1. `Ai găsit o finanțare relevantă pentru tine?`
2. `Ce tip de finanțare cauți?`
3. `Ce ar trebui să îmbunătățim?`

Date de salvat:

- `rating`
- `funding_type_interest`
- `message`
- `page`
- `language`
- `user_agent`
- `created_at`

## Luna 1 — Creștere Organică și Validare

### 1. SEO programatic pentru finanțări

Exemple de clustere:

- granturi startup România
- granturi startup Moldova
- fonduri europene IMM
- finanțări nerambursabile 2026
- acceleratoare startup Europa
- granturi femei antreprenor
- granturi digitalizare
- granturi cercetare
- granturi agricultură
- granturi energie verde

### 2. Structură ideală pentru fiecare pagină de finanțare

1. TL;DR
2. Ce este programul
3. Cât poți primi
4. Cine poate aplica
5. Țări eligibile
6. Domenii eligibile
7. Cheltuieli eligibile
8. Deadline
9. Nivel de dificultate
10. Documente necesare
11. Pași de aplicare
12. Cum te ajută eligibil.org
13. FAQ
14. Finanțări similare

### 3. Conținut editorial săptămânal

Țintă:

- minimum 2 articole pe săptămână

Fiecare articol trebuie să împingă spre o acțiune:

- verifică finanțările
- completează profilul
- salvează oportunitatea
- abonează-te la alerte
- aplică înainte de deadline

### 4. Social media orientat pe distribuție utilă

Canale prioritare:

- `LinkedIn` pentru B2B, parteneriate și credibilitate
- `Facebook` pentru comunități IMM și antreprenori
- `X` pentru ecosistem startup și investitori

Cadru săptămânal:

- luni: finanțarea săptămânii
- marți: termen explicat simplu
- miercuri: deadline alert
- joi: greșeală frecventă
- vineri: top 3 oportunități noi

### 5. Sistem de draft-uri social

La adăugarea unei finanțări noi:

- draft LinkedIn
- draft Facebook
- draft X
- variantă RO și EN

Toate rămân `draft`, nu se publică automat.

## Email Marketing pentru eligibil.org

### Secvență onboarding

#### Email 1 — imediat

Scop:

- bun venit
- explicare rapidă a valorii
- CTA spre completare profil

#### Email 2 — ziua 3

Scop:

- explicarea matching-ului
- creșterea încrederii în recomandări

#### Email 3 — ziua 7

Scop:

- deadline-uri apropiate
- revenire în produs

## KPI-uri pentru Primele 90 de Zile

### Luna 1 — Validare

| Metric | Țintă |
|---|---:|
| Utilizatori unici | 500 |
| Conturi create | 50 |
| Emailuri colectate | 200 |
| Finanțări publicate | 100 |
| Articole publicate | 8 |
| Pagini indexate | 20 |
| Conversie vizitator → email | 3–5% |
| Conversie vizitator → cont | 1–2% |

### Luna 2 — Creștere

| Metric | Țintă |
|---|---:|
| Utilizatori unici | 1.500 |
| Conturi create | 200 |
| Finanțări publicate | 250 |
| Articole publicate total | 20 |
| Pagini indexate | 50 |
| Rată click pe finanțări | 10–15% |
| Rată salvare finanțări | 3–5% |

### Luna 3 — Scalare

| Metric | Țintă |
|---|---:|
| Utilizatori unici | 4.000 |
| Conturi create | 600 |
| Finanțări publicate | 500+ |
| Articole publicate total | 40 |
| Pagini indexate | 100+ |
| Newsletter subscribers | 1.000 |
| Conversie cont → finanțare salvată | 20% |

## Funcționalități de Adăugat în Ordine

### Luna 1

1. alerte deadline prin email
2. salvare finanțări favorite
3. profil utilizator
4. filtre avansate
5. feedback widget
6. pagini SEO pentru fiecare finanțare

### Luna 2

1. calculator de eligibilitate
2. recomandări personalizate
3. newsletter automat
4. dashboard utilizator
5. status `interesat / aplicat / respins / câștigat`
6. export PDF / CSV

### Luna 3

1. matching score pentru fiecare finanțare
2. integrare calendar pentru deadline-uri
3. API pentru parteneri
4. portal pentru consultanți
5. pagini pentru parteneri și ecosistem
6. sistem de lead generation B2B

## Scoring de Eligibilitate — Diferențiatorul Principal

`eligibil.org` nu trebuie să rămână doar o listă. Trebuie să poată spune:

`Această finanțare este potrivită pentru tine în proporție de 82%.`

### Criterii

- țară eligibilă
- tip organizație
- domeniu
- stadiu startup / TRL
- sumă solicitată
- deadline
- documente pregătite
- experiență echipă
- cofinanțare
- istoric aplicări

### Format rezultat

- scor total
- puncte forte
- riscuri
- ce trebuie pregătit înainte de aplicare

## GDPR și Încredere

Obligatoriu:

- cookie consent real
- privacy policy clar
- termeni și condiții
- ștergere cont
- dezabonare email
- minimizare date personale
- fără date personale în analytics
- fără documente în Sentry
- backup-uri regulate
- acces limitat la baza de date

## Parteneriate Strategice

### România

- incubatoare
- acceleratoare
- camere de comerț
- consultanți fonduri
- avocați startup
- universități
- hub-uri antreprenoriale

### Moldova

- organizații de suport antreprenorial
- ODA / ecosistem local
- universități
- hub-uri tech
- comunități startup

### Europa

- EIT communities
- EIC ecosystem
- acceleratoare
- rețele angel
- grant offices
- consultanți Horizon

## Reclame Plătite — Când Merită

Nu porni ads înainte să existe:

- minimum 50 conturi create organic
- conversie vizitator → email peste 3%
- minimum 100 finanțări
- tracking corect
- pagini clare
- flux de înregistrare fără erori

Ordine:

1. Google Search Ads
2. Meta Ads
3. LinkedIn Ads

## Checklist Lunar

În prima zi de luni:

- verifică erorile în Sentry
- verifică uptime-ul
- verifică paginile neindexate
- verifică cele mai accesate finanțări
- verifică filtrele folosite
- verifică termenii fără rezultate
- actualizează finanțările expirate
- publică raport lunar
- trimite newsletter
- discută cu minimum 5 utilizatori reali

## Stack Recomandat pentru Faza Următoare

| Categorie | Instrument | Prioritate |
|---|---|---|
| Hosting / deploy | Cloud Run sau Vercel după migrare | Critic |
| Erori | Sentry | Critic |
| Analytics rapid | GA4 / Plausible / PostHog | Critic |
| Performance | Speed Insights sau Lighthouse CI | Critic |
| Search | Google Search Console | Critic |
| AI/Search | Bing Webmaster Tools | Critic |
| Uptime | UptimeRobot | Critic |
| Email | Resend | Mare |
| DB/Auth | Supabase | Mare |
| Heatmaps | Hotjar sau alternativă GDPR | Medie |
| Newsletter | Resend / Brevo | Medie |
| Social scheduling | Buffer | Mai târziu |

## Prioritatea reală pentru următoarele 7 zile

1. Sentry
2. analytics real
3. uptime monitoring
4. Search Console
5. Bing Webmaster Tools
6. email transacțional
7. feedback widget
8. evenimente analytics
9. primele 10 pagini SEO de finanțări
10. prima secvență de onboarding email

## Concluzie

Succesul pentru `eligibil.org` nu va veni doar din listarea finanțărilor. Va veni dacă platforma răspunde rapid și clar la întrebările fundamentale:

- ce finanțare mi se potrivește?
- cât pot primi?
- sunt eligibil?
- ce trebuie să pregătesc?
- până când trebuie să aplic?
- care este următorul pas?

Direcția corectă rămâne:

`monitorizare + date + SEO + matching + email alerts + parteneriate`
