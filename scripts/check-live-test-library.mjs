import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { spawn } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import net from "node:net";
import { setTimeout as delay } from "node:timers/promises";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const repo = fileURLToPath(new URL("..", import.meta.url));
const root = mkdtempSync(path.join(os.tmpdir(), "iz-live-library-"));
const password = randomUUID();
const seed = JSON.parse(readFileSync(new URL("../data/default-state.json", import.meta.url), "utf8"));
seed.accounts = ["admin", "instructor-a", "instructor-b", "member"].map(id => ({
  id, name: id, email: `${id}@example.test`, password, role: id.startsWith("instructor") ? "instructor" : id,
  memberId: `${id}-member`, associateId: `${id}-associate`
}));
seed.members = seed.accounts.map(a => ({ id: a.memberId, name: a.name, email: a.email, associateId: a.associateId, role: "Socio" }));
seed.associates = seed.accounts.map((a, i) => ({ id: a.associateId, firstName: a.name, lastName: "QA", email: a.email,
  status: "Activo", annualAmount: 0, associateNumber: i + 1, linkedAccountId: a.id, linkedMemberId: a.memberId }));
seed.testZoneQuestions = [1, 2, 3, 4].map(n => ({ id: `q${n}`, prompt: `Pregunta ${n}`, options: ["A", "B"],
  correctIndex: 0, explanation: "Correccion privada", active: n !== 4, deletedAt: n === 3 ? new Date().toISOString() : "", part: "QA", category: "QA" }));
seed.testZoneResults = []; seed.testZoneLiveSessions = []; seed.testZoneLivePresets = [];
for (const key of Object.keys(seed.settings.automation)) seed.settings.automation[key] = false;
seed.settings.smtp = {}; seed.emailOutbox = [];
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
    const payload = await res.json(); assert.equal(res.status, status, `${method} ${url}: ${JSON.stringify(payload)}`);
    if (url.startsWith("/api/test-zone/live-presets")) assert.equal(res.headers.get("cache-control"), "no-store");
    return payload;
  };
}
async function login(id) { const c = client(); await c("POST", "/api/login", { email: `${id}@example.test`, password }); return c; }
try {
  await start();
  const admin = await login("admin"), a = await login("instructor-a"), b = await login("instructor-b"), member = await login("member"), guest = client();
  const route = "/api/test-zone/live-presets";
  const data = { title: "Guardado <img src=x onerror=alert(1)>", questionIds: ["q2", "q1"], questionTimeLimitSeconds: 30 };
  for (const method of ["GET", "POST", "PUT", "DELETE"]) {
    const url = route + (["PUT", "DELETE"].includes(method) ? "/invented" : "");
    await guest(method, url, undefined, 401); await member(method, url, undefined, 403);
  }
  let own = (await a("POST", route, { ...data, createdByAccountId: "instructor-b", correctIndex: 0 }, 201)).preset;
  assert.equal(own.createdByAccountId, "instructor-a");
  assert.deepEqual(own.questionIds, data.questionIds);
  assert.ok(!/correctIndex|explanation|isCorrect/.test(JSON.stringify(own)));
  const other = (await b("POST", route, data, 201)).preset;
  await admin("POST", route, data, 201);
  for (let i = 0; i < 11; i++) await a("POST", route, { ...data, title: `Test ${i}` }, 201);
  assert.equal((await a("GET", route)).presets.length, 12);
  assert.deepEqual((await b("GET", route)).presets.map(p => p.id), [other.id]);
  assert.equal((await admin("GET", route)).presets.length, 1, "Library is personal for admins too");
  for (const verb of ["PUT", "DELETE"]) await b(verb, `${route}/${own.id}`, data, 404);
  for (const ids of [[], ["q1", "q1"], ["missing"], ["q3"], ["q4"], Array(101).fill("q1")]) {
    await a("POST", route, { ...data, questionIds: ids }, 400);
    await admin("POST", "/api/test-zone/live-sessions", { ...data, questionIds: ids }, 400);
  }
  await a("POST", route, { ...data, title: "X".repeat(33000) }, 413);
  await a("PUT", `${route}/${own.id}`, data, 409);
  const original = own;
  own = (await a("PUT", `${route}/${own.id}`, { ...own, title: "Actualizado", createdByAccountId: "member" })).preset;
  assert.equal(own.createdByAccountId, "instructor-a"); assert.notEqual(own.updatedAt, original.updatedAt);
  await a("PUT", `${route}/${own.id}`, original, 409);
  const scoped = await a("GET", "/api/state");
  assert.deepEqual(scoped.testZoneLivePresets, []);
  assert.deepEqual((await member("GET", "/api/state")).testZoneLivePresets, []);
  assert.ok(scoped.testZoneQuestions.every(q => !("correctIndex" in q)));
  await a("POST", "/api/state", { ...scoped, testZoneLivePresets: [] });
  const whole = await admin("GET", "/api/state");
  await admin("POST", "/api/state", { ...whole, testZoneLivePresets: [{ ...own, createdByAccountId: "member" }] });
  assert.equal((await a("GET", route)).presets.length, 12);
  const room1 = (await a("POST", "/api/test-zone/live-sessions", own, 201)).session;
  const room2 = (await a("POST", "/api/test-zone/live-sessions", own, 201)).session;
  assert.notEqual(room1.id, room2.id); assert.notEqual(room1.code, room2.code);
  const storedRooms = (await admin("GET", "/api/state")).testZoneLiveSessions;
  for (const room of storedRooms.filter(s => [room1.id, room2.id].includes(s.id))) {
    assert.deepEqual(room.questionIds, data.questionIds); assert.deepEqual(room.participants, []);
    assert.equal(room.questionTimeLimitSeconds, 30); assert.equal(room.status, "lobby");
  }
  await a("DELETE", `${route}/${own.id}`);
  assert.equal((await a("GET", route)).presets.length, 11);
  assert.equal((await a("GET", "/api/test-zone/live-sessions")).sessions.length, 2);
  await admin("POST", "/api/state", whole); // Stale state must not resurrect a deleted preset.
  assert.equal((await a("GET", route)).presets.length, 11);
  await stop(); await start();
  const restored = await login("instructor-a"), adminAgain = await login("admin");
  assert.equal((await restored("GET", route)).presets.length, 11);
  assert.deepEqual((await restored("GET", route)).presets[0].questionIds, data.questionIds);
  await adminAgain("PUT", "/api/admin/users/instructor-a", { role: "socio" });
  await restored("GET", route, undefined, 403);
  const ui = readFileSync(new URL("../public/assets/js/app/views/testView.js", import.meta.url), "utf8");
  const startFn = ui.indexOf("export async function submitPublicLiveForm(");
  const fn = ui.slice(startFn, ui.indexOf("\nasync function ", startFn)).replace("export ", "");
  let sent, reset = 0;
  const ctx = { FormData: class { constructor(form) { this.form = form; } get(key) { return this.form[key]; } },
    createLiveSession: async payload => { sent = payload; } };
  vm.runInNewContext(fn, ctx);
  await ctx.submitPublicLiveForm({ ...data, liveQuestionIds: JSON.stringify(data.questionIds), reset: () => reset++ });
  assert.deepEqual(Array.from(sent.questionIds), data.questionIds); assert.equal(sent.autoAdvance, true); assert.equal(reset, 1);
  await ctx.submitPublicLiveForm({ ...data, reset: () => reset++ });
  assert.ok(!("questionIds" in sent), "Direct random creation stays compatible");
  ctx.createLiveSession = async () => { throw new Error("Offline"); };
  await assert.rejects(ctx.submitPublicLiveForm({ reset: () => reset++ }), /Offline/);
  assert.equal(reset, 2, "Failed launch must preserve the form");
  console.log("Live library PASS: 12 saved tests, ownership, scope, payload limits, conflicts, exact selection, fresh rooms, non-destructive delete/state, restart and role revocation.");
} finally { await stop(); rmSync(root, { recursive: true, force: true }); }
