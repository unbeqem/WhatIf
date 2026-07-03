---
quick_id: 260703-k5w
title: Harden simulate pipeline against malformed LLM output
date: 2026-07-03
status: complete
commit: 79cb8b8
---

# Quick Task 260703-k5w — Summary

Fixed the "free account → nothing comes back / blank page" failure mode.

Diagnosis (read-only prod inspection): API + auth + quota all healthy; the gap was
zero validation of the LLM's JSON. A single malformed model response (missing
`scenarios`) would 200 through and crash `/result`'s `scenarios.map` → white page.

Changes: shared `isValidSimulation` (lib/validate-simulation.ts, +6 tests); server
throws a clean retryable error on bad shape (lib/openai.ts); client validates before
redirect + 40s timeout (SimulateForm); `ResultView` shows a retry card for bad
stored data; `app/result/error.tsx` route error boundary as a final safety net.

tsc clean · vitest 51 passed · next build OK · commit 79cb8b8.

Note: could not reproduce the exact user symptom blind (asked for the precise
symptom; no response). This hardens every plausible path from malformed output;
if the user still sees an issue, the next signal needed is the browser-console
error / the /api/simulate HTTP status at the moment of failure.
