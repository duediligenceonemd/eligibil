ALTER TABLE funding_resources
  ADD COLUMN IF NOT EXISTS short_summary_ro TEXT,
  ADD COLUMN IF NOT EXISTS short_summary_en TEXT,
  ADD COLUMN IF NOT EXISTS description_ro TEXT,
  ADD COLUMN IF NOT EXISTS description_en TEXT,
  ADD COLUMN IF NOT EXISTS description_source TEXT,
  ADD COLUMN IF NOT EXISTS description_generated_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS funding_resources_description_generated_at_idx
  ON funding_resources (description_generated_at DESC);
