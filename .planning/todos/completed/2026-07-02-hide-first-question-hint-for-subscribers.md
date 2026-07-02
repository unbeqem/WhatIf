---
created: 2026-07-02T14:09:51.601Z
title: Hide "ask your first question" hint for subscribers after a question
area: ui
files:
  - components/SimulateForm.tsx
  - components/ResultView.tsx
  - lib/useMe.ts
---

## Problem

The UI shows a "stelle deine erste Frage" / "ask your first question" prompt at the bottom. For a user who has already asked a question AND holds a Pro (or higher) account, this hint is redundant and should not be shown.

## Solution

TBD. Make the hint plan-aware (reuse `useMe()` / `isSubscriberPlan` like the new `components/PricingCta.tsx`): if the viewer is pro/creator and a question has already been asked (session/history state), hide the "first question" hint. Locate the exact hint element (likely in `components/SimulateForm.tsx` or a landing/decision surface) and gate its render. Small UI-only change once the exact copy/element is found.

_Backlog / v2 (post current milestone)._
