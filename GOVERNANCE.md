<!-- SPDX-License-Identifier: CC-BY-4.0 -->

# Governance

## Status

This is a draft specification maintained by its named editor. It is **not** the product
of a standards body, a consortium or a working group, and no such entity exists. See
`spec/00-status.md`.

## Charter

**In scope.** The interface between a segment that beams power and a segment that receives
it, where the two are operated by different organisations: what each publishes about
itself, how a delivery window is agreed, how the beam is kept safe while it radiates, how
delivered energy is recorded, and on what regulatory basis the whole thing operates.

**Out of scope, and it will stay out.** Physical-layer design. Hardware. The spacecraft
command and telemetry link, which existing standards already cover and which §3.2 is
explicit about not respecifying. Licensing, permitting and pricing. Certification, per
§8.3.

**What this project will not do**, stated so that a future editor cannot quietly start:

- claim conformance, endorsement or review by any body that has not given it
- offer, imply or charge for certification, or register a conformance mark
- accept a contribution whose contributor will not make the [IPR.md](IPR.md) grant
- describe an implementation as certified, including its own
- remove a recorded disposition or objection because it became inconvenient

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

### The rule that replaces this one

Today's arrangement is one editor deciding in public. It ends on the first **independent
implementation**, meaning one produced by an organisation that is not the editor's and
published with a conformance claim under §8.2. That trigger is deliberate: it is objective, it is
visible to everyone, and it cannot be reached by the editor deciding it has been.

At that point:

**Co-editors.** The editor invites two, from different organisations, at least one of
which implements. An invitation is public and is recorded here. A co-editor may resign at
any time, publicly.

**What a decision needs.** A substantive change needs the agreement of a majority of
editors, and no change may be merged over the recorded objection of an editor who
implements it, unless the other editors record why. A change nobody objects to needs one
editor and a pull request, as now.

**Deadlock.** Where editors cannot agree, the change does not happen and the disagreement
is recorded in `DISPOSITIONS.md` with both positions. A specification that ships a
contested requirement because someone had a casting vote has recorded a decision it
cannot defend. Not shipping is the safe direction.

**Editorial versus normative.** Any editor may make an editorial change alone, and
editorial means PATCH under the versioning rule above: no `SHALL` gains, loses or changes
meaning. If there is an argument about whether a change is editorial, it is not.

### Editor succession

Today this project ends if one person stops paying attention, and nothing in the
repository would say so. That is the single largest risk to anyone building on it.

**If the editor is unreachable for 90 days**, any co-editor may say so in an issue, and
after a further 30 days without response may take over as editor and record it here.

**With no co-editors and no editor**, the repository should be archived rather than
adopted by whoever asks first. `spec/00-status.md` already commits to archiving as an
acceptable outcome, and an unmaintained specification that looks maintained is worse than
one plainly marked dead. Anyone may fork it; the licences permit that and are chosen so
they do.

**The editor should name a literary executor for the repository** and has not yet. That is
an open item against this file, not a solved problem.

### Appeals

A disposition is one person's judgement, and `DISPOSITIONS.md` currently records the
editor disagreeing with a commenter in public with no way for the commenter to press it.

**Anyone whose comment is dispositioned `rejected` may appeal** by saying so in the issue
or by email. An appeal is recorded in `DISPOSITIONS.md` alongside the original, whatever
the outcome, so a reader sees that the disagreement continued.

**Appeals are decided by the editors other than the one who wrote the disposition.** With
one editor there is nobody to appeal to, and this file should say that plainly rather than
offer a process that does not exist: **until co-editors are appointed, an appeal is
recorded and answered by the same person who rejected it.** That is not an appeal. It is
the honest description of what is currently available, and it is one of the reasons the
trigger above is worth reaching.

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

*How [G-1] is met, and the one part a tool cannot do.* `tools/gen-requirement-diff.mjs`
computes the diff against the `v0.1.0-draft` tag on **every build**, not at release, and
publishes `conformance/requirement-diff.json` and `.md`. Added and withdrawn identifiers
are computable. **Changed in meaning is not** — a tool can see that a requirement's text
differs, not whether the difference obliges an implementer to do something new. That
judgement is the editor's, recorded once in `tools/requirement-diff-notes.json` with a
reason, and the build **fails while any text change is unclassified**. Classifications are
keyed by the text on each side rather than by revision, so a judgement made while drafting
is not asked again at release under a different name.

Running it every build is deliberate. Classifying two changed requirements today is a few
minutes; classifying forty on the morning you promised to publish is how an announced date
slips, and doing process visibly on the date announced is most of what a governance
document is worth.

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