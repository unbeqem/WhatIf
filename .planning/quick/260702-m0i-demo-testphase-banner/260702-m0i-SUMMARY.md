---
quick_id: 260702-m0i
slug: demo-testphase-banner
date: 2026-07-02
status: complete
files_changed: [components/DemoBanner.tsx, app/layout.tsx]
commit: 222d4c7
---

# Summary: Site-wide test-phase banner

**Founder request:** Mark somewhere that the site is in a test/demo phase and payment processing doesn't work for real yet.

**Implementation:** New client component `components/DemoBanner.tsx` — a slim, dismissible top bar rendered site-wide via `app/layout.tsx` (before `{children}`, above the sticky Nav). Text (DE, matching the existing checkout notice): "Testphase · Zahlungen laufen im Testmodus – es wird nichts real abgebucht." Dismissal persists in `localStorage` (`whatif:demo-banner-dismissed`). Uses existing tokens (border-border-hi, bg-surface, text-fg-soft, violet→magenta dot) — no new tokens.

**Wording accuracy:** Kept honest — only payments are test-mode; simulations (OpenAI) and auth run live. Did NOT claim the whole site is a demo.

**Decision override:** This overrides CONTEXT D-10 ("discreet checkout-only notice, no site-wide banner, keep landing clean for TikTok"). Founder explicitly requested a visible site-wide marker. Banner is dismissible so it doesn't permanently clutter shared TikTok links.

## Verification
- `npx tsc --noEmit` → exit 0.
- `npx next build` → exit 0.
- Layout: banner is in normal flow above the `sticky top-0` Nav → shows stacked at top, scrolls away on scroll while Nav sticks; no overlap.

## Notes
- Executed inline (small UI addition); worktrees disabled for this project.
- Follow-up raised by founder (separate task): general page lag / non-smooth scroll + animations — to investigate (likely fixed backdrop-blur + noise/mix-blend overlays + motion/BackgroundOrbs cost).
