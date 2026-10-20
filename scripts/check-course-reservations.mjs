import assert from "node:assert/strict";
import reservations from "../server/course-reservations.js";

const {
  getSeatsLeft,
  reserveAdministrativeSeat,
  releaseAdministrativeSeat
} = reservations;

function fixture({ capacity = 3, fee = 0 } = {}) {
  return {
    accounts: [],
    associates: [
      { id: "associate-1", linkedMemberId: "member-1", firstName: "Ana", lastName: "Socio" }
    ],
    members: [
      { id: "member-1", name: "Ana Socio", associateId: "associate-1", email: "ana@example.org" },
      { id: "member-2", name: "Bruno Socio", associateId: "associate-2", email: "bruno@example.org" }
    ],
    courses: [
      {
        id: "course-1",
        title: "Jornada QA",
        status: "Planificacion",
        enrollmentOpensAt: "2099-01-01T09:00:00.000Z",
        capacity,
        enrollmentFee: fee,
        enrolledIds: [],
        waitingIds: [],
        diplomaReady: [],
        enrollmentSubmissions: []
      }
    ]
  };
}

{
  const state = fixture();
  const result = reserveAdministrativeSeat(state, "course-1", {
    participantType: "member",
    memberId: "member-1",
    reservedBy: "Admin QA"
  });
  assert.deepEqual(state.courses[0].enrolledIds, ["member-1"]);
  assert.equal(result.submission.source, "admin-reservation");
  assert.equal(result.submission.participantType, "member");
  assert.equal(result.submission.status, "confirmed");
  assert.equal(result.seatsLeft, 2);
}

{
  const state = fixture({ fee: 25 });
  const result = reserveAdministrativeSeat(state, "course-1", {
    participantType: "external",
    firstName: "Eva",
    lastName: "Externa",
    email: "eva@example.org",
    phone: "600123123",
    reservedBy: "Admin QA"
  });
  assert.equal(state.members.length, 3);
  assert.equal(result.member.source, "admin-course-guest");
  assert.equal(result.submission.participantType, "external");
  assert.equal(result.submission.status, "pending-proof");
  assert.equal(result.submission.amount, 25);
  assert.equal(state.courses[0].enrolledIds.includes(result.member.id), true);
}

{
  const state = fixture({ capacity: 2 });
  reserveAdministrativeSeat(state, "course-1", { participantType: "member", memberId: "member-1" });
  reserveAdministrativeSeat(state, "course-1", { participantType: "member", memberId: "member-2" });
  assert.equal(getSeatsLeft(state.courses[0]), 0);
  assert.throws(
    () => reserveAdministrativeSeat(state, "course-1", {
      participantType: "external",
      firstName: "Sin",
      lastName: "Plaza"
    }),
    /No quedan plazas/
  );
}

{
  const state = fixture();
  reserveAdministrativeSeat(state, "course-1", { participantType: "member", memberId: "member-1" });
  assert.throws(
    () => reserveAdministrativeSeat(state, "course-1", { participantType: "member", memberId: "member-1" }),
    /ya figura en el curso/
  );
}

{
  const state = fixture();
  const reservation = reserveAdministrativeSeat(state, "course-1", {
    participantType: "external",
    firstName: "Luz",
    lastName: "Invitada",
    email: "luz@example.org"
  });
  const guestId = reservation.member.id;
  const released = releaseAdministrativeSeat(state, "course-1", reservation.submission.id);
  assert.equal(state.courses[0].enrolledIds.includes(guestId), false);
  assert.equal(state.courses[0].enrollmentSubmissions.length, 0);
  assert.equal(state.members.some((member) => member.id === guestId), false);
  assert.equal(released.removedGuest, true);
  assert.equal(released.seatsLeft, 3);
}

{
  const state = fixture();
  const reservation = reserveAdministrativeSeat(state, "course-1", {
    participantType: "member",
    memberId: "member-1"
  });
  releaseAdministrativeSeat(state, "course-1", reservation.submission.id);
  assert.equal(state.members.some((member) => member.id === "member-1"), true, "Liberar la plaza nunca borra al socio");
}

{
  const state = fixture();
  const reservation = reserveAdministrativeSeat(state, "course-1", {
    participantType: "external",
    firstName: "Noa",
    lastName: "Compartida",
    email: "noa@example.org"
  });
  state.courses.push({
    id: "course-2",
    capacity: 2,
    enrolledIds: [reservation.member.id],
    waitingIds: [],
    diplomaReady: [],
    enrollmentSubmissions: []
  });
  const released = releaseAdministrativeSeat(state, "course-1", reservation.submission.id);
  assert.equal(released.removedGuest, false);
  assert.equal(state.members.some((member) => member.id === reservation.member.id), true);
}

console.log("Administrative course reservation checks passed.");
