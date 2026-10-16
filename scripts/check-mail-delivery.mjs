import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { spawn } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import { mkdtempSync, writeFileSync, mkdirSync, rmSync } from "node:fs";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { setTimeout as delay } from "node:timers/promises";

const { getMailSettings, getMailDeliveryStatus, isMailReady, createMailSender } = createRequire(import.meta.url)("../server/mail-delivery.js");
const { sendMail: sendSmtpMail } = createRequire(import.meta.url)("../smtp.js");
const serverSource = readFileSync(new URL("../server.js", import.meta.url), "utf8");
const pushItemSource = serverSource.slice(serverSource.indexOf("function pushAutomationItem("), serverSource.indexOf("function pickNextAgentItem("));
const inboxContext = vm.createContext({ createHash });
vm.runInContext(pushItemSource, inboxContext);
const independentInboxes = [{ automationInbox: [] }, { automationInbox: [] }];
for (const inbox of independentInboxes) inboxContext.pushAutomationItem(inbox, { type: "associate_profile_notification", key: "profile-request-qa" });
assert.equal(independentInboxes[0].automationInbox[0].id, independentInboxes[1].automationInbox[0].id,
  "Independent detections of a new task must produce the same actionable identity");
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
const pdfFixture = Buffer.from("%PDF-1.4\nDiploma QA\n\x00\xff\n%%EOF", "latin1");
const attached = { ...message, beforeData() {
  attached.attachments = [{ filename: "diploma-qa.pdf", contentType: "application/pdf", content: pdfFixture }];
} };
await sender(enabled, attached);
const attachedRequest = requests.at(-1);
assert.deepEqual(JSON.parse(attachedRequest.options.body).attachments,
  [{ filename: "diploma-qa.pdf", content: pdfFixture.toString("base64") }], "Late-generated PDF bytes are included in the Resend request");
await sender(enabled, attached);
assert.equal(requests.at(-1).options.headers["Idempotency-Key"], attachedRequest.options.headers["Idempotency-Key"]);
await sender(enabled, { ...message, attachments: [{ filename: "diploma-qa.pdf", content: Buffer.from("different PDF") }] });
assert.notEqual(requests.at(-1).options.headers["Idempotency-Key"], attachedRequest.options.headers["Idempotency-Key"], "The provider key includes the attachment bytes");
await assert.rejects(sender(enabled, { ...message, attachments: [{ filename: "empty.pdf", content: Buffer.alloc(0) }] }), /adjunto/);
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

function attachedPdfFromMime(raw) {
  assert.match(raw, /Content-Type: multipart\/mixed; boundary="[^"]+"/i);
  assert.match(raw, /Content-Type: application\/pdf/i);
  assert.match(raw, /Content-Disposition: attachment; filename="[^"]+\.pdf"/i);
  const encoded = raw.match(/Content-Disposition: attachment;[^\r\n]+\r\nContent-Transfer-Encoding: base64\r\n\r\n([A-Za-z0-9+/=\r\n]+)\r\n--/i)?.[1];
  assert.ok(encoded, "A MIME PDF attachment must have a Base64 body");
  assert.ok(encoded.split("\r\n").every(line => line.length <= 76), "MIME Base64 lines stay within 76 characters");
  return Buffer.from(encoded.replace(/\s/g, ""), "base64");
}

// Exercise the real SMTP DATA path, including attachments generated at the final validation hook.
let smtpRaw = "";
const smtpSockets = new Set();
const smtpServer = net.createServer(socket => {
  smtpSockets.add(socket); socket.once("close", () => smtpSockets.delete(socket));
  socket.setEncoding("utf8"); socket.write("220 localhost QA\r\n");
  let buffer = "", data = false;
  socket.on("data", chunk => {
    buffer += chunk;
    while (buffer.includes("\r\n")) {
      const end = buffer.indexOf("\r\n"), line = buffer.slice(0, end); buffer = buffer.slice(end + 2);
      if (data) {
        if (line === ".") { data = false; socket.write("250 queued\r\n"); }
        else smtpRaw += line + "\r\n";
      } else if (line.startsWith("EHLO")) socket.write("250 localhost\r\n");
      else if (line === "DATA") { data = true; socket.write("354 send data\r\n"); }
      else if (line === "QUIT") socket.end("221 bye\r\n");
      else socket.write("250 OK\r\n");
    }
  });
});
await new Promise(resolve => smtpServer.listen(0, "127.0.0.1", resolve));
try {
  const smtpMessage = { ...message, from: "qa@example.test", text: ".Primera linea\nTexto con acentos: formación", beforeData() {
    smtpMessage.attachments = [{ filename: "diploma-qa.pdf", contentType: "application/pdf", content: pdfFixture }];
  } };
  await sendSmtpMail({ host: "127.0.0.1", port: smtpServer.address().port, secure: false, startTls: false }, smtpMessage);
  assert.deepEqual(attachedPdfFromMime(smtpRaw), pdfFixture, "The SMTP attachment round-trips binary PDF bytes");
  assert.ok(smtpRaw.includes("..Primera linea\r\nTexto con acentos: formación"), "SMTP still dot-stuffs text correctly");
} finally {
  for (const socket of smtpSockets) socket.destroy();
  await new Promise(resolve => smtpServer.close(resolve));
}

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
    return { status: response.status, body: response.headers.get("Content-Type")?.includes("application/json")
      ? await response.json() : Buffer.from(await response.arrayBuffer()) };
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
  assert.equal(logged()[0].body.attachments, undefined, "An isolated mail configuration test has no diploma attached");
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
  assert.deepEqual([sent.body.sentCount, simultaneous.body.sentCount].sort(), [0, 1]);
  assert.equal([sent, simultaneous].find(item => item.body.sentCount === 1).body.failedCount, 0);
  assert.equal(logged().length, retryCount + 1, "Concurrent sends for a diploma transmit only one provider request");
  const delivered = (await sendingAdmin("GET", "/api/state")).body;
  assert.equal(delivered.emailOutbox.length, 1, "Retry uses the pending record instead of creating another diploma email");
  assert.equal(delivered.emailOutbox[0].id, failedId);
  assert.equal(delivered.emailOutbox[0].providerMessageId, "qa-provider-id");
  assert.equal(delivered.emailOutbox[0].transport, "resend");
  assert.equal(logged().at(-1).key, failedKey, "A retry after restart keeps the same provider idempotency key");
  const actualAttachment = logged().at(-1).body.attachments;
  assert.equal(actualAttachment.length, 1, "A diploma email always includes its PDF");
  assert.match(actualAttachment[0].filename, /^diploma-.+\.pdf$/);
  const portalPdf = await sendingAdmin("GET", "/api/diplomas/course-1/member-1.pdf");
  assert.equal(portalPdf.status, 200);
  assert.deepEqual(Buffer.from(actualAttachment[0].content, "base64"), portalPdf.body, "Email contains exactly the issued PDF available in the portal");
  const exportedEmail = await sendingAdmin("GET", `/api/emails/${failedId}.eml`);
  assert.equal(exportedEmail.status, 200);
  assert.deepEqual(attachedPdfFromMime(exportedEmail.body.toString("utf8")), portalPdf.body, "Exported .eml also contains the real diploma");
  assert.equal(JSON.stringify(delivered.emailOutbox).includes(actualAttachment[0].content), false, "PDF bytes never inflate the persisted state");
  const count = logged().length;
  assert.equal((await sendingAdmin("POST", "/api/courses/course-1/send-pending")).body.sentCount, 0);
  assert.equal(logged().length, count, "A Resend-accepted diploma is not delivered again by send-pending");

  const queueState = (await sendingAdmin("GET", "/api/state")).body;
  const secondCourse = { ...structuredClone(queueState.courses.find(item => item.id === "course-1")),
    id: "course-duplicate-qa", title: "Second diploma QA" };
  queueState.courses.push(secondCourse);
  const legacy = (id, courseId, title, status = "queued") => ({ id, courseId, memberId: "member-1",
    to: "pupil@example.test", subject: `Diploma emitido - ${title}`, body: "Legacy diploma QA",
    sentAt: new Date().toISOString(), status, transport: "smtp", deliveryError: "" });
  queueState.emailOutbox.unshift(
    ...Array.from({ length: 5 }, (_, i) => legacy(`duplicate-new-${i}`, secondCourse.id, secondCourse.title)),
    ...Array.from({ length: 4 }, (_, i) => legacy(`duplicate-accepted-${i}`, "course-1", "Accepted diploma", i === 1 ? "failed" : i === 2 ? "manual" : "queued")),
    ...Array.from({ length: 2 }, (_, i) => ({ ...legacy(`feedback-${i}`, secondCourse.id, secondCourse.title),
      kind: "course_feedback", subject: "Feedback reminder QA" }))
  );
  assert.equal((await sendingAdmin("POST", "/api/state", queueState)).status, 200);
  const beforeQueue = logged().length;
  const queueDelivery = sendingAdmin("POST", "/api/emails/send-queued");
  // Wait until the batch has committed its diploma and is awaiting the next, unrelated mail.
  for (let i = 0; i < 100 && logged().length < beforeQueue + 2; i++) await delay(10);
  assert.equal(logged().length, beforeQueue + 2);
  const concurrentCourse = await sendingAdmin("POST", `/api/courses/${secondCourse.id}/send-pending`);
  assert.equal(concurrentCourse.body.sentCount, 0, "Acceptance is durable before the rest of the queue finishes");
  assert.equal((await sendingAdmin("POST", "/api/state", queueState)).status, 200);
  const queueResult = await queueDelivery;
  assert.equal(queueResult.body.sentCount, 3, "One new diploma and two unrelated reminders are delivered");
  assert.equal(queueResult.body.failedCount, 0);
  assert.equal(logged().length, beforeQueue + 3, "Legacy copies do not produce repeated provider requests");
  const batchRequests = logged().slice(beforeQueue);
  assert.equal(batchRequests[0].body.attachments.length, 1, "Legacy diploma records also attach the PDF");
  assert.ok(batchRequests.slice(1).every(request => !request.body.attachments), "Feedback reminders do not acquire diploma attachments");
  const deduplicated = (await sendingAdmin("GET", "/api/state")).body;
  assert.equal(deduplicated.emailOutbox.length, queueState.emailOutbox.length, "All historical records are retained");
  assert.equal(deduplicated.emailOutbox.filter(item => item.status === "superseded").length, 8);
  assert.equal(deduplicated.emailOutbox.find(item => item.id === "duplicate-new-0").status, "sent");
  assert.equal(deduplicated.emailOutbox.find(item => item.id === "duplicate-new-1").supersededBy, "duplicate-new-0");
  context.state = deduplicated;
  vm.runInContext(source.slice(source.indexOf("function getLatestMailForMemberCourse("), source.indexOf("function hasVerifiedDiplomaDelivery(")), context);
  assert.equal(context.getLatestMailForMemberCourse("course-1", "member-1").status, "sent", "Omitted copies do not hide the actual delivery in the UI");
  const stableCount = logged().length;
  assert.equal((await sendingAdmin("POST", "/api/emails/send-queued")).body.sentCount, 0);
  assert.equal(logged().length, stableCount, "A second batch leaves accepted diplomas and superseded copies alone");
  const resend = await sendingAdmin("POST", `/api/emails/${failedId}/send`);
  assert.equal(resend.status, 200);
  assert.equal(logged().length, stableCount + 1, "An explicit resend still creates one intentional new delivery");
  assert.notEqual(resend.body.email.id, failedId);
  assert.deepEqual(logged().at(-1).body.attachments, actualAttachment, "An intentional resend includes the diploma, preserving the old delivery record");

  await stop();
  await start(true, 403);
  const duplicateFailureAdmin = client();
  await duplicateFailureAdmin("POST", "/api/login", { email: "admin@isocronazero.org", password: adminPassword });
  const failedQueue = (await duplicateFailureAdmin("GET", "/api/state")).body;
  const failureCourse = { ...structuredClone(secondCourse), id: "course-duplicate-failure-qa" };
  failedQueue.courses.push(failureCourse);
  failedQueue.emailOutbox.unshift(...Array.from({ length: 5 }, (_, i) => legacy(`duplicate-failure-${i}`, failureCourse.id, failureCourse.title)));
  await duplicateFailureAdmin("POST", "/api/state", failedQueue);
  const beforeDuplicateFailure = logged().length;
  const rejectedQueue = await duplicateFailureAdmin("POST", "/api/emails/send-queued");
  assert.equal(rejectedQueue.body.failedCount, 1);
  assert.equal(logged().length, beforeDuplicateFailure + 1, "A provider rejection does not try the other legacy copies");
  const rejectedKey = logged().at(-1).key;
  await stop();
  await start(true);
  const finalAdmin = client();
  await finalAdmin("POST", "/api/login", { email: "admin@isocronazero.org", password: adminPassword });
  assert.equal((await finalAdmin("POST", "/api/emails/send-queued")).body.sentCount, 1);
  assert.equal(logged().length, beforeDuplicateFailure + 2);
  assert.equal(logged().at(-1).key, rejectedKey, "The grouped queue retries the same delivery after restart");
  const finalQueue = (await finalAdmin("GET", "/api/state")).body.emailOutbox;
  assert.equal(finalQueue.find(item => item.id === "duplicate-failure-0").status, "sent");
  assert.equal(finalQueue.filter(item => item.supersededBy === "duplicate-failure-0").length, 4);
  const unissued = (await finalAdmin("GET", "/api/state")).body;
  unissued.courses.push({ ...structuredClone(secondCourse), id: "course-unissued-qa", diplomaReady: [] });
  await finalAdmin("POST", "/api/state", unissued);
  const beforeUnissued = logged().length;
  const unissuedSend = await finalAdmin("POST", "/api/courses/course-unissued-qa/send-member/member-1");
  assert.equal(unissuedSend.status, 500);
  assert.match(unissuedSend.body.error, /no esta emitido/);
  assert.equal(logged().length, beforeUnissued, "A missing issued PDF fails before transmission instead of sending text only");
  const unissuedMail = (await finalAdmin("GET", "/api/state")).body.emailOutbox.find(item => item.courseId === "course-unissued-qa");
  assert.equal((await finalAdmin("GET", `/api/emails/${unissuedMail.id}.eml`)).status, 400, "An unavailable PDF gives a controlled export error");

  // A single administrator profile notice is independent of agent and bulk permissions.
  const profileState = (await finalAdmin("GET", "/api/state")).body;
  profileState.settings.agent = { ...profileState.settings.agent, enabled: false,
    canSendDiplomas: false, canResolveInbox: false, canCloseCourses: false };
  const profileAssociate = { ...structuredClone(profileState.associates[0]), id: "associate-profile-qa",
    associateNumber: 99001, firstName: "Profile QA", lastName: "One", email: "profile-one@example.test",
    linkedAccountId: "", linkedMemberId: "" };
  const otherProfileAssociate = { ...profileAssociate, id: "associate-profile-other-qa", associateNumber: 99002,
    firstName: "Profile QA", lastName: "Two", email: "profile-two@example.test" };
  profileState.associates.push(profileAssociate, otherProfileAssociate);
  const profileRequest = (id, associateId, status, reviewNote) => ({ id, associateId, status, reviewNote,
    notificationStatus: "pending", firstName: "Profile QA", lastName: "Request", email: "requested@example.test",
    phone: "600000000", service: "QA", submittedAt: new Date().toISOString() });
  // The first match by associate is deliberately the wrong request for the clicked card.
  profileState.associateProfileRequests = [
    profileRequest("profile-older-qa", profileAssociate.id, "Aprobado", "OLDER APPROVAL"),
    profileRequest("profile-selected-qa", profileAssociate.id, "Rechazado", "ONLY THE SELECTED REQUEST"),
    profileRequest("profile-other-qa", otherProfileAssociate.id, "Aprobado", "OTHER RECIPIENT")
  ];
  profileState.automationInbox.push({ id: "automation-legacy-profile-qa", type: "associate_profile_notification",
    key: "associate_profile_notification:profile-selected-qa", memberId: profileAssociate.id,
    title: "Old title", detail: "Old details", createdAt: "2020-01-01T00:00:00.000Z" });
  await finalAdmin("POST", "/api/state", profileState);
  const beforeProfiles = logged().length;
  await finalAdmin("POST", "/api/automation/run");
  const profileInbox = (await finalAdmin("GET", "/api/state")).body.automationInbox;
  const selectedProfileItem = profileInbox.find(item => item.key === "associate_profile_notification:profile-selected-qa");
  assert.ok(selectedProfileItem);
  assert.equal(selectedProfileItem.id, "automation-legacy-profile-qa", "A stored legacy ID remains usable by already-open pages");
  assert.equal(selectedProfileItem.createdAt, "2020-01-01T00:00:00.000Z");
  assert.notEqual(selectedProfileItem.title, "Old title", "Stable identity must not preserve stale task content");
  assert.equal(new Set(profileInbox.map(item => item.id)).size, profileInbox.length, "Different tasks have distinct IDs");
  const inboxIdentity = inbox => inbox.map(({ key, id, createdAt }) => ({ key, id, createdAt })).sort((a, b) => a.key.localeCompare(b.key));
  for (let read = 0; read < 2; read++) {
    const refreshedInbox = (await finalAdmin("GET", "/api/state")).body.automationInbox;
    assert.deepEqual(inboxIdentity(refreshedInbox), inboxIdentity(profileInbox), "GET /api/state cannot invalidate rendered action buttons");
  }
  await finalAdmin("POST", "/api/automation/run");
  assert.deepEqual(inboxIdentity((await finalAdmin("GET", "/api/state")).body.automationInbox), inboxIdentity(profileInbox),
    "A full automation sweep preserves identity and creation time for pending tasks");
  const profileRoute = `/api/automation/inbox/${selectedProfileItem.id}/resolve`;
  assert.equal((await client()("POST", profileRoute, { manualAdmin: true })).status, 401);
  const profileMember = client();
  await profileMember("POST", "/api/login", { email: "lucia@isocronazero.org", password: memberPassword });
  assert.equal((await profileMember("POST", profileRoute, { manualAdmin: true })).status, 403);
  assert.equal((await finalAdmin("POST", "/api/agent/resolve-next", { manualAdmin: true })).status, 400);
  await finalAdmin("POST", "/api/automation/resolve-all", { manualAdmin: true });
  assert.equal(logged().length, beforeProfiles, "Disabled agent/bulk policies cannot be overridden by request payloads");
  const beforeManualProfile = (await finalAdmin("GET", "/api/state")).body;
  beforeManualProfile.settings.automation.autoGenerateDiplomas = true;
  beforeManualProfile.settings.automation.autoSendDiplomas = true;
  await finalAdmin("POST", "/api/state", beforeManualProfile);
  const currentProfileItem = beforeManualProfile.automationInbox
    .find(item => item.key === selectedProfileItem.key);
  const manualResults = await Promise.all([0, 1].map(() => finalAdmin("POST", `/api/automation/inbox/${currentProfileItem.id}/resolve`)));
  assert.deepEqual(manualResults.map(result => result.status).sort(), [200, 500]);
  assert.match(manualResults.find(result => result.status === 500).body.error, /ya se esta enviando/);
  assert.equal(logged().length, beforeProfiles + 1, "Concurrent clicks send only the selected notice once");
  assert.deepEqual(logged().at(-1).body.to, [profileAssociate.email]);
  assert.ok(logged().at(-1).body.text.includes("ONLY THE SELECTED REQUEST"));
  assert.ok(!logged().at(-1).body.text.includes("OLDER APPROVAL"));
  const profilesAfter = (await finalAdmin("GET", "/api/state")).body;
  assert.equal(profilesAfter.associateProfileRequests.find(item => item.id === "profile-selected-qa").notificationStatus, "sent");
  assert.ok(profilesAfter.associateProfileRequests.filter(item => item.id !== "profile-selected-qa").every(item => item.notificationStatus === "pending"));
  assert.deepEqual(profilesAfter.settings.agent, profileState.settings.agent, "A manual click does not enable or change the agent");
  assert.deepEqual(profilesAfter.settings.automation, beforeManualProfile.settings.automation, "A manual notice leaves automatic rule settings unchanged");
  assert.deepEqual(profilesAfter.courses.find(item => item.id === "course-unissued-qa").diplomaReady, [], "Refreshing a manual notice does not execute unrelated rules");
  assert.ok(!profilesAfter.automationInbox.some(item => item.key === selectedProfileItem.key));
  assert.equal((await finalAdmin("POST", `/api/automation/inbox/${currentProfileItem.id}/resolve`)).status, 404,
    "A resolved task is removed and its old button cannot send another notice");
  assert.equal(logged().length, beforeProfiles + 1);
  profilesAfter.settings.agent.enabled = true;
  profilesAfter.settings.automation.autoGenerateDiplomas = false;
  profilesAfter.settings.automation.autoSendDiplomas = false;
  await finalAdmin("POST", "/api/state", profilesAfter);
  assert.equal((await finalAdmin("POST", "/api/agent/resolve-next", { manualAdmin: true })).status, 200);
  assert.equal(logged().length, beforeProfiles + 1, "An enabled agent with sending denied still sends nothing");

  await stop();
  await start(false);
  const pausedProfileAdmin = client();
  await pausedProfileAdmin("POST", "/api/login", { email: "admin@isocronazero.org", password: adminPassword });
  const remainingProfile = (await pausedProfileAdmin("GET", "/api/state")).body.automationInbox
    .find(item => item.key === "associate_profile_notification:profile-older-qa");
  const remainingProfileRoute = `/api/automation/inbox/${remainingProfile.id}/resolve`;
  assert.match((await pausedProfileAdmin("POST", remainingProfileRoute)).body.error, /Configura y activa/);
  assert.equal(logged().length, beforeProfiles + 1, "Manual profile notices respect the provider pause");
  await stop();
  await start(true, 403);
  const failingProfileAdmin = client();
  await failingProfileAdmin("POST", "/api/login", { email: "admin@isocronazero.org", password: adminPassword });
  const afterRestart = (await failingProfileAdmin("GET", "/api/state")).body.automationInbox
    .find(item => item.key === remainingProfile.key);
  assert.equal(afterRestart.id, remainingProfile.id, "A pending button remains valid after restarting and refreshing");
  assert.match((await failingProfileAdmin("POST", remainingProfileRoute)).body.error, /HTTP 403/);
  assert.equal((await failingProfileAdmin("GET", "/api/state")).body.associateProfileRequests
    .find(item => item.id === "profile-older-qa").notificationStatus, "failed");
  console.log("Mail HTTP checks passed (roles, pause/test, credential isolation, provider failure, restart retry and diploma deduplication; no external network).");
} finally {
  await stop();
  rmSync(temp, { recursive: true, force: true });
}
