<!-- SPDX-License-Identifier: CC-BY-4.0 -->

# Governance

## Status

This is a draft specification maintained by its named editor. It is **not** the product
of a standards body, a consortium or a working group, and no such entity exists. See
`spec/00-status.md`.

## Decision making

While there is one implementation and no consensus process, decisions are made by the
editor in public: every substantive change is a pull request with a rationale, and every
comment gets a recorded disposition.

**This is not a good long-term arrangement and is not presented as one.** The intended
end state is one of:

1. A body listed in `spec/00-status.md` opens a relevant work item, this specification is
   contributed to it, and this repository is archived. **This is the preferred outcome.**
2. Enough independent implementations exist to form a review group with a published
   membership and a real voting rule, at which point this document is replaced.
3. Nobody adopts it, the gap analysis goes stale, and the repository is archived with a
   note saying so.

## Versioning

Semantic versioning, with meanings stated explicitly because the defaults are ambiguous
for documents:

| Component | Meaning |
|---|---|
| **MAJOR** | A change that breaks an existing conformant implementation on the wire |
| **MINOR** | New optional fields, messages, reason codes, or annex content |
| **PATCH** | Editorial only — no normative change |

`0.y.z` throughout the draft period. Every message carries `bpiVersion` and every schema
`$id` carries its version, so a message is self-identifying without context.

**[G-1]** Each release SHALL publish a machine-readable changelog **and a diff of the
normative requirement set** — which requirement identifiers were added, changed in
meaning, or withdrawn.

*A specification that changes its `SHALL`s without publishing which ones changed is
asking implementers to diff prose. The requirement diff is the technical analogue of a
published redline on a contract, and exists for the same reason.*

## Requirement identifiers

Identifiers are permanent. A withdrawn requirement keeps its number, marked withdrawn;
numbers are never reused. `conformance/checklist.json` is generated from the
specification and a build check fails if the two disagree.

## IPR

**No patent search has been performed. No essentiality claim is made. No patent licence
is granted by this project.**

Power beaming is a patent-dense field — retrodirective arrays, rectenna topologies,
beam-forming control. It is entirely possible that implementing parts of this
specification requires a licence from someone. This project has not investigated that and
is not in a position to.

Contributors licence their contributions under the repository's licences (`LICENSE-TEXT`
for prose, `LICENSE-CODE` for schemas, examples and tooling).

**Since 2026-08-27 there is also a patent policy: [`IPR.md`](IPR.md).** Contributors must
disclose patents they know to be essential to their contribution, and grant a
royalty-free licence under any patent claim their own contribution necessarily infringes.
Disclosures are recorded in [`IPR-DISCLOSURES.md`](IPR-DISCLOSURES.md), which is currently
empty.

It was adopted while the project had zero outside contributors, which is the only moment
adopting one is easy: a policy agreed before anyone contributes binds everyone who ever
does, and one proposed afterwards has to be agreed retroactively by people who have
already handed over their work.

That policy governs contributions. It does nothing about a third party's patent, and no
standards body's policy ever has. **Implementers should take their own advice.**

## Licences

- **Specification prose** — `LICENSE-TEXT`, Creative Commons Attribution 4.0. Chosen so
  the text can be quoted, translated and forked, and so a body that later adopts it is
  not blocked by the licence. Deliberately not ShareAlike (viral into other documents)
  and not NoDerivatives (forking is the point).
- **Schemas, examples, tooling** — `LICENSE-CODE`, Apache-2.0, for the patent grant.

## Editor

Ido Yahalomi. Drafted with substantial assistance from Claude (Anthropic).