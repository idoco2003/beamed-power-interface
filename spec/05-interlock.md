<!-- SPDX-License-Identifier: CC-BY-4.0 -->

# §5 BPI-S — Safety Interlock

## 5.1 The invariant

> **Enable is unanimous. Abort is unilateral.**
>
> Power flows only while *both* segments continuously consent. Either segment alone, or
> any declared external authority, can stop it. Consent is a stream of short-lived
> signed tokens; the absence of consent is the default state and requires no message to
> reach anyone.

Everything in this part is machinery for that sentence.

The inversion is the whole design. A naive interlock has the ground *tell the spacecraft
to stop*, which requires a message to arrive during exactly the failure that stops
messages arriving. BPI has the ground *continuously tell the spacecraft it may
continue*. That converts a round-trip problem into a one-way problem, and makes silence
safe.

**[R-S-001]** A space segment SHALL NOT radiate above the probe level except while
holding an unexpired, signature-valid `EnableToken` whose `sessionId` matches the active
session.

**[R-S-002]** On expiry of the last valid token without a successor, a space segment
SHALL transition to `SAFING` immediately and without further instruction.

## 5.2 States

| State | Radiating | Meaning |
|---|---|---|
| `OFFLINE` | no | No session |
| `ENROLLED` | no | Capabilities and attestations exchanged and valid |
| `SCHEDULED` | no | Commitment exists; window not open |
| `ARMED` | no | Pre-window; keep-out declared clear; token stream running |
| `ACQUIRING` | **probe level only** | Establishing pointing lock |
| `RAMPING_UP` | yes, monotone ↑ | Climbing to committed rate |
| `DELIVERING` | yes | At or below `min(committed, token.maxPower_kW)` |
| `RAMPING_DOWN` | yes, monotone ↓ | Nominal wind-down |
| `SAFING` | falling | Abort in progress |
| `SAFE` | ≤ probe level | Session held; may re-arm if the abort reason was non-latching |
| `INHIBITED` | no | **Latched.** Requires two-party signed reset |
| `FAULT` | no | Segment-local failure; window over |

### The probe level

**[R-S-010]** In `ACQUIRING`, radiated power SHALL be such that the power flux-density
anywhere on the receiving body's surface does not exceed **one hundredth** of the
applicable general-public exposure reference level of §7.3.

Against ICNIRP 2020's 10 W/m² that is 0.1 W/m². Twenty decibels below the limit means
that a *total* pointing failure illuminating an unintended population is non-hazardous by
two orders of magnitude, while still leaving 20 dB of dynamic range for a closed
pointing loop to work in.

> **Uncertainty, stated.** Whether 20 dB gives adequate loop signal-to-noise is a
> per-physical-layer implementation question. The value may need to differ between the
> RF and optical annexes. It is a proposal, not a measurement. See `OBJECTIONS.md` §O-2.

## 5.3 Transitions

| From → To | Trigger | Bound |
|---|---|---|
| `SCHEDULED` → `ARMED` | T−`armLeadS` (default 120 s); both ready; keep-out clearance issued within `clearanceValidityS` (default 30 s) | Not armed by T−10 s → window forfeit, `ARM_TIMEOUT` |
| `ARMED` → `ACQUIRING` | Valid unexpired token held; window open | — |
| `ACQUIRING` → `RAMPING_UP` | **Three-of-three**, below | `acquireMaxS` = 30 s, else `SAFE` / `ACQUIRE_TIMEOUT` |
| `RAMPING_UP` → `DELIVERING` | Committed rate reached | `rampUpMaxS` |
| `DELIVERING` → `RAMPING_DOWN` | T−`rampDownS` before window end | — |
| any radiating → `SAFING` | Token stale, abort, corridor violation, exposure excursion, intrusion, efficiency anomaly | §5.6 |
| `SAFING` → `SAFE` | Radiated power ≤ probe level, confirmed by both segments | `abortToSafe_ms` |
| `SAFE` → `INHIBITED` | Abort reason was latching | — |
| `INHIBITED` → `ENROLLED` | Two-party signed reset with a written cause | **Never automatic** |

**[R-S-011]** Transition from `ACQUIRING` to `RAMPING_UP` SHALL require all three of:

1. the space segment asserts pointing lock;
2. the geometric corridor check of [R-S-031] passes;
3. **the receiving segment confirms it is receiving the probe within the predicted
   band**, over the interface.

*Condition 3 is the one a single-segment design omits, and it is the only two-party
proof that the beam is on the correct aperture. An onboard lock claim proves only that
the spacecraft is locked onto something.*

## 5.4 The EnableToken

```json
{ "tokenId": "...", "sessionId": "...", "seq": 4211,
  "prevHash": "sha256:...", "issuedAt": "...", "notAfter": "...",
  "maxPower_kW": 95000, "aimPoint": { }, "constraints": { },
  "issuerKeyId": "...", "sig": { } }
```

**[R-S-020]** Tokens SHALL be hash-chained: `prevHash` SHALL be the SHA-256 of the RFC
8785 canonicalisation of the immediately preceding token in the session.

*Rationale: replay of an old token becomes detectable, and a gap in `seq` becomes visible
in both parties' logs — which is what makes §6.4's `TOKEN_EXPIRY` attribution a question
of fact rather than of assertion.*

**[R-S-021]** `notAfter` SHALL be absolute UTC. A segment SHALL additionally maintain a
**monotonic** elapsed-time check since the last valid token, and SHALL act on whichever
expires first.

*Rationale: never trust a wall clock alone for a safety deadline. A clock that steps
backwards would otherwise extend a token's life.*

**[R-S-022]** `maxPower_kW` SHALL be an authorisation, not merely a liveness proof. The
space segment SHALL radiate at no more than `min(committedPowerCeiling_kW,
token.maxPower_kW)`.

*Rationale: this gives the receiving segment a real-time curtailment lever with no
separate command path. Lowering the number in the next token curtails the beam within
one refresh interval, and it doubles as the mechanism for following a derating plant.
"Reduce power" and "keep going" become the same message, so there is one code path
instead of two — and one code path is the one that gets tested.*

### Why not a heartbeat

The obvious alternative to a signed token is a fast bidirectional heartbeat: the two
segments exchange a liveness signal at some high rate, and the transmitter shuts down when
it stops arriving. It is the design most people propose first, and this section exists
because `[R-S-022]`'s rationale should not have to be inferred.

**A liveness proof cannot carry what this interlock needs.** A heartbeat says *something is
still there*. It does not say who, it does not say how much power is authorised, and it
does not say that this permission is current rather than a recording. The four properties
the token carries are each load-bearing:

| Property | Carried by | What a heartbeat gives instead |
|---|---|---|
| Authorisation | `maxPower_kW`, signed | Nothing. Liveness is not permission. |
| Identity | `issuerKeyId` and the detached JWS | Nothing an attacker cannot also emit |
| Freshness | `seq`, `prevHash`, `notAfter`, monotonic check | A replayed heartbeat is indistinguishable from a live one |
| Curtailment | A lower `maxPower_kW` in the next token | A separate command path, which is a second code path |

The last row is the one that is easy to miss. Under `[R-S-022]` *"reduce power"* and *"keep
going"* are the same message, so there is one code path and it is exercised on every
refresh. A heartbeat needs a separate channel to derate the beam — a channel used rarely,
under stress, and therefore the one least likely to work.

**The rates usually proposed do not survive arithmetic.** A frequently proposed figure is a
100 Hz heartbeat with a hard shutdown in under 10 ms. A 100 Hz signal has a 10 ms period,
and the absence of a 10 ms-period signal cannot be detected in less than 10 ms; one missed
period plus a detection margin is the floor, so the two numbers contradict each other
before any hardware is specified.

The round trip settles the rest. At GEO it is about 239 ms (§5.5), so **any refresh rate
above roughly 4 Hz has its interval inside the round trip** and the sender is waiting on an
acknowledgement that cannot have been generated yet. `profiles/fast.json` already records
this for 10 Hz, which it declares unsuitable for GEO. A 100 Hz scheme is 24 times inside
it. Rate is not the safety property here: a slower token that is signed, sequenced and
expiring is stronger than a fast one that is none of those things.

**What a heartbeat is good for.** Detecting a dead link quickly, which is a real need — and
it is already covered, because a token stream *is* a heartbeat with authorisation attached.
Losing it and having it expire take the same path by construction (`[R-S-002]`), since from
the spacecraft the two are indistinguishable.

## 5.5 Timing, and how the numbers were derived

### The wrong justification, disposed of first

It is tempting to derive the interlock deadline from exposure limits. It does not
survive arithmetic. Take a receiver whose beam runs at 41 W/m² — about four times the
ICNIRP general-public reference level. A person illuminated for time *t* and otherwise
unexposed sees a 30-minute average of 41·(*t*/1800). Staying under 10 W/m² permits
*t* ≤ **439 s**, over seven minutes.

The 30-minute whole-body average tolerates a seven-minute excursion. Any interlock timed
against it would be absurdly slow. **Exposure averaging is not the binding constraint**,
and a specification that claimed it was would be wrong in a way its own numbers disprove.

> Two honest caveats. ICNIRP 2020 also carries a 6-minute local-exposure constraint and
> short-interval absorbed-energy restrictions, which the above does not address. And at
> 5.8 GHz — just below the 6 GHz boundary — the local-exposure basis is specific
> absorption rate rather than absorbed power density, which a power-density screening
> does not cover at all. See §7.3 and `OBJECTIONS.md` §O-5.

### The binding constraint is the intruder

Budget the worst credible case: the receiving segment loses all ability to command, and
the beam must stop anyway.

```
token lifetime remaining          ≤ 5 000 ms
onboard detection and decision    ≤   100 ms
defocus                           ≤    50 ms
power-down ramp to probe level    ≤   250 ms
                                  ───────────
worst-case unsafe duration        ≤ 5 400 ms
```

**[R-S-024]** The declared keep-out volume SHALL include a dead-man buffer of at least

```
intruderSpeedMax_m_s × (tokenLifetimeS + abortToSafeS)
```

measured from the outer edge of the assessed illuminated area.

At a declared 250 m/s — a low-level fast jet, about 490 knots — the STANDARD profile
gives 1,350 m. The consequence is visible on a map: a 1.35 km annulus around a
kilometre-scale aperture is the same order as the aperture itself. Buildable at a remote
site; not buildable next to an airport. **That is the honest way to specify it** — the
number is derived per site from declared parameters rather than handed down as a
constant.

### Profiles

**[R-S-025]** Timing parameters SHALL be taken from a named profile in `profiles/`,
declared in capability and frozen at commitment.

| Profile | Refresh | Lifetime | Losses tolerated | Buffer @ 250 m/s | Intended use |
|---|---|---|---|---|---|
| `FAST` | 10 Hz | 1 s | 9 | ~330 m | Constrained sites; co-located issuer only |
| `STANDARD` | 1 Hz | 5 s | 4 | ~1 350 m | Default |
| `RELAXED` | 0.2 Hz | 30 s | 5 | n/a | Space-to-space, no ground keep-out volume |

**[R-S-026]** `tokenLifetimeS` SHALL be at least three times the declared p99
command-path latency.

*Why 1 Hz and not 10 Hz for the default: five seconds at 1 Hz tolerates four consecutive
losses, and a link that drops five consecutive seconds is not one over which megawatts
should be flowing. And at GEO the round trip is about 239 ms — 1 Hz sits four times
outside it, whereas 10 Hz would put the refresh interval inside the round trip and make
the chain fragile at exactly the altitude where the beam is largest.*

## 5.6 Pointing authority

**[R-S-030]** A space segment SHALL NOT radiate above the probe level unless it is
continuously receiving a valid, **authenticated**, receiving-segment-originated pointing
reference, and SHALL transition to `SAFING` within `pointingLossToSafeMs` (default
500 ms) of losing it.

The *property* is normative. The *mechanism* is not: mandating retrodirective phase
conjugation would exclude every optical system and break the physical-layer-agnostic
core. The core defines an abstract reference with `lockState`, `quality`,
`corridorErrorDeg` and `solutionSource`; Annex RF binds it to a pilot beam.

*A note on vocabulary, because the wrong word costs readers.* What this section describes
is what optical communications and directed-energy work call **acquisition, tracking and
pointing (ATP)**. This document does not use the term normatively, because ATP names a
subsystem and BPI deliberately specifies a property rather than a subsystem — but the
mapping is exact enough to be worth stating. `lockState` moving from `SEARCHING` through
`ACQUIRING` to `LOCKED` is acquisition; maintaining it against relative motion is tracking;
`corridorErrorDeg` against `corridorHalfAngleDeg` is the pointing error budget. An engineer
who arrives looking for an ATP interface has found it.

### Two-of-two, because either alone is catastrophic

**[R-S-031]** Both of the following SHALL hold:

1. **Authenticated pointing reference.** Spread-spectrum with a per-session secret code,
   or an equivalent rolling-code scheme. An unauthenticated lock SHALL be treated as no
   lock.
2. **Independent geometric corridor check.** The pointing solution SHALL lie within
   `corridorHalfAngleDeg` of the direction to the licensed aperture, computed from the
   segment's own ephemeris and the surveyed aperture position. Failure is a **latching**
   abort, `CORRIDOR_VIOLATION`.

*A retrodirective array beams power at whatever emits the pilot tone. An unauthenticated
pilot is therefore a beam-hijacking primitive. These are two independent secrets and two
independent failure paths: an attacker who forges tokens can hold the beam on but cannot
steer it; an attacker who spoofs the pilot cannot survive the corridor check. Neither
check alone is sufficient.*

### Ephemeris admissibility

**[R-S-032]** An ephemeris derived from general-perturbations elements — an OEM
generated from SGP4/SDP4 — SHALL NOT be used as the geometric corridor reference. It
remains admissible for scheduling.

*Rationale, with the arithmetic. A 2 km aperture at 547 km slant range subtends
3.66 mrad = 0.21°. SGP4 error is kilometre-level, and at that range each kilometre of
cross-track error is roughly 0.1°, so a 5 km error is 0.5° — larger than the aperture
itself. A corridor check fed by SGP4 would pass a beam that is entirely off the
aperture. The corridor check requires GNSS-derived onboard position.*

**[R-S-033]** A space segment SHALL declare `ephemerisSource` and `positionAccuracy_m`,
and SHALL NOT claim L2 or L3 conformance with `ephemerisSource: SGP4_GP`.

> **Limitation at GEO, stated.** A 2 km aperture at 35 786 km subtends 56 µrad =
> 0.0032°. The corridor check is far coarser than the pointing requirement there, so the
> closed pointing loop does essentially all the work and the corridor catches only gross
> failures. The two checks are **not** equally strong at all altitudes. See
> `OBJECTIONS.md` §O-4.

## 5.7 Ramps

**Up slow, down fast — two independent reasons, and they conflict.**

**[R-S-040]** Ramp-up SHALL be monotone non-decreasing at no more than 10% of committed
rate per second.

**[R-S-041]** Ramp-up SHALL include a dwell hold at approximately 10% of committed rate
for `holdS` (default 5 s), during which both segments SHALL confirm received power lies
within the predicted band before proceeding.

*Rationale: an anomaly that would be dangerous at 100 MW is diagnostic at 10 MW. The
hold is where a pointing error, an atmospheric surprise or a metering fault reveals
itself cheaply.*

**[R-S-042]** Abort ramp-down SHALL reach the probe level within the segment's declared
`abortToSafe_ms`, target ≤ 250 ms.

**[R-S-043]** The primary abort action SHALL be `DEFOCUS` where the physical layer
supports it, with `POWER_DOWN` following.

*For a phased array, de-phasing the aperture spreads the beam far faster than DC power
can be removed, and keeps the amplifier chain thermally stable.*

**[R-S-044]** The defocused pattern's power flux-density SHALL be declared and screened
under §7, exactly as the main beam is.

*Rationale, and it is a trap: spreading a beam reduces peak flux by orders of magnitude
but redistributes the power over a much larger area — potentially outside the keep-out
volume, onto ground that was never assessed. **A defocus that moves an exposure problem
rather than removing it is not a safe state.***

> **Uncertainty.** 250 ms is clearly achievable for a solid-state array where abort is
> removing drive. Whether it is achievable for a high-power tube chain is not something
> this document can assert. The requirement is on the system; implementers declare their
> measured value, and a design that cannot meet it is a finding worth surfacing rather
> than a number worth softening.

### The grid conflict

Plant-side interconnection rules limit how fast a large generator may change output —
often around 10% of rating per *minute*, orders of magnitude slower than a safety abort.

**[R-S-045]** BPI specifies the **beam** power ramp only. The space segment SHALL honour
the receiving segment's declared `maxDownRamp_kW_per_s` for *nominal* ramps.

**[R-S-046]** A safety abort SHALL override `maxDownRamp_kW_per_s` without exception.

*The consequence — that a fast abort may trip the receiving plant — is the receiving
segment's problem to solve with storage, a dump load or ride-through. This specification
states it here so that nobody discovers it during an incident.*

*Put to an outside engineer working in grid-scale power on 2026-09-03, who reached for
on-site storage unprompted and did not propose that the interlock warn the grid side
earlier. They answered on how rarely this should happen rather than on how large the
transient is, and offered no sizing, so **how much storage a gigawatt-scale receiver needs
to survive a 250 ms trip to zero remains unanswered here**. Recorded as `DISPOSITIONS.md`
C-2.*

## 5.8 Abort

**[R-S-050]** Any of the following SHALL be able to abort:

1. either segment, over the interface;
2. **a local physical emergency stop at the receiving site**, hard-wired into the token
   issuer so that operating it both halts token issuance *and* emits an explicit `Abort`;
3. a declared external abort authority listed in
   `AttestationBundle.externalAbortAuthorities[]`.

**[R-S-051]** `eStopPresent` and `eStopWiredToIssuer` SHALL both be true for any L3
conformance claim.

*A software-only abort at a site with people on it is not credible to a safety
regulator, and both paths — stop issuing, and say stop — must exist because they fail
differently. Giving a regulator a named abort channel in advance is a licensing asset,
not a concession.*

**[R-S-052]** Abort SHALL reach the probe level within 1 s of receipt, of which the
one-way light time is irreducible.

### Reason codes

| Latching — two-party signed reset required | Resumable — may re-arm within the window |
|---|---|
| `EXPOSURE_EXCURSION` | `AVIATION_TRANSIT` |
| `POINTING_AUTHORITY_LOSS` | `WEATHER_BELOW_RATE_FLOOR` |
| `UNAUTHENTICATED_PILOT` | `RECEIVER_PLANT_TRIP` |
| `CORRIDOR_VIOLATION` | `SCHEDULED_PAUSE` |
| `E_STOP` | `CONJUNCTION_MANOEUVRE` |
| `REGULATORY_ORDER` | `GRID_CURTAILMENT` |
| `INTRUSION_CONFIRMED` | `TOKEN_EXPIRY` |

**[R-S-053]** A latching abort SHALL NOT be cleared by a timer, by a new commitment, or
by either party acting alone.

## 5.9 Fail-safe behaviour, by failure mode

**[R-S-060]** Every failure mode below SHALL result in the stated action without
requiring a message to arrive.

| Failure | Detected by | Action |
|---|---|---|
| Token stream stops | Space, on expiry | `SAFING`, `TOKEN_EXPIRY` |
| Command link lost | Space, on expiry | Identical — no special case, which is the point |
| Pointing reference lost | Space | `SAFING` within `pointingLossToSafeMs`, latching |
| Corridor violated | Space | `SAFING`, latching |
| Pilot fails authentication | Space | Treated as no lock; `SAFING`, latching |
| Exposure excursion measured | Receiving | `Abort`, latching; token issuance stops in the same action |
| Intrusion detected | Receiving | `Abort`; latching if confirmed, resumable if a declared transit |
| Receiving plant trips | Receiving | `Abort`, resumable |
| Spacecraft anomaly | Space | `Abort` → `FAULT` |
| Conjunction manoeuvre required | Space | `Abort`, resumable; window amended |
| Clock offset exceeds bound | Either | SHALL NOT enter `DELIVERING`; if already delivering, `SAFING` |
| Efficiency anomaly beyond declared band | Either | `Abort`, resumable, investigated before re-arm |

**[R-S-061]** Loss of the command link and expiry of the token SHALL be handled by the
same code path.

*There is no separate "link lost" branch to get wrong, because there is no way to
distinguish the two from the spacecraft's side, and the safe action is identical.*