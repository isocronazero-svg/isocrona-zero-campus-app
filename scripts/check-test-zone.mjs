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

    const testViewSource = readFileSync(path.join(repoRoot, "public", "assets", "js", "app", "views", "testView.js"), "utf8");
    assert.match(
      testViewSource,
      /const reviewMarkToggleDisabled = run\.source === "reviewMarks";/,
      "El intento reviewMarks debe declarar bloqueo de desmarcado"
    );
    assert.match(
      testViewSource,
      /if \(testSession\.activeRun\?\.source === "reviewMarks"\)/,
      "El handler debe ignorar toggles de marca durante un intento reviewMarks"
    );
    assert.match(
      testViewSource,
      /function buildProgressStatsPanel\(\)/,
      "La Zona Test debe mostrar un panel de estadisticas personales"
    );
    assert.match(
      testViewSource,
      /Banco general[\s\S]*Falladas[\s\S]*Marcadas/,
      "El panel debe incluir desglose por banco, falladas y marcadas"
    );
    assert.match(
      testViewSource,
      /getLatestProgressActivity\(ownResults, reviewMarks\)/,
      "El panel debe mostrar ultima actividad desde resultados y marcas propias"
    );
    assert.match(
      testViewSource,
      /function buildResultReviewMarkup\(result = \{\}\)/,
      "La Zona Test debe construir revision detallada del resultado finalizado"
    );
    assert.match(
      testViewSource,
      /data-action="jump-result-review-question"/,
      "La revision detallada debe incluir navegacion entre preguntas"
    );
    assert.match(
      testViewSource,
      /formatSelectedReviewAnswer\(response\)[\s\S]*formatCorrectReviewAnswer\(response\)/,
      "La revision debe mostrar respuesta elegida y respuesta correcta"
    );

    const createdQuestions = [];
    for (const payload of [
      {
        prompt: "¿Qué norma regula la prevención de riesgos?",
        options: ["Ley 31/1995", "Ley 1/2000", "Ley 7/1985", "Ley 39/2015"],
        correctIndex: 0,
        part: "Parte común",
        category: "Legislación",
        difficulty: "media",
        explanation: "La Ley 31/1995 regula la prevencion de riesgos laborales."
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
    const initialReviewMarksResponse = await memberClient.request("GET", "/api/test-zone/review-marks/me");
    assert.equal(initialReviewMarksResponse.body?.ok, true);
    assert.equal((initialReviewMarksResponse.body?.marks || []).length, 0);

    const manualReviewMarkResponse = await memberClient.request("POST", "/api/test-zone/review-marks", {
      questionId: questionIds[0]
    });
    assert.equal(manualReviewMarkResponse.body?.ok, true);
    assert.equal(manualReviewMarkResponse.body?.mark?.questionId, questionIds[0]);
    assert.equal(manualReviewMarkResponse.body?.mark?.status, "review");
    assert.equal(manualReviewMarkResponse.body?.mark?.source, "manual");

    const duplicateReviewMarkResponse = await memberClient.request("POST", "/api/test-zone/review-marks", {
      questionId: questionIds[0]
    });
    assert.equal(duplicateReviewMarkResponse.body?.mark?.id, manualReviewMarkResponse.body?.mark?.id);
    const reviewMarksAfterDuplicateResponse = await memberClient.request("GET", "/api/test-zone/review-marks/me");
    assert.equal((reviewMarksAfterDuplicateResponse.body?.marks || []).length, 1, "La marca manual debe ser idempotente");

    const secondMemberReviewMarksResponse = await secondMemberClient.request("GET", "/api/test-zone/review-marks/me");
    assert.equal(
      (secondMemberReviewMarksResponse.body?.marks || []).some((mark) => mark.questionId === questionIds[0]),
      false,
      "Otro socio no debe ver marcas manuales ajenas"
    );

    await secondMemberClient.request("POST", "/api/test-zone/review-marks", {
      questionId: questionIds[2]
    });
    const invalidReviewMarkResponse = await memberClient.request(
      "POST",
      "/api/test-zone/review-marks",
      { questionId: "question-missing" },
      { allowFailure: true }
    );
    assert.equal(invalidReviewMarkResponse.status, 400, "No se deben marcar preguntas inexistentes");

    const deleteReviewMarkResponse = await memberClient.request("DELETE", `/api/test-zone/review-marks/${encodeURIComponent(questionIds[0])}`);
    assert.equal(deleteReviewMarkResponse.body?.ok, true);
    const reviewMarksAfterDeleteResponse = await memberClient.request("GET", "/api/test-zone/review-marks/me");
    assert.equal((reviewMarksAfterDeleteResponse.body?.marks || []).length, 0, "DELETE debe quitar solo la marca propia");

    await memberClient.request("POST", "/api/test-zone/review-marks", {
      questionId: questionIds[0]
    });
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
    assert.equal(saveResultResponse.body?.result?.responses?.[0]?.selectedAnswer, "Ley 31/1995");
    assert.equal(saveResultResponse.body?.result?.responses?.[0]?.correctAnswer, "Ley 31/1995");
    assert.equal(
      saveResultResponse.body?.result?.responses?.[0]?.explanation,
      "La Ley 31/1995 regula la prevencion de riesgos laborales."
    );
    assert.equal(saveResultResponse.body?.result?.responses?.[1]?.selectedAnswer, "Camilla");
    assert.equal(saveResultResponse.body?.result?.responses?.[1]?.correctAnswer, "ERA");
    assert.equal(saveResultResponse.body?.result?.responses?.[2]?.selectedAnswer, "");
    assert.equal(saveResultResponse.body?.result?.responses?.[2]?.correctAnswer, "Verde");

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
    assert.equal(
      historyResponse.body?.results?.[0]?.responses?.[0]?.correctAnswer,
      "Ley 31/1995",
      "El historial propio debe conservar respuestas correctas solo tras finalizar"
    );

    const failedQuestionId = historyResponse.body?.failedQuestionIds?.[0];
    const unmarkedReviewMarkedResultResponse = await memberClient.request(
      "POST",
      "/api/test-zone/results",
      {
        title: "Repasar marcadas contaminado",
        mode: "reviewMarks",
        source: "reviewMarks",
        filters: { part: "all", category: "all", difficulty: "all", source: "reviewMarks" },
        questionIds: [questionIds[1]],
        answers: [0]
      },
      { allowFailure: true }
    );
    assert.equal(
      unmarkedReviewMarkedResultResponse.status,
      400,
      "Un resultado reviewMarks no debe aceptar preguntas no marcadas por el socio"
    );

    const reviewMarkedResultResponse = await memberClient.request("POST", "/api/test-zone/results", {
      title: "Repasar marcadas",
      mode: "reviewMarks",
      source: "reviewMarks",
      filters: { part: "all", category: "all", difficulty: "all", source: "reviewMarks" },
      questionIds: [questionIds[0]],
      answers: [0]
    });
    assert.equal(reviewMarkedResultResponse.body?.ok, true);
    assert.equal(reviewMarkedResultResponse.body?.result?.source, "reviewMarks");
    assert.equal(reviewMarkedResultResponse.body?.result?.filters?.source, "reviewMarks");

    const historyAfterReviewMarkedResultResponse = await memberClient.request("GET", "/api/test-zone/results/me");
    assert.equal(
      (historyAfterReviewMarkedResultResponse.body?.results || []).some(
        (result) => result.title === "Repasar marcadas" && result.source === "reviewMarks"
      ),
      true,
      "El resultado del modo Repasar marcadas debe conservar su origen"
    );

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

    const contaminatedLiveViaNormalEndpointResponse = await memberClient.request(
      "POST",
      "/api/test-zone/results",
      {
        mode: "live",
        liveSessionId: singleQuestionJoinPayload.liveSession.id,
        questionIds: [singleLiveQuestionIds[0], singleOutsideQuestionId],
        answers: [0, 0]
      },
      { allowFailure: true }
    );
    assert.equal(
      [400, 403].includes(contaminatedLiveViaNormalEndpointResponse.status),
      true,
      "El endpoint normal de Zona Test no debe guardar resultados live con preguntas ajenas"
    );

    const validLiveViaNormalEndpointResponse = await memberClient.request(
      "POST",
      "/api/test-zone/results",
      {
        mode: "live",
        liveSessionId: singleQuestionJoinPayload.liveSession.id,
        questionIds: [singleLiveQuestionIds[0]],
        answers: [0]
      },
      { allowFailure: true }
    );
    assert.equal(
      validLiveViaNormalEndpointResponse.status,
      400,
      "El endpoint normal de Zona Test debe rechazar resultados live aunque sean validos"
    );

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
    assert.equal(
      Object.prototype.hasOwnProperty.call(publicAttemptPayload?.result?.responses?.[0] || {}, "correctAnswer"),
      false,
      "El endpoint publico live no debe recibir los detalles de revision del test normal"
    );

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
    assert.equal((memberStateResponse.body?.questions || []).length, 0, "El state de socio no debe exponer el banco de preguntas completo");
    assert.equal((memberStateResponse.body?.liveTestSessions || []).length, 0, "El state de socio no debe exponer sesiones live internas");
    assert.equal((memberStateResponse.body?.liveTestPublicSessions || []).length, 0, "El state de socio no debe exponer sesiones live publicas");
    assert.equal((memberStateResponse.body?.liveTestParticipantResults || []).length, 0, "El state de socio no debe exponer resultados live invitados");
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
      (memberStateResponse.body?.testZoneResults || []).some((result) =>
        (result.responses || []).some((response) => Object.prototype.hasOwnProperty.call(response, "correctAnswer"))
      ),
      false,
      "El state de socio no debe exponer respuestas correctas de resultados antes de pedir el historial finalizado"
    );
    const memberStateReviewMarks = memberStateResponse.body?.testZoneReviewMarks || [];
    assert.equal(
      memberStateReviewMarks.some((mark) => mark.questionId === questionIds[2]),
      false,
      "El state de socio no debe incluir marcas de repaso de otro socio"
    );
    assert.equal(
      memberStateReviewMarks.some((mark) => mark.questionId === questionIds[0] && mark.status === "review"),
      true,
      "El state de socio debe incluir su marca manual propia"
    );
    assert.equal(
      memberStateReviewMarks.some((mark) => mark.questionId === failedQuestionId),
      true,
      "El state de socio debe mantener su marca de fallada repasada"
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
