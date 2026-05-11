-- =============================================================================
-- eligibil.org — Funders / Donatori (Admin iter 2)
-- Normalised donor catalog. Each grant currently has free-form `funder_name`
-- and `funder_country` text columns; this table adds a structured backing
-- entity. The grants link is OPTIONAL (FK can be NULL) so existing rows
-- keep working without a backfill — admin can attach later.
--
-- Run in Supabase Dashboard → SQL Editor → New query → Run.
-- Idempotent: every CREATE/ALTER uses IF NOT EXISTS.
-- =============================================================================

CREATE TABLE IF NOT EXISTS funders (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug          TEXT UNIQUE,

  -- Identity (bilingual)
  name          TEXT NOT NULL,
  name_en       TEXT,
  short_name    TEXT,

  -- Type / category
  funder_type   TEXT CHECK (funder_type IN (
    'foundation',     -- private foundation
    'government',     -- national / regional government agency
    'corporate',      -- corporate-backed (CSR / strategic)
    'vc_fund',        -- venture capital fund
    'accelerator',    -- accelerator / incubator
    'eu_program',     -- EU-level (EIC, Horizon, COSME, etc.)
    'dao',            -- decentralised / DAO grant
    'other'
  )),

  -- Geography
  country       TEXT,                          -- 'Moldova', 'România', 'EU', 'Global'
  hq_city       TEXT,

  -- Branding
  logo_url      TEXT,                          -- Supabase Storage URL or external CDN
  website       TEXT,
  contact_email TEXT,

  -- Content
  description_ro   TEXT,
  description_en   TEXT,
  short_summary_ro TEXT,                        -- <160 chars for SEO meta on per-funder pages (Iter 4+)
  short_summary_en TEXT,

  -- Targeting
  focus_areas   TEXT[],                         -- ['AI','climate','deep-tech','fintech','...']
  stages_funded TEXT[],                         -- ['idea','mvp','pre-seed','seed','series-a']
  countries_funded TEXT[],                      -- where they typically fund

  -- Track record
  founded_year       SMALLINT CHECK (founded_year BETWEEN 1900 AND 2100),
  total_funding_eur  BIGINT,                    -- aggregate disclosed if known
  notable_grantees   TEXT[],                    -- ['Wise','Bolt','UiPath',...]

  -- Status / evidence (mirrors grants pattern)
  status            TEXT DEFAULT 'active'
    CHECK (status IN ('active', 'inactive', 'archived')),
  evidence_status   TEXT DEFAULT 'ai_extracted_unverified'
    CHECK (evidence_status IN (
      'verified_primary', 'verified_secondary',
      'ai_extracted_unverified', 'hypothesis'
    )),

  -- Audit
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS funders_slug_idx        ON funders (slug);
CREATE INDEX IF NOT EXISTS funders_country_idx     ON funders (country);
CREATE INDEX IF NOT EXISTS funders_type_idx        ON funders (funder_type);
CREATE INDEX IF NOT EXISTS funders_status_idx      ON funders (status);
CREATE INDEX IF NOT EXISTS funders_focus_idx       ON funders USING GIN (focus_areas);
CREATE INDEX IF NOT EXISTS funders_countries_idx   ON funders USING GIN (countries_funded);

-- ── Grants → Funders FK (optional, kept NULL by default) ───────────────────
-- The existing `funder_name` / `funder_country` text columns stay populated
-- for backward compatibility. `funder_id` is a structured pointer the admin
-- can attach via the panel; with the FK in place, future joins become possible.
ALTER TABLE grants
  ADD COLUMN IF NOT EXISTS funder_id UUID REFERENCES funders(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS grants_funder_id_idx ON grants (funder_id);

-- ── Auto-update updated_at ────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION funders_touch_updated_at() RETURNS trigger AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS funders_touch_trigger ON funders;
CREATE TRIGGER funders_touch_trigger
  BEFORE UPDATE ON funders
  FOR EACH ROW EXECUTE FUNCTION funders_touch_updated_at();

-- ── Permissions ────────────────────────────────────────────────────────────
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE funders TO anon, authenticated;

-- =============================================================================
-- Verification (run after migration)
-- =============================================================================
-- SELECT column_name, data_type FROM information_schema.columns
--   WHERE table_name = 'funders' ORDER BY ordinal_position;
-- SELECT column_name FROM information_schema.columns
--   WHERE table_name = 'grants' AND column_name = 'funder_id';
-- INSERT INTO funders (slug, name, country, funder_type)
--   VALUES ('eic-test', 'EIC Test', 'EU', 'eu_program') RETURNING id;
-- DELETE FROM funders WHERE slug = 'eic-test';
