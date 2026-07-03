---
created: 2026-07-03T07:50:51.983Z
title: Structured pre-simulation questions
area: ui
files:
  - components/SimulateForm.tsx
  - lib/prompts.ts
---

## Problem

Simulation input is raw free text only, so answers can feel generic. There's an easy, near-zero-cost (gpt-4o-mini) way to make answers feel bespoke.

## Solution

Before simulating, ask 2–3 optional structured questions (e.g. age range, what matters most to you, risk tolerance). Feed them into the decision prompt for more specific projections, and reuse them as share-card context. Add lightweight inputs to SimulateForm.tsx and thread the values through decisionPrompt in lib/prompts.ts. Keep it skippable so it doesn't add funnel friction.
