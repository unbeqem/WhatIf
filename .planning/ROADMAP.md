# Roadmap: WhatIf

**Milestone:** v1 Production Launch
**Created:** 2026-06-30
**Granularity:** standard
**Phases:** 4
**Coverage:** 29/29 v1 requirements mapped

## Core Value Anchor

A user must be able to type a decision, get a sober three-future simulation in seconds, hit a soft paywall, and pay — without friction. Every phase below either protects that loop or wires money/identity into it.

## Phase Order

Phase order is fixed by the founder (see PROJECT.md Key Decisions). Do not re-sequence.

1. Rate-Limiting + User-System — make the free tier defensible
2. Stripe Webhook + Pro-Unlock Flow — turn paying users into actual Pro/Creator state
3. Polish + New Features — landing-page conversion + Creator differentiator
4. Live Deploy — flip every env switch and ship publicly

## Phases

- [x] **Phase 1: Rate-Limiting + User-System** — Supabase Auth, anon + free-tier daily counters, abuse protection on `/api/simulate`
- [x] **Phase 2: Stripe Webhook + Pro-Unlock Flow** — Webhook flips DB plan on payment, simulate route honors plan, Customer Portal for self-serve management (complete + founder E2E verified 2026-07-01, all 6 PAY criteria)
- [x] **Phase 3: Polish + New Features** — FAQ, testimonials, stronger example prompts, Creator-tier 9:16 story-card export (complete 2026-07-01; 5/5 verified, CR-01 + WR-01 fixed, PNG legibility = founder manual check)
- [ ] **Phase 4: Live Deploy** — Test-mode-first public launch on what-if.tech: real OpenAI + EU Supabase (demo off), Stripe in TEST mode, legal pages, founder E2E smoke with test cards (live keys + real payment deferred post-Gewerbe)

## Phase Details

### Phase 1: Rate-Limiting + User-System
**Goal**: Anonymous and authenticated users can use WhatIf within fair limits, and the free tier is defensible against abuse.
**Depends on**: Nothing (first phase of v1; builds directly on the v0 MVP)
**Requirements**: AUTH-01, AUTH-02, AUTH-03, AUTH-04, AUTH-05, USAGE-01, USAGE-02, USAGE-03, USAGE-04, ABUSE-01, ABUSE-02, ABUSE-03
**Success Criteria** (what must be TRUE):
  1. A new visitor can sign up with email + password, confirm via emailed link, log in, and log out — and the session survives a browser refresh.
  2. A logged-out visitor can run exactly one simulation per device per 24h; the second attempt shows the soft paywall pointing at `/#pricing`.
  3. A logged-in free user can run exactly one simulation per 24h; the counter is stored server-side in Supabase, not the client.
  4. `/api/simulate` rejects bursts above ~5/min per IP and rejects inputs outside the 8–1500 char window, and rejected attempts are written to a Supabase log row a human can inspect.
  5. A user who forgot their password can request a reset email and successfully change their password via the emailed link.
**Plans**: 5 plans — ✅ COMPLETE (verified 21/21, 2026-07-01)
  - [x] 01-01-supabase-upstash-infra-PLAN.md — Supabase + Upstash clients, DB schema, RLS, middleware
  - [x] 01-02-anon-identification-PLAN.md — Signed device cookie + IP-hash fallback
  - [x] 01-03-auth-routes-PLAN.md — Six auth route handlers (signup/login/logout/confirm/reset-request/reset-confirm)
  - [x] 01-04-gated-simulate-route-PLAN.md — Plan-aware /api/simulate with burst, quota, and abuse log
  - [x] 01-05-auth-ui-paywall-PLAN.md — Four auth pages + AuthNav + SimulateForm paywall surface
**UI hint**: yes
**Notes**: The MVP already shows a soft-paywall hint on `/result` and renders "Unlock Pro" buttons — this phase wires those to real auth state and a real DB counter, it does not build the UI shell from scratch.

### Phase 2: Stripe Webhook + Pro-Unlock Flow
**Goal**: A user who pays via Stripe becomes Pro or Creator in our DB within seconds, the simulate endpoint honors that, and the user can self-manage their subscription.
**Depends on**: Phase 1 (needs the `users` table, auth session, and plan-aware `/api/simulate` to gate against)
**Requirements**: PAY-01, PAY-02, PAY-03, PAY-04, PAY-05, PAY-06
**Success Criteria** (what must be TRUE):
  1. A logged-in user clicking "Unlock Pro" lands in Stripe Checkout with their account email pre-filled and the correct €5/mo (Pro) or €9/mo (Creator) price selected.
  2. On a successful test-mode payment, the Stripe webhook verifies the signature, processes `checkout.session.completed`, and within seconds the user's row shows `plan = 'pro'` or `plan = 'creator'`.
  3. A Pro or Creator user calling `/api/simulate` bypasses the free-tier daily counter (still subject to the per-IP burst limit from Phase 1).
  4. When a subscription is canceled or fails, `customer.subscription.updated` / `customer.subscription.deleted` downgrades the user back to `plan = 'free'` at period end.
  5. A subscribed user can open the Stripe Customer Portal from their account to update payment method or cancel, without leaving the WhatIf brand context.
**Plans**: 4 plans — ✅ COMPLETE (founder E2E verified 2026-07-01, all 6 PAY criteria; + gap-closure 02-05 plan-aware UI)
  - [x] 02-01-PLAN.md — Migration 0003 + lib/stripe.ts core (pinned apiVersion, pure reducer, portal helper) + checkout wiring (PAY-01)
  - [x] 02-02-PLAN.md — /api/stripe/webhook: signature verify + idempotent plan flip on 3 events (PAY-02/03/05); confirms PAY-04
  - [x] 02-03-PLAN.md — /api/stripe/portal + /account page + AuthNav link (PAY-06)
  - [x] 02-04-PLAN.md — vitest setup + pure reducer unit tests (PAY-03/05)
**UI hint**: yes

### Phase 3: Polish + New Features
**Goal**: Landing page converts harder, example prompts feel TikTok-native, and Creator subscribers get a real differentiator (shareable 9:16 story card).
**Depends on**: Phase 2 (EXPORT-03 needs the `plan` field to gate Creator-only access)
**Requirements**: CONTENT-01, CONTENT-02, CONTENT-03, CONTENT-04, EXPORT-01, EXPORT-02, EXPORT-03
**Success Criteria** (what must be TRUE):
  1. The landing page has a visible FAQ that addresses data privacy, accuracy disclaimer, refund policy, and GDPR contact in plain language.
  2. The landing page shows 3–5 testimonial/social-proof cards plus a counter that animates on scroll — readable in a TikTok screen recording.
  3. `/decision` presents ~8 visceral, clip-ready example prompts (replacing the placeholder set from v0) and the "Share this simulation" affordance on `/result` upsells free users to Creator.
  4. A Creator-tier user on `/result` can click "Download story card" and receive a 9:16 PNG branded with the WhatIf logo and their original question, readable at TikTok overlay scale.
  5. The export endpoint returns HTTP 402 with an upsell payload for free and Pro users (not silent failure).
**Plans**: 2 plans (2 waves collapse to 1 — disjoint file ownership, fully parallel)
  - [x] 03-01-PLAN.md — Creator 9:16 story-card export: next/og nodejs route + creator-gate/402/demo-allow + bundled fonts + StoryCard + ShareCard on /result (CONTENT-04, EXPORT-01/02/03)
  - [x] 03-02-PLAN.md — Landing conversion: FAQ accordion + testimonials/scroll counter + FAQ nav link + 8 rewritten example prompts (CONTENT-01/02/03)
**UI hint**: yes

### Phase 4: Live Deploy
**Goal**: WhatIf is publicly live on what-if.tech running real OpenAI + real EU Supabase (demo off) with Stripe in TEST mode, linked German legal pages, and the founder having completed a full end-to-end smoke of the funnel with Stripe test cards. (Re-scope per 04-CONTEXT.md: live Stripe keys + a real paid simulation are deliberately deferred to a post-Gewerbeanmeldung founder step and are OUT OF SCOPE this phase.)
**Depends on**: Phase 1, Phase 2, Phase 3 (cannot ship publicly without auth, billing, and the conversion surfaces)
**Requirements**: DEPLOY-01, DEPLOY-02, DEPLOY-03, DEPLOY-04
**Success Criteria** (what must be TRUE, as re-scoped to test-mode):
  1. The Vercel production project has real OpenAI + EU-region Supabase credentials configured (demo-mode OFF for both) and Stripe TEST keys (test mode, not the demo fallback). [DEPLOY-01, DEPLOY-03]
  2. The Stripe TEST-mode webhook URL is registered against the production webhook secret at https://what-if.tech/api/stripe/webhook, and a test event is observed flipping a user to Pro/Creator in the production DB. [DEPLOY-02, test-mode]
  3. The app is reachable at https://what-if.tech with HTTPS, email-confirmation links route to /auth/confirm correctly, and /impressum + /datenschutz are linked from the Footer.
  4. The founder completes the full funnel on the live domain — sign up → confirm email → simulate (real OpenAI <8s) → hit paywall (test-mode notice) → Stripe test-card pay → plan flips via webhook → Creator export → portal cancel. [DEPLOY-04, test-mode]
**Plans**: 3 plans (3 waves — code, then founder dashboard config, then founder E2E smoke)
  - [ ] 04-01-PLAN.md — Legal pages (/impressum + /datenschutz, German) + Footer link wiring + test-mode notice on both paywall surfaces + .env.example comment (DEPLOY-04 support)
  - [ ] 04-02-PLAN.md — Founder dashboard config: Vercel env matrix (real OpenAI + EU Supabase + Stripe test keys + NEXT_PUBLIC_URL) + Supabase Auth Site URL/redirect + Stripe test webhook registration (DEPLOY-01/02/03)
  - [ ] 04-03-PLAN.md — Founder live-URL E2E smoke with Stripe test cards: signup→confirm→simulate→paywall→test-pay→plan flip→Creator export→portal cancel (DEPLOY-02/04)
**UI hint**: no
**Notes**: Smallest phase by code volume (env vars, DNS, webhook registration, smoke test) — but treat as a real phase, not a one-liner. This is the launch gate; everything before it is preparation. Test-mode-first: proves the whole machine with test cards; the flip to live money is a later keys-and-URLs swap (deferred, tracked in 04-CONTEXT.md Deferred Ideas).

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Rate-Limiting + User-System | 5/5 | ✅ Complete (verified 21/21) | 2026-07-01 |
| 2. Stripe Webhook + Pro-Unlock Flow | 4/4 | ✅ Complete (E2E verified, 6/6 PAY) | 2026-07-01 |
| 3. Polish + New Features | 2/2 | ✅ Complete (5/5 verified; PNG legibility = founder manual check) | 2026-07-01 |
| 4. Live Deploy | 0/3 | Planned (test-mode-first) | — |

## Coverage Validation

All 29 v1 requirements from `REQUIREMENTS.md` are mapped to exactly one phase:

- Phase 1: 12 reqs (AUTH-01..05, USAGE-01..04, ABUSE-01..03)
- Phase 2: 6 reqs (PAY-01..06)
- Phase 3: 7 reqs (CONTENT-01..04, EXPORT-01..03)
- Phase 4: 4 reqs (DEPLOY-01..04)
- **Total: 29 / 29 ✓**

No orphans. No duplicates. Order matches founder-locked phase sequence in PROJECT.md.

---
*Roadmap created: 2026-06-30*
*Last updated: 2026-07-02 after Phase 4 planning (test-mode-first re-scope)*
