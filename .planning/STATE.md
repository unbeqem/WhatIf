---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: executing
last_updated: "2026-07-01T12:28:39.230Z"
progress:
  total_phases: 4
  completed_phases: 2
  total_plans: 11
  completed_plans: 10
  percent: 91
---

# STATE: WhatIf

**Last updated:** 2026-07-01
**Updated by:** gsd-plan-phase 3 — Phase 3 planned + checker-verified

## Project Reference

**Project:** WhatIf — AI decision-simulation SaaS
**Milestone:** v1-production-launch
**Core Value:** A user must be able to type a decision, get a sober three-future simulation in seconds, hit a soft paywall, and pay — without friction.
**Current focus:** Phase 03 — polish-new-features

## Current Position

Phase: 03 (polish-new-features) — EXECUTING
Plan: 1 of 2
**Phase:** 3 — Polish + New Features (planned + checker-verified, ready to execute)
**Plan:** Phases 1+2 COMPLETE. Phase 3: 2 plans in 1 parallel wave (disjoint files). Checker: 0 blockers; 5 warnings fixed (supabaseAdmin null-guard, pinned font URLs, machine-checkable testimonial count, RESEARCH resolved marker, honest counter reframe); VALIDATION.md gate waived (folded into RESEARCH.md as prior phases).
**Status:** Executing Phase 03
**Progress:** 2/4 phases complete; Phase 3 planned

```
[██████████░░░░░░░░░░] 50% (Phases 1+2 done · 21/29 v1 requirements delivered · Phase 3 planned)
```

**Phase 3 plans (.planning/phases/03-polish-new-features/):**

- 03-01 (Wave 1) — Creator 9:16 story-card export: next/og nodejs route + creator-gate/402/demo-allow + bundled fonts + StoryCard + ShareCard on /result [CONTENT-04, EXPORT-01/02/03]. Commits: plan b50086f→revisions 20ccd23, 1f3c72c.
- 03-02 (Wave 1) — Landing conversion: FAQ accordion + testimonials/scroll counter (honest FUTURES_PER_DECISION stat) + FAQ nav link + 8 rewritten example prompts + hero fabricated-count purge [CONTENT-01/02/03].

**Phase 2 plans (.planning/phases/02-stripe-webhook-pro-unlock/):**

- 02-01 (Wave 1) — DONE. Foundation: migration 0003 (`stripe_subscription_id`) + db.types, `lib/stripe.ts` refactor (pinned apiVersion, pure reducer, portal helper), checkout wiring [PAY-01, PAY-03, PAY-05]. Commits: 801a7aa, f4eca5b, 408df6a, summary 9d6e578.
- 02-02 (Wave 2) — DONE. `/api/stripe/webhook`: raw-body signature verify + idempotent plan flip on 3 events [PAY-02, PAY-03, PAY-04, PAY-05]. Commit: 0eac0b9.
- 02-03 (Wave 2) — DONE + E2E verified. `/api/stripe/portal` + `/account` page + ManageSubscriptionButton + AuthNav link [PAY-06]. Commits: 72cdda4, 0f4e7e6. Founder confirmed portal opens + cancel flow.
- 02-04 (Wave 2) — DONE. vitest setup + pure reducer unit tests [PAY-03, PAY-05]. Commits: 1be0117, 4b84bd7.
- 02-05 (gap-closure) — DONE. Plan-aware UI: GET /api/me + useMe() hook; AuthNav plan badge; Nav CTA "Try free"→"New simulation" for authed users; ResultView hides Unlock-Pro upsell for subscribers. Commit: eb5fc20. (Founder-caught gap at E2E checkpoint: plan flipped server-side but client UI was stale.)

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
| Requirements delivered | 21 |
| Phases planned | 4 |
| Phases complete | 2 |
| Plans complete | 9 (Phase 1: 5, Phase 2: 4) + 1 gap-closure (02-05) |

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

- Next: `/gsd-plan-phase 3` (Polish + New Features — FAQ, testimonials, example prompts, Creator 9:16 story-card export).
- Housekeeping: `.agents/`, `.claude/`, `skills-lock.json` (from `npx skills add`) are untracked — decide gitignore vs commit.
- Phase 4 backlog: register the WhatIf product domain; prod Stripe live keys + register the production webhook endpoint (local dev used `stripe listen`).
- Phase 2 setup done by founder: migration 0003 applied; Stripe test `sk_test_`/`whsec_` in `.env.local`; Customer Portal settings saved.

### Blockers

- None. (Was: Upstash provisioning — resolved by switching the burst guard to Postgres in quick task 260701-01.)

### Quick Tasks Completed

| # | Description | Date | Commit | Directory |
|---|-------------|------|--------|-----------|
| 260701-01 | Postgres-backed per-IP burst guard (replaces Upstash) | 2026-07-01 | 9eedee6 | [260701-01-postgres-burst-guard](./quick/260701-01-postgres-burst-guard/) |

## Session Continuity

### Last action

- Phase 3 planned (research + UI-SPEC → planner → checker). 2 plans, 1 parallel wave. Checker returned 0 blockers / 5 warnings; all 5 fixed via targeted revisions (commits 20ccd23, 1f3c72c): supabaseAdmin null-guard on the export route, pinned verified font URLs, machine-checkable 3–5 testimonial count, RESEARCH Open Questions marked resolved, and the fabricated "10,247" counter reframed to an honest animated stat + purged from the hero (founder decision).

### Next action

- `/gsd-execute-phase 3` — both plans (03-01 story-card export, 03-02 landing conversion) run in parallel (Wave 1). Manual founder step at the phase gate: eyeball a generated story-card PNG for TikTok-scale legibility (EXPORT-02).

### Files of record

- `.planning/PROJECT.md` — vision, constraints, key decisions
- `.planning/REQUIREMENTS.md` — 29 v1 requirements + traceability table
- `.planning/ROADMAP.md` — 4-phase plan with goal-backward success criteria
- `.planning/STATE.md` — this file

---
*State initialized: 2026-06-30*
