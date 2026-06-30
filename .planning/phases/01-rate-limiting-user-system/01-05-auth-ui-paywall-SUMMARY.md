---
phase: 01-rate-limiting-user-system
plan: 05
subsystem: auth-ui/paywall-surface
tags:
  - auth-ui
  - paywall
  - client-components
  - app-router-pages
  - tailwind-v4
  - demo-mode
requirements:
  - USAGE-04
  - AUTH-01
  - AUTH-02
  - AUTH-03
  - AUTH-04
dependency_graph:
  requires:
    - app/auth/signup/route.ts (Plan 03)
    - app/auth/login/route.ts (Plan 03)
    - app/auth/logout/route.ts (Plan 03)
    - app/auth/reset-request/route.ts (Plan 03)
    - app/auth/reset-confirm/route.ts (Plan 03)
    - app/auth/confirm/route.ts (Plan 03)
    - app/api/simulate/route.ts (Plan 04 — 429 limit_reached + rate_limited contract)
    - lib/supabase/client.ts (Plan 01 — createSupabaseBrowserClient + isSupabaseConfigured)
    - components/UpgradeButton.tsx (MVP — Pro CTA reuse)
    - components/Nav.tsx (MVP — existing nav surface)
    - components/SimulateForm.tsx (MVP — existing simulate form)
  provides:
    - components/AuthForm.tsx (reusable email/password form — 4 modes)
    - components/AuthNav.tsx (header chip — Sign in / email + Logout)
    - components/PaywallNotice.tsx (inline upgrade card — anon vs free variants)
    - app/login/page.tsx
    - app/signup/page.tsx
    - app/reset-request/page.tsx
    - app/reset/page.tsx
  affects:
    - Phase 2 (pro-bypass change in /api/simulate must preserve the 429 limit_reached contract to keep the paywall UI working)
    - Plan 06 (Stripe webhook → profiles.plan='pro' must result in checkQuota allowing every sim; PaywallNotice only triggers when checkQuota blocks)
tech-stack:
  added: []
  patterns:
    - "Reusable AuthForm with 4 modes (signup | login | reset-request | reset) — single component absorbs all auth form variations; pages only pass mode + endpoint + submitLabel + onSuccess"
    - "Demo-mode degradation: AuthNav renders null when !isSupabaseConfigured — Nav stays clean in MVP-only environments"
    - "Soft-paywall branch inline in SimulateForm: 429 limit_reached → PaywallNotice; 429 rate_limited → existing error banner with Retry-After hint; 200/400/500 unchanged"
    - "AuthForm error-code → user-facing copy map (ERROR_COPY) — UI consumes Plan 03's stable AuthErr enum"
    - "Field-level error highlighting via fieldError state — 400 invalid_input with field='email'|'password' colors the offending input border"
    - "Neutral reset-request 200 message ('If an account exists...') matches Plan 03's enumeration-resistant route behavior"
key-files:
  created:
    - components/AuthForm.tsx
    - components/AuthNav.tsx
    - components/PaywallNotice.tsx
    - app/login/page.tsx
    - app/signup/page.tsx
    - app/reset-request/page.tsx
    - app/reset/page.tsx
  modified:
    - components/SimulateForm.tsx (added PaywallNotice import + paywall state + 429 branching in submit + render below error banner)
    - components/Nav.tsx (added AuthNav import + <AuthNav /> render before "Try free" CTA)
decisions:
  - "Single AuthForm component with mode prop instead of four separate forms. Each mode toggles which inputs render (needsEmail / needsPassword), the autoComplete attribute, and how 200 responses are interpreted by the parent page via onSuccess. ~120 lines covers all four auth flows; four separate forms would be ~400 lines of near-duplicate code."
  - "AuthNav renders null when isSupabaseConfigured === false rather than showing a disabled 'Sign in' chip. Rationale: prevents users in demo mode from clicking a link that lands on /login → AuthForm → 503 auth_unavailable error. Hidden chip preserves the MVP UX."
  - "PaywallNotice variant chosen by limit prop (not by auth state). The route is the source of truth — anon visitors hit anon_daily, free users hit free_daily, pro users never trigger the notice. UI does not duplicate the routing logic."
  - "Anon variant CTA is 'Create free account' → /signup (sign-up funnel). Free variant CTA is <UpgradeButton plan='pro'>. Both variants share a 'Compare plans' → /#pricing fallback per USAGE-04."
  - "SimulateForm modification is minimal-diff: PaywallNotice import + paywall state + reset in submit + 429 branch + render. Existing oracle animation, example chips, character counter all preserved verbatim."
  - "Nav AuthNav placement: BEFORE the 'Try free' CTA inside the existing flex cluster. Reading order is identity → action — matches the convention used by most SaaS headers."
  - "/reset page does NOT redirect-guard for the temporary session itself; relies on /auth/reset-confirm to return 401 when no session is present. The redirect-on-success (/?reset=ok) is sufficient feedback; no client-side session probe is needed."
metrics:
  duration: "~4 min"
  completed: "2026-07-01"
  tasks_completed: 2
  tasks_pending: 1
  files_created: 7
  files_modified: 2
---

# Phase 1 Plan 05: Auth UI + Paywall Surface Summary

Built the user-visible surface for Phase 1: four auth pages (`/login`, `/signup`, `/reset-request`, `/reset`), three reusable client components (`AuthForm`, `AuthNav`, `PaywallNotice`), and minimal-diff modifications to `SimulateForm` (429 branching) and `Nav` (auth chip). All deliverables compile, type-check clean, and `next build` lists the four new pages as static routes in the manifest. Task 3 (founder visual + functional verification) is **pending founder action** — explicitly not executed by the executor per the plan's gated checkpoint design.

## One-liner

Four auth pages + three client components + two minimal-diff modifications (SimulateForm 429 branching, Nav AuthNav chip) — wires Plan 03's AuthErr contract and Plan 04's `429 limit_reached / rate_limited` contract into the visible product surface. Task 3 founder checkpoint pending.

## Files Created (7)

| File | Provides |
|------|----------|
| `components/AuthForm.tsx` | Reusable email/password form with 4 modes (signup, login, reset-request, reset). Maps Plan 03's `AuthErr` enum (`invalid_input`, `invalid_credentials`, `auth_unavailable`, `rate_limited`, `server_error`) to user-facing copy. Field-level error highlighting for `invalid_input` + `field`. |
| `components/AuthNav.tsx` | Header chip. Anonymous users see "Sign in" link to /login; authenticated users see truncated email + "Logout" button. Subscribes to `supabase.auth.onAuthStateChange` so the chip flickers without a manual refresh after login/logout. Renders null in demo mode (`!isSupabaseConfigured`). |
| `components/PaywallNotice.tsx` | Inline upgrade card rendered by SimulateForm on `429 limit_reached`. Two variants: `anon_daily` (sign-up CTA → /signup + Compare plans → /#pricing) and `free_daily` (UpgradeButton plan="pro" + Compare plans → /#pricing). |
| `app/login/page.tsx` | `<AuthForm mode="login" endpoint="/auth/login">`; onSuccess routes to `/`. Side links: /reset-request (Forgot password?) + /signup (Create an account →). |
| `app/signup/page.tsx` | `<AuthForm mode="signup" endpoint="/auth/signup">`; onSuccess with `data.needsConfirmation === true` renders the "Check your inbox" state inline (no redirect, no error). Side link: /login. |
| `app/reset-request/page.tsx` | `<AuthForm mode="reset-request" endpoint="/auth/reset-request">`; onSuccess shows neutral "If an account exists..." message (matches Plan 03's enumeration-resistant route). Side link: /login. |
| `app/reset/page.tsx` | `<AuthForm mode="reset" endpoint="/auth/reset-confirm">`; onSuccess pushes `/?reset=ok`. Reachable via /auth/confirm?next=/reset email-link landing. |

## Files Modified (2)

### `components/SimulateForm.tsx`

Five additive edits — existing oracle animation, example chips, character counter, focus/loading transitions all preserved verbatim:

1. **Import:** `import PaywallNotice from "@/components/PaywallNotice";`
2. **State:** `const [paywall, setPaywall] = useState<"anon_daily" | "free_daily" | null>(null);` next to the existing `error` state.
3. **Reset in submit():** `setPaywall(null);` next to `setError(null);` at the start of every submit.
4. **429 branching in submit():** the previously single-line `if (!res.ok) { ... }` block now branches on `res.status === 429 && data.error === "limit_reached"` (sets paywall, returns) and `res.status === 429 && data.error === "rate_limited"` (sets error with `Retry-After` hint copy, returns). 200/400/500 behavior unchanged.
5. **Render below error banner:** `{paywall && <PaywallNotice limit={paywall} />}` immediately after the existing `{error && ...}` block.

### `components/Nav.tsx`

Two additive edits:

1. **Import:** `import AuthNav from "@/components/AuthNav";`
2. **Render:** `<AuthNav />` inserted as the first child of the existing right-side action cluster (`<div className="flex items-center gap-2">`), before the "Try free" Link. Mobile menu toggle, sticky-scroll behavior, anchor links, all preserved.

## AuthForm Props Contract (for future reuse)

The contract Plan 06 and later may need if they add new auth flows:

```typescript
export type AuthMode = "signup" | "login" | "reset-request" | "reset";

type Props = {
  mode: AuthMode;
  endpoint: string;                // e.g. "/auth/login", "/auth/signup"
  submitLabel: string;             // e.g. "Sign in", "Create account"
  onSuccess: (body: any) => void;  // parsed JSON body from the 200 response
};
```

Mode controls input visibility:
- `signup` / `login` → email + password
- `reset-request` → email only
- `reset` → password only (no email; the temp session from `/auth/confirm?next=/reset` is what authorizes the change)

Error-code mapping (consumed from Plan 03's `AuthErr`):

| Server error | UI copy |
|--------------|---------|
| `invalid_input` + `field=email` | Highlights email input border; shows "Enter a valid email address." |
| `invalid_input` + `field=password` | Highlights password input border; shows "Password must be at least 8 characters." |
| `invalid_credentials` | "Wrong email or password." |
| `auth_unavailable` | "Auth is in demo mode. Configure Supabase in .env.local to enable accounts." |
| `rate_limited` | "Too many attempts. Wait a minute and try again." |
| `server_error` | "Something went wrong. Try again in a moment." |
| (unknown error code) | "Something went wrong." |
| (network failure / fetch throw) | "Connection failed. Check your network." |

## SimulateForm 429 Branching Shape (for Phase 2)

Phase 2's pro-bypass change in `/api/simulate` MUST preserve the following response contract — SimulateForm's branching keys off it directly:

```typescript
// 429 with limit_reached → PaywallNotice (NOT navigate to /result; NOT show error banner)
{ error: "limit_reached", limit: "anon_daily" | "free_daily" }

// 429 with rate_limited → error banner with Retry-After hint
{ error: "rate_limited", retryAfterSec: number }
```

Specifically, if Phase 2 adds a `pro` bypass:
- For pro users, `checkQuota` returns allowed (already implemented in Plan 04). PaywallNotice will never render for them.
- DO NOT introduce a new `limit` value (e.g. `"pro_throttle"`) without updating the `PaywallNotice` `limit` type union AND the branching in `SimulateForm.submit()` (currently `data.limit === "free_daily" ? "free_daily" : "anon_daily"` — defaults unknown values to anon variant).
- DO NOT remove the `retryAfterSec` field from `rate_limited` — the UI copy interpolates it (defaults to 60s if missing).

## AuthNav Demo-mode Behavior

When `!isSupabaseConfigured` (i.e. `NEXT_PUBLIC_SUPABASE_URL` unset):
- Component renders `null` after hydration.
- Nav remains visually identical to the MVP (just the "Try free" CTA + mobile menu toggle).
- Users cannot accidentally click into /login → /signup pages that would 503-error in demo mode.

When configured but no user:
- Renders a single "Sign in" pill linking to /login (hidden on mobile via `hidden sm:inline-flex` — mobile menu surfaces the action through other paths).

When configured + user present:
- Renders truncated email pill + Logout button. Logout POSTs to /auth/logout then `window.location.reload()` to force a clean re-hydration of all client components.

## Threat-Model Coverage (cross-check)

| Threat ID | Status | Mitigation |
|-----------|--------|------------|
| T-05-01 (AuthNav leaking email) | accepted | Email rendered only to the user themselves (server-validated via `auth.getUser()` in the browser client; no broadcast). |
| T-05-02 (XSS via user input rendering) | mitigated | All email/password values rendered via React text interpolation only — no `dangerouslySetInnerHTML` anywhere in any of the seven new components/pages. Verified by `grep -r dangerouslySetInnerHTML components/ app/login app/signup app/reset app/reset-request` returning zero hits. |
| T-05-03 (Open redirect on login success) | mitigated | `router.push("/")` (login), `router.push("/?reset=ok")` (reset), `setSent(true)` (signup + reset-request) — every `onSuccess` callback uses a literal hardcoded path. No user-controlled URL is ever passed to router.push. |
| T-05-04 (Paywall bypass via JS tampering) | accepted | Server `/api/simulate` enforces the same gate (Plan 04 `checkQuota`); UI is purely cosmetic — a user who deletes the PaywallNotice element from devtools still gets a 429 on their next POST. |
| T-05-05 (Email enumeration via reset copy) | mitigated | `/reset-request` page always shows the same neutral message "If an account exists for that email, we just sent a reset link." regardless of whether the email is registered (Plan 03's route always returns 200; this UI never branches on response data). |

No new threat surface introduced. No `threat_flag` rows added.

## Deviations from Plan

None — plan executed exactly as written. All seven file contents match the `<action>` block verbatim. All grep acceptance criteria pass. The Nav modification preserved every existing feature (sticky scroll, mobile menu toggle, anchor links, mobile-menu "Try free" CTA). The SimulateForm modification preserved the oracle animation, example chips, character counter, and 200/400/500 handling.

## Authentication Gates

None during Task 1 + Task 2 execution — these are pure code edits, no external auth or service calls required. Task 3 (the founder checkpoint) requires the founder to provision real Supabase + Upstash accounts and run 21 verification steps; this is intentional and out of scope for the executor.

## Acceptance Criteria Walkthrough

### Task 1 (3 components)

| # | Check | Result |
|---|---|---|
| 1 | `grep -c '"use client"' components/AuthForm.tsx` | 1 ✓ |
| 2 | `grep -c 'export type AuthMode' components/AuthForm.tsx` | 1 ✓ |
| 3 | `grep -c "fetch(endpoint" components/AuthForm.tsx` | 1 ✓ |
| 4 | `grep -c "invalid_credentials" components/AuthForm.tsx` | 1 ✓ |
| 5 | `grep -c "auth_unavailable" components/AuthForm.tsx` | 1 ✓ |
| 6 | `grep -c "onAuthStateChange" components/AuthNav.tsx` | 1 ✓ |
| 7 | `grep -c "createSupabaseBrowserClient" components/AuthNav.tsx` | 2 ✓ (import + call — wired) |
| 8 | `grep -c '"/auth/logout"' components/AuthNav.tsx` | 1 ✓ |
| 9 | `grep -c "isSupabaseConfigured" components/AuthNav.tsx` | 3 ✓ (>=1 required) |
| 10 | `grep -c '"/#pricing"' components/PaywallNotice.tsx` | 1 ✓ |
| 11 | `grep -c 'UpgradeButton plan="pro"' components/PaywallNotice.tsx` | 1 ✓ |
| 12 | `grep -cE '"anon_daily"\|"free_daily"' components/PaywallNotice.tsx` | 2 ✓ (>=2 required, W6 fix verified) |
| 13 | `npx tsc --noEmit` exits 0 | ✓ |

### Task 2 (4 pages + 2 modifications)

| # | Check | Result |
|---|---|---|
| 1 | All four pages exist | ✓ (app/login, app/signup, app/reset-request, app/reset/page.tsx) |
| 2 | All four pages contain `AuthForm` | ✓ (2 hits per page: import + JSX) |
| 3 | `grep -c "/auth/login" app/login/page.tsx` | 1 ✓ |
| 4 | `grep -c "/auth/signup" app/signup/page.tsx` | 1 ✓ |
| 5 | `grep -c "/auth/reset-request" app/reset-request/page.tsx` | 1 ✓ |
| 6 | `grep -c "/auth/reset-confirm" app/reset/page.tsx` | 1 ✓ |
| 7 | `grep -c "needsConfirmation" app/signup/page.tsx` | 1 ✓ |
| 8 | `grep -c 'import PaywallNotice' components/SimulateForm.tsx` | 1 ✓ |
| 9 | `grep -c '"limit_reached"' components/SimulateForm.tsx` | 1 ✓ |
| 10 | `grep -c '"rate_limited"' components/SimulateForm.tsx` | 1 ✓ |
| 11 | `grep -c "setPaywall" components/SimulateForm.tsx` | 3 ✓ (>=3 required: declaration + reset + set) |
| 12 | `grep -c 'import AuthNav' components/Nav.tsx` | 1 ✓ |
| 13 | `grep -c "<AuthNav" components/Nav.tsx` | 1 ✓ |
| 14 | `npx tsc --noEmit` exits 0 | ✓ |
| 15 | `next build` succeeds + 4 new pages in manifest | ✓ — manifest shows `○ /login`, `○ /signup`, `○ /reset`, `○ /reset-request` as static routes |

## Verification Receipts

- `npx tsc --noEmit` — exits 0 project-wide. Zero new errors introduced. (Plan 03's auth-route files + Plan 04's lib/quota + simulate route all still type-check clean.)
- `next build` — succeeded, 17 pages generated, all six auth routes from Plan 03 still present (`ƒ /auth/confirm`, `ƒ /auth/login`, `ƒ /auth/logout`, `ƒ /auth/reset-confirm`, `ƒ /auth/reset-request`, `ƒ /auth/signup`), and the four new pages added: `○ /login`, `○ /signup`, `○ /reset`, `○ /reset-request`.
- One pre-existing build warning preserved: `The "middleware" file convention is deprecated. Please use "proxy" instead.` — Plan 01's middleware, not in this plan's scope. Logged as deferred item by Plan 01 already.

## Task 3 Status: PENDING FOUNDER ACTION

Task 3 is `<task type="checkpoint:human-verify" gate="blocking">` — the founder's visual + functional sign-off on Phase 1 end-to-end. The executor explicitly **does NOT run** the 21 verification steps because:

1. Steps 1-2 require provisioning real Supabase + Upstash accounts (founder credentials, not in the executor's environment).
2. Step 3 starts a real `npm run dev` server that needs the founder's browser to drive through the flows.
3. Steps 4-19 require the founder to receive and click real confirmation/reset emails from Supabase Auth.
4. Step 15 requires the founder to inspect the Supabase dashboard.
5. Steps 20-21 require commenting env vars and restarting dev — out of scope for an autonomous run.

By design, Plan 05 is functionally complete when Task 1 + Task 2 ship clean code; Task 3 is the human-in-the-loop gate that decides whether Phase 1 ships. The founder will type "approved" (or list failing step numbers) when ready.

## Deferred Issues

None introduced by this plan.

The pre-existing `middleware.ts` → `proxy.ts` deprecation warning from Next.js 16 was logged as a deferred item in Plan 01's summary; not addressed here because the plan's `files_modified` boundary excludes `middleware.ts`.

## Self-Check: PASSED

- All 7 created files exist on disk (verified by Write success + Glob confirmation: `components\AuthForm.tsx`, `components\AuthNav.tsx`, `components\PaywallNotice.tsx`, `app\login\page.tsx`, `app\signup\page.tsx`, `app\reset-request\page.tsx`, `app\reset\page.tsx`).
- Both modified files are still committed-state intact except for the planned additive edits (verified by tsc + next build success).
- `npx tsc --noEmit` exits 0.
- `next build` lists all four new pages (`/login`, `/signup`, `/reset`, `/reset-request`) as `○` (static) in the manifest.
- All 13 Task 1 + 15 Task 2 acceptance grep counts match the plan.
- No files touched outside the plan's `files_modified` list. No CLAUDE.md directives violated (path alias `@/*`, `"use client"` on interactive components, no comments unless WHY is non-obvious, no new Tailwind tokens).
- Commit hash will be recorded by the harness after the commit step below.
