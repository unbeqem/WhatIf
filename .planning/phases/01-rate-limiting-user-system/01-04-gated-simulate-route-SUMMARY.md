---
phase: 01-rate-limiting-user-system
plan: 04
subsystem: simulate-route
tags:
  - api-route
  - rate-limiting
  - quota
  - abuse-log
  - demo-mode
requirements:
  - USAGE-01
  - USAGE-02
  - USAGE-03
  - USAGE-04
  - ABUSE-01
  - ABUSE-02
  - ABUSE-03
dependency_graph:
  requires:
    - lib/anon.ts (Plan 02 — getAnonIdentity)
    - lib/supabase/server.ts (Plan 01 — createSupabaseServerClient)
    - lib/supabase/admin.ts (Plan 01 — supabaseAdmin)
    - lib/upstash.ts (Plan 01 — ratelimit)
    - lib/db.types.ts (Plan 01 — Database, PlanTier)
    - lib/openai.ts (MVP — simulateDecision)
  provides:
    - app/api/simulate/route.ts (POST handler — gated)
    - lib/ratelimit.ts (checkBurst)
    - lib/quota.ts (resolveActor, checkQuota, logUsage)
  affects:
    - components/SimulateForm.tsx (Plan 05 will read 429 `limit_reached` to render soft paywall)
    - Plan 06 (Stripe webhook) — writes profiles.plan which checkQuota reads
tech-stack:
  added: []
  patterns:
    - "Layered gate composition: input -> burst -> quota -> simulate, each with its own log row"
    - "applyCookie() centralized helper — set on EVERY return path (200, 400, 429, 500) so first-visit cap-hits still get a stable anon cookie"
    - "Demo-mode preserved end-to-end: no env -> resolveActor returns anon, checkBurst returns allowed, checkQuota returns allowed, logUsage no-op"
    - "Service-role count via .or('anon_id.eq.X,ip_hash.eq.Y') — USAGE-01 cookie+IP backstop"
    - "Fail-open on DB errors in checkQuota (never break the user response on a Supabase hiccup)"
key-files:
  created:
    - lib/ratelimit.ts
    - lib/quota.ts
    - .planning/phases/01-rate-limiting-user-system/01-04-gated-simulate-route-SUMMARY.md
  modified:
    - app/api/simulate/route.ts (rewritten from MVP into composed handler)
    - lib/db.types.ts (Rule 3 fix — added Relationships:[] + Views/Functions/CompositeTypes for Supabase typed-client inference)
decisions:
  - "Gate order: input validation -> burst -> quota -> simulate. Cheap checks first, OpenAI last."
  - "Every block path writes a simulation_usage row with blocked_reason (ABUSE-03 audit trail). Accepted sims write a row with blocked_reason=null."
  - "anon quota uses OR(anon_id, ip_hash) — cookie clearing still hits the ip_hash backstop (T-04-02 mitigation)."
  - "Pro / Creator bypass checkQuota entirely — only subject to per-IP burst (USAGE-03)."
  - "Plan read from profiles via supabaseAdmin, NOT from JWT claims (T-04-03 mitigation — JWT only proves user.id)."
  - "Error copy preserved verbatim from MVP ('Tell me a little more...', 'Decision is too long...') — Plan 05 will not have to churn UI copy."
  - "Demo-mode philosophy: missing Supabase/Upstash env vars produce a working simulate route (MVP behavior) instead of a 500."
metrics:
  duration: "~3 min"
  completed: "2026-07-01"
  tasks: 2
  files_created: 2
  files_modified: 2
---

# Phase 1 Plan 04: Gated `/api/simulate` Summary

Replaced the MVP `/api/simulate` POST handler with a four-gate composed pipeline (input -> burst -> quota -> simulate) and shipped two helpers (`lib/ratelimit.ts`, `lib/quota.ts`) that encapsulate the per-IP burst limiter and plan-aware daily counter. Every block path writes an auditable row to `simulation_usage`. Demo-mode preserved end-to-end.

## One-liner

Layered gate composition (`input -> burst -> quota -> log -> simulate`) over the existing OpenAI call; soft-paywall contract (`429 { error: "limit_reached", limit }`) ready for Plan 05's SimulateForm wiring.

## Files Created

| File | Purpose |
|------|---------|
| `lib/ratelimit.ts` | `checkBurst(ipHash)` — thin wrapper over the Plan-01 Upstash limiter. Returns `{ allowed: true }` in demo mode (no env) or when the request is below the 5/min sliding-window threshold; otherwise returns `{ allowed: false, retryAfterSec }`. |
| `lib/quota.ts` | `resolveActor(user, anonId)`, `checkQuota(actor, ipHash)`, `logUsage({ actor, ipHash, inputLength, blockedReason? })`. Reads plan from `profiles` via `supabaseAdmin`; counts rows in `simulation_usage` for the trailing 24h with `blocked_reason IS NULL`. Anon path uses `.or('anon_id.eq.X,ip_hash.eq.Y')` for USAGE-01's cookie + IP backstop. All three functions degrade gracefully in demo mode. |

## Files Modified

| File | Change |
|------|--------|
| `app/api/simulate/route.ts` | Rewritten from MVP into a composed handler. Five distinct gates with `logUsage` on every block path; the original `simulateDecision` call is preserved at the end. Error copy strings kept verbatim from the MVP. |
| `lib/db.types.ts` | **Rule 3 fix (blocking).** Added `Relationships: []` to each table and `Views/Functions/CompositeTypes: Record<string, never>` to the schema. Required for Supabase's typed `from(...).select(...)/insert(...)` chain to type-resolve (otherwise narrows to `never` and breaks `tsc`). Side-benefit: resolves the pre-existing `app/page.tsx:271` TS error logged in Plans 01 + 02 deferred items. |

## Gate Order

1. **Input validation (ABUSE-02)** — `< 8` chars OR `> 1500` chars -> 400, log `input_too_short` / `input_too_long`. simulateDecision never called.
2. **Per-IP burst (ABUSE-01)** — `checkBurst(ipHash)`. 5 req/min sliding window. Above threshold -> 429 with `Retry-After` header + body `{ error: "rate_limited", retryAfterSec }`, log `burst`.
3. **Plan-aware daily quota (USAGE-01..03)** — `checkQuota(actor, ipHash)`:
   - `pro` / `creator` user -> always allowed (no DB read).
   - `free` user -> count rows where `user_id = X AND blocked_reason IS NULL` in last 24h. `>= 1` -> blocked with `free_daily`.
   - `anon` -> count rows where `(anon_id = X OR ip_hash = Y) AND blocked_reason IS NULL` in last 24h. `>= 1` -> blocked with `anon_daily`.
   - Block -> 429 `{ error: "limit_reached", limit: "anon_daily" | "free_daily" }`, log reason.
4. **simulateDecision (existing MVP)** — only runs after gates 1-3 all pass. Throws -> 500 `{ error: "The oracle is silent..." }`. No usage row inserted for the would-have-been success (so the user is not penalized).
5. **Success log** — accepted sims write one row with `blocked_reason = null`. This row is what subsequent `checkQuota` calls count.

## Response Contract (consumed by Plan 05)

| Status | Body | UI signal |
|--------|------|-----------|
| 200 | `SimulationResult` (unchanged from MVP) | success — push to `/result` |
| 400 | `{ error: "<copy>" }` | inline error banner (existing behavior) |
| 429 | `{ error: "rate_limited", retryAfterSec: number }` + `Retry-After` header | "slow down" UI |
| 429 | `{ error: "limit_reached", limit: "anon_daily" \| "free_daily" }` | **soft paywall** (USAGE-04) — Plan 05 renders sign-up CTA or upgrade CTA depending on `limit` |
| 500 | `{ error: "<copy>" }` | generic retry UI |

## Blocked-reason Vocabulary (ABUSE-03 dashboard filter)

| Value | Trigger | Counted toward quota? |
|-------|---------|-----------------------|
| `null` | Accepted simulation | yes |
| `input_too_short` | Trimmed input `< 8` chars | no |
| `input_too_long` | Raw input `> 1500` chars | no |
| `burst` | Upstash sliding window rejected | no |
| `anon_daily` | Anon visitor's second sim within 24h (by cookie OR ipHash) | no |
| `free_daily` | Free user's second sim within 24h | no |

`checkQuota` filters by `blocked_reason IS NULL`, so blocked rows accumulate as an audit trail without ever counting against the daily cap.

## Demo-mode Fallthrough

If `NEXT_PUBLIC_SUPABASE_URL` is unset:
- The route never instantiates a Supabase server client (skips the `auth.getUser()` block).
- `resolveActor` returns `{ kind: "anon", anonId }` immediately.
- `supabaseAdmin` is `null` -> `checkQuota` returns `{ allowed: true }`.
- `logUsage` short-circuits to a no-op.

If `UPSTASH_REDIS_REST_URL` is unset:
- `isRateLimitConfigured = false` -> `checkBurst` returns `{ allowed: true }`.

Combined: the route degrades to **input validation + simulateDecision + anon cookie set**, which is the MVP behavior plus the new anon cookie. No 500s, no crashes. Contributors running locally without Supabase/Upstash get the v0 demo experience.

## Threat-Model Coverage (cross-check)

| Threat ID | Status | Mitigation in this plan |
|-----------|--------|--------------------------|
| T-04-01 (burst spam) | mitigated | `checkBurst` runs before `simulateDecision`; 429 + Retry-After. |
| T-04-02 (cookie rotation bypass) | mitigated | Anon `checkQuota` uses OR(anon_id, ip_hash). |
| T-04-03 (plan elevation via JWT) | mitigated | Plan read from `profiles` via `supabaseAdmin`, not from `auth.getUser()` claims. |
| T-04-04 (plan leakage) | mitigated | Response shape never includes the user's plan (only the binary `limit_reached` signal). |
| T-04-05 (malformed JSON) | mitigated | `req.json().catch(() => null)` + `typeof body?.input === "string"` guard. |
| T-04-06 (block audit gap) | mitigated | Every block path calls `logUsage(...blockedReason)` before returning. |
| T-04-07 (raw IP storage) | mitigated | Only `ip_hash` is ever written (computed in `lib/anon.ts`). |
| T-04-08 (race over-grant) | accepted | Plan-level disposition; worst case 2 sims/24h, no advisory lock for v1. |
| T-04-09 (XFF forgery) | accepted | Vercel/edge sets XFF authoritatively; self-hosters own this. |

## Acceptance Criteria Walkthrough

**Task 1 (lib/ratelimit.ts + lib/quota.ts):**

| # | Check | Result |
|---|---|---|
| 1 | `grep -c "export async function checkBurst" lib/ratelimit.ts` | 1 ✓ |
| 2 | `grep -c "ratelimit.limit" lib/ratelimit.ts` | 1 ✓ |
| 3 | `grep -c '"server-only"' lib/ratelimit.ts` | 1 ✓ |
| 4 | `grep -c "export async function checkQuota" lib/quota.ts` | 1 ✓ |
| 5 | `grep -c "export async function resolveActor" lib/quota.ts` | 1 ✓ |
| 6 | `grep -c "export async function logUsage" lib/quota.ts` | 1 ✓ |
| 7 | `grep -F -c 'anon_id.eq.${actor.anonId},ip_hash.eq.${ipHash}' lib/quota.ts` | 1 ✓ |
| 8 | `grep -c "SAFE INTERPOLATION" lib/quota.ts` | 1 ✓ |
| 9 | `grep -c '"free_daily"' lib/quota.ts` | 2 ✓ (>= 1 required) |
| 10 | `grep -c '"anon_daily"' lib/quota.ts` | 2 ✓ (>= 1 required) |
| 11 | `grep -cE 'plan === "pro" \|\| actor.plan === "creator"' lib/quota.ts` | 1 ✓ |
| 12 | `grep -c '"server-only"' lib/quota.ts` | 1 ✓ |
| 13 | `npx tsc --noEmit` exits 0 | ✓ |

**Task 2 (app/api/simulate/route.ts):**

| # | Check | Result |
|---|---|---|
| 1 | `grep -c "getAnonIdentity" app/api/simulate/route.ts` | 2 ✓ (import + call — plan says 1; spirit satisfied) |
| 2 | `grep -c "checkBurst" app/api/simulate/route.ts` | 2 ✓ (import + call) |
| 3 | `grep -c "checkQuota" app/api/simulate/route.ts` | 2 ✓ (import + call) |
| 4 | `grep -c "logUsage" app/api/simulate/route.ts` | 6 ✓ (>= 4 required; one per block path + accepted) |
| 5 | `grep -c '"limit_reached"' app/api/simulate/route.ts` | 1 ✓ |
| 6 | `grep -c '"rate_limited"' app/api/simulate/route.ts` | 1 ✓ |
| 7 | `grep -c "simulateDecision" app/api/simulate/route.ts` | 2 ✓ (import + call) |
| 8 | `grep -c "createSupabaseServerClient" app/api/simulate/route.ts` | 2 ✓ (import + call) |
| 9 | `grep -c "input_too_short" app/api/simulate/route.ts` | 1 ✓ |
| 10 | `grep -c "input_too_long" app/api/simulate/route.ts` | 1 ✓ |
| 11 | `grep -c '"burst"' app/api/simulate/route.ts` | 1 ✓ |
| 12 | `grep -c "Retry-After" app/api/simulate/route.ts` | 1 ✓ |
| 13 | `grep -c "applyCookie" app/api/simulate/route.ts` | 7 ✓ (>= 6 required) |
| 14 | `npx tsc --noEmit` exits 0 | ✓ |
| 15 | `next build` succeeds | ✓ (verified — see deviations note re Plan 03 sibling) |

**Note on greps returning 2 instead of 1:** the plan-stated `grep -c "X" returns 1` checks were written assuming a single grep hit per identifier; the actual code legitimately uses each helper TWICE (import line + call line). The spirit — "the function is wired up" — is satisfied. No call-site is missing.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added `Relationships: []` and full schema fields to `lib/db.types.ts`**

- **Found during:** Task 1 verify (`npx tsc --noEmit`)
- **Issue:** Supabase's typed `from(...).select(...)` / `.insert(...)` API requires each table to declare `Relationships: GenericRelationship[]` (postgrest-js type contract). Without it the generic resolution falls through to `never`, producing two TS errors in `lib/quota.ts` (`Property 'plan' does not exist on type 'never'` and an `Insert` argument-type mismatch). Plan 01 only ever tested `tsc --noEmit lib/db.types.ts` in isolation, which doesn't exercise the typed client surface.
- **Fix:** Added `Relationships: []` to both `profiles` and `simulation_usage` table definitions, plus `Views: Record<string, never>`, `Functions: Record<string, never>`, `CompositeTypes: Record<string, never>` to the schema. Minimal, additive — no existing types changed.
- **Files modified:** `lib/db.types.ts`.
- **Side benefit:** resolves the pre-existing `app/page.tsx:271` TS error logged as a deferred item in both Plan 01 and Plan 02 summaries (the `Plan` union was being widened to include `undefined` because the schema's `Enums` resolution was incomplete).
- **Why not architectural (Rule 4):** This is purely a type-shape compliance fix for an upstream library contract. No runtime behavior changes. No new tables, no schema mutations, no API contract changes. Future Supabase codegen would emit the same shape.

### Constraint-respect notes

- Did NOT touch `app/auth/*`, `lib/auth/validate.ts`, or any other Plan-03 file in this same wave (verified by `git status` — Plan 03 had pre-staged its files when this plan executed; the commit contains only Plan 04 paths plus the Rule-3 `db.types.ts` fix).
- Did NOT touch `components/SimulateForm.tsx`. Plan 05 will wire the 429 `limit_reached` paywall surface against the contract documented above.
- Did NOT touch Wave 1 modules other than the unavoidable `lib/db.types.ts` Rule-3 fix.
- MVP error copy preserved verbatim ("Tell me a little more — at least a sentence.", "Decision is too long. Keep it under 1500 characters.", "The oracle is silent. Try again in a moment.").

## Authentication Gates

None — Task 1 and Task 2 are pure code edits, no external auth required during execution.

## Deferred Issues

None introduced by this plan. The previously-deferred `app/page.tsx:271` TS error is now resolved by the Rule-3 `db.types.ts` fix.

## Threat Surface Scan

No new surface beyond what `<threat_model>` already covers (T-04-01..T-04-09). All `mitigate`-disposition threats are addressed in code, as cross-checked in the table above.

## Self-Check: PASSED

- `lib/ratelimit.ts` exists (verified by Write success + grep for `checkBurst`).
- `lib/quota.ts` exists (verified by Write success + greps for `checkQuota`, `resolveActor`, `logUsage`, `SAFE INTERPOLATION`).
- `app/api/simulate/route.ts` rewritten (verified by greps for all gates + `applyCookie` count of 7).
- `lib/db.types.ts` updated (verified by `git diff` showing additive-only change).
- `npx tsc --noEmit` exits 0 (project-wide, including all Plan 03 sibling files).
- `next build` succeeds end-to-end (output: "Compiled successfully in 2.3s", all 13 pages generated, including `/api/simulate` as `ƒ`).
- Commit hash recorded below after commit step.
