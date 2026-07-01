# STATE: WhatIf

**Last updated:** 2026-07-01
**Updated by:** gsd-execute-phase 2 — Plan 02-03 code executed, founder E2E checkpoint pending

## Project Reference

**Project:** WhatIf — AI decision-simulation SaaS
**Milestone:** v1-production-launch
**Core Value:** A user must be able to type a decision, get a sober three-future simulation in seconds, hit a soft paywall, and pay — without friction.
**Current focus:** Phase 2 code-complete (all 4 plans). Founder E2E checkpoint for 02-03 (Customer Portal) is the only remaining gate before Phase 2 is verified.

## Current Position

**Phase:** 2 — Stripe Webhook + Pro-Unlock Flow (all plans code-complete; founder E2E verification pending)
**Plan:** 02-03 CODE COMPLETE (2/2 auto tasks). Task 3 (founder checkpoint: human-verify) awaiting founder action — see Todos.
**Status:** 02-03 executed — `/api/stripe/portal` (authenticated, IDOR-safe, demo-safe), `/account` server page (email + plan + subscriber/free branch), colocated `ManageSubscriptionButton` client module, AuthNav `/account` link. tsc clean, `npm run build` green, all acceptance-criteria greps passed on first attempt, zero deviations. Phase 2 is now code-complete end-to-end (02-01/02/03/04 all done); the founder must still complete the Stripe test-dashboard Customer Portal save + the full E2E pay→portal→cancel walk before Phase 2 can be marked verified.
**Progress:** 1/4 phases complete; Phase 2 code-complete, founder E2E pending (4/4 plans code-done)

```
[███████████░░░░░░░░░] 41% (Phase 1 done · 17/29 v1 requirements delivered · Phase 2 code-complete, founder E2E pending)
```

**Phase 2 plans (.planning/phases/02-stripe-webhook-pro-unlock/):**
- 02-01 (Wave 1) — DONE. Foundation: migration 0003 (`stripe_subscription_id`) + db.types, `lib/stripe.ts` refactor (pinned apiVersion, pure reducer, portal helper), checkout wiring [PAY-01, PAY-03, PAY-05]. Commits: 801a7aa, f4eca5b, 408df6a, summary 9d6e578.
- 02-02 (Wave 2) — DONE. `/api/stripe/webhook`: raw-body signature verify + idempotent plan flip on 3 events [PAY-02, PAY-03, PAY-04, PAY-05]. Commit: 0eac0b9.
- 02-03 (Wave 2) — CODE COMPLETE. `/api/stripe/portal` + `/account` page + ManageSubscriptionButton + AuthNav link [PAY-06]. Commits: 72cdda4, 0f4e7e6. Founder E2E checkpoint pending (Stripe test-dashboard Customer Portal save + live pay→portal→cancel walk).
- 02-04 (Wave 2) — DONE. vitest setup + pure reducer unit tests [PAY-03, PAY-05]. Commits: 1be0117, 4b84bd7.

**Verify checklist (Plan 05 Task 3):**
- [x] 1-4 Signup → email confirm → land on `/?confirmed=1` (W4 Set-Cookie ✓)
- [x] 5-7 Logout → Login → Refresh session survives (AUTH-03)
- [x] 8-9 Anon paywall in Incognito (USAGE-01, USAGE-04)
- [x] 10-11 Free-tier paywall logged in, DB row with user_id confirmed (USAGE-02)
- [x] 12 Burst guard 5/min — DONE via quick task 260701-01. Re-backed on Supabase Postgres (Upstash dashboard unreachable). Verified: 6th rapid request from one IP → `rate_limited` 429.
- [x] 13-14 Input validation 5/1600 chars (ABUSE-02)
- [x] 15 Abuse log visible in Supabase with blocked_reason vocabulary (ABUSE-03)
- [x] 16-19 Password reset — FIXED. Root cause: PKCE code_verifier lost on cross-origin email redirect. `/auth/confirm` supports OTP `token_hash` (commit 97996f4); Supabase email templates switched to `{{ .TokenHash }}` links; Resend custom SMTP configured (escapes the 3-emails/h built-in cap). Verified end-to-end with tristank2005@web.de.
- [x] 20-21 Demo-mode regression check — PASS. Keyless run (Supabase/Upstash/OpenAI/Stripe off): `/api/simulate` returns demo simulation, `/api/stripe` returns demo checkout, input validation still enforced. .env.local restored.

**Phase 1 commits:**
- f96263d — Plan 01 Supabase + Upstash infra
- 491bb44 — Plan 02 lib/anon.ts
- f107f2d — Plan 03 6 auth routes + validator
- cc3250e — Plan 04 gated /api/simulate
- 5a6e02e — Plan 05 auth UI + paywall (Task 1+2)
- 97996f4 — fix: /auth/confirm supports OTP + PKCE (found during verify)
- (Task 3 founder checkpoint: PARTIAL ~70% done)

**To resume:**
1. All Phase 2 code is complete (02-01 through 02-04). Remaining: founder E2E checkpoint for 02-03 (Customer Portal round-trip) — see Todos below for the exact steps.
2. Founder prep for Phase 2 verification: create Stripe test-mode products/prices (€5 Pro, €9 Creator) if using price IDs, run `stripe listen --forward-to localhost:3000/api/stripe/webhook` to get `STRIPE_WEBHOOK_SECRET`, save Customer Portal settings once in the Stripe test dashboard (PAY-06 prerequisite, hard blocker for portal to open), apply migration `0003_phase2_billing.sql`, then E2E: sign in → `/account` → Unlock → test-mode pay → confirm plan flips → Manage subscription (portal) → `stripe trigger customer.subscription.deleted` → confirm downgrade.
3. Backlog (Phase 4): register the WhatIf product domain (co-orga is the employer, not owned) for prod Site URL + Resend domain verification + Stripe.

**Phase 1 — DONE (2026-07-01):** 5 plans executed + verified 21/21. Migration 0002 (burst ip index) applied. @upstash deps removed. Quick task 260701-01 swapped burst guard to Postgres.

**Test user details:**
- Supabase project: `zdirwmqfoynxmfifzlvt` (EU)
- Signed-up user uuid: `8e36b3a9-8ad3-43f0-8df3-4aa481a3574a` (plan='free')
- Test email used by founder: not shared in chat (used some external test address)
- `.env.local` configured with Supabase keys + ANON_COOKIE_SECRET; Upstash + OpenAI still empty (demo modes active for both).

## Performance Metrics

| Metric | Value |
|--------|-------|
| v1 requirements total | 29 |
| Requirements delivered | 17 |
| Phases planned | 4 |
| Phases complete | 1 (Phase 2 code-complete, founder E2E pending) |
| Plans complete | 4 (02-01, 02-02, 02-03, 02-04) |

## Accumulated Context

### Key Decisions (carried from PROJECT.md)

- Supabase chosen for auth + DB (free tier, EU region, GDPR-friendly).
- Stripe Checkout (not Elements) — webhook is the only state we own.
- gpt-4o-mini over gpt-4o (~12× cheaper, sufficient quality).
- Email/password only for v1 — OAuth deferred to v2.
- `sessionStorage` handoff `/decision` → `/result` retained (intentional: fades on tab close, drives upgrade).
- Demo-mode fallback retained in production (lets founder record marketing footage).
- **Phase order locked by founder:** (1) Auth/limits → (2) Stripe webhook/Pro → (3) Polish → (4) Live deploy. Do not re-sequence.

### Open Decisions

- DB schema for `users` / `subscriptions` (resolved in Phase 1 planning).
- Rate-limit storage backend — Supabase row vs. edge KV (resolved in Phase 1 planning).
- Story-card render path — `<canvas>` client-side vs. `@vercel/og` server-side (resolved in Phase 3 planning).

### Todos

- Founder: create Stripe test-mode products/prices (€5 Pro, €9 Creator).
- Founder: apply migration `0003_phase2_billing.sql` via Supabase SQL editor or `supabase db push` (not applied by the executor per plan constraint).
- Founder: run `stripe listen --forward-to localhost:3000/api/stripe/webhook` for `STRIPE_WEBHOOK_SECRET`; add a test-mode `STRIPE_SECRET_KEY` to `.env.local`.
- Founder: save Customer Portal settings once in the Stripe test dashboard (Settings → Billing → Customer portal → Save) — hard prerequisite, the portal will not open without this.
- Founder E2E walk (Phase 2 verification gate): sign in → `/account` → Unlock → complete a test-mode payment (4242 card) → confirm plan flips to pro/creator → click "Manage subscription" → confirm the Stripe-hosted Customer Portal opens and returns to `/account` → `stripe trigger customer.subscription.deleted` → confirm the profile downgrades to `free`.
- Once the founder confirms the E2E walk, mark Phase 2 fully verified in ROADMAP.md/STATE.md (currently marked code-complete only).

### Blockers

- None. (Was: Upstash provisioning — resolved by switching the burst guard to Postgres in quick task 260701-01.)

### Quick Tasks Completed

| # | Description | Date | Commit | Directory |
|---|-------------|------|--------|-----------|
| 260701-01 | Postgres-backed per-IP burst guard (replaces Upstash) | 2026-07-01 | 9eedee6 | [260701-01-postgres-burst-guard](./quick/260701-01-postgres-burst-guard/) |

## Session Continuity

### Last action
- Plan 02-03 executed: 2/2 auto tasks committed (72cdda4 portal route, 0f4e7e6 /account page + ManageSubscriptionButton + AuthNav link), SUMMARY.md written + self-check PASSED. `npx tsc --noEmit` clean and `npm run build` green after each task. Zero deviations — all acceptance-criteria grep checks passed first attempt. `app/account/page.tsx` confirmed server-only (zero `"use client"`); `app/account/ManageSubscriptionButton.tsx` confirmed client-only (exactly one `"use client"`, first line). PAY-06 marked complete in REQUIREMENTS.md. ROADMAP.md Phase 2 plan progress updated to 4/4 but phase-level checkbox and Progress table intentionally left at "code complete, founder E2E pending" (not "Complete") since Task 3 (founder checkpoint) has not been confirmed.

### Next action
- Founder must complete the E2E checkpoint for Plan 02-03 (see Todos above: Stripe test-dashboard portal-settings save, migration 0003 apply, live pay → portal → cancel walk). Once confirmed, flip Phase 2 to fully verified in ROADMAP.md/STATE.md and proceed to `/gsd-plan-phase 3`.

### Files of record
- `.planning/PROJECT.md` — vision, constraints, key decisions
- `.planning/REQUIREMENTS.md` — 29 v1 requirements + traceability table
- `.planning/ROADMAP.md` — 4-phase plan with goal-backward success criteria
- `.planning/STATE.md` — this file

---
*State initialized: 2026-06-30*
