#!/usr/bin/env python3
# SPDX-License-Identifier: Apache-2.0
"""Regenerate conformance/checklist.json from the requirement ids in spec/*.md.

The checklist is generated rather than hand-maintained because a checklist that has
drifted from the specification it claims to enumerate is worse than no checklist:
an implementer answering it would be answering the wrong questions.
tools/check-requirements.sh fails the build if the two sets differ.
"""
import re, json, os, glob, sys
from datetime import date
from collections import Counter

os.chdir(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
reqs, seen, dupes = [], set(), []
for f in sorted(glob.glob('spec/*.md')):
    txt = open(f).read()
    ms = list(re.finditer(r'\*\*\[(R-[A-Z]+-\d+)\]\*\*', txt))
    for i, m in enumerate(ms):
        rid = m.group(1)
        end = ms[i + 1].start() if i + 1 < len(ms) else min(len(txt), m.end() + 400)
        tail = ' '.join(txt[m.end():end].split())
        tail = re.sub(r'^\s*[:.]\s*', '', tail)
        if rid in seen:
            dupes.append((rid, f)); continue
        seen.add(rid)
        reqs.append({"id": rid, "part": rid.split('-')[1], "source": f,
                     "summary": (tail[:200].rsplit(' ', 1)[0] + '…') if len(tail) > 200 else tail})
if dupes:
    print("duplicate requirement ids:", dupes, file=sys.stderr); sys.exit(1)
reqs.sort(key=lambda r: (r['part'], int(r['id'].split('-')[2])))
# Stamped at generation. The first version hardcoded a date, so the checklist
# claimed to have been generated four days before a requirement it contained.
json.dump({"$comment": "SPDX-License-Identifier: Apache-2.0",
           "bpiVersion": "0.2.0-draft", "generated": date.today().isoformat(),
           "note": "Generated from spec/*.md by tools/gen-checklist.py. "
                   "tools/check-requirements.sh fails the build if this drifts from the specification.",
           "count": len(reqs), "requirements": reqs},
          open('conformance/checklist.json', 'w'), indent=2)
print("total:", len(reqs), dict(Counter(r['part'] for r in reqs)))
