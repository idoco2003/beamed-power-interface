<!-- SPDX-License-Identifier: CC-BY-4.0 -->

# §1 Introduction

## 1.1 What this specifies

The interface between a **space segment** that beams power and a **receiving segment**
that accepts it, where the two are operated by different organisations. It covers what
each side publishes about itself, how a delivery window is agreed, how the beam is kept
safe for as long as it is radiating, how much energy is recorded as delivered, and on
what regulatory basis the whole thing operates.

## 1.2 What this does not specify

- **The physical layer.** How energy is converted, radiated, propagated or rectified.
  Frequencies, apertures and waveforms appear only where an interface parameter needs
  them, and then only in an annex.
- **Hardware design.** No requirement here constrains how a transmitter or a rectenna
  is built, only what it declares and how it behaves at the interface.
- **The space link.** BPI does not respecify spacecraft command and telemetry. See §3.2.
- **Licensing, permitting or pricing.** §7 provides a vocabulary for *declaring* a
  regulatory basis; it does not create one. Commercial terms are out of scope and
  belong in a contract — see §1.5.
- **Certification.** There is no test authority and no accreditation. See §8.3.

## 1.3 Why this is not already covered

Summarised here; the dated, sourced version is [`gap-analysis.md`](../gap-analysis.md),
which is maintained and re-checked.

- The only ITU-R **Recommendation** on RF-beam wireless power transfer, SM.2151-0, is
  scoped to mobile and portable devices and sensor networks.
- ITU-R **Report** SM.2392-2 surveys the field and names the bands in use. A Report
  recommends nothing and binds nothing.
- The Radio Regulations carry **no Article 21 space-to-Earth power flux-density row**
  for 5.8 GHz.
- **WRC-27 has no agenda item** for space-based solar power or wireless power transfer.
- IEEE **ICES lists no active projects**.
- **CCSDS has no power-related work**; its adjacent output is navigation and comms.
- No national regulator surveyed has an open wireless-power proceeding.

Meanwhile at least seven programmes are flying or funding power beaming across two
incompatible physical layers, with one 2027 flight carrying both. That is the condition
in which interfaces get frozen by accident, one bilateral integration at a time.

## 1.4 Relationship to existing specifications

BPI **profiles and reuses** existing work wherever it exists, and invents only where
nothing does. Each row states how far this document actually goes, using the vocabulary
`implemented | consumed | emitted | vocabulary | profiled`.

> **A profiling claim that has not been validated against the other specification's own
> schema or test suite is stated as such in this table.** It is the most common way a
> draft specification misleads without meaning to.

| Specification | Used for | Depth | Validated? |
|---|---|---|---|
| CCSDS 301.0-B-4 Time Code Formats | All timestamps, ASCII Code A | emitted | Format followed; not tested against a CCSDS validator |
| CCSDS 502.0-B-3 (OEM) | Ephemeris exchange for scheduling | consumed | Information model only |
| CCSDS 902.1-B-1 Simple Schedule Format | Concepts behind §4.4–4.7; the `POWER_DELIVERY` service type | profiled | **Not** validated against the published XSD |
| CCSDS 902.0-B-2 (SCCS-SM), 911.x/912.x (SLE) | Named as the existing booking and transfer services BPI does not replace | vocabulary | Nothing executed |
| NGA.STND.0036 WGS-84 | All positions and the local horizon | implemented | Ellipsoid only; no geoid model shipped |
| RFC 2119 / RFC 8174 | Requirement keywords | implemented | — |
| RFC 8785 JSON Canonicalization | Signature canonicalisation | implemented | — |
| RFC 7946 GeoJSON | Aperture and keep-out polygons | profiled | Geometry subset only |
| ICNIRP 2020; IEEE C95.1-2019 | Exposure reference levels in §7.3 and Annex RF | consumed | Limit values cited; **not** an exposure assessment |
| ITU Radio Regulations Art. 21 §21.16 | PFD screening in §7.2 | consumed | Screening only; see the `applicability` field |
| ITU-R P.525-5, P.618-14, P.676-13, P.837-8, P.838-3, P.839-4 | Atmospheric models named in Annex RF | vocabulary | Named as declarable model references, not implemented here |
| IEC 62053-22:2020 (Ed. 2.0) / IEC 62052-11:2020 / ANSI C12.20 | Revenue meter accuracy classes in §6.2 | consumed | Class designations and scope verified 2026-08-23 against the issuing bodies' catalogue entries. ANSI C12.20's current status (reportedly merged into C12.1) is **unconfirmed** — see `OBJECTIONS.md` §O-7 |
| IEEE 1547 | Named as the reason §5.5 separates beam ramp from plant ramp | vocabulary | Nothing executed |

## 1.5 Relationship to a commercial agreement (informative)

BPI is the wire. It is not the paper.

A delivery relationship between two organisations needs both: a technical interface that
makes the beam safe and the energy countable, and a contract that says who bears the cost
when energy does not arrive. This specification deliberately stops at the boundary. §6.4
attributes every second of shortfall to a **cause code** and offers a *default* cost
bearer; which party actually bears it is a commercial term that the agreement sets and
may override.

The intended seam is narrow and explicit: the `MeteringRecord` of §6.3 is the artefact a
contract settles against, and the cause codes of §6.4 are the vocabulary its curtailment
clause uses. A reader building the contract side should treat those two as the interface
and ignore the rest.