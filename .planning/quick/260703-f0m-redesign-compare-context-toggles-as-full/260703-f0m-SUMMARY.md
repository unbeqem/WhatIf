---
quick_id: 260703-f0m
title: Redesign compare/context toggles as full-width option rows
date: 2026-07-03
status: complete
commit: 48110a8
---

# Quick Task 260703-f0m — Summary

## What changed

`components/SimulateForm.tsx`: the two feature toggles under the decision input
(previously tiny all-caps `text-fg-mute` text links, easy to miss) are now a
single bordered card with two full-width `OptionRow`s:

- Icon chip (lucide `Scale` for compare, `Sparkles` for context)
- Readable sentence-case title + one-line description
- Right-aligned badge (`Pro` / `optional`) + `Plus`/`Minus` indicator
- Active state (compareMode / showContext) tints the row and highlights the icon + indicator

Behavior unchanged: non-subscriber compare click still opens the upsell (now
rendered below the card), the context row still expands the ChipRow panel. New
`OptionRow` helper; no state/logic changes.

## Verification

- `npx tsc --noEmit` — clean
- `npx vitest run` — 45 passed (4 files)

Chosen from a 3-option AskUserQuestion (segmented pills / option rows / brighter
links); user picked full-width option rows.
