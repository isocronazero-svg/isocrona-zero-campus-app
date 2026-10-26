import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const {
  getApplicableCourseFee,
  getCoursePricing,
  getMemberEnrollmentFee,
  getNonMemberEnrollmentFee
} = require("../server/course-pricing.js");
const { reserveAdministrativeSeat } = require("../server/course-reservations.js");

{
  const course = { enrollmentFee: 35 };
  assert.equal(getMemberEnrollmentFee(course), 35);
  assert.equal(getNonMemberEnrollmentFee(course), 35);
  assert.equal(getApplicableCourseFee(course, "member"), 35);
  assert.equal(getApplicableCourseFee(course, "external"), 35);
}

{
  const course = {
    enrollmentFee: 35,
    memberEnrollmentFee: 10,
    nonMemberEnrollmentFee: 60
  };
  assert.deepEqual(getCoursePricing(course), {
    memberFee: 10,
    nonMemberFee: 60,
    legacyFee: 35
  });
  assert.equal(getApplicableCourseFee(course, "socio"), 10);
  assert.equal(getApplicableCourseFee(course, "external"), 60);
}

{
  const course = {
    enrollmentFee: 25,
    memberEnrollmentFee: 0,
    nonMemberEnrollmentFee: 49.95
  };
  assert.equal(getApplicableCourseFee(course, "member"), 0);
  assert.equal(getApplicableCourseFee(course, "external"), 49.95);
}

{
  const state = {
    members: [{ id: "member-1", name: "Socio Uno", email: "socio@example.test", associateId: "associate-1" }],
    associates: [{ id: "associate-1", linkedMemberId: "member-1", associateNumber: 1 }],
    courses: [{
      id: "course-1",
      title: "Curso precios V1.1",
      capacity: 4,
      enrollmentFee: 30,
      memberEnrollmentFee: 0,
      nonMemberEnrollmentFee: 55,
      enrolledIds: [],
      waitingIds: [],
      enrollmentSubmissions: []
    }]
  };

  const memberReservation = reserveAdministrativeSeat(state, "course-1", {
    participantType: "member",
    memberId: "member-1",
    reservedBy: "admin-test"
  });
  assert.equal(memberReservation.submission.amount, 0);
  assert.equal(memberReservation.submission.status, "confirmed");
  assert.equal(memberReservation.submission.priceCategory, "member");

  const externalReservation = reserveAdministrativeSeat(state, "course-1", {
    participantType: "external",
    firstName: "Invitado",
    lastName: "Externo",
    email: "externo@example.test",
    reservedBy: "admin-test"
  });
  assert.equal(externalReservation.submission.amount, 55);
  assert.equal(externalReservation.submission.status, "pending-proof");
  assert.equal(externalReservation.submission.priceCategory, "non-member");
}

console.log("Course pricing V1.1: socio/no socio y reservas administrativas OK.");
