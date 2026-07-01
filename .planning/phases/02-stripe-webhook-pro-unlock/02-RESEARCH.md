# Phase 2: Stripe Webhook + Pro-Unlock Flow - Research

**Researched:** 2026-07-01
**Domain:** Stripe subscription billing (Checkout + webhook) in Next.js 16 App Router, mapped onto Supabase `profiles.plan`
**Confidence:** HIGH (stack, patterns, pitfalls verified against Stripe docs + stripe-node changelog + existing codebase)

## Summary

Phase 2 wires real money into the existing plan gate. Phase 1 already delivered everything this phase gates against: a `profiles` table with a `plan_tier` enum (`free|pro|creator`) and a `stripe_customer_id` column, a service-role admin client (`lib/supabase/admin.ts`), and a plan-aware `/api/simulate` where `checkQuota` already bypasses the daily cap for `pro`/`creator` (`lib/quota.ts:49`). **PAY-04 is effectively already satisfied** — the simulate route reads `profiles.plan` via `resolveActor` and short-circuits for paid plans. The only work PAY-04 needs is confidence that the webhook writes `plan` correctly; no simulate-route code change is required.

The real work is three route handlers and one migration: (1) upgrade the existing checkout route so it attaches the Supabase user id + email to the session (PAY-01), (2) a new signature-verified webhook at `/api/stripe/webhook` that flips `profiles.plan` on subscription lifecycle events (PAY-02, PAY-03, PAY-05), and (3) a Customer Portal session route (PAY-06). The webhook is the only authoritative source of plan state — never trust the checkout redirect.

**The single biggest landmine:** the installed SDK is `stripe@17.5.0`, which pins a **pre-Basil** API version (Acacia era). In pre-Basil, `subscription.current_period_end` exists at the subscription top level. In Basil (`2025-03-31`+, which stripe-node adopted as its default only from **v18.4.0**), that field moved to `subscription.items.data[0].current_period_end` and reading it at the old location returns `undefined` silently. PAY-05 (downgrade at period end) depends on reading this field. The plan must (a) explicitly pin `apiVersion` in the `new Stripe()` constructor to match the SDK, and (b) read `current_period_end` from the location that matches the pinned version. Do not leave the version unpinned.

**Primary recommendation:** Add a `/api/stripe/webhook` route (`runtime="nodejs"`, reads raw body via `await req.text()`), verify with `stripe.webhooks.constructEventAsync`, resolve the user via `client_reference_id` (set at checkout), map `price.unit_amount` → plan tier, and idempotently upsert `profiles.plan` + `stripe_customer_id`. Pin the Stripe API version explicitly. Preserve the demo-mode fallback (`stripe === null`) in every new route.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Open Checkout with email + user id | API (`/api/stripe`) | Client (`UpgradeButton`) | Session must be created server-side with the secret key; client only redirects to `session.url` |
| Verify webhook signature | API (`/api/stripe/webhook`) | — | Requires raw body + signing secret; must be server-only, `runtime="nodejs"` |
| Flip `profiles.plan` on payment | API (webhook) → DB | — | Service-role write; RLS blocks client writes to `profiles` (Phase 1 only granted SELECT) |
| Read plan for gating | API (`/api/simulate`) | DB | Already done in Phase 1 via `resolveActor`; no change needed |
| Open Customer Portal | API (new route) | Client (account UI) | Portal session created server-side from `stripe_customer_id`; client redirects |
| Show current plan in UI | Client (account/nav) | API/DB | Read-only; `profiles` SELECT RLS already allows own-row read |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `stripe` (Node SDK) | 17.5.0 (installed) | Checkout, webhook verification, Customer Portal | Already in `package.json`; official SDK. `[VERIFIED: package.json]` |
| `@supabase/supabase-js` | 2.110.0 (installed) | Service-role writes to `profiles` from webhook | Already the admin client (`lib/supabase/admin.ts`). `[VERIFIED: package.json]` |
| Next.js route handlers | 16.2.9 (installed) | `/api/stripe/webhook`, portal route | Raw-body access via `req.text()`; `runtime="nodejs"` required for `stripe` SDK. `[VERIFIED: package.json]` |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Stripe CLI | latest | Local webhook forwarding + event triggering | Dev/test only, not a runtime dep. `[CITED: docs.stripe.com/webhooks/test]` |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `stripe@17.5.0` (pre-Basil) | Upgrade to `stripe@22.x` (latest) | Latest is `22.3.0` `[VERIFIED: npm view stripe version]`. Upgrading pulls in the Basil breaking change (`current_period_end` moves to item level) and other typings churn. **Recommendation: stay on 17.5.0 for this phase**, pin its API version explicitly, ship, and treat an SDK bump as a separate deliberate task. Bootstrapped solo founder — do not mix a billing launch with a major SDK upgrade. |
| `client_reference_id` for user mapping | `subscription_data.metadata` | `client_reference_id` is simplest for Checkout→`checkout.session.completed`. But it is NOT copied onto the Subscription object, so `customer.subscription.updated/deleted` events can't read it. Persist `stripe_customer_id` on the profile at first webhook so later events resolve via customer lookup. See Pitfall 3. |
| Inline `price_data` (current code) | Pre-created Price IDs in Stripe dashboard | Inline `price_data` (already used in `lib/stripe.ts`) works and keeps price config in code. Downside: mapping price→tier in the webhook must read `unit_amount` (500/900) rather than a stable `price.id`. Acceptable for 2 fixed tiers. See "Mapping price → plan tier". |

**Installation:** No new npm packages required. Stripe CLI installed separately for local testing:
```bash
# Stripe CLI (Windows via scoop or direct download)
scoop install stripe   # or download from https://github.com/stripe/stripe-cli/releases
stripe login
```

**Version verification (run at plan time):**
```bash
npm view stripe version          # latest → 22.3.0 (as of 2026-07-01)
npm view stripe@17.5.0 version   # confirms installed is 17.5.0
```
`[VERIFIED: npm registry, 2026-07-01]` — installed `stripe@17.5.0`; latest `22.3.0`; stripe-node adopted Basil default at v18.4.0 (2025-07-30) `[VERIFIED: stripe-node CHANGELOG]`.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| PAY-01 | Checkout opens for Pro (€5) / Creator (€9), email pre-filled | Extend `createCheckoutSession` in `lib/stripe.ts` to accept user id + email; set `customer_email` + `client_reference_id`. See "Checkout session" pattern. |
| PAY-02 | Webhook verifies signature + handles 3 events | New `/api/stripe/webhook/route.ts`, `constructEventAsync` on raw body. See "Webhook signature verification" + "Event handling". |
| PAY-03 | Active sub → `plan='pro'\|'creator'`, else `'free'` | Map `price.unit_amount`→tier, idempotent upsert. See "Mapping price → plan tier" + "Idempotency". |
| PAY-04 | `/api/simulate` bypasses free limit for paid plans | **Already implemented** — `lib/quota.ts:49` bypasses for `pro`/`creator`. Only needs the webhook to write `plan` correctly. No simulate-route change. |
| PAY-05 | Cancel/fail → downgrade to Free at period end | `customer.subscription.updated` (`cancel_at_period_end`, `status`) + `.deleted`. **Landmine:** `current_period_end` location depends on API version. See Pitfall 1 + "Event handling". |
| PAY-06 | Customer Portal from account | New portal-session route from `stripe_customer_id`. Requires test-mode portal config saved first. See "Customer Portal". |
</phase_requirements>

## Architecture Patterns

### System Architecture Diagram

```
                                  ┌─────────────────────────────────────┐
  User clicks "Unlock Pro"        │  Stripe (hosted)                     │
  (UpgradeButton, client)         │                                      │
        │                         │                                      │
        ▼                         │                                      │
  POST /api/stripe ───────────────┼──► checkout.sessions.create          │
  { plan, (from session) userId } │      customer_email = user.email      │
        │                         │      client_reference_id = user.id    │
        │  { url }                │      metadata.plan = pro|creator      │
        ▼                         │              │                        │
  window.location = url ──────────┼──────────────┘                        │
                                  │      Stripe-hosted Checkout page      │
  User pays (test card) ──────────┼──────────────┐                        │
        │                         │              ▼                        │
        │  redirect               │   emits events (async, retried):      │
        ▼                         │   • checkout.session.completed        │
  /decision?upgraded=1            │   • customer.subscription.updated     │
  (DO NOT trust this for state)   │   • customer.subscription.deleted     │
                                  │              │                        │
                                  └──────────────┼────────────────────────┘
                                                 │  POST (signed)
                                                 ▼
                              ┌──────────────────────────────────────────┐
                              │  /api/stripe/webhook  (nodejs runtime)    │
                              │  1. raw = await req.text()                │
                              │  2. constructEventAsync(raw, sig, secret) │
                              │  3. switch(event.type)                    │
                              │     - resolve userId (client_reference_id │
                              │       or customer lookup)                 │
                              │     - map price.unit_amount → tier        │
                              │     - idempotent upsert profiles.plan     │
                              │       + stripe_customer_id                │
                              │  4. return 200 (always, if handled)       │
                              └──────────────────┬───────────────────────┘
                                                 │ service-role write
                                                 ▼
                              ┌──────────────────────────────────────────┐
                              │  Supabase profiles                        │
                              │  plan = free|pro|creator                  │
                              │  stripe_customer_id                       │
                              └──────────────────┬───────────────────────┘
                                                 │ read (resolveActor)
                                                 ▼
                              ┌──────────────────────────────────────────┐
                              │  /api/simulate → checkQuota               │
                              │  pro/creator ⇒ bypass daily cap (DONE)    │
                              └──────────────────────────────────────────┘

  Account page ──► POST /api/stripe/portal ──► billingPortal.sessions.create
                   (from profiles.stripe_customer_id) ──► redirect to portal url
```

### Recommended Project Structure
Follows the CLAUDE.md rule "no new files when an existing one fits." New files only where no existing file fits:
```
app/api/stripe/
├── route.ts              # EDIT — checkout: attach userId + email
├── webhook/route.ts      # NEW  — signature verify + plan flip (no existing file fits)
└── portal/route.ts       # NEW  — Customer Portal session (PAY-06)
lib/
├── stripe.ts             # EDIT — createCheckoutSession(plan, userId, email); add
│                         #        planFromAmount(), createPortalSession(customerId),
│                         #        pinned apiVersion, webhook secret handling
supabase/migrations/
└── 0003_phase2_billing.sql  # NEW — add stripe_subscription_id, plan write policy note
account UI                   # EDIT existing account/nav surface OR small new page —
                             #      see "Open Questions" (no account page exists yet)
```

### Pattern 1: Raw-body webhook verification (Next.js 16 App Router)
**What:** App Router route handlers give you the raw body directly — no `bodyParser: false` config needed (that was Pages Router). Read `await req.text()` and pass the exact string to Stripe.
**When to use:** The webhook route only.
**Example:**
```typescript
// app/api/stripe/webhook/route.ts
// Source: https://docs.stripe.com/webhooks + stripe-node README
import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe"; // exported instance (currently module-private — export it)

export const runtime = "nodejs";        // REQUIRED: stripe SDK needs Node crypto, not edge
export const dynamic = "force-dynamic";

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(req: NextRequest) {
  // Demo-mode preserve: if Stripe or secret is absent, no-op 200 (never 500 in demo).
  if (!stripe || !webhookSecret) {
    return NextResponse.json({ received: true, demo: true });
  }

  const sig = req.headers.get("stripe-signature");
  if (!sig) return NextResponse.json({ error: "no signature" }, { status: 400 });

  const raw = await req.text(); // MUST be the raw string, not req.json()
  let event;
  try {
    // Async variant uses Web Crypto — works across Node versions without the sync crypto shim.
    event = await stripe.webhooks.constructEventAsync(raw, sig, webhookSecret);
  } catch (err) {
    console.error("[stripe:webhook] bad signature", err);
    return NextResponse.json({ error: "invalid signature" }, { status: 400 });
  }

  // ... handle event.type (see Pattern 2). Always return 200 once handled/ignored.
  return NextResponse.json({ received: true });
}
```
`[CITED: docs.stripe.com/webhooks]` `[VERIFIED: stripe-node exposes constructEventAsync]`

**Note on `stripe` export:** `lib/stripe.ts` currently keeps `stripe` module-private. The plan must export it (or a getter) so the webhook + portal routes reuse the single pinned-version instance. Keep the `stripe === null` demo guard.

### Pattern 2: Event handling + plan mapping
**What:** Switch on `event.type`, resolve the user, compute the tier, write idempotently.
**When to use:** Inside the webhook.
**Example:**
```typescript
// Source: https://docs.stripe.com/api/events/types + object references
import { supabaseAdmin } from "@/lib/supabase/admin";

switch (event.type) {
  case "checkout.session.completed": {
    const s = event.data.object; // Stripe.Checkout.Session
    const userId = s.client_reference_id;         // set at checkout (PAY-01)
    const customerId = s.customer as string;       // Stripe customer id
    const subId = s.subscription as string;
    // Fetch the subscription to read the price (session line items aren't expanded here).
    const sub = await stripe!.subscriptions.retrieve(subId);
    const plan = planFromSubscription(sub);        // 'pro' | 'creator'
    if (userId) {
      await supabaseAdmin!.from("profiles").update({
        plan,
        stripe_customer_id: customerId,
        stripe_subscription_id: subId,
      }).eq("id", userId);
    }
    break;
  }
  case "customer.subscription.updated": {
    const sub = event.data.object; // Stripe.Subscription
    // status ∈ active|past_due|canceled|unpaid|incomplete|incomplete_expired|trialing|paused
    // PAY-05: cancel_at_period_end=true means still active NOW, downgrade later.
    const stillEntitled = sub.status === "active" || sub.status === "trialing";
    const plan = stillEntitled ? planFromSubscription(sub) : "free";
    await supabaseAdmin!.from("profiles").update({ plan })
      .eq("stripe_customer_id", sub.customer as string);
    break;
  }
  case "customer.subscription.deleted": {
    const sub = event.data.object;
    await supabaseAdmin!.from("profiles").update({ plan: "free" })
      .eq("stripe_customer_id", sub.customer as string);
    break;
  }
  default:
    // Ignore unhandled types — still return 200.
    break;
}
```

**Reading `current_period_end` (PAY-05 date) — VERSION-DEPENDENT, see Pitfall 1:**
```typescript
// stripe@17.5.0 (pre-Basil, this project): field is at subscription level
const periodEnd = sub.current_period_end; // unix seconds — valid on 17.5.0

// stripe@18.4.0+ / Basil API: field moved to the item
// const periodEnd = sub.items.data[0].current_period_end;
```

### Pattern 3: cancel_at_period_end — DO NOT downgrade immediately (PAY-05)
**What:** When a user cancels via the portal, Stripe sets `cancel_at_period_end=true` and keeps `status='active'` until the period ends. They paid through the period — they keep Pro until then.
**When to use:** The `customer.subscription.updated` handler.
**Rule:** Downgrade to `free` only when `status` becomes `canceled`/`unpaid`/`incomplete_expired`, OR on `customer.subscription.deleted`. Treat `active`+`cancel_at_period_end=true` as still Pro. Stripe fires `customer.subscription.deleted` at the actual period end — that is the downgrade trigger. "Stripe handles the date" (per PAY-05) means: rely on Stripe's period-end `.deleted` event, do not schedule your own timer.

### Anti-Patterns to Avoid
- **Trusting the redirect for plan state:** `success_url=/decision?upgraded=1` fires before/independent of the webhook. Never write `plan` based on the redirect. The webhook is authoritative. The redirect page may show an optimistic "activating…" state that reads real plan on next load.
- **Using `req.json()` in the webhook:** destroys the raw bytes needed for signature verification. Always `req.text()`.
- **Edge runtime for the webhook:** the `stripe` SDK's crypto and `constructEvent` need Node. Keep `runtime="nodejs"` (matches every other route in this project).
- **Immediate downgrade on cancel:** see Pattern 3 — strands paid users.
- **Client-side plan writes:** RLS from Phase 1 grants only SELECT on `profiles`. All plan writes go through the service-role admin client in the webhook. Do not add a client-writable policy.
- **Unpinned `apiVersion`:** leaves you exposed to your Stripe account's dashboard default version silently differing from the SDK's typings. Pin it. See Pitfall 1.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Webhook signature check | Custom HMAC-SHA256 timestamp comparison | `stripe.webhooks.constructEventAsync` | Handles timestamp tolerance, replay window, multiple signing secrets, constant-time compare. Rolling your own is a security bug factory. |
| Subscription state machine | Custom "is this user Pro?" logic tracking dates | Read `subscription.status` from Stripe events | Stripe already computes `active/past_due/canceled/...`. Mirror it into `plan`; don't recompute entitlement from dates. |
| Cancellation-at-period-end timer | A cron/scheduled job that downgrades users | Stripe's `customer.subscription.deleted` at period end | Vercel free tier has no always-on workers (PROJECT.md constraint). Stripe fires the event for you. |
| Billing/payment UI | Custom card form, cancel button, invoice list | Stripe Checkout + Customer Portal | PCI scope stays with Stripe (locked decision in PROJECT.md). Portal handles cancel/update/invoices out of the box. |
| Idempotency ledger | A `processed_events` table | Idempotent UPSERT by user id / customer id | Setting `plan='pro'` twice is harmless (same result). Full event-dedup is overkill for this scale; the write is naturally idempotent. See Idempotency section. |

**Key insight:** In subscription billing, Stripe is the source of truth for *entitlement state*; your DB is a *cache* of it. Every webhook handler should be "read Stripe's current view of this subscription, mirror it into `profiles.plan`." Don't build parallel logic that can drift.

## Mapping price → plan tier

The current checkout uses inline `price_data` with `unit_amount` 500 (Pro) / 900 (Creator) — there are no stable `price.id`s. Map from the amount:

```typescript
// lib/stripe.ts
export function planFromSubscription(sub: Stripe.Subscription): Plan {
  const amount = sub.items.data[0]?.price.unit_amount ?? 0;
  return amount >= 900 ? "creator" : "pro";
}
```
`[ASSUMED]` that these two amounts remain the only paid tiers. Risk if wrong: a future price change silently mis-tiers users. **Recommendation for planner:** either (a) keep the amount map and add a code comment tying it to `PLANS` in `lib/stripe.ts`, or (b) create two fixed Price IDs in the Stripe dashboard and map by `price.id` (more robust, requires dashboard setup + storing IDs in env). For a 2-tier launch, the amount map is acceptable and requires zero dashboard config — consistent with the demo-mode/no-external-config ethos. Metadata (`subscription_data.metadata.plan`) set at checkout is a third, self-documenting option that survives on the Subscription object for the `.updated`/`.deleted` events.

## Idempotency

Webhooks are retried (Stripe resends on non-2xx or timeout, and can deliver duplicates). Make writes safe under repeat delivery:

- **The plan write is naturally idempotent:** `UPDATE profiles SET plan='pro' WHERE id=$1` produces the same state no matter how many times it runs. No dedup table needed for correctness.
- **Persist `stripe_customer_id` (already a column) AND add `stripe_subscription_id`** on the first `checkout.session.completed`. This is what lets `customer.subscription.updated/deleted` (which carry `customer` but NOT `client_reference_id`) resolve back to the user via `.eq("stripe_customer_id", …)`.
- **Ordering caveat:** Stripe does not guarantee event order. `customer.subscription.updated` can arrive before `checkout.session.completed`. If an `.updated`/`.deleted` arrives for a `customer` we haven't linked yet, the `.eq("stripe_customer_id", …)` matches zero rows — a safe no-op; the subsequent `checkout.session.completed` establishes the link and sets the correct plan. Document this as acceptable.
- **Return 200 fast.** Do heavy work (one `subscriptions.retrieve` + one UPDATE) synchronously — it's well under Stripe's timeout — then 200. Never 500 on an unhandled event type.

## Checkout session (PAY-01)

Extend `createCheckoutSession` to take the logged-in user's id + email. The current route (`app/api/stripe/route.ts`) has no auth wiring — add it, mirroring `/api/simulate`'s pattern (`createSupabaseServerClient()` → `auth.getUser()`).

```typescript
// lib/stripe.ts (edited signature)
export async function createCheckoutSession(
  plan: Plan,
  opts?: { userId?: string; email?: string },
): Promise<{ url: string; demo: boolean }> {
  // ...demo guard unchanged...
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    // Prefill + LOCK email to the account email. Use customer_email (creates/attaches
    // a customer). Do NOT also pass `customer` unless you already have a customer id.
    customer_email: opts?.email,
    client_reference_id: opts?.userId,          // → checkout.session.completed maps user
    subscription_data: { metadata: { plan, userId: opts?.userId ?? "" } }, // survives on Subscription
    line_items: [ /* existing inline price_data */ ],
    success_url: `${baseUrl}/decision?upgraded=1`,
    cancel_url: `${baseUrl}/?canceled=1`,
  });
  return { url: session.url ?? `${baseUrl}/`, demo: false };
}
```
`[CITED: docs.stripe.com/api/checkout/sessions/create]`
- `customer_email` prefills and disables the email field on the Stripe page (email pre-filled per PAY-01).
- `client_reference_id` is the simplest user→session link and appears on `checkout.session.completed`.
- `subscription_data.metadata` is copied onto the Subscription, so `.updated`/`.deleted` can also carry `userId`/`plan` if you prefer metadata over the `stripe_customer_id` lookup.

## Customer Portal (PAY-06)

```typescript
// lib/stripe.ts
export async function createPortalSession(customerId: string): Promise<string> {
  const baseUrl = process.env.NEXT_PUBLIC_URL ?? "http://localhost:3000";
  const session = await stripe!.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${baseUrl}/account`, // wherever the account surface lives
  });
  return session.url;
}
```
`[CITED: docs.stripe.com/api/customer_portal/sessions/create]`

**Test-mode prerequisite (landmine):** You **cannot create a portal session in test mode until you save the Customer Portal settings once in the test dashboard** (Settings → Billing → Customer portal → Save). If you skip this, `billingPortal.sessions.create` throws. This is a founder dashboard action, not code — the plan must list it as a manual setup step. `[VERIFIED: docs.stripe.com/customer-management/configure-portal — "You can't create a portal session in test mode until you save your customer portal settings in test mode."]`

The route needs `customerId` from `profiles.stripe_customer_id`; if it's null (user never checked out), return a 400/redirect-to-pricing rather than calling Stripe.

## Common Pitfalls

### Pitfall 1: `current_period_end` location depends on API version (PAY-05)
**What goes wrong:** Code reads `subscription.current_period_end`, gets `undefined`, and the downgrade date/logic silently breaks. Or worse — works locally, breaks in prod because the Stripe account's default API version differs from the SDK.
**Why it happens:** Stripe Basil (`2025-03-31`) moved the field to `subscription.items.data[0].current_period_end`. stripe-node adopted Basil as its default apiVersion only at **v18.4.0**. This project is on **17.5.0 (pre-Basil)**, so `subscription.current_period_end` is still valid — *for this SDK*. But if the Stripe account's dashboard default is set to a Basil version and you don't pin, behavior gets murky.
**How to avoid:**
1. Explicitly pin the SDK to its native version: `new Stripe(secret, { apiVersion: "2024-12-18.acacia" })` (the version 17.x ships with). This makes requests deterministic regardless of the account default. `[CITED: docs.stripe.com/sdks/versioning]`
2. For PAY-05, prefer reading `subscription.status` + `cancel_at_period_end` (Pattern 3) as the entitlement signal — these did NOT move and are stable across versions. You only need `current_period_end` if you want to *display* the renewal/end date, not to gate access.
**Warning signs:** `undefined` where you expect a unix timestamp; TypeScript type errors if you later bump the SDK.

### Pitfall 2: Webhook secret confusion (test CLI vs dashboard vs prod)
**What goes wrong:** Signature verification fails with a valid-looking event because the wrong `STRIPE_WEBHOOK_SECRET` is used.
**Why it happens:** There are THREE different signing secrets: (a) the one `stripe listen` prints locally (`whsec_...`, ephemeral per CLI session), (b) the one shown for a registered endpoint in the test dashboard, (c) the prod endpoint's secret. Each verifies only its own events.
**How to avoid:** Locally, copy the secret from `stripe listen --forward-to localhost:3000/api/stripe/webhook` output into `.env.local` as `STRIPE_WEBHOOK_SECRET`. Prod secret is Phase 4 (`DEPLOY-02`), configured in Vercel. Document clearly that the local secret changes each `stripe listen` run unless you use `--api-key`/a fixed endpoint.
**Warning signs:** Consistent 400 "invalid signature" while events are clearly arriving.

### Pitfall 3: `.updated`/`.deleted` events can't see `client_reference_id`
**What goes wrong:** You map the user via `client_reference_id` in `checkout.session.completed`, then try the same in the subscription events and it's missing.
**Why it happens:** `client_reference_id` lives on the Checkout Session, not the Subscription. Later lifecycle events carry only `customer` and (if you set it) `metadata`.
**How to avoid:** On the first `checkout.session.completed`, persist `stripe_customer_id` (+ `stripe_subscription_id`) to the profile. Resolve later events via `.eq("stripe_customer_id", sub.customer)`. Alternatively set `subscription_data.metadata.userId` at checkout — it rides along on every subscription event.
**Warning signs:** Downgrades never apply; `.updated` handler matches zero rows.

### Pitfall 4: Race between redirect and webhook (UX)
**What goes wrong:** User lands on `/decision?upgraded=1`, runs a simulation, still hits the free paywall because the webhook hasn't flipped `plan` yet.
**Why it happens:** The redirect is immediate; the webhook is asynchronous (usually <1–2s but not guaranteed).
**How to avoid:** On the `?upgraded=1` landing, show an optimistic "Unlocking Pro…" state and re-check plan on a short poll or a manual "refresh". Do NOT write plan client-side. Keep expectations honest: "within seconds" (per success criteria) is the webhook's job. `[ASSUMED]` this UX is acceptable for launch — flag for founder.

### Pitfall 5: Demo-mode regression
**What goes wrong:** New routes 500 when `STRIPE_SECRET_KEY` is absent, breaking the founder's keyless demo recordings (an explicit PROJECT.md invariant, re-verified in Phase 1 steps 20-21).
**Why it happens:** `stripe` is `null` in demo mode; calling methods on it throws.
**How to avoid:** Every new route guards `if (!stripe) return <canned/no-op>`. Webhook returns `{received:true, demo:true}` 200; portal returns a demo notice; checkout already returns the demo URL. Add a demo-mode check to the Nyquist verification for this phase.

## Code Examples

### Exporting a single pinned Stripe instance (lib/stripe.ts)
```typescript
// Source: https://docs.stripe.com/sdks/versioning
import Stripe from "stripe";
const secret = process.env.STRIPE_SECRET_KEY;
export const stripe = secret
  ? new Stripe(secret, { apiVersion: "2024-12-18.acacia" }) // pin to SDK 17.x native version
  : null;
export const stripeIsLive = Boolean(stripe);
```
Note: verify the exact apiVersion string 17.5.0 ships by checking `node_modules/stripe/types/lib.d.ts` (`LatestApiVersion`) or the SDK's `apiVersion` default at plan time. `[ASSUMED: 2024-12-18.acacia]` — confirm against installed package.

### Migration 0003 (add subscription id)
```sql
-- supabase/migrations/0003_phase2_billing.sql
alter table public.profiles
  add column if not exists stripe_subscription_id text;
create index if not exists profiles_stripe_customer_idx
  on public.profiles (stripe_customer_id) where stripe_customer_id is not null;
-- No new RLS policy: plan writes stay service-role only (webhook). SELECT-own already exists.
```
Also extend `lib/db.types.ts` `profiles` Row/Update with `stripe_subscription_id: string | null`.

## Local testing (Stripe CLI)

```bash
stripe login                    # one-time, opens browser
# Forward live-arriving test events to the local webhook; prints the whsec_ secret to use:
stripe listen --forward-to localhost:3000/api/stripe/webhook
# In another shell, drive the flow: use the Checkout URL from UpgradeButton with test card
#   card 4242 4242 4242 4242, any future expiry, any CVC, any postal
# Or trigger canned events directly:
stripe trigger checkout.session.completed
stripe trigger customer.subscription.updated
stripe trigger customer.subscription.deleted
```
`[CITED: docs.stripe.com/webhooks/test, docs.stripe.com/testing]`
- `stripe trigger` sends synthetic objects — they won't carry your real `client_reference_id`, so end-to-end user mapping is best tested via a real test-mode Checkout (4242 card), and per-event logic via `trigger`.
- The `whsec_...` printed by `stripe listen` goes into `.env.local` as `STRIPE_WEBHOOK_SECRET`.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Pages Router `export const config = { api: { bodyParser: false } }` for raw body | App Router: `await req.text()` on the `Request` | Next 13+ App Router | Simpler; no config export. This project is App Router. |
| `subscription.current_period_end` (top level) | `subscription.items.data[0].current_period_end` | Stripe Basil `2025-03-31`; stripe-node default at v18.4.0 | This project (17.5.0) still uses top-level. Pin apiVersion to avoid ambiguity. |
| `constructEvent` (sync, Node crypto) | `constructEventAsync` (Web Crypto) | stripe-node modern releases | Async variant is portable across runtimes; use it. Sync still works on `runtime="nodejs"`. |

**Deprecated/outdated:**
- Reading period end from subscription top-level is deprecated in Basil — safe here only because the SDK is pre-Basil. Treat as tech debt to revisit on any SDK upgrade.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `stripe@17.5.0` pins apiVersion `2024-12-18.acacia` (pre-Basil), so `subscription.current_period_end` is top-level | Pitfall 1, Code Examples | If the account default is Basil and version is unpinned, period-end reads `undefined`. **Mitigation: pin apiVersion explicitly + prefer status-based entitlement.** Confirm exact string in node_modules at plan time. |
| A2 | Pro=€5=500 and Creator=€9=900 remain the only paid tiers; amount-based mapping is sufficient | Mapping price → plan tier | Future tier/price change silently mis-tiers users. Mitigation: comment-tie to `PLANS`, or use metadata/Price IDs. |
| A3 | Optimistic "unlocking" UX on the redirect (vs. blocking until webhook) is acceptable for launch | Pitfall 4 | Poor UX if webhook is slow; founder may want a poll/refresh. Confirm with founder. |
| A4 | No account page exists yet; PAY-06 needs a new small surface to host the "Manage subscription" button | Open Questions | If a hidden account surface exists, this is wasted work. Verified: no `app/**/account*` file found. |
| A5 | Staying on `stripe@17.5.0` (not upgrading to 22.x) for this phase | Alternatives Considered | If founder wants latest SDK, the Basil period-end change must be handled and typings churn absorbed — larger scope. Recommend deferring the bump. |

## Open Questions

1. **Where does the "Manage subscription" (Portal) button live? (PAY-06)**
   - What we know: No account page exists (`app/**/account*` returned no files). `AuthNav.tsx` shows email + logout in the nav. `PaywallNotice`/`UpgradeButton` handle the upsell side.
   - What's unclear: Whether to add a dedicated `/account` page or surface "Manage subscription" in the nav dropdown for logged-in Pro/Creator users.
   - Recommendation: A minimal `/account` page (email, current plan, "Manage subscription" → portal, "Sign out") is the cleanest home for both PAY-06 and future v2 history. Confirm scope with founder — this is UI beyond the pure webhook.

2. **Exact apiVersion string shipped by `stripe@17.5.0`.**
   - What we know: 17.x is pre-Basil (Basil default landed at 18.4.0).
   - What's unclear: The precise pin string (`2024-12-18.acacia` assumed).
   - Recommendation: At plan/execute time, read `node_modules/stripe/src/apiVersion.ts` or the `Stripe.LatestApiVersion` type and pin that exact value.

3. **Should PAY-05 store the period-end date at all, or purely mirror status?**
   - What we know: Status-based entitlement (Pattern 3) fully satisfies "downgrade at period end" via `.deleted`.
   - What's unclear: Whether the account UI wants to *display* "renews on / access until" (needs the date, hence Pitfall 1).
   - Recommendation: Ship status-mirroring for correctness now; add date display only if the account page needs it.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| `stripe` SDK | All PAY reqs | ✓ | 17.5.0 | Demo-mode (`stripe===null`) |
| `@supabase/supabase-js` admin client | PAY-03 plan writes | ✓ | 2.110.0 | Demo-mode no-op |
| Stripe secret key (`STRIPE_SECRET_KEY`) | Live checkout/webhook | ✗ (empty in `.env.local`) | — | Demo-mode fallback (intentional) |
| `STRIPE_WEBHOOK_SECRET` | PAY-02 verification | ✗ (not yet set) | — | Webhook no-ops in demo; founder sets from `stripe listen` |
| Stripe CLI | Local webhook testing | ? (not verified installed) | — | Test via dashboard-registered endpoint |
| Test-mode Customer Portal config | PAY-06 | ✗ (dashboard action pending) | — | None — must be saved in test dashboard before portal works |

**Missing dependencies with no fallback:**
- Test-mode Customer Portal configuration must be saved once in the Stripe test dashboard before `billingPortal.sessions.create` works. Founder manual step.

**Missing dependencies with fallback:**
- Stripe keys absent locally → demo mode keeps everything running (intentional, must be preserved).
- Stripe CLI absent → can register a test webhook endpoint in the dashboard instead, but CLI is strongly recommended for the local loop.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | **None detected** — no jest/vitest/playwright config, no test files `[VERIFIED: repo scan]` |
| Config file | none — see Wave 0 |
| Quick run command | n/a until framework added |
| Full suite command | n/a until framework added |

This project has shipped Phase 1 with manual/human verification only (the 21-step checklist in STATE.md). `nyquist_validation` is enabled in config, but there is no automated harness. Two honest options for the planner:

- **Option A (lightweight, recommended for a solo founder):** Add `vitest` and write pure-function unit tests for the two testable seams — `planFromSubscription()` (amount→tier) and the event-type→plan reducer (given a mock event, assert the intended `plan`). Webhook signature verification and Stripe I/O are validated manually via Stripe CLI. This gives real coverage on the logic most likely to break (Pitfall 1, tier mapping) without mocking the whole Stripe SDK.
- **Option B (match Phase 1):** Continue with a scripted manual verification checklist (Stripe CLI `trigger` + a real 4242 test payment + DB row inspection). No new deps. Consistent with how Phase 1 was verified.

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command (Option A) | File Exists? |
|--------|----------|-----------|------------------------------|-------------|
| PAY-01 | Checkout has email + client_reference_id set | manual (Stripe test payment) | inspect Checkout page / session | ❌ manual |
| PAY-02 | Signature verified; bad sig → 400 | unit + manual | `vitest lib/stripe.test.ts` (reducer) + `stripe listen` | ❌ Wave 0 |
| PAY-03 | Event → correct plan written | unit | `vitest run lib/stripe.test.ts::planFromSubscription` | ❌ Wave 0 |
| PAY-04 | Pro/Creator bypass daily cap | already covered | (Phase 1 quota logic) | ✅ live |
| PAY-05 | cancel_at_period_end stays Pro; deleted→free | unit | `vitest` on the event reducer | ❌ Wave 0 |
| PAY-06 | Portal session created from customer id | manual | click "Manage" → lands on portal | ❌ manual |

### Sampling Rate
- **Per task commit:** `npx vitest run` (if Option A) — seconds; else `npx tsc --noEmit && npm run build`.
- **Per wave merge:** full `vitest run` + `next build`.
- **Phase gate:** Stripe CLI end-to-end (real test payment flips DB to pro/creator within seconds) + demo-mode regression (keyless run) before `/gsd-verify-work`.

### Wave 0 Gaps
- [ ] Decide Option A vs B with founder (adds `vitest` + `@vitejs/plugin-react` or keeps manual).
- [ ] If Option A: `vitest.config.ts` + `lib/stripe.test.ts` covering `planFromSubscription` and the event→plan reducer (extract the reducer as a pure function so it's testable without HTTP).
- [ ] Framework install (Option A): `npm i -D vitest`.
- [ ] Regardless: extend the manual verification checklist (STATE.md style) for the 3 webhook events + portal + demo-mode.

*(Recommend extracting the event→plan decision into a pure function `planForEvent(event): PlanTier | null` in `lib/stripe.ts` so the core logic is unit-testable without mocking `NextRequest`/signatures.)*

## Security Domain

### Applicable ASVS Categories
| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | yes | Checkout/portal routes must read the logged-in user via `createSupabaseServerClient().auth.getUser()`; never trust a client-supplied userId |
| V3 Session Management | no | Supabase handles sessions (Phase 1) |
| V4 Access Control | yes | Plan writes are service-role only; RLS grants clients SELECT-own on `profiles` (Phase 1). Do NOT add client write policy. Portal route must only open a portal for the caller's own `stripe_customer_id`. |
| V5 Input Validation | yes | Webhook: verify signature before parsing (constructEventAsync). Checkout route: validate `plan` is `pro\|creator` (existing code already coerces). |
| V6 Cryptography | yes | Signature verification via `constructEventAsync` — never hand-roll HMAC. |

### Known Threat Patterns for Stripe webhook + Next.js
| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Forged webhook POST → free Pro | Spoofing | `constructEventAsync` signature verification; reject on failure with 400 |
| Replayed webhook event | Tampering/Replay | Stripe's signature includes a timestamp; default tolerance rejects stale events. Idempotent writes make replays harmless anyway. |
| IDOR: open another user's portal | Elevation of Privilege | Portal route derives `customer_id` from the authenticated user's own `profiles` row, never from request body |
| Client forging userId at checkout | Spoofing | Set `client_reference_id`/`metadata.userId` server-side from `auth.getUser()`, not from the POST body |
| Leaking service-role key to client | Info Disclosure | Admin client is `server-only` (already enforced in `lib/supabase/admin.ts`); webhook + portal routes are server route handlers |
| Secret in `success_url`/logs | Info Disclosure | Never put subscription/customer ids the client shouldn't see in redirect URLs; keep them server-side |

## Sources

### Primary (HIGH confidence)
- `package.json` — installed `stripe@17.5.0`, `@supabase/supabase-js@2.110.0`, `next@16.2.9` `[VERIFIED]`
- `lib/quota.ts`, `lib/stripe.ts`, `lib/supabase/admin.ts`, `app/api/simulate/route.ts`, `supabase/migrations/0001_phase1_init.sql`, `lib/db.types.ts` — existing patterns `[VERIFIED: codebase read]`
- npm registry: `npm view stripe version` → 22.3.0; `stripe@17.5.0` confirmed installed `[VERIFIED]`
- stripe-node CHANGELOG — Basil default adopted at v18.4.0 (2025-07-30) `[VERIFIED: github.com/stripe/stripe-node/CHANGELOG.md]`
- docs.stripe.com/changelog/basil/2025-03-31 — `current_period_start/end` removed from Subscription, moved to items `[CITED]`
- docs.stripe.com/customer-management/configure-portal — test-mode portal must be saved before session creation `[CITED]`
- docs.stripe.com/api/checkout/sessions/create, /api/customer_portal/sessions/create, /webhooks, /testing `[CITED]`

### Secondary (MEDIUM confidence)
- dev.to/flarecanary — practical writeup of the Basil `current_period_end` breakage and new access path (cross-checks the changelog) `[MEDIUM]`

### Tertiary (LOW confidence)
- Exact apiVersion string shipped by 17.5.0 (`2024-12-18.acacia` assumed) — verify in node_modules at plan time `[LOW / A1]`

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all deps already installed and version-checked against npm.
- Architecture: HIGH — mirrors existing `/api/simulate` + admin-client patterns; webhook flow is canonical Stripe.
- Pitfalls: HIGH — Basil period-end change and portal test-mode requirement verified against official docs; race + secret-confusion are well-established.
- Version-specific detail (A1 apiVersion string): MEDIUM — pre-Basil confirmed, exact string to verify locally.

**Research date:** 2026-07-01
**Valid until:** 2026-07-31 (stable; re-verify only if the `stripe` SDK is upgraded — that changes Pitfall 1's answer)
