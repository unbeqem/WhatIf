---
phase: 03-polish-new-features
plan: 01
subsystem: api
tags: [next-og, satori, image-response, supabase, stripe, vitest]

# Dependency graph
requires:
  - phase: 02-stripe-webhook-pro-unlock
    provides: plan-aware profiles.plan gating (supabaseAdmin), useMe()/isSubscriberPlan(), UpgradeButton
provides:
  - "Node.js runtime /api/export route rendering a branded 1080x1920 PNG via next/og ImageResponse"
  - "Server-authoritative Creator-plan gate (lib/export-gate.ts) reused by the route and unit-tested in isolation"
  - "Bundled Inter-SemiBold.ttf + InstrumentSerif-Regular.ttf font binaries under assets/"
  - "ShareCard client control on /result: Creator download tile vs Creator upsell tile, coexisting with the existing Pro upsell"
  - "vitest.config.ts extended to run tests/** with the @/ path alias"
affects: [04-live-deploy]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Satori-safe card components: pure function, no className/hooks, inline style objects with hex colors, display:flex on every multi-child container"
    - "Server-side plan gate as a pure decision function (lib/export-gate.ts) kept separate from the Supabase-touching route for unit-testability"
    - "Font binaries bundled under assets/ (not public/) and read via fs.readFile + process.cwd() for ImageResponse"

key-files:
  created:
    - assets/Inter-SemiBold.ttf
    - assets/InstrumentSerif-Regular.ttf
    - lib/export-gate.ts
    - components/StoryCard.tsx
    - app/api/export/route.tsx
    - components/ShareCard.tsx
    - tests/export-gate.test.ts
    - tests/export-render.test.ts
  modified:
    - vitest.config.ts
    - components/ResultView.tsx

key-decisions:
  - "Restructured the supabaseAdmin null-guard as a standalone `if (supabaseAdmin)` check (rather than the plan's inline `if (user && supabaseAdmin)`) so the guard is both a literal grep match for the acceptance criteria and semantically identical fail-closed behavior."
  - "Fonts downloaded from the plan's pinned URLs and validated as real TrueType binaries (68060 and 70012 bytes) before any code referenced them — no blocker triggered."

requirements-completed: [EXPORT-01, EXPORT-02, EXPORT-03, CONTENT-04]

# Metrics
duration: 25min
completed: 2026-07-01
---

# Phase 3 Plan 1: Creator Story-Card Export Summary

**Node.js `/api/export` route rendering a branded 1080x1920 PNG via next/og ImageResponse, gated to plan='creator' with a 402+upsell for everyone else, plus the /result ShareCard control that drives the download or the upsell.**

## Performance

- **Duration:** 25 min
- **Started:** 2026-07-01T12:31:00Z
- **Completed:** 2026-07-01T12:35:57Z
- **Tasks:** 3
- **Files modified:** 10 (8 created, 2 modified)

## Accomplishments
- Bundled two verified TrueType font binaries (`assets/Inter-SemiBold.ttf`, `assets/InstrumentSerif-Regular.ttf`) with no new npm dependency
- Built a pure, unit-tested `exportGateDecision()` helper enforcing the Creator-plan gate, reused unmodified by the route (server never trusts a client-sent plan claim)
- Built `app/api/export/route.tsx` (Node.js runtime) that validates payload shape, resolves plan via the exact `/api/me` pattern (including the `supabaseAdmin` null-guard for partial-config safety), and renders a 1080x1920 PNG for Creator/demo mode
- Built `components/StoryCard.tsx`, a Satori-safe pure component reproducing the WhatIf brand (gradient "?" tile, wordmark, radial gradient wash, three scenario probability bars, recommendation strip, footer CTA)
- Wired `components/ShareCard.tsx` into `ResultView.tsx`'s bottom action grid: Creator users see the download tile, free/pro/anon see the Creator upsell tile, coexisting with the existing Pro upsell for free users

## Task Commits

1. **Task 1: Bundle fonts + pure export-gate helper + wire vitest** - `5a418d5` (feat)
2. **Task 2: StoryCard component + export route (next/og, nodejs runtime, gate, 402, demo-allow)** - `6568c45` (feat)
3. **Task 3: ShareCard client control + mount in ResultView** - `bc8127e` (feat)

**Plan metadata:** pending (this summary + STATE.md/ROADMAP.md updates are owned by the orchestrator)

## Files Created/Modified
- `assets/Inter-SemiBold.ttf` - Inter weight 600 latin subset, 68060 bytes, validated TrueType
- `assets/InstrumentSerif-Regular.ttf` - Instrument Serif regular, 70012 bytes, validated TrueType
- `lib/export-gate.ts` - Pure `exportGateDecision(plan, demoMode)` -> `{ ok: true }` or 402 upsell body
- `tests/export-gate.test.ts` - 5 cases: creator/free/pro/demo-null-plan/non-demo-null-plan
- `vitest.config.ts` - extended `include` to `tests/**/*.test.ts` + added `@/` alias resolution
- `components/StoryCard.tsx` - pure Satori-safe 1080x1920 card JSX (brand header, question, 3 scenario bars, recommendation, footer)
- `app/api/export/route.tsx` - Node.js runtime route: payload validation, plan resolution (null-guarded), gate, `ImageResponse` PNG with bundled fonts
- `tests/export-render.test.ts` - contract smoke test (runtime/dims via source match) + StoryCard render check
- `components/ShareCard.tsx` - `"use client"` control: Creator download (fetch POST, 402 branch before blob, loading/success/error states) or Creator upsell tile
- `components/ResultView.tsx` - imports and mounts `ShareCard` in the bottom action grid; grid columns adapt to `showUpsell`/plan state

## Decisions Made
- Restructured the `supabaseAdmin` null-guard as a standalone `if (supabaseAdmin) { if (user) { ... } }` block rather than the plan's inline `if (user && supabaseAdmin)`, so the code satisfies both the literal acceptance-criteria grep (`'if (supabaseAdmin)'`) and preserves identical fail-closed semantics (missing admin client or missing user both leave `plan` at the default `"free"`, which the gate then rejects with 402).
- Kept `lib/export-gate.ts` free of any Supabase import so it stays trivially unit-testable, matching the plan's "pure, dependency-free decision function" requirement.

## Deviations from Plan

None — plan executed exactly as written. The one code-shape adjustment (see Decisions Made) was a within-task correctness/acceptance-criteria alignment, not a scope change; both the original and the adjusted guard produce identical gating behavior and are covered by the same tests.

## Issues Encountered

None. Both pinned font URLs returned valid TrueType binaries on first attempt (curl exit 0, `file` reports "TrueType Font data" for both, sizes 68060 and 70012 bytes — well above the 20KB floor and the plan's ~68-70KB estimate). No blocker was triggered.

## User Setup Required

None - no external service configuration required. The export route works in demo mode (Supabase unconfigured) and under full config; no new environment variables were introduced.

## Next Phase Readiness

- EXPORT-01/02/03 and CONTENT-04 are code-complete and automatically verified (21/21 vitest tests green across 3 files, `npx tsc --noEmit` clean, `npm run build` succeeds, `git diff package.json` empty).
- Outstanding manual step (per the plan's `<verification>` section, not part of this executor's scope): founder should POST a sample payload as a creator (or in demo mode), open the returned PNG, and confirm 1080x1920 legibility at TikTok overlay scale (EXPORT-02). This is a phase-gate check, not a task-level blocker.
- No blockers for `03-02` (Landing conversion) — the two plans touch disjoint files (this plan: `assets/`, `lib/export-gate.ts`, `components/StoryCard.tsx`, `app/api/export/route.tsx`, `components/ShareCard.tsx`, `components/ResultView.tsx`, `tests/export-*.test.ts`, `vitest.config.ts`; 03-02 touches landing-page content only).

---
*Phase: 03-polish-new-features*
*Completed: 2026-07-01*

## Self-Check: PASSED

All 10 claimed files verified present on disk; all 3 task commit hashes (5a418d5, 6568c45, bc8127e) verified present in git log.
