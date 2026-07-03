[WhatIf]: # ()

# WhatIf

## What This Is

WhatIf is an AI decision-simulation SaaS. A user types a real decision they're carrying — "should I quit my job", "should I move countries" — and the model projects three realistic futures (best, likely, worst) with probabilities and a sober recommendation. Built to be TikTok-native: the result is shareable, the funnel is short, the paywall is soft.

Audience: people in their 20s–30s sitting on a hard life choice, primed for short-form content. Distribution channel #1 is TikTok; web app converts them into Free → Pro/Creator subscribers.

## Core Value

A user must be able to type a decision, get a sober three-future simulation in seconds, hit a soft paywall, and pay — without friction. If everything else fails, that loop must work.

## Requirements

### Validated

<!-- Shipped and confirmed via the v0 MVP that already runs locally. -->

- ✓ User can type a decision and receive a 3-scenario simulation — v0 (today)
- ✓ Landing → /decision → /result happy path with neon-glow UI — v0 (today)
- ✓ Stripe checkout API route with demo-mode fallback — v0 (today)
- ✓ OpenAI simulate API route with demo-mode fallback — v0 (today)
- ✓ Signup/login (Supabase Auth, email + password) — v1 Phase 1
- ✓ Free-tier daily counter (1/day, resets at user-local midnight) — v1 Phase 1
- ✓ Abuse protection (IP + user rate limits, request validation) — v1 Phase 1
- ✓ Stripe webhook flips a user to Pro/Creator on payment — v1 Phase 2
- ✓ Pro/Creator gating on `/api/simulate` + Creator-only features — v1 Phase 2
- ✓ Cancellation/lapse handling — Pro downgrade when subscription ends — v1 Phase 2
- ✓ FAQ section on landing (data, accuracy, refund, GDPR) — v1 Phase 3
- ✓ Social-proof block: testimonial cards + honest animated counter — v1 Phase 3
- ✓ Stronger, more visceral / TikTok-clip-ready example prompts — v1 Phase 3
- ✓ Creator-tier shareable 9:16 story-card export (PNG download) — v1 Phase 3
- ✓ Decision history persisted for Pro/Creator + `/history` page + nav link — v1 Phase 3 / post-launch
- ✓ Visible blurred locked-insight paywall on free results — post-Phase-3 iteration (2026-07-03)
- ✓ Annual billing + one-time €3 deep-dive unlock — post-Phase-3 iteration (2026-07-03)
- ✓ Free watermarked story cards (clean export stays Creator) — post-Phase-3 iteration (2026-07-03)
- ✓ Pro-gated refine & branch re-simulation — post-Phase-3 iteration (2026-07-03)
- ✓ Optional structured pre-simulation context (age/priority/risk) — post-Phase-3 iteration (2026-07-03)
- ✓ Pro-gated side-by-side two-path comparison — post-Phase-3 iteration (2026-07-03)
- ✓ 30-day follow-up email loop (code path; needs Resend key + cron on deploy) — post-Phase-3 iteration (2026-07-03)

### Active

<!-- Current milestone: v1 Production Launch — only Phase 4 (Live Deploy) remains. -->

- [ ] Production env config (OpenAI live key, Stripe live key, EU Supabase) — Phase 4
- [ ] Vercel deploy with custom domain + working email auth + Stripe webhook URL — Phase 4

### Out of Scope

<!-- Explicit boundaries for v1. -->

- Native mobile app — web-first, mobile via responsive PWA later
- OAuth login (Google/Apple) — email/password sufficient for v1, less compliance surface
- Team accounts / sharing inside the product — Creator export covers external sharing
- AI fine-tuning or custom models — gpt-4o-mini is enough for v1; revisit at scale
- Webhook for delivering results to email — soft paywall expects in-session conversion
- Multilingual UI — English only for v1; DE landing variant is a later experiment

## Context

- **MVP shipped same day** as this milestone was opened. The full demo flow already works; v1 is about hardening, billing, and going public.
- **Solo founder.** Tristan is building this alone. Every hour counts; favor boring proven tools over novel ones.
- **TikTok-first distribution.** The product needs to read well in a screen recording: bold typography, animated probability bars, share-friendly result page. UI work is marketing.
- **Soft paywall, not hard.** Free users get a real simulation; the upgrade prompt sells the "version we held back" — depth, history, exports.
- **Demo mode is intentional.** Routes still work without API keys (returns canned data) — this is how Tristan can record demo videos and how new contributors can run locally.
- **German founder, English product.** UI copy is English (larger market), but the founder thinks in German. Don't break that — keep founder-facing docs/answers in German where natural.

## Constraints

- **Tech stack**: Next.js 16 (App Router, Turbopack) + Tailwind v4 + OpenAI gpt-4o-mini + Stripe + Supabase — no rewrites.
- **Hosting**: Vercel free tier initially. Must not require always-on workers.
- **Cost**: Bootstrapped. Infra spend stays under €20/mo until ~100 paid users. AI cost per simulation is ~$0.0008, so abuse is the only realistic burn risk.
- **Compliance**: EU-based founder. GDPR-relevant. Minimize PII storage (email + Stripe customer ID only).
- **Timeline**: Production-ready as soon as possible to start the TikTok funnel. No artificial deadlines, but every week without launch is dead capital.
- **Performance**: Result returns in under 8s end-to-end (already met in demo mode; verify with live OpenAI).

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Supabase for auth + DB | Free tier, hosted Postgres, email auth out of the box, GDPR-friendly EU region available | — Pending |
| Stripe Checkout (not Elements) | Faster to integrate, PCI burden lives with Stripe, webhook is the only state we own | — Pending |
| gpt-4o-mini over gpt-4o | ~12× cheaper, quality is sufficient for 3-scenario projection, future upgrade path exists | — Pending |
| Email/password only (no OAuth) | Lower compliance surface for solo EU founder; OAuth is v2 | — Pending |
| sessionStorage handoff `/decision` → `/result` | No DB needed pre-auth; result fades on tab close (intentional — drives "save your history" upgrade) | ✓ Good |
| Demo-mode fallback retained in production | Lets Tristan record marketing footage and lets contributors run locally without keys | — Pending |
| Phase order set by founder | (1) Auth/limits → (2) Stripe webhook/Pro → (3) Polish → (4) Live deploy. Founder explicitly chose this ordering. | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-07-03 — Phase 3 complete + 8 profitability/retention features shipped (paywall, annual/one-time pricing, watermarked sharing, refine, context, comparison, history discoverability, follow-up loop). Only Phase 4 (Live Deploy) remains.*
