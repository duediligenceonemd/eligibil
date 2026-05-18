# Analytics Events — eligibil.org

Evenimente recomandate și pregătite pentru integrare în client:

## Core

- `page_view`
- `language_changed`
- `newsletter_signup`
- `signup_started`
- `signup_completed`
- `feedback_submitted`
- `profile_completed`
- `eligibility_check_started`
- `funding_apply_clicked`

## Funding Catalog

- `search_performed`
- `filter_used`
- `funding_viewed`
- `funding_apply_clicked`
- `funding_saved`

## Resources

- `resource_opened`
- `resource_filter_used`
- `resource_search_performed`

## Profile / Matching

- `profile_completed`
- `eligibility_check_started`
- `eligibility_check_completed`

## Reguli

- nu trimite email, telefon, nume, parolă sau conținut de documente
- evenimentele se trimit doar după consimțământ analytics
- payload-urile trebuie să conțină doar date agregate sau descriptive

## Payload-uri recomandate

### `search_performed`

```json
{
  "query_length": 12,
  "has_sector": true,
  "has_country": true,
  "has_stage": false,
  "result_context": "grants"
}
```

### `resource_opened`

```json
{
  "resource_type": "grant_database",
  "region_group": "EU",
  "has_website": true
}
```

### `language_changed`

```json
{
  "from_lang": "ro",
  "to_lang": "en"
}
```

### `signup_completed`

```json
{
  "result_context": "register_onboarding",
  "has_startup_name": true,
  "has_pitch": true,
  "has_goals": true,
  "selected_sector": true,
  "selected_country": true
}
```

### `funding_apply_clicked`

```json
{
  "grant_id": "EU012",
  "grant_type": "Grant + Equity",
  "region": "EU",
  "has_application_url": true,
  "source_context": "grant_app_aside_primary"
}
```
