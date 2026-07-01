# Requirements: WhatIf

**Defined:** 2026-06-30
**Core Value:** A user must be able to type a decision, get a 3-future simulation, hit a soft paywall, and pay — without friction.

## v1 Requirements

Production-launch requirements. Each maps to one phase in `ROADMAP.md`.

### Authentication (AUTH)

- [ ] **AUTH-01**: User can sign up with email and password via Supabase Auth
- [ ] **AUTH-02**: User receives email confirmation link before account becomes active
- [ ] **AUTH-03**: User can log in and log out; session persists across browser refreshes
- [ ] **AUTH-04**: User can reset password via emailed magic link
- [ ] **AUTH-05**: Anonymous visitors can still run one simulation without an account (anon free tier)

### Usage Limits (USAGE)

- [ ] **USAGE-01**: Anonymous users are capped at 1 simulation per device per 24h (cookie + IP backstop)
- [ ] **USAGE-02**: Free-tier authenticated users are capped at 1 simulation per 24h, counter persisted in DB
- [ ] **USAGE-03**: Pro and Creator users have no per-day limit (subject to abuse rate-limit below)
- [ ] **USAGE-04**: When a user hits the limit, the UI shows a soft paywall with `/#pricing` deep link

### Abuse Protection (ABUSE)

- [ ] **ABUSE-01**: `/api/simulate` rate-limited to a sane per-IP burst (e.g. 5/min) regardless of plan
- [ ] **ABUSE-02**: `/api/simulate` rejects inputs over 1500 chars or under 8 chars (already in MVP — harden it)
- [ ] **ABUSE-03**: Logged abuse attempts (rate-limit hits) are visible in Supabase for review

### Payments (PAY)

- [x] **PAY-01**: Stripe checkout opens for Pro (€5/mo) and Creator (€9/mo) with logged-in user's email pre-filled
- [ ] **PAY-02**: Stripe webhook (`/api/stripe/webhook`) verifies signature and processes `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`
- [x] **PAY-03**: A user with an active Pro/Creator subscription has `plan = 'pro' | 'creator'` in DB; otherwise `'free'`
- [ ] **PAY-04**: `/api/simulate` reads the plan and bypasses the free-tier limit for Pro/Creator
- [x] **PAY-05**: When a subscription is canceled or fails, the user is downgraded to Free at period end (Stripe handles the date)
- [ ] **PAY-06**: User can open Stripe Customer Portal from their account to manage / cancel subscription

### Content (CONTENT)

- [ ] **CONTENT-01**: Landing page has an FAQ section (data privacy, accuracy disclaimer, refund policy, GDPR contact)
- [ ] **CONTENT-02**: Landing page has a testimonials/social-proof block (3–5 cards, can be seeded for launch)
- [ ] **CONTENT-03**: `/decision` example prompts are rewritten to be more visceral and TikTok-clip-ready (~8 examples)
- [ ] **CONTENT-04**: Result page has a clearly marked "Share this simulation" affordance (links to Creator upgrade for free users)

### Creator Export (EXPORT)

- [ ] **EXPORT-01**: Creator-tier user can download a 9:16 story card PNG of their simulation (canvas or @vercel/og generated)
- [ ] **EXPORT-02**: Story card is shareable — readable at TikTok overlay scale, branded with WhatIf logo and the user's question
- [ ] **EXPORT-03**: Endpoint is gated to plan='creator' and returns 402 with upsell payload for lower plans

### Deployment (DEPLOY)

- [ ] **DEPLOY-01**: Live OpenAI key configured in Vercel project env; demo-mode disabled in production
- [ ] **DEPLOY-02**: Live Stripe key + webhook secret configured; webhook URL registered with Stripe
- [ ] **DEPLOY-03**: Supabase project provisioned (EU region) with auth + a `users` / `subscriptions` schema, env wired
- [ ] **DEPLOY-04**: App deployed to Vercel on a real domain with working email auth flow and a successful end-to-end paid simulation by the founder

## v2 Requirements

Acknowledged, deferred. Not in this roadmap.

### History & Dashboard

- **HIST-01**: Authenticated user can view their last N simulations
- **HIST-02**: User can compare two past simulations side-by-side
- **HIST-03**: User can delete saved simulations

### OAuth & Social Login

- **OAUTH-01**: Sign in with Google
- **OAUTH-02**: Sign in with Apple

### Localization

- **L10N-01**: German UI variant of landing page
- **L10N-02**: Locale-aware example prompts

### Native Mobile

- **MOBILE-01**: iOS app (or PWA install prompt with notifications)

## Out of Scope (v1)

| Feature | Reason |
|---------|--------|
| Native mobile app | Web + PWA is enough for TikTok funnel; native is post-PMF |
| OAuth login | Email/password is faster to ship and lower compliance surface |
| Decision history UI | Pro upsell hints at it; full UI is a v2 differentiator, not a launch blocker |
| Multilingual UI | English-only for v1; DE landing is a marketing experiment, not a feature |
| Custom AI fine-tuning | gpt-4o-mini is sufficient at this scale |
| Email delivery of results | Soft paywall expects in-session conversion |
| Team accounts | Single-user only; Creator export covers external sharing |
| Real-time collaboration | Out of scope for this product entirely |
| Webhook for `customer.subscription.trial_will_end` (etc.) | Only essential webhook events for v1 — others added when needed |

## Traceability

Mapped to phases during roadmap creation. Updated by `gsd-roadmapper`.

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-01 | Phase 1 | Pending |
| AUTH-02 | Phase 1 | Pending |
| AUTH-03 | Phase 1 | Pending |
| AUTH-04 | Phase 1 | Pending |
| AUTH-05 | Phase 1 | Pending |
| USAGE-01 | Phase 1 | Pending |
| USAGE-02 | Phase 1 | Pending |
| USAGE-03 | Phase 1 | Pending |
| USAGE-04 | Phase 1 | Pending |
| ABUSE-01 | Phase 1 | Pending |
| ABUSE-02 | Phase 1 | Pending |
| ABUSE-03 | Phase 1 | Pending |
| PAY-01 | Phase 2 | Complete |
| PAY-02 | Phase 2 | Pending |
| PAY-03 | Phase 2 | Complete |
| PAY-04 | Phase 2 | Pending |
| PAY-05 | Phase 2 | Complete |
| PAY-06 | Phase 2 | Pending |
| CONTENT-01 | Phase 3 | Pending |
| CONTENT-02 | Phase 3 | Pending |
| CONTENT-03 | Phase 3 | Pending |
| CONTENT-04 | Phase 3 | Pending |
| EXPORT-01 | Phase 3 | Pending |
| EXPORT-02 | Phase 3 | Pending |
| EXPORT-03 | Phase 3 | Pending |
| DEPLOY-01 | Phase 4 | Pending |
| DEPLOY-02 | Phase 4 | Pending |
| DEPLOY-03 | Phase 4 | Pending |
| DEPLOY-04 | Phase 4 | Pending |

**Coverage:**
- v1 requirements: 29 total
- Mapped to phases: 29
- Unmapped: 0 ✓

---
*Requirements defined: 2026-06-30*
*Last updated: 2026-06-30 after initialization*
