<!-- SPDX-License-Identifier: CC-BY-4.0 -->

# Tools

Everything here runs on `node` and `python3` with no committed dependencies. The one
exception is `validate.sh`, which fetches `ajv-cli` through `npx --yes` on demand.

`./tools/check-all.sh` runs the lot. It is the only command you need.

| Tool | Does |
|---|---|
| `check-all.sh` | Every check below, in order |
| `check-requirements.sh` | The requirement set parses and is complete |
| `check-consistency.sh` | Cross-file consistency: id counts, objection counts, withdrawn claims, gap-analysis staleness |
| `bpi-validate.mjs` | **Check an implementation against BPI.** See below |
| `test-jcs.mjs` | RFC 8785 canonicalisation against pinned vectors |
| `verify-signatures.mjs` | Every example's detached JWS verifies |
| `sign-examples.mjs` | Re-sign the examples after editing one |
| `gen-checklist.py` | Regenerate `conformance/checklist.json` from the spec |
| `gen-coverage.mjs` | Which requirements are executed by something that runs |
| `gen-requirement-diff.mjs` | The `[G-1]` requirement-set diff against a tag |
| `gap-staleness.mjs` | Whether `gap-analysis.md` has expired under its own rule |
| `adoption-scan.sh` | Whether anyone is using this |

---

## `bpi-validate` — checking an implementation

```sh
node tools/bpi-validate.mjs vectors [--exec CMD | --harness FILE.mjs]
node tools/bpi-validate.mjs token FILE [--pub PEM]
node tools/bpi-validate.mjs claim FILE
```

**You do not need to talk to anyone to use this.** The vectors are published, the signing
key is published, and the runner is this file. That is the entire point: `OBJECTIONS.md`
O-1 says one implementation is not interoperability, and it can only be closed by someone
who is not us.

### The harness contract

`--exec` is the language-agnostic mode and the one that matters. Your command reads **one
JSON object on stdin**:

```json
{
  "token":     { "msgType": "EnableToken", "seq": 1, "prevHash": "sha256:…", … },
  "context":   { "sessionId": "…", "heldToken": { "seq": 0, "hash": "sha256:…" },
                 "nowMs": 1787379120000, "monotonicMs": 0,
                 "lastAcceptedMonotonicMs": null, "tokenLifetimeS": 5 },
  "publicKey": "-----BEGIN PUBLIC KEY-----…",
  "keyId":     "test-key-2026-08"
}
```

and writes **one JSON object on stdout**:

```json
{ "accepted": false, "reason": "prevHash does not match the held token" }
```

That is the whole interface. No library, no linkage, no language requirement. A C++, Rust,
Python or Go implementation is a first-class participant; the JavaScript one is the harness
that ships in the box, not the privileged one.

`context.heldToken` carries the predecessor's **hash**, not the predecessor. A verifier
never needs a token it was not given, which is what makes the published vectors runnable by
someone who has only this repository.

### The reason is asserted, not just the verdict

Rejection reasons are compared against the vector's `expect.reasons` list. An
implementation that refuses everything fails **all ten** vectors rather than passing eight
of them — verified, by writing one:

```
FAIL  V-010  R-S-021  reason "nope" is not one of ["expired: notAfter has passed"]
vectors: 10 of 10 failed
```

Where an input is invalid on more than one axis, `expect.reasons` lists every reason a
conformant verifier might legitimately give, because the specification does not fix a
validation order. See `DISPOSITIONS.md` F-7.

### Checking your conformance claim

`claim` enforces `[R-CONF-001]` (every identifier enumerated), `[R-CONF-002]` (every
`not-applicable` carries a reason) and `[R-CONF-003]` (the claim names the current
specification version). Run it before opening a pull request adding a row to §8.4.
