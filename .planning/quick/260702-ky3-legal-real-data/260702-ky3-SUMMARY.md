---
quick_id: 260702-ky3
slug: legal-real-data
date: 2026-07-02
status: complete
files_changed: [app/impressum/page.tsx, app/datenschutz/page.tsx]
---

# Summary: Impressum + Datenschutz real founder data

Replaced all placeholder markers in the two German legal pages with the founder's real details:

- **Name:** Paul Tristan Keick — Impressum § 5 DDG, Impressum § 18 Abs. 2 MStV, Datenschutz "Verantwortlicher".
- **Anschrift:** Helmsweg 30, 21073 Hamburg — Impressum § 5 DDG + Datenschutz "Verantwortlicher".
- **Telefon:** +49 1748391318 — new "Tel." line added under the email in the Impressum Kontakt block.

Contact email `business@what-if.tech` was already in place (from 04-01).

## Verification
- `grep PLACEHOLDER` on both files → 0 matches (no placeholders remain).
- `npx tsc --noEmit` → exit 0.
- German kept (legal correctness); no design/token changes; content-only.

## Notes
- Executed inline (deterministic replacement), not via planner/executor subagents — trivial content edit.
- Deferred (per Phase 4 CONTEXT): full AGB + Widerrufsbelehrung until real payments are accepted (post-Gewerbeanmeldung). Footer "Terms" → /impressum by design.
