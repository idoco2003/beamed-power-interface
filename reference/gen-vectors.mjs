// SPDX-License-Identifier: Apache-2.0
//
// Generate conformance test vectors.
//
// These are the point of the reference implementation. A second implementer can
// take conformance/vectors/, run their own code against it, and find out whether
// they agree with this specification WITHOUT talking to its author. That is the
// mechanism by which a specification becomes something people interoperate on
// rather than something they read.
//
// Every vector states the expected verdict AND the expected reason. A vector
// that only says "reject" cannot distinguish an implementation that rejects for
// the right cause from one that rejects everything.
import { createPrivateKey, createPublicKey } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { makeClock } from './clock.mjs';
import { issueToken, validateToken, tokenHash } from './token.mjs';

const priv = createPrivateKey(readFileSync('conformance/keys/test-key.pem'));
const pub = createPublicKey(readFileSync('conformance/keys/test-key.pub.pem'));
const KEY = 'test-key-2026-08';
const PROFILE = { tokenLifetimeS: 5 };
const AIM = { latDeg: 67.8833, lonDeg: 21.0667, height_m: 341,
              heightRef: 'orthometric', geoidModel: 'EGM2008' };

const clock = makeClock();
const mint = (prev, over = {}) => issueToken({
  sessionId: 's-vectors', prev, notAfterMs: clock.now() + 5000, maxPowerKw: 95000,
  aimPoint: AIM, keyId: KEY, privateKey: priv, clock, ...over });

const t0 = mint(null);
const t1 = mint(t0);
const t2 = mint(t1);

const vectors = [];
// `expect.reasons` is a LIST on purpose. Where an input is invalid on more than
// one axis, which check fires first decides which reason a verifier reports, and
// the specification does not fix a validation order. Demanding one exact string
// would fail a conformant implementation that checks the signature before the
// chain. Recorded as DISPOSITIONS F-7.
const add = (id, requirement, note, token, ctx, expect) =>
  vectors.push({ id, requirement, note, token, context: {
    sessionId: ctx.sessionId ?? 's-vectors',
    heldToken: ctx.prev ? { seq: ctx.prev.seq, hash: tokenHash(strip(ctx.prev)) } : null,
    nowMs: clock.now(), monotonicMs: clock.monotonic(),
    lastAcceptedMonotonicMs: ctx.lastAcceptedMono ?? null,
    tokenLifetimeS: PROFILE.tokenLifetimeS,
  }, expect });
const strip = (t) => { const { sig, ...r } = t; return { ...r, sig: { alg: sig.alg, keyId: sig.keyId } }; };

add('V-001', 'R-S-001', 'A well-formed first token in a session.',
    t0, { prev: null }, { accept: true, reasons: ['valid'] });
add('V-002', 'R-S-020', 'The second token, chaining correctly to the first.',
    t1, { prev: t0 }, { accept: true, reasons: ['valid'] });
add('V-003', 'R-S-020', 'A replay of an already-accepted token.',
    t0, { prev: t0 }, { accept: false, reasons: ['seq gap: expected 1, got 0'] });
add('V-004', 'R-S-020', 'A gap in the chain: seq 2 offered while seq 0 is held.',
    t2, { prev: t0 }, { accept: false, reasons: ['seq gap: expected 1, got 2'] });
add('V-005', 'R-S-020', 'Correct seq, wrong prevHash. Invalid on two axes: the chain no longer matches, and editing prevHash also broke the signature. Either reason is conformant.',
    { ...t1, prevHash: 'sha256:' + '00'.repeat(32) }, { prev: t0 },
    { accept: false, reasons: ['prevHash does not match the held token', 'signature does not verify'] });
add('V-006', 'R-C-015', 'A token whose payload was edited after signing.',
    { ...t0, maxPower_kW: 999999 }, { prev: null },
    { accept: false, reasons: ['signature does not verify'] });
add('V-007', 'R-C-015', 'A token whose sig.keyId no longer matches its protected header.',
    { ...t0, sig: { ...t0.sig, keyId: 'other-key' } }, { prev: null },
    { accept: false, reasons: ['protected kid does not match sig.keyId'] });
add('V-008', 'R-S-001', 'A token for a different session.',
    { ...t0, sessionId: 'someone-elses-session' }, { prev: null },
    { accept: false, reasons: ['wrong session'] });
add('V-009', 'R-S-020', 'A first token that claims a predecessor. Invalid on two axes, as V-005.',
    { ...t0, prevHash: 'sha256:' + 'ab'.repeat(32) }, { prev: null },
    { accept: false, reasons: ['first token must be seq 0 with a null prevHash', 'signature does not verify'] });

// Expiry vectors, taken after the clock has moved past notAfter.
clock.advance(5001);
add('V-010', 'R-S-021', 'Held token whose notAfter has passed on the wall clock.',
    t0, { prev: null }, { accept: false, reasons: ['expired: notAfter has passed'] });

const out = {
  $comment: 'SPDX-License-Identifier: Apache-2.0',
  bpiVersion: '0.2.0-draft',
  about: 'Token-chain conformance vectors. Each states the expected verdict AND the acceptable reasons: an implementation that rejects everything passes the weaker test and fails this one. Where an input is invalid on more than one axis, `reasons` lists every reason a conformant verifier might legitimately report, because the specification does not fix a validation order.',
  publicKey: readFileSync('conformance/keys/test-key.pub.pem', 'utf8').trim(),
  keyId: KEY,
  note: 'The private key is published in conformance/keys/ on purpose, so these vectors can be regenerated rather than only verified. See that directory README.',
  count: vectors.length,
  vectors,
};
writeFileSync('conformance/vectors/token-chain.json', JSON.stringify(out, null, 2) + '\n');

// Self-check: the reference implementation must agree with its own vectors.
let bad = 0;
for (const v of vectors) {
  const held = v.context.heldToken ? [t0, t1, t2].find((t) => t.seq === v.context.heldToken.seq) : null;
  const clk = { now: () => v.context.nowMs, monotonic: () => v.context.monotonicMs, nowIso: () => '' };
  const r = validateToken(v.token, { sessionId: v.context.sessionId, prev: held, publicKey: pub,
    clock: clk, profile: PROFILE, lastAcceptedMono: v.context.lastAcceptedMonotonicMs ?? undefined });
  const okv = r.ok === v.expect.accept && v.expect.reasons.includes(r.reason);
  if (!okv) { bad++; console.log(`  MISMATCH ${v.id}: got ${r.ok}/"${r.reason}", allowed ${JSON.stringify(v.expect.reasons)}`); }
  else console.log(`  ok  ${v.id}  ${v.requirement}  ${v.expect.accept ? 'accept' : 'reject'}: ${r.reason}`);
}
console.log(bad ? `\n${bad} vector(s) disagree with the implementation` : `\n${vectors.length} vectors written and self-consistent`);
process.exit(bad ? 1 : 0);
