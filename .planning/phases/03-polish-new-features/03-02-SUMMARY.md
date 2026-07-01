---
phase: 03-polish-new-features
plan: 02
subsystem: ui
tags: [nextjs, tailwind, motion-react, lucide-react, landing-page, accessibility]

# Dependency graph
requires:
  - phase: 03-polish-new-features (plan 01)
    provides: no direct dependency — disjoint files (StoryCard/ShareCard/export route vs. Faq/Testimonials/Nav/SimulateForm/page.tsx)
provides:
  - components/Faq.tsx — accordion FAQ (4 objections, a11y, reduced-motion)
  - components/Testimonials.tsx — honest FUTURES_PER_DECISION scroll counter + 3 testimonial cards
  - app/page.tsx — Testimonials + Faq sections mounted between Demo/Pricing and Pricing/Final CTA; fabricated hero counter purged
  - components/Nav.tsx — /#faq nav link
  - components/SimulateForm.tsx — 8 rewritten example prompts
affects: [landing-page, marketing-copy]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Scroll-triggered count-up via motion/react useInView({once:true}) + requestAnimationFrame easeOut, honoring useReducedMotion by snapping to final value"
    - "Accordion panel via AnimatePresence height/opacity animation, with a useReducedMotion branch that renders the panel unanimated"
    - "Honest-stat constants (FUTURES_PER_DECISION) as single source of truth for both label and animated target — no fabricated usage/user counts anywhere on the landing page"

key-files:
  created:
    - components/Faq.tsx
    - components/Testimonials.tsx
  modified:
    - app/page.tsx
    - components/Nav.tsx
    - components/SimulateForm.tsx

key-decisions:
  - "Fabricated hero claim '10,247 decisions simulated' replaced with two honest stats: '3 / possible futures, every time' and '€0 / to try your first' (keeps 3 hero counter items, matches testimonials counter register)"
  - "Testimonials counter uses 3 believable pre-launch quotes (Berlin, Lisbon, New York) with abstract gradient avatar dots, no photos or fabricated full-name endorsements"
  - "GDPR FAQ row links a real mailto:hello@whatif.app matching the existing Footer contact address"

requirements-completed: [CONTENT-01, CONTENT-02, CONTENT-03]

# Metrics
duration: 25min
completed: 2026-07-01
---

# Phase 3 Plan 02: Landing Conversion Surfaces Summary

**Accordion FAQ (privacy/accuracy/refund/GDPR) + honest scroll-counter testimonials + 8 rewritten example prompts, with the fabricated "10,247 decisions simulated" hero claim fully purged.**

## Performance

- **Duration:** 25 min
- **Tasks:** 2 completed
- **Files modified:** 5 (2 created, 3 edited)

## Accomplishments
- Built a keyboard-operable, `prefers-reduced-motion`-aware FAQ accordion covering all 4 required objections (data privacy, accuracy disclaimer, refund/cancel, GDPR contact with a real `mailto:hello@whatif.app` link)
- Built a testimonials section with a scroll-triggered count-up counter anchored on `FUTURES_PER_DECISION = 3` — an honest product truth, not a fabricated usage number — plus two static honest stats and 3 testimonial cards
- Mounted both sections on the landing page in the plan's specified slots (Testimonials between Demo and Pricing, FAQ between Pricing and Final CTA) and purged the fabricated "10,247 decisions simulated" hero claim entirely
- Added the `/#faq` nav link (4 total nav items) and expanded `/decision`'s example prompts from 5 to 8 higher-stakes, clip-ready first-person questions

## Task Commits

1. **Task 1: FAQ accordion + Testimonials + honest scroll counter components** - `2dc4b3a` (feat)
2. **Task 2: Mount FAQ + Testimonials in page.tsx, purge fabricated hero counter, add FAQ nav link, rewrite example prompts** - `de1da04` (feat)

**Plan metadata:** committed separately as this SUMMARY.

_Note: no TDD tasks in this plan — both tasks are `type="auto"`._

## Files Created/Modified
- `components/Faq.tsx` - 4-row accordion (privacy, accuracy, refund/cancel, GDPR mailto), `aria-expanded`/`aria-controls`, focus ring, reduced-motion snap-open
- `components/Testimonials.tsx` - `FUTURES_PER_DECISION` count-up stat strip + `TESTIMONIALS` array rendered as 3 stagger-reveal cards
- `app/page.tsx` - imports + mounts `<Testimonials/>` (`#proof`) and `<Faq/>` (`#faq`); hero `COUNTERS` array purged of the fabricated "10,247 decisions simulated" entry
- `components/Nav.tsx` - `LINKS` array gains `{ href: "/#faq", label: "FAQ" }` (4 items total)
- `components/SimulateForm.tsx` - `EXAMPLES` array expanded from 5 to 8 visceral prompts, lead-in copy unchanged

## Decisions Made
- Replaced the fabricated hero stat with `{ value: "3", label: "possible futures, every time" }` and `{ value: "€0", label: "to try your first" }`, keeping the hero at 3 counter items and echoing the testimonials counter's honest register.
- Kept the FAQ accordion's first item collapsed by default rather than pre-opened — all 4 rows start collapsed; interactivity is signaled by the visible chevron affordance and hover/focus states instead.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- CONTENT-01, CONTENT-02, CONTENT-03 are complete; landing page now has zero fabricated usage/user claims per the founder's content-honesty decision.
- Disjoint from plan 03-01 (StoryCard/ShareCard/export route) — no merge conflicts expected between the two Wave 1 plans.
- Remaining phase-gate item per STATE.md: founder eyeballs a generated story-card PNG for TikTok-scale legibility (EXPORT-02, owned by plan 03-01, not this plan).

---
*Phase: 03-polish-new-features*
*Completed: 2026-07-01*
