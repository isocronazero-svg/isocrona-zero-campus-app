const testsViewState = {
  role: "member",
  modules: [],
  tests: [],
  allQuestions: [],
  questionsByTestId: {},
  attemptsByTestId: {},
  leaderboardByTestId: {},
  currentUserRankByTestId: {},
  liveSessions: [],
  activeLiveSessionId: "",
  liveSessionState: null,
  lastLiveAnswerResultBySessionQuestionKey: {},
  liveQuestionShownAtBySessionId: {},
  startedAtByTestId: {},
  activeTestId: "",
  activeAttemptTestId: "",
  result: null,
  message: "",
  tone: "neutral",
  renderToken: 0,
  timerIntervalId: null,
  timerRemainingMs: null,
  autoSubmittingTestId: "",
  livePollIntervalId: null,
  liveCountdownIntervalId: null
};

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function getFrontendBridge() {
  return window.__IZ_FRONTEND_APP__ || null;
}

function getApiClient() {
  return getFrontendBridge()?.apiClient || null;
}

function isAdminRole(role) {
  return String(role || "member").trim() === "admin";
}

function setTestsViewMessage(message = "", tone = "neutral") {
  testsViewState.message = String(message || "").trim();
  testsViewState.tone = tone || "neutral";
}

function getTestsForModule(moduleId) {
  return testsViewState.tests.filter((test) => String(test.moduleId || "") === String(moduleId || ""));
}

function getQuestionsForTest(testId) {
  return Array.isArray(testsViewState.questionsByTestId[testId]) ? testsViewState.questionsByTestId[testId] : [];
}

function getUnusedQuestionsForModule(moduleId) {
  const usedQuestionIds = new Set(
    testsViewState.tests
      .filter((test) => String(test.moduleId || "").trim() === String(moduleId || "").trim())
      .flatMap((test) => (Array.isArray(test.questionIds) ? test.questionIds : []))
  );

  return (Array.isArray(testsViewState.allQuestions) ? testsViewState.allQuestions : []).filter(
    (question) =>
      String(question.moduleId || "").trim() === String(moduleId || "").trim() &&
      !usedQuestionIds.has(String(question.id || "").trim())
  );
}

function getAttemptsForTest(testId) {
  return Array.isArray(testsViewState.attemptsByTestId[testId]) ? testsViewState.attemptsByTestId[testId] : [];
}

function getLeaderboardForTest(testId) {
  return Array.isArray(testsViewState.leaderboardByTestId[testId]) ? testsViewState.leaderboardByTestId[testId] : [];
}

function getCurrentUserRankForTest(testId) {
  return testsViewState.currentUserRankByTestId[testId] || null;
}

function getLiveSessionQuestionKey(sessionState) {
  return `${String(sessionState?.id || "").trim()}::${String(sessionState?.currentQuestion?.id || "").trim()}::${String(sessionState?.status || "").trim()}`;
}

function getLiveAnswerResultKey(sessionId, questionId) {
  return `${String(sessionId || "").trim()}::${String(questionId || "").trim()}`;
}

function getLiveSessionCountdownState(sessionLike) {
  const questionStartedAt = Date.parse(String(sessionLike?.questionStartedAt || ""));
  const serverNow = Date.parse(String(sessionLike?.serverNow || ""));
  const questionTimeLimitSeconds = Number(sessionLike?.questionTimeLimitSeconds);
  if (!Number.isFinite(questionStartedAt) || !Number.isFinite(serverNow) || !Number.isFinite(questionTimeLimitSeconds) || questionTimeLimitSeconds <= 0) {
    return null;
  }

  const startedAtMs = questionStartedAt;
  const clientCapturedAtMs = Date.now();
  const limitMs = Math.floor(questionTimeLimitSeconds) * 1000;
  return {
    startedAtMs,
    serverNowMs: serverNow,
    clientCapturedAtMs,
    limitMs
  };
}

function computeLiveRemainingMsFromCountdown(countdownState) {
  if (!countdownState) {
    return null;
  }

  const elapsedSinceCaptureMs = Date.now() - countdownState.clientCapturedAtMs;
  const estimatedServerNowMs = countdownState.serverNowMs + elapsedSinceCaptureMs;
  return Math.max(countdownState.startedAtMs + countdownState.limitMs - estimatedServerNowMs, 0);
}

function getActiveStudentTest() {
  return testsViewState.tests.find((item) => item.id === testsViewState.activeTestId) || null;
}

function getStudentTestTimeLimitSeconds(test = getActiveStudentTest()) {
  const limit = Number(test?.timeLimitSeconds);
  return Number.isFinite(limit) && limit > 0 ? Math.floor(limit) : null;
}

function hasActiveTimedAttempt(test = getActiveStudentTest()) {
  return Boolean(
    test &&
      getStudentTestTimeLimitSeconds(test) &&
      testsViewState.activeAttemptTestId === test.id &&
      testsViewState.startedAtByTestId[test.id]
  );
}

function clearStudentTimer(resetAutoSubmitting = true) {
  if (testsViewState.timerIntervalId) {
    clearInterval(testsViewState.timerIntervalId);
    testsViewState.timerIntervalId = null;
  }
  testsViewState.timerRemainingMs = null;
  if (resetAutoSubmitting) {
    testsViewState.autoSubmittingTestId = "";
  }
}

function clearLivePolling() {
  if (testsViewState.livePollIntervalId) {
    clearInterval(testsViewState.livePollIntervalId);
    testsViewState.livePollIntervalId = null;
  }
}

function clearLiveCountdown() {
  if (testsViewState.liveCountdownIntervalId) {
    clearInterval(testsViewState.liveCountdownIntervalId);
    testsViewState.liveCountdownIntervalId = null;
  }
}

function getLiveStatusLabel(status) {
  const normalizedStatus = String(status || "").trim();
  if (normalizedStatus === "running") {
    return "En curso";
  }
  if (normalizedStatus === "finished") {
    return "Finalizada";
  }
  return "Lobby";
}

function formatCsvImportSummary(summary = {}) {
  const errors = Array.isArray(summary.errors) ? summary.errors : [];
  const errorPreview = errors
    .slice(0, 3)
    .map((entry) => `Fila ${entry.row}: ${entry.error}`)
    .join(" | ");
  const parts = [
    `Importadas ${Number(summary.rowsImported || 0)}/${Number(summary.rowsReceived || 0)} filas.`,
    `Modulos creados: ${Number(summary.modulesCreated || 0)}.`,
    `Tests creados: ${Number(summary.testsCreated || 0)}.`,
    `Preguntas creadas: ${Number(summary.questionsCreated || 0)}.`,
    `Errores: ${errors.length}.`
  ];
  if (errorPreview) {
    parts.push(errorPreview);
  }
  return parts.join(" ");
}

async function loadAdminData() {
  const client = getApiClient();
  if (!client) {
    throw new Error("Cliente API no disponible");
  }

  const [{ testModules }, { tests }, { questions }, { sessions }] = await Promise.all([
    client.get("/api/test-modules"),
    client.get("/api/tests"),
    client.get("/api/questions"),
    client.get("/api/live-tests")
  ]);

  testsViewState.modules = Array.isArray(testModules) ? testModules : [];
  testsViewState.tests = Array.isArray(tests) ? tests : [];
  testsViewState.allQuestions = Array.isArray(questions) ? questions : [];
  testsViewState.liveSessions = Array.isArray(sessions) ? sessions : [];
  testsViewState.questionsByTestId = {};
  testsViewState.attemptsByTestId = {};
  testsViewState.leaderboardByTestId = {};
  testsViewState.currentUserRankByTestId = {};
  testsViewState.liveSessionState = null;
  testsViewState.lastLiveAnswerResultBySessionQuestionKey = {};
  testsViewState.activeLiveSessionId = "";
  testsViewState.activeAttemptTestId = "";
  clearStudentTimer();
  clearLivePolling();
  clearLiveCountdown();

  const questionsById = new Map(testsViewState.allQuestions.map((question) => [question.id, question]));
  testsViewState.tests.forEach((test) => {
    testsViewState.questionsByTestId[test.id] = (Array.isArray(test.questionIds) ? test.questionIds : [])
      .map((questionId) => questionsById.get(questionId))
      .filter(Boolean);
  });
}

async function ensureStudentActiveTestQuestions() {
  const client = getApiClient();
  if (!client || !testsViewState.activeTestId) {
    return;
  }

  if (testsViewState.questionsByTestId[testsViewState.activeTestId]) {
    return;
  }

  const response = await client.get(`/api/questions?testId=${encodeURIComponent(testsViewState.activeTestId)}`);
  testsViewState.questionsByTestId[testsViewState.activeTestId] = Array.isArray(response.questions) ? response.questions : [];
}

async function ensureStudentActiveTestAttempts() {
  const client = getApiClient();
  if (!client || !testsViewState.activeTestId) {
    return;
  }

  const response = await client.get(`/api/tests/${encodeURIComponent(testsViewState.activeTestId)}/attempts/me`);
  testsViewState.attemptsByTestId[testsViewState.activeTestId] = Array.isArray(response.attempts) ? response.attempts : [];
}

async function ensureStudentActiveTestLeaderboard() {
  const client = getApiClient();
  if (!client || !testsViewState.activeTestId) {
    return;
  }

  const response = await client.get(`/api/tests/${encodeURIComponent(testsViewState.activeTestId)}/leaderboard`);
  testsViewState.leaderboardByTestId[testsViewState.activeTestId] = Array.isArray(response.leaderboard)
    ? response.leaderboard
    : [];
  testsViewState.currentUserRankByTestId[testsViewState.activeTestId] = response.currentUserRank || null;
}

function syncLiveQuestionShownAt(sessionState) {
  const sessionId = String(sessionState?.id || "").trim();
  const currentQuestionId = String(sessionState?.currentQuestion?.id || "").trim();
  if (!sessionId) {
    return;
  }
  if (!currentQuestionId) {
    delete testsViewState.liveQuestionShownAtBySessionId[sessionId];
    return;
  }
  const key = getLiveSessionQuestionKey(sessionState);
  if (testsViewState.liveQuestionShownAtBySessionId[sessionId]?.key === key) {
    return;
  }
  testsViewState.liveQuestionShownAtBySessionId[sessionId] = {
    key,
    shownAt: Date.now()
  };
}

async function ensureStudentActiveLiveSession() {
  const client = getApiClient();
  if (!client || !testsViewState.activeLiveSessionId) {
    testsViewState.liveSessionState = null;
    return;
  }

  const response = await client.get(`/api/live-tests/${encodeURIComponent(testsViewState.activeLiveSessionId)}`);
  testsViewState.liveSessionState = response.session || null;
  syncLiveQuestionShownAt(testsViewState.liveSessionState);
}

async function loadStudentData() {
  const client = getApiClient();
  if (!client) {
    throw new Error("Cliente API no disponible");
  }

  const [{ testModules }, { tests }] = await Promise.all([
    client.get("/api/test-modules"),
    client.get("/api/tests")
  ]);

  testsViewState.modules = Array.isArray(testModules) ? testModules : [];
  testsViewState.tests = Array.isArray(tests) ? tests : [];
  testsViewState.allQuestions = [];
  testsViewState.questionsByTestId = {};
  testsViewState.attemptsByTestId = {};
  testsViewState.leaderboardByTestId = {};
  testsViewState.currentUserRankByTestId = {};
  testsViewState.lastLiveAnswerResultBySessionQuestionKey = {};
  testsViewState.result = null;
  clearStudentTimer();
  clearLivePolling();
  clearLiveCountdown();

  const visibleTests = testsViewState.tests.filter((test) => Boolean(test.published));
  if (!visibleTests.length) {
    testsViewState.activeTestId = "";
  } else {
    const hasActiveVisibleTest = visibleTests.some((test) => test.id === testsViewState.activeTestId);
    testsViewState.activeTestId = hasActiveVisibleTest ? testsViewState.activeTestId : visibleTests[0].id;
  }
  if (!visibleTests.some((test) => test.id === testsViewState.activeAttemptTestId)) {
    testsViewState.activeAttemptTestId = "";
  }
  await ensureStudentActiveTestQuestions();
  await ensureStudentActiveTestAttempts();
  await ensureStudentActiveTestLeaderboard();
  if (testsViewState.activeLiveSessionId) {
    try {
      await ensureStudentActiveLiveSession();
    } catch (error) {
      testsViewState.liveSessionState = null;
      testsViewState.activeLiveSessionId = "";
    }
  } else {
    testsViewState.liveSessionState = null;
  }
}

function formatAttemptDate(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleString("es-ES", {
    dateStyle: "short",
    timeStyle: "short"
  });
}

function formatDurationMs(durationMs) {
  const normalized = Number(durationMs);
  if (!Number.isFinite(normalized) || normalized < 0) {
    return "";
  }

  const totalSeconds = Math.max(Math.round(normalized / 1000), 0);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function buildStudentResultSummary() {
  if (!testsViewState.result) {
    return testsViewState.message || "Elige un test publicado y responde desde aqui.";
  }

  const durationLabel = testsViewState.result.durationMs != null ? ` en ${formatDurationMs(testsViewState.result.durationMs)}` : "";
  const statusLabel = testsViewState.result.timedOut ? "Fuera de tiempo" : "Completado";
  return `${statusLabel}: ${testsViewState.result.score}/${testsViewState.result.total}${durationLabel}`;
}

function startStudentTimer(container) {
  clearStudentTimer();
  if (isAdminRole(testsViewState.role)) {
    return;
  }

  const test = getActiveStudentTest();
  const timeLimitSeconds = getStudentTestTimeLimitSeconds(test);
  if (!test || !timeLimitSeconds || !hasActiveTimedAttempt(test)) {
    return;
  }

  const startedAt = Number(testsViewState.startedAtByTestId[test.id] || Date.now());
  testsViewState.startedAtByTestId[test.id] = startedAt;

  const tick = async () => {
    const remainingMs = Math.max(startedAt + timeLimitSeconds * 1000 - Date.now(), 0);
    testsViewState.timerRemainingMs = remainingMs;
    const timerNode = container.querySelector("[data-tests-timer]");
    if (timerNode) {
      timerNode.textContent = formatDurationMs(remainingMs);
    }

    if (remainingMs > 0 || testsViewState.autoSubmittingTestId === test.id) {
      return;
    }

    testsViewState.autoSubmittingTestId = test.id;
    clearStudentTimer(false);
    const form = container.querySelector('form[data-tests-student-form="attempt"]');
    if (!form) {
      return;
    }

    try {
      await handleStudentAttemptSubmit(container, form, { timedOut: true });
    } catch (error) {
      setTestsViewMessage(error.message || "No se pudo enviar el test al agotarse el tiempo.", "error");
      renderTestsMarkup(container);
      finalizeTestsViewRender(container);
    }
  };

  tick();
  testsViewState.timerIntervalId = setInterval(() => {
    tick().catch(() => {});
  }, 1000);
}

function finalizeTestsViewRender(container) {
  startLiveCountdown(container);
  if (isAdminRole(testsViewState.role)) {
    clearStudentTimer();
    clearLivePolling();
    return;
  }
  if (hasActiveTimedAttempt()) {
    startStudentTimer(container);
  } else {
    clearStudentTimer();
  }
  startLiveSessionPolling(container);
}

function startLiveCountdown(container) {
  clearLiveCountdown();

  const updateCountdownNodes = () => {
    const timerNodes = Array.from(container.querySelectorAll("[data-live-timer]"));
    timerNodes.forEach((timerNode) => {
      const startedAtMs = Number(timerNode.dataset.liveQuestionStartedAtMs || 0);
      const serverNowMs = Number(timerNode.dataset.liveServerNowMs || 0);
      const clientCapturedAtMs = Number(timerNode.dataset.liveClientCapturedAtMs || 0);
      const limitMs = Number(timerNode.dataset.liveLimitMs || 0);
      const countdownState =
        startedAtMs > 0 && serverNowMs > 0 && clientCapturedAtMs > 0 && limitMs > 0
          ? { startedAtMs, serverNowMs, clientCapturedAtMs, limitMs }
          : null;
      const remainingMs = computeLiveRemainingMsFromCountdown(countdownState);
      if (remainingMs == null) {
        timerNode.textContent = "--";
        return;
      }
      timerNode.textContent = `${Math.ceil(remainingMs / 1000)}s`;
    });

    const answerForms = Array.from(container.querySelectorAll("[data-live-answer-form]"));
    answerForms.forEach((formNode) => {
      const startedAtMs = Number(formNode.dataset.liveQuestionStartedAtMs || 0);
      const serverNowMs = Number(formNode.dataset.liveServerNowMs || 0);
      const clientCapturedAtMs = Number(formNode.dataset.liveClientCapturedAtMs || 0);
      const limitMs = Number(formNode.dataset.liveLimitMs || 0);
      const countdownState =
        startedAtMs > 0 && serverNowMs > 0 && clientCapturedAtMs > 0 && limitMs > 0
          ? { startedAtMs, serverNowMs, clientCapturedAtMs, limitMs }
          : null;
      const remainingMs = computeLiveRemainingMsFromCountdown(countdownState);
      const isTimedOut = remainingMs != null && remainingMs <= 0;
      formNode.querySelectorAll("input, button").forEach((field) => {
        field.disabled = isTimedOut;
      });
      const timeoutNode = formNode.querySelector("[data-live-timeout-message]");
      if (timeoutNode) {
        timeoutNode.hidden = !isTimedOut;
      }
    });
  };

  updateCountdownNodes();
  testsViewState.liveCountdownIntervalId = setInterval(updateCountdownNodes, 1000);
}

function startLiveSessionPolling(container) {
  clearLivePolling();
  if (isAdminRole(testsViewState.role) || !testsViewState.activeLiveSessionId) {
    return;
  }

  const buildSessionRenderKey = (sessionState) =>
    JSON.stringify({
      id: sessionState?.id || "",
      status: sessionState?.status || "",
      currentQuestionId: sessionState?.currentQuestion?.id || "",
      hasAnsweredCurrentQuestion: Boolean(sessionState?.hasAnsweredCurrentQuestion),
      score: Number(sessionState?.player?.score || 0),
      leaderboard: Array.isArray(sessionState?.leaderboard)
        ? sessionState.leaderboard.map((entry) => `${entry.displayName}:${entry.score}`)
        : []
    });
  let previousKey = buildSessionRenderKey(testsViewState.liveSessionState);

  const poll = async () => {
    try {
      await ensureStudentActiveLiveSession();
      const nextKey = buildSessionRenderKey(testsViewState.liveSessionState);
      if (nextKey !== previousKey) {
        previousKey = nextKey;
        renderTestsMarkup(container);
        if (hasActiveTimedAttempt()) {
          startStudentTimer(container);
        } else {
          clearStudentTimer();
        }
      }
      if (String(testsViewState.liveSessionState?.status || "").trim() === "finished") {
        clearLivePolling();
      }
    } catch (error) {
      clearLivePolling();
      testsViewState.liveSessionState = null;
      testsViewState.activeLiveSessionId = "";
      setTestsViewMessage(error.message || "No se pudo actualizar la sesion live.", "error");
      renderTestsMarkup(container);
    }
  };

  testsViewState.livePollIntervalId = setInterval(() => {
    poll().catch(() => {});
  }, 2000);
}

function buildStudentAttemptsMarkup(attempts) {
  return attempts.length
    ? `
      <ul class="stack">
        ${attempts
          .map(
            (attempt) => `
              <li>
                <strong>${escapeHtml(`${attempt.score}/${attempt.total}`)}</strong>
                <p class="muted">
                  ${escapeHtml(formatAttemptDate(attempt.createdAt))}
                  ${attempt.durationMs != null ? ` · ${escapeHtml(formatDurationMs(attempt.durationMs))}` : ""}
                  ${attempt.timedOut ? " · Fuera de tiempo" : ""}
                </p>
              </li>
            `
          )
          .join("")}
      </ul>
    `
    : '<p class="muted">Todavia no has realizado intentos en este test.</p>';
}

function buildStudentLeaderboardMarkup(leaderboard) {
  return leaderboard.length
    ? `
      <ol class="stack">
        ${leaderboard
          .map(
            (entry) => `
              <li>
                <strong>${escapeHtml(entry.displayName || "Participante")}</strong>
                <p class="muted">
                  ${escapeHtml(`${entry.score}/${entry.total}`)}
                  ${entry.durationMs != null ? ` · ${escapeHtml(formatDurationMs(entry.durationMs))}` : ""}
                </p>
              </li>
            `
          )
          .join("")}
      </ol>
    `
    : '<p class="muted">Todavia no hay resultados para este ranking.</p>';
}

function buildStudentCurrentUserRankMarkup(currentUserRank, leaderboard) {
  if (!currentUserRank) {
    return "";
  }

  const isAlreadyVisible = leaderboard.some((entry) => String(entry.memberId || "").trim() === String(currentUserRank.memberId || "").trim());
  if (isAlreadyVisible) {
    return "";
  }

  return `
    <section class="panel panel-side">
      <h4>Tu posicion</h4>
      <p><strong>#${escapeHtml(String(currentUserRank.rank))}</strong> ${escapeHtml(currentUserRank.displayName || "Participante")}</p>
      <p class="muted">
        ${escapeHtml(`${currentUserRank.score}/${currentUserRank.total}`)}
        ${currentUserRank.durationMs != null ? ` · ${escapeHtml(formatDurationMs(currentUserRank.durationMs))}` : ""}
      </p>
    </section>
  `;
}

function buildQuestionOptionFields(question = null) {
  const options = Array.isArray(question?.options) ? question.options : ["", "", "", ""];
  return [0, 1, 2, 3]
    .map(
      (index) => `
        <label class="inline-field">
          Opcion ${index + 1}
          <input type="text" name="option${index}" value="${escapeHtml(options[index] || "")}" required />
        </label>
      `
    )
    .join("");
}

function buildCorrectIndexSelect(question = null) {
  const selectedIndex = Number.isInteger(Number(question?.correctIndex)) ? Number(question.correctIndex) : 0;
  return [0, 1, 2, 3]
    .map(
      (index) => `
        <option value="${index}" ${selectedIndex === index ? "selected" : ""}>Opcion ${index + 1}</option>
      `
    )
    .join("");
}

function buildAdminQuestionEditorMarkup(module, test, question, questionIndex, totalQuestions) {
  const canMoveUp = questionIndex > 0;
  const canMoveDown = questionIndex < totalQuestions - 1;
  return `
    <li class="panel panel-side">
      <form class="stack" data-tests-admin-form="question-edit" data-question-id="${escapeHtml(question.id)}">
        <div class="course-topline">
          <span class="tag">Pregunta ${questionIndex + 1}</span>
          <span class="status-chip">ID ${escapeHtml(question.id)}</span>
        </div>
        <label class="inline-field">
          Enunciado
          <textarea name="prompt" rows="2" required>${escapeHtml(question.prompt || "")}</textarea>
        </label>
        <div class="studio-grid">
          ${buildQuestionOptionFields(question)}
        </div>
        <label class="inline-field">
          Indice correcto
          <select name="correctIndex">${buildCorrectIndexSelect(question)}</select>
        </label>
        <label class="inline-field">
          Explicacion
          <textarea name="explanation" rows="2">${escapeHtml(question.explanation || "")}</textarea>
        </label>
        <div class="chip-row">
          <button class="primary-button" type="submit">Guardar pregunta</button>
          <button class="ghost-button" type="button" data-action="move-question" data-test-id="${escapeHtml(test.id)}" data-question-id="${escapeHtml(question.id)}" data-direction="up" ${canMoveUp ? "" : "disabled"}>
            Subir
          </button>
          <button class="ghost-button" type="button" data-action="move-question" data-test-id="${escapeHtml(test.id)}" data-question-id="${escapeHtml(question.id)}" data-direction="down" ${canMoveDown ? "" : "disabled"}>
            Bajar
          </button>
          <button class="ghost-button danger-button" type="button" data-action="delete-question" data-question-id="${escapeHtml(question.id)}">
            Borrar
          </button>
        </div>
      </form>
    </li>
  `;
}

function buildAdminUnusedQuestionMarkup(question) {
  return `
    <li class="panel panel-side">
      <form class="stack" data-tests-admin-form="question-edit" data-question-id="${escapeHtml(question.id)}">
        <div class="course-topline">
          <span class="tag">Sin asignar</span>
          <span class="status-chip">${escapeHtml(question.id)}</span>
        </div>
        <label class="inline-field">
          Enunciado
          <textarea name="prompt" rows="2" required>${escapeHtml(question.prompt || "")}</textarea>
        </label>
        <div class="studio-grid">
          ${buildQuestionOptionFields(question)}
        </div>
        <label class="inline-field">
          Indice correcto
          <select name="correctIndex">${buildCorrectIndexSelect(question)}</select>
        </label>
        <label class="inline-field">
          Explicacion
          <textarea name="explanation" rows="2">${escapeHtml(question.explanation || "")}</textarea>
        </label>
        <div class="chip-row">
          <button class="primary-button" type="submit">Guardar pregunta</button>
          <button class="ghost-button danger-button" type="button" data-action="delete-question" data-question-id="${escapeHtml(question.id)}">
            Borrar
          </button>
        </div>
      </form>
    </li>
  `;
}

function buildLiveLeaderboardMarkup(leaderboard = [], options = {}) {
  return Array.isArray(leaderboard) && leaderboard.length
    ? `
      <ol class="stack">
        ${leaderboard
          .map((entry, index) => {
            const rankLabel = options.showTopRanks && index < 3 ? `${index + 1}º` : "";
            const isCurrentPlayer =
              options.currentPlayer &&
              String(entry.playerId || "").trim() === String(options.currentPlayer.id || "").trim();

            return `
              <li class="${isCurrentPlayer ? "panel panel-side" : ""}">
                <strong>${rankLabel ? `${escapeHtml(rankLabel)} ` : ""}${escapeHtml(entry.displayName || "Participante")}${isCurrentPlayer ? " (Tú)" : ""}</strong>
                <p class="muted">${escapeHtml(`${entry.score || 0} punto(s)`)}</p>
              </li>
            `
          })
          .join("")}
      </ol>
    `
    : '<p class="muted">Todavia no hay puntuaciones en esta sesion.</p>';
}

function buildLiveTimerNodeMarkup(session) {
  const countdownState = getLiveSessionCountdownState(session);
  const remainingMs = computeLiveRemainingMsFromCountdown(countdownState);
  if (!countdownState || remainingMs == null) {
    return "--";
  }

  return `<span data-live-timer data-live-question-started-at-ms="${countdownState.startedAtMs}" data-live-server-now-ms="${countdownState.serverNowMs}" data-live-client-captured-at-ms="${countdownState.clientCapturedAtMs}" data-live-limit-ms="${countdownState.limitMs}">${Math.ceil(remainingMs / 1000)}s</span>`;
}

function buildAdminLiveSessionsMarkup() {
  if (!Array.isArray(testsViewState.liveSessions) || !testsViewState.liveSessions.length) {
    return '<div class="empty-state">Todavia no hay sesiones live creadas.</div>';
  }

  return testsViewState.liveSessions
    .map(
      (session) => `
        <article class="panel panel-side">
          <div class="course-topline">
            <span class="tag">Live</span>
            <span class="status-chip">${escapeHtml(getLiveStatusLabel(session.status))}</span>
          </div>
          <h3>${escapeHtml(session.testTitle || "Test sin titulo")}</h3>
          <p class="muted"><strong>PIN:</strong> ${escapeHtml(session.pin || "")}</p>
          <p class="muted"><strong>Pregunta actual:</strong> ${
            Number(session.currentQuestionIndex) >= 0
              ? `${Number(session.currentQuestionIndex) + 1}/${Number(session.totalQuestions || 0)}`
              : "Pendiente de inicio"
          }</p>
          <p class="muted"><strong>Jugadores:</strong> ${escapeHtml(String(session.playersCount || 0))}</p>
          <p class="muted"><strong>Tiempo por pregunta:</strong> ${escapeHtml(String(session.questionTimeLimitSeconds || 20))} s</p>
          ${
            session.status === "running"
              ? `<p class="muted"><strong>Tiempo restante:</strong> ${buildLiveTimerNodeMarkup(session)}</p>
                 <p class="muted"><strong>Respuestas:</strong> ${escapeHtml(String(session.answersCount || 0))}/${escapeHtml(String(session.playersCount || 0))}</p>`
              : ""
          }
          <div class="chip-row">
            ${
              session.status === "lobby"
                ? `<button class="primary-button" type="button" data-action="start-live-session" data-session-id="${escapeHtml(session.id)}">Iniciar</button>`
                : ""
            }
            ${
              session.status === "running"
                ? `<button class="ghost-button" type="button" data-action="advance-live-session" data-session-id="${escapeHtml(session.id)}" data-players-count="${escapeHtml(String(session.playersCount || 0))}" data-answers-count="${escapeHtml(String(session.answersCount || 0))}">Siguiente</button>`
                : ""
            }
            ${
              session.status !== "finished"
                ? `<button class="ghost-button danger-button" type="button" data-action="finish-live-session" data-session-id="${escapeHtml(session.id)}">Finalizar</button>`
                : ""
            }
          </div>
          <section class="stack">
            <h4>Ranking live</h4>
            ${buildLiveLeaderboardMarkup(session.leaderboard, { showTopRanks: true })}
          </section>
        </article>
      `
    )
    .join("");
}

function buildStudentLiveJoinMarkup() {
  return `
    <section class="panel panel-side">
      <h3>Unirse a sesion live</h3>
      <form class="stack" data-tests-student-form="live-join">
        <label class="inline-field">
          PIN
          <input type="text" name="pin" inputmode="numeric" maxlength="6" required />
        </label>
        <label class="inline-field">
          Alias (opcional)
          <input type="text" name="displayName" maxlength="60" />
        </label>
        <div class="chip-row">
          <button class="primary-button" type="submit">Unirme</button>
        </div>
      </form>
    </section>
  `;
}

function buildStudentLiveAnswerFeedbackMarkup(session) {
  const sessionId = String(session?.id || "").trim();
  const questionId = String(session?.currentQuestion?.id || "").trim();
  const feedback = testsViewState.lastLiveAnswerResultBySessionQuestionKey[getLiveAnswerResultKey(sessionId, questionId)] || null;
  if (!feedback) {
    return `
      <section class="panel panel-side">
        <h4>Esperando siguiente pregunta</h4>
        <p class="muted">Respuesta enviada. Espera a la siguiente pregunta.</p>
      </section>
    `;
  }

  const status = feedback.isLate
    ? "Fuera de tiempo"
    : feedback.isCorrect
      ? "Correcta"
      : "Incorrecta";
  return `
    <section class="panel panel-side">
      <h4>${escapeHtml(status)}</h4>
      <p class="muted"><strong>Puntos:</strong> ${escapeHtml(String(feedback.pointsAwarded || 0))}</p>
      <p class="muted"><strong>Puntuacion actual:</strong> ${escapeHtml(String(session?.player?.score || 0))}</p>
      <p class="muted">Esperando siguiente pregunta.</p>
    </section>
  `;
}

function buildStudentLiveSessionMarkup() {
  const session = testsViewState.liveSessionState;
  if (!session) {
    return "";
  }

  const question = session.currentQuestion || null;
  const leaderboard = Array.isArray(session.leaderboard) ? session.leaderboard : [];
  const hasAnswered = Boolean(session.hasAnsweredCurrentQuestion);
  const countdownState = getLiveSessionCountdownState(session);
  const remainingMs = computeLiveRemainingMsFromCountdown(countdownState);
  const isQuestionTimedOut = remainingMs != null && remainingMs <= 0;
  const statusLabel = getLiveStatusLabel(session.status);
  const currentPlayer = session.player
    ? {
        id: session.player.id,
        displayName: session.player.displayName,
        score: session.player.score
      }
    : null;

  return `
    <article class="panel panel-wide">
      <div class="course-topline">
        <span class="tag">Sesion live</span>
        <span class="status-chip">${escapeHtml(statusLabel)}</span>
      </div>
      <h3>${escapeHtml(session.testTitle || "Sesion live")}</h3>
      <p class="muted"><strong>PIN:</strong> ${escapeHtml(session.pin || "")}</p>
      <p class="muted"><strong>Tu puntuacion:</strong> ${escapeHtml(String(session.player?.score || 0))}</p>
      <p class="muted"><strong>Tiempo por pregunta:</strong> ${escapeHtml(String(session.questionTimeLimitSeconds || 20))} s</p>
      ${
        session.status === "lobby"
          ? '<p class="muted">Espera a que el administrador inicie la sesion live.</p>'
          : session.status === "finished"
            ? '<p class="muted"><strong>Sesion finalizada.</strong> Aqui tienes la clasificacion final.</p>'
            : question
              ? `
                <div class="stack">
                  <p class="muted"><strong>Pregunta ${Number(session.currentQuestionIndex || 0) + 1}/${Number(session.totalQuestions || 0)}</strong></p>
                  <p class="muted"><strong>Tiempo restante:</strong> ${buildLiveTimerNodeMarkup(session)}</p>
                  <h4>${escapeHtml(question.prompt || "")}</h4>
                  ${
                    hasAnswered
                      ? buildStudentLiveAnswerFeedbackMarkup(session)
                      : isQuestionTimedOut
                        ? `
                          <section class="panel panel-side">
                            <h4>Tiempo agotado</h4>
                            <p class="muted">No llegaste a responder esta pregunta. Espera a la siguiente.</p>
                            <p class="muted"><strong>Puntuacion actual:</strong> ${escapeHtml(String(session.player?.score || 0))}</p>
                          </section>
                        `
                      : `
                        <form class="stack" data-tests-student-form="live-answer" data-live-answer-form data-session-id="${escapeHtml(session.id)}" data-question-id="${escapeHtml(question.id || "")}" data-live-question-started-at-ms="${countdownState?.startedAtMs || 0}" data-live-server-now-ms="${countdownState?.serverNowMs || 0}" data-live-client-captured-at-ms="${countdownState?.clientCapturedAtMs || 0}" data-live-limit-ms="${countdownState?.limitMs || 0}">
                          <div class="stack">
                            ${(Array.isArray(question.options) ? question.options : [])
                              .map(
                                (option, optionIndex) => `
                                  <label class="inline-field">
                                    <input type="radio" name="selectedIndex" value="${optionIndex}" required />
                                    <span>${escapeHtml(option)}</span>
                                  </label>
                                `
                              )
                              .join("")}
                          </div>
                          <div class="chip-row">
                            <button class="primary-button" type="submit">Enviar respuesta</button>
                          </div>
                          <p class="muted" data-live-timeout-message hidden><strong>Tiempo agotado.</strong> Espera a la siguiente pregunta.</p>
                        </form>
                      `
                  }
                </div>
              `
              : '<p class="muted">Esperando a que aparezca la siguiente pregunta.</p>'
      }
      <section class="stack">
        <h4>Ranking live</h4>
        ${buildLiveLeaderboardMarkup(leaderboard, { currentPlayer })}
      </section>
    </article>
  `;
}

function buildAdminModuleMarkup(module) {
  const tests = getTestsForModule(module.id);
  const unusedQuestions = getUnusedQuestionsForModule(module.id);
  return `
    <article class="course-card">
      <div class="course-topline">
        <span class="tag">Modulo</span>
        <span class="status-chip">${tests.length} test(s)</span>
      </div>
      <div class="panel-stack">
        <form class="stack" data-tests-admin-form="module-edit" data-module-id="${escapeHtml(module.id)}">
          <h3>Editar modulo</h3>
          <label class="inline-field">
            Titulo
            <input type="text" name="title" value="${escapeHtml(module.title || "")}" required />
          </label>
          <label class="inline-field">
            Descripcion
            <textarea name="description" rows="2">${escapeHtml(module.description || "")}</textarea>
          </label>
          <div class="chip-row">
            <button class="primary-button" type="submit">Guardar modulo</button>
            <button class="ghost-button danger-button" type="button" data-action="delete-module" data-module-id="${escapeHtml(module.id)}">
              Borrar modulo
            </button>
          </div>
        </form>
        <form class="stack" data-tests-admin-form="test" data-module-id="${escapeHtml(module.id)}">
          <h4>Nuevo test</h4>
          <label class="inline-field">
            Titulo
            <input type="text" name="title" required />
          </label>
          <label class="inline-field">
            Descripcion
            <textarea name="description" rows="2"></textarea>
          </label>
          <label class="inline-field">
            <span>Publicado</span>
            <input type="checkbox" name="published" />
          </label>
          <label class="inline-field">
            Limite de tiempo (segundos)
            <input type="number" name="timeLimitSeconds" min="1" step="1" />
          </label>
          <p class="muted">Dejalo vacio para no aplicar limite.</p>
          <div class="chip-row">
            <button class="primary-button" type="submit">Guardar test</button>
          </div>
        </form>

        ${
          tests.length
            ? tests
                .map((test) => {
                  const questions = getQuestionsForTest(test.id);
                  return `
                    <section class="panel panel-side">
                      <form class="stack" data-tests-admin-form="test-edit" data-test-id="${escapeHtml(test.id)}">
                        <div class="course-topline">
                          <span class="tag">Test</span>
                          <span class="status-chip">${test.published ? "Publicado" : "Borrador"}</span>
                        </div>
                        <label class="inline-field">
                          Titulo
                          <input type="text" name="title" value="${escapeHtml(test.title || "")}" required />
                        </label>
                        <label class="inline-field">
                          Descripcion
                          <textarea name="description" rows="2">${escapeHtml(test.description || "")}</textarea>
                        </label>
                        <label class="inline-field">
                          <span>Publicado</span>
                          <input type="checkbox" name="published" ${test.published ? "checked" : ""} />
                        </label>
                        <label class="inline-field">
                          Limite de tiempo (segundos)
                          <input type="number" name="timeLimitSeconds" min="1" step="1" value="${escapeHtml(test.timeLimitSeconds || "")}" />
                        </label>
                        <p class="muted">Dejalo vacio para no aplicar limite.</p>
                        <div class="chip-row">
                          <button class="primary-button" type="submit">Guardar test</button>
                          <button class="ghost-button danger-button" type="button" data-action="delete-test" data-test-id="${escapeHtml(test.id)}">
                            Borrar test
                          </button>
                        </div>
                      </form>
                      ${
                        test.published && questions.length
                          ? `
                            <form class="stack" data-tests-admin-form="live-session" data-test-id="${escapeHtml(test.id)}">
                              <label class="inline-field">
                                Tiempo por pregunta (segundos)
                                <input type="number" name="questionTimeLimitSeconds" min="5" max="120" step="1" value="20" />
                              </label>
                              <div class="chip-row">
                                <button class="ghost-button" type="submit">Crear sesion live</button>
                              </div>
                            </form>
                          `
                          : ""
                      }
                      <ol class="stack">
                        ${
                          questions.length
                            ? questions
                                .map((question, questionIndex) =>
                                  buildAdminQuestionEditorMarkup(module, test, question, questionIndex, questions.length)
                                )
                                .join("")
                            : '<li class="muted">Sin preguntas todavia.</li>'
                        }
                      </ol>
                      <form class="stack" data-tests-admin-form="question" data-module-id="${escapeHtml(module.id)}" data-test-id="${escapeHtml(test.id)}">
                        <h5>Nueva pregunta</h5>
                        <label class="inline-field">
                          Enunciado
                          <textarea name="prompt" rows="2" required></textarea>
                        </label>
                        <div class="studio-grid">
                          ${buildQuestionOptionFields()}
                        </div>
                        <label class="inline-field">
                          Indice correcto
                          <select name="correctIndex">${buildCorrectIndexSelect()}</select>
                        </label>
                        <label class="inline-field">
                          Explicacion
                          <textarea name="explanation" rows="2"></textarea>
                        </label>
                        <div class="chip-row">
                          <button class="primary-button" type="submit">Guardar pregunta</button>
                        </div>
                      </form>
                    </section>
                  `;
                })
                .join("")
            : '<p class="muted">Todavia no hay tests en este modulo.</p>'
        }
        <section class="panel panel-side">
          <h4>Preguntas sin asignar</h4>
          ${
            unusedQuestions.length
              ? `<ul class="stack">${unusedQuestions.map((question) => buildAdminUnusedQuestionMarkup(question)).join("")}</ul>`
              : '<p class="muted">No hay preguntas sueltas en este modulo.</p>'
          }
        </section>
      </div>
    </article>
  `;
}

function renderAdminMarkup() {
  return `
    <section class="panel-stack">
      <article class="panel panel-wide">
        <p class="eyebrow">Tests</p>
        <h2>Gestion de modulos y tests</h2>
        <p class="status-note ${testsViewState.message ? `is-${escapeHtml(testsViewState.tone)}` : ""}">${escapeHtml(testsViewState.message || "Crea modulos, tests y preguntas para la nueva seccion independiente.")}</p>
        <form class="stack" data-tests-admin-form="module">
          <h3>Nuevo modulo</h3>
          <label class="inline-field">
            Titulo
            <input type="text" name="title" required />
          </label>
          <label class="inline-field">
            Descripcion
            <textarea name="description" rows="2"></textarea>
          </label>
          <div class="chip-row">
            <button class="primary-button" type="submit">Guardar modulo</button>
          </div>
        </form>
        <form class="stack" data-tests-admin-form="import-csv">
          <h3>Importar preguntas CSV</h3>
          <p class="muted">Cabecera soportada: moduleTitle,testTitle,published,prompt,optionA,optionB,optionC,optionD,correctOption,explanation,topic,difficulty,questionTimeLimitSeconds</p>
          <label class="inline-field">
            CSV
            <textarea name="csv" rows="8" placeholder="moduleTitle,testTitle,published,prompt,optionA,optionB,optionC,optionD,correctOption,explanation,topic,difficulty,questionTimeLimitSeconds&#10;Rescate,Autoevacuacion,true,&quot;Pregunta de ejemplo&quot;,Opcion A,Opcion B,,,A,&quot;Comentario opcional&quot;,,,20" required></textarea>
          </label>
          <div class="chip-row">
            <button class="primary-button" type="submit">Previsualizar/Importar</button>
          </div>
        </form>
      </article>
      <article class="panel panel-wide">
        <p class="eyebrow">Sesiones live</p>
        <h2>Kahoot-lite MVP</h2>
        ${buildAdminLiveSessionsMarkup()}
      </article>
      ${
        testsViewState.modules.length
          ? testsViewState.modules.map((module) => buildAdminModuleMarkup(module)).join("")
          : '<div class="empty-state">No hay modulos de tests todavia.</div>'
      }
    </section>
  `;
}

function buildStudentTestListMarkup() {
  const tests = testsViewState.tests.filter((test) => Boolean(test.published));
  if (!tests.length) {
    return '<div class="empty-state">No hay tests publicados disponibles ahora mismo.</div>';
  }

  return `
    <div class="compact-list">
      ${tests
        .map(
          (test) => `
            <article class="compact-list-item">
              <div>
                <strong>${escapeHtml(test.title)}</strong>
                <p class="muted">${escapeHtml(test.description || "Sin descripcion")}</p>
                ${
                  Number(test.questionCount || 0) > 0
                    ? ""
                    : '<p class="muted">Este test esta publicado pero todavia no tiene preguntas.</p>'
                }
              </div>
              ${
                Number(test.questionCount || 0) > 0
                  ? `
                    <button class="primary-button" type="button" data-action="open-test" data-test-id="${escapeHtml(test.id)}">
                      Hacer test
                    </button>
                  `
                  : ""
              }
            </article>
          `
        )
        .join("")}
    </div>
  `;
}

function buildStudentActiveTestMarkup() {
  if (!testsViewState.activeTestId) {
    return '<div class="empty-state">Selecciona un test publicado para empezar.</div>';
  }

  const test = testsViewState.tests.find((item) => item.id === testsViewState.activeTestId) || null;
  const questions = getQuestionsForTest(testsViewState.activeTestId);
  const attempts = getAttemptsForTest(testsViewState.activeTestId);
  const leaderboard = getLeaderboardForTest(testsViewState.activeTestId);
  const currentUserRank = getCurrentUserRankForTest(testsViewState.activeTestId);
  const timeLimitSeconds = getStudentTestTimeLimitSeconds(test);
  const timedAttemptActive = hasActiveTimedAttempt(test);
  if (!test || !questions.length) {
    return '<div class="empty-state">Este test está publicado pero todavía no tiene preguntas.</div>';
  }

  if (timeLimitSeconds && !timedAttemptActive) {
    return `
      <section class="stack">
        <div>
          <p class="eyebrow">Test activo</p>
          <h3>${escapeHtml(test.title)}</h3>
          <p class="muted">${escapeHtml(test.description || "Sin descripcion")}</p>
          <p class="muted">Tiempo limite: ${escapeHtml(String(timeLimitSeconds))} s.</p>
        </div>
        <div class="chip-row">
          <button class="primary-button" type="button" data-action="start-test-attempt" data-test-id="${escapeHtml(test.id)}">
            ${attempts.length ? "Reintentar" : "Empezar intento"}
          </button>
        </div>
        <section class="panel panel-side">
          <h4>Mis intentos</h4>
          ${buildStudentAttemptsMarkup(attempts)}
        </section>
        <section class="panel panel-side">
          <h4>Ranking del test</h4>
          ${buildStudentLeaderboardMarkup(leaderboard)}
        </section>
        ${buildStudentCurrentUserRankMarkup(currentUserRank, leaderboard)}
      </section>
    `;
  }

  return `
    <form class="stack" data-tests-student-form="attempt" data-test-id="${escapeHtml(test.id)}">
      <div>
        <p class="eyebrow">Test activo</p>
        <h3>${escapeHtml(test.title)}</h3>
        <p class="muted">${escapeHtml(test.description || "Sin descripcion")}</p>
        ${
          timeLimitSeconds
            ? `
              <p class="muted">
                Tiempo limite: ${escapeHtml(String(timeLimitSeconds))} s.
                Tiempo restante: <strong data-tests-timer>${escapeHtml(formatDurationMs(testsViewState.timerRemainingMs ?? timeLimitSeconds * 1000))}</strong>
              </p>
            `
            : '<p class="muted">Este test no tiene limite de tiempo.</p>'
        }
      </div>
      ${questions
        .map(
          (question, index) => `
            <fieldset class="panel panel-side">
              <legend><strong>${index + 1}. ${escapeHtml(question.prompt)}</strong></legend>
              <div class="stack">
                ${(Array.isArray(question.options) ? question.options : [])
                  .map(
                    (option, optionIndex) => `
                      <label class="inline-field">
                        <input type="radio" name="question-${index}" value="${optionIndex}" />
                        <span>${escapeHtml(option)}</span>
                      </label>
                    `
                  )
                  .join("")}
              </div>
            </fieldset>
          `
        )
        .join("")}
      <div class="chip-row">
        <button class="primary-button" type="submit">Enviar respuestas</button>
      </div>
      <section class="panel panel-side">
        <h4>Mis intentos</h4>
        ${buildStudentAttemptsMarkup(attempts)}
      </section>
      <section class="panel panel-side">
        <h4>Ranking del test</h4>
        ${buildStudentLeaderboardMarkup(leaderboard)}
      </section>
      ${buildStudentCurrentUserRankMarkup(currentUserRank, leaderboard)}
    </form>
  `;
}

function renderStudentMarkup() {
  return `
    <section class="panel-stack">
      <article class="panel panel-wide">
        <p class="eyebrow">Tests</p>
        <h2>Practica independiente</h2>
        <p class="status-note ${testsViewState.message ? `is-${escapeHtml(testsViewState.tone)}` : ""}">${escapeHtml(
          buildStudentResultSummary()
        )}</p>
      </article>
      ${buildStudentLiveJoinMarkup()}
      ${buildStudentLiveSessionMarkup()}
      <article class="panel panel-side">
        <h3>Tests publicados</h3>
        ${buildStudentTestListMarkup()}
      </article>
      <article class="panel panel-wide">
        ${buildStudentActiveTestMarkup()}
      </article>
    </section>
  `;
}

function renderTestsMarkup(container) {
  container.innerHTML = isAdminRole(testsViewState.role) ? renderAdminMarkup() : renderStudentMarkup();
}

async function refreshTestsView(container, role) {
  const renderToken = ++testsViewState.renderToken;
  testsViewState.role = role;
  container.innerHTML = '<div class="empty-state">Cargando tests...</div>';

  try {
    if (isAdminRole(role)) {
      await loadAdminData();
    } else {
      await loadStudentData();
    }

    if (renderToken !== testsViewState.renderToken) {
      return;
    }

    renderTestsMarkup(container);
    finalizeTestsViewRender(container);
  } catch (error) {
    if (renderToken !== testsViewState.renderToken) {
      return;
    }
    setTestsViewMessage(error.message || "No se pudo cargar la vista de tests", "error");
    renderTestsMarkup(container);
    finalizeTestsViewRender(container);
  }
}

async function handleAdminSubmit(container, form) {
  const client = getApiClient();
  if (!client) {
    throw new Error("Cliente API no disponible");
  }

  const formType = String(form.dataset.testsAdminForm || "").trim();
  const formData = new FormData(form);

  if (formType === "module") {
    await client.post("/api/test-modules", {
      title: String(formData.get("title") || "").trim(),
      description: String(formData.get("description") || "").trim()
    });
    setTestsViewMessage("Modulo creado correctamente.", "success");
  } else if (formType === "module-edit") {
    await client.patch(`/api/test-modules/${encodeURIComponent(String(form.dataset.moduleId || "").trim())}`, {
      title: String(formData.get("title") || "").trim(),
      description: String(formData.get("description") || "").trim()
    });
    setTestsViewMessage("Modulo actualizado correctamente.", "success");
  } else if (formType === "test") {
    await client.post("/api/tests", {
      moduleId: String(form.dataset.moduleId || "").trim(),
      title: String(formData.get("title") || "").trim(),
      description: String(formData.get("description") || "").trim(),
      published: formData.get("published") === "on",
      timeLimitSeconds: String(formData.get("timeLimitSeconds") || "").trim()
    });
    setTestsViewMessage("Test creado correctamente.", "success");
  } else if (formType === "test-edit") {
    await client.patch(`/api/tests/${encodeURIComponent(String(form.dataset.testId || "").trim())}`, {
      title: String(formData.get("title") || "").trim(),
      description: String(formData.get("description") || "").trim(),
      published: formData.get("published") === "on",
      timeLimitSeconds: String(formData.get("timeLimitSeconds") || "").trim()
    });
    setTestsViewMessage("Test actualizado correctamente.", "success");
  } else if (formType === "question") {
    await client.post("/api/questions", {
      moduleId: String(form.dataset.moduleId || "").trim(),
      testId: String(form.dataset.testId || "").trim(),
      prompt: String(formData.get("prompt") || "").trim(),
      options: [0, 1, 2, 3].map((index) => String(formData.get(`option${index}`) || "").trim()),
      correctIndex: Number(formData.get("correctIndex")),
      explanation: String(formData.get("explanation") || "").trim()
    });
    setTestsViewMessage("Pregunta creada correctamente.", "success");
  } else if (formType === "question-edit") {
    await client.patch(`/api/questions/${encodeURIComponent(String(form.dataset.questionId || "").trim())}`, {
      prompt: String(formData.get("prompt") || "").trim(),
      options: [0, 1, 2, 3].map((index) => String(formData.get(`option${index}`) || "").trim()),
      correctIndex: Number(formData.get("correctIndex")),
      explanation: String(formData.get("explanation") || "").trim()
    });
    setTestsViewMessage("Pregunta actualizada correctamente.", "success");
  } else if (formType === "live-session") {
    await client.post("/api/live-tests", {
      testId: String(form.dataset.testId || "").trim(),
      questionTimeLimitSeconds: Number(formData.get("questionTimeLimitSeconds"))
    });
    setTestsViewMessage("Sesion live creada correctamente.", "success");
  } else if (formType === "import-csv") {
    const response = await client.post("/api/tests/import-csv", {
      csv: String(formData.get("csv") || "")
    });
    const summary = response.summary || {};
    setTestsViewMessage(
      formatCsvImportSummary(summary),
      Number(summary.rowsImported || 0) > 0 ? "success" : "error"
    );
  }

  await refreshTestsView(container, testsViewState.role);
}

async function handleAdminAction(container, action, dataset = {}) {
  const client = getApiClient();
  if (!client) {
    throw new Error("Cliente API no disponible");
  }

  if (action === "delete-module") {
    if (!window.confirm("¿Seguro que quieres borrar este módulo?")) {
      return;
    }
    await client.delete(`/api/test-modules/${encodeURIComponent(String(dataset.moduleId || "").trim())}`);
    setTestsViewMessage("Modulo borrado correctamente.", "success");
  } else if (action === "delete-test") {
    if (!window.confirm("¿Seguro que quieres borrar este test?")) {
      return;
    }
    await client.delete(`/api/tests/${encodeURIComponent(String(dataset.testId || "").trim())}`);
    setTestsViewMessage("Test borrado correctamente.", "success");
  } else if (action === "delete-question") {
    if (!window.confirm("¿Seguro que quieres borrar esta pregunta?")) {
      return;
    }
    await client.delete(`/api/questions/${encodeURIComponent(String(dataset.questionId || "").trim())}`);
    setTestsViewMessage("Pregunta borrada correctamente.", "success");
  } else if (action === "move-question") {
    const testId = String(dataset.testId || "").trim();
    const questionId = String(dataset.questionId || "").trim();
    const direction = String(dataset.direction || "").trim();
    const test = testsViewState.tests.find((item) => item.id === testId);
    if (!test) {
      throw new Error("Test no encontrado");
    }
    const orderedIds = Array.isArray(test.questionIds) ? [...test.questionIds] : [];
    const currentIndex = orderedIds.findIndex((item) => item === questionId);
    if (currentIndex === -1) {
      throw new Error("Pregunta de test no encontrada");
    }
    const nextIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (nextIndex < 0 || nextIndex >= orderedIds.length) {
      return;
    }
    [orderedIds[currentIndex], orderedIds[nextIndex]] = [orderedIds[nextIndex], orderedIds[currentIndex]];
    await client.patch(`/api/tests/${encodeURIComponent(testId)}`, { questionIds: orderedIds });
    setTestsViewMessage("Orden de preguntas actualizado.", "success");
  } else if (action === "start-live-session") {
    await client.post(`/api/live-tests/${encodeURIComponent(String(dataset.sessionId || "").trim())}/start`, {});
    setTestsViewMessage("Sesion live iniciada correctamente.", "success");
  } else if (action === "advance-live-session") {
    const playersCount = Number(dataset.playersCount || 0);
    const answersCount = Number(dataset.answersCount || 0);
    if (playersCount <= 0) {
      if (!window.confirm("No hay jugadores conectados. ¿Avanzar igualmente?")) {
        return;
      }
    } else if (answersCount < playersCount) {
      if (!window.confirm("Todavía no han respondido todos. ¿Avanzar igualmente?")) {
        return;
      }
    }
    await client.post(`/api/live-tests/${encodeURIComponent(String(dataset.sessionId || "").trim())}/advance`, {});
    setTestsViewMessage("Sesion live avanzada correctamente.", "success");
  } else if (action === "finish-live-session") {
    await client.post(`/api/live-tests/${encodeURIComponent(String(dataset.sessionId || "").trim())}/finish`, {});
    setTestsViewMessage("Sesion live finalizada correctamente.", "success");
  } else {
    return;
  }

  await refreshTestsView(container, testsViewState.role);
}

async function handleStudentTestSelection(container, testId) {
  testsViewState.activeTestId = String(testId || "").trim();
  testsViewState.result = null;
  setTestsViewMessage("", "neutral");
  await refreshTestsView(container, testsViewState.role);
}

function handleStudentAttemptStart(container, testId) {
  const normalizedTestId = String(testId || "").trim();
  if (!normalizedTestId) {
    return;
  }
  testsViewState.activeTestId = normalizedTestId;
  testsViewState.activeAttemptTestId = normalizedTestId;
  testsViewState.startedAtByTestId[normalizedTestId] = Date.now();
  testsViewState.result = null;
  setTestsViewMessage("", "neutral");
  renderTestsMarkup(container);
  finalizeTestsViewRender(container);
}

async function handleStudentAttemptSubmit(container, form, options = {}) {
  const client = getApiClient();
  if (!client) {
    throw new Error("Cliente API no disponible");
  }

  const testId = String(form.dataset.testId || "").trim();
  const questions = getQuestionsForTest(testId);
  const formData = new FormData(form);
  const startedAt = testsViewState.startedAtByTestId[testId] || Date.now();
  const answers = questions.map((question, index) => {
    const selected = formData.get(`question-${index}`);
    return selected === null ? null : Number(selected);
  });

  const response = await client.post(`/api/tests/${encodeURIComponent(testId)}/attempt`, {
    answers,
    startedAt
  });

  testsViewState.result = {
    score: Number(response.score || 0),
    total: Number(response.total || 0),
    durationMs: Number.isFinite(Number(response.durationMs)) ? Number(response.durationMs) : null,
    timedOut: Boolean(options.timedOut || response.timedOut)
  };
  testsViewState.autoSubmittingTestId = "";
  testsViewState.activeAttemptTestId = "";
  delete testsViewState.startedAtByTestId[testId];
  await ensureStudentActiveTestAttempts();
  await ensureStudentActiveTestLeaderboard();
  setTestsViewMessage(`Resultado guardado: ${testsViewState.result.score}/${testsViewState.result.total}.`, "success");
  renderTestsMarkup(container);
  finalizeTestsViewRender(container);
}

async function handleStudentLiveJoin(container, form) {
  const client = getApiClient();
  if (!client) {
    throw new Error("Cliente API no disponible");
  }

  const formData = new FormData(form);
  const response = await client.post("/api/live-tests/join", {
    pin: String(formData.get("pin") || "").trim(),
    displayName: String(formData.get("displayName") || "").trim()
  });
  testsViewState.activeLiveSessionId = String(response.session?.id || "").trim();
  testsViewState.liveSessionState = response.session || null;
  syncLiveQuestionShownAt(testsViewState.liveSessionState);
  setTestsViewMessage("Te has unido a la sesion live.", "success");
  renderTestsMarkup(container);
  finalizeTestsViewRender(container);
}

async function handleStudentLiveAnswer(container, form) {
  const client = getApiClient();
  if (!client) {
    throw new Error("Cliente API no disponible");
  }

  const sessionId = String(form.dataset.sessionId || "").trim();
  const questionId = String(form.dataset.questionId || "").trim();
  const formData = new FormData(form);
  const selectedIndex = Number(formData.get("selectedIndex"));
  const liveTiming = testsViewState.liveQuestionShownAtBySessionId[sessionId];
  const responseTimeMs = liveTiming ? Math.max(Date.now() - Number(liveTiming.shownAt || Date.now()), 0) : 0;
  const response = await client.post(`/api/live-tests/${encodeURIComponent(sessionId)}/answer`, {
    questionId,
    selectedIndex,
    responseTimeMs
  });
  testsViewState.lastLiveAnswerResultBySessionQuestionKey[getLiveAnswerResultKey(sessionId, questionId)] = {
    isCorrect: Boolean(response.isCorrect),
    isLate: Boolean(response.isLate),
    pointsAwarded: Number(response.pointsAwarded || 0)
  };
  if (testsViewState.liveSessionState?.player) {
    testsViewState.liveSessionState.player.score = Number(response.score || testsViewState.liveSessionState.player.score || 0);
    testsViewState.liveSessionState.hasAnsweredCurrentQuestion = true;
  }
  const liveMessage = response.isLate
    ? `Respuesta ${response.isCorrect ? "correcta" : "incorrecta"} registrada fuera de tiempo. +${Number(response.pointsAwarded || 0)} punto(s).`
    : response.isCorrect
      ? `Respuesta correcta registrada. +${Number(response.pointsAwarded || 0)} punto(s).`
      : "Respuesta incorrecta registrada.";
  setTestsViewMessage(liveMessage, "success");
  await ensureStudentActiveLiveSession();
  renderTestsMarkup(container);
  finalizeTestsViewRender(container);
}

export function renderTestsView(container, role = "member") {
  container.onclick = async (event) => {
    const adminActionButton = event.target.closest("[data-action]");
    const openTestButton = event.target.closest('[data-action="open-test"]');
    const startAttemptButton = event.target.closest('[data-action="start-test-attempt"]');
    if (isAdminRole(role) && adminActionButton && !openTestButton && !startAttemptButton) {
      event.preventDefault();
      try {
        await handleAdminAction(container, adminActionButton.dataset.action, adminActionButton.dataset);
      } catch (error) {
        setTestsViewMessage(error.message || "No se pudo completar la accion administrativa.", "error");
        renderTestsMarkup(container);
        finalizeTestsViewRender(container);
      }
      return;
    }
    if (openTestButton) {
      event.preventDefault();
      try {
        await handleStudentTestSelection(container, openTestButton.dataset.testId);
      } catch (error) {
        setTestsViewMessage(error.message || "No se pudo abrir el test.", "error");
        renderTestsMarkup(container);
        finalizeTestsViewRender(container);
      }
      return;
    }

    if (startAttemptButton) {
      event.preventDefault();
      try {
        handleStudentAttemptStart(container, startAttemptButton.dataset.testId);
      } catch (error) {
        setTestsViewMessage(error.message || "No se pudo empezar el intento.", "error");
        renderTestsMarkup(container);
        finalizeTestsViewRender(container);
      }
    }
  };

  container.onsubmit = async (event) => {
    const form = event.target.closest("form");
    if (!form) {
      return;
    }

    event.preventDefault();

    try {
      if (isAdminRole(role) && form.dataset.testsAdminForm) {
        await handleAdminSubmit(container, form);
        return;
      }

      if (form.dataset.testsStudentForm === "live-join") {
        await handleStudentLiveJoin(container, form);
        return;
      }

      if (form.dataset.testsStudentForm === "live-answer") {
        await handleStudentLiveAnswer(container, form);
        return;
      }

      if (form.dataset.testsStudentForm === "attempt") {
        await handleStudentAttemptSubmit(container, form);
      }
    } catch (error) {
      setTestsViewMessage(error.message || "No se pudo completar la accion.", "error");
      renderTestsMarkup(container);
      finalizeTestsViewRender(container);
    }
  };

  refreshTestsView(container, role);
}

export default renderTestsView;
