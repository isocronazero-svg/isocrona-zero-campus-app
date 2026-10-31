import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";

const require = createRequire(import.meta.url);
const {
  buildAccountingLedger,
  createBoardV11Handler,
  proofRequestNotificationId,
  upsertProofRequestNotification,
  validWhatsappUrl
} = require("../server/board-v11.js");
const {
  applyNewAssociateMembershipFeeYears,
  membershipFeeYearForDate
} = require("../server/onboarding-state.js");

assert.equal(membershipFeeYearForDate("2026-09-30T12:00:00Z"), 2026);
assert.equal(membershipFeeYearForDate("2026-09-30T21:59:59Z"), 2026, "Antes de medianoche de Madrid sigue siendo septiembre");
assert.equal(membershipFeeYearForDate("2026-09-30T22:00:00Z"), 2027, "A medianoche del 1 de octubre en Madrid ya corresponde al año siguiente");
assert.equal(membershipFeeYearForDate("2026-10-01T12:00:00Z"), 2027);
assert.equal(membershipFeeYearForDate("2026-11-15T12:00:00Z"), 2027);
assert.equal(membershipFeeYearForDate("2026-12-31T12:00:00Z"), 2027);
assert.equal(membershipFeeYearForDate("2026-12-31T22:59:59Z"), 2027, "Hasta final de año en Madrid la cuota sigue cubriendo el año siguiente");
assert.equal(membershipFeeYearForDate("2026-12-31T23:00:00Z"), 2027, "Al comenzar 2027 en Madrid la cuota corresponde al año natural 2027");
assert.equal(membershipFeeYearForDate("2027-01-01T12:00:00Z"), 2027);

{
  const state = {
    associates: [
      { id: "old", joinedAt: "2026-11-01T10:00:00Z", membershipFeeYear: 2026 },
      { id: "new-oct", joinedAt: "2026-10-01T10:00:00Z" },
      { id: "new-nov", joinedAt: "2026-11-15T10:00:00Z" },
      { id: "new-dec", joinedAt: "2026-12-20T10:00:00Z" },
      { id: "new-sep", joinedAt: "2026-09-30T10:00:00Z" }
    ]
  };
  applyNewAssociateMembershipFeeYears(state, { allAssociateIds: new Set(["old"]) });
  assert.equal(state.associates[0].membershipFeeYear, 2026, "No cambia socios ya existentes");
  assert.equal(state.associates[1].membershipFeeYear, 2027);
  assert.equal(state.associates[2].membershipFeeYear, 2027);
  assert.equal(state.associates[3].membershipFeeYear, 2027);
  assert.equal(state.associates[4].membershipFeeYear, 2026);
  assert.equal(state.associates[1].membershipFeeYearSource, "automatic-new-associate");
}

assert.match(validWhatsappUrl("https://chat.whatsapp.com/AbCdEf"), /^https:\/\/chat\.whatsapp\.com\//);
assert.match(validWhatsappUrl("https://wa.me/34123456789"), /^https:\/\/wa\.me\//);
assert.throws(() => validWhatsappUrl("https://example.com/whatsapp"), /WhatsApp/);

{
  const state = { memberNotifications: [] };
  const course = { id: "curso-qa", title: "Curso QA" };
  const submission = { id: "sub-qa", memberId: "member-qa" };
  const member = { id: "member-qa", name: "Socio QA" };
  const account = { id: "admin-qa", memberId: "admin-member", name: "Admin QA", role: "admin" };
  const first = upsertProofRequestNotification(state, account, course, submission, member, "Adjunta el PDF completo");
  assert.equal(state.memberNotifications.length, 1);
  assert.equal(first.id, proofRequestNotificationId(course.id, submission.id));
  assert.equal(first.priority, "important");
  assert.match(first.body, /Adjunta el PDF completo/);
  first.readByMemberIds = [member.id];
  upsertProofRequestNotification(state, account, course, submission, member, "Segundo aviso");
  assert.equal(state.memberNotifications.length, 1, "Repetir solicitud actualiza el aviso en vez de duplicarlo");
  assert.deepEqual(state.memberNotifications[0].readByMemberIds, [], "Una nueva solicitud vuelve a quedar sin leer");
}

{
  const state = {
    associates: [{
      id: "associate-1", firstName: "Ana", lastName: "Socio", linkedMemberId: "member-1",
      payments: [{ id: "quota-1", date: "2026-10-10", year: "2027", amount: 50, method: "Transferencia", note: "Cuota 2027" }]
    }],
    members: [{ id: "member-1", associateId: "associate-1", name: "Ana Socio" }, { id: "member-2", name: "Externo QA" }],
    courses: [{
      id: "course-1", title: "Curso técnico", startDate: "2026-11-10", enrollmentSubmissions: [
        { id: "validated", memberId: "member-1", amount: 25, method: "Bizum", paymentStatus: "validated", paymentValidatedBy: "Jordi", paymentValidatedAt: "2026-11-01T10:00:00Z" },
        { id: "pending", memberId: "member-2", amount: 30, paymentStatus: "pending" }
      ]
    }, {
      id: "journey-1", title: "Jornada rescate vertical", startDate: "2026-12-01", journeyTypeId: "vertical", journeyTypeLabel: "Rescate vertical", enrollmentSubmissions: [
        { id: "journey-pay", memberId: "member-2", amount: 20, method: "Transferencia", paymentStatus: "validated", paymentValidatedBy: "Jordi", paymentValidatedAt: "2026-11-20T10:00:00Z" }
      ]
    }]
  };
  const ledger = buildAccountingLedger(state);
  assert.equal(ledger.entries.length, 3, "Solo cuotas registradas y pagos de formación validados pasan al libro");
  assert.equal(ledger.summary.total, 95);
  assert.equal(ledger.summary.byCategory.cuota, 50);
  assert.equal(ledger.summary.byCategory.curso, 25);
  assert.equal(ledger.summary.byCategory.jornada, 20);
  assert.ok(!ledger.entries.some((entry) => entry.sourceId === "pending"));
  assert.equal(ledger.entries.find((entry) => entry.category === "cuota")?.exerciseYear, "2027", "La cuota de alta de octubre-diciembre se imputa al ejercicio siguiente");
}

{
  const state = {
    members: [{ id: "member-qa", name: "Socio QA" }],
    associates: [],
    courses: [{ id: "course-qa", title: "Curso QA", enrollmentSubmissions: [{ id: "sub-qa", memberId: "member-qa", amount: 25, paymentStatus: "pending" }] }],
    memberNotifications: [],
    activityLog: [], auditLog: [], settings: { associates: {} }
  };
  let written = false;
  let response = null;
  const handler = createBoardV11Handler({
    readState: () => state,
    writeState: () => { written = true; },
    requireAuthenticatedAccount: () => ({ id: "admin", memberId: "admin-member", name: "Admin QA", role: "admin" }),
    readJsonBody: async () => ({ note: "Falta justificante" }),
    sendJson: (_res, status, payload) => { response = { status, payload }; },
    sendJsonError: (_res, error) => { throw error; }
  });
  await handler({ method: "POST" }, {}, new URL("http://test/api/v1.1/course-finance/courses/course-qa/submissions/sub-qa/request-proof"));
  assert.equal(response.status, 200);
  assert.equal(written, true);
  assert.equal(state.memberNotifications.length, 1);
  assert.equal(state.courses[0].enrollmentSubmissions[0].proofRequestedBy, "Admin QA");
}

const mainSource = readFileSync(new URL("../public/assets/js/app/main.js", import.meta.url), "utf8");
const contextSource = readFileSync(new URL("../public/assets/js/app/admin/adminContextEnhancer.js", import.meta.url), "utf8");
const boardSource = readFileSync(new URL("../public/assets/js/app/admin/boardEnhancer.js", import.meta.url), "utf8");
const feeYearSource = readFileSync(new URL("../public/assets/js/app/admin/membershipFeeYearEnhancer.js", import.meta.url), "utf8");
assert.match(mainSource, /installAdminContextEnhancer\(\)/);
assert.match(mainSource, /installBoardEnhancer\(\)/);
assert.match(contextSource, /selectedMemberId:\s*null/, "La selección de persona no debe persistir en el estado global");
assert.match(contextSource, /Trabajando como:/);
assert.match(contextSource, /Estás gestionando a:/);
assert.match(boardSource, /Solicitar justificante/);
assert.match(boardSource, /Revisión online/);
assert.match(boardSource, /Libro interno de ingresos validados/);
assert.match(boardSource, /Unirme al canal de WhatsApp/);
assert.match(feeYearSource, /Tu alta está activa desde ahora/);
assert.match(feeYearSource, /incluidos por Isócrona Zero sin coste adicional/);
assert.match(feeYearSource, /puedes participar con normalidad en las actividades para socios/);

console.log("V1.1 junta: identidad admin, justificantes, cuotas, ingresos, bonificación octubre-diciembre y WhatsApp OK.");
