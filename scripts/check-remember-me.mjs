import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { mkdtempSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import net from "node:net";
import { fileURLToPath } from "node:url";
import { DatabaseSync } from "node:sqlite";
import { setTimeout as delay } from "node:timers/promises";
import vm from "node:vm";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const app = readFileSync(path.join(root, "public/app.js"), "utf8");
function appFunction(name) {
  const start = app.indexOf(`function ${name}(`);
  assert.ok(start >= 0, name);
  return app.slice(start, app.indexOf("\nfunction ", start + 1));
}
function sessionHarness(respond) {
  const requests = [], storage = new Map(), classes = new Map();
  let renders = 0, resets = 0;
  const element = id => ({ textContent: "", classList: { toggle: (name, active) => classes.set(`${id}:${name}`, active) } });
  const savedStorage = { getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value), removeItem: key => storage.delete(key) };
  const context = vm.createContext({
    URL, Request, structuredClone,
    window: { location: { origin: "https://campus.example.test", href: "https://campus.example.test/" }, fetch: async (...args) => { requests.push(args); return respond(...args); } },
    session: { accountId: "old", role: "admin" }, viewRole: "admin",
    state: { courses: [{ id: "qa", attendance: { pupil: 0 } }], accounts: [{ id: "old" }], members: [{ id: "pupil" }] },
    fallbackState: { courses: [], accounts: [], members: [], role: "admin" }, storageMeta: { private: true },
    journeyReport: {private:true}, journeyReportRequest: {},
    academicRoster: { students: [{ id: "pupil" }] }, academicBusy: false, syncStatus: "", loginStatus: "", passwordChangeStatus: "",
    campusGroupAttachmentDrafts: {}, campusGroupSessionEpoch: 0, campusGroupAutosaveIds: new Set(), campusGroupAutosaveRunning: false,
    campusGroupSaving: false, campusGroupPendingUploads: 0, campusGroupPendingFileReads: new Set(), campusGroupFileSelections: new Map(), pendingCampusGroupFileTarget: null,
    associateOnboardingPreview: {}, associateOnboardingSelection: new Set(["pupil"]), associateOnboardingResults: [{}],
    getFrontendBridge: () => ({ resetTestView: () => resets++ }), sessionStorage: savedStorage, localStorage: savedStorage,
    SESSION_KEY: "session", SESSION_BACKUP_KEY: "session-backup", VIEW_ROLE_KEY: "view", VIEW_ROLE_BACKUP_KEY: "view-backup", UI_SNAPSHOT_KEY: "snapshot",
    loginScreen: element("login"), loginStatusElement: element("login-status"), publicCampusStatusElement: null,
    passwordScreen: element("password"), changePasswordStatusElement: element("password-status"), renderPublicCampusCourseList() {},
    normalizeCampusAccountRole: role => role, canManageCourseAcademic: () => true,
    render: () => { renders++; context.renderLoginOverlay(); }, showToast: () => { renders++; context.renderLoginOverlay(); },
    refreshState: () => { throw new Error("A rejected mutation must not be retried or refreshed"); }
  });
  for (const key of ["session", "session-backup", "view", "view-backup", "snapshot"]) storage.set(key, "old-session");
  storage.set("campus_draft_old_qa", "account-scoped draft");
  vm.runInContext(["persistSession", "persistViewRole", "clearSession", "expireCampusSession", "renderLoginOverlay"].map(appFunction).join("\n"), context);
  vm.runInContext(app.slice(app.indexOf("const nativeFetch ="), app.indexOf("const ASSOCIATE_PAGE_SIZE =")), context);
  context.fetch = (...args) => context.window.fetch(...args);
  return { context, requests, storage, classes, renders: () => renders, resets: () => resets };
}
const unauthorized = () => new Response(JSON.stringify({ ok: false, error: "Inicia sesion para acceder al campus" }), { status: 401 });
for (const role of ["admin", "member", "instructor"]) {
  const h = sessionHarness(unauthorized);
  h.context.session.role = role;
  const response = await h.context.window.fetch("/api/courses/qa/academic", { cache: "no-store" });
  assert.equal(h.context.session, null, `${role}: a private 401 opens login instead of retaining the old view`);
  assert.equal(h.classes.get("login:visible"), true);
  assert.match(h.context.loginStatusElement.textContent, /sesión ha caducado/);
  assert.equal(h.context.academicRoster, null);
  assert.equal(h.context.journeyReport, null, "Expired sessions discard private participation history");
  assert.deepEqual(Array.from(h.context.state.accounts), []);
  assert.equal(h.context.storageMeta, null);
  for (const key of ["session", "session-backup", "view", "view-backup", "snapshot"]) assert.equal(h.storage.has(key), false);
  assert.equal(h.storage.get("campus_draft_old_qa"), "account-scoped draft");
  assert.equal(h.requests.length, 1, "Never replay a rejected request");
  assert.equal((await response.json()).error, "Inicia sesion para acceder al campus", "The caller can still consume the response");
}
for (const [url, options, status] of [
  ["/api/login", {}, 401], ["/api/session", {}, 401], ["/api/logout", {}, 401],
  ["/api/auth/login", {}, 401], ["/api/auth/register", {}, 401], ["/api/recovery-admin", {}, 401],
  ["/api/public-campus/register", {}, 401], ["/api/public/banners", {}, 401],
  ["/api/verify", {}, 401], ["/api/associates/applications/public/qa", {}, 401],
  ["/api/test-zone/live-sessions/qa/participant", {}, 401], ["/api/test-zone/live-sessions/qa/answer", {}, 401],
  ["/api/courses/qa/academic", { credentials: "omit" }, 401],
  [new Request("https://campus.example.test/api/courses/qa/academic", { credentials: "omit" }), {}, 401],
  ["https://campus.example.test.evil.test/api/private", {}, 401], ["//other.example.test/api/private", {}, 401],
  ["/template.jpg", {}, 401], ["/api/courses/qa/academic", {}, 403], ["/api/courses/qa/academic", {}, 500]
]) {
  const h = sessionHarness(() => new Response("{}", { status }));
  const identity = h.context.session;
  await h.context.window.fetch(url, options);
  assert.equal(h.context.session, identity, `${url}/${status}: does not invalidate the current campus session`);
}
for (const request of [new URL("https://campus.example.test/api/courses/qa/academic"), new Request("https://campus.example.test/api/courses/qa/academic")]) {
  const h = sessionHarness(unauthorized);
  await h.context.window.fetch(request);
  assert.equal(h.context.session, null, "URL and Request inputs use the same session handling");
}
for (const accountId of ["old", "new"]) {
  let finish;
  const h = sessionHarness(() => new Promise(resolve => { finish = resolve; }));
  const pending = h.context.window.fetch("/api/courses/qa/academic");
  const newer = { accountId, role: "member" };
  h.context.session = newer;
  finish(unauthorized()); await pending;
  assert.equal(h.context.session, newer, "A late 401 cannot sign out a newer login");
  assert.equal(h.resets(), 0);
}
{
  const finishes = [];
  const h = sessionHarness(() => new Promise(resolve => finishes.push(resolve)));
  const a = h.context.window.fetch("/api/courses/qa/academic"), b = h.context.window.fetch("/api/storage");
  finishes[0](unauthorized()); await a;
  finishes[1](unauthorized()); await b;
  assert.equal(h.resets(), 1, "Concurrent 401 responses clear the expired session once");
}
{
  const h = sessionHarness(() => { throw new TypeError("offline"); });
  const identity = h.context.session;
  await assert.rejects(h.context.window.fetch("/api/courses/qa/academic"), /offline/);
  assert.equal(h.context.session, identity, "A connection error does not sign out the user");
}
{
  const h = sessionHarness(unauthorized);
  vm.runInContext(app.slice(app.indexOf("async function loadCourseAcademicRoster("), app.indexOf("async function invokeCourseAcademicAction(")), h.context);
  h.context.readJsonResponse = response => response.json();
  await h.context.loadCourseAcademicRoster("qa");
  assert.equal(h.context.session, null);
  assert.equal(h.context.academicRoster, null);
  assert.equal(h.classes.get("login:visible"), true);
  assert.equal(h.requests.length, 1, "Updating the roster opens login without retrying");
}
{
  const h = sessionHarness(unauthorized);
  vm.runInContext(appFunction("invokeCourseAcademicAction").replace(/^function /, "async function "), h.context);
  h.context.readJsonResponse = response => response.json();
  await h.context.invokeCourseAcademicAction("qa", "pupil", { attendance: 100, evaluation: "Apto" });
  assert.equal(h.context.session, null);
  assert.equal(h.context.academicBusy, false);
  assert.equal(h.context.academicRoster, null);
  assert.equal(h.requests.length, 1, "Rejected academic mutation is never repeated automatically");
  assert.equal(h.requests[0][1].method, "PATCH");
}
console.log("Expired-session UI checks passed (private 401, login screen, role/storage cleanup, no mutation replay, late responses and network/permission errors).");
const dir = mkdtempSync(path.join(tmpdir(), "iz-remember-"));
const seedPath = path.join(dir, "seed.json");
const seed = JSON.parse(readFileSync(path.join(root, "data/default-state.json"), "utf8"));
const account = seed.accounts[0];
Object.assign(account, { password: "Remember-test-2026", passwordHash: "", associateId: "" });
writeFileSync(seedPath, JSON.stringify(seed));
let child;
let origin;
let db;
async function start() {
  const probe = net.createServer();
  probe.listen(0, "127.0.0.1");
  await once(probe, "listening");
  const port = probe.address().port;
  await new Promise(resolve => probe.close(resolve));
  origin = `http://127.0.0.1:${port}`;
  child = spawn(process.execPath, ["server.js"], {
    cwd: root,
    env: { ...process.env, PORT: String(port), HOST: "127.0.0.1", NODE_ENV: "test",
      IZ_DATA_DIR: dir, IZ_DEFAULT_STATE_PATH: seedPath, DATABASE_URL: "",
      IZ_RECOVERY_ADMIN_EMAIL: "", IZ_RECOVERY_ADMIN_PASSWORD: "", IZ_BASE_URL: "https://example.test" },
    stdio: ["ignore", "pipe", "pipe"]
  });
  let logs = "";
  child.stdout.on("data", chunk => { logs += chunk; });
  child.stderr.on("data", chunk => { logs += chunk; });
  for (let i = 0; i < 100; i++) {
    if (child.exitCode !== null) throw new Error(logs);
    try { if ((await fetch(`${origin}/healthz`)).ok) return; } catch {}
    await delay(100);
  }
  throw new Error(`Server failed to start: ${logs}`);
}
async function stop() {
  if (!child || child.exitCode !== null) return;
  const exited = once(child, "exit");
  child.kill();
  await exited;
}
async function request(route, body, cookie = "") {
  const res = await fetch(origin + route, {
    method: body === undefined ? "GET" : "POST",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    ...(body === undefined ? {} : { body: JSON.stringify(body) })
  });
  return { res, payload: await res.json(), cookie: res.headers.get("set-cookie") || "" };
}
async function login(rememberMe) {
  const result = await request("/api/login", { email: account.email, password: account.password, rememberMe });
  assert.equal(result.payload.ok, true);
  return result;
}
try {
  await start();
  const ordinary = await login(false);
  assert.doesNotMatch(ordinary.cookie, /Max-Age|Expires/i);
  const remembered = await login(true);
  assert.match(remembered.cookie, /Max-Age=2592000/);
  assert.match(remembered.cookie, /HttpOnly/);
  assert.match(remembered.cookie, /SameSite=Lax/);
  assert.match(remembered.cookie, /; Secure/);
  const cookie = remembered.cookie.split(";")[0];
  db = new DatabaseSync(path.join(dir, "campus.db"));
  const row = db.prepare("SELECT * FROM remembered_sessions").get();
  assert.equal(row.token_hash.length, 64);
  assert.notEqual(row.token_hash, cookie.split("=")[1]);
  assert.equal(JSON.stringify(remembered.payload).includes(cookie.split("=")[1]), false);
  await stop();
  await start();
  assert.equal((await request("/api/session", undefined, cookie)).payload.session.accountId, account.id,
    "Remembered login survives a restart without browser sessionStorage");
  assert.equal((await request("/api/session", undefined, ordinary.cookie.split(";")[0])).payload.ok, false);
  const logout = await request("/api/logout", {}, cookie);
  assert.match(logout.cookie, /Max-Age=0/);
  assert.equal((await request("/api/session", undefined, cookie)).payload.ok, false, "Logout revokes server session");

  const expiring = (await login(true)).cookie.split(";")[0];
  db.prepare("UPDATE remembered_sessions SET expires_at = ?").run(Date.now() - 1000);
  assert.equal((await request("/api/session", undefined, expiring)).payload.ok, false, "Server enforces expiry");
  const first = (await login(true)).cookie.split(";")[0];
  const second = (await login(true)).cookie.split(";")[0];
  assert.equal((await request("/api/session", undefined, first + "tampered")).payload.ok, false);
  const changed = await request("/api/account/change-password", {
    accountId: account.id, currentPassword: account.password,
    newPassword: "Changed-test-2026", confirmPassword: "Changed-test-2026"
  }, first);
  assert.equal(changed.payload.ok, true);
  assert.match(changed.cookie, /Max-Age=2592000/);
  assert.equal((await request("/api/session", undefined, second)).payload.ok, false, "Password change invalidates other remembered devices");
  assert.equal((await request("/api/session", undefined, first)).payload.ok, false, "Password change rotates current token");
  const rotated = changed.cookie.split(";")[0];
  assert.equal((await request("/api/session", undefined, rotated)).payload.ok, true);
  const stateRow = db.prepare("SELECT value FROM app_state WHERE key = 'campus_state'").get();
  const state = JSON.parse(stateRow.value);
  state.accounts.find(item => item.id === account.id).associateId = "blocked-test";
  state.associates.push({ id: "blocked-test", status: "Baja" });
  db.prepare("UPDATE app_state SET value = ? WHERE key = 'campus_state'").run(JSON.stringify(state));
  assert.equal((await request("/api/session", undefined, rotated)).payload.ok, false, "Deactivated member cannot reuse session");
  console.log("Remember-me integration checks passed (restart, cookies, logout, expiry, password change, revoked access).");
} finally {
  await stop();
  db?.close();
  rmSync(dir, { recursive: true, force: true });
}
