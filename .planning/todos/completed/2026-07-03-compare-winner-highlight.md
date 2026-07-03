---
created: 2026-07-03T08:45:03.000Z
title: Compare view — highlight the stronger path
area: ui
files:
  - components/ResultView.tsx
---

## Problem

The two comparison columns look identical, so the reader has to do the math.

## Solution

Compute the stronger path (higher Best-Case probability, or lower Worst-Case) and
give that column a subtle glow + a "Better odds" / "Recommended" badge. Ties → no
badge.
