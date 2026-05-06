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
const tempRoot = mkdtempSync(path.join(os.tmpdir(), "iz-live-check-"));
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

function iso(timestamp) {
  return new Date(timestamp).toISOString();
}

function buildSeedState() {
  const seed = JSON.parse(readFileSync(bundledDefaultStatePath, "utf8"));
  const now = Date.now();
  const moduleId = "test-module-live-smoke";
  const testId = "test-live-smoke";
  const questionOneId = "question-live-smoke-1";
  const questionTwoId = "question-live-smoke-2";

  seed.testModules = [
    {
      id: moduleId,
      title: "Live smoke",
      description: "Checks for independent live tests",
      createdAt: iso(now - 60_000)
    }
  ];
  seed.questions = [
    {
      id: questionOneId,
      moduleId,
      prompt: "Primera pregunta live",
      options: ["A", "B", "C", "D"],
      correctIndex: 0,
      explanation: "Solo para admins",
      createdAt: iso(now - 59_000)
    },
    {
      id: questionTwoId,
      moduleId,
      prompt: "Segunda pregunta live",
      options: ["Rojo", "Verde", "Azul", "Negro"],
      correctIndex: 1,
      explanation: "Solo para admins",
      createdAt: iso(now - 58_000)
    }
  ];
  seed.tests = [
    {
      id: testId,
      moduleId,
      title: "Test live smoke",
      description: "Test de dos preguntas para smoke live",
      questionIds: [questionOneId, questionTwoId],
      published: true,
      timeLimitSeconds: null,
      createdAt: iso(now - 57_000)
    }
  ];
  seed.testAttempts = [];
  seed.liveTestSessions = [
    {
      id: "live-session-stale-lobby",
      testId,
      pin: "111111",
      hostMemberId: "member-4",
      status: "lobby",
      currentQuestionIndex: -1,
      questionStartedAt: "",
      questionTimeLimitSeconds: 20,
      createdAt: iso(now - 3 * 60 * 60 * 1000),
      startedAt: "",
      finishedAt: ""
    },
    {
      id: "live-session-stale-running",
      testId,
      pin: "333333",
      hostMemberId: "member-4",
      status: "running",
      currentQuestionIndex: 0,
      questionStartedAt: iso(now - 5 * 60 * 60 * 1000),
      questionTimeLimitSeconds: 20,
      createdAt: iso(now - 5 * 60 * 60 * 1000),
      startedAt: iso(now - 5 * 60 * 60 * 1000),
      finishedAt: ""
    },
    {
      id: "live-session-late",
      testId,
      pin: "222222",
      hostMemberId: "member-4",
      status: "running",
      currentQuestionIndex: 0,
      questionStartedAt: "",
      questionTimeLimitSeconds: 20,
      createdAt: iso(now - 30_000),
      startedAt: "",
      finishedAt: ""
    }
  ];
  seed.liveTestPlayers = [
    {
      id: "live-player-late-member-1",
      sessionId: "live-session-late",
      memberId: "member-1",
      displayName: "Lucia Late",
      score: 0,
      joinedAt: iso(now - 29_000),
      lastSeenAt: iso(now - 29_000)
    }
  ];
  seed.liveTestAnswers = [];
  return seed;
}

function getForbiddenKeyPath(value, forbiddenKeys, currentPath = "$") {
  if (Array.isArray(value)) {
    for (let index = 0; index < value.length; index += 1) {
      const nestedPath = getForbiddenKeyPath(value[index], forbiddenKeys, `${currentPath}[${index}]`);
      if (nestedPath) {
        return nestedPath;
      }
    }
    return "";
  }

  if (!value || typeof value !== "object") {
    return "";
  }

  for (const [key, nestedValue] of Object.entries(value)) {
    if (forbiddenKeys.has(key)) {
      return `${currentPath}.${key}`;
    }
    const nestedPath = getForbiddenKeyPath(nestedValue, forbiddenKeys, `${currentPath}.${key}`);
    if (nestedPath) {
      return nestedPath;
    }
  }

  return "";
}

function assertForbiddenKeysAbsent(payload, label) {
  const forbiddenPath = getForbiddenKeyPath(payload, new Set(["correctIndex", "explanation", "answers", "selectedIndex"]));
  assert.equal(forbiddenPath, "", `${label} expone una clave privada: ${forbiddenPath}`);
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

      return {
        status: response.status,
        body: parsedBody
      };
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

  child.stdout.on("data", (chunk) => {
    serverOut.push(String(chunk));
  });
  child.stderr.on("data", (chunk) => {
    serverErr.push(String(chunk));
  });

  return child;
}

async function waitForServerReady(baseUrl) {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    try {
      const response = await fetch(`${baseUrl}/healthz`);
      if (response.ok) {
        return;
      }
    } catch {
      // Retry while the server boots.
    }
    await delay(250);
  }

  throw new Error("El servidor de smoke live no arranco a tiempo");
}

async function login(client, email, password) {
  const response = await client.request("POST", "/api/login", { email, password });
  assert.equal(response.body?.ok, true, `No se pudo iniciar sesion con ${email}`);
  return response.body.session;
}

async function main() {
  const port = await getAvailablePort();
  const baseUrl = `http://127.0.0.1:${port}`;
  const child = startServer(port, baseUrl);

  try {
    await waitForServerReady(baseUrl);

    const adminClient = createJsonClient("admin", baseUrl);
    const memberClient = createJsonClient("member", baseUrl);

    await login(adminClient, "admin@isocronazero.org", "campus123");
    await login(memberClient, "lucia@isocronazero.org", "bomberos123");

    const importResponse = await adminClient.request("POST", "/api/tests/import-csv", {
      csv: [
        "moduleTitle,testTitle,published,prompt,optionA,optionB,optionC,optionD,correctOption,explanation,topic,difficulty,questionTimeLimitSeconds",
        '"Importacion CSV","Test CSV",si,"Pregunta 1","Agua","Espuma","Polvo","","B","Explicacion, con coma",,,"15"',
        '"Importacion CSV","Test CSV",si,"Pregunta 2","Linea 1","Linea 2","","","1","Texto con ""comillas""",,,"15"'
      ].join("\r\n")
    });
    assert.equal(importResponse.body?.ok, true);
    assert.equal(importResponse.body?.summary?.rowsReceived, 2);
    assert.equal(importResponse.body?.summary?.rowsImported, 2);
    assert.equal(importResponse.body?.summary?.modulesCreated, 1);
    assert.equal(importResponse.body?.summary?.testsCreated, 1);
    assert.equal(importResponse.body?.summary?.questionsCreated, 2);
    assert.equal((importResponse.body?.summary?.errors || []).length, 0);

    const importedTestsResponse = await adminClient.request("GET", "/api/tests");
    const importedTest = (importedTestsResponse.body?.tests || []).find((test) => test.title === "Test CSV");
    assert.ok(importedTest, "El importador debe crear el test indicado");
    assert.equal(importedTest.published, true);
    assert.equal(importedTest.timeLimitSeconds, 15);
    assert.equal((importedTest.questionIds || []).length, 2, "El test importado debe referenciar las dos preguntas");

    const importedModulesResponse = await adminClient.request("GET", "/api/test-modules");
    const importedModule = (importedModulesResponse.body?.testModules || []).find((testModule) => testModule.title === "Importacion CSV");
    assert.ok(importedModule, "El importador debe crear el modulo indicado");
    assert.equal(importedTest.moduleId, importedModule.id);

    const memberImportedQuestionsResponse = await memberClient.request(
      "GET",
      `/api/questions?testId=${encodeURIComponent(importedTest.id)}`
    );
    assert.equal(memberImportedQuestionsResponse.body?.ok, true);
    assert.equal((memberImportedQuestionsResponse.body?.questions || []).length, 2);
    assertForbiddenKeysAbsent(memberImportedQuestionsResponse.body, "imported member question payload");

    const sessionsBefore = await adminClient.request("GET", "/api/live-tests");
    assert.equal(sessionsBefore.body?.ok, true);
    const staleLobby = sessionsBefore.body.sessions.find((session) => session.id === "live-session-stale-lobby");
    const staleRunning = sessionsBefore.body.sessions.find((session) => session.id === "live-session-stale-running");
    assert.equal(staleLobby?.status, "finished", "La sesion lobby antigua no se marco como finalizada");
    assert.equal(staleRunning?.status, "finished", "La sesion running antigua no se marco como finalizada");

    const staleJoin = await memberClient.request("POST", "/api/live-tests/join", { pin: "111-111" }, { allowFailure: true });
    assert.equal(staleJoin.status, 404, "Una sesion live finalizada no deberia admitir nuevos joins");

    const createdSessionResponse = await adminClient.request("POST", "/api/live-tests", {
      testId: "test-live-smoke",
      questionTimeLimitSeconds: 5
    });
    const createdSession = createdSessionResponse.body?.session;
    assert.equal(createdSessionResponse.status, 201, "La sesion live no se creo correctamente");
    assert.match(String(createdSession?.pin || ""), /^\d{6}$/, "El PIN live debe tener 6 digitos");
    assert.equal(createdSession?.status, "lobby");
    assert.equal(createdSession?.questionTimeLimitSeconds, 5);

    const formattedPin = `${createdSession.pin.slice(0, 3)}-${createdSession.pin.slice(3)}`;
    const joinResponse = await memberClient.request("POST", "/api/live-tests/join", {
      pin: formattedPin,
      displayName: "Lucia Smoke"
    });
    assert.equal(joinResponse.body?.ok, true);
    assert.equal(joinResponse.body?.session?.pin, createdSession.pin, "El join no normalizo bien el PIN");
    assert.equal(joinResponse.body?.session?.status, "lobby");
    assert.ok(joinResponse.body?.session?.player?.id, "El jugador live necesita id estable");
    assertForbiddenKeysAbsent(joinResponse.body, "join response");

    const startResponse = await adminClient.request("POST", `/api/live-tests/${createdSession.id}/start`, {});
    const startedSession = startResponse.body?.session;
    assert.equal(startedSession?.status, "running");
    assert.ok(startedSession?.questionStartedAt, "questionStartedAt debe fijarse al iniciar");
    const firstQuestionStartedAt = startedSession.questionStartedAt;

    const memberSessionResponse = await memberClient.request("GET", `/api/live-tests/${createdSession.id}`);
    const memberSession = memberSessionResponse.body?.session;
    assert.equal(memberSession?.status, "running");
    assert.equal(memberSession?.currentQuestionIndex, 0);
    assert.equal(memberSession?.currentQuestion?.id, "question-live-smoke-1");
    assertForbiddenKeysAbsent(memberSessionResponse.body, "player session response");

    const answerResponse = await memberClient.request("POST", `/api/live-tests/${createdSession.id}/answer`, {
      questionId: memberSession.currentQuestion.id,
      selectedIndex: 0,
      responseTimeMs: 999999
    });
    assert.equal(answerResponse.body?.ok, true);
    assert.equal(answerResponse.body?.accepted, true);
    assert.equal(answerResponse.body?.isCorrect, true);
    assert.equal(answerResponse.body?.isLate, false);
    assert.ok(Number(answerResponse.body?.pointsAwarded || 0) > 100, "Una respuesta correcta y rapida debe puntuar > 100");
    assert.ok(Number(answerResponse.body?.score || 0) > 100, "La puntuacion acumulada debe sumar puntos, no solo aciertos");
    assertForbiddenKeysAbsent(answerResponse.body, "answer response");

    const duplicateAnswerResponse = await memberClient.request(
      "POST",
      `/api/live-tests/${createdSession.id}/answer`,
      {
        questionId: memberSession.currentQuestion.id,
        selectedIndex: 0
      },
      { allowFailure: true }
    );
    assert.equal(duplicateAnswerResponse.status, 400, "Responder dos veces la misma pregunta debe fallar");

    const hostRunningState = await adminClient.request("GET", `/api/live-tests/${createdSession.id}`);
    const hostLeaderboardEntry = (hostRunningState.body?.session?.leaderboard || []).find(
      (entry) => String(entry.displayName || "") === "Lucia Smoke"
    );
    assert.ok(hostLeaderboardEntry, "El leaderboard live debe reflejar la puntuacion del jugador");
    assert.equal(hostLeaderboardEntry.score, answerResponse.body.score);

    await delay(25);
    const advanceResponse = await adminClient.request("POST", `/api/live-tests/${createdSession.id}/advance`, {});
    assert.equal(advanceResponse.body?.session?.currentQuestionIndex, 1);
    assert.ok(advanceResponse.body?.session?.questionStartedAt, "questionStartedAt debe existir tras avanzar");
    assert.notEqual(
      advanceResponse.body.session.questionStartedAt,
      firstQuestionStartedAt,
      "Al avanzar debe reiniciarse questionStartedAt"
    );

    await delay(600);
    const slowAnswerResponse = await memberClient.request("POST", `/api/live-tests/${createdSession.id}/answer`, {
      questionId: "question-live-smoke-2",
      selectedIndex: 1
    });
    const slowPointsAwarded = Number(slowAnswerResponse.body?.pointsAwarded || 0);
    assert.equal(slowAnswerResponse.body?.ok, true);
    assert.equal(slowAnswerResponse.body?.isCorrect, true);
    assert.equal(slowAnswerResponse.body?.isLate, false);
    assert.ok(slowPointsAwarded > 0, "Una respuesta correcta dentro de tiempo debe puntuar > 0");
    assert.ok(
      slowPointsAwarded <= 145,
      "Una respuesta correcta tras una espera medible debe perder bonus de rapidez"
    );

    const finishResponse = await adminClient.request("POST", `/api/live-tests/${createdSession.id}/finish`, {});
    assert.equal(finishResponse.body?.session?.status, "finished");

    const joinFinishedResponse = await memberClient.request(
      "POST",
      "/api/live-tests/join",
      { pin: formattedPin },
      { allowFailure: true }
    );
    assert.equal(joinFinishedResponse.status, 404, "Una sesion finalizada no debe admitir joins");

    const lateSessionResponse = await memberClient.request("GET", "/api/live-tests/live-session-late");
    assert.equal(lateSessionResponse.body?.session?.status, "running");
    assert.equal(lateSessionResponse.body?.session?.currentQuestion?.id, "question-live-smoke-1");
    assertForbiddenKeysAbsent(lateSessionResponse.body, "late player session response");

    const lateAnswerResponse = await memberClient.request("POST", "/api/live-tests/live-session-late/answer", {
      questionId: "question-live-smoke-1",
      selectedIndex: 0,
      responseTimeMs: 1
    });
    assert.equal(lateAnswerResponse.body?.ok, true);
    assert.equal(lateAnswerResponse.body?.isCorrect, true);
    assert.equal(lateAnswerResponse.body?.isLate, true, "Sin timestamps validos debe marcarse como tarde");
    assert.equal(lateAnswerResponse.body?.pointsAwarded, 0, "Sin timestamps validos no debe conceder puntos");
    assert.equal(lateAnswerResponse.body?.score, 0, "La puntuacion no debe aumentar cuando la respuesta es tardia");
    assertForbiddenKeysAbsent(lateAnswerResponse.body, "late answer response");

    const incorrectSessionResponse = await adminClient.request("POST", "/api/live-tests", {
      testId: "test-live-smoke",
      questionTimeLimitSeconds: 20
    });
    const incorrectSession = incorrectSessionResponse.body?.session;
    const incorrectFormattedPin = `${incorrectSession.pin.slice(0, 3)}-${incorrectSession.pin.slice(3)}`;
    await memberClient.request("POST", "/api/live-tests/join", {
      pin: incorrectFormattedPin,
      displayName: "Lucia Smoke"
    });
    await adminClient.request("POST", `/api/live-tests/${incorrectSession.id}/start`, {});
    const incorrectAnswerResponse = await memberClient.request("POST", `/api/live-tests/${incorrectSession.id}/answer`, {
      questionId: "question-live-smoke-1",
      selectedIndex: 3
    });
    assert.equal(incorrectAnswerResponse.body?.ok, true);
    assert.equal(incorrectAnswerResponse.body?.isCorrect, false, "Una respuesta incorrecta debe marcarse como incorrecta");
    assert.equal(incorrectAnswerResponse.body?.pointsAwarded, 0, "Una respuesta incorrecta no debe conceder puntos");
    assertForbiddenKeysAbsent(incorrectAnswerResponse.body, "incorrect answer response");

    console.log("Live smoke checks passed.");
  } finally {
    child.kill();
    await delay(300).catch(() => {});
    rmSync(tempRoot, { recursive: true, force: true });
  }
}

main().catch((error) => {
  console.error(error.message || error);
  if (serverOut.length) {
    console.error("\n--- server stdout ---");
    console.error(serverOut.join(""));
  }
  if (serverErr.length) {
    console.error("\n--- server stderr ---");
    console.error(serverErr.join(""));
  }
  if (existsSync(tempRoot)) {
    rmSync(tempRoot, { recursive: true, force: true });
  }
  process.exit(1);
});
