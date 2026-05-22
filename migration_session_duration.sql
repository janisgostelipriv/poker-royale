-- Migration: Add session_duration_seconds to games
-- Run in Supabase SQL Editor

ALTER TABLE public.games ADD COLUMN IF NOT EXISTS session_duration_seconds integer;

-- Optional: backfill existing done games with null (already null by default).
-- You can manually set session_duration_seconds for past games directly in the
-- Supabase Table Editor or with individual UPDATE statements, e.g.:
--   UPDATE public.games SET session_duration_seconds = 7200 WHERE id = '...';
