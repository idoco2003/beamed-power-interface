<!-- SPDX-License-Identifier: CC-BY-4.0 -->

# §2 Conventions

## 2.1 Requirement keywords

The key words **MUST**, **MUST NOT**, **REQUIRED**, **SHALL**, **SHALL NOT**,
**SHOULD**, **SHOULD NOT**, **RECOMMENDED**, **MAY** and **OPTIONAL** are to be
interpreted as described in BCP 14 (RFC 2119, RFC 8174) when, and only when, they appear
in all capitals.

Every normative requirement carries a stable identifier in the form **[R-x-nnn]**, where
`x` is the part letter. Identifiers are never reused or renumbered; a withdrawn
requirement is marked withdrawn and its number retired. `conformance/checklist.json`
enumerates exactly the identifiers that appear in this specification, and a build check
fails if the two sets differ.

## 2.2 Time

**[R-C-001]** All timestamps SHALL use CCSDS 301.0-B-4 ASCII Time Code A in UTC with
millisecond resolution and a mandatory trailing `Z`:

```
YYYY-MM-DDThh:mm:ss.sssZ
```

**[R-C-002]** A segment SHALL declare `clockSource` and `maxClockOffsetMs`, and SHALL
NOT enter `DELIVERING` while its declared offset exceeds one tenth of the active
profile's `tokenLifetimeS`.

*Rationale: a safety deadline evaluated against a clock that may be wrong by an
appreciable fraction of that deadline is not a deadline. GNSS disciplining gives
offsets around 10 ms, three orders below a 5 s lifetime, so this bound is generous.*

## 2.3 Position and reference frames

**[R-C-003]** Positions SHALL be WGS-84 geodetic, in decimal degrees, and SHALL carry
an explicit height reference:

```json
{ "latDeg": 67.8833, "lonDeg": 21.0667, "height_m": 341.0,
  "heightRef": "orthometric", "geoidModel": "EGM2008" }
```

**[R-C-004]** `heightRef` SHALL be present on every `GeodeticPoint`. `geoidModel` SHALL
be present when `heightRef` is `orthometric`.

*Rationale: surveyed site elevations are normally orthometric — height above mean sea
level — while the geometry that points a beam wants ellipsoidal height. The two differ
by tens of metres. For an aim point that is not a rounding error, and a schema that
permits the omission guarantees somebody eventually conflates them.*

## 2.4 Angles

**[R-C-005]** Azimuth SHALL be degrees from **true** north, clockwise, in [0, 360).

**[R-C-006]** Elevation SHALL be degrees above the **local ellipsoid horizon** — the
plane normal to the WGS-84 ellipsoid at the site — not above the geocentric radial
horizon.

*Rationale: the ellipsoid normal and the geocentric radial differ by up to 0.19° at
mid-latitudes. That is a real pointing error at a beam mask, and it is the difference
between a surveyed latitude and a geocentric one.*

## 2.5 Units

SI throughout, with two admitted exceptions and one derived unit defined exactly.

| Quantity | Unit | Field suffix |
|---|---|---|
| Power | kilowatt | `_kW` |
| Energy | kilowatt-hour, defined as exactly 3.6 MJ | `_kWh` |
| Distance | metre; kilometre where stated | `_m`, `_km` |
| Time interval | second | `_s`, `_ms` |
| Angle | degree | `Deg` |
| Power flux-density | dB(W/m²) | `_dBW_m2` |
| Incident power density | W/m² | `_W_m2` |
| Frequency | gigahertz; hertz for bandwidth | `_GHz`, `_Hz` |

### The no-bare-number rule

**[R-C-007]** A physical quantity SHALL NOT appear without the measurement conditions
that give it meaning, in the same object.

Concretely, and enforced by the schemas rather than by good intentions:

- **[R-C-008]** A power flux-density SHALL carry `refBandwidthHz`.
- **[R-C-009]** An incident power density compared against an exposure limit SHALL
  carry `averagingTimeS` and `averagingAreaCm2`.
- **[R-C-010]** An efficiency SHALL carry `numeratorPoint` and `denominatorPoint`, each
  naming a declared measurement point, and `pathLength_m`.

*Rationale: −140 dB(W/m²) means nothing until you know whether it is in 4 kHz or 1 MHz.
10 W/m² means nothing until you know whether it is averaged over 6 minutes or 30, and
over 1 cm² or 30. "70% efficient" means nothing until you know which two points. A schema
that accepts a bare number invites the ambiguity.*

*[R-C-010] is known to be the wrong shape and is being rewritten for 0.2. Naming two
endpoints is a weaker form of requiring the stage decomposition already published in the
literature, which the specification should profile rather than reinvent — see
`OBJECTIONS.md` O-10 and `DISPOSITIONS.md` C-1. It is left in force here because a weak
requirement is better than none while the replacement is written.*

## 2.6 Provenance

**[R-C-011]** Every field carrying a physical value SHALL carry a sibling provenance
field named by appending `_prov`, with one of:

| Value | Meaning |
|---|---|
| `measured` | An instrument read this, at the time stated |
| `derived` | Computed from measured inputs by a declared method |
| `estimated` | Modelled, assumed, or taken from a nameplate figure |
| `declared` | Asserted by the party, with no measurement behind it |

**[R-C-012]** A `MeteringRecord` containing any `estimated` or `declared` value in the
settled energy path SHALL NOT settle without explicit countersignature of that specific
field by both parties (§6.3).

*Rationale: this is the difference between a figure a counterparty can rely on and one
they must argue about, and it costs one string per number to make it machine-readable
instead of a footnote.*

## 2.7 Identifiers, versioning and signatures

**[R-C-013]** Every message SHALL carry the common envelope:

```json
{ "bpiVersion": "0.2.0-draft",
  "msgType": "EnableToken",
  "msgId": "018f3a...",
  "issuedAt": "2026-08-22T06:12:00.000Z",
  "issuer": { "org": "...", "orgId": "...", "role": "RECEIVING" },
  "sig": { "alg": "Ed25519", "keyId": "...", "value": "..." } }
```

**[R-C-014]** `msgId` SHALL be a UUID; UUIDv7 is RECOMMENDED so that identifiers sort by
creation time.

**[R-C-015]** Signatures SHALL be detached JWS using Ed25519 over the RFC 8785
canonicalisation of the message with the `sig.value` member absent.

**[R-C-016]** A segment SHALL declare its signing keys, a rotation interval, and a
revocation endpoint in its capability message.

**[R-C-017]** A receiver of any message SHALL reject it if the signature does not
verify, if `bpiVersion` has a MAJOR component it does not implement, or if `issuedAt` is
further from local time than the declared `maxClockOffsetMs` plus the transport's
declared latency budget.