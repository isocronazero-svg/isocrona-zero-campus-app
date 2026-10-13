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
// A stale academic status must never keep enrollment open after the start day.
context.course = { status: 'Inscripcion abierta', startDate: '2026-10-12', enrollmentOpensAt: '' };
assert.equal(vm.runInContext("isCourseEnrollmentWindowOpen(course, Date.parse('2026-10-11T22:00:00Z'))", context), false);
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
context.payload = { title: 'QA', type: 'Curso', startDate: '2026-10-12', endDate: '2026-10-13', hours: 4, capacity: 4, enrollmentOpensAt: '2026-10-10T22:26' };
assert.equal(vm.runInContext('normalizeCourseMutationPayload(payload).enrollmentOpensAt', context), '2026-10-10T20:26:00.000Z');
context.payload.enrollmentOpensAt = '';
assert.equal(vm.runInContext('normalizeCourseMutationPayload(payload).enrollmentOpensAt', context), '');
context.payload.enrollmentOpensAt = 'invalid';
assert.throws(() => vm.runInContext('normalizeCourseMutationPayload(payload)', context), /fecha/);

process.env.TZ = "Europe/Madrid";
assert.throws(() => time.fromLocalInput("2026-03-29T02:30"), /hora local no existe/);
assert.equal(time.fromLocalInput("2026-03-29T03:30"), "2026-03-29T01:30:00.000Z");
assert.throws(() => time.fromLocalInput("2026-02-30T22:26"), /fecha/);

for (const tz of ['UTC', 'Europe/Madrid', 'America/New_York']) {
  process.env.TZ = tz;
  for (const [day, precedingDay, offset] of [
    ['2026-01-12', '2026-01-11', '+01:00'], ['2026-07-12', '2026-07-11', '+02:00'],
    ['2026-03-30', '2026-03-29', '+02:00'], ['2026-10-26', '2026-10-25', '+01:00']
  ]) {
    const base = { status: 'Inscripcion abierta', startDate: day, enrollmentOpensAt: `${precedingDay}T10:00` };
    const fallback = Date.parse(`${day}T00:00:00${offset}`);
    assert.equal(time.courseCloseTimestamp(base), fallback);
    for (const explicit of ['', `${precedingDay}T20:00`]) {
      const course = { ...base, enrollmentClosesAt: explicit };
      const close = explicit ? Date.parse(`${explicit}:00${offset}`) : fallback;
      assert.doesNotThrow(() => time.validateCourseWindow(course));
      for (const [delta, expected] of [[-1, 'open'], [0, 'closed'], [1, 'closed']]) {
        assert.equal(time.courseWindowState(course, close + delta), expected, `${tz}: ${day}/${explicit}/${delta}`);
        context.course = course;
        context.now = new Date(close + delta).toISOString();
        assert.equal(vm.runInContext('isCourseEnrollmentWindowOpen(course, now)', context), expected === 'open');
      }
      assert.equal(time.courseWindowState(course, time.timestamp(base.enrollmentOpensAt) - 1), 'future');
    }
    assert.throws(() => time.validateCourseWindow({ ...base, enrollmentClosesAt: `${day}T00:00` }), /cierre.*anterior/);
    assert.throws(() => time.validateCourseWindow({ ...base, enrollmentClosesAt: `${day}T01:00` }), /cierre.*anterior/);
    for (const opens of [`${precedingDay}T20:00`, `${precedingDay}T21:00`]) {
      assert.throws(() => time.validateCourseWindow({ ...base, enrollmentOpensAt: opens, enrollmentClosesAt: `${precedingDay}T20:00` }), /apertura.*anterior/);
    }
    assert.throws(() => time.validateCourseWindow({ ...base, enrollmentOpensAt: `${day}T00:00` }), /apertura.*anterior/);
    assert.equal(time.courseWindowState({ ...base, enrollmentClosesAt: `${day}T12:00` }, fallback), 'closed', 'Legacy/import cannot extend past start');
  }
}
assert.equal(time.timestamp('2026-10-25T02:30'), Date.parse('2026-10-25T00:30:00Z'), 'Repeated hour chooses first occurrence');
assert.throws(() => time.validateCourseWindow({ startDate: '2026-03-30', enrollmentClosesAt: '2026-03-29T02:30' }), /cierre/);
assert.equal(time.courseWindowState({ startDate: '2099-01-01', enrollmentClosesAt: 'bad' }), 'closed');
assert.equal(time.courseWindowState({ startDate: 'invalid' }), 'closed');

context.payload = { title: 'QA', type: 'Curso', startDate: '2026-10-12', endDate: '2026-10-13', hours: 4, capacity: 4,
  enrollmentOpensAt: '2026-10-10T22:26', enrollmentClosesAt: '2026-10-11T20:00' };
const created = vm.runInContext('normalizeCourseMutationPayload(payload)', context);
assert.equal(created.enrollmentClosesAt, '2026-10-11T18:00:00.000Z');
context.previous = created;
context.payload = { title: 'Renamed' };
assert.equal(vm.runInContext('normalizeCourseMutationPayload(payload, previous).enrollmentClosesAt', context), created.enrollmentClosesAt);
context.payload = { startDate: '2026-10-11' };
assert.throws(() => vm.runInContext('normalizeCourseMutationPayload(payload, previous)', context), /cierre.*anterior/);
context.payload = { enrollmentOpensAt: created.enrollmentClosesAt };
assert.throws(() => vm.runInContext('normalizeCourseMutationPayload(payload, previous)', context), /apertura.*anterior/);
context.previous = { ...created, enrollmentOpensAt: '2026-10-13T10:00' };
context.payload = { title: 'Unrelated legacy edit' };
assert.doesNotThrow(() => vm.runInContext('normalizeCourseMutationPayload(payload, previous)', context));

// Render the real member cards, not a separate test implementation of the window.
const app = readFileSync('public/app.js', 'utf8');
function appFunction(name) {
  const from = app.indexOf(`function ${name}(`);
  assert.ok(from >= 0, name);
  return app.slice(from, app.indexOf('\nfunction ', from + 1));
}
const ui = vm.createContext({ EnrollmentTime: time, Date, state: { selectedMemberId: 'viewer' },
  getCourseSeatsLeft: () => 4, getCourseEnrolledCount: () => 0, getCourseWaitingCount: () => 0,
  normalizeCourseAccessScope: () => 'public', normalizeCourseClass: () => 'practico', COURSE_ACCESS_SCOPE_LABELS: { public: 'Abierto' },
  getCourseEnrollmentOpensAtLabel: () => 'Fecha futura', isMemberPreviewSession: () => false,
  escapeHtml: value => String(value || ''), describeCourseType: () => 'Jornada', formatDate: value => value });
vm.runInContext(['isCourseEnrollmentWindowOpen', 'isCourseOpenForEnrollment', 'getCourseEnrollmentCall', 'renderCompactCourseCard'].map(appFunction).join('\n'), ui);
for (const course of [
  { startDate: '2000-01-01' },
  { startDate: '2099-01-01', enrollmentClosesAt: '2000-01-01T00:00Z' }
]) {
  ui.course = { ...course, id: 'closed', status: 'Inscripcion abierta', enrolledIds: [], waitingIds: [], diplomaReady: [], capacity: 4 };
  const call = vm.runInContext('getCourseEnrollmentCall(course)', ui);
  assert.equal(call.closedMode, true); assert.equal(call.scheduledMode, false);
  const card = vm.runInContext('renderCompactCourseCard(course)', ui);
  assert.match(card, /Inscripción cerrada/);
  assert.doesNotMatch(card, /prepare-course-enrollment|Ver apertura|Inscribirme ahora|Inscripcion abierta/);
}
console.log('Enrollment close PASS: exact boundaries, fallback, DST/TZ, mutation validation, legacy compatibility and real member cards.');
