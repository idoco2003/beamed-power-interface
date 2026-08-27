# Beamed Power Interface (BPI)

**A draft specification for the interface between a power-beaming spacecraft and the
receiver it delivers to.**

Version 0.2.0-draft, unreleased · Last published 0.1.0-draft, 2026-08-22 · **Request for
Comments, not a standard**

The RFC period closes **2026-11-30**, when 0.2.0-draft is tagged and every comment gets a
published disposition. What has changed since 0.1.0-draft is in
[conformance/requirement-diff.md](conformance/requirement-diff.md), generated rather than
written.

---

## Nobody has written this down

A spacecraft beaming power to a receiver it does not own has to agree four things with
that receiver: what each side can do, when delivery happens, how the beam is kept safe
while it is radiating, and how much energy actually arrived. No published specification
covers any of it.

Checked, with dates and sources, in [`gap-analysis.md`](gap-analysis.md):

- ITU-R's only wireless-power Recommendation is scoped to phones and sensor networks
- Report SM.2392-2 names the band and recommends nothing, because Reports do
- the Radio Regulations carry no Article 21 space-to-Earth row for 5.8 GHz
- WRC-27 has no agenda item, and ITU-R SG3 does not sit again until June 2027
- IEEE's ICES lists no active projects; CCSDS has nothing power-related
- no regulator surveyed has an open proceeding

Meanwhile at least seven programmes are building it across two incompatible physical
layers, and one 2027 flight carries five power-beaming payloads from different companies
on a single bus. That is the condition in which interfaces get frozen by accident, one
bilateral integration at a time.

## The idea

**Enable is unanimous. Abort is unilateral.**

Power flows only while both segments continuously consent, expressed as a stream of
short-lived signed tokens, so the absence of consent is the default state. A naive
interlock has the ground tell the spacecraft to stop, which needs a message to arrive
during exactly the failure that stops messages arriving. Inverting it makes silence safe.

Most of the rest follows from that:

- the token carries a power ceiling, so "curtail" and "continue" are one message and
  therefore one code path
- its lifetime and the declared intruder speed set the keep-out buffer, so a timing
  parameter becomes **1,350 m of land** you can see on a map
- an SGP4 ephemeris is inadmissible as the pointing reference: a 2 km aperture at 547 km
  subtends 0.21°, and general-perturbations error exceeds that

## What this is not

It is **not a standard**. No standards body has published, reviewed, endorsed or been
asked about it. It has one implementation. Several of its numbers are proposals rather
than measurements, and [`OBJECTIONS.md`](OBJECTIONS.md) lists the strongest arguments
against it that its own authors could construct — eight of them open, one with no
mitigation offered. Read [`spec/00-status.md`](spec/00-status.md) before anything else.

It does **not** grant, imply or substitute for any regulatory permission. A system can
be fully BPI-conformant and hold no authorisation to transmit at all. The specification
is designed to make that state *declarable* rather than to prevent it.

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
schemas/0.2/     JSON Schema (draft 2020-12) for every message
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

## Schema identifiers

Schemas are identified and served under:

```
https://beamdesk.github.io/beamed-power-interface/schemas/0.2/<name>.schema.json
```

Earlier drafts used `https://bpi.spec/…`, which was a mistake: **`.spec` is not in the
IANA root zone**, so that identifier could never resolve and any validator configured to
fetch a `$ref` by `$id` would fail. `$id` is not required to be dereferenceable, but one
that *cannot* be is a dead end for tooling and a small lie to a reader.

Internal `$ref`s are relative, so a copy of `schemas/0.2/` validates offline with no
network access at all.

## For implementers

[`conformance/vectors/`](conformance/vectors/) carries signed token-chain vectors. Each
states the expected verdict and every reason a conformant verifier might legitimately
give, so you can check your implementation against this specification without talking to
anyone. The signing key is published in [`conformance/keys/`](conformance/keys/) on
purpose, so the vectors can be regenerated rather than only verified.

[`reference/`](reference/) is the interlock as executable code. It is the author's, so it
is not an independent implementation and does not close `OBJECTIONS.md` O-1.

## Validating the schemas

```sh
npx --yes ajv-cli@5 validate --spec=draft2020 -s schemas/0.2/<name>.schema.json -d examples/<case>/<file>.json
tools/validate.sh          # everything, including the must-fail cases
```

The invalid examples are part of the test surface: a power flux-density without its
reference bandwidth, an exposure figure without its averaging time, and a position
without its height reference **must** fail validation. If they pass, the schemas are
broken.

## Measuring whether anyone uses this

`adoption/digests/` records dated snapshots, written by `tools/adoption-scan.sh`.
GitHub discards traffic data after fourteen days, so a number nobody writes down is
gone.

The digest keeps two lists apart. **Signals that cost somebody effort** — an
independent conformance claim, a second implementation, an external issue, a
substantive comment — are the only ones that mean anything, and all are currently
zero. **Vanity metrics** are recorded and labelled as such: on publication day this
repository logged twelve clones from nine unique cloners and zero page views, which is
the signature of automated scanners rather than readers.

The digest also carries a kill switch rather than a health bar. If `gap-analysis.md`
goes stale, or any row in it flips because a standards body opened a work item, then
adoption of this document stops being the goal — see [`spec/00-status.md`](spec/00-status.md).

## Contributing

Comments are wanted, especially the ones saying this is wrong. See
[`CONTRIBUTING.md`](CONTRIBUTING.md) and [`GOVERNANCE.md`](GOVERNANCE.md). Every
substantive comment gets a public disposition in [`DISPOSITIONS.md`](DISPOSITIONS.md),
including the ones we reject and why.

**The RFC period closes 2026-11-30**, when 0.2.0-draft is tagged and every comment has a
published disposition.

### Where a comment goes

[Discussions](https://github.com/BeamDesk/beamed-power-interface/discussions) has four categories and there is a thread open on each part of the
specification, each one naming what that part gets wrong rather than asking for general
feedback.

| Category | For |
|---|---|
| [RFC comments](https://github.com/BeamDesk/beamed-power-interface/discussions/categories/rfc-comments) | Comments on the draft. Five threads, one per part. Every comment gets a published disposition by 2026-11-30. |
| [Implementers](https://github.com/BeamDesk/beamed-power-interface/discussions/categories/implementers) | Questions from people building against BPI. An accepted answer is the closest thing this draft has to an interop ruling. |
| [Wanted](https://github.com/BeamDesk/beamed-power-interface/discussions/categories/wanted) | The three things this project cannot do itself |
| [Announcements](https://github.com/BeamDesk/beamed-power-interface/discussions/categories/announcements) | Releases, the RFC close, published dispositions |

**The three asks**, each bounded and each addressed to a different person:

- [An optical annex author](https://github.com/BeamDesk/beamed-power-interface/discussions/6) — seven concerns differ from RF in kind, not
  magnitude, and ARAQYS-D3 flies both under one integrator in February 2027.
- [An RF safety review below 6 GHz](https://github.com/BeamDesk/beamed-power-interface/discussions/7) — an hour on one section. The specification
  works in incident power density; below 6 GHz the basic restriction is SAR.
- [A second implementation](https://github.com/BeamDesk/beamed-power-interface/discussions/8) — the objection everything else waits on. Signed
  vectors and the signing key are published so it can be done without talking to anyone.

An issue is equally fine, and a pull request against `OBJECTIONS.md` is better than
either.

## Licence

Dual licensed, deliberately. [`LICENSE`](LICENSE) is the authoritative statement.

| Half | Licence | Full text |
|---|---|---|
| Specification prose — `spec/`, and the top-level `.md` files | **CC BY 4.0** | [`LICENSE-TEXT`](LICENSE-TEXT) |
| Schemas, examples, profiles, tooling | **Apache-2.0** | [`LICENSE-CODE`](LICENSE-CODE) |

The prose is attribution-only so it can be quoted, translated and forked — and so a
standards body that later adopts it is not blocked by the licence. The code half is
Apache-2.0 for its patent grant, which is not theoretical in a field dense with
retrodirective-array and rectenna patents.

Every file carries an `SPDX-License-Identifier`, so the split is machine-readable and
not merely asserted here.

Contributors disclose known essential patents and grant a royalty-free licence over
their own contributions, under [`IPR.md`](IPR.md). **No patent search has been performed
and no essentiality claim is made**, and that policy does nothing about a third party's
patent. See [`IPR.md`](IPR.md) §1 and §6. Automated tools report one licence per repository
and will pick one of the two; neither answer is complete.
