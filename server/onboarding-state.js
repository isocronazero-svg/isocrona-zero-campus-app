const { randomUUID } = require("node:crypto");
const { membershipFeeYearForDate } = require("../public/membership-fee-policy.js");

// Protect onboarding-owned access/delivery fields and instructor eligibility from async stale writers.
// Unrelated application state keeps the existing storage behavior.
const associateFields = ["firstName", "lastName", "email", "status", "observations", "linkedMemberId", "linkedAccountId", "campusAccessStatus",
  "temporaryPassword", "campusOnboardingCreatedAt", "welcomeEmailStatus", "welcomeEmailSentAt", "welcomeEmailError",
  "membershipFeeYear", "membershipFeeYearAssignedAt", "membershipFeeYearSource"];
const memberFields = ["id", "associateId", "email", "name", "source", "phone", "role", "createdAt", "certifications", "renewalsDue"];

function applyNewAssociateMembershipFeeYears(state, latestCapture) {
  const existingIds = latestCapture?.allAssociateIds || new Set();
  let changed = false;
  for (const associate of state.associates || []) {
    if (!associate?.id || existingIds.has(associate.id) || Number(associate.membershipFeeYear) >= 2000) continue;
    const sourceDate = associate.joinedAt || associate.campusOnboardingCreatedAt || associate.createdAt || new Date().toISOString();
    associate.membershipFeeYear = membershipFeeYearForDate(sourceDate);
    associate.membershipFeeYearAssignedAt = new Date().toISOString();
    associate.membershipFeeYearSource = "automatic-new-associate";
    changed = true;
  }
  return changed;
}

function snapshotEnrollment(course) {
  return structuredClone({
    enrolledIds: Array.isArray(course?.enrolledIds) ? course.enrolledIds : [],
    waitingIds: Array.isArray(course?.waitingIds) ? course.waitingIds : [],
    enrollmentSubmissions: Array.isArray(course?.enrollmentSubmissions) ? course.enrollmentSubmissions : []
  });
}

function mergeStringListDelta(incoming = [], before = [], latest = []) {
  const beforeSet = new Set(before || []);
  const incomingSet = new Set(incoming || []);
  const result = new Set(latest || []);
  for (const id of beforeSet) if (!incomingSet.has(id)) result.delete(id);
  for (const id of incomingSet) if (!beforeSet.has(id)) result.add(id);
  return [...result];
}

function recordKey(item) {
  return `${String(item?.id || "")}::${String(item?.memberId || "")}`;
}

function ensureCollisionSafeRecord(record, result) {
  const cloned = structuredClone(record);
  if (!cloned?.id) return cloned;
  const collision = [...result.values()].some((item) =>
    item?.id === cloned.id && item?.memberId !== cloned.memberId
  );
  if (collision) cloned.id = `enrollment-${randomUUID()}`;
  return cloned;
}

function mergeRecordListDelta(incoming = [], before = [], latest = []) {
  const beforeMap = new Map((before || []).map(item => [recordKey(item), item]));
  const incomingMap = new Map((incoming || []).map(item => [recordKey(item), item]));
  const result = new Map((latest || []).map(item => [recordKey(item), structuredClone(item)]));
  for (const key of beforeMap.keys()) if (!incomingMap.has(key)) result.delete(key);
  for (const [key, record] of incomingMap) {
    const previous = beforeMap.get(key);
    if (!previous || JSON.stringify(previous) !== JSON.stringify(record)) {
      const safe = ensureCollisionSafeRecord(record, result);
      result.set(recordKey(safe), safe);
      if (recordKey(safe) !== key) result.delete(key);
    }
  }
  return [...result.values()];
}

function capacityConflict(message) {
  const error = new Error(message);
  error.code = "ENROLLMENT_CAPACITY_CONFLICT";
  error.status = 409;
  error.statusCode = 409;
  return error;
}

function assertEnrollmentCapacity(state, current) {
  for (const course of state.courses || []) {
    const capacity = Number(course.capacity || 0);
    if (!Number.isFinite(capacity) || capacity <= 0) continue;
    const occupied = new Set((course.enrolledIds || []).filter(Boolean)).size;
    const latest = current?.enrollmentCourses?.get(course.id);
    const latestOccupied = new Set((latest?.enrolledIds || []).filter(Boolean)).size;
    if (occupied > Math.floor(capacity) && occupied > latestOccupied) {
      throw capacityConflict(`El curso ${course.title || course.id || "seleccionado"} ya no tiene plazas suficientes para completar la operacion.`);
    }
  }
}

function capture(state) {
  const associates = (state.associates || []).filter(item => item.campusOnboardingCreatedAt);
  const protectedMemberIds = new Set(associates.map(item => item.linkedMemberId).filter(Boolean));
  return {
    allAssociateIds: new Set((state.associates || []).map(item => item.id).filter(Boolean)),
    feeYears: new Map((state.associates || []).map(item => [item.id, {
      membershipFeeYear: item.membershipFeeYear,
      membershipFeeYearAssignedAt: item.membershipFeeYearAssignedAt,
      membershipFeeYearSource: item.membershipFeeYearSource
    }])),
    applicationDnis: new Map((state.associateApplications || []).map(item => [item.id, item.dni])),
    applicationProofs: new Map((state.associateApplications || []).map(item => [item.id, item.paymentProof])),
    journeyTypes: new Map((state.courses || []).map(course => [course.id, {journeyTypeId:course.journeyTypeId, journeyTypeLabel:course.journeyTypeLabel}])),
    academicCourses: new Map((state.courses || []).map(course => [course.id, structuredClone({
      attendance: course.attendance, evaluations: course.evaluations, diplomaReady: course.diplomaReady
    })])),
    enrollmentCourses: new Map((state.courses || []).map(course => [course.id, snapshotEnrollment(course)])),
    instructorFlags: new Map((state.associates || []).map(item => [item.id, item.instructorEnabled === true])),
    smtp: structuredClone(state.settings?.smtp),
    associates: new Map(associates.map(item => [item.id, structuredClone(item)])),
    members: new Map((state.members || []).filter(item =>
      protectedMemberIds.has(item.id) || item.source === "admin-course-guest"
    ).map(item => [item.id, structuredClone(item)])),
    accounts: new Map((state.accounts || []).filter(item => associates.some(a => a.linkedAccountId === item.id)).map(item => [item.id, structuredClone(item)])),
    emailOutbox: new Map((state.emailOutbox || []).filter(item => item.kind === "associate_welcome" ||
      item.kind === "course_diploma" || (!item.kind && item.courseId && item.memberId &&
        String(item.subject || "").startsWith("Diploma emitido - "))).map(item => [item.id, structuredClone(item)]))
  };
}

function mergeConcurrentAccessChanges(state, baseline, current, instructorUpdateId) {
  if (baseline) for (const associate of state.associates || []) {
    const latest = current.feeYears.get(associate.id);
    if (latest && JSON.stringify(latest) !== JSON.stringify(baseline.feeYears.get(associate.id))) {
      Object.assign(associate, latest);
    }
  }
  if (baseline) for (const application of state.associateApplications || []) {
    if (current.applicationDnis.has(application.id) &&
        baseline.applicationDnis.get(application.id) !== current.applicationDnis.get(application.id)) {
      application.dni = current.applicationDnis.get(application.id);
    }
    if (current.applicationProofs.has(application.id) &&
        baseline.applicationProofs.get(application.id) !== current.applicationProofs.get(application.id)) {
      application.paymentProof = current.applicationProofs.get(application.id);
    }
  }
  for (const course of state.courses || []) {
    const latest = current.journeyTypes.get(course.id), before = baseline?.journeyTypes.get(course.id);
    if (latest && (!Object.hasOwn(course, "journeyTypeId") || (baseline && JSON.stringify(before) !== JSON.stringify(latest)))) Object.assign(course, latest);
  }
  // Preserve concurrent enrollment/reservation changes with a three-way merge.
  if (baseline) for (const course of state.courses || []) {
    const before = baseline.enrollmentCourses.get(course.id);
    const latest = current.enrollmentCourses.get(course.id);
    if (!latest || JSON.stringify(before) === JSON.stringify(latest)) continue;
    if (!before) {
      Object.assign(course, structuredClone(latest));
      continue;
    }
    course.enrolledIds = mergeStringListDelta(course.enrolledIds, before.enrolledIds, latest.enrolledIds);
    course.waitingIds = mergeStringListDelta(course.waitingIds, before.waitingIds, latest.waitingIds);
    course.enrollmentSubmissions = mergeRecordListDelta(
      course.enrollmentSubmissions,
      before.enrollmentSubmissions,
      latest.enrollmentSubmissions
    );
  }
  // An async writer may predate a synchronous academic correction/closure. Never roll it back or issue from its stale grades.
  if (baseline) for (const course of state.courses || []) {
    const before = baseline.academicCourses.get(course.id);
    const latest = current.academicCourses.get(course.id);
    if (!latest || JSON.stringify(before) === JSON.stringify(latest)) continue;
    if (!before) { Object.assign(course, structuredClone(latest)); continue; }
    const changedGrades = new Set();
    for (const field of ["attendance", "evaluations"]) {
      for (const id of new Set([...Object.keys(before[field] || {}), ...Object.keys(latest[field] || {})])) {
        if (JSON.stringify(before[field]?.[id]) === JSON.stringify(latest[field]?.[id])) continue;
        changedGrades.add(id);
        course[field] = course[field] || {};
        if (Object.hasOwn(latest[field] || {}, id)) course[field][id] = latest[field][id];
        else delete course[field][id];
      }
    }
    const committed = new Set((state.emailOutbox || []).filter(email =>
      email.courseId === course.id && email.diplomaCommittedAt).map(email => email.memberId));
    course.diplomaReady = [...new Set([...(latest.diplomaReady || []),
      ...(course.diplomaReady || []).filter(id => !changedGrades.has(id) || committed.has(id))])];
  }
  if (baseline && JSON.stringify(baseline.smtp) !== JSON.stringify(current.smtp)) {
    state.settings = { ...(state.settings || {}), smtp: structuredClone(current.smtp) };
  }
  for (const collection of ["associates", "members", "accounts", "emailOutbox"]) {
    const previous = baseline?.[collection] || new Map();
    const latest = current[collection];
    const rows = new Map((state[collection] || []).map(item => [item.id, item]));
    for (const [id, record] of latest) {
      const before = previous.get(id);
      const fields = collection === "associates" ? associateFields : collection === "members" ? memberFields :
        [...new Set([...Object.keys(before || {}), ...Object.keys(record)])];
      if (!before) {
        const incoming = rows.get(id);
        if (incoming && ["associates", "members"].includes(collection)) {
          for (const key of fields) incoming[key] = record[key];
        } else rows.set(id, structuredClone(record));
        continue;
      }
      const changed = fields.filter(key => JSON.stringify(before[key]) !== JSON.stringify(record[key]));
      if (!changed.length) continue;
      if (!rows.has(id)) rows.set(id, structuredClone(record));
      else for (const key of changed) rows.get(id)[key] = record[key];
    }
    // A deliberate deletion after the reader's snapshot must not be resurrected.
    for (const id of previous.keys()) if (!latest.has(id)) rows.delete(id);
    state[collection] = [...rows.values()];
  }
  for (const associate of state.associates || []) {
    if (associate.id !== instructorUpdateId || !baseline ||
        baseline.instructorFlags.get(associate.id) !== current.instructorFlags.get(associate.id)) {
      associate.instructorEnabled = current.instructorFlags.get(associate.id) === true;
    }
  }
  assertEnrollmentCapacity(state, current);
  return state;
}

function createOnboardingStateAccess(storage) {
  const snapshots = new WeakMap();
  const rejectedCapacityStates = new WeakSet();
  return {
    readState() {
      const state = storage.readState();
      snapshots.set(state, capture(state));
      return state;
    },
    reconcileState(state, baselineState) {
      const latest = capture(storage.readState());
      mergeConcurrentAccessChanges(state, snapshots.get(baselineState), latest);
      applyNewAssociateMembershipFeeYears(state, latest);
      // Reconstructed whole-state payloads need a baseline too, including across automation awaits.
      snapshots.set(state, latest);
    },
    writeState(state, { instructorUpdateId } = {}) {
      // The member enrollment endpoint historically retries writeState(state) inside its catch block.
      // If the first write lost a last-seat race, swallow exactly that immediate retry so the request
      // can return the original controlled 409 instead of rethrowing an unhandled rejection.
      if (rejectedCapacityStates.has(state)) {
        rejectedCapacityStates.delete(state);
        return;
      }
      const latest = capture(storage.readState());
      try {
        mergeConcurrentAccessChanges(state, snapshots.get(state), latest, instructorUpdateId);
        applyNewAssociateMembershipFeeYears(state, latest);
      } catch (error) {
        if (error?.code === "ENROLLMENT_CAPACITY_CONFLICT") rejectedCapacityStates.add(state);
        throw error;
      }
      storage.writeState(state);
      snapshots.set(state, capture(state));
    }
  };
}

module.exports = {
  applyNewAssociateMembershipFeeYears,
  createOnboardingStateAccess,
  membershipFeeYearForDate
};
