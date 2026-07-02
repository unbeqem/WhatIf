---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: executing
last_updated: "2026-07-02T07:30:06.935Z"
progress:
  total_phases: 4
  completed_phases: 3
  total_plans: 14
  completed_plans: 12
  percent: 86
---

# STATE: WhatIf

**Last updated:** 2026-07-01
**Updated by:** gsd-discuss-phase 4 — Phase 4 context gathered (test-mode-first deploy)

## Project Reference

**Project:** WhatIf — AI decision-simulation SaaS
**Milestone:** v1-production-launch
**Core Value:** A user must be able to type a decision, get a sober three-future simulation in seconds, hit a soft paywall, and pay — without friction.
**Current focus:** Phases 1–3 complete. Phase 4 discussed — context locked in `.planning/phases/04-live-deploy/04-CONTEXT.md` (deploy-ready, Stripe TEST mode; live payments deferred post-Gewerbe). Next: `/gsd-plan-phase 4`.

## Current Position

**Phase:** 4 — Live Deploy (not started)
**Plan:** Not started
**Status:** Ready to execute
**Progress:** 3/4 phases complete; 28/29 v1 requirements delivered (Phase 4 = DEPLOY-01..04)

```
[███████████████░░░░░] 75% (Phases 1–3 done · 28/29 v1 requirements delivered · Phase 4 = Live Deploy)
```

**Phase 3 plans (.planning/phases/03-polish-new-features/):**

- 03-01 (Wave 1) — DONE. Creator 9:16 story-card export: next/og nodejs route + creator-gate/402/demo-allow + bundled fonts + StoryCard + ShareCard on /result [CONTENT-04, EXPORT-01/02/03]. Commits: 5a418d5, 6568c45, bc8127e, summary ab7dd4b.
- 03-02 (Wave 1) — DONE. Landing conversion: FAQ accordion + testimonials/scroll counter (honest FUTURES_PER_DECISION stat) + FAQ nav link + 8 rewritten example prompts + hero fabricated-count purge [CONTENT-01/02/03]. Commits: 2dc4b3a, de1da04, summary ffbf5a2.
- Post-review fixes: 93645ad (CR-01 export payload validation + render try/catch + probability clamp; +8 tests), 72c333b (WR-01 /result grid col-span). Suite 29/29 green, tsc clean, build ok.

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
| 260701-nnc | Swap placeholder contact email + cosmetic domain to real values (business@what-if.tech, what-if.tech) | 2026-07-01 | cadd82c | [260701-nnc-swap-contact-email-domain](./quick/260701-nnc-swap-contact-email-domain/) |

## Session Continuity

### Last action

- Phase 4 discussed (test-mode-first re-scope). Founder decisions locked in 04-CONTEXT.md: deploy now to a *.vercel.app subdomain (real domain later); reuse existing EU Supabase project zdirwmqfoynxmfifzlvt as prod; Stripe stays in TEST mode (live keys + real paid simulation deferred to a post-Gewerbeanmeldung step); add real /impressum + /datenschutz pages + wire dead Footer links; discreet test-mode notice at checkout only. Rationale: WhatIf is a hobby project with no registered Gewerbe — accepting real money legally requires a Gewerbeanmeldung, so this phase proves the whole machine with test cards and the flip to live money is a later keys-and-URLs swap.
- (Prior) Phase 3 executed. Both plans ran as sequential gsd-executor subagents on the main tree (worktrees disabled — node_modules is gitignored so an isolated worktree can't build/test). Post-merge suite green (tests 21/21 at merge, then 29/29 after fixes; tsc + build clean). Code review found 1 critical + 5 warnings; founder chose "fix first" → CR-01 (untrusted-input 500 on /api/export) and WR-01 (/result grid wrap) fixed inline (commits 93645ad, 72c333b). Verifier: 5/5 must-haves at code level. NOTE: gsd-sdk is not on PATH here — the CLI is `node ~/.claude/get-shit-done/bin/gsd-tools.cjs <cmd>` (space-separated subcommands). phase.complete + roadmap update-plan-progress silently no-op'd on this hand-edited ROADMAP/STATE (format mismatch); checkbox + progress table + this body were updated manually.

### Next action

- `/gsd-plan-phase 4` — CONTEXT.md is ready (04-CONTEXT.md). Plan the test-mode-first live deploy: Vercel deploy on *.vercel.app, prod env (real OpenAI + EU Supabase + Stripe TEST keys), env-driven base URL for later domain swap, register the Stripe test-mode webhook on the Vercel URL, Supabase Site/redirect URLs, /impressum + /datenschutz pages + Footer links, discreet checkout test-mode notice. NOTE re-scope: DEPLOY-02 (live Stripe) + DEPLOY-04 (real paid simulation) are intentionally test-mode this phase; live keys + real payment are a deferred post-Gewerbe founder step.
- Founder prerequisites for Phase 4: a real OpenAI API key with billing (DEPLOY-01); a Vercel project connected to the repo; Stripe test products/prices for Pro/Creator; (later) register domain + Gewerbeanmeldung before flipping to live payments. Also check the co-orga employment contract re: Nebentätigkeit.
- Still open (deferred, tracked): non-blocking code-review items WR-02/03/04 + info findings in 03-REVIEW.md.

### Files of record

- `.planning/PROJECT.md` — vision, constraints, key decisions
- `.planning/REQUIREMENTS.md` — 29 v1 requirements + traceability table
- `.planning/ROADMAP.md` — 4-phase plan with goal-backward success criteria
- `.planning/STATE.md` — this file

---
*State initialized: 2026-06-30*
