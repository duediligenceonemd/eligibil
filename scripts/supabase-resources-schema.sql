-- =============================================================================
-- eligibil.org — Funding Resources Schema
-- Separate from grants: stores curated Excel-imported resources/catalog entries
-- =============================================================================

CREATE TABLE IF NOT EXISTS funding_resources (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_file    TEXT NOT NULL,
  sheet_name     TEXT NOT NULL,
  row_number     INTEGER NOT NULL,
  resource_index TEXT,
  title          TEXT NOT NULL,
  amount_raw     TEXT,
  category       TEXT,
  description    TEXT,
  website        TEXT,
  region_group   TEXT NOT NULL,
  resource_type  TEXT NOT NULL,
  is_grant_like  BOOLEAN NOT NULL DEFAULT false,
  import_batch   TEXT NOT NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT funding_resources_source_sheet_row_key
    UNIQUE (source_file, sheet_name, row_number)
);

CREATE INDEX IF NOT EXISTS funding_resources_sheet_idx
  ON funding_resources (sheet_name);

CREATE INDEX IF NOT EXISTS funding_resources_category_idx
  ON funding_resources (category);

CREATE INDEX IF NOT EXISTS funding_resources_website_idx
  ON funding_resources (website);

CREATE INDEX IF NOT EXISTS funding_resources_region_group_idx
  ON funding_resources (region_group);

CREATE INDEX IF NOT EXISTS funding_resources_resource_type_idx
  ON funding_resources (resource_type);

CREATE INDEX IF NOT EXISTS funding_resources_is_grant_like_idx
  ON funding_resources (is_grant_like);

CREATE OR REPLACE FUNCTION funding_resources_touch_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS funding_resources_updated_at_trigger ON funding_resources;
CREATE TRIGGER funding_resources_updated_at_trigger
  BEFORE UPDATE ON funding_resources
  FOR EACH ROW EXECUTE FUNCTION funding_resources_touch_updated_at();

GRANT ALL ON TABLE funding_resources TO anon, authenticated;
