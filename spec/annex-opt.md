# Annex OPT (reserved) — BPI-OPT, optical / near-infrared physical layer

**Status: reserved and unwritten.** This annex exists to state precisely what is missing,
because a stub that gestures vaguely at future work is worse than no stub — it implies
the gap is small.

A segment **SHALL NOT** claim the `OPT` annex at version 0.1. There is nothing to claim.

## Why the RF annex cannot simply be rescaled

Every one of the following differs in kind, not in magnitude. An implementer who
produced optical numbers by analogy with Annex RF would be wrong in each case.

| Concern | RF | Optical — and why it is different |
|---|---|---|
| Exposure limit | ICNIRP / IEEE C95.1 incident power density | IEC 60825-1 laser classification and ANSI Z136 exposure limits. Different quantity, different averaging, different biological endpoint — the eye, not whole-body heating. |
| Safety distance | Keep-out volume from PFD screening | **Nominal Ocular Hazard Distance.** Structurally analogous to the exposure ratio but computed and averaged differently. |
| Aircraft | Avionics EMC threshold | Laser illumination of aircraft is governed by a **separate and considerably stricter** regime. It is not an EMC question at all. |
| Atmosphere | ITU-R P-series | **Not** the P-series. Requires a MODTRAN-class model or a stated alternative; cloud and scintillation dominate in a way rain does not. |
| Pointing reference | Pilot beam, retrodirective | Beacon or cooperative tracking. **The authenticated-pilot construction of [R-S-031] has no worked optical equivalent in this document.** |
| Probe level | 1/100 of public reference level | Unknown whether the same ratio is appropriate or safe. |
| Beam description | EIRP, aperture, taper | Wavelength, linewidth, M², beam waist, divergence, scatter and halo. |

## What the core already covers

The physical-layer-agnostic parts apply unchanged: the session lifecycle, the token
semantics and hash chain, abort semantics and reason codes, ramp semantics, the metering
model and provenance rules, frames and units, and the conformance framework. That is the
point of the split, and it is the reason this annex can be added later without disturbing
anything already written.

## When this needs a real author

**ARAQYS-D3 is scheduled to fly RF and optical power-beaming payloads under one
integrator in February 2027.** At that point a specification with only an RF annex covers
half of a single flight. That is the date by which this annex needs someone who actually
works in optical power beaming to write it, and this project does not have that person.

Contributions are wanted. See `CONTRIBUTING.md`.
