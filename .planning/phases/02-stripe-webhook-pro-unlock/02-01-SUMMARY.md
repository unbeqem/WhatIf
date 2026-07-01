---
phase: 02-stripe-webhook-pro-unlock
plan: 01
subsystem: payments
tags: [stripe, checkout, supabase, migration, plan-reducer]

# Dependency graph
requires:
  - phase: 01-rate-limiting-user-system
    provides: "profiles table with plan_tier enum + stripe_customer_id column, createSupabaseServerClient() auth pattern"
provides:
  - "Pinned, exported Stripe SDK instance (apiVersion 2024-12-18.acacia) for reuse by webhook + portal routes"
  - "Pure planFromSubscription/planForEvent reducers (network-free, status-based entitlement, no current_period_end reads)"
  - "createPortalSession helper for the Customer Portal"
  - "Checkout session wired to the logged-in user's id + email (PAY-01)"
  - "Migration 0003 (stripe_subscription_id column + customer_id index) + matching db.types"
affects: [02-02-webhook, 02-03-portal-account, 02-04-vitest-unit-tests]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Single exported Stripe instance with explicitly pinned apiVersion, consumed by all Phase 2 routes"
    - "Pure event-to-plan reducer (planForEvent) kept network-free and side-effect-free for unit testing in Plan 04"
    - "Status-based subscription entitlement (active/trialing) instead of date-based (current_period_end) — version-stable across Stripe SDK upgrades"

key-files:
  created:
    - supabase/migrations/0003_phase2_billing.sql
  modified:
    - lib/db.types.ts
    - lib/stripe.ts
    - app/api/stripe/route.ts
    - .env.example

key-decisions:
  - "Pinned Stripe apiVersion to 2024-12-18.acacia (confirmed via node_modules/stripe/types/lib.d.ts LatestApiVersion at execute time) rather than leaving it implicit."
  - "Entitlement is resolved purely from subscription.status (active/trialing vs canceled/unpaid/incomplete_expired) — never from current_period_end, which is version-dependent (Basil moved it to items) and unnecessary for gating."
  - "userId/email for checkout are always derived server-side via auth.getUser(); the request body is never trusted for identity (T-02-04 mitigation)."

patterns-established:
  - "Pattern: any new Stripe-touching route imports the single `stripe` export from lib/stripe.ts rather than constructing its own client."
  - "Pattern: plan-resolution logic lives in pure, exported functions (planFromSubscription, planForEvent) so it's testable without mocking HTTP or the Stripe SDK."

requirements-completed: [PAY-01, PAY-03, PAY-05]

# Metrics
duration: 18min
completed: 2026-07-01
---

# Phase 2 Plan 01: Stripe Foundation + Checkout Wiring Summary

**Pinned+exported Stripe SDK instance, pure status-based plan reducer (planFromSubscription/planForEvent), Customer Portal helper, and auth-wired checkout session — the shared core Plans 02-04 build on.**

## Performance

- **Duration:** 18 min
- **Started:** 2026-07-01T00:00:00Z (approx, session start)
- **Completed:** 2026-07-01
- **Tasks:** 3/3
- **Files modified:** 4 (+1 created)

## Accomplishments
- `lib/stripe.ts` now exports a single Stripe instance pinned to `apiVersion: "2024-12-18.acacia"` (verified against `node_modules/stripe/types/lib.d.ts` `LatestApiVersion` at execute time — matched exactly, no drift from plan assumption).
- Added pure, network-free `planFromSubscription` (amount → tier) and `planForEvent` (event type + subscription → tier to write, or `null`) reducers. Status-based entitlement only — zero reads of `current_period_end`, avoiding the pre-Basil/Basil field-location landmine flagged in research.
- Added `createPortalSession` for PAY-06 (Plan 03 will add the route).
- Extended `createCheckoutSession` to accept `{ userId, email }`, setting `customer_email`, `client_reference_id`, and `subscription_data.metadata` while preserving every existing checkout option (`payment_method_types: ["card"]`, inline `price_data`, success/cancel URLs).
- Wired `app/api/stripe/route.ts` to resolve the logged-in user via `createSupabaseServerClient().auth.getUser()` (mirroring `/api/simulate`'s guarded pattern) and forward id + email into checkout — userId is never read from the request body (T-02-04).
- Added migration `0003_phase2_billing.sql` (idempotent `stripe_subscription_id` column + partial index on `stripe_customer_id`) and extended `lib/db.types.ts` profiles Row/Insert/Update to match.
- Documented `STRIPE_WEBHOOK_SECRET` in `.env.example` for Plan 02.

## Task Commits

1. **Task 1: Migration 0003 + db.types for stripe_subscription_id** - `801a7aa` (feat)
2. **Task 2: Refactor lib/stripe.ts — pin+export instance, pure reducer, portal + checkout helpers** - `f4eca5b` (feat)
3. **Task 3: Wire checkout route to the logged-in user (PAY-01) + env.example** - `408df6a` (feat)

**Plan metadata:** (this commit, following SUMMARY.md write)

## Files Created/Modified
- `supabase/migrations/0003_phase2_billing.sql` - Adds `stripe_subscription_id` column + `profiles_stripe_customer_idx` partial index; no RLS changes (plan writes stay service-role only).
- `lib/db.types.ts` - `profiles` Row/Insert/Update all carry `stripe_subscription_id: string | null`.
- `lib/stripe.ts` - Pinned+exported `stripe` instance; extended `createCheckoutSession`; added `planFromSubscription`, `planForEvent`, `createPortalSession`, `PlanTier` type.
- `app/api/stripe/route.ts` - Resolves `userId`/`email` from `auth.getUser()` (guarded by `NEXT_PUBLIC_SUPABASE_URL` presence for demo mode) and forwards them to `createCheckoutSession`.
- `.env.example` - Added `STRIPE_WEBHOOK_SECRET=` under the Stripe section.

## Decisions Made
- Confirmed `apiVersion` string via `grep LatestApiVersion node_modules/stripe/types/lib.d.ts` before writing the constructor call — matched the plan's assumed `2024-12-18.acacia` exactly, no adjustment needed.
- Kept the amount-based tier mapping (`>=900 → creator`, else `pro`) tied to the existing `PLANS` config rather than introducing Stripe Price IDs — consistent with research's recommendation for a 2-tier launch with zero dashboard config.
- Did not touch `components/AuthNav.tsx` (shown modified in git status at session start but unrelated to this plan's file list) — left untouched per scope boundary; working tree showed no diff for it after this plan's commits.

## Deviations from Plan

None - plan executed exactly as written. All acceptance criteria grep checks, `tsc --noEmit`, and `npm run build` passed without needing any Rule 1-3 fixes.

## Issues Encountered
None.

## User Setup Required

None for this plan specifically. Reminder (unchanged from STATE.md/research): Plan 02 (webhook) needs `STRIPE_WEBHOOK_SECRET` from `stripe listen --forward-to localhost:3000/api/stripe/webhook`; Plan 03 (portal) needs the founder to save Customer Portal settings once in the Stripe test dashboard. Migration `0003_phase2_billing.sql` needs to be applied by the founder via Supabase SQL editor or `supabase db push` — not attempted here per plan constraint.

## Next Phase Readiness
- `lib/stripe.ts` now exposes everything Plans 02 (webhook), 03 (portal route), and 04 (unit tests) need to import: `stripe`, `stripeIsLive`, `Plan`, `PlanTier`, `createCheckoutSession`, `planFromSubscription`, `planForEvent`, `createPortalSession`.
- No blockers. Wave 2 (02-02/03/04) can proceed in parallel as planned.
- Migration 0003 is written but not yet applied to the live Supabase instance — founder action, non-blocking for continued code work since `lib/db.types.ts` already reflects the target schema.

---
*Phase: 02-stripe-webhook-pro-unlock*
*Completed: 2026-07-01*

## Self-Check: PASSED

All created/modified files verified present on disk; all 4 commits (801a7aa, f4eca5b, 408df6a, 9d6e578) verified present in git log.
