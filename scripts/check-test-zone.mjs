import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { setTimeout as delay } from "node:timers/promises";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const bundledDefaultStatePath = path.join(repoRoot, "data", "default-state.json");
const nodeModulesCandidates = [
  path.join(repoRoot, "node_modules"),
  path.join(path.dirname(repoRoot), "Isocrona Zero", "node_modules")
];
const nodeModulesPath = nodeModulesCandidates.find((candidate) => existsSync(candidate)) || "";
const tempRoot = mkdtempSync(path.join(os.tmpdir(), "iz-test-zone-check-"));
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
  seed.testZoneQuestions = [];
  seed.testZoneResults = [];
  seed.testZoneReviewMarks = [];
  seed.testZoneLiveSessions = [];
  return seed;
}

function createJsonClient(label, baseUrl) {
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
      const parsedBody = text ? JSON.parse(text) : null;
      if (!response.ok && options.allowFailure !== true) {
        throw new Error(`${label} ${method} ${requestPath} -> ${response.status}: ${parsedBody?.error || text}`);
      }
      return { status: response.status, body: parsedBody };
    }
  };
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

async function login(client, email, password) {
  const response = await client.request("POST", "/api/login", { email, password });
  assert.equal(response.body?.ok, true, `Login esperado para ${email}`);
}

function assertQuestionSafe(question) {
  assert.equal(Object.prototype.hasOwnProperty.call(question, "correctIndex"), false);
  assert.equal(Object.prototype.hasOwnProperty.call(question, "explanation"), false);
}

async function main() {
  const port = await getAvailablePort();
  const baseUrl = `http://127.0.0.1:${port}`;
  const server = startServer(port, baseUrl);
  try {
    await waitForServer(baseUrl);

    const adminClient = createJsonClient("admin", baseUrl);
    const memberClient = createJsonClient("member", baseUrl);
    const secondMemberClient = createJsonClient("member-2", baseUrl);

    await login(adminClient, "admin@isocronazero.org", "campus123");
    await login(memberClient, "lucia@isocronazero.org", "bomberos123");
    await login(secondMemberClient, "javier@isocronazero.org", "bomberos123");

    const createdQuestions = [];
    for (const payload of [
      {
        prompt: "¿Qué norma regula la prevención de riesgos?",
        options: ["Ley 31/1995", "Ley 1/2000", "Ley 7/1985", "Ley 39/2015"],
        correctIndex: 0,
        part: "Parte común",
        category: "Legislación",
        difficulty: "media"
      },
      {
        prompt: "¿Qué equipo se usa para ataque interior?",
        options: ["ERA", "Camilla", "Motosierra", "Cizalla"],
        correctIndex: 0,
        part: "Parte específica",
        category: "Bomberos",
        difficulty: "media"
      },
      {
        prompt: "¿Qué color tiene la señal de salvamento?",
        options: ["Rojo", "Azul", "Verde", "Negro"],
        correctIndex: 2,
        part: "Parte común",
        category: "Legislación",
        difficulty: "baja"
      }
    ]) {
      const response = await adminClient.request("POST", "/api/test-zone/questions", payload);
      assert.equal(response.body?.ok, true);
      createdQuestions.push(response.body?.question);
    }

    const memberQuestionsResponse = await memberClient.request("GET", "/api/test-zone/questions");
    assert.equal(memberQuestionsResponse.body?.ok, true);
    assert.equal((memberQuestionsResponse.body?.questions || []).length, 3);
    (memberQuestionsResponse.body?.questions || []).forEach(assertQuestionSafe);

    const questionIds = [createdQuestions[0]?.id, createdQuestions[1]?.id, createdQuestions[2]?.id];
    const answers = [0, 1, null];
    const saveResultResponse = await memberClient.request("POST", "/api/test-zone/results", {
      title: "Entrenamiento legislación",
      mode: "general",
      filters: { part: "Parte común", category: "Legislación", difficulty: "all", source: "bank" },
      questionIds,
      answers
    });
    assert.equal(saveResultResponse.body?.ok, true);
    assert.equal(saveResultResponse.body?.result?.correctCount, 1);
    assert.equal(saveResultResponse.body?.result?.wrongCount, 1);
    assert.equal(saveResultResponse.body?.result?.blankCount, 1);

    const secondMemberResultResponse = await secondMemberClient.request("POST", "/api/test-zone/results", {
      title: "Entrenamiento otro socio",
      mode: "general",
      questionIds,
      answers: [1, 0, 2]
    });
    assert.equal(secondMemberResultResponse.body?.ok, true);

    const historyResponse = await memberClient.request("GET", "/api/test-zone/results/me");
    assert.equal(historyResponse.body?.ok, true);
    assert.equal(historyResponse.body?.stats?.totalTests, 1);
    assert.equal(historyResponse.body?.stats?.correct, 1);
    assert.equal((historyResponse.body?.failedQuestionIds || []).length, 1);

    const failedQuestionId = historyResponse.body?.failedQuestionIds?.[0];
    const reviewResponse = await memberClient.request(
      "POST",
      `/api/test-zone/questions/${encodeURIComponent(failedQuestionId)}/review`,
      {}
    );
    assert.equal(reviewResponse.body?.ok, true);

    const historyAfterReviewResponse = await memberClient.request("GET", "/api/test-zone/results/me");
    assert.equal((historyAfterReviewResponse.body?.reviewedQuestionIds || []).includes(failedQuestionId), true);

    await memberClient.request("POST", "/api/test-zone/results", {
      title: "Nuevo fallo despues de repasar",
      mode: "failed",
      questionIds: [failedQuestionId],
      answers: [1]
    });
    const historyAfterNewFailureResponse = await memberClient.request("GET", "/api/test-zone/results/me");
    assert.equal(
      (historyAfterNewFailureResponse.body?.failedQuestionIds || []).includes(failedQuestionId),
      true,
      "Una pregunta repasada debe volver a falladas si se falla despues"
    );

    const liveSessionResponse = await adminClient.request("POST", "/api/test-zone/live-sessions", {
      title: "Simulacro abierto",
      questionCount: 2,
      filters: { part: "all", category: "all", difficulty: "all" }
    });
    assert.equal(liveSessionResponse.body?.ok, true);
    assert.ok(liveSessionResponse.body?.session?.code);

    const publicJoinResponse = await fetch(new URL("/api/test-zone/live/join", baseUrl), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        guestName: "Visitante",
        code: liveSessionResponse.body?.session?.code
      })
    });
    const joinPayload = await publicJoinResponse.json();
    assert.equal(publicJoinResponse.ok, true);
    assert.equal(joinPayload?.ok, true);
    assert.equal((joinPayload?.liveSession?.questions || []).length, 2);
    (joinPayload?.liveSession?.questions || []).forEach(assertQuestionSafe);

    const liveQuestionIds = (joinPayload?.liveSession?.questions || []).map((question) => question.id);
    const outsideLiveQuestionId = questionIds.find((questionId) => !liveQuestionIds.includes(questionId));
    assert.ok(outsideLiveQuestionId, "El check necesita una pregunta fuera de la sesion live");

    const outsideLiveAttemptResponse = await fetch(
      new URL(`/api/test-zone/live-sessions/${encodeURIComponent(joinPayload.liveSession.id)}/attempt`, baseUrl),
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guestName: "Visitante",
          questionIds: [...liveQuestionIds, outsideLiveQuestionId],
          answers: [0, 0, 0]
        })
      }
    );
    assert.equal(outsideLiveAttemptResponse.status, 400);

    const duplicateLiveAttemptResponse = await fetch(
      new URL(`/api/test-zone/live-sessions/${encodeURIComponent(joinPayload.liveSession.id)}/attempt`, baseUrl),
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guestName: "Visitante",
          questionIds: [liveQuestionIds[0], liveQuestionIds[0]],
          answers: [0, 0]
        })
      }
    );
    assert.equal(duplicateLiveAttemptResponse.status, 400);

    const singleQuestionSessionResponse = await adminClient.request("POST", "/api/test-zone/live-sessions", {
      title: "Sesion de una pregunta",
      questionCount: 1,
      filters: { part: "all", category: "all", difficulty: "all" }
    });
    assert.equal(singleQuestionSessionResponse.body?.ok, true);
    const singleQuestionJoinResponse = await fetch(new URL("/api/test-zone/live/join", baseUrl), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        guestName: "Visitante",
        code: singleQuestionSessionResponse.body?.session?.code
      })
    });
    const singleQuestionJoinPayload = await singleQuestionJoinResponse.json();
    assert.equal(singleQuestionJoinResponse.ok, true);
    const singleLiveQuestionIds = (singleQuestionJoinPayload?.liveSession?.questions || []).map((question) => question.id);
    assert.equal(singleLiveQuestionIds.length, 1);
    const singleOutsideQuestionId = questionIds.find((questionId) => !singleLiveQuestionIds.includes(questionId));
    assert.ok(singleOutsideQuestionId, "El check necesita una segunda pregunta fuera de la sesion de una pregunta");
    const oversizedSingleAttemptResponse = await fetch(
      new URL(
        `/api/test-zone/live-sessions/${encodeURIComponent(singleQuestionJoinPayload.liveSession.id)}/attempt`,
        baseUrl
      ),
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guestName: "Visitante",
          questionIds: [singleLiveQuestionIds[0], singleOutsideQuestionId],
          answers: [0, 0]
        })
      }
    );
    assert.equal(oversizedSingleAttemptResponse.status, 400);

    const publicAttemptResponse = await fetch(
      new URL(`/api/test-zone/live-sessions/${encodeURIComponent(joinPayload.liveSession.id)}/attempt`, baseUrl),
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guestName: "Visitante",
          questionIds: liveQuestionIds,
          answers: [0, 0]
        })
      }
    );
    const publicAttemptPayload = await publicAttemptResponse.json();
    assert.equal(publicAttemptResponse.ok, true);
    assert.equal(publicAttemptPayload?.ok, true);
    assert.equal(typeof publicAttemptPayload?.result?.score, "number");

    const closeLiveSessionResponse = await adminClient.request(
      "POST",
      `/api/test-zone/live-sessions/${encodeURIComponent(joinPayload.liveSession.id)}/close`,
      {}
    );
    assert.equal(closeLiveSessionResponse.body?.ok, true);
    assert.equal(closeLiveSessionResponse.body?.session?.status, "closed");

    const closedLiveAttemptResponse = await fetch(
      new URL(`/api/test-zone/live-sessions/${encodeURIComponent(joinPayload.liveSession.id)}/attempt`, baseUrl),
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guestName: "Visitante",
          questionIds: liveQuestionIds,
          answers: [0, 0]
        })
      }
    );
    assert.equal(closedLiveAttemptResponse.status, 404);

    const expiringSessionResponse = await adminClient.request("POST", "/api/test-zone/live-sessions", {
      title: "Sesion caducada",
      questionCount: 1,
      filters: { part: "all", category: "all", difficulty: "all" },
      expiresAt: new Date(Date.now() + 1000).toISOString()
    });
    assert.equal(expiringSessionResponse.body?.ok, true);
    const expiringJoinResponse = await fetch(new URL("/api/test-zone/live/join", baseUrl), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        guestName: "Visitante",
        code: expiringSessionResponse.body?.session?.code
      })
    });
    const expiringJoinPayload = await expiringJoinResponse.json();
    assert.equal(expiringJoinResponse.ok, true);
    const expiringQuestionIds = (expiringJoinPayload?.liveSession?.questions || []).map((question) => question.id);
    assert.equal(expiringQuestionIds.length, 1);
    await delay(1200);
    const expiredLiveAttemptResponse = await fetch(
      new URL(`/api/test-zone/live-sessions/${encodeURIComponent(expiringJoinPayload.liveSession.id)}/attempt`, baseUrl),
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guestName: "Visitante",
          questionIds: expiringQuestionIds,
          answers: [0]
        })
      }
    );
    assert.equal(expiredLiveAttemptResponse.status, 404);

    const memberStateResponse = await memberClient.request("GET", "/api/state");
    assert.equal(memberStateResponse.body?.ok, undefined);
    (memberStateResponse.body?.testZoneQuestions || []).forEach(assertQuestionSafe);
    assert.equal(
      (memberStateResponse.body?.testZoneResults || []).some((result) => result.title === "Entrenamiento otro socio"),
      false,
      "El state de socio no debe exponer resultados de otros socios"
    );
    assert.equal(
      (memberStateResponse.body?.testZoneResults || []).some((result) => result.title === "Simulacro abierto"),
      false,
      "El state de socio no debe exponer resultados de invitados"
    );
    assert.equal(
      (memberStateResponse.body?.testZoneReviewMarks || []).every((mark) => mark.questionId === failedQuestionId),
      true,
      "El state de socio solo debe incluir marcas de repaso propias"
    );
    assert.equal((memberStateResponse.body?.testZoneLiveSessions || []).length, 0, "El socio no debe ver sesiones live completas");

    const publicPageResponse = await fetch(new URL("/public-live-test.html", baseUrl));
    assert.equal(publicPageResponse.ok, true);

    console.log("Test zone checks passed.");
  } finally {
    server.kill("SIGTERM");
    await delay(250);
    rmSync(tempRoot, { recursive: true, force: true });
  }
}

main().catch((error) => {
  console.error(error);
  rmSync(tempRoot, { recursive: true, force: true });
  process.exit(1);
});
