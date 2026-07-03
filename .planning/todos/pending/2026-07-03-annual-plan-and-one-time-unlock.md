---
created: 2026-07-03T07:50:51.983Z
title: Add annual plan + one-time decision unlock
area: api
files:
  - lib/stripe.ts:14-66
  - app/api/stripe/route.ts
---

## Problem

Only monthly subscriptions exist (Pro €5/mo, Creator €9/mo). WhatIf is a high-novelty, low-frequency product — people don't make big life decisions weekly — so a monthly sub is the wrong shape for most visitors and leaks most of the revenue. Bootstrap cash flow also suffers with monthly-only.

## Solution

1. **Annual plan (~€40/yr)** — improves LTV and gives upfront cash. Add as a Stripe recurring price with `interval: "year"`.
2. **One-time "deep dive on this decision" unlock (~€2–3)** — a `mode: "payment"` Checkout Session that unlocks the full breakdown for the current decision only. Captures the majority who will never commit to a recurring charge, at the emotional peak.

Extend the PLANS config and createCheckoutSession in lib/stripe.ts to support interval and one-time modes; wire plan selection through app/api/stripe/route.ts. Keep demo-mode fallback intact.
