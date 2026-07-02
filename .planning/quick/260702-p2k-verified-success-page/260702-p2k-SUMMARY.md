---
quick_id: 260702-p2k
slug: verified-success-page
date: 2026-07-02
status: complete
area: auth
commit: 0acb9bc
---

# Summary — 260702-p2k — Email-verified success page + auto-redirect

## What changed

Replaced the silent `/?confirmed=1` landing after email confirmation with a
dedicated, brand-matched success page and wired failure feedback too.

- **New `app/verified/page.tsx`** ("use client", Nav/Footer/BackgroundOrbs like
  the other auth pages), two states via `?error`:
  - Success: green check, "Email verified", live countdown, `router.replace()`
    auto-redirect after ~2.8s + a manual "Continue now" link. Reads a sanitized
    `next` param (same-origin only), default `/decision` (activation path).
  - Failure/expired: amber warning, "Link expired" message, CTAs to `/signup`
    (new link) and `/login`.
  - `useSearchParams` wrapped in `<Suspense>` (Next 16 requirement).
- **`app/auth/confirm/route.ts`**: default success (`target === "/"`) now
  redirects to `/verified` instead of `/?confirmed=1`. Verify/exchange failures
  route to `/verified?error=confirmation_failed` for non-recovery types; the
  `recovery` type keeps its existing `/login?error=confirmation_failed`.

## Scope guard — recovery untouched

Password recovery links always carry `next=/reset` (`target !== "/"`), so they
skip the `/verified` branch entirely and still land on `/reset`. Only the
signup/email-confirmation path was rerouted.

## Files

- `app/verified/page.tsx` (new)
- `app/auth/confirm/route.ts` (success + failure redirect targets)

## Verification

- `npx tsc --noEmit` — clean.
- `npm run build` — succeeds; `/verified` prerendered static (○).

## Follow-up (not done)

Live E2E confirm-link click on what-if.tech to eyeball the redirect timing —
best done by the founder alongside the pending Wave 3 paid smoke test.

Commit: 0acb9bc. Source todo retired to `.planning/todos/completed/`.
