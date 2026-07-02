---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: executing
last_updated: "2026-07-02T08:29:31.147Z"
progress:
  total_phases: 4
  completed_phases: 3
  total_plans: 15
  completed_plans: 13
  percent: 87
---

# STATE: WhatIf

**Last updated:** 2026-07-02
**Updated by:** gsd-execute-phase 4 — Plan 04-01 (legal pages + test-mode notice) executed

## Project Reference

**Project:** WhatIf — AI decision-simulation SaaS
**Milestone:** v1-production-launch
**Core Value:** A user must be able to type a decision, get a sober three-future simulation in seconds, hit a soft paywall, and pay — without friction.
**Current focus:** Phase 04 — live-deploy

## Current Position

Phase: 04 (live-deploy) — EXECUTING
Plan: 2 of 3
**Phase:** 4 — Live Deploy (in progress)
**Plan:** 04-01 DONE; next is 04-02 (founder dashboard config)
**Status:** Executing Phase 04
**Progress:** 3/4 phases complete; 04-01 done; 28/29 v1 requirements delivered (Phase 4 = DEPLOY-01..04)

```
[████████████████░░░░] 87% (Phases 1–3 done · 04-01 done · 28/29 v1 requirements delivered · Phase 4 = Live Deploy)
```

**Phase 4 plans (.planning/phases/04-live-deploy/):**

- 04-01 (Wave 1) — DONE. German legal pages (/impressum, /datenschutz) naming real processors (Supabase, Stripe, OpenAI, Resend/IONOS) + Footer Privacy/Terms wired to real routes + discreet test-mode notice on ResultView upsell + account free-plan block + .env.example sk_test_/sk_live_ doc comment [DEPLOY-04 support]. Commits: e1b03d6, c73f3e5, summary 746f209.

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
| 260702-ky3 | Fill Impressum + Datenschutz with real founder data (name/address/phone) | 2026-07-02 | 85f211b | [260702-ky3-legal-real-data](./quick/260702-ky3-legal-real-data/) |
| 260702-l7d | Plan-aware pricing CTAs on landing (Current plan / Included / upgrade instead of always Go Pro) | 2026-07-02 | d17289c | [260702-l7d-plan-aware-pricing-cta](./quick/260702-l7d-plan-aware-pricing-cta/) |
| 260702-m0i | Site-wide dismissible test-phase banner (payments in test mode) — overrides D-10 | 2026-07-02 | 222d4c7 | [260702-m0i-demo-testphase-banner](./quick/260702-m0i-demo-testphase-banner/) |
| 260702-m3e | Perf: GPU-promote background orbs + prefers-reduced-motion guard (smoother animation/scroll) | 2026-07-02 | cac20cb | [260702-m3e-perf-orbs-scroll](./quick/260702-m3e-perf-orbs-scroll/) |

## Session Continuity

### Last action

- **Phase 4 Waves 1+2 LIVE & verified (2026-07-02).** Pushed the 6 local commits to origin/main (github.com/unbeqem/WhatIf) → Vercel auto-deployed. Confirmed via curl: `/impressum` + `/datenschutz` return 200 with Footer links wired; Stripe TEST checkout `/api/stripe` returns `demo:false` + a real `cs_test_` checkout.stripe.com session; webhook `/api/stripe/webhook` enforces signature (400 no-signature / 400 invalid-signature — the demo no-op is gone); `NEXT_PUBLIC_URL=https://what-if.tech` effective. Founder completed 04-02 dashboard config (Vercel env matrix, Supabase Auth Site URL/redirect, Stripe test webhook). **Vercel gotcha solved:** env vars need a fresh redeploy WITHOUT build cache to take effect (esp. NEXT_PUBLIC_URL, build-time inlined); prod webhook secret is the what-if.tech endpoint's whsec_, NOT the local `stripe listen` one. **ONE blocker remains:** OpenAI has no billing balance (founder has no usable card CVC) — OPENAI_API_KEY is set in Vercel but with no credit `/api/simulate` returns 500 "The oracle is silent" (no demo fallback on error). Founder chose to leave the key set. Live simulate stays broken until credit loaded (or blank the key for clean demo, or switch to OpenRouter — see memory openai-billing-blocker).
- Plan 04-01 executed (sequential main-tree executor, branching_strategy=none). Created `/impressum` + `/datenschutz` German legal pages (real processors named: Supabase, Stripe, OpenAI, Resend/IONOS; founder-fill placeholders for name/address, never fabricated). Wired Footer's dead `href="#"` Privacy/Terms links to the new routes via next/link. Added the discreet German test-mode notice ("Testphase · Zahlungen im Testmodus, keine echte Abbuchung") to both paywall surfaces (ResultView upsell block, account free-plan block). Documented sk_test_/sk_live_ distinction in `.env.example` (comment-only). tsc clean, `npm run build` succeeds with both new routes static. No deviations. Commits: e1b03d6 (Task 1), c73f3e5 (Task 2), 746f209 (summary).
- (Prior) Phase 4 discussed (test-mode-first re-scope). Founder decisions locked in 04-CONTEXT.md: deploy now on what-if.tech (real domain already live); reuse existing EU Supabase project zdirwmqfoynxmfifzlvt as prod; Stripe stays in TEST mode (live keys + real paid simulation deferred to a post-Gewerbeanmeldung step). Rationale: WhatIf is a hobby project with no registered Gewerbe — accepting real money legally requires a Gewerbeanmeldung, so this phase proves the whole machine with test cards and the flip to live money is a later keys-and-URLs swap.
- (Prior) Phase 3 executed. Both plans ran as sequential gsd-executor subagents on the main tree (worktrees disabled — node_modules is gitignored so an isolated worktree can't build/test). Post-merge suite green (tests 21/21 at merge, then 29/29 after fixes; tsc + build clean). Code review found 1 critical + 5 warnings; founder chose "fix first" → CR-01 (untrusted-input 500 on /api/export) and WR-01 (/result grid wrap) fixed inline (commits 93645ad, 72c333b). Verifier: 5/5 must-haves at code level. NOTE: gsd-sdk is not on PATH here — the CLI is `node ~/.claude/get-shit-done/bin/gsd-tools.cjs <cmd>` (space-separated subcommands). `state advance-plan` and `roadmap update-plan-progress` silently error/no-op on this hand-edited ROADMAP/STATE (format mismatch); checkbox + progress table + this body updated manually each time.

- `/gsd-execute-phase 4` continues with **04-03-PLAN.md** (Wave 3) — founder live-URL E2E smoke with Stripe test cards on https://what-if.tech: signup → confirm email (lands on what-if.tech/auth/confirm) → simulate → paywall (test-mode notice) → test-card pay → plan flip via webhook in prod DB → Creator export → portal cancel. Everything doable EXCEPT the real-simulation <8s step, which needs OpenAI credit (see blocker below). 04-01 (code) and 04-02 (env/dashboard config) are DONE + verified.
- **Blocking Phase 4 completion:** load OpenAI billing credit (~$5 via a virtual Visa/MC funded by SEPA, e.g. Revolut/Wise/C24; the founder's Postbank Visa CVC wasn't accessible). Until then DEPLOY-01 (live OpenAI in prod) can't be verified and live simulate is broken. Alternatives: temporarily blank OPENAI_API_KEY in Vercel for a clean demo-mode public site; or switch provider to OpenRouter (small lib/openai.ts baseURL change — deviates from CLAUDE.md-locked stack, needs sign-off).
- Founder-side before Impressum is legally complete: replace `[NAME/ADRESSE PLACEHOLDER]` markers in app/impressum/page.tsx (+ any in datenschutz) with real personal details.
- Deferred post-Gewerbeanmeldung: live Stripe keys + real paid simulation + full AGB/Widerrufsbelehrung.
- Still open (deferred, tracked): non-blocking code-review items WR-02/03/04 + info findings in 03-REVIEW.md. Founder-side: fill in real name/address placeholders in app/impressum/page.tsx and app/datenschutz/page.tsx before treating Impressum as legally complete.

### Files of record

- `.planning/PROJECT.md` — vision, constraints, key decisions
- `.planning/REQUIREMENTS.md` — 29 v1 requirements + traceability table
- `.planning/ROADMAP.md` — 4-phase plan with goal-backward success criteria
- `.planning/STATE.md` — this file

---
*State initialized: 2026-06-30*
