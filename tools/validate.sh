#!/usr/bin/env bash
# SPDX-License-Identifier: Apache-2.0
# Validate every example against its schema, and confirm every must-fail case fails.
# Exit non-zero if any valid example is rejected OR any must-fail case is accepted.
set -uo pipefail
cd "$(dirname "$0")/.."

AJV="npx --yes ajv-cli@5 validate --spec=draft2020 --strict=false -r schemas/0.1/common.schema.json"
pass=0; fail=0

check_valid() { # schema, doc
  if $AJV -s "$1" -d "$2" >/dev/null 2>&1; then
    echo "  ok      $2"; pass=$((pass+1))
  else
    echo "  FAILED  $2  (should be valid)"; fail=$((fail+1))
  fi
}

check_invalid() { # schema, doc
  if $AJV -s "$1" -d "$2" >/dev/null 2>&1; then
    echo "  FAILED  $2  (should have been REJECTED)"; fail=$((fail+1))
  else
    echo "  ok      $2  correctly rejected"; pass=$((pass+1))
  fi
}

echo "Valid examples:"
check_valid schemas/0.1/attestation-bundle.schema.json examples/attestation-5800mhz/attestation-bundle.json
check_valid schemas/0.1/enable-token.schema.json       examples/leo-rf-nominal/enable-token.json
check_valid schemas/0.1/session-state.schema.json      examples/leo-rf-nominal/session-state.json
check_valid schemas/0.1/abort.schema.json              examples/leo-rf-aviation-abort/abort.json
check_valid schemas/0.1/metering-record.schema.json    examples/disputed-record/metering-record.json

echo "Profiles:"
for p in profiles/*.json; do check_valid schemas/0.1/profile.schema.json "$p"; done

echo "Must-fail cases:"
check_invalid schemas/0.1/attestation-bundle.schema.json examples/must-fail/pfd-without-refbandwidth.json
check_invalid schemas/0.1/attestation-bundle.schema.json examples/must-fail/exposure-without-averaging-time.json
check_invalid schemas/0.1/attestation-bundle.schema.json examples/must-fail/empty-unclaimed-without-authorisation.json
check_invalid schemas/0.1/attestation-bundle.schema.json examples/must-fail/article21-none-with-rowref.json
check_invalid schemas/0.1/attestation-bundle.schema.json examples/must-fail/article21-analogue-without-rowref.json
check_invalid schemas/0.1/enable-token.schema.json       examples/must-fail/aimpoint-without-heightref.json
check_invalid schemas/0.1/enable-token.schema.json       examples/must-fail/orthometric-without-geoidmodel.json
check_invalid schemas/0.1/metering-record.schema.json    examples/must-fail/efficiency-without-endpoints.json

echo
echo "passed: $pass   failed: $fail"
[ "$fail" -eq 0 ]
