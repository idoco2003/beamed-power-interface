// SPDX-License-Identifier: Apache-2.0
//
// Sign every example that carries a sig block, with the published test key.
//
// Before this existed, every example carried the string
// BASE64URL_DETACHED_JWS_PLACEHOLDER while section 1.4 of the specification
// claimed RFC 8785 as `implemented`. Nothing canonicalised anything and nothing
// verified anything. That gap was not recorded in OBJECTIONS.md, which made it
// the sharpest undisclosed thing in the repository.
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { createPrivateKey, generateKeyPairSync } from 'node:crypto';
import { join } from 'node:path';
import { signDetached } from './lib/jws.mjs';

const KEY_ID = 'test-key-2026-08';
const KEY = 'conformance/keys/test-key.pem';

if (process.argv.includes('--regenerate-key')) {
  const { publicKey, privateKey } = generateKeyPairSync('ed25519');
  writeFileSync(KEY, privateKey.export({ type: 'pkcs8', format: 'pem' }));
  writeFileSync('conformance/keys/test-key.pub.pem', publicKey.export({ type: 'spki', format: 'pem' }));
  console.log('regenerated keypair');
}

const priv = createPrivateKey(readFileSync(KEY));

function* walk(dir) {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) yield* walk(p);
    else if (p.endsWith('.json')) yield p;
  }
}

let signed = 0, skipped = 0;
for (const file of walk('examples')) {
  const doc = JSON.parse(readFileSync(file, 'utf8'));
  if (!doc.sig || typeof doc.sig !== 'object') { skipped++; continue; }

  doc.sig.alg = 'EdDSA';
  doc.sig.keyId = KEY_ID;
  delete doc.sig.value;
  doc.sig.value = signDetached(doc, priv);

  writeFileSync(file, JSON.stringify(doc, null, 2) + '\n');
  console.log('  signed   ' + file);
  signed++;
}

// The metering record's inner signatures[] are a different thing: they are the
// countersignature ledger of [R-M-020], not the envelope signature, and the
// specification does not define them as JWS. Left alone deliberately.
console.log(`\n${signed} signed, ${skipped} without a sig block`);

// The metering record's signatures[] ledger is a second, different thing: the
// countersignature of [R-M-020], which settles a record when two opposing roles
// sign it. The specification defines the FIELD and never defines the FORMAT, so
// there is nothing normative to implement. Recorded as DISPOSITIONS F-6.
//
// These are signed with the same construction the envelope uses, over the record
// with every signatures[].sig absent, so no signer's bytes depend on another's.
// That is a demonstration of one workable construction, not a claim that it is
// the one 0.2 will adopt.
{
  const file = 'examples/disputed-record/metering-record.json';
  const doc = JSON.parse(readFileSync(file, 'utf8'));
  if (Array.isArray(doc.signatures)) {
    const bare = JSON.parse(JSON.stringify(doc));
    bare.signatures = bare.signatures.map(({ sig, ...rest }) => rest);
    delete bare.sig;
    for (const entry of doc.signatures) {
      entry.keyId = KEY_ID;
      entry.sig = signDetached(bare, priv);
    }
    doc.sig.value = signDetached(doc, priv);
    writeFileSync(file, JSON.stringify(doc, null, 2) + '\n');
    console.log('  countersigned  ' + file);
  }
}
