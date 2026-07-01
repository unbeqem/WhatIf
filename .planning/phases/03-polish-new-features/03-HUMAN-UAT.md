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
expected: On /result as a free/anon (non-subscriber) user at the md breakpoint, the "Ask another question" / Pro upsell / ShareCard Creator-upsell tiles sit cleanly in a 3-column row (no wrap to a second row). NOTE: 03-REVIEW.md WR-01 confirms a defect here — grid is `md:grid-cols-3` but children sum to 4 column-units, so ShareCard currently wraps. Decide ship/no-ship or apply the one-line fix.
result: [pending]

## Summary

total: 2
passed: 0
issues: 0
pending: 2
skipped: 0
blocked: 0

## Gaps
