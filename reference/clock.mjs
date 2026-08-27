// SPDX-License-Identifier: Apache-2.0
//
// Two clocks, because [R-S-021] requires two.
//
// A token carries an absolute `notAfter`, and a segment must also keep a
// monotonic elapsed-time check since the last valid token, acting on whichever
// expires first. The reason is in the specification's security section: GNSS
// spoofing that steps a wall clock backwards must not lengthen a safety
// deadline. A single clock cannot express that, so the implementation carries
// both and the tests can move them independently.
export function makeClock(startMs = Date.parse('2026-08-22T06:12:00.000Z')) {
  let wall = startMs;
  let mono = 0;
  return {
    now: () => wall,
    nowIso: () => new Date(wall).toISOString().replace(/\.\d{3}Z$/, '.000Z'),
    monotonic: () => mono,
    /** Advance both, which is what real time does. */
    advance(ms) { wall += ms; mono += ms; return this; },
    /** Move the wall clock only. Used to prove a backwards step cannot extend
     *  a token's life, and that a forwards step cannot shorten it below the
     *  monotonic bound either. */
    stepWallOnly(ms) { wall += ms; return this; },
  };
}
