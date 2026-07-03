---
created: 2026-07-03T08:45:05.000Z
title: OG / link-preview image
area: ui
files:
  - app/opengraph-image.tsx (new)
  - app/layout.tsx
---

## Problem

Shared links (TikTok bio, DMs, socials) show plain text — looks unprofessional and
wastes the click. High funnel leverage.

## Solution

Add `app/opengraph-image.tsx` using `next/og` ImageResponse (reuse the Inter/
Instrument Serif fonts + brand gradient from the StoryCard/export setup) — 1200x630
with the mark, product name, and claim. Wire twitter image too. Verify metadata
emits the og:image.
