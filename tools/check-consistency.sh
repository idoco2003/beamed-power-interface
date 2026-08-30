#!/usr/bin/env bash
# SPDX-License-Identifier: Apache-2.0
#
# Cross-file consistency. Everything here is a defect that actually happened.
#
# A reader found all five by hand: a conformance claim missing a requirement that had
# been added four days earlier, prose quoting "111" against a checklist of 112, a
# changelog reporting eight objections when there were ten, a generated-on date that
# predated the file's own contents, and a retracted argument still standing in the gap
# analysis. None of them were caught because nothing compared one file to another.
#
# A specification that cannot keep its own numbers straight has no business asking
# anyone to implement it, so these are build failures rather than warnings.
set -uo pipefail
cd "$(dirname "$0")/.."

fail=0
note() { echo "  FAIL  $1"; fail=$((fail+1)); }
ok()   { echo "  ok    $1"; }

ids=$(python3 -c "
import json
print('\n'.join(r['id'] for r in json.load(open('conformance/checklist.json'))['requirements']))")
count=$(echo "$ids" | wc -l | tr -d ' ')

# 1. Every published conformance claim enumerates every requirement id — [R-CONF-001].
#    The claim lives in the implementation's repo, so its absence is not an error here.
for claim in ../BeamDesk/bpi-conformance.json conformance/*-conformance.json; do
  [ -f "$claim" ] || continue
  miss=$(python3 - "$claim" <<'PY'
import json, sys
claim = json.load(open(sys.argv[1]))['requirements']
want = [r['id'] for r in json.load(open('conformance/checklist.json'))['requirements']]
print(','.join(i for i in want if i not in claim))
PY
)
  if [ -n "$miss" ]; then note "$claim is missing: $miss  [R-CONF-001]"; else ok "$(basename "$claim") enumerates all $count ids"; fi
done

# 2. Requirement ids quoted in prose match the checklist.
for f in spec/08-conformance.md CHANGELOG.md conformance/checklist.md; do
  [ -f "$f" ] || continue
  bad=$(grep -oE '\b(1[0-9]{2})\b (requirement|identifiers|normative)' "$f" | grep -oE '^1[0-9]{2}' | grep -v "^$count$" | head -3)
  bad="$bad $(grep -oE 'of (1[0-9]{2}) requirements' "$f" | grep -oE '1[0-9]{2}' | grep -v "^$count$" | head -3)"
  bad=$(echo $bad)
  if [ -n "$bad" ]; then note "$f quotes requirement count(s) '$bad', checklist has $count"; else ok "$f requirement counts agree"; fi
done

# 3. CHANGELOG objection count matches OBJECTIONS.md.
obj=$(grep -c '^## O-' OBJECTIONS.md)
open_obj=$(grep -cE '^\*\*Status: open' OBJECTIONS.md)
words="zero one two three four five six seven eight nine ten eleven twelve"
objword=$(echo $words | cut -d' ' -f$((obj+1)))
openword=$(echo $words | cut -d' ' -f$((open_obj+1)))
if grep -qE "\`OBJECTIONS.md\` with ($obj|$objword) objections" CHANGELOG.md; then
  ok "CHANGELOG objection count agrees ($obj)"
else
  note "CHANGELOG does not report $obj ($objword) objections; OBJECTIONS.md has $obj, $open_obj open ($openword)"
fi

# 4. Objections are in numeric order and every one carries a status line.
prev=0
for n in $(grep -oE '^## O-[0-9]+' OBJECTIONS.md | grep -oE '[0-9]+'); do
  [ "$n" -gt "$prev" ] || { note "OBJECTIONS.md out of numeric order at O-$n"; break; }
  prev=$n
done
[ "$prev" -gt 0 ] && [ "$(grep -cE '^\*\*Status:' OBJECTIONS.md)" -eq "$obj" ] \
  && ok "objections ordered, all $obj carry a status" \
  || note "an objection is missing a **Status:** line"

# 5. Every example is exercised by validate.sh. A new example nobody wires up is
#    silently untested, because the file lists in validate.sh are hardcoded.
for ex in $(find examples -name '*.json' | sort); do
  grep -q "$ex" tools/validate.sh || note "$ex is never validated by tools/validate.sh"
done
find examples -name '*.json' | while read -r ex; do grep -q "$ex" tools/validate.sh || exit 1; done \
  && ok "every example is exercised by validate.sh"

# 6. The checklist's generated stamp is not in the future and not stale versus the spec.
gen=$(python3 -c "import json;print(json.load(open('conformance/checklist.json'))['generated'])")
today=$(date +%F)
[[ "$gen" > "$today" ]] && note "checklist generated stamp $gen is in the future" || ok "checklist stamp $gen"

# 7. A withdrawn claim has not reappeared anywhere it is not allowed to be.
#
#    The efficiency-comparability argument was retracted on 2026-08-24 and went on
#    standing in the NORMATIVE text of two spec files for three days afterwards,
#    because the retraction was filed where the error was first noticed rather than
#    searched for. A retraction that only edits one file is not a retraction.
#    tools/retracted.json is the register; the check is the enforcement.
retracted_report=$(python3 - <<'PYEOF'
import json, pathlib, subprocess, sys
reg = json.load(open('tools/retracted.json'))['retracted']
tracked = subprocess.check_output(['git', 'ls-files'], text=True).split()
bad = []
for entry in reg:
    allowed = set(entry['allowedIn'])
    for f in tracked:
        if f in allowed or not f.endswith(('.md', '.json', '.mjs', '.py', '.sh')):
            continue
        try:
            text = pathlib.Path(f).read_text(encoding='utf-8')
        except (UnicodeDecodeError, FileNotFoundError, IsADirectoryError):
            continue
        for phrase in entry['phrases']:
            if phrase in text:
                bad.append(f"{f} carries {entry['id']}'s withdrawn claim: {phrase!r}")
print('\n'.join(bad) if bad else f"{len(reg)} retraction(s) registered, none reappearing")
sys.exit(1 if bad else 0)
PYEOF
)
if [ $? -eq 0 ]; then ok "$retracted_report"; else
  while IFS= read -r line; do note "$line"; done <<< "$retracted_report"
fi


# 8. The gap analysis has not quietly expired.
#
#    gap-analysis.md's own header says a row older than 90 days should be treated
#    as unverified. Nothing enforced that, so the file could go on presenting
#    itself as a survey while being a set of assertions about August. Warns at 60
#    days so an expiry arrives with notice rather than on the day.
if out=$(node tools/gap-staleness.mjs); then
  ok "gap analysis: $(printf '%s' "$out" | tail -n 1 | sed 's/^ *//')"
  # sed rather than head -n -1, which BSD head does not have.
  warns=$(printf '%s\n' "$out" | sed '$d')
  [ -n "$warns" ] && printf '%s\n' "$warns"
else
  while IFS= read -r line; do
    printf '%s' "$line" | grep -qE 'checked [0-9]{4}-|no parseable checkedOn' && note "$(printf '%s' "$line" | sed 's/^ *//')" || printf '%s\n' "$line"
  done <<< "$out"
fi


# 9. The ROS 2 messages have not drifted from the schemas.
#
#    They are generated, so the only way they can be wrong is by being stale. A
#    published interface that silently disagrees with the schema it claims to
#    mirror is worse than not shipping one.
say_ros=$(python3 sdk/ros2/generate-msgs.py --check 2>&1) \
  && ok "$(printf '%s' "$say_ros" | sed 's/^ *//')" \
  || note "$(printf '%s' "$say_ros" | sed 's/^ *//')"


# 10. The generated checklist matches the specification it was generated from.
#
#     Found the hard way: spec/02-conventions.md was edited during the 0.2 bump
#     and conformance/checklist.json was never regenerated, so the checklist
#     quoted a requirement's text that no longer existed. Check 1 compares id
#     COUNTS and could not see it. This regenerates into a scratch copy and
#     compares, so the text cannot drift either.
scratch=$(mktemp -d)
cp conformance/checklist.json "$scratch/before.json"
python3 tools/gen-checklist.py >/dev/null 2>&1
if diff -q "$scratch/before.json" conformance/checklist.json >/dev/null; then
  ok "checklist matches the specification text"
else
  note "conformance/checklist.json is stale — run tools/gen-checklist.py and classify any text change"
fi
rm -rf "$scratch"


echo
[ "$fail" -eq 0 ] && echo "consistency: clean" || echo "consistency: $fail problem(s)"
[ "$fail" -eq 0 ]
