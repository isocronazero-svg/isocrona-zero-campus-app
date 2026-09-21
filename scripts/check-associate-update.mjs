import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const bundledDefaultStatePath = path.join(repoRoot, "data", "default-state.json");
const nodeModulesCandidates = [
  path.join(repoRoot, "node_modules"),
  path.join(path.dirname(repoRoot), "Isocrona Zero", "node_modules")
];
const nodeModulesPath = nodeModulesCandidates.find((candidate) => existsSync(candidate)) || "";
const tempRoot = mkdtempSync(path.join(os.tmpdir(), "iz-associate-update-check-"));
const tempDataDir = path.join(tempRoot, "data");
const tempDefaultStatePath = path.join(tempRoot, "default-state.json");
const serverOut = [];
const serverErr = [];
const testPasswords = {
  admin: `Admin-${randomUUID()}`,
  member: `Member-${randomUUID()}`,
  replacement: `Replacement-${randomUUID()}`,
  wrong: `Wrong-${randomUUID()}`
};

function buildSeedState() {
  const seed = JSON.parse(readFileSync(bundledDefaultStatePath, "utf8"));
  seed.accounts = (seed.accounts || []).map((account) => {
    const password = account.id === "account-1"
      ? testPasswords.admin
      : account.id === "account-2"
        ? testPasswords.member
        : `Unused-${randomUUID()}`;
    return { ...account, password, passwordHash: "" };
  });
  return seed;
}

async function getAvailablePort() {
  return await new Promise((resolve, reject) => {
    const probe = net.createServer();
    probe.unref();
    probe.on("error", reject);
    probe.listen(0, "127.0.0.1", () => {
      const address = probe.address();
      const port = typeof address === "object" && address ? address.port : 0;
      probe.close((error) => (error ? reject(error) : resolve(port)));
    });
  });
}

function startServer(port, baseUrl) {
  mkdirSync(tempDataDir, { recursive: true });
  writeFileSync(tempDefaultStatePath, JSON.stringify(buildSeedState(), null, 2));
  const child = spawn(process.execPath, ["server.js"], {
    cwd: repoRoot,
    env: {
      ...process.env,
      ...(nodeModulesPath ? { NODE_PATH: nodeModulesPath } : {}),
      PORT: String(port),
      IZ_BASE_URL: baseUrl,
      IZ_DATA_DIR: tempDataDir,
      IZ_DEFAULT_STATE_PATH: tempDefaultStatePath,
      AUTOMATION_INTERVAL_MS: "3600000",
      IZ_RECOVERY_ADMIN_PASSWORD: ""
    },
    stdio: ["ignore", "pipe", "pipe"]
  });
  child.stdout.on("data", (chunk) => serverOut.push(String(chunk)));
  child.stderr.on("data", (chunk) => serverErr.push(String(chunk)));
  return child;
}

async function stopServer(child) {
  if (!child || child.exitCode !== null || child.signalCode !== null) return;
  await new Promise((resolve) => {
    const timeout = setTimeout(resolve, 1000);
    timeout.unref();
    child.once("exit", () => {
      clearTimeout(timeout);
      resolve();
    });
    child.kill();
  });
}

async function waitForServer(baseUrl) {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    try {
      const response = await fetch(new URL("/healthz", baseUrl));
      if (response.ok) return;
    } catch {}
    await delay(250);
  }
  throw new Error(`Servidor no disponible.\nSTDOUT:\n${serverOut.join("")}\nSTDERR:\n${serverErr.join("")}`);
}

function createClient(baseUrl) {
  const cookies = new Map();
  return {
    async request(method, requestPath, body, allowFailure = false) {
      const headers = { Accept: "application/json" };
      const cookieHeader = Array.from(cookies.entries()).map(([name, value]) => `${name}=${value}`).join("; ");
      if (cookieHeader) headers.Cookie = cookieHeader;
      let payload;
      if (body !== undefined) {
        headers["Content-Type"] = "application/json";
        payload = JSON.stringify(body);
      }
      const response = await fetch(new URL(requestPath, baseUrl), { method, headers, body: payload });
      const setCookie = response.headers.get("set-cookie");
      if (setCookie) {
        const [cookiePair] = setCookie.split(";");
        const separator = cookiePair.indexOf("=");
        cookies.set(cookiePair.slice(0, separator), cookiePair.slice(separator + 1));
      }
      const text = await response.text();
      const parsedBody = text ? JSON.parse(text) : null;
      if (!response.ok && !allowFailure) {
        throw new Error(`${method} ${requestPath} -> ${response.status}: ${parsedBody?.error || text}`);
      }
      return { status: response.status, body: parsedBody };
    }
  };
}

async function login(client, email, password) {
  const response = await client.request("POST", "/api/login", { email, password });
  assert.equal(response.body?.ok, true);
}

async function main() {
  const port = await getAvailablePort();
  const baseUrl = `http://127.0.0.1:${port}`;
  const server = startServer(port, baseUrl);
  try {
    await waitForServer(baseUrl);
    const anonymous = createClient(baseUrl);
    const member = createClient(baseUrl);
    const admin = createClient(baseUrl);
    const originalState = (await admin.request("GET", "/api/state", undefined, true));
    assert.equal(originalState.status, 401, "El estado debe exigir autenticacion");

    const updatePayload = {
      associateNumber: 1,
      status: "Activa",
      firstName: "Laura corregida",
      lastName: "Campos Gil",
      dni: "23456789B",
      phone: "600123123",
      email: "laura.corregida@isocronazero.org",
      service: "SPEIS",
      lastQuotaMonth: "Marzo",
      annualAmount: 150,
      observations: "Ficha verificada por prueba automatica",
      manualYearlyFees: { "2024": 50, "2025": 50, "2026": 50, "2027": 0 }
    };

    const anonymousUpdate = await anonymous.request("PATCH", "/api/associates/associate-1", updatePayload, true);
    assert.equal(anonymousUpdate.status, 401, "Un visitante no puede editar socios");

    await login(member, "lucia@isocronazero.org", testPasswords.member);
    const memberUpdate = await member.request("PATCH", "/api/associates/associate-1", updatePayload, true);
    assert.equal(memberUpdate.status, 403, "Un socio no puede editar el censo");

    await login(admin, "admin@isocronazero.org", testPasswords.admin);
    const update = await admin.request("PATCH", "/api/associates/associate-1", updatePayload);
    assert.equal(update.status, 200);
    assert.equal(update.body?.associate?.firstName, "Laura corregida");
    assert.equal(update.body?.associate?.phone, "600123123");

    const persistedState = (await admin.request("GET", "/api/state")).body;
    const persisted = (persistedState.associates || []).find((associate) => associate.id === "associate-1");
    assert.equal(persisted?.email, "laura.corregida@isocronazero.org");
    assert.equal(persisted?.lastQuotaMonth, "Marzo");
    assert.equal(persisted?.manualYearlyFees?.["2026"], 50);

    const duplicateNumber = await admin.request("PATCH", "/api/associates/associate-1", {
      ...updatePayload,
      associateNumber: 2
    }, true);
    assert.equal(duplicateNumber.status, 400, "No debe admitir numeros de socio duplicados");

    const invalidEmail = await admin.request("PATCH", "/api/associates/associate-1", {
      ...updatePayload,
      email: "correo-invalido"
    }, true);
    assert.equal(invalidEmail.status, 400, "No debe admitir emails invalidos");

    const missingAssociate = await admin.request("PATCH", "/api/associates/no-existe", updatePayload, true);
    assert.equal(missingAssociate.status, 404, "Debe distinguir una ficha inexistente");

    const anonymousCreateAccess = await anonymous.request(
      "POST",
      "/api/associates/associate-1/create-access",
      { role: "member" },
      true
    );
    assert.equal(anonymousCreateAccess.status, 401, "Un visitante no puede crear accesos");

    const memberCreateAccess = await member.request(
      "POST",
      "/api/associates/associate-1/create-access",
      { role: "member" },
      true
    );
    assert.equal(memberCreateAccess.status, 403, "Un socio no puede crear accesos para otros socios");

    const createdAccess = await admin.request(
      "POST",
      "/api/associates/associate-1/create-access",
      { role: "member" }
    );
    assert.equal(createdAccess.status, 200);
    assert.ok(createdAccess.body?.associate?.linkedAccountId, "El acceso debe quedar vinculado a la ficha");
    const temporaryPassword = createdAccess.body?.associate?.temporaryPassword;
    assert.ok(temporaryPassword, "Administracion debe recibir la contrasena temporal");

    const associateClient = createClient(baseUrl);
    const firstLogin = await associateClient.request("POST", "/api/login", {
      email: updatePayload.email,
      password: temporaryPassword
    });
    assert.equal(firstLogin.body?.session?.mustChangePassword, true, "El primer acceso debe exigir cambio de clave");
    assert.equal(firstLogin.body?.session?.role, "member");

    const wrongCurrentPassword = await associateClient.request(
      "POST",
      "/api/account/change-password",
      {
        accountId: firstLogin.body.session.accountId,
        currentPassword: testPasswords.wrong,
        newPassword: testPasswords.replacement,
        confirmPassword: testPasswords.replacement
      },
      true
    );
    assert.equal(wrongCurrentPassword.status, 400, "No debe cambiarse la clave sin conocer la actual");

    const changedPassword = await associateClient.request("POST", "/api/account/change-password", {
      accountId: firstLogin.body.session.accountId,
      currentPassword: temporaryPassword,
      newPassword: testPasswords.replacement,
      confirmPassword: testPasswords.replacement
    });
    assert.equal(changedPassword.body?.session?.mustChangePassword, false);

    await associateClient.request("POST", "/api/logout");
    const staleTemporaryLogin = await associateClient.request(
      "POST",
      "/api/login",
      { email: updatePayload.email, password: temporaryPassword },
      true
    );
    assert.equal(staleTemporaryLogin.status, 401, "La contrasena temporal debe caducar tras cambiarla");
    const regularLogin = await associateClient.request("POST", "/api/login", {
      email: updatePayload.email,
      password: testPasswords.replacement
    });
    assert.equal(regularLogin.body?.session?.mustChangePassword, false);

    const resetPassword = await admin.request("POST", "/api/associates/associate-1/reset-password");
    const resetTemporaryPassword = resetPassword.body?.associate?.temporaryPassword;
    assert.ok(resetTemporaryPassword, "El restablecimiento debe entregar una nueva clave temporal a administracion");
    assert.notEqual(resetTemporaryPassword, temporaryPassword, "La clave restablecida debe ser nueva");

    await associateClient.request("POST", "/api/logout");
    const staleRegularLogin = await associateClient.request(
      "POST",
      "/api/login",
      { email: updatePayload.email, password: testPasswords.replacement },
      true
    );
    assert.equal(staleRegularLogin.status, 401, "La clave anterior debe dejar de funcionar tras restablecerla");
    const resetLogin = await associateClient.request("POST", "/api/login", {
      email: updatePayload.email,
      password: resetTemporaryPassword
    });
    assert.equal(resetLogin.body?.session?.mustChangePassword, true);
  } finally {
    await stopServer(server);
    rmSync(tempRoot, { recursive: true, force: true });
  }
}

main()
  .then(() => console.log("Associate update check passed."))
  .catch((error) => {
    console.error(error);
    console.error(`STDOUT:\n${serverOut.join("")}`);
    console.error(`STDERR:\n${serverErr.join("")}`);
    rmSync(tempRoot, { recursive: true, force: true });
    process.exit(1);
  });
