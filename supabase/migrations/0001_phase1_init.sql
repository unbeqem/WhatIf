-- Phase 1: profiles + simulation_usage
-- Run in Supabase SQL editor or via `supabase db push`.

create extension if not exists pgcrypto;

-- ===== profiles =====================================================
create type public.plan_tier as enum ('free', 'pro', 'creator');

create table if not exists public.profiles (
  id                  uuid primary key references auth.users(id) on delete cascade,
  plan                public.plan_tier not null default 'free',
  stripe_customer_id  text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- Auto-create a profile row on signup. Idempotent.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id) values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ===== simulation_usage =============================================
create table if not exists public.simulation_usage (
  id              bigserial primary key,
  user_id         uuid references auth.users(id) on delete cascade,
  anon_id         text,
  ip_hash         text not null,
  input_length    int  not null,
  blocked_reason  text,
  created_at      timestamptz not null default now(),
  constraint actor_present check (user_id is not null or anon_id is not null)
);

create index if not exists simulation_usage_user_created_idx
  on public.simulation_usage (user_id, created_at desc)
  where user_id is not null;

create index if not exists simulation_usage_anon_created_idx
  on public.simulation_usage (anon_id, created_at desc)
  where anon_id is not null;

create index if not exists simulation_usage_blocked_idx
  on public.simulation_usage (created_at desc)
  where blocked_reason is not null;

-- ===== RLS ===========================================================
alter table public.profiles enable row level security;
alter table public.simulation_usage enable row level security;

-- Profiles: a user can read their own row only.
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

-- Simulation usage: a user can read their own rows. No INSERT/UPDATE via
-- anon or authenticated role -- writes go through the service-role admin client.
drop policy if exists "usage_select_own" on public.simulation_usage;
create policy "usage_select_own"
  on public.simulation_usage for select
  using (auth.uid() = user_id);

grant select on public.profiles to anon, authenticated;
grant select on public.simulation_usage to anon, authenticated;
