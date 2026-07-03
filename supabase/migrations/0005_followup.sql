-- Follow-up loop: 30-day "what actually happened?" re-engagement email.
-- Tracks whether a follow-up has been sent for a simulation, and captures the
-- user's optional response for accuracy data / testimonials.
-- Run in Supabase SQL editor or via `supabase db push`.

alter table public.simulations
  add column if not exists follow_up_sent_at timestamptz,
  add column if not exists follow_up_response text;

-- Partial index for the cron sweep: find aged simulations that still need a follow-up.
create index if not exists simulations_followup_pending_idx
  on public.simulations (created_at)
  where follow_up_sent_at is null;
