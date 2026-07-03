---
quick_id: 260703-eum
title: Clearer auth error handling (weak password, email not confirmed)
date: 2026-07-03
status: in-progress
---

# Quick Task 260703-eum — Clearer auth error handling

## Problem

`app/auth/signup/route.ts` and `login/route.ts` collapse every non-429 Supabase
error into a generic `server_error` 500 ("Something went wrong"). Supabase enforces
a password policy (min 8 + upper + lower + digit + symbol) and returns
`weak_password`/422, but the user never sees the real reason. `reset-confirm`
maps 422 to a misleading "must be at least 8 characters". `AuthForm`'s `ERROR_COPY`
has no `weak_password` / `email_not_confirmed` keys.

## Solution

1. **`lib/auth/error-map.ts`** (new): `interpretAuthError(error)` → discriminated
   result. Detects `weak_password` (`error.code === "weak_password"` or status 422),
   building a specific message from `error.reasons` (length / characters / pwned),
   falling back to the full policy string. Also detects `email_not_confirmed` and
   `email_exists` / `user_already_exists` by `error.code`.
2. **`app/auth/signup/route.ts`**: map `weak_password` → 400 `{error,message}`,
   `email_exists` → 409; keep 429 rate_limited, generic 500 for unknown.
3. **`app/auth/login/route.ts`**: add `email_not_confirmed` → 403; keep
   invalid_credentials (400/401→401) + rate_limited.
4. **`app/auth/reset-confirm/route.ts`**: replace 422→generic with precise
   `weak_password` `{error,message}`.
5. **`components/AuthForm.tsx`**: add `ERROR_COPY` for `weak_password`,
   `email_not_confirmed`, `email_exists`; prefer server `data.message`; set
   `fieldError` to "password" (weak_password) / "email" (email_exists).

Keep demo-mode (`auth_unavailable` 503) intact. Unit tests for `interpretAuthError`.

## Verify

- `npx tsc --noEmit` clean
- `npx vitest run` green (new error-map tests + existing suite)
- Weak password on signup returns a message naming the exact requirement.
