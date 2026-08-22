<!-- SPDX-License-Identifier: CC-BY-4.0 -->

# Annex EX (informative) — worked examples

All examples live in `examples/`. They are informative: where an example and a normative
requirement disagree, the requirement wins and the example is a bug.

## Deliberately two kinds of site

`attestation-5800mhz/` uses a real facility's coordinates (Esrange, 67.88 °N) because a
worked example against a real latitude exercises the geometry honestly. The organisation
names throughout — *Kiruna Power Receiving AB*, *Solaris Orbital Power Ltd* — are
**invented**, and no real operator has adopted, reviewed or endorsed this specification.

## EX.1 `attestation-5800mhz/` — the honest regulatory declaration

The example this specification exists for. A 5.8 GHz receiving segment declares:

- `allocationStatus: "ism_not_allocated_for_this_use"`
- `article21.applicability: "none"` with **`rowRef: null`**
- `marginDb: -155.3` — a large negative margin, disclosed rather than suppressed
- `exposure.ratioToLimit: 3.404` — over three times the ICNIRP general-public reference
  level, with `peakToMeanBasis` stating the 10 dB Gaussian edge taper it came from
- `localExposureBasis: "not_assessed"` — honest about the sub-6 GHz SAR gap
- a five-entry **`unclaimed[]`**, and
  `operatingPosture: "operating_without_specific_authorisation_by_declaration"`

Read the `unclaimed[]` array on its own. That is the whole argument for §7: a
regulator who could run that query across every declared system in the world would see
the shape of the gap immediately, and today nobody can.

## EX.2 `leo-rf-nominal/` — a token and a state report

An `EnableToken` at `seq: 4211` with a `prevHash`, a 5-second `notAfter`, and
`maxPower_kW: 95000` — note that the token is a *power authorisation*, so lowering that
number in the next token curtails the beam within one refresh interval.

The paired `SessionState` shows `DELIVERING` at 94,210 kW, `honouringToken` naming the
token by id and sequence, and `pointing.pilotAuthenticated: true`. That last field is
not decoration: under [R-S-031] an unauthenticated lock is treated as no lock.

## EX.3 `leo-rf-aviation-abort/` — a resumable abort from an external authority

`reasonCode: "AVIATION_TRANSIT"`, `latching: false`, `authority.kind: "EXTERNAL"`.
The aviation authority holds a declared abort channel under [R-A-020] and used it. Being
non-latching, the session may re-arm within the window without a two-party reset.

## EX.4 `disputed-record/` — a metering record that does not settle

The interesting example. It carries:

- `delivered` 3,921.4 kWh `measured` at a class 0.2S revenue meter
- `transmitted` 5,602.0 kWh `measured` at the antenna RF output
- `efficiency` 0.70 **naming both endpoints and the 547 km path** — the requirement of
  [R-M-023] that makes two demonstrations comparable
- a `nonDelivery` entry of 742 kWh attributed to `AVIATION_TRANSIT`, default bearer
  `RECEIVING`, marked **`disputed: true`**
- **`settleable: false`**, and one signature rather than two

This is what an unresolved settlement looks like on the wire: complete, signed by one
party, attributed to a cause, pointing at a session log, and explicitly not settled.
Nothing is hidden and nothing is asserted that the evidence does not support.

## EX.5 `must-fail/` — seven documents that must be rejected

Each violates exactly one rule, and each is part of the test surface. See
`examples/must-fail/README.md`. If any of them validates, the schema encoding that rule
is broken and `tools/validate.sh` fails the build.

They exist because the conventions of §2.5 — no power flux-density without a reference
bandwidth, no exposure figure without an averaging time and area, no efficiency without
its endpoints, no position without a height reference — are the difference between a
specification that cannot be fudged and one that merely asks nicely.