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

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
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
