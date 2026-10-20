import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const {
  createAdminSeatReservationsHandler,
  getCourseGuestReservationCount,
  getCourseOccupiedSeatCount,
  getCourseSeatsLeft
} = require('../server/admin-seat-reservations.js');

const state = {
  members: [
    { id: 'member-1', name: 'Socio Uno', email: 'uno@example.test' },
    { id: 'member-2', name: 'Socio Dos', email: 'dos@example.test' }
  ],
  courses: [{
    id: 'course-1',
    title: 'Curso con reservas',
    capacity: 2,
    enrollmentFee: 25,
    enrollmentOpensAt: '2099-01-01T10:00:00.000Z',
    enrolledIds: [],
    waitingIds: [],
    enrollmentSubmissions: [],
    adminReservations: []
  }],
  activityLog: []
};

function response() {
  return {
    statusCode: 0,
    body: null,
    headers: {},
    setHeader(name, value) { this.headers[name] = value; }
  };
}

const deps = {
  readState: () => state,
  writeState: () => {},
  requireAdminAccount: () => ({ id: 'admin-1', name: 'Admin QA', role: 'admin' }),
  readJsonBody: async (req) => req.body || {},
  sendJson: (res, status, body) => { res.statusCode = status; res.body = body; },
  sendJsonError: (res, error, fallback) => {
    res.statusCode = 400;
    res.body = { ok: false, error: error?.message || fallback };
  },
  appendActivity: (target, type, actor, message) => {
    target.activityLog.push({ type, actor, message });
  }
};

const handle = createAdminSeatReservationsHandler(deps);

async function request(method, path, body = {}) {
  const req = { method, body };
  const res = response();
  const handled = await handle(req, res, new URL(path, 'http://localhost'));
  assert.equal(handled, true, `${method} ${path} should be handled`);
  return res;
}

const course = state.courses[0];
assert.equal(getCourseOccupiedSeatCount(course), 0);
assert.equal(getCourseSeatsLeft(course), 2);

// Admin can reserve before the public opening time.
let res = await request('POST', '/api/courses/course-1/admin-reservations', {
  kind: 'member', memberId: 'member-1'
});
assert.equal(res.statusCode, 201);
assert.equal(course.enrolledIds.includes('member-1'), true);
assert.equal(course.adminReservations[0].kind, 'member');
assert.equal(course.enrollmentSubmissions[0].source, 'admin-reservation');
assert.equal(course.enrollmentSubmissions[0].status, 'pending-proof');
assert.equal(getCourseOccupiedSeatCount(course), 1);
assert.equal(getCourseSeatsLeft(course), 1);

// Same member/course cannot consume the seat twice.
res = await request('POST', '/api/courses/course-1/admin-reservations', {
  kind: 'member', memberId: 'member-1'
});
assert.equal(res.statusCode, 409);
assert.equal(getCourseOccupiedSeatCount(course), 1);

// External guest gets a real seat without a fake member account.
res = await request('POST', '/api/courses/course-1/admin-reservations', {
  kind: 'guest', guestName: 'Invitada Externa', email: 'guest@example.test', phone: '600000000'
});
assert.equal(res.statusCode, 201);
const guestReservation = res.body.reservation;
assert.equal(guestReservation.kind, 'guest');
assert.equal(getCourseGuestReservationCount(course), 1);
assert.equal(getCourseOccupiedSeatCount(course), 2);
assert.equal(getCourseSeatsLeft(course), 0);
assert.equal(course.enrolledIds.length, 1, 'guest must not create a fake member enrollment');

// Capacity is authoritative.
res = await request('POST', '/api/courses/course-1/admin-reservations', {
  kind: 'guest', guestName: 'Otra invitada', email: 'other@example.test'
});
assert.equal(res.statusCode, 409);
assert.match(res.body.error, /No quedan plazas/i);

// External payment state can be managed without pretending it is a member payment.
res = await request('POST', `/api/courses/course-1/admin-reservations/${guestReservation.id}/payment`, { paid: true });
assert.equal(res.statusCode, 200);
assert.equal(guestReservation.paymentStatus, 'paid');

// Releasing the guest returns the seat immediately.
res = await request('DELETE', `/api/courses/course-1/admin-reservations/${guestReservation.id}`);
assert.equal(res.statusCode, 200);
assert.equal(getCourseGuestReservationCount(course), 0);
assert.equal(getCourseOccupiedSeatCount(course), 1);
assert.equal(getCourseSeatsLeft(course), 1);

// A second member can now take the released seat.
res = await request('POST', '/api/courses/course-1/admin-reservations', {
  kind: 'member', memberId: 'member-2'
});
assert.equal(res.statusCode, 201);
assert.equal(getCourseOccupiedSeatCount(course), 2);

// Releasing a member reservation removes only its admin-created enrollment/submission.
const memberReservation = course.adminReservations.find((item) => item.memberId === 'member-2');
res = await request('DELETE', `/api/courses/course-1/admin-reservations/${memberReservation.id}`);
assert.equal(res.statusCode, 200);
assert.equal(course.enrolledIds.includes('member-2'), false);
assert.equal(course.enrollmentSubmissions.some((item) => item.memberId === 'member-2'), false);
assert.equal(getCourseSeatsLeft(course), 1);

assert.ok(state.activityLog.length >= 5);
console.log('Admin seat reservations passed: member, guest, capacity, payment and release.');
