# Changelog

Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
Versioning per `GOVERNANCE.md` — MAJOR breaks the wire, MINOR adds, PATCH is editorial.

## [0.1.0-draft] — 2026-08-22

Initial publication as a Request for Comments.

### Added
- BPI-C core information model, 13 messages, JSON Schemas for each.
- BPI-S safety interlock: the enable-token dead-man, state machine, pointing authority,
  ramp and abort semantics, per-mode fail-safe table.
- BPI-M metering and settlement, with cause-code attribution and a dispute ladder.
- BPI-A regulatory and exposure attestation, including the mandatory `unclaimed[]`
  negative declaration.
- BPI-CONF conformance framework: role × level × annex, with `not-claimed` as a
  first-class status.
- Annex RF (normative), including grating-lobe declaration and screening.
- Annex OPT (reserved) — states what is missing rather than gesturing at it.
- `gap-analysis.md`, dated and sourced.
- `OBJECTIONS.md` with eight objections, five of them open and unanswered.

### Normative requirement set
110 identifiers: C 33, S 27, RF 15, M 14, A 12, SEC 5, CONF 4. See
`conformance/checklist.json`.

### Known defects carried into this release
See `DISPOSITIONS.md`. In brief: metering accuracy classes cited from secondary
knowledge (blocks 0.2); no optical annex; local exposure below 6 GHz not addressed;
corridor check weak at GEO; CCSDS 902.1 profiling claim not schema-validated.
