# Today Implemented — eligibil.org

Data: 17 mai 2026

## Livrat azi în cod

### Security baseline

- sesiuni întărite
- rate limiting
- same-origin guard pentru cereri mutabile
- security headers
- validare input pe auth, profile, comments, reactions, newsletter, pipeline
- protecție server-side pentru paginile private

### Post-launch essentials

- `GET /api/health`
- `GET /llms.txt`
- Sentry bootstrap în `instrument.js`
- cookie consent banner cu preferințe persistente
- analytics client-side cu consimțământ
- documentație evenimente analytics
- feedback widget nativ
- `POST /api/feedback`
- tab nou `Feedback` în `/admin`
- endpoint-uri admin:
  - `GET /api/admin/feedback`
  - `GET /api/admin/feedback/:id`
  - `PUT /api/admin/feedback/:id`
  - `DELETE /api/admin/feedback/:id`
- `terms.html` + rute legale publice
- flow de resetare parolă:
  - `POST /api/auth/forgot-password`
  - `GET /api/auth/reset-password/verify`
  - `POST /api/auth/reset-password`
- script producer pentru alerte de deadline:
  - `npm run emails:deadline-alerts`
- hardening RLS pentru `funding_resources`:
  - `scripts/supabase-resources-rls.sql`
  - `anon/authenticated` au doar `SELECT`
- session store persistent pregătit:
  - `SESSION_STORE=supabase`
  - `scripts/supabase-sessions-schema.sql`

### Cleanup tehnic închis

- eliminat codul mort de `requireAdmin` duplicat din `routes/admin.js`
- eliminată ruta duplicată `DELETE /api/comments/:id` din `routes/api.js`

### SQL care trebuie aplicat în Supabase

1. `scripts/supabase-feedback-schema.sql`
2. `scripts/supabase-resources-schema.sql`
3. `scripts/supabase-resources-descriptions-schema.sql`

## Ce mai cere credențiale / conturi externe

- Google Analytics Measurement ID real
- Resend API key
- configurare Search Console
- configurare Bing Webmaster Tools
- configurare UptimeRobot

## Verificări recomandate după deploy

1. `/api/health`
2. `/llms.txt`
3. banner cookies pe homepage și pe `/search`
4. trimitere feedback prin widget
5. consimțământ analytics și page view după accept
