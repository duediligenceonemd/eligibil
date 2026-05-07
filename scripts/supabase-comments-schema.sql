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
