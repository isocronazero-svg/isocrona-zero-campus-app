import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { enrollmentCertificateEligibility } = require("../server/enrollment-certificate-eligibility.js");
const course = { id: "course-1" };
const check = (submission) => enrollmentCertificateEligibility(course, submission).allowed;
assert.equal(check({ status: "confirmed", amount: 50, paymentStatus: "validated" }), true);
assert.equal(check({ status: "confirmed", amount: 0 }), true);
assert.equal(check({ status: "confirmed", amount: 50, paymentStatus: "pending" }), false);
assert.equal(check({ status: "confirmed", amount: 50, paymentStatus: "incident" }), false);
assert.equal(check({ status: "pending-proof", amount: 50, paymentStatus: "validated" }), false);
assert.equal(check({ status: "cancelled", amount: 0 }), false);
assert.equal(check({ status: "confirmed", paymentStatus: "validated" }), false);
assert.equal(check({ status: "confirmed", amount: -1, paymentStatus: "validated" }), false);
assert.equal(enrollmentCertificateEligibility(null, {}).allowed, false);
const { buildEnrollmentCertificateModel } = require("../server/enrollment-certificate-model.js");
const state = {
  members: [{ id: "member-1", name: "Alumno de prueba" }],
  courses: [{
    id: "course-1", title: "Rescate", hours: 16, startDate: "2026-11-16", enrolledIds: ["member-1"],
    enrollmentSubmissions: [{ id: "submission-1", memberId: "member-1", status: "confirmed", amount: 50, paymentStatus: "validated" }]
  }]
};
const model = buildEnrollmentCertificateModel(state, "course-1", "member-1");
assert.equal(model.name, "Alumno de prueba");
assert.equal(model.hours, 16);
assert.equal(model.certificateType, "confirmed-enrollment");
assert.equal(buildEnrollmentCertificateModel(state, "course-1", "member-2"), null);
state.courses[0].enrollmentSubmissions[0].paymentStatus = "pending";
assert.equal(buildEnrollmentCertificateModel(state, "course-1", "member-1"), null);
state.courses[0].enrollmentSubmissions[0].paymentStatus = "validated";
state.courses[0].enrolledIds = [];
assert.equal(buildEnrollmentCertificateModel(state, "course-1", "member-1"), null, "Sin plaza asignada no hay certificado");
console.log("Enrollment certificate eligibility and model OK");
