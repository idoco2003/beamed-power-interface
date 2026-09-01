<!-- SPDX-License-Identifier: CC-BY-4.0 -->

# §0 Status of This Document

*This section is placed before the abstract deliberately, following IETF practice. It
is the most important section in the specification.*

---

## What this document is

A **draft specification** describing an interface between a spacecraft that beams power
and a segment that receives it. Version **0.2.0-draft**, unreleased; the last published
version is 0.1.0-draft, of 2026-08-22, which opened the Request for Comments.

*Two versions, and the distinction is load-bearing.* The version string names the
requirement set; the git tag names a release. `0.2.0-draft` is MAJOR under
`GOVERNANCE.md` — two requirements changed in a way that breaks an implementation
conformant with 0.1.0-draft on the wire — so it could not keep the old number while the
RFC period runs. It is tagged and released on **2026-11-30**, when the period closes and
every comment has a published disposition. Until then, main is the requirement set
without being the release, and `conformance/requirement-diff.md` says exactly what
changed.

## What this document is not

**It is not a standard.** A standard is what a recognised body publishes after a
consensus process. This document has been through no such process. Specifically, it has
not been published by, submitted to, reviewed by, or endorsed by:

> ITU, ITU-R, CCSDS, IEEE, IEEE-SA, ISO, IEC, ETSI, ANSI, NASA SCaN, or any national
> standards body or regulatory authority.

No consensus has been sought or achieved. No working group exists. At the time of
writing, no person outside the authoring project has reviewed it.

**It confers no permission.** Nothing in this document creates, implies, replaces or
substitutes for any regulatory authorisation — spectrum licence, type approval,
environmental clearance, aviation coordination, or operating permit. Conformance to
this specification is orthogonal to regulatory authorisation, by design: §7 exists so
that a system can declare, in machine-readable form, precisely which authorisations it
does **not** hold.

**Version 0.1 SHALL NOT be cited as normative** in any compliance representation to a
regulator, customer, insurer or investor.

## Known weaknesses, stated by the authors

1. **One implementation is not interoperability.** A specification with a single
   implementer is a configuration file with an ambitious README. One partial
   implementation exists, at conformance level `BROKER · L1 · no-annex`. Nothing has
   been tested between two independent implementations, because there is no second one.
2. **Several numbers are proposals, not measurements.** The token lifetime, refresh
   rate, probe level, abort deadline and corridor angle are derived from stated
   arithmetic, not from hardware. Every one of them lives in `profiles/` rather than in
   a normative sentence, with its rationale shown, so it can be corrected without
   touching the requirement it parameterises.
3. **No hardware has been built to these requirements.** The specification constrains
   systems that do not yet exist. Some constraints will prove impractical.
4. **Some profiling claims are unvalidated.** Where this document says it follows
   another specification's information model without having validated against that
   specification's published schema, it says so in the row concerned (§1.4). A
   profiling claim that has not been validated is the most common way a draft
   specification misleads without intending to.
5. **The optical annex does not exist.** It is a stub that states what is missing.

## Offer to be superseded

Parts of this document belong to bodies that already exist. Where a body opens a
relevant work item, **this specification will be contributed to it and this repository
archived.** The authors would prefer that outcome to adoption of this document.

| Part | Body that should own it |
|---|---|
| Spectrum, PFD, band sharing (§7, Annex RF) | ITU-R WP1A / SG3 |
| Cross-support scheduling (§4.4–4.7) | CCSDS Cross Support Services area |
| Human exposure (§7.3) | IEEE ICES / ICNIRP |
| Grid interconnection behaviour (§5.5, §6) | IEEE 1547 neighbourhood / IEC TC 8 |
| Metering and settlement (§6) | IEC TC 13 |
| Lunar surface power service definition | NASA SCaN, via the LunaNet Interoperability Specification |

`gap-analysis.md` records the dated basis on which we concluded none of these currently
covers beamed power. If that file goes stale, it is evidence this project should stop,
not evidence it should continue.

## Authorship

Edited by Ido Yahalomi. Drafted with substantial assistance from Claude (Anthropic).
There is no consortium, no working group and no member list; inventing one would be the
first dishonest thing in the document.

**On the GitHub organisation.** This repository sits under an organisation named
BeamDesk. That is the authors' own account, not a standards body, not a consortium and
not a membership organisation, and its name should not be read as an endorsement by
anything. BeamDesk is also the name of the console that is this specification's only
implementation, which makes the arrangement exactly as circular as it looks: the author
of the specification, the author of the sole implementation and the owner of the
repository are the same people. An organisation account is a place to keep repositories
and nothing more.

The specification would be better off owned by a body with a membership and a voting
rule. It is not, and the offer above stands.

## Comment period

The RFC period for 0.1 closes **2026-11-30**. Every substantive comment received will be
published with a disposition of `accepted`, `rejected` or `deferred`, and a reason, in
`DISPOSITIONS.md` — including comments arguing the whole document is misconceived.