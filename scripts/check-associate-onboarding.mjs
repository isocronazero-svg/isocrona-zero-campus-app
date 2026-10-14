import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import { createOnboardingStateAccess } from "../server/onboarding-state.js";

// Background writers share the same protection without locking unrelated state.
{
  let stored = { associates: [{ id: "a" }], members: [], accounts: [], emailOutbox: [], setting: "initial" };
  const access = createOnboardingStateAccess({
    readState: () => structuredClone(stored),
    writeState: state => { stored = structuredClone(state); }
  });
  const oldSweep = access.readState();
  const provision = access.readState();
  Object.assign(provision.associates[0], { campusOnboardingCreatedAt: "created", linkedMemberId: "m", linkedAccountId: "u", temporaryPassword: "synthetic" });
  provision.members.push({ id: "m", associateId: "a" });
  provision.accounts.push({ id: "u", memberId: "m", passwordHash: "synthetic-hash", mustChangePassword: true });
  provision.emailOutbox.push({ id: "mail", kind: "associate_welcome", associateId: "a", status: "sent" });
  access.writeState(provision);
  oldSweep.setting = "updated";
  access.writeState(oldSweep);
  assert.equal(stored.accounts.length, 1);
  assert.equal(stored.emailOutbox[0].status, "sent");
  assert.equal(stored.setting, "updated");
  const beforePasswordChange = access.readState();
  const changedPassword = access.readState();
  delete changedPassword.associates[0].temporaryPassword;
  Object.assign(changedPassword.accounts[0], { passwordHash: "changed-hash", mustChangePassword: false });
  access.writeState(changedPassword);
  access.writeState(beforePasswordChange);
  assert.equal(stored.associates[0].temporaryPassword, undefined);
  assert.equal(stored.accounts[0].passwordHash, "changed-hash");
  assert.equal(stored.accounts[0].mustChangePassword, false);
  const beforeDeletion = access.readState();
  const deleted = access.readState();
  for (const key of ["associates", "members", "accounts", "emailOutbox"]) deleted[key] = [];
  access.writeState(deleted);
  access.writeState(beforeDeletion);
  for (const key of ["associates", "members", "accounts", "emailOutbox"]) assert.equal(stored[key].length, 0);
}

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const temporaryRoot = mkdtempSync(path.join(os.tmpdir(), "iz-onboarding-"));
const adminPassword = `Admin-${randomUUID()}`;
const memberPassword = `Member-${randomUUID()}`;

async function freePort() {
  return await new Promise((resolve, reject) => {
    const server = net.createServer();
    server.on("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const { port } = server.address();
      server.close(() => resolve(port));
    });
  });
}

function smtpServer(port) {
  let rejectNextMessage = true;
  const messages = [];
  const server = net.createServer((socket) => {
    socket.on("error", () => {}); // The restart regression deliberately interrupts SMTP.
    socket.write("220 synthetic SMTP\r\n");
    let dataMode = false;
    let buffer = "", message = "";
    socket.on("data", (chunk) => {
      buffer += String(chunk);
      const lines = buffer.split(/\r?\n/);
      buffer = lines.pop();
      for (const line of lines) {
        if (dataMode) {
          if (line === ".") {
            messages.push(message);
            message = "";
            dataMode = false;
            if (server.holdNext) {
              const gate = server.holdNext;
              server.holdNext = null;
              server.onCaptured?.();
              gate.then(() => socket.write("250 queued synthetic\r\n"));
              continue;
            }
            if (rejectNextMessage || server.rejectNext) {
              rejectNextMessage = false;
              server.rejectNext = false;
              socket.write("451 synthetic retryable failure\r\n");
            } else {
              socket.write("250 queued synthetic\r\n");
            }
          } else message += line + "\n";
          continue;
        }
        if (/^EHLO/i.test(line)) socket.write("250 synthetic\r\n");
        else if (/^(MAIL FROM|RCPT TO)/i.test(line)) socket.write("250 ok\r\n");
        else if (/^DATA/i.test(line)) { dataMode = true; socket.write("354 continue\r\n"); }
        else if (/^QUIT/i.test(line)) socket.end("221 bye\r\n");
      }
    });
  }).listen(port, "127.0.0.1");
  server.messages = messages;
  return server;
}

function seedState(smtpPort) {
  const state = JSON.parse(readFileSync(path.join(root, "data/default-state.json"), "utf8"));
  const admin = state.accounts.find((item) => item.role === "admin");
  const member = state.accounts.find((item) => item.role !== "admin");
  Object.assign(admin, { email: "admin.synthetic@example.test", password: adminPassword, passwordHash: "", mustChangePassword: false });
  Object.assign(member, { email: "member.synthetic@example.test", password: memberPassword, passwordHash: "", mustChangePassword: false });
  state.accounts = [admin, member];
  state.members = state.members.filter((item) => [admin.memberId, member.memberId].includes(item.id));
  const fixture = (id, email, extras = {}) => ({ id, associateNumber: id, firstName: `Synthetic ${id}`, lastName: "Fixture", email, status: "Activa", linkedAccountId: "", linkedMemberId: "", campusAccessStatus: "pending", temporaryPassword: "", welcomeEmailStatus: "pending", welcomeEmailSentAt: "", ...extras });
  state.associates = [
    fixture("eligible", "eligible@example.test"),
    fixture("missing", ""),
    fixture("invalid", "invalid-address"),
    fixture("duplicate-a", "duplicate@example.test"),
    fixture("duplicate-b", "DUPLICATE@example.test"),
    fixture("inactive", "inactive@example.test", { status: "Baja" })
  ];
  state.associates.push(
    fixture("quota", "quota@example.test", { status: "Pendiente cuota" }),
    fixture("legacy", "legacy@example.test", { status: "Revisar documentacion", observations: "Importado desde Excel legacy" }),
    fixture("not-legacy", "notlegacy@example.test", { status: "Revisar documentacion" }),
    fixture("request", "request@example.test", { status: "Solicitud recibida" }),
    fixture("unknown", "unknown@example.test", { status: "Inactiva" }),
    fixture("typo", "qa@gmail.con"),
    fixture("canonical", " CANONICAL@EXAMPLE.TEST "),
    fixture("broken", "broken@example.test", { linkedAccountId: "missing-account" }),
    fixture("collision", member.email),
    fixture("member-collision", "member-collision@example.test"),
    fixture("reuse", "reuse@example.test", { linkedMemberId: "reusable-member" })
  );
  state.members.push({ id: "foreign-member", email: "member-collision@example.test", name: "Foreign QA", associateId: "someone-else" },
    { id: "reusable-member", email: "reuse@example.test", name: "Reuse QA", associateId: "reuse" });
  for (const [id, role, status, onboarding] of [["manual", "member", "Activa", false], ["special", "instructor", "Activa", true], ["admin-linked", "admin", "Activa", true], ["inactive-linked", "member", "Baja", true]]) {
    const email = id + "@example.test";
    state.members.push({ id: id + "-member", email, name: id, associateId: id });
    state.accounts.push({ id: id + "-account", email, name: id, role, memberId: id + "-member", associateId: id, password: memberPassword, mustChangePassword: true });
    state.associates.push(fixture(id, email, { status, linkedMemberId: id + "-member", linkedAccountId: id + "-account", temporaryPassword: memberPassword, campusOnboardingCreatedAt: onboarding ? "2026-10-13" : "" }));
  }
  for (let i = 0; i < 22; i++) state.associates.push(fixture("batch-" + i, "batch-" + i + "@example.test"));
  state.emailOutbox = [];
  for (const key of Object.keys(state.settings.automation || {})) state.settings.automation[key] = false;
  state.settings.smtp = { host: "127.0.0.1", port: smtpPort, secure: false, startTls: false, username: "", password: "", fromEmail: "synthetic@example.test", fromName: "Synthetic" };
  return state;
}

function client(baseUrl) {
  let cookie = "";
  return { async call(method, route, body) {
    const response = await fetch(`${baseUrl}${route}`, { method, headers: { ...(body ? { "Content-Type": "application/json" } : {}), ...(cookie ? { Cookie: cookie } : {}) }, body: body ? JSON.stringify(body) : undefined });
    if (response.headers.get("set-cookie")) cookie = response.headers.get("set-cookie").split(";")[0];
    const payload = JSON.parse(await response.text());
    return { status: response.status, body: payload };
  } };
}

async function main() {
  const port = await freePort(), smtpPort = await freePort();
  const smtp = smtpServer(smtpPort);
  const dataDir = path.join(temporaryRoot, "data");
  mkdirSync(dataDir, { recursive: true });
  const defaultState = path.join(temporaryRoot, "default-state.json");
  writeFileSync(defaultState, JSON.stringify(seedState(smtpPort), null, 2));
  const env = { ...process.env, NODE_ENV: "test", HOST: "127.0.0.1", DATABASE_URL: "", PORT: String(port), IZ_DATA_DIR: dataDir, IZ_DEFAULT_STATE_PATH: defaultState, AUTOMATION_INTERVAL_MS: "86400000", IZ_RECOVERY_ADMIN_PASSWORD: "" };
  for (const key of Object.keys(env)) if (key.startsWith("SMTP_") || key.startsWith("IZ_BOOTSTRAP_ADMIN_")) env[key] = "";
  let server;
  async function start() {
    server = spawn(process.execPath, ["server.js"], { cwd: root, env, stdio: "ignore" });
    for (let attempt = 0; attempt < 100; attempt++) {
      if (server.exitCode !== null) throw new Error("Isolated server exited");
      try { if ((await fetch(baseUrl + "/healthz")).ok) return; } catch {}
      await delay(100);
    }
    throw new Error("Isolated server did not start");
  }
  async function stop() {
    if (server?.exitCode === null && server.signalCode === null) {
      const stopped = new Promise(resolve => server.once("exit", resolve));
      server.kill();
      await stopped;
    }
  }
  const baseUrl = `http://127.0.0.1:${port}`;
  try {
    await start();
    const admin = client(baseUrl); const member = client(baseUrl); const anonymous = client(baseUrl);
    await admin.call("POST", "/api/login", { email: "admin.synthetic@example.test", password: adminPassword });
    await member.call("POST", "/api/login", { email: "member.synthetic@example.test", password: memberPassword });
    assert.equal((await anonymous.call("POST", "/api/associates/onboarding/preview")).status, 401);
    assert.equal((await member.call("POST", "/api/associates/onboarding/preview")).status, 403);
    assert.equal((await member.call("POST", "/api/associates/onboarding/execute", {})).status, 403);
    const importFixture = snapshot => admin.call("POST", "/api/storage/import-state", { snapshotFile: {
      name: "synthetic-backup.json", type: "application/json", contentBase64: Buffer.from(JSON.stringify(snapshot)).toString("base64")
    } });
    const initial = (await admin.call("GET", "/api/storage/export-state")).body;
    const legacyAgent = structuredClone(initial);
    legacyAgent.settings.agent = { enabled: true, canResolveInbox: true, canSendDiplomas: true };
    legacyAgent.automationInbox = [{ id: "old-legacy-item", type: "associate_legacy_access", memberId: "legacy", status: "open" }];
    assert.equal((await importFixture(legacyAgent)).status, 200);
    assert.equal((await admin.call("POST", "/api/agent/resolve-next", {})).status, 200);
    const blockedLegacy = await admin.call("POST", "/api/automation/inbox/old-legacy-item/resolve", {});
    assert.equal(blockedLegacy.status, 500);
    assert.match(blockedLegacy.body.error, /Revisar accesos/);
    assert.equal((await admin.call("POST", "/api/automation/run", {})).status, 200);
    const afterLegacyAgent = (await admin.call("GET", "/api/storage/export-state")).body;
    assert.equal(afterLegacyAgent.accounts.length, initial.accounts.length, "Legacy agent cannot bypass preview and subset");
    assert.equal(afterLegacyAgent.associates.find(item => item.id === "legacy").linkedAccountId, "");
    assert.equal(afterLegacyAgent.automationInbox.some(item => item.type === "associate_legacy_access"), false);
    assert.equal(smtp.messages.length, 0);
    assert.equal((await importFixture(initial)).status, 200);
    const before = (await admin.call("GET", "/api/storage/export-state")).body;
    const previewOf = async () => (await admin.call("POST", "/api/associates/onboarding/preview")).body;
    const execute = (preview, associateIds) => admin.call("POST", "/api/associates/onboarding/execute", { token: preview.token, associateIds, confirmed: true });
    const preview = await admin.call("POST", "/api/associates/onboarding/preview");
    assert.deepEqual((await admin.call("GET", "/api/storage/export-state")).body, before, "Preview is entirely read-only");
    for (const id of ["eligible", "quota", "legacy", "canonical", "reuse"]) assert.equal(preview.body.items.find(item => item.id === id).category, "eligible", id);
    for (const [id, category] of [["missing", "missing_email"], ["invalid", "invalid_email"], ["typo", "invalid_email"], ["duplicate-a", "duplicate_email"], ["duplicate-b", "duplicate_email"], ...["inactive", "not-legacy", "request", "unknown", "broken", "collision", "member-collision", "inactive-linked"].map(id => [id, "incident"])]) {
      assert.equal(preview.body.items.find(item => item.id === id).category, category, id);
      assert.equal(preview.body.items.find(item => item.id === id).executable, false, id);
    }
    for (const id of ["manual", "special", "admin-linked"]) {
      assert.equal(preview.body.items.find(item => item.id === id).category, "already_linked");
      assert.equal(preview.body.items.find(item => item.id === id).executable, false);
    }
    for (const ids of [[], Array.from({length: 21}, (_, i) => "batch-" + i), ["missing"], ["fake"], ["special"], ["manual"]]) {
      assert.equal((await execute(preview.body, ids)).status, 400);
      assert.deepEqual((await admin.call("GET", "/api/storage/export-state")).body, before, "Invalid subset is not a mutation");
    }
    const subset = ["eligible", "quota", "legacy", "canonical", "reuse"];
    const execution = await execute(preview.body, subset);
    assert.equal(execution.status, 200);
    assert.equal(execution.body.created, 5);
    assert.equal(execution.body.results.length, 5);
    assert.equal((await execute(preview.body, subset)).status, 400, "Token is single-use");
    assert.equal(JSON.stringify(execution.body).includes("temporaryPassword"), false, "La ejecucion no filtra credenciales");
    const stateAfter = (await admin.call("GET", "/api/state")).body;
    const eligible = stateAfter.associates.find((item) => item.id === "eligible");
    const password = eligible.temporaryPassword;
    assert.ok(password.length >= 20 && !password.toLowerCase().includes("synthetic"), "La clave es aleatoria y no deducible");
    const account = stateAfter.accounts.find((item) => item.id === eligible.linkedAccountId);
    assert.equal(account.mustChangePassword, true);
    assert.equal(stateAfter.accounts.filter((item) => item.associateId === eligible.id).length, 1);
    assert.equal(eligible.welcomeEmailStatus, "failed", "El fallo SMTP conserva una cuenta reintentable");
    assert.ok(eligible.welcomeEmailError);
    assert.ok(stateAfter.associates.filter(item => subset.includes(item.id) && item.id !== "eligible").every(item => item.welcomeEmailStatus === "sent"), "Partial delivery failure does not corrupt other accounts");
    assert.ok(stateAfter.associates.filter(item => item.id.startsWith("batch-")).every(item => !item.linkedAccountId), "Unselected records are untouched");
    assert.equal(stateAfter.members.filter(item => item.associateId === "reuse").length, 1);
    const canonical = stateAfter.associates.find(item => item.id === "canonical");
    for (const value of [canonical.email, stateAfter.members.find(item => item.id === canonical.linkedMemberId).email, stateAfter.accounts.find(item => item.id === canonical.linkedAccountId).email]) assert.equal(value, "canonical@example.test");
    for (const a of stateAfter.associates.filter(item => subset.includes(item.id))) {
      assert.equal(stateAfter.members.find(item => item.id === a.linkedMemberId).associateId, a.id);
      assert.equal(stateAfter.accounts.find(item => item.id === a.linkedAccountId).memberId, a.linkedMemberId);
    }
    const exported = (await admin.call("GET", "/api/storage/export-state")).body;
    for (const a of exported.associates.filter(item => subset.includes(item.id))) {
      assert.ok(!JSON.stringify(exported.emailOutbox).includes(a.temporaryPassword), "Outbox export never contains the temporary credential");
      assert.ok(!JSON.stringify(execution.body).includes(a.temporaryPassword));
    }
    const own = client(baseUrl);
    assert.equal((await own.call("POST", "/api/login", { email: eligible.email, password })).status, 200);
    const ownState = (await own.call("GET", "/api/state")).body;
    assert.ok(!JSON.stringify(ownState).includes(password));
    assert.ok(!JSON.stringify(ownState).includes("temporaryPassword"));
    assert.ok(!JSON.stringify((await member.call("GET", "/api/state")).body).includes(password));
    assert.equal((await own.call("POST", "/api/state", { ...ownState, associates: [{ ...eligible, temporaryPassword: "attacker" }] })).status, 200);
    assert.equal((await admin.call("GET", "/api/state")).body.associates.find(item => item.id === "eligible").temporaryPassword, password, "Scoped save cannot replace or clear credentials");
    assert.equal((await admin.call("POST", "/api/state", before)).status, 200);
    const preserved = (await admin.call("GET", "/api/storage/export-state")).body;
    assert.equal(preserved.associates.find(item => item.id === "eligible").linkedAccountId, account.id, "Old admin form cannot erase provisioning");
    assert.equal(preserved.emailOutbox.filter(item => subset.includes(item.associateId)).length, 5, "Old admin form cannot erase delivery state");
    const retryPreview = await admin.call("POST", "/api/associates/onboarding/preview");
    assert.equal(retryPreview.body.items.find((item) => item.id === "eligible").category, "already_linked");
    assert.equal(retryPreview.body.items.find((item) => item.id === "eligible").executable, true);
    const retry = await execute(retryPreview.body, ["eligible"]);
    assert.equal(retry.status, 200);
    assert.equal(retry.body.created, 0);
    const stateAfterRetry = (await admin.call("GET", "/api/state")).body;
    assert.equal(stateAfterRetry.associates.find((item) => item.id === "eligible").temporaryPassword, password);
    assert.equal(stateAfterRetry.associates.find((item) => item.id === "eligible").welcomeEmailStatus, "sent");
    assert.equal(stateAfterRetry.accounts.filter((item) => item.associateId === eligible.id).length, 1);
    assert.equal(stateAfterRetry.emailOutbox.filter(item => item.associateId === eligible.id).length, 1, "Retry reuses failed welcome");
    assert.equal(stateAfterRetry.associates.find(item => item.id === eligible.id).welcomeEmailError, "");
    assert.ok(smtp.messages[0].includes(password) && smtp.messages.at(-1).includes(password), "SMTP retry uses the exact original credential");
    const postSend = await previewOf();
    assert.equal(postSend.items.find(item => item.id === "eligible").executable, false);
    assert.equal((await execute(postSend, ["eligible"])).status, 400);
    assert.equal(stateAfterRetry.accounts.length, stateAfter.accounts.length);
    const login = client(baseUrl);
    const firstLogin = await login.call("POST", "/api/login", { email: "eligible@example.test", password });
    assert.equal(firstLogin.body.session.mustChangePassword, true);
    const replacement = `Replacement-${randomUUID()}`;
    await login.call("POST", "/api/account/change-password", { accountId: firstLogin.body.session.accountId, currentPassword: password, newPassword: replacement, confirmPassword: replacement });
    const finalState = (await admin.call("GET", "/api/state")).body;
    assert.equal(finalState.associates.find((item) => item.id === "eligible").temporaryPassword, "");
    assert.ok(!JSON.stringify((await login.call("GET", "/api/state")).body).includes(password));
    assert.ok(!JSON.stringify((await admin.call("GET", "/api/storage/export-state")).body.emailOutbox).includes(password));
    let releaseSmtp, captured;
    smtp.holdNext = new Promise(resolve => { releaseSmtp = resolve; });
    const reachedSmtp = new Promise(resolve => { captured = resolve; });
    smtp.onCaptured = captured;
    const concurrentPreview = await previewOf();
    const pendingBatch = execute(concurrentPreview, ["batch-0", "batch-1", "batch-8", "batch-9"]);
    await reachedSmtp;
    try {
      const secondPreview = await previewOf();
      assert.equal((await execute(secondPreview, ["batch-2"])).status, 400, "Concurrent batch is rejected");
      const during = (await admin.call("GET", "/api/state")).body;
      during.settings.organization = "Concurrent synthetic edit";
      during.associates.find(item => item.id === "batch-1").status = "Baja";
      during.associates.find(item => item.id === "batch-8").email = "not-reviewed@example.test";
      during.associates.find(item => item.id === "batch-9").firstName = "Another identity";
      assert.equal((await admin.call("POST", "/api/state", during)).status, 200);
    } finally {
      releaseSmtp();
    }
    const concurrentResult = await pendingBatch;
    assert.equal(concurrentResult.status, 200);
    assert.equal(concurrentResult.body.created, 1);
    assert.equal(concurrentResult.body.results[1].outcome, "skipped", "Next candidate is revalidated after SMTP");
    for (const id of ["batch-8", "batch-9"]) {
      const result = concurrentResult.body.results.find(item => item.id === id);
      assert.equal(result.outcome, "skipped", "Only the confirmed identity may be used");
      assert.match(result.reason, /nueva vista previa/);
    }
    const afterConcurrent = (await admin.call("GET", "/api/state")).body;
    assert.equal(smtp.messages.some(message => message.includes("not-reviewed@example.test")), false);
    for (const id of ["batch-8", "batch-9"]) assert.equal(afterConcurrent.associates.find(item => item.id === id).linkedAccountId, "");
    assert.equal(afterConcurrent.settings.organization, "Concurrent synthetic edit", "SMTP completion preserves unrelated concurrent writes");
    assert.equal(afterConcurrent.associates.find(item => item.id === "batch-1").linkedAccountId, "");
    assert.equal(afterConcurrent.associates.find(item => item.id === "batch-2").linkedAccountId, "");
    // Start the generic queue writer BEFORE provisioning so its whole-state snapshot is stale.
    const queuedFixture = (await admin.call("GET", "/api/state")).body;
    queuedFixture.emailOutbox.push({ id: "generic-qa", to: "generic@example.test", subject: "QA", body: "Synthetic only", status: "queued" });
    assert.equal((await admin.call("POST", "/api/state", queuedFixture)).status, 200);
    let releaseQueue, queueCaptured;
    smtp.holdNext = new Promise(resolve => { releaseQueue = resolve; });
    const queueReachedSmtp = new Promise(resolve => { queueCaptured = resolve; });
    smtp.onCaptured = queueCaptured;
    const queuedSend = admin.call("POST", "/api/emails/send-queued", {});
    await queueReachedSmtp;
    let provisionedDuringQueue;
    try {
      provisionedDuringQueue = await execute(await previewOf(), ["batch-2"]);
      assert.equal(provisionedDuringQueue.body.created, 1);
    } finally { releaseQueue(); }
    assert.equal((await queuedSend).status, 200);
    const afterQueue = (await admin.call("GET", "/api/storage/export-state")).body;
    const queueAssociate = afterQueue.associates.find(item => item.id === "batch-2");
    assert.ok(afterQueue.accounts.some(item => item.id === queueAssociate.linkedAccountId), "Old queued writer retains the new account");
    assert.equal(queueAssociate.welcomeEmailStatus, "sent");
    assert.equal(afterQueue.emailOutbox.filter(item => item.associateId === "batch-2" && item.status === "sent").length, 1);

    // All existing generic retry paths must reconcile the associate too.
    for (const [id, route] of [["batch-3", "queue"], ["batch-4", "individual"], ["batch-5", "automation"], ["batch-6", "all"]]) {
      smtp.rejectNext = true;
      assert.equal((await execute(await previewOf(), [id])).body.results[0].status, "email_error");
      const failedState = (await admin.call("GET", "/api/storage/export-state")).body;
      const failedAssociate = failedState.associates.find(item => item.id === id);
      const failedMail = failedState.emailOutbox.find(item => item.associateId === id);
      const recipientAttempts = () => smtp.messages.filter(message => message.includes(id + "@example.test")).length;
      const attemptsBeforeRetry = recipientAttempts();
      // Hold a second queue message after the welcome succeeds: its delivery
      // must already be durable before the queue's final whole-state write.
      let releaseTrailing, trailingCaptured;
      let trailingReached;
      if (route === "queue") {
        const fixture = (await admin.call("GET", "/api/state")).body;
        fixture.emailOutbox.push({ id: "trailing-qa", to: "trailing@example.test", subject: "QA", body: "Synthetic only", status: "queued" });
        assert.equal((await admin.call("POST", "/api/state", fixture)).status, 200);
        const welcomeGate = Promise.resolve();
        smtp.holdNext = welcomeGate;
        trailingReached = new Promise(resolve => { trailingCaptured = resolve; });
        smtp.onCaptured = () => {
          smtp.holdNext = new Promise(resolve => { releaseTrailing = resolve; });
          smtp.onCaptured = trailingCaptured;
        };
      }
      let retryRoute = route === "queue" ? "/api/emails/send-queued" : "/api/emails/" + failedMail.id + "/send";
      if (["automation", "all"].includes(route)) {
        const fixture = (await admin.call("GET", "/api/state")).body;
        fixture.settings.agent.canSendDiplomas = true;
        fixture.settings.automation.autoDetectFailedEmails = true;
        assert.equal((await admin.call("POST", "/api/state", fixture)).status, 200);
        const inbox = (await admin.call("GET", "/api/state")).body.automationInbox;
        const task = inbox.find(item => item.type === "failed_email" && item.emailId === failedMail.id);
        assert.ok(task);
        retryRoute = route === "all" ? "/api/automation/resolve-all" : "/api/automation/inbox/" + task.id + "/resolve";
      }
      const sending = admin.call("POST", retryRoute, {});
      if (route === "queue") {
        await trailingReached;
        try {
          const previewDuringQueue = await previewOf();
          assert.equal(previewDuringQueue.items.find(item => item.id === id).status, "email_sent");
          assert.equal((await execute(previewDuringQueue, [id])).status, 400, "Sent welcome cannot retry while queue awaits another message");
        } finally { releaseTrailing(); }
      }
      const response = await sending;
      assert.equal(response.status, 200);
      assert.equal(recipientAttempts(), attemptsBeforeRetry + 1, "Exactly one delivery through " + route);
      const afterGenericRetry = (await admin.call("GET", "/api/storage/export-state")).body;
      const retried = afterGenericRetry.associates.find(item => item.id === id);
      assert.equal(retried.welcomeEmailStatus, "sent");
      assert.equal(retried.welcomeEmailError, "");
      assert.ok(retried.welcomeEmailSentAt);
      assert.equal(retried.temporaryPassword, failedAssociate.temporaryPassword);
      assert.equal(afterGenericRetry.emailOutbox.filter(item => item.associateId === id).length, 1, "Retry reuses the failed welcome record");
      const visible = (await previewOf()).items.find(item => item.id === id);
      assert.equal(visible.status, "email_sent");
      assert.equal(visible.executable, false);
    }
    const sentBeforeEmptyQueue = smtp.messages.length;
    assert.equal((await admin.call("POST", "/api/emails/send-queued", {})).body.sentCount, 0);
    assert.equal(smtp.messages.length, sentBeforeEmptyQueue, "No failed clone remains to resend a delivered welcome");
    smtp.rejectNext = true;
    assert.equal((await execute(await previewOf(), ["batch-7"])).body.results[0].status, "email_error");
    const interruptedFixture = (await admin.call("GET", "/api/state")).body;
    const welcomeTask = interruptedFixture.automationInbox.find(item => item.type === "associate_welcome" && item.memberId === "batch-7");
    const interruptedMail = interruptedFixture.emailOutbox.find(item => item.associateId === "batch-7");
    assert.ok(welcomeTask);
    assert.ok(interruptedFixture.automationInbox.some(item => item.type === "failed_email" && item.emailId === interruptedMail.id));
    let releaseInterrupted, capturedInterrupted;
    smtp.holdNext = new Promise(resolve => { releaseInterrupted = resolve; });
    const interruptedReachedSmtp = new Promise(resolve => { capturedInterrupted = resolve; });
    smtp.onCaptured = capturedInterrupted;
    const interruptedSend = admin.call("POST", "/api/automation/inbox/" + welcomeTask.id + "/resolve", {}).catch(() => ({ status: 0 }));
    await interruptedReachedSmtp;
    await stop();
    releaseInterrupted();
    await interruptedSend;
    await start();
    await admin.call("POST", "/api/login", { email: "admin.synthetic@example.test", password: adminPassword });
    const interruptedAttempts = smtp.messages.length;
    const ambiguous = (await admin.call("GET", "/api/storage/export-state")).body;
    assert.equal(ambiguous.emailOutbox.find(item => item.id === interruptedMail.id).status, "sending");
    assert.equal((await admin.call("POST", "/api/emails/" + interruptedMail.id + "/send", {})).status, 500);
    const blockedWelcome = await admin.call("POST", "/api/automation/inbox/" + welcomeTask.id + "/resolve", {});
    assert.equal(blockedWelcome.status, 500);
    assert.match(blockedWelcome.body.error, /pendiente de confirmar/);
    assert.equal((await admin.call("POST", "/api/automation/resolve-all", {})).status, 200);
    assert.equal((await admin.call("POST", "/api/emails/send-queued", {})).status, 200);
    assert.equal(smtp.messages.length, interruptedAttempts, "Interrupted welcome cannot resend through any generic resolver after restart");
    const afterInterrupted = (await admin.call("GET", "/api/storage/export-state")).body;
    assert.equal(afterInterrupted.accounts.length, ambiguous.accounts.length);
    assert.equal(afterInterrupted.emailOutbox.filter(item => item.associateId === "batch-7").length, 1);
    assert.equal(afterInterrupted.emailOutbox.find(item => item.id === interruptedMail.id).status, "sending");
    const ambiguousAssociate = ambiguous.associates.find(item => item.id === "batch-7");
    const safeAssociate = afterInterrupted.associates.find(item => item.id === "batch-7");
    assert.equal(safeAssociate.linkedAccountId, ambiguousAssociate.linkedAccountId);
    assert.equal(safeAssociate.temporaryPassword, ambiguousAssociate.temporaryPassword);
    const blockedPreview = (await previewOf()).items.find(item => item.id === "batch-7");
    assert.equal(blockedPreview.executable, false);
    assert.match(blockedPreview.detail, /reconciliacion manual/);

    // Persist the pre-SMTP queued window, restart, then resolve and drain the queue.
    smtp.rejectNext = true;
    assert.equal((await execute(await previewOf(), ["batch-10"])).body.results[0].status, "email_error");
    const queuedBeforeRestart = (await admin.call("GET", "/api/storage/export-state")).body;
    const queuedAssociate = queuedBeforeRestart.associates.find(item => item.id === "batch-10");
    const queuedWelcome = queuedBeforeRestart.emailOutbox.find(item => item.associateId === "batch-10");
    queuedWelcome.status = "queued";
    queuedWelcome.deliveryError = "";
    queuedAssociate.welcomeEmailStatus = "pending";
    assert.equal((await importFixture(queuedBeforeRestart)).status, 200);
    await stop();
    await start();
    await admin.call("POST", "/api/login", { email: "admin.synthetic@example.test", password: adminPassword });
    const queuedAttempts = smtp.messages.length;
    const queuedInbox = (await admin.call("GET", "/api/state")).body.automationInbox;
    const queuedTask = queuedInbox.find(item => item.type === "associate_welcome" && item.memberId === "batch-10");
    assert.ok(queuedTask);
    assert.equal((await admin.call("POST", "/api/automation/inbox/" + queuedTask.id + "/resolve", {})).status, 200);
    assert.equal((await admin.call("POST", "/api/emails/send-queued", {})).status, 200);
    assert.equal(smtp.messages.length, queuedAttempts + 1, "Queued recovery delivers once across resolver and generic queue");
    const afterQueuedRestart = (await admin.call("GET", "/api/storage/export-state")).body;
    const deliveredQueued = afterQueuedRestart.emailOutbox.filter(item => item.associateId === "batch-10");
    assert.equal(deliveredQueued.length, 1);
    assert.equal(deliveredQueued[0].id, queuedWelcome.id);
    assert.equal(deliveredQueued[0].status, "sent");
    assert.equal(afterQueuedRestart.associates.find(item => item.id === "batch-10").linkedAccountId, queuedAssociate.linkedAccountId);
    assert.equal(afterQueuedRestart.associates.find(item => item.id === "batch-10").temporaryPassword, queuedAssociate.temporaryPassword);
    const beforeRestart = (await admin.call("GET", "/api/storage/export-state")).body;
    await stop();
    await start();
    await admin.call("POST", "/api/login", { email: "admin.synthetic@example.test", password: adminPassword });
    const restarted = (await admin.call("GET", "/api/storage/export-state")).body;
    assert.equal(restarted.accounts.length, beforeRestart.accounts.length);
    assert.equal(restarted.associates.find(item => item.id === "eligible").welcomeEmailStatus, "sent");
    assert.equal((await importFixture(before)).status, 200);
    const restored = (await admin.call("GET", "/api/storage/export-state")).body;
    assert.equal(restored.accounts.length, before.accounts.length);
    assert.equal(restored.associates.find(item => item.id === "eligible").linkedAccountId, "", "Isolated backup rollback restores pre-onboarding state");
    const stale = await previewOf();
    const changed = structuredClone(restored);
    changed.associates.find(item => item.id === "eligible").firstName = "Changed";
    await importFixture(changed);
    assert.equal((await execute(stale, ["eligible"])).status, 400, "Changed identity invalidates the preview");
    const noSmtp = structuredClone(restored);
    noSmtp.settings.smtp = {};
    await importFixture(noSmtp);
    const noSmtpBefore = (await admin.call("GET", "/api/storage/export-state")).body;
    const noSmtpPreview = await previewOf();
    assert.equal(noSmtpPreview.smtpReady, false);
    assert.equal((await execute(noSmtpPreview, ["eligible"])).status, 400);
    assert.deepEqual((await admin.call("GET", "/api/storage/export-state")).body, noSmtpBefore);
  } finally {
    await stop();
    await new Promise(resolve => smtp.close(resolve));
    rmSync(temporaryRoot, { recursive: true, force: true });
  }
}

async function checkPreviewGuards() {
  const source = readFileSync(path.join(root, "server.js"), "utf8");
  const start = source.indexOf('  if (requestUrl.pathname === "/api/associates/onboarding/execute"');
  const end = source.indexOf("  const sendAssociateWelcomeMatch", start);
  const handler = source.slice(start, end);
  for (const mode of ["expired", "other-admin", "changed", "smtp", "empty", "large", "foreign", "busy"]) {
    const record = { fingerprint: "same", expiresAt: mode === "expired" ? 0 : Date.now() + 10000, accountId: mode === "other-admin" ? "other" : "admin" };
    const previews = new Map([["synthetic-token", record]]);
    let writes = 0, status;
    const context = {
      req: { method: "POST" }, res: {}, requestUrl: { pathname: "/api/associates/onboarding/execute" },
      requireAdminAccount: () => ({ id: "admin" }), readState: () => ({}),
      readJsonBody: async () => ({ token: "synthetic-token", confirmed: true, associateIds: mode === "empty" ? [] : mode === "large" ? Array.from({length:21}, (_, i) => "id-" + i) : [mode === "foreign" ? "bad-id" : "id"] }),
      payloadLimitBytes: { registration: 32768 }, associateOnboardingPreviews: previews,
      buildAssociateOnboardingPreview: () => ({ fingerprint: mode === "changed" ? "changed" : "same", items: [{id:"id",executable:true}] }),
      isSmtpConfigured: () => mode !== "smtp", associateOnboardingRunning: mode === "busy",
      writeState: () => writes++, sendJsonError: () => { status = 400; }
    };
    await vm.runInNewContext("(async () => {" + handler + "})()", context);
    assert.equal(status, 400, mode);
    assert.equal(writes, 0, mode);
    assert.equal(previews.size, 1, "Rejected requests never consume the preview: " + mode);
  }
}

main().then(checkPreviewGuards).then(() => console.log("Associate onboarding check passed.")).catch((error) => { console.error(error); rmSync(temporaryRoot, { recursive: true, force: true }); process.exit(1); });
