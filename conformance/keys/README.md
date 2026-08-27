<!-- SPDX-License-Identifier: CC-BY-4.0 -->

# Test keys

**These are test keys. The private key is published on purpose. Never use them for
anything.**

## Why the private key is here

A conformance test vector is only useful if someone else can reproduce it. If the private
key were secret, a second implementer could verify the signatures in `examples/` but
could not generate their own and check that they got the same bytes out. Reproducing the
signature is the stronger test, because it exercises the canonicalisation, the signing
input construction and the serialisation, where verification alone only exercises the
last of those.

Published test keys are the normal practice for exactly this reason. RFC test vectors do
the same thing.

## What that means for you

- **Anything signed with `test-key.pem` is worthless as evidence of anything.** Anyone can
  produce a valid signature under it, because anyone can read the key.
- No real deployment may use these. `[R-SEC-001]` requires a real safety authority to hold
  keys distinct from anything else, and a key printed in a public repository is the
  opposite of that.
- The examples in `examples/` carry real signatures under this key. They demonstrate that
  the scheme works and that the canonicalisation is right. They demonstrate nothing at all
  about who signed them.

## Files

| File | What |
|---|---|
| `test-key.pem` | Ed25519 private key, PKCS#8 PEM. **Public on purpose.** |
| `test-key.pub.pem` | The matching public key, SPKI PEM. |

Key id used in the examples: `test-key-2026-08`.

## Regenerating

`tools/sign-examples.mjs --regenerate-key` makes a new pair and re-signs everything.
Doing so changes every signature in `examples/`, which is a large and meaningless diff, so
there is no reason to unless the scheme itself changes.
