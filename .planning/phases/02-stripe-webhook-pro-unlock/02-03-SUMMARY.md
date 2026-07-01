---
phase: 02-stripe-webhook-pro-unlock
plan: 03
subsystem: payments
tags: [stripe, customer-portal, supabase, nextjs, account-page]

# Dependency graph
requires:
  - phase: 02-stripe-webhook-pro-unlock
    provides: "lib/stripe.ts createPortalSession helper + pinned Stripe instance (Plan 02-01); profiles.plan/stripe_customer_id schema (migration 0003)"
provides:
  - "Authenticated, IDOR-safe /api/stripe/portal route resolving the caller's own stripe_customer_id"
  - "/account page: server-rendered plan + email surface with subscriber/free-user branching"
  - "Colocated ManageSubscriptionButton client module (separate from the server page)"
  - "AuthNav /account link for logged-in users"
affects: [02-verify, phase-2-founder-checkpoint]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Interactive island pattern: server page (app/account/page.tsx) stays free of \"use client\" by colocating the one interactive control in its own client module, avoiding illegal import of server-only code into a client bundle"
    - "Portal/checkout routes never accept a client-supplied customer/user id — identity always resolved server-side via auth.getUser() then the caller's own profiles row (T-02-08 IDOR mitigation, consistent with Plan 02-01's checkout wiring)"

key-files:
  created:
    - app/api/stripe/portal/route.ts
    - app/account/page.tsx
    - app/account/ManageSubscriptionButton.tsx
  modified:
    - components/AuthNav.tsx

key-decisions:
  - "Subscriber detection uses plan === 'pro' || plan === 'creator' || stripe_customer_id present (not plan alone), so a user whose profile has a customer id but plan hasn't synced yet still sees the portal button instead of being funneled back into checkout."
  - "AuthNav's existing email pill was converted into the /account link (wrapping the same pill classes in a Link) rather than adding a second nav element, per the plan's instruction to reuse pill styling and keep the restyled markup intact."

patterns-established:
  - "Pattern: any authenticated Stripe-touching route (checkout, portal, future ones) resolves identity via auth.getUser() -> own profiles row; the request body is never a source of identity or Stripe customer id."

requirements-completed: [PAY-06]

# Metrics
duration: 25min
completed: 2026-07-01
---

# Phase 2 Plan 03: Stripe Customer Portal + /account Page Summary

**Authenticated /api/stripe/portal route (IDOR-safe, demo-safe) feeding a server-rendered /account page that shows plan + email and branches between a colocated "use client" Manage-subscription button and free-tier upgrade CTAs; AuthNav's email pill now links to /account.**

## Performance

- **Duration:** 25 min
- **Started:** 2026-07-01 (session continuation from Plan 02-04)
- **Completed:** 2026-07-01
- **Tasks:** 2/2 code tasks complete; Task 3 (founder E2E checkpoint) pending — see Checkpoint below
- **Files modified:** 4 (3 created, 1 modified)

## Accomplishments
- `app/api/stripe/portal/route.ts`: resolves the logged-in user via `auth.getUser()`, reads `stripe_customer_id` from the caller's OWN `profiles` row (never from the request body — T-02-08 IDOR mitigation), and calls `createPortalSession`. No-customer case redirects to `/#pricing` instead of calling Stripe; keyless/demo mode returns `{ demo: true, url: "/account?portal=demo" }` instead of a 500.
- `app/account/page.tsx`: SERVER component (zero `"use client"`) — redirects unauthenticated visitors to `/login`, reads `plan` + `stripe_customer_id` via `supabaseAdmin`, renders email + a plan badge (Free/Pro/Creator), and branches: subscribers get `<ManageSubscriptionButton />`, free users get the existing `<UpgradeButton plan="pro"|"creator">` CTAs.
- `app/account/ManageSubscriptionButton.tsx`: its own `"use client"` module — `fetch("/api/stripe/portal", { method: "POST" })`, redirects to `data.url`, shows a demo-mode notice if `data.demo` is set, styled with the existing violet-to-magenta gradient CTA classes (matching `UpgradeButton`'s look).
- `components/AuthNav.tsx`: the existing email pill (`<span>` with the violet status dot) is now a `<Link href="/account">` with the same classes plus hover states — preserves the recent restyle, adds no new nav element, keeps the `isSupabaseConfigured`/hydration guards untouched.

## Task Commits

Each task was committed atomically:

1. **Task 1: Portal route — authenticated Customer Portal session (PAY-06)** - `72cdda4` (feat)
2. **Task 2: /account page + colocated Manage-subscription client button + AuthNav link** - `0f4e7e6` (feat)

**Plan metadata:** (this commit, following SUMMARY.md write)

## Files Created/Modified
- `app/api/stripe/portal/route.ts` - Authenticated, IDOR-safe portal-session route; demo-mode and no-customer fallbacks.
- `app/account/page.tsx` - Server-rendered account surface: email, plan badge, subscriber/free-user branch.
- `app/account/ManageSubscriptionButton.tsx` - Colocated `"use client"` button that opens the Stripe Customer Portal.
- `components/AuthNav.tsx` - Email pill is now a link to `/account`; logout button and all existing guards unchanged.

## Decisions Made
- Subscriber detection checks `plan` OR `stripe_customer_id` (not `plan` alone) to avoid stranding a user in a checkout loop if their profile's customer id landed before a plan-sync webhook.
- Reused `UpgradeButton`'s existing gradient CTA class string verbatim in `ManageSubscriptionButton` for visual consistency between the two "primary payment action" buttons on the site (checkout vs. portal), rather than inventing a new visual variant.
- Did not touch `middleware`/route protection beyond the page-level `redirect("/login")` — `/account` has no separate proxy-level guard, consistent with how `/decision` and other authenticated-but-not-gated pages behave in this codebase today (out of scope for PAY-06).

## Deviations from Plan

None - plan executed exactly as written. All Task 1 and Task 2 acceptance-criteria grep checks passed on the first attempt; `npx tsc --noEmit` and `npm run build` were both clean after each task, no Rule 1-3 fixes needed.

## Issues Encountered
None.

## User Setup Required

**This plan cannot be marked fully verified without founder action — see the Checkpoint below.** Summary:
- Stripe test-mode Customer Portal settings must be saved once (Settings → Billing → Customer portal → Save) before `createPortalSession` will succeed in test mode; without it, the portal call throws and the founder will see an error instead of the Stripe-hosted page.
- Migration `0003_phase2_billing.sql` (from Plan 02-01) still needs applying to the live Supabase instance — `/account`'s plan/customer-id read depends on the `stripe_subscription_id` column existing, though the page degrades gracefully (falls back to `plan: "free"`) if the column read fails to resolve profile data at all it would surface as a Supabase query error in demo-mode-off, real-Supabase-on configurations. Recommend applying before the E2E pass.

## Next Phase Readiness
- Code for PAY-06 is complete and committed: portal route, /account page, colocated client button, AuthNav link.
- `npx tsc --noEmit` and `npm run build` both pass with zero errors; `/account` and `/api/stripe/portal` both appear in the Next.js build route list as dynamic (`ƒ`) routes.
- `app/account/page.tsx` confirmed to have ZERO `"use client"` occurrences; `app/account/ManageSubscriptionButton.tsx` confirmed to have exactly one, as the first line.
- Founder E2E verification (Stripe test-dashboard portal-settings save, `stripe listen`, migration 0003 apply, live checkout → portal → cancel round-trip) is the one remaining gate before Phase 2 can be marked verified — see checkpoint returned to the orchestrator.

---
*Phase: 02-stripe-webhook-pro-unlock*
*Completed: 2026-07-01*

## Self-Check: PASSED

All created files verified present on disk (app/api/stripe/portal/route.ts, app/account/page.tsx, app/account/ManageSubscriptionButton.tsx); components/AuthNav.tsx modification verified via git diff. Both commits (72cdda4, 0f4e7e6) verified present in git log.
