---
quick_id: 260703-fdy
title: Brand mark — favicon (tab icon) + TikTok profile picture
date: 2026-07-03
status: complete
commit: da0d278
---

# Quick Task 260703-fdy — Summary

## What changed

Turned the Nav brand mark (violet→magenta→cyan gradient + white "?") into assets:

- **`app/icon.svg`** — tab favicon; Next.js App Router auto-serves it (build emits
  `/icon.svg`). Rounded square, scalable.
- **`app/apple-icon.png`** — 180×180 rounded touch icon (build emits `/apple-icon.png`).
- **`public/whatif-tiktok.png`** — 1024×1024 full-bleed profile picture; no rounded
  corners so TikTok's circular crop reads as a clean gradient disc with the "?".
- **`scripts/generate-brand-assets.mjs`** — regenerates the PNGs from the mark via
  `sharp` (already a transitive dep).

## Verification

- `npx next build` — compiled successfully; emits `/icon.svg` and `/apple-icon.png`
- Rendered PNGs visually confirmed (centered white "?" on brand gradient)

## For the founder

- **TikTok profile pic:** `public/whatif-tiktok.png` (1024²). Upload as-is; TikTok
  crops to a circle.
- **Tab icon:** live automatically once deployed (currently unpushed).
