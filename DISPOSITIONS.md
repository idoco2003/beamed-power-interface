<!-- SPDX-License-Identifier: CC-BY-4.0 -->

# Comment dispositions

Every substantive comment received on this specification is recorded here with a
disposition of `accepted`, `rejected` or `deferred`, and a reason — including comments
arguing the document is misconceived.

This is how recognised bodies resolve comments. It costs one file, and it is the
difference between publishing a draft and publishing a draft you intend to change.

**RFC period for 0.1 closes 2026-11-30.**

## How to comment

Open an issue, or a pull request against `OBJECTIONS.md` if your comment is an argument
rather than a defect. Comments received privately will be recorded here in summarised
form unless you ask otherwise; if you would rather not be named, say so and we will
record the substance without attribution.

## Dispositions

| # | Date | From | Comment | Disposition | Reason |
|---|---|---|---|---|---|
| — | — | — | *No comments received yet. This table is populated as they arrive.* | — | — |

## Self-identified defects carried into 0.1

These were found by the authors before publication and are recorded here so they are not
mistaken for oversights.

| # | Defect | Where | Blocks |
|---|---|---|---|
| D-1 | Metering accuracy classes cited from secondary knowledge | §6.2 [R-M-012] | 0.2 |
| D-2 | No optical annex | `spec/annex-opt.md` | Coverage of ~half the field |
| D-3 | Local exposure below 6 GHz not addressed | §7.3 | Any L3 claim at 5.8 GHz |
| D-4 | Corridor check weak at GEO | §5.6 | GEO deployments |
| D-5 | Profiling claim against CCSDS 902.1 not schema-validated | §1.4 | Interop with SSF tooling |