-- Season 2 Migration
-- Adds a "season" column to games; all existing games become Season 1.
-- New games inserted after this migration will default to Season 2.

ALTER TABLE games ADD COLUMN IF NOT EXISTS season integer NOT NULL DEFAULT 2;

-- Mark every existing game as Season 1
UPDATE games SET season = 1;
