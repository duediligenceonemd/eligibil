-- =============================================================================
-- eligibil.org — Notifications Schema
-- Run AFTER supabase-profiles-schema.sql in Supabase SQL Editor
-- =============================================================================

CREATE TABLE IF NOT EXISTS notifications (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      TEXT NOT NULL,
  email        TEXT,                              -- cached for sending
  type         TEXT NOT NULL DEFAULT 'grant_match', -- grant_match | deadline | system
  grant_id     TEXT REFERENCES grants(id) ON DELETE SET NULL,
  match_score  SMALLINT CHECK (match_score BETWEEN 0 AND 100),
  title        TEXT NOT NULL,
  body         TEXT,
  url          TEXT,                              -- click destination
  read         BOOLEAN NOT NULL DEFAULT false,
  sent_email   BOOLEAN NOT NULL DEFAULT false,
  email_error  TEXT,
  created_at   TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS notifications_user_unread_idx
  ON notifications (user_id, read, created_at DESC);

CREATE INDEX IF NOT EXISTS notifications_pending_email_idx
  ON notifications (created_at) WHERE sent_email = false;

CREATE INDEX IF NOT EXISTS notifications_grant_idx
  ON notifications (grant_id);

-- =============================================================================
-- RPC: notify_users_for_grant — match users by embedding cosine similarity
-- Inserts one notification per user with match >= threshold
-- =============================================================================
CREATE OR REPLACE FUNCTION notify_users_for_grant(
  p_grant_id TEXT,
  p_threshold FLOAT DEFAULT 0.50  -- cosine similarity threshold (0.50 → ~75% match)
) RETURNS INTEGER
LANGUAGE plpgsql AS $$
DECLARE
  g RECORD;
  match_count INTEGER := 0;
  base_url TEXT := 'https://eligibil.org';
BEGIN
  -- Load grant
  SELECT * INTO g FROM grants WHERE id = p_grant_id;
  IF NOT FOUND OR g.embedding IS NULL THEN
    RETURN 0;
  END IF;

  -- For each user with an embedding profile, calculate similarity and insert notification
  WITH matches AS (
    SELECT
      up.user_id,
      up.email,
      ROUND((1 - (up.embedding <=> g.embedding))::numeric, 4) AS sim,
      ROUND((((1 - (up.embedding <=> g.embedding)) - 0.25) / 0.75 * 50 + 50)::numeric)::SMALLINT AS match_pct
    FROM user_profiles up
    WHERE up.embedding IS NOT NULL
      AND (1 - (up.embedding <=> g.embedding)) > p_threshold
  ),
  inserted AS (
    INSERT INTO notifications (user_id, email, type, grant_id, match_score, title, body, url)
    SELECT
      m.user_id,
      m.email,
      'grant_match',
      g.id,
      m.match_pct,
      'New grant match: ' || g.nume_program,
      'A new grant matching your profile (' || m.match_pct || '% fit) was just published: ' ||
        COALESCE(g.organizatie, '') || '. ' ||
        CASE
          WHEN g.suma_max IS NOT NULL THEN 'Up to €' || g.suma_max::TEXT || '. '
          WHEN g.suma_min IS NOT NULL THEN '€' || g.suma_min::TEXT || '. '
          ELSE ''
        END ||
        CASE
          WHEN g.deadline IS NOT NULL THEN 'Deadline: ' || g.deadline
          ELSE ''
        END
      ,
      base_url || '/grant.html?id=' || g.id
    FROM matches m
    -- Avoid duplicate notifications for same user/grant
    WHERE NOT EXISTS (
      SELECT 1 FROM notifications n
      WHERE n.user_id = m.user_id
        AND n.grant_id = g.id
        AND n.type = 'grant_match'
    )
    RETURNING 1
  )
  SELECT COUNT(*) INTO match_count FROM inserted;

  RETURN match_count;
END;
$$;

-- =============================================================================
-- Update approve_grant_from_staging to trigger notifications
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
  notify_count INTEGER;
BEGIN
  SELECT * INTO s FROM grants_staging WHERE id = staging_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Staging entry not found';
  END IF;

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

  UPDATE grants_staging
  SET status = 'published',
      reviewed_by = reviewer,
      reviewed_at = now()
  WHERE id = staging_id;

  -- Trigger notifications (best effort, don't fail approve if this fails)
  BEGIN
    notify_count := notify_users_for_grant(new_id, 0.50);
    RAISE NOTICE 'Created % notifications for grant %', notify_count, new_id;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Notification trigger failed: %', SQLERRM;
  END;

  RETURN new_id;
END;
$$;

-- =============================================================================
-- Permissions
-- =============================================================================
GRANT ALL ON TABLE notifications TO anon, authenticated;
GRANT EXECUTE ON FUNCTION notify_users_for_grant(TEXT, FLOAT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION approve_grant_from_staging(UUID, TEXT, TEXT) TO anon, authenticated;
