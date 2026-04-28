-- =============================================================================
-- eligibil.eu — Grants Vector Database Schema
-- Run this once in Supabase SQL Editor (Dashboard → SQL Editor → New query → Run)
-- =============================================================================

-- Enable pgvector extension (already enabled on all Supabase projects)
CREATE EXTENSION IF NOT EXISTS vector;

-- =============================================================================
-- Grants table
-- =============================================================================
CREATE TABLE IF NOT EXISTS grants (
  -- Primary identity
  id            TEXT PRIMARY KEY,         -- MD001, EU012, ACC003, etc.
  nume_program  TEXT NOT NULL,
  organizatie   TEXT,

  -- Geography & type
  tara          TEXT,                      -- "Moldova", "Romania", "EU", "Global"
  tip           TEXT,                      -- "Grant", "Accelerator", "VC Fund", etc.
  dilutiv       BOOLEAN NOT NULL DEFAULT false,

  -- Financials (EUR)
  suma_min      INTEGER,
  suma_max      INTEGER,

  -- Matching fields — stored as raw slash-delimited string AND parsed array
  stadiu        TEXT,                      -- "Idee / MVP / Pre-seed"
  sector        TEXT,                      -- "AI / Deep Tech / SaaS"
  stadiu_arr    TEXT[],                    -- ['Idee', 'MVP', 'Pre-seed']
  sector_arr    TEXT[],                    -- ['AI', 'Deep Tech', 'SaaS']

  -- Deadline
  deadline      TEXT,                      -- "Annual", "Rolling", "15 Mai 2026"
  luna          INTEGER,                   -- month number 0=Rolling, 1-12

  -- Scoring & effort
  dificultate   SMALLINT CHECK (dificultate BETWEEN 1 AND 3),
  zile_min      INTEGER,                   -- min days to prepare application
  zile_max      INTEGER,                   -- max days to prepare application

  -- Rich text content (used for embeddings + full-text search)
  cerinte       TEXT,                      -- eligibility requirements
  descriere     TEXT,                      -- program description

  -- Meta
  website       TEXT,
  verificat     DATE,
  status        TEXT DEFAULT 'Activ',

  -- Vector embedding (1536 dims — OpenAI text-embedding-3-small)
  -- NULL when OPENAI_API_KEY not set; system falls back to FTS
  embedding     VECTOR(1536),

  -- Full-text search column (auto-maintained by trigger below)
  fts           TSVECTOR,

  -- Timestamps
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

-- =============================================================================
-- Indexes
-- =============================================================================

-- HNSW vector index (better than IVFFlat for < 10K rows)
CREATE INDEX IF NOT EXISTS grants_embedding_idx
  ON grants USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- SQL filter indexes
CREATE INDEX IF NOT EXISTS grants_tara_idx       ON grants (tara);
CREATE INDEX IF NOT EXISTS grants_tip_idx        ON grants (tip);
CREATE INDEX IF NOT EXISTS grants_status_idx     ON grants (status);
CREATE INDEX IF NOT EXISTS grants_dilutiv_idx    ON grants (dilutiv);
CREATE INDEX IF NOT EXISTS grants_suma_min_idx   ON grants (suma_min);
CREATE INDEX IF NOT EXISTS grants_suma_max_idx   ON grants (suma_max);
CREATE INDEX IF NOT EXISTS grants_dificultate_idx ON grants (dificultate);

-- GIN indexes for array contains-filter
CREATE INDEX IF NOT EXISTS grants_sector_arr_idx ON grants USING GIN (sector_arr);
CREATE INDEX IF NOT EXISTS grants_stadiu_arr_idx ON grants USING GIN (stadiu_arr);

-- Full-text search index
CREATE INDEX IF NOT EXISTS grants_fts_idx ON grants USING GIN (fts);

-- =============================================================================
-- Full-text search trigger (auto-updates fts column on insert/update)
-- Uses 'simple' dictionary for language-agnostic tokenization (works with RO/EN)
-- =============================================================================
CREATE OR REPLACE FUNCTION grants_fts_update() RETURNS trigger AS $$
BEGIN
  NEW.fts := to_tsvector(
    'simple',
    COALESCE(NEW.cerinte, '')      || ' ' ||
    COALESCE(NEW.descriere, '')    || ' ' ||
    COALESCE(NEW.sector, '')       || ' ' ||
    COALESCE(NEW.stadiu, '')       || ' ' ||
    COALESCE(NEW.tara, '')         || ' ' ||
    COALESCE(NEW.tip, '')          || ' ' ||
    COALESCE(NEW.organizatie, '')  || ' ' ||
    COALESCE(NEW.nume_program, '')
  );
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS grants_fts_trigger ON grants;
CREATE TRIGGER grants_fts_trigger
  BEFORE INSERT OR UPDATE ON grants
  FOR EACH ROW EXECUTE FUNCTION grants_fts_update();

-- =============================================================================
-- RPC: match_grants — vector similarity search
-- Called as: supabase.rpc('match_grants', { query_embedding: [...], ... })
-- =============================================================================
CREATE OR REPLACE FUNCTION match_grants(
  query_embedding  VECTOR(1536),
  match_threshold  FLOAT    DEFAULT 0.25,
  match_count      INT      DEFAULT 10,
  filter_tara      TEXT     DEFAULT NULL,
  filter_sector    TEXT     DEFAULT NULL,
  filter_stadiu    TEXT     DEFAULT NULL,
  filter_dilutiv   BOOLEAN  DEFAULT NULL,
  filter_suma_min  INTEGER  DEFAULT NULL,
  filter_suma_max  INTEGER  DEFAULT NULL,
  filter_status    TEXT     DEFAULT 'Activ'
)
RETURNS TABLE (
  id           TEXT,
  nume_program TEXT,
  organizatie  TEXT,
  tara         TEXT,
  tip          TEXT,
  dilutiv      BOOLEAN,
  suma_min     INTEGER,
  suma_max     INTEGER,
  stadiu       TEXT,
  sector       TEXT,
  deadline     TEXT,
  dificultate  SMALLINT,
  cerinte      TEXT,
  descriere    TEXT,
  website      TEXT,
  status       TEXT,
  similarity   FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    g.id, g.nume_program, g.organizatie, g.tara, g.tip,
    g.dilutiv, g.suma_min, g.suma_max, g.stadiu, g.sector,
    g.deadline, g.dificultate, g.cerinte, g.descriere,
    g.website, g.status,
    1 - (g.embedding <=> query_embedding) AS similarity
  FROM grants g
  WHERE
    g.embedding IS NOT NULL
    AND 1 - (g.embedding <=> query_embedding) > match_threshold
    AND (filter_status  IS NULL OR g.status  = filter_status)
    AND (filter_tara    IS NULL OR g.tara    ILIKE '%' || filter_tara    || '%')
    AND (filter_dilutiv IS NULL OR g.dilutiv = filter_dilutiv)
    AND (filter_suma_min IS NULL OR g.suma_max >= filter_suma_min)
    AND (filter_suma_max IS NULL OR g.suma_min <= filter_suma_max)
    AND (filter_sector  IS NULL
         OR g.sector_arr @> ARRAY[filter_sector]
         OR g.sector ILIKE '%' || filter_sector || '%')
    AND (filter_stadiu  IS NULL
         OR g.stadiu_arr @> ARRAY[filter_stadiu]
         OR g.stadiu ILIKE '%' || filter_stadiu || '%')
  ORDER BY similarity DESC
  LIMIT match_count;
END;
$$;

-- =============================================================================
-- RPC: search_grants_fts — full-text search fallback (no embeddings required)
-- Called when OPENAI_API_KEY is not set or embedding is NULL
-- =============================================================================
CREATE OR REPLACE FUNCTION search_grants_fts(
  query_text      TEXT,
  match_count     INT      DEFAULT 10,
  filter_tara     TEXT     DEFAULT NULL,
  filter_sector   TEXT     DEFAULT NULL,
  filter_stadiu   TEXT     DEFAULT NULL,
  filter_dilutiv  BOOLEAN  DEFAULT NULL,
  filter_suma_min INTEGER  DEFAULT NULL,
  filter_suma_max INTEGER  DEFAULT NULL,
  filter_status   TEXT     DEFAULT 'Activ'
)
RETURNS TABLE (
  id           TEXT,
  nume_program TEXT,
  organizatie  TEXT,
  tara         TEXT,
  tip          TEXT,
  dilutiv      BOOLEAN,
  suma_min     INTEGER,
  suma_max     INTEGER,
  stadiu       TEXT,
  sector       TEXT,
  deadline     TEXT,
  dificultate  SMALLINT,
  cerinte      TEXT,
  descriere    TEXT,
  website      TEXT,
  status       TEXT,
  rank         FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    g.id, g.nume_program, g.organizatie, g.tara, g.tip,
    g.dilutiv, g.suma_min, g.suma_max, g.stadiu, g.sector,
    g.deadline, g.dificultate, g.cerinte, g.descriere,
    g.website, g.status,
    CASE
      WHEN query_text IS NULL OR query_text = ''
        THEN 0.0::FLOAT
      ELSE ts_rank(g.fts, plainto_tsquery('simple', query_text))::FLOAT
    END AS rank
  FROM grants g
  WHERE
    (filter_status  IS NULL OR g.status = filter_status)
    AND (filter_tara    IS NULL OR g.tara   ILIKE '%' || filter_tara   || '%')
    AND (filter_dilutiv IS NULL OR g.dilutiv = filter_dilutiv)
    AND (filter_suma_min IS NULL OR g.suma_max >= filter_suma_min)
    AND (filter_suma_max IS NULL OR g.suma_min <= filter_suma_max)
    AND (filter_sector  IS NULL OR g.sector ILIKE '%' || filter_sector || '%')
    AND (filter_stadiu  IS NULL OR g.stadiu ILIKE '%' || filter_stadiu || '%')
    AND (
      query_text IS NULL OR query_text = ''
      OR g.fts @@ plainto_tsquery('simple', query_text)
    )
  ORDER BY rank DESC, g.dificultate ASC
  LIMIT match_count;
END;
$$;

-- =============================================================================
-- Permissions — allow anon + authenticated roles to read/write grants
-- Required when using the publishable (anon) key without service_role
-- =============================================================================
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON TABLE grants TO anon, authenticated;
GRANT EXECUTE ON FUNCTION match_grants(VECTOR(1536), FLOAT, INT, TEXT, TEXT, TEXT, BOOLEAN, INTEGER, INTEGER, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION search_grants_fts(TEXT, INT, TEXT, TEXT, TEXT, BOOLEAN, INTEGER, INTEGER, TEXT) TO anon, authenticated;

-- =============================================================================
-- Verification queries (run after seeding to confirm data loaded correctly)
-- =============================================================================
-- SELECT count(*) FROM grants;                          -- should be ~70
-- SELECT tara, count(*) FROM grants GROUP BY tara;      -- by country
-- SELECT id, nume_program FROM grants LIMIT 5;          -- sample rows
-- SELECT id FROM grants WHERE embedding IS NOT NULL LIMIT 1; -- embeddings loaded
