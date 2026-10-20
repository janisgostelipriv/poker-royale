-- Season 3 Migration
-- Season 2 ist abgeschlossen: alle bisherigen Daten bleiben als Archiv erhalten.
-- Ab jetzt landen neue Spiele und Turniere automatisch in Season 3.
-- Im Supabase SQL Editor ausfuehren.

-- 1) Sicherstellen, dass die Season-Spalten existieren
ALTER TABLE public.games        ADD COLUMN IF NOT EXISTS season integer NOT NULL DEFAULT 2;
ALTER TABLE public.tournaments  ADD COLUMN IF NOT EXISTS season integer NOT NULL DEFAULT 2;

-- 2) Altdaten absichern (nichts wird geloescht!)
--    Spiele/Turniere ohne Season gehoeren zu Season 1 bzw. 2.
UPDATE public.games       SET season = 1 WHERE season IS NULL;
UPDATE public.tournaments SET season = 2 WHERE season IS NULL;

-- 3) Neue Datensaetze gehoeren ab sofort zu Season 3
ALTER TABLE public.games        ALTER COLUMN season SET DEFAULT 3;
ALTER TABLE public.tournaments  ALTER COLUMN season SET DEFAULT 3;

-- 4) Indizes fuer schnelle Season-Abfragen
CREATE INDEX IF NOT EXISTS games_group_season_idx       ON public.games (group_id, season, date DESC);
CREATE INDEX IF NOT EXISTS tournaments_group_season_idx ON public.tournaments (group_id, season, date DESC);

-- 5) Rebuys pro Spieler speichern (fuer exaktes Turnier-Netto in der All-Time-Tabelle).
--    Bisher wurde nur die Gesamtzahl pro Turnier (tournaments.rebuys_used) abgelegt,
--    dadurch liess sich der Einsatz eines einzelnen Spielers nicht exakt bestimmen.
--    Altdaten bleiben auf 0 -> dort zaehlt nur der Buy-In.
ALTER TABLE public.tournament_results ADD COLUMN IF NOT EXISTS rebuys integer NOT NULL DEFAULT 0;

-- 6) Kontrolle: Verteilung der Datensaetze pro Season
-- SELECT season, count(*) FROM public.games       GROUP BY season ORDER BY season;
-- SELECT season, count(*) FROM public.tournaments GROUP BY season ORDER BY season;

-- 7) Season-2-Champion (bestes Cash-Game-Netto) zur Kontrolle anzeigen:
-- SELECT p.name,
--        sum(coalesce(gp.cash_out,0) - coalesce(gp.buy_in,0)) AS netto
-- FROM public.game_participants gp
-- JOIN public.games   g ON g.id = gp.game_id AND g.season = 2
-- JOIN public.players p ON p.id = gp.player_id
-- GROUP BY p.name
-- ORDER BY netto DESC;



