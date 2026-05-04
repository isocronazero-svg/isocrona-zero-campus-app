const testsViewState = {
  role: "member",
  modules: [],
  tests: [],
  allQuestions: [],
  questionsByTestId: {},
  attemptsByTestId: {},
  leaderboardByTestId: {},
  currentUserRankByTestId: {},
  startedAtByTestId: {},
  activeTestId: "",
  activeAttemptTestId: "",
  result: null,
  message: "",
  tone: "neutral",
  renderToken: 0,
  timerIntervalId: null,
  timerRemainingMs: null,
  autoSubmittingTestId: ""
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

async function loadAdminData() {
  const client = getApiClient();
  if (!client) {
    throw new Error("Cliente API no disponible");
  }

  const [{ testModules }, { tests }, { questions }] = await Promise.all([
    client.get("/api/test-modules"),
    client.get("/api/tests"),
    client.get("/api/questions")
  ]);

  testsViewState.modules = Array.isArray(testModules) ? testModules : [];
  testsViewState.tests = Array.isArray(tests) ? tests : [];
  testsViewState.allQuestions = Array.isArray(questions) ? questions : [];
  testsViewState.questionsByTestId = {};
  testsViewState.attemptsByTestId = {};
  testsViewState.leaderboardByTestId = {};
  testsViewState.currentUserRankByTestId = {};
  testsViewState.activeAttemptTestId = "";
  clearStudentTimer();

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
  testsViewState.result = null;
  clearStudentTimer();

  const visibleTests = testsViewState.tests.filter((test) => Boolean(test.published));
  if (!visibleTests.length) {
    testsViewState.activeTestId = "";
    return;
  }

  const hasActiveVisibleTest = visibleTests.some((test) => test.id === testsViewState.activeTestId);
  testsViewState.activeTestId = hasActiveVisibleTest ? testsViewState.activeTestId : visibleTests[0].id;
  if (!visibleTests.some((test) => test.id === testsViewState.activeAttemptTestId)) {
    testsViewState.activeAttemptTestId = "";
  }
  await ensureStudentActiveTestQuestions();
  await ensureStudentActiveTestAttempts();
  await ensureStudentActiveTestLeaderboard();
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
  if (isAdminRole(testsViewState.role)) {
    clearStudentTimer();
    return;
  }
  if (hasActiveTimedAttempt()) {
    startStudentTimer(container);
    return;
  }
  clearStudentTimer();
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
                        <div class="chip-row">
                          <button class="primary-button" type="submit">Guardar test</button>
                          <button class="ghost-button danger-button" type="button" data-action="delete-test" data-test-id="${escapeHtml(test.id)}">
                            Borrar test
                          </button>
                        </div>
                      </form>
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
              </div>
              <button class="primary-button" type="button" data-action="open-test" data-test-id="${escapeHtml(test.id)}">
                Hacer test
              </button>
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
    return '<div class="empty-state">Este test aun no tiene preguntas disponibles.</div>';
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
  }

  await refreshTestsView(container, testsViewState.role);
}

async function handleAdminAction(container, action, dataset = {}) {
  const client = getApiClient();
  if (!client) {
    throw new Error("Cliente API no disponible");
  }

  if (action === "delete-module") {
    await client.delete(`/api/test-modules/${encodeURIComponent(String(dataset.moduleId || "").trim())}`);
    setTestsViewMessage("Modulo borrado correctamente.", "success");
  } else if (action === "delete-test") {
    await client.delete(`/api/tests/${encodeURIComponent(String(dataset.testId || "").trim())}`);
    setTestsViewMessage("Test borrado correctamente.", "success");
  } else if (action === "delete-question") {
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
