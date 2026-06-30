---
phase: 01-rate-limiting-user-system
plan: 02
subsystem: anon-identity
tags: [crypto, cookies, gdpr, anon, hmac]
requires: []
provides:
  - "getAnonIdentity(req) -> { anonId, ipHash, cookieToSet? }"
  - "AnonIdentity type"
  - "Stable signed-cookie device id for unauthenticated visitors"
  - "SHA-256 ipHash backstop for cookie-clearing abuse"
affects:
  - "Plan 04 (gated-simulate-route): will import getAnonIdentity and is responsible for applying cookieToSet to the response."
tech-stack:
  added: []
  patterns:
    - "HMAC-SHA-256 signed cookie payload `<uuid>.<hmac>`"
    - "timingSafeEqual for MAC comparison (no string-compare)"
    - "Salted IP hash (ip + secret) — raw IP never persisted or returned"
    - "Dev-only constant secret fallback when ANON_COOKIE_SECRET is missing — preserves demo-mode philosophy from CLAUDE.md"
key-files:
  created:
    - lib/anon.ts
  modified: []
decisions:
  - "Cookie name is `whatif_anon` (constant exported as COOKIE_NAME via __internal)"
  - "Secret env var is `ANON_COOKIE_SECRET` (>=16 chars required to be accepted; otherwise dev fallback + console.warn once)"
  - "Function is PURE — does NOT write to the response. Caller (Plan 04 route handler) applies cookieToSet."
  - "IP extraction order: x-forwarded-for first hop -> x-real-ip -> 0.0.0.0 sentinel"
  - "ipHash is SHA-256(`${ip}:${secret}`) hex — same secret as HMAC so values are non-correlatable with raw IPs"
metrics:
  duration: "~3 min"
  completed: "2026-07-01"
  tasks: 1
  files: 1
---

# Phase 1 Plan 02: Anon Identification Summary

One-liner: Signed-cookie + IP-hash device identity for anonymous visitors, GDPR-safe (no raw IPs leave memory), pure crypto (no DB, no Supabase) — Plan 04 composes it with the usage counter.

## What Was Built

A single self-contained server-only utility at `lib/anon.ts`:

- `getAnonIdentity(req: NextRequest): AnonIdentity` — primary export.
- `AnonIdentity` type — return shape contract.
- `__internal = { sign, verify, hashIp, extractIp, COOKIE_NAME }` — exposed for unit tests only.

## Cookie Contract

- **Cookie name:** `whatif_anon`
- **Cookie value format:** `<uuid>.<hmac>` where `<hmac>` is `HMAC-SHA-256(uuid, ANON_COOKIE_SECRET)` in lowercase hex.
- **Cookie options the route MUST apply (returned in `cookieToSet.options`):**
  - `httpOnly: true`
  - `secure: process.env.NODE_ENV === "production"` (false in dev, true in prod)
  - `sameSite: "lax"`
  - `path: "/"`
  - `maxAge: 60*60*24*365` (1 year)
- **Verification uses `timingSafeEqual`** — no string compare; tampered MAC falls through to fresh-UUID path.

## Secret Env Var

- **`ANON_COOKIE_SECRET`** — must be at least 16 characters (planned: 32+ hex chars in production via Vercel env).
- **Demo-mode fallback:** If the env var is missing or too short, `getSecret()` logs a single `console.warn` and uses a hardcoded constant (`"dev-only-do-not-use-in-prod-anon-secret-9c4b"`). This keeps the v0 demo experience working without any env setup — matches CLAUDE.md "missing env != crash" rule.

## Return-Shape Contract (consumed by Plan 04)

```typescript
type AnonIdentity = {
  anonId: string;    // stable UUID — present on every call
  ipHash: string;    // 64-char lowercase SHA-256 hex — present on every call
  cookieToSet?: {    // PRESENT iff caller needs to set the cookie on the response
    name: "whatif_anon";
    value: string;   // signed payload
    options: { httpOnly: true; secure: boolean; sameSite: "lax"; path: "/"; maxAge: number };
  };
};
```

### Two-state rule for `cookieToSet`

| Request state                                         | `anonId`             | `ipHash` | `cookieToSet` |
|-------------------------------------------------------|----------------------|----------|---------------|
| Valid signed `whatif_anon` cookie present             | UUID from cookie     | yes      | undefined     |
| No cookie OR signature invalid OR malformed payload   | freshly generated    | yes      | **present**   |

## Plan 04 Responsibility — Applying `cookieToSet`

**Plan 02 is pure.** It returns a plain object; it does NOT call `cookies().set()`, does NOT mutate `NextResponse`, does NOT have access to a response object.

**Plan 04 (gated `/api/simulate` route) MUST:**

1. Call `getAnonIdentity(req)` early in the handler.
2. Use `anonId` + `ipHash` for usage-counter lookup (USAGE-01).
3. **If `cookieToSet` is defined**, apply it to the outgoing `NextResponse`:
   ```typescript
   const res = NextResponse.json(...);
   if (anon.cookieToSet) {
     res.cookies.set(anon.cookieToSet.name, anon.cookieToSet.value, anon.cookieToSet.options);
   }
   return res;
   ```
4. Apply it for BOTH success (200) and rate-limited (429) responses — otherwise a first-visit cookieless cap-hit would never get a cookie, breaking the second-visit identity contract.

This split keeps `lib/anon.ts` testable in isolation (pure function) and lets Plan 04 own response-shape decisions.

## Threat Model Coverage

| Threat ID | Status     | How |
|-----------|------------|------|
| T-02-01 (cookie forgery)            | mitigated | HMAC-SHA-256 + `timingSafeEqual` |
| T-02-02 (UUID mutation)             | mitigated | UUID is the signed payload — any change breaks MAC |
| T-02-03 (raw IP disclosure)         | mitigated | Only `ipHash` ever returned; IP only lives on the in-memory request |
| T-02-04 (cookie-clearing repudiation) | accepted | `ipHash` backstop limits abuse to N visits per IP within USAGE-01 window |
| T-02-05 (IP rotation DoS)           | deferred  | Plan 04 layers Upstash per-IP burst limit on top |
| T-02-06 (privilege elevation)       | n/a       | This cookie never grants logged-in privileges |

## Deviations from Plan

None — code is verbatim from the `<action>` block.

### Out-of-scope discovery (NOT fixed)

`npx tsc --noEmit` (project-wide) reports one pre-existing error in `app/page.tsx:271:34` — `TS2322: Type '"pro" | "creator" | undefined' is not assignable to type 'Plan'`. Verified pre-existing via `git stash --include-untracked && npx tsc --noEmit` (still fails with `lib/anon.ts` stashed away). Out of Plan 02 scope (Plan 02 owns only `lib/anon.ts`). Most likely owner: Plan 05 (auth UI / paywall) which edits the pricing flow, or possibly Plan 04 if it widens the `Plan` union. Logging here for the verifier; not touching the file from Plan 02.

## Acceptance Criteria Walkthrough

All ten criteria PASS:

| # | Check | Result |
|---|---|---|
| 1 | `grep -c "export function getAnonIdentity" lib/anon.ts` | 1 ✓ |
| 2 | `grep -c "export type AnonIdentity" lib/anon.ts` | 1 ✓ |
| 3 | `grep -c 'createHmac("sha256"' lib/anon.ts` | 1 ✓ |
| 4 | `grep -c "timingSafeEqual" lib/anon.ts` | 2 ✓ (plan said "returns 1"; the import line legitimately makes it 2 — spirit satisfied: no string-compare for MAC) |
| 5 | `grep -c "x-forwarded-for" lib/anon.ts` | 2 ✓ (code + comment — spirit satisfied) |
| 6 | `grep -c '"whatif_anon"' lib/anon.ts` | 1 ✓ |
| 7 | `grep -c '"server-only"' lib/anon.ts` | 1 ✓ |
| 8 | `NODE_ENV === "production"` conditional present | ✓ |
| 9 | `wc -l lib/anon.ts >= 60` | 112 ✓ |
| 10 | Project `npx tsc --noEmit` exits 0 for `lib/anon.ts` | ✓ (only pre-existing `app/page.tsx` error remains — logged as deferred) |

## Self-Check: PASSED

- `lib/anon.ts` exists and contains 112 lines of the contracted implementation.
- Commit hash recorded below after commit step.
