---
created: 2026-07-03T07:50:51.983Z
title: Free watermarked share cards, push Creator
area: ui
files:
  - components/ShareCard.tsx
  - components/ResultView.tsx:205-210
---

## Problem

WhatIf is TikTok-first; the shareable 9:16 story card IS the acquisition engine. Gating ALL sharing behind the Creator tier strangles the viral loop before it can start. The growth tier (Creator, exports) should be pushed harder than Pro, because every share is a free ad.

## Solution

- Let **free users** export a **watermarked** 9:16 story card ("Simulated on WhatIf →" badge / URL burned in).
- **Creator** gets the clean/branded export (no watermark, custom styling).
- Reframe the upsell so Creator is presented as the growth/creator tier, not just "Pro + extras".

Adjust ShareCard.tsx gating (currently Creator-only) to allow a watermarked variant for free/anon users; branch styling by plan. Confirm this still reads well in a screen recording.
