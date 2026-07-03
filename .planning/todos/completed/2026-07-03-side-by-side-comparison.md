---
created: 2026-07-03T07:50:51.983Z
title: Side-by-side decision comparison
area: ui
files:
  - app/api/simulate/route.ts
  - components/ResultView.tsx
  - lib/prompts.ts
---

## Problem

Users often frame decisions as A-vs-B ("stay vs. quit"), but the product only simulates one option at a time. A comparison view is highly clippable for TikTok and a clean Pro feature.

## Solution

Let the user simulate two options side by side, rendered as two columns of three-futures each. Pro-gated. Likely needs a comparison prompt variant (lib/prompts.ts) and either two simulate calls or one combined call, with a new comparison layout in ResultView. Design for a vertical/screen-recording-friendly layout.
