# Phase 4: Live Deploy - Context

**Gathered:** 2026-07-01
**Status:** Ready for planning

<domain>
## Phase Boundary

Get WhatIf **publicly deployed and production-configured** on Vercel: real OpenAI + real EU Supabase, the full signup → paywall → simulate → account flow working end-to-end on a public URL — **with Stripe running in TEST mode** (test keys/products, test-card checkout, test webhook secret).

**Re-scope (founder decision — overrides the original ROADMAP success criteria):** WhatIf is currently a hobby/side project with no registered Gewerbe. Accepting real money requires a Gewerbeanmeldung, so **live Stripe keys, live products, and the real paid simulation are deliberately excluded from this phase** and deferred to an explicit final founder step after the business is registered. This phase proves the entire machine works with test cards; flipping to live money later is a keys-and-URLs swap, not a rebuild.

**In scope:**
- Deploy to Vercel on a `*.vercel.app` subdomain (public, shareable today).
- Wire production env: real `OPENAI_API_KEY`, real EU Supabase (existing project), Stripe **test** keys + test webhook secret.
- Ensure demo-mode is OFF for OpenAI + Supabase in production (real simulations, real auth), while Stripe runs in test mode (test keys — NOT the demo fallback).
- Register the production Stripe **test-mode** webhook endpoint (Vercel URL) so plan flips work end-to-end with test events.
- Point Supabase Auth Site URL / redirect URLs + Resend/SMTP sender at the Vercel URL so email auth works in prod.
- Add `/impressum` + `/datenschutz` pages and wire the Footer's currently-dead `#` links to them.
- Add a discreet "test mode" notice inside the checkout/payment flow only.
- Founder verification: end-to-end flow on the live URL using Stripe **test cards** (signup → confirm email → simulate → hit paywall → test-pay → plan flips via webhook → Creator export → manage/cancel in portal).

**Out of scope (deferred to the post-Gewerbe "go-live-payments" step):**
- Live Stripe keys, live products/prices, live webhook endpoint.
- A real paid simulation with a real card (original DEPLOY-04).
- Full AGB + Widerrufsbelehrung (only required once real payments are taken).
- A custom registered domain (mapped later — DNS + Site-URL/redirect update only).

</domain>

<decisions>
## Implementation Decisions

### Domain / deploy target
- **D-01:** UPDATE (2026-07-01): the founder already registered a real domain **`what-if.tech`** and mapped it to Vercel — the site is live there. The `*.vercel.app`-first fallback is moot; production URL is `https://what-if.tech`. (Original decision was deploy-now-on-vercel.app; superseded by the real domain being ready.)
- **D-02:** All URL-dependent config already routes through the existing env var **`NEXT_PUBLIC_URL`** (used in lib/stripe.ts checkout success/cancel + portal return, and auth signup/reset email redirect base). Set `NEXT_PUBLIC_URL=https://what-if.tech` (NO trailing slash — code concatenates `${baseUrl}/path`). Cosmetic "whatif.app" text in the story card / footer copy is separate and can be updated to what-if.tech as a nicety (not functional).

### Supabase production
- **D-03:** Reuse the existing EU Supabase project `zdirwmqfoynxmfifzlvt` as production. Migrations 0001–0003 are already applied there. No separate prod project for a hobby-stage app.
- **D-04:** Before/at go-public, clean up dev test data (e.g. test user `8e36b3a9-8ad3-43f0-8df3-4aa481a3574a`) so prod starts clean. Non-blocking, founder-side.

### Stripe (TEST mode this phase)
- **D-05:** Ship with Stripe **test** keys (`sk_test_`/`pk_test_`) + test webhook secret (`whsec_`). Register the Vercel URL as a test-mode webhook endpoint in the Stripe dashboard (local dev used `stripe listen`). Test products/prices for Pro (€5) and Creator (€9).
- **D-06:** Stripe test mode must NOT trigger the app's demo fallback — demo fallback is only for *missing* keys. With test keys present, `/api/stripe`, the webhook, and the portal run the real (test) Stripe code paths.

### Environment / demo-mode matrix in production
- **D-07:** Production env intent: OpenAI = **live key** (demo OFF, real simulations); Supabase = **live EU** (demo OFF, real auth + plan reads); Stripe = **test keys** (real test flow, not demo). The per-service key-presence fallback stays as-is — this phase just supplies the right keys so only Stripe is in "test" (not demo).

### Legal pages (public DE site)
- **D-08:** Add real `/impressum` (§5 DDG) and `/datenschutz` (DSGVO) route pages now and replace the Footer's dead `href="#"` Privacy/Terms links with real links. Full AGB + Widerrufsbelehrung deferred to the live-payments step.
- **D-09:** Contact email for the whole site is **`business@what-if.tech`** (founder's real IONOS mailbox on the domain) — replaces the current placeholder `hello@whatif.app`. This is the Impressum contact, the Datenschutz controller-contact, the FAQ GDPR mailto, and the Footer Contact link. Existing references to swap: `components/Footer.tsx` (mailto), `components/Faq.tsx` (GDPR mailto + displayed text, 2 spots). Impressum page is scaffolded with clearly-marked placeholders for the legally-required personal details (name, address) the founder must fill in; contact prefilled to `business@what-if.tech`. Datenschutz written substantially complete describing the actual processors: Supabase (EU, auth+DB), Stripe (payments), OpenAI (decision text sent to model, not persisted to a profile), Resend/IONOS (auth emails), plus IP/user rate-limit + abuse logging — controller name/address as placeholders, contact = business@what-if.tech. Use existing globals.css tokens + section rhythm; keep copy English to match the rest of the UI (note: a DE Impressum/Datenschutz is conventionally in German — planner to confirm language, but user-facing product copy is English per CLAUDE.md).
- **D-11:** Cosmetic domain text `whatif.app` → `what-if.tech` (story-card footer `components/StoryCard.tsx`, and any other cosmetic copy). Functional URLs already flow through `NEXT_PUBLIC_URL` (D-02).

### Test-mode signalling
- **D-10:** Show a discreet notice ONLY inside the checkout/payment flow (e.g. near the Unlock buttons / on the paywall) — "Testphase · Zahlungen im Testmodus, keine echte Abbuchung" (final wording planner's discretion). No site-wide beta banner; landing/result/decision stay clean for the TikTok audience.

### Claude's Discretion
- Exact Impressum/Datenschutz copy structure and whether those two pages are DE or EN (lean: DE for legal correctness, but confirm — the rest of the product is EN).
- Precise placement + wording of the checkout test-mode notice.
- How the base-URL env var is named/threaded (`NEXT_PUBLIC_SITE_URL` vs reuse of an existing var).
- Whether to add a lightweight production readiness pass (OG/meta tags, `robots`, error pages, security headers) if it fits — nice-to-have, not required by DEPLOY-01..04.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase requirements & scope
- `.planning/ROADMAP.md` §"Phase 4: Live Deploy" — goal + original success criteria (note: DEPLOY-02/04 re-scoped to test-mode by this CONTEXT).
- `.planning/REQUIREMENTS.md` — DEPLOY-01 (live OpenAI, demo off in prod), DEPLOY-02 (Stripe keys + webhook registered — TEST this phase), DEPLOY-03 (EU Supabase + schema + env), DEPLOY-04 (deployed on a domain + email auth + paid simulation — paid part deferred).
- `.planning/PROJECT.md` — vision, key decisions (Vercel, EU Supabase, demo-mode retained), Out of Scope.
- `.planning/STATE.md` — founder prerequisites already noted (register domain later; prod Stripe live keys/webhook deferred; test setup done).
- `CLAUDE.md` — stack (Next.js 16, Vercel target, Supabase, Stripe Checkout + webhook), conventions, demo-mode intent.

### Code that this phase configures/extends
- `.env.example` — env var contract to mirror for the Vercel project.
- `lib/openai.ts` — `isLive`/demo fallback keyed on `OPENAI_API_KEY`.
- `lib/stripe.ts` — Stripe client + plan config + demo fallback (keyed on missing key).
- `lib/supabase/server.ts`, `lib/supabase/admin.ts` — Supabase clients; admin needs `SUPABASE_SERVICE_ROLE_KEY`.
- `app/api/stripe/route.ts`, `app/api/stripe/webhook/route.ts`, `app/api/stripe/portal/route.ts` — checkout/webhook/portal (success/cancel + Site URLs).
- `app/auth/*` — email auth flow (`/auth/confirm` OTP token_hash; Site URL / redirect dependent).
- `components/Footer.tsx` — dead `#` Privacy/Terms links to rewire to `/impressum` + `/datenschutz`.

No external ADRs/specs — requirements fully captured in decisions above.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- Per-service demo fallback (`lib/openai.ts`, `lib/stripe.ts`, supabase admin null-guard): supplying the right keys in Vercel is all that's needed to turn demo OFF for OpenAI/Supabase while Stripe runs test keys.
- `.env.example` already enumerates the env contract — the Vercel env setup mirrors it.
- Existing rate limits (5/min per-IP burst on Postgres + free-tier daily counter) already guard public OpenAI cost/abuse — no new guardrail required for going public.
- Section wrapper + token vocabulary in `app/page.tsx` / globals.css can style the new legal pages consistently.

### Established Patterns
- App Router route pages under `app/<name>/page.tsx`; server components by default.
- URL/redirect config already flows through env for auth — extend the same discipline to a single base-URL var so the later domain swap is trivial.

### Integration Points
- Supabase Auth dashboard (Site URL + redirect allowlist) must include the Vercel URL for email confirmation to land correctly (`/auth/confirm`).
- Stripe test-mode dashboard: register the Vercel webhook endpoint, save Customer Portal settings (already done in test), Pro/Creator test prices.
- Resend/SMTP sender + links must resolve to the Vercel URL.

</code_context>

<specifics>
## Specific Ideas

- "Deploy-ready with payments in test mode; live keys as the explicit last step after Gewerbeanmeldung" — the organizing principle of the whole phase.
- Test-mode notice wording direction (German): "Testphase · Zahlungen im Testmodus, keine echte Abbuchung."
- Founder verification is done with Stripe **test cards** on the live Vercel URL — not a real card.

</specifics>

<deferred>
## Deferred Ideas

- **Go-live-payments step (post-Gewerbe):** swap Stripe test→live keys, create live products/prices, register the live webhook endpoint, run one real paid simulation. This is the original DEPLOY-02 (live half) + DEPLOY-04 (paid simulation).
- **Custom domain:** ~~register the WhatIf product domain, map DNS to Vercel~~ — DONE: `what-if.tech` is registered and live on Vercel. Remaining URL wiring (Supabase Site URL, Stripe webhook, `NEXT_PUBLIC_URL`) is part of this phase's env setup, not deferred.
- **Full AGB + Widerrufsbelehrung:** required once real payments are accepted.
- **Nebentätigkeit check:** confirm the employment contract (co-orga) allows the side business before registering the Nebengewerbe. Founder-side, non-code.

None of the above are new product capabilities — they are the intentionally-deferred "flip to real money + real domain" tail of this same phase.

</deferred>

---

*Phase: 4-live-deploy*
*Context gathered: 2026-07-01*
