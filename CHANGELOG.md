<!-- SPDX-License-Identifier: CC-BY-4.0 -->

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

### Corrected before adoption
- [R-A-005] added: where `article21.applicability` is `none`, `marginDb` is also null.
  The previous worked example declared that no Article 21 row applied and then reported
  a margin against one. See DISPOSITIONS.md F-2.

### Verified 2026-08-23
- The two metering standards were checked first-party, closing OBJECTIONS.md O-7. The
  IEC citation was stale by an edition (2020 Ed. 2.0 supersedes 2003 Ed. 1.0 and adds
  class 0,1 S), both class lists were incomplete, and IEC 62053-22 turns out to apply to
  **type tests only** — which a meter class alone therefore cannot settle. [R-M-014]
  added: the legal metrology basis is declared separately, or declared absent.

### Known defects carried into this release
See `DISPOSITIONS.md`. In brief: metering accuracy classes cited from secondary
knowledge (blocks 0.2); no optical annex; local exposure below 6 GHz not addressed;
corridor check weak at GEO; CCSDS 902.1 profiling claim not schema-validated.