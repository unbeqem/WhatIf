---
status: partial
phase: 03-polish-new-features
source: [03-VERIFICATION.md]
started: 2026-07-01T15:15:00Z
updated: 2026-07-01T15:15:00Z
---

## Current Test

[awaiting human testing]

## Tests

### 1. Story-card PNG legibility at TikTok overlay scale (EXPORT-02)
expected: POST /api/export as a Creator (or in demo mode) returns a 1080x1920 PNG; the WhatIf wordmark, the user's question (>=64px), the recommendation, and the 3 scenario tags/probabilities are all legible when the card is viewed as a phone-screen TikTok overlay.
result: [pending — legibility eyeball only]
note: During this check a render CRASH was found and fixed (commit e199c18): the question `<div>` used display:-webkit-box but had 3 children (curly quotes + input), which Satori rejects, so /api/export returned 500 on every Creator download. Fixed by collapsing to a single string child. The render path is now covered by an automated rasterization test (tests/export-render.test.ts, 31/31 green) that produces a non-empty PNG. Only the visual legibility judgment remains for the founder.

### 2. /result actions row layout for free/anon users
expected: On /result as a free/anon (non-subscriber) user at the md breakpoint, the "Ask another question" / Pro upsell / ShareCard Creator-upsell tiles sit cleanly (no broken wrap). WR-01 fix applied (commit 72c333b): Ask + Pro upsell (col-span-2) fill row 1; ShareCard now takes md:col-span-3 as a clean full-width second row. Build/tsc/tests green.
result: resolved (fixed in code — founder chose "fix first")

## Summary

total: 2
passed: 1
issues: 0
pending: 1
skipped: 0
blocked: 0

## Gaps
