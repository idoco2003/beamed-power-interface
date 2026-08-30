<!-- SPDX-License-Identifier: CC-BY-4.0 -->

# BPI C++ SDK

RFC 8785 canonicalisation, detached JWS verification, and the BPI-S derived quantities,
in C++17.

## What this is for

**It does not close [`OBJECTIONS.md`](../../OBJECTIONS.md) O-1.** O-1 asks for an
implementation by someone other than the author, and this is the author's second one. Two
things written by the same person agreeing is not evidence of interoperability.

What it does is put the specification in front of a genuinely different reader:

| | JavaScript reference | This |
|---|---|---|
| JSON parsing | V8's `JSON.parse` | `include/bpi/json.hpp`, written here |
| Number formatting | `Number::toString`, free | `es_number()`, implemented by hand |
| Key ordering | native UTF-16 string compare, free | UTF-8 → UTF-16 conversion in a comparator |
| Ed25519 | `node:crypto`, OpenSSL-backed | libsodium |

Every row is a place two implementations can silently disagree and then accuse each other
of forgery. `tools/lib/jcs.mjs` says as much in its own header — *"JavaScript gives us the
number rule for free… that is the strongest argument for canonicalising here rather than in
Python, where matching it takes real work."* This is that work, done, so the claim can be
checked instead of believed.

## Results

- **All 10 published conformance vectors pass**, including the two that require a
  signature to verify — so the canonical bytes produced here are identical to the ones
  Node signed over.
- **35 JSON files in this repository canonicalise byte-for-byte identically** in both
  implementations (`make crosscheck`).
- The derived quantities agree: 1,350 m of dead-man buffer at the STANDARD profile,
  330 m at FAST, a 2 s p99 command path barred from delivering, SGP4 inadmissible for the
  corridor.
- **Requirement coverage did not move.** The C++ suite executes 7 requirements, all of
  them already executed by the JavaScript reference. A second implementation raises
  confidence in existing coverage; it does not broaden it. See
  [`reference/COVERAGE.md`](../../reference/COVERAGE.md).

## Building

```sh
make            # everything
make check      # unit tests, then the published vectors through bpi-validate
make crosscheck # both canonicalisers over every JSON file in the repository
```

The only dependency is **libsodium**, and only for `bpi-verify` and `bpi-canon`; the
canonicaliser and the interlock tests build with nothing but a C++17 compiler.

`ARCH` is detected from the libsodium on your machine, because a native library built for
a different architecture than your compiler defaults to fails to link with a message about
missing symbols rather than about architecture. Override with `make ARCH=arm64` if you
know better. On this machine libsodium is x86_64, so the crypto binaries are built x86_64
and run under Rosetta; an arm64 libsodium would make that go away.

## Files

| File | What |
|---|---|
| `include/bpi/json.hpp` | JSON value and parser; object members held in UTF-16 code unit order |
| `include/bpi/jcs.hpp` | RFC 8785, including ECMAScript `Number::toString` |
| `include/bpi/jws.hpp` | Detached JWS over the canonicalisation, per `[R-C-015]` |
| `include/bpi/interlock.hpp` | `[R-S-024]`, `[R-C-022]`, `[R-S-033]` derived quantities |
| `src/bpi-verify.cpp` | Speaks the `bpi-validate --exec` harness contract |
| `src/bpi-canon.cpp` | JSON in, canonical form out |

## Using it as a conformance target

```sh
node ../../tools/bpi-validate.mjs vectors --exec "./build/bpi-verify"
```

That is the same command an outside implementer would run against their own binary. See
[`tools/README.md`](../../tools/README.md) for the contract: one JSON object in on stdin,
`{"accepted": bool, "reason": string}` out on stdout.

## The number formatting, since it is the interesting part

`es_number()` implements ECMA-262 `Number::toString` on top of a widening search for the
shortest round-tripping decimal — the first precision whose `strtod` parse-back is
bit-identical *is* the shortest representation, by construction, and seventeen significant
digits always suffice for a binary64. `std::to_chars` would do the same job on a recent
standard library; the search is portable to every one and is obviously correct on
inspection, which matters more here than speed.

Checked against the JavaScript implementation on the awkward cases: `1e+21` and `1e-7`
(the two thresholds where ECMAScript switches to exponential), `5e-324` (the smallest
denormal), `1.7976931348623157e+308`, `0.3333333333333333`, and
`123456789012345680000` — a 21-digit integer that has to round. Fifteen of fifteen agree.
