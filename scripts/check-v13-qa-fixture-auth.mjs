import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const fixture = require("../data/default-state.json");
const { canAuthenticateAccount } = require("../server/fixture-account-policy.js");
const old = process.env.IZ_QA_ISOLATED;
try {
  process.env.IZ_QA_ISOLATED = "true";
  for (const account of fixture.accounts || []) {
    assert.equal(canAuthenticateAccount(account), false, "Fixture account must be blocked in isolated QA");
    assert.equal(canAuthenticateAccount({ email: "qa-ficticio@example.invalid", password: account.password }), false, "Fixture password must be blocked even with changed email");
  }
  assert.equal(canAuthenticateAccount({ email: "qa-ficticio@example.invalid", password: "different-qa-only-password" }), true);
} finally {
  if (old === undefined) delete process.env.IZ_QA_ISOLATED;
  else process.env.IZ_QA_ISOLATED = old;
}
console.log("QA aislado: credenciales demo bloqueadas");
