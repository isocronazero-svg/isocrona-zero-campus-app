import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { Readable } from "node:stream";
import {
  adaptStatePricing,
  applyCoursePricingToRequestBody,
  resetCoursePricingEnhancerForTests
} from "../public/assets/js/app/campus/coursePricingEnhancer.js";

const require = createRequire(import.meta.url);
const {
  coursePricingConfig,
  getApplicableCourseFee,
  getApplicableCourseFeeForAccount,
  getCoursePricing,
  getMemberEnrollmentFee,
  getNonMemberEnrollmentFee,
  getParticipantTypeForAccount
} = require("../server/course-pricing.js");
const { courseTestConfig } = require("../server/course-shared-tests.js");
const { reserveAdministrativeSeat } = require("../server/course-reservations.js");
const { readJsonBody } = require("../server/http.js");

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
    associates: [{ id: "associate-1", linkedMemberId: "member-1", linkedAccountId: "account-1" }]
  };
  const member = { id: "member-1", associateId: "associate-1" };
  const account = { id: "account-1", memberId: "member-1" };
  const externalMember = { id: "member-external", source: "public-campus" };
  const externalAccount = { id: "account-external", memberId: "member-external", source: "public-campus" };
  const course = { enrollmentFee: 55, memberEnrollmentFee: 5, nonMemberEnrollmentFee: 55 };
  assert.equal(getParticipantTypeForAccount(state, account, member), "member");
  assert.equal(getApplicableCourseFeeForAccount(state, course, account, member), 5);
  assert.equal(getParticipantTypeForAccount(state, externalAccount, externalMember), "external");
  assert.equal(getApplicableCourseFeeForAccount(state, course, externalAccount, externalMember), 55);
}

{
  assert.deepEqual(
    coursePricingConfig({ memberEnrollmentFee: 12, nonMemberEnrollmentFee: 44, enrollmentFee: 99 }, {}),
    { memberEnrollmentFee: 12, nonMemberEnrollmentFee: 44, enrollmentFee: 44 }
  );
  assert.deepEqual(
    coursePricingConfig({ enrollmentFee: 30 }, { enrollmentFee: 30 }),
    { memberEnrollmentFee: 30, nonMemberEnrollmentFee: 30, enrollmentFee: 30 }
  );
  const mutationConfig = courseTestConfig(
    { testZoneQuestions: [] },
    { course: { memberEnrollmentFee: 8, nonMemberEnrollmentFee: 50, enrollmentFee: 50 } },
    { enrollmentFee: 25, sharedTestQuestionIds: [], sharedTestPublished: false }
  );
  assert.equal(mutationConfig.memberEnrollmentFee, 8);
  assert.equal(mutationConfig.nonMemberEnrollmentFee, 50);
  assert.equal(mutationConfig.enrollmentFee, 50);
}

{
  const state = {
    members: [{ id: "member-1", name: "Socio Uno", email: "socio@example.test", associateId: "associate-1" }],
    associates: [{ id: "associate-1", linkedMemberId: "member-1", associateNumber: 1 }],
    courses: [{
      id: "course-1",
      title: "Curso precios V1.1",
      capacity: 4,
      enrollmentFee: 55,
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

{
  const req = Readable.from([Buffer.from(JSON.stringify({ amount: 0, note: "intento manipulado" }))]);
  req.headers = {};
  req.__izCourseEnrollmentPricing = { amount: 55, priceCategory: "non-member" };
  const payload = await readJsonBody(req, 2048);
  assert.equal(payload.amount, 55);
  assert.equal(payload.priceCategory, "non-member");
}

{
  const req = Readable.from([Buffer.from(JSON.stringify({ amount: 60 }))]);
  req.headers = {};
  req.__izCourseEnrollmentPricing = { amount: 0, priceCategory: "member" };
  const payload = await readJsonBody(req, 2048);
  assert.equal(payload.amount, "0", "El cero autorizado debe conservarse truthy frente al fallback legacy");
  assert.equal(Number(payload.amount || 60), 0, "Socio gratuito no debe heredar el precio general de 60 EUR");
  assert.equal(payload.priceCategory, "member");
}

{
  const requestBody = { course: { title: "Curso" } };
  applyCoursePricingToRequestBody(requestBody, { memberEnrollmentFee: 0, nonMemberEnrollmentFee: 60 });
  assert.deepEqual(requestBody.course, {
    title: "Curso",
    memberEnrollmentFee: 0,
    nonMemberEnrollmentFee: 60,
    enrollmentFee: 60
  });

  const memberState = adaptStatePricing({
    role: "member",
    selectedAssociateId: "associate-1",
    selectedCourseId: "course-1",
    courses: [{ id: "course-1", enrollmentFee: 60, memberEnrollmentFee: 0, nonMemberEnrollmentFee: 60 }]
  });
  assert.equal(memberState.courses[0].enrollmentFee, 0);

  const externalState = adaptStatePricing({
    role: "member",
    selectedAssociateId: null,
    selectedCourseId: "course-2",
    courses: [{ id: "course-2", enrollmentFee: 60, memberEnrollmentFee: 0, nonMemberEnrollmentFee: 60 }]
  });
  assert.equal(externalState.courses[0].enrollmentFee, 60);
  resetCoursePricingEnhancerForTests();
}

console.log("Course pricing V1.1: precios, persistencia, UI y autoridad de servidor OK.");
