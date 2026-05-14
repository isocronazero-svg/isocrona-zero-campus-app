import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, rmSync } from "node:fs";
import { createRequire } from "node:module";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const { payloadLimitBytes } = require("../server/http");

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const bundledDefaultStatePath = path.join(repoRoot, "data", "default-state.json");
const nodeModulesCandidates = [
  path.join(repoRoot, "node_modules"),
  path.join(path.dirname(repoRoot), "Isocrona Zero", "node_modules")
];
const nodeModulesPath = nodeModulesCandidates.find((candidate) => existsSync(candidate)) || "";

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

async function startServer() {
  const tempRoot = mkdtempSync(path.join(os.tmpdir(), "iz-router-utils-check-"));
  const tempDataDir = path.join(tempRoot, "data");
  const port = await getAvailablePort();
  const baseUrl = `http://127.0.0.1:${port}`;
  const serverOut = [];
  const serverErr = [];

  mkdirSync(tempDataDir, { recursive: true });

  const child = spawn(process.execPath, ["server.js"], {
    cwd: repoRoot,
    env: {
      ...process.env,
      ...(nodeModulesPath ? { NODE_PATH: nodeModulesPath } : {}),
      PORT: String(port),
      IZ_BASE_URL: baseUrl,
      IZ_DATA_DIR: tempDataDir,
      IZ_DEFAULT_STATE_PATH: bundledDefaultStatePath,
      AUTOMATION_INTERVAL_MS: "3600000",
      DATABASE_URL: "",
      IZ_RECOVERY_ADMIN_PASSWORD: ""
    },
    stdio: ["ignore", "pipe", "pipe"]
  });

  child.stdout.on("data", (chunk) => serverOut.push(String(chunk)));
  child.stderr.on("data", (chunk) => serverErr.push(String(chunk)));

  for (let attempt = 0; attempt < 40; attempt += 1) {
    try {
      const response = await fetch(new URL("/healthz", baseUrl));
      if (response.ok) {
        return { child, baseUrl, tempRoot, serverOut, serverErr };
      }
    } catch (error) {
    }
    await delay(250);
  }

  await stopServer({ child, tempRoot });
  throw new Error(`Servidor no disponible.\nSTDOUT:\n${serverOut.join("")}\nSTDERR:\n${serverErr.join("")}`);
}

async function stopServer(server) {
  if (server?.child && server.child.exitCode === null && server.child.signalCode === null) {
    await new Promise((resolve) => {
      const timeout = setTimeout(resolve, 1000);
      timeout.unref();
      server.child.once("exit", () => {
        clearTimeout(timeout);
        resolve();
      });
      server.child.kill();
    });
  }
  if (server?.tempRoot) {
    rmSync(server.tempRoot, { recursive: true, force: true });
  }
}

function oversizedJson(minBytes) {
  const raw = JSON.stringify({ padding: "x".repeat(minBytes) });
  assert.ok(Buffer.byteLength(raw) > minBytes, "El cuerpo de prueba debe superar el limite");
  return raw;
}

function createClient(label, baseUrl) {
  const cookies = new Map();

  async function requestRaw(method, requestPath, rawBody, options = {}) {
    const headers = {
      Accept: "application/json",
      ...(options.headers || {})
    };
    const cookieHeader = Array.from(cookies.entries())
      .map(([name, value]) => `${name}=${value}`)
      .join("; ");
    if (cookieHeader) {
      headers.Cookie = cookieHeader;
    }
    if (rawBody !== undefined) {
      headers["Content-Type"] = "application/json";
    }

    const response = await fetch(new URL(requestPath, baseUrl), {
      method,
      headers,
      body: rawBody
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
    const body = contentType.includes("application/json") && text ? JSON.parse(text) : text;
    if (!response.ok && options.allowFailure !== true) {
      throw new Error(`${label} ${method} ${requestPath} -> ${response.status}: ${body?.error || text}`);
    }

    return {
      status: response.status,
      body,
      cacheControl: response.headers.get("cache-control")
    };
  }

  return {
    request(method, requestPath, body, options = {}) {
      return requestRaw(method, requestPath, body === undefined ? undefined : JSON.stringify(body), options);
    },
    requestRaw
  };
}

async function login(client, email, password) {
  const response = await client.request("POST", "/api/login", { email, password });
  assert.equal(response.body?.ok, true, `Login esperado para ${email}`);
}

async function main() {
  const server = await startServer();
  try {
    const anonymousClient = createClient("anonymous", server.baseUrl);
    const memberClient = createClient("member", server.baseUrl);

    const unauthenticatedQuestions = await anonymousClient.request("GET", "/api/test-zone/questions", undefined, {
      allowFailure: true
    });
    assert.equal(unauthenticatedQuestions.status, 401, "withAuth debe devolver 401 sin sesion");

    await login(memberClient, "lucia@isocronazero.org", "bomberos123");

    const forbiddenLiveSessions = await memberClient.request("GET", "/api/test-zone/live-sessions", undefined, {
      allowFailure: true
    });
    assert.equal(forbiddenLiveSessions.status, 403, "withAdmin debe devolver 403 para socios");

    const oversizedResult = await memberClient.requestRaw(
      "POST",
      "/api/test-zone/results",
      oversizedJson(payloadLimitBytes.testAttempt),
      { allowFailure: true }
    );
    assert.equal(oversizedResult.status, 413, "withJsonBodyLimit debe devolver 413");
    assert.equal(oversizedResult.body?.ok, false);
    assert.equal(oversizedResult.body?.maxBytes, payloadLimitBytes.testAttempt);
    assert.equal(oversizedResult.cacheControl, "no-store", "413 debe incluir Cache-Control: no-store");

    console.log("Router utility checks passed.");
  } finally {
    await stopServer(server);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
