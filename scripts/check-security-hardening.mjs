import assert from "node:assert/strict";
import { spawn } from "node:child_process";
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
const tempRoot = mkdtempSync(path.join(os.tmpdir(), "iz-security-hardening-check-"));
const tempDataDir = path.join(tempRoot, "data");
const tempDefaultStatePath = path.join(tempRoot, "default-state.json");
const serverOut = [];
const serverErr = [];

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

function assertPublicRegisterRoleIsFixed() {
  const serverContent = readFileSync(path.join(repoRoot, "server.js"), "utf8");
  const start = serverContent.indexOf('path: "/api/auth/register"');
  const end = serverContent.indexOf('path: "/api/auth/login"', start);
  assert.notEqual(start, -1, "No se encontro la ruta publica de registro");
  assert.notEqual(end, -1, "No se pudo aislar la ruta publica de registro");

  const routeBlock = serverContent.slice(start, end);
  assert.match(routeBlock, /const publicRegistrationRole = "socio"/);
  assert.match(routeBlock, /role: publicRegistrationRole/);
  assert.equal(routeBlock.includes("payload.role"), false, "El registro publico no debe leer payload.role");
}

function buildSeedState() {
  const seed = JSON.parse(readFileSync(bundledDefaultStatePath, "utf8"));
  const currentYear = String(new Date().getFullYear());
  seed.accounts = (seed.accounts || []).map((account) => {
    if (account.id === "account-2") {
      return { ...account, associateId: "associate-1" };
    }
    if (account.id === "account-3") {
      return { ...account, associateId: "associate-2" };
    }
    return account;
  });
  seed.members = (seed.members || []).map((member) => {
    if (member.id === "member-1") {
      return { ...member, associateId: "associate-1" };
    }
    if (member.id === "member-2") {
      return { ...member, associateId: "associate-2" };
    }
    return member;
  });
  seed.associates = (seed.associates || []).map((associate) => ({
    ...associate,
    annualAmount: 0,
    yearlyFees: {
      ...(associate.yearlyFees || {}),
      [currentYear]: 0
    }
  }));
  seed.campusGroups = [
    {
      id: "campus-group-private-member-2",
      title: "Grupo privado Javier",
      summary: "Adjuntos privados para validar permisos laterales",
      allowedMemberIds: ["member-2"],
      modules: [
        {
          id: "campus-module-private-member-2",
          title: "Modulo privado",
          summary: "",
          documents: [
            {
              id: "campus-entry-private-member-2",
              title: "Documento privado",
              attachment: {
                name: "private.txt",
                type: "text/plain",
                contentBase64: Buffer.from("private campus group attachment", "utf8").toString("base64")
              }
            }
          ],
          practiceSheets: [],
          videos: [],
          links: []
        }
      ]
    }
  ];
  return seed;
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
        return;
      }
    } catch (error) {
    }
    await delay(250);
  }
  throw new Error(`Servidor no disponible.\nSTDOUT:\n${serverOut.join("")}\nSTDERR:\n${serverErr.join("")}`);
}

function createClient(label, baseUrl) {
  const cookies = new Map();
  return {
    async request(method, requestPath, body, options = {}) {
      const headers = { Accept: "application/json", ...(options.headers || {}) };
      const cookieHeader = Array.from(cookies.entries())
        .map(([name, value]) => `${name}=${value}`)
        .join("; ");
      if (cookieHeader) {
        headers.Cookie = cookieHeader;
      }

      let payload;
      if (body !== undefined) {
        headers["Content-Type"] = "application/json";
        payload = JSON.stringify(body);
      }

      const response = await fetch(new URL(requestPath, baseUrl), {
        method,
        headers,
        body: payload
      });
      const setCookie = response.headers.get("set-cookie");
      if (setCookie) {
        const cookiePair = setCookie.split(";")[0];
        const separator = cookiePair.indexOf("=");
        if (separator > 0) {
          cookies.set(cookiePair.slice(0, separator), cookiePair.slice(separator + 1));
        }
      }

      const text = await response.text();
      const contentType = response.headers.get("content-type") || "";
      const parsedBody = contentType.includes("application/json") && text ? JSON.parse(text) : text;
      if (!response.ok && options.allowFailure !== true) {
        throw new Error(`${label} ${method} ${requestPath} -> ${response.status}: ${parsedBody?.error || text}`);
      }
      return { status: response.status, body: parsedBody };
    }
  };
}

async function login(client, email, password) {
  const response = await client.request("POST", "/api/login", { email, password });
  assert.equal(response.body?.ok, true, `Login esperado para ${email}`);
}

async function main() {
  assertPublicRegisterRoleIsFixed();

  const port = await getAvailablePort();
  const baseUrl = `http://127.0.0.1:${port}`;
  const server = startServer(port, baseUrl);
  try {
    await waitForServer(baseUrl);

    const anonymousClient = createClient("anonymous", baseUrl);
    const adminClient = createClient("admin", baseUrl);
    const memberClient = createClient("member", baseUrl);
    const secondMemberClient = createClient("member-2", baseUrl);

    const healthResponse = await anonymousClient.request("GET", "/healthz");
    assert.equal(healthResponse.body?.ok, true);
    assert.deepEqual(Object.keys(healthResponse.body || {}).sort(), ["now", "ok", "release", "service"]);
    const healthJson = JSON.stringify(healthResponse.body);
    for (const forbiddenKey of ["storage", "dataDir", "uploadsDir", "associateUploadsDir", "dbPath", "backupDir", "baseUrl", "port"]) {
      assert.equal(healthJson.includes(forbiddenKey), false, `/healthz filtra ${forbiddenKey}`);
    }

    const anonymousDebugResponse = await anonymousClient.request("GET", "/api/debug/storage", undefined, {
      allowFailure: true
    });
    assert.equal(anonymousDebugResponse.status, 401, "/api/debug/storage debe exigir login");

    await login(adminClient, "admin@isocronazero.org", "campus123");
    await login(memberClient, "lucia@isocronazero.org", "bomberos123");
    await login(secondMemberClient, "javier@isocronazero.org", "bomberos123");

    const memberDebugResponse = await memberClient.request("GET", "/api/debug/storage", undefined, {
      allowFailure: true
    });
    assert.equal(memberDebugResponse.status, 403, "/api/debug/storage debe ser solo admin");

    const adminDebugResponse = await adminClient.request("GET", "/api/debug/storage");
    assert.equal(adminDebugResponse.body?.ok, true, "Admin debe poder consultar debug de storage");

    const attachmentPath =
      "/api/campus-groups/attachment?groupId=campus-group-private-member-2&moduleId=campus-module-private-member-2&category=documents&entryId=campus-entry-private-member-2";
    const lateralAttachmentResponse = await memberClient.request("GET", attachmentPath, undefined, {
      allowFailure: true
    });
    assert.equal(lateralAttachmentResponse.status, 403, "Un socio no debe acceder a adjuntos de grupos ajenos");

    const allowedAttachmentResponse = await secondMemberClient.request("GET", attachmentPath);
    assert.equal(allowedAttachmentResponse.status, 200);
    assert.equal(allowedAttachmentResponse.body, "private campus group attachment");
  } finally {
    await stopServer(server);
    rmSync(tempRoot, { recursive: true, force: true });
  }
}

main()
  .then(() => {
    console.log("Security hardening check passed.");
  })
  .catch((error) => {
    console.error(error);
    console.error(`STDOUT:\n${serverOut.join("")}`);
    console.error(`STDERR:\n${serverErr.join("")}`);
    rmSync(tempRoot, { recursive: true, force: true });
    process.exit(1);
  });
