#!/usr/bin/env bash
# SPDX-License-Identifier: Apache-2.0
#
# Snapshot what adoption of this specification actually looks like.
#
# WHY THIS EXISTS AS A SNAPSHOT. GitHub retains traffic data for fourteen days and
# then discards it. A number you can only read for a fortnight is not a series, so
# it has to be written down or it is gone.
#
# WHY MOST OF WHAT IT RECORDS IS LABELLED VANITY. On the day this repository was
# published it logged twelve clones from nine unique cloners and zero page views.
# Nine cloners and no readers is the signature of automated scanners, not people.
# Reporting that as adoption would have been the first dishonest thing in the
# project, so the digest separates the numbers that can be faked by a crawler from
# the ones that cannot.
#
# THE ONLY METRICS THAT MEAN ANYTHING are the ones that cost somebody effort:
# a conformance claim from an organisation that is not the author, a second
# implementation, a capability published by someone else, a substantive comment.
# All are currently zero, and the digest says so in the first line.
#
# Usage:  tools/adoption-scan.sh [YYYY-MM-DD]
set -uo pipefail
cd "$(dirname "$0")/.."

REPO="BeamDesk/beamed-power-interface"
DAY="${1:-$(date +%F)}"
OUT="adoption/digests/${DAY}.md"

api() { gh api "$@" 2>/dev/null; }
j()   { gh api "$1" --jq "$2" 2>/dev/null || echo "?"; }

stars=$(j "repos/$REPO" '.stargazers_count')
forks=$(j "repos/$REPO" '.forks_count')
watch=$(j "repos/$REPO" '.subscribers_count')
views=$(j "repos/$REPO/traffic/views" '.count')
vuniq=$(j "repos/$REPO/traffic/views" '.uniques')
clones=$(j "repos/$REPO/traffic/clones" '.count')
cuniq=$(j "repos/$REPO/traffic/clones" '.uniques')

# Issues and PRs NOT opened by the repository owner. Ours do not count.
# "External" means not us, and "us" is now an organisation rather than one account.
# Members are fetched rather than hardcoded so that adding a maintainer cannot silently
# turn their issues into evidence of outside interest.
members=$(api "orgs/BeamDesk/members?per_page=100" \
  | python3 -c "import json,sys;print(','.join(m['login'] for m in json.load(sys.stdin)))" 2>/dev/null || echo "")
ext_issues=$(api "repos/$REPO/issues?state=all&per_page=100" \
  | MEMBERS="$members" python3 -c "
import json,os,sys
ours = set(filter(None, os.environ.get('MEMBERS','').split(',')))
d = json.load(sys.stdin)
print(sum(1 for i in d if i.get('user',{}).get('login') not in ours))" 2>/dev/null || echo 0)

# Forks that actually diverged. A fork with no commits ahead is a bookmark.
active_forks=$(api "repos/$REPO/forks?per_page=100" \
  | python3 -c "import json,sys;d=json.load(sys.stdin);print(len(d))" 2>/dev/null || echo 0)

# Conformance claims in §8.4 that are not ours.
claims=$(grep -c '^| ' spec/08-conformance.md 2>/dev/null || echo 0)
ext_claims=$(awk '/^\| Implementation \| Claim/,/^$/' spec/08-conformance.md 2>/dev/null \
  | grep -c '^| ' 2>/dev/null || echo 0)
ext_claims=$(( ext_claims > 2 ? ext_claims - 2 : 0 ))   # header + separator + our row

# Comments actually dispositioned — EXTERNAL ones only.
#
# The first version of this counted every table row in DISPOSITIONS.md and reported
# eight, which was self-authored defects and implementation findings. Counting our own
# notes as evidence that somebody engaged is precisely the inflation this file exists
# to prevent, so the count is scoped to the Dispositions table and the placeholder row
# is excluded.
# Rows in the Dispositions table whose id looks like C-<n>. A comment id is the only
# thing that counts here: implementation findings are F-<n> and self-identified defects
# are D-<n>, and neither is evidence that somebody outside the project engaged.
#
# The first version used an awk range /^## Dispositions/,/^## / and always returned zero,
# because the start pattern also matches the end pattern and the range closed on its own
# first line. It reported no comments on the day the first one arrived.
dispositions=$(grep -cE '^\| C-[0-9]+ \|' DISPOSITIONS.md 2>/dev/null || echo 0)
dispositions=${dispositions:-0}

# Gap analysis freshness — the kill switch, not a health bar.
# Latest checkedOn date that is not in the future. The first version took the newest
# date anywhere in the file and picked up "SG3 next meets 2027-06-11" out of the prose,
# reporting an age of minus 292 days.
last_check=$(grep -oE '20[0-9]{2}-[0-9]{2}-[0-9]{2}' gap-analysis.md \
  | sort -u | awk -v today="$DAY" '$0 <= today' | tail -1)
last_check=${last_check:-$DAY}
age_days=$(( ( $(date -j -f %F "$DAY" +%s 2>/dev/null || date -d "$DAY" +%s) \
             - $(date -j -f %F "$last_check" +%s 2>/dev/null || date -d "$last_check" +%s) ) / 86400 ))

adopted=$(( ext_claims + ext_issues + dispositions ))

{
cat <<EOF
<!-- SPDX-License-Identifier: CC-BY-4.0 -->
# Adoption — $DAY

**Verdict:** $( [ "$adopted" -eq 0 ] \
  && echo "No external adoption. Every metric that costs somebody effort is zero." \
  || echo "$adopted external signal(s). See below." )

## Signals that cannot be faked by a crawler

| Metric | Count | Meaning |
|---|---:|---|
| Independent conformance claims | $ext_claims | An organisation that is not the author answered 112 requirements |
| Second implementation | $(( ext_claims > 0 ? 1 : 0 )) | Closes OBJECTIONS.md O-1, the strongest objection to this draft |
| External issues / PRs | $ext_issues | Somebody read it closely enough to disagree |
| Comments dispositioned | $dispositions | DISPOSITIONS.md rows |
| Forks | $active_forks | A fork with no commits is a bookmark, not a use |

## Vanity — recorded, not celebrated

| Metric | 14-day | Note |
|---|---:|---|
| Stars | $stars | Attention, not adoption |
| Watchers | $watch | |
| Page views / unique | $views / $vuniq | |
| Clones / unique | $clones / $cuniq | Clones far above views means scanners, not readers |

## Kill switch

\`gap-analysis.md\` last checked **$last_check** (${age_days} days ago).

If any row flips — if ITU-R, IEEE, CCSDS or a regulator opens a work item covering
beamed power — then adoption of this specification stops being the goal.
\`spec/00-status.md\` commits to contributing the text there and archiving this
repository. A stale gap analysis is the signal to stop, not a metric to improve.
EOF
} > "$OUT"

echo "wrote $OUT"
grep -A2 '^\*\*Verdict' "$OUT"
