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
const tempRoot = mkdtempSync(path.join(os.tmpdir(), "iz-state-transport-check-"));
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
  seed.testZoneQuestions = [
    {
      id: "tz-question-1",
      prompt: "Pregunta sensible",
      options: ["A", "B", "C"],
      correctIndex: 1,
      explanation: "La respuesta correcta no debe viajar al socio",
      part: "comun",
      category: "seguridad",
      difficulty: "media",
      createdBy: "Admin",
      createdAt: "2026-01-01T00:00:00.000Z"
    }
  ];
  seed.testZoneResults = [
    {
      id: "tz-result-own",
      userId: "account-2",
      memberId: "member-1",
      questionIds: ["tz-question-1"],
      correctCount: 0,
      wrongCount: 1,
      total: 1,
      percentage: 0,
      createdAt: "2026-01-02T00:00:00.000Z"
    },
    {
      id: "tz-result-other",
      userId: "account-3",
      memberId: "member-2",
      questionIds: ["tz-question-1"],
      correctCount: 1,
      wrongCount: 0,
      total: 1,
      percentage: 100,
      createdAt: "2026-01-03T00:00:00.000Z"
    },
    {
      id: "tz-result-guest",
      guestName: "Invitado",
      questionIds: ["tz-question-1"],
      correctCount: 1,
      wrongCount: 0,
      total: 1,
      percentage: 100,
      createdAt: "2026-01-04T00:00:00.000Z"
    }
  ];
  seed.testZoneReviewMarks = [
    {
      id: "tz-review-own",
      userId: "account-2",
      memberId: "member-1",
      questionId: "tz-question-1",
      status: "reviewed"
    },
    {
      id: "tz-review-other",
      userId: "account-3",
      memberId: "member-2",
      questionId: "tz-question-1",
      status: "reviewed"
    }
  ];
  seed.testZoneLiveSessions = [
    {
      id: "tz-live-session-1",
      code: "LIVE1",
      title: "Sesion visible solo admin",
      questionIds: ["tz-question-1"],
      attempts: [{ participantName: "Participante", score: 1 }],
      active: true
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
  const port = await getAvailablePort();
  const baseUrl = `http://127.0.0.1:${port}`;
  const server = startServer(port, baseUrl);
  try {
    await waitForServer(baseUrl);

    const adminClient = createClient("admin", baseUrl);
    const memberClient = createClient("member", baseUrl);

    await login(adminClient, "admin@isocronazero.org", "campus123");
    await login(memberClient, "lucia@isocronazero.org", "bomberos123");

    const memberState = (await memberClient.request("GET", "/api/state")).body;
    assert.equal(memberState.testZoneQuestions?.length, 1, "El socio debe recibir preguntas publicas");
    assert.equal("correctIndex" in memberState.testZoneQuestions[0], false, "El socio no debe recibir correctIndex");
    assert.equal("correctAnswer" in memberState.testZoneQuestions[0], false, "El socio no debe recibir correctAnswer");
    assert.equal("explanation" in memberState.testZoneQuestions[0], false, "El socio no debe recibir explicacion");
    assert.deepEqual(
      (memberState.testZoneResults || []).map((result) => result.id),
      ["tz-result-own"],
      "El socio solo debe recibir sus resultados"
    );
    assert.deepEqual(
      (memberState.testZoneReviewMarks || []).map((mark) => mark.id),
      ["tz-review-own"],
      "El socio solo debe recibir sus marcas de repaso"
    );
    assert.deepEqual(memberState.testZoneLiveSessions, [], "El socio no debe recibir sesiones live completas");

    const adminState = (await adminClient.request("GET", "/api/state")).body;
    assert.equal(adminState.testZoneQuestions?.[0]?.correctIndex, 1, "Admin debe mantener correctIndex");
    assert.equal(
      adminState.testZoneQuestions?.[0]?.explanation,
      "La respuesta correcta no debe viajar al socio",
      "Admin debe mantener explicacion"
    );
    assert.equal(adminState.testZoneResults?.length, 3, "Admin debe mantener todos los resultados Test Zone");
    assert.equal(adminState.testZoneReviewMarks?.length, 2, "Admin debe mantener todas las marcas");
    assert.equal(adminState.testZoneLiveSessions?.length, 1, "Admin debe mantener sesiones live completas");
    assert.equal(adminState.testZoneLiveSessions?.[0]?.code, "LIVE1", "Admin debe mantener detalle de sesion live");
  } finally {
    await stopServer(server);
    rmSync(tempRoot, { recursive: true, force: true });
  }
}

main()
  .then(() => {
    console.log("State transport scoping check passed.");
  })
  .catch((error) => {
    console.error(error);
    console.error(`STDOUT:\n${serverOut.join("")}`);
    console.error(`STDERR:\n${serverErr.join("")}`);
    rmSync(tempRoot, { recursive: true, force: true });
    process.exit(1);
  });
