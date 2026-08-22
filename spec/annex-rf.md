# Annex RF (normative) — BPI-RF, radio-frequency microwave physical layer

Applies where the beam is a radio-frequency carrier.

Everything in this annex is excluded from the core by one test: *if a quantity's units,
or the document governing it, differ between RF and optical, it belongs in an annex.*
Everything that survives that test — the session lifecycle, token semantics, abort
semantics, ramp semantics, the metering model, frames and units — stays in the core and
is shared with any future physical layer.

## RF.1 Carrier declaration

**[R-RF-001]** A segment claiming the `RF` annex SHALL declare `centre_GHz`,
`occupied_bandwidth_Hz`, polarisation, and — where a national regime uses one — an
emission designator.

**[R-RF-002]** Transmit aperture dimensions, illumination taper and the resulting
peak-to-mean factor SHALL be declared, with `peakToMeanBasis` per [R-A-011].

## RF.2 Power flux-density

**[R-RF-010]** PFD SHALL be expressed in dB(W/m²) with a mandatory `refBandwidthHz`.

**[R-RF-011]** PFD SHALL be screened against ITU Radio Regulations Article 21 §21.16
using the `applicability` discipline of [R-A-001].

*Note on why this matters more here than elsewhere. Article 21's limits are spectral —
so many dB(W/m²) in 4 kHz or 1 MHz. A communications downlink spreads its power over
megahertz, so only a sliver falls in any reference bandwidth. A power beam is as close
to a pure carrier as makes no difference, so effectively the entire flux counts. An
implementer who screens a power beam as though it were a communications signal will
understate by orders of magnitude.*

## RF.3 Pointing reference — pilot beam binding

**[R-RF-020]** The abstract pointing reference of [R-S-030] SHALL be bound to a pilot
signal transmitted from the receiving segment.

**[R-RF-021]** The pilot SHALL be authenticated by a per-session spreading code or an
equivalent rolling-code scheme, and the segment SHALL declare the scheme, the code
length and the re-key interval.

**[R-RF-022]** `corridorHalfAngleDeg` SHALL be declared. It SHOULD be no larger than the
angle the receiving aperture subtends at the minimum operational slant range.

*Worked example: a 2 km aperture at 547 km slant range subtends 3.66 mrad = 0.21°. A
±0.2° corridor is therefore approximately "on the aperture" for a LEO delivery. At GEO
the same aperture subtends 0.0032°, so the corridor is far coarser than the pointing
requirement and catches only gross failures — see the limitation stated in §5.6.*

## RF.4 Grating lobes

**[R-RF-030]** A segment using a phased array SHALL declare its element spacing and the
maximum scan angle, and SHALL declare the geometry and power flux-density of any grating
lobes over the full scan range.

**[R-RF-031]** Grating lobes SHALL be screened under §7 exactly as the main beam is,
including against the keep-out volume of [R-S-024].

*This is the requirement most likely to be missed, and the arithmetic is short. A
periodic array produces grating lobes when*

```
d/λ  ≥  1 / (1 + sin θ_scan)
```

*At 5.8 GHz, λ = 51.7 mm, so a ±30° scan requires element spacing d ≤ 34.5 mm. A
kilometre-scale aperture is enormously cheaper to build with sparser spacing — and
sparser spacing produces **full-intensity replicas of the main beam landing kilometres
from the aperture**, on ground that was never assessed and lies outside the keep-out
volume. The lobe is not a sidelobe; it is a second main beam.*

> The formula is standard array theory and this document is confident in it. This
> document is **not** confident that anyone in this industry is currently publishing
> this number, which is why it is a `SHALL`.

## RF.5 The defocused pattern

**[R-RF-040]** The defocused pattern produced by the abort action of [R-S-043] SHALL be
declared and screened, per [R-S-044].

## RF.6 Atmospheric models

**[R-RF-050]** Where a rate profile, a mask or an expected efficiency depends on
propagation, the segment SHALL declare which models were used, by reference.

Commonly applicable: ITU-R P.525 (free-space), P.676 (gaseous attenuation), P.618
(Earth-space including rain), P.837 (rain rate), P.838 (rain specific attenuation),
P.839 (rain height). This specification **names these as declarable references and does
not implement or endorse any of them**; the edition in force at the time of declaration
is the implementer's responsibility.

**[R-RF-051]** A declared model reference SHALL carry the edition.

## RF.7 Exposure basis

**[R-RF-060]** Human exposure SHALL be assessed on an incident power-density basis
against ICNIRP 2020 or IEEE C95.1-2019 as declared, **and** `localExposureBasis` SHALL
be declared per [R-A-013].

*Below 6 GHz, ICNIRP's local-exposure restriction is on specific absorption rate, which
a power-density screening does not address. A 5.8 GHz system is below that boundary.*

## RF.8 Coexistence

**[R-RF-070]** A segment SHALL declare harmonic and spurious emission levels, and the
coordination undertaken with incumbent services in the band.

**[R-RF-071]** Where the illuminated area or any grating lobe intersects airspace, the
segment SHALL declare the avionics electromagnetic-compatibility threshold used and the
coordination performed with the aviation authority.
