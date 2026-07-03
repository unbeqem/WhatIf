---
created: 2026-07-03T08:45:02.000Z
title: Dramatic reveal + regret gauge
area: ui
files:
  - components/ResultView.tsx
---

## Problem

The recommendation and locked_insight land flatly. A little drama makes the
payoff feel earned and clip-worthy.

## Solution

Add a subtle pulse/glow "verdict" moment on the recommendation block. If the
locked_insight headline contains a % number, render it as an animated gauge/meter
alongside the text (a "regret meter").
