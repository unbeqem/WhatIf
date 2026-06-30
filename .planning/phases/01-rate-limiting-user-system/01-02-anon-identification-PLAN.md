---
phase: 01-rate-limiting-user-system
plan: 02
type: execute
wave: 1
depends_on: []
files_modified:
  - lib/anon.ts
autonomous: true
requirements:
  - AUTH-05
user_setup: []

must_haves:
  truths:
    - "A logged-out visitor gets a stable, signed device id that survives across reloads and is forge-resistant."
    - "If the cookie is missing OR tampered, server code can still identify the device via a hashed IP fallback."
    - "The IP is never stored or returned in plaintext — only a SHA-256 hex digest."
    - "No PII leaves the function: input is the request, output is { anonId, ipHash, cookieToSet? }."
  artifacts:
    - path: "lib/anon.ts"
      provides: "getAnonIdentity(request) -> { anonId, ipHash, cookieToSet? } using HMAC-signed UUID + IP fallback"
      contains: "createHmac"
      min_lines: 60
  key_links:
    - from: "lib/anon.ts"
      to: "next/headers (Request.cookies, x-forwarded-for header)"
      via: "reads cookie 'whatif_anon'; if absent/invalid, falls back to IP hash and returns a cookieToSet payload"
      pattern: "whatif_anon"
    - from: "lib/anon.ts ANON_COOKIE_SECRET"
      to: "process.env.ANON_COOKIE_SECRET"
      via: "HMAC signature on the UUID payload"
      pattern: "process.env.ANON_COOKIE_SECRET"
---

<objective>
Provide one self-contained utility — `getAnonIdentity(req)` — that the gated `/api/simulate` route (Plan 04) will use to identify anonymous visitors safely.

Purpose: USAGE-01 says "1 simulation per device per 24h" for anonymous users; AUTH-05 says anonymous visitors can still run a simulation. We need a stable device id that (a) cannot be forged to bypass the cap by clearing cookies — hence the IP-hash backstop — and (b) does not store raw IPs (GDPR).

Output: One file, one function, one tested behavior. No DB calls. No Supabase imports. Pure crypto + request parsing. Plan 04 will compose this with the DB counter.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/REQUIREMENTS.md
@CLAUDE.md

<interfaces>
<!-- The function signature Plan 04 will import. Treat as a contract. -->

```typescript
import type { NextRequest } from "next/server";

/**
 * Identify an anonymous visitor for usage-cap accounting.
 * - Primary id: a UUID stored in a signed httpOnly cookie (`whatif_anon`).
 * - Fallback / forgery guard: SHA-256(IP + ANON_COOKIE_SECRET).
 *
 * Pure function — does NOT touch DB or Supabase. Returns a cookieToSet payload
 * that the caller (route handler) is responsible for applying to the response.
 */
export type AnonIdentity = {
  anonId: string;    // stable UUID
  ipHash: string;    // sha256 hex of (ip + secret)
  cookieToSet?: {    // present iff the route should set the cookie on the response
    name: "whatif_anon";
    value: string;   // signed payload `<uuid>.<hmac>`
    options: {
      httpOnly: true;
      secure: boolean;            // true in production
      sameSite: "lax";
      path: "/";
      maxAge: number;             // ~ 1 year
    };
  };
};

export function getAnonIdentity(req: NextRequest): AnonIdentity;
```
</interfaces>
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Implement getAnonIdentity with signed cookie + IP-hash fallback</name>
  <files>lib/anon.ts</files>
  <read_first>
    - lib/anon.ts (target file — likely does not exist)
    - .planning/REQUIREMENTS.md (USAGE-01: cookie + IP backstop; AUTH-05: anon allowed)
    - .planning/PROJECT.md (GDPR: minimize PII; ip_hash, never plaintext IP)
    - CLAUDE.md (demo mode: missing env must not crash — use a dev-only constant secret as fallback)
  </read_first>
  <behavior>
    - Test 1: First request (no cookie) -> returns a fresh UUID and a `cookieToSet` payload.
    - Test 2: Second request with the cookie from Test 1 -> returns the SAME UUID, no `cookieToSet`.
    - Test 3: Request with a tampered cookie (mutated hmac) -> behaves as if no cookie (fresh UUID + cookieToSet).
    - Test 4: Two requests from the same IP with no cookie -> different anonId (fresh UUID each time) but SAME ipHash (the DB layer in Plan 04 dedupes via ipHash, not anonId, when cookieless).
    - Test 5: `ipHash` is a 64-char lowercase hex string (SHA-256 hex digest).
    - Test 6: If `ANON_COOKIE_SECRET` is unset, function still works (uses a dev-only constant — logged once via console.warn) — demo mode preserved.
    - Test 7: `cookieToSet.options.secure` is `true` when `process.env.NODE_ENV === "production"`, else `false`.
  </behavior>
  <action>
    Create `lib/anon.ts` with EXACTLY this implementation (signatures match the contract in `<interfaces>`):

    ```typescript
    import "server-only";
    import { createHmac, randomUUID, createHash, timingSafeEqual } from "node:crypto";
    import type { NextRequest } from "next/server";

    const COOKIE_NAME = "whatif_anon" as const;
    const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

    let warnedAboutSecret = false;
    function getSecret(): string {
      const s = process.env.ANON_COOKIE_SECRET;
      if (s && s.length >= 16) return s;
      if (!warnedAboutSecret) {
        console.warn(
          "[anon] ANON_COOKIE_SECRET missing or too short — using dev fallback. " +
            "Set ANON_COOKIE_SECRET (>=32 hex chars) before production.",
        );
        warnedAboutSecret = true;
      }
      return "dev-only-do-not-use-in-prod-anon-secret-9c4b";
    }

    function sign(payload: string, secret: string): string {
      return createHmac("sha256", secret).update(payload).digest("hex");
    }

    function constantTimeEqual(a: string, b: string): boolean {
      const ab = Buffer.from(a, "utf8");
      const bb = Buffer.from(b, "utf8");
      if (ab.length !== bb.length) return false;
      return timingSafeEqual(ab, bb);
    }

    function verify(signed: string, secret: string): string | null {
      const idx = signed.lastIndexOf(".");
      if (idx <= 0) return null;
      const payload = signed.slice(0, idx);
      const mac = signed.slice(idx + 1);
      const expected = sign(payload, secret);
      if (!constantTimeEqual(mac, expected)) return null;
      // Payload is the UUID itself; validate shape.
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(payload)) {
        return null;
      }
      return payload;
    }

    function extractIp(req: NextRequest): string {
      // x-forwarded-for is "client, proxy1, proxy2..." -- take the first hop.
      const xff = req.headers.get("x-forwarded-for");
      if (xff) {
        const first = xff.split(",")[0]?.trim();
        if (first) return first;
      }
      const real = req.headers.get("x-real-ip");
      if (real) return real.trim();
      return "0.0.0.0";
    }

    function hashIp(ip: string, secret: string): string {
      return createHash("sha256").update(`${ip}:${secret}`).digest("hex");
    }

    export type AnonIdentity = {
      anonId: string;
      ipHash: string;
      cookieToSet?: {
        name: typeof COOKIE_NAME;
        value: string;
        options: {
          httpOnly: true;
          secure: boolean;
          sameSite: "lax";
          path: "/";
          maxAge: number;
        };
      };
    };

    export function getAnonIdentity(req: NextRequest): AnonIdentity {
      const secret = getSecret();
      const ip = extractIp(req);
      const ipHash = hashIp(ip, secret);

      const existing = req.cookies.get(COOKIE_NAME)?.value;
      const verified = existing ? verify(existing, secret) : null;

      if (verified) {
        return { anonId: verified, ipHash };
      }

      const fresh = randomUUID();
      const signed = `${fresh}.${sign(fresh, secret)}`;

      return {
        anonId: fresh,
        ipHash,
        cookieToSet: {
          name: COOKIE_NAME,
          value: signed,
          options: {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
            maxAge: ONE_YEAR_SECONDS,
          },
        },
      };
    }

    // Exposed for unit tests.
    export const __internal = { sign, verify, hashIp, extractIp, COOKIE_NAME };
    ```

    Rationale for choices (one-line each):
    - HMAC-SHA-256: cheap, deterministic, server-only verification (no JWT overhead needed).
    - Cookie + IP-hash combo: addresses USAGE-01 ("cookie + IP backstop") explicitly.
    - `timingSafeEqual`: prevents timing attacks on signature verification.
    - Salting IP hash with the same secret: ip_hash values are not cross-correlatable with raw IPs even if leaked.
    - Dev fallback secret: matches the "demo-mode philosophy" — local dev without `.env` still works, but warns loudly.
  </action>
  <verify>
    <automated>npx tsc --noEmit lib/anon.ts 2>&1 | grep -v '^$' | grep -E '(error|Error)' | grep -v node_modules || echo "OK"</automated>
  </verify>
  <acceptance_criteria>
    - `grep -c "export function getAnonIdentity" lib/anon.ts` returns 1.
    - `grep -c "export type AnonIdentity" lib/anon.ts` returns 1.
    - `grep -c 'createHmac("sha256"' lib/anon.ts` returns 1.
    - `grep -c "timingSafeEqual" lib/anon.ts` returns 1 (no string-compare for MAC).
    - `grep -c "x-forwarded-for" lib/anon.ts` returns 1.
    - `grep -c '"whatif_anon"' lib/anon.ts` returns 1.
    - `grep -c '"server-only"' lib/anon.ts` returns 1 (never bundled to client).
    - `grep -E 'NODE_ENV === "production"' lib/anon.ts` returns at least one match (secure flag conditional).
    - `grep -cv '^#' lib/anon.ts | head -1` — file is at least 60 lines (`wc -l lib/anon.ts` >= 60).
    - `npx tsc --noEmit` for the whole project still exits 0.
  </acceptance_criteria>
  <done>One file, one public function, one type. Importable from any route handler; never crashes on missing env; never logs raw IPs.</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| Browser <-> server | Cookies sent by browser are untrusted; signature verification is the trust boundary. |
| Network proxy chain | `x-forwarded-for` is settable by anyone in front of the app — we take the first hop and only use it as a forgery backstop (never as primary identity). |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-02-01 | Spoofing | Forged `whatif_anon` cookie value | mitigate | HMAC-SHA-256 signature verification using `timingSafeEqual`; invalid signatures fall through to fresh-UUID path. |
| T-02-02 | Tampering | Cookie value mutated to a different UUID | mitigate | Signature covers the UUID; any mutation invalidates the MAC. |
| T-02-03 | Information Disclosure | Raw IP stored or logged | mitigate | `ipHash` is SHA-256(ip + secret); raw IP only lives on the in-memory request object. |
| T-02-04 | Repudiation | Anon visitor disowns prior simulation | accept | Cookie clearing yields a new anonId, but the ipHash backstop limits abuse — acceptable for free-tier quota purposes. |
| T-02-05 | Denial of Service | Cookie-less attacker rotates IPs to bypass cap | accept (in this plan) | Plan 04 layers Upstash rate-limit (per-IP) on top of this; combined they make rotation expensive. |
| T-02-06 | Elevation of Privilege | Forged cookie grants logged-in privileges | n/a | This function only returns an anon identity; authenticated users come from Supabase SSR, not from this cookie. |
</threat_model>

<verification>
- `npx tsc --noEmit` clean.
- `grep` checks above all pass.
- Reading the file confirms: server-only import, HMAC sign+verify, IP extraction order (xff -> x-real-ip -> 0.0.0.0), no DB calls, no Supabase imports.
</verification>

<success_criteria>
- `lib/anon.ts` exists and exports `getAnonIdentity` + `AnonIdentity` type.
- Project type-checks.
- No Supabase or DB calls inside the file (it is pure crypto + request parsing).
</success_criteria>

<output>
After completion, create `.planning/phases/01-rate-limiting-user-system/01-02-anon-identification-SUMMARY.md` documenting: the cookie name, secret env var, return-shape contract, and the explicit decision that Plan 04 is responsible for applying `cookieToSet` to the response.
</output>
