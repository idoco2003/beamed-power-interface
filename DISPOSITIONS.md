<!-- SPDX-License-Identifier: CC-BY-4.0 -->

# Comment dispositions

Every substantive comment received on this specification is recorded here with a
disposition of `accepted`, `rejected` or `deferred`, and a reason — including comments
arguing the document is misconceived.

This is how recognised bodies resolve comments. It costs one file, and it is the
difference between publishing a draft and publishing a draft you intend to change.

**RFC period for 0.1 closes 2026-11-30.**

## How to comment

Open an issue, or a pull request against `OBJECTIONS.md` if your comment is an argument
rather than a defect. Comments received privately will be recorded here in summarised
form unless you ask otherwise; if you would rather not be named, say so and we will
record the substance without attribution.

## Dispositions

| # | Date | From | Comment | Disposition | Reason |
|---|---|---|---|---|---|
| — | — | — | *No comments received yet. This table is populated as they arrive.* | — | — |

## Findings from implementation

Things that only appeared when an implementation was checked against the schemas.
`OBJECTIONS.md` §O-1 says a specification with one implementation has not found the
ambiguities that only appear at an interface; these are the ones that appeared anyway.

| # | Date | Finding | Outcome |
|---|---|---|---|
| F-1 | 2026-08-22 | A broker attempted to draft a `SpaceSegmentCapability` on an operator's behalf. The schema rejected it: `ratedDeliveryPower_kW` carries `exclusiveMinimum: 0` and the broker had no value to supply. | **Schema upheld, implementation changed.** A transmitter that delivers zero kilowatts is not a space segment, and a capability whose every power-and-timing field is a placeholder is an empty form. The asymmetry is real and worth stating in the specification: a broker can usefully pre-fill a `ReceivingSegmentCapability` from curated site facts, and has no standing to draft an SSC at all. Considered for §4.1 as a note in 0.2. |
| F-3 | 2026-08-23 | First-party verification of the two metering standards found the IEC citation stale by an edition and both class lists incomplete, and surfaced that IEC 62053-22 covers type tests only. | **[R-M-012] rewritten, [R-M-014] added.** A meter class may no longer be presented as evidence that a reading is valid for trade; the legal metrology basis is now declared separately or declared absent. See OBJECTIONS.md O-7. |
| F-2 | 2026-08-22 | The worked attestation example declared `article21.applicability: "none"` with `rowRef: null` while reporting `marginDb` computed against a row. | **Specification corrected before adoption.** A margin is a distance from a limit; declaring no limit applies and then reporting a distance from one is incoherent. Added [R-A-005], made `marginDb` null when applicability is `none`, and corrected the example to `analogue` with the row named and labelled as not governing. |

## Self-identified defects carried into 0.1

These were found by the authors before publication and are recorded here so they are not
mistaken for oversights.

| # | Defect | Where | Blocks |
|---|---|---|---|
| D-1 | ~~Metering accuracy classes cited from secondary knowledge~~ **Resolved 2026-08-23**, see F-3. Residual: ANSI C12.20's currency unconfirmed. | §6.2 [R-M-012] | — |
| D-2 | No optical annex | `spec/annex-opt.md` | Coverage of ~half the field |
| D-3 | Local exposure below 6 GHz not addressed | §7.3 | Any L3 claim at 5.8 GHz |
| D-4 | Corridor check weak at GEO | §5.6 | GEO deployments |
| D-5 | Profiling claim against CCSDS 902.1 not schema-validated | §1.4 | Interop with SSF tooling |