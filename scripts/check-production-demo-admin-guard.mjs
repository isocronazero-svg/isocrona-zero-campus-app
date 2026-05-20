import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const nodeModulesCandidates = [
  path.join(repoRoot, "node_modules"),
  path.join(path.dirname(repoRoot), "Isocrona Zero", "node_modules")
];
const nodeModulesPath = nodeModulesCandidates.find((candidate) => existsSync(candidate)) || "";
const allowFlag = "IZ_ALLOW_DEMO_ADMIN_IN_PRODUCTION";
const demoAdminEmail = "admin@isocronazero.org";
const bootstrapAdminEmail = "admin-real@example.test";
const bootstrapAdminPassword = "Bootstrap-Admin-2026!";

async function getAvailablePort() {
  return await new Promise((resolve, reject) => {
    const probe = net.createServer();
    probe.unref();
    probe.on("error", reject);
    probe.listen(0, "127.0.0.1", () => {
      const address = probe.address();
      const port = typeof address === "object" && address ? address.port : 0;
      probe.close((error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(port);
      });
    });
  });
}

function startProductionServer({ allowDemoAdmin = false, bootstrapAdmin = false, port = 0 } = {}) {
  const tempRoot = mkdtempSync(path.join(os.tmpdir(), "iz-production-demo-admin-check-"));
  const dataDir = path.join(tempRoot, "data");
  const baseUrl = `http://127.0.0.1:${port}`;
  const env = {
    ...process.env,
    ...(nodeModulesPath ? { NODE_PATH: nodeModulesPath } : {}),
    NODE_ENV: "production",
    PORT: String(port),
    IZ_BASE_URL: baseUrl,
    IZ_DATA_DIR: dataDir,
    AUTOMATION_INTERVAL_MS: "3600000",
    IZ_RECOVERY_ADMIN_EMAIL: "",
    IZ_RECOVERY_ADMIN_PASSWORD: "",
    IZ_BOOTSTRAP_ADMIN_EMAIL: bootstrapAdmin ? bootstrapAdminEmail : "",
    IZ_BOOTSTRAP_ADMIN_PASSWORD: bootstrapAdmin ? bootstrapAdminPassword : "",
    [allowFlag]: allowDemoAdmin ? "true" : ""
  };
  const child = spawn(process.execPath, ["server.js"], {
    cwd: repoRoot,
    env,
    stdio: ["ignore", "pipe", "pipe"]
  });
  const output = { stdout: "", stderr: "" };
  child.stdout.on("data", (chunk) => {
    output.stdout += String(chunk);
  });
  child.stderr.on("data", (chunk) => {
    output.stderr += String(chunk);
  });
  return { child, tempRoot, dataDir, baseUrl, output };
}

async function waitForExit(child, timeoutMs = 5000) {
  if (child.exitCode !== null || child.signalCode !== null) {
    return { code: child.exitCode, signal: child.signalCode };
  }
  return await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error("El servidor no se detuvo como se esperaba"));
    }, timeoutMs);
    timeout.unref();
    child.once("exit", (code, signal) => {
      clearTimeout(timeout);
      resolve({ code, signal });
    });
  });
}

async function stopServer(child) {
  if (!child || child.exitCode !== null || child.signalCode !== null) {
    return;
  }
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

async function waitForServer(baseUrl, attempts = 40) {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      const response = await fetch(new URL("/healthz", baseUrl));
      if (response.ok) {
        return response;
      }
    } catch (error) {
    }
    await delay(250);
  }
  throw new Error(`Servidor no disponible en ${baseUrl}`);
}

async function assertProductionBlocksDemoAdmin() {
  const blocked = startProductionServer();
  try {
    const exit = await waitForExit(blocked.child);
    assert.notEqual(exit.code, 0, "Produccion con admin demo debe bloquear el arranque");
    const combinedOutput = `${blocked.output.stdout}\n${blocked.output.stderr}`;
    assert.match(combinedOutput, /Arranque bloqueado/);
    assert.match(combinedOutput, new RegExp(demoAdminEmail.replace(".", "\\.")));
    assert.match(combinedOutput, new RegExp(allowFlag));
  } finally {
    await stopServer(blocked.child);
    rmSync(blocked.tempRoot, { recursive: true, force: true });
  }
}

async function assertEmergencyFlagAllowsStartup() {
  const port = await getAvailablePort();
  const tempRoot = mkdtempSync(path.join(os.tmpdir(), "iz-production-demo-admin-allow-check-"));
  const dataDir = path.join(tempRoot, "data");
  const baseUrl = `http://127.0.0.1:${port}`;
  const child = spawn(process.execPath, ["server.js"], {
    cwd: repoRoot,
    env: {
      ...process.env,
      ...(nodeModulesPath ? { NODE_PATH: nodeModulesPath } : {}),
      NODE_ENV: "production",
      PORT: String(port),
      IZ_BASE_URL: baseUrl,
      IZ_DATA_DIR: dataDir,
      AUTOMATION_INTERVAL_MS: "3600000",
      IZ_RECOVERY_ADMIN_EMAIL: "",
      IZ_RECOVERY_ADMIN_PASSWORD: "",
      [allowFlag]: "true"
    },
    stdio: ["ignore", "pipe", "pipe"]
  });
  try {
    const response = await waitForServer(baseUrl);
    assert.equal(response.status, 200, "El flag de emergencia debe permitir healthz");
  } finally {
    await stopServer(child);
    rmSync(tempRoot, { recursive: true, force: true });
  }
}

async function assertBootstrapAdminAllowsStartupAndLogin() {
  const port = await getAvailablePort();
  const started = startProductionServer({ bootstrapAdmin: true, port });

  try {
    const response = await waitForServer(started.baseUrl);
    assert.equal(response.status, 200, "El bootstrap admin debe permitir healthz sin flag de emergencia");

    const loginResponse = await fetch(new URL("/api/login", started.baseUrl), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: bootstrapAdminEmail,
        password: bootstrapAdminPassword
      })
    });
    assert.equal(loginResponse.status, 200, "El admin bootstrap debe poder iniciar sesion");

    const state = JSON.parse(readFileSync(path.join(started.dataDir, "state.json"), "utf8"));
    const accounts = Array.isArray(state.accounts) ? state.accounts : [];
    const adminAccount = accounts.find(
      (account) => String(account.email || "").trim().toLowerCase() === bootstrapAdminEmail
    );

    assert.ok(adminAccount, "Debe persistirse una cuenta admin real");
    assert.equal(adminAccount.role, "admin", "La cuenta bootstrap debe ser admin");
    assert.equal(adminAccount.password, "", "La password bootstrap no debe guardarse en claro");
    assert.match(adminAccount.passwordHash, /^scrypt:/, "La password bootstrap debe guardarse con hash legacy compatible");
    assert.ok(!accounts.some((account) => String(account.email || "").trim().toLowerCase() === demoAdminEmail && account.role === "admin"), "El admin demo debe desaparecer tras bootstrap");

    const combinedOutput = `${started.output.stdout}\n${started.output.stderr}`;
    assert.ok(!combinedOutput.includes(bootstrapAdminPassword), "La password bootstrap no debe aparecer en logs");
  } finally {
    await stopServer(started.child);
    rmSync(started.tempRoot, { recursive: true, force: true });
  }
}

async function main() {
  await assertProductionBlocksDemoAdmin();
  await assertBootstrapAdminAllowsStartupAndLogin();
  await assertEmergencyFlagAllowsStartup();
  console.log("Production demo admin guard check passed.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
