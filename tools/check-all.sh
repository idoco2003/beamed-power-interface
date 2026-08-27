#!/usr/bin/env bash
# SPDX-License-Identifier: Apache-2.0
set -euo pipefail
cd "$(dirname "$0")/.."
echo "== requirement set =="; ./tools/check-requirements.sh
echo; echo "== cross-file consistency =="; ./tools/check-consistency.sh
echo; echo "== canonicalisation (RFC 8785) =="; node tools/test-jcs.mjs
echo; echo "== signatures (RFC 8785 + detached JWS) =="; node tools/verify-signatures.mjs
echo; echo "== interlock (BPI-S) =="; node reference/test-interlock.mjs
echo; echo "== conformance vectors =="; node reference/gen-vectors.mjs
echo; echo "== executed coverage =="; node tools/gen-coverage.mjs
# Run every build, not at release. Classifying two text changes today is work;
# classifying forty on the day you promised to publish is how a date slips.
echo; echo "== requirement-set diff [G-1] =="; node tools/gen-requirement-diff.mjs v0.1.0-draft
echo; echo "== schemas and examples =="; ./tools/validate.sh
echo; echo "== json well-formedness =="
find schemas profiles examples conformance -name '*.json' -print0 \
  | xargs -0 -n1 python3 -c 'import json,sys;json.load(open(sys.argv[1]))' \
  && echo "all json parses"
