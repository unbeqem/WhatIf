---
plan_id: 02-05
type: gap-closure
date: 2026-07-01
status: complete
commit: eb5fc20
---

# 02-05 (gap-closure): Plan-aware UI — SUMMARY

## Origin
Founder-caught gap during the Phase 2 E2E checkpoint: the webhook flipped
`profiles.plan` server-side (PAY-02/03 working), but client surfaces never read
the plan, so a Pro user still saw the "Try free" nav CTA and the "Unlock Pro"
upsell on `/result`. `/account` was already plan-aware (read plan server-side);
the rest of the UI was not.

## What changed
- **`app/api/me/route.ts`** (new) — `GET /api/me` → `{ configured, authenticated, email, plan }`, reads `profiles.plan` via the service-role client. Demo-safe (returns `configured:false` when Supabase env is absent).
- **`lib/useMe.ts`** (new) — `useMe()` client hook (fetches `/api/me` once on mount, returns `undefined` while loading) + `isSubscriberPlan()`.
- **`components/AuthNav.tsx`** — now takes a `me` prop; renders a `Pro`/`Creator` badge next to the email.
- **`components/Nav.tsx`** — calls `useMe()`, passes it to AuthNav, and switches the CTA from "Try free" → "New simulation" for authenticated users.
- **`components/ResultView.tsx`** — hides the Unlock-Pro upsell for subscribers; stays hidden while `me` loads so Pro users never see a flash.

## Verification
`npx tsc --noEmit` clean, `npm run build` green (`/api/me` registered), founder
confirmed live: Pro badge shows, CTA reads "New simulation", result-page upsell
gone. Free users still see the upsell (default while loading is "hidden", then
appears once plan resolves).

## Note
`/api/simulate` and `/account` were already correct — no change. This closes the
client-side reflection gap only.
