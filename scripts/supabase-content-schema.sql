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
