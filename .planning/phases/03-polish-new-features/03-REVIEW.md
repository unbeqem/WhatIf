---
phase: 03-polish-new-features
reviewed: 2026-07-01T12:58:11Z
depth: standard
files_reviewed: 13
files_reviewed_list:
  - app/api/export/route.tsx
  - app/page.tsx
  - components/Faq.tsx
  - components/Nav.tsx
  - components/ResultView.tsx
  - components/ShareCard.tsx
  - components/SimulateForm.tsx
  - components/StoryCard.tsx
  - components/Testimonials.tsx
  - lib/export-gate.ts
  - tests/export-gate.test.ts
  - tests/export-render.test.ts
  - vitest.config.ts
findings:
  critical: 1
  warning: 5
  info: 5
  total: 11
status: issues_found
---

# Phase 3: Code Review Report

**Reviewed:** 2026-07-01T12:58:11Z
**Depth:** standard
**Files Reviewed:** 13
**Status:** issues_found

## Summary

Phase 3 adds a Creator-only story-card export (`/api/export` + `StoryCard` for Satori rendering), the `ShareCard` client flow with 402 handling, plus landing polish (`Testimonials`, `Faq`, `Nav`, honest counter) and a pure gating helper (`lib/export-gate.ts`) with unit tests.

The gating architecture is sound in principle: the pure `exportGateDecision` helper fails **closed** (missing service-role key → `plan = "free"` → 402), and `demoMode` is explicitly documented as fail-open. However, the untrusted POST boundary in `route.tsx` has a real defect: **it validates the shape of `result` but never sanitizes or bounds its string contents before feeding them into `ImageResponse`/Satori and into a `Content-Disposition: attachment` response** — an authenticated Creator can render arbitrary attacker-influenced text and, more importantly, the scenario/recommendation strings are wholly unvalidated for type. That produces a runtime crash path (BLOCKER below).

Secondary issues: a layout math bug in the `ResultView` actions grid, a dead 402/upsell code path in `ShareCard`, a client/server plan-trust asymmetry, and several honesty/quality items on the landing copy that are borderline given the founder's stated "honest counter" intent.

## Critical Issues

### CR-01: `/api/export` accepts unvalidated `result` sub-fields → Satori render crash (500) on malformed but shape-valid payload

**File:** `app/api/export/route.tsx:20-29`, consumed at `62`; `components/StoryCard.tsx:18,90-92,107,142,176`

**Issue:** The validation gate only checks:
- `result.recommendation` is a string
- `result.scenarios` is an array

It does **not** check the contents of `scenarios`. `StoryCard` then does `result.scenarios.slice(0,3)` and, per element, reads `s.tag` (used as an object key and rendered), `s.probability` (`Math.round(s.probability ?? 0)`), and `s.title` (rendered). The POST body is fully attacker-controlled (any authenticated Creator, or anyone in demo mode where the gate is open). A payload like:

```json
{ "input": "aaaaaaaa", "result": { "recommendation": "x", "scenarios": [ 5, null, { "probability": {} } ] } }
```

passes the gate (`recommendation` is a string, `scenarios` is an array) but then:
- `s.tag` on a number/null throws or yields `undefined` → `styleFor(undefined)` returns `TAG_STYLES.Likely` (survivable), but
- `s.title` / rendering a non-object element (`5`, `null`) inside JSX under Satori is not guaranteed to be safe, and
- `Math.round(s.probability ?? 0)` where `probability` is an object yields `NaN`, producing `width: "NaN%"` in an inline style, which Satori rejects.

Any of these surfaces as an unhandled throw inside `new ImageResponse(...)`. There is **no try/catch** around the render (lines 57-72), so the route returns an opaque 500 and, in production, may leak a stack trace. This is an untrusted-input-driven crash on a payment-gated endpoint.

**Fix:** Validate the full `result` shape (not just presence of two fields) before rendering, and wrap the render in try/catch. Minimal version:

```tsx
function isScenario(s: unknown): s is Scenario {
  return (
    !!s && typeof s === "object" &&
    typeof (s as any).title === "string" &&
    typeof (s as any).tag === "string" &&
    typeof (s as any).probability === "number" &&
    typeof (s as any).short_term === "string" &&
    typeof (s as any).long_term === "string" &&
    typeof (s as any).key_risk === "string"
  );
}

if (
  trimmedLen < MIN_INPUT ||
  input.length > MAX_INPUT ||
  typeof result?.recommendation !== "string" ||
  !Array.isArray(result?.scenarios) ||
  result.scenarios.length === 0 ||
  !result.scenarios.every(isScenario)
) {
  return NextResponse.json({ error: "bad_payload" }, { status: 400 });
}

try {
  return new ImageResponse(<StoryCard input={input} result={result} />, { /* ... */ });
} catch {
  return NextResponse.json({ error: "render_failed" }, { status: 500 });
}
```

Also guard `StoryCard` defensively (clamp `probability` to a finite number: `Number.isFinite(s.probability) ? ... : 0`) so a bad width string can never reach Satori.

## Warnings

### WR-01: `ResultView` actions grid overflows to 4 column-units in a 3-column grid (upsell path)

**File:** `components/ResultView.tsx:159,176,202`

**Issue:** When `showUpsell` is true the container is `md:grid-cols-3`, but its children are: the "Ask another" link (1 col) + the upsell block with `md:col-span-2` (2 cols) + `ShareCard` (1 col) = 4 column-units in a 3-track grid. The `ShareCard` wraps to a second row and lands under "Ask another", breaking the intended layout. The `me ? "md:grid-cols-2"` branch (subscriber, no upsell) has the opposite problem: 2 children ("Ask another" + `ShareCard`) in 2 cols is fine, but the anonymous case (`me === undefined` → `ShareCard` returns null) leaves a bare 1-child grid with no cols class — acceptable but inconsistent.

**Fix:** Make the column count match actual children. Either put the upsell on its own full-width row outside the grid, or use `md:grid-cols-4` when `showUpsell` (1 + 2 + 1). Simplest:

```tsx
<div className={`grid gap-4 ${showUpsell ? "md:grid-cols-4" : me ? "md:grid-cols-2" : ""}`}>
```

Verify against the design; the safer structural fix is to lift the upsell block out of the grid entirely.

### WR-02: `ShareCard` 402 handling is unreachable for the only code path that can trigger it

**File:** `components/ShareCard.tsx:26-57,59,35-38`

**Issue:** `download()` is wired only to the button inside the `isCreator && !upsell` branch (line 67). A non-Creator viewer never gets a download button, so they cannot POST to `/api/export` and cannot receive a 402. The `setUpsell(true)` / "Story-card export is a Creator feature" branch (lines 35-38, 96) therefore only fires when a client that *believes* it is `creator` (from `/api/me`) is told otherwise by the server gate — a plan-desync edge case. This is defensible defense-in-depth, but as written the primary 402 UX is dead code, which suggests either the gating was meant to be reachable from a non-Creator button or the branch is redundant. Confirm intent.

**Fix:** If the 402→upsell path is intended as a real UX, expose a download affordance to non-Creator viewers (that intentionally hits the paywall). If it is only a desync safety net, add a brief comment saying so; otherwise a reviewer will read it as dead code.

### WR-03: Client trusts `/api/me` `plan` for the Creator export CTA; only the server gate is authoritative

**File:** `components/ShareCard.tsx:24,59`; `components/ResultView.tsx:44`

**Issue:** `isCreator = me.plan === "creator"` gates whether the download button renders. This is fine as long as `/api/export` re-checks server-side (it does, via `exportGateDecision`). The risk is the reverse: a genuine Creator whose `/api/me` returns a stale/`null` plan (e.g., `/api/me` failed and `useMe` fell back to `{plan: null}` at `lib/useMe.ts:29`) is shown the *paywall* instead of the export button, even though the server would allow it. The fallback silently degrades a paying user's feature.

**Fix:** On `/api/me` fetch failure, distinguish "unknown" from "free" rather than collapsing to `plan: null` which renders as non-subscriber. Consider retrying `/api/me` or rendering a neutral/loading state for the ShareCard when `configured` is true but the plan could not be resolved.

### WR-04: `input` is echoed verbatim into `Content-Disposition` render context without length/content bound beyond 1500

**File:** `app/api/export/route.tsx:18-24,62,70`

**Issue:** `input` is bounded to `MAX_INPUT = 1500` and `MIN_INPUT = 8`, which is good. However `result.recommendation` and each `scenario.title`/`s.tag` have **no length bound at all** — a Creator can submit a multi-megabyte `recommendation` string. `StoryCard` clamps display via `WebkitLineClamp`, but Satori still parses/measures the full string, and `maxDuration = 30` is the only backstop. This is a mild resource/abuse vector on a rendering endpoint and compounds CR-01.

**Fix:** Bound the rendered strings server-side before passing to `StoryCard`, e.g. `recommendation.slice(0, 400)`, `title.slice(0, 120)`, and reject or clamp `scenarios.length > 3`.

### WR-05: No error handling around font `readFile`; missing asset yields opaque 500

**File:** `app/api/export/route.tsx:57-60`

**Issue:** `Promise.all([readFile(...Inter...), readFile(...InstrumentSerif...)])` throws if either font asset is missing at runtime (e.g., not bundled in the Vercel deployment, wrong `process.cwd()` on the Node runtime). There is no catch, so a deploy that drops the `assets/` files turns every export into a 500 with no actionable error. Given fonts are load-bearing for the whole feature, this deserves an explicit guard.

**Fix:** Wrap the font load (and render) in try/catch returning `{ error: "render_failed" }` with `status: 500`, and log the underlying error server-side so a missing-asset regression is diagnosable.

## Info

### IN-01: Landing "trust strip" implies user adoption that may not exist

**File:** `app/page.tsx:136-141`

**Issue:** "As trusted by early users in — Berlin / New York / London / Lisbon / Tokyo" asserts real geographic adoption. `Testimonials.tsx:20-21` explicitly documents its testimonials as "Pre-launch marketing copy," and the counter was deliberately reframed to an honest product truth (`Testimonials.tsx:6-9`). The trust strip is inconsistent with that honesty stance and, unlike the counter, is not caveated.

**Fix:** Align with the founder's honest-counter decision — soften to aspirational phrasing (e.g., "Built for people deciding in ...") or gate behind real data. Founder call; flagging for consistency.

### IN-02: Duplicated `TAG_STYLES` / `styleFor` across `ResultView` and `StoryCard`

**File:** `components/ResultView.tsx:13-36`; `components/StoryCard.tsx:5-13`

**Issue:** Two independent tag-style maps + identical `styleFor` fallback logic. They intentionally differ (Tailwind classes vs. inline hex for Satori), so full unification is not appropriate, but the fallback keys (`"Best Case"`, `"Likely"`, `"Worst Case"`) and the `?? Likely` behavior are duplicated and can drift.

**Fix:** Extract the tag key set / fallback contract to a shared constant in `lib/` and keep the two style tables as thin per-renderer maps over it.

### IN-03: Duplicated magic constants for input bounds across client and server

**File:** `app/api/export/route.tsx:13-14` (`MIN_INPUT=8`, `MAX_INPUT=1500`); `components/SimulateForm.tsx:51` (`< 8`), `139` (`maxLength={1500}`), `144` (`/ 1500`)

**Issue:** The 8 / 1500 bounds are hardcoded in three places (export route, simulate form validation, textarea attributes). Drift between client and server bounds would produce confusing 400s.

**Fix:** Centralize as exported constants (e.g., `lib/limits.ts`) and import in both the form and the route.

### IN-04: `test.environment: "node"` will break future DOM/JSX component tests

**File:** `vitest.config.ts:8`; `tests/export-render.test.ts:60-62`

**Issue:** The StoryCard test calls the component as a plain function (`StoryCard({...})`) to sidestep the lack of a DOM environment, and only asserts truthiness — it does not exercise rendering. That is acceptable for a Satori element tree, but the `node` environment means any future client-component test (`ResultView`, `ShareCard`, `Faq`, `Nav`, all `"use client"`) cannot mount. Note this is a scaffolding limitation, not a bug.

**Fix:** No change required now. When component-level tests are added, introduce `jsdom`/`happy-dom` via a per-file `// @vitest-environment` pragma so the node default stays for pure-lib tests.

### IN-05: `StoryCard` truthiness test does not actually validate Satori-safety

**File:** `tests/export-render.test.ts:59-63`

**Issue:** "renders without throwing given a sample SimulationResult" only constructs the element tree; it never runs Satori/`ImageResponse`, so it cannot catch Satori-specific violations (unsupported CSS, non-flex layout, `NaN%` widths from CR-01). The test gives false confidence that the card is render-safe.

**Fix:** If feasible, add a test that runs `@vercel/og`/`satori` against `StoryCard` with both valid and adversarial `result` inputs (empty scenarios, non-numeric probability) to lock in the CR-01 guard.

---

_Reviewed: 2026-07-01T12:58:11Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
