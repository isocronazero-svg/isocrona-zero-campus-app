import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const {
  MAX_AUDIT_EVENTS,
  appendAuditEvent,
  combinedAuditEvents,
  createAuditLogHandler,
  listAuditEvents,
  sanitizeAuditValue
} = require("../server/audit-log.js");

{
  const sanitized = sanitizeAuditValue({
    password: "secret",
    nested: { contentBase64: "AAAA", token: "abc", safe: "visible" },
    note: "ok"
  });
  assert.equal(sanitized.password, "[redacted]");
  assert.equal(sanitized.nested.contentBase64, "[redacted]");
  assert.equal(sanitized.nested.token, "[redacted]");
  assert.equal(sanitized.nested.safe, "visible");
}

{
  const state = { auditLog: [], activityLog: [] };
  appendAuditEvent(state, {
    account: { id: "admin-1", memberId: "member-1", name: "Admin QA", role: "admin" },
    module: "course-finance",
    entityType: "course-payment",
    entityId: "payment-1",
    entityLabel: "Persona QA · Curso QA",
    action: "validate-payment",
    before: { paymentStatus: "pending", contentBase64: "AAAA" },
    after: { paymentStatus: "validated" },
    metadata: { courseId: "course-1" }
  });
  appendAuditEvent(state, {
    account: { id: "admin-2", name: "Otra persona", role: "admin" },
    module: "courses",
    entityType: "course-reservation",
    entityId: "reservation-1",
    entityLabel: "Reserva QA",
    action: "create-reservation",
    metadata: { courseId: "course-2" }
  });
  state.activityLog.push({
    id: "activity-old",
    at: "2026-01-01T10:00:00.000Z",
    actor: "Secretaria QA",
    type: "admin",
    message: "Actualiza ficha de socio QA"
  });
  assert.equal(state.auditLog.length, 2);
  assert.equal(state.auditLog[1].before.contentBase64, "[redacted]");
  assert.equal(combinedAuditEvents(state).length, 3);
  assert.equal(listAuditEvents(state, { user: "Admin QA" }).length, 1);
  assert.equal(listAuditEvents(state, { user: "Secretaria QA" }).length, 1);
  assert.equal(listAuditEvents(state, { module: "course-finance" }).length, 1);
  assert.equal(listAuditEvents(state, { module: "activity" }).length, 1);
  assert.equal(listAuditEvents(state, { action: "create-reservation" }).length, 1);
  assert.equal(listAuditEvents(state, { courseId: "course-1" }).length, 1);
  assert.equal(listAuditEvents(state, { entity: "Reserva" }).length, 1);
}

{
  const now = new Date().toISOString();
  const state = {
    auditLog: [],
    activityLog: [{ id: "activity-near", at: now, actor: "Admin QA", type: "admin", message: "Reserva plaza" }]
  };
  appendAuditEvent(state, {
    at: now,
    account: { id: "admin-1", name: "Admin QA", role: "admin" },
    module: "courses",
    entityType: "course-reservation",
    entityId: "reservation-1",
    entityLabel: "Persona QA · Curso QA",
    action: "create-reservation"
  });
  assert.equal(combinedAuditEvents(state).length, 1, "No debe duplicar el activityLog de la misma acción estructurada");
}

{
  const state = { auditLog: [] };
  for (let index = 0; index < MAX_AUDIT_EVENTS + 15; index += 1) {
    appendAuditEvent(state, { actor: { name: "Sistema" }, action: "test", entityId: `item-${index}` });
  }
  assert.equal(state.auditLog.length, MAX_AUDIT_EVENTS);
  assert.equal(state.auditLog[0].entityId, `item-${MAX_AUDIT_EVENTS + 14}`);
}

{
  const state = { auditLog: [], activityLog: [] };
  appendAuditEvent(state, {
    account: { id: "admin-1", name: "Admin QA", role: "admin" },
    module: "courses",
    entityType: "course",
    entityId: "course-1",
    entityLabel: "Curso QA",
    action: "update-course"
  });
  let currentAccount = { id: "member-1", name: "Socio QA", role: "member" };
  let response = null;
  const handler = createAuditLogHandler({
    readState: () => state,
    requireAuthenticatedAccount: () => currentAccount,
    sendJson: (_res, status, payload) => { response = { status, payload }; }
  });

  await handler({ method: "GET" }, {}, new URL("http://test/api/audit-log"));
  assert.equal(response.status, 403);

  currentAccount = { id: "admin-1", name: "Admin QA", role: "admin" };
  response = null;
  await handler({ method: "GET" }, {}, new URL("http://test/api/audit-log?module=courses"));
  assert.equal(response.status, 200);
  assert.equal(response.payload.events.length, 1);

  response = null;
  await handler({ method: "PATCH" }, {}, new URL("http://test/api/audit-log"));
  assert.equal(response.status, 405);
}

console.log("Audit log V1.1: redaccion, compatibilidad, filtros, permisos y retencion OK.");
