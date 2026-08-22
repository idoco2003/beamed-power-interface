# §7 BPI-A — Regulatory and Exposure Attestation

## 7.1 The principle

> **A conformant system declares the basis on which it operates, including the parts
> where no basis exists.** It does not assert compliance with rules that do not apply to
> it, and it does not assert that rules exist where they do not.

This part exists because of a specific fact. There is no ITU Radio Regulations Article
21 space-to-Earth power flux-density row for 5.8 GHz. A system beaming power there is
not in violation of that row; it is outside it. Those are different things, and a
schema with no way to express the difference forces every implementer to pick a row that
does not govern them and write it down as though it did.

**The design insight: a schema with no way to say "there is no rule here" forces every
implementer to lie.** So the attestation has a positive half and a negative half, and
the negative half is mandatory.

## 7.2 Spectrum and authorisation

```
spectrum {
  jurisdiction,                     // ISO 3166-1 alpha-2 (+ subdivision)
  authority,                        // "FCC", "Ofcom", "MIC", ...
  instrument: 'licence' | 'experimental_authorisation'
            | 'special_temporary_authority' | 'exemption'
            | 'notification' | 'under_application' | 'none_claimed',
  instrumentRef, issuedOn, expiresOn,
  band { centre_GHz, occupied_bandwidth_Hz, emissionDesignator? },
  allocationStatus: 'primary' | 'secondary'
                  | 'ism_not_allocated_for_this_use' | 'none',
  ituFilingRef?,
  article21 {
    applicability: 'exact' | 'analogue' | 'none',
    rowRef: string | null,
    declaredPfd_dBW_m2, refBandwidthHz, arrivalAngleDeg,
    marginDb, basis: 'screening' | 'modelled' | 'measured'
  }
}
```

**[R-A-001]** `article21.applicability` SHALL be `exact` only where a row of Article 21
covers this band and service. Where the nearest tabulated row is used as a yardstick,
it SHALL be `analogue`. Where no row applies, it SHALL be `none`.

**[R-A-002]** `article21.rowRef` SHALL be `null` when `applicability` is `none`. A null
here is a legal, expected value.

**[R-A-003]** `refBandwidthHz` SHALL be present whenever `declaredPfd_dBW_m2` is
present, per [R-C-008]. There is no exception.

**[R-A-004]** `marginDb` MAY be negative. A negative margin is a disclosure, not an
error, and SHALL NOT be suppressed or clamped.

## 7.3 Exposure

```
exposure {
  guideline: 'ICNIRP-2020' | 'IEEE-C95.1-2019' | 'national',
  nationalRef?,
  limitClass: 'general_public' | 'occupational',
  limit_W_m2, averagingTimeS, averagingAreaCm2,
  peakToMeanFactor, peakToMeanBasis,
  declaredPeak_W_m2, ratioToLimit,
  assessmentType: 'screening' | 'modelled' | 'measured',
  assessedBy { org, role, licensed },
  signed, reportRef?,
  localExposureBasis: 'SAR' | 'absorbed_power_density' | 'not_assessed'
}
```

**[R-A-010]** `limit_W_m2` SHALL be accompanied by `averagingTimeS` and
`averagingAreaCm2`, per [R-C-009].

**[R-A-011]** `peakToMeanFactor` SHALL be accompanied by `peakToMeanBasis` stating how
it was obtained — for example, *"2.5584, from a 10 dB Gaussian edge taper"*.

*A beam is not a top hat. Illuminating an aperture uniformly spills a large fraction of
the power past its edge, so any real design tapers. An assessment that compares an
aperture-average intensity against a limit written for the field a person stands in has
compared the wrong two numbers.*

**[R-A-012]** `assessmentType: 'screening'` SHALL NOT be used to support an L3
conformance claim. L3 requires `modelled` or `measured`, signed, with a named assessor.

**[R-A-013]** `localExposureBasis` SHALL be declared.

> **A known gap, disclosed rather than hidden.** ICNIRP 2020 switches the local-exposure
> basis at 6 GHz: below it, specific absorption rate; above it, absorbed power density.
> A system operating at 5.8 GHz is therefore on the **SAR** side, and a power-density
> screening does not address local exposure at all. Declaring `not_assessed` is
> permitted and honest; claiming compliance on a power-density basis alone would not be.
> See `OBJECTIONS.md` §O-5.

## 7.4 Environmental, aviation and external authorities

```
environmentalReview { regime, status, ref, challengesPending }
aviation { coordinatingAuthority, restrictionType, ref,
           notamProcedure, externalAbortChannel }
externalAbortAuthorities[] { org, channel, credentialRef }
```

**[R-A-020]** Any party listed in `externalAbortAuthorities[]` SHALL have a working
abort channel per [R-S-050].

## 7.5 `unclaimed[]` — the negative declaration

**[R-A-030]** `unclaimed[]` SHALL be present and SHALL enumerate every regulatory basis
the operator is explicitly **not** claiming.

**[R-A-031]** `operatingPosture` SHALL be one of `authorised`,
`authorised_experimental`, or
`operating_without_specific_authorisation_by_declaration`.

For a 5.8 GHz space-to-Earth system as of 2026-08, an honest bundle reads:

```json
"unclaimed": [
  "itu-rr-art21-space-to-earth-pfd-limit-for-this-band",
  "primary-allocation-for-space-to-earth-wireless-power-transfer",
  "itu-r-recommendation-governing-this-application",
  "national-type-approval-for-transmitter-at-rated-power"
],
"operatingPosture": "operating_without_specific_authorisation_by_declaration"
```

This does three things nothing else in the specification does.

1. **It makes the honest position machine-readable, and therefore aggregatable.** A
   regulator could diff the `unclaimed[]` arrays of every declared system and see the
   shape of the gap in a single query. That is precisely the evidence an ITU-R work-item
   proposal needs, and precisely what nobody currently has.
2. **It converts an omission into an affirmative statement.** Failing to mention that you
   hold no allocation is an omission. Declaring it and being wrong is a misstatement,
   with all the consequences that carries.
3. **It makes conformance orthogonal to authorisation.** A 200 m laboratory
   demonstration under an experimental licence can be fully BPI-conformant while
   declaring it holds no space-to-Earth authorisation whatsoever. The protocol's job is
   to make that visible, not to prevent it.

**[R-A-032]** An empty `unclaimed[]` SHALL be accompanied by `operatingPosture:
'authorised'` and a resolvable `instrumentRef` for every applicable regime. An empty
array is a strong claim and is treated as one.
