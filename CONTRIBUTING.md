<!-- SPDX-License-Identifier: CC-BY-4.0 -->

# Contributing

Comments are wanted, and the useful ones are mostly the ones saying this is wrong.

## What is most useful

1. **"This requirement is impossible for real hardware."** With the reason. Several
   numbers here were derived by arithmetic rather than measured, and we know it.
2. **"This standard already covers it."** A pointer to a published document that makes
   part of this redundant is the single most valuable contribution possible — the
   project's stated preference is to be superseded.
3. **An optical annex.** `spec/annex-opt.md` is a stub that lists what is missing.
   February 2027 is the date by which it needs a real author.
4. **A second implementation.** Even a partial one at L0. See `OBJECTIONS.md` §O-1.
5. **First-party verification of a citation.** §6.2's meter classes are cited from
   secondary knowledge and flagged; there may be others.

## How

- **A defect or a question** — open an issue.
- **An argument against the design** — a pull request against `OBJECTIONS.md`. We would
  rather host the argument than have it made elsewhere. Write it as strongly as you
  believe it.
- **A change to the specification** — a pull request with the rationale in the
  description. If it changes a normative requirement, say which identifier and whether
  the change is MAJOR, MINOR or PATCH under `GOVERNANCE.md`.
- **A conformance claim** — a pull request adding a row to §8.4 with a link to your
  claim document.

## What will not be accepted

[`GOVERNANCE.md`](GOVERNANCE.md) carries a short list of things this project will not do,
including claiming review it has not had, offering certification, and removing a recorded
objection because it became inconvenient. Those are not editorial preferences and a pull
request doing any of them will be declined regardless of its merits.

## Rules for changes

- A new or changed `SHALL` needs a rationale in the same pull request. A requirement
  whose reason is not written down cannot be evaluated and will not be merged.
- A number belongs in `profiles/`, not in prose, unless it is a definition.
- A physical quantity needs its measurement conditions (§2.5). This is enforced by the
  schemas; a change that lets a bare number through will fail `tools/validate.sh`.
- Claims about other specifications must be first-party. Secondary coverage of a
  document is a lead, not a citation.

## Licensing of contributions

By contributing you licence your contribution under the repository's licences:
CC BY 4.0 for prose, Apache-2.0 for schemas, examples and tooling.

**You also take on two patent obligations under [`IPR.md`](IPR.md).** Disclose any patent
you actually know to be essential to what you are contributing — no search is required,
and if you cannot describe it, say that a non-disclosable interest exists rather than stay
silent. And you grant a royalty-free licence under any patent claim your own contribution
necessarily infringes. If you are not willing to do that, say so before contributing and
the contribution will be declined rather than accepted on unclear terms.

None of that touches third-party patents. This project has performed no patent search and
makes no essentiality claim; see `IPR.md` §1.