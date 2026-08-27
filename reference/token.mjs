// SPDX-License-Identifier: Apache-2.0
//
// EnableToken issuance and validation. This is the dead-man of BPI-S.
//
// The invariant the whole design rests on: a space segment may not radiate above
// the probe level unless it is holding an unexpired, signature-valid token whose
// session matches. Everything here exists to make "unexpired, valid" a decision a
// machine makes the same way twice.
import { createHash } from 'node:crypto';
import { canonicalize } from '../tools/lib/jcs.mjs';
import { signDetached, verifyDetached } from '../tools/lib/jws.mjs';

export const BPI_VERSION = '0.2.0-draft';

/** SHA-256 over the canonicalisation, which is what [R-S-020] chains on. */
export const tokenHash = (token) =>
  'sha256:' + createHash('sha256').update(canonicalize(token), 'utf8').digest('hex');

/**
 * Issue the next token in a session.
 *
 * `prev` is the token this one chains to, or null at seq 0. Chaining means a
 * replayed token is detectable and a gap in `seq` is visible in both parties'
 * logs, which is what makes [R-M-031]'s TOKEN_EXPIRY attribution a question of
 * fact rather than of assertion.
 */
export function issueToken({ sessionId, prev, notAfterMs, maxPowerKw, aimPoint,
                             keyId, privateKey, clock }) {
  const token = {
    bpiVersion: BPI_VERSION,
    msgType: 'EnableToken',
    msgId: `tok-${sessionId}-${prev ? prev.seq + 1 : 0}`,
    issuedAt: clock.nowIso(),
    issuer: { org: 'Reference Receiving Segment', role: 'RECEIVING' },
    tokenId: `tok-${prev ? prev.seq + 1 : 0}`,
    sessionId,
    seq: prev ? prev.seq + 1 : 0,
    prevHash: prev ? tokenHash(stripSig(prev)) : null,
    notAfter: new Date(notAfterMs).toISOString().replace(/\.\d{3}Z$/, '.000Z'),
    maxPower_kW: maxPowerKw,
    aimPoint,
    issuerKeyId: keyId,
    sig: { alg: 'EdDSA', keyId },
  };
  token.sig.value = signDetached(token, privateKey);
  return token;
}

const stripSig = (t) => { const { sig, ...rest } = t; return { ...rest, sig: { alg: sig.alg, keyId: sig.keyId } }; };

/**
 * Validate a token against the session, the chain and both clocks.
 *
 * Returns `{ ok, reason }`. The reason is load-bearing: a validator that says
 * only "rejected" cannot be shown to reject for the right cause, and the whole
 * test suite for this file turns on that distinction.
 */
export function validateToken(token, { sessionId, prev, publicKey, clock, profile, lastAcceptedMono }) {
  if (!token || token.msgType !== 'EnableToken') return { ok: false, reason: 'not an EnableToken' };
  if (token.sessionId !== sessionId) return { ok: false, reason: 'wrong session' };

  // [R-S-020] chain. A token that does not chain to what we hold is either a
  // replay or evidence that we missed one; both mean do not act on it.
  if (prev) {
    if (token.seq !== prev.seq + 1) return { ok: false, reason: `seq gap: expected ${prev.seq + 1}, got ${token.seq}` };
    if (token.prevHash !== tokenHash(stripSig(prev))) return { ok: false, reason: 'prevHash does not match the held token' };
  } else if (token.seq !== 0 || token.prevHash !== null) {
    return { ok: false, reason: 'first token must be seq 0 with a null prevHash' };
  }

  const sig = verifyDetached(token, publicKey);
  if (!sig.ok) return { ok: false, reason: sig.reason };

  // [R-S-021] whichever expires first. The monotonic bound is what survives a
  // wall clock that has been moved.
  const wallExpired = clock.now() > Date.parse(token.notAfter);
  const monoExpired = lastAcceptedMono !== undefined
    && clock.monotonic() - lastAcceptedMono > profile.tokenLifetimeS * 1000;
  if (wallExpired && monoExpired) return { ok: false, reason: 'expired on both clocks' };
  if (wallExpired) return { ok: false, reason: 'expired: notAfter has passed' };
  if (monoExpired) return { ok: false, reason: 'expired: monotonic lifetime exceeded' };

  return { ok: true, reason: 'valid' };
}
