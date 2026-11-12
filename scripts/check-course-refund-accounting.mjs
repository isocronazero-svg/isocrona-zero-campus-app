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
console.log("Course refund accounting OK");
