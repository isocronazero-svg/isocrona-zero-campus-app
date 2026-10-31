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

const forbiddenKeys = new Set(["password", "passwordHash", "password_hash", "temporaryPassword"]);
function walk(value, path = "seed") {
  if (Array.isArray(value)) {
    value.forEach((item, index) => walk(item, `${path}[${index}]`));
    return;
  }
  if (!value || typeof value !== "object") return;
  for (const [key, child] of Object.entries(value)) {
    if (forbiddenKeys.has(key) || /token|secret|api.?key|credential/i.test(key) || /email$/i.test(key)) {
      assert.ok(!String(child || ""), `No debe existir secreto en ${path}.${key}`);
    }
    walk(child, `${path}.${key}`);
  }
}
walk(seed);

assert.doesNotMatch(raw, /@isocronazero\.org/i, "El seed QA no debe incluir correos del dominio real");
assert.doesNotMatch(raw, /[^\s"]+@[^\s"]+/, "El seed QA no debe contener emails");
assert.doesNotMatch(raw, /campus123|bomberos123/i, "El seed QA no debe incluir credenciales demo históricas");
assert.equal(seed.settings?.automation?.autoSendDiplomas, false, "QA no debe autoenviar diplomas");
assert.equal(seed.settings?.associates?.autoSendWelcomeEmail, false, "QA no debe autoenviar bienvenidas");
assert.equal(seed.settings?.agent?.enabled, false, "El agente debe estar desactivado en el seed QA");

const envExample = readFileSync(new URL("../.env.qa.example", import.meta.url), "utf8");
assert.match(envExample, /^NODE_ENV=production$/m, "La plantilla QA debe probar el modo productivo seguro");
assert.match(envExample, /^IZ_DEFAULT_STATE_PATH=\/app\/data\/qa-private-seed\.json$/m);
assert.match(envExample, /^IZ_EMAIL_ENABLED=false$/m);
assert.match(envExample, /^IZ_BOOTSTRAP_ADMIN_PASSWORD=$/m, "La plantilla nunca debe contener una contraseña bootstrap");
assert.doesNotMatch(envExample, /campus123|bomberos123/i, "La plantilla no debe reutilizar credenciales demo");

const gitignore = readFileSync(new URL("../.gitignore", import.meta.url), "utf8");
assert.match(gitignore, /^\.env\.qa$/m, ".env.qa debe permanecer fuera de Git");
assert.match(gitignore, /^\.env\.qa\.private$/m, "Los secretos QA privados deben permanecer fuera de Git");
assert.match(gitignore, /^data\/qa-private-runtime\.json$/m, "El estado QA privado local debe permanecer fuera de Git");

console.log("QA private seed/security check passed: sin cuentas, credenciales ni datos personales presembrados.");
