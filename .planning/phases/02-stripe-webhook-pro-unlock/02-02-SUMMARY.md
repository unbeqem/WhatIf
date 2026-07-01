---
phase: 02-stripe-webhook-pro-unlock
plan: 02
subsystem: payments
tags: [stripe, webhook, supabase, plan-reducer, idempotency]

# Dependency graph
requires:
  - phase: 02-stripe-webhook-pro-unlock
    plan: 01
    provides: "Pinned stripe instance, pure planForEvent/planFromSubscription reducers, supabaseAdmin, migration 0003 (stripe_subscription_id column)"
provides:
  - "Signature-verified /api/stripe/webhook route — the only authoritative writer of profiles.plan"
  - "Idempotent plan-flip on checkout.session.completed, customer.subscription.updated, customer.subscription.deleted"
affects: [02-03-portal-account, 02-04-vitest-unit-tests, phase-2-verification]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Webhook route delegates 100% of tier logic to the pure planForEvent reducer from Plan 02-01 — route file contains zero inline entitlement math"
    - "Raw-body-first: await req.text() captured before any parsing, passed untouched to stripe.webhooks.constructEventAsync — signature verification happens before any Supabase write"
    - "Handler errors caught and answered with 200 (logged, not thrown) so a bug in our code doesn't trigger Stripe retry storms — the retry-storm accept-risk disposition from the plan's threat model (T-02-05)"

key-files:
  created:
    - app/api/stripe/webhook/route.ts
  modified: []

key-decisions:
  - "Subscription events (customer.subscription.updated/.deleted) resolve the user via .eq('stripe_customer_id', sub.customer) rather than client_reference_id, because Stripe never copies client_reference_id onto the Subscription object (Pitfall 3 from research) — this only works because checkout.session.completed persists stripe_customer_id on the first event."
  - "Handler errors return 200 { received:true, handled:false } instead of 500 — deliberate accept-risk per the plan's threat model (T-02-05) to avoid Stripe hammering retries on our own bugs; logged via console.error for inspection."
  - "No inline amount comparisons (e.g. >=900) in the route — all tier resolution funnels through planForEvent, keeping the entitlement logic unit-testable in Plan 02-04 without mocking HTTP."

patterns-established:
  - "Pattern: any future webhook-style route (raw body + signature) mirrors this structure — demo-guard first, signature verify second, business logic delegated to pure lib functions third."

requirements-completed: [PAY-02]

# Metrics
duration: 12min
completed: 2026-07-01
---

# Phase 2 Plan 02: Stripe Webhook + Pro-Unlock Flow Summary

**Signature-verified `/api/stripe/webhook` (nodejs runtime, raw-body `constructEventAsync`) that idempotently mirrors Stripe subscription state into `profiles.plan` via the pure `planForEvent` reducer from Plan 02-01 — closing the money-to-entitlement loop.**

## Performance

- **Duration:** ~12 min
- **Completed:** 2026-07-01
- **Tasks:** 1/1
- **Files modified:** 1 created

## Accomplishments

- Created `app/api/stripe/webhook/route.ts` (`runtime="nodejs"`, `dynamic="force-dynamic"`) that:
  - No-ops with `200 { received:true, demo:true }` when `stripe` is null or `STRIPE_WEBHOOK_SECRET` is unset — demo mode preserved (verified: `.env.local` currently has `STRIPE_SECRET_KEY=` empty and no `STRIPE_WEBHOOK_SECRET`, so this guard is presently the live path).
  - Rejects missing `stripe-signature` header and bad signatures with `400`, verifying the **raw** body (`await req.text()`, never `req.json()`) via `stripe.webhooks.constructEventAsync` before any Supabase write.
  - `checkout.session.completed`: reads `client_reference_id` (userId), `customer`, `subscription`; retrieves the subscription; runs it through `planForEvent`; writes `plan` + `stripe_customer_id` + `stripe_subscription_id` onto the matching `profiles.id` row.
  - `customer.subscription.updated` / `customer.subscription.deleted`: run the event straight through `planForEvent` and write `plan` keyed by `stripe_customer_id` (subscription events never carry `client_reference_id` — Pitfall 3 from research).
  - Unknown event types fall through the `switch` default and still return `200 { received:true }`.
  - Handler errors are caught, logged, and answered with `200` (never `500`) to avoid Stripe retry storms on our own bugs (threat T-02-05, accept disposition).
- All tier/entitlement logic is delegated to the pure `planForEvent`/`planFromSubscription` reducers already shipped in Plan 02-01 — this route contains no inline amount comparisons and never reads `current_period_end` (Pitfall 1 avoided; status-based entitlement only).
- **PAY-04 confirmed already satisfied, no code change**: `lib/quota.ts:49` — `if (actor.kind === "user" && (actor.plan === "pro" || actor.plan === "creator")) { return { allowed: true, actor }; }` — bypasses the daily cap for both paid tiers. This plan's only remaining job for PAY-04 was ensuring the webhook writes `plan` correctly, which is now done.

## Task Commits

1. **Task 1: Signature-verified webhook route with 3-event plan flip** - `0eac0b9` (feat)

**Plan metadata:** (this commit, following SUMMARY.md write)

## Files Created/Modified

- `app/api/stripe/webhook/route.ts` - New route: raw-body signature verification, 3-event switch, idempotent `profiles.plan` writes via the pure `planForEvent` reducer, demo-mode guard, error-swallowing to avoid retry storms.

## Acceptance Criteria Verification

All grep-based acceptance criteria from the plan passed:
- `export const runtime = "nodejs"` present exactly once.
- `constructEventAsync` present exactly once.
- `await req.text()` present exactly once; the only other match for the substring `req.json()` is inside a code comment (`// RAW body — never req.json() (breaks signature)`), not an actual call — confirmed via `grep -n`.
- All three event-type strings (`checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`) present exactly once each.
- `planForEvent(` called twice (once per event branch); zero occurrences of `900` (no inline amount comparison) and zero occurrences of `current_period_end`.
- Demo-mode string `received: true, demo: true` present once, guarded by `if (!stripe || !webhookSecret)`.
- `status: 400` appears twice (missing-signature path + bad-signature path).
- `npx tsc --noEmit` exits clean; `npm run build` succeeds — route appears in the build's route table as `ƒ /api/stripe/webhook`.

## Decisions Made

- Kept the route's structure identical to the plan's baked-in reference implementation — no deviation was needed since Plan 02-01 already shipped every interface (`stripe`, `planForEvent`, `supabaseAdmin`) exactly as specified.
- Did not touch `components/AuthNav.tsx` (unrelated pre-existing working-tree diff noted in session start git status, same as Plan 02-01's note) — out of this plan's file scope.

## Deviations from Plan

None - plan executed exactly as written. All acceptance criteria grep checks, `tsc --noEmit`, and `npm run build` passed without needing any Rule 1-3 fixes.

## Issues Encountered

None.

## Threat Flags

None — the route implements exactly the trust boundary and mitigations described in the plan's `<threat_model>` (T-02-01 signature verification, T-02-02 idempotent replay-safety, T-02-03 service-role-only writes, T-02-05 accept-risk on handler-error retries). No new network surface, auth path, or schema change was introduced beyond what the plan's threat register already covers.

## Known Stubs

None. The route is fully wired — no hardcoded/mocked plan values, no placeholder branches.

## User Setup Required

Unchanged from Plan 02-01/STATE.md: the founder still needs to (a) apply migration `0003_phase2_billing.sql` to the live Supabase instance, and (b) run `stripe listen --forward-to localhost:3000/api/stripe/webhook` to obtain a `STRIPE_WEBHOOK_SECRET` for `.env.local` before the live E2E (Stripe CLI trigger / real 4242 test payment) can be exercised. Both are pre-existing, non-blocking founder actions — not attempted by this executor per plan constraint (no live Stripe/Supabase credentials were available in this session; `.env.local` has `STRIPE_SECRET_KEY=` empty and no `STRIPE_WEBHOOK_SECRET` set, confirming demo mode is the currently active path and was the mode exercised for verification).

## Next Phase Readiness

- `/api/stripe/webhook` is live and demo-safe; Plan 02-03 (portal + account page) and Plan 02-04 (vitest unit tests on `planForEvent`/`planFromSubscription`) have no new dependency on this plan beyond what 02-01 already provided.
- No blockers for Wave 2 completion. Full live E2E (Stripe CLI `stripe trigger` + a real test-mode checkout flipping a profile row to `pro`/`creator`, then `stripe trigger customer.subscription.deleted` flipping it back to `free`) remains a founder-run manual step once `STRIPE_WEBHOOK_SECRET` is set locally — flagged in STATE.md Todos, not blocking code completeness.

---
*Phase: 02-stripe-webhook-pro-unlock*
*Completed: 2026-07-01*

## Self-Check: PASSED

All created files verified present on disk (`app/api/stripe/webhook/route.ts`, this SUMMARY.md); commit `0eac0b9` verified present in git log.
