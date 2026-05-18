CREATE TABLE IF NOT EXISTS app_sessions (
  sid TEXT PRIMARY KEY,
  sess JSONB NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS app_sessions_expires_at_idx
  ON app_sessions (expires_at);

REVOKE ALL ON TABLE public.app_sessions FROM anon, authenticated;
ALTER TABLE public.app_sessions ENABLE ROW LEVEL SECURITY;

-- No public policies are created on purpose.
-- The Express server reads/writes sessions with the Supabase service role.
