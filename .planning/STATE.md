# STATE: WhatIf

**Last updated:** 2026-06-30
**Updated by:** gsd-roadmapper (initialization)

## Project Reference

**Project:** WhatIf — AI decision-simulation SaaS
**Milestone:** v1-production-launch
**Core Value:** A user must be able to type a decision, get a sober three-future simulation in seconds, hit a soft paywall, and pay — without friction.
**Current focus:** Roadmap created; ready to plan Phase 1.

## Current Position

**Phase:** — (none active yet)
**Plan:** — (none active yet)
**Status:** Roadmap approved; awaiting `/gsd-plan-phase 1`
**Progress:** 0/4 phases complete

```
[░░░░░░░░░░░░░░░░░░░░] 0%   (0 / 29 v1 requirements delivered)
```

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

- Plan Phase 1 via `/gsd-plan-phase 1`.

### Blockers

None.

## Session Continuity

### Last action
- `gsd-roadmapper` created `ROADMAP.md` mapping all 29 v1 requirements across 4 phases. Phase order matches founder-locked sequence.

### Next action
- Run `/gsd-plan-phase 1` to decompose Phase 1 (Rate-Limiting + User-System) into executable plans.

### Files of record
- `.planning/PROJECT.md` — vision, constraints, key decisions
- `.planning/REQUIREMENTS.md` — 29 v1 requirements + traceability table
- `.planning/ROADMAP.md` — 4-phase plan with goal-backward success criteria
- `.planning/STATE.md` — this file

---
*State initialized: 2026-06-30*
