# Deferred Items — Phase 01

Issues discovered during execution that are out of scope for the discovering plan.
Logged here per the executor's scope-boundary rule.

## Pre-existing TypeScript error in `app/page.tsx`

- **Discovered by:** Plan 02 (anon identification); re-confirmed by Plan 01 (Supabase + Upstash infra)
- **Location:** `app/page.tsx:271:34`
- **Error:** `TS2322: Type '"pro" | "creator" | undefined' is not assignable to type 'Plan'. Type 'undefined' is not assignable to type 'Plan'.`
- **Verified pre-existing:** Yes — `git stash --include-untracked && npx tsc --noEmit` still reports the same error with `lib/anon.ts` removed. Re-verified by Plan 01 with `git stash && npx tsc --noEmit` showing the same error without any Plan 01 files present.
- **Owner:** Plan 05 (auth UI / paywall) most likely candidate — it edits the landing page and pricing flow. Could also be Plan 04 if it widens the `Plan` type.
- **Not fixed by Plan 01 or Plan 02** because: their scope is the infra and `lib/anon.ts` respectively; touching `app/page.tsx` would collide with Plan 05's territory.
- **Impact on Plan 01:** `next build` fails on this error alone. Plan 01's own code compiles cleanly ("Compiled successfully in 1977ms" before TS check runs). Once Plan 05 fixes the pricing-tier types, `next build` will pass.

## Deprecation warning: `middleware.ts` -> `proxy.ts`

- **Discovered by:** Plan 01 during `next build`
- **Warning:** `The "middleware" file convention is deprecated. Please use "proxy" instead.` (Next.js 16.2.9)
- **Why not fixed in Plan 01:** The plan's `<action>` block explicitly specified `middleware.ts` as the file name with that exact matcher. Renaming would also require renaming the exported `middleware` function to `proxy` and re-validating the cookie-refresh contract. Out of scope for an infra plan; this is a Next-15-to-16 migration item.
- **Owner:** A future polish/maintenance plan (Phase 3 polish, or a dedicated upgrade ticket).
- **Impact:** Warning only — `middleware.ts` still works in Next 16.
