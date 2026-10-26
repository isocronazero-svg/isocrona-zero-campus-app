import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const {
  buildCourseFinanceSnapshot,
  canManageCourseFinance,
  createCourseFinanceHandler,
  normalizedPaymentStatus
} = require("../server/course-finance.js");
const { validateInstructorAssociateUpdate } = require("../server/instructor-certificate.js");

function seedState() {
  return {
    activityLog: [],
    accounts: [
      { id: "account-treasury", name: "Tesoreria QA", role: "member", memberId: "member-treasury", associateId: "associate-treasury" },
      { id: "account-member", name: "Socio QA", role: "member", memberId: "member-normal", associateId: "associate-normal" },
      { id: "account-admin", name: "Admin QA", role: "admin", memberId: "member-admin" }
    ],
    members: [
      { id: "member-treasury", name: "Tesoreria QA", associateId: "associate-treasury", email: "tesoreria@example.test" },
      { id: "member-normal", name: "Socio QA", associateId: "associate-normal", email: "socio@example.test" },
      { id: "member-external", name: "Externo QA", email: "externo@example.test", source: "public-campus" }
    ],
    associates: [
      { id: "associate-treasury", linkedMemberId: "member-treasury", linkedAccountId: "account-treasury", treasuryEnabled: true },
      { id: "associate-normal", linkedMemberId: "member-normal", linkedAccountId: "account-member", treasuryEnabled: false }
    ],
    courses: [{
      id: "course-finance-qa",
      title: "Curso tesoreria QA",
      status: "Inscripcion abierta",
      startDate: "2099-01-01",
      enrollmentFee: 60,
      memberEnrollmentFee: 10,
      nonMemberEnrollmentFee: 60,
      enrollmentSubmissions: [
        {
          id: "submission-member",
          memberId: "member-normal",
          status: "confirmed",
          amount: 10,
          paymentProof: { name: "socio.pdf", type: "application/pdf", size: 10, contentBase64: "cHJ1ZWJh" },
          submittedAt: "2098-12-01T10:00:00.000Z"
        },
        {
          id: "submission-external",
          memberId: "member-external",
          status: "confirmed",
          amount: 60,
          paymentProof: null,
          submittedAt: "2098-12-01T11:00:00.000Z"
        },
        {
          id: "submission-free",
          memberId: "member-treasury",
          status: "confirmed",
          amount: 0,
          submittedAt: "2098-12-01T12:00:00.000Z"
        }
      ]
    }]
  };
}

{
  const state = seedState();
  const treasury = state.accounts[0];
  const normal = state.accounts[1];
  const admin = state.accounts[2];
  assert.equal(canManageCourseFinance(state, treasury), true);
  assert.equal(canManageCourseFinance(state, normal), false);
  assert.equal(canManageCourseFinance(state, admin), true);
  assert.equal(normalizedPaymentStatus({ paymentStatus: "validated" }, 10), "validated");
  assert.equal(normalizedPaymentStatus({}, 10), "pending");
  assert.equal(normalizedPaymentStatus({}, 0), "not-required");
}

{
  const state = seedState();
  const snapshot = buildCourseFinanceSnapshot(state);
  assert.equal(snapshot.summary.pending, 2);
  assert.equal(snapshot.summary.noPaymentRequired, 1);
  const rows = snapshot.courses[0].rows;
  assert.equal(rows.find((row) => row.submissionId === "submission-member").participantType, "member");
  assert.equal(rows.find((row) => row.submissionId === "submission-external").participantType, "external");
  assert.equal(rows.find((row) => row.submissionId === "submission-member").hasPaymentProof, true);
  assert.equal(rows.find((row) => row.submissionId === "submission-member").paymentProof.contentBase64, undefined);
}

{
  const state = seedState();
  validateInstructorAssociateUpdate(state, "associate-normal", { treasuryEnabled: true, firstName: "", lastName: "" });
  assert.equal(state.associates.find((item) => item.id === "associate-normal").treasuryEnabled, true);
  assert.throws(
    () => validateInstructorAssociateUpdate(state, "associate-normal", { treasuryEnabled: "yes", firstName: "", lastName: "" }),
    /tesoreria/
  );
}

{
  let state = seedState();
  let currentAccount = state.accounts[0];
  let response = null;
  const deps = {
    readState: () => state,
    writeState: (next) => { state = next; },
    requireAuthenticatedAccount: () => currentAccount,
    readJsonBody: async (req) => req.body || {},
    payloadLimit: 16 * 1024,
    sendJson: (_res, status, payload) => { response = { status, payload }; },
    sendJsonError: (_res, error, fallback) => { response = { status: error.statusCode || 400, payload: { ok: false, error: error.message || fallback } }; }
  };
  const handler = createCourseFinanceHandler(deps);

  await handler({ method: "GET" }, {}, new URL("http://test/api/course-finance"));
  assert.equal(response.status, 200);
  assert.equal(response.payload.summary.pending, 2);

  response = null;
  await handler(
    { method: "PATCH", body: { paymentStatus: "validated" } },
    {},
    new URL("http://test/api/course-finance/courses/course-finance-qa/submissions/submission-member")
  );
  assert.equal(response.status, 200);
  assert.equal(response.payload.row.paymentStatus, "validated");
  assert.equal(response.payload.row.paymentValidatedBy, "Tesoreria QA");
  assert.equal(state.courses[0].enrollmentSubmissions[0].status, "confirmed");
  assert.equal(state.activityLog.length, 1);

  response = null;
  await handler(
    { method: "PATCH", body: { paymentStatus: "incident", note: "Importe no coincide" } },
    {},
    new URL("http://test/api/course-finance/courses/course-finance-qa/submissions/submission-external")
  );
  assert.equal(response.status, 200);
  assert.equal(response.payload.row.paymentStatus, "incident");
  assert.equal(response.payload.row.paymentIncidentNote, "Importe no coincide");

  currentAccount = state.accounts[1];
  response = null;
  await handler({ method: "GET" }, {}, new URL("http://test/api/course-finance"));
  assert.equal(response.status, 403);

  currentAccount = state.accounts[2];
  response = null;
  await handler({ method: "GET" }, {}, new URL("http://test/api/course-finance"));
  assert.equal(response.status, 200);
}

console.log("Course finance V1.1: permisos, estados, justificantes y validacion OK.");
