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

*The motivation this rule used to carry was wrong, and the correction is more useful than
the original.* An earlier draft set Xidian's 20.8% DC-to-DC at 100 m against Virtus
Solis's ARPA-E target of ≥70% "source to delivered DC" at 200 m and called them
incomparable. The first external comment this specification received pointed out that if
"source to delivered DC" means DC in to DC out, those are the **same measurement class**,
and DOE's description of the target as roughly a 4× improvement on the best DC-to-DC
systems to date is internally consistent. That comment was correct. See
`DISPOSITIONS.md` C-1.

What survives the correction is narrower and is the actual reason this requirement
exists. Those two results were obtained with a 4 m transmitter into a 4 m receiver at
200 m, and a 1.2 m transmitter into a 5.2 m rectenna at 100 m. Beam coupling depends on
the aperture-range product, so **two figures of the same measurement class still do not
separate component efficiency from coupling geometry**. Naming the endpoints and the path
length is a partial answer to that and is in force today.

*It is not the right answer.* The literature already carries a subsystem decomposition
whose stage efficiencies multiply to the total, published expressly to establish a common
nomenclature for assessing power beaming systems — *Power Beaming: History, Theory, and
Practice* (Jaffe, Nugent, Strassner II and Szazynski, World Scientific, 2024). Under a
decomposition, coupling is one stage, so declaring the chain declares the geometry's
effect without a separate rule about apertures. **[R-M-023] and [R-C-010] will be
rewritten for 0.2 to profile that method rather than to invent a parallel one**, and are
deliberately not being rewritten from a summary: this project does not carry a method it
has not read. Recorded as `OBJECTIONS.md` O-10.

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
| `GRID_CURTAILMENT_ORDERED` | Receiving |
| `GRID_CURTAILMENT_ELECTED` | Receiving |
| `SPACE_FAULT` | Space |
| `POINTING_LOSS` | Space |
| `EFFICIENCY_ANOMALY` | Space |
| `CONJUNCTION_MANOEUVRE` | Space |
| `REGULATORY_ORDER` | Neither |
| `TOKEN_EXPIRY` | **Determined from evidence** — see below |
| `SCHEDULED_END` | n/a |

**[R-M-033]** Where the cause is `GRID_CURTAILMENT_ORDERED`, the entry SHALL carry
`evidenceRef` identifying the network operator's instruction.

*All three curtailment codes default to the receiving side, so this is not a change of
bearer. It is a change of what has to be shown. "The network operator told us to stop" is
a claim about a third party, and it is the only cause on the list that another party could
have refuted at the time and cannot refute afterwards. `GRID_CURTAILMENT_ELECTED` says the
receiver chose, which needs no citation because nobody else is implicated.
`GRID_CURTAILMENT` remains for the case where the distinction is genuinely unknown, and a
record full of the general code where the specific one was available is a signal in itself.*

**[R-M-031]** Where the cause is `TOKEN_EXPIRY`, both segments SHALL produce their
`SessionLog` covering ±60 s around the event, and the bearer SHALL be determined from
the hash-chained `seq` on both sides.

*Whether the receiving segment stopped issuing or the space segment stopped receiving is
a question of fact. Because the chain is signed and sequential, it is answerable from
artefacts created before anyone knew there would be money at stake — which is the only
kind of evidence worth having.*

### Somebody else has this question open

This section exists because of a dispute nobody had yet written down. Since it was
written, one has been found on the record. The **LOGIC** consortium (JHU/APL, with DARPA
involvement) lists this under *Notes / Questions* on its **P5. Wireless Rover Charge**
use case, verbatim:

> "The power beaming supplier said they delivered 100% of the requested power, but my
> vehicle's telemetry says it only received 80% of the requested energy. Who is
> responsible for the difference? Who mediates/moderates disputes"

The same page's *Summary of Derived Interoperability Requirements* reads **"(This section
is intentionally left blank.) … Content will be posted when available."** Checked
2026-09-02 at
<https://logic.jhuapl.edu/Our-Work/Standards-Recommendation/P5.-Wireless-Rover-Charge_830603446.html>.

§6.3 and this section are an answer to that question — two independent energy figures
reconciled against a propagation model computed from the actual elevation and weather
`[R-M-021]`, a cause code for every second of shortfall `[R-M-030]`, and, where the cause
is a lapsed token, the hash-chained sequence numbers on both sides deciding it as a matter
of fact `[R-M-031]`. **Whether it is the right answer is exactly what this document needs
told, and by them rather than by us.** See `gap-analysis.md` G12.

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