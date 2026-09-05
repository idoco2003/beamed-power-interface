<!-- SPDX-License-Identifier: CC-BY-4.0 -->

# Changelog

Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
Versioning per `GOVERNANCE.md` — MAJOR breaks the wire, MINOR adds, PATCH is editorial.

## [0.2.0-draft] — unreleased, tags 2026-11-30

**MAJOR, and not by choice.** `GOVERNANCE.md` defines MAJOR as a change that breaks an
existing conformant implementation on the wire, and two requirements did exactly that.
The version was bumped when the second one landed rather than at release, because until
then two different requirement sets were both calling themselves `0.1.0-draft`, and
`bpiVersion` on the wire could not tell a peer which one it was talking to.

Schemas moved to `schemas/0.2/`, so every `$id` changes.

The authoritative account of what changed is
[`conformance/requirement-diff.md`](conformance/requirement-diff.md), which is generated
from the requirement set on every build and refuses to be produced while any text change
is unclassified. This section summarises it; that file is the record.

### Changed — breaks the wire
- **`R-A-002`** now requires `article21.rowRef` to name the row wherever `applicability`
  is not `none`. An implementation emitting `null` everywhere satisfied 0.1.0-draft.
- **`R-M-012`** widened the permitted accuracy classes to include 0,1 S / 0.1, and now
  requires the record to carry the standard and edition the class is claimed under. A
  metering record conformant with 0.1.0-draft can be missing that edition.

### Added
- **`R-A-005`** — where `applicability` is `none`, `marginDb` SHALL also be `null`.
- **`gridInterconnection` on `ReceivingSegmentCapability`, and `[R-C-036]`.** What the
  receiving plant is connected to, and which interconnection standard it claims: IEEE
  1547-2018, IEC 61727, EN 50549, `other`, `none` for an islanded plant, or `unstated`
  where the issuer is not the plant operator and cannot speak for it. A declaration only.
  §0 hands interconnection *behaviour* to IEEE 1547 and IEC TC 8 and this does not take it
  back; what no interconnection standard says is which one a given receiver is claiming,
  and without that `maxDownRamp_kW_per_s` is a number with no provenance.
- **`GRID_CURTAILMENT_ORDERED` and `GRID_CURTAILMENT_ELECTED` cause codes, and
  `[R-M-033]`.** The general `GRID_CURTAILMENT` is retained for the case where the
  distinction is genuinely unknown. All three default to the receiving bearer, so this
  changes what must be shown rather than who pays: an ordered curtailment SHALL carry
  `evidenceRef` naming the network operator's instruction, because it is the only cause on
  the list that implicates a third party who could have refuted it at the time.

- **`R-M-014`** — a meter accuracy class SHALL NOT be presented as evidence that a
  particular meter's readings are valid for trade.

### Added — machinery rather than requirements
- `reference/` — the BPI-S interlock as executable code, with signed conformance vectors
  in `conformance/vectors/`. The author's own, so it does not close `OBJECTIONS.md` O-1.
- `IPR.md` and `IPR-DISCLOSURES.md` — disclosure duty and a royalty-free commitment.
- `tools/check-consistency.sh`, `tools/gap-staleness.mjs`, `tools/gen-coverage.mjs`,
  `tools/gen-requirement-diff.mjs`.

### Fixed
- The efficiency-comparability argument, withdrawn 2026-08-24, was still standing in the
  normative rationale of §2.5 and §6.3. `tools/retracted.json` now fails the build if a
  withdrawn claim reappears.

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
- `OBJECTIONS.md` with ten objections, eight of them open, one with no mitigation offered.

### Normative requirement set
114 identifiers: C 34, S 27, M 16, RF 15, A 13, SEC 5, CONF 4. See
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

### Fixed 2026-08-23
- Schema `$id`s moved from `https://bpi.spec/…` to a URL that resolves. `.spec` is not an
  IANA top-level domain, so the previous identifiers could never be dereferenced.

### Known defects carried into this release
See `DISPOSITIONS.md`. In brief: no optical annex; local exposure below 6 GHz not
addressed; corridor check weak at GEO; CCSDS 902.1 profiling claim not schema-validated.

The metering accuracy classes were verified first-party on 2026-08-23 and are no longer
a known defect — see DISPOSITIONS F-3. One residual remains: ANSI C12.20's current
status is unconfirmed because the pages carrying it return 403, so O-7 stays open on
that point alone.
