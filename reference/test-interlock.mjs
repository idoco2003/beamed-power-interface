// SPDX-License-Identifier: Apache-2.0
//
// Exercises BPI-S. Every assertion names the requirement it is testing, and
// every negative case asserts the REASON, because "it refused" is a weaker claim
// than "it refused for this cause" and only the second catches a machine that
// refuses everything.
import { createPrivateKey, createPublicKey } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { makeClock } from './clock.mjs';
import { issueToken } from './token.mjs';
import { Interlock, deadManBufferM, commandPathAdmissible, ephemerisAdmissibleForCorridor } from './interlock.mjs';

const priv = createPrivateKey(readFileSync('conformance/keys/test-key.pem'));
const pub = createPublicKey(readFileSync('conformance/keys/test-key.pub.pem'));
const KEY = 'test-key-2026-08';
const PROFILE = { profileId: 'STANDARD', tokenLifetimeS: 5, tokenRefreshHz: 1,
                  abortToSafeS: 0.4, corridorHalfAngleDeg: 0.2 };
const CAP = { probeLevelPower_kW: 950, ratedDeliveryPower_kW: 95000,
              abortToSafe_ms: 400, defocusToSafe_ms: 50 };
const AIM = { latDeg: 67.8833, lonDeg: 21.0667, height_m: 341,
              heightRef: 'orthometric', geoidModel: 'EGM2008' };

let fail = 0;
const ok = (r, m) => console.log(`  ${r ? 'ok  ' : 'FAIL'}  ${m}`) || (r || fail++);
const eq = (got, want, m) => ok(got === want, `${m}${got === want ? '' : `  (got ${JSON.stringify(got)}, want ${JSON.stringify(want)})`}`);

function rig({ committedKw = 95000 } = {}) {
  const clock = makeClock();
  const il = new Interlock({ profile: PROFILE, session: 's1', publicKey: pub, clock, capability: CAP, committedKw });
  const mint = (prev, over = {}) => issueToken({
    sessionId: 's1', prev, notAfterMs: clock.now() + PROFILE.tokenLifetimeS * 1000,
    maxPowerKw: 95000, aimPoint: AIM, keyId: KEY, privateKey: priv, clock, ...over });
  return { clock, il, mint };
}
/** Drive a rig all the way to DELIVERING. */
function deliver(r) {
  r.il.offerToken(r.mint(null));
  r.il.arm(); r.il.acquire();
  r.il.pointing = { lockState: 'LOCKED', pilotAuthenticated: true, corridorErrorDeg: 0.03 };
  r.il.groundSeesProbe = true;
  r.il.tryRampUp();
  r.il.setPower(95000);
  return r;
}

console.log('[R-S-001] no radiating above probe without a live token');
{
  const r = rig();
  eq(r.il.arm().reason, 'no live token', 'arming without a token is refused, by name');
  eq(r.il.power, 0, 'power stays at zero');
}

console.log('\n[R-S-011] ACQUIRING to RAMPING_UP needs three of three');
for (const [name, mutate, want] of [
  ['no onboard lock', (il) => { il.pointing.lockState = 'ACQUIRING'; }, 'no onboard pointing lock'],
  ['unauthenticated pilot', (il) => { il.pointing.pilotAuthenticated = false; }, 'pilot not authenticated'],
  ['corridor exceeded', (il) => { il.pointing.corridorErrorDeg = 0.9; }, 'geometric corridor check failed'],
  ['ground does not see the probe', (il) => { il.groundSeesProbe = false; }, 'receiving segment does not confirm the probe'],
]) {
  const r = rig();
  r.il.offerToken(r.mint(null)); r.il.arm(); r.il.acquire();
  r.il.pointing = { lockState: 'LOCKED', pilotAuthenticated: true, corridorErrorDeg: 0.03 };
  r.il.groundSeesProbe = true;
  mutateAndCheck(r, mutate, want, name);
}
function mutateAndCheck(r, mutate, want, name) {
  mutate(r.il);
  const res = r.il.tryRampUp();
  eq(res.reason, want, name + ' blocks ramp-up');
  eq(r.il.state, 'ACQUIRING', name + ' leaves it at probe level');
}

console.log('\n[R-S-002] / [R-S-061] expiry and link loss are one path');
{
  const r = deliver(rig());
  eq(r.il.state, 'DELIVERING', 'reaches DELIVERING');
  r.clock.advance(PROFILE.tokenLifetimeS * 1000 + 1);   // no new token arrives
  const res = r.il.tick();
  eq(res.reasonCode, 'TOKEN_EXPIRY', 'a tick with no token safes the beam');
  eq(r.il.state, 'SAFE', 'TOKEN_EXPIRY is resumable, so SAFE not INHIBITED');
  ok(r.il.power <= CAP.probeLevelPower_kW, 'power is at or below probe level');
}

console.log('\n[R-S-021] a wall clock moved backwards must not extend a token');
{
  const r = deliver(rig());
  r.clock.advance(PROFILE.tokenLifetimeS * 1000 + 1);
  r.clock.stepWallOnly(-60_000);                        // GNSS spoof: 60s backwards
  const res = r.il.tick();
  eq(res.reasonCode, 'TOKEN_EXPIRY', 'the monotonic bound still expires it');
}

console.log('\n[R-S-022] the token ceiling curtails within one refresh');
{
  const r = deliver(rig());
  eq(r.il.power, 95000, 'delivering at the committed rate');
  r.il.offerToken(r.mint(r.il.token, { maxPowerKw: 20000 }));
  const res = r.il.setPower(95000);
  eq(res.power, 20000, 'the next token lowers the ceiling and the beam follows');
}

console.log('\n[R-S-053] latching versus resumable');
{
  const r = deliver(rig());
  const res = r.il.safe('CORRIDOR_VIOLATION');
  eq(res.latched, true, 'CORRIDOR_VIOLATION latches');
  eq(r.il.state, 'INHIBITED', 'and lands in INHIBITED');
  eq(r.il.arm().reason, 'latched: CORRIDOR_VIOLATION', 're-arming is refused while latched');
  eq(r.il.reset({ receivingSigned: true, spaceSigned: false, cause: 'x' }).reason,
     'reset requires both parties', 'a one-sided reset is refused');
  eq(r.il.reset({ receivingSigned: true, spaceSigned: true, cause: '' }).reason,
     'reset requires a written cause', 'a reset without a cause is refused');
  eq(r.il.reset({ receivingSigned: true, spaceSigned: true, cause: 'corridor re-surveyed' }).ok,
     true, 'a two-party signed reset with a cause clears it');
}
{
  const r = deliver(rig());
  eq(r.il.safe('AVIATION_TRANSIT').latched, false, 'AVIATION_TRANSIT is resumable');
  eq(r.il.state, 'SAFE', 'and lands in SAFE');
}

console.log('\n[R-S-043] defocus precedes power-down');
{
  const r = deliver(rig());
  const res = r.il.safe('E_STOP');
  eq(JSON.stringify(res.actions), '["DEFOCUS","POWER_DOWN"]', 'DEFOCUS then POWER_DOWN');
}

console.log('\nDerived quantities');
eq(deadManBufferM(PROFILE, 250), 1350, '[R-S-024] buffer is 1,350 m at 250 m/s');
eq(commandPathAdmissible(PROFILE, 2000), false, '[R-C-022] a 2 s p99 command path may not deliver');
eq(ephemerisAdmissibleForCorridor('SGP4_GP'), false, '[R-S-033] SGP4 is inadmissible for the corridor');
eq(ephemerisAdmissibleForCorridor('GNSS_ONBOARD'), true, '[R-S-033] GNSS onboard is admissible');

console.log(fail ? `\ninterlock: ${fail} failure(s)` : '\ninterlock: all pass');
process.exit(fail ? 1 : 0);
