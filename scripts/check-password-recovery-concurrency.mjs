import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import { once } from "node:events";
import { createHash } from "node:crypto";
import { DatabaseSync } from "node:sqlite";

// Real HTTP + SQLite/storage; barriers replace only external mail and PostgreSQL I/O.
// No live service, credentials or production data are used.
const require = createRequire(import.meta.url);
const temp = fs.mkdtempSync(path.join(os.tmpdir(), "iz-reset-concurrency-"));
const seedPath = path.join(temp, "seed.json");
const account = { id: "reset-account", email: "reset@example.test", name: "Synthetic Reset", role: "member", password: "Original-1234" };
fs.writeFileSync(seedPath, JSON.stringify({ accounts: [account], courses: [], associates: [], auditLog: [] }));
for (const name of Object.keys(process.env)) {
  if (!new Set(["PATH", "HOME", "SystemRoot", "WINDIR", "TEMP", "TMP", "NO_PROXY", "no_proxy"]).has(name)) delete process.env[name];
}
Object.assign(process.env, { NODE_ENV: "test", IZ_DATA_DIR: temp, IZ_DEFAULT_STATE_PATH: seedPath, IZ_EMAIL_ENABLED: "false" });

function barrier() {
  let release, enter;
  const entered = new Promise(resolve => { enter = resolve; });
  const pending = new Promise(resolve => { release = resolve; });
  return { entered, release, async wait() { enter(); await pending; } };
}
const storage = require("../storage");
const auth = require("../server/auth");
const db = require("../db");
const mail = require("../server/mail-delivery");
let mailBarrier, updateBarrier, failUpdate = false, failLookup = false, updates = 0;
const messages = [];
db.isDatabaseEnabled = () => true;
db.findUserByEmail = async () => {
  if (failLookup) throw Error("Synthetic lookup failure");
  return { id: "postgres-user", email: account.email };
};
db.updateUser = async (_id, payload) => {
  updates++;
  if (updateBarrier && updates === 1) await updateBarrier.wait();
  if (failUpdate) throw Error("Synthetic database failure");
  assert.equal(payload.password, "Changed-1234");
};
mail.getMailSettings = () => ({});
mail.isMailReady = () => true;
mail.sendMail = async (_settings, message) => {
  messages.push(message);
  if (mailBarrier) await mailBarrier.wait();
};
require("../server/password-recovery-bootstrap").installPasswordRecovery();
const server = require("node:http").createServer((_req, res) => { res.statusCode = 404; res.end(); });
server.listen(0, "127.0.0.1");
await once(server, "listening");
const base = `http://127.0.0.1:${server.address().port}`;
const sqlite = new DatabaseSync(path.join(temp, "campus.db"));
let ip = 0;
async function post(route, body) {
  const response = await fetch(base + route, {
    method: "POST", headers: { "Content-Type": "application/json", "X-Forwarded-For": `203.0.113.${++ip}` },
    body: JSON.stringify(body), signal: AbortSignal.timeout(5000)
  });
  return { status: response.status, body: await response.json() };
}
const request = () => post("/api/password-recovery/request", { email: account.email });
const reset = token => post("/api/password-recovery/reset", { token, newPassword: "Changed-1234", confirmPassword: "Changed-1234" });
const latestToken = () => messages.at(-1).text.match(/[?&]reset=([0-9a-f]{64})/)[1];
const tokenRow = token => sqlite.prepare("SELECT * FROM password_reset_tokens WHERE token_hash = ?")
  .get(createHash("sha256").update(token).digest("hex"));

try {
  // P1: a completed payment/course save must survive delayed recovery mail delivery.
  mailBarrier = barrier();
  const sending = request(); sending.catch(() => {});
  await Promise.race([mailBarrier.entered, sending.then(() => { throw Error("Mail barrier was not reached"); })]);
  let state = storage.readState();
  state.courses.push({ id: "concurrent-course", title: "Created during delivery" });
  state.settings.paymentReference = "paid-during-mail";
  auth.setLegacyAccountPassword(state.accounts[0], "Changed-during-mail");
  storage.writeState(state);
  const concurrentHash = storage.readState().accounts[0].passwordHash;
  mailBarrier.release();
  assert.equal((await sending).status, 200);
  state = storage.readState();
  assert.equal(state.courses[0].title, "Created during delivery");
  assert.equal(state.settings.paymentReference, "paid-during-mail");
  assert.equal(state.accounts[0].passwordHash, concurrentHash, "Mail audit must not revert another password change");
  assert.ok(state.auditLog.some(event => event.action === "password-reset-requested"));
  mailBarrier = null;

  // P2: keep request one suspended inside PostgreSQL while request two uses the same token.
  updateBarrier = barrier();
  const token = latestToken();
  const first = reset(token); first.catch(() => {});
  await Promise.race([updateBarrier.entered, first.then(() => { throw Error("Update barrier was not reached"); })]);
  const second = await reset(token);
  assert.equal(second.status, 400, "Concurrent reuse must fail before reaching PostgreSQL");
  assert.equal(updates, 1, "Only the winner may write a password");
  assert.ok(tokenRow(token).used_at, "The token is already consumed while the winner is awaiting PostgreSQL");
  state = storage.readState();
  state.courses[0].title = "Edited during PostgreSQL update";
  state.settings.paymentReference = "paid-during-reset";
  storage.writeState(state);
  updateBarrier.release();
  assert.equal((await first).status, 200);
  updateBarrier = null;
  state = storage.readState();
  assert.equal(state.courses[0].title, "Edited during PostgreSQL update", "Reset must reload state after PostgreSQL I/O");
  assert.equal(state.settings.paymentReference, "paid-during-reset");
  assert.ok(auth.verifyLegacyAccountPassword(state.accounts[0], "Changed-1234"));
  assert.equal((await reset(token)).status, 400, "Sequential replay is also rejected");

  // Fail closed: an uncertain external update never makes the consumed token reusable.
  await request();
  const failedToken = latestToken();
  failUpdate = true;
  assert.equal((await reset(failedToken)).status, 500);
  assert.equal((await reset(failedToken)).status, 400);
  assert.ok(tokenRow(failedToken).used_at);
  assert.equal(updates, 2);
  failUpdate = false;

  await request();
  const expiredToken = latestToken();
  sqlite.prepare("UPDATE password_reset_tokens SET expires_at = 0 WHERE token_hash = ?").run(tokenRow(expiredToken).token_hash);
  assert.equal((await reset(expiredToken)).status, 400);
  assert.equal(updates, 2, "Expired tokens never reach the database");
  state = storage.readState();
  state.accounts.push({ ...account, id: "lookup-failure", email: "lookup-failure@example.test", source: "postgres" });
  storage.writeState(state);
  const count = sqlite.prepare("SELECT count(*) AS count FROM password_reset_tokens").get().count;
  failLookup = true;
  assert.equal((await post("/api/password-recovery/request", { email: "lookup-failure@example.test" })).status, 200);
  assert.equal(sqlite.prepare("SELECT count(*) AS count FROM password_reset_tokens").get().count, count,
    "A failed PostgreSQL lookup must not issue a local-only reset token");
  assert.equal(messages.length, 3);
  console.log("Password recovery concurrency and stale-state regressions: PASS");
} catch (error) {
  console.error(error);
  process.exitCode = 1;
} finally {
  mailBarrier?.release();
  updateBarrier?.release();
  server.closeAllConnections();
  await new Promise(resolve => server.close(resolve));
  sqlite.close();
  fs.rmSync(temp, { recursive: true, force: true });
}
