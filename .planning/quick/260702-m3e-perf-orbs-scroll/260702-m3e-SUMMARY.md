---
quick_id: 260702-m3e
slug: perf-orbs-scroll
date: 2026-07-02
status: complete
files_changed: [components/BackgroundOrbs.tsx, app/globals.css]
commit: cac20cb
---

# Summary: Perf pass 1 — background orbs + reduced motion

**Founder report:** site lags; animations and scrolling don't feel smooth.

**Diagnosis (main culprits in this stack):**
1. `BackgroundOrbs` — 3 large (360–480px) `blur-3xl` (64px) circles animated continuously via `float-slow`, with NO compositor-layer promotion → the browser can re-rasterize the expensive blur each frame. Primary cause of janky animation.
2. No `prefers-reduced-motion` guard — infinite animations always run.
3. `backdrop-blur` on the sticky Nav + many cards layered over the animated orbs — compounds scroll repaint cost (not changed this pass; visual trade-off).

**Fixes applied (zero visual change):**
- `BackgroundOrbs.tsx`: added `will-change: transform` to each orb + `[contain:paint]` on the container → orbs promoted to their own GPU layer; blur rasterized once, only the transform animates. Also reduces repaint work behind backdrop-blur elements during scroll.
- `globals.css`: added `@media (prefers-reduced-motion: reduce)` disabling `float-slow`, `pulse-glow`, `shimmer`, `gradient-text` animations.

## Verification
- `npx tsc --noEmit` → 0; `npx next build` → 0.
- Pure rendering-perf change; no markup/layout/token changes visible.

## Deferred (pass 2, if still not smooth — visual trade-offs, need founder OK)
- Reduce/remove `backdrop-blur` on the sticky Nav (frosted-glass look) — sticky backdrop-filter recomputes every scroll frame.
- Reduce backdrop-blur on cards, or lower blur radius on orbs (blur-3xl → blur-2xl).
- Reconsider the fixed `noise` (mix-blend-overlay) + `grid-bg` overlays.
- Audit motion/react usage (ResultView etc.) for scroll-linked animations.
