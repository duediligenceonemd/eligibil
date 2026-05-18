# Live QA + GA4 + Search Console Checklist

Data verificarii: 18 mai 2026

## Smoke test live

- `https://eligibil.org/` -> `200`
- `https://eligibil.org/search` -> `200`
- `https://eligibil.org/resurse` -> `200`
- `https://eligibil.org/en/resources` -> `200`
- `https://eligibil.org/api/resources/overview` -> `200`
- `https://eligibil.org/sitemap.xml` -> `200`
- `https://eligibil.org/llms.txt` -> `200`

## Resurse DB live

- total resurse: `637`
- cu website: `546`
- grant-like: `497`

### Breakdown pe regiuni

- `US: 201`
- `EU: 180`
- `Government: 62`
- `Capital: 54`
- `Resources: 87`
- `Free Technical: 53`

### Breakdown pe tipuri

- `grant_database: 381`
- `government_program: 62`
- `capital_resource: 54`
- `funding_resource: 50`
- `technical_resource: 53`
- `resource_directory: 37`

## GA4

Status actual:

- live `app-config.js` expune `gaMeasurementId: ""`
- asta inseamna ca infrastructura analytics exista, dar GA4 nu este activ in productie

Ce trebuie facut:

1. Creezi sau identifici un Measurement ID in Google Analytics 4
2. Il pui in Cloud Run:
   - env var: `GA_MEASUREMENT_ID=G-XXXXXXXXXX`
3. Republici serviciul
4. Verifici din nou:
   - `https://eligibil.org/app-config.js`
   - trebuie sa apara `gaMeasurementId: "G-..."`
5. Verifici:
   - `https://eligibil.org/api/health`
   - `services.analytics.ok` trebuie sa fie `true`

Evenimente deja pregatite in cod:

- `page_view`
- `language_changed`
- `newsletter_signup`
- `signup_started`
- `signup_completed`
- `feedback_submitted`
- `profile_completed`
- `eligibility_check_started`
- `funding_apply_clicked`
- `search_performed`
- `filter_used`
- `funding_viewed`
- `resource_search_performed`
- `resource_filter_used`
- `resource_opened`

## Search Console

Checklist:

1. Adaugi proprietatea `https://eligibil.org/`
2. Verifici domeniul sau URL prefix
3. Trimiti sitemap:
   - `https://eligibil.org/sitemap.xml`
4. Verifici indexarea pentru:
   - `/`
   - `/search`
   - `/resurse`
   - `/en/resources`
5. Verifici daca sunt erori de coverage sau canonical
6. Soliciti reindexare pentru `/resurse` dupa ultimul deploy

## Bing Webmaster Tools

Checklist:

1. Importi proprietatea din Search Console
2. Trimiti acelasi sitemap
3. Verifici indexarea pentru `/resurse` si `/en/resources`

## Observatii

- serviciul live foloseste acum cheia Supabase corecta pentru server-side
- problema anterioara cu `/api/resources/overview` a fost reparata
- `api/health` expune acum si starea de configurare pentru analytics si Sentry
- `xlsx` ramane cu `1 high severity vulnerability` fara fix public disponibil in acest moment
