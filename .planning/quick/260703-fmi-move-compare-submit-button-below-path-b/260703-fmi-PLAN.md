---
quick_id: 260703-fmi
title: Move compare submit button below Path B
date: 2026-07-03
status: complete
---

# Quick Task 260703-fmi

## Problem

In compare mode the "Compare paths" submit button sat inside Path A's footer
(between the Path A and Path B boxes), so it read as Path A's own button instead
of the end-of-form action for both paths.

## Solution

`components/SimulateForm.tsx`: render the in-box submit button only in single
mode ("Simulate"). In compare mode, drop it from Path A's footer (counter only)
and add a right-aligned "Compare paths →" button below the Path B box.

## Verify

- tsc clean, vitest green
- Compare mode: button appears under Path B; single mode unchanged
