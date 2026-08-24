-- Poker Royal · Migration: Tournaments
-- Adds tournament persistence with rankings and prize amounts.
-- Run in Supabase SQL Editor.

create table if not exists public.tournaments (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups on delete cascade,
  name text not null,
  location text,
  date date not null,
  buy_in numeric not null default 0,
  rebuy_amount numeric not null default 0,
  max_rebuys integer not null default 0,
  player_count integer not null default 0,
  rebuys_used integer not null default 0,
  total_pot numeric not null default 0,
  season integer not null default 2,
  created_at timestamptz default now(),
  created_by uuid references auth.users on delete set null
);

create index if not exists tournaments_group_date_idx on public.tournaments (group_id, date desc);

create table if not exists public.tournament_results (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.tournaments on delete cascade,
  rank integer not null,
  player_id uuid references public.players on delete set null,
  player_name text not null,
  prize_amount numeric not null default 0,
  created_at timestamptz default now()
);

create index if not exists tournament_results_tid_idx on public.tournament_results (tournament_id, rank);

alter table public.tournaments enable row level security;
alter table public.tournament_results enable row level security;

drop policy if exists tournaments_all on public.tournaments;
create policy tournaments_all on public.tournaments for all
  using (public.is_group_member(group_id))
  with check (public.is_group_member(group_id));

drop policy if exists tournament_results_all on public.tournament_results;
create policy tournament_results_all on public.tournament_results for all
  using (
    exists (select 1 from public.tournaments t
            where t.id = tournament_id and public.is_group_member(t.group_id))
  )
  with check (
    exists (select 1 from public.tournaments t
            where t.id = tournament_id and public.is_group_member(t.group_id))
  );

