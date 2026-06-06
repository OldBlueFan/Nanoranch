-- nano};{ranch — initial schema
-- Run: psql $DATABASE_URL -f src/db/schema.sql

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Rewilding spaces submitted by users
CREATE TABLE IF NOT EXISTS spaces (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT        NOT NULL DEFAULT 'My Space',
  description  TEXT,
  location     TEXT,                     -- free-text location (city/region)
  size_sqft    INTEGER,
  photo_url    TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Claude API recommendations for a space
CREATE TABLE IF NOT EXISTS recommendations (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id        UUID        NOT NULL REFERENCES spaces(id) ON DELETE CASCADE,
  prompt_version  TEXT        NOT NULL DEFAULT 'v1',
  raw_response    JSONB       NOT NULL,
  parsed_plants   JSONB,                 -- extracted plant list [{name, reason, …}]
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index to fetch latest recommendation per space quickly
CREATE INDEX IF NOT EXISTS idx_recommendations_space_created
  ON recommendations(space_id, created_at DESC);

-- Auto-update updated_at on spaces
CREATE OR REPLACE FUNCTION touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS spaces_updated_at ON spaces;
CREATE TRIGGER spaces_updated_at
  BEFORE UPDATE ON spaces
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
