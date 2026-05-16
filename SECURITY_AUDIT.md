# Security Audit — eligibil.org

**Data:** 16 mai 2026
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
| 11 | MemoryStore pentru sesiuni (pierde sesiuni la restart) | ACCEPTAT — OK pentru MVP <100 users |
| 12 | CSP cu unsafe-inline (inline scripts în HTML static) | ACCEPTAT — necesar deoarece frontend nu are build step |
| 13 | RLS dezactivat pe Supabase | ACCEPTAT — service key doar server-side |
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
| MemoryStore | MVP cu <100 users | Migrează la connect-pg-simple când >100 users concurenți |
| CSP unsafe-inline | Frontend static fără build step | Migrează la nonces cu templating engine |
| RLS dezactivat | Service key server-only | Activează RLS dacă se adaugă client-side queries |
| CSRF tokens | JSON content-type + SameSite=lax | Adaugă csurf dacă se adaugă form-based mutations |

---

## Verificări externe recomandate

1. https://securityheaders.com — Headers HTTP (target: A+)
2. https://observatory.mozilla.org — Audit complet Mozilla
3. https://www.ssllabs.com/ssltest/ — SSL/TLS (target: A+)
