-- =============================================================================
-- eligibil.org — Harden funding_resources with RLS
-- Safe to run on existing projects after the base resources schema was applied.
-- Public read remains allowed; write access stays server-side via service role.
-- =============================================================================

GRANT USAGE ON SCHEMA public TO anon, authenticated;

REVOKE ALL ON TABLE funding_resources FROM anon, authenticated;
GRANT SELECT ON TABLE funding_resources TO anon, authenticated;

ALTER TABLE funding_resources ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS funding_resources_public_read ON funding_resources;
CREATE POLICY funding_resources_public_read
  ON funding_resources
  FOR SELECT
  TO anon, authenticated
  USING (true);
