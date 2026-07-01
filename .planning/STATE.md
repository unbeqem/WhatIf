# STATE: WhatIf

**Last updated:** 2026-07-01
**Updated by:** gsd-plan-phase 2 — Phase 1 closed, Phase 2 planned

## Project Reference

**Project:** WhatIf — AI decision-simulation SaaS
**Milestone:** v1-production-launch
**Core Value:** A user must be able to type a decision, get a sober three-future simulation in seconds, hit a soft paywall, and pay — without friction.
**Current focus:** Phase 1 complete + verified. Phase 2 planned — ready to execute.

## Current Position

**Phase:** 2 — Stripe Webhook + Pro-Unlock Flow (planned, ready to execute)
**Plan:** Phase 1 COMPLETE (21/21 verified). Phase 2 planned: 4 plans in 2 waves.
**Status:** Phase 2 planning complete + checker-verified. 3 warnings fixed (commit 7c94487); 1 blocker (missing VALIDATION.md) waived at orchestrator level — validation architecture is folded into 02-RESEARCH.md and implemented by Plan 02-04, consistent with Phase 1. Next: `/gsd-execute-phase 2`.
**Progress:** 1/4 phases complete

```
[██████░░░░░░░░░░░░░░] 25% (Phase 1 done · 12/29 v1 requirements delivered · Phase 2 planned)
```

**Phase 2 plans (.planning/phases/02-stripe-webhook-pro-unlock/):**
- 02-01 (Wave 1) — Foundation: migration 0003 (`stripe_subscription_id`) + db.types, `lib/stripe.ts` refactor (pinned apiVersion, pure reducer, portal helper), checkout wiring [PAY-01, PAY-03, PAY-05]
- 02-02 (Wave 2) — `/api/stripe/webhook`: raw-body signature verify + idempotent plan flip on 3 events [PAY-02, PAY-03, PAY-04, PAY-05]
- 02-03 (Wave 2) — `/api/stripe/portal` + `/account` page + AuthNav link; founder verify checkpoint [PAY-06]
- 02-04 (Wave 2) — vitest setup + pure reducer unit tests [PAY-03, PAY-05]

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
1. `/gsd-execute-phase 2` — executes Wave 1 (02-01) then Wave 2 (02-02/03/04 in parallel). Plan 02-03 has a founder checkpoint (Stripe test-mode portal-settings save + Stripe-CLI E2E walk).
2. Founder prep for Phase 2: create Stripe test-mode products/prices (€5 Pro, €9 Creator) if using price IDs, run `stripe listen --forward-to localhost:3000/api/stripe/webhook` to get `STRIPE_WEBHOOK_SECRET`, and save Customer Portal settings once in the Stripe test dashboard (PAY-06 prerequisite).
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
| Requirements delivered | 0 |
| Phases planned | 4 |
| Phases complete | 0 |
| Plans complete | 0 |

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

- Founder: provision Supabase (EU) + Upstash, run migration, fill `.env.local`, walk the 21-step verification in Plan 05 Task 3.
- After Task 3 approval: `/gsd-plan-phase 2` (Stripe Webhook + Pro-Unlock).

### Blockers

- None. (Was: Upstash provisioning — resolved by switching the burst guard to Postgres in quick task 260701-01.)

### Quick Tasks Completed

| # | Description | Date | Commit | Directory |
|---|-------------|------|--------|-----------|
| 260701-01 | Postgres-backed per-IP burst guard (replaces Upstash) | 2026-07-01 | 9eedee6 | [260701-01-postgres-burst-guard](./quick/260701-01-postgres-burst-guard/) |

## Session Continuity

### Last action
- Phase 1 code shipped across 5 commits + 1 MVP fix. tsc clean, next build clean. Plan 05 Task 3 (blocking human-verify checkpoint) reached — execution paused for founder setup.

### Next action
- Phase 2 planned + checker-verified (4 plans, 2 waves). Run `/gsd-execute-phase 2`. Founder prep: Stripe test products/prices, `stripe listen` for STRIPE_WEBHOOK_SECRET, and save test-mode Customer Portal settings.

### Files of record
- `.planning/PROJECT.md` — vision, constraints, key decisions
- `.planning/REQUIREMENTS.md` — 29 v1 requirements + traceability table
- `.planning/ROADMAP.md` — 4-phase plan with goal-backward success criteria
- `.planning/STATE.md` — this file

---
*State initialized: 2026-06-30*
