# STATE: WhatIf

**Last updated:** 2026-06-30
**Updated by:** gsd-roadmapper (initialization)

## Project Reference

**Project:** WhatIf — AI decision-simulation SaaS
**Milestone:** v1-production-launch
**Core Value:** A user must be able to type a decision, get a sober three-future simulation in seconds, hit a soft paywall, and pay — without friction.
**Current focus:** Roadmap created; ready to plan Phase 1.

## Current Position

**Phase:** 1 — Rate-Limiting + User-System
**Plan:** 05 (Auth UI + paywall) — code complete; Task 3 (founder checkpoint) pending
**Status:** Awaiting founder Supabase + Upstash setup + 21-step verification.
**Progress:** 0/4 phases complete (1 code-complete, awaiting verification)

```
[█████░░░░░░░░░░░░░░░] 25% code-complete   (12 / 29 v1 requirements written, 0 verified)
```

**Phase 1 commits:**
- f96263d — Plan 01 Supabase + Upstash infra
- 491bb44 — Plan 02 lib/anon.ts
- f107f2d — Plan 03 6 auth routes + validator
- cc3250e — Plan 04 gated /api/simulate
- 5a6e02e — Plan 05 auth UI + paywall (Task 1+2)
- (Task 3 founder checkpoint: PENDING)

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

- Phase 1 verification gated on real Supabase + Upstash accounts (founder action).

## Session Continuity

### Last action
- Phase 1 code shipped across 5 commits + 1 MVP fix. tsc clean, next build clean. Plan 05 Task 3 (blocking human-verify checkpoint) reached — execution paused for founder setup.

### Next action
- Founder runs Supabase + Upstash setup + 21-step verification (see Plan 05 Task 3). On `approved`, mark Phase 1 done and run `/gsd-plan-phase 2`.

### Files of record
- `.planning/PROJECT.md` — vision, constraints, key decisions
- `.planning/REQUIREMENTS.md` — 29 v1 requirements + traceability table
- `.planning/ROADMAP.md` — 4-phase plan with goal-backward success criteria
- `.planning/STATE.md` — this file

---
*State initialized: 2026-06-30*
