import assert from "node:assert/strict";
import {
  contextStorageKey,
  normalizeAdminIdentity,
  rewriteAdminStatePayload,
  sanitizeAdminStateWrite
} from "../public/assets/js/app/admin/adminContextEnhancer.js";

const members = [
  { id: "member-admin-a", name: "Admin A" },
  { id: "member-admin-b", name: "Admin B" },
  { id: "member-socio-1", name: "Socio Uno" },
  { id: "member-socio-2", name: "Socio Dos" }
];

const adminA = normalizeAdminIdentity({
  role: "admin",
  accountId: "account-admin-a",
  memberId: "member-admin-a",
  name: "Admin A"
});
const adminB = normalizeAdminIdentity({
  role: "admin",
  accountId: "account-admin-b",
  memberId: "member-admin-b",
  name: "Admin B"
});

assert.ok(adminA);
assert.ok(adminB);
assert.notEqual(contextStorageKey(adminA.accountId), contextStorageKey(adminB.accountId),
  "Cada administrador debe tener una clave de contexto independiente");

const sharedServerState = {
  role: "admin",
  selectedMemberId: "member-socio-2",
  members
};

const viewA = rewriteAdminStatePayload(sharedServerState, adminA, "member-socio-1");
const viewB = rewriteAdminStatePayload(sharedServerState, adminB, "member-socio-2");
assert.equal(viewA.selectedMemberId, "member-socio-1");
assert.equal(viewB.selectedMemberId, "member-socio-2");
assert.equal(sharedServerState.selectedMemberId, "member-socio-2",
  "Reescribir el contexto del navegador no debe mutar el estado compartido del servidor");

const freshLoginA = rewriteAdminStatePayload(sharedServerState, adminA, "");
const freshLoginB = rewriteAdminStatePayload(sharedServerState, adminB, "");
assert.equal(freshLoginA.selectedMemberId, "member-admin-a",
  "Un login nuevo de Admin A debe empezar en su propio perfil");
assert.equal(freshLoginB.selectedMemberId, "member-admin-b",
  "Un login nuevo de Admin B debe empezar en su propio perfil");

const invalidStored = rewriteAdminStatePayload(sharedServerState, adminA, "member-no-existe");
assert.equal(invalidStored.selectedMemberId, "member-admin-a",
  "Un contexto guardado obsoleto debe caer al perfil propio");

const outgoing = {
  ...sharedServerState,
  selectedMemberId: "member-socio-1",
  selectedCourseId: "course-qa"
};
const sanitized = sanitizeAdminStateWrite(outgoing, adminA);
assert.equal(sanitized.selectedMemberId, null,
  "El perfil de trabajo no debe persistirse como selección global");
assert.equal(sanitized.selectedCourseId, "course-qa",
  "Sanear el contexto no debe borrar el resto del estado");
assert.equal(outgoing.selectedMemberId, "member-socio-1",
  "El saneado no debe mutar el objeto original del cliente");

assert.equal(normalizeAdminIdentity({ role: "member", accountId: "member", memberId: "member" }), null);

console.log("V1.1 admin context isolation: two simultaneous administrators OK.");
