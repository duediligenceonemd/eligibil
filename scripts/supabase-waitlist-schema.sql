-- Waitlist table for pre-launch email capture
-- Run in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS waitlist (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email             TEXT NOT NULL UNIQUE,
  status            TEXT NOT NULL DEFAULT 'pending_confirmation'
                    CHECK (status IN ('pending_confirmation','confirmed','unsubscribed','bounced','paused')),
  source            TEXT NOT NULL DEFAULT 'popup'
                    CHECK (source IN ('popup','exit_intent','inline','lead_magnet','referral','manual')),
  variant           TEXT CHECK (variant IN ('A','B','C')),
  locale            TEXT NOT NULL DEFAULT 'ro',
  country           TEXT,
  ip_hash           TEXT,
  user_agent        TEXT,
  device            TEXT CHECK (device IN ('desktop','tablet','mobile')),
  referrer_url      TEXT,
  utm_source        TEXT,
  utm_medium        TEXT,
  utm_campaign      TEXT,

  -- Engagement (updated by cron)
  emails_opened     INT NOT NULL DEFAULT 0,
  emails_clicked    INT NOT NULL DEFAULT 0,
  engagement_score  FLOAT NOT NULL DEFAULT 0,
  last_activity     TIMESTAMPTZ,

  -- GDPR
  confirm_token     TEXT UNIQUE,
  confirmed_at      TIMESTAMPTZ,
  unsubscribed_at   TIMESTAMPTZ,
  consent_version   TEXT NOT NULL DEFAULT '1.0',

  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS waitlist_status_idx ON waitlist (status);
CREATE INDEX IF NOT EXISTS waitlist_source_idx ON waitlist (source);
