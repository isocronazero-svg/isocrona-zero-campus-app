import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { randomBytes, createHash } from "node:crypto";
import { once } from "node:events";
import { mkdtempSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import { createRequire } from "node:module";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const temp = mkdtempSync(path.join(os.tmpdir(), "iz-fixture-policy-"));
const originalEnv = { ...process.env };
const fixture = JSON.parse(readFileSync(path.join(root, "data/default-state.json"), "utf8"));
const privateSeed = JSON.parse(readFileSync(path.join(root, "data/qa-private-seed.json"), "utf8"));
const secret = randomBytes(32).toString("base64url");
const bootstrapEmail = "bootstrap-policy@example.test";
const require = createRequire(import.meta.url);
let child;

function isolatedEnv(extra = {}) {
  const env = {};
  for (const name of ["PATH", "SystemRoot", "WINDIR", "TEMP", "TMP", "HOME"]) {
    if (originalEnv[name]) env[name] = originalEnv[name];
  }
  return {
    ...env, NODE_ENV: "test", HOST: "127.0.0.1", DATABASE_URL: "",
    IZ_DATA_DIR: path.join(temp, "unit"), IZ_DEFAULT_STATE_PATH: path.join(root, "data/qa-private-seed.json"),
    IZ_EMAIL_ENABLED: "false", AUTOMATION_INTERVAL_MS: "3600000", ...extra
  };
}

async function stop() {
  if (!child) return;
  const current = child;
  child = null;
  if (current.exitCode === null && current.signalCode === null) {
    const closed = once(current, "close");
    current.kill();
    await closed;
  }
}

async function start(label, envName, seed, extra = {}) {
  await stop();
  const seedPath = path.join(temp, label + ".json");
  const dataDir = path.join(temp, label);
  writeFileSync(seedPath, JSON.stringify(seed));
  const probe = net.createServer();
  probe.listen(0, "127.0.0.1");
  await once(probe, "listening");
  const port = probe.address().port;
  await new Promise(resolve => probe.close(resolve));
  const base = "http://127.0.0.1:" + port;
  let logs = "";
  child = spawn(process.execPath, ["server.js"], {
    cwd: root, env: isolatedEnv({
      NODE_ENV: envName, PORT: String(port), IZ_BASE_URL: base,
      IZ_DATA_DIR: dataDir, IZ_DEFAULT_STATE_PATH: seedPath, ...extra
    }), stdio: ["ignore", "pipe", "pipe"]
  });
  child.stdout.on("data", chunk => { logs += chunk; });
  child.stderr.on("data", chunk => { logs += chunk; });
  for (let n = 0; n < 100; n++) {
    if (child.exitCode !== null) throw Error("Fixture policy server exited: " + label);
    try {
      if ((await fetch(base + "/healthz")).ok) return { base, dataDir, logs: () => logs };
    } catch {}
    await delay(100);
  }
  throw Error("Fixture policy server timeout: " + label);
}

async function login(server, account, status) {
  const response = await fetch(server.base + "/api/login", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: account.email, password: account.password, rememberMe: true })
  });
  assert.equal(response.status, status, "Unexpected fixture policy login status");
  if (status !== 200) {
    assert.equal(response.headers.get("set-cookie"), null, "Rejected login cannot issue a cookie");
    assert.equal((await response.json()).ok, false);
    return;
  }
  const cookie = response.headers.get("set-cookie").split(";")[0];
  assert.equal((await fetch(server.base + "/api/auth/me", { headers: { cookie } })).status, 200);
  return cookie;
}

try {
  // Mock PostgreSQL transport only; exercise the real db/auth policy without a remote database.
  for (const key of Object.keys(process.env)) delete process.env[key];
  Object.assign(process.env, isolatedEnv());
  const sessions = new Map();
  let unitState = structuredClone(privateSeed);
  require.cache[require.resolve("../storage")] = { exports: {
    readState: () => structuredClone(unitState),
    writeState: state => { unitState = structuredClone(state); },
    getStorageMeta: () => ({}),
    saveRememberedSession: (token, accountId, credentialHash, expiresAt) => sessions.set(token, { accountId, credentialHash, expiresAt }),
    readRememberedSession: token => sessions.get(token),
    deleteRememberedSession: token => sessions.delete(token)
  } };
  const rows = new Map();
  require("pg").Pool = class {
    async query(sql, args) {
      const row = /WHERE id =/.test(sql)
        ? rows.get(args[0])
        : [...rows.values()].find(item => item.email.toLowerCase() === args[0].toLowerCase());
      return { rows: row ? [row] : [] };
    }
  };
  const policy = require("../server/fixture-account-policy");
  const auth = require("../server/auth");
  const db = require("../db");
  const storage = require("../storage");
  const baseline = storage.readState();
  for (const role of ["admin", "member", "instructor"]) {
    const account = { ...fixture.accounts[1], role };
    for (const remember of [false, true]) {
      process.env.NODE_ENV = "development";
      const token = auth.createSessionToken(account, remember);
      const req = { headers: { cookie: "iz_session=" + token } };
      const state = { accounts: [account] };
      assert.ok(auth.getAuthenticatedAccount(req, state));
      process.env.NODE_ENV = "production";
      process.env.IZ_ALLOW_DEMO_ADMIN_IN_PRODUCTION = "true";
      assert.equal(auth.getAuthenticatedAccount(req, state), null, "Pre-existing fixture session must be revoked");
      assert.equal(auth.verifyLegacyAccountPassword(account, account.password), false);
      assert.throws(() => auth.createSessionToken(account, remember), /Credenciales invalidas/);
    }
  }
  const publicPassword = fixture.accounts[1].password;
  const renamed = { id: "renamed", email: "renamed@example.test", password: publicPassword };
  for (const encode of [
    account => account,
    account => auth.setLegacyAccountPassword(account, publicPassword),
    account => ({ ...account, password: "", passwordHash: createHash("sha256").update(publicPassword).digest("hex") }),
    account => ({ ...account, password: "", password_hash: db.hashPassword(publicPassword) })
  ]) {
    assert.equal(policy.canAuthenticateAccount(encode({ ...renamed })), false, "Renaming a public credential does not make it safe");
  }
  const real = { id: fixture.accounts[0].id, email: bootstrapEmail, role: "admin" };
  auth.setLegacyAccountPassword(real, secret);
  assert.equal(policy.canAuthenticateAccount(real), true, "Bootstrap may reuse a legacy ID without being a fixture");
  assert.equal(auth.verifyLegacyAccountPassword(real, secret), true);
  assert.equal(policy.canAuthenticateAccount({ ...real, email: fixture.accounts[1].email.toUpperCase() }), false);
  assert.equal(policy.canAuthenticateAccount({ ...real, email: "other@isocronazero.org" }), true, "Do not block the association domain");
  assert.equal(policy.canAuthenticateAccount({ ...real, email: "qa@example.test" }), true, "Do not block all QA accounts");
  const rotated = { ...real };
  auth.setLegacyAccountPassword(rotated, publicPassword);
  assert.equal(policy.canAuthenticateAccount(rotated), false, "Credential changes invalidate cached decisions");
  auth.setLegacyAccountPassword(rotated, secret);
  assert.equal(policy.canAuthenticateAccount(rotated), true);

  process.env.DATABASE_URL = "postgresql://fixture.invalid/test";
  process.env.IZ_JWT_SECRET = randomBytes(32).toString("hex");
  for (const account of [...fixture.accounts, { ...fixture.accounts[1], id: "instructor", role: "instructor" }, real]) {
    rows.set(account.id, { ...account, password_hash: db.hashPassword(account === real ? secret : publicPassword) });
    const row = rows.get(account.id);
    const request = { headers: { authorization: "Bearer " + db.signAuthToken(row) } };
    assert.equal(Boolean(await db.authenticateUser(row.email, account === real ? secret : publicPassword)), account === real);
    assert.equal(Boolean(await auth.getAuthenticatedDbUser(request)), account === real, "Bearer sessions must apply the same policy");
    process.env.NODE_ENV = "development";
    assert.ok(await auth.getAuthenticatedDbUser(request), "Development fixtures still work via bearer");
    process.env.NODE_ENV = "production";
  }
  rows.set("renamed", { ...renamed, password_hash: db.hashPassword(publicPassword) });
  assert.equal(await db.authenticateUser(renamed.email, publicPassword), null);
  assert.equal(await db.findAuthenticatableUserById("renamed"), null);
  assert.equal(await db.findAuthenticatableUserById("unknown"), null);
  assert.deepEqual(storage.readState(), baseline, "Policy must not rewrite persisted data");
  delete process.env.DATABASE_URL;

  const instructor = {
    id: "fixture-instructor", memberId: "member-4", role: "instructor",
    email: fixture.members.find(item => item.role === "Instructor").email, password: secret
  };
  const seed = structuredClone(fixture);
  seed.accounts.push(instructor);
  let rememberedCookie;
  for (const env of ["test", "development"]) {
    const server = await start(env, env, seed);
    for (const account of seed.accounts) {
      const cookie = await login(server, account, 200);
      if (env === "development" && account.id === fixture.accounts[1].id) rememberedCookie = cookie;
    }
  }
  const restarted = await start("development", "production", seed, { IZ_ALLOW_DEMO_ADMIN_IN_PRODUCTION: "true" });
  assert.equal((await fetch(restarted.base + "/api/auth/me", { headers: { cookie: rememberedCookie } })).status, 401,
    "A real SQLite remembered fixture session cannot survive a restart into production");
  const blocked = await start("production-fixtures", "production", seed, {
    IZ_ALLOW_DEMO_ADMIN_IN_PRODUCTION: "true",
    IZ_RECOVERY_ADMIN_EMAIL: instructor.email, IZ_RECOVERY_ADMIN_PASSWORD: secret
  });
  for (const account of seed.accounts) await login(blocked, account, 401);
  assert.equal(blocked.logs().includes(secret), false, "No recovery secret in logs");

  const membersOnly = structuredClone(seed);
  membersOnly.accounts = membersOnly.accounts.filter(account => account.role !== "admin");
  const memberServer = await start("production-members", "production", membersOnly);
  for (const account of membersOnly.accounts) await login(memberServer, account, 401);

  for (const [label, initial] of [["bootstrap-fixtures", fixture], ["bootstrap-private", privateSeed]]) {
    const server = await start(label, "production", initial, {
      IZ_BOOTSTRAP_ADMIN_EMAIL: bootstrapEmail, IZ_BOOTSTRAP_ADMIN_PASSWORD: secret,
      IZ_BOOTSTRAP_ADMIN_NAME: "Private QA administrator"
    });
    await login(server, { email: bootstrapEmail, password: secret }, 200);
    for (const account of fixture.accounts) await login(server, account, 401);
    const stored = JSON.parse(readFileSync(path.join(server.dataDir, "state.json"), "utf8"));
    const admin = stored.accounts.find(account => account.email === bootstrapEmail);
    assert.equal(admin.name, "Private QA administrator");
    assert.equal(admin.role, "admin");
    assert.equal(admin.password, "");
    assert.match(admin.passwordHash, /^scrypt:/);
    assert.equal(server.logs().includes(secret), false, "No bootstrap password in logs");
    assert.equal(server.logs().includes(admin.passwordHash), false, "No bootstrap hash in logs");
    assert.equal(server.logs().includes(bootstrapEmail), false, "No bootstrap identity in logs");
  }
  for (const [label, email, password] of [
    ["invalid-bootstrap-identity", instructor.email, secret],
    ["invalid-bootstrap-password", bootstrapEmail, publicPassword]
  ]) {
    const server = await start(label, "production", privateSeed, {
      IZ_BOOTSTRAP_ADMIN_EMAIL: email, IZ_BOOTSTRAP_ADMIN_PASSWORD: password
    });
    await login(server, { email, password }, 401);
    assert.match(server.logs(), /Bootstrap rechazado/);
    assert.equal(server.logs().includes(secret), false);
    const stored = JSON.parse(readFileSync(path.join(server.dataDir, "state.json"), "utf8"));
    assert.equal(stored.accounts.length, 0, "Invalid bootstrap must not create accounts");
  }
  console.log("Fixture account policy PASS: production login/cookies/bearer blocked, bootstrap valid, test/development compatible, no secret logs.");
} finally {
  await stop();
  for (const key of Object.keys(process.env)) delete process.env[key];
  Object.assign(process.env, originalEnv);
  rmSync(temp, { recursive: true, force: true });
}
