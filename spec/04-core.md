# §4 BPI-C — Core information model

Thirteen messages. Each is defined here by purpose and key fields; the authoritative
field list, types and constraints are in `schemas/0.1/`.

| # | Message | Direction | Purpose |
|---|---|---|---|
| 1 | `SpaceSegmentCapability` | space → published | What a supplier can do |
| 2 | `ReceivingSegmentCapability` | receiving → published | What a receiver can accept |
| 3 | `AttestationBundle` | either → published | Regulatory and exposure basis, and its gaps |
| 4 | `DeliveryOpportunity` | space → receiving | Windows that could be served |
| 5 | `DeliveryRequest` | receiving → space | What is wanted |
| 6 | `DeliveryCommitment` | space → receiving | The binding window |
| 7 | `WindowAmendment` | either | Move, shrink, cancel, preempt |
| 8 | `EnableToken` | receiving → space | The dead-man (§5) |
| 9 | `SessionState` | space → receiving | Declared state and radiated power |
| 10 | `PointingReference` | receiving → space | Pointing authority (§5.4) |
| 11 | `Abort` | either | Stop |
| 12 | `MeteringRecord` | receiving → space, countersigned | The settleable artefact (§6) |
| 13 | `SessionLog` | either | Signed telemetry around a non-nominal event |

## 4.1 SpaceSegmentCapability

Published once and re-issued on change. Key fields:

- `segmentId`, `orbitRegime` (`LEO | MEO | GEO | HEO | OTHER`)
- **`ephemerisSource`** — `GNSS_ONBOARD | OD_SOLUTION | SGP4_GP` — and
  `positionAccuracy_m` (1σ). Load-bearing for §5.4.
- `phy[]` — which annexes this segment implements
- `ratedDeliveryPower_kW`, `minPower_kW`, `probeLevelPower_kW`
- `rampUpMax_kW_per_s`, `rampDownMax_kW_per_s`, `abortToSafe_ms`, `defocusToSafe_ms`
- `commandPath` — `{ service, latencyMs_p50, latencyMs_p99, availability, continuous }`
- `timingProfiles[]` — which of `FAST | STANDARD | RELAXED` it supports
- `clockSource`, `maxClockOffsetMs`
- `keys[]`, `keyRotationDays`, `revocationUrl`
- `attestationRef` — hash of the current `AttestationBundle`

**[R-C-030]** `abortToSafe_ms` SHALL be the segment's *measured* worst case, not a design
target, and SHALL carry `_prov`. A segment that has not measured it SHALL declare
`estimated` and SHALL NOT claim conformance level L3.

## 4.2 ReceivingSegmentCapability

- `apertureId`, `aimPoint` (`GeodeticPoint`), `apertureBoundary` (GeoJSON polygon,
  WGS-84), `apertureArea_m2`
- `beamMaskDeg` with **`maskBasis`** — `declared | computed` — and `maskModelRefs[]`
  naming the propagation models behind a computed value
- `acceptPower_kW`, `maxDownRamp_kW_per_s` (the plant's tolerance, §5.5)
- `meteringPoints[]` (§6.1)
- **`keepOutVolume`** — GeoJSON polygon plus `ceiling_m`, and `intruderSpeedMax_m_s`
- `sensors[]` — what actually watches the keep-out volume, each with type and coverage
- `safetyAuthority` — `{ org, contact, eStopPresent, eStopWiredToIssuer }`
- `settlementIntervalMin` ∈ {5, 15, 30, 60}
- `attestationRef`

**[R-C-031]** `keepOutVolume` SHALL satisfy the dead-man buffer requirement of
[R-S-024]. A capability message whose declared volume is smaller than the buffer its own
declared `intruderSpeedMax_m_s` and timing profile imply is invalid.

**[R-C-032]** A receiving segment SHALL declare `maskBasis`. Where `computed`, it SHALL
name the models used. A mask presented without its basis is a number with no argument
behind it.

## 4.3 AttestationBundle

Defined in §7. Referenced from both capability messages by hash so that a capability and
the regulatory basis it was published under cannot drift apart silently.

## 4.4 DeliveryOpportunity

Windows a supplier *could* serve. **An opportunity is never a commitment.**

```
windows[]: { aos, los, maxElDeg, aosAzDeg, losAzDeg,
             rateProfile[]: { t, kW }, rateBasis, rateModelRefs[],
             predictedEnergy_kWh, predictedEnergy_kWh_prov, confidence,
             conditions[] }
```

**[R-C-033]** `predictedEnergy_kWh` SHALL carry `_prov`, which SHALL be `estimated` or
`derived` — never `measured`, since the window has not happened.

This message profiles the CCSDS 902.1 Simple Schedule Format information model, with
`serviceType` `POWER_DELIVERY_OPPORTUNITY`. It is **not** validated against that
specification's published schema; see §1.4.

## 4.5 DeliveryRequest

`energyRequested_kWh`, `powerCeiling_kW`, `earliest`, `latest`, `priority` ∈ {1,2,3},
`preemptible`, `commercialRef`.

`commercialRef` is an opaque string identifying the agreement this request is made
under. BPI attaches no meaning to it beyond carrying it through to the metering record.

## 4.6 DeliveryCommitment

The binding object, and the one a contract settles against.

`commitmentId`, `start`, `duration_min`, `committedEnergy_kWh`,
`committedPowerCeiling_kW`, `aimPoint`, `apertureId`, `timingProfile`, `tokenIssuer`,
`curtailmentTerms`, `commercialRef`.

**[R-C-034]** `timingProfile` SHALL be frozen at commitment and SHALL NOT change during
a session. A profile change requires a `WindowAmendment` and a new commitment.

## 4.7 WindowAmendment

`commitmentId`, `action` (`MOVE | SHRINK | CANCEL | PREEMPT`), `reasonCode`,
`noticeGiven_min`, `compensationFlag`.

**[R-C-035]** An amendment issued after a session has entered `ARMED` SHALL NOT be used
in place of an `Abort`. Amendments are scheduling instruments; stopping a live beam is
§5.6 and nothing else.

## 4.8 Common types

`GeodeticPoint` (§2.3), `Provenance` (§2.6), `Aperture`, `RateProfile`, `SignatureBlock`,
`ModelRef`, `MeasurementPoint`. All in `schemas/0.1/common.schema.json`.
