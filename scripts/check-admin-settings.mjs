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
const tempRoot = mkdtempSync(path.join(os.tmpdir(), "iz-admin-settings-check-"));
const tempDataDir = path.join(tempRoot, "data");
const tempDefaultStatePath = path.join(tempRoot, "default-state.json");
const serverOut = [];
const serverErr = [];
const passwords = {
  admin: `Admin-${randomUUID()}`,
  member: `Member-${randomUUID()}`
};

function buildSeedState() {
  const seed = JSON.parse(readFileSync(bundledDefaultStatePath, "utf8"));
  seed.accounts = (seed.accounts || []).map((account) => ({
    ...account,
    password: account.id === "account-1" ? passwords.admin : passwords.member,
    passwordHash: ""
  }));
  seed.settings.smtp.password = "smtp-secret-must-survive";
  seed.settings.automation.autoRunOnSave = false;
  seed.courses[0].summary = "course-data-must-survive";
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
  const child = spawn(process.execPath, ["server.js"], {
    cwd: repoRoot,
    env: {
      ...process.env,
      ...(nodeModulesPath ? { NODE_PATH: nodeModulesPath } : {}),
      NODE_ENV: "test",
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
      let requestBody;
      if (body !== undefined) {
        headers["Content-Type"] = "application/json";
        requestBody = JSON.stringify(body);
      }
      const response = await fetch(new URL(requestPath, baseUrl), { method, headers, body: requestBody });
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
  mkdirSync(tempDataDir, { recursive: true });
  writeFileSync(tempDefaultStatePath, JSON.stringify(buildSeedState(), null, 2));
  const port = await getAvailablePort();
  const baseUrl = `http://127.0.0.1:${port}`;
  let server = startServer(port, baseUrl);

  try {
    await waitForServer(baseUrl);
    const anonymous = createClient(baseUrl);
    const member = createClient(baseUrl);
    const admin = createClient(baseUrl);
    const settingsPayload = {
      section: "general",
      settings: {
        certificateCity: "Valencia",
        smtp: {
          host: "smtp.example.test",
          password: ""
        },
        automation: {
          autoRunOnSave: false
        },
        associates: {
          defaultAnnualAmount: 75
        }
      },
      courses: [{ id: "course-1", summary: "must-not-be-accepted" }]
    };

    const anonymousUpdate = await anonymous.request("PATCH", "/api/admin/settings", settingsPayload, true);
    assert.equal(anonymousUpdate.status, 401, "Un visitante no puede cambiar la configuracion");

    await login(member, "lucia@isocronazero.org", passwords.member);
    const memberUpdate = await member.request("PATCH", "/api/admin/settings", settingsPayload, true);
    assert.equal(memberUpdate.status, 403, "Un socio no puede cambiar la configuracion");

    await login(admin, "admin@isocronazero.org", passwords.admin);
    const update = await admin.request("PATCH", "/api/admin/settings", settingsPayload);
    assert.equal(update.status, 200);
    assert.equal(update.body?.state?.settings?.certificateCity, "Valencia");
    assert.equal(update.body?.state?.settings?.smtp?.host, "smtp.example.test");
    assert.equal(update.body?.state?.settings?.smtp?.password, "", "La respuesta no debe filtrar secretos SMTP");

    const stateAfterUpdate = (await admin.request("GET", "/api/state")).body;
    assert.equal(stateAfterUpdate.settings.emailTemplate.includes("{{name}}"), true, "Debe conservar ajustes no enviados");
    assert.equal(stateAfterUpdate.settings.associates.defaultAnnualAmount, 75);
    assert.equal(stateAfterUpdate.courses[0].summary, "course-data-must-survive", "No debe aceptar cambios fuera de settings");

    await stopServer(server);
    server = startServer(port, baseUrl);
    await waitForServer(baseUrl);

    const restartedAdmin = createClient(baseUrl);
    await login(restartedAdmin, "admin@isocronazero.org", passwords.admin);
    const persistedState = (await restartedAdmin.request("GET", "/api/state")).body;
    assert.equal(persistedState.settings.certificateCity, "Valencia", "La configuracion debe persistir tras reiniciar");
    assert.equal(persistedState.settings.smtp.host, "smtp.example.test");

    const persistedRawState = JSON.parse(readFileSync(path.join(tempDataDir, "state.json"), "utf8"));
    assert.equal(
      persistedRawState.settings.smtp.password,
      "smtp-secret-must-survive",
      "Un secreto SMTP redaccionado no debe borrarse"
    );
    assert.equal(persistedRawState.courses[0].summary, "course-data-must-survive");
  } finally {
    await stopServer(server);
    rmSync(tempRoot, { recursive: true, force: true });
  }
}

main()
  .then(() => console.log("Admin settings endpoint check passed."))
  .catch((error) => {
    console.error(error);
    console.error(`STDOUT:\n${serverOut.join("")}\nSTDERR:\n${serverErr.join("")}`);
    rmSync(tempRoot, { recursive: true, force: true });
    process.exit(1);
  });
