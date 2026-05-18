# Security Audit — eligibil.org

**Data:** 18 mai 2026
**Auditor:** Claude Code (automated)
**Stack:** Node.js + Express 4.22 + Supabase PostgreSQL + React CDN

---

## Rezultate

### CRITIC

| # | Finding | Status |
|---|---------|--------|
| 1 | SESSION_SECRET hardcoded ca fallback (`'eligibil-dev-secret-2026'`) | REMEDIAT — fallback eliminat, env var obligatoriu |
| 2 | Zero rate limiting pe login/register | REMEDIAT — express-rate-limit: 5 req/15min auth, 100 req/15min API |
| 3 | Zero security headers (CSP, HSTS, X-Frame-Options) | REMEDIAT — helmet.js configurat cu CSP allowlist |

### MAJOR

| # | Finding | Status |
|---|---------|--------|
| 4 | Admin token comparație vulnerabilă la timing attack (`===`) | REMEDIAT — crypto.timingSafeEqual |
| 5 | Zero validare input server-side (doar `if (!email)`) | REMEDIAT — Zod schemas pe toate POST endpoints |
| 6 | Cookie SameSite lipsă | REMEDIAT — SameSite=lax adăugat |
| 7 | Cookie secure flag lipsă | REMEDIAT — secure=true în producție |
| 8 | bcrypt 10 runde (sub recomandare) | REMEDIAT — crescut la 12 runde |
| 9 | Env vars nevalidate la startup | REMEDIAT — lib/validate-env.js crash dacă lipsesc |

### MEDIU

| # | Finding | Status |
|---|---------|--------|
| 10 | Zero GDPR compliance (privacy policy, cookie consent, data deletion) | REMEDIAT — privacy.html, cookie-consent.js, DELETE /api/profile |
| 11 | MemoryStore pentru sesiuni (pierde sesiuni la restart) | PREGĂTIT — Supabase session store disponibil cu `SESSION_STORE=supabase` |
| 12 | CSP cu unsafe-inline (inline scripts în HTML static) | ACCEPTAT — necesar deoarece frontend nu are build step |
| 13 | RLS dezactivat pe Supabase | REMEDIAT — RLS activ pe funding_resources, newsletter_subscribers, waitlist, email_logs, email_queue |
| 14 | Zero CI/CD security scanning | REMEDIAT — GitHub Actions npm audit + Dependabot |
| 15 | Zero teste automate | NEABORDAT — separat de security hardening |

### OK (implementat corect de la început)

| # | Finding |
|---|---------|
| 16 | Parole hashate cu bcrypt (nu plain text) |
| 17 | .env în .gitignore, .env.example cu placeholders |
| 18 | httpOnly cookies activat |
| 19 | Queries parametrizate (Supabase PostgREST, nu string concat) |
| 20 | Service role key doar server-side (nu expus în browser) |
| 21 | Nu există dangerouslySetInnerHTML |
| 22 | HTTPS activ (Cloud Run TLS termination) |
| 23 | trust proxy configurat pentru Cloud Run |

---

## Pregătire plăți (Stripe)

Când se va integra procesarea de plăți:

1. **Stripe Elements / Checkout** — datele de card nu trebuie să atingă serverul
2. **PCI-DSS** — cu Stripe Elements, sunteți PCI SAQ-A (cel mai simplu nivel)
3. **Webhook signature** — verificați `stripe-signature` header cu `stripe.webhooks.constructEvent()`
4. **Env vars necesare:** `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`
5. **Nu stocați** numere de card, CVV sau date de expirare pe server

---

## Riscuri acceptate

| Risc | Justificare | Condiție de revizuire |
|------|-------------|----------------------|
| MemoryStore implicit | Dezvoltare locală simplă | Activează `SESSION_STORE=supabase` în producție după schema `app_sessions` |
| CSP unsafe-inline | Frontend static fără build step | Migrează la nonces cu templating engine |
| RLS fără policy pe tabele private | Intenționat: blocare completă pentru anon/authenticated | Revizuiește doar dacă apar use-case-uri client-side legitime |
| CSRF tokens | JSON content-type + SameSite=lax | Adaugă csurf dacă se adaugă form-based mutations |

---

## Verificări externe recomandate

1. https://securityheaders.com — Headers HTTP (target: A+)
2. https://observatory.mozilla.org — Audit complet Mozilla
3. https://www.ssllabs.com/ssltest/ — SSL/TLS (target: A+)

---

## Update 18 mai 2026

După auditul inițial, au fost aplicate remedieri suplimentare direct în Supabase:

- `public.funding_resources`
  - `RLS = ON`
  - policy publică doar pentru `SELECT`
  - `anon/authenticated` au doar `SELECT`
- `public.newsletter_subscribers`
  - `RLS = ON`
  - fără grants pentru `anon/authenticated`
- `public.waitlist`
  - `RLS = ON`
  - fără grants pentru `anon/authenticated`
- `public.email_logs`
  - `RLS = ON`
  - fără grants pentru `anon/authenticated`
- `public.email_queue`
  - `RLS = ON`
  - fără grants pentru `anon/authenticated`

Observații rămase din Supabase Advisor:

- `INFO`: `RLS enabled, no policy` pe tabelele private de mai sus
  - acesta este comportamentul intenționat, pentru că ele nu trebuie expuse public prin PostgREST
- `WARN`: extensiile `vector` și `citext` sunt instalate în schema `public`
  - recomandare structurală, nu risc critic imediat
