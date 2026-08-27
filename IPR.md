<!-- SPDX-License-Identifier: CC-BY-4.0 -->

# Patent policy

**Status: adopted 2026-08-27, while this project had zero outside contributors.**

That timing is the point. A patent policy adopted before anyone has contributed binds
everyone who ever does. One adopted afterwards has to be agreed retroactively by people
who have already given you their work, which in practice means it never happens. Every
recognised standards body requires a policy of roughly this shape before it will consider
a document, so a specification without one is not adoptable however good the engineering
is.

**This is not legal advice, and nobody here is a lawyer.** It is a plain-language policy
modelled on how IETF and W3C handle the same problem. Before anything in this repository
is relied upon commercially, have counsel read this file.

---

## 1. What has not been done

Unchanged from the day this project started, and stated first because it is the part
implementers most need:

> **No patent search has been performed. No essentiality claim is made. No patent licence
> is granted by this project beyond the contributor grants described below.**

Power beaming is a patent-dense field: retrodirective arrays, rectenna topologies,
beam-forming control. It is entirely possible that implementing parts of this
specification requires a licence from a third party. This project has not investigated
that and is not in a position to. **Implementers should take their own advice.**

Nothing below changes that. What follows governs *contributions*, not the specification's
freedom to operate.

## 2. Disclosure

**[IPR-1]** Anyone contributing to this repository SHALL disclose any patent or patent
application they, or the organisation they contribute on behalf of, know to be essential
to their contribution.

**[IPR-2]** Disclosure is required for patents the contributor **actually knows about**.
This policy does not require a patent search, and no contributor is expected to conduct
one.

**[IPR-3]** A disclosure SHALL be made before or at the time the contribution is
submitted, by opening an issue titled `IPR disclosure` or by a note in the pull request.
Recorded in [`IPR-DISCLOSURES.md`](IPR-DISCLOSURES.md).

**[IPR-4]** Where a contributor cannot disclose — because the patent is unpublished, or
their employer forbids it — they SHALL say that a non-disclosable interest exists rather
than stay silent. A stated gap is workable. A silent one is not.

*This is the shape of IETF BCP 79: disclose what you know, no search obligation, and the
disclosure is public. It works because the cost of complying is near zero and the cost of
being caught not complying is severe.*

## 3. Licensing commitment

**[IPR-5]** By contributing, a contributor grants a **royalty-free, non-exclusive,
worldwide, irrevocable licence**, to anyone implementing this specification, under any
patent claim they own or control that is necessarily infringed by implementing their
contribution as it appears in the specification.

**[IPR-6]** The grant extends only to the contributor's **own contribution**, not to the
specification as a whole and not to any third party's patents.

**[IPR-7]** The grant may be terminated, as to a party, if that party brings a patent
infringement action alleging that this specification or an implementation of it infringes
their patents. This is the defensive-termination clause of Apache-2.0 §3, applied to the
specification text as well as the code.

**[IPR-8]** A contributor unwilling to make this grant SHALL say so before contributing.
Their contribution will be declined rather than silently accepted on unclear terms.

### Why royalty-free rather than RAND

Most standards bodies accept RAND, meaning reasonable and non-discriminatory terms: a
contributor may charge for a licence provided they charge everyone comparably. It is the
compromise that gets large patent holders to participate.

Royalty-free is stronger, and it is chosen here for a reason specific to this project's
situation: **there are no contributors yet.** The only person bound by it today is the
author, who holds no relevant patents, so it costs nothing to commit. Adopting the
stronger term now and holding to it is worth more than adopting the weaker one and hoping.

If an organisation with a genuine patent portfolio later wants to contribute and cannot
make a royalty-free grant, that is a conversation worth having, and it would be handled by
amending this policy in public rather than by quietly accepting the contribution.
[`GOVERNANCE.md`](GOVERNANCE.md) governs how such a change would be made.

## 4. The register

[`IPR-DISCLOSURES.md`](IPR-DISCLOSURES.md) records every disclosure received.

**It is currently empty, and that emptiness is a dated statement rather than an oversight.**
It means: nobody has told this project about an essential patent. It does not mean none
exists. See §1.

## 5. Relationship to the repository licences

The two are separate and both apply.

| | Copyright | Patents |
|---|---|---|
| Specification prose | CC BY 4.0 ([`LICENSE-TEXT`](LICENSE-TEXT)) | [IPR-5] |
| Schemas, examples, tooling | Apache-2.0 ([`LICENSE-CODE`](LICENSE-CODE)) | Apache-2.0 §3, plus [IPR-5] |

Apache-2.0 already carries an express patent grant for code. **CC BY 4.0 carries none.**
It is a copyright licence and says nothing about patents at all. [IPR-5] exists mainly to
close that gap on the prose half, which is where the normative requirements live and
therefore where an essential patent would actually bite.

## 6. What this policy cannot do

It binds contributors. It cannot bind anyone who has never contributed, which is everyone
who currently holds a patent in this field. A third party's essential patent is entirely
unaffected by anything written here, and no policy any standards body has ever written
changes that either.

The honest summary: this makes the specification *adoptable* by a body, and makes
contributions safe to build on. It does not make implementation safe. Nothing can, short
of a search this project has not done.
