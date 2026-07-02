# Phase 4: Live Deploy - Pattern Map

**Mapped:** 2026-07-02
**Files analyzed:** 8 (2 new pages, 3 component edits, 3 config/lib references)
**Analogs found:** 8 / 8

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|-----------------|---------------|
| `app/impressum/page.tsx` | route (static content page) | request-response | `app/login/page.tsx` | role-match (best static-shell analog; `app/account/page.tsx` also viable but has data-fetch noise this page doesn't need) |
| `app/datenschutz/page.tsx` | route (static content page) | request-response | `app/login/page.tsx` | role-match |
| `components/Footer.tsx` | component | request-response | itself (already partially edited) | exact — only the two `href="#"` lines remain |
| `components/Faq.tsx` | component | request-response | itself (already edited in quick-260701-nnc) | exact — no further changes needed, verify only |
| `components/StoryCard.tsx` | component | transform (render-to-image via `next/og`) | itself (already edited in quick-260701-nnc) | exact — no further changes needed, verify only |
| `components/ResultView.tsx` (test-mode notice insertion) | component | request-response | `components/UpgradeButton.tsx` (demo-note pattern already in the same file family) | exact — insertion point is the upsell block already in ResultView itself |
| `.env.example` / `lib/openai.ts` / `lib/stripe.ts` | config / service | CRUD (key presence -> mode) | n/a (self-referential, these ARE the pattern) | exact |
| Base-URL threading (`NEXT_PUBLIC_URL` call sites) | config | request-response | n/a (enumerated below) | exact |

## Pattern Assignments

### `app/impressum/page.tsx` (route, request-response) — NEW

**Analog:** `app/login/page.tsx` (full file already read, 43 lines) and `app/account/page.tsx` (for the header-badge + heading treatment)

**Static page skeleton to copy** (`app/login/page.tsx` lines 1-42):
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
            {/* content */}
          </div>
        </div>
      </section>
      <Footer />
    </>
  );
}
```

**Important deviation:** Impressum/Datenschutz do NOT need `"use client"` — no interactivity, no router. Use the plain server-component shell from `app/account/page.tsx` instead (drop the `redirect`/auth/Supabase parts, keep the JSX shell):

**Server-component page + metadata + header-badge pattern** (`app/account/page.tsx` lines 1-13, 44-58):
```tsx
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import BackgroundOrbs from "@/components/BackgroundOrbs";

export const metadata = {
  title: "Your account — WhatIf",
};

export default async function AccountPage() {
  // ...
  return (
    <>
      <Nav />
      <section className="relative overflow-hidden">
        <BackgroundOrbs />
        <div className="mx-auto max-w-2xl px-6 pb-24 pt-10 md:pt-16">
          <div className="mb-10 text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border-hi bg-surface/60 px-3.5 py-1.5 text-xs text-fg-soft backdrop-blur-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-violet-glow shadow-[0_0_8px_2px_rgba(192,132,252,0.7)]" />
              <span className="font-mono uppercase tracking-[0.18em]">Your account</span>
            </div>
            <h1 className="font-display text-4xl leading-tight md:text-5xl">
              Manage your <span className="gradient-text">plan</span>.
            </h1>
          </div>
          <div className="rounded-2xl border border-border-hi bg-surface/60 p-6 backdrop-blur-sm md:p-8">
            {/* body content */}
          </div>
        </div>
      </section>
      <Footer />
    </>
  );
}
```

**Recommended composite for legal pages:** use `app/account/page.tsx`'s server-component structure (no `"use client"`, has `export const metadata`) + `max-w-2xl` container, but drop the badge/hero (no need for "Your account"-style eyebrow on a legal page — a plain `<h1 className="font-display text-4xl md:text-5xl">Impressum</h1>` inside the `max-w-2xl` wrapper is enough) and put the legal body copy as plain prose (`<p className="text-fg-soft leading-relaxed">` blocks + `<h2 className="font-display text-2xl">` section headers) inside the `rounded-2xl border border-border-hi bg-surface/60 p-6 md:p-8` card.

Placeholder convention: since founder personal details (name, address) aren't known yet, mark clearly, e.g. `[NAME PLACEHOLDER — founder to fill in]` in visible copy — do not fabricate a fake name/address.

Contact line for both pages: `business@what-if.tech` (confirmed live value from Footer.tsx / Faq.tsx — see below).

---

### `app/datenschutz/page.tsx` (route, request-response) — NEW

**Analog:** same as `app/impressum/page.tsx` above (`app/account/page.tsx` shell). Reuse identical page skeleton; differs only in body copy (DSGVO processor list: Supabase EU, Stripe, OpenAI, Resend/IONOS, rate-limit/abuse logging — per CONTEXT.md D-09).

**Metadata pattern** (`app/account/page.tsx` line 10-12):
```tsx
export const metadata = {
  title: "Your account — WhatIf",
};
```
Use analogous titles: `"Impressum — WhatIf"` / `"Datenschutz — WhatIf"`.

---

### `components/Footer.tsx` (component, request-response) — EDIT

**Current file (already read in full, 17 lines).** Only lines 10-11 need to change:

**Current dead links** (lines 10-11):
```tsx
<a href="#" className="transition-colors hover:text-fg">Privacy</a>
<a href="#" className="transition-colors hover:text-fg">Terms</a>
```

**Already-correct line (verify only, no change needed)** (line 12):
```tsx
<a href="mailto:business@what-if.tech" className="transition-colors hover:text-fg">Contact</a>
```

**Target edit:** swap the two `href="#"` to real routes using Next's `Link` component, consistent with how other internal links are done elsewhere in the codebase (e.g. `components/ResultView.tsx` line 65 `<Link href="/decision" ...>`). Footer currently uses plain `<a>` for external mailto — for internal routes, prefer `next/link`:
```tsx
import Link from "next/link";
// ...
<Link href="/datenschutz" className="transition-colors hover:text-fg">Privacy</Link>
<Link href="/impressum" className="transition-colors hover:text-fg">Terms</Link>
```
Note: DE convention maps "Privacy" copy → `/datenschutz` and "Terms"/Impressum-ish copy → `/impressum`; confirm label-to-route mapping matches CONTEXT.md D-08 intent (Privacy=Datenschutz, Impressum has no exact EN equivalent — could relabel "Terms" to "Impressum" or add both explicitly; planner's call per Claude's Discretion in CONTEXT.md).

**IMPORTANT — no analog needed for mailto/domain swap:** `components/Footer.tsx`, `components/Faq.tsx`, and `components/StoryCard.tsx` email/domain swaps described in CONTEXT.md D-09/D-11 are **already complete** (commit `cadd82c`, quick task `260701-nnc`, verified in `.planning/quick/260701-nnc-swap-contact-email-domain/260701-nnc-SUMMARY.md`). Current live values, confirmed by direct read:
- `components/Footer.tsx` line 12: `mailto:business@what-if.tech` ✓ already correct
- `components/Faq.tsx` line 25: `mailto:business@what-if.tech` ✓ already correct, line 26: displayed text `business@what-if.tech` ✓ already correct
- `components/StoryCard.tsx` line 192: `what-if.tech — simulate your decision` ✓ already correct

Planner should treat this sub-task as **verification-only**, not a new edit — only the Footer `href="#"` → real route wiring remains net-new work.

---

### `components/ResultView.tsx` (test-mode notice insertion) — EDIT

**Analog / insertion point:** the existing "Soft paywall" upsell block, already in this same file (lines 175-200):

```tsx
{showUpsell && (
  <div className="relative overflow-hidden rounded-2xl border border-violet-glow/40 bg-gradient-to-br from-violet/15 to-surface/60 p-5 md:col-span-2">
    <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-violet-glow">
      Soft paywall
    </div>
    <div className="mt-1 font-display text-xl leading-tight">
      Want to see the version of this answer{" "}
      <span className="italic text-fg-soft">we held back</span>?
    </div>
    <p className="mt-2 text-sm text-fg-soft">
      Pro unlocks the deeper second-order effects, the kill-switch metric, and history of
      every decision you've simulated.
    </p>
    <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
      <div className="flex-1">
        <UpgradeButton plan="pro">Unlock Pro — €5/mo</UpgradeButton>
      </div>
      <Link
        href="/#pricing"
        className="inline-flex items-center justify-center rounded-xl border border-border-hi bg-bg/40 px-4 py-3 text-sm text-fg-soft transition-colors hover:bg-surface-hi hover:text-fg"
      >
        Compare plans
      </Link>
    </div>
  </div>
)}
```

**Existing "discreet notice" style precedent** — `components/UpgradeButton.tsx` lines 51-55 (the demo-note tooltip already shows the established visual language for a small transient/discreet notice near an Unlock button):
```tsx
{demoNote && (
  <div className="absolute left-0 right-0 top-full mt-2 rounded-md border border-border-hi bg-surface/95 px-3 py-2 text-center text-xs text-fg-soft backdrop-blur">
    {demoNote}
  </div>
)}
```

**Recommended insertion:** add a small persistent (not timed-out) line directly under/beside the `UpgradeButton` inside the upsell block in `ResultView.tsx` (and/or in `app/account/page.tsx`'s upgrade block, lines 74-84, which renders the same two `UpgradeButton`s outside a simulation context):
```tsx
<p className="mt-2 text-center text-[11px] text-fg-mute">
  Testphase · Zahlungen im Testmodus, keine echte Abbuchung
</p>
```
placed after the `UpgradeButton`/`Link` row, using the existing `text-fg-mute` / `text-[10px]`-`text-xs` micro-copy scale already used throughout (`font-mono text-[10px] uppercase tracking-[0.22em] text-fg-mute` appears repeatedly as the small-label idiom — see `ResultView.tsx` lines 88-90, 123, 143, 150, 165). Also apply to `app/account/page.tsx`'s non-subscriber block (lines 77-83) since that's the other Unlock-button surface.

**Second insertion site:** `app/account/page.tsx` lines 77-83 (free-plan upgrade block):
```tsx
<div className="space-y-3">
  <p className="text-center text-sm text-fg-soft">
    You&apos;re on the free plan. Unlock more simulations and history.
  </p>
  <UpgradeButton plan="pro">Unlock Pro — €5/mo</UpgradeButton>
  <UpgradeButton plan="creator">Go Creator — €9/mo</UpgradeButton>
</div>
```
Same discreet notice line should be appended here too, per CONTEXT.md D-10 ("near the Unlock buttons / on the paywall" — both surfaces qualify).

---

### `.env.example`, `lib/openai.ts`, `lib/stripe.ts` — CONFIG (demo/live guard patterns)

**`.env.example` full contents** (11 lines, already read in full):
```
# OpenAI — leave empty to use the built-in demo simulator
OPENAI_API_KEY=

# Stripe — leave empty to use the built-in demo checkout
STRIPE_SECRET_KEY=

# Stripe webhook signing secret (from `stripe listen` locally; dashboard endpoint in prod)
STRIPE_WEBHOOK_SECRET=

# Public URL for redirects (Stripe success/cancel)
NEXT_PUBLIC_URL=http://localhost:3000

# Supabase — leave empty to use the built-in demo fallback (no auth, no DB writes)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Signing secret for anonymous device cookies (generate: openssl rand -hex 32)
ANON_COOKIE_SECRET=
```

**`lib/openai.ts` demo-fallback guard** (lines 5-9):
```ts
const apiKey = process.env.OPENAI_API_KEY;
const client = apiKey ? new OpenAI({ apiKey }) : null;
export const isLive = Boolean(client);
```
Key-presence is the ONLY switch — no separate "test mode" concept for OpenAI. Prod must set a real `OPENAI_API_KEY` to turn `isLive` true.

**`lib/stripe.ts` demo-fallback guard** (lines 3-9):
```ts
const secret = process.env.STRIPE_SECRET_KEY;
export const stripe = secret
  ? new Stripe(secret, { apiVersion: "2024-12-18.acacia" })
  : null;
export const stripeIsLive = Boolean(stripe);
```
Same pattern: presence of `STRIPE_SECRET_KEY` (whether `sk_test_...` or `sk_live_...`) flips `stripeIsLive` true — the code has **no distinction between test-key-live and live-key-live**. This is the concrete basis for D-06/D-07: supplying `sk_test_...` in prod makes `stripeIsLive === true` and the app runs the real (test) Stripe code paths, NOT the demo fallback. Demo fallback only triggers on a genuinely missing/empty key.

**Consuming call sites showing the demo/live branch** — `lib/stripe.ts` lines 34-39 (checkout) and `app/api/stripe/portal/route.ts` lines 11-14 (portal):
```ts
// lib/stripe.ts createCheckoutSession
if (!stripe) {
  return { demo: true, url: `${baseUrl}/?demo_checkout=${plan}` };
}
```
```ts
// app/api/stripe/portal/route.ts
if (!stripe || !supabaseAdmin || !process.env.NEXT_PUBLIC_SUPABASE_URL) {
  return NextResponse.json({ demo: true, url: `${baseUrl}/account?portal=demo` });
}
```

**Planner documentation takeaway:** "demo OFF in prod" for OpenAI/Supabase and "test mode not demo" for Stripe is achieved purely by which env vars are non-empty in the Vercel project — no code changes required in `lib/openai.ts` / `lib/stripe.ts`. The phase's job here is Vercel env configuration, not source edits, unless `.env.example` needs a comment update clarifying the test-vs-live key distinction for future maintainers (optional, low-risk edit):

Suggested `.env.example` comment tweak (documentation-only, no functional change):
```
# Stripe — leave empty to use the built-in demo checkout.
# sk_test_... = real Stripe test-mode flow (NOT demo). sk_live_... = real money.
STRIPE_SECRET_KEY=
```

---

### Base-URL threading (`NEXT_PUBLIC_URL`) — CONFIG, all call sites enumerated

Every place `NEXT_PUBLIC_URL` is read, with exact current line:

| File | Line | Code |
|------|------|------|
| `lib/stripe.ts` | 31 | `const baseUrl = process.env.NEXT_PUBLIC_URL ?? "http://localhost:3000";` (checkout success/cancel URLs, lines 61-62: `${baseUrl}/decision?upgraded=1`, `${baseUrl}/?canceled=1`) |
| `lib/stripe.ts` | 95 | `const baseUrl = process.env.NEXT_PUBLIC_URL ?? "http://localhost:3000";` (portal return_url, line 98: `${baseUrl}/account`) |
| `app/api/stripe/portal/route.ts` | 9 | `const baseUrl = process.env.NEXT_PUBLIC_URL ?? "http://localhost:3000";` (demo-mode redirect fallback) |
| `app/auth/signup/route.ts` | 19-21 | `const origin = process.env.NEXT_PUBLIC_URL ?? req.nextUrl.origin;` (multi-line in source) — feeds `emailRedirectTo: \`${origin}/auth/confirm\`` (line 27) |
| `app/auth/reset-request/route.ts` | 19 | `const origin = process.env.NEXT_PUBLIC_URL ?? req.nextUrl.origin;` — feeds `redirectTo: \`${origin}/auth/confirm?next=/reset\`` (line 24) |
| `.env.example` | 11 | `NEXT_PUBLIC_URL=http://localhost:3000` |

**No code change needed** — per CONTEXT.md D-02, setting `NEXT_PUBLIC_URL=https://what-if.tech` (no trailing slash) in the Vercel project env is the entire domain-swap action for all five functional call sites above. This table is for planner documentation/verification, not an edit target.

---

## Shared Patterns

### Static legal page shell (server component, no client interactivity)
**Source:** `app/account/page.tsx` lines 1-13, 44-58 (strip the Supabase/auth logic, keep the `Nav` / `BackgroundOrbs` / `max-w-2xl` container / rounded card / `Footer` structure)
**Apply to:** `app/impressum/page.tsx`, `app/datenschutz/page.tsx`

### Internal navigation links use `next/link`, external/mailto use `<a>`
**Source:** `components/ResultView.tsx` line 65 (`<Link href="/decision">`) vs `components/Footer.tsx` line 12 (`<a href="mailto:...">`)
**Apply to:** `components/Footer.tsx` Privacy/Terms link fix

### Discreet micro-copy notice idiom
**Source:** `components/ResultView.tsx` recurring `font-mono text-[10px] uppercase tracking-[0.22em] text-fg-mute` label pattern (lines 88, 123, 143, 150, 165) and `components/UpgradeButton.tsx` lines 51-55 (transient demo-note bubble)
**Apply to:** test-mode notice near Unlock buttons in `components/ResultView.tsx` (lines ~188-198) and `app/account/page.tsx` (lines 77-83)

### Demo/live/test-mode guard = env var presence, not a mode flag
**Source:** `lib/openai.ts` lines 5-9, `lib/stripe.ts` lines 3-9
**Apply to:** No code change — informs planner's "production readiness" documentation and Vercel env setup checklist

## No Analog Found

None — all 8 file groups have a direct or role-match analog in the existing codebase.

## Metadata

**Analog search scope:** `app/`, `components/`, `lib/` (full read of all App Router pages and top-level components; targeted reads of `lib/stripe.ts`, `lib/openai.ts`, `.env.example`, auth route handlers)
**Files scanned:** 14 components, 8 app-router pages, 3 lib files, 1 env file, 1 quick-task summary
**Pattern extraction date:** 2026-07-02
