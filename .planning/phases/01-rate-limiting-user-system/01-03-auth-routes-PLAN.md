---
phase: 01-rate-limiting-user-system
plan: 03
type: execute
wave: 2
depends_on:
  - 01
files_modified:
  - app/auth/signup/route.ts
  - app/auth/login/route.ts
  - app/auth/logout/route.ts
  - app/auth/reset-request/route.ts
  - app/auth/reset-confirm/route.ts
  - app/auth/confirm/route.ts
  - lib/auth/validate.ts
autonomous: true
requirements:
  - AUTH-01
  - AUTH-02
  - AUTH-04

must_haves:
  truths:
    - "POST /auth/signup creates a Supabase user, triggers the confirmation email, and returns 200 with `{ needsConfirmation: true }`."
    - "POST /auth/login with valid email/password returns 200 and sets the Supabase SSR session cookie; invalid creds return 401 with a stable error shape."
    - "POST /auth/logout clears the SSR cookies and returns 200."
    - "GET /auth/confirm?code=... exchanges the OTP token for a session (Supabase PKCE flow) and redirects to '/' on success or '/login?error=...' on failure."
    - "POST /auth/reset-request triggers a password-reset email; always returns 200 (never leaks whether the email exists)."
    - "POST /auth/reset-confirm with a valid reset session updates the password and returns 200."
    - "All routes validate input shape and return 400 with `{ error }` on bad payloads."
    - "When Supabase env is missing, routes return 503 with `{ error: 'auth_unavailable' }` instead of crashing (demo-mode philosophy)."
  artifacts:
    - path: "app/auth/signup/route.ts"
      provides: "POST handler -> supabase.auth.signUp"
      contains: "signUp"
    - path: "app/auth/login/route.ts"
      provides: "POST handler -> supabase.auth.signInWithPassword"
      contains: "signInWithPassword"
    - path: "app/auth/logout/route.ts"
      provides: "POST handler -> supabase.auth.signOut"
      contains: "signOut"
    - path: "app/auth/confirm/route.ts"
      provides: "GET handler -> exchangeCodeForSession; redirects after"
      contains: "exchangeCodeForSession"
    - path: "app/auth/reset-request/route.ts"
      provides: "POST handler -> resetPasswordForEmail"
      contains: "resetPasswordForEmail"
    - path: "app/auth/reset-confirm/route.ts"
      provides: "POST handler -> updateUser({ password })"
      contains: "updateUser"
    - path: "lib/auth/validate.ts"
      provides: "parseCredentials(body) and parsePassword(body) helpers"
      contains: "EMAIL_RE"
  key_links:
    - from: "all /app/auth/* route handlers"
      to: "lib/supabase/server.ts createSupabaseServerClient"
      via: "await createSupabaseServerClient() per request"
      pattern: "createSupabaseServerClient"
    - from: "app/auth/confirm/route.ts"
      to: "supabase.auth.exchangeCodeForSession"
      via: "code from URL search param"
      pattern: "exchangeCodeForSession"
    - from: "app/auth/reset-request/route.ts redirect URL"
      to: "/reset (UI page built in Plan 05)"
      via: "options.redirectTo = `${origin}/reset`"
      pattern: "redirectTo"
---

<objective>
Build the six App Router route handlers that wrap Supabase Auth for the founder-required flows: signup with email confirmation, login, logout, email-confirm callback, password-reset request, and password-reset confirm. Plus one tiny validation helper used by all of them.

Purpose: AUTH-01..AUTH-04 require the full email/password lifecycle. The UI plan (05) calls these routes; the gated simulate route (Plan 04) reads the session they set. This plan owns the auth state-mutation surface; everything downstream just reads or redirects.

Output: Six route files + one validation helper. Every route is autonomous (no checkpoints), demo-tolerant (503 when env missing), and returns a consistent error shape.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/REQUIREMENTS.md
@.planning/phases/01-rate-limiting-user-system/01-01-supabase-upstash-infra-SUMMARY.md
@CLAUDE.md
@app/api/simulate/route.ts
@lib/supabase/server.ts

<interfaces>
<!-- The Supabase server client created in Plan 01 -->

```typescript
// From lib/supabase/server.ts (Plan 01)
export async function createSupabaseServerClient(): Promise<SupabaseClient<Database>>;
```

<!-- Supabase Auth method signatures the routes will call -->

```typescript
supabase.auth.signUp({ email, password, options: { emailRedirectTo } })
  // -> { data: { user, session }, error }

supabase.auth.signInWithPassword({ email, password })
  // -> { data: { user, session }, error }

supabase.auth.signOut()
  // -> { error }

supabase.auth.exchangeCodeForSession(code)
  // -> { data: { session, user }, error }   (used for both email confirm and reset)

supabase.auth.resetPasswordForEmail(email, { redirectTo })
  // -> { data: {}, error }

supabase.auth.updateUser({ password })
  // -> { data: { user }, error }  (requires an active reset session)
```

<!-- Response contract used by all routes (UI in Plan 05 parses this) -->

```typescript
type AuthOk =
  | { ok: true }
  | { ok: true; needsConfirmation: true }
  | { ok: true; redirectTo: string };

type AuthErr =
  | { error: "invalid_input"; field?: string }
  | { error: "invalid_credentials" }
  | { error: "auth_unavailable" }       // env missing -> 503
  | { error: "rate_limited" }           // Supabase responded with 429
  | { error: "server_error" };
```
</interfaces>
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Validation helpers + signup, login, logout routes</name>
  <files>lib/auth/validate.ts, app/auth/signup/route.ts, app/auth/login/route.ts, app/auth/logout/route.ts</files>
  <read_first>
    - app/api/simulate/route.ts (mirror its `NextRequest -> NextResponse.json` style and `runtime = "nodejs"` declaration)
    - lib/supabase/server.ts (the `createSupabaseServerClient` contract from Plan 01)
    - lib/openai.ts (demo-mode pattern: when external dep is null, return graceful fallback)
    - CLAUDE.md (App Router conventions: route handlers under app/api/*/route.ts or app/auth/*/route.ts)
  </read_first>
  <behavior>
    - Test 1: `POST /auth/signup` with `{ email: "x@x.com", password: "abcdef12" }` returns 200 `{ ok: true, needsConfirmation: true }`.
    - Test 2: `POST /auth/signup` with malformed email returns 400 `{ error: "invalid_input", field: "email" }`.
    - Test 3: `POST /auth/signup` with password < 8 chars returns 400 `{ error: "invalid_input", field: "password" }`.
    - Test 4: `POST /auth/login` with valid creds returns 200 `{ ok: true }` and Supabase has set cookies on the response.
    - Test 5: `POST /auth/login` with bad creds returns 401 `{ error: "invalid_credentials" }`.
    - Test 6: `POST /auth/logout` returns 200 `{ ok: true }` regardless of whether a session existed.
    - Test 7: With Supabase env unset, all three routes return 503 `{ error: "auth_unavailable" }`.
  </behavior>
  <action>
    Create the four files below.

    **`lib/auth/validate.ts`** — tiny pure validators used by every auth route:
    ```typescript
    // RFC-5322 lite: good-enough email shape check. Supabase does the real validation.
    export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    export type Credentials = { email: string; password: string };

    export type ValidationResult<T> =
      | { ok: true; value: T }
      | { ok: false; field: "email" | "password" | "body" };

    export function parseCredentials(raw: unknown): ValidationResult<Credentials> {
      if (!raw || typeof raw !== "object") return { ok: false, field: "body" };
      const r = raw as Record<string, unknown>;
      if (typeof r.email !== "string" || !EMAIL_RE.test(r.email.trim())) {
        return { ok: false, field: "email" };
      }
      if (typeof r.password !== "string" || r.password.length < 8 || r.password.length > 200) {
        return { ok: false, field: "password" };
      }
      return { ok: true, value: { email: r.email.trim().toLowerCase(), password: r.password } };
    }

    export function parsePassword(raw: unknown): ValidationResult<{ password: string }> {
      if (!raw || typeof raw !== "object") return { ok: false, field: "body" };
      const r = raw as Record<string, unknown>;
      if (typeof r.password !== "string" || r.password.length < 8 || r.password.length > 200) {
        return { ok: false, field: "password" };
      }
      return { ok: true, value: { password: r.password } };
    }

    export function parseEmail(raw: unknown): ValidationResult<{ email: string }> {
      if (!raw || typeof raw !== "object") return { ok: false, field: "body" };
      const r = raw as Record<string, unknown>;
      if (typeof r.email !== "string" || !EMAIL_RE.test(r.email.trim())) {
        return { ok: false, field: "email" };
      }
      return { ok: true, value: { email: r.email.trim().toLowerCase() } };
    }
    ```

    **`app/auth/signup/route.ts`**:
    ```typescript
    import { NextRequest, NextResponse } from "next/server";
    import { createSupabaseServerClient } from "@/lib/supabase/server";
    import { parseCredentials } from "@/lib/auth/validate";

    export const runtime = "nodejs";

    export async function POST(req: NextRequest) {
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
        return NextResponse.json({ error: "auth_unavailable" }, { status: 503 });
      }

      const body = await req.json().catch(() => null);
      const parsed = parseCredentials(body);
      if (!parsed.ok) {
        return NextResponse.json({ error: "invalid_input", field: parsed.field }, { status: 400 });
      }

      const supabase = await createSupabaseServerClient();
      const origin =
        process.env.NEXT_PUBLIC_URL ??
        req.nextUrl.origin;

      const { error } = await supabase.auth.signUp({
        email: parsed.value.email,
        password: parsed.value.password,
        options: {
          emailRedirectTo: `${origin}/auth/confirm`,
        },
      });

      if (error) {
        if (error.status === 429) {
          return NextResponse.json({ error: "rate_limited" }, { status: 429 });
        }
        console.error("[auth/signup] error", error.message);
        return NextResponse.json({ error: "server_error" }, { status: 500 });
      }

      return NextResponse.json({ ok: true, needsConfirmation: true });
    }
    ```

    **`app/auth/login/route.ts`**:
    ```typescript
    import { NextRequest, NextResponse } from "next/server";
    import { createSupabaseServerClient } from "@/lib/supabase/server";
    import { parseCredentials } from "@/lib/auth/validate";

    export const runtime = "nodejs";

    export async function POST(req: NextRequest) {
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
        return NextResponse.json({ error: "auth_unavailable" }, { status: 503 });
      }

      const body = await req.json().catch(() => null);
      const parsed = parseCredentials(body);
      if (!parsed.ok) {
        return NextResponse.json({ error: "invalid_input", field: parsed.field }, { status: 400 });
      }

      const supabase = await createSupabaseServerClient();
      const { error } = await supabase.auth.signInWithPassword(parsed.value);

      if (error) {
        // Supabase returns 400 for bad creds — normalize to 401.
        if (error.status === 400 || error.status === 401) {
          return NextResponse.json({ error: "invalid_credentials" }, { status: 401 });
        }
        if (error.status === 429) {
          return NextResponse.json({ error: "rate_limited" }, { status: 429 });
        }
        console.error("[auth/login] error", error.message);
        return NextResponse.json({ error: "server_error" }, { status: 500 });
      }

      return NextResponse.json({ ok: true });
    }
    ```

    **`app/auth/logout/route.ts`**:
    ```typescript
    import { NextResponse } from "next/server";
    import { createSupabaseServerClient } from "@/lib/supabase/server";

    export const runtime = "nodejs";

    export async function POST() {
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
        return NextResponse.json({ ok: true }); // demo mode: no session existed
      }

      const supabase = await createSupabaseServerClient();
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("[auth/logout] error", error.message);
        // Cookies may already be cleared; treat as success from the client's POV.
      }
      return NextResponse.json({ ok: true });
    }
    ```
  </action>
  <verify>
    <automated>npx tsc --noEmit 2>&1 | grep -v '^$' | grep -E '(error|Error)' | grep -v -E '(node_modules|\.next)' || echo "OK"</automated>
  </verify>
  <acceptance_criteria>
    - `grep -c "export function parseCredentials" lib/auth/validate.ts` returns 1.
    - `grep -c "EMAIL_RE" lib/auth/validate.ts` returns >= 2 (declaration + use).
    - `grep -c "supabase.auth.signUp" app/auth/signup/route.ts` returns 1.
    - `grep -c "emailRedirectTo" app/auth/signup/route.ts` returns 1.
    - `grep -c "needsConfirmation: true" app/auth/signup/route.ts` returns 1.
    - `grep -c "supabase.auth.signInWithPassword" app/auth/login/route.ts` returns 1.
    - `grep -c "invalid_credentials" app/auth/login/route.ts` returns 1.
    - `grep -c "supabase.auth.signOut" app/auth/logout/route.ts` returns 1.
    - `grep -l "auth_unavailable" app/auth/signup/route.ts app/auth/login/route.ts` lists BOTH files.
    - `npx tsc --noEmit` exits 0.
  </acceptance_criteria>
  <done>Four files exist, signup triggers confirmation email, login/logout work, all routes degrade gracefully in demo mode.</done>
</task>

<task type="auto" tdd="true">
  <name>Task 2: Email-confirm callback + password-reset request and confirm routes</name>
  <files>app/auth/confirm/route.ts, app/auth/reset-request/route.ts, app/auth/reset-confirm/route.ts</files>
  <read_first>
    - app/auth/signup/route.ts (just created — confirm route is the redirect target of signup's emailRedirectTo)
    - lib/auth/validate.ts (parseEmail, parsePassword)
    - lib/supabase/server.ts (createSupabaseServerClient)
    - .planning/REQUIREMENTS.md (AUTH-02 confirm, AUTH-04 reset)
  </read_first>
  <behavior>
    - Test 1: `GET /auth/confirm?code=<valid>` exchanges code for a session and redirects to `/?confirmed=1`.
    - Test 2: `GET /auth/confirm?code=<invalid>` redirects to `/login?error=confirmation_failed`.
    - Test 3: `GET /auth/confirm` (no code) redirects to `/login?error=missing_code`.
    - Test 4: `POST /auth/reset-request` with a valid email returns 200 `{ ok: true }` (never leaks existence).
    - Test 5: `POST /auth/reset-request` with malformed email returns 400 `{ error: "invalid_input", field: "email" }`.
    - Test 6: `POST /auth/reset-confirm` with `{ password: "newpassword1" }` AND an active reset session returns 200 `{ ok: true }`.
    - Test 7: `POST /auth/reset-confirm` without a session returns 401 `{ error: "invalid_credentials" }`.
  </behavior>
  <action>
    Create the three route files below.

    **`app/auth/confirm/route.ts`** — handles BOTH email-confirmation and password-reset email links (Supabase's `exchangeCodeForSession` is the same call for both flows; the next step differentiates):
    ```typescript
    import { NextRequest, NextResponse } from "next/server";
    import { createSupabaseServerClient } from "@/lib/supabase/server";

    export const runtime = "nodejs";

    export async function GET(req: NextRequest) {
      const url = req.nextUrl;
      const code = url.searchParams.get("code");
      const next = url.searchParams.get("next") ?? "/";

      if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
        return NextResponse.redirect(new URL("/login?error=auth_unavailable", url.origin));
      }

      if (!code) {
        return NextResponse.redirect(new URL("/login?error=missing_code", url.origin));
      }

      const supabase = await createSupabaseServerClient();
      const { error } = await supabase.auth.exchangeCodeForSession(code);

      if (error) {
        console.error("[auth/confirm] exchange error", error.message);
        return NextResponse.redirect(new URL("/login?error=confirmation_failed", url.origin));
      }

      // `next` lets reset-confirm flow redirect to /reset; default confirms email and lands on /.
      // Reject both external URLs (must start with "/") AND protocol-relative URLs ("//evil.com"
      // also starts with "/" but new URL() would resolve it off-origin) — W2 fix.
      const target = next.startsWith("/") && !next.startsWith("//") ? next : "/";
      const successUrl = target === "/"
        ? new URL("/?confirmed=1", url.origin)
        : new URL(target, url.origin);
      return NextResponse.redirect(successUrl);
    }
    ```

    **`app/auth/reset-request/route.ts`**:
    ```typescript
    import { NextRequest, NextResponse } from "next/server";
    import { createSupabaseServerClient } from "@/lib/supabase/server";
    import { parseEmail } from "@/lib/auth/validate";

    export const runtime = "nodejs";

    export async function POST(req: NextRequest) {
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
        return NextResponse.json({ error: "auth_unavailable" }, { status: 503 });
      }

      const body = await req.json().catch(() => null);
      const parsed = parseEmail(body);
      if (!parsed.ok) {
        return NextResponse.json({ error: "invalid_input", field: parsed.field }, { status: 400 });
      }

      const supabase = await createSupabaseServerClient();
      const origin = process.env.NEXT_PUBLIC_URL ?? req.nextUrl.origin;

      // The email link routes through /auth/confirm with ?next=/reset so the user
      // lands on the password-form UI (built in Plan 05) with a live session.
      const { error } = await supabase.auth.resetPasswordForEmail(parsed.value.email, {
        redirectTo: `${origin}/auth/confirm?next=/reset`,
      });

      if (error) {
        console.error("[auth/reset-request] error", error.message);
        // Still return 200 — do not leak whether the email exists.
      }

      return NextResponse.json({ ok: true });
    }
    ```

    **`app/auth/reset-confirm/route.ts`**:
    ```typescript
    import { NextRequest, NextResponse } from "next/server";
    import { createSupabaseServerClient } from "@/lib/supabase/server";
    import { parsePassword } from "@/lib/auth/validate";

    export const runtime = "nodejs";

    export async function POST(req: NextRequest) {
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
        return NextResponse.json({ error: "auth_unavailable" }, { status: 503 });
      }

      const body = await req.json().catch(() => null);
      const parsed = parsePassword(body);
      if (!parsed.ok) {
        return NextResponse.json({ error: "invalid_input", field: parsed.field }, { status: 400 });
      }

      const supabase = await createSupabaseServerClient();
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) {
        return NextResponse.json({ error: "invalid_credentials" }, { status: 401 });
      }

      const { error } = await supabase.auth.updateUser({ password: parsed.value.password });
      if (error) {
        if (error.status === 422) {
          return NextResponse.json(
            { error: "invalid_input", field: "password" },
            { status: 400 },
          );
        }
        console.error("[auth/reset-confirm] error", error.message);
        return NextResponse.json({ error: "server_error" }, { status: 500 });
      }

      return NextResponse.json({ ok: true });
    }
    ```

    Rationale: `/auth/confirm` is dual-purpose because Supabase's email-link flow uses the same code-exchange for both email confirmation and password reset — the `next` query param tells us where to land. This avoids a second redirect route.
  </action>
  <verify>
    <automated>npx tsc --noEmit 2>&1 | grep -v '^$' | grep -E '(error|Error)' | grep -v -E '(node_modules|\.next)' || echo "OK"</automated>
  </verify>
  <acceptance_criteria>
    - `grep -c "exchangeCodeForSession" app/auth/confirm/route.ts` returns 1.
    - `grep -c "missing_code" app/auth/confirm/route.ts` returns 1.
    - `grep -c "confirmation_failed" app/auth/confirm/route.ts` returns 1.
    - `grep -cE '!next\.startsWith\("//"\)' app/auth/confirm/route.ts` returns 1 (W2: rejects protocol-relative open redirect).
    - `grep -c "resetPasswordForEmail" app/auth/reset-request/route.ts` returns 1.
    - `grep -c "next=/reset" app/auth/reset-request/route.ts` returns 1 (UI landing target).
    - `grep -c "updateUser" app/auth/reset-confirm/route.ts` returns 1.
    - `grep -c "auth.getUser" app/auth/reset-confirm/route.ts` returns 1 (session required).
    - `npx tsc --noEmit` exits 0.
    - `next build` succeeds (route handler signatures conform).
  </acceptance_criteria>
  <done>All six auth routes exist and typecheck; signup -> email -> /auth/confirm -> /login flow is wired; reset request -> email -> /auth/confirm?next=/reset -> /reset flow is wired.</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| Public POST endpoints | All four auth POSTs are unauthenticated entry points; their job IS authentication. |
| Email -> /auth/confirm | The `code` in the URL is signed by Supabase; verification happens server-side via `exchangeCodeForSession`. |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-03-01 | Spoofing | Brute-force login attempts | mitigate | Login route forwards Supabase's 429; Plan 04's Upstash limiter also covers `/api/simulate`. Login-specific limiter is acceptable to defer — Supabase handles it server-side. |
| T-03-02 | Information Disclosure | Reset endpoint leaking which emails are registered | mitigate | `/auth/reset-request` always returns 200, regardless of whether the email exists or Supabase erred. |
| T-03-03 | Information Disclosure | Verbose error messages exposing internals | mitigate | All routes return a fixed `{ error: <code> }` shape; `console.error` keeps server logs but never serialized to client. |
| T-03-04 | Tampering | Open-redirect via `next` param in /auth/confirm | mitigate | `next.startsWith("/")` check rejects external URLs. |
| T-03-05 | Elevation of Privilege | Password reset without an active reset session | mitigate | `/auth/reset-confirm` requires `supabase.auth.getUser()` to return a user (the reset-link exchange gave them a temp session). |
| T-03-06 | Repudiation | Auth events not logged | accept | Supabase Auth provides audit logs in its dashboard; duplicating in our DB is out of scope for v1. |
| T-03-07 | Denial of Service | Mass signup spam | mitigate | Supabase Auth has its own per-IP signup limiter; relies on Supabase's defaults. Acceptable for v1. |
</threat_model>

<verification>
- `npx tsc --noEmit` clean across all six new files + validator.
- `next build` succeeds; all six routes are detected and bundled.
- `grep -r "auth_unavailable" app/auth/` lists at least signup, login, reset-request, reset-confirm (all gracefully degrade).
- `grep -r "exchangeCodeForSession" app/auth/` returns one match (only in `/auth/confirm`).
</verification>

<success_criteria>
- Six route handlers exist under `app/auth/`.
- One validator file `lib/auth/validate.ts`.
- All auth lifecycle endpoints needed by AUTH-01..04 are reachable; Plan 05 will build the UI that calls them.
- No file modifies `/api/simulate` — that is Plan 04's territory.
</success_criteria>

<output>
After completion, create `.planning/phases/01-rate-limiting-user-system/01-03-auth-routes-SUMMARY.md` documenting: the six routes, the `AuthOk | AuthErr` JSON contract, the `?next=` convention for confirm, and the demo-mode 503 fallback.
</output>
