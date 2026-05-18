# Translation Audit

Checked on May 16, 2026.

Source of truth:

- `lang.js`

Key counts:

| Language bucket | Keys |
|---|---:|
| RO source keys | 2010 |
| EN translations | 2010 |
| RU translations | 2010 |
| UA translations | 2010 |

Result:

- RO / EN / RU parity: PASS
- RO / EN / UA parity: PASS

Notes:

- Missing RU and UA keys were backfilled on May 16, 2026 to restore runtime parity.
- The fallback values for newly added RU and UA entries currently mirror EN text where native localized copy was unavailable in the repo.
