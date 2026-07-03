---
quick_id: 260703-eum
title: Clearer auth error handling (weak password, email not confirmed)
date: 2026-07-03
status: complete
commit: 28c2b4f
---

# Quick Task 260703-eum — Summary

## What changed

Auth routes no longer collapse every non-429 Supabase error into a generic
`server_error` 500. The real reason now reaches the user.

- **`lib/auth/error-map.ts`** (new) — `interpretAuthError(error)` → `{ code, status, message? }`.
  Detects `weak_password` (by `error.code` or status 422) and builds a specific
  message from `error.reasons` (`length` → "at least 8 characters"; `characters`
  → "an uppercase letter, a lowercase letter, a number, and a symbol"; `pwned` →
  breach warning), falling back to the full policy string. Also detects
  `email_not_confirmed`, `email_exists`/`user_already_exists`, `invalid_credentials`,
  and rate limits. `weakPasswordMessage()` exported for direct use/testing.
- **`app/auth/signup/route.ts`** — `weak_password` → 400 `{error,message}`,
  `email_exists` → 409, `rate_limited` → 429, else 500.
- **`app/auth/login/route.ts`** — adds `email_not_confirmed` → 403; keeps
  `invalid_credentials` (400/401→401) + `rate_limited`.
- **`app/auth/reset-confirm/route.ts`** — 422 now returns precise `weak_password`
  `{error,message}` instead of a misleading "must be at least 8 characters".
- **`components/AuthForm.tsx`** — `ERROR_COPY` for `weak_password` /
  `email_not_confirmed` / `email_exists`; prefers the server's `data.message`;
  highlights password field on `weak_password`, email field on `email_exists`.

## Verification

- `npx tsc --noEmit` — clean
- `npx vitest run` — 45 passed (4 files), +12 new `error-map` tests
- Demo-mode (`auth_unavailable` 503) behavior unchanged

## Notes

Resolves the known cleanup tracked in project memory (weak_password/422 collapsed
into 500). Not yet re-verified against live prod auth — worth a logged-out signup
with a weak password on what-if.tech after deploy to confirm the message renders.
