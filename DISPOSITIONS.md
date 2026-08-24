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

| # | Date | From | Comment | Disposition |
|---|---|---|---|---|
| C-1 | 2026-08-23 | RF power-beaming engineer, private correspondence (attribution offered, not yet given) | "This spec presumes optical wavelength and photovoltaics — RF solutions do not have this issue." | **Accepted in part.** See below. |

### C-1 in full

The comment arrived in response to the efficiency-comparability argument in §6, and it
has two halves that resolve differently.

**Rejected on the facts: the specification does not presume optical.** Annex RF is the
normative physical-layer annex. Annex OPT is a stub which states that a segment SHALL
NOT claim it at 0.1 because there is nothing to claim, and which exists to list what it
cannot yet answer — NOHD, laser aircraft rules, the atmospheric model. No wavelength or
photovoltaic assumption appears anywhere in the normative text. That the comment was
made at all is a finding about the writing rather than the content: if an RF engineer
reads this document and concludes it is an optical spec, something in the framing is
doing that, and the authors have asked which part.

**Accepted on the substance: the motivating example was poorly chosen.** The example
set Virtus Solis's ARPA-E target of ≥70% "end to end, source to delivered DC" at 200 m
against Xidian's 20.8% DC-to-DC at 100 m, and called them incomparable. If "source to
delivered DC" means DC in to DC out, those are the *same* measurement class, the
comment is correct, and DOE's description of the target as "roughly a 4× improvement on
the highest-efficiency DC-to-DC systems to date" is internally consistent rather than a
category error. An earlier draft of this file and of the outreach around it asserted
the opposite. That assertion was wrong.

**Resolved 2026-08-24, by the same commenter.** The methodology already exists in the
literature: *Power Beaming: History, Theory, and Practice* (Jaffe, Nugent, Strassner II
and Szazynski, World Scientific, 2024, ISBN 9789811243103), which sets out a subsystem
decomposition where the product of the stage efficiencies yields the total, and whose
stated purpose is to establish a common nomenclature for assessing power beaming
systems. The commenter's reading of the ARPA-E figure is that quoting DC-to-DC is a way
of characterising that end-to-end product.

That makes [R-C-010] and [R-M-023] the wrong shape rather than merely incomplete.
Requiring an efficiency to name two endpoints is a weaker form of requiring the
decomposition, and the decomposition also answers the geometry objection below without
a separate rule, because beam coupling is one of the stages. **The requirement will be
rewritten to profile the published methodology rather than to invent a parallel one.**
Blocked on reading the source first: this project does not carry a method it has not
read, which is the same rule that flagged the metering accuracy classes in O-7.

**A second, larger finding.** `gap-analysis.md` surveyed standards *bodies* — ITU-R,
IEEE, CCSDS, ICNIRP, the FCC — and did not survey the engineering literature. A 2024
textbook explicitly written to establish common nomenclature is prior art that the
specification should profile, and it was missed because the search was scoped to
publishers of standards rather than to sources of convention. A published method is not
a standard, but a specification that reinvents one has failed its own stated rule of
reusing existing work wherever it exists. Recorded as `OBJECTIONS.md` O-10.

**The geometry question, now subsumed.** DC-to-DC alone does not
fix a system's geometry. The two results above were obtained with a 4 m transmitter
into a 4 m receiver at 200 m, and a 1.2 m transmitter into a 5.2 m rectenna at 100 m.
Beam coupling depends on the aperture-range product, so two DC-to-DC figures still do
not separate component efficiency from coupling geometry. [R-C-010] currently requires
`numeratorPoint`, `denominatorPoint` and `pathLength_m`; it does not require the
apertures. Under the decomposition above this stops being a separate requirement:
coupling is one of the stages, so declaring the chain declares the geometry's effect
without naming apertures at all. Tracked for 0.2 as part of the §6 rewrite.

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