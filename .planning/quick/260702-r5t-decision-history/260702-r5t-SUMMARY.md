---
quick_id: 260702-r5t
slug: decision-history
date: 2026-07-02
status: complete
area: general
commit: 315eb90
---

# Summary — 260702-r5t — Decision history (Pro feature)

Built the "Save your decision history" Pro feature that pricing already
advertised but was never implemented. Every pattern reused from the codebase.

## What changed

- **Migration `supabase/migrations/0004_history.sql`** — new `public.simulations`
  (`id uuid`, `user_id`, `input`, `result jsonb`, `summary`, `created_at`), index
  `(user_id, created_at desc)`, RLS `simulations_select_own`, INSERT via
  service-role only (mirrors `simulation_usage`).
- **`lib/db.types.ts`** — `Json` alias + `simulations` Row/Insert/Update.
- **`lib/history.ts`** (new, server-only) — `saveSimulation()` (skips demo
  results, `summary = most_likely[:280]`, swallows errors like `logUsage`) and
  `listSimulations()` (newest-first, cap 50).
- **`app/api/simulate/route.ts`** — Step 5: after an accepted run, persist for
  pro/creator actors (`actor.plan` already resolved upstream).
- **`app/history/page.tsx`** (new, server, dynamic ƒ) — auth-gate → /login;
  plan-gate: free → "Pro feature" upsell, subscriber+empty → empty state,
  subscriber+rows → list.
- **`components/HistoryEntry.tsx`** (new, "use client") — card (date, question,
  summary); "View" writes `whatif:last` and pushes `/result` (reuses ResultView).
- **`components/AuthNav.tsx`** — "History" link for subscribers.

## Decisions (founder-confirmed)

- Dedicated `/history` page (+ nav link), not an /account section.
- Re-view reuses `/result` via sessionStorage — no separate detail view.

## Verification

- `npx tsc --noEmit` — clean.
- `npm run build` — succeeds; `/history` server-rendered (ƒ).
- `npm test` — 31/31 pass.
- Demo-mode safe: no `supabaseAdmin` → save/list no-op; page renders gated/empty.

## Founder follow-up (manual — REQUIRED for the feature to work in prod)

1. Apply `supabase/migrations/0004_history.sql` in Supabase (SQL editor or
   `supabase db push`) — prod project `zdirwmqfoynxmfifzlvt`.
2. E2E: as a Pro user, run a simulation → open /history → entry appears → View
   reopens the full 3-future result.

Commit: 315eb90. Source todo retired to `.planning/todos/completed/`.
