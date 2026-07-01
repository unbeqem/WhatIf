---
quick_id: 260701-nnc
status: complete
date: 2026-07-01
commit: cadd82c
---

# Quick Task 260701-nnc: Swap placeholder contact email + cosmetic domain — Summary

## What was done

Replaced the placeholder `hello@whatif.app` with the real contact `business@what-if.tech`
and swapped the cosmetic `whatif.app` → `what-if.tech`.

## Files changed

- `components/Footer.tsx` — Contact `mailto:business@what-if.tech`.
- `components/Faq.tsx` — GDPR contact `mailto:` + displayed text → `business@what-if.tech`.
- `components/StoryCard.tsx` — story-card footer → "what-if.tech — simulate your decision".

## Verification

- `grep` for `hello@whatif.app` / `whatif.app` across `.ts`/`.tsx` → no matches.
- `npx tsc --noEmit` → exit 0.
- `npm test` → 31/31 (includes the StoryCard rasterization guard).

## Notes

- Functional URLs unchanged — they resolve from `NEXT_PUBLIC_URL` (set to `https://what-if.tech` in Phase 4 env).
- The full Impressum/Datenschutz pages (Phase 4) will use the same `business@what-if.tech` contact.

## Self-Check: PASSED
