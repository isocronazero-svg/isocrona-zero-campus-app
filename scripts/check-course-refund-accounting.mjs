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
assert.match(appSource, /item\.refund\?\.status === "completed" && item\.paymentStatus === "validated"/,
  "Admin finance summary must not subtract refunds from unvalidated payments");

const clientSource = readFileSync(new URL("../public/app.js", import.meta.url), "utf8");
assert.match(clientSource, /const certificateSubmission = getCourseEnrollmentSubmission\(course, currentMemberId\)/,
  "Member certificate UI must resolve the active submission");
assert.match(clientSource, /submission\.memberId === memberId && !\["cancelled", "rejected"\]\.includes\(submission\.status\)/,
  "Enrollment lookup must exclude cancelled and rejected history");

console.log("Course refund accounting OK");
