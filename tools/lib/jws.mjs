// SPDX-License-Identifier: Apache-2.0
//
// Detached JWS over the RFC 8785 canonicalisation, per [R-C-015].
//
// [R-C-015] says the signature is computed over the canonicalisation of the
// message "with the sig.value member absent". Note what that leaves IN: sig.alg
// and sig.keyId are signed. That is deliberate and worth not undoing, because a
// signature that does not cover the key id it was made with can be replayed
// under a different key id by anyone who can edit the message.
//
// The serialisation is the JWS compact form with the payload detached:
//
//     BASE64URL(protected) || ".." || BASE64URL(signature)
//
// The payload is omitted because the verifier already has it: it is the message
// the signature travels in. Including it would double the message size and give
// two copies that could disagree.

import { createSign, createVerify, sign as edSign, verify as edVerify } from 'node:crypto';
import { canonicalize } from './jcs.mjs';

const b64u = (buf) => Buffer.from(buf).toString('base64url');

/** The JOSE algorithm name for Ed25519 is EdDSA, per RFC 8037. */
export const JWS_ALG = 'EdDSA';

/** The bytes a signature is computed over. Exported so a test can show them. */
export function signingInput(message) {
  const { sig, ...rest } = message;
  const covered = sig ? { ...rest, sig: { alg: sig.alg, keyId: sig.keyId } } : rest;
  const payload = canonicalize(covered);
  const protectedHeader = b64u(JSON.stringify({ alg: JWS_ALG, kid: sig?.keyId }));
  return {
    payload,
    protectedHeader,
    tbs: Buffer.from(protectedHeader + '.' + b64u(payload), 'ascii'),
  };
}

/** Detached JWS for `message`, signed with an Ed25519 private key. */
export function signDetached(message, privateKey) {
  const { protectedHeader, tbs } = signingInput(message);
  const signature = edSign(null, tbs, privateKey);
  return protectedHeader + '..' + b64u(signature);
}

/** Verify a detached JWS. Returns { ok, reason } — the reason matters, because a
 *  test that only proves "rejected" does not prove it was rejected correctly. */
export function verifyDetached(message, publicKey) {
  const value = message?.sig?.value;
  if (typeof value !== 'string') return { ok: false, reason: 'no sig.value' };
  const parts = value.split('.');
  if (parts.length !== 3 || parts[1] !== '') return { ok: false, reason: 'not a detached JWS compact serialisation' };

  let header;
  try { header = JSON.parse(Buffer.from(parts[0], 'base64url').toString('utf8')); }
  catch { return { ok: false, reason: 'protected header is not JSON' }; }
  if (header.alg !== JWS_ALG) return { ok: false, reason: `alg is ${header.alg}, expected ${JWS_ALG}` };
  if (header.kid !== message.sig.keyId) return { ok: false, reason: 'protected kid does not match sig.keyId' };

  const { tbs } = signingInput(message);
  const okSig = edVerify(null, tbs, publicKey, Buffer.from(parts[2], 'base64url'));
  return okSig ? { ok: true, reason: 'signature verifies' } : { ok: false, reason: 'signature does not verify' };
}
