import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { once } from "node:events";
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { fileURLToPath } from "node:url";

const repo = fileURLToPath(new URL("../", import.meta.url));
const root = mkdtempSync(path.join(os.tmpdir(), "iz-backup-recovery-"));
const sourceDir = path.join(root, "source");
const password = `Recovery-${randomUUID()}`;
const proofBytes = Buffer.from("Synthetic payment proof for recovery QA\n");
const groupBytes = Buffer.from("Synthetic campus document\n");
const seed = JSON.parse(readFileSync(path.join(repo, "data/default-state.json"), "utf8"));
for (const account of seed.accounts) {
  account.password = password;
  account.passwordHash = "";
}
for (const key of Object.keys(seed.settings.automation)) seed.settings.automation[key] = false;
seed.settings.smtp = {};
seed.emailOutbox = [];
for (let i = 0; i < 2; i++) {
  const member = seed.members[i], associate = seed.associates[i];
  associate.email = member.email;
  associate.linkedMemberId = member.id;
  associate.yearlyFees = { [new Date().getFullYear()]: associate.annualAmount };
  member.associateId = associate.id;
  member.dni = "12345678A";
  seed.accounts.find(account => account.memberId === member.id).associateId = associate.id;
}
const course = seed.courses[0];
course.enrolledIds = ["member-1"];
course.diplomaReady = ["member-1"];
course.attendance = { "member-1": 100 };
course.evaluations = { "member-1": "Apto" };
const diplomaCode = `IZ-${course.startDate.slice(0, 4)}-${course.id.split("-")[1]}-1`;
seed.testZoneQuestions = [{ id: "recovery-question", prompt: "Recovery question", options: ["A", "B"], correctIndex: 0, explanation: "Synthetic explanation", active: true }];
seed.testZoneResults = [];
seed.testZoneReviewMarks = [];
seed.campusGroups = [{
  id: "recovery-group", title: "Recovery group", allowedMemberIds: ["member-1"],
  modules: [{ id: "recovery-module", title: "Recovery module", documents: [{
    id: "recovery-document", title: "Recovery document", attachment: {
      name: "document.txt", type: "text/plain", size: groupBytes.length, contentBase64: groupBytes.toString("base64")
    }
  }] }]
}];
const seedPath = path.join(root, "seed.json");
writeFileSync(seedPath, JSON.stringify(seed));
const probe = net.createServer();
probe.listen(0, "127.0.0.1");
await once(probe, "listening");
const port = probe.address().port;
await new Promise(resolve => probe.close(resolve));
const base = `http://127.0.0.1:${port}`;
let server;

async function start(dataDir) {
  const env = {
    ...process.env, NODE_ENV: "test", HOST: "127.0.0.1", PORT: String(port), DATABASE_URL: "",
    IZ_DATA_DIR: dataDir, IZ_DEFAULT_STATE_PATH: seedPath, IZ_BASE_URL: base,
    IZ_AUTOMATIC_BACKUP_INTERVAL_MS: "0", IZ_MAX_AUTOMATIC_BACKUPS: "30", AUTOMATION_INTERVAL_MS: "86400000",
    IZ_RECOVERY_ADMIN_PASSWORD: ""
  };
  for (const key of Object.keys(env)) if (key.startsWith("SMTP_") || key.startsWith("IZ_BOOTSTRAP_ADMIN_")) env[key] = "";
  server = spawn(process.execPath, ["server.js"], { cwd: repo, env, stdio: ["ignore", "pipe", "pipe"] });
  // Never print a snapshot or server output: backups contain authentication material.
  server.stdout.resume();
  server.stderr.resume();
  let spawnError;
  server.on("error", error => { spawnError = error; });
  for (let i = 0; i < 100; i++) {
    if (spawnError) throw spawnError;
    if (server.exitCode !== null) throw new Error(`Recovery fixture server exited (${server.exitCode})`);
    try {
      const response = await fetch(base + "/healthz", { signal: AbortSignal.timeout(1000) });
      await response.arrayBuffer();
      if (response.ok) return;
    } catch {}
    await delay(100);
  }
  throw new Error("Recovery fixture server did not start");
}

async function stop() {
  if (server && server.exitCode === null && server.signalCode === null) {
    const exited = once(server, "exit");
    server.kill();
    await exited;
  }
}

async function request(route, cookie = "", method = "GET", body, status = 200) {
  const response = await fetch(base + route, {
    method, signal: AbortSignal.timeout(10000), headers: { Cookie: cookie, "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  assert.equal(response.status, status, `${method} ${route}`);
  return response;
}

async function login(email) {
  const response = await request("/api/login", "", "POST", { email, password });
  await response.arrayBuffer();
  return response.headers.getSetCookie().map(value => value.split(";")[0]).join("; ");
}

async function json(route, cookie = "", method = "GET", body, status = 200) {
  return (await request(route, cookie, method, body, status)).json();
}

async function checkRecovered(expected, resultId, proofName, withUploads) {
  const admin = await login("admin@isocronazero.org");
  const member = await login("lucia@isocronazero.org");
  const other = await login("javier@isocronazero.org");
  const actual = await json("/api/storage/export-state", admin);
  for (const collection of ["members", "associates", "courses", "campusGroups", "testZoneQuestions", "testZoneResults", "testZoneReviewMarks", "associatePaymentSubmissions"]) {
    assert.deepEqual(actual[collection], expected[collection], `${collection} survives recovery`);
  }
  const restoredAccount = actual.accounts.find(account => account.id === "account-1");
  assert.ok(restoredAccount.passwordHash, "Recovery keeps password hashes");
  assert.ok(!restoredAccount.password, "Recovery does not restore plaintext passwords");
  const ownHistory = await json("/api/test-zone/results/me", member);
  assert.ok(ownHistory.results.some(result => result.id === resultId));
  assert.equal((await json("/api/test-zone/results/me", other)).results.some(result => result.id === resultId), false);
  const scoped = await json("/api/state", member);
  assert.ok(!scoped.testZoneLiveSessions?.length);
  assert.ok(!scoped.testZoneQuestions?.some(question => question.correctIndex !== undefined));
  const attachmentUrl = new URL(scoped.campusGroups[0].modules[0].documents[0].attachment.transportUrl, base);
  const attachmentRoute = attachmentUrl.pathname + attachmentUrl.search;
  assert.deepEqual(Buffer.from(await (await request(attachmentRoute, member)).arrayBuffer()), groupBytes);
  await (await request(attachmentRoute, other, "GET", undefined, 403)).arrayBuffer();
  const proofRoute = `/api/associates/files/${encodeURIComponent(proofName)}`;
  const proof = await request(proofRoute, admin, "GET", undefined, withUploads ? 200 : 404);
  if (withUploads) assert.deepEqual(Buffer.from(await proof.arrayBuffer()), proofBytes);
  else await proof.arrayBuffer();
  await (await request(proofRoute, "", "GET", undefined, 401)).arrayBuffer();
  assert.equal((await json(`/api/verify?code=${encodeURIComponent(diplomaCode)}`)).diploma.code, diplomaCode);
  const pdf = await request(`/api/diplomas/${course.id}/member-1.pdf`, member);
  assert.equal(Buffer.from(await pdf.arrayBuffer()).subarray(0, 5).toString(), "%PDF-");
  await (await request(`/api/diplomas/${course.id}/member-1.pdf`, other, "GET", undefined, 403)).arrayBuffer();
}

try {
  await start(sourceDir);
  const admin = await login("admin@isocronazero.org");
  const member = await login("lucia@isocronazero.org");
  await (await request("/api/storage/export-state", "", "GET", undefined, 401)).arrayBuffer();
  await (await request("/api/storage/export-state", member, "GET", undefined, 403)).arrayBuffer();
  await json("/api/associate-payments/submit", member, "POST", {
    year: String(new Date().getFullYear()), amount: 10, method: "Transferencia", note: "Synthetic recovery fixture",
    proofFile: { name: "proof.txt", type: "text/plain", contentBase64: proofBytes.toString("base64") }
  });
  const result = await json("/api/test-zone/results", member, "POST", {
    title: "Recovery test", questionIds: ["recovery-question"], answers: [1], mode: "exam", source: "bank"
  }, 201);
  await json("/api/test-zone/review-marks", member, "POST", { questionId: "recovery-question" });
  const exported = await request("/api/storage/export-state", admin);
  const exportCacheControl = exported.headers.get("cache-control");
  const snapshot = await exported.text();
  const expected = JSON.parse(snapshot);
  const proofName = expected.associatePaymentSubmissions[0].proofFile;
  assert.ok(proofName);
  await checkRecovered(expected, result.result.id, proofName, true);
  await stop();

  const automatic = readdirSync(path.join(sourceDir, "backups"))
    .filter(name => /^campus-backup-.*\.json$/.test(name)).sort().reverse()
    .map(name => readFileSync(path.join(sourceDir, "backups", name), "utf8"))
    .find(raw => JSON.parse(raw).testZoneReviewMarks.some(mark => mark.questionId === "recovery-question"));
  assert.ok(automatic, "Automatic backup contains the latest committed exercise");

  // Restore to new directories with NO SQLite file: this tests recovery, not a restart of the original DB.
  for (const [name, raw] of [["export", snapshot], ["automatic", automatic]]) {
    const destination = path.join(root, `restored-${name}`);
    mkdirSync(destination);
    writeFileSync(path.join(destination, "state.json"), raw);
    assert.equal(existsSync(path.join(destination, "campus.db")), false);
    if (name === "automatic") cpSync(path.join(sourceDir, "uploads"), path.join(destination, "uploads"), { recursive: true });
    await start(destination);
    await checkRecovered(JSON.parse(raw), result.result.id, proofName, name === "automatic");
    await stop();
    if (name === "export") {
      // A JSON-only restore cannot recover filesystem attachments; adding uploads must recover exact bytes.
      cpSync(path.join(sourceDir, "uploads"), path.join(destination, "uploads"), { recursive: true });
      await start(destination);
      await checkRecovered(expected, result.result.id, proofName, true);
      await stop();
    }
  }
  assert.equal(exportCacheControl, "no-store", "Sensitive backup downloads must never be cached");
  console.log("Backup recovery passed: export and automatic snapshot, fresh SQLite, hashes/login, documents, payment files, diplomas, test history/marks and permission isolation.");
} finally {
  await stop();
  const resolved = path.resolve(root);
  assert.equal(path.dirname(resolved), path.resolve(os.tmpdir()));
  assert.ok(path.basename(resolved).startsWith("iz-backup-recovery-"));
  rmSync(resolved, { recursive: true, force: true });
}
