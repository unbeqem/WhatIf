---
created: 2026-07-03T08:45:00.000Z
title: Probability as hero visual + count-up
area: ui
files:
  - components/ResultView.tsx
---

## Problem

Scenario probability is shown as a 1px bar + static %. On a TikTok-native product
the probability should be the hero visual — bold and screen-recordable.

## Solution

Make the probability prominent: thicker glowing bar (or radial ring using the
existing `TAG_STYLES.ring` gradients) and animate the % counting up from 0 on
mount. Keep it tasteful and on-brand (neon glow).
