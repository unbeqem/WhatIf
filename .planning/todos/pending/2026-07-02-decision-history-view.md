---
created: 2026-07-02T14:09:51.601Z
title: Decision history with per-entry summary (Pro feature)
area: general
files:
  - app/api/simulate/route.ts
  - lib/supabase/admin.ts
---

## Problem

The pricing page already advertises "Save your decision history" as a Pro feature, but it isn't built. Users can't see the questions/decisions they've asked before. Currently the result only lives in `sessionStorage["whatif:last"]` and fades on tab close (intentional for the free upgrade nudge) — for Pro/Creator we want real persisted history.

## Solution

TBD. Likely: a Supabase table (e.g. `simulations`: id, user_id, input, result jsonb, created_at) written from `app/api/simulate/route.ts` for authenticated Pro+ users; a history view (new `/history` page or a section on `/account`) listing past questions with a short summary per entry (reuse the model's `most_likely`/`recommendation`, or store a generated one-liner). Gate to Pro/Creator (plan-aware, reuse useMe/isSubscriberPlan). Needs a migration + RLS so users only read their own rows.

_Backlog / v2 (post current milestone). This is a real advertised-but-unbuilt Pro feature._
