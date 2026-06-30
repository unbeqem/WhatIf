---
phase: 01-rate-limiting-user-system
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - lib/supabase/client.ts
  - lib/supabase/server.ts
  - lib/supabase/admin.ts
  - lib/upstash.ts
  - lib/db.types.ts
  - supabase/migrations/0001_phase1_init.sql
  - .env.example
  - middleware.ts
  - package.json
autonomous: true
requirements:
  - AUTH-03
  - ABUSE-03
user_setup:
  - service: supabase
    why: "Auth provider and DB for users, profiles, and abuse log."
    env_vars:
      - name: NEXT_PUBLIC_SUPABASE_URL
        source: "Supabase Dashboard -> Project Settings -> API -> Project URL"
      - name: NEXT_PUBLIC_SUPABASE_ANON_KEY
        source: "Supabase Dashboard -> Project Settings -> API -> anon public key"
      - name: SUPABASE_SERVICE_ROLE_KEY
        source: "Supabase Dashboard -> Project Settings -> API -> service_role secret (DO NOT EXPOSE TO CLIENT)"
    dashboard_config:
      - task: "Create new EU-region Supabase project"
        location: "Supabase Dashboard -> New project (region: eu-central-1 or eu-west-2)"
      - task: "Run migration supabase/migrations/0001_phase1_init.sql in SQL editor"
        location: "Supabase Dashboard -> SQL editor -> paste file -> Run"
      - task: "Confirm Auth -> Email -> 'Confirm email' is enabled"
        location: "Supabase Dashboard -> Authentication -> Providers -> Email"
  - service: upstash
    why: "Per-IP burst rate limiter for /api/simulate (serverless-safe)."
    env_vars:
      - name: UPSTASH_REDIS_REST_URL
        source: "Upstash Console -> Redis -> Create DB -> REST URL"
      - name: UPSTASH_REDIS_REST_TOKEN
        source: "Upstash Console -> Redis -> Create DB -> REST Token"
    dashboard_config:
      - task: "Create Upstash Redis DB (free tier, EU region)"
        location: "console.upstash.com -> Create database"
  - service: anon-cookie
    why: "Sign anonymous device cookies; rotate without DB impact."
    env_vars:
      - name: ANON_COOKIE_SECRET
        source: "Generate locally: openssl rand -hex 32 (or any 64-char hex string)"

must_haves:
  truths:
    - "Server code can read the logged-in user via Supabase SSR cookies."
    - "Server code can write to profiles and simulation_usage using a service-role admin client."
    - "When Supabase or Upstash env vars are absent, the app still boots (demo mode philosophy preserved)."
    - "Database has profiles (1:1 with auth.users) and simulation_usage tables with RLS enabled."
    - "A signup trigger auto-creates a profiles row with plan='free' on every new auth.users insert."
  artifacts:
    - path: "lib/supabase/server.ts"
      provides: "createSupabaseServerClient() for App Router (cookies via next/headers)"
      contains: "createServerClient"
    - path: "lib/supabase/client.ts"
      provides: "createSupabaseBrowserClient() for client components"
      contains: "createBrowserClient"
    - path: "lib/supabase/admin.ts"
      provides: "supabaseAdmin (service-role key, server-only)"
      contains: "SUPABASE_SERVICE_ROLE_KEY"
    - path: "lib/upstash.ts"
      provides: "ratelimit instance and isRateLimitConfigured boolean"
      contains: "@upstash/ratelimit"
    - path: "lib/db.types.ts"
      provides: "Database type used by Supabase clients (typed profiles + simulation_usage rows)"
      contains: "export type Database"
    - path: "supabase/migrations/0001_phase1_init.sql"
      provides: "profiles, simulation_usage tables, RLS policies, on_auth_user_created trigger"
      contains: "create table public.profiles"
    - path: "middleware.ts"
      provides: "Session refresh middleware (Supabase SSR cookie rotation)"
      contains: "updateSession"
  key_links:
    - from: "lib/supabase/server.ts"
      to: "next/headers cookies"
      via: "cookies().getAll() / cookies().set() pattern for App Router"
      pattern: "next/headers"
    - from: "middleware.ts"
      to: "lib/supabase/server.ts session refresh"
      via: "updateSession on every non-static request"
      pattern: "matcher"
    - from: "supabase/migrations/0001_phase1_init.sql"
      to: "auth.users"
      via: "trigger on insert -> insert into profiles"
      pattern: "on_auth_user_created"
---

<objective>
Provision the data and infrastructure layer for Phase 1: Supabase clients (browser, server, admin), Upstash rate-limit client, the database schema (profiles + simulation_usage with RLS), session-refresh middleware, and the env contract. Everything else in this phase reads from what this plan creates.

Purpose: Every subsequent plan (auth routes, gated simulate, UI) needs a working Supabase server client, a working admin client to write to abuse logs / counters, a rate-limiter handle, and a DB schema that already enforces row-level security. Building those three things first means downstream tasks only wire — they never re-engineer.

Output: Working clients, a runnable migration file, env scaffolding, and a middleware that keeps the user logged in across requests. Demo-mode preserved: missing env -> safe fallback, never crash.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/STATE.md
@.planning/REQUIREMENTS.md
@package.json
@tsconfig.json
@.env.example
@CLAUDE.md

<interfaces>
<!-- @supabase/ssr 0.5+ App Router patterns the executor must use -->

Browser client (used in `"use client"` components):
```typescript
import { createBrowserClient } from "@supabase/ssr";
const supabase = createBrowserClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);
```

Server client (used in server components, route handlers, server actions):
```typescript
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createSupabaseServerClient() {
  const cookieStore = await cookies();
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from a Server Component — safe to ignore if middleware refreshes the session.
          }
        },
      },
    },
  );
}
```

Admin client (service role, NEVER imported into a client bundle):
```typescript
import { createClient } from "@supabase/supabase-js";
export const supabaseAdmin = process.env.SUPABASE_SERVICE_ROLE_KEY
  ? createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { persistSession: false, autoRefreshToken: false } },
    )
  : null;
```

Upstash limiter:
```typescript
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const haveEnv = Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
export const isRateLimitConfigured = haveEnv;
export const ratelimit = haveEnv
  ? new Ratelimit({
      redis: Redis.fromEnv(),
      limiter: Ratelimit.slidingWindow(5, "1 m"),
      prefix: "whatif:simulate",
      analytics: false,
    })
  : null;
```

Middleware session refresh (App Router pattern):
```typescript
// middleware.ts
import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function middleware(req: NextRequest) {
  let res = NextResponse.next({ request: req });
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return res; // demo mode: skip
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return req.cookies.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => req.cookies.set(name, value));
          res = NextResponse.next({ request: req });
          cookiesToSet.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
        },
      },
    },
  );
  await supabase.auth.getUser();
  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
```
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Install Supabase + Upstash dependencies and extend env scaffolding</name>
  <files>package.json, .env.example</files>
  <read_first>
    - package.json (current dependency versions; Next 16, React 19)
    - .env.example (existing OPENAI_API_KEY, STRIPE_SECRET_KEY, NEXT_PUBLIC_URL keys to preserve)
    - CLAUDE.md (demo-mode philosophy: missing env = canned fallback, never crash)
  </read_first>
  <action>
    Add the following dependencies (using npm install — preserves existing versions):

    Runtime deps:
    - `@supabase/ssr` (App Router cookie helpers; the canonical package — NOT the deprecated `@supabase/auth-helpers-nextjs`)
    - `@supabase/supabase-js` (peer of @supabase/ssr; required for the admin client)
    - `@upstash/ratelimit`
    - `@upstash/redis`

    Run: `npm install @supabase/ssr @supabase/supabase-js @upstash/ratelimit @upstash/redis`

    Then extend `.env.example` (append, do not remove existing lines) with EXACTLY these new keys and the demo-mode comment so a contributor cloning the repo immediately understands the fallback:

    ```
    # Supabase — leave empty to use the built-in demo fallback (no auth, no DB writes)
    NEXT_PUBLIC_SUPABASE_URL=
    NEXT_PUBLIC_SUPABASE_ANON_KEY=
    SUPABASE_SERVICE_ROLE_KEY=

    # Upstash Redis — leave empty to disable rate limiting (demo-mode allows everything)
    UPSTASH_REDIS_REST_URL=
    UPSTASH_REDIS_REST_TOKEN=

    # Signing secret for anonymous device cookies (generate: openssl rand -hex 32)
    ANON_COOKIE_SECRET=
    ```

    Rationale: `@supabase/ssr` is the supported package for Next.js App Router as of 2025+ (the older `@supabase/auth-helpers-nextjs` is deprecated). Upstash REST is required because Vercel serverless cannot share an in-memory Map between invocations.
  </action>
  <verify>
    <automated>node -e "const p=require('./package.json'); const need=['@supabase/ssr','@supabase/supabase-js','@upstash/ratelimit','@upstash/redis']; const missing=need.filter(d=>!p.dependencies[d]); if(missing.length){console.error('Missing:',missing); process.exit(1)} console.log('OK')"</automated>
  </verify>
  <acceptance_criteria>
    - `grep -E '"(@supabase/ssr|@supabase/supabase-js|@upstash/ratelimit|@upstash/redis)"' package.json` returns 4 matching lines.
    - `grep -c "@supabase/auth-helpers-nextjs" package.json` returns 0 (the deprecated package must NOT be installed).
    - `grep -E '^(NEXT_PUBLIC_SUPABASE_URL|NEXT_PUBLIC_SUPABASE_ANON_KEY|SUPABASE_SERVICE_ROLE_KEY|UPSTASH_REDIS_REST_URL|UPSTASH_REDIS_REST_TOKEN|ANON_COOKIE_SECRET)=' .env.example` returns 6 matching lines.
    - Existing keys (`OPENAI_API_KEY`, `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_URL`) still present in `.env.example`.
    - `npm install` exits 0; `node_modules/@supabase/ssr/package.json` exists.
  </acceptance_criteria>
  <done>Deps installed and visible in package.json + node_modules; env example has all 6 new keys plus the 3 pre-existing ones.</done>
</task>

<task type="auto" tdd="true">
  <name>Task 2: Write the Phase 1 migration (profiles + simulation_usage + RLS + trigger)</name>
  <files>supabase/migrations/0001_phase1_init.sql, lib/db.types.ts</files>
  <read_first>
    - supabase/migrations/0001_phase1_init.sql (target file — likely does not exist yet)
    - .planning/REQUIREMENTS.md (USAGE-01/02 = 24h counters; ABUSE-03 = log abuse rows)
    - .planning/PROJECT.md (GDPR: minimize PII — email + stripe id only, no IP plaintext)
  </read_first>
  <behavior>
    Migration MUST create — and only create — what is needed for Phase 1. No PAY tables (those belong to Phase 2). On-trigger row creation in profiles must NOT fail if a row already exists (idempotent in case of retried signups).

    Schema contract that downstream plans depend on:

    - Test 1: A row exists in `public.profiles` for every row in `auth.users` after signup (trigger covers this).
    - Test 2: `profiles.plan` is constrained to `'free' | 'pro' | 'creator'`.
    - Test 3: `simulation_usage` accepts either `user_id` (uuid) OR `anon_id` (text), never both NULL.
    - Test 4: `simulation_usage.created_at` defaults to `now()`.
    - Test 5: `simulation_usage.ip_hash` is text (sha256 hex, no plaintext IP), `blocked_reason` is nullable text.
    - Test 6: RLS enabled on both tables; authenticated user can SELECT their own profile and their own usage rows; INSERT / UPDATE blocked from anon/auth roles (writes happen via service role only).
  </behavior>
  <action>
    Create `supabase/migrations/0001_phase1_init.sql` with EXACTLY this content (verbatim — downstream queries depend on these column names):

    ```sql
    -- Phase 1: profiles + simulation_usage
    -- Run in Supabase SQL editor or via `supabase db push`.

    create extension if not exists pgcrypto;

    -- ===== profiles =====================================================
    create type public.plan_tier as enum ('free', 'pro', 'creator');

    create table if not exists public.profiles (
      id                  uuid primary key references auth.users(id) on delete cascade,
      plan                public.plan_tier not null default 'free',
      stripe_customer_id  text,
      created_at          timestamptz not null default now(),
      updated_at          timestamptz not null default now()
    );

    -- Auto-create a profile row on signup. Idempotent.
    create or replace function public.handle_new_user()
    returns trigger
    language plpgsql
    security definer
    set search_path = public
    as $$
    begin
      insert into public.profiles (id) values (new.id)
      on conflict (id) do nothing;
      return new;
    end;
    $$;

    drop trigger if exists on_auth_user_created on auth.users;
    create trigger on_auth_user_created
      after insert on auth.users
      for each row execute function public.handle_new_user();

    -- ===== simulation_usage =============================================
    create table if not exists public.simulation_usage (
      id              bigserial primary key,
      user_id         uuid references auth.users(id) on delete cascade,
      anon_id         text,
      ip_hash         text not null,
      input_length    int  not null,
      blocked_reason  text,
      created_at      timestamptz not null default now(),
      constraint actor_present check (user_id is not null or anon_id is not null)
    );

    create index if not exists simulation_usage_user_created_idx
      on public.simulation_usage (user_id, created_at desc)
      where user_id is not null;

    create index if not exists simulation_usage_anon_created_idx
      on public.simulation_usage (anon_id, created_at desc)
      where anon_id is not null;

    create index if not exists simulation_usage_blocked_idx
      on public.simulation_usage (created_at desc)
      where blocked_reason is not null;

    -- ===== RLS ===========================================================
    alter table public.profiles enable row level security;
    alter table public.simulation_usage enable row level security;

    -- Profiles: a user can read their own row only.
    drop policy if exists "profiles_select_own" on public.profiles;
    create policy "profiles_select_own"
      on public.profiles for select
      using (auth.uid() = id);

    -- Simulation usage: a user can read their own rows. No INSERT/UPDATE via
    -- anon or authenticated role -- writes go through the service-role admin client.
    drop policy if exists "usage_select_own" on public.simulation_usage;
    create policy "usage_select_own"
      on public.simulation_usage for select
      using (auth.uid() = user_id);

    grant select on public.profiles to anon, authenticated;
    grant select on public.simulation_usage to anon, authenticated;
    ```

    Then create `lib/db.types.ts` with the matching TypeScript shape — used by the Supabase clients to get strong typing:

    ```typescript
    export type PlanTier = "free" | "pro" | "creator";

    export type Database = {
      public: {
        Tables: {
          profiles: {
            Row: {
              id: string;
              plan: PlanTier;
              stripe_customer_id: string | null;
              created_at: string;
              updated_at: string;
            };
            Insert: {
              id: string;
              plan?: PlanTier;
              stripe_customer_id?: string | null;
            };
            Update: Partial<{
              plan: PlanTier;
              stripe_customer_id: string | null;
              updated_at: string;
            }>;
          };
          simulation_usage: {
            Row: {
              id: number;
              user_id: string | null;
              anon_id: string | null;
              ip_hash: string;
              input_length: number;
              blocked_reason: string | null;
              created_at: string;
            };
            Insert: {
              user_id?: string | null;
              anon_id?: string | null;
              ip_hash: string;
              input_length: number;
              blocked_reason?: string | null;
            };
            Update: Partial<{
              blocked_reason: string | null;
            }>;
          };
        };
        Enums: { plan_tier: PlanTier };
      };
    };
    ```
  </action>
  <verify>
    <automated>node -e "const fs=require('fs'); const sql=fs.readFileSync('supabase/migrations/0001_phase1_init.sql','utf8'); const need=['create table if not exists public.profiles','create table if not exists public.simulation_usage','enable row level security','on_auth_user_created','plan_tier','stripe_customer_id','ip_hash','blocked_reason','actor_present']; const m=need.filter(s=>!sql.includes(s)); if(m.length){console.error('Missing:',m);process.exit(1)} const t=fs.readFileSync('lib/db.types.ts','utf8'); ['PlanTier','profiles','simulation_usage','blocked_reason'].forEach(s=>{if(!t.includes(s)){console.error('Missing in types:',s);process.exit(1)}}); console.log('OK')"</automated>
  </verify>
  <acceptance_criteria>
    - `grep -c "create table if not exists public.profiles" supabase/migrations/0001_phase1_init.sql` returns 1.
    - `grep -c "create table if not exists public.simulation_usage" supabase/migrations/0001_phase1_init.sql` returns 1.
    - `grep -c "enable row level security" supabase/migrations/0001_phase1_init.sql` returns 2.
    - `grep -c "on_auth_user_created" supabase/migrations/0001_phase1_init.sql` returns >= 2 (drop trigger + create trigger).
    - `grep -c "actor_present" supabase/migrations/0001_phase1_init.sql` returns 1.
    - `lib/db.types.ts` exports `PlanTier` and `Database` (grep `export type PlanTier`, `export type Database`).
    - `npx tsc --noEmit lib/db.types.ts` exits 0 (type file is self-contained).
  </acceptance_criteria>
  <done>Migration file exists with the two tables, RLS, and the on-signup trigger. Types file mirrors the schema so downstream code gets strong typing.</done>
</task>

<task type="auto" tdd="true">
  <name>Task 3: Implement Supabase clients, Upstash client, and session-refresh middleware</name>
  <files>lib/supabase/client.ts, lib/supabase/server.ts, lib/supabase/admin.ts, lib/upstash.ts, middleware.ts</files>
  <read_first>
    - lib/db.types.ts (just created — these clients are typed against it)
    - lib/openai.ts (mirror its demo-mode pattern: `const client = key ? new X() : null; export const isLive = Boolean(client)`)
    - lib/stripe.ts (same pattern: `stripeIsLive`)
    - CLAUDE.md (demo mode: missing env must NOT throw at import time)
  </read_first>
  <behavior>
    All five files MUST be tolerant of missing env so the app boots in demo mode (matching the established `lib/openai.ts` and `lib/stripe.ts` pattern). Specifically:

    - Test 1: `import { createSupabaseServerClient } from "@/lib/supabase/server"` must not throw at import time even if `NEXT_PUBLIC_SUPABASE_URL` is empty.
    - Test 2: `lib/supabase/admin.ts` exports `supabaseAdmin` which is `null` when `SUPABASE_SERVICE_ROLE_KEY` is empty (downstream code must null-check).
    - Test 3: `lib/upstash.ts` exports `ratelimit` (null when env empty) and `isRateLimitConfigured` boolean.
    - Test 4: `middleware.ts` short-circuits (returns `NextResponse.next`) when `NEXT_PUBLIC_SUPABASE_URL` is empty — does not crash demo builds.
    - Test 5: Server client uses `next/headers` `cookies()` (await — Next 15+ API).
  </behavior>
  <action>
    Create these five files with the EXACT signatures shown below.

    **`lib/supabase/client.ts`** (browser, client components):
    ```typescript
    import { createBrowserClient } from "@supabase/ssr";
    import type { Database } from "@/lib/db.types";

    export function createSupabaseBrowserClient() {
      return createBrowserClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
      );
    }

    export const isSupabaseConfigured =
      Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
      Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    ```

    **`lib/supabase/server.ts`** (server components, route handlers, server actions):
    ```typescript
    import { createServerClient } from "@supabase/ssr";
    import { cookies } from "next/headers";
    import type { Database } from "@/lib/db.types";

    export async function createSupabaseServerClient() {
      const cookieStore = await cookies();
      return createServerClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
        {
          cookies: {
            getAll() {
              return cookieStore.getAll();
            },
            setAll(cookiesToSet) {
              try {
                cookiesToSet.forEach(({ name, value, options }) =>
                  cookieStore.set(name, value, options),
                );
              } catch {
                // Server Component context: cookie writes happen via middleware refresh.
              }
            },
          },
        },
      );
    }
    ```

    **`lib/supabase/admin.ts`** (server-only — service role; never imported into a client bundle):
    ```typescript
    import "server-only";
    import { createClient } from "@supabase/supabase-js";
    import type { Database } from "@/lib/db.types";

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    export const supabaseAdmin =
      url && serviceKey
        ? createClient<Database>(url, serviceKey, {
            auth: { persistSession: false, autoRefreshToken: false },
          })
        : null;

    export const isSupabaseAdminConfigured = Boolean(supabaseAdmin);
    ```

    **`lib/upstash.ts`**:
    ```typescript
    import "server-only";
    import { Ratelimit } from "@upstash/ratelimit";
    import { Redis } from "@upstash/redis";

    const haveEnv = Boolean(
      process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN,
    );

    export const isRateLimitConfigured = haveEnv;

    // 5 requests per 1 minute per identifier (per-IP burst guard — ABUSE-01).
    export const ratelimit = haveEnv
      ? new Ratelimit({
          redis: Redis.fromEnv(),
          limiter: Ratelimit.slidingWindow(5, "1 m"),
          prefix: "whatif:simulate",
          analytics: false,
        })
      : null;
    ```

    **`middleware.ts`** (project root — refreshes the SSR session on every navigation):
    ```typescript
    import { NextResponse, type NextRequest } from "next/server";
    import { createServerClient } from "@supabase/ssr";

    export async function middleware(req: NextRequest) {
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
        return NextResponse.next({ request: req });
      }

      let response = NextResponse.next({ request: req });

      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
        {
          cookies: {
            getAll() {
              return req.cookies.getAll();
            },
            setAll(cookiesToSet) {
              cookiesToSet.forEach(({ name, value }) => req.cookies.set(name, value));
              response = NextResponse.next({ request: req });
              cookiesToSet.forEach(({ name, value, options }) =>
                response.cookies.set(name, value, options),
              );
            },
          },
        },
      );

      // Refresh the session cookie if expired; ignore errors.
      await supabase.auth.getUser().catch(() => null);
      return response;
    }

    export const config = {
      matcher: [
        // Skip Next internals and static assets.
        "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
      ],
    };
    ```

    Note: `"server-only"` import in admin and upstash is intentional — if a client component accidentally imports them, Next will fail the build, which is the desired safety.
  </action>
  <verify>
    <automated>npx tsc --noEmit 2>&1 | grep -v '^$' | grep -E '(error|Error)' | grep -v -E '(node_modules|\.next)' || echo "OK"</automated>
  </verify>
  <acceptance_criteria>
    - `grep -c "createBrowserClient" lib/supabase/client.ts` returns >= 1.
    - `grep -c "createServerClient" lib/supabase/server.ts` returns >= 1.
    - `grep -c "next/headers" lib/supabase/server.ts` returns 1 (App Router cookies API).
    - `grep -c '"server-only"' lib/supabase/admin.ts` returns 1.
    - `grep -c '"server-only"' lib/upstash.ts` returns 1.
    - `grep -c "export const supabaseAdmin" lib/supabase/admin.ts` returns 1.
    - `grep -c "export const ratelimit" lib/upstash.ts` returns 1.
    - `grep -c "slidingWindow(5" lib/upstash.ts` returns 1 (5/min — ABUSE-01).
    - `grep -c "auth.getUser" middleware.ts` returns 1.
    - `grep -c "matcher" middleware.ts` returns 1.
    - `npx tsc --noEmit` exits 0 (project-wide type check passes).
  </acceptance_criteria>
  <done>All five files exist, typecheck clean, and gracefully degrade when env vars are absent (preserves demo mode).</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| Client browser -> `/api/simulate` | Untrusted user input crosses here (handled in Plan 04). |
| Server runtime -> Supabase | Server uses two clients: SSR (user-bound, RLS-enforced) and admin (service role, bypasses RLS). The admin key MUST stay server-side. |
| Server runtime -> Upstash REST | REST token grants write access; same secret class as Supabase service role. |
| Public bundle <-> server-only modules | `lib/supabase/admin.ts` and `lib/upstash.ts` use `"server-only"` to fail the build if leaked into a client component. |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-01-01 | Information Disclosure | `SUPABASE_SERVICE_ROLE_KEY` leaking to client bundle | mitigate | `lib/supabase/admin.ts` imports `"server-only"`; client-side import fails the Next build. |
| T-01-02 | Information Disclosure | `UPSTASH_REDIS_REST_TOKEN` leaking to client bundle | mitigate | `lib/upstash.ts` imports `"server-only"`. |
| T-01-03 | Elevation of Privilege | User read/writes another user's profile via PostgREST | mitigate | RLS enabled on both tables; SELECT policy uses `auth.uid() = id`; no INSERT/UPDATE policies for anon or authenticated -> all writes require service role. |
| T-01-04 | Tampering | Plan tier escalation via direct profile update | mitigate | No UPDATE policy for `authenticated` on profiles; Phase 2 webhook (service role only) is the sole mutator. |
| T-01-05 | Information Disclosure | Storing raw client IP (GDPR) | mitigate | `simulation_usage.ip_hash` stores SHA-256 only (computed by simulate route in Plan 04); no plaintext IP at rest. |
| T-01-06 | Denial of Service | Cookie-less burst spam against `/api/simulate` | accept (in this plan) | Upstash limiter handle wired here; enforcement happens in Plan 04. |
| T-01-07 | Repudiation | Abuse events not auditable | mitigate | `simulation_usage.blocked_reason` column + index — Supabase dashboard query satisfies ABUSE-03. |
</threat_model>

<verification>
- `npm install` exits 0; new deps installed.
- `npx tsc --noEmit` is clean.
- `next build` succeeds (no module-resolution or server-only violations).
- A manual review of `supabase/migrations/0001_phase1_init.sql` shows: two tables, two RLS-enabled tables, one trigger, no payments/subscriptions tables (those are Phase 2).
- Importing `@/lib/supabase/server` from any route handler does not throw when Supabase env is unset.
</verification>

<success_criteria>
- Five new source files exist (`lib/supabase/{client,server,admin}.ts`, `lib/upstash.ts`, `middleware.ts`).
- One migration file exists (`supabase/migrations/0001_phase1_init.sql`).
- One types file exists (`lib/db.types.ts`).
- `.env.example` declares all six new env vars; existing keys preserved.
- Project still builds and runs in demo mode (no Supabase / no Upstash env required).
</success_criteria>

<output>
After completion, create `.planning/phases/01-rate-limiting-user-system/01-01-supabase-upstash-infra-SUMMARY.md` documenting: files created, env contract, demo-mode behavior, and the migration SQL location (so Plan 03 + 04 executors know where the types and clients live).
</output>
