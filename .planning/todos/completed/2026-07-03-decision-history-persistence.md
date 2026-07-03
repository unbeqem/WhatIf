---
created: 2026-07-03T07:50:51.983Z
title: Persist decision history for subscribers
area: database
files:
  - components/ResultView.tsx:46-54
  - app/result/page.tsx
  - lib/supabase (planned)
---

## Problem

Decision history is the single named retention feature and the honest justification for a recurring charge, but it currently lives only in sessionStorage["whatif:last"] and evaporates on tab close. It's marked v2/out-of-scope today. WhatIf's core weakness is low natural retention; persistent history is the main lever against that.

## Solution

Persist simulations for signed-in Pro/Creator users in Supabase (new `simulations` table: user_id, input, result json, created_at). Add a history list UI (likely /account or a /history route) and save-on-result for subscribers. Anon/free users keep the ephemeral sessionStorage behavior (which drives the upgrade). Respect GDPR/minimal-PII: store the decision text tied to user_id, allow deletion. Larger scope — needs the Supabase schema + RLS.
