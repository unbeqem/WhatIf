---
phase: 01-rate-limiting-user-system
plan: 05
type: execute
wave: 3
depends_on:
  - 01
  - 03
  - 04
files_modified:
  - app/login/page.tsx
  - app/signup/page.tsx
  - app/reset-request/page.tsx
  - app/reset/page.tsx
  - components/AuthForm.tsx
  - components/AuthNav.tsx
  - components/PaywallNotice.tsx
  - components/SimulateForm.tsx
  - components/Nav.tsx
autonomous: false

requirements:
  - USAGE-04

must_haves:
  truths:
    - "A logged-out visitor sees 'Sign in / Sign up' links in the Nav and on relevant CTAs."
    - "A logged-in user sees their email (or first letter) + a Logout control in the Nav."
    - "User can navigate to /signup, submit the form, and see an 'email sent — check your inbox' state."
    - "User can navigate to /login, submit valid creds, and end up on / with the new auth state visible."
    - "User can submit /reset-request and see a 'check your inbox' confirmation."
    - "After clicking the reset email link, the user lands on /reset, enters a new password, and is redirected to / on success."
    - "When /api/simulate returns 429 with `{ error: 'limit_reached' }`, SimulateForm shows an inline upgrade card linking to /#pricing instead of the generic error banner (USAGE-04)."
    - "When /api/simulate returns 429 with `{ error: 'rate_limited' }`, SimulateForm shows a 'slow down' message with the Retry-After hint."
  artifacts:
    - path: "components/AuthForm.tsx"
      provides: "Reusable email/password form used by /login, /signup, /reset-request, /reset"
      contains: "useState"
      min_lines: 80
    - path: "components/AuthNav.tsx"
      provides: "Client header chip — shows 'Sign in' for anon, 'email + logout' for authed"
      contains: "createSupabaseBrowserClient"
    - path: "components/PaywallNotice.tsx"
      provides: "Inline upgrade card rendered when SimulateForm catches `limit_reached`"
      contains: "/#pricing"
    - path: "components/SimulateForm.tsx"
      provides: "Updated to branch on 429 limit_reached / rate_limited responses"
      contains: "limit_reached"
    - path: "components/Nav.tsx"
      provides: "Updated to render AuthNav next to existing CTA"
      contains: "AuthNav"
    - path: "app/login/page.tsx"
      provides: "Login screen with link to /signup and /reset-request"
      contains: "AuthForm"
    - path: "app/signup/page.tsx"
      provides: "Signup screen — successful submit shows 'check email' state (AUTH-02)"
      contains: "needsConfirmation"
    - path: "app/reset-request/page.tsx"
      provides: "Request-reset screen — submit shows neutral 'if it exists, you'll get an email'"
      contains: "AuthForm"
    - path: "app/reset/page.tsx"
      provides: "Set-new-password screen — only works when arriving via /auth/confirm?next=/reset"
      contains: "reset-confirm"
  key_links:
    - from: "components/AuthForm.tsx"
      to: "/auth/signup, /auth/login, /auth/reset-request, /auth/reset-confirm"
      via: "fetch POST with email/password JSON; maps server error codes to user-facing copy"
      pattern: "fetch.*auth"
    - from: "components/AuthNav.tsx"
      to: "lib/supabase/client.ts createSupabaseBrowserClient"
      via: "client-side onAuthStateChange subscription to react to login/logout"
      pattern: "onAuthStateChange"
    - from: "components/SimulateForm.tsx"
      to: "PaywallNotice"
      via: "renders <PaywallNotice/> on 429 limit_reached responses"
      pattern: "PaywallNotice"
    - from: "components/Nav.tsx"
      to: "AuthNav"
      via: "Nav renders <AuthNav/> beside the existing 'Try free' button"
      pattern: "<AuthNav"
---

<objective>
Build the UI surface for auth (4 pages + 3 components) and wire the soft-paywall response from Plan 04 into SimulateForm. This is the last plan of Phase 1: when it ships, the founder's success-criteria #1, #2, #3 (sign up flow, anon paywall, free paywall) and #5 (password reset) are all visibly demonstrable end-to-end.

Purpose: AUTH-01..04 + USAGE-04 are user-visible requirements. Plan 03 owns the JSON routes; this plan owns the screens that call them and the moment the paywall appears mid-flow. Includes a human checkpoint at the end so the founder can sign off on the visual + functional flow before phase verification runs.

Output: Four new pages, three new components, two modified components (SimulateForm gets paywall branching; Nav gets AuthNav).
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/REQUIREMENTS.md
@.planning/phases/01-rate-limiting-user-system/01-03-auth-routes-SUMMARY.md
@.planning/phases/01-rate-limiting-user-system/01-04-gated-simulate-route-SUMMARY.md
@CLAUDE.md
@app/page.tsx
@components/Nav.tsx
@components/SimulateForm.tsx
@components/UpgradeButton.tsx
@lib/supabase/client.ts

<interfaces>
<!-- The auth route response contract (from Plan 03) -->

```typescript
// 200: { ok: true } | { ok: true, needsConfirmation: true }
// 400: { error: "invalid_input", field?: "email" | "password" }
// 401: { error: "invalid_credentials" }
// 429: { error: "rate_limited" }
// 503: { error: "auth_unavailable" }
// 500: { error: "server_error" }
```

<!-- The simulate route response contract (from Plan 04) -->

```typescript
// 200: SimulationResult                                            -> route to /result as today
// 400: { error: string }                                           -> inline error banner (existing UI)
// 429: { error: "limit_reached", limit: "anon_daily"|"free_daily" } -> PaywallNotice
// 429: { error: "rate_limited", retryAfterSec: number }            -> "slow down" message
// 500: { error: string }                                           -> generic error banner
```

<!-- The Supabase browser client (from Plan 01) -->

```typescript
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
const supabase = createSupabaseBrowserClient();
const { data: { user } } = await supabase.auth.getUser();
supabase.auth.onAuthStateChange((event, session) => {/* react */});
```
</interfaces>
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Reusable AuthForm + AuthNav components + PaywallNotice</name>
  <files>components/AuthForm.tsx, components/AuthNav.tsx, components/PaywallNotice.tsx</files>
  <read_first>
    - components/SimulateForm.tsx (existing form patterns: `"use client"`, motion, error banner styling, button gradients — match these)
    - components/UpgradeButton.tsx (existing pattern for talking to /api/* routes from a client component)
    - components/Nav.tsx (existing styles for the nav-row chip — match border-border-hi / surface/60 patterns)
    - lib/supabase/client.ts (createSupabaseBrowserClient + isSupabaseConfigured)
    - app/page.tsx (pricing-section anchor `/#pricing` for the paywall deep link)
    - .planning/REQUIREMENTS.md (USAGE-04: deep link to /#pricing)
  </read_first>
  <behavior>
    `components/AuthForm.tsx`:
    - Test 1: Renders email + password inputs (or only email for `mode="reset-request"`, or only password for `mode="reset"`).
    - Test 2: On submit, POSTs JSON to the prop-supplied endpoint and disables the button while pending.
    - Test 3: On 400 `invalid_input` with `field`, shows an inline error under the matching input.
    - Test 4: On 401 `invalid_credentials`, shows a generic 'Wrong email or password' error.
    - Test 5: On 503 `auth_unavailable`, shows 'Auth is in demo mode — set NEXT_PUBLIC_SUPABASE_URL'.
    - Test 6: On success, calls the `onSuccess` prop with the parsed JSON body.

    `components/AuthNav.tsx`:
    - Test 7: When `isSupabaseConfigured === false`, renders NOTHING (avoids dead UI in demo mode).
    - Test 8: Calls `supabase.auth.getUser()` on mount; if null shows 'Sign in' link to /login; if present shows email (truncated) + Logout button.
    - Test 9: Logout button POSTs to /auth/logout and forces a page reload.
    - Test 10: Subscribes to `onAuthStateChange` so signup/login/logout flicker the chip without a manual refresh.

    `components/PaywallNotice.tsx`:
    - Test 11: Accepts `limit: "anon_daily" | "free_daily"` and renders a variant copy ("anon_daily" -> 'Create an account for free' nudge; "free_daily" -> 'Upgrade to Pro').
    - Test 12: Always renders a Link to `/#pricing` and (for `free_daily`) an `<UpgradeButton plan="pro">`.
  </behavior>
  <action>
    Create the three components below. Match Tailwind tokens already in the codebase (`bg-surface/40`, `border-border-hi`, `from-violet to-magenta`, etc.).

    **`components/AuthForm.tsx`**:
    ```tsx
    "use client";

    import { useState, FormEvent } from "react";

    export type AuthMode = "signup" | "login" | "reset-request" | "reset";

    type Props = {
      mode: AuthMode;
      endpoint: string;                // e.g. "/auth/login"
      submitLabel: string;             // e.g. "Sign in"
      onSuccess: (body: any) => void;
    };

    const ERROR_COPY: Record<string, string> = {
      invalid_credentials: "Wrong email or password.",
      auth_unavailable: "Auth is in demo mode. Configure Supabase in .env.local to enable accounts.",
      rate_limited: "Too many attempts. Wait a minute and try again.",
      server_error: "Something went wrong. Try again in a moment.",
    };

    export default function AuthForm({ mode, endpoint, submitLabel, onSuccess }: Props) {
      const [email, setEmail] = useState("");
      const [password, setPassword] = useState("");
      const [pending, setPending] = useState(false);
      const [generalError, setGeneralError] = useState<string | null>(null);
      const [fieldError, setFieldError] = useState<"email" | "password" | null>(null);

      const needsEmail = mode !== "reset";
      const needsPassword = mode !== "reset-request";

      async function submit(e: FormEvent) {
        e.preventDefault();
        setGeneralError(null);
        setFieldError(null);
        setPending(true);

        const body: Record<string, string> = {};
        if (needsEmail) body.email = email.trim();
        if (needsPassword) body.password = password;

        try {
          const res = await fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          });
          const data = await res.json().catch(() => ({}));

          if (res.ok) {
            onSuccess(data);
            return;
          }

          if (data.error === "invalid_input" && (data.field === "email" || data.field === "password")) {
            setFieldError(data.field);
            setGeneralError(
              data.field === "email"
                ? "Enter a valid email address."
                : "Password must be at least 8 characters.",
            );
          } else {
            setGeneralError(ERROR_COPY[data.error] ?? "Something went wrong.");
          }
        } catch {
          setGeneralError("Connection failed. Check your network.");
        } finally {
          setPending(false);
        }
      }

      return (
        <form onSubmit={submit} className="space-y-4">
          {needsEmail && (
            <div>
              <label className="mb-1 block font-mono text-[10px] uppercase tracking-[0.18em] text-fg-mute">
                Email
              </label>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`w-full rounded-xl border bg-surface/40 px-4 py-3 text-fg outline-none transition-colors focus:border-violet-glow/60 ${
                  fieldError === "email" ? "border-magenta/60" : "border-border"
                }`}
              />
            </div>
          )}
          {needsPassword && (
            <div>
              <label className="mb-1 block font-mono text-[10px] uppercase tracking-[0.18em] text-fg-mute">
                Password
              </label>
              <input
                type="password"
                required
                minLength={8}
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`w-full rounded-xl border bg-surface/40 px-4 py-3 text-fg outline-none transition-colors focus:border-violet-glow/60 ${
                  fieldError === "password" ? "border-magenta/60" : "border-border"
                }`}
              />
            </div>
          )}

          {generalError && (
            <div className="rounded-xl border border-magenta/40 bg-magenta/10 px-4 py-3 text-sm text-magenta">
              {generalError}
            </div>
          )}

          <button
            type="submit"
            disabled={pending}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-violet to-magenta px-5 py-3 text-sm font-semibold text-white shadow-[0_10px_40px_-10px_rgba(168,85,247,0.7)] transition-all hover:brightness-110 disabled:opacity-60"
          >
            {pending ? "Working…" : submitLabel}
          </button>
        </form>
      );
    }
    ```

    **`components/AuthNav.tsx`**:
    ```tsx
    "use client";

    import { useEffect, useState } from "react";
    import Link from "next/link";
    import {
      createSupabaseBrowserClient,
      isSupabaseConfigured,
    } from "@/lib/supabase/client";

    export default function AuthNav() {
      const [email, setEmail] = useState<string | null>(null);
      const [hydrated, setHydrated] = useState(false);

      useEffect(() => {
        if (!isSupabaseConfigured) {
          setHydrated(true);
          return;
        }
        const supabase = createSupabaseBrowserClient();
        supabase.auth.getUser().then(({ data }) => {
          setEmail(data.user?.email ?? null);
          setHydrated(true);
        });
        const { data: sub } = supabase.auth.onAuthStateChange((_evt, session) => {
          setEmail(session?.user?.email ?? null);
        });
        return () => sub.subscription.unsubscribe();
      }, []);

      async function logout() {
        await fetch("/auth/logout", { method: "POST" });
        window.location.reload();
      }

      if (!hydrated) return null;
      if (!isSupabaseConfigured) return null;

      if (!email) {
        return (
          <Link
            href="/login"
            className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-border bg-surface/40 px-3.5 py-2 text-sm text-fg-soft transition-colors hover:border-violet-glow/40 hover:text-fg"
          >
            Sign in
          </Link>
        );
      }

      const short = email.length > 22 ? email.slice(0, 20) + "…" : email;

      return (
        <div className="hidden sm:flex items-center gap-2">
          <span className="rounded-full border border-border-hi bg-surface/60 px-3 py-1.5 text-xs text-fg-soft">
            {short}
          </span>
          <button
            type="button"
            onClick={logout}
            className="text-xs text-fg-mute transition-colors hover:text-fg"
          >
            Logout
          </button>
        </div>
      );
    }
    ```

    **`components/PaywallNotice.tsx`**:
    ```tsx
    "use client";

    import Link from "next/link";
    import UpgradeButton from "@/components/UpgradeButton";

    type Props = { limit: "anon_daily" | "free_daily" };

    export default function PaywallNotice({ limit }: Props) {
      const isAnon = limit === "anon_daily";
      return (
        <div className="mt-4 overflow-hidden rounded-2xl border border-violet-glow/40 bg-gradient-to-br from-violet/15 to-surface/60 p-5">
          <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-violet-glow">
            Soft paywall
          </div>
          <div className="mt-1 font-display text-xl leading-tight">
            {isAnon
              ? "You've used your free simulation for today."
              : "You've used your daily simulation."}
          </div>
          <p className="mt-2 text-sm text-fg-soft">
            {isAnon
              ? "Create a free account to keep simulating tomorrow, or go Pro for unlimited simulations now."
              : "Pro unlocks unlimited simulations, deeper second-order effects, and decision history."}
          </p>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
            {!isAnon && (
              <div className="flex-1">
                <UpgradeButton plan="pro">Unlock Pro — €5/mo</UpgradeButton>
              </div>
            )}
            {isAnon && (
              <Link
                href="/signup"
                className="inline-flex flex-1 items-center justify-center rounded-xl bg-gradient-to-br from-violet to-magenta px-4 py-3 text-sm font-semibold text-white shadow-[0_10px_40px_-10px_rgba(168,85,247,0.7)]"
              >
                Create free account
              </Link>
            )}
            <Link
              href="/#pricing"
              className="inline-flex items-center justify-center rounded-xl border border-border-hi bg-bg/40 px-4 py-3 text-sm text-fg-soft transition-colors hover:bg-surface-hi hover:text-fg"
            >
              Compare plans
            </Link>
          </div>
        </div>
      );
    }
    ```
  </action>
  <verify>
    <automated>npx tsc --noEmit 2>&1 | grep -v '^$' | grep -E '(error|Error)' | grep -v -E '(node_modules|\.next)' || echo "OK"</automated>
  </verify>
  <acceptance_criteria>
    - `grep -c '"use client"' components/AuthForm.tsx` returns 1.
    - `grep -c 'export type AuthMode' components/AuthForm.tsx` returns 1.
    - `grep -c "fetch(endpoint" components/AuthForm.tsx` returns 1.
    - `grep -c "invalid_credentials" components/AuthForm.tsx` returns 1.
    - `grep -c "auth_unavailable" components/AuthForm.tsx` returns 1.
    - `grep -c "onAuthStateChange" components/AuthNav.tsx` returns 1.
    - `grep -c "createSupabaseBrowserClient" components/AuthNav.tsx` returns 1.
    - `grep -c '"/auth/logout"' components/AuthNav.tsx` returns 1.
    - `grep -c "isSupabaseConfigured" components/AuthNav.tsx` returns >= 1.
    - `grep -c '"/#pricing"' components/PaywallNotice.tsx` returns 1.
    - `grep -c 'UpgradeButton plan="pro"' components/PaywallNotice.tsx` returns 1.
    - `grep -cE '"anon_daily"|"free_daily"' components/PaywallNotice.tsx` returns >= 2 (W6: uses -E so `|` is alternation, not literal).
    - `npx tsc --noEmit` exits 0.
  </acceptance_criteria>
  <done>Three components compile, follow existing Tailwind tokens, and degrade cleanly when Supabase isn't configured.</done>
</task>

<task type="auto" tdd="true">
  <name>Task 2: Four auth pages (/login, /signup, /reset-request, /reset) + wire SimulateForm + Nav</name>
  <files>app/login/page.tsx, app/signup/page.tsx, app/reset-request/page.tsx, app/reset/page.tsx, components/SimulateForm.tsx, components/Nav.tsx</files>
  <read_first>
    - components/AuthForm.tsx (just created — accepts mode/endpoint/submitLabel/onSuccess)
    - components/PaywallNotice.tsx (the component SimulateForm will render on 429 limit_reached)
    - components/SimulateForm.tsx (existing form — need to BRANCH on 429 limit_reached instead of just setError)
    - components/Nav.tsx (existing nav — insert <AuthNav/> before the existing "Try free" button)
    - app/page.tsx (visual conventions: BackgroundOrbs, Nav, Footer wrapper)
    - .planning/REQUIREMENTS.md (USAGE-04: paywall on 429 limit_reached)
  </read_first>
  <behavior>
    Pages:
    - Test 1: `/login` shows AuthForm(mode="login"), links to /signup and /reset-request.
    - Test 2: `/signup` shows AuthForm(mode="signup"); on success with `needsConfirmation: true` renders a 'Check your inbox' state instead of redirecting.
    - Test 3: `/reset-request` shows AuthForm(mode="reset-request"); on any 200 response renders 'If that email exists, we sent a reset link' (no leak).
    - Test 4: `/reset` shows AuthForm(mode="reset"); on success redirects to `/?reset=ok`.

    SimulateForm:
    - Test 5: When fetch returns 429 with `{ error: "limit_reached", limit: <x> }`, renders `<PaywallNotice limit={x} />` BELOW the form and clears the loading state. Does NOT navigate to /result.
    - Test 6: When fetch returns 429 with `{ error: "rate_limited", retryAfterSec }`, shows existing error banner with the retry hint copy.
    - Test 7: Existing 200/400/500 behavior unchanged (no regression).

    Nav:
    - Test 8: Nav renders `<AuthNav/>` in the right-side cluster (before or beside the existing "Try free" button — choose whichever reads cleaner).
  </behavior>
  <action>
    Create the four pages and update SimulateForm + Nav.

    **`app/login/page.tsx`**:
    ```tsx
    "use client";

    import Link from "next/link";
    import { useRouter } from "next/navigation";
    import Nav from "@/components/Nav";
    import Footer from "@/components/Footer";
    import BackgroundOrbs from "@/components/BackgroundOrbs";
    import AuthForm from "@/components/AuthForm";

    export default function LoginPage() {
      const router = useRouter();
      return (
        <>
          <Nav />
          <section className="relative overflow-hidden">
            <BackgroundOrbs />
            <div className="mx-auto max-w-md px-6 pb-20 pt-12 md:pt-20">
              <h1 className="mb-8 text-center font-display text-4xl md:text-5xl">
                Welcome back
              </h1>
              <div className="rounded-3xl border border-border bg-surface/40 p-6 md:p-8">
                <AuthForm
                  mode="login"
                  endpoint="/auth/login"
                  submitLabel="Sign in"
                  onSuccess={() => router.push("/")}
                />
              </div>
              <div className="mt-6 flex items-center justify-between text-sm text-fg-soft">
                <Link href="/reset-request" className="hover:text-fg">
                  Forgot password?
                </Link>
                <Link href="/signup" className="hover:text-fg">
                  Create an account →
                </Link>
              </div>
            </div>
          </section>
          <Footer />
        </>
      );
    }
    ```

    **`app/signup/page.tsx`**:
    ```tsx
    "use client";

    import { useState } from "react";
    import Link from "next/link";
    import Nav from "@/components/Nav";
    import Footer from "@/components/Footer";
    import BackgroundOrbs from "@/components/BackgroundOrbs";
    import AuthForm from "@/components/AuthForm";

    export default function SignupPage() {
      const [sent, setSent] = useState(false);
      return (
        <>
          <Nav />
          <section className="relative overflow-hidden">
            <BackgroundOrbs />
            <div className="mx-auto max-w-md px-6 pb-20 pt-12 md:pt-20">
              <h1 className="mb-8 text-center font-display text-4xl md:text-5xl">
                Create your account
              </h1>
              <div className="rounded-3xl border border-border bg-surface/40 p-6 md:p-8">
                {sent ? (
                  <div className="text-center">
                    <div className="mb-3 font-mono text-[10px] uppercase tracking-[0.22em] text-cyan-glow">
                      Almost there
                    </div>
                    <p className="font-display text-2xl">Check your inbox.</p>
                    <p className="mt-3 text-sm text-fg-soft">
                      We sent you a confirmation link. Click it to activate your account.
                    </p>
                  </div>
                ) : (
                  <AuthForm
                    mode="signup"
                    endpoint="/auth/signup"
                    submitLabel="Create account"
                    onSuccess={(data) => {
                      if (data?.needsConfirmation) setSent(true);
                    }}
                  />
                )}
              </div>
              <div className="mt-6 text-center text-sm text-fg-soft">
                Already have an account?{" "}
                <Link href="/login" className="text-fg hover:underline">
                  Sign in
                </Link>
              </div>
            </div>
          </section>
          <Footer />
        </>
      );
    }
    ```

    **`app/reset-request/page.tsx`**:
    ```tsx
    "use client";

    import { useState } from "react";
    import Link from "next/link";
    import Nav from "@/components/Nav";
    import Footer from "@/components/Footer";
    import BackgroundOrbs from "@/components/BackgroundOrbs";
    import AuthForm from "@/components/AuthForm";

    export default function ResetRequestPage() {
      const [sent, setSent] = useState(false);
      return (
        <>
          <Nav />
          <section className="relative overflow-hidden">
            <BackgroundOrbs />
            <div className="mx-auto max-w-md px-6 pb-20 pt-12 md:pt-20">
              <h1 className="mb-8 text-center font-display text-4xl md:text-5xl">
                Reset password
              </h1>
              <div className="rounded-3xl border border-border bg-surface/40 p-6 md:p-8">
                {sent ? (
                  <p className="text-center text-fg-soft">
                    If an account exists for that email, we just sent a reset link. Check your
                    inbox.
                  </p>
                ) : (
                  <AuthForm
                    mode="reset-request"
                    endpoint="/auth/reset-request"
                    submitLabel="Send reset link"
                    onSuccess={() => setSent(true)}
                  />
                )}
              </div>
              <div className="mt-6 text-center text-sm text-fg-soft">
                <Link href="/login" className="hover:text-fg">
                  Back to sign in
                </Link>
              </div>
            </div>
          </section>
          <Footer />
        </>
      );
    }
    ```

    **`app/reset/page.tsx`**:
    ```tsx
    "use client";

    import { useRouter } from "next/navigation";
    import Nav from "@/components/Nav";
    import Footer from "@/components/Footer";
    import BackgroundOrbs from "@/components/BackgroundOrbs";
    import AuthForm from "@/components/AuthForm";

    export default function ResetPage() {
      const router = useRouter();
      return (
        <>
          <Nav />
          <section className="relative overflow-hidden">
            <BackgroundOrbs />
            <div className="mx-auto max-w-md px-6 pb-20 pt-12 md:pt-20">
              <h1 className="mb-8 text-center font-display text-4xl md:text-5xl">
                Set a new password
              </h1>
              <div className="rounded-3xl border border-border bg-surface/40 p-6 md:p-8">
                <AuthForm
                  mode="reset"
                  endpoint="/auth/reset-confirm"
                  submitLabel="Save new password"
                  onSuccess={() => router.push("/?reset=ok")}
                />
              </div>
            </div>
          </section>
          <Footer />
        </>
      );
    }
    ```

    **`components/SimulateForm.tsx`** — Modify the existing file (do NOT rewrite end-to-end). The required diff:

    1. At the top, add the import:
       ```typescript
       import PaywallNotice from "@/components/PaywallNotice";
       ```
    2. Add a new piece of state next to `error`:
       ```typescript
       const [paywall, setPaywall] = useState<"anon_daily" | "free_daily" | null>(null);
       ```
    3. In `submit()`, replace the existing `if (!res.ok) { ... }` block with this:
       ```typescript
       if (!res.ok) {
         const data = await res.json().catch(() => ({}));
         if (res.status === 429 && data.error === "limit_reached") {
           setPaywall(data.limit === "free_daily" ? "free_daily" : "anon_daily");
           setLoading(false);
           return;
         }
         if (res.status === 429 && data.error === "rate_limited") {
           setError(
             `Too many requests. Try again in ${data.retryAfterSec ?? 60}s.`,
           );
           setLoading(false);
           return;
         }
         setError(data.error ?? "Something went wrong. Try again.");
         setLoading(false);
         return;
       }
       ```
    4. At the start of `submit()`, reset paywall: `setPaywall(null);` next to `setError(null);`.
    5. In the JSX, AFTER the existing error banner (the `{error && (...)}` block), add:
       ```tsx
       {paywall && <PaywallNotice limit={paywall} />}
       ```

    **`components/Nav.tsx`** — Modify the existing file. The required diff:

    1. Add import at the top:
       ```typescript
       import AuthNav from "@/components/AuthNav";
       ```
    2. In the right-side action cluster (the `<div className="flex items-center gap-2">` that wraps "Try free"), insert `<AuthNav />` BEFORE the existing "Try free" Link. Final shape:
       ```tsx
       <div className="flex items-center gap-2">
         <AuthNav />
         <Link href="/decision" className="...existing classes...">
           Try free
           <span ...>→</span>
         </Link>
         <button ...mobile menu toggle... />
       </div>
       ```

    Do not touch any other Nav internals.
  </action>
  <verify>
    <automated>npx tsc --noEmit 2>&1 | grep -v '^$' | grep -E '(error|Error)' | grep -v -E '(node_modules|\.next)' || echo "OK"</automated>
  </verify>
  <acceptance_criteria>
    - All four pages exist: `app/login/page.tsx`, `app/signup/page.tsx`, `app/reset-request/page.tsx`, `app/reset/page.tsx`.
    - `grep -l "AuthForm" app/login/page.tsx app/signup/page.tsx app/reset-request/page.tsx app/reset/page.tsx` lists all four.
    - `grep -c "/auth/login" app/login/page.tsx` returns 1.
    - `grep -c "/auth/signup" app/signup/page.tsx` returns 1.
    - `grep -c "/auth/reset-request" app/reset-request/page.tsx` returns 1.
    - `grep -c "/auth/reset-confirm" app/reset/page.tsx` returns 1.
    - `grep -c "needsConfirmation" app/signup/page.tsx` returns 1.
    - `grep -c 'import PaywallNotice' components/SimulateForm.tsx` returns 1.
    - `grep -c '"limit_reached"' components/SimulateForm.tsx` returns 1.
    - `grep -c '"rate_limited"' components/SimulateForm.tsx` returns 1.
    - `grep -c "setPaywall" components/SimulateForm.tsx` returns >= 3 (declaration + reset + set).
    - `grep -c 'import AuthNav' components/Nav.tsx` returns 1.
    - `grep -c "<AuthNav" components/Nav.tsx` returns 1.
    - `npx tsc --noEmit` exits 0.
    - `next build` succeeds; the four new pages appear in the build manifest.
  </acceptance_criteria>
  <done>Four pages live, SimulateForm branches on the new 429 contract, Nav shows auth state. The phase is functionally complete pending visual sign-off.</done>
</task>

<task type="checkpoint:human-verify" gate="blocking">
  <name>Task 3: Founder visual + functional verification of Phase 1 end-to-end</name>
  <what-built>
    Phase 1 is now wired:
    - Supabase + Upstash clients (Plan 01)
    - Anon device cookie (Plan 02)
    - Six auth routes (Plan 03)
    - Gated /api/simulate with 24h counter + 5/min burst + abuse log (Plan 04)
    - Four auth pages + SimulateForm paywall surface + Nav auth chip (this plan)
  </what-built>
  <how-to-verify>
    Pre-reqs (one-time):
    1. Run the migration in Supabase SQL editor: paste `supabase/migrations/0001_phase1_init.sql` and execute.
    2. Set in `.env.local`:
       - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` from Supabase project settings.
       - `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` from Upstash console.
       - `ANON_COOKIE_SECRET=` `openssl rand -hex 32` output.
    3. `npm run dev`.

    Then verify each of these flows in order:

    **Signup -> confirm -> login (AUTH-01..03):**
    1. Visit http://localhost:3000/signup, register with a real inbox you can read.
    2. Expect: 'Check your inbox' state.
    3. Open the Supabase confirmation email, click the link.
    4. Expect: lands on `/?confirmed=1`, Nav now shows your email + Logout.
       **W4 verification:** the redirect from `/auth/confirm` MUST carry a `Set-Cookie: sb-...` header — open DevTools → Network → click the `/auth/confirm` row → Response headers. If `Set-Cookie` is missing the session won't stick across the redirect and Nav stays anonymous.
    5. Click Logout. Nav reverts to 'Sign in'.
    6. Visit `/login`, sign in with the same credentials. Expect: lands on `/`, Nav shows email again.
    7. Refresh the browser. Expect: session survives (AUTH-03 success-criterion #1).

    **Anon paywall (USAGE-01, USAGE-04):**
    8. Open a clean Incognito window. Visit `/decision`, run one simulation. Expect: result page.
    9. Hit Back, run a second simulation. Expect: SimulateForm shows the violet PaywallNotice with 'Create free account' CTA pointing at `/signup` and 'Compare plans' linking to `/#pricing`.

    **Free-tier paywall (USAGE-02, USAGE-04):**
    10. Log in (you should be 'free' plan in Supabase). Run one simulation. Expect: success.
    11. Run a second simulation immediately. Expect: PaywallNotice 'Pro' variant with Pro CTA.
        **W1 note (accepted by design):** Opening two browser tabs and clicking Simulate in both within ~100ms can race past `checkQuota` and grant 2 sims in a 24h window instead of 1. The `T-04-08` threat model entry accepts this — the ceiling is 2, not unbounded, and an advisory lock isn't worth the v1 complexity. Don't file it as a bug.

    **Burst guard (ABUSE-01):**
    12. **W7:** Open a **fresh Incognito window** (the session from step 11 has already exhausted its quota — the burst limiter would never be exercised through the UI). From a terminal: `for i in {1..6}; do curl -X POST http://localhost:3000/api/simulate -H "Content-Type: application/json" -d '{"input":"this is a valid input for burst testing"}' -w "\n%{http_code}\n"; done`. Expect: requests 1-5 return 200 or 429-`limit_reached` (anon quota), and request 6 returns 429 `{ "error": "rate_limited" }` with a `Retry-After` header.

    **Input validation (ABUSE-02):**
    13. Submit a 5-char input. Expect: 400 'Tell me a little more — at least a sentence.'
    14. Submit a 1600-char input. Expect: 400 'Decision is too long...'

    **Abuse log visibility (ABUSE-03):**
    15. In Supabase dashboard -> Table editor -> simulation_usage, expect rows with `blocked_reason` populated for each block above (`anon_daily`, `free_daily`, `burst`, `input_too_short`, `input_too_long`). Confirm `ip_hash` is hex (no raw IPs).

    **Password reset (AUTH-04):**
    16. Visit /reset-request, submit your email. Expect: neutral 'If an account exists...' message.
    17. Open the reset email, click the link. Expect: lands on /reset.
    18. Submit a new password. Expect: redirected to `/?reset=ok`.
    19. Log out, log back in with the new password. Expect: success.

    **Demo mode regression check (sanity):**
    20. Comment out `NEXT_PUBLIC_SUPABASE_URL` and `UPSTASH_REDIS_REST_URL` in `.env.local`. Restart `npm run dev`.
    21. Run a simulation. Expect: it works (MVP behavior preserved). Nav 'Sign in' chip is hidden. No crashes.
  </how-to-verify>
  <resume-signal>
    Type "approved" if all 21 steps pass and you're ready for `/gsd-execute-phase 1` to be considered complete.
    Otherwise list the failing step number(s) and what you observed — a follow-up gap-closure plan can be planned via `/gsd-plan-phase --gaps`.
  </resume-signal>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| Client component <-> route handlers | All client UI uses `fetch` with JSON body; never trusts response copy directly. |
| Browser cookie store <-> server session | Auth state in the client is purely advisory; only `auth.getUser()` is authoritative. |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-05-01 | Information Disclosure | AuthNav leaking email to anonymous side-channels | accept | Email displayed only to the authenticated user themselves; no broadcast. |
| T-05-02 | Cross-Site Scripting (Tampering) | User-controlled email/password rendered in DOM | mitigate | React text interpolation only (no `dangerouslySetInnerHTML`). |
| T-05-03 | Open Redirect | `router.push` to attacker-controlled URL after login | mitigate | All `onSuccess` callbacks navigate to literal `/` or `/?...` — never attacker-controlled. |
| T-05-04 | Tampering | SimulateForm bypassing paywall by altering JS | accept | Server `/api/simulate` enforces the same gate (Plan 04); UI is purely cosmetic. |
| T-05-05 | Information Disclosure | Generic error copy revealing whether email exists during reset | mitigate | `/reset-request` always shows the same neutral message regardless of server response. |
</threat_model>

<verification>
- `npx tsc --noEmit` and `next build` succeed.
- All grep checks pass.
- Founder checkpoint (Task 3) approved.
</verification>

<success_criteria>
- Four new pages + three new components + two modifications (SimulateForm, Nav).
- All 11 Phase 1 user-visible requirements demonstrable in the Task 3 checklist.
- Demo-mode regression test (Step 20-21) passes: removing Supabase env returns the app to MVP behavior.
</success_criteria>

<output>
After completion, create `.planning/phases/01-rate-limiting-user-system/01-05-auth-ui-paywall-SUMMARY.md` documenting: the four new routes (/login, /signup, /reset-request, /reset), the AuthForm props contract for future reuse, and the SimulateForm 429 branching shape (so Phase 2's pro-bypass change in `/api/simulate` does not break the paywall UI assumption).
</output>
