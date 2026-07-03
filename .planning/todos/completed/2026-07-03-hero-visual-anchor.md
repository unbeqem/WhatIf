---
created: 2026-07-03T08:45:04.000Z
title: Hero visual anchor (animated result preview)
area: ui
files:
  - app/page.tsx
---

## Problem

The hero is text + buttons only. A visual anchor would instantly convey what the
product does.

## Solution

Add a small animated preview beside/below the hero copy — three probability bars
filling in (best/likely/worst) with labels, looping subtly. Purely decorative,
no data; reuses the brand gradients. Must stay responsive and not hurt LCP.
