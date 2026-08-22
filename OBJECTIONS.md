<!-- SPDX-License-Identifier: CC-BY-4.0 -->

# Objections to this draft

The strongest arguments against this specification, written as their proponents would
write them, each with our response or an admission that we do not have one.

This file is maintained by the authors. A draft with one implementation cannot manufacture
consensus, but it can argue against itself in public, which is the one thing a real
consensus process does that a single author can partly substitute for.

**Adding an objection is a pull request.** We would rather host the argument than have it
made elsewhere.

---

## O-1 · One implementation is not interoperability

> A specification with a single implementer is a configuration file with an ambitious
> README. Nothing here has been tested between two independent parties, so none of the
> ambiguities that only appear at an interface have been found yet. Every interface
> specification that was written before two implementations existed had to be
> substantially rewritten afterwards.

**Response: accepted, without qualification.** This is the strongest objection and we do
not have an answer to it. It is stated in `spec/00-status.md` in the same words. The
mitigation is that 0.1 is published as a Request for Comments rather than a release, and
that the conformance framework (§8) is built to make a partial or sceptical
implementation expressible rather than forcing a binary claim.

**Status: open. Closes only when a second independent implementation exists.**

---

## O-2 · The numbers are invented

> 5 seconds, 1 Hz, 0.1 W/m², 250 ms, ±0.2°. None of these came from hardware. They came
> from arithmetic performed by people who have not built a power beaming system, and
> several of them will be wrong for any real one.

**Response: substantially accepted.** The distinction we draw is between the *shape* of a
requirement and its *value*. The shape — a dead-man token whose lifetime bounds a
keep-out buffer — is what we are actually proposing. The value is a placeholder and we
have tried to make that structurally obvious rather than merely admitting it:

- every number lives in `profiles/*.json`, not in a normative sentence;
- every number carries its arithmetic, so it can be checked and corrected;
- [R-S-024] makes the buffer a *derived* quantity, so an implementer who disagrees with
  5 s gets a different buffer rather than a violated requirement.

Where we are least confident: the probe level ratio (20 dB is a guess about loop SNR) and
`abortToSafe_ms` for tube-based transmitters.

**Status: open, structurally mitigated.**

---

## O-3 · Nobody asked for this

> No standards body has identified a need. No operator has requested it. Writing a
> specification for an industry that has not asked for one is a way of appearing
> important, and the absence of a work item is evidence there is no demand, not evidence
> of a gap.

**Response: partly rejected, partly accepted.** Rejected on the facts: the absence of a
work item at ITU-R, IEEE, CCSDS and every regulator surveyed is documented in
`gap-analysis.md` with dates and sources, and it coexists with at least seven funded
programmes across two incompatible physical layers and one 2027 flight carrying both.
That is the condition in which interfaces get frozen by accident, bilaterally, and
become expensive to unfreeze.

Accepted on the implication: nobody did ask, and this document has no mandate. That is
why `spec/00-status.md` contains a standing offer to be superseded by any body that opens
a work item, and why we would regard being superseded as success rather than failure.

**Status: open.**

---

## O-4 · The corridor check is weak exactly where the beam is biggest

> The geometric corridor check is the second half of the anti-hijack construction, but at
> GEO a 2 km aperture subtends 0.0032°. Any corridor wide enough to be implementable is
> vastly wider than the pointing requirement, so the check catches only gross failures and
> the closed pointing loop is doing all the real work. The two-of-two claim is therefore
> much weaker at GEO than the text implies.

**Response: accepted.** The arithmetic is correct and the limitation is stated in §5.6
rather than buried. We do not have a fix. A GEO system probably needs a third,
independent check that this document does not specify — plausibly an
independently-surveyed ground-side measurement of where the beam actually is, reported
back over the interface. That would be a real addition to a future version and we would
welcome a proposal.

**Status: open. No mitigation offered.**

---

## O-5 · The exposure treatment is incomplete below 6 GHz

> ICNIRP 2020 changes the local-exposure basis at 6 GHz, from absorbed power density
> above it to specific absorption rate below. The design frequency used throughout the
> examples is 5.8 GHz, which is below that boundary. A power-density screening therefore
> does not address local exposure at all, and a specification that presents power-density
> screening as the exposure treatment is misleading about what has been assessed.

**Response: accepted.** [R-A-013] requires `localExposureBasis` to be declared, and
`not_assessed` is an allowed and honest value. That makes the gap visible; it does not
close it. Closing it requires an RF safety engineer, which this project does not have.

**Status: open. Contributions specifically wanted here.**

---

## O-6 · The interlock assumes a command path that may not exist

> [R-C-022] requires p99 command-path latency below one third of the token lifetime.
> Many operators do not have continuous command coverage — they have contacts. A
> specification that assumes a continuous path has assumed away the ground segment
> economics that make the business hard.

**Response: accepted as a real constraint, rejected as a defect.** It is a genuine
consequence of the design, and it is the correct one: a beam that cannot be stopped
promptly should not be radiating. [R-C-021] therefore recommends a co-located issuer with
a direct path, which converts the problem into one-way light time. An operator without
that cannot deliver on `STANDARD`, and we think that is the right answer rather than a
gap to be softened.

**Status: closed as intended behaviour. Reopen with a counter-example.**

---

## O-7 · The metering standards are cited from memory

> [R-M-012] names IEC 62053-22 classes 0.2S/0.5S and ANSI C12.20 classes 0.2/0.5. These
> were not read from the published documents. A specification that elsewhere refuses to
> carry a second-hand table has carried one here.

**Response: accepted without reservation.** This is a self-identified defect, flagged in
§6.2 and in the §1.4 depth table. [R-M-012] should not be relied upon until the class
designations and editions are verified first-party.

**Status: open. Blocks 0.2.**

---

## O-8 · Direction-neutrality is half-hearted

> The information model uses `receivingSegment` to accommodate space-to-space delivery,
> but every worked example, the keep-out volume, the intruder budget and the entire
> aviation treatment assume a ground receiver. The neutrality is cosmetic.

**Response: accepted.** v0.1 is scoped to space-to-ground and says so. The naming
reserves the slot at zero cost; the `RELAXED` timing profile is the only real
accommodation. A space-to-space profile needs its own hazard analysis — the intruder is
not a person, the keep-out volume is an orbital volume, and the abort budget is set by
relative velocity rather than by a jet.

**Status: open, deliberately deferred.**