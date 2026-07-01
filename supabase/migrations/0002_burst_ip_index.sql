-- Phase 1 (quick task 260701-01): index for the Postgres-backed per-IP burst guard.
-- checkBurst() in lib/ratelimit.ts counts simulation_usage rows by ip_hash within
-- a rolling 60s window; this index keeps that windowed count off a seq scan.
-- Run in the Supabase SQL editor or via `supabase db push`.

create index if not exists simulation_usage_ip_created_idx
  on public.simulation_usage (ip_hash, created_at desc);
