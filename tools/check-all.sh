#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
echo "== requirement set =="; ./tools/check-requirements.sh
echo; echo "== schemas and examples =="; ./tools/validate.sh
echo; echo "== json well-formedness =="
find schemas profiles examples conformance -name '*.json' -print0 \
  | xargs -0 -n1 python3 -c 'import json,sys;json.load(open(sys.argv[1]))' \
  && echo "all json parses"
