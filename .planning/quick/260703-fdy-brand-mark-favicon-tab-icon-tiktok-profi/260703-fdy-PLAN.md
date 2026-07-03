---
quick_id: 260703-fdy
title: Brand mark — favicon (tab icon) + TikTok profile picture
date: 2026-07-03
status: in-progress
---

# Quick Task 260703-fdy — Brand mark assets

## Problem

The site has no favicon (nothing in the browser tab) and no standalone logo file
the founder can upload as a TikTok profile picture. The brand mark exists only as
inline JSX in `Nav.tsx` (gradient rounded square + "?").

## Solution

Codify the mark as reusable assets, matching the Nav gradient (violet #a855f7 →
magenta #ec4899 → cyan #22d3ee, 135°) and white "?":

1. `app/icon.svg` — Next.js App Router auto-serves this as the tab favicon
   (rounded square, scalable, browser-rendered text).
2. `app/apple-icon.png` — 180×180 rounded, for iOS "add to home screen".
3. `public/whatif-tiktok.png` — 1024×1024 full-bleed gradient + big "?" (no
   rounded corners, so TikTok's circular crop reads as a clean gradient disc).
4. `scripts/generate-brand-assets.mjs` — regenerates the PNGs from SVG via sharp,
   for reproducibility.

## Verify

- `npx next build` emits an icon for `/` (no build errors)
- `public/whatif-tiktok.png` opens as a 1024² gradient with a centered white "?"
