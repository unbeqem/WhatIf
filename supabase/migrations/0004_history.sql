-- Phase history (v2): persisted decision history for Pro/Creator.
-- Delivers the "Save your decision history" pricing promise.
-- Run in Supabase SQL editor or via `supabase db push`.

-- ===== simulations ==================================================
create table if not exists public.simulations (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  input       text not null,
  result      jsonb not null,
  summary     text,
  created_at  timestamptz not null default now()
);

create index if not exists simulations_user_created_idx
  on public.simulations (user_id, created_at desc);

-- ===== RLS ==========================================================
alter table public.simulations enable row level security;

-- A user can read their own rows only. No INSERT/UPDATE via anon or
-- authenticated role -- writes go through the service-role admin client
-- (same discipline as simulation_usage).
drop policy if exists "simulations_select_own" on public.simulations;
create policy "simulations_select_own"
  on public.simulations for select
  using (auth.uid() = user_id);

grant select on public.simulations to anon, authenticated;
