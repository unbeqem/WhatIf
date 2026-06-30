---
phase: 01-rate-limiting-user-system
plan: 04
type: execute
wave: 2
depends_on:
  - 01
  - 02
files_modified:
  - app/api/simulate/route.ts
  - lib/quota.ts
  - lib/ratelimit.ts
autonomous: true
requirements:
  - USAGE-01
  - USAGE-02
  - USAGE-03
  - ABUSE-01
  - ABUSE-02

must_haves:
  truths:
    - "An anonymous visitor can run exactly 1 simulation per 24h per device cookie (with ipHash backstop)."
    - "A logged-in free user can run exactly 1 simulation per 24h, counted via DB rows in simulation_usage."
    - "A logged-in pro or creator user is exempt from the daily counter (still subject to per-IP burst)."
    - "Bursts above 5/min per IP are rejected with 429 regardless of plan (ABUSE-01)."
    - "Inputs <8 or >1500 chars are rejected with 400 (ABUSE-02)."
    - "Every rejection writes a row to simulation_usage with blocked_reason set (ABUSE-03 — visible in Supabase)."
    - "When the daily limit is hit the response is 429 with body `{ error: 'limit_reached', limit: 'anon_daily' | 'free_daily' }` so the UI shows the soft paywall (USAGE-04)."
    - "When Supabase or Upstash env is missing, the route falls back to MVP behavior (no gating) — preserves demo mode and existing simulate flow."
  artifacts:
    - path: "app/api/simulate/route.ts"
      provides: "Gated POST handler that composes ratelimit + quota + simulateDecision"
      contains: "checkQuota"
      min_lines: 80
    - path: "lib/quota.ts"
      provides: "checkQuota(...) -> { allowed, reason?, plan } using profiles + simulation_usage rows"
      contains: "simulation_usage"
      min_lines: 80
    - path: "lib/ratelimit.ts"
      provides: "checkBurst(ipHash) -> { allowed, retryAfterSec? } wrapping the Upstash limiter from Plan 01"
      contains: "ratelimit"
  key_links:
    - from: "app/api/simulate/route.ts"
      to: "lib/anon.ts getAnonIdentity"
      via: "called once per request; cookieToSet applied to response"
      pattern: "getAnonIdentity"
    - from: "app/api/simulate/route.ts"
      to: "lib/supabase/server.ts createSupabaseServerClient"
      via: "reads auth.getUser() and profile.plan via service role"
      pattern: "createSupabaseServerClient"
    - from: "lib/quota.ts"
      to: "lib/supabase/admin.ts supabaseAdmin"
      via: "counts rows in simulation_usage in the last 24h"
      pattern: "supabaseAdmin"
    - from: "lib/quota.ts"
      to: "supabase.from('simulation_usage').insert"
      via: "every accepted simulation logs one row (positive log) and every rejected one logs blocked_reason (ABUSE-03)"
      pattern: "simulation_usage"
    - from: "app/api/simulate/route.ts"
      to: "lib/openai.ts simulateDecision"
      via: "ONLY called after both gates pass — unchanged MVP behavior"
      pattern: "simulateDecision"
---

<objective>
Replace the MVP `/api/simulate` POST handler with a plan/quota-aware version that layers four gates on top of the existing OpenAI call: (1) input validation, (2) per-IP burst limit, (3) plan-aware daily counter, (4) accounting log. All gates must short-circuit cleanly and write an auditable row for every block.

Purpose: This is the centerpiece of Phase 1. USAGE-01..04 + ABUSE-01..03 all converge on this single route. Plan 01 built the clients; Plan 02 built the anon identifier; this plan composes them and turns the soft-paywall UI signal (429 + `limit_reached`) into a contract Plan 05 can render against.

Output: A rewritten simulate route, two helper modules (quota + burst), and a preserved demo-mode fallback for contributors running locally without Supabase/Upstash.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/REQUIREMENTS.md
@.planning/phases/01-rate-limiting-user-system/01-01-supabase-upstash-infra-SUMMARY.md
@.planning/phases/01-rate-limiting-user-system/01-02-anon-identification-SUMMARY.md
@CLAUDE.md
@app/api/simulate/route.ts
@lib/openai.ts
@lib/supabase/server.ts
@lib/supabase/admin.ts
@lib/upstash.ts
@lib/anon.ts
@lib/db.types.ts

<interfaces>
<!-- Inputs from Plans 01 and 02. The executor wires these together. -->

```typescript
// From Plan 01
export async function createSupabaseServerClient(): Promise<SupabaseClient<Database>>;
export const supabaseAdmin: SupabaseClient<Database> | null;
export const ratelimit: Ratelimit | null;
export const isRateLimitConfigured: boolean;

// From Plan 02
export type AnonIdentity = {
  anonId: string;
  ipHash: string;
  cookieToSet?: { name: "whatif_anon"; value: string; options: {/*...*/} };
};
export function getAnonIdentity(req: NextRequest): AnonIdentity;

// Existing MVP — keep using this for the actual simulation
export async function simulateDecision(input: string): Promise<SimulationResult>;
```

<!-- New contracts this plan creates -->

```typescript
// lib/ratelimit.ts
export type BurstResult =
  | { allowed: true }
  | { allowed: false; retryAfterSec: number };
export async function checkBurst(ipHash: string): Promise<BurstResult>;

// lib/quota.ts
export type Actor =
  | { kind: "user"; userId: string; plan: "free" | "pro" | "creator" }
  | { kind: "anon"; anonId: string };

export type QuotaResult =
  | { allowed: true; actor: Actor }
  | { allowed: false; reason: "anon_daily" | "free_daily"; actor: Actor };

export async function resolveActor(
  supabaseUser: { id: string } | null,
  anonId: string,
): Promise<Actor>;

export async function checkQuota(actor: Actor, ipHash: string): Promise<QuotaResult>;

export async function logUsage(args: {
  actor: Actor;
  ipHash: string;
  inputLength: number;
  blockedReason?: string;
}): Promise<void>;
```

<!-- Response contract used by SimulateForm (UI in Plan 05) -->

```typescript
// 200: existing SimulationResult shape unchanged.
// 400: { error: string }                        // input too short/long
// 429: { error: "limit_reached"; limit: "anon_daily" | "free_daily" } // -> soft paywall
// 429: { error: "rate_limited"; retryAfterSec: number }              // -> "slow down" UI
// 500: { error: "server_error" }
```
</interfaces>
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Build lib/ratelimit.ts (burst guard) and lib/quota.ts (plan-aware counters + logging)</name>
  <files>lib/ratelimit.ts, lib/quota.ts</files>
  <read_first>
    - lib/upstash.ts (the `ratelimit` instance and `isRateLimitConfigured` flag from Plan 01)
    - lib/supabase/admin.ts (the `supabaseAdmin` service-role client from Plan 01)
    - lib/db.types.ts (Database, PlanTier — column names used in queries)
    - .planning/REQUIREMENTS.md (USAGE-01: 1/24h anon, USAGE-02: 1/24h free, USAGE-03: pro/creator unlimited, ABUSE-03: log all)
  </read_first>
  <behavior>
    `lib/ratelimit.ts`:
    - Test 1: With Upstash configured, `checkBurst("hash")` first call returns `{ allowed: true }`.
    - Test 2: With Upstash configured, the 6th `checkBurst("hash")` within a minute returns `{ allowed: false, retryAfterSec: <0..60> }`.
    - Test 3: With Upstash NOT configured (env missing), `checkBurst` ALWAYS returns `{ allowed: true }` (demo mode).

    `lib/quota.ts`:
    - Test 4: `resolveActor(null, "anon-123")` returns `{ kind: "anon", anonId: "anon-123" }`.
    - Test 5: `resolveActor({ id: "user-uuid" }, "...")` queries profiles for plan and returns `{ kind: "user", userId, plan }`. Defaults plan to `"free"` if profile missing.
    - Test 6: `checkQuota({ kind: "user", ..., plan: "pro" })` returns `{ allowed: true }` without touching the counter table.
    - Test 7: `checkQuota({ kind: "user", ..., plan: "free" })` counts rows in `simulation_usage` for that user_id in the last 24h with `blocked_reason IS NULL`. If count >= 1, returns `{ allowed: false, reason: "free_daily" }`.
    - Test 8: `checkQuota({ kind: "anon", anonId })` counts BOTH `anon_id = X` AND `ip_hash = Y` (via OR) in the last 24h. If count >= 1, returns `{ allowed: false, reason: "anon_daily" }` — implements USAGE-01's "cookie + IP backstop".
    - Test 9: `logUsage` inserts ONE row with the right column set. If `blockedReason` is undefined the row counts toward the daily quota; if present it does NOT (filtered out via `blocked_reason IS NULL` in checkQuota).
    - Test 10: If `supabaseAdmin` is null (demo mode), `checkQuota` returns `{ allowed: true }` and `logUsage` is a no-op (does not throw).
  </behavior>
  <action>
    Create the two files below.

    **`lib/ratelimit.ts`**:
    ```typescript
    import "server-only";
    import { ratelimit, isRateLimitConfigured } from "@/lib/upstash";

    export type BurstResult =
      | { allowed: true }
      | { allowed: false; retryAfterSec: number };

    export async function checkBurst(ipHash: string): Promise<BurstResult> {
      if (!isRateLimitConfigured || !ratelimit) {
        return { allowed: true }; // demo mode -- no limiter configured
      }

      const { success, reset } = await ratelimit.limit(ipHash);
      if (success) return { allowed: true };

      const retryAfterSec = Math.max(1, Math.ceil((reset - Date.now()) / 1000));
      return { allowed: false, retryAfterSec };
    }
    ```

    **`lib/quota.ts`**:
    ```typescript
    import "server-only";
    import { supabaseAdmin, isSupabaseAdminConfigured } from "@/lib/supabase/admin";
    import type { PlanTier } from "@/lib/db.types";

    const DAY_MS = 24 * 60 * 60 * 1000;

    export type Actor =
      | { kind: "user"; userId: string; plan: PlanTier }
      | { kind: "anon"; anonId: string };

    export type QuotaResult =
      | { allowed: true; actor: Actor }
      | { allowed: false; reason: "anon_daily" | "free_daily"; actor: Actor };

    /**
     * Resolve the request actor. For logged-in users, fetches the plan from
     * `profiles`. Falls back to 'free' if the profile is missing (shouldn't
     * happen — the trigger creates it on signup — but be defensive).
     */
    export async function resolveActor(
      supabaseUser: { id: string } | null,
      anonId: string,
    ): Promise<Actor> {
      if (!supabaseUser) {
        return { kind: "anon", anonId };
      }
      if (!supabaseAdmin) {
        return { kind: "user", userId: supabaseUser.id, plan: "free" };
      }
      const { data } = await supabaseAdmin
        .from("profiles")
        .select("plan")
        .eq("id", supabaseUser.id)
        .maybeSingle();
      return {
        kind: "user",
        userId: supabaseUser.id,
        plan: (data?.plan as PlanTier | undefined) ?? "free",
      };
    }

    /**
     * Plan-aware quota check.
     * - pro / creator -> always allowed (USAGE-03).
     * - free user    -> 1/24h, counted via simulation_usage rows where blocked_reason IS NULL.
     * - anon         -> 1/24h, counted via OR(anon_id, ip_hash) for the same window.
     */
    export async function checkQuota(actor: Actor, ipHash: string): Promise<QuotaResult> {
      if (actor.kind === "user" && (actor.plan === "pro" || actor.plan === "creator")) {
        return { allowed: true, actor };
      }

      if (!isSupabaseAdminConfigured || !supabaseAdmin) {
        return { allowed: true, actor }; // demo mode -- no DB, allow
      }

      const sinceIso = new Date(Date.now() - DAY_MS).toISOString();

      if (actor.kind === "user") {
        const { count, error } = await supabaseAdmin
          .from("simulation_usage")
          .select("id", { count: "exact", head: true })
          .eq("user_id", actor.userId)
          .is("blocked_reason", null)
          .gte("created_at", sinceIso);

        if (error) {
          console.error("[quota] free user count error", error.message);
          return { allowed: true, actor }; // fail-open: never break the loop on a DB hiccup
        }
        return (count ?? 0) >= 1
          ? { allowed: false, reason: "free_daily", actor }
          : { allowed: true, actor };
      }

      // anon: OR(anon_id, ip_hash)
      const { count, error } = await supabaseAdmin
        .from("simulation_usage")
        .select("id", { count: "exact", head: true })
        .or(`anon_id.eq.${actor.anonId},ip_hash.eq.${ipHash}`)
        .is("blocked_reason", null)
        .gte("created_at", sinceIso);

      if (error) {
        console.error("[quota] anon count error", error.message);
        return { allowed: true, actor };
      }
      return (count ?? 0) >= 1
        ? { allowed: false, reason: "anon_daily", actor }
        : { allowed: true, actor };
    }

    /**
     * Insert one row into simulation_usage. blocked_reason=undefined for accepted
     * simulations (counted toward quota), set for blocked ones (visible in
     * Supabase for ABUSE-03 review, not counted toward quota).
     */
    export async function logUsage(args: {
      actor: Actor;
      ipHash: string;
      inputLength: number;
      blockedReason?: string;
    }): Promise<void> {
      if (!supabaseAdmin) return; // demo mode

      const row: {
        user_id: string | null;
        anon_id: string | null;
        ip_hash: string;
        input_length: number;
        blocked_reason: string | null;
      } = {
        user_id: args.actor.kind === "user" ? args.actor.userId : null,
        anon_id: args.actor.kind === "anon" ? args.actor.anonId : null,
        ip_hash: args.ipHash,
        input_length: args.inputLength,
        blocked_reason: args.blockedReason ?? null,
      };

      const { error } = await supabaseAdmin.from("simulation_usage").insert(row);
      if (error) {
        console.error("[quota] log insert error", error.message);
        // Swallow -- never block the user response on a logging failure.
      }
    }
    ```
  </action>
  <verify>
    <automated>npx tsc --noEmit 2>&1 | grep -v '^$' | grep -E '(error|Error)' | grep -v -E '(node_modules|\.next)' || echo "OK"</automated>
  </verify>
  <acceptance_criteria>
    - `grep -c "export async function checkBurst" lib/ratelimit.ts` returns 1.
    - `grep -c "ratelimit.limit" lib/ratelimit.ts` returns 1.
    - `grep -c '"server-only"' lib/ratelimit.ts` returns 1.
    - `grep -c "export async function checkQuota" lib/quota.ts` returns 1.
    - `grep -c "export async function resolveActor" lib/quota.ts` returns 1.
    - `grep -c "export async function logUsage" lib/quota.ts` returns 1.
    - `grep -c "anon_id.eq.\${actor.anonId},ip_hash.eq.\${ipHash}" lib/quota.ts` returns 1 (USAGE-01 cookie+IP OR).
    - `grep -c '"free_daily"' lib/quota.ts` returns >= 1.
    - `grep -c '"anon_daily"' lib/quota.ts` returns >= 1.
    - `grep -cE 'plan === "pro" \|\| actor.plan === "creator"' lib/quota.ts` returns 1 (USAGE-03 bypass).
    - `grep -c '"server-only"' lib/quota.ts` returns 1.
    - `npx tsc --noEmit` exits 0.
  </acceptance_criteria>
  <done>Both helpers compile and expose the four functions Task 2 needs. Demo-mode fallbacks (no Supabase, no Upstash) return `allowed: true` instead of throwing.</done>
</task>

<task type="auto" tdd="true">
  <name>Task 2: Rewrite app/api/simulate/route.ts to compose anon + burst + quota + log + simulate</name>
  <files>app/api/simulate/route.ts</files>
  <read_first>
    - app/api/simulate/route.ts (current MVP — keep the 8/1500 char validation + simulateDecision call shape; the new code wraps it)
    - lib/anon.ts (getAnonIdentity + cookieToSet contract)
    - lib/ratelimit.ts (checkBurst — just created in Task 1)
    - lib/quota.ts (resolveActor, checkQuota, logUsage — just created in Task 1)
    - lib/supabase/server.ts (createSupabaseServerClient)
    - lib/openai.ts (simulateDecision)
    - components/SimulateForm.tsx (the consumer — to confirm we keep the 200 success shape and that 429 with `limit_reached` is the agreed soft-paywall signal)
  </read_first>
  <behavior>
    - Test 1: Input < 8 chars -> 400 `{ error: <message> }`, logs blocked_reason="input_too_short", does NOT call simulateDecision.
    - Test 2: Input > 1500 chars -> 400 `{ error: <message> }`, logs blocked_reason="input_too_long".
    - Test 3: Burst limit hit (6th request in a minute from same IP) -> 429 `{ error: "rate_limited", retryAfterSec }`, logs blocked_reason="burst", does NOT call simulateDecision.
    - Test 4: Anon visitor, no prior usage today -> 200 with SimulationResult; cookieToSet applied; one row inserted with anon_id, ip_hash, blocked_reason=null.
    - Test 5: Same anon (cookie present), second attempt within 24h -> 429 `{ error: "limit_reached", limit: "anon_daily" }`, logs blocked_reason="anon_daily".
    - Test 6: Anon clears cookie but same IP, second attempt within 24h -> 429 `{ error: "limit_reached", limit: "anon_daily" }` (ip_hash backstop catches it).
    - Test 7: Free user, first call today -> 200 + log row with user_id.
    - Test 8: Free user, second call today -> 429 `{ error: "limit_reached", limit: "free_daily" }`.
    - Test 9: Pro/Creator user, 10 calls -> all 200 (subject only to burst).
    - Test 10: With Supabase env missing, route falls through to the MVP behavior (validation + simulateDecision, no gates) — does NOT crash.
    - Test 11: simulateDecision throws -> 500 `{ error: "server_error" }`, no log row written for the would-be successful sim.
  </behavior>
  <action>
    Replace the contents of `app/api/simulate/route.ts` with this composed handler. Preserve the existing error copy ("Tell me a little more...", "Decision is too long..." etc.) so existing UI copy isn't churned.

    ```typescript
    import { NextRequest, NextResponse } from "next/server";
    import { simulateDecision } from "@/lib/openai";
    import { getAnonIdentity } from "@/lib/anon";
    import { checkBurst } from "@/lib/ratelimit";
    import { checkQuota, logUsage, resolveActor } from "@/lib/quota";
    import { createSupabaseServerClient } from "@/lib/supabase/server";

    export const runtime = "nodejs";
    export const maxDuration = 30;

    const MIN_INPUT = 8;
    const MAX_INPUT = 1500;

    export async function POST(req: NextRequest) {
      // -------- Step 0: parse + validate input (ABUSE-02) --------
      const body = await req.json().catch(() => null);
      const input = typeof body?.input === "string" ? body.input : "";
      const trimmedLen = input.trim().length;

      // Resolve identity now so we can log validation failures consistently.
      const anon = getAnonIdentity(req);

      // Optional: who's logged in? (works in demo mode -- returns null user)
      let supabaseUserId: string | null = null;
      if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
        try {
          const supabase = await createSupabaseServerClient();
          const { data } = await supabase.auth.getUser();
          supabaseUserId = data?.user?.id ?? null;
        } catch (e) {
          console.error("[simulate] auth.getUser error", e);
        }
      }
      const actor = await resolveActor(
        supabaseUserId ? { id: supabaseUserId } : null,
        anon.anonId,
      );

      function applyCookie(res: NextResponse) {
        if (anon.cookieToSet) {
          res.cookies.set(anon.cookieToSet.name, anon.cookieToSet.value, anon.cookieToSet.options);
        }
        return res;
      }

      if (trimmedLen < MIN_INPUT) {
        await logUsage({
          actor,
          ipHash: anon.ipHash,
          inputLength: input.length,
          blockedReason: "input_too_short",
        });
        return applyCookie(
          NextResponse.json(
            { error: "Tell me a little more — at least a sentence." },
            { status: 400 },
          ),
        );
      }

      if (input.length > MAX_INPUT) {
        await logUsage({
          actor,
          ipHash: anon.ipHash,
          inputLength: input.length,
          blockedReason: "input_too_long",
        });
        return applyCookie(
          NextResponse.json(
            { error: "Decision is too long. Keep it under 1500 characters." },
            { status: 400 },
          ),
        );
      }

      // -------- Step 1: per-IP burst guard (ABUSE-01) --------
      const burst = await checkBurst(anon.ipHash);
      if (!burst.allowed) {
        await logUsage({
          actor,
          ipHash: anon.ipHash,
          inputLength: input.length,
          blockedReason: "burst",
        });
        const res = NextResponse.json(
          { error: "rate_limited", retryAfterSec: burst.retryAfterSec },
          { status: 429 },
        );
        res.headers.set("Retry-After", String(burst.retryAfterSec));
        return applyCookie(res);
      }

      // -------- Step 2: plan-aware daily quota (USAGE-01..03) --------
      const quota = await checkQuota(actor, anon.ipHash);
      if (!quota.allowed) {
        await logUsage({
          actor,
          ipHash: anon.ipHash,
          inputLength: input.length,
          blockedReason: quota.reason,
        });
        return applyCookie(
          NextResponse.json(
            { error: "limit_reached", limit: quota.reason },
            { status: 429 },
          ),
        );
      }

      // -------- Step 3: run the simulation --------
      try {
        const result = await simulateDecision(input);

        // -------- Step 4: log the accepted usage (counts toward 24h cap) --------
        await logUsage({
          actor,
          ipHash: anon.ipHash,
          inputLength: input.length,
          // no blockedReason -> counts toward quota
        });

        return applyCookie(NextResponse.json(result));
      } catch (err) {
        console.error("[simulate] error", err);
        return applyCookie(
          NextResponse.json(
            { error: "The oracle is silent. Try again in a moment." },
            { status: 500 },
          ),
        );
      }
    }
    ```

    Rationale:
    - Order of gates is intentional: input -> burst -> quota -> simulate. Each gate logs its own block reason so ABUSE-03 dashboard queries can filter by reason.
    - `applyCookie` is centralized so the cookie is set on every code path (otherwise blocked anonymous users would never get a stable id, and ip_hash would be the only backstop).
    - Error copy preserved verbatim from MVP — Plan 05 doesn't have to rewrite the SimulateForm error mapping for that.
    - Demo mode: if Supabase env is missing, `resolveActor` returns `{ kind: "anon", anonId }`, `checkQuota` short-circuits to `allowed:true`, `logUsage` is a no-op. The route reduces to the MVP behavior with anon cookie setting on top — no breaks.
  </action>
  <verify>
    <automated>npx tsc --noEmit 2>&1 | grep -v '^$' | grep -E '(error|Error)' | grep -v -E '(node_modules|\.next)' || echo "OK"</automated>
  </verify>
  <acceptance_criteria>
    - `grep -c "getAnonIdentity" app/api/simulate/route.ts` returns 1.
    - `grep -c "checkBurst" app/api/simulate/route.ts` returns 1.
    - `grep -c "checkQuota" app/api/simulate/route.ts` returns 1.
    - `grep -c "logUsage" app/api/simulate/route.ts` returns >= 4 (input_too_short, input_too_long, burst, quota_reason, plus accepted).
    - `grep -c '"limit_reached"' app/api/simulate/route.ts` returns 1.
    - `grep -c '"rate_limited"' app/api/simulate/route.ts` returns 1.
    - `grep -c "simulateDecision" app/api/simulate/route.ts` returns 1.
    - `grep -c "createSupabaseServerClient" app/api/simulate/route.ts` returns 1.
    - `grep -c "input_too_short" app/api/simulate/route.ts` returns 1.
    - `grep -c "input_too_long" app/api/simulate/route.ts` returns 1.
    - `grep -c '"burst"' app/api/simulate/route.ts` returns 1.
    - `grep -c "Retry-After" app/api/simulate/route.ts` returns 1.
    - `grep -c "applyCookie" app/api/simulate/route.ts` returns >= 6 (every return path).
    - `npx tsc --noEmit` exits 0; `next build` succeeds.
  </acceptance_criteria>
  <done>Single composed handler replaces the MVP; every requirement code (USAGE-01..04, ABUSE-01..03) has at least one line of code traceable to it.</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| Browser -> `/api/simulate` | Untrusted JSON body, untrusted cookies, untrusted IP headers. |
| Route handler -> Supabase (SSR) | RLS-bound user context (read-only profile lookup safe under user role; quota counts use service role). |
| Route handler -> Supabase (admin) | Service-role writes for `simulation_usage` rows — never gated by RLS, must always be on the server. |
| Route handler -> Upstash REST | REST token in process.env, never reaches the client. |
| Route handler -> OpenAI | Outbound only; input is user-controlled but already length-bounded. |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-04-01 | Denial of Service | Burst spam on `/api/simulate` (cost amplification via OpenAI) | mitigate | Upstash sliding-window limiter (5/min per ipHash) wired BEFORE simulateDecision; 429 with Retry-After. |
| T-04-02 | Denial of Service | Cookie rotation to bypass anon daily cap | mitigate | `checkQuota` for anon uses OR(anon_id, ip_hash) — clearing cookies still hits the ip_hash backstop. |
| T-04-03 | Elevation of Privilege | Free user reading plan='pro' from session JWT directly | mitigate | Plan is read from `profiles` via service-role client, not from the JWT — JWT only proves `user.id`. |
| T-04-04 | Information Disclosure | Leaking another user's plan via the response | mitigate | Response shape never includes the user's plan; soft-paywall flag is binary. |
| T-04-05 | Tampering | Malformed JSON body to crash the handler | mitigate | `req.json().catch(() => null)` + explicit typeof string check. |
| T-04-06 | Repudiation | Blocked requests vanish without audit trail | mitigate | Every block path calls `logUsage` with a `blocked_reason` value before returning (ABUSE-03). |
| T-04-07 | Information Disclosure | Storing raw IP in `simulation_usage` | mitigate | Only `ip_hash` (SHA-256(ip + secret)) is written; raw IP is never persisted. |
| T-04-08 | Denial of Service | Race between two parallel requests both passing checkQuota and both inserting | accept | Free tier allows a tiny over-grant window (worst case 2 sims instead of 1 in a 24h period if perfectly racy). Not worth the complexity of an advisory lock for v1. |
| T-04-09 | Tampering | Forged x-forwarded-for to dodge burst limiter | accept | Vercel/edge sets XFF authoritatively at the proxy; if self-hosted, operator is responsible. Documented in summary. |
</threat_model>

<verification>
- `npx tsc --noEmit` and `next build` both succeed.
- All grep checks above pass.
- Reading the file confirms five distinct gates (input min, input max, burst, quota, simulate-throw) with `logUsage` on each block path.
- Demo-mode test: `unset NEXT_PUBLIC_SUPABASE_URL UPSTASH_REDIS_REST_URL && curl -X POST localhost:3000/api/simulate -d '{"input":"this is a long enough decision"}'` returns 200 with a SimulationResult and no thrown errors.
</verification>

<success_criteria>
- `app/api/simulate/route.ts` rewritten and composes anon + burst + quota + logUsage + simulateDecision.
- `lib/ratelimit.ts` and `lib/quota.ts` exist and expose the four contract functions.
- All twelve phase REQ-IDs reachable from this plan's code paths.
- MVP demo mode still works (no Supabase / no Upstash env -> route reduces to validation + simulateDecision).
</success_criteria>

<output>
After completion, create `.planning/phases/01-rate-limiting-user-system/01-04-gated-simulate-route-SUMMARY.md` documenting: the gate order, the 429 response contract (`limit_reached` vs `rate_limited`), the blocked_reason vocabulary (`input_too_short`, `input_too_long`, `burst`, `anon_daily`, `free_daily`), and the demo-mode fallthrough behavior. Plan 05 reads this to wire the SimulateForm paywall surface.
</output>
