<!-- SPDX-License-Identifier: CC-BY-4.0 -->

# Reference implementation

The BPI-S interlock, executable.

## What this is for

Twenty-seven normative requirements in BPI-S had never been executed by anything.
Prose cannot be run, so a requirement that exists only in prose has never been shown to be
implementable, consistent with its neighbours, or unambiguous. Writing this found four
things the specification got wrong or left undefined, all recorded in
[`DISPOSITIONS.md`](../DISPOSITIONS.md) as F-4 through F-7.

## What this is not

**It is not an independent implementation and it does not close `OBJECTIONS.md` O-1.**
O-1 asks for an implementation by someone other than the author, and this is the author's.
A specification whose only implementation is its own author's has still not been shown to
be interoperable with anything.

What it does is make O-1 *closable by someone else*. The vectors in
[`../conformance/vectors/`](../conformance/vectors/) let a second implementer check their
work against this specification without ever talking to us, which is the mechanism by
which a document becomes something people interoperate on rather than something they read.

It is also not flight software. There is no hardware, no real time, and the clock is
injected so tests can move it.

## Files

| File | What |
|---|---|
| `clock.mjs` | Wall and monotonic clocks, separately movable, because [R-S-021] needs both |
| `token.mjs` | Token issuance, the [R-S-020] hash chain, and validation |
| `interlock.mjs` | The BPI-S state machine and the derived quantities |
| `test-interlock.mjs` | Exercises the requirements; every negative case asserts the reason |
| `gen-vectors.mjs` | Writes `../conformance/vectors/token-chain.json` and self-checks it |

## Running

```sh
node reference/test-interlock.mjs
node reference/gen-vectors.mjs
```

Both run inside `tools/check-all.sh`.

## The rule the tests follow

Every negative case asserts the **reason**, not just the refusal. *"It refused"* is a
weaker claim than *"it refused for this cause"*, and only the second catches an
implementation that refuses everything.

The one place that rule needed loosening is recorded as F-7: where an input is invalid on
more than one axis, which check fires first depends on validation order, and the
specification does not fix one. Those vectors list every reason a conformant verifier
might legitimately give.
