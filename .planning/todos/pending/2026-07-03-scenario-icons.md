---
created: 2026-07-03T08:45:01.000Z
title: Scenario iconography (Best/Likely/Worst)
area: ui
files:
  - components/ResultView.tsx
---

## Problem

Best/Likely/Worst are distinguished only by color + text. Icons make the three
futures instantly parseable, even muted in a video.

## Solution

Add a lucide icon per tag (TrendingUp / Minus / TrendingDown) in the scenario
card chip, colored to match `TAG_STYLES`.
