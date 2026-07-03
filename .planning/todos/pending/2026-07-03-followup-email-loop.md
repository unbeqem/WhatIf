---
created: 2026-07-03T07:50:51.983Z
title: Follow-up email loop after simulation
area: api
files:
  - app/api/simulate/route.ts
  - lib/supabase (planned)
---

## Problem

Low-frequency usage means users churn out of mind after one decision. There's no re-engagement mechanism, and no structured way to collect accuracy feedback or testimonials.

## Solution

~30 days after a simulation, email the user: "You simulated 'quit job' a month ago — what actually happened?" Drives re-engagement, gathers real-world accuracy data, and harvests testimonials for the social-proof block. Needs: persisted simulations (depends on decision-history todo), a scheduled trigger (Vercel Cron or Supabase scheduled function — must not require an always-on worker), and an email sender (note: SMTP/Resend has been fragile in this project). Capture a lightweight response (link back to a short "what happened" form). Largest scope of the batch; do last.
