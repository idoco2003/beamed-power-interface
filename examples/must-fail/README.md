# Must-fail examples

These are **invalid on purpose**. Each violates exactly one normative requirement, and
each must be **rejected** by the schema it is checked against.

They are part of the test surface. A schema change that lets one of these through has
broken the rule it encodes, and `tools/validate.sh` fails the build if any of them
validates.

| File | Violates | Rule |
|---|---|---|
| `pfd-without-refbandwidth.json` | [R-C-008], [R-A-003] | A power flux-density without its reference bandwidth is meaningless — is it in 4 kHz or 1 MHz? |
| `exposure-without-averaging-time.json` | [R-C-009], [R-A-010] | 10 W/m² means nothing without knowing whether it is averaged over 6 minutes or 30 |
| `empty-unclaimed-without-authorisation.json` | [R-A-032] | An empty `unclaimed[]` is a strong claim and requires `operatingPosture: authorised` |
| `article21-none-with-rowref.json` | [R-A-002] | Citing a row while declaring no row applies |
| `aimpoint-without-heightref.json` | [R-C-004] | Orthometric and ellipsoidal height differ by tens of metres |
| `orthometric-without-geoidmodel.json` | [R-C-004] | An orthometric height without its geoid model cannot be converted |
| `efficiency-without-endpoints.json` | [R-C-010], [R-M-023] | "70% efficient" between which two points, over what path? |
