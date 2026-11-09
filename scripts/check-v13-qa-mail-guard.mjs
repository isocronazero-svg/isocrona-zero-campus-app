import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { getMailSettings, createMailSender } = require("../server/mail-delivery.js");

const smtp = getMailSettings({ settings: { smtp: { host: "smtp.example.invalid", fromEmail: "qa@example.invalid" } } }, { IZ_QA_ISOLATED: "true", IZ_EMAIL_PROVIDER: "smtp" });
assert.equal(smtp.enabled, false);
const resend = getMailSettings({}, { IZ_QA_ISOLATED: "true", IZ_EMAIL_PROVIDER: "resend", IZ_EMAIL_ENABLED: "true", RESEND_API_KEY: "fake", IZ_EMAIL_FROM: "qa@example.invalid" });
assert.equal(resend.enabled, false);
let called = false;
const sender = createMailSender({ smtpSend: async () => { called = true; }, fetchImpl: async () => { called = true; } });
const old = process.env.IZ_QA_ISOLATED;
try {
  process.env.IZ_QA_ISOLATED = "true";
  for (const config of [smtp, resend]) {
    for (const testOnly of [false, true]) {
      await assert.rejects(sender(config, { to: "recipient@example.invalid", subject: "QA" }, { testOnly }), /pausa/);
    }
  }
  assert.equal(called, false);
} finally {
  if (old === undefined) delete process.env.IZ_QA_ISOLATED;
  else process.env.IZ_QA_ISOLATED = old;
}
console.log("QA aislado: envíos SMTP, Resend y pruebas de correo bloqueados");
