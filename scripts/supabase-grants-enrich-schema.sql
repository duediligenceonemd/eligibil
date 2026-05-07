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
