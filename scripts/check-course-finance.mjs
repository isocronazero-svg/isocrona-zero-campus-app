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
const { upsertProofRequestNotification, buildAccountingLedger } = require("../server/board-v11.js");

function seedState() {
  return {
    activityLog: [],
    auditLog: [],
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
  // Every administrator has the same finance permissions, independently of
  // whether they are assigned as the primary treasurer.
  for (let index = 1; index <= 5; index += 1) {
    const backupAdmin = { id: `account-admin-${index}`, name: `Administrador ${index}`, role: "admin" };
    assert.equal(canManageCourseFinance(state, backupAdmin), true);
  }
  assert.equal(canManageCourseFinance(state, { id: "unassigned", role: "member" }), false);
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
  const course = state.courses[0];
  const submission = course.enrollmentSubmissions[0];
  const notice = upsertProofRequestNotification(state, currentAccount, course, submission, state.members[1]);

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
  assert.equal(state.auditLog.length, 1);
  assert.equal(state.auditLog[0].action, "validate-payment");
  assert.equal(state.auditLog[0].actor.name, "Tesoreria QA");
  assert.equal(state.auditLog[0].before.paymentStatus, "pending");
  assert.equal(state.auditLog[0].after.paymentStatus, "validated");
  assert.ok(notice.resolvedAt, "Validar el pago resuelve el aviso sin borrar su trazabilidad");
  assert.ok(notice.readByMemberIds.includes(submission.memberId));
  assert.equal(buildAccountingLedger(state).entries.filter(row => row.sourceId === submission.id).length, 1);
  upsertProofRequestNotification(state, currentAccount, course, submission, state.members[1], "Nueva revision");
  assert.equal(notice.resolvedAt, "", "Una nueva solicitud reabre el mismo aviso");
  assert.equal(state.memberNotifications.length, 1);

  response = null;
  await handler(
    { method: "PATCH", body: { paymentStatus: "incident", note: "Importe no coincide" } },
    {},
    new URL("http://test/api/course-finance/courses/course-finance-qa/submissions/submission-external")
  );
  assert.equal(response.status, 200);
  assert.equal(response.payload.row.paymentStatus, "incident");
  assert.equal(response.payload.row.paymentIncidentNote, "Importe no coincide");
  assert.equal(state.auditLog.length, 2);
  assert.equal(state.auditLog[0].action, "mark-payment-incident");

  currentAccount = state.accounts[1];
  response = null;
  await handler({ method: "GET" }, {}, new URL("http://test/api/course-finance"));
  assert.equal(response.status, 403);

  currentAccount = state.accounts[2];
  response = null;
  await handler({ method: "GET" }, {}, new URL("http://test/api/course-finance"));
  assert.equal(response.status, 200);
  // A second administrator can take over payment validation and is recorded
  // as the actor, without changing the original treasurer's permissions.
  currentAccount = { id: "account-admin-backup", name: "Administrador suplente", role: "admin" };
  response = null;
  await handler(
    { method: "PATCH", body: { paymentStatus: "validated" } },
    {},
    new URL("http://test/api/course-finance/courses/course-finance-qa/submissions/submission-external")
  );
  assert.equal(response.status, 200);
  assert.equal(response.payload.row.paymentValidatedBy, "Administrador suplente");
  assert.equal(state.auditLog[0].actor.name, "Administrador suplente");
  assert.equal(state.auditLog[0].action, "validate-payment");
}

// Synthetic proof errors must remain distinct from authorization failures.
{
  const state = seedState();
  let account = state.accounts[0];
  const handler = createCourseFinanceHandler({
    readState: () => state,
    requireAuthenticatedAccount: () => account,
    sendJson: (res, status, payload) => { res.status = status; res.payload = payload; }
  });
  const endpoint = (id) => new URL(`http://test/api/course-finance/courses/course-finance-qa/submissions/${id}/proof`);
  function mockResponse() {
    return {
      status: null,
      headers: {},
      payload: null,
      writeHead(status, headers) { this.status = status; this.headers = headers; },
      end(body) { this.payload = body; }
    };
  }
  const missing = mockResponse();
  await handler({ method: "GET" }, missing, endpoint("submission-external"));
  assert.equal(missing.status, 404);
  assert.equal(JSON.parse(missing.payload).code, "NO_ATTACHED");

  const invalid = mockResponse();
  await handler({ method: "GET" }, invalid, endpoint("submission-member"));
  assert.equal(invalid.status, 422);
  assert.equal(JSON.parse(invalid.payload).code, "INVALID_FILE");
  assert.equal(invalid.headers["Cache-Control"], "private, no-store");

  account = state.accounts[1];
  const forbidden = mockResponse();
  await handler({ method: "GET" }, forbidden, endpoint("submission-external"));
  assert.equal(forbidden.status, 403);
  assert.equal(forbidden.payload.error, "No tienes permiso de tesoreria");
  assert.equal(forbidden.payload.code, undefined);
}

console.log("Course finance V1.1: permisos, estados, justificantes, validacion y auditoria OK.");
