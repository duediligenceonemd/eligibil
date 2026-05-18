# Security Status — eligibil.org

**Data:** 18 mai 2026
**Status general:** mult îmbunătățit, fără expuneri publice critice confirmate în Supabase

## Rezumat

- autentificare întărită
- sesiuni și cookie-uri securizate
- rate limiting activ
- security headers activi
- input validation server-side activă
- Sentry și health checks active
- cookie consent și pagini legale de bază active
- GitHub Actions modernizate și întărite
- RLS aplicat pentru tabelele sensibile din Supabase

## Ce este închis

### Aplicație

- `SESSION_SECRET` nu mai are fallback hardcodat
- parolele folosesc `bcrypt` cu 12 runde
- paginile private sunt protejate server-side
- comparația pentru token admin este timing-safe
- request-urile sensibile au rate limiting
- `helmet` și header-ele principale sunt configurate

### Supabase

- `funding_resources`
  - `RLS ON`
  - public read only
  - fără public write
- `newsletter_subscribers`
  - `RLS ON`
  - fără acces `anon/authenticated`
- `waitlist`
  - `RLS ON`
  - fără acces `anon/authenticated`
- `email_logs`
  - `RLS ON`
  - fără acces `anon/authenticated`
- `email_queue`
  - `RLS ON`
  - fără acces `anon/authenticated`

### CI / GitHub Actions

- `actions/checkout@v5`
- `actions/setup-node@v5`
- compatibilitate Node 24 pentru action runtime
- `permissions: contents: read`
- `concurrency`
- `timeout-minutes`
- workflow de diagnostic separat

## Ce rămâne de urmărit

- `INFO` în Supabase Advisor: tabele private cu `RLS enabled, no policy`
  - acceptat intenționat; efectul este blocare completă publică
- `WARN` în Supabase Advisor:
  - extensia `vector` în `public`
  - extensia `citext` în `public`
- `npm audit`
  - pachetul `xlsx` are încă un advisory fără fix public disponibil

## Ce mai merită făcut

- review juridic pentru `privacy`, `cookies`, `terms`
- activează `SESSION_STORE=supabase` în producție după aplicarea `scripts/supabase-sessions-schema.sql`
- eventual mutarea extensiilor Supabase din schema `public` dacă vrei un profil mai strict
- verificări externe:
  - [Security Headers](https://securityheaders.com/?q=eligibil.org)
  - [Mozilla Observatory](https://observatory.mozilla.org/analyze/eligibil.org)
  - [SSL Labs](https://www.ssllabs.com/ssltest/analyze.html?d=eligibil.org)
