import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const restarting = process.argv[2] === "--restart";
const temp = restarting ? process.argv[3] : fs.mkdtempSync(path.join(os.tmpdir(), "iz-db-revocation-"));
const rowFile = path.join(temp, "user.json");
const proofFile = path.join(temp, "proof.json");
const secret = restarting ? JSON.parse(fs.readFileSync(proofFile)).secret : crypto.randomBytes(32).toString("hex");
const env = {};
for (const key of ["PATH", "HOME", "SystemRoot", "WINDIR", "TEMP", "TMP", "NO_PROXY", "no_proxy"]) {
  if (process.env[key]) env[key] = process.env[key];
}
for (const key of Object.keys(process.env)) delete process.env[key];
Object.assign(process.env, env, { NODE_ENV: "test", DATABASE_URL: "postgresql://transport-mock", JWT_SECRET: secret,
  IZ_DATA_DIR: path.join(temp, "data"), IZ_DEFAULT_STATE_PATH: path.join(temp, "seed.json"), IZ_EMAIL_ENABLED: "false" });
if (!restarting) fs.writeFileSync(process.env.IZ_DEFAULT_STATE_PATH, JSON.stringify({ accounts: [], members: [], associates: [] }));

// Substitute only the PostgreSQL transport. SQL, hashing, JWTs, auth and SQLite sessions
// are production code; the independent integration job exercises real PostgreSQL.
let profileEntered, releaseProfile;
let profileBarrier;
require("pg").Pool = class {
  async query(sql, args = []) {
    if (/^UPDATE users/.test(sql.trim()) && args.includes("Concurrent profile")) {
      profileEntered?.();
      await profileBarrier;
    }
    const row = JSON.parse(fs.readFileSync(rowFile));
    if (/^UPDATE users/.test(sql.trim())) {
      const expected = /AND password_hash = \$(\d+)/.exec(sql);
      if (row.id !== args[0] || (expected && row.password_hash !== args[Number(expected[1]) - 1])) return { rows: [] };
      for (const match of sql.split(/\bWHERE\b/)[0].matchAll(/(\w+)\s*=\s*\$(\d+)/g)) row[match[1]] = args[Number(match[2]) - 1];
      fs.writeFileSync(rowFile, JSON.stringify(row));
      return { rows: [row] };
    }
    return { rows: row.id === args[0] || row.email === args[0] ? [row] : [] };
  }
};
const db = require("../db");
const auth = require("../server/auth");
const storage = require("../storage");
const bearer = token => ({ headers: { authorization: `Bearer ${token}` } });
const cookie = token => ({ headers: { cookie: `iz_session=${token}` } });
async function rejected(token) {
  assert.equal(await auth.getAuthenticatedDbUser(bearer(token)), null);
  for (const name of ["requireAuthenticatedDbUser", "requireAdminDbUser"]) {
    const response = { setHeader() {}, writeHead(status) { this.statusCode = status; }, end() {} };
    assert.equal(await auth[name](bearer(token), response), null);
    assert.equal(response.statusCode, 401, name);
  }
}
try {
  if (restarting) {
    const proof = JSON.parse(fs.readFileSync(proofFile));
    await rejected(proof.oldJwt);
    await rejected(proof.unversioned);
    assert.ok(await auth.getAuthenticatedDbUser(bearer(proof.newJwt)), "New JWT survives a process restart");
    const req = cookie(proof.remembered);
    await auth.validateDbCookieSession(req);
    assert.equal(auth.getAuthenticatedAccount(req, storage.readState()), null, "Pre-reset remembered cookie stays revoked after restart");
    console.log("Fresh-process PostgreSQL credential revocation: PASS");
  } else {
    const row = { id: "security-user", name: "Security user", email: "security@example.test", role: "admin", status: "active",
      password_hash: db.hashPassword("Original-synthetic-password") };
    fs.writeFileSync(rowFile, JSON.stringify(row));
    const user = await db.authenticateUser(row.email, "Original-synthetic-password");
    assert.ok(user);
    assert.equal(JSON.stringify(user).includes("credentialVersion"), false);
    assert.equal(JSON.stringify(user).includes(row.password_hash), false);
    const frozen = Date.now();
    Date.now = () => frozen;
    const oldJwt = db.signAuthToken(user);
    assert.ok(await auth.getAuthenticatedDbUser(bearer(oldJwt)));
    const unversioned = require("jsonwebtoken").sign({ sub: user.id }, secret, { expiresIn: "1h" });
    await rejected(unversioned);
    const state = storage.readState();
    const { account } = auth.ensureLegacyAccountForDbUser(state, user, { password: "Original-synthetic-password" });
    storage.writeState(state);
    assert.throws(() => auth.setLegacyAccountPassword(account, "Unsafe-local-only-change"), /PostgreSQL/);
    const transport = require("../server/state-transport").createStateTransport();
    const safe = transport.stripAccountSecrets(account);
    assert.equal(safe.dbCredentialVersion, undefined);
    assert.equal(safe.dbUserId, undefined);
    const forged = { accounts: [{ ...safe, dbCredentialVersion: "forged", dbUserId: "other-user" }] };
    transport.restoreTransportSanitizedSecrets(state, forged);
    assert.equal(forged.accounts[0].dbCredentialVersion, account.dbCredentialVersion);
    assert.equal(forged.accounts[0].dbUserId, account.dbUserId);
    const ordinary = auth.createSessionToken(account);
    const remembered = auth.createSessionToken(account, true);
    await auth.validateDbCookieSession(cookie(ordinary));
    const entered = new Promise(resolve => { profileEntered = resolve; });
    profileBarrier = new Promise(resolve => { releaseProfile = resolve; });
    const profile = db.updateUser(user.id, { name: "Concurrent profile" });
    await entered;
    const updated = await db.updateUser(user.id, { password: "Replacement-synthetic-password" });
    releaseProfile();
    await profile;
    assert.ok(await db.authenticateUser(row.email, "Replacement-synthetic-password"), "Concurrent profile edit preserves changed password");
    assert.equal(await db.authenticateUser(row.email, "Original-synthetic-password"), null);
    await assert.rejects(() => db.updateUser(user.id, { password: "Stale-change-password" }, { expectedCredentialVersion: user.credentialVersion }));
    const newJwt = db.signAuthToken(updated);
    assert.equal(db.verifyAuthToken(oldJwt).iat, db.verifyAuthToken(newJwt).iat, "Regression covers tokens from the SAME SECOND");
    await rejected(oldJwt);
    assert.ok(await auth.getAuthenticatedDbUser(bearer(newJwt)));
    const req = cookie(ordinary);
    await auth.validateDbCookieSession(req);
    assert.equal(auth.getAuthenticatedAccount(req, storage.readState()), null, "Ordinary cookie cannot mint a replacement JWT");
    fs.writeFileSync(proofFile, JSON.stringify({ secret, oldJwt, newJwt, unversioned, remembered }));
    const child = spawnSync(process.execPath, [fileURLToPath(import.meta.url), "--restart", temp], { cwd: root, env, encoding: "utf8" });
    assert.equal(child.status, 0, child.stderr + child.stdout);
    process.stdout.write(child.stdout);
    console.log("Same-second JWT, cookie, concurrent profile and restart regressions: PASS");
  }
} finally {
  releaseProfile?.();
  if (!restarting) fs.rmSync(temp, { recursive: true, force: true });
}
