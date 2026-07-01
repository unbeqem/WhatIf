# Phase 3: Polish + New Features - Research

**Researched:** 2026-07-01
**Domain:** Server-side 9:16 PNG image generation in Next.js 16 App Router (+ light content/landing work)
**Confidence:** HIGH (export path), HIGH (content path)

## Summary

Phase 3 has one real technical unknown — the Creator-tier 9:16 story-card PNG — and four content pieces (FAQ, testimonials, example prompts, Share affordance) that are standard React/Tailwind and need no research beyond noting the existing plumbing.

For the story card, the open decision "`<canvas>` client-side vs `@vercel/og` server-side" resolves cleanly in favour of **`next/og`'s `ImageResponse` running in a Node.js-runtime route handler**. `ImageResponse` is already bundled with the Next.js 16 App Router (no install), supports arbitrary output dimensions (1080×1920), custom fonts via `ArrayBuffer`, embedded images via data URI, and — critically — is fully supported with `return new Response(…)` in **`app/` + Node.js runtime** [CITED: vercel.com/docs/og-image-generation]. The Node.js runtime is exactly what we need anyway, because EXPORT-03 requires reading `profiles.plan` via `supabaseAdmin` to gate the endpoint, and that server-only client cannot run on edge. One runtime, one route, no native-dependency headaches (no `node-canvas`), and it deploys to Vercel unchanged in Phase 4.

**Primary recommendation:** Build `app/api/export/route.ts` (`runtime = "nodejs"`), gate to `plan === "creator"` using the exact `createSupabaseServerClient` + `supabaseAdmin` pattern already in `app/api/me/route.ts` and `lib/quota.ts`. On success render a 1080×1920 `ImageResponse` (`Content-Type: image/png`); for `free`/`pro` return HTTP 402 + JSON upsell. The client POSTs the sessionStorage payload (`{ input, result }`) to the route — no DB persistence needed. Bundle Inter + Instrument Serif `.ttf` files under `assets/` and read them with `fs.readFile`; do not fetch fonts at render time. "Branding" is a styled text wordmark (there is no logo asset today), optionally an inline SVG.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Story-card PNG render | API / Backend (Node.js route) | — | Needs `supabaseAdmin` (server-only) to gate on plan; Satori render is CPU work best kept server-side; produces `image/png` |
| Creator plan gate (EXPORT-03) | API / Backend | — | Plan lives in `profiles` DB; must be server-authoritative, never client-trusted |
| Download trigger + upsell modal | Browser / Client | — | Button on `/result`; reads `useMe()` for plan; POSTs payload, saves returned blob |
| FAQ / testimonials / prompts | Frontend (Server Components) | Client (counter animation) | Static content; only the animated counter needs `"use client"` + motion/react |
| Share affordance | Browser / Client | — | Interactive; `useMe()` decides Creator-download vs Creator-upsell |

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `next/og` (`ImageResponse`) | bundled with `next@16.2.9` | JSX+CSS → PNG server-side | Built into App Router, no install, Vercel-native, Node.js-runtime supported [CITED: vercel.com/docs/og-image-generation] |
| `motion` (motion/react) | `11.18.0` (installed) | Scroll-triggered counter animation (CONTENT-02) | Already the project's animation lib; `useInView` / `animate` cover the counter |
| `@supabase/ssr` + `supabase-js` | `0.12.0` / `2.110.0` (installed) | Read `profiles.plan` to gate export | Reuse existing `createSupabaseServerClient` + `supabaseAdmin` |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `lucide-react` | `0.469.0` (installed) | Icons for Share button, FAQ chevrons | Standard project icon set |

**No new dependencies required.** `ImageResponse` ships inside `next`. Do NOT add `@vercel/og`, `satori`, `@resvg/resvg-js`, `canvas`/`node-canvas`, `sharp`, or `html-to-image`.

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `next/og` (server) | Client `<canvas>` + `html-to-image` | Renders differently per browser/device, fonts flaky, no server gate on the *render* (only on a token), can't guarantee TikTok-scale legibility. Rejected. |
| `next/og` | `satori` + `@resvg/resvg-js` directly | Exactly what `next/og` wraps — reimplements bundled code, adds deps. Rejected. |
| `next/og` | `node-canvas` (imperative draw) | Native binary; Turbopack/Vercel build friction; hand-laid-out text wrapping is painful for a text-heavy card. Rejected. |
| `next/og` | `sharp` compositing | Great for resizing/compositing, not for laying out text from data. Wrong tool. Rejected. |

**Installation:** None. Verify at plan time:
```bash
npm view next version   # confirm 16.x — ImageResponse is bundled
```

**Version verification:** `next@16.2.9` installed [VERIFIED: package.json]. Registry latest matches [VERIFIED: npm view next → 16.2.9]. `@vercel/og` standalone is `0.11.1`, `satori` `0.26.0`, `@resvg/resvg-js` `2.6.2` [VERIFIED: npm view] — listed only to confirm we are NOT adding them.

## Architecture Patterns

### System Data Flow (story-card export)

```
/result (ResultView, "use client")
  sessionStorage["whatif:last"] = { input, result: SimulationResult, ts }
  useMe() -> { plan }
        │
        ├─ plan === "creator" ──► [Download story card] click
        │                              │  POST /api/export  { input, result }
        │                              ▼
        │                     app/api/export/route.ts  (runtime = "nodejs")
        │                       1. parse + validate body ({ input, result })
        │                       2. createSupabaseServerClient().auth.getUser()
        │                       3. resolve plan via supabaseAdmin.profiles  ◄── same as /api/me
        │                       4a. plan === "creator":
        │                             read Inter/Instrument .ttf (fs.readFile)
        │                             new ImageResponse(<Card/>, {width:1080,height:1920,fonts})
        │                             -> 200  Content-Type: image/png
        │                       4b. else:
        │                             -> 402  { error:"upgrade_required", upsell:{...} }
        │                              │
        │              client: res.blob() -> object URL -> <a download> click
        │
        └─ plan !== "creator" ──► [Share this simulation] shows Creator upsell (no POST)
```

The Component Responsibilities: `ResultView.tsx` gains the Share/Download control (or a small colocated client child); `app/api/export/route.tsx` owns render + gate; an `assets/` folder holds the font binaries.

### Pattern 1: Node.js OG route returning a PNG (not an og:image tag)

**What:** A route handler that returns the image directly for the browser to download, rather than an `<meta og:image>` source.
**When to use:** Our case — user-triggered download of their own simulation.
**Example:**
```tsx
// Source: https://vercel.com/docs/og-image-generation (app/ + Node.js runtime supports `return new Response`)
// app/api/export/route.tsx
import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";        // REQUIRED: supabaseAdmin is server-only, not edge-safe
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const input = typeof body?.input === "string" ? body.input : "";
  const result = body?.result;          // SimulationResult shape from sessionStorage
  if (!input || !result?.recommendation) {
    return NextResponse.json({ error: "bad_payload" }, { status: 400 });
  }

  // --- Gate: reuse the /api/me + lib/quota plan-read pattern ---
  const plan = await resolvePlan(); // getUser() -> supabaseAdmin.profiles.plan, default "free"
  if (plan !== "creator") {
    return NextResponse.json(
      {
        error: "upgrade_required",
        plan,
        upsell: { target: "creator", price: "€9/mo", href: "/#pricing" },
      },
      { status: 402 },
    );
  }

  const [inter, serif] = await Promise.all([
    readFile(join(process.cwd(), "assets/Inter-SemiBold.ttf")),
    readFile(join(process.cwd(), "assets/InstrumentSerif-Regular.ttf")),
  ]);

  return new ImageResponse(<StoryCard input={input} result={result} />, {
    width: 1080,
    height: 1920,
    fonts: [
      { name: "Inter", data: inter, weight: 600, style: "normal" },
      { name: "Instrument Serif", data: serif, weight: 400, style: "normal" },
    ],
  });
}
```

### Pattern 2: Demo-mode invariant

**What:** The project's rule that every route works with no env keys. `app/api/me/route.ts` already returns `plan: null` when `NEXT_PUBLIC_SUPABASE_URL` is unset; `lib/quota.ts` treats missing `supabaseAdmin` as "allow."
**For export:** Decide the demo behaviour explicitly (see Open Questions). The render itself has zero external dependencies, so it works keyless. The gate is the only Supabase touch. Recommended: when Supabase is unconfigured, treat the viewer as Creator so marketing recordings can capture the card — mirroring how `checkQuota` fails open in demo mode [VERIFIED: lib/quota.ts:53–55].

### Pattern 3: Client download from a POST blob

```tsx
// Source: standard Fetch/Blob download; project pattern (fetch in SimulateForm.tsx)
const res = await fetch("/api/export", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ input, result }),
});
if (res.status === 402) { /* show Creator upsell from res.json().upsell */ return; }
const blob = await res.blob();
const url = URL.createObjectURL(blob);
const a = document.createElement("a");
a.href = url; a.download = "whatif-story.png"; a.click();
URL.revokeObjectURL(url);
```

### Recommended Structure
```
assets/
├── Inter-SemiBold.ttf            # bundled font binaries (NOT public/, read via fs)
└── InstrumentSerif-Regular.ttf
app/api/export/route.tsx          # Node.js runtime; gate + ImageResponse
components/
├── StoryCard.tsx                 # pure JSX card (flexbox-only, Satori-safe) — imported by route
├── ShareCard.tsx                 # "use client" Share/Download control on /result
└── Faq.tsx / Testimonials.tsx    # server components (+ counter island)
```

### Anti-Patterns to Avoid
- **Using Tailwind classes inside the `ImageResponse` JSX** — Satori's Tailwind support is experimental. Use inline `style={{…}}` objects with hex colors from `app/globals.css` (`#a855f7`, `#22d3ee`, `#07060d`, etc.). [CITED: vercel.com/docs/og-image-generation]
- **Multiple children without `display: flex`** — a Satori element with >1 child must set `display: "flex"` or it errors. [CITED: github.com/vercel/satori]
- **Fetching fonts from Google at render time** — adds latency + a network failure mode on every export. Bundle `.ttf` and `fs.readFile`.
- **Setting `runtime = "edge"`** — breaks `supabaseAdmin` (server-only) and the `fs.readFile` font load. Node.js is correct here.
- **Trusting a client-sent `plan` flag** — always re-read the plan server-side in the route (client `useMe()` is for UI only).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Text layout / wrapping in the card | Manual `measureText` on canvas | `ImageResponse` (Satori flexbox + `lineClamp`) | Satori wraps and clamps text from a flex layout automatically [CITED: github.com/vercel/satori] |
| PNG encoding | Custom canvas→buffer | `ImageResponse` (Resvg inside) | Bundled, returns `image/png` directly |
| Plan gate | New gating helper | `createSupabaseServerClient` + `supabaseAdmin.profiles.plan` (as in `app/api/me/route.ts`) | Already battle-tested in Phase 1/2 |
| Client-side plan awareness | New fetch | `useMe()` / `isSubscriberPlan()` in `lib/useMe.ts` | Exists; drives Download-vs-upsell branch |

**Key insight:** Everything the export needs already exists in the codebase or inside `next`. The phase adds one route, one card component, two font files, and a UI control.

## Common Pitfalls

### Pitfall 1: Gradient text / `background-clip: text` in the card
**What goes wrong:** The site's signature look uses `gradient-text` (background-clip:text). Satori supports `backgroundClip: "text"` but it's the highest-risk CSS feature.
**How to avoid:** Prototype the headline early against the OG playground (og-playground.vercel.app). Have a solid-color fallback (`color: "#c084fc"`) ready. `box-shadow`, `border-radius`, `linear-gradient` backgrounds, `text-shadow`, and `rgba` are all safe [CITED: github.com/vercel/satori]. `backdrop-filter`/blur is NOT supported — the `.glow-*`/blur aesthetics from `globals.css` won't translate; fake glows with `box-shadow`.

### Pitfall 2: 500KB bundle limit
**What goes wrong:** JSX + CSS + fonts + inlined images must total < 500KB [CITED: vercel.com/docs/og-image-generation].
**How to avoid:** Two subsetted `.ttf` fonts + one small inline SVG wordmark stay well under. Do NOT inline a large PNG logo as a data URI. Prefer an SVG wordmark or plain styled text.

### Pitfall 3: Text-heavy card overflowing 1080×1920
**What goes wrong:** `result.recommendation` and `input` are free-form and can be long; overflow gets clipped or breaks layout.
**How to avoid:** Use `lineClamp` on the recommendation/question blocks and pick which fields render. A story card should show: the question (`input`), the headline recommendation (`result.recommendation`), and the three scenario tags+probabilities (`result.scenarios[].tag` / `.probability`) — NOT the full `short_term`/`long_term`/`reasoning` prose [VERIFIED: lib/types.ts]. Keep it glanceable at TikTok scale (EXPORT-02).

### Pitfall 4: Turbopack + reading files from `assets/`
**What goes wrong:** `process.cwd()`-relative reads can differ dev vs Vercel build.
**How to avoid:** `join(process.cwd(), "assets/…")` is the documented pattern and works on Vercel [CITED: nextjs.org ImageResponse docs]. Keep fonts in `assets/` (bundled), not `public/`. No native deps means no Turbopack binary issues.

### Pitfall 5: 402 handling in the client
**What goes wrong:** `fetch` doesn't throw on 402; naive `res.blob()` would try to treat the JSON upsell as an image.
**How to avoid:** Branch on `res.status === 402` before `res.blob()` (see Pattern 3). EXPORT-03 explicitly requires the 402 + upsell payload, not silent failure.

## Runtime State Inventory

Not applicable — Phase 3 is greenfield additive (new route, new components, content edits). No rename/refactor/migration. No stored data, live service config, OS-registered state, or build artifacts affected. New env/asset: two bundled `.ttf` files under `assets/` (source-controlled, not secrets).

## Code Examples

### Load a Google font server-side (fallback if not bundling .ttf)
```ts
// Source: https://vercel.com/kb/guide/using-custom-font — prefer bundling .ttf; this is the fallback.
async function loadGoogleFont(family: string, text: string): Promise<ArrayBuffer> {
  const css = await (await fetch(
    `https://fonts.googleapis.com/css2?family=${family}&text=${encodeURIComponent(text)}`,
  )).text();
  const url = css.match(/src: url\((.+?)\) format/)?.[1];
  if (!url) throw new Error("font url not found");
  return (await fetch(url)).arrayBuffer();
}
```
Recommended: bundle `.ttf` via `fs.readFile` (Pattern 1) — no render-time network, more reliable on Vercel.

### Satori-safe card skeleton
```tsx
// Source: https://github.com/vercel/satori#css (flexbox-only, inline styles, hex colors)
function StoryCard({ input, result }: { input: string; result: SimulationResult }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", width: "100%", height: "100%",
      backgroundColor: "#07060d", padding: 72, color: "#f5f3ff",
      fontFamily: "Inter", justifyContent: "space-between" }}>
      <div style={{ display: "flex", fontSize: 34, letterSpacing: 4, color: "#67e8f9" }}>WHATIF</div>
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div style={{ fontFamily: "Instrument Serif", fontSize: 64, lineHeight: 1.1 }}>“{input}”</div>
        <div style={{ marginTop: 48, fontFamily: "Instrument Serif", fontSize: 88,
          color: "#c084fc", lineHeight: 1.05 }}>{result.recommendation}</div>
      </div>
      <div style={{ display: "flex", gap: 24 }}>
        {result.scenarios.map((s, i) => (
          <div key={i} style={{ display: "flex", flexDirection: "column",
            border: "1px solid #271f4a", borderRadius: 20, padding: 24, flex: 1 }}>
            <div style={{ fontSize: 24, color: "#7d7aa3" }}>{s.tag}</div>
            <div style={{ fontSize: 48 }}>{Math.round(s.probability)}%</div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

## Content Pieces (light — one paragraph)

CONTENT-01 (FAQ: data privacy, accuracy disclaimer, refund policy, GDPR contact), CONTENT-02 (3–5 testimonial cards + scroll-animated counter), CONTENT-03 (~8 rewritten example prompts replacing the 5 in `components/SimulateForm.tsx` `EXAMPLES`), and CONTENT-04 (Share affordance on `/result`) are all standard Server Components / Tailwind v4, following the existing landing-section patterns in `app/page.tsx`. The only interactivity: the counter needs `"use client"` + `motion/react` (`useInView` + animated value), and the Share/Download control is a client child of `ResultView`. Plan-aware rendering is already solved — `useMe()` + `isSubscriberPlan()` from `lib/useMe.ts` decide whether CONTENT-04 shows the Creator download (Creator) or the Creator upsell (free/pro), exactly as `ResultView.tsx` already gates the Pro upsell block [VERIFIED: components/ResultView.tsx:42–43]. GDPR contact email available in context: tristan.keick@co-orga.de (confirm with founder before publishing).

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | No logo image asset exists; "WhatIf logo" = styled text/inline-SVG wordmark | Summary, Branding | LOW — plan should include creating/deciding a wordmark; branding still satisfiable |
| A2 | Client should POST the sessionStorage `{ input, result }` rather than persist + fetch by id | Endpoint shape | LOW — no history/persistence in v1 (HIST-* is v2); POST is simplest and matches "fades on tab close" design |
| A3 | Demo mode should treat unconfigured Supabase as Creator (allow render) for marketing | Pattern 2 | MEDIUM — founder may prefer demo to show the upsell instead; confirm |
| A4 | Card renders question + recommendation + 3 scenario tags/probabilities, not full prose | Pitfall 3 | LOW — design/legibility choice, easily adjusted |
| A5 | `backgroundClip:"text"` gradient headline will render acceptably in Satori | Pitfall 1 | MEDIUM — has solid-color fallback; verify in OG playground during planning |

## Open Questions (RESOLVED)

All three were closed by locked founder + research decisions at planning time (see planning CONTEXT decisions D1-D8). Kept here for traceability.

1. **Demo-mode export behaviour** — RESOLVED per **D5**: when Supabase is unconfigured (demo mode), ALLOW the render (treat the viewer as Creator) so marketing footage works, consistent with `checkQuota` fail-open. (Recommendation A3 accepted.)
2. **Logo asset** — RESOLVED per **D6**: reuse the existing brand mark (gradient "?" tile + "WhatIf" wordmark, "If" in violet-glow) as inline styled text/SVG in the card — no external/heavy PNG logo asset (stays under the 500KB OG budget).
3. **Which scenario data on the card** — RESOLVED per **D7**: the card shows the user's question (>=64px) + the recommendation + the 3 scenario tags with probabilities — NOT the full short_term/long_term/reasoning prose. Solid-color fallback for gradient text; no backdrop-filter/blur.

## Environment Availability

Skipped — Phase 3 adds no external runtime dependencies. `ImageResponse` is bundled in `next@16.2.9`; Supabase clients already wired (Phase 1). Font files are added to the repo. No new services, CLIs, or runtimes.

## Validation Architecture

Vitest is configured (`package.json` `test`/`test:watch`; used in Phase 2 for the reducer tests). Nyquist validation not explicitly disabled → included.

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest `4.1.9` [VERIFIED: package.json] |
| Config file | none detected — Vitest runs on defaults; add `vitest.config.ts` if needed (Wave 0) |
| Quick run command | `npm test` (`vitest run`) |
| Full suite command | `npm test` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| EXPORT-03 | free/pro → 402 + upsell payload; creator → 200 image/png | unit (mock supabaseAdmin) | `vitest run tests/export-gate.test.ts` | ❌ Wave 0 |
| EXPORT-01/02 | route returns `Content-Type: image/png`, non-empty body, 1080×1920 | integration/smoke | `vitest run tests/export-render.test.ts` | ❌ Wave 0 |
| CONTENT-03 | ~8 example prompts present in SimulateForm | unit (render/snapshot) | manual + lint | n/a |
| CONTENT-01/02/04 | sections render; counter animates; Share branches on plan | manual (visual, TikTok-scale) | manual | n/a |

Rendering fidelity (legibility at TikTok scale, EXPORT-02) is inherently a **manual visual check** — save a sample PNG and eyeball it. Automate only the contract (status codes, content-type, dimensions, gate logic).

### Sampling Rate
- **Per task commit:** `npm test`
- **Per wave merge:** `npm test`
- **Phase gate:** full suite green + one founder visual check of a generated PNG.

### Wave 0 Gaps
- [ ] `tests/export-gate.test.ts` — 402 vs 200 by plan (mock the plan resolver) — EXPORT-03
- [ ] `tests/export-render.test.ts` — content-type + dimensions smoke — EXPORT-01/02
- [ ] Bundle `assets/Inter-SemiBold.ttf` + `assets/InstrumentSerif-Regular.ttf` before render tests
- [ ] (optional) `vitest.config.ts` if path-alias resolution needs it

## Security Domain

`security_enforcement` not disabled in config → included.

### Applicable ASVS Categories
| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | yes | Reuse Supabase session (`createSupabaseServerClient().auth.getUser()`) — no new auth |
| V4 Access Control | yes | **Server-side** plan gate for EXPORT-03; never trust client `plan`. Re-read `profiles.plan` in the route. |
| V5 Input Validation | yes | Validate POST body shape (`input` string, `result` has `recommendation`/`scenarios`); reuse the 8–1500 char discipline from `/api/simulate` for `input`; cap payload size |
| V6 Cryptography | no | No new crypto |

### Known Threat Patterns
| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Free user forges request to get Creator export | Elevation of Privilege | Server re-reads plan from DB; 402 for non-creator |
| Oversized/malicious POST body (DoS via huge text) | Denial of Service | Enforce `MAX_INPUT` (1500) + reject unexpectedly large `result`; `maxDuration = 30` |
| Injected markup in `input`/`recommendation` rendered into image | Tampering | Satori renders text as text (no HTML injection into PNG); still validate/trim |
| Abuse of expensive render endpoint | Denial of Service | Consider reusing the per-IP burst guard (`lib/ratelimit.ts checkBurst`) on the export route |

## Sources

### Primary (HIGH confidence)
- [nextjs.org/docs/app/api-reference/functions/image-response] — ImageResponse params, width/height, custom fonts (`fs.readFile` + `fonts[]`), 500KB limit, ttf/otf/woff only, flexbox-only, Route Handler usage
- [vercel.com/docs/og-image-generation] — Node.js runtime support table (`app/` + Node.js supports `return new Response`), bundled with App Router (no install), Tailwind experimental, technical details
- [github.com/vercel/satori] — CSS support: linear-gradient, backgroundClip:text, box-shadow, border-radius, text-shadow, rgba, data-URI backgrounds, lineClamp; NO backdrop-filter; flex-for-multiple-children

### Secondary (MEDIUM confidence)
- [vercel.com/kb/guide/using-custom-font] — server-side Google font fetch → ArrayBuffer fallback pattern

### Codebase (VERIFIED)
- `package.json` (next 16.2.9, motion 11.18.0, vitest 4.1.9, no og/canvas deps)
- `lib/quota.ts` / `app/api/me/route.ts` (plan-read gate pattern, demo fail-open)
- `lib/types.ts` (SimulationResult shape), `components/ResultView.tsx` (sessionStorage payload, useMe upsell gating)
- `app/globals.css` (theme hex colors + fonts loaded via Google CDN link, not next/font), `app/layout.tsx`
- `lib/stripe.ts` (Creator = €9/900), `components/SimulateForm.tsx` (EXAMPLES to rewrite)

## Metadata

**Confidence breakdown:**
- Export render path (`next/og` Node.js route): HIGH — official docs confirm runtime + fonts + sizing; zero new deps
- Gate pattern: HIGH — copies existing verified code (`/api/me`, `lib/quota`)
- Satori CSS for the branded card: MEDIUM — gradient-text/glow effects need a playground check; safe fallbacks known
- Content pieces: HIGH — standard components, plumbing (useMe) already exists

**Research date:** 2026-07-01
**Valid until:** ~2026-08-01 (stable; `next/og` API steady across Next 13→16)
