# Phase 4: Live Deploy - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-07-01
**Phase:** 4-live-deploy
**Areas discussed:** Domain, Supabase prod, Legal pages, Test-mode signalling

**Framing:** Founder is running WhatIf as a hobby/side project with no Gewerbe yet. Real payments require a Gewerbeanmeldung, so this phase re-scopes DEPLOY-02/04 to Stripe TEST mode; live keys + real paid simulation are deferred to a post-registration step.

---

## Domain

| Option | Description | Selected |
|--------|-------------|----------|
| Jetzt auf *.vercel.app | Public on a free Vercel subdomain now; map real domain later (DNS + Site-URL update, no rebuild) | ✓ |
| Auf echte Domain warten | Register domain first, then deploy; cleaner URLs but blocks deployment | |

**User's choice:** Deploy now to `*.vercel.app`.
**Notes:** Keeps the product shareable today; real domain is a later env/DNS swap.

---

## Supabase prod

| Option | Description | Selected |
|--------|-------------|----------|
| Bestehendes EU-Projekt nutzen | Reuse existing EU project zdirwmqfoynxmfifzlvt as prod; migrations already applied; optionally clean test data | ✓ |
| Neues Prod-Projekt anlegen | Fresh EU prod instance; cleaner separation but re-apply migrations + reconfigure keys/SMTP | |

**User's choice:** Reuse the existing EU project as prod.
**Notes:** Simplest for hobby stage; clean up dev test user before going public.

---

## Legal pages

| Option | Description | Selected |
|--------|-------------|----------|
| Impressum + Datenschutz jetzt | Real /impressum + /datenschutz pages + Footer links now; AGB/Widerruf with live payments | ✓ |
| Platzhalter-Seiten | Pages + links with placeholder/TODO content to fill later | |
| Erstmal nichts | No legal pages; risky for a publicly shared DE site | |

**User's choice:** Impressum + Datenschutz now.
**Notes:** Footer Privacy/Terms are currently dead `#` links. Impressum needs real name/address (§5 DDG) → scaffold with placeholders; Datenschutz written substantially complete. Full AGB/Widerruf deferred to live payments.

---

## Test-mode signalling

| Option | Description | Selected |
|--------|-------------|----------|
| Dezenter Hinweis am Checkout | Small notice only in the payment flow ("Testphase · Zahlungen im Testmodus"); rest of site clean | ✓ |
| Gar kein Hinweis | Site looks fully live; risk someone tries a real card and it fails | |
| Seitenweites Beta-Banner | Persistent beta band on every page; honest but hurts conversion | |

**User's choice:** Discreet notice at checkout only.
**Notes:** Landing/result/decision stay clean for the TikTok audience.

## Claude's Discretion

- Language of the Impressum/Datenschutz pages (lean DE for legal correctness vs EN to match product copy).
- Exact wording/placement of the checkout test-mode notice.
- Base-URL env var naming/threading for the later domain swap.
- Optional production-readiness polish (OG/meta, robots, error pages, security headers).

## Deferred Ideas

- Go-live-payments step (post-Gewerbe): Stripe test→live keys, live products/prices, live webhook, one real paid simulation.
- Custom domain registration + DNS/Site-URL/redirect mapping.
- Full AGB + Widerrufsbelehrung (required once real payments taken).
- Nebentätigkeit check against the co-orga employment contract before registering the Nebengewerbe.
