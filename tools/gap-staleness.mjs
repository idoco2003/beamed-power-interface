// SPDX-License-Identifier: Apache-2.0
//
// How old is the gap analysis?
//
// gap-analysis.md is the only dated, sourced register of this regulatory vacuum
// that exists anywhere, and it is the project's most distinctive asset. Its own
// header says a row whose checkedOn is more than 90 days old "should be treated
// as unverified". Nothing enforced that, so the file could quietly become a set
// of assertions about August while presenting itself as a survey.
//
// Two thresholds, because an expiry needs notice rather than an ambush:
//
//   60 days  warn. There is a month to re-check before it matters.
//   90 days  fail. The document's own rule says the row is unverified, and a
//            build that passes while the register is stale is lying by omission.
//
// The RFC period closes 2026-11-30. The earliest row expires before that.
import { readFileSync } from 'node:fs';

const WARN_DAYS = 60;
const FAIL_DAYS = 90;

const today = process.argv[2] ?? new Date().toISOString().slice(0, 10);
const todayMs = Date.parse(today + 'T00:00:00Z');
if (Number.isNaN(todayMs)) {
  console.error(`gap-staleness: "${today}" is not a YYYY-MM-DD date`);
  process.exit(2);
}

const rows = [];
for (const line of readFileSync('gap-analysis.md', 'utf8').split('\n')) {
  if (!line.startsWith('|')) continue;
  const cells = line.split('|').map((c) => c.trim());
  // | # | Body | Question | Finding | checkedOn | Source |
  const id = cells[1];
  if (!/^G\d+$/.test(id)) continue;
  const checkedOn = cells[5];
  if (!/^\d{4}-\d{2}-\d{2}$/.test(checkedOn)) {
    rows.push({ id, checkedOn, age: null, body: cells[2] });
    continue;
  }
  const age = Math.round((todayMs - Date.parse(checkedOn + 'T00:00:00Z')) / 86400000);
  rows.push({ id, checkedOn, age, body: cells[2] });
}

if (!rows.length) {
  // The table was reformatted and this tool stopped seeing it. That must not
  // read as "nothing is stale".
  console.error('gap-staleness: parsed no G-rows out of gap-analysis.md');
  process.exit(2);
}

const bad = rows.filter((r) => r.age === null || r.age >= FAIL_DAYS);
const warn = rows.filter((r) => r.age !== null && r.age >= WARN_DAYS && r.age < FAIL_DAYS);
const oldest = rows.reduce((a, b) => (a.age === null || (b.age ?? 0) > a.age ? b : a));

for (const r of bad) {
  console.log(r.age === null
    ? `  ${r.id} (${r.body}) has no parseable checkedOn`
    : `  ${r.id} (${r.body}) checked ${r.checkedOn}, ${r.age} days ago — the document's own rule calls this unverified`);
}
for (const r of warn) {
  console.log(`  ${r.id} (${r.body}) checked ${r.checkedOn}, ${r.age} days ago — re-check within ${FAIL_DAYS - r.age} days`);
}

if (bad.length) {
  console.log(`  ${bad.length} of ${rows.length} rows are unverified`);
  process.exit(1);
}

const expiresOn = new Date(Date.parse(oldest.checkedOn + 'T00:00:00Z') + FAIL_DAYS * 86400000)
  .toISOString().slice(0, 10);
console.log(`  ${rows.length} rows, oldest ${oldest.id} at ${oldest.age} days, first expiry ${expiresOn}`);
