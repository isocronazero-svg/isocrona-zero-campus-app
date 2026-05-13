import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
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
const expectedPayloadError = "El contenido enviado es demasiado grande. Reduce el tamaño del archivo o usa un enlace.";

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
  const tempRoot = mkdtempSync(path.join(os.tmpdir(), "iz-payload-limits-check-"));
  const tempDataDir = path.join(tempRoot, "data");
  const port = await getAvailablePort();
  const baseUrl = `http://127.0.0.1:${port}`;
  const serverOut = [];
  const serverErr = [];

  mkdirSync(tempDataDir, { recursive: true });
  writeFileSync(path.join(tempRoot, "default-state.json"), "{}");

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
      IZ_RECOVERY_ADMIN_EMAIL: "payload-recovery@example.com",
      IZ_RECOVERY_ADMIN_PASSWORD: "payload-recovery-pass"
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

async function requestRaw(baseUrl, requestPath, rawBody) {
  const response = await fetch(new URL(requestPath, baseUrl), {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json"
    },
    body: rawBody
  });
  const text = await response.text();
  return {
    status: response.status,
    body: text ? JSON.parse(text) : null,
    cacheControl: response.headers.get("cache-control")
  };
}

function assertPayloadTooLarge(response, label, maxBytes) {
  assert.equal(response.status, 413, `${label} debe devolver 413`);
  assert.equal(response.body?.ok, false);
  assert.equal(response.body?.error, expectedPayloadError);
  assert.equal(response.body?.maxBytes, maxBytes, `${label} debe incluir maxBytes`);
  assert.equal(response.cacheControl, "no-store", `${label} debe incluir Cache-Control: no-store`);
}

async function main() {
  const server = await startServer();
  try {
    const checks = [
      ["/api/login", 16 * 1024, "/api/login"],
      ["/api/auth/register", 32 * 1024, "/api/auth/register"],
      ["/api/test-zone/live/join", 32 * 1024, "/api/test-zone/live/join"],
      ["/api/test-zone/live-sessions/payload-session/attempt", 128 * 1024, "/api/test-zone/live-sessions/:id/attempt"],
      ["/api/live-test-sessions/PAYLOAD/submit", 128 * 1024, "/api/live-test-sessions/:code/submit"]
    ];

    for (const [requestPath, maxBytes, label] of checks) {
      const response = await requestRaw(server.baseUrl, requestPath, oversizedJson(maxBytes));
      assertPayloadTooLarge(response, label, maxBytes);
    }

    const invalidSmall = await requestRaw(server.baseUrl, "/api/login", "{");
    assert.equal(invalidSmall.status, 400, "Un JSON invalido pequeno debe seguir devolviendo 400");
    assert.notEqual(invalidSmall.status, 413, "Un JSON invalido pequeno no debe devolverse como payload grande");
    assert.equal(invalidSmall.body?.ok, false);

    console.log("Payload limit checks passed.");
  } finally {
    await stopServer(server);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
