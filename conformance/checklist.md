# Conformance checklist

`checklist.json` is the machine-readable register of every normative requirement in this
specification — **110 identifiers** across parts C, S, M, A, RF, SEC and CONF. It is
generated from `spec/*.md` by `tools/gen-checklist.py`, and `tools/check-requirements.sh`
fails the build if the two ever disagree.

*A checklist that has drifted from the specification it claims to enumerate is worse
than no checklist: an implementer answering it would be answering the wrong questions.*

## How to claim conformance

1. Copy `claim-template.json`.
2. Set your role, level and annexes (§8.1).
3. Answer **every** requirement id with one of `implemented`, `not-implemented`,
   `not-applicable` (with a mandatory `reason`), or `not-claimed`.
4. Publish it somewhere you control.
5. Optionally open a pull request adding a row to §8.4.

## On `not-claimed`

`not-claimed` means *"we do this, but we are not asking you to rely on it."* It is
first-class and deliberate. Most conformance frameworks offer only "yes" and "no", which
pushes an honest implementer with an untested feature into either overclaiming or
staying silent. Use it freely; it costs nothing and it is more informative than either
alternative.

## There is no certification

Nobody audits these. Nobody issues a mark. A claim is a self-declaration published where
anyone can check it against your implementation, and [R-CONF-004] forbids describing an
implementation as certified or approved under this specification. For a draft with one
implementation, a claim that can be publicly contradicted is proportionate; anything more
would be theatre.
