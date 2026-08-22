# §3 Architecture

## 3.1 Segments and roles

| Role | Definition |
|---|---|
| **Space segment** | The system that radiates power. Holds the transmitter and its pointing control. |
| **Receiving segment** | The system that accepts power, meters it, owns the keep-out volume, and issues enable tokens. |
| **Receiving Segment Safety Authority** | A named role *within* the receiving segment, organisationally distinct from its commercial operator, which issues and withholds enable tokens. |
| **Broker** | Schedules, publishes opportunities and matches supply to demand. Never radiates, never receives, never issues a token. |
| **External abort authority** | A declared third party — aviation authority, regulator — holding a channel that can stop delivery. |

**[R-C-020]** The enable token SHALL be issued by the receiving segment's safety
authority. The space segment SHALL NOT issue, forge, extend or self-authorise a token
under any circumstance.

*Rationale: the entity with sensors on the keep-out volume and legal liability for the
people inside it must be the entity whose signature keeps the beam alive. Any other
arrangement puts the party that benefits from delivery in charge of stopping it.*

**[R-C-021]** The safety authority SHOULD be co-located with the receiving aperture and
SHOULD have a direct command path to the space segment.

**[R-C-022]** A segment whose p99 command-path latency exceeds one third of the active
profile's `tokenLifetimeS` SHALL NOT enter `DELIVERING`.

*Rationale: routing tokens through a store-and-forward ground network with minute-scale
gaps is not merely worse than a direct path, it is disqualifying — the dead-man
mechanism in §5 depends on the token stream being able to keep up. Stating it as a ratio
rather than a number lets a GEO operator with a 139 ms one-way light time and a LEO
operator with 1.8 ms both find their own answer.*

## 3.2 What crosses which boundary

**BPI is predominantly a ground-to-ground interface.** This is the single most important
architectural fact in the document, and the reason it can be adopted without competing
with existing space-link standards.

```
  ┌──────────────────────┐         BPI over HTTPS          ┌───────────────────────┐
  │  Space operator's    │ ◄─────────────────────────────► │  Receiving segment    │
  │  mission operations  │   capability · attestation      │  operations system    │
  │  centre              │   opportunity · request         │                       │
  │                      │   commitment · amendment        │  ┌─────────────────┐  │
  │                      │   metering · session log        │  │ Safety authority│  │
  └──────────┬───────────┘                                 │  └────────┬────────┘  │
             │                                             └───────────┼───────────┘
             │ operator's EXISTING command link                        │
             │ (CCSDS TC/CLTU, SLE Forward CLTU, proprietary)          │
             ▼                                                         │
     ┌───────────────┐        EnableToken · Abort                      │
     │  Spacecraft   │ ◄───────────────────────────────────────────────┘
     │               │        PointingReference (PHY-specific)
     └───────────────┘
```

**[R-C-023]** Messages 1–7, 12 and 13 SHALL be exchanged between ground systems. Only
`EnableToken`, `Abort` and `PointingReference` need to reach the spacecraft.

**[R-C-024]** BPI does not define a space-link protocol. A space segment SHALL declare
which existing service carries its tokens and aborts, and SHALL declare the measured p50
and p99 latency and the availability of that path.

*Consequence worth stating plainly: an operator can adopt BPI without changing anything
about how they talk to their spacecraft. The token is a payload their existing command
system carries.*

## 3.3 Session model

A **session** is one delivery window against one commitment between one space segment and
one receiving aperture. Sessions do not overlap on the same aperture.

```
 enrolment ──► scheduling ──► session ──► settlement
 (once)        (per window)   (per window)  (per window or interval)

 capability     opportunity    token stream   metering record
 attestation    request        state stream   session log
                commitment     pointing ref
                amendment      abort
```

**[R-C-025]** A space segment and a receiving segment SHALL have exchanged and validated
capability and attestation messages before a commitment referencing them is created.

**[R-C-026]** A session SHALL reference exactly one `commitmentId`, and a commitment
SHALL be referenced by at most one session.

## 3.4 Transport bindings

**[R-C-027]** The mandatory-to-implement ground-to-ground binding SHALL be HTTPS with
TLS 1.3 or later, carrying `application/bpi+json`.

**[R-C-028]** Message-level signatures (§2.7) SHALL be applied regardless of transport
security. Transport authentication is not a substitute: a token that transits an
operator's own command system must remain verifiable at the point it is acted upon,
which is past the end of any TLS session.

**[R-C-029]** The interlock messages — `EnableToken`, `SessionState`, `Abort` — MAY be
carried in a compact binary encoding. RFC 8949 CBOR of the same information model is
RECOMMENDED where bandwidth is constrained. The signature is computed over the JSON
canonicalisation in either case, so a message may be transcoded without invalidating it.

*Rationale: the JSON form is for humans, auditors and disputes; the CBOR form is for a
1 Hz stream over a command link with a small frame budget. Fixing the signature to the
canonical JSON means the two encodings are the same message and a dispute can be settled
against either.*
