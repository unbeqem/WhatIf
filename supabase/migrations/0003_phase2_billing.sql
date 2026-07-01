-- Phase 2: billing — persist subscription id so subscription.* events resolve the user.
-- Run in Supabase SQL editor or via `supabase db push`.
alter table public.profiles
  add column if not exists stripe_subscription_id text;

create index if not exists profiles_stripe_customer_idx
  on public.profiles (stripe_customer_id)
  where stripe_customer_id is not null;
-- No new RLS policy: plan writes stay service-role only (webhook). SELECT-own already exists.
