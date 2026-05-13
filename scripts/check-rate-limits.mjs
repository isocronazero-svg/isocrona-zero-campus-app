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

function iso(timestamp) {
  return new Date(timestamp).toISOString();
}

function buildSeedState() {
  const seed = JSON.parse(readFileSync(bundledDefaultStatePath, "utf8"));
  const now = Date.now();
  const future = iso(now + 60 * 60 * 1000);

  seed.testZoneQuestions = [
    {
      id: "rate-test-zone-question-1",
      prompt: "Pregunta rate limit Test Zone",
      options: ["A", "B", "C", "D"],
      correctIndex: 0,
      part: "Parte comun",
      category: "Legislacion",
      difficulty: "baja",
      explanation: "No se expone al participante",
      createdAt: iso(now - 60_000)
    }
  ];
  seed.testZoneResults = [];
  seed.testZoneReviewMarks = [];
  seed.testZoneLiveSessions = [
    {
      id: "rate-test-zone-live-session",
      code: "TZRATE",
      title: "Rate Test Zone Live",
      questionIds: ["rate-test-zone-question-1"],
      questionCount: 1,
      status: "active",
      createdAt: iso(now - 30_000),
      expiresAt: future,
      closedAt: ""
    }
  ];

  seed.testModules = [
    {
      id: "rate-live-module",
      title: "Rate live module",
      description: "",
      createdAt: iso(now - 60_000)
    }
  ];
  seed.questions = [
    {
      id: "rate-live-question-1",
      moduleId: "rate-live-module",
      prompt: "Pregunta rate live publico",
      options: ["A", "B", "C", "D"],
      correctIndex: 0,
      explanation: "No se expone al participante",
      createdAt: iso(now - 60_000)
    }
  ];
  seed.liveTestPublicSessions = [
    {
      id: "rate-public-live-session",
      code: "PUBRATE",
      title: "Rate Public Live",
      questionIds: ["rate-live-question-1"],
      status: "active",
      createdAt: iso(now - 30_000)
    }
  ];
  seed.liveTestParticipantResults = [];

  return seed;
}

async function startServer(options = {}) {
  const tempRoot = mkdtempSync(path.join(os.tmpdir(), "iz-rate-limits-check-"));
  const tempDataDir = path.join(tempRoot, "data");
  const tempDefaultStatePath = path.join(tempRoot, "default-state.json");
  const port = await getAvailablePort();
  const baseUrl = `http://127.0.0.1:${port}`;
  const serverOut = [];
  const serverErr = [];

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
      DATABASE_URL: "",
      IZ_RECOVERY_ADMIN_EMAIL: "recovery-rate@example.com",
      IZ_RECOVERY_ADMIN_PASSWORD: "correct-rate-pass",
      IZ_TRUST_PROXY_HEADERS: options.trustProxyHeaders ? "true" : "false"
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

function createClient(baseUrl) {
  return {
    async request(method, requestPath, body, options = {}) {
      const headers = { Accept: "application/json", ...(options.headers || {}) };
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
      const text = await response.text();
      const parsedBody = text ? JSON.parse(text) : null;
      return {
        status: response.status,
        body: parsedBody,
        retryAfter: response.headers.get("retry-after"),
        cacheControl: response.headers.get("cache-control")
      };
    }
  };
}

function assertRateLimited(response, label) {
  assert.equal(response.status, 429, `${label} debe devolver 429`);
  assert.equal(response.body?.ok, false);
  assert.equal(response.body?.error, "Demasiados intentos. Espera unos minutos y vuelve a probar.");
  assert.ok(Number(response.body?.retryAfterSeconds || 0) > 0, `${label} debe incluir retryAfterSeconds`);
  assert.ok(response.retryAfter, `${label} debe incluir Retry-After`);
  assert.equal(response.cacheControl, "no-store", `${label} debe incluir Cache-Control: no-store`);
}

async function assertBlockedAfter(client, label, attemptsBeforeBlock, method, requestPath, buildBody, options = {}) {
  for (let attempt = 0; attempt < attemptsBeforeBlock; attempt += 1) {
    const response = await client.request(method, requestPath, buildBody(attempt), options);
    assert.notEqual(response.status, 429, `${label} se bloqueo antes de tiempo en intento ${attempt + 1}`);
  }
  const blocked = await client.request(method, requestPath, buildBody(attemptsBeforeBlock), options);
  assertRateLimited(blocked, label);
}

function loginBody(email) {
  return {
    email,
    password: "wrong-password"
  };
}

function associateApplyBody(index) {
  return {
    firstName: `Rate${index}`,
    lastName: "Limit",
    dni: `RATE${index}`,
    phone: "600000000",
    email: `rate-limit-${index}@example.com`,
    service: "Test",
    privacyConsent: true,
    photoConsent: false
  };
}

async function runMainRateLimitChecks() {
  const server = await startServer();
  try {
    const client = createClient(server.baseUrl);

    await assertBlockedAfter(
      client,
      "legacy login por email+IP",
      5,
      "POST",
      "/api/login",
      () => loginBody("blocked-legacy@example.com")
    );

    await assertBlockedAfter(
      client,
      "auth login por email+IP",
      5,
      "POST",
      "/api/auth/login",
      () => loginBody("blocked-auth@example.com")
    );

    await assertBlockedAfter(
      client,
      "registro publico por IP",
      5,
      "POST",
      "/api/auth/register",
      (attempt) => ({
        name: `Rate Register ${attempt}`,
        email: `rate-register-${attempt}@example.com`,
        password: "password-123"
      })
    );

    await assertBlockedAfter(
      client,
      "recovery admin por IP",
      3,
      "POST",
      "/api/recovery-admin",
      () => ({ password: "wrong-recovery-pass" })
    );

    await assertBlockedAfter(
      client,
      "solicitud de socio por IP",
      10,
      "POST",
      "/api/associates/apply",
      (attempt) => associateApplyBody(attempt)
    );

    await assertBlockedAfter(
      client,
      "join live con codigo invalido",
      10,
      "POST",
      "/api/test-zone/live/join",
      () => ({
        guestName: "Rate Guest",
        code: "BADRATE"
      })
    );

    await assertBlockedAfter(
      client,
      "attempt Test Zone live por participante",
      3,
      "POST",
      "/api/test-zone/live-sessions/rate-test-zone-live-session/attempt",
      () => ({
        guestName: "Rate Guest",
        questionIds: ["rate-test-zone-question-1"],
        answers: [0]
      })
    );

    await assertBlockedAfter(
      client,
      "submit live publico por participante",
      3,
      "POST",
      "/api/live-test-sessions/PUBRATE/submit",
      () => ({
        participantName: "Rate Public Guest",
        answers: {
          "rate-live-question-1": 0
        }
      })
    );
  } finally {
    await stopServer(server);
  }
}

async function runForwardedForIgnoredCheck() {
  const server = await startServer({ trustProxyHeaders: false });
  try {
    const client = createClient(server.baseUrl);
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const response = await client.request(
        "POST",
        "/api/recovery-admin",
        { password: "wrong-recovery-pass" },
        { headers: { "X-Forwarded-For": `203.0.113.${attempt + 1}` } }
      );
      assert.notEqual(response.status, 429, "X-Forwarded-For no confiado se bloqueo antes de tiempo");
    }
    const blocked = await client.request(
      "POST",
      "/api/recovery-admin",
      { password: "wrong-recovery-pass" },
      { headers: { "X-Forwarded-For": "203.0.113.99" } }
    );
    assertRateLimited(blocked, "X-Forwarded-For no confiado");
  } finally {
    await stopServer(server);
  }
}

async function runForwardedForTrustedCheck() {
  const server = await startServer({ trustProxyHeaders: true });
  try {
    const client = createClient(server.baseUrl);
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const response = await client.request(
        "POST",
        "/api/recovery-admin",
        { password: "wrong-recovery-pass" },
        { headers: { "X-Forwarded-For": "203.0.113.10" } }
      );
      assert.notEqual(response.status, 429, "X-Forwarded-For confiado se bloqueo antes de tiempo");
    }
    const responseFromOtherIp = await client.request(
      "POST",
      "/api/recovery-admin",
      { password: "wrong-recovery-pass" },
      { headers: { "X-Forwarded-For": "203.0.113.11" } }
    );
    assert.notEqual(responseFromOtherIp.status, 429, "X-Forwarded-For confiado debe separar clientes");
  } finally {
    await stopServer(server);
  }
}

async function main() {
  await runMainRateLimitChecks();
  await runForwardedForIgnoredCheck();
  await runForwardedForTrustedCheck();
  console.log("Rate limit checks passed.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
