#!/usr/bin/env bash
# The requirement ids in the spec and in conformance/checklist.json must be the same set.
# A specification whose checklist has drifted from its own SHALLs is worse than no checklist.
set -euo pipefail
cd "$(dirname "$0")/.."
a=$(grep -ohE '\*\*\[R-[A-Z]+-[0-9]+\]\*\*' spec/*.md | tr -d '*[]' | sort -u)
b=$(python3 -c "import json;print('\n'.join(r['id'] for r in json.load(open('conformance/checklist.json'))['requirements']))" | sort -u)
if [ "$a" == "$b" ]; then
  echo "requirement set consistent: $(echo "$a" | wc -l | tr -d ' ') ids"
else
  echo "DRIFT between spec and checklist:"; diff <(echo "$a") <(echo "$b"); exit 1
fi
