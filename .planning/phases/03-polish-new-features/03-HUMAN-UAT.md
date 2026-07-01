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
result: [pending]

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
