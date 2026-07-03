---
quick_id: 260703-fmi
title: Move compare submit button below Path B
date: 2026-07-03
status: complete
commit: 10d4e2b
---

# Quick Task 260703-fmi — Summary

Fixed misplaced compare action button. In `components/SimulateForm.tsx` the
submit button now renders in Path A's footer only in single mode ("Simulate");
in compare mode it's a right-aligned "Compare paths →" button below the Path B
box. tsc clean, 45/45 tests pass. Commit 10d4e2b.
