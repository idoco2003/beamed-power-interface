# §9 Security considerations

The threat model here is unusual: the asset being protected is not data. It is a
multi-megawatt beam whose misuse is a physical-harm event, and whose authorisation is a
stream of messages.

## 9.1 The two attacks that matter

**Forging a token holds the beam on.** An attacker with the safety authority's signing
key can prevent a beam from stopping. Mitigations: Ed25519 signatures over canonical
JSON ([R-C-015]); hash chaining so replay and gaps are visible ([R-S-020]); short
lifetimes so a stolen key has bounded value per token; declared rotation and a
revocation endpoint ([R-C-016]); and the independent abort paths of [R-S-050], of which
the hard-wired emergency stop is not a message and therefore not forgeable.

**Spoofing the pointing reference steers the beam.** A retrodirective array beams power
at whatever emits the pilot tone. **An unauthenticated pilot is a beam-hijacking
primitive** — an attacker with a transmitter could in principle redirect a power beam
onto a target of their choosing. This is the most serious attack in the document.

Mitigation is [R-S-031], and it is deliberately two independent checks:

| | Attacker forges tokens | Attacker spoofs pilot |
|---|---|---|
| Authenticated pilot | no help | **blocks** |
| Geometric corridor | no help | **blocks** |
| Effect if both bypassed | beam stays on, correctly aimed | beam steers, but corridor latches an abort |

Neither check alone is sufficient, and they rest on two independent secrets. An attacker
who forges tokens can hold the beam on but cannot steer it. An attacker who spoofs the
pilot cannot survive the corridor check against the segment's own ephemeris.

## 9.2 Key management

**[R-SEC-001]** Signing keys for the safety authority SHALL be distinct from keys used
for commercial or scheduling messages, and SHALL NOT be shared between roles.

**[R-SEC-002]** Key rotation interval and revocation endpoint SHALL be declared, and a
segment SHALL check revocation before entering `ARMED`.

**[R-SEC-003]** A revoked key SHALL invalidate tokens issued under it from the moment of
revocation, and the space segment SHALL treat the absence of a fresh valid token in the
normal way — that is, by safing.

## 9.3 Denial of service

Denial of service against this interface is **fail-safe by construction**: an attacker
who blocks the token stream stops the beam. That is the correct outcome, and it is worth
stating that the availability failure mode of BPI is loss of revenue, never loss of
safety.

The inverse — an attacker who can *sustain* a token stream the legitimate authority
wishes to stop — is the dangerous case, and it reduces to key compromise, handled above,
plus the non-message abort path of [R-S-050] clause 2.

## 9.4 Time as an attack surface

**[R-SEC-004]** A segment SHALL NOT extend a token's validity on the basis of a wall
clock that has moved backwards. The monotonic check of [R-S-021] is normative for this
reason: GNSS spoofing that steps a clock backwards must not lengthen a safety deadline.

## 9.5 Privacy and disclosure

Capability and attestation messages are designed to be published. They contain surveyed
aperture coordinates, keep-out geometry, sensor coverage and delivery schedules.

- Aperture positions are not sensitive — a kilometre-scale rectenna is visible from
  orbit — but **sensor coverage and keep-out gaps are**, since they describe where the
  safety system cannot see.
- **[R-SEC-010]** `sensors[]` coverage detail MAY be withheld from public publication
  and disclosed only to counterparties and regulators; a redacted capability SHALL
  declare `redacted: true` and list the withheld field paths.
- Delivery schedules reveal operational patterns and, in aggregate, customer
  relationships. Publication granularity is left to the parties.
