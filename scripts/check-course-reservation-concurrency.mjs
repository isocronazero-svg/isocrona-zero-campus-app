import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
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

function enroll(state, memberId, submissionId = `reservation-${memberId}`) {
  const course = state.courses[0];
  course.enrolledIds.push(memberId);
  course.enrollmentSubmissions.push({
    id: submissionId,
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
  assert.doesNotThrow(() => access.writeState(second), "El reintento historico del catch debe quedar neutralizado");
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

{
  const storage = memoryStorage(baseState(2));
  const access = createOnboardingStateAccess(storage);
  const first = access.readState();
  const second = access.readState();
  const collidingId = "enrollment-1700000000000";
  enroll(first, "member-1", collidingId);
  access.writeState(first);
  enroll(second, "member-2", collidingId);
  access.writeState(second);

  const stored = storage.snapshot();
  const submissions = stored.courses[0].enrollmentSubmissions;
  assert.equal(submissions.length, 2, "Dos inscripciones del mismo milisegundo deben conservarse");
  assert.equal(new Set(submissions.map(item => item.id)).size, 2, "Los IDs persistidos deben quedar unicos");
  assert.deepEqual(new Set(submissions.map(item => item.memberId)), new Set(["member-1", "member-2"]));
}

{
  const storage = memoryStorage(baseState(3));
  const access = createOnboardingStateAccess(storage);
  const first = access.readState();
  const second = access.readState();

  first.members.push({ id: "guest-1", name: "Invitada Uno", email: "uno@example.org", source: "admin-course-guest" });
  enroll(first, "guest-1", "reservation-guest-1");
  access.writeState(first);

  second.members.push({ id: "guest-2", name: "Invitada Dos", email: "dos@example.org", source: "admin-course-guest" });
  enroll(second, "guest-2", "reservation-guest-2");
  access.writeState(second);

  const stored = storage.snapshot();
  assert.deepEqual(new Set(stored.courses[0].enrolledIds), new Set(["guest-1", "guest-2"]));
  assert.equal(stored.members.some(member => member.id === "guest-1"), true);
  assert.equal(stored.members.some(member => member.id === "guest-2"), true);
}

{
  const initial = baseState(1);
  initial.courses[0].enrolledIds = ["legacy-1", "legacy-2"];
  const storage = memoryStorage(initial);
  const access = createOnboardingStateAccess(storage);
  const unrelatedWriter = access.readState();
  unrelatedWriter.settings.extra = true;
  assert.doesNotThrow(() => access.writeState(unrelatedWriter), "Un sobreaforo historico sin incremento no debe bloquear escrituras ajenas");
}

{
  const uiSource = readFileSync("public/assets/js/app/campus/courseReservations.js", "utf8");
  const noticesSource = readFileSync("server/notices.js", "utf8");
  assert.match(uiSource, /\/api\/admin\/courses\/.*\/reservations/, "La UI debe usar la mutacion acotada de reservas");
  assert.doesNotMatch(uiSource, /writeAdminState|body:\s*JSON\.stringify\(\{\s*\.\.\.state/, "La UI no debe volver a guardar el estado completo");
  assert.match(noticesSource, /reservationMatch/);
  assert.match(noticesSource, /reserveAdministrativeSeat\(state, courseId/);
  assert.match(noticesSource, /releaseAdministrativeSeat\(state, courseId, reservationId/);
}

console.log("Concurrent course reservation checks passed.");
