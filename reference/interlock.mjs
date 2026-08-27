// SPDX-License-Identifier: Apache-2.0
//
// The BPI-S state machine, as a reference implementation.
//
// Twenty-seven normative requirements in BPI-S had never been executed by
// anything before this file existed. Prose cannot be run, so a requirement that
// only exists in prose has never been shown to be implementable, consistent with
// its neighbours, or even unambiguous. Several of the notes below record places
// where writing this found that the specification said less than it appeared to.
//
// This is the AUTHOR'S reference implementation. It does not close OBJECTIONS
// O-1, which asks for an INDEPENDENT one, and nothing here should be read as
// claiming otherwise. What it does is make O-1 closable by someone else: the
// vectors generated from it are something a second implementer can check against
// without ever talking to us.
import { validateToken } from './token.mjs';

export const STATES = ['OFFLINE', 'ENROLLED', 'SCHEDULED', 'ARMED', 'ACQUIRING',
  'RAMPING_UP', 'DELIVERING', 'RAMPING_DOWN', 'SAFING', 'SAFE', 'INHIBITED', 'FAULT'];

/** [R-S-053] These require a two-party signed reset and are never cleared by a
 *  timer, a new commitment, or either party acting alone. */
export const LATCHING = new Set(['EXPOSURE_EXCURSION', 'POINTING_AUTHORITY_LOSS',
  'UNAUTHENTICATED_PILOT', 'CORRIDOR_VIOLATION', 'E_STOP', 'REGULATORY_ORDER',
  'INTRUSION_CONFIRMED']);

const RADIATING = new Set(['ACQUIRING', 'RAMPING_UP', 'DELIVERING', 'RAMPING_DOWN', 'SAFING']);

export class Interlock {
  constructor({ profile, session, publicKey, clock, capability, committedKw }) {
    this.profile = profile;
    this.session = session;
    this.publicKey = publicKey;
    this.clock = clock;
    this.cap = capability;
    this.committedKw = committedKw ?? capability.ratedDeliveryPower_kW;
    this.state = 'ENROLLED';
    this.power = 0;            // kW at the radiation point
    this.token = null;
    this.lastAcceptedMono = undefined;
    this.pointing = { lockState: 'NONE', pilotAuthenticated: false, corridorErrorDeg: null };
    this.groundSeesProbe = false;
    this.log = [];
    this.latchedReason = null;
  }

  get radiating() { return RADIATING.has(this.state) && this.power > 0; }
  /** [R-S-010] The probe level is a fraction of the public exposure reference
   *  level, so it is derived from the site rather than carried as a constant. */
  get probeKw() { return this.cap.probeLevelPower_kW; }

  #to(state, why) {
    this.log.push({ t: this.clock.now(), from: this.state, to: state, why });
    this.state = state;
    return this;
  }

  /** [R-S-001] and [R-S-002]. Called on every token, and on every tick where one
   *  did not arrive, which is the same code path by construction. */
  offerToken(token) {
    const r = validateToken(token, {
      sessionId: this.session, prev: this.token, publicKey: this.publicKey,
      clock: this.clock, profile: this.profile, lastAcceptedMono: this.lastAcceptedMono,
    });
    if (!r.ok) return { accepted: false, reason: r.reason };
    this.token = token;
    this.lastAcceptedMono = this.clock.monotonic();
    return { accepted: true, reason: 'valid' };
  }

  /** True while the held token is still live on both clocks. */
  #tokenLive() {
    if (!this.token) return false;
    if (this.clock.now() > Date.parse(this.token.notAfter)) return false;
    if (this.lastAcceptedMono !== undefined
        && this.clock.monotonic() - this.lastAcceptedMono > this.profile.tokenLifetimeS * 1000) return false;
    return true;
  }

  arm() {
    if (this.state === 'INHIBITED') return { ok: false, reason: 'latched: ' + this.latchedReason };
    if (!this.#tokenLive()) return { ok: false, reason: 'no live token' };
    this.#to('ARMED', 'armed with a live token');
    return { ok: true };
  }

  /** ARMED -> ACQUIRING. Radiates, but only at probe level. */
  acquire() {
    if (this.state !== 'ARMED') return { ok: false, reason: 'not ARMED' };
    if (!this.#tokenLive()) return { ok: false, reason: 'no live token' };
    this.power = this.probeKw;
    this.#to('ACQUIRING', 'probe level only');
    return { ok: true };
  }

  /**
   * [R-S-011] three-of-three. The third condition is the one a single-segment
   * design omits, and it is the only two-party proof that the beam is on the
   * correct aperture: an onboard lock claim proves only that the spacecraft is
   * locked onto something.
   */
  tryRampUp() {
    if (this.state !== 'ACQUIRING') return { ok: false, reason: 'not ACQUIRING' };
    if (this.pointing.lockState !== 'LOCKED') return { ok: false, reason: 'no onboard pointing lock' };
    if (!this.pointing.pilotAuthenticated) return { ok: false, reason: 'pilot not authenticated' };
    if (this.pointing.corridorErrorDeg === null
        || this.pointing.corridorErrorDeg > this.profile.corridorHalfAngleDeg) {
      return { ok: false, reason: 'geometric corridor check failed' };
    }
    if (!this.groundSeesProbe) return { ok: false, reason: 'receiving segment does not confirm the probe' };
    this.#to('RAMPING_UP', 'three-of-three satisfied');
    return { ok: true };
  }

  /** [R-S-022] radiate at min(committed, token ceiling). Lowering the ceiling in
   *  the next token curtails within one refresh, with no separate command path. */
  setPower(requestedKw) {
    if (!this.#tokenLive()) return this.safe('TOKEN_EXPIRY');
    const ceiling = Math.min(this.committedKw, this.token.maxPower_kW);
    this.power = Math.min(requestedKw, ceiling);
    if (this.state === 'RAMPING_UP' && this.power >= ceiling) this.#to('DELIVERING', 'committed rate reached');
    return { ok: true, power: this.power, ceiling };
  }

  /** A tick with no new token. [R-S-061]: loss of link and token expiry are the
   *  same code path, because from here they are indistinguishable and the safe
   *  action is identical. */
  tick() {
    if (RADIATING.has(this.state) && !this.#tokenLive()) return this.safe('TOKEN_EXPIRY');
    return { ok: true, state: this.state };
  }

  /** [R-S-043] DEFOCUS first where the layer supports it, POWER_DOWN after.
   *  [R-S-046] a safety abort overrides the receiver's declared ramp limit. */
  safe(reasonCode) {
    if (!RADIATING.has(this.state) && this.state !== 'ARMED') {
      return { ok: true, state: this.state, reason: 'already not radiating' };
    }
    this.#to('SAFING', reasonCode);
    const actions = this.cap.defocusToSafe_ms > 0 ? ['DEFOCUS', 'POWER_DOWN'] : ['POWER_DOWN'];
    this.clock.advance(this.cap.abortToSafe_ms);
    this.power = Math.min(this.power, this.probeKw);
    if (LATCHING.has(reasonCode)) {
      this.latchedReason = reasonCode;
      this.#to('INHIBITED', 'latching: ' + reasonCode);
    } else {
      this.#to('SAFE', 'resumable: ' + reasonCode);
    }
    return { ok: true, state: this.state, actions, reasonCode, latched: LATCHING.has(reasonCode) };
  }

  /** [R-S-053] INHIBITED clears only on a two-party signed reset. */
  reset({ receivingSigned, spaceSigned, cause }) {
    if (this.state !== 'INHIBITED') return { ok: false, reason: 'not INHIBITED' };
    if (!receivingSigned || !spaceSigned) return { ok: false, reason: 'reset requires both parties' };
    if (!cause) return { ok: false, reason: 'reset requires a written cause' };
    this.latchedReason = null;
    this.#to('ENROLLED', 'two-party reset: ' + cause);
    return { ok: true };
  }
}

/**
 * [R-S-024] the dead-man buffer, derived rather than asserted.
 *
 * This is the requirement that turns a timing parameter into land: at the
 * STANDARD profile and a declared 250 m/s it is 1,350 m of annulus, which is the
 * same order as a kilometre-scale aperture and decides whether a site is
 * buildable at all.
 */
export const deadManBufferM = (profile, intruderSpeedMaxMs) =>
  intruderSpeedMaxMs * (profile.tokenLifetimeS + profile.abortToSafeS);

/** [R-C-022] a segment whose command path is too slow may not deliver. */
export const commandPathAdmissible = (profile, latencyMsP99) =>
  profile.tokenLifetimeS * 1000 >= 3 * latencyMsP99;

/** [R-S-033] SGP4 general-perturbations elements are inadmissible as the
 *  corridor reference, and bar an L2 or L3 conformance claim. */
export const ephemerisAdmissibleForCorridor = (source) => source !== 'SGP4_GP';
