---
quick_id: 260702-l7d
slug: plan-aware-pricing-cta
date: 2026-07-02
status: complete
files_changed: [components/PricingCta.tsx, app/page.tsx]
commit: d17289c
---

# Summary: Plan-aware pricing CTAs on landing page

**Bug (founder-reported):** Logged in as Pro, the landing-page pricing section still showed a clickable "Go Pro" on the Pro card instead of indicating the current plan.

**Root cause:** Phase 2 (02-05) made Nav/Account/ResultView plan-aware, but the landing pricing section (`app/page.tsx`) rendered `<UpgradeButton>` unconditionally. All other `UpgradeButton` call sites (account, ResultView, PaywallNotice, ShareCard) are already context-gated (never shown to subscribers), so this was the only non-plan-aware surface.

**Fix:** New client component `components/PricingCta.tsx` reads `useMe()` and decides per tier:
- `me` loading / anonymous / free → normal `<UpgradeButton>` (checkout) — keeps the acquisition path instant for the common case.
- current plan === tier → disabled **"Current plan"**.
- current plan > tier (e.g. Creator viewing the Pro card) → disabled **"Included in your plan"**.
- current plan < tier (e.g. Pro viewing the Creator card) → real `<UpgradeButton>` upgrade.

`app/page.tsx` now imports `PricingCta` instead of `UpgradeButton` and renders `<PricingCta plan={tier.cta.plan} label={tier.cta.label} />` in the pricing grid. Disabled state uses existing tokens (border-border-hi, bg-surface, text-fg-soft) — no new tokens, no design change.

## Verification
- `npx tsc --noEmit` → exit 0.
- `npx next build` → exit 0 (landing page still static-prerendered; PricingCta is a client island).
- Other `UpgradeButton` surfaces untouched (already gated) — no regression.

## Notes
- Executed inline (small, well-understood UI fix); worktrees disabled for this project.
- Minor accepted tradeoff: a logged-in subscriber may see the checkout button for ~1 frame before `useMe()` resolves to "Current plan". Anonymous visitors (the common case) see the correct CTA immediately.
