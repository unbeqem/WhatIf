---
phase: 03-polish-new-features
verified: 2026-07-01T15:10:00Z
status: human_needed
score: 5/5 must-haves verified
overrides_applied: 0
human_verification:
  - test: "Open a generated story-card PNG (POST /api/export as a Creator or in demo mode) at actual pixel size / TikTok overlay scale"
    expected: "1080x1920 PNG; WhatIf wordmark, the user's question (>=64px), the recommendation, and 3 scenario tags/probabilities are all legible when the card is viewed as a phone-screen TikTok overlay"
    why_human: "next/og ImageResponse rasterization requires the full Next.js runtime; legibility at overlay scale is a visual judgment call, not something grep/tsc/vitest can assert (per plan's own <verification> section, this was always flagged as the founder's manual check)"
  - test: "On /result, view the actions row as a free/anon (non-subscriber) user and resize to md breakpoint"
    expected: "Ask another question / Pro upsell / ShareCard Creator-upsell tiles sit cleanly in a 3-column row"
    why_human: "Confirmed defect exists in code (see WR-01 below) — grid is md:grid-cols-3 but children sum to 4 column-units (1 + 2 col-span-2 + 1), so ShareCard wraps to a second row under 'Ask another question' instead of completing the row. Needs a human/visual call on whether this is acceptable before ship or needs the one-line fix from 03-REVIEW.md."
---

# Phase 3: Polish + New Features Verification Report

**Phase Goal:** Landing page converts harder, example prompts feel TikTok-native, and Creator subscribers get a real differentiator (shareable 9:16 story card).
**Verified:** 2026-07-01T15:10:00Z
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Landing page has a visible FAQ addressing privacy, accuracy, refund, GDPR in plain language | VERIFIED | `components/Faq.tsx` — 4 `ITEMS` rows cover all 4 topics verbatim from the spec; mounted at `app/page.tsx:311-326` as `<section id="faq">` between Pricing and Final CTA; GDPR row has a real `mailto:hello@whatif.app` link (line 25) |
| 2 | Landing page shows 3-5 testimonial cards + a counter that animates on scroll, readable in a screen recording | VERIFIED | `components/Testimonials.tsx` — `TESTIMONIALS` array has 3 entries (within 3-5 range); `CounterStrip` uses `useInView({once:true})` + `requestAnimationFrame` easeOut count-up 0→`FUTURES_PER_DECISION`(3), `useReducedMotion()` branch snaps to final value; mounted at `app/page.tsx:227-242` `<section id="proof">` between Demo and Pricing |
| 3 | /decision shows ~8 visceral example prompts; /result "Share this simulation" upsells free users to Creator | VERIFIED | `components/SimulateForm.tsx:8-17` — `EXAMPLES` array has exactly 8 high-stakes first-person prompts (old set of 5 fully replaced); `components/ShareCard.tsx` mounted in `ResultView.tsx:202` (`<ShareCard input={input} result={result} me={me} />`) — renders Creator-upgrade CTA (`UpgradeButton plan="creator"`) for free/pro/anon, download button for creator plan |
| 4 | Creator user on /result clicks "Download story card" and gets a 9:16 PNG branded with logo + question, readable at TikTok overlay scale | VERIFIED (code) / NEEDS HUMAN (visual legibility) | `app/api/export/route.tsx` returns `ImageResponse` at `width:1080, height:1920` with `Content-Disposition: attachment; filename="whatif-simulation.png"`; `StoryCard.tsx` renders wordmark ("What"+"If"), the curly-quoted `input` at `fontSize:68` (>=64 required), `result.recommendation`, and 3 scenario tag/probability rows using bundled fonts (`assets/Inter-SemiBold.ttf` 68060B, `assets/InstrumentSerif-Regular.ttf` 70012B, both verified genuine TrueType via `file`). Actual pixel-scale legibility cannot be asserted by static analysis — flagged for human check |
| 5 | /api/export returns HTTP 402 with upsell payload for free and Pro users, never silent failure | VERIFIED | `lib/export-gate.ts` `exportGateDecision()` returns 402 + `{error:"upgrade_required", plan, upsell:{target:"creator",price:"€9/mo",href:"/#pricing"}}` for any plan !== "creator" and !demoMode; `app/api/export/route.tsx:52-55` calls it and returns `NextResponse.json(gate.body, {status: gate.status})`; unit-tested in `tests/export-gate.test.ts` (5/5 cases green: creator-ok, free-402, pro-402, demoMode-null-ok, non-demo-null-plan-402-free) |

**Score:** 5/5 truths verified at the code level. 1 item (visual legibility, truth #4) requires human confirmation before full sign-off; 1 layout defect (below) needs a human decision on whether it blocks ship.

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `app/api/export/route.tsx` | Node.js runtime export route: creator-gate + 402 + ImageResponse PNG | VERIFIED | `runtime="nodejs"` (line 10), `maxDuration=30` (line 11), imports `ImageResponse` from `next/og`, calls `exportGateDecision`, `if (supabaseAdmin)` null-guard present (line 40), fonts read via `readFile`+`assets/*.ttf` (no network fetch), `git diff package.json` empty |
| `components/StoryCard.tsx` | Satori-safe 1080x1920 card JSX, inline styles, hex colors | VERIFIED | 195 lines; zero `className=`; zero `backdrop-filter`; every multi-child container has `display:"flex"`; gradient text uses solid fallback colors per plan instruction |
| `lib/export-gate.ts` | Pure `resolveExportPlan`/gate decision, unit-testable | VERIFIED | Exports `exportGateDecision`; no Supabase import; 5/5 unit tests pass |
| `components/ShareCard.tsx` | Client Share/Download control: POSTs payload, branches on 402, downloads blob | VERIFIED | `"use client"`, `res.status === 402` branch before `res.blob()`, download-link-click blob flow, loading/success/error states, `UpgradeButton plan="creator"` upsell branch |
| `assets/Inter-SemiBold.ttf` | Bundled Inter font binary | VERIFIED | 68060 bytes, `file` reports TrueType Font data |
| `assets/InstrumentSerif-Regular.ttf` | Bundled Instrument Serif font binary | VERIFIED | 70012 bytes, `file` reports TrueType Font data |
| `components/Faq.tsx` | Accordion FAQ, 4 objection rows, motion panel, aria-expanded | VERIFIED | 85 lines; `aria-expanded`/`aria-controls`/`ChevronDown` present; `useReducedMotion()` branch renders panel unanimated |
| `components/Testimonials.tsx` | Scroll-animated honest counter + 3-5 testimonial cards | VERIFIED | 116 lines; `useInView`; `FUTURES_PER_DECISION` referenced 3x; 3 `TESTIMONIALS` entries; zero occurrences of "10,247"/"decisions simulated" |
| `components/SimulateForm.tsx` | EXAMPLES array expanded to ~8 prompts | VERIFIED | Exactly 8 entries, old 5-prompt set fully replaced, "Need a starting point?" lead-in preserved |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `components/ResultView.tsx` | `components/ShareCard.tsx` | import + mount in bottom action grid | WIRED | `import ShareCard from "@/components/ShareCard"` + `<ShareCard input={input} result={result} me={me} />` at line 202 |
| `components/ShareCard.tsx` | `/api/export` | fetch POST, branch on 402 before blob | WIRED | `fetch("/api/export", {method:"POST", ...})` then `if (res.status === 402) {...; return;}` before `await res.blob()` |
| `app/api/export/route.tsx` | `supabaseAdmin.profiles.plan` | createSupabaseServerClient + supabaseAdmin.from("profiles").select("plan") | WIRED | Exact `/api/me` pattern reproduced with the `if (supabaseAdmin)` guard; partial-config (admin null) falls through to plan "free" → 402, never a null-deref |
| `app/page.tsx` | `components/Faq.tsx` | import + `<section id="faq">` between Pricing and Final CTA | WIRED | Confirmed at lines 8, 311-326 |
| `app/page.tsx` | `components/Testimonials.tsx` | import + `<section id="proof">` between Demo and Pricing | WIRED | Confirmed at lines 7, 227-242 |
| `components/Nav.tsx` | `/#faq` | LINKS array entry | WIRED | `LINKS` array has exactly 4 entries including `{ href: "/#faq", label: "FAQ" }` |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|---------------------|--------|
| `app/api/export/route.tsx` | `plan` | `supabaseAdmin.from("profiles").select("plan")` (live DB query) or `demoMode` fail-open | Yes — real Supabase read when configured; documented, tested fail-open in demo mode | FLOWING |
| `components/StoryCard.tsx` | `input`, `result.recommendation`, `result.scenarios` | POST body forwarded unmodified from `ShareCard` (which reads live `sessionStorage` data via `ResultView`) | Yes — renders the user's actual simulation, not static/mock data | FLOWING |
| `components/Testimonials.tsx` | `count` | `useInView` + rAF tied to real scroll position; `TESTIMONIALS`/`FUTURES_PER_DECISION` static seed constants (intentional per plan — "can be seeded for launch") | Yes (counter is dynamic on scroll; testimonial content is intentionally static seed data, matching CONTENT-02's explicit allowance) | FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Export gate decision logic (creator/free/pro/demo/null-plan) | `npm test` → `tests/export-gate.test.ts` (5 cases) | All 5 assertions pass | PASS |
| StoryCard element construction doesn't throw on valid input | `npm test` → `tests/export-render.test.ts` | Passes; renders truthy element | PASS |
| Route contract (`runtime`, `maxDuration`, `width`/`height`) present in source | `npm test` → `tests/export-render.test.ts` | Passes | PASS |
| Full test suite | `npm test` | 3 files, 21/21 tests pass | PASS |
| Typecheck | `npx tsc --noEmit` | Exit 0, no errors | PASS |
| Production build | `npm run build` | Compiles; `/api/export` registered as dynamic route; all pages generate | PASS |
| No new dependency added | `git log --oneline -5 -- package.json` | Last touch predates phase 3 (`1be0117` vitest install, phase 02-era) | PASS |
| Actual PNG rasterization / TikTok-scale legibility | N/A — requires full runtime, visual judgment | Not run | SKIP → routed to human verification |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| CONTENT-01 | 03-02 | Landing FAQ (privacy, accuracy, refund, GDPR) | SATISFIED | `components/Faq.tsx`, mounted `app/page.tsx:311-326` |
| CONTENT-02 | 03-02 | Testimonials/social-proof block, 3-5 cards | SATISFIED | `components/Testimonials.tsx` (3 cards), mounted `app/page.tsx:227-242` |
| CONTENT-03 | 03-02 | ~8 visceral /decision example prompts | SATISFIED | `components/SimulateForm.tsx` EXAMPLES (8 entries) |
| CONTENT-04 | 03-01 | /result "Share this simulation" affordance, links free users to Creator upgrade | SATISFIED (with WR-01 layout caveat) | `components/ShareCard.tsx` mounted in `ResultView.tsx`; functions correctly, but the surrounding grid layout has a column-math defect (see Anti-Patterns) |
| EXPORT-01 | 03-01 | Creator downloads 9:16 story card PNG | SATISFIED | `app/api/export/route.tsx` + `StoryCard.tsx`, `ImageResponse` at 1080x1920, filename `whatif-simulation.png` |
| EXPORT-02 | 03-01 | Card shareable/branded, readable at TikTok overlay scale | SATISFIED (code) / NEEDS HUMAN (visual) | Wordmark, question ≥64px, recommendation, 3 scenario tags/probabilities all present in `StoryCard.tsx`; actual rasterized legibility not verifiable by static analysis |
| EXPORT-03 | 03-01 | Endpoint gated to creator, 402 + upsell for lower plans | SATISFIED | `lib/export-gate.ts` + route wiring; 5/5 unit tests green |

No orphaned requirements — all 7 IDs (CONTENT-01..04, EXPORT-01..03) declared across the two plans' `requirements` frontmatter and independently verified above.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `app/api/export/route.tsx` | 20-29, 62 | CR-01 (carried from 03-REVIEW.md, unresolved): `result.scenarios` elements and `result.recommendation` are shape-checked only at the top level (`Array.isArray`, `typeof === "string"`) — element contents (`title`, `tag`, `probability`) are never validated. A shape-valid-but-malformed payload (e.g. `probability` as an object) reaches `Math.round()` → `NaN` → an invalid `width: "NaN%"` style inside `ImageResponse`, with no try/catch around the render (confirmed: only `.catch()` on `req.json()`, nothing wraps `new ImageResponse(...)` or the font `readFile`s). | WARNING (not BLOCKER per environment note — gate/402/render contract is present and unit-tested for the trusted/well-formed path; this is an untrusted-input hardening gap, not a missing feature) | An authenticated Creator (or anyone in demo mode) sending a malformed-but-shape-valid body can trigger an unhandled 500 with a possible stack-trace leak on a payment-gated endpoint |
| `components/ResultView.tsx` | 159, 176, 202 | WR-01 (carried from 03-REVIEW.md, unresolved): actions grid is `md:grid-cols-3` when `showUpsell` is true, but children sum to 4 column-units ("Ask another" =1, Pro-upsell `md:col-span-2` =2, ShareCard =1). `ShareCard` wraps to a second row instead of completing the row. | WARNING | Visual layout defect for the exact audience CONTENT-04 targets (free/anon users) — the Creator upsell tile still renders and is still clickable, just not laid out as a clean single row. Routed to human verification below. |
| `components/ShareCard.tsx` | 59, 35-38 | WR-02 (carried from 03-REVIEW.md, unresolved): the 402→upsell branch (`setUpsell(true)`) is only reachable if a client believing itself `creator` gets rejected by the server — non-creator viewers never see a download button, so they never POST and never hit 402 through the UI. | INFO | Defense-in-depth for plan desync, not a broken feature — EXPORT-03's server-side 402 contract is independently verified via direct route/gate testing, unaffected by this UI reachability note |
| `components/ShareCard.tsx` / `components/ResultView.tsx` | WR-03 (carried) | Client trusts `/api/me`'s `plan` field to decide which tile renders; a `useMe()` fetch failure collapses to `plan: null` (non-subscriber UI) even for a real Creator | INFO | Edge case (API failure), server gate remains authoritative so no revenue/security impact, only a degraded UX on `/api/me` outage |
| `app/api/export/route.tsx` | WR-04 (carried) | No length bound on `result.recommendation` / scenario `title`/`tag` strings beyond the 8-1500 bound on `input` alone | INFO | Mild resource-abuse vector on a rendering endpoint, compounds CR-01 |
| `app/api/export/route.tsx` | WR-05 (carried) | No try/catch around font `readFile` — a missing/misdeployed asset produces an opaque 500 | INFO | Deploy-time regression risk, not a functional gap today (fonts verified present and valid on disk) |
| `app/page.tsx` | 134-142 | IN-01 (carried): "trusted by early users in Berlin/NY/London/Lisbon/Tokyo" trust strip is uncaveated, sitting alongside a testimonials section explicitly documented as "pre-launch marketing copy" | INFO | Founder-call on content-honesty consistency; not a functional or requirement gap |

### Human Verification Required

### 1. Story-card PNG legibility at TikTok overlay scale

**Test:** POST a real `{ input, result }` payload to `/api/export` as a Creator user (or in demo mode where Supabase is unconfigured), save the returned PNG, and view it at the size it would appear as a TikTok/Reels/Stories overlay (roughly phone-screen scale, not full-resolution zoom).
**Expected:** WhatIf wordmark, the user's question (rendered ≥64px per spec), the recommendation, and all 3 scenario tags with probability bars are legible without zooming — matching EXPORT-02's "readable at TikTok overlay scale" bar.
**Why human:** `next/og` `ImageResponse` requires the full Next.js server runtime to rasterize; legibility is a visual/perceptual judgment that cannot be asserted via grep, tsc, or vitest. The plan's own `<verification>` section flags this as a founder manual check, not an automatable one.

### 2. Actions-grid layout on /result for free/anon users

**Test:** Load `/result` with a sample simulation as a logged-out or free-tier viewer at the `md` breakpoint and above; observe the bottom actions row (Ask another question / Pro upsell / Creator upsell via ShareCard).
**Expected:** All three tiles complete a clean single row.
**Why human:** Confirmed in code that the grid is `md:grid-cols-3` while its children sum to 4 column-units (1 + `col-span-2` + 1), so `ShareCard` wraps to a second row under "Ask another question" rather than sitting beside the Pro upsell. This is a real, reproducible CSS-grid math defect (not a guess) — flagging for a human ship/no-ship call and, if "no-ship," a one-line fix is already specified in `03-REVIEW.md` (WR-01): change to `md:grid-cols-4` when `showUpsell`, or lift the upsell block out of the grid.

### Gaps Summary

No must-have truths failed outright — all 5 phase success criteria have working code-level implementations, all artifacts exist/are substantive/are wired, all key links are connected, and 21/21 automated tests plus `tsc`/`build` are green. The phase goal is achieved at the code level.

Two items prevent an unconditional "passed": (1) EXPORT-02's overlay-scale legibility is inherently a visual check that no static tool can perform — this was anticipated by the plan itself and is not a defect, just an outstanding manual step; (2) a real, reproducible CSS-grid layout bug (WR-01, carried unresolved from 03-REVIEW.md) causes the free/anon actions row to wrap awkwardly rather than complete cleanly — the Creator upsell/download affordance is still present and functional, but the intended one-row layout is broken. Per the environment note, CR-01 (the untrusted-input crash path on `/api/export`) is noted but does not by itself block goal achievement, since the gate/402/render contract is present and unit-tested for the trusted path.

Because both outstanding items require a human decision (visual sign-off on the PNG; ship/no-ship call on the grid wrap) rather than being clean automated failures, status is `human_needed` rather than `gaps_found`.

---

_Verified: 2026-07-01T15:10:00Z_
_Verifier: Claude (gsd-verifier)_
