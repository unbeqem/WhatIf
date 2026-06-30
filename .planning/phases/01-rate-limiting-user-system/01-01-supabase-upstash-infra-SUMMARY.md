---
phase: 01-rate-limiting-user-system
plan: 01
subsystem: infra/data-layer
tags:
  - supabase
  - upstash
  - rls
  - middleware
  - demo-mode
requirements:
  - AUTH-03
  - ABUSE-03
dependency_graph:
  requires: []
  provides:
    - lib/supabase/client.ts (createSupabaseBrowserClient)
    - lib/supabase/server.ts (createSupabaseServerClient)
    - lib/supabase/admin.ts (supabaseAdmin, isSupabaseAdminConfigured)
    - lib/upstash.ts (ratelimit, isRateLimitConfigured)
    - lib/db.types.ts (Database, PlanTier)
    - middleware.ts (SSR session refresh)
    - supabase/migrations/0001_phase1_init.sql (profiles, simulation_usage, RLS, on_auth_user_created trigger)
  affects:
    - .env.example (six new env vars added)
    - package.json (four new runtime deps)
tech-stack:
  added:
    - "@supabase/ssr 0.12 (App Router cookie helpers)"
    - "@supabase/supabase-js 2.110 (peer for admin client)"
    - "@upstash/ratelimit 2.0 (sliding-window limiter)"
    - "@upstash/redis 1.38 (REST client; serverless-safe)"
  patterns:
    - "Demo-mode pattern mirrored from lib/openai.ts and lib/stripe.ts (`const x = env ? new X() : null; export const isXLive = Boolean(x)`)"
    - "App Router cookie API via `next/headers` `cookies()` with `await` (Next 15+)"
    - "`import \"server-only\"` on admin + upstash to fail the build if leaked into a client bundle"
key-files:
  created:
    - lib/supabase/client.ts
    - lib/supabase/server.ts
    - lib/supabase/admin.ts
    - lib/upstash.ts
    - lib/db.types.ts
    - middleware.ts
    - supabase/migrations/0001_phase1_init.sql
  modified:
    - .env.example
    - package.json
    - package-lock.json
decisions:
  - "Use @supabase/ssr (not the deprecated @supabase/auth-helpers-nextjs) — canonical App Router package."
  - "Upstash REST (not @upstash/redis HTTP) — serverless-safe; no shared in-memory Map across Vercel invocations."
  - "Service-role admin client is the SOLE mutator of profiles + simulation_usage; RLS has no INSERT/UPDATE policies for anon or authenticated."
  - "Store SHA-256 of IP, never plaintext (GDPR) — column `simulation_usage.ip_hash`."
  - "Burst limit = 5 req/min sliding window per identifier (ABUSE-01)."
metrics:
  completed: "2026-07-01"
  duration: "~12 minutes"
  tasks: 3
  files_created: 7
  files_modified: 3
---

# Phase 1 Plan 1: Supabase + Upstash Infra Summary

Provisioned the data and infrastructure layer for Phase 1: three Supabase clients (browser, server, admin), an Upstash rate-limit client, the Phase 1 database schema (profiles + simulation_usage with RLS), session-refresh middleware, and the env contract. Demo-mode preserved end-to-end — every new module is tolerant of missing env vars.

## One-liner

Supabase (SSR + admin) + Upstash sliding-window rate-limiter wired with demo-mode fallback and a typed Database schema; downstream plans (03 auth routes, 04 gated simulate, 05 UI) only consume, never re-engineer.

## Files Created

| File | Purpose |
|------|---------|
| `lib/supabase/client.ts` | `createSupabaseBrowserClient()` for client components + `isSupabaseConfigured` boolean. |
| `lib/supabase/server.ts` | `createSupabaseServerClient()` for server components / route handlers / server actions. Uses `next/headers` `cookies()` (Next 15+ await API). |
| `lib/supabase/admin.ts` | `supabaseAdmin` (service-role; `null` when key missing) + `isSupabaseAdminConfigured`. `import "server-only"` so leakage into a client bundle fails the Next build. |
| `lib/upstash.ts` | `ratelimit` (`null` when env missing) + `isRateLimitConfigured`. 5 req/min sliding window, prefix `whatif:simulate`. `import "server-only"`. |
| `lib/db.types.ts` | `Database` + `PlanTier` types mirroring the migration. Consumed by all three Supabase clients via generics. |
| `middleware.ts` | Session refresh on every navigation (`auth.getUser()`). Short-circuits in demo mode when `NEXT_PUBLIC_SUPABASE_URL` is empty. Matcher skips Next internals + image assets. |
| `supabase/migrations/0001_phase1_init.sql` | `profiles` (1:1 with `auth.users`, plan enum, stripe_customer_id), `simulation_usage` (user_id OR anon_id, ip_hash, blocked_reason), RLS on both, three covering indexes, on-signup trigger. |

## Files Modified

- `.env.example` — six new keys appended (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, `ANON_COOKIE_SECRET`). Existing three keys (`OPENAI_API_KEY`, `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_URL`) preserved verbatim.
- `package.json` + `package-lock.json` — four new runtime deps installed via `npm install`.

## Env Contract (for downstream plans)

| Env var | Required for | Demo-mode fallback |
|---------|--------------|---------------------|
| `NEXT_PUBLIC_SUPABASE_URL` | All auth + DB reads | clients return non-functional handles; middleware short-circuits; admin = `null` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Browser + SSR clients | same as above |
| `SUPABASE_SERVICE_ROLE_KEY` | `supabaseAdmin` (writes to profiles + abuse logs) | `supabaseAdmin` resolves to `null`; downstream code MUST null-check |
| `UPSTASH_REDIS_REST_URL` | Rate-limiter | `ratelimit` resolves to `null`; `isRateLimitConfigured` is `false` |
| `UPSTASH_REDIS_REST_TOKEN` | Rate-limiter | same as above |
| `ANON_COOKIE_SECRET` | Plan 02 (`lib/anon.ts`) cookie signing | (Plan 02 owns this fallback) |

## Demo-mode Behaviour

Verified by importing each module with all six env vars unset:

- `lib/supabase/server.ts` — `createSupabaseServerClient()` returns a client built against empty URL/key; it will fail at call time (not import time), which matches the demo philosophy.
- `lib/supabase/admin.ts` — `supabaseAdmin` is `null`. Downstream calls MUST check (e.g. `if (!supabaseAdmin) return demoFallback()`).
- `lib/upstash.ts` — `ratelimit` is `null`. `isRateLimitConfigured` is `false`. Plan 04's simulate route should treat missing limiter as "allow everything" (demo mode).
- `middleware.ts` — first line `if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return NextResponse.next()` short-circuits before any Supabase code runs. App boots in demo mode.

## Where Things Live (for Plans 03, 04, 05)

- **Auth (Plan 03):** Use `createSupabaseServerClient()` in route handlers for `/api/auth/*`. The `on_auth_user_created` trigger automatically creates a `profiles` row on signup — no extra insert needed.
- **Gated simulate (Plan 04):** Read user via `createSupabaseServerClient().auth.getUser()`; gate by `profiles.plan` (admin client read or RLS-permitted SELECT). Write abuse rows via `supabaseAdmin.from('simulation_usage').insert(...)`. Compute `ip_hash = sha256(ip)` — never store plaintext.
- **UI (Plan 05):** Use `createSupabaseBrowserClient()` in `"use client"` components for sign-in/out flows. Read `isSupabaseConfigured` to decide whether to show auth UI vs. demo banner.

## Database Schema Summary

`public.profiles`
- `id uuid PK -> auth.users(id) ON DELETE CASCADE`
- `plan plan_tier NOT NULL DEFAULT 'free'` (enum: `free | pro | creator`)
- `stripe_customer_id text` (nullable; Phase 2 populates)
- `created_at`, `updated_at` timestamptz

`public.simulation_usage`
- `id bigserial PK`
- `user_id uuid` OR `anon_id text` (CHECK `actor_present`: at least one must be non-null)
- `ip_hash text NOT NULL` (SHA-256 hex; computed in Plan 04)
- `input_length int NOT NULL`
- `blocked_reason text` (nullable; populated when limiter or validator rejects)
- `created_at timestamptz DEFAULT now()`
- Indexes: `(user_id, created_at desc) WHERE user_id IS NOT NULL`, `(anon_id, created_at desc) WHERE anon_id IS NOT NULL`, `(created_at desc) WHERE blocked_reason IS NOT NULL`

`Trigger on_auth_user_created`
- Fires `AFTER INSERT ON auth.users FOR EACH ROW`, inserts `(id)` into `profiles` with `ON CONFLICT DO NOTHING`. Idempotent for retried signups.

`RLS`
- Both tables have RLS enabled.
- `profiles_select_own`: `auth.uid() = id` (read your own row).
- `usage_select_own`: `auth.uid() = user_id` (read your own usage rows).
- **No INSERT or UPDATE policies for anon / authenticated** — all writes must go through `supabaseAdmin` (service role). This satisfies T-01-03 and T-01-04 in the threat register.

## Deviations from Plan

None — plan executed exactly as written. All three tasks' actions applied verbatim; all acceptance criteria verified by grep + `tsc --noEmit lib/db.types.ts`.

## Deferred Issues (out of scope)

1. **Pre-existing TS error in `app/page.tsx:271`** — `Type '"pro" | "creator" | undefined' is not assignable to type 'Plan'`. Verified pre-existing by stashing all Plan 01 changes and re-running `npx tsc --noEmit`; same error appeared. Logged in `.planning/phases/01-rate-limiting-user-system/deferred-items.md`. Will be fixed by Plan 05 (auth UI / paywall) which owns the pricing tier types.
2. **`middleware.ts` -> `proxy.ts` deprecation warning** — Next 16.2.9 prefers the `proxy` file convention. Plan explicitly specified `middleware.ts`; rename is a future Next-16 polish item. Documented in deferred-items.md.

Consequence: `next build` fails on the pre-existing `app/page.tsx` TS error (verified pre-existing). Plan 01's own modules compile cleanly — `next build` output shows "Compiled successfully in 1977ms" before the project-wide type check stage hits the unrelated error. No regression introduced by Plan 01.

## Threat Surface Scan

No new surface beyond what the threat register already covers (T-01-01 through T-01-07). All mitigations applied:

- T-01-01: `lib/supabase/admin.ts` imports `"server-only"`.
- T-01-02: `lib/upstash.ts` imports `"server-only"`.
- T-01-03: RLS enabled + no INSERT/UPDATE policies for anon/authenticated.
- T-01-04: No UPDATE policy on `profiles`; plan-tier changes require service role.
- T-01-05: `simulation_usage.ip_hash` is `text NOT NULL` (SHA-256 — Plan 04 computes).
- T-01-06: Limiter handle exists; enforcement is Plan 04's job.
- T-01-07: `blocked_reason` column + dedicated index supports ABUSE-03 audit queries.

## Self-Check: PASSED

- All seven created files exist on disk (verified by Write tool success + `git ls-files --others`).
- All three modified files reflect intended changes (verified by Grep for each new env key and dep).
- All Task 1-3 acceptance criteria grep counts match the plan.
- `npx tsc --noEmit lib/db.types.ts` exits 0.
- Project-wide `npx tsc --noEmit` reports only the pre-existing `app/page.tsx:271` error (verified by stash-baseline test); zero errors introduced by Plan 01 files.
