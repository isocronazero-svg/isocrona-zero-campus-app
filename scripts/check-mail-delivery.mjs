import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { mkdtempSync, writeFileSync, mkdirSync, rmSync } from "node:fs";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { setTimeout as delay } from "node:timers/promises";

const { getMailSettings, getMailDeliveryStatus, isMailReady, createMailSender } = createRequire(import.meta.url)("../server/mail-delivery.js");
const env = {
  IZ_EMAIL_PROVIDER: "resend", RESEND_API_KEY: "re_qa_fake_only",
  IZ_EMAIL_FROM: "campus@example.test", IZ_EMAIL_FROM_NAME: "Campus QA",
  IZ_EMAIL_REPLY_TO: "replies@example.test", IZ_EMAIL_TEST_TO: "test@example.test"
};
const state = { settings: { smtp: { host: "smtp.example.test", port: 465, fromEmail: "legacy@example.test", password: "legacy_secret" } } };
const message = { to: "pupil@example.test", subject: "Diploma QA", text: "Enlace de prueba", deliveryId: "outbox-qa-1" };
const config = getMailSettings(state, env);
assert.equal(isMailReady(config), false, "Resend starts paused even when credentials exist");
assert.equal(isMailReady(getMailSettings(state, { ...env, RESEND_API_KEY: "", IZ_EMAIL_ENABLED: "true" })), false);
assert.equal(isMailReady(getMailSettings(state, { IZ_EMAIL_PROVIDER: "typo" })), false, "Never fall back to SMTP for a mistyped provider");
assert.equal(isMailReady(getMailSettings(state, {})), true, "Legacy SMTP still works without new variables");
const safeStatus = getMailDeliveryStatus(state, env);
assert.equal(safeStatus.configured, true);
assert.equal(safeStatus.enabled, false);
assert.equal(JSON.stringify(safeStatus).includes(env.RESEND_API_KEY), false);
assert.equal(JSON.stringify(safeStatus).includes("legacy_secret"), false);

const requests = [];
let boundary = false;
const sender = createMailSender({
  fetchImpl: async (url, options) => {
    assert.equal(boundary, true, "Academic revalidation runs immediately before the request");
    requests.push({ url, options });
    return { ok: true, json: async () => ({ id: "qa-provider-id" }) };
  },
  smtpSend: async () => { throw new Error("Resend must not attempt an SMTP connection"); }
});
await assert.rejects(sender(config, message), /pausa/);
assert.equal(requests.length, 0);
boundary = true;
await sender(config, { ...message, deliveryId: undefined }, { testOnly: true });
assert.equal(requests.length, 1, "Only the explicit admin test may bypass pause");
const enabled = getMailSettings(state, { ...env, IZ_EMAIL_ENABLED: "true" });
boundary = false;
const result = await sender(enabled, { ...message, beforeData() { boundary = true; } });
assert.equal(result.messageId, "qa-provider-id");
const request = requests.at(-1);
assert.equal(request.url, "https://api.resend.com/emails");
assert.equal(request.options.redirect, "error", "Never redirect the bearer credential");
assert.equal(request.options.headers.Authorization, `Bearer ${env.RESEND_API_KEY}`);
assert.deepEqual(JSON.parse(request.options.body), {
  from: "Campus QA <campus@example.test>", to: [message.to], subject: message.subject,
  text: message.text, reply_to: env.IZ_EMAIL_REPLY_TO
});
await sender(enabled, message);
assert.equal(requests.at(-1).options.headers["Idempotency-Key"], request.options.headers["Idempotency-Key"], "Retries retain the key");
await sender(enabled, { ...message, deliveryId: "explicit-new-delivery" });
assert.notEqual(requests.at(-1).options.headers["Idempotency-Key"], request.options.headers["Idempotency-Key"], "An intentional new delivery has its own key");
const beforeBlock = requests.length;
await assert.rejects(sender(enabled, { ...message, beforeData() { throw new Error("Alumno ya no apto"); } }), /ya no apto/);
assert.equal(requests.length, beforeBlock, "A corrected academic result prevents transmission");

for (const status of [401, 403, 409, 422, 429, 500]) {
  const fail = createMailSender({ fetchImpl: async () => ({ ok: false, status, json: async () => ({ message: env.RESEND_API_KEY }) }) });
  await assert.rejects(fail(enabled, message), error => error.message.includes(`HTTP ${status}`) && !error.message.includes(env.RESEND_API_KEY));
}
for (const fetchImpl of [
  async () => { throw new Error(`Network error containing ${env.RESEND_API_KEY}`); },
  async () => ({ ok: true, json: async () => ({}) }),
  async () => ({ ok: true, json: async () => { throw new Error("invalid JSON"); } })
]) {
  await assert.rejects(createMailSender({ fetchImpl })(enabled, message), error => !error.message.includes(env.RESEND_API_KEY));
}
let smtpCalls = 0;
const smtpSender = createMailSender({ smtpSend: async (_config, mail) => { smtpCalls++; mail.beforeData(); return { messageId: "smtp-qa" }; } });
await smtpSender(getMailSettings(state, {}), { ...message, beforeData() {} });
assert.equal(smtpCalls, 1);

const source = readFileSync(new URL("../public/app.js", import.meta.url), "utf8");
const functionSource = source.slice(source.indexOf("async function invokeServerAction("), source.indexOf("function setFormSaveStatus("));
let toast;
const context = vm.createContext({
  syncStatus: "", render() {}, applySessionToState() {}, syncAssociateSelectionTargets() {}, refreshState: async () => {},
  fetch: async () => ({ ok: true, json: async () => ({ ok: true, sentCount: 0, failedCount: 1, message: "Resend HTTP 403" }) }),
  showToast: (message, type) => { toast = { message, type }; }
});
vm.runInContext(functionSource, context);
assert.equal(await context.invokeServerAction("/qa", "Listo"), false);
assert.equal(toast.type, "error", "A failed batch must not show a green success toast");
console.log("Mail delivery checks passed (paused, Resend, reply-to, retries, safe failures, academic boundary, legacy SMTP and UI).");

// Run the actual HTTP routes with a fake provider and ALL outbound connections blocked.
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const temp = mkdtempSync(path.join(os.tmpdir(), "iz-mail-check-"));
const seedPath = path.join(temp, "default-state.json");
const dataDir = path.join(temp, "data");
const requestLog = path.join(temp, "requests.jsonl");
const preload = path.join(temp, "fake-provider.cjs");
const adminPassword = randomUUID(), memberPassword = randomUUID();
const seed = JSON.parse(readFileSync(path.join(root, "data/default-state.json"), "utf8"));
seed.accounts.forEach(account => { account.password = account.role === "admin" ? adminPassword : memberPassword; account.passwordHash = ""; });
seed.emailOutbox = [];
seed.settings.smtp = {};
seed.settings.automation = { autoRunOnSave: false, autoGenerateDiplomas: false, autoSendDiplomas: false,
  autoPromoteWaitlist: false, autoAdvanceCourseStatus: false, autoSendFeeReminders: false, autoSendFeedbackReminders: false };
seed.settings.agent.enabled = false;
seed.members.find(member => member.id === "member-1").dni = "12345678A";
const course = seed.courses.find(course => course.id === "course-1");
Object.assign(course, { status: "Cerrado", startDate: "2020-01-01", endDate: "2020-01-02", modules: [], resources: [],
  enrolledIds: ["member-1"], waitingIds: [], attendance: { "member-1": 100 }, evaluations: { "member-1": "Apto" },
  diplomaReady: ["member-1"], feedbackEnabled: false, feedbackRequiredForDiploma: false });
mkdirSync(dataDir);
writeFileSync(seedPath, JSON.stringify(seed));
writeFileSync(requestLog, "");
writeFileSync(preload, `
  const fs = require('node:fs');
  for (const module of ['node:net', 'node:tls']) require(module).connect = () => { throw new Error('Outbound connections blocked in QA'); };
  global.fetch = async (url, options) => {
    if (url !== 'https://api.resend.com/emails') throw new Error('Unexpected outbound fetch');
    fs.appendFileSync(process.env.IZ_QA_LOG, JSON.stringify({ url, body: JSON.parse(options.body), key: options.headers['Idempotency-Key'] }) + '\\n');
    const status = Number(process.env.IZ_QA_STATUS || 200);
    await new Promise(resolve => setTimeout(resolve, 150));
    return new Response(JSON.stringify(status === 200 ? { id: 'qa-provider-id' } : { message: 're_qa_fake_only' }), { status });
  };
`);
const port = await new Promise(resolve => { const probe = net.createServer(); probe.listen(0, "127.0.0.1", () => { const port = probe.address().port; probe.close(() => resolve(port)); }); });
const base = `http://127.0.0.1:${port}`;
let child;
let output = "";
async function stop() {
  if (!child || child.exitCode !== null) return;
  await new Promise(resolve => { child.once("exit", resolve); child.kill(); });
}
async function start(enabled, status = 200) {
  child = spawn(process.execPath, ["--require", preload, "server.js"], { cwd: root,
    env: { ...process.env, ...env, IZ_EMAIL_ENABLED: String(enabled), NODE_ENV: "test", HOST: "127.0.0.1", PORT: String(port),
      DATABASE_URL: "", IZ_RECOVERY_ADMIN_PASSWORD: "", IZ_BOOTSTRAP_ADMIN_EMAIL: "", IZ_BOOTSTRAP_ADMIN_PASSWORD: "",
      IZ_BASE_URL: base, IZ_DATA_DIR: dataDir, IZ_DEFAULT_STATE_PATH: seedPath, AUTOMATION_INTERVAL_MS: "3600000",
      IZ_QA_LOG: requestLog, IZ_QA_STATUS: String(status) }, stdio: ["ignore", "pipe", "pipe"] });
  child.stdout.on("data", chunk => { output += chunk; }); child.stderr.on("data", chunk => { output += chunk; });
  for (let i = 0; i < 60; i++) {
    try { if ((await fetch(`${base}/healthz`)).ok) return; } catch {}
    if (child.exitCode !== null) throw new Error(output);
    await delay(100);
  }
  throw new Error(`Mail QA server did not start: ${output}`);
}
function client() {
  let cookie = "";
  return async (method, route, payload) => {
    const response = await fetch(`${base}${route}`, { method, headers: { Cookie: cookie, "Content-Type": "application/json" },
      ...(payload !== undefined ? { body: JSON.stringify(payload) } : {}) });
    if (response.headers.get("set-cookie")) cookie = response.headers.get("set-cookie").split(";")[0];
    return { status: response.status, body: await response.json() };
  };
}
const logged = () => readFileSync(requestLog, "utf8").trim().split("\n").filter(Boolean).map(line => JSON.parse(line));
try {
  await start(false);
  const admin = client(), member = client(), anonymous = client();
  assert.equal((await anonymous("POST", "/api/smtp/test")).status, 401);
  await member("POST", "/api/login", { email: "lucia@isocronazero.org", password: memberPassword });
  assert.equal((await member("POST", "/api/smtp/test")).status, 403);
  assert.equal((await member("GET", "/api/state")).body.mailDelivery, undefined, "Delivery configuration is admin-only");
  await admin("POST", "/api/login", { email: "admin@isocronazero.org", password: adminPassword });
  const paused = (await admin("GET", "/api/state")).body;
  assert.equal(paused.mailDelivery.provider, "resend");
  assert.equal(paused.mailDelivery.ready, false);
  assert.equal(JSON.stringify(paused).includes(env.RESEND_API_KEY), false);
  assert.equal((await admin("POST", "/api/courses/course-1/send-pending")).status, 400);
  assert.equal(logged().length, 0, "Ordinary routes cannot send while paused");
  assert.equal((await admin("POST", "/api/smtp/test")).status, 200);
  assert.equal(logged().length, 1);
  assert.equal(logged()[0].body.to[0], env.IZ_EMAIL_TEST_TO);
  await admin("POST", "/api/state", { ...paused, mailDelivery: { ready: true, apiKey: "forged" } });
  const stored = JSON.parse(readFileSync(path.join(dataDir, "state.json"), "utf8"));
  assert.equal(stored.mailDelivery, undefined, "Computed server configuration is not accepted in whole-state saves");
  assert.equal(JSON.stringify(stored).includes(env.RESEND_API_KEY), false, "The API credential never enters the database");
  await stop();

  await start(true, 403);
  const failingAdmin = client();
  await failingAdmin("POST", "/api/login", { email: "admin@isocronazero.org", password: adminPassword });
  const failure = await failingAdmin("POST", "/api/courses/course-1/send-pending");
  assert.equal(failure.body.failedCount, 1);
  assert.match(failure.body.message, /HTTP 403/);
  assert.equal(JSON.stringify(failure.body).includes(env.RESEND_API_KEY), false);
  const failed = (await failingAdmin("GET", "/api/state")).body;
  assert.equal(failed.emailOutbox[0].status, "failed");
  const failedId = failed.emailOutbox[0].id, failedKey = logged().at(-1).key;
  await stop();

  await start(true);
  const sendingAdmin = client();
  await sendingAdmin("POST", "/api/login", { email: "admin@isocronazero.org", password: adminPassword });
  const retryCount = logged().length;
  const [sent, simultaneous] = await Promise.all([
    sendingAdmin("POST", "/api/courses/course-1/send-pending"),
    sendingAdmin("POST", "/api/courses/course-1/send-pending")
  ]);
  assert.equal(sent.body.sentCount, 1);
  assert.equal(sent.body.failedCount, 0);
  assert.equal(simultaneous.body.sentCount, 0);
  assert.equal(logged().length, retryCount + 1, "Concurrent sends for a diploma transmit only one provider request");
  const delivered = (await sendingAdmin("GET", "/api/state")).body;
  assert.equal(delivered.emailOutbox.length, 1, "Retry uses the pending record instead of creating another diploma email");
  assert.equal(delivered.emailOutbox[0].id, failedId);
  assert.equal(delivered.emailOutbox[0].providerMessageId, "qa-provider-id");
  assert.equal(delivered.emailOutbox[0].transport, "resend");
  assert.equal(logged().at(-1).key, failedKey, "A retry after restart keeps the same provider idempotency key");
  const count = logged().length;
  assert.equal((await sendingAdmin("POST", "/api/courses/course-1/send-pending")).body.sentCount, 0);
  assert.equal(logged().length, count, "A Resend-accepted diploma is not delivered again by send-pending");
  console.log("Mail HTTP checks passed (roles, pause/test, credential isolation, provider failure, restart retry and diploma deduplication; no external network).");
} finally {
  await stop();
  rmSync(temp, { recursive: true, force: true });
}
