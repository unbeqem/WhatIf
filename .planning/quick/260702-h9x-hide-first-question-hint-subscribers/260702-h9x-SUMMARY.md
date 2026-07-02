---
quick_id: 260702-h9x
slug: hide-first-question-hint-subscribers
date: 2026-07-02
status: complete
area: ui
commit: 12fa37a
---

# Summary — 260702-h9x — Hide "first question" hint for subscribers

## What changed

The landing page final CTA was "first question"-framed for everyone. Made it
plan-aware by extracting the paragraph + button into a new client component
`components/FinalCta.tsx` (mirrors the existing `components/PricingCta.tsx`
pattern — `useMe()` + `isSubscriberPlan()`), and replacing the inline markup in
`app/page.tsx` with `<FinalCta />`.

- **Returning subscriber** (pro/creator **and** `sessionStorage["whatif:last"]`
  present): copy becomes "Run another simulation" and drops the "The first one
  is free." line.
- **Anon / free / loading window**: unchanged — "Start your first simulation" +
  "The first one is free." (graceful default while `me === undefined`, no flash).

## Files

- `components/FinalCta.tsx` (new, "use client")
- `app/page.tsx` (import + replaced inline final-CTA markup)

## Verification

- `npx tsc --noEmit` — clean.
- `npm run build` — succeeds; `/` still prerendered static (○).

## Notes

Scope kept to the bottom final CTA (the hint the todo describes). The hero CTA
("Simulate my first decision") and the "€0 to try your first" counter are also
"first"-framed but were out of scope — could be a follow-up if the same
plan-aware treatment is wanted there.

Commit: 12fa37a. Source todo retired to `.planning/todos/completed/`.
