# Beamed Power Interface (BPI)

**A draft specification for the interface between a power-beaming spacecraft and the
receiver it delivers to.**

Version 0.1.0-draft · Published 2026-08-22 · **Request for Comments, not a standard**

---

## The one-paragraph version

A spacecraft that beams power to a receiver it does not own needs to agree four things
with that receiver: what each side can do, when delivery happens, how the beam is kept
safe while it is on, and how much energy actually arrived. There is today no published
specification covering any of that. BPI is a draft attempt at one, written because the
gap is real and dated (see [`gap-analysis.md`](gap-analysis.md)), and published in the
open so it can be corrected, forked, or superseded by a body that should own it.

## What this is not

It is **not a standard**. No standards body has published, reviewed, endorsed or been
asked about it. It has one implementation. Several of its numbers are proposals rather
than measurements, and [`OBJECTIONS.md`](OBJECTIONS.md) lists the strongest arguments
against it that its own authors could construct. Read
[`spec/00-status.md`](spec/00-status.md) before anything else.

It does **not** grant, imply or substitute for any regulatory permission. A system can
be fully BPI-conformant and hold no authorisation to transmit at all — the specification
is designed to make that state *declarable* rather than to prevent it.

## The design in three sentences

**Enable is unanimous; abort is unilateral.** Power flows only while both segments
continuously consent, expressed as a stream of short-lived signed tokens, so that the
*absence* of consent is the default and silence is safe. A naive interlock has the
ground tell the spacecraft to stop, which requires a message to arrive during exactly
the failure that stops messages arriving; BPI inverts that into a one-way problem.

## Parts

| Part | Title | Status at 0.1 |
|---|---|---|
| [BPI-C](spec/04-core.md) | Core — information model, session lifecycle, conventions | Normative |
| [BPI-S](spec/05-interlock.md) | Safety Interlock | Normative |
| [BPI-M](spec/06-metering.md) | Metering & Settlement | Normative |
| [BPI-A](spec/07-attestation.md) | Regulatory & Exposure Attestation | Normative |
| [BPI-RF](spec/annex-rf.md) | Annex — RF microwave physical layer | Normative |
| [BPI-OPT](spec/annex-opt.md) | Annex — Optical / NIR physical layer | **Reserved, stubbed** |
| [BPI-CONF](spec/08-conformance.md) | Conformance framework | Normative |

## Repository map

```
spec/            the specification, in reading order
schemas/0.1/     JSON Schema (draft 2020-12) for every message
profiles/        every tunable number, outside the normative prose
examples/        worked messages, valid and deliberately invalid
conformance/     the requirement register and claim template
gap-analysis.md  why this is not already covered — dated, with URLs
OBJECTIONS.md    arguments against this draft
DISPOSITIONS.md  what we did about every comment received
```

## Reading order for a sceptic

1. [`spec/00-status.md`](spec/00-status.md) — what this document is not.
2. [`gap-analysis.md`](gap-analysis.md) — whether the gap it claims is real.
3. [`OBJECTIONS.md`](OBJECTIONS.md) — whether we know what is wrong with it.
4. [`spec/05-interlock.md`](spec/05-interlock.md) — the part that would matter.

## Validating the schemas

```sh
npx --yes ajv-cli@5 validate --spec=draft2020 -s schemas/0.1/<name>.schema.json -d examples/<case>/<file>.json
tools/validate.sh          # everything, including the must-fail cases
```

The invalid examples are part of the test surface: a power flux-density without its
reference bandwidth, an exposure figure without its averaging time, and a position
without its height reference **must** fail validation. If they pass, the schemas are
broken.

## Contributing

Comments are wanted, especially the ones saying this is wrong. See
[`CONTRIBUTING.md`](CONTRIBUTING.md) and [`GOVERNANCE.md`](GOVERNANCE.md). Every
substantive comment gets a public disposition in [`DISPOSITIONS.md`](DISPOSITIONS.md),
including the ones we reject and why.

**The RFC period for 0.1 closes 2026-11-30.**

## Licence

Specification prose: [CC BY 4.0](LICENSE-TEXT).
Schemas, examples, tooling: [Apache-2.0](LICENSE-CODE) — chosen for its patent grant.
Neither licence is a patent clearance; see the IPR statement in
[`GOVERNANCE.md`](GOVERNANCE.md#ipr).
