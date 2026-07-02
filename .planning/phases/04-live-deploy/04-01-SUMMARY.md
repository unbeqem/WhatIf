---
phase: 04-live-deploy
plan: 01
subsystem: legal-compliance
tags: [nextjs-app-router, server-components, tailwind-v4, gdpr, ddg]

requires:
  - phase: 03-polish-new-features
    provides: stable ResultView upsell block, account free-plan block, Footer component
provides:
  - app/impressum/page.tsx and app/datenschutz/page.tsx (German legal pages, DDG/DSGVO)
  - Footer Privacy/Terms links wired to real routes (no more href="#")
  - Discreet German test-mode notice on both paywall surfaces
  - .env.example doc clarifying Stripe test-key vs live-key semantics
affects: [04-02-vercel-deploy-env, 04-03-e2e-verification]

tech-stack:
  added: []
  patterns:
    - "Static legal-page shell: server component (no \"use client\"), Nav + BackgroundOrbs + max-w-2xl container + rounded-2xl card + Footer, reused from app/account/page.tsx"
    - "Internal nav links use next/link Link; mailto stays a plain <a>"

key-files:
  created:
    - app/impressum/page.tsx
    - app/datenschutz/page.tsx
  modified:
    - components/Footer.tsx
    - components/ResultView.tsx
    - app/account/page.tsx
    - .env.example

key-decisions:
  - "Legal pages written in German (D-09/Claude's Discretion resolved) — Impressum/Datenschutz are DE legal instruments even though product UI is English; Footer labels stay English (Privacy/Terms) per surrounding footer convention."
  - "Footer label-to-route mapping: Privacy -> /datenschutz, Terms -> /impressum (no exact EN equivalent for Impressum; closest available page until AGB ships)."
  - "Founder personal details (name, address) rendered as clearly-marked placeholder strings, never fabricated."

patterns-established:
  - "Legal/static content pages follow the account-page server-component shell (no client interactivity, has metadata export)."

requirements-completed: [DEPLOY-04]

duration: 25min
completed: 2026-07-02
---

# Phase 4 Plan 1: Legal Pages + Test-Mode Notice Summary

**German Impressum + Datenschutzerklärung pages wired into the Footer, plus a discreet Stripe test-mode notice on both paywall surfaces.**

## Performance

- **Duration:** ~25 min
- **Completed:** 2026-07-02T08:28:37Z
- **Tasks:** 2 completed
- **Files modified:** 6 (2 created, 4 modified)

## Accomplishments
- `/impressum` and `/datenschutz` are live, static-rendered German legal pages naming the real processors (Supabase EU, Stripe, OpenAI, Resend/IONOS) and the real contact `business@what-if.tech`, with clearly-marked founder-fill placeholders for name/address (no fabricated PII).
- Footer's two dead `href="#"` links now route via `next/link` to the new pages — zero remaining `href="#"` in the Footer.
- The German test-mode notice ("Testphase · Zahlungen im Testmodus, keine echte Abbuchung") appears exactly once on each of the two Unlock/paywall surfaces: `ResultView.tsx` upsell block and `app/account/page.tsx` free-plan block.
- `.env.example` now documents the `sk_test_` vs `sk_live_` Stripe key distinction for future maintainers, with zero functional/value changes.

## Task Commits

Each task was committed atomically:

1. **Task 1: Create /impressum and /datenschutz German legal pages** - `e1b03d6` (feat)
2. **Task 2: Wire Footer links + add test-mode notice to both paywall surfaces + .env.example comment** - `c73f3e5` (feat)

**Plan metadata:** (this commit, see below)

## Files Created/Modified
- `app/impressum/page.tsx` - New German Impressum (§5 DDG) server-component page
- `app/datenschutz/page.tsx` - New German Datenschutzerklärung (DSGVO) server-component page, names all real processors
- `components/Footer.tsx` - Added `next/link` import; Privacy → `/datenschutz`, Terms → `/impressum`; mailto Contact link left untouched
- `components/ResultView.tsx` - Added test-mode notice paragraph inside the `showUpsell` block
- `app/account/page.tsx` - Added test-mode notice paragraph inside the free-plan (non-subscriber) block
- `.env.example` - Added a two-line clarifying comment above `STRIPE_SECRET_KEY=` (no value changes)

## Decisions Made
- Legal pages are German; Footer labels stay English ("Privacy"/"Terms") — resolves the Claude's Discretion item from 04-CONTEXT.md D-09.
- Footer "Terms" maps to `/impressum` (no AGB exists yet; Impressum is the closest available legal page) and "Privacy" maps to `/datenschutz`.
- No new design tokens introduced — reused existing `globals.css` tokens (`border-border-hi`, `bg-surface/60`, `text-fg-soft`, `text-fg-mute`, `font-display`) throughout.

## Deviations from Plan

None - plan executed exactly as written. All acceptance-criteria greps and `npx tsc --noEmit` passed on the first attempt for both tasks; `npm run build` confirms `/impressum` and `/datenschutz` compile as static (`○`) routes.

## Issues Encountered

None.

## Known Stubs

None. Founder-fill placeholders (`[NAME PLACEHOLDER — Gründer trägt ein]`, `[ADRESSE PLACEHOLDER — Straße, PLZ, Ort — Gründer trägt ein]`) are intentional per the plan's explicit instruction — they are legally-required personal details the founder must supply before the site is fully public-compliant, not a functional gap. Tracked here for visibility; no code path depends on them.

## User Setup Required

None - no external service configuration required. Founder follow-up (non-blocking, non-code): fill in the real name/address in `app/impressum/page.tsx` and `app/datenschutz/page.tsx` before treating the Impressum as legally complete.

## Next Phase Readiness

- Plan 04-02 (Vercel env + deploy) and 04-03 (E2E verification) are unblocked — the Footer no longer has dead links and the paywall is honest about test-mode payments, both prerequisites for going public.
- `npx tsc --noEmit` and `npm run build` are clean; all new/modified files committed.

---
*Phase: 04-live-deploy*
*Completed: 2026-07-02*
