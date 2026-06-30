---
phase: 01-rate-limiting-user-system
plan: 03
subsystem: auth/route-handlers
tags:
  - supabase-auth
  - app-router
  - route-handlers
  - demo-mode
  - pkce
requirements:
  - AUTH-01
  - AUTH-02
  - AUTH-04
dependency_graph:
  requires:
    - lib/supabase/server.ts (createSupabaseServerClient — Plan 01)
  provides:
    - app/auth/signup/route.ts (POST -> supabase.auth.signUp)
    - app/auth/login/route.ts (POST -> supabase.auth.signInWithPassword)
    - app/auth/logout/route.ts (POST -> supabase.auth.signOut)
    - app/auth/confirm/route.ts (GET -> exchangeCodeForSession; dual-purpose email confirm + reset link)
    - app/auth/reset-request/route.ts (POST -> resetPasswordForEmail)
    - app/auth/reset-confirm/route.ts (POST -> updateUser({ password }))
    - lib/auth/validate.ts (parseCredentials, parseEmail, parsePassword, EMAIL_RE)
  affects:
    - Plan 05 (UI consumes the AuthOk | AuthErr JSON contract)
    - Plan 04 (gated simulate reads session set by /auth/login)
tech-stack:
  added: []
  patterns:
    - "Route handlers under app/auth/*/route.ts (not app/api/) — matches the email-link redirect path Supabase needs for /auth/confirm"
    - "Demo-mode 503 fallback: every route short-circuits with `{ error: 'auth_unavailable' }` when NEXT_PUBLIC_SUPABASE_URL is unset (logout returns 200 instead — no session to clear)"
    - "Dual-purpose /auth/confirm: same exchangeCodeForSession call handles both email-confirmation and password-reset email links; `?next=` query param differentiates the post-exchange landing"
    - "Stable AuthErr shape: `invalid_input | invalid_credentials | auth_unavailable | rate_limited | server_error` — UI in Plan 05 switches on this enum"
key-files:
  created:
    - app/auth/signup/route.ts
    - app/auth/login/route.ts
    - app/auth/logout/route.ts
    - app/auth/confirm/route.ts
    - app/auth/reset-request/route.ts
    - app/auth/reset-confirm/route.ts
    - lib/auth/validate.ts
  modified: []
decisions:
  - "Dual-purpose /auth/confirm (one handler, ?next= differentiator) instead of separate /auth/confirm-email and /auth/confirm-reset. Supabase uses the same exchangeCodeForSession call for both flows; splitting would duplicate ~20 lines for zero behavioral difference."
  - "Reset-request always returns 200 even when Supabase errors (T-03-02). The 200-on-error path logs server-side via console.error but never surfaces to the client, so callers cannot probe which emails are registered."
  - "Open-redirect guard on /auth/confirm rejects both external URLs AND protocol-relative URLs (`next.startsWith(\"/\") && !next.startsWith(\"//\")`). W2 fix — `new URL(\"//evil.com\", origin)` resolves off-origin and a bare startsWith('/') check would allow it."
  - "Login error normalization: Supabase returns 400 for bad credentials; route maps both 400 and 401 to a unified `{ error: 'invalid_credentials' }` 401 response so the UI has one error code to switch on."
  - "Demo-mode logout returns 200 (not 503) because there is nothing to clear; the client UX should not surface 'auth_unavailable' when its intent is simply to leave."
metrics:
  completed: "2026-07-01"
  duration: "~6 minutes"
  tasks: 2
  files_created: 7
  files_modified: 0
---

# Phase 1 Plan 3: Auth Routes Summary

Built the six App Router auth route handlers (`signup`, `login`, `logout`, `confirm`, `reset-request`, `reset-confirm`) plus one validation helper. All routes are autonomous, demo-tolerant (503 / 200 fallback when Supabase env is unset), and emit a stable `AuthOk | AuthErr` JSON contract that Plan 05's UI consumes.

## One-liner

Six Supabase-auth route handlers (signup/login/logout + dual-purpose email-confirm + reset-request/reset-confirm) sharing one validator helper and one stable JSON error shape — auth state-mutation surface for AUTH-01..04.

## Files Created

| File | Method + Path | Supabase Call | Purpose |
|------|--------------|---------------|---------|
| `app/auth/signup/route.ts` | `POST /auth/signup` | `auth.signUp({ email, password, options: { emailRedirectTo } })` | Creates user, triggers confirmation email, returns `{ ok: true, needsConfirmation: true }`. |
| `app/auth/login/route.ts` | `POST /auth/login` | `auth.signInWithPassword({ email, password })` | Sets SSR session cookies on success; 401 `invalid_credentials` on bad creds; 429 `rate_limited` on Supabase throttle. |
| `app/auth/logout/route.ts` | `POST /auth/logout` | `auth.signOut()` | Clears SSR cookies. Always returns 200 (idempotent). |
| `app/auth/confirm/route.ts` | `GET /auth/confirm?code=...&next=...` | `auth.exchangeCodeForSession(code)` | Dual-purpose: handles BOTH email-confirmation AND password-reset email links. `?next=` selects post-exchange landing. |
| `app/auth/reset-request/route.ts` | `POST /auth/reset-request` | `auth.resetPasswordForEmail(email, { redirectTo })` | Triggers reset email; ALWAYS returns 200 to prevent email-enumeration. Routes link through `/auth/confirm?next=/reset`. |
| `app/auth/reset-confirm/route.ts` | `POST /auth/reset-confirm` | `auth.getUser()` then `auth.updateUser({ password })` | Requires active reset session (set by `/auth/confirm` exchange); 401 if absent. |
| `lib/auth/validate.ts` | (lib) | — | Pure helpers: `parseCredentials`, `parseEmail`, `parsePassword`, `EMAIL_RE`. Returns discriminated `ValidationResult<T>`. |

## JSON Contract (consumed by Plan 05 UI)

```typescript
type AuthOk =
  | { ok: true }
  | { ok: true; needsConfirmation: true }
  | { ok: true; redirectTo: string };

type AuthErr =
  | { error: "invalid_input"; field?: "email" | "password" | "body" }
  | { error: "invalid_credentials" }
  | { error: "auth_unavailable" }    // env missing -> 503
  | { error: "rate_limited" }        // Supabase 429
  | { error: "server_error" };       // 500
```

Status-code mapping:
- `200` — `AuthOk`
- `400` — `invalid_input`
- `401` — `invalid_credentials`
- `429` — `rate_limited`
- `500` — `server_error`
- `503` — `auth_unavailable`

The `confirm` route does NOT return JSON — it always issues a 302 redirect (success → `/?confirmed=1` or `next` target; failure → `/login?error=<code>`).

## The `?next=` Convention for /auth/confirm

`/auth/confirm` is reused for two flows:

1. **Signup confirmation:** Signup sets `emailRedirectTo: ${origin}/auth/confirm` (no `?next`). User clicks email link → code exchanged → redirect to `/?confirmed=1`.
2. **Password reset:** Reset-request sets `redirectTo: ${origin}/auth/confirm?next=/reset`. User clicks reset email → code exchanged (gives them a temporary session) → redirect to `/reset` (Plan 05's password-form page) → user submits new password → `POST /auth/reset-confirm` uses the temp session to authorize `updateUser({ password })`.

**Open-redirect guard (W2 fix):** `target = next.startsWith("/") && !next.startsWith("//") ? next : "/"`. Rejects external URLs (`https://evil.com`) AND protocol-relative URLs (`//evil.com`). Without the `!next.startsWith("//")` check, `new URL("//evil.com", origin)` would resolve to `https://evil.com` and silently produce an off-origin redirect.

## Demo-mode Behavior (NEXT_PUBLIC_SUPABASE_URL unset)

| Route | Demo response |
|-------|---------------|
| signup | 503 `{ error: "auth_unavailable" }` |
| login | 503 `{ error: "auth_unavailable" }` |
| logout | 200 `{ ok: true }` (idempotent — no session to clear) |
| confirm | 302 → `/login?error=auth_unavailable` |
| reset-request | 503 `{ error: "auth_unavailable" }` |
| reset-confirm | 503 `{ error: "auth_unavailable" }` |

Rationale for the logout-200 asymmetry: a user clicking "log out" in demo mode should not see an `auth_unavailable` error. The intent (leave the session) is already satisfied — there is no session.

## Validation Helper (`lib/auth/validate.ts`)

Three pure functions consumed by routes:

- `parseCredentials(raw)` — used by signup + login. Requires `{ email, password }` where email matches `EMAIL_RE` and password is 8–200 chars. Returns `{ ok: true, value: { email: <lowercased+trimmed>, password } }` or `{ ok: false, field }`.
- `parseEmail(raw)` — used by reset-request. Email-only variant of the above.
- `parsePassword(raw)` — used by reset-confirm. Password-only variant.

`EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/` — deliberately permissive; Supabase performs the authoritative check downstream. Our regex catches obvious garbage to avoid wasting a Supabase round-trip.

## Deviations from Plan

None — plan executed exactly as written. All file contents match the `<action>` block verbatim. All acceptance criteria verified by grep.

## Threat Surface Scan

All mitigations from the plan's threat register are in place:

| Threat ID | Mitigation Applied |
|-----------|--------------------|
| T-03-01 (brute-force login) | Login route forwards Supabase 429 → `{ error: 'rate_limited' }`. |
| T-03-02 (reset email enumeration) | `/auth/reset-request` ALWAYS returns 200; `console.error` only on server. |
| T-03-03 (verbose error leakage) | All routes emit fixed-shape `{ error: <code> }`; raw Supabase messages stay in `console.error` only. |
| T-03-04 (open-redirect via `next`) | `next.startsWith("/") && !next.startsWith("//")` (W2 fix — rejects protocol-relative). |
| T-03-05 (privilege escalation on reset) | `/auth/reset-confirm` calls `auth.getUser()` and returns 401 if no user. |
| T-03-06 (auth event logging) | Accepted — Supabase Auth dashboard provides audit logs. |
| T-03-07 (signup spam DoS) | Accepted — Supabase Auth ships per-IP signup limiter. |

No new threat surface beyond the register. No `threat_flag` rows added.

## Verification Receipts

- `npx tsc --noEmit` — all six route files + validator typecheck clean (errors visible in output are in `lib/quota.ts`, owned by Plan 04's parallel wave-2 work; out of scope per the executor instructions).
- `next build` — succeeded. All six auth routes appear in the build summary: `ƒ /auth/confirm`, `ƒ /auth/login`, `ƒ /auth/logout`, `ƒ /auth/reset-confirm`, `ƒ /auth/reset-request`, `ƒ /auth/signup`.
- `grep -r "auth_unavailable" app/auth/` — lists all five non-logout routes (signup, login, confirm, reset-request, reset-confirm). Logout intentionally uses 200 fallback.
- `grep -r "exchangeCodeForSession" app/auth/` — single match in `/auth/confirm` only.
- W2 fix verified: `grep -cE '!next\.startsWith\("//"\)' app/auth/confirm/route.ts` returns 1.

## Self-Check: PASSED

- All seven created files exist on disk (verified via Write tool success + Glob).
- Project `tsc --noEmit` reports zero errors in Plan 03's files (the lib/quota.ts errors belong to Plan 04's parallel wave-2 work).
- `next build` succeeds — every route handler signature conforms.
- All Task 1 + Task 2 acceptance grep counts match the plan.
- W2 protocol-relative open-redirect guard present and verified.
- No files touched outside `app/auth/` and `lib/auth/` — Plan 04's territory (`app/api/simulate`, `lib/quota.ts`, `lib/ratelimit.ts`) and Wave 1's files (`lib/supabase/*`, `lib/anon.ts`, `lib/db.types.ts`, `lib/upstash.ts`, `middleware.ts`, `supabase/migrations/*`) untouched.
