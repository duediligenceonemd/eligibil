-- =============================================================================
-- eligibil.eu — Events table (Brief 04)
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
