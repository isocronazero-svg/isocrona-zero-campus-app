import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import { DatabaseSync } from "node:sqlite";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "iz-password-reset-"));
const dataDir = path.join(tempDir, "data");
const seedPath = path.join(tempDir, "seed.json");
const outboxPath = path.join(tempDir, "password-reset-outbox.json");
const port = 35000 + Math.floor(Math.random() * 2000);
const baseUrl = `http://127.0.0.1:${port}`;
const oldPassword = "OldPassword-2026";
const newPassword = "NewPassword-2026";

fs.mkdirSync(dataDir, { recursive: true });
fs.writeFileSync(seedPath, JSON.stringify({
  settings: {
    organization: "Isocrona Zero QA",
    smtp: {
      host: "",
      port: 465,
      secure: true,
      startTls: false,
      username: "",
      password: "",
      fromEmail: "",
      fromName: "Isocrona Zero",
      testTo: ""
    }
  },
  accounts: [{
    id: "account-reset",
    name: "Reset User",
    email: "reset-user@example.test",
    password: oldPassword,
    passwordHash: "",
    role: "member",
    memberId: "member-reset",
    associateId: "associate-reset",
    mustChangePassword: false
  }],
  members: [{
    id: "member-reset",
    name: "Reset User",
    email: "reset-user@example.test",
    role: "Socio",
    associateId: "associate-reset",
    certifications: []
  }],
  associates: [{
    id: "associate-reset",
    name: "Reset User",
    firstName: "Reset",
    lastName: "User",
    email: "reset-user@example.test",
    status: "Activo",
    linkedMemberId: "member-reset",
    linkedAccountId: "account-reset",
    campusAccessStatus: "active"
  }],
  courses: [],
  campusGroups: [],
  notices: [],
  activityLog: [],
  auditLog: []
}, null, 2));

let child;
let logs = "";

function startServer() {
  child = spawn(process.execPath, ["server-entry.js"], {
    cwd: root,
    env: {
      ...process.env,
      NODE_ENV: "test",
      PORT: String(port),
      HOST: "127.0.0.1",
      IZ_BASE_URL: baseUrl,
      IZ_DATA_DIR: dataDir,
      IZ_DEFAULT_STATE_PATH: seedPath,
      IZ_PASSWORD_RESET_TEST_OUTBOX: outboxPath,
      IZ_EMAIL_ENABLED: "false",
      DATABASE_URL: ""
    },
    stdio: ["ignore", "pipe", "pipe"]
  });
  child.stdout.on("data", chunk => { logs += chunk.toString(); });
  child.stderr.on("data", chunk => { logs += chunk.toString(); });
}

async function waitForServer() {
  for (let attempt = 0; attempt < 100; attempt++) {
    try {
      const response = await fetch(`${baseUrl}/healthz`);
      if (response.ok) return;
    } catch {}
    await new Promise(resolve => setTimeout(resolve, 75));
  }
  throw new Error(`El servidor no arrancó. Logs:\n${logs}`);
}

async function request(pathname, { method = "GET", body, cookie = "", ip = "203.0.113.10" } = {}) {
  const response = await fetch(`${baseUrl}${pathname}`, {
    method,
    headers: {
      Accept: "application/json",
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      ...(cookie ? { Cookie: cookie } : {}),
      "X-Forwarded-For": ip
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {})
  });
  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json")
    ? await response.json()
    : await response.text();
  return { response, payload, cookie: (response.headers.get("set-cookie") || "").split(";")[0] };
}

async function waitForOutboxSize(expected) {
  for (let attempt = 0; attempt < 80; attempt++) {
    try {
      const entries = JSON.parse(fs.readFileSync(outboxPath, "utf8"));
      if (Array.isArray(entries) && entries.length >= expected) return entries;
    } catch {}
    await new Promise(resolve => setTimeout(resolve, 50));
  }
  throw new Error(`No apareció el correo ${expected} en el outbox de prueba`);
}

function tokenFromMessage(message) {
  const match = String(message?.text || "").match(/[?&]reset=([0-9a-f]{64})/i);
  assert.ok(match, "El correo debe contener un token de reset de 64 caracteres");
  return match[1];
}

try {
  startServer();
  await waitForServer();

  const normalLogin = await request("/api/login", {
    method: "POST",
    body: { email: "reset-user@example.test", password: oldPassword, rememberMe: false },
    ip: "203.0.113.1"
  });
  assert.equal(normalLogin.response.status, 200, "El login inicial debe funcionar");
  assert.ok(normalLogin.cookie, "Debe existir cookie de sesión normal");

  const rememberedLogin = await request("/api/login", {
    method: "POST",
    body: { email: "reset-user@example.test", password: oldPassword, rememberMe: true },
    ip: "203.0.113.2"
  });
  assert.equal(rememberedLogin.response.status, 200, "El login Recordarme inicial debe funcionar");
  assert.ok(rememberedLogin.cookie, "Debe existir cookie Recordarme");

  const missing = await request("/api/password-recovery/request", {
    method: "POST",
    body: { email: "missing-user@example.test" },
    ip: "203.0.113.3"
  });
  assert.equal(missing.response.status, 200);
  assert.equal(missing.payload.ok, true);
  const genericMessage = missing.payload.message;
  assert.match(genericMessage, /Si existe una cuenta/i);

  const firstRequest = await request("/api/password-recovery/request", {
    method: "POST",
    body: { email: "reset-user@example.test" },
    ip: "203.0.113.4"
  });
  assert.equal(firstRequest.response.status, 200);
  assert.equal(firstRequest.payload.message, genericMessage, "No debe revelarse si el correo existe");

  let outbox = await waitForOutboxSize(1);
  const token1 = tokenFromMessage(outbox[0]);
  assert.ok(!outbox[0].text.includes(oldPassword), "El correo nunca debe incluir la contraseña actual");

  const valid1 = await request(`/api/password-recovery/validate?token=${token1}`);
  assert.equal(valid1.response.status, 200);
  assert.equal(valid1.payload.valid, true);

  const secondRequest = await request("/api/password-recovery/request", {
    method: "POST",
    body: { email: "reset-user@example.test" },
    ip: "203.0.113.5"
  });
  assert.equal(secondRequest.response.status, 200);
  outbox = await waitForOutboxSize(2);
  const token2 = tokenFromMessage(outbox[1]);
  assert.notEqual(token2, token1);

  const invalidatedFirst = await request(`/api/password-recovery/validate?token=${token1}`);
  assert.equal(invalidatedFirst.payload.valid, false, "Un segundo reset debe invalidar el primero");

  const mismatch = await request("/api/password-recovery/reset", {
    method: "POST",
    body: { token: token2, newPassword, confirmPassword: `${newPassword}-x` },
    ip: "203.0.113.6"
  });
  assert.equal(mismatch.response.status, 400);
  assert.match(mismatch.payload.error, /no coinciden/i);

  const reset = await request("/api/password-recovery/reset", {
    method: "POST",
    body: { token: token2, newPassword, confirmPassword: newPassword },
    ip: "203.0.113.7"
  });
  assert.equal(reset.response.status, 200, JSON.stringify(reset.payload));
  assert.match(reset.payload.message, /actualizada/i);

  const used = await request(`/api/password-recovery/validate?token=${token2}`);
  assert.equal(used.payload.valid, false, "El token utilizado no debe volver a funcionar");

  const oldLogin = await request("/api/login", {
    method: "POST",
    body: { email: "reset-user@example.test", password: oldPassword },
    ip: "203.0.113.8"
  });
  assert.equal(oldLogin.response.status, 401, "La contraseña anterior debe dejar de funcionar");

  const newLogin = await request("/api/login", {
    method: "POST",
    body: { email: "reset-user@example.test", password: newPassword },
    ip: "203.0.113.9"
  });
  assert.equal(newLogin.response.status, 200, "La nueva contraseña debe permitir acceso");

  const staleNormal = await request("/api/session", { cookie: normalLogin.cookie, ip: "203.0.113.11" });
  assert.equal(staleNormal.response.status, 200, "El endpoint de sesión conserva su contrato HTTP 200");
  assert.equal(staleNormal.payload.ok, false, "La sesión normal anterior debe quedar rechazada");
  assert.equal(staleNormal.payload.session, null, "La sesión normal anterior no debe resolver una cuenta");

  const staleRemembered = await request("/api/session", { cookie: rememberedLogin.cookie, ip: "203.0.113.12" });
  assert.equal(staleRemembered.response.status, 200, "El endpoint de sesión conserva su contrato HTTP 200");
  assert.equal(staleRemembered.payload.ok, false, "La sesión Recordarme anterior debe quedar rechazada");
  assert.equal(staleRemembered.payload.session, null, "La sesión Recordarme anterior no debe resolver una cuenta");

  const thirdRequest = await request("/api/password-recovery/request", {
    method: "POST",
    body: { email: "reset-user@example.test" },
    ip: "203.0.113.13"
  });
  assert.equal(thirdRequest.response.status, 200);
  outbox = await waitForOutboxSize(3);
  const token3 = tokenFromMessage(outbox[2]);

  const db = new DatabaseSync(path.join(dataDir, "campus.db"));
  const row = db.prepare("SELECT token_hash AS tokenHash FROM password_reset_tokens WHERE token_hash = ?")
    .get((await import("node:crypto")).createHash("sha256").update(token3).digest("hex"));
  assert.ok(row?.tokenHash, "El token debe persistirse solo como hash");
  assert.notEqual(row.tokenHash, token3, "Nunca se guarda el token en claro");
  db.prepare("UPDATE password_reset_tokens SET expires_at = ? WHERE token_hash = ?").run(Date.now() - 1, row.tokenHash);
  db.close();

  const expired = await request(`/api/password-recovery/validate?token=${token3}`);
  assert.equal(expired.payload.valid, false, "Un token caducado debe rechazarse");

  const snapshot = fs.readFileSync(path.join(dataDir, "state.json"), "utf8");
  assert.ok(!snapshot.includes(token1) && !snapshot.includes(token2) && !snapshot.includes(token3),
    "Los tokens de reset no deben entrar en el estado/snapshot del portal");
  assert.ok(!snapshot.includes(newPassword), "La contraseña nueva no debe quedar en texto claro en el snapshot");

  const appSource = await fetch(`${baseUrl}/app.js`).then(response => response.text());
  assert.match(appSource, /^import "\.\/password-recovery\.js";/, "El frontend debe cargar la recuperación de contraseña");
  const recoverySource = await fetch(`${baseUrl}/password-recovery.js`);
  assert.equal(recoverySource.status, 200, "El módulo de UI debe servirse públicamente");

  console.log("Password recovery check: PASS");
} finally {
  if (child && !child.killed) child.kill("SIGTERM");
  await new Promise(resolve => setTimeout(resolve, 100));
  fs.rmSync(tempDir, { recursive: true, force: true });
}
