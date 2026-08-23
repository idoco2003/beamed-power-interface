<!-- SPDX-License-Identifier: CC-BY-4.0 -->

# §6 BPI-M — Metering and Settlement

## 6.1 Metering points

**[R-M-001]** Both segments SHALL declare their metering points, each with a name, a
one-line-diagram reference, and the physical boundary it represents.

| Point | Owned by | Definition |
|---|---|---|
| **Revenue metering point** | Receiving | The named electrical boundary at which delivered energy is settled — typically the medium-voltage terminals of the power conversion system, or a declared DC bus |
| **Check metering point** | Receiving | Optional independent second meter |
| **Radiation point** | Space | RF output of the antenna, or DC input to the amplifier chain — **stated which** |

**[R-M-002]** The **settled quantity SHALL be the receiving-side delivered energy at the
revenue metering point.**

*Rationale: that is what the customer actually receives. The space-side figure is not a
competing truth — it exists to bound disputes and to compute end-to-end efficiency.*

## 6.2 Sampling, aggregation and meter class

**[R-M-010]** Interior samples SHALL be taken at 1 Hz at each declared metering point,
timestamped per §2.2.

**[R-M-011]** Energy SHALL be aggregated **both** per delivery window and into the
receiving segment's declared `settlementIntervalMin`.

*A LEO delivery window is 1.5–3 minutes, shorter than any electricity market interval. A
supplier delivering four windows inside one 15-minute interval must be able to produce
both views, because one is the physics and the other is how the money moves.*

**[R-M-012]** A revenue meter SHALL be of accuracy class **0,1 S, 0,2 S or 0,5 S** per
IEC 62053-22:2020, or **0.1, 0.2 or 0.5** per ANSI C12.20, and the record SHALL carry
its class, the standard and edition the class is claimed under, its serial number, and
its calibration certificate date.

**[R-M-014]** A meter accuracy class SHALL NOT be presented as evidence that a
particular meter's readings are valid for trade. The record SHALL carry the legal
metrology basis separately, or declare that it holds none.

*Why [R-M-014] exists, and it is the useful half of this section.* IEC 62053-22:2020
states that it "applies to their type tests only". A type test establishes that a
**design** of meter meets a class in a laboratory. Whether **this** meter, in this
cabinet, on this date, produces readings admissible for settlement is a different
question, governed by national legal metrology — the Measuring Instruments Directive in
Europe, state regulation in the United States, and their equivalents elsewhere. A
specification that let an implementer write "class 0,2 S" and consider the matter closed
would be inviting exactly the wrong inference at exactly the point where money changes
hands.

Two further consequences of the same reading, worth stating because they are easy to
miss:

- IEC 62053-22:2020 covers **transformer-operated** meters. A directly-connected meter is
  a different part of the series.
- Edition 2.0 moved the general requirements and test methods out to **IEC 62052-11:2020**
  and left only class-specific requirements behind. Citing 62053-22 alone is therefore
  citing half of the applicable text.

**[R-M-013]** Every value in the settled energy path SHALL carry provenance per §2.6.

## 6.3 The MeteringRecord

```
MeteringRecord {
  recordId, commitmentId, sessionId, window { start, end },
  delivered  { energy_kWh, _prov, meteringPointRef,
               meterClass, meterSerial, calibrationDate },
  transmitted{ energy_kWh, _prov, radiationPointRef },
  efficiency { value, numeratorPoint, denominatorPoint, pathLength_m, _prov },
  samples[]  { t, receivedPower_kW, transmittedPower_kW, elevationDeg,
               rainRate_mmh, _prov },
  settlementIntervals[] { start, end, energy_kWh },
  nonDelivery[]{ start, end, energy_kWh_shortfall, causeCode, bearer,
                 evidenceRef, disputed },
  atmosphericConditions { modelRefs[], source, _prov },
  attestationRef, sessionLogRef,
  signatures[] { role, org, keyId, sig, signedAt }
}
```

**[R-M-020]** A record is **settleable** only when it carries signatures from two
opposing roles **and** the two independent energy figures reconcile within the declared
tolerance:

```
| E_delivered − E_transmitted × η_expected |  ≤  tolerance
```

**[R-M-021]** `η_expected` SHALL be computed from the declared propagation models using
the *actual* elevation and weather over the window. A nameplate efficiency SHALL NOT be
used.

**[R-M-022]** A record containing any `estimated` or `declared` value in the settled
energy path SHALL NOT settle without explicit countersignature of that specific field by
both parties.

**[R-M-023]** `efficiency` SHALL name both endpoints and the path length, per [R-C-010].
A bare efficiency figure is invalid.

*This last one is worth a sentence of motivation. Two public demonstrations currently
quote "20.8% DC-to-DC over 100 m" and "≥70% end-to-end". Those are not the same
measurement and cannot be compared, and there is at present no convention that would
make them comparable. Requiring both endpoints is a small thing a specification can fix
that no amount of further demonstration will.*

## 6.4 Non-delivery attribution

**[R-M-030]** Every second of shortfall inside a committed window SHALL be attributed to
a cause code.

Each code carries a **default** cost bearer. The default is a starting point for a
commercial agreement, which may override it; BPI's job is to make the attribution a
matter of record, not to decide who pays.

| Cause | Default bearer |
|---|---|
| `WEATHER_BELOW_RATE_FLOOR` | Neither — shared |
| `AVIATION_TRANSIT` | Receiving |
| `PERSON_INTRUSION` | Receiving |
| `RECEIVER_PLANT_TRIP` | Receiving |
| `GRID_CURTAILMENT` | Receiving |
| `SPACE_FAULT` | Space |
| `POINTING_LOSS` | Space |
| `EFFICIENCY_ANOMALY` | Space |
| `CONJUNCTION_MANOEUVRE` | Space |
| `REGULATORY_ORDER` | Neither |
| `TOKEN_EXPIRY` | **Determined from evidence** — see below |
| `SCHEDULED_END` | n/a |

**[R-M-031]** Where the cause is `TOKEN_EXPIRY`, both segments SHALL produce their
`SessionLog` covering ±60 s around the event, and the bearer SHALL be determined from
the hash-chained `seq` on both sides.

*Whether the receiving segment stopped issuing or the space segment stopped receiving is
a question of fact. Because the chain is signed and sequential, it is answerable from
artefacts created before anyone knew there would be money at stake — which is the only
kind of evidence worth having.*

**[R-M-032]** A `SessionLog` SHALL be produced by both segments for any session
containing a non-nominal event, at 1 Hz, signed, and retained for the period declared in
capability.

## 6.5 Dispute ladder

**[R-M-040]** Disputes SHALL be resolved in this order, declared in advance so that no
discretion is exercised at settlement time:

1. The receiving-side revenue meter, **if** its calibration certificate is current per
   the declared interval.
2. The check meter, if declared and independently calibrated.
3. Reconstruction from the 1 Hz telemetry against the declared atmospheric model. The
   result is flagged `derived` and therefore requires countersignature per [R-M-022].
4. Independent re-measurement by a mutually named third party.
5. The dispute mechanism of the commercial agreement.

Steps 1–3 are this specification's job. Step 5 is not, and BPI defines nothing about it
beyond leaving the seam clean.