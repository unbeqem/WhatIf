---
created: 2026-07-02T14:09:51.601Z
title: Email-verified success page + auto-redirect
area: auth
files:
  - app/auth/confirm/route.ts
---

## Problem

After a user clicks the email confirmation link, they land on `/auth/confirm` (OTP token_hash exchange) but get no clear "you're verified" feedback — the UX is abrupt. We want a proper success screen ("Email erfolgreich verifiziert") followed by an automatic redirect (e.g. to `/decision` or the landing) after a short delay.

## Solution

TBD. Options: after successful token_hash verification in `app/auth/confirm/route.ts`, redirect to a new `/auth/verified` success page (client component with a checkmark + auto-redirect via setTimeout/router.push after ~2-3s), or render an interstitial. Keep it on-brand (existing globals.css tokens). Consider handling the failure/expired-link case with a distinct message too.

_Backlog / v2 (post current milestone)._
