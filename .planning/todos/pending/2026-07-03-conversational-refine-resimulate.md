---
created: 2026-07-03T07:50:51.983Z
title: Conversational refine and re-simulate
area: api
files:
  - app/api/simulate/route.ts
  - components/ResultView.tsx
  - lib/prompts.ts
---

## Problem

The flow is one-shot: type decision → get 3 futures → done. It's a vending machine, not a conversation. This caps time-on-site, perceived depth, and gives no natural recurring reason to be a subscriber.

## Solution

After the result, let the user refine the scenario ("what if I also had a kid", "what if I had 6 months of savings") and re-simulate with the added context. Natural Pro gate: **Free = 1 shot, Pro = branch & refine**. Pass prior decision + refinement into a follow-up prompt (extend lib/prompts.ts). Add refine UI to ResultView and a branch-aware path in the simulate route. Gate refinement by plan (useMe / isSubscriberPlan).
