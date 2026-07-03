---
created: 2026-07-03T07:50:51.983Z
title: Visible blurred paywall on free result
area: ui
files:
  - components/ResultView.tsx:175-203
  - lib/prompts.ts
  - lib/types.ts
---

## Problem

The soft paywall currently *describes* held-back value in text ("deeper second-order effects, the kill-switch metric, and history"). The free result already feels complete and satisfying, so the user never feels held back — this is the single biggest conversion killer. Willingness-to-pay peaks right after a heavy answer, but there's nothing concrete to unlock.

## Solution

Render a real 4th block on the free result that is visibly locked (blurred) rather than described:
- A concrete teaser title like "What people in your position most regret at year 5", OR
- A single big number payload like "78% chance you regret NOT doing this".

The block should be actually generated (so it's real, not fake) and blurred/masked for free users, with the upgrade CTA layered over it. Curiosity gap beats a feature list. Extend the prompt/JSON contract (lib/prompts.ts, lib/types.ts) to produce this extra field; gate its reveal in ResultView by plan. Highest-leverage conversion change — small scope.
