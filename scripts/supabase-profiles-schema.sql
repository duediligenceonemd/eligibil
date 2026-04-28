-- =============================================================================
-- eligibil.eu — User Profiles + Aggregate Stats Schema (Scoring v2)
-- Run AFTER supabase-staging-schema.sql in Supabase SQL Editor
-- =============================================================================

-- =============================================================================
-- user_profiles — startup profiles for scoring relevance
-- Mirrored from local JSON store, used to drive dynamic relevance scoring
-- =============================================================================
CREATE TABLE IF NOT EXISTS user_profiles (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      TEXT UNIQUE NOT NULL,    -- maps to local users.id
  email        TEXT,
  startup_name TEXT,
  website      TEXT,
  pitch        TEXT,                    -- short pitch (used for embedding)
  sector       TEXT,                    -- "AI / SaaS"
  stage        TEXT,                    -- "MVP", "Pre-seed", "Seed"
  trl          SMALLINT,                -- 1..9
  country      TEXT DEFAULT 'Moldova',
  team_size    TEXT,
  github       TEXT,
  goals        TEXT[],                  -- array of objectives
  amount_idx   INTEGER,                 -- 0..5 (mapped to ranges)
  horizon      TEXT,
  priority     TEXT,
  embedding    VECTOR(1536),            -- profile embedding (pitch + sector + ...)
  created_at   TIMESTAMPTZ DEFAULT now(),
  updated_at   TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS up_country_idx  ON user_profiles (country);
CREATE INDEX IF NOT EXISTS up_sector_idx   ON user_profiles (sector);
CREATE INDEX IF NOT EXISTS up_stage_idx    ON user_profiles (stage);
CREATE INDEX IF NOT EXISTS up_embedding_idx ON user_profiles USING hnsw (embedding vector_cosine_ops) WITH (m = 16, ef_construction = 64);

-- =============================================================================
-- user_pool_stats — single-row aggregate (refreshed periodically)
-- Used to compute relevance score against the actual user base, not assumptions
-- =============================================================================
CREATE TABLE IF NOT EXISTS user_pool_stats (
  id              SMALLINT PRIMARY KEY DEFAULT 1,
  total_users     INTEGER NOT NULL DEFAULT 0,
  -- JSON arrays of [{value, count, pct}]
  top_countries   JSONB NOT NULL DEFAULT '[]'::jsonb,
  top_sectors     JSONB NOT NULL DEFAULT '[]'::jsonb,
  top_stages      JSONB NOT NULL DEFAULT '[]'::jsonb,
  trl_distribution JSONB NOT NULL DEFAULT '[]'::jsonb,
  amount_distribution JSONB NOT NULL DEFAULT '[]'::jsonb,
  -- Centroid embedding (average of all user profile embeddings)
  centroid_embedding VECTOR(1536),
  computed_at     TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT user_pool_stats_singleton CHECK (id = 1)
);

INSERT INTO user_pool_stats (id) VALUES (1) ON CONFLICT DO NOTHING;

-- =============================================================================
-- RPC: compute_pool_stats — refresh aggregates from user_profiles
-- =============================================================================
CREATE OR REPLACE FUNCTION compute_pool_stats() RETURNS user_pool_stats
LANGUAGE plpgsql AS $$
DECLARE
  result user_pool_stats;
BEGIN
  WITH
    -- Country distribution (from country + sector_arr if comma-separated)
    countries AS (
      SELECT TRIM(country) AS val, COUNT(*) AS cnt
      FROM user_profiles WHERE country IS NOT NULL AND country != ''
      GROUP BY TRIM(country) ORDER BY cnt DESC LIMIT 20
    ),
    -- Sector distribution (split slash-delimited)
    sectors AS (
      SELECT TRIM(s) AS val, COUNT(*) AS cnt
      FROM user_profiles, UNNEST(STRING_TO_ARRAY(sector, '/')) AS s
      WHERE sector IS NOT NULL AND sector != ''
      GROUP BY TRIM(s) ORDER BY cnt DESC LIMIT 30
    ),
    stages AS (
      SELECT TRIM(stage) AS val, COUNT(*) AS cnt
      FROM user_profiles WHERE stage IS NOT NULL AND stage != ''
      GROUP BY TRIM(stage) ORDER BY cnt DESC LIMIT 15
    ),
    trls AS (
      SELECT trl AS val, COUNT(*) AS cnt
      FROM user_profiles WHERE trl IS NOT NULL
      GROUP BY trl ORDER BY trl
    ),
    amounts AS (
      SELECT amount_idx AS val, COUNT(*) AS cnt
      FROM user_profiles WHERE amount_idx IS NOT NULL
      GROUP BY amount_idx ORDER BY amount_idx
    ),
    user_count AS (SELECT COUNT(*) AS n FROM user_profiles),
    centroid AS (
      -- Average of all user embeddings (if any)
      SELECT (
        SELECT array_agg(elem.avg ORDER BY idx)::vector(1536)
        FROM (
          SELECT idx, AVG(elem) AS avg
          FROM user_profiles, LATERAL UNNEST(embedding::float[]) WITH ORDINALITY AS u(elem, idx)
          WHERE embedding IS NOT NULL
          GROUP BY idx
        ) elem
      ) AS centroid_emb
    )
  UPDATE user_pool_stats SET
    total_users = (SELECT n FROM user_count),
    top_countries = COALESCE((SELECT jsonb_agg(jsonb_build_object('value', val, 'count', cnt, 'pct', ROUND(cnt::numeric * 100 / NULLIF((SELECT n FROM user_count), 0), 1))) FROM countries), '[]'::jsonb),
    top_sectors   = COALESCE((SELECT jsonb_agg(jsonb_build_object('value', val, 'count', cnt, 'pct', ROUND(cnt::numeric * 100 / NULLIF((SELECT SUM(cnt) FROM sectors), 0), 1))) FROM sectors), '[]'::jsonb),
    top_stages    = COALESCE((SELECT jsonb_agg(jsonb_build_object('value', val, 'count', cnt, 'pct', ROUND(cnt::numeric * 100 / NULLIF((SELECT n FROM user_count), 0), 1))) FROM stages), '[]'::jsonb),
    trl_distribution = COALESCE((SELECT jsonb_agg(jsonb_build_object('trl', val, 'count', cnt)) FROM trls), '[]'::jsonb),
    amount_distribution = COALESCE((SELECT jsonb_agg(jsonb_build_object('idx', val, 'count', cnt)) FROM amounts), '[]'::jsonb),
    centroid_embedding = (SELECT centroid_emb FROM centroid),
    computed_at = now()
  WHERE id = 1
  RETURNING * INTO result;
  RETURN result;
END;
$$;

-- =============================================================================
-- RPC: score_grant_v2 — compute relevance score for a grant against pool stats
-- Returns 0-100 based on how well the grant matches the actual user base
-- =============================================================================
CREATE OR REPLACE FUNCTION score_grant_v2(
  p_grant_id          TEXT DEFAULT NULL,
  p_staging_id        UUID DEFAULT NULL
) RETURNS INTEGER
LANGUAGE plpgsql AS $$
DECLARE
  g RECORD;
  stats RECORD;
  score NUMERIC := 0;
  country_match NUMERIC := 0;
  sector_match  NUMERIC := 0;
  stage_match   NUMERIC := 0;
  amount_match  NUMERIC := 0;
  embed_sim     NUMERIC := 0;
  deadline_bonus NUMERIC := 0;
  c JSONB;
  s JSONB;
  st JSONB;
BEGIN
  -- Load grant from either grants or grants_staging
  IF p_grant_id IS NOT NULL THEN
    SELECT * INTO g FROM grants WHERE id = p_grant_id;
  ELSIF p_staging_id IS NOT NULL THEN
    SELECT * INTO g FROM grants_staging WHERE id = p_staging_id;
  END IF;
  IF NOT FOUND THEN RETURN 0; END IF;

  SELECT * INTO stats FROM user_pool_stats WHERE id = 1;
  IF stats.total_users = 0 THEN
    -- No users yet — fall back to base heuristic (geo-only)
    IF g.tara ILIKE '%moldova%' THEN RETURN 60;
    ELSIF g.tara ILIKE '%romania%' THEN RETURN 55;
    ELSIF g.tara ILIKE '%eu%' THEN RETURN 50;
    ELSE RETURN 30;
    END IF;
  END IF;

  -- 1. Country match (35 pts max) — % of users in eligible country
  FOR c IN SELECT jsonb_array_elements(stats.top_countries) LOOP
    IF g.tara ILIKE '%' || (c->>'value') || '%'
       OR (c->>'value') ILIKE '%' || g.tara || '%' THEN
      country_match := country_match + (c->>'pct')::numeric * 0.35;
      EXIT;  -- only count strongest match
    END IF;
  END LOOP;

  -- 2. Sector match (25 pts max) — sum of overlapping sector pcts
  FOR s IN SELECT jsonb_array_elements(stats.top_sectors) LOOP
    IF g.sector ILIKE '%' || (s->>'value') || '%' THEN
      sector_match := sector_match + (s->>'pct')::numeric * 0.25;
    END IF;
  END LOOP;
  sector_match := LEAST(sector_match, 25);  -- cap

  -- 3. Stage match (15 pts max)
  FOR st IN SELECT jsonb_array_elements(stats.top_stages) LOOP
    IF g.stadiu ILIKE '%' || (st->>'value') || '%' THEN
      stage_match := stage_match + (st->>'pct')::numeric * 0.15;
    END IF;
  END LOOP;
  stage_match := LEAST(stage_match, 15);

  -- 4. Embedding similarity (15 pts max) — only if both centroid and grant have embeddings
  IF stats.centroid_embedding IS NOT NULL AND g.embedding IS NOT NULL THEN
    embed_sim := (1 - (g.embedding <=> stats.centroid_embedding)) * 15;
    embed_sim := GREATEST(0, embed_sim);
  END IF;

  -- 5. Deadline bonus (10 pts) — favor grants with healthy deadlines
  IF g.deadline IS NOT NULL THEN
    IF g.deadline ILIKE '%rolling%' OR g.deadline ILIKE '%annual%' THEN
      deadline_bonus := 10;
    ELSE
      BEGIN
        DECLARE
          d DATE := g.deadline::DATE;
          days INTEGER := d - CURRENT_DATE;
        BEGIN
          IF days < 0 THEN deadline_bonus := -30;
          ELSIF days < 14 THEN deadline_bonus := 3;
          ELSIF days < 60 THEN deadline_bonus := 8;
          ELSE deadline_bonus := 10;
          END IF;
        END;
      EXCEPTION WHEN OTHERS THEN deadline_bonus := 5;
      END;
    END IF;
  END IF;

  score := country_match + sector_match + stage_match + embed_sim + deadline_bonus;

  -- Bonus: non-dilutive (+5)
  IF g.dilutiv = false THEN score := score + 5; END IF;

  RETURN GREATEST(0, LEAST(100, ROUND(score)::INTEGER));
END;
$$;

-- =============================================================================
-- RPC: rescore_all_staging — recompute relevance for all pending grants
-- =============================================================================
CREATE OR REPLACE FUNCTION rescore_all_staging() RETURNS INTEGER
LANGUAGE plpgsql AS $$
DECLARE
  r RECORD;
  count INTEGER := 0;
BEGIN
  FOR r IN SELECT id FROM grants_staging WHERE status IN ('pending', 'pending_update') LOOP
    UPDATE grants_staging
    SET relevance_score = score_grant_v2(NULL, r.id)
    WHERE id = r.id;
    count := count + 1;
  END LOOP;
  RETURN count;
END;
$$;

-- =============================================================================
-- Permissions
-- =============================================================================
GRANT ALL ON TABLE user_profiles TO anon, authenticated;
GRANT ALL ON TABLE user_pool_stats TO anon, authenticated;
GRANT EXECUTE ON FUNCTION compute_pool_stats() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION score_grant_v2(TEXT, UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION rescore_all_staging() TO anon, authenticated;
