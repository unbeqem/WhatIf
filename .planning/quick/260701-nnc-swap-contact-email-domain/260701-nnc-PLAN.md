---
quick_id: 260701-nnc
type: quick
date: 2026-07-01
---

# Quick Task 260701-nnc: Swap placeholder contact email + cosmetic domain

## Objective

Replace the placeholder contact email `hello@whatif.app` (which is live on the
public site but isn't a real, owned inbox) with the founder's real IONOS mailbox
`business@what-if.tech`, and swap the cosmetic domain string `whatif.app` →
`what-if.tech`. Per Phase 4 CONTEXT D-09 / D-11. No functional URL changes —
those flow through `NEXT_PUBLIC_URL`.

## Task

- `components/Footer.tsx` — Contact `mailto:` → `business@what-if.tech`.
- `components/Faq.tsx` — GDPR contact `mailto:` href + displayed link text → `business@what-if.tech`.
- `components/StoryCard.tsx` — story-card footer "whatif.app — simulate your decision" → "what-if.tech — …".

## Verify

- `grep -rn "hello@whatif.app\|whatif.app" --include=*.tsx --include=*.ts` returns nothing.
- `npx tsc --noEmit` clean; `npm test` green (render guard rasterizes StoryCard).
