import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { spawn } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import net from "node:net";
import { setTimeout as delay } from "node:timers/promises";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const require = createRequire(import.meta.url);
const auth = require("../server/auth");
const repo = fileURLToPath(new URL("..", import.meta.url));
const root = mkdtempSync(path.join(os.tmpdir(), "iz-instructor-check-"));
const password = randomUUID();
const seed = JSON.parse(readFileSync(new URL("../data/default-state.json", import.meta.url), "utf8"));
seed.accounts = ["admin", "instructor-a", "instructor-b", "member"].map(id => ({
  id, name: id, email: `${id}@example.test`, password, role: id.startsWith("instructor") ? "instructor" : id,
  memberId: `${id}-member`, associateId: `${id}-associate`
}));
seed.members = seed.accounts.map(a => ({ id: a.memberId, name: a.name, email: a.email, associateId: a.associateId, role: "Socio" }));
seed.associates = seed.accounts.map((a, i) => ({ id: a.associateId, firstName: a.name, lastName: "QA", email: a.email,
  status: "Activo", annualAmount: 0, associateNumber: i + 1, linkedAccountId: a.id, linkedMemberId: a.memberId }));
seed.testZoneQuestions = [1, 2].map(n => ({ id: `q${n}`, prompt: `Pregunta ${n}`, options: ["A", "B", "C"],
  correctIndex: 0, explanation: "Solo correccion interna", active: true, part: "QA", category: "QA" }));
seed.testZoneResults = []; seed.testZoneLiveSessions = [];
seed.campusGroups = [{ id: "group", title: "Biblioteca QA", modules: [] }];
writeFileSync(path.join(root, "seed.json"), JSON.stringify(seed));
const port = await new Promise(resolve => { const s = net.createServer(); s.listen(0, "127.0.0.1", () => {
  const port = s.address().port; s.close(() => resolve(port));
}); });
const base = `http://127.0.0.1:${port}`;
let child, logs = "";
async function start() {
  child = spawn(process.execPath, ["server.js"], { cwd: repo, env: { ...process.env, NODE_ENV: "test", DATABASE_URL: "",
    IZ_DATA_DIR: path.join(root, "data"), IZ_DEFAULT_STATE_PATH: path.join(root, "seed.json"),
    PORT: String(port), HOST: "127.0.0.1", IZ_BASE_URL: base, AUTOMATION_INTERVAL_MS: "86400000",
    IZ_BOOTSTRAP_ADMIN_EMAIL: "", IZ_BOOTSTRAP_ADMIN_PASSWORD: "", SMTP_HOST: "" }, stdio: ["ignore", "pipe", "pipe"] });
  child.stdout.on("data", b => logs += b); child.stderr.on("data", b => logs += b);
  for (let i = 0; i < 100; i++) {
    try { if ((await fetch(`${base}/healthz`)).ok) return; } catch {}
    if (child.exitCode !== null) throw new Error(logs);
    await delay(50);
  }
  throw new Error(`Server startup failed: ${logs}`);
}
async function stop() { if (child && child.exitCode === null) await new Promise(resolve => { child.once("exit", resolve); child.kill(); }); }
function client() {
  let cookie = "";
  return async (method, url, body, status = 200) => {
    const res = await fetch(base + url, { method, headers: { "Content-Type": "application/json", Cookie: cookie },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
    if (res.headers.get("set-cookie")) cookie = res.headers.get("set-cookie").split(";")[0];
    const payload = await res.json(); assert.equal(res.status, status, `${method} ${url}: ${JSON.stringify(payload)}`); return payload;
  };
}
async function login(id) { const c = client(); await c("POST", "/api/login", { email: `${id}@example.test`, password }); return c; }
try {
  assert.equal(auth.mapPlatformRoleToLegacyAccountRole("instructor"), "instructor");
  const dbBridge = { accounts: [], members: [], associates: [] };
  assert.equal(auth.ensureLegacyAccountForDbUser(dbBridge, { id: "db-user", role: "instructor", email: "db@example.test", name: "QA" }).account.role, "instructor");
  await start();
  const admin = await login("admin"), a = await login("instructor-a"), b = await login("instructor-b"), member = await login("member"), guest = client();
  const route = "/api/test-zone/live-sessions";
  await guest("GET", route, undefined, 401); await member("GET", route, undefined, 403);
  await member("POST", route, { title: "No autorizado" }, 403);
  const own = (await a("POST", route, { title: "Sala A", questionCount: 2, createdByAccountId: "instructor-b" }, 201)).session;
  const other = (await b("POST", route, { title: "Sala B", questionCount: 1 }, 201)).session;
  const adminRoom = (await admin("POST", route, { title: "Sala Admin", questionCount: 1 }, 201)).session;
  assert.deepEqual((await a("GET", route)).sessions.map(s => s.id), [own.id]);
  assert.deepEqual((await b("GET", route)).sessions.map(s => s.id), [other.id]);
  assert.equal((await admin("GET", route)).sessions.length, 3);
  for (const verb of ["start", "reveal", "next", "finish", "close"]) {
    for (const id of [other.id, adminRoom.id]) await a("POST", `${route}/${id}/${verb}`, {}, 403);
  }
  await a("POST", route, { courseId: seed.courses[0].id }, 403);
  for (const url of ["/api/debug/storage", "/api/admin/banners", "/api/admin/users"]) await a("GET", url, undefined, 403);
  await a("POST", "/api/test-zone/questions", { prompt: "Unauthorized" }, 403);
  const state = await a("GET", "/api/state");
  assert.deepEqual(state.testZoneLiveSessions, []);
  assert.ok(state.testZoneQuestions.every(q => !("correctIndex" in q) && !("explanation" in q)));
  assert.ok(state.accounts.every(account => account.id === "instructor-a"));
  assert.ok(state.campusGroups.some(group => group.id === "group"));
  await a("POST", "/api/state", { ...state, accounts: [{ ...state.accounts[0], role: "admin" }] });
  await a("GET", "/api/debug/storage", undefined, 403);
  // The host can also participate, without granting control to ordinary members.
  const joined = await a("POST", "/api/test-zone/live/join", { guestName: "Instructor participante", code: own.code });
  assert.ok(joined.liveSession.participantId);
  assert.ok(!("correctIndex" in own));
  const started = (await a("POST", `${route}/${own.id}/start`, {})).session;
  assert.ok(!("correctIndex" in started));
  assert.ok(!("correctIndex" in (await a("GET", route)).sessions[0]));
  const revealed = (await a("POST", `${route}/${own.id}/reveal`, {})).session;
  assert.equal(revealed.currentQuestionId, started.currentQuestionId);
  assert.equal(revealed.correctIndex, 0);
  assert.ok(!("explanation" in revealed) && !("questions" in revealed));
  assert.equal((await a("GET", route)).sessions[0].correctIndex, 0);
  await b("POST", `${route}/${own.id}/reveal`, {}, 403);
  assert.ok(!(await b("GET", route)).sessions.some(s => s.id === own.id));
  const scopedAfterReveal = await a("GET", "/api/state");
  assert.deepEqual(scopedAfterReveal.testZoneLiveSessions, []);
  assert.ok(scopedAfterReveal.testZoneQuestions.every(q => !("correctIndex" in q)));
  const next = (await a("POST", `${route}/${own.id}/next`, {})).session;
  assert.notEqual(next.currentQuestionId, revealed.currentQuestionId);
  assert.ok(!("correctIndex" in next));
  assert.ok(!("correctIndex" in (await a("GET", route)).sessions[0]));
  await a("POST", `${route}/${own.id}/reveal`, {});
  const finished = await a("POST", `${route}/${own.id}/finish`, {});
  assert.equal(finished.session.status, "finished");
  await stop(); await start();
  const restored = await login("instructor-a");
  assert.equal((await restored("GET", route)).sessions[0].id, own.id);
  const adminAgain = await login("admin");
  await adminAgain("PUT", "/api/admin/users/instructor-a", { role: "socio" });
  await restored("GET", route, undefined, 403);
  await restored("POST", `${route}/${own.id}/close`, {}, 403);
  // Demotion takes effect immediately, even with the same session cookie.
  await adminAgain("POST", `${route}/${other.id}/close`, {});
  const ui = readFileSync(new URL("../public/assets/js/app/views/testsView.js", import.meta.url), "utf8");
  const sourceOf = name => { const start = ui.indexOf(`function ${name}(`); return ui.slice(start, ui.indexOf("\nfunction ", start + 1)); };
  for (const host of [false, true]) {
    const ctx = { isAdminRole: r => r === "admin", getFrontendBridge: () => ({ store: { getState: () => ({ currentUser: { canHostLive: host } }) } }) };
    vm.runInNewContext(sourceOf("canHostPublicLive"), ctx);
    assert.equal(ctx.canHostPublicLive("member"), host);
    assert.equal(ctx.canHostPublicLive("admin"), true);
  }
  const testView = readFileSync(new URL("../public/assets/js/app/views/testView.js", import.meta.url), "utf8");
  const controlsStart = testView.indexOf("function buildLiveSessionControls(");
  const controls = testView.slice(controlsStart, testView.indexOf("\nfunction ", controlsStart + 1));
  const audienceQuestion = { id: revealed.currentQuestionId, prompt: "Pregunta", options: ["A", "B", "C"] };
  const ctx = { getCurrentQuestionMap: () => new Map([[audienceQuestion.id, audienceQuestion]]), escapeHtml: String };
  vm.runInNewContext(controls, ctx);
  assert.ok(ctx.buildLiveSessionControls(revealed).includes("Respuesta correcta:</strong> A. A"));
  assert.ok(!ctx.buildLiveSessionControls(started).includes("Respuesta correcta:"));
  assert.ok(!ctx.buildLiveSessionControls({ ...revealed, correctIndex: undefined }).includes("Respuesta correcta:"));
  audienceQuestion.correctIndex = 0;
  assert.ok(ctx.buildLiveSessionControls({ ...revealed, correctIndex: undefined }).includes("Respuesta correcta:</strong> A. A"));
  console.log("Instructor live checks passed: own rooms, participation, cross-host denial, no admin access, persistence, revocation and DB role mapping.");
} finally { await stop(); rmSync(root, { recursive: true, force: true }); }
