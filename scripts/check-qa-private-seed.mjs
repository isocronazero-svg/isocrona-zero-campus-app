import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const seedUrl = new URL("../data/qa-private-seed.json", import.meta.url);
const raw = readFileSync(seedUrl, "utf8");
const seed = JSON.parse(raw);

assert.ok(Array.isArray(seed.accounts), "El seed QA debe declarar accounts");
assert.equal(seed.accounts.length, 0, "El seed QA no debe contener cuentas precreadas");
assert.ok(Array.isArray(seed.members), "El seed QA debe declarar members");
assert.equal(seed.members.length, 0, "El seed QA no debe contener socios precreados");
assert.ok(Array.isArray(seed.associates), "El seed QA debe declarar associates");
assert.equal(seed.associates.length, 0, "El seed QA no debe contener censo real o demo");
assert.ok(Array.isArray(seed.associateApplications), "El seed QA debe declarar associateApplications");
assert.equal(seed.associateApplications.length, 0, "El seed QA no debe contener solicitudes precreadas");

const forbiddenKeys = new Set(["password", "passwordHash", "temporaryPassword"]);
function walk(value, path = "seed") {
  if (Array.isArray(value)) {
    value.forEach((item, index) => walk(item, `${path}[${index}]`));
    return;
  }
  if (!value || typeof value !== "object") return;
  for (const [key, child] of Object.entries(value)) {
    if (forbiddenKeys.has(key)) {
      assert.equal(String(child || ""), "", `No debe existir secreto en ${path}.${key}`);
    }
    walk(child, `${path}.${key}`);
  }
}
walk(seed);

assert.doesNotMatch(raw, /@isocronazero\.org/i, "El seed QA no debe incluir correos del dominio real");
assert.doesNotMatch(raw, /campus123|bomberos123/i, "El seed QA no debe incluir credenciales demo históricas");
assert.equal(seed.settings?.automation?.autoSendDiplomas, false, "QA no debe autoenviar diplomas");
assert.equal(seed.settings?.associates?.autoSendWelcomeEmail, false, "QA no debe autoenviar bienvenidas");
assert.equal(seed.settings?.agent?.enabled, false, "El agente debe estar desactivado en el seed QA");

console.log("QA private seed check passed: sin cuentas, credenciales ni datos personales presembrados.");
