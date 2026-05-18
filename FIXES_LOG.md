# Fixes Log

Updated on May 16, 2026.

Repository-level fixes completed in this pass:

- Added a real `build` script in `package.json` using `scripts/build.js`
- Added `audit:files`, `audit:i18n`, and `smoke:pages` scripts
- Added audit helpers in `scripts/audit-utils.js`
- Added GitHub Actions workflows:
  - `.github/workflows/build.yml`
  - `.github/workflows/audits.yml`
  - `.github/workflows/smoke-pages.yml`
- Fixed a broken template-string conditional in `lib/render-grant-page.js`
- Fixed a block-comment syntax issue in `scripts/cron-fetch.js`
- Added i18n tooling:
  - `scripts/i18n-audit.js`
  - `scripts/fill-missing-i18n.js`
- Restored RU and UA dictionary key parity in `lang.js`
- Added final project audit documents and `STATUS.md`

Verification outcomes:

- `npm run build` passes
- Top 5 public pages pass smoke checks
- Browser console checks for the top 5 public pages show 0 errors
