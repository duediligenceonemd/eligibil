-- =============================================================================
-- eligibil.org — Harden private operational tables with RLS
-- Do NOT expose these tables through PostgREST. The app uses server-side
-- service-role access for all legitimate reads/writes.
-- =============================================================================

-- newsletter_subscribers
REVOKE ALL ON TABLE public.newsletter_subscribers FROM anon, authenticated;
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS service_role_all ON public.newsletter_subscribers;

-- waitlist
REVOKE ALL ON TABLE public.waitlist FROM anon, authenticated;
ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;

-- email_logs
REVOKE ALL ON TABLE public.email_logs FROM anon, authenticated;
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

-- email_queue
REVOKE ALL ON TABLE public.email_queue FROM anon, authenticated;
ALTER TABLE public.email_queue ENABLE ROW LEVEL SECURITY;

-- No public policies are created on purpose.
-- Server-side service role bypasses RLS and continues to work.
