-- Poker Royal · Supabase Schema
-- Run in Supabase SQL Editor

create table if not exists public.groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_id uuid not null references auth.users on delete cascade,
  invite_code text not null unique default encode(gen_random_bytes(4), 'hex'),
  created_at timestamptz default now()
);

create table if not exists public.group_members (
  group_id uuid not null references public.groups on delete cascade,
  user_id uuid not null references auth.users on delete cascade,
  joined_at timestamptz default now(),
  primary key (group_id, user_id)
);

create table if not exists public.players (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups on delete cascade,
  name text not null,
  phone text,
  created_at timestamptz default now()
);

create table if not exists public.games (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups on delete cascade,
  date date not null,
  location text,
  phase text not null default 'playing',
  created_at timestamptz default now()
);

create table if not exists public.game_participants (
  game_id uuid not null references public.games on delete cascade,
  player_id uuid not null references public.players on delete cascade,
  buy_in numeric not null default 0,
  cash_out numeric,
  primary key (game_id, player_id)
);

create or replace function public.is_group_member(gid uuid)
returns boolean language sql security definer stable
as $$ select exists (select 1 from public.group_members where group_id = gid and user_id = auth.uid()); $$;

alter table public.groups enable row level security;
alter table public.group_members enable row level security;
alter table public.players enable row level security;
alter table public.games enable row level security;
alter table public.game_participants enable row level security;

create policy groups_select on public.groups for select using (public.is_group_member(id));
create policy groups_insert on public.groups for insert with check (owner_id = auth.uid());
create policy groups_update on public.groups for update using (owner_id = auth.uid());
create policy groups_delete on public.groups for delete using (owner_id = auth.uid());

create policy gm_select on public.group_members for select
  using (user_id = auth.uid() or public.is_group_member(group_id));
create policy gm_insert on public.group_members for insert with check (user_id = auth.uid());
create policy gm_delete on public.group_members for delete using (user_id = auth.uid());

create policy players_all on public.players for all using (public.is_group_member(group_id));
create policy games_all on public.games for all using (public.is_group_member(group_id));
create policy gp_all on public.game_participants for all using (
  exists (select 1 from public.games g where g.id = game_id and public.is_group_member(g.group_id))
);

create or replace function public.add_owner_as_member()
returns trigger language plpgsql security definer as $$
begin
  insert into public.group_members (group_id, user_id) values (new.id, new.owner_id);
  return new;
end; $$;

drop trigger if exists on_group_created on public.groups;
create trigger on_group_created after insert on public.groups
  for each row execute function public.add_owner_as_member();

create or replace function public.join_group_by_code(code text)
returns uuid language plpgsql security definer as $$
declare gid uuid;
begin
  select id into gid from public.groups where invite_code = code;
  if gid is null then raise exception 'Ungültiger Code'; end if;
  insert into public.group_members (group_id, user_id) values (gid, auth.uid()) on conflict do nothing;
  return gid;
end; $$;
