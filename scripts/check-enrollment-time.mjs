import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
const require = createRequire(import.meta.url);
const time = require('../public/enrollment-time.js');
const server = readFileSync('server.js', 'utf8');
const start = server.indexOf('function getCourseEnrollmentOpensAtTimestamp(course)');
const end = server.indexOf('function formatCourseEnrollmentOpensAt', start);
const context = vm.createContext({ EnrollmentTime: time, Date });
vm.runInContext(server.slice(start, end), context);
for (const tz of ['UTC', 'Europe/Madrid', 'America/New_York']) {
  process.env.TZ = tz;
  for (const [day, offset] of [['2026-10-10', '+02:00'], ['2026-01-10', '+01:00']]) {
    const raw = `${day}T22:26`;
    const expected = Date.parse(`${raw}:00${offset}`);
    assert.equal(time.timestamp(raw), expected);
    for (const [minute, open] of [['25', false], ['26', true], ['31', true]]) {
      context.course = { enrollmentOpensAt: raw };
      context.now = Date.parse(`${day}T22:${minute}:00${offset}`);
      assert.equal(vm.runInContext('isCourseEnrollmentWindowOpen(course, now)', context), open);
    }
    assert.equal(time.timestamp(new Date(expected).toISOString()), expected);
    assert.equal(time.timestamp(`${raw}:00${offset}`), expected);
    if (tz === 'Europe/Madrid') {
      assert.equal(time.localInput(new Date(expected).toISOString()), raw);
      assert.equal(time.localInput(raw), raw);
      assert.equal(time.fromLocalInput(raw), new Date(expected).toISOString());
    }
  }
  context.course = { enrollmentOpensAt: '' };
  assert.equal(vm.runInContext('isCourseEnrollmentWindowOpen(course, 0)', context), true);
  assert.equal(time.canonical(''), '');
}
assert.equal(time.timestamp('2026-02-30T22:26'), null);
assert.equal(time.timestamp('2026-03-29T02:30'), null);
assert.equal(time.canonical('2026-10-10T22:26'), '2026-10-10T20:26:00.000Z');
console.log('Enrollment timezone regression passed (UTC, Madrid, New York; summer/winter; UI roundtrip).');
context.normalizeCourseClass = value => value;
context.normalizeCourseAccessScope = value => value;
const mutationStart = server.indexOf('function normalizeCourseMutationPayload(');
const mutationEnd = server.indexOf('\nfunction ', mutationStart + 1);
vm.runInContext(server.slice(mutationStart, mutationEnd), context);
context.payload = { title: 'QA', type: 'Curso', startDate: '2026-10-10', endDate: '2026-10-11', hours: 4, capacity: 4, enrollmentOpensAt: '2026-10-10T22:26' };
assert.equal(vm.runInContext('normalizeCourseMutationPayload(payload).enrollmentOpensAt', context), '2026-10-10T20:26:00.000Z');
context.payload.enrollmentOpensAt = '';
assert.equal(vm.runInContext('normalizeCourseMutationPayload(payload).enrollmentOpensAt', context), '');
context.payload.enrollmentOpensAt = 'invalid';
assert.throws(() => vm.runInContext('normalizeCourseMutationPayload(payload)', context), /fecha/);

process.env.TZ = "Europe/Madrid";
assert.throws(() => time.fromLocalInput("2026-03-29T02:30"), /hora local no existe/);
assert.equal(time.fromLocalInput("2026-03-29T03:30"), "2026-03-29T01:30:00.000Z");
assert.throws(() => time.fromLocalInput("2026-02-30T22:26"), /fecha/);
