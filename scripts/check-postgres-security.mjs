import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { randomBytes, createHash } from "node:crypto";
import fs from "node:fs";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { setTimeout as delay } from "node:timers/promises";
import { DatabaseSync } from "node:sqlite";

const require = createRequire(import.meta.url);
const { Client } = require("pg");
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const testUrl = new URL(process.env.TEST_DATABASE_URL || "postgresql://invalid/missing");
// Never fall back to DATABASE_URL. Only the disposable, explicitly named local CI DB is allowed.
assert.ok(["127.0.0.1", "localhost", "[::1]"].includes(testUrl.hostname), "TEST_DATABASE_URL must point to local disposable PostgreSQL");
assert.equal(testUrl.pathname, "/iz_security_ci", "Use the dedicated iz_security_ci test database");
const schema = "security_" + randomBytes(8).toString("hex");
const temp = fs.mkdtempSync(path.join(os.tmpdir(), "iz-postgres-security-"));
const admin = new Client({ connectionString: testUrl.href });
let lock, child, sqlite;
let logs = "";
const env = {};
for (const key of ["PATH", "HOME", "SystemRoot", "WINDIR", "TEMP", "TMP", "NO_PROXY", "no_proxy"]) {
  if (process.env[key]) env[key] = process.env[key];
}
const scopedUrl = new URL(testUrl);
scopedUrl.searchParams.set("options", `-c search_path=${schema}`);
Object.assign(env, { NODE_ENV: "test", HOST: "127.0.0.1", DATABASE_URL: scopedUrl.href,
  JWT_SECRET: randomBytes(32).toString("hex"), IZ_EMAIL_ENABLED: "false",
  IZ_DATA_DIR: path.join(temp, "data"), IZ_DEFAULT_STATE_PATH: path.join(temp, "seed.json"),
  IZ_PASSWORD_RESET_TEST_OUTBOX: path.join(temp, "outbox.json"), AUTOMATION_INTERVAL_MS: "3600000" });
fs.writeFileSync(env.IZ_DEFAULT_STATE_PATH, JSON.stringify({ accounts: [], members: [], associates: [], courses: [] }));
const clockPath = path.join(temp, "fixed-clock.cjs");
fs.writeFileSync(clockPath, `Date.now = () => ${Date.now()};\n`);
for (const key of Object.keys(process.env)) delete process.env[key];
Object.assign(process.env, env);
const db = require("../db");
const storage = require("../storage");
let base;
async function until(check, label) {
  for (let n = 0; n < 150; n++) { if (await check()) return; await delay(50); }
  throw Error("Timed out: " + label + "\n" + logs);
}
async function stop() {
  if (!child) return;
  const current = child; child = null;
  if (current.exitCode === null && current.signalCode === null) {
    const closed = once(current, "close"); current.kill(); await closed;
  }
}
async function start() {
  await stop();
  const probe = net.createServer(); probe.listen(0, "127.0.0.1"); await once(probe, "listening");
  const port = probe.address().port; await new Promise(resolve => probe.close(resolve));
  base = `http://127.0.0.1:${port}`;
  child = spawn(process.execPath, ["--require", clockPath, "server-entry.js"], {
    cwd: root, env: { ...env, PORT: String(port), IZ_BASE_URL: base }, stdio: ["ignore", "pipe", "pipe"]
  });
  child.stdout.on("data", data => { logs += data; }); child.stderr.on("data", data => { logs += data; });
  await until(async () => {
    if (child.exitCode !== null) throw Error("Test server exited\n" + logs);
    try { return (await fetch(base + "/healthz")).ok; } catch { return false; }
  }, "server ready");
}
async function request(url, body, headers = {}) {
  return fetch(base + url, { method: body ? "POST" : "GET", headers: { "Content-Type": "application/json", ...headers },
    ...(body ? { body: JSON.stringify(body) } : {}), signal: AbortSignal.timeout(15000) });
}
const email = "pg-security@example.test";
const original = randomBytes(20).toString("hex");
const replacement = randomBytes(20).toString("hex");
const selfPassword = randomBytes(20).toString("hex");
async function login(password, route = "/api/auth/login") {
  const response = await request(route, { email, password, rememberMe: true });
  assert.equal(response.status, 200, await response.clone().text());
  return { cookie: response.headers.get("set-cookie").split(";")[0], body: await response.json() };
}
async function rejectJwt(token) {
  for (const route of ["/api/auth/me", "/api/admin/users"]) {
    assert.equal((await request(route, null, { authorization: `Bearer ${token}` })).status, 401, route);
  }
}
async function rejectCookie(value) {
  const response = await request("/api/session", null, { cookie: value });
  assert.equal((await response.json()).ok, false, "Old cookie must not mint a current JWT");
  assert.equal((await request("/api/state", null, { cookie: value })).status, 401);
}
try {
  await admin.connect(); await admin.query(`CREATE SCHEMA ${schema}`);
  await db.initDatabase();
  const user = await db.createUser({ name: "Synthetic security account", email, password: original, role: "admin" });
  const seed = storage.readState();
  seed.associates.push({ id: "pg-associate", firstName: "Synthetic", lastName: "Security", email,
    status: "Activo", associateNumber: "TEST-1", campusAccessStatus: "active" });
  storage.writeState(seed);
  await start();
  const first = await login(original);
  const oldJwt = first.body.session.jwt;
  const remembered = await login(original, "/api/login");
  const normal = await login(original); // last login may invalidate previous local hashes; JWT remains valid
  const rememberedAgain = await login(original, "/api/login");
  assert.equal((await request("/api/auth/me", null, { authorization: `Bearer ${oldJwt}` })).status, 200);
  assert.equal((await request("/api/password-recovery/request", { email })).status, 200);
  const outbox = JSON.parse(fs.readFileSync(env.IZ_PASSWORD_RESET_TEST_OUTBOX));
  const token = /[?&]token=([a-f0-9]+)/.exec(outbox.at(-1).text)?.[1];
  assert.ok(token);
  sqlite = new DatabaseSync(path.join(env.IZ_DATA_DIR, "campus.db"));
  lock = new Client({ connectionString: scopedUrl.href }); await lock.connect(); await lock.query("BEGIN");
  const lockPid = (await lock.query("SELECT pg_backend_pid() AS pid")).rows[0].pid;
  await lock.query("SELECT id FROM users WHERE id = $1 FOR UPDATE", [user.id]);
  const payload = { token, newPassword: replacement, confirmPassword: replacement };
  const firstReset = request("/api/password-recovery/reset", payload); firstReset.catch(() => {});
  await until(() => sqlite.prepare("SELECT used_at FROM password_reset_tokens WHERE token_hash = ?")
    .get(createHash("sha256").update(token).digest("hex"))?.used_at != null, "token claimed before PG write");
  assert.equal((await request("/api/password-recovery/reset", payload)).status, 400, "Concurrent request loses atomic claim");
  await until(async () => Number((await admin.query("SELECT count(*) AS count FROM pg_stat_activity WHERE $1 = ANY(pg_blocking_pids(pid))", [lockPid])).rows[0].count) >= 1, "reset blocked by real PG row lock");
  const profile = db.updateUser(user.id, { name: "Concurrent profile" }); profile.catch(() => {});
  await until(async () => Number((await admin.query("SELECT count(*) AS count FROM pg_stat_activity WHERE cardinality(pg_blocking_pids(pid)) > 0 AND query LIKE '%UPDATE users%' ")).rows[0].count) >= 2, "profile queued behind reset");
  const state = storage.readState();
  state.courses.push({ id: "concurrent-course", title: "Keep concurrent course", payments: [{ amount: 50, status: "paid" }] });
  storage.writeState(state);
  await lock.query("COMMIT"); await lock.end(); lock = null;
  assert.equal((await firstReset).status, 200); await profile;
  assert.equal(storage.readState().courses.find(item => item.id === "concurrent-course").title, "Keep concurrent course");
  assert.equal(storage.readState().courses.find(item => item.id === "concurrent-course").payments[0].amount, 50);
  assert.equal((await request("/api/password-recovery/reset", payload)).status, 400);
  assert.equal((await request("/api/auth/login", { email, password: original })).status, 401);
  await rejectJwt(oldJwt); await rejectCookie(normal.cookie); await rejectCookie(rememberedAgain.cookie);
  const current = await login(replacement);
  const newJwt = current.body.session.jwt;
  assert.equal(db.verifyAuthToken(oldJwt).iat, db.verifyAuthToken(newJwt).iat, "JWTs were issued in the same second");
  await start();
  await rejectJwt(oldJwt); await rejectCookie(first.cookie); await rejectCookie(remembered.cookie);
  assert.equal((await request("/api/auth/me", null, { authorization: `Bearer ${newJwt}` })).status, 200);
  assert.equal((await request("/api/password-recovery/reset", payload)).status, 400, "Consumed token stays consumed after restart");
  const fresh = await login(replacement, "/api/login");
  const changed = await request("/api/account/change-password", { accountId: fresh.body.session.accountId,
    currentPassword: replacement, newPassword: selfPassword, confirmPassword: selfPassword }, { cookie: fresh.cookie });
  assert.equal(changed.status, 200, await changed.clone().text());
  await rejectJwt(newJwt); await rejectCookie(fresh.cookie);
  assert.equal((await request("/api/login", { email, password: replacement })).status, 401, "Legacy login cannot reuse the old PG password");
  const afterChange = await login(selfPassword);
  await start(); await rejectJwt(newJwt);
  assert.equal((await request("/api/auth/me", null, { authorization: `Bearer ${afterChange.body.session.jwt}` })).status, 200);
  assert.equal(JSON.stringify(afterChange.body).includes("credentialVersion"), false);
  const adminPassword = randomBytes(20).toString("hex");
  const adminChange = await fetch(base + `/api/admin/users/${user.id}`, { method: "PUT",
    headers: { "Content-Type": "application/json", authorization: `Bearer ${afterChange.body.session.jwt}` },
    body: JSON.stringify({ password: adminPassword }) });
  assert.equal(adminChange.status, 200, await adminChange.clone().text());
  await rejectJwt(afterChange.body.session.jwt);
  const adminLogin = await login(adminPassword);
  const associateReset = await request("/api/associates/pg-associate/reset-password", {}, { cookie: adminLogin.cookie });
  assert.equal(associateReset.status, 200, await associateReset.clone().text());
  const temporaryPassword = (await associateReset.json()).associate.temporaryPassword;
  assert.ok(temporaryPassword);
  await rejectJwt(adminLogin.body.session.jwt);
  await start();
  await rejectJwt(adminLogin.body.session.jwt);
  await login(temporaryPassword);
  console.log("Real PostgreSQL: concurrent reset/profile, one-time token, same-second JWT, cookies, self-change and process restart PASS");
} catch (error) {
  console.error(error); process.exitCode = 1;
} finally {
  if (lock) { await lock.query("ROLLBACK").catch(() => {}); await lock.end(); }
  await stop(); sqlite?.close();
  await admin.query(`DROP SCHEMA IF EXISTS ${schema} CASCADE`).catch(() => {}); await admin.end();
  fs.rmSync(temp, { recursive: true, force: true });
}
