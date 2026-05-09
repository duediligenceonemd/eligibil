-- =============================================================================
-- eligibil.org — Grants Staging Schema
-- Pipeline: Email/RSS/Web → grants_staging → review → grants (PROD)
-- Run in Supabase SQL Editor AFTER supabase-schema.sql
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;  -- for gen_random_uuid()

-- =============================================================================
-- grants_staging — incoming grants pending review
-- =============================================================================
CREATE TABLE IF NOT EXISTS grants_staging (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Deduplication: SHA-256(funder|program|year)
  fingerprint     TEXT UNIQUE NOT NULL,

  -- Same shape as grants table
  nume_program    TEXT NOT NULL,
  organizatie     TEXT,
  tara            TEXT,
  tip             TEXT,
  dilutiv         BOOLEAN DEFAULT false,
  suma_min        INTEGER,
  suma_max        INTEGER,
  stadiu          TEXT,
  sector          TEXT,
  stadiu_arr      TEXT[],
  sector_arr      TEXT[],
  deadline        TEXT,
  luna            INTEGER,
  dificultate     SMALLINT,
  zile_min        INTEGER,
  zile_max        INTEGER,
  cerinte         TEXT,
  descriere       TEXT,
  website         TEXT,

  -- Audit / source tracking
  source_type     TEXT,              -- 'email' | 'rss' | 'scraper' | 'manual'
  source_id       TEXT,              -- Gmail message ID, RSS GUID, URL
  source_subject  TEXT,
  source_snippet  TEXT,              -- first 500 chars of body
  source_url      TEXT,
  extracted_at    TIMESTAMPTZ DEFAULT now(),
  extracted_by    TEXT DEFAULT 'claude-extractor-v1',

  -- Review workflow
  status          TEXT NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending','approved','rejected','duplicate','pending_update','published')),
  relevance_score SMALLINT CHECK (relevance_score BETWEEN 0 AND 100),
  reject_reason   TEXT,
  reviewed_by     TEXT,
  reviewed_at     TIMESTAMPTZ,

  -- If this is an UPDATE to an existing grant
  updates_grant_id TEXT REFERENCES grants(id) ON DELETE SET NULL,

  -- Obsidian sync
  obsidian_path   TEXT,              -- relative path in vault

  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS staging_status_idx ON grants_staging (status, relevance_score DESC);
CREATE INDEX IF NOT EXISTS staging_fingerprint_idx ON grants_staging (fingerprint);
CREATE INDEX IF NOT EXISTS staging_source_idx ON grants_staging (source_type, source_id);

-- =============================================================================
-- grant_sources — track all input sources for audit
-- =============================================================================
CREATE TABLE IF NOT EXISTS grant_sources (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_type TEXT NOT NULL,         -- 'email' | 'rss' | 'scraper'
  source_url  TEXT,
  funder_name TEXT,
  active      BOOLEAN DEFAULT true,
  last_check  TIMESTAMPTZ,
  notes       TEXT,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- =============================================================================
-- RPC: approve_grant_from_staging — promote staging → grants
-- =============================================================================
CREATE OR REPLACE FUNCTION approve_grant_from_staging(
  staging_id UUID,
  grant_id_override TEXT DEFAULT NULL,
  reviewer TEXT DEFAULT 'admin'
) RETURNS TEXT
LANGUAGE plpgsql AS $$
DECLARE
  s RECORD;
  new_id TEXT;
BEGIN
  SELECT * INTO s FROM grants_staging WHERE id = staging_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Staging entry not found';
  END IF;

  -- Generate ID if not provided: prefix by country
  IF grant_id_override IS NOT NULL THEN
    new_id := grant_id_override;
  ELSIF s.updates_grant_id IS NOT NULL THEN
    new_id := s.updates_grant_id;
  ELSE
    new_id := COALESCE(
      CASE
        WHEN s.tara ILIKE '%moldova%' THEN 'MD'
        WHEN s.tara ILIKE '%romania%' THEN 'RO'
        WHEN s.tara ILIKE '%eu%' OR s.tara ILIKE '%europe%' THEN 'EU'
        ELSE 'GL'
      END
    ) || LPAD(((SELECT COUNT(*) FROM grants) + 1)::TEXT, 3, '0');
  END IF;

  -- UPSERT into grants
  INSERT INTO grants (
    id, nume_program, organizatie, tara, tip, dilutiv, suma_min, suma_max,
    stadiu, sector, stadiu_arr, sector_arr, deadline, luna, dificultate,
    zile_min, zile_max, cerinte, descriere, website, status
  ) VALUES (
    new_id, s.nume_program, s.organizatie, s.tara, s.tip, s.dilutiv,
    s.suma_min, s.suma_max, s.stadiu, s.sector, s.stadiu_arr, s.sector_arr,
    s.deadline, s.luna, s.dificultate, s.zile_min, s.zile_max,
    s.cerinte, s.descriere, s.website, 'Activ'
  )
  ON CONFLICT (id) DO UPDATE SET
    nume_program = EXCLUDED.nume_program,
    organizatie  = EXCLUDED.organizatie,
    suma_min     = EXCLUDED.suma_min,
    suma_max     = EXCLUDED.suma_max,
    deadline     = EXCLUDED.deadline,
    cerinte      = EXCLUDED.cerinte,
    descriere    = EXCLUDED.descriere,
    website      = EXCLUDED.website,
    updated_at   = now();

  -- Mark staging as published
  UPDATE grants_staging
  SET status = 'published',
      reviewed_by = reviewer,
      reviewed_at = now()
  WHERE id = staging_id;

  RETURN new_id;
END;
$$;

-- =============================================================================
-- RPC: pending_queue — get grants awaiting review (sorted by relevance)
-- =============================================================================
CREATE OR REPLACE FUNCTION pending_queue(max_count INT DEFAULT 50)
RETURNS TABLE (
  id UUID, fingerprint TEXT, nume_program TEXT, organizatie TEXT,
  tara TEXT, suma_min INTEGER, suma_max INTEGER, deadline TEXT,
  relevance_score SMALLINT, source_type TEXT, source_subject TEXT,
  source_url TEXT, extracted_at TIMESTAMPTZ, status TEXT,
  updates_grant_id TEXT
)
LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  SELECT s.id, s.fingerprint, s.nume_program, s.organizatie,
    s.tara, s.suma_min, s.suma_max, s.deadline,
    s.relevance_score, s.source_type, s.source_subject,
    s.source_url, s.extracted_at, s.status, s.updates_grant_id
  FROM grants_staging s
  WHERE s.status IN ('pending', 'pending_update')
  ORDER BY s.relevance_score DESC NULLS LAST, s.extracted_at DESC
  LIMIT max_count;
END;
$$;

-- =============================================================================
-- Permissions
-- =============================================================================
GRANT ALL ON TABLE grants_staging TO anon, authenticated;
GRANT ALL ON TABLE grant_sources TO anon, authenticated;
GRANT EXECUTE ON FUNCTION approve_grant_from_staging(UUID, TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION pending_queue(INT) TO anon, authenticated;

-- =============================================================================
-- Seed: known grant sources
-- =============================================================================
INSERT INTO grant_sources (source_type, source_url, funder_name) VALUES
  ('rss',     'https://eic.ec.europa.eu/news_en?f%5B0%5D=oe_news_types%3A4',  'EIC'),
  ('rss',     'https://cordis.europa.eu/news/rcn.rss',                          'Cordis'),
  ('scraper', 'https://odimm.md/ro/granturi/',                                  'ODIMM'),
  ('scraper', 'https://startupmoldova.md/calls/',                               'Startup Moldova'),
  ('scraper', 'https://aipa.gov.md/anunturi/',                                  'AIPA'),
  ('scraper', 'https://www.fonduri-ue.ro/programe',                             'Fonduri UE'),
  ('email',   NULL,                                                             'Generic email forwarding')
ON CONFLICT DO NOTHING;
