import assert from "node:assert/strict";
import onboardingState from "../server/onboarding-state.js";

const { createOnboardingStateAccess } = onboardingState;

function baseState(capacity = 2) {
  return {
    settings: { smtp: {} },
    associateApplications: [],
    associates: [],
    members: [],
    accounts: [],
    emailOutbox: [],
    courses: [{
      id: "course-1",
      title: "Curso concurrencia QA",
      capacity,
      enrolledIds: [],
      waitingIds: [],
      enrollmentSubmissions: [],
      attendance: {},
      evaluations: {},
      diplomaReady: []
    }]
  };
}

function memoryStorage(initial) {
  let stored = structuredClone(initial);
  return {
    readState() { return structuredClone(stored); },
    writeState(next) { stored = structuredClone(next); },
    snapshot() { return structuredClone(stored); }
  };
}

function enroll(state, memberId) {
  const course = state.courses[0];
  course.enrolledIds.push(memberId);
  course.enrollmentSubmissions.push({
    id: `reservation-${memberId}`,
    memberId,
    status: "confirmed",
    source: "admin-reservation"
  });
}

{
  const storage = memoryStorage(baseState(2));
  const access = createOnboardingStateAccess(storage);
  const first = access.readState();
  const second = access.readState();
  enroll(first, "member-1");
  access.writeState(first);
  enroll(second, "member-2");
  access.writeState(second);
  const stored = storage.snapshot();
  assert.deepEqual(new Set(stored.courses[0].enrolledIds), new Set(["member-1", "member-2"]));
  assert.equal(stored.courses[0].enrollmentSubmissions.length, 2);
}

{
  const storage = memoryStorage(baseState(1));
  const access = createOnboardingStateAccess(storage);
  const first = access.readState();
  const second = access.readState();
  enroll(first, "member-1");
  access.writeState(first);
  enroll(second, "member-2");
  assert.throws(() => access.writeState(second), /ya no tiene plazas suficientes/);
  const stored = storage.snapshot();
  assert.deepEqual(stored.courses[0].enrolledIds, ["member-1"]);
  assert.equal(stored.courses[0].enrollmentSubmissions.length, 1);
}

{
  const initial = baseState(3);
  initial.courses[0].enrolledIds = ["member-1"];
  initial.courses[0].enrollmentSubmissions = [{ id: "reservation-member-1", memberId: "member-1", status: "confirmed", source: "admin-reservation" }];
  const storage = memoryStorage(initial);
  const access = createOnboardingStateAccess(storage);
  const releaseWriter = access.readState();
  const addWriter = access.readState();

  releaseWriter.courses[0].enrolledIds = [];
  releaseWriter.courses[0].enrollmentSubmissions = [];
  enroll(addWriter, "member-2");
  access.writeState(addWriter);
  access.writeState(releaseWriter);

  const stored = storage.snapshot();
  assert.deepEqual(stored.courses[0].enrolledIds, ["member-2"]);
  assert.equal(stored.courses[0].enrollmentSubmissions.some(item => item.memberId === "member-1"), false);
  assert.equal(stored.courses[0].enrollmentSubmissions.some(item => item.memberId === "member-2"), true);
}

console.log("Concurrent course reservation checks passed.");
