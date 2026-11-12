import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { buildCourseFinanceSnapshot } = require("../server/course-finance.js");
const state = { members: [{id:"m1",name:"Alumno"}], associates: [], courses: [{
  id:"c1",title:"Rescate",enrollmentFee:110,nonMemberEnrollmentFee:110,
  enrollmentSubmissions:[{id:"s1",memberId:"m1",participantType:"external",amount:110,status:"confirmed",paymentStatus:"validated"}]
}] };
const submission = state.courses[0].enrollmentSubmissions[0];
let snapshot = buildCourseFinanceSnapshot(state);
assert.equal(snapshot.summary.grossPaid,110);
assert.equal(snapshot.summary.netPaid,110);
submission.status="cancelled";
submission.refund={amount:110,status:"pending"};
snapshot=buildCourseFinanceSnapshot(state);
assert.equal(snapshot.summary.refundsPending,110);
assert.equal(snapshot.summary.refundsCompleted,0);
assert.equal(snapshot.summary.netPaid,110);
submission.refund.status="completed";
snapshot=buildCourseFinanceSnapshot(state);
assert.equal(snapshot.summary.refundsCompleted,110);
assert.equal(snapshot.summary.netPaid,0);
assert.equal(snapshot.courses[0].netPaid,0);
submission.refund.amount=35;
snapshot=buildCourseFinanceSnapshot(state);
assert.equal(snapshot.summary.netPaid,75);
assert.equal(snapshot.summary.refundsCompleted,35);

// Cross-module contract: cancellation revokes the enrollment certificate, while
// a later confirmed enrollment of the same member can legitimately obtain one.
const { buildEnrollmentCertificateModel } = require("../server/enrollment-certificate-model.js");
state.courses[0].enrolledIds = ["m1"];
state.courses[0].startDate = "2099-11-16";
state.courses[0].endDate = "2099-11-19";
state.courses[0].hours = 24;
assert.equal(buildEnrollmentCertificateModel(state, "c1", "m1"), null,
  "Cancelled enrollment cannot produce a certificate even with stale enrolledIds");
state.courses[0].enrollmentSubmissions.push({
  id: "s2", memberId: "m1", participantType: "external", amount: 110,
  status: "confirmed", paymentStatus: "validated"
});
const newCertificate = buildEnrollmentCertificateModel(state, "c1", "m1");
assert.equal(newCertificate?.memberId, "m1",
  "Historical cancellation must not shadow a fresh confirmed enrollment");


// A second enrollment is a distinct financial event. Preserve both historical
// income and refund when aggregating by course and by association.
let historySnapshot = buildCourseFinanceSnapshot(state);
assert.equal(historySnapshot.summary.total, 2);
assert.equal(historySnapshot.summary.grossPaid, 220);
assert.equal(historySnapshot.summary.refundsCompleted, 35);
assert.equal(historySnapshot.summary.netPaid, 185);
assert.equal(historySnapshot.courses[0].rows.filter(row => row.memberId === "m1").length, 2);

// End-to-end domain scenario: registration -> validated payment -> cancellation
// -> pending refund -> completed refund -> new registration -> certificate.
// The same financial snapshot must account for both registration records.
const journey = {
  members: [{ id: "m-journey", name: "Participante de prueba" }],
  associates: [],
  courses: [{
    id: "c-journey", title: "Curso de rescate", enrollmentFee: 90,
    nonMemberEnrollmentFee: 90, startDate: "2099-01-10", endDate: "2099-01-11",
    hours: 16, enrolledIds: ["m-journey"], waitingIds: [],
    enrollmentSubmissions: [{
      id: "journey-1", memberId: "m-journey", amount: 90,
      participantType: "external", status: "confirmed", paymentStatus: "pending"
    }]
  }]
};
const journeyCourse = journey.courses[0];
const journeyFirst = journeyCourse.enrollmentSubmissions[0];
assert.equal(buildEnrollmentCertificateModel(journey, "c-journey", "m-journey"), null,
  "Payment pending must not issue a certificate");
journeyFirst.paymentStatus = "validated";
assert.ok(buildEnrollmentCertificateModel(journey, "c-journey", "m-journey"),
  "Validated enrollment must issue a certificate");
journeyFirst.status = "cancelled";
journeyFirst.refund = { amount: 90, status: "pending" };
journeyCourse.enrolledIds = [];
assert.equal(buildEnrollmentCertificateModel(journey, "c-journey", "m-journey"), null,
  "Cancellation must revoke the certificate");
let journeyBalance = buildCourseFinanceSnapshot(journey).summary;
assert.equal(journeyBalance.grossPaid, 90);
assert.equal(journeyBalance.refundsPending, 90);
assert.equal(journeyBalance.netPaid, 90, "Pending refunds are not yet cash outflows");
journeyFirst.refund.status = "completed";
journeyBalance = buildCourseFinanceSnapshot(journey).summary;
assert.equal(journeyBalance.refundsCompleted, 90);
assert.equal(journeyBalance.netPaid, 0);
journeyCourse.enrollmentSubmissions.push({
  id: "journey-2", memberId: "m-journey", amount: 90,
  participantType: "external", status: "confirmed", paymentStatus: "pending"
});
journeyCourse.enrolledIds.push("m-journey");
assert.equal(buildEnrollmentCertificateModel(journey, "c-journey", "m-journey"), null,
  "New registration must require its own payment validation");
journeyCourse.enrollmentSubmissions[1].paymentStatus = "validated";
assert.ok(buildEnrollmentCertificateModel(journey, "c-journey", "m-journey"));
journeyBalance = buildCourseFinanceSnapshot(journey).summary;
assert.equal(journeyBalance.total, 2);
assert.equal(journeyBalance.grossPaid, 180);
assert.equal(journeyBalance.refundsCompleted, 90);
assert.equal(journeyBalance.netPaid, 90);

// A rejected older record must not shadow the next valid registration.
journeyCourse.enrollmentSubmissions.unshift({
  id: "journey-rejected", memberId: "m-journey", amount: 90,
  status: "rejected", paymentStatus: "pending"
});
assert.ok(buildEnrollmentCertificateModel(journey, "c-journey", "m-journey"));

// Guard the integration points that can silently break when server.js changes.
import { readFileSync } from "node:fs";
const serverSource = readFileSync(new URL("../server.js", import.meta.url), "utf8");
assert.match(serverSource, /id: `enrollment-\$\{randomUUID\(\)\}`/,
  "New enrollments must have collision-resistant IDs");
assert.match(serverSource, /\.\.\.\(course\.enrollmentSubmissions \|\| \[\]\)/,
  "New enrollments must preserve historical submissions");
assert.match(serverSource, /item\.memberId === member\.id && !\["cancelled", "rejected"\]\.includes\(item\.status\)/,
  "Payment proof upload must only target an active enrollment");
assert.match(serverSource, /Existe otra inscripción activa para este alumno/,
  "Cancellation must not accidentally release a seat owned by another active enrollment");
assert.match(serverSource, /Math\.abs\(refundAmount \* 100 - Math\.round\(refundAmount \* 100\)\) > 1e-7/,
  "Cent validation must tolerate floating-point representation of valid amounts");
assert.match(serverSource, /promotedSubmission\.status =/,
  "Waitlist promotion must update the linked enrollment");

const appSource = readFileSync(new URL("../public/app.js", import.meta.url), "utf8");
assert.match(appSource, /refundedAmount: item\.refund\?\.status === "completed" \? Math\.min\(validRefund, paidAmount\) : 0/,
  "Admin finance summary must only subtract completed refunds from validated payments");
assert.match(appSource, /Object\.prototype\.hasOwnProperty\.call\(item, "amount"\)/,
  "Admin finance summary must use the same legacy amount fallback as treasury");

assert.match(serverSource, /\["cancelled", "rejected"\]\.includes\(submission\.status\)/,
  "Closed enrollments must not be reactivated through admin review");
assert.match(serverSource, /Estado de revisión no permitido/,
  "Admin review must reject unsupported status transitions");
assert.match(serverSource, /Hay otra inscripción activa para este alumno/,
  "Admin review must reject conflicting duplicate active enrollments");
assert.match(serverSource, /action: "cancel-enrollment"/,
  "Cancellation must be recorded in the financial audit log");
assert.match(serverSource, /action: "complete-refund"/,
  "Completed refunds must be recorded in the financial audit log");
const financeSource = readFileSync(new URL("../server/course-finance.js", import.meta.url), "utf8");
assert.match(financeSource, /submission\.status === "cancelled" \|\| \["pending", "completed"\]\.includes\(submission\.refund\?\.status\)/,
  "Treasury must not rewrite payments on cancelled or refunded enrollments");
const clientSource = readFileSync(new URL("../public/app.js", import.meta.url), "utf8");
assert.match(clientSource, /const certificateSubmission = getCourseEnrollmentSubmission\(course, currentMemberId\)/,
  "Member certificate UI must resolve the active submission");
assert.match(clientSource, /submission\.memberId === memberId && !\["cancelled", "rejected"\]\.includes\(submission\.status\)/,
  "Enrollment lookup must exclude cancelled and rejected history");

console.log("Course refund accounting OK");
