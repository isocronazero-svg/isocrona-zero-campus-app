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
  questionBankFiltersByModuleId: {},
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

function getQuestionsForModule(moduleId) {
  return (Array.isArray(testsViewState.allQuestions) ? testsViewState.allQuestions : []).filter(
    (question) => String(question.moduleId || "").trim() === String(moduleId || "").trim()
  );
}

function getQuestionBankFilterState(moduleId) {
  const normalizedModuleId = String(moduleId || "").trim();
  const current = testsViewState.questionBankFiltersByModuleId[normalizedModuleId] || {};
  return {
    query: String(current.query || ""),
    topic: String(current.topic || ""),
    difficulty: String(current.difficulty || "")
  };
}

function setQuestionBankFilterState(moduleId, nextPartial = {}) {
  const normalizedModuleId = String(moduleId || "").trim();
  testsViewState.questionBankFiltersByModuleId[normalizedModuleId] = {
    ...getQuestionBankFilterState(normalizedModuleId),
    ...nextPartial
  };
}

function clearQuestionBankFilterState(moduleId) {
  const normalizedModuleId = String(moduleId || "").trim();
  testsViewState.questionBankFiltersByModuleId[normalizedModuleId] = {
    query: "",
    topic: "",
    difficulty: ""
  };
}

function getQuestionFilterOptions(moduleId) {
  const moduleQuestions = getQuestionsForModule(moduleId);
  const topics = [...new Set(moduleQuestions.map((question) => String(question.topic || "").trim()).filter(Boolean))].sort(
    (left, right) => left.localeCompare(right, "es", { sensitivity: "base" })
  );
  const difficulties = [...new Set(moduleQuestions.map((question) => String(question.difficulty || "").trim()).filter(Boolean))].sort(
    (left, right) => left.localeCompare(right, "es", { sensitivity: "base" })
  );
  return { topics, difficulties };
}

function filterQuestionsForModule(moduleId, questions = []) {
  const filterState = getQuestionBankFilterState(moduleId);
  const normalizedQuery = String(filterState.query || "").trim().toLowerCase();
  const normalizedTopic = String(filterState.topic || "").trim().toLowerCase();
  const normalizedDifficulty = String(filterState.difficulty || "").trim().toLowerCase();

  return (Array.isArray(questions) ? questions : []).filter((question) => {
    const matchesTopic = !normalizedTopic || String(question.topic || "").trim().toLowerCase() === normalizedTopic;
    const matchesDifficulty =
      !normalizedDifficulty || String(question.difficulty || "").trim().toLowerCase() === normalizedDifficulty;
    if (!matchesTopic || !matchesDifficulty) {
      return false;
    }
    if (!normalizedQuery) {
      return true;
    }
    const haystack = [
      question.prompt,
      question.explanation,
      ...(Array.isArray(question.options) ? question.options : [])
    ]
      .map((value) => String(value || "").trim().toLowerCase())
      .join("\n");
    return haystack.includes(normalizedQuery);
  });
}

function getTestsUsingQuestion(questionId) {
  return testsViewState.tests.filter((test) =>
    (Array.isArray(test.questionIds) ? test.questionIds : []).includes(String(questionId || "").trim())
  );
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

function getAvailableQuestionsForTest(test) {
  const assignedQuestionIds = new Set(Array.isArray(test?.questionIds) ? test.questionIds : []);
  return filterQuestionsForModule(test?.moduleId || "", getQuestionsForModule(test?.moduleId || "")).filter(
    (question) => !assignedQuestionIds.has(String(question.id || "").trim())
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

function buildQuestionTopicDifficultyFields(question = null) {
  return `
    <div class="studio-grid">
      <label class="inline-field">
        Tema
        <input type="text" name="topic" value="${escapeHtml(question?.topic || "")}" />
      </label>
      <label class="inline-field">
        Dificultad
        <input type="text" name="difficulty" value="${escapeHtml(question?.difficulty || "")}" />
      </label>
    </div>
  `;
}

function buildQuestionMetaSummary(question = null) {
  const parts = [];
  if (String(question?.topic || "").trim()) {
    parts.push(`Tema: ${question.topic}`);
  }
  if (String(question?.difficulty || "").trim()) {
    parts.push(`Dificultad: ${question.difficulty}`);
  }
  return parts.length ? `<p class="muted">${escapeHtml(parts.join(" · "))}</p>` : "";
}

function buildQuestionFilterSelectOptions(options = [], selectedValue = "") {
  return [
    '<option value="">Todos</option>',
    ...(Array.isArray(options) ? options : []).map(
      (option) =>
        `<option value="${escapeHtml(option)}" ${String(selectedValue || "") === String(option || "") ? "selected" : ""}>${escapeHtml(option)}</option>`
    )
  ].join("");
}

function buildQuestionBankFiltersMarkup(moduleId, totalCount, filteredCount) {
  const filterState = getQuestionBankFilterState(moduleId);
  const { topics, difficulties } = getQuestionFilterOptions(moduleId);
  return `
    <form class="stack panel panel-side" data-tests-admin-form="question-bank-filters" data-module-id="${escapeHtml(moduleId)}">
      <h5>Filtros del banco</h5>
      <label class="inline-field">
        Buscar pregunta
        <input type="text" name="query" value="${escapeHtml(filterState.query)}" placeholder="Enunciado, explicacion u opciones" />
      </label>
      <div class="studio-grid">
        <label class="inline-field">
          Tema
          <select name="topic">
            ${buildQuestionFilterSelectOptions(topics, filterState.topic)}
          </select>
        </label>
        <label class="inline-field">
          Dificultad
          <select name="difficulty">
            ${buildQuestionFilterSelectOptions(difficulties, filterState.difficulty)}
          </select>
        </label>
      </div>
      <div class="chip-row">
        <button class="primary-button" type="submit">Aplicar filtros</button>
        <button class="ghost-button" type="button" data-action="clear-question-bank-filters" data-module-id="${escapeHtml(moduleId)}">Limpiar filtros</button>
      </div>
      <p class="muted">Mostrando ${escapeHtml(String(filteredCount))} de ${escapeHtml(String(totalCount))} preguntas</p>
    </form>
  `;
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
  if (String(testsViewState.liveSessionState?.status || "").trim() === "finished") {
    clearLivePolling();
    return;
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
  if (
    isAdminRole(testsViewState.role) ||
    !testsViewState.activeLiveSessionId ||
    String(testsViewState.liveSessionState?.status || "").trim() === "finished"
  ) {
    return;
  }
  testsViewState.livePollIntervalId = setInterval(async () => {
    try {
      await ensureStudentActiveLiveSession();
      if (String(testsViewState.liveSessionState?.status || "").trim() === "finished") {
        clearLivePolling();
      }
      renderTestsMarkup(container);
      finalizeTestsViewRender(container);
    } catch (error) {
      clearLivePolling();
      testsViewState.liveSessionState = null;
      testsViewState.activeLiveSessionId = "";
      setTestsViewMessage(error.message || "La sesion live ya no esta disponible.", "error");
      renderTestsMarkup(container);
      finalizeTestsViewRender(container);
    }
  }, 2000);
}

function buildTestOptions(test) {
  return (Array.isArray(test.options) ? test.options : []).map((option) => escapeHtml(option));
}

function buildAdminModuleForm(module = null) {
  const isEdit = Boolean(module);
  const formType = isEdit ? "module-edit" : "module";
  return `
    <form class="stack" data-tests-admin-form="${formType}" ${
      isEdit ? `data-module-id="${escapeHtml(module.id)}"` : ""
    }>
      <label class="inline-field">
        Titulo del modulo
        <input type="text" name="title" value="${escapeHtml(module?.title || "")}" required />
      </label>
      <label class="inline-field">
        Descripcion
        <textarea name="description" rows="2">${escapeHtml(module?.description || "")}</textarea>
      </label>
      <div class="chip-row">
        <button class="primary-button" type="submit">${isEdit ? "Guardar cambios" : "Guardar modulo"}</button>
      </div>
    </form>
  `;
}

function buildAdminTestForm(module, test = null) {
  const isEdit = Boolean(test);
  const formType = isEdit ? "test-edit" : "test";
  const timeLimitValue = test?.timeLimitSeconds != null && Number(test.timeLimitSeconds) > 0 ? String(test.timeLimitSeconds) : "";
  return `
    <form class="stack" data-tests-admin-form="${formType}" data-module-id="${escapeHtml(module.id)}" ${
      isEdit ? `data-test-id="${escapeHtml(test.id)}"` : ""
    }>
      <label class="inline-field">
        Titulo del test
        <input type="text" name="title" value="${escapeHtml(test?.title || "")}" required />
      </label>
      <label class="inline-field">
        Descripcion
        <textarea name="description" rows="2">${escapeHtml(test?.description || "")}</textarea>
      </label>
      <div class="studio-grid">
        <label class="inline-field">
          Tiempo limite del test (segundos)
          <input type="number" name="timeLimitSeconds" min="5" step="1" value="${escapeHtml(timeLimitValue)}" placeholder="Sin limite" />
        </label>
        <label class="inline-field checkbox-field">
          <input type="checkbox" name="published" ${test?.published ? "checked" : ""} />
          Publicado
        </label>
      </div>
      <div class="chip-row">
        <button class="primary-button" type="submit">${isEdit ? "Guardar test" : "Crear test"}</button>
      </div>
    </form>
  `;
}

function buildAdminQuestionForm(module, test) {
  return `
    <form class="stack" data-tests-admin-form="question" data-module-id="${escapeHtml(module.id)}" data-test-id="${escapeHtml(test.id)}">
      <h4>Nueva pregunta</h4>
      <label class="inline-field">
        Enunciado
        <textarea name="prompt" rows="3" required></textarea>
      </label>
      <div class="stack">
        ${[0, 1, 2, 3]
          .map(
            (index) => `
              <label class="inline-field">
                Opcion ${index + 1}
                <input type="text" name="option${index}" ${index < 2 ? "required" : ""} />
              </label>
            `
          )
          .join("")}
      </div>
      <label class="inline-field">
        Opcion correcta
        <select name="correctIndex">
          <option value="0">Opcion 1</option>
          <option value="1">Opcion 2</option>
          <option value="2">Opcion 3</option>
          <option value="3">Opcion 4</option>
        </select>
      </label>
      <label class="inline-field">
        Explicacion
        <textarea name="explanation" rows="2"></textarea>
      </label>
      ${buildQuestionTopicDifficultyFields()}
      <div class="chip-row">
        <button class="primary-button" type="submit">Guardar pregunta</button>
      </div>
    </form>
  `;
}

function buildAdminQuestionBankForm(module) {
  return `
    <form class="stack" data-tests-admin-form="question-bank" data-module-id="${escapeHtml(module.id)}">
      <h5>Nueva pregunta al banco</h5>
      <label class="inline-field">
        Enunciado
        <textarea name="prompt" rows="3" required></textarea>
      </label>
      <div class="stack">
        ${[0, 1, 2, 3]
          .map(
            (index) => `
              <label class="inline-field">
                Opcion ${index + 1}
                <input type="text" name="option${index}" ${index < 2 ? "required" : ""} />
              </label>
            `
          )
          .join("")}
      </div>
      <label class="inline-field">
        Opcion correcta
        <select name="correctIndex">
          <option value="0">Opcion 1</option>
          <option value="1">Opcion 2</option>
          <option value="2">Opcion 3</option>
          <option value="3">Opcion 4</option>
        </select>
      </label>
      <label class="inline-field">
        Explicacion
        <textarea name="explanation" rows="2"></textarea>
      </label>
      ${buildQuestionTopicDifficultyFields()}
      <div class="chip-row">
        <button class="primary-button" type="submit">Guardar en banco</button>
      </div>
    </form>
  `;
}

function buildQuestionUsageMarkup(question) {
  const testsUsingQuestion = getTestsUsingQuestion(question?.id || "");
  return testsUsingQuestion.length
    ? `<p class="muted">Usada en: ${escapeHtml(testsUsingQuestion.map((test) => test.title).join(", "))}</p>`
    : '<p class="muted">Disponible en banco, sin asignar a tests.</p>';
}

function buildAdminQuestionBankQuestionMarkup(question) {
  return `
    <details class="panel panel-side">
      <summary>${escapeHtml(question.prompt || "Pregunta sin enunciado")}</summary>
      ${buildQuestionMetaSummary(question)}
      <ol>
        ${(Array.isArray(question.options) ? question.options : [])
          .map(
            (option, index) => `
              <li${Number(question.correctIndex) === index ? ' class="correct-option"' : ""}>${escapeHtml(option)}</li>
            `
          )
          .join("")}
      </ol>
      ${question.explanation ? `<p class="muted">${escapeHtml(question.explanation)}</p>` : ""}
      ${buildQuestionUsageMarkup(question)}
      <form class="stack" data-tests-admin-form="question-edit" data-question-id="${escapeHtml(question.id)}">
        <label class="inline-field">
          Enunciado
          <textarea name="prompt" rows="2" required>${escapeHtml(question.prompt || "")}</textarea>
        </label>
        <div class="stack">
          ${(Array.isArray(question.options) ? question.options : ["", ""])
            .concat(["", "", "", ""])
            .slice(0, 4)
            .map(
              (option, index) => `
                <label class="inline-field">
                  Opcion ${index + 1}
                  <input type="text" name="option${index}" value="${escapeHtml(option)}" ${index < 2 ? "required" : ""} />
                </label>
              `
            )
            .join("")}
        </div>
        <label class="inline-field">
          Opcion correcta
          <select name="correctIndex">
            ${[0, 1, 2, 3]
              .map(
                (index) => `
                  <option value="${index}" ${Number(question.correctIndex) === index ? "selected" : ""}>Opcion ${index + 1}</option>
                `
              )
              .join("")}
          </select>
        </label>
        <label class="inline-field">
          Explicacion
          <textarea name="explanation" rows="2">${escapeHtml(question.explanation || "")}</textarea>
        </label>
        ${buildQuestionTopicDifficultyFields(question)}
        <div class="chip-row">
          <button class="primary-button" type="submit">Guardar cambios</button>
          <button class="ghost-button danger-button" type="button" data-action="delete-question" data-question-id="${escapeHtml(question.id)}">
            Borrar pregunta
          </button>
        </div>
      </form>
    </details>
  `;
}

function buildAdminQuestionMarkup(test, question, index) {
  const totalQuestions = Array.isArray(test?.questionIds) ? test.questionIds.length : 0;
  return `
    <details class="panel panel-side">
      <summary>${escapeHtml(question.prompt || "Pregunta sin enunciado")}</summary>
      ${buildQuestionMetaSummary(question)}
      <ol>
        ${(Array.isArray(question.options) ? question.options : [])
          .map(
            (option, optionIndex) => `
              <li${Number(question.correctIndex) === optionIndex ? ' class="correct-option"' : ""}>${escapeHtml(option)}</li>
            `
          )
          .join("")}
      </ol>
      ${question.explanation ? `<p class="muted">${escapeHtml(question.explanation)}</p>` : ""}
      <div class="chip-row">
        <button class="ghost-button" type="button" data-action="move-question" data-test-id="${escapeHtml(
          test.id
        )}" data-question-id="${escapeHtml(question.id)}" data-direction="up" ${index === 0 ? "disabled" : ""}>Subir</button>
        <button class="ghost-button" type="button" data-action="move-question" data-test-id="${escapeHtml(
          test.id
        )}" data-question-id="${escapeHtml(question.id)}" data-direction="down" ${
          index === totalQuestions - 1 ? "disabled" : ""
        }>Bajar</button>
        <button class="ghost-button" type="button" data-action="remove-question-from-test" data-test-id="${escapeHtml(
          test.id
        )}" data-question-id="${escapeHtml(question.id)}">Quitar del test</button>
      </div>
    </details>
  `;
}

function buildAdminAvailableQuestionMarkup(test, question) {
  return `
    <li class="panel panel-side">
      <div>
        <strong>${escapeHtml(question.prompt || "Pregunta sin enunciado")}</strong>
        ${buildQuestionMetaSummary(question)}
      </div>
      <div class="chip-row">
        <button class="ghost-button" type="button" data-action="add-question-to-test" data-test-id="${escapeHtml(
          test.id
        )}" data-question-id="${escapeHtml(question.id)}">Añadir al test</button>
      </div>
    </li>
  `;
}

function buildAdminUnusedQuestionMarkup(question) {
  return `
    <li class="panel panel-side">
      <div>
        <strong>${escapeHtml(question.prompt || "Pregunta sin enunciado")}</strong>
        ${buildQuestionMetaSummary(question)}
      </div>
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
            `;
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
          <p class="muted"><strong>Estado:</strong> ${
            session.status === "running"
              ? "Pregunta activa"
              : session.status === "finished"
                ? "Sesion finalizada"
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
    <article class="panel panel-side">
      <h3>Unirse a una sesion live</h3>
      <form class="stack" data-tests-student-form="live-join">
        <label class="inline-field">
          PIN de la sesion
          <input type="text" name="pin" maxlength="6" inputmode="numeric" placeholder="123456" required />
        </label>
        <label class="inline-field">
          Nombre visible
          <input type="text" name="displayName" maxlength="60" placeholder="Tu nombre" />
        </label>
        <div class="chip-row">
          <button class="primary-button" type="submit">Entrar en live</button>
        </div>
      </form>
    </article>
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
        <span class="tag">Live</span>
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
                                (option, index) => `
                                  <label class="inline-field">
                                    <input type="radio" name="selectedIndex" value="${index}" required />
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
              : '<p class="muted">Esperando a que llegue la siguiente pregunta.</p>'
      }
      <section class="stack">
        <h4>Ranking live</h4>
        ${buildLiveLeaderboardMarkup(leaderboard, { currentPlayer })}
      </section>
    </article>
  `;
}

function buildAttemptsMarkup(attempts = []) {
  return Array.isArray(attempts) && attempts.length
    ? `
      <ul class="stack">
        ${attempts
          .map(
            (attempt) => `
              <li class="panel panel-side">
                <strong>${escapeHtml(`${attempt.score}/${attempt.total}`)}</strong>
                <p class="muted">${escapeHtml(formatAttemptDate(attempt.createdAt))}</p>
              </li>
            `
          )
          .join("")}
      </ul>
    `
    : '<p class="muted">Todavia no hay intentos.</p>';
}

function buildLeaderboardMarkup(entries = []) {
  return Array.isArray(entries) && entries.length
    ? `
      <ol class="stack">
        ${entries
          .map(
            (entry) => `
              <li class="panel panel-side">
                <strong>${escapeHtml(entry.displayName || "Participante")}</strong>
                <p class="muted">${escapeHtml(`${entry.score || 0} punto(s)`)}</p>
              </li>
            `
          )
          .join("")}
      </ol>
    `
    : '<p class="muted">Todavia no hay puntuaciones.</p>';
}

function buildStudentCurrentUserRankMarkup(currentUserRank, leaderboard) {
  if (!currentUserRank) {
    return "";
  }

  const rank = currentUserRank.rank ?? currentUserRank.position ?? "-";
  return `
    <p class="muted"><strong>Tu posicion:</strong> ${escapeHtml(String(rank))} de ${escapeHtml(String((Array.isArray(leaderboard) ? leaderboard.length : 0) || 0))}</p>
  `;
}

function buildAdminModuleMarkup(module) {
  const tests = getTestsForModule(module.id);
  const moduleQuestions = getQuestionsForModule(module.id);
  const filteredModuleQuestions = filterQuestionsForModule(module.id, moduleQuestions);
  return `
    <article class="course-card">
      <div class="course-topline">
        <span class="tag">Modulo</span>
        <span class="status-chip">${escapeHtml(String(tests.length))} test(s)</span>
      </div>
      <h3>${escapeHtml(module.title || "Modulo sin titulo")}</h3>
      <p class="muted">${escapeHtml(module.description || "Sin descripcion")}</p>
      <details>
        <summary>Editar modulo</summary>
        ${buildAdminModuleForm(module)}
        <div class="chip-row">
          <button class="ghost-button danger-button" type="button" data-action="delete-module" data-module-id="${escapeHtml(module.id)}">
            Borrar modulo
          </button>
        </div>
      </details>
      <section class="panel panel-side">
        <h4>Crear test</h4>
        ${buildAdminTestForm(module)}
      </section>
      ${
        tests.length
          ? tests
              .map((test) => {
                const questions = getQuestionsForTest(test.id);
                const attempts = getAttemptsForTest(test.id);
                const leaderboard = getLeaderboardForTest(test.id);
                const availableQuestions = getAvailableQuestionsForTest(test);
                return `
                    <section class="panel panel-side">
                      <div class="course-topline">
                        <span class="tag">Test</span>
                        <span class="status-chip">${test.published ? "Publicado" : "Borrador"}</span>
                      </div>
                      <h4>${escapeHtml(test.title || "Test sin titulo")}</h4>
                      <p class="muted">${escapeHtml(test.description || "Sin descripcion")}</p>
                      <p class="muted"><strong>Tiempo limite:</strong> ${
                        Number.isFinite(Number(test.timeLimitSeconds)) && Number(test.timeLimitSeconds) > 0
                          ? `${escapeHtml(String(test.timeLimitSeconds))} s`
                          : "Sin limite"
                      }</p>
                      <details>
                        <summary>Editar test</summary>
                        ${buildAdminTestForm(module, test)}
                        <div class="chip-row">
                          <button class="ghost-button danger-button" type="button" data-action="delete-test" data-test-id="${escapeHtml(test.id)}">
                            Borrar test
                          </button>
                        </div>
                      </details>
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
                      <section class="stack">
                        <h5>Preguntas asignadas</h5>
                        ${
                          questions.length
                            ? questions.map((question, index) => buildAdminQuestionMarkup(test, question, index)).join("")
                            : '<p class="muted">Todavia no hay preguntas asignadas a este test.</p>'
                        }
                      </section>
                      <section class="stack">
                        <h5>Añadir preguntas del banco</h5>
                        ${
                          availableQuestions.length
                            ? `
                              <details>
                                <summary>${escapeHtml(String(availableQuestions.length))} pregunta(s) disponible(s) con filtros actuales</summary>
                                <ul class="stack">${availableQuestions
                                  .map((question) => buildAdminAvailableQuestionMarkup(test, question))
                                  .join("")}</ul>
                              </details>
                            `
                            : '<p class="muted">No hay preguntas disponibles del banco para este test.</p>'
                        }
                      </section>
                      <section class="panel panel-side">
                        <h5>Nueva pregunta para este test</h5>
                        ${buildAdminQuestionForm(module, test)}
                      </section>
                      <section class="panel panel-side">
                        <h5>Intentos</h5>
                        ${buildAttemptsMarkup(attempts)}
                      </section>
                      <section class="panel panel-side">
                        <h5>Ranking</h5>
                        ${buildLeaderboardMarkup(leaderboard)}
                      </section>
                    </section>
                  `;
              })
              .join("")
          : '<div class="empty-state">Todavia no hay tests en este modulo.</div>'
      }
      <section class="panel panel-side">
        <h4>Banco de preguntas</h4>
        <p class="muted">Aqui se guardan todas las preguntas del modulo, aunque no esten asignadas a ningun test.</p>
        ${buildQuestionBankFiltersMarkup(module.id, moduleQuestions.length, filteredModuleQuestions.length)}
        ${buildAdminQuestionBankForm(module)}
        ${
          moduleQuestions.length
            ? filteredModuleQuestions.length
              ? `<div class="stack">${filteredModuleQuestions.map((question) => buildAdminQuestionBankQuestionMarkup(question)).join("")}</div>`
              : '<p class="muted">No hay preguntas que coincidan con los filtros de este modulo.</p>'
            : '<p class="muted">Todavia no hay preguntas en este modulo.</p>'
        }
      </section>
      ${
        getUnusedQuestionsForModule(module.id).length
          ? `
            <section class="panel panel-side">
              <h4>Preguntas sin usar en tests</h4>
              <ul class="stack">${getUnusedQuestionsForModule(module.id)
                .map((question) => buildAdminUnusedQuestionMarkup(question))
                .join("")}</ul>
            </section>
          `
          : ""
      }
    </article>
  `;
}

function renderAdminMarkup() {
  return `
    <section class="panel-stack">
      <article class="panel panel-wide">
        <p class="eyebrow">Tests</p>
        <h2>Gestion de tests independientes</h2>
        <p class="status-note ${testsViewState.message ? `is-${escapeHtml(testsViewState.tone)}` : ""}">
          ${escapeHtml(testsViewState.message || "Crea modulos, preguntas y tests independientes desde aqui.")}
        </p>
      </article>
      <article class="panel panel-side">
        <h3>Nuevo modulo</h3>
        ${buildAdminModuleForm()}
        <form class="stack" data-tests-admin-form="import-csv">
          <h3>Importar preguntas CSV</h3>
          <p class="muted">Cabecera soportada: moduleTitle,testTitle,published,prompt,optionA,optionB,optionC,optionD,correctOption,explanation,topic,difficulty,questionTimeLimitSeconds</p>
          <p class="muted">Si dejas testTitle vacio, las preguntas se importan solo al banco. Si informas testTitle, se crea o reutiliza ese test y se asignan las preguntas.</p>
          <div class="chip-row">
            <button class="ghost-button" type="button" data-action="download-import-csv-template">Descargar plantilla CSV</button>
          </div>
          <label class="inline-field">
            CSV
            <textarea name="csv" rows="8" placeholder="moduleTitle,testTitle,published,prompt,optionA,optionB,optionC,optionD,correctOption,explanation,topic,difficulty,questionTimeLimitSeconds&#10;Primeros Auxilios,,false,&quot;Pregunta solo para banco&quot;,Opcion A,Opcion B,,,A,&quot;Comentario opcional&quot;,trauma,facil,&#10;Rescate,Autoevacuacion,true,&quot;Pregunta asignada a test&quot;,Opcion A,Opcion B,,,A,&quot;Comentario opcional&quot;,evacuacion,media,20" required></textarea>
          </label>
          <div class="chip-row">
            <button class="primary-button" type="submit">Importar CSV</button>
          </div>
        </form>
      </article>
      <article class="panel panel-wide">
        <p class="eyebrow">Sesiones live</p>
        <h2>Sesiones live</h2>
        ${buildAdminLiveSessionsMarkup()}
      </article>
      ${
        testsViewState.modules.length
          ? testsViewState.modules.map((module) => buildAdminModuleMarkup(module)).join("")
          : '<article class="empty-state">Todavia no hay modulos creados.</article>'
      }
    </section>
  `;
}

function buildStudentAttemptsMarkup(attempts = []) {
  return Array.isArray(attempts) && attempts.length
    ? `
      <ul class="stack">
        ${attempts
          .map(
            (attempt) => `
              <li class="panel panel-side">
                <strong>${escapeHtml(`${attempt.score}/${attempt.total}`)}</strong>
                <p class="muted">${escapeHtml(formatAttemptDate(attempt.createdAt))}</p>
                ${
                  Number.isFinite(Number(attempt.durationMs))
                    ? `<p class="muted">Duracion: ${escapeHtml(formatDurationMs(attempt.durationMs))}</p>`
                    : ""
                }
              </li>
            `
          )
          .join("")}
      </ul>
    `
    : '<p class="muted">Aun no has hecho intentos en este test.</p>';
}

function buildStudentLeaderboardMarkup(leaderboard = []) {
  return Array.isArray(leaderboard) && leaderboard.length
    ? `
      <ol class="stack">
        ${leaderboard
          .map(
            (entry) => `
              <li class="panel panel-side">
                <strong>${escapeHtml(entry.displayName || "Participante")}</strong>
                <p class="muted">${escapeHtml(`${entry.score || 0} punto(s)`)}</p>
              </li>
            `
          )
          .join("")}
      </ol>
    `
    : '<p class="muted">Todavia no hay puntuaciones para este test.</p>';
}

function buildStudentTestListMarkup() {
  const visibleTests = testsViewState.tests.filter((test) => Boolean(test.published));
  if (!visibleTests.length) {
    return '<div class="empty-state">Todavia no hay tests publicados.</div>';
  }

  return `
    <div class="stack">
      ${visibleTests
        .map(
          (test) => `
            <button class="course-link ${testsViewState.activeTestId === test.id ? "is-active" : ""}" type="button" data-action="open-test" data-test-id="${escapeHtml(test.id)}">
              <span>${escapeHtml(test.title || "Test sin titulo")}</span>
            </button>
          `
        )
        .join("")}
    </div>
  `;
}

function buildStudentActiveTestMarkup() {
  const test = getActiveStudentTest();
  if (!test) {
    return '<div class="empty-state">Selecciona un test publicado.</div>';
  }

  const questions = getQuestionsForTest(test.id);
  const attempts = getAttemptsForTest(test.id);
  const leaderboard = getLeaderboardForTest(test.id);
  const currentUserRank = getCurrentUserRankForTest(test.id);
  const timeLimitSeconds = getStudentTestTimeLimitSeconds(test);
  const isAttemptActive = hasActiveTimedAttempt(test);

  if (!questions.length) {
    return `
      <section class="panel panel-side">
        <h3>${escapeHtml(test.title)}</h3>
        <p class="muted">Este test todavia no tiene preguntas publicadas.</p>
      </section>
    `;
  }

  if (!isAttemptActive) {
    return `
      <section class="panel panel-side">
        <h3>${escapeHtml(test.title)}</h3>
        <p class="muted">${escapeHtml(test.description || "Sin descripcion")}</p>
        <p class="muted">Preguntas: ${escapeHtml(String(questions.length))}</p>
        ${
          timeLimitSeconds
            ? `<p class="muted">Tiempo limite: ${escapeHtml(String(timeLimitSeconds))} s</p>`
            : '<p class="muted">Sin limite de tiempo</p>'
        }
        <div class="chip-row">
          <button class="primary-button" type="button" data-action="start-test-attempt" data-test-id="${escapeHtml(test.id)}">
            Empezar ahora
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
      explanation: String(formData.get("explanation") || "").trim(),
      topic: String(formData.get("topic") || "").trim(),
      difficulty: String(formData.get("difficulty") || "").trim()
    });
    setTestsViewMessage("Pregunta creada correctamente.", "success");
  } else if (formType === "question-bank") {
    await client.post("/api/questions", {
      moduleId: String(form.dataset.moduleId || "").trim(),
      prompt: String(formData.get("prompt") || "").trim(),
      options: [0, 1, 2, 3].map((index) => String(formData.get(`option${index}`) || "").trim()),
      correctIndex: Number(formData.get("correctIndex")),
      explanation: String(formData.get("explanation") || "").trim(),
      topic: String(formData.get("topic") || "").trim(),
      difficulty: String(formData.get("difficulty") || "").trim()
    });
    setTestsViewMessage("Pregunta guardada en el banco correctamente.", "success");
  } else if (formType === "question-bank-filters") {
    setQuestionBankFilterState(String(form.dataset.moduleId || "").trim(), {
      query: String(formData.get("query") || ""),
      topic: String(formData.get("topic") || ""),
      difficulty: String(formData.get("difficulty") || "")
    });
    renderTestsMarkup(container);
    finalizeTestsViewRender(container);
    return;
  } else if (formType === "question-edit") {
    await client.patch(`/api/questions/${encodeURIComponent(String(form.dataset.questionId || "").trim())}`, {
      prompt: String(formData.get("prompt") || "").trim(),
      options: [0, 1, 2, 3].map((index) => String(formData.get(`option${index}`) || "").trim()),
      correctIndex: Number(formData.get("correctIndex")),
      explanation: String(formData.get("explanation") || "").trim(),
      topic: String(formData.get("topic") || "").trim(),
      difficulty: String(formData.get("difficulty") || "").trim()
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
  } else if (action === "add-question-to-test") {
    const testId = String(dataset.testId || "").trim();
    const questionId = String(dataset.questionId || "").trim();
    const test = testsViewState.tests.find((item) => item.id === testId);
    if (!test) {
      throw new Error("Test no encontrado");
    }
    const orderedIds = [...new Set([...(Array.isArray(test.questionIds) ? test.questionIds : []), questionId])];
    await client.patch(`/api/tests/${encodeURIComponent(testId)}`, { questionIds: orderedIds });
    setTestsViewMessage("Pregunta añadida al test correctamente.", "success");
  } else if (action === "remove-question-from-test") {
    const testId = String(dataset.testId || "").trim();
    const questionId = String(dataset.questionId || "").trim();
    const test = testsViewState.tests.find((item) => item.id === testId);
    if (!test) {
      throw new Error("Test no encontrado");
    }
    const orderedIds = (Array.isArray(test.questionIds) ? test.questionIds : []).filter((item) => item !== questionId);
    await client.patch(`/api/tests/${encodeURIComponent(testId)}`, { questionIds: orderedIds });
    setTestsViewMessage("Pregunta quitada del test. Sigue disponible en el banco.", "success");
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
  } else if (action === "download-import-csv-template") {
    window.location.assign("/api/tests/import-csv-template");
  } else if (action === "clear-question-bank-filters") {
    clearQuestionBankFilterState(String(dataset.moduleId || "").trim());
    renderTestsMarkup(container);
    finalizeTestsViewRender(container);
    return;
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
