// SPDX-License-Identifier: Apache-2.0
//
// bpi-validate — check an implementation against BPI without asking its author.
//
// The specification publishes signed conformance vectors. Until now running them
// meant reading reference/gen-vectors.mjs and reimplementing its self-check,
// which is a barrier disguised as an artefact. This is the runner.
//
// THE POINT IS THE --exec MODE. A verifier written in any language reads one
// vector as JSON on stdin and answers {"accepted":bool,"reason":string} on
// stdout. That is the whole contract. A C++, Rust or Python implementation is a
// first-class participant here, and the JavaScript reference implementation is
// simply the harness that ships in the box rather than the privileged one.
//
// What makes the vectors runnable by an outsider at all: each carries
// context.heldToken as {seq, hash}. A verifier never needs the predecessor
// token, only its hash, so nothing in the chain check requires state this file
// cannot hand over.
//
//   node tools/bpi-validate.mjs vectors [--exec CMD | --harness FILE.mjs]
//   node tools/bpi-validate.mjs token FILE [--pub PEM]
//   node tools/bpi-validate.mjs claim FILE
//
// Exit status is 0 only when everything asked for passed.
import { createPublicKey } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { canonicalize } from './lib/jcs.mjs';
import { verifyDetached } from './lib/jws.mjs';
import { tokenHash } from '../reference/token.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const rel = (p) => resolve(ROOT, p);

const GREEN = (s) => `  ok    ${s}`;
const RED = (s) => `  FAIL  ${s}`;

/* ------------------------------------------------------------------ vectors */

/** The built-in verifier, expressed against the vector context alone.
 *
 * Deliberately NOT reference/validateToken: that function takes the whole
 * predecessor token, which an outsider does not have. Writing it against the
 * published context is the only way to prove the published context is enough.
 */
function builtinVerify(token, context, meta) {
  const pub = createPublicKey(meta.publicKey);

  if (!token || token.msgType !== 'EnableToken') return { accepted: false, reason: 'not an EnableToken' };
  if (token.sessionId !== context.sessionId) return { accepted: false, reason: 'wrong session' };

  // [R-S-020]. Chain before signature, but see DISPOSITIONS F-7: the order is
  // not fixed by the specification, which is why vectors allow several reasons.
  if (context.heldToken) {
    if (token.seq !== context.heldToken.seq + 1) {
      return { accepted: false, reason: `seq gap: expected ${context.heldToken.seq + 1}, got ${token.seq}` };
    }
    if (token.prevHash !== context.heldToken.hash) {
      return { accepted: false, reason: 'prevHash does not match the held token' };
    }
  } else if (token.seq !== 0 || token.prevHash !== null) {
    return { accepted: false, reason: 'first token must be seq 0 with a null prevHash' };
  }

  const sig = verifyDetached(token, pub);
  if (!sig.ok) return { accepted: false, reason: sig.reason };

  // [R-S-021] whichever expires first.
  const wallExpired = context.nowMs > Date.parse(token.notAfter);
  const monoExpired = context.lastAcceptedMonotonicMs != null
    && context.monotonicMs - context.lastAcceptedMonotonicMs > context.tokenLifetimeS * 1000;
  if (wallExpired && monoExpired) return { accepted: false, reason: 'expired on both clocks' };
  if (wallExpired) return { accepted: false, reason: 'expired: notAfter has passed' };
  if (monoExpired) return { accepted: false, reason: 'expired: monotonic lifetime exceeded' };

  return { accepted: true, reason: 'valid' };
}

/** Any-language verifier: one vector in on stdin, one verdict out on stdout. */
function execVerifier(cmd) {
  return (token, context, meta) => {
    const input = JSON.stringify({ token, context, publicKey: meta.publicKey, keyId: meta.keyId });
    let out;
    try {
      out = execFileSync('/bin/sh', ['-c', cmd], { input, encoding: 'utf8', timeout: 30_000 });
    } catch (e) {
      // A crash is a result, and reporting it as one beats a stack trace: an
      // implementation that dies on a malformed token has failed the vector.
      return { accepted: null, reason: `verifier exited non-zero: ${(e.stderr || e.message || '').trim().slice(0, 200)}` };
    }
    try {
      const v = JSON.parse(out);
      if (typeof v.accepted !== 'boolean' || typeof v.reason !== 'string') {
        return { accepted: null, reason: `verifier returned ${out.trim().slice(0, 120)}, wanted {"accepted":bool,"reason":string}` };
      }
      return v;
    } catch {
      return { accepted: null, reason: `verifier output is not JSON: ${out.trim().slice(0, 120)}` };
    }
  };
}

async function runVectors(argv) {
  const execAt = argv.indexOf('--exec');
  const harnessAt = argv.indexOf('--harness');

  let verify = builtinVerify;
  let label = 'built-in reference verifier';
  if (execAt !== -1) {
    const cmd = argv[execAt + 1];
    if (!cmd) return fail('--exec needs a command');
    verify = execVerifier(cmd);
    label = `--exec ${cmd}`;
  } else if (harnessAt !== -1) {
    const file = argv[harnessAt + 1];
    if (!file) return fail('--harness needs a file');
    const mod = await import(resolve(process.cwd(), file));
    if (typeof mod.verify !== 'function') return fail(`${file} does not export verify()`);
    verify = mod.verify;
    label = `--harness ${file}`;
  }

  const doc = JSON.parse(readFileSync(rel('conformance/vectors/token-chain.json'), 'utf8'));
  const meta = { publicKey: doc.publicKey, keyId: doc.keyId };
  console.log(`Vectors: ${doc.count} · BPI ${doc.bpiVersion} · ${label}\n`);

  let bad = 0;
  for (const v of doc.vectors) {
    const got = await verify(v.token, v.context, meta);
    const verdictOk = got.accepted === v.expect.accept;
    // The reason is asserted too. An implementation that rejects everything
    // passes the weaker test and must fail this one.
    const reasonOk = v.expect.accept ? true : v.expect.reasons.includes(got.reason);

    if (verdictOk && reasonOk) {
      console.log(GREEN(`${v.id}  ${v.requirement}  ${v.expect.accept ? 'accept' : 'reject'}: ${got.reason}`));
    } else {
      bad++;
      const why = !verdictOk
        ? `expected ${v.expect.accept ? 'accept' : 'reject'}, got ${got.accepted}`
        : `reason "${got.reason}" is not one of ${JSON.stringify(v.expect.reasons)}`;
      console.log(RED(`${v.id}  ${v.requirement}  ${why}`));
    }
  }
  console.log(bad ? `\nvectors: ${bad} of ${doc.count} failed` : `\nvectors: all ${doc.count} pass`);
  return bad ? 1 : 0;
}

/* -------------------------------------------------------------------- token */

function runToken(argv) {
  const file = argv[0];
  if (!file) return fail('token needs a file');
  const pubAt = argv.indexOf('--pub');
  const pubPem = pubAt !== -1
    ? readFileSync(resolve(process.cwd(), argv[pubAt + 1]), 'utf8')
    : readFileSync(rel('conformance/keys/test-key.pub.pem'), 'utf8');

  const token = JSON.parse(readFileSync(resolve(process.cwd(), file), 'utf8'));
  let bad = 0;
  const check = (ok, msg) => { console.log(ok ? GREEN(msg) : RED(msg)); if (!ok) bad++; };

  check(token.msgType === 'EnableToken', `msgType is EnableToken (got ${token.msgType})`);
  check(typeof token.bpiVersion === 'string', `carries bpiVersion (${token.bpiVersion})`);
  check(Number.isInteger(token.seq) && token.seq >= 0, `seq is a non-negative integer (${token.seq})`);
  check(token.seq === 0 ? token.prevHash === null : typeof token.prevHash === 'string',
    `[R-S-020] prevHash is ${token.seq === 0 ? 'null at seq 0' : 'present after seq 0'}`);
  check(!Number.isNaN(Date.parse(token.notAfter ?? '')), `[R-S-021] notAfter parses as a date (${token.notAfter})`);
  check(typeof token.maxPower_kW === 'number', `[R-S-022] maxPower_kW is a number (${token.maxPower_kW})`);

  // Canonicalisation must be stable: this is where cross-language bugs live.
  try {
    const once = canonicalize(token);
    const twice = canonicalize(JSON.parse(once));
    check(once === twice, 'RFC 8785 canonicalisation is a fixed point');
    console.log(`        sha256 of canonical form: ${tokenHash(token).slice(7, 23)}…`);
  } catch (e) {
    check(false, `RFC 8785 canonicalisation threw: ${e.message}`);
  }

  if (token.sig) {
    const r = verifyDetached(token, createPublicKey(pubPem));
    check(r.ok, `detached JWS verifies${r.ok ? '' : `: ${r.reason}`}`);
  } else {
    check(false, 'no sig block');
  }

  console.log(bad ? `\ntoken: ${bad} problem(s)` : '\ntoken: clean');
  return bad ? 1 : 0;
}

/* -------------------------------------------------------------------- claim */

function runClaim(argv) {
  const file = argv[0];
  if (!file) return fail('claim needs a file');
  const claim = JSON.parse(readFileSync(resolve(process.cwd(), file), 'utf8'));
  const checklist = JSON.parse(readFileSync(rel('conformance/checklist.json'), 'utf8'));
  const want = checklist.requirements.map((r) => r.id);
  const specVersion = checklist.bpiVersion;

  const have = claim.requirements ?? {};
  const missing = want.filter((id) => !(id in have));
  const unknown = Object.keys(have).filter((id) => !want.includes(id));
  const VALID = ['implemented', 'not-implemented', 'not-applicable', 'not-claimed'];

  let bad = 0;
  const check = (ok, msg) => { console.log(ok ? GREEN(msg) : RED(msg)); if (!ok) bad++; };

  check(typeof claim.bpiVersion === 'string', `names a specification version (${claim.bpiVersion})`);

  // [R-CONF-003]: re-issue on a MAJOR change. Under 0.y.z a MAJOR change bumps
  // y, so comparing MAJOR.MINOR is the test. Added because this check caught a
  // live one: a claim left at 0.1.0-draft after the specification went to 0.2.
  const majorMinor = (v) => String(v ?? '').split('.').slice(0, 2).join('.');
  check(majorMinor(claim.bpiVersion) === majorMinor(specVersion),
    `[R-CONF-003] claim is against the current specification (claim ${claim.bpiVersion}, spec ${specVersion})`);
  // [R-CONF-001]: every identifier, not a selection of them.
  check(missing.length === 0, `[R-CONF-001] enumerates all ${want.length} identifiers${missing.length ? ` — missing ${missing.slice(0, 6).join(', ')}${missing.length > 6 ? ` and ${missing.length - 6} more` : ''}` : ''}`);
  check(unknown.length === 0, `no identifiers outside the specification${unknown.length ? ` — found ${unknown.slice(0, 6).join(', ')}` : ''}`);

  const badStatus = Object.entries(have).filter(([, v]) => !VALID.includes(v?.status));
  check(badStatus.length === 0, `every status is one of ${VALID.join(', ')}${badStatus.length ? ` — ${badStatus[0][0]} says "${badStatus[0][1]?.status}"` : ''}`);

  // [R-CONF-002]: not-applicable carries a reason. This is the one people skip.
  const naNoReason = Object.entries(have)
    .filter(([, v]) => v?.status === 'not-applicable' && !String(v.reason ?? '').trim());
  check(naNoReason.length === 0, `[R-CONF-002] every not-applicable carries a reason${naNoReason.length ? ` — ${naNoReason.length} do not, first is ${naNoReason[0][0]}` : ''}`);

  const counts = {};
  for (const v of Object.values(have)) counts[v?.status] = (counts[v?.status] ?? 0) + 1;
  console.log(`\n        ${Object.entries(counts).map(([k, n]) => `${n} ${k}`).join(' · ')}`);
  console.log(bad ? `claim: ${bad} problem(s)` : 'claim: valid');
  return bad ? 1 : 0;
}

/* --------------------------------------------------------------------- main */

function fail(msg) {
  console.error(`bpi-validate: ${msg}`);
  return 2;
}

const USAGE = `bpi-validate — check an implementation against BPI

  vectors [--exec CMD | --harness FILE.mjs]   run the published conformance vectors
  token FILE [--pub PEM]                      check one EnableToken end to end
  claim FILE                                  check a conformance claim against [R-CONF-001/002]

--exec is the language-agnostic mode. Your command reads one JSON object on stdin:

  { "token": {...}, "context": {...}, "publicKey": "-----BEGIN PUBLIC KEY-----...", "keyId": "..." }

and writes one on stdout:

  { "accepted": true|false, "reason": "..." }

Rejection reasons are compared against the vector's allowed list, so an
implementation that refuses everything fails rather than passes.`;

const [cmd, ...argv] = process.argv.slice(2);
let code;
switch (cmd) {
  case 'vectors': code = await runVectors(argv); break;
  case 'token': code = runToken(argv); break;
  case 'claim': code = runClaim(argv); break;
  default: console.log(USAGE); code = cmd ? 2 : 0;
}
process.exit(code);
