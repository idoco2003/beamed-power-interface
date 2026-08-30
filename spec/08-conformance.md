<!-- SPDX-License-Identifier: CC-BY-4.0 -->

# §8 BPI-CONF — Conformance

## 8.1 A claim is a triple

A conformance claim is **role × level × annexes**, never a single ladder.

```
BPI/0.2 · BROKER · L1 · no-annex
BPI/0.2 · RECEIVING · L2 · RF
BPI/0.2 · SPACE · L3 · RF
```

### Roles

| Role | Radiates | Receives | Issues tokens | Meters |
|---|---|---|---|---|
| `SPACE` | yes | — | never | transmitted side |
| `RECEIVING` | — | yes | yes | revenue side |
| `BROKER` | no | no | no | no |

The **`BROKER`** role exists so that a scheduling system can claim something true. A
console that publishes opportunities, matches requirements and emits metering records
from data it is given will never hold a token or meter a joule. Without a broker role its
only options are an inflated claim or none at all.

### Levels

| Level | Name | Requires |
|---|---|---|
| **L0** | Declarative | Publishes schema-valid capability and attestation. No session. |
| **L1** | Scheduling | Opportunity, request, commitment, amendment; emits schema-valid metering records from whatever source it has. No beam. |
| **L2** | Supervised delivery | Full interlock; human-in-the-loop arm; delivery capped at a stated fraction of the public exposure reference level. |
| **L3** | Delivery | Full interlock at rated power. Requires `eStopPresent` and `eStopWiredToIssuer`, a signed exposure assessment (`modelled` or `measured`), declared external abort authorities, a measured `abortToSafe_ms`, and an `ephemerisSource` other than `SGP4_GP`. |

**L0 is a real and useful level.** A system at L0 has published its regulatory posture in
a comparable, machine-readable form. Today nobody does that, and a population of L0
declarations would itself be the most useful artefact this project could produce.

### Annexes

`RF`, `OPT`, or none. L0, L1 and the `BROKER` role require none.

## 8.2 The conformance claim document

**[R-CONF-001]** An implementer claiming conformance SHALL publish
`bpi-conformance.json` in a location they control, enumerating **every** normative
requirement identifier in this specification with one of:

| Status | Meaning |
|---|---|
| `implemented` | Done, and we are asking you to rely on it |
| `not-implemented` | Not done |
| `not-applicable` | Out of scope for this role/level — **`reason` is mandatory** |
| `not-claimed` | Done, but we are **not** asking you to rely on it |

**[R-CONF-002]** `not-applicable` SHALL carry a `reason`.

**`not-claimed` is first-class and deliberate.** It lets an implementer say "we do this,
but it is untested, or we are unwilling to stand behind it yet" — a thing implementers
genuinely need to say and which most conformance frameworks give them no way to express,
with the result that they either overclaim or stay silent.

**[R-CONF-003]** A claim SHALL name the specification version it is against, and SHALL
be re-issued on a MAJOR version change.

## 8.3 What is not offered

There is **no certification**. There is no test authority, no accreditation body, no
conformance testing service, no registered mark, and no process by which anyone becomes
entitled to describe an implementation as *"certified BPI-conformant"*.

**[R-CONF-004]** No party SHALL describe an implementation as certified, accredited or
approved under this specification.

A conformance claim under BPI is a self-declaration, published where anyone can check it
against the implementation. That is all it is. For a draft with one implementation, a
self-declaration that can be publicly contradicted is proportionate; anything more would
be theatre.

## 8.4 Known conformance claims

| Implementation | Claim | Claim document |
|---|---|---|
| BeamDesk | `BPI/0.2 · BROKER · L1 · no-annex` | [bpi-conformance.json](https://github.com/BeamDesk/BeamDesk/blob/master/bpi-conformance.json) |

BeamDesk is the specification's author and its only implementation, which is the
weakness `OBJECTIONS.md` §O-1 exists to state. Its claim answers 35 of 112 requirements
`implemented`, 17 `not-implemented`, 57 `not-applicable` (it never radiates), and 3
`not-claimed`. It emits five of the thirteen message types, all unsigned.

**The reference implementation is not in this table, and that is a finding rather than an
oversight.** `reference/` in this repository executes eleven BPI-S requirements, but every
role in §8.1 is defined by a physical act and it performs none of them, so no claim it
could publish would be true. It publishes `reference/COVERAGE.md` instead, which asserts
only that certain requirements have been executed. That the taxonomy has no honest slot
for a simulator is recorded as `DISPOSITIONS.md` F-8 and is open for 0.2.

Anyone may add a row by pull request. There is no gatekeeping and no review beyond
checking the linked claim document parses and enumerates the right identifier set. A
claim in this table is the claimant's assertion, not this project's endorsement.