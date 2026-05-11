-- ============================================================
-- supabase-funders-schema.sql
-- ============================================================
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


-- ============================================================
-- supabase-events-schema.sql
-- ============================================================
-- =============================================================================
-- eligibil.org — Events table (Brief 04)
-- External events (conferences, pitch nights, webinars, hackathons) shown
-- alongside grant deadlines on /evenimente. Grant deadlines themselves are
-- computed at request time from the grants table — they are NOT stored here.
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New query → Run).
-- Idempotent: every CREATE/ALTER uses IF NOT EXISTS.
-- =============================================================================

CREATE TABLE IF NOT EXISTS events (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identity (slugs are URL-friendly; will be used by /evenimente/:slug in Phase 2)
  slug_ro         TEXT UNIQUE,
  slug_en         TEXT UNIQUE,
  title           TEXT NOT NULL,
  title_en        TEXT,

  -- Type — covers external events. 'grant_deadline' is NEVER stored here;
  -- it's a runtime-only event_type for the API response when synthesizing
  -- grants.deadline rows as virtual events.
  event_type      TEXT NOT NULL CHECK (event_type IN (
    'conference',         -- physical conference / summit
    'pitch_event',        -- pitch competition / demo day
    'webinar',            -- online seminar
    'workshop',           -- training / masterclass
    'networking',         -- mixer / meetup
    'hackathon',          -- competition
    'accelerator_call'    -- accelerator application opens
  )),

  -- When & where
  start_date      TIMESTAMPTZ NOT NULL,
  end_date        TIMESTAMPTZ,
  timezone        TEXT DEFAULT 'Europe/Chisinau',
  is_online       BOOLEAN DEFAULT false,
  city            TEXT,
  country         TEXT,
  venue           TEXT,
  online_url      TEXT,

  -- Content
  description_ro  TEXT,
  description_en  TEXT,
  short_summary_ro  TEXT,
  short_summary_en  TEXT,
  agenda          JSONB,             -- [{time, title, speaker}, ...]

  -- Organizer
  organizer_name  TEXT,
  organizer_url   TEXT,
  organizer_logo  TEXT,

  -- Pricing
  is_free         BOOLEAN DEFAULT true,
  price_eur       INTEGER,
  registration_url TEXT,

  -- Targeting
  audience        TEXT[],            -- ['founders', 'investors', 'researchers', 'students']
  topics          TEXT[],            -- ['AI', 'biotech', 'climate', ...]
  stages          TEXT[],            -- ['idea', 'mvp', 'pre-seed', 'seed']

  -- Source / evidence (mirrors the grants table pattern)
  source_url      TEXT,
  source_name     TEXT,
  evidence_status TEXT DEFAULT 'ai_extracted_unverified'
    CHECK (evidence_status IN (
      'verified_primary', 'verified_secondary',
      'ai_extracted_unverified', 'hypothesis'
    )),

  -- Status — drives filtering on the listing page
  status          TEXT DEFAULT 'upcoming'
    CHECK (status IN ('upcoming', 'live', 'past', 'cancelled')),
  is_featured     BOOLEAN DEFAULT false,

  -- Audit
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

-- Indexes for the listing query patterns
CREATE INDEX IF NOT EXISTS events_start_idx        ON events (start_date);
CREATE INDEX IF NOT EXISTS events_country_idx      ON events (country);
CREATE INDEX IF NOT EXISTS events_type_idx         ON events (event_type);
CREATE INDEX IF NOT EXISTS events_status_idx       ON events (status);
CREATE INDEX IF NOT EXISTS events_topics_idx       ON events USING GIN (topics);
CREATE INDEX IF NOT EXISTS events_status_start_idx ON events (status, start_date)
  WHERE status = 'upcoming';

-- Auto-update updated_at on row change (mirrors grants pattern)
CREATE OR REPLACE FUNCTION events_touch_updated_at() RETURNS trigger AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS events_touch_trigger ON events;
CREATE TRIGGER events_touch_trigger
  BEFORE UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION events_touch_updated_at();

-- Permissions — same role pattern as grants
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE events TO anon, authenticated;

-- =============================================================================
-- Verification (run after migration)
-- =============================================================================
-- SELECT count(*) FROM events;                                        -- 0 initially, ~15 after seed-events.js
-- SELECT event_type, count(*) FROM events GROUP BY event_type;        -- by type
-- SELECT title, start_date, country FROM events WHERE status='upcoming' ORDER BY start_date LIMIT 5;


-- ============================================================
-- supabase-profiles-schema.sql
-- ============================================================
-- =============================================================================
-- eligibil.org — User Profiles + Aggregate Stats Schema (Scoring v2)
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


-- ============================================================
-- supabase-comments-schema.sql
-- ============================================================
-- =============================================================================
-- eligibil.org — Comments + Reactions
-- Polymorphic association: a comment / reaction targets one of three content
-- types (grant / blog_post / news_article). Identified by (content_type,
-- content_id). content_id is TEXT to accommodate both grants.id (TEXT) and
-- UUID-keyed tables (cast to text on insert).
--
-- Auth model: users must be logged in to post. Storing user_id (INTEGER from
-- the local users table) is enough — no anonymous posting in v1.
--
-- Moderation model: comments default to status='approved' (post-moderate).
-- Admin can flip to 'hidden' or 'deleted' from the admin panel. Reactions
-- have no status — single tap, single row.
--
-- Run in Supabase Dashboard → SQL Editor → New query → Run. Idempotent.
-- =============================================================================

CREATE TABLE IF NOT EXISTS comments (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type  TEXT NOT NULL CHECK (content_type IN ('grant', 'blog_post', 'news_article')),
  content_id    TEXT NOT NULL,
  user_id       INTEGER NOT NULL,
  user_email    TEXT,                                  -- denormalised at write time for admin display
  user_name     TEXT,                                  -- denormalised at write time
  body          TEXT NOT NULL CHECK (length(body) BETWEEN 1 AND 5000),
  status        TEXT NOT NULL DEFAULT 'approved'
                   CHECK (status IN ('approved', 'hidden', 'deleted')),
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS comments_target_idx
  ON comments (content_type, content_id, created_at DESC)
  WHERE status = 'approved';
CREATE INDEX IF NOT EXISTS comments_user_idx     ON comments (user_id);
CREATE INDEX IF NOT EXISTS comments_status_idx   ON comments (status);
CREATE INDEX IF NOT EXISTS comments_created_idx  ON comments (created_at DESC);

CREATE TABLE IF NOT EXISTS reactions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type  TEXT NOT NULL CHECK (content_type IN ('grant', 'blog_post', 'news_article')),
  content_id    TEXT NOT NULL,
  user_id       INTEGER NOT NULL,
  kind          TEXT NOT NULL DEFAULT 'like' CHECK (kind IN ('like')),
  created_at    TIMESTAMPTZ DEFAULT now(),
  -- A user can like a piece of content once.
  UNIQUE (content_type, content_id, user_id, kind)
);

CREATE INDEX IF NOT EXISTS reactions_target_idx ON reactions (content_type, content_id);
CREATE INDEX IF NOT EXISTS reactions_user_idx   ON reactions (user_id);

-- Triggers: auto-update updated_at on comments
CREATE OR REPLACE FUNCTION comments_touch_updated_at() RETURNS trigger AS $$
BEGIN NEW.updated_at := now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS comments_touch_trigger ON comments;
CREATE TRIGGER comments_touch_trigger
  BEFORE UPDATE ON comments
  FOR EACH ROW EXECUTE FUNCTION comments_touch_updated_at();

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON TABLE comments, reactions TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE comments, reactions TO authenticated;

-- =============================================================================
-- Verification
-- =============================================================================
-- SELECT column_name, data_type FROM information_schema.columns
--   WHERE table_name IN ('comments', 'reactions') ORDER BY table_name, ordinal_position;
-- INSERT INTO comments (content_type, content_id, user_id, user_email, body)
--   VALUES ('grant', 'EU012', 1, 'admin@example.com', 'Test comment') RETURNING id;
-- DELETE FROM comments WHERE body = 'Test comment';


-- ============================================================
-- supabase-content-schema.sql
-- ============================================================
-- =============================================================================
-- eligibil.org — Content tables: news (Știri) + blog_posts (Blog)
-- Two near-identical tables; separated for clean URL routing (/stiri vs /blog)
-- and clear admin tabs. Kept feature-equivalent so a future merge is trivial.
--
-- Bodies are stored as Markdown (body_md_ro / body_md_en). The server-side
-- renderer in lib/render-content-page.js converts Markdown to HTML on each
-- request — admin doesn't need to deal with HTML escaping.
--
-- Run in Supabase Dashboard → SQL Editor → New query → Run.
-- Idempotent.
-- =============================================================================

-- ── news (știri) ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS news (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug_ro         TEXT UNIQUE NOT NULL,
  slug_en         TEXT UNIQUE,

  title           TEXT NOT NULL,
  title_en        TEXT,

  excerpt_ro      TEXT,
  excerpt_en      TEXT,

  body_md_ro      TEXT,
  body_md_en      TEXT,

  hero_image      TEXT,
  author          TEXT,
  category        TEXT,                          -- "Anunț", "Update", "Politici"
  tags            TEXT[],

  published_at    TIMESTAMPTZ,                    -- NULL = draft / unpublished
  status          TEXT DEFAULT 'draft'
    CHECK (status IN ('draft', 'published', 'archived')),

  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS news_slug_ro_idx       ON news (slug_ro);
CREATE INDEX IF NOT EXISTS news_slug_en_idx       ON news (slug_en);
CREATE INDEX IF NOT EXISTS news_published_idx     ON news (published_at DESC NULLS LAST)
  WHERE status = 'published';
CREATE INDEX IF NOT EXISTS news_status_idx        ON news (status);
CREATE INDEX IF NOT EXISTS news_tags_idx          ON news USING GIN (tags);
CREATE INDEX IF NOT EXISTS news_category_idx      ON news (category);

-- ── blog_posts (Blog) ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS blog_posts (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug_ro             TEXT UNIQUE NOT NULL,
  slug_en             TEXT UNIQUE,

  title               TEXT NOT NULL,
  title_en            TEXT,

  excerpt_ro          TEXT,
  excerpt_en          TEXT,

  body_md_ro          TEXT,
  body_md_en          TEXT,

  hero_image          TEXT,
  author              TEXT,
  category            TEXT,                       -- "Tutorial", "Opinie", "Studii de caz"
  tags                TEXT[],

  reading_time_min    SMALLINT,                   -- precomputed by admin or estimated client-side
  is_featured         BOOLEAN DEFAULT false,

  published_at        TIMESTAMPTZ,
  status              TEXT DEFAULT 'draft'
    CHECK (status IN ('draft', 'published', 'archived')),

  created_at          TIMESTAMPTZ DEFAULT now(),
  updated_at          TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS blog_slug_ro_idx       ON blog_posts (slug_ro);
CREATE INDEX IF NOT EXISTS blog_slug_en_idx       ON blog_posts (slug_en);
CREATE INDEX IF NOT EXISTS blog_published_idx     ON blog_posts (published_at DESC NULLS LAST)
  WHERE status = 'published';
CREATE INDEX IF NOT EXISTS blog_status_idx        ON blog_posts (status);
CREATE INDEX IF NOT EXISTS blog_tags_idx          ON blog_posts USING GIN (tags);
CREATE INDEX IF NOT EXISTS blog_category_idx      ON blog_posts (category);
CREATE INDEX IF NOT EXISTS blog_featured_idx      ON blog_posts (is_featured)
  WHERE is_featured = true AND status = 'published';

-- ── Auto-update updated_at (one trigger function reused) ─────────────────────
CREATE OR REPLACE FUNCTION content_touch_updated_at() RETURNS trigger AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS news_touch_trigger ON news;
CREATE TRIGGER news_touch_trigger
  BEFORE UPDATE ON news
  FOR EACH ROW EXECUTE FUNCTION content_touch_updated_at();

DROP TRIGGER IF EXISTS blog_touch_trigger ON blog_posts;
CREATE TRIGGER blog_touch_trigger
  BEFORE UPDATE ON blog_posts
  FOR EACH ROW EXECUTE FUNCTION content_touch_updated_at();

-- ── Permissions ──────────────────────────────────────────────────────────────
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON TABLE news, blog_posts TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE news, blog_posts TO authenticated;

-- =============================================================================
-- Verification
-- =============================================================================
-- SELECT column_name FROM information_schema.columns
--   WHERE table_name IN ('news', 'blog_posts') ORDER BY table_name, ordinal_position;
-- Test row:
-- INSERT INTO news (slug_ro, title, body_md_ro, status, published_at)
--   VALUES ('test', 'Test', '# Hello\n\nThis is a test', 'published', now());
-- SELECT slug_ro, title, status FROM news WHERE slug_ro = 'test';
-- DELETE FROM news WHERE slug_ro = 'test';


-- ============================================================
-- supabase-grants-enrich-schema.sql
-- ============================================================
-- ============================================================================
-- eligibil.org — Grants schema enrichment v2
-- Adds: bilingual slugs, structured eligibility, SEO meta, evidence tracking
--
-- Run AFTER supabase-schema.sql.
--
-- HOW TO APPLY
--   Option A (recommended): Supabase Dashboard → SQL Editor → paste this file
--                           → Run. Then run the backfill block at the bottom.
--   Option B (future):      extend scripts/push-schema.js to accept a CLI arg
--                           (currently it hardcodes supabase-schema.sql).
--
-- This migration is idempotent: every ALTER / CREATE uses IF NOT EXISTS,
-- and ADD COLUMN IF NOT EXISTS is safe to re-run.
-- ============================================================================

-- Required for generate_slug() — strips Romanian diacritics (ăâîșț → aaist)
CREATE EXTENSION IF NOT EXISTS unaccent;

-- ============================================================================
-- Bilingual slugs (URL-friendly, unique)
-- ============================================================================
ALTER TABLE grants ADD COLUMN IF NOT EXISTS slug_ro TEXT UNIQUE;
ALTER TABLE grants ADD COLUMN IF NOT EXISTS slug_en TEXT UNIQUE;

-- ============================================================================
-- Bilingual content (Romanian primary, English secondary)
-- ============================================================================
ALTER TABLE grants ADD COLUMN IF NOT EXISTS nume_program_en   TEXT;
ALTER TABLE grants ADD COLUMN IF NOT EXISTS descriere_en      TEXT;
ALTER TABLE grants ADD COLUMN IF NOT EXISTS cerinte_en        TEXT;
ALTER TABLE grants ADD COLUMN IF NOT EXISTS short_summary_ro  TEXT;  -- <160 chars (SEO meta description)
ALTER TABLE grants ADD COLUMN IF NOT EXISTS short_summary_en  TEXT;

-- ============================================================================
-- Structured eligibility rules — used by rule engine + UI breakdown
-- Format: [
--   { type:'country',                 value:['MD','RO'],            required:true },
--   { type:'stage',                   value:['MVP','Pre-seed'],     required:true },
--   { type:'sector',                  value:['AI','Deep Tech'],     required:false },
--   { type:'trl_min',                 value:6,                      required:true },
--   { type:'team_size_min',           value:2,                      required:false },
--   { type:'company_age_max_months',  value:60,                     required:false },
--   { type:'cofinancing_pct',         value:25,                     required:true }
-- ]
-- ============================================================================
ALTER TABLE grants ADD COLUMN IF NOT EXISTS eligibility_rules JSONB DEFAULT '[]'::jsonb;

-- ============================================================================
-- Documents required — for Workspace + checklist auto-gen
-- Format: [
--   { name:'Pitch deck',           required:true, format:'pdf', max_pages:15 },
--   { name:'Business plan',        required:true, format:'pdf' },
--   { name:'Financial projections',required:true, format:'xlsx' },
--   { name:'Team CVs',             required:true, format:'pdf' }
-- ]
-- ============================================================================
ALTER TABLE grants ADD COLUMN IF NOT EXISTS documents_required JSONB DEFAULT '[]'::jsonb;

-- ============================================================================
-- Evaluation criteria — used by AI scoring + UI explanations
-- Format: [
--   { name:'Innovation',       weight:30, description:'Novelty of approach' },
--   { name:'Market potential', weight:25 },
--   { name:'Team',             weight:20 },
--   { name:'Feasibility',      weight:15 },
--   { name:'Impact',           weight:10 }
-- ]
-- ============================================================================
ALTER TABLE grants ADD COLUMN IF NOT EXISTS evaluation_criteria JSONB DEFAULT '[]'::jsonb;

-- ============================================================================
-- Source & evidence — TRUST signals
-- ============================================================================
ALTER TABLE grants ADD COLUMN IF NOT EXISTS source_url       TEXT;
ALTER TABLE grants ADD COLUMN IF NOT EXISTS source_name      TEXT;
ALTER TABLE grants ADD COLUMN IF NOT EXISTS evidence_status  TEXT
  CHECK (evidence_status IN ('verified_primary', 'verified_secondary', 'ai_extracted_unverified', 'hypothesis'))
  DEFAULT 'ai_extracted_unverified';
ALTER TABLE grants ADD COLUMN IF NOT EXISTS last_checked_at  TIMESTAMPTZ DEFAULT now();

-- Where the user actually applies (distinct from source_url, which is the announcement)
ALTER TABLE grants ADD COLUMN IF NOT EXISTS application_url  TEXT;

-- ============================================================================
-- Funder / program metadata
-- ============================================================================
ALTER TABLE grants ADD COLUMN IF NOT EXISTS funder_name      TEXT;   -- e.g. "European Innovation Council"
ALTER TABLE grants ADD COLUMN IF NOT EXISTS program_name     TEXT;   -- e.g. "EIC Accelerator 2026"
ALTER TABLE grants ADD COLUMN IF NOT EXISTS funder_logo_url  TEXT;
ALTER TABLE grants ADD COLUMN IF NOT EXISTS funder_country   TEXT;

-- Languages the application can be submitted in
ALTER TABLE grants ADD COLUMN IF NOT EXISTS application_languages TEXT[];   -- ['en','ro','fr']

-- ============================================================================
-- Cofinancing & equity
-- ============================================================================
ALTER TABLE grants ADD COLUMN IF NOT EXISTS cofinancing_pct        INTEGER;   -- 0-100
ALTER TABLE grants ADD COLUMN IF NOT EXISTS equity_pct             INTEGER;   -- 0-100 (accelerators / VC)
ALTER TABLE grants ADD COLUMN IF NOT EXISTS consortium_required    BOOLEAN DEFAULT false;
ALTER TABLE grants ADD COLUMN IF NOT EXISTS consortium_min_partners INTEGER;

-- ============================================================================
-- TRL (Technology Readiness Level) bounds
-- ============================================================================
ALTER TABLE grants ADD COLUMN IF NOT EXISTS trl_min SMALLINT CHECK (trl_min BETWEEN 1 AND 9);
ALTER TABLE grants ADD COLUMN IF NOT EXISTS trl_max SMALLINT CHECK (trl_max BETWEEN 1 AND 9);

-- ============================================================================
-- Tags — SEO + filtering
-- ============================================================================
ALTER TABLE grants ADD COLUMN IF NOT EXISTS tags TEXT[];

-- ============================================================================
-- Indexes
-- ============================================================================
CREATE INDEX IF NOT EXISTS grants_slug_ro_idx           ON grants (slug_ro);
CREATE INDEX IF NOT EXISTS grants_slug_en_idx           ON grants (slug_en);
CREATE INDEX IF NOT EXISTS grants_evidence_status_idx   ON grants (evidence_status);
CREATE INDEX IF NOT EXISTS grants_funder_country_idx    ON grants (funder_country);
CREATE INDEX IF NOT EXISTS grants_tags_idx              ON grants USING GIN (tags);
CREATE INDEX IF NOT EXISTS grants_eligibility_rules_idx ON grants USING GIN (eligibility_rules);

-- ============================================================================
-- Slug auto-generation function (Romanian-aware)
--   - lowercases
--   - strips diacritics via unaccent (Î → I → i, Ș → S → s, etc.)
--   - removes non-alphanumeric except spaces and dashes
--   - collapses whitespace into single dashes
--   - collapses repeated dashes
--
-- IMMUTABLE so it can be used in generated columns / functional indexes.
-- ============================================================================
CREATE OR REPLACE FUNCTION generate_slug(input_text TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN regexp_replace(
    regexp_replace(
      regexp_replace(
        unaccent(lower(input_text)),
        '[^a-z0-9\s\-]', '', 'g'
      ),
      '\s+', '-', 'g'
    ),
    '-+', '-', 'g'
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================================================
-- Permissions — match the pattern in supabase-schema.sql:250-253
-- ============================================================================
GRANT EXECUTE ON FUNCTION generate_slug(TEXT) TO anon, authenticated;

-- ============================================================================
-- BACKFILL — run AFTER the migration above, in the SQL Editor.
-- Uncomment and run once. Safe to re-run; only fills NULL slugs.
-- ============================================================================
-- UPDATE grants SET slug_ro = generate_slug(nume_program)                      WHERE slug_ro IS NULL;
-- UPDATE grants SET slug_en = generate_slug(COALESCE(nume_program_en, nume_program)) WHERE slug_en IS NULL;

-- ============================================================================
-- VERIFY — read-only checks. Paste into SQL Editor after applying.
-- ============================================================================
-- New columns present:
-- SELECT column_name, data_type FROM information_schema.columns
--   WHERE table_name = 'grants'
--     AND column_name IN ('slug_ro','slug_en','eligibility_rules','evidence_status','tags','trl_min');
--
-- Function exists:
-- SELECT proname FROM pg_proc WHERE proname = 'generate_slug';
--
-- Slug generation works (expect 'eic-accelerator-2026-pentru-startup-uri-ai'):
-- SELECT generate_slug('EIC Accelerator 2026 — pentru startup-uri AI');
--
-- Indexes present:
-- SELECT indexname FROM pg_indexes
--   WHERE tablename = 'grants'
--     AND (indexname LIKE 'grants_slug%' OR indexname LIKE 'grants_tags%');


