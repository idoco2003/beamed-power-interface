// SPDX-License-Identifier: Apache-2.0
//
// Verify every example signature, then prove the verifier rejects tampering.
//
// A verifier that only ever sees valid input is not evidence of anything. The
// negative cases below each break exactly one thing and assert the reason, on
// the same principle as examples/must-fail: "it was rejected" is a weaker claim
// than "it was rejected for this reason", and only the second one catches a
// verifier that rejects everything.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { createPublicKey, generateKeyPairSync } from 'node:crypto';
import { join } from 'node:path';
import { verifyDetached, signingInput } from './lib/jws.mjs';

const pub = createPublicKey(readFileSync('conformance/keys/test-key.pub.pem'));
let fail = 0;
const ok = (m) => console.log('  ok    ' + m);
const bad = (m) => { console.log('  FAIL  ' + m); fail++; };

function* walk(dir) {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) yield* walk(p);
    else if (p.endsWith('.json')) yield p;
  }
}

console.log('Signatures on examples:');
let n = 0;
let sample = null;
for (const file of walk('examples')) {
  const doc = JSON.parse(readFileSync(file, 'utf8'));
  if (!doc.sig) continue;
  const r = verifyDetached(doc, pub);
  r.ok ? ok(file) : bad(`${file}: ${r.reason}`);
  if (!sample) sample = doc;
  n++;
}
console.log(`  ${n} signed documents`);

console.log('\nTampering must be rejected, and for the stated reason:');
const cases = [
  ['a changed field', (d) => { d.msgId = '00000000-0000-7000-8000-000000000000'; }, 'signature does not verify'],
  ['a changed nested value', (d) => { const k = Object.keys(d).find((x) => typeof d[x] === 'object' && d[x] && !Array.isArray(d[x]) && x !== 'sig' && x !== 'issuer'); if (k) d[k].__injected = 1; else d.issuer.org = 'Someone Else'; }, 'signature does not verify'],
  ['a swapped key id', (d) => { d.sig.keyId = 'some-other-key'; }, 'protected kid does not match sig.keyId'],
  ['a stripped signature', (d) => { delete d.sig.value; }, 'no sig.value'],
  ['a non-detached serialisation', (d) => { const p = d.sig.value.split('.'); d.sig.value = p[0] + '.payload.' + p[2]; }, 'not a detached JWS compact serialisation'],
  ['a wrong algorithm in the header', (d) => { const p = d.sig.value.split('.'); const h = JSON.parse(Buffer.from(p[0], 'base64url').toString()); h.alg = 'HS256'; d.sig.value = Buffer.from(JSON.stringify(h)).toString('base64url') + '..' + p[2]; }, 'alg is HS256, expected EdDSA' ],
];
for (const [name, mutate, wantReason] of cases) {
  const doc = JSON.parse(JSON.stringify(sample));
  mutate(doc);
  const r = verifyDetached(doc, pub);
  if (r.ok) bad(`${name} was ACCEPTED`);
  else if (r.reason !== wantReason) bad(`${name} rejected as "${r.reason}", expected "${wantReason}"`);
  else ok(`${name} rejected: ${r.reason}`);
}

// A signature made by a different key must not verify under ours.
const other = generateKeyPairSync('ed25519');
{
  const doc = JSON.parse(JSON.stringify(sample));
  const { signDetached } = await import('./lib/jws.mjs');
  doc.sig.value = signDetached(doc, other.privateKey);
  const r = verifyDetached(doc, pub);
  r.ok ? bad('a foreign key was ACCEPTED') : ok('a foreign key rejected: ' + r.reason);
}

// sig.alg and sig.keyId must be inside the signed content, per [R-C-015].
{
  const doc = JSON.parse(JSON.stringify(sample));
  const before = signingInput(doc).payload;
  doc.sig.keyId = 'different';
  const after = signingInput(doc).payload;
  before !== after ? ok('sig.keyId is covered by the signature') : bad('sig.keyId is NOT covered by the signature');
  const d2 = JSON.parse(JSON.stringify(sample));
  d2.sig.value = 'anything';
  signingInput(d2).payload === before ? ok('sig.value is excluded from the signature')
                                      : bad('sig.value is NOT excluded from the signature');
}

console.log(fail ? `\nsignatures: ${fail} problem(s)` : '\nsignatures: clean');
process.exit(fail ? 1 : 0);
