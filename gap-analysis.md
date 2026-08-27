<!-- SPDX-License-Identifier: CC-BY-4.0 -->

# Gap analysis — why this is not already covered

Every row is a first-party check against the issuing body's own site. Secondary
coverage of a specification is a lead, not a finding, and does not appear here.

**Re-check cadence: monthly, and enforced.** A row whose `checkedOn` is more than 90 days
old should be treated as unverified, and now `tools/check-consistency.sh` fails the build
rather than leaving that to a reader's arithmetic. It warns from 60 days, so an expiry
arrives with a month's notice instead of on the day. **The first row expires 2026-11-13**,
seventeen days before the RFC period closes. If any row flips — if a body opens a work item covering its
subject — the correct response is to contribute this document there and archive this
repository, per `spec/00-status.md`.

**A limitation found by a reader, 2026-08-24.** Every row below asks "is this
standardised?" and none asks "is there already an accepted way of doing this?". Those
are different questions, and for efficiency reporting the second one has an answer this
survey missed: a 2024 textbook whose stated purpose is establishing common nomenclature
for assessing power beaming systems. The absence of a standard is still established.
The inference that the field therefore has no conventions worth profiling is not. A
literature row per part is owed in 0.2 — see `OBJECTIONS.md` O-10.

**Method and limits.** These checks were performed by an automated daily scan against
issuing-body sites, with the results recorded in dated digests. They establish the
*absence of a published document or open work item* at the dates shown. They cannot
establish the absence of unpublished or internal activity, and a body may be working on
something it has not announced.

---

## Standards bodies

| # | Body | Question asked | Finding | checkedOn | Source |
|---|---|---|---|---|---|
| G1 | ITU-R | Is there a Recommendation governing RF-beam wireless power transfer? | **ITU-R SM.2151-0 (09/2022)** is the only one. Its title scopes it to *mobile/portable devices and sensor networks*. It says nothing about space-to-Earth power. No revision since 2022. | 2026-08-22 | [itu.int/rec](https://www.itu.int/rec/R-REC-SM.2151/en) |
| G2 | ITU-R | Does SM.2392 govern this? | **ITU-R Report SM.2392-2 (06/2026)** surveys applications of RF-beam WPT and names 5.8 GHz among the bands in use. It is a **Report**: it recommends nothing and binds nothing. | 2026-08-22 | [R-REP-SM.2392-2](https://www.itu.int/dms_pub/itu-r/opb/rep/R-REP-SM.2392-2-2026-TOC-HTM-E.htm) |
| G3 | ITU (RR) | Is there an Article 21 space-to-Earth PFD limit for 5.8 GHz? | **No.** 5.8 GHz carries no space-to-Earth row in Article 21. It is an ISM band, and the Radio Regulations do not contemplate a space station transmitting at power-delivery levels into it. | 2026-08-22 | [R-REG-RR](https://www.itu.int/pub/R-REG-RR) |
| G4 | ITU | Is a conference agenda item coming? | **WRC-27 has no space-based solar power or wireless power transfer agenda item.** Roughly 80% of the WRC-27 agenda is space, but the items are D2D, lunar communications, radio astronomy protection, space weather and EESS. | 2026-08-15 | ITU WRC-27 agenda |
| G5 | ITU-R | Is SG3 studying it? | No newly approved P-series work relevant to power beaming. **SG3 next meets 2027-06-11.** | 2026-08-17 | ITU-R SG3 |
| G6 | IEEE | Is ICES revising exposure limits for this case? | C95.1-2019 active with Cor 1-2019 and Cor 2-2020. The ICES working group page states **"No Active Projects"**. The only 2026 C95 activity is the military variant C95.1-2345, which is out of scope here. | 2026-08-22 | [standards.ieee.org](https://standards.ieee.org/ieee/C95.1-2019_Cor_2/10321/) |
| G7 | CCSDS | Is there power-related work? | **None.** CCSDS work in this neighbourhood is navigation and communications — ODM, TDM, CDM, SLE, SCCS-SM. No power delivery service, no power scheduling, no power metering. | 2026-08-22 | [ccsds.org](https://ccsds.org/publications/bluebooks/) |
| G8 | ICNIRP | Is the RF guideline under revision? | 2020 RF guidelines in force. The revision underway concerns the **low-frequency** guidelines, below the 100 kHz floor. An "RF Gaps in Knowledge (2025)" document exists, which typically precedes a revision cycle rather than constituting one. | 2026-08-22 | icnirp.org |

## Regulators

| # | Body | Question asked | Finding | checkedOn | Source |
|---|---|---|---|---|---|
| G9 | FCC | Is there a wireless-power proceeding? | **No.** Checked repeatedly. The Part 25 → Part 100 overhaul does not address wireless power transfer, power beaming, space-based solar power or energy transmission. | 2026-08-22 | fcc.gov |
| G10 | FCC | Does the one adjacent grant set precedent? | **DA 26-706** (Reflect Orbital, Earendil-1) is the first licence for an orbit-to-ground illumination payload. It was decided by the Commission *disclaiming* that in-space activities' prospective impacts fall within its authority; the challenge arrived via NEPA. That disclaimer does not transfer to an RF power downlink, which is squarely inside FCC authority. | 2026-08-21 | [DA-26-706A1](https://docs.fcc.gov/public/attachments/DA-26-706A1.txt) |

---

## What the absence looks like from the other side

The field is not idle; it is fragmenting. As of August 2026 there are at least two
mutually incompatible physical layers being flown or funded, and no venue where their
interfaces are being reconciled.

| Programme | Layer | Status as checked |
|---|---|---|
| Xidian "Sun Chasing" | RF microwave | 1,180 W at 20.8% DC-to-DC over 100 m; 1.2 m transmitter into a 5.2 m rectenna |
| Virtus Solis / ARPA-E | RF microwave | >1 kW RF at 200 m, minimum 70% end-to-end source-to-delivered-DC; first US federal award for RF WPT |
| JAXA OHISAMA | RF microwave | **Planned, not flown.** ~1 kW at 5.8 GHz to a 13-antenna site from ~400 km; FY2026 launch on Space One's Kairos |
| Star Catcher | Optical | >1.1 kW to commercial off-the-shelf panels at >1 km; >10 MJ total |
| Volta Space, Mantis, Overview Energy | Optical / NIR | Space-to-space and GEO-to-solar-farm concepts |
| ARAQYS-D3 | **Both** | Five power-beaming payloads, RF and optical, one integrator, Feb 2027 |
| DIU PROJ00685 | Both | Four lines of effort including space-to-space (to 1,200 km) and space-to-terrestrial; operational capability targeted FY2030 |

**A claim that stood here has been withdrawn.** It said Xidian's *20.8% DC-to-DC over
100 m* and Virtus Solis's *≥70% end-to-end* were not the same measurement and could not
be compared. An RF power-beaming engineer pointed out that if "source to delivered DC"
means DC in to DC out then those are the same measurement class, the two figures are
comparable, and the argument was wrong. He also pointed at the published methodology the
specification should have profiled instead of inventing a rule beside it: a subsystem
decomposition whose stage efficiencies multiply to the total, in *Power Beaming: History,
Theory, and Practice* (Jaffe, Nugent, Strassner II and Szazynski, World Scientific, 2024).

See `DISPOSITIONS.md` C-1 and `OBJECTIONS.md` O-10. §6 is being rewritten to profile that
decomposition, blocked on reading it.

---

## Change log for this file

| Date | Change |
|---|---|
| 2026-08-22 | Initial publication. Rows G1–G10 from daily scans 2026-08-13 to 2026-08-22. |
| 2026-08-24 | Method limitation recorded: the survey asked "is this standardised?" and never asked "is there already an accepted way of doing this?". See O-10. |
| 2026-08-27 | Withdrew the efficiency-comparability claim below the programme table. It was wrong; see DISPOSITIONS C-1. |