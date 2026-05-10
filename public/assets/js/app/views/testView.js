import {
  buildQuestionTopicGroups,
  evaluateNormalTest,
  generateNormalTest,
  getQuestionTopicKey,
  shuffleQuestions
} from "../modules/tests/testService.js";
import {
  createQuestion,
  generateDummyQuestions,
  getStoredModules,
  getStoredQuestions,
  loadModulesFromServer,
  loadQuestions,
  loadQuestionsFromServer,
  loadStoredModules,
  saveQuestion,
  saveQuestionToServer
} from "../modules/tests/questionService.js";

const NORMAL_RESULT_STORAGE_KEY = "iz-normal-test-results";
const FAILED_QUESTION_STORAGE_KEY = "iz-normal-test-failed-question-ids";
const DEFAULT_QUESTION_COUNT = 25;
const DEFAULT_TIME_LIMIT = "none";

const testSession = {
  role: "member",
  activeTab: "generator",
  mode: "generator",
  questionCount: DEFAULT_QUESTION_COUNT,
  timeLimit: DEFAULT_TIME_LIMIT,
  selectedTopicKeys: new Set(),
  liveSelectedTopicKeys: new Set(),
  currentTest: [],
  answersByQuestionId: {},
  currentQuestionIndex: 0,
  startedAt: null,
  finishedAt: null,
  timerId: null,
  result: null,
  results: [],
  failedQuestionIds: new Set(),
  message: "",
  messageTone: "neutral",
  liveMessage: "",
  liveMessageTone: "neutral",
  liveSession: null,
  failedMode: "summary",
  hydrated: false,
  hydrateToken: 0
};

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function canUseLocalStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function readJsonStorage(key, fallback) {
  if (!canUseLocalStorage()) {
    return fallback;
  }

  try {
    return JSON.parse(window.localStorage.getItem(key) || JSON.stringify(fallback));
  } catch (error) {
    return fallback;
  }
}

function writeJsonStorage(key, value) {
  if (!canUseLocalStorage()) {
    return;
  }

  window.localStorage.setItem(key, JSON.stringify(value));
}

function getQuestions() {
  return getStoredQuestions().filter((question) => question.active !== false && question.prompt && question.options.length >= 2);
}

function getModules() {
  return getStoredModules();
}

function getTopicGroups() {
  return buildQuestionTopicGroups(getQuestions(), getModules());
}

function getAllTopicKeys(groups = getTopicGroups()) {
  return groups.flatMap((group) => group.topics.map((topic) => topic.key));
}

function getSelectedTopicKeys(mode = "normal", groups = getTopicGroups()) {
  const source = mode === "live" ? testSession.liveSelectedTopicKeys : testSession.selectedTopicKeys;
  if (!source.size) {
    return getAllTopicKeys(groups);
  }
  return Array.from(source).filter((key) => getAllTopicKeys(groups).includes(key));
}

function setMessage(message, tone = "neutral") {
  testSession.message = message;
  testSession.messageTone = tone;
}

function setLiveMessage(message, tone = "neutral") {
  testSession.liveMessage = message;
  testSession.liveMessageTone = tone;
}

function stopTimer() {
  if (testSession.timerId) {
    clearInterval(testSession.timerId);
    testSession.timerId = null;
  }
}

function getTimeLimitMinutes() {
  if (testSession.timeLimit === "30") {
    return 30;
  }
  if (testSession.timeLimit === "60") {
    return 60;
  }
  return null;
}

function getDurationSeconds() {
  if (!testSession.startedAt) {
    return 0;
  }
  const endTime = testSession.finishedAt || new Date();
  return Math.max(0, Math.round((endTime.getTime() - testSession.startedAt.getTime()) / 1000));
}

function formatDuration(seconds) {
  const safeSeconds = Math.max(0, Number(seconds || 0));
  const minutes = Math.floor(safeSeconds / 60);
  const rest = safeSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(rest).padStart(2, "0")}`;
}

function getRemainingSeconds() {
  const limitMinutes = getTimeLimitMinutes();
  if (!limitMinutes || !testSession.startedAt) {
    return null;
  }
  return Math.max(0, limitMinutes * 60 - getDurationSeconds());
}

function updateTimerDisplay(container) {
  const timerEl = container.querySelector("[data-normal-test-time]");
  if (!timerEl) {
    return;
  }

  const remainingSeconds = getRemainingSeconds();
  timerEl.textContent = remainingSeconds === null ? "Sin tiempo" : formatDuration(remainingSeconds);
}

function startTimer(container) {
  stopTimer();
  if (!getTimeLimitMinutes()) {
    updateTimerDisplay(container);
    return;
  }

  testSession.timerId = window.setInterval(() => {
    updateTimerDisplay(container);
    if (getRemainingSeconds() === 0) {
      finishNormalTest(container);
    }
  }, 1000);
}

function normalizeStoredResult(result = {}) {
  const correctCount = Number(result.correctCount ?? result.score ?? 0);
  const total = Number(result.total ?? result.questionIds?.length ?? 0);
  const wrongCount = Number(result.wrongCount ?? 0);
  const blankCount = Number(result.blankCount ?? 0);
  const scorePercent = Number(result.scorePercent ?? result.percentage ?? (total ? (correctCount / total) * 100 : 0));

  return {
    id: String(result.id || `normal-result-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`),
    userId: String(result.userId || ""),
    memberId: String(result.memberId || ""),
    questionIds: Array.isArray(result.questionIds) ? result.questionIds : [],
    answers: Array.isArray(result.answers) ? result.answers : [],
    correctCount,
    wrongCount,
    blankCount,
    scorePercent,
    percentage: scorePercent,
    total,
    duration: Number(result.duration || 0),
    createdAt: result.createdAt || new Date().toISOString(),
    selectedConfig: result.selectedConfig || {}
  };
}

function loadLocalResults() {
  testSession.results = readJsonStorage(NORMAL_RESULT_STORAGE_KEY, []).map(normalizeStoredResult);
}

function saveLocalResult(result) {
  const normalizedResult = normalizeStoredResult(result);
  const results = [
    normalizedResult,
    ...testSession.results.filter((item) => item.id !== normalizedResult.id)
  ].slice(0, 100);
  testSession.results = results;
  writeJsonStorage(NORMAL_RESULT_STORAGE_KEY, results);
  return normalizedResult;
}

function loadFailedQuestionIds() {
  testSession.failedQuestionIds = new Set(readJsonStorage(FAILED_QUESTION_STORAGE_KEY, []).map((item) => String(item)));
}

function saveFailedQuestionIds(ids) {
  const nextIds = new Set([...testSession.failedQuestionIds, ...(Array.isArray(ids) ? ids : [])].map((item) => String(item)));
  testSession.failedQuestionIds = nextIds;
  writeJsonStorage(FAILED_QUESTION_STORAGE_KEY, Array.from(nextIds));
}

function removeFailedQuestionIds(ids) {
  const removeSet = new Set((Array.isArray(ids) ? ids : []).map((item) => String(item)));
  testSession.failedQuestionIds = new Set(Array.from(testSession.failedQuestionIds).filter((id) => !removeSet.has(id)));
  writeJsonStorage(FAILED_QUESTION_STORAGE_KEY, Array.from(testSession.failedQuestionIds));
}

async function loadResultsFromServer() {
  if (typeof fetch !== "function") {
    return testSession.results;
  }

  try {
    const response = await fetch("/api/test-results/me", { credentials: "same-origin" });
    if (!response.ok) {
      return testSession.results;
    }
    const payload = await response.json();
    const remoteResults = Array.isArray(payload.results) ? payload.results.map(normalizeStoredResult) : [];
    const merged = [...remoteResults, ...testSession.results];
    const seen = new Set();
    testSession.results = merged.filter((result) => {
      if (seen.has(result.id)) {
        return false;
      }
      seen.add(result.id);
      return true;
    });
    writeJsonStorage(NORMAL_RESULT_STORAGE_KEY, testSession.results);
    return testSession.results;
  } catch (error) {
    return testSession.results;
  }
}

async function saveResultToServer(result) {
  if (typeof fetch !== "function") {
    return null;
  }

  try {
    const response = await fetch("/api/test-results", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        resultType: "normal",
        score: result.correctCount,
        total: result.total,
        percentage: result.scorePercent,
        questionIds: result.questionIds,
        answers: result.answers,
        correctCount: result.correctCount,
        wrongCount: result.wrongCount,
        blankCount: result.blankCount,
        scorePercent: result.scorePercent,
        duration: result.duration,
        selectedConfig: result.selectedConfig
      })
    });
    if (!response.ok) {
      return null;
    }
    const payload = await response.json();
    return payload.result || null;
  } catch (error) {
    return null;
  }
}

function getCurrentQuestion() {
  return testSession.currentTest[testSession.currentQuestionIndex] || null;
}

function renderStatusMessage(message, tone = "neutral") {
  if (!message) {
    return "";
  }
  return `<div class="test-status-message is-${escapeHtml(tone)}">${escapeHtml(message)}</div>`;
}

function renderTabs() {
  const tabs = [
    ["generator", "Generador de test"],
    ["failed", "Preguntas falladas"],
    ["history", "Historial"],
    ["live", "Test en vivo"],
    ...(testSession.role === "admin" ? [["bank", "Banco de preguntas"]] : [])
  ];

  return `
    <nav class="test-tabs" aria-label="Zona Test">
      ${tabs
        .map(
          ([id, label]) => `
            <button
              type="button"
              class="test-tab ${testSession.activeTab === id ? "is-active" : ""}"
              data-test-tab="${id}"
            >
              ${escapeHtml(label)}
            </button>
          `
        )
        .join("")}
    </nav>
  `;
}

function renderQuestionCountOptions(name, selectedValue, values = [25, 50, 100]) {
  return `
    <div class="test-segmented" role="radiogroup" aria-label="Numero de preguntas">
      ${values
        .map(
          (value) => `
            <label class="test-segment">
              <input type="radio" name="${escapeHtml(name)}" value="${value}" ${Number(selectedValue) === value ? "checked" : ""} />
              <span>${value}</span>
            </label>
          `
        )
        .join("")}
    </div>
  `;
}

function renderTimeOptions() {
  const options = [
    ["30", "30 min"],
    ["60", "60 min"],
    ["none", "Sin tiempo"]
  ];

  return `
    <div class="test-segmented" role="radiogroup" aria-label="Tiempo">
      ${options
        .map(
          ([value, label]) => `
            <label class="test-segment">
              <input type="radio" name="timeLimit" value="${value}" ${testSession.timeLimit === value ? "checked" : ""} />
              <span>${escapeHtml(label)}</span>
            </label>
          `
        )
        .join("")}
    </div>
  `;
}

function renderTopicSelector({ mode = "normal", groups = getTopicGroups() } = {}) {
  if (!groups.length) {
    return `
      <div class="test-empty-state">
        No hay preguntas activas en el banco. Administracion puede cargar preguntas desde Banco de preguntas.
      </div>
    `;
  }

  const selectedKeys = new Set(getSelectedTopicKeys(mode, groups));
  const blockAttribute = mode === "live" ? "data-live-topic-block" : "data-topic-block";
  const topicAttribute = mode === "live" ? "data-live-topic-checkbox" : "data-topic-checkbox";

  return `
    <div class="test-topic-list">
      ${groups
        .map((group) => {
          const everyTopicSelected = group.topics.every((topic) => selectedKeys.has(topic.key));
          return `
            <section class="test-topic-group">
              <label class="test-topic-group-header">
                <input
                  type="checkbox"
                  ${blockAttribute}
                  data-topic-mode="${mode}"
                  data-topic-keys="${escapeHtml(group.topics.map((topic) => topic.key).join(","))}"
                  ${everyTopicSelected ? "checked" : ""}
                />
                <span>
                  <strong>${escapeHtml(group.label)}</strong>
                  ${group.moduleTitle ? `<small>${escapeHtml(group.moduleTitle)}</small>` : ""}
                </span>
                <em>${group.count}</em>
              </label>
              <div class="test-topic-items">
                ${group.topics
                  .map(
                    (topic) => `
                      <label class="test-topic-row">
                        <input
                          type="checkbox"
                          ${topicAttribute}
                          data-topic-mode="${mode}"
                          value="${escapeHtml(topic.key)}"
                          ${selectedKeys.has(topic.key) ? "checked" : ""}
                        />
                        <span>${escapeHtml(topic.label)} <small>(${topic.count})</small></span>
                      </label>
                    `
                  )
                  .join("")}
              </div>
            </section>
          `;
        })
        .join("")}
    </div>
  `;
}

function renderGenerator() {
  const groups = getTopicGroups();
  const totalQuestions = getQuestions().length;
  const selectedCount = getQuestionsForSelectedTopics("normal").length;

  return `
    <form class="test-generator-panel" data-normal-test-form>
      <div class="test-generator-grid">
        <section class="test-config-block">
          <p class="test-view-kicker">Preguntas</p>
          <h3>Numero de preguntas</h3>
          ${renderQuestionCountOptions("questionCount", testSession.questionCount)}
        </section>
        <section class="test-config-block">
          <p class="test-view-kicker">Tiempo</p>
          <h3>Duracion</h3>
          ${renderTimeOptions()}
        </section>
      </div>

      <section class="test-topic-panel">
        <div class="test-section-heading">
          <div>
            <p class="test-view-kicker">Temario</p>
            <h3>Bloques y temas</h3>
          </div>
          <span class="test-builder-count">${selectedCount} de ${totalQuestions} preguntas</span>
        </div>
        ${renderTopicSelector({ mode: "normal", groups })}
      </section>

      ${renderStatusMessage(testSession.message, testSession.messageTone)}

      <div class="test-action-row">
        <button type="submit" class="test-primary-button" ${!totalQuestions ? "disabled" : ""}>Generar test</button>
      </div>
    </form>
  `;
}

function getQuestionsForSelectedTopics(mode = "normal") {
  const groups = getTopicGroups();
  const selectedTopicKeys = getSelectedTopicKeys(mode, groups);
  const selectedSet = new Set(selectedTopicKeys);
  return getQuestions().filter((question) => selectedSet.has(getQuestionTopicKey(question, getModules())));
}

function renderTakingTest() {
  const question = getCurrentQuestion();
  if (!question) {
    return `<div class="test-empty-state">No hay preguntas disponibles para este test.</div>`;
  }

  const total = testSession.currentTest.length;
  const answeredCount = testSession.currentTest.filter((item) => testSession.answersByQuestionId[item.id] !== undefined).length;
  const selectedAnswer = testSession.answersByQuestionId[question.id];

  return `
    <section class="test-taking-panel">
      <header class="test-run-header">
        <div>
          <p class="test-view-kicker">Test normal</p>
          <h3>Pregunta ${testSession.currentQuestionIndex + 1} de ${total}</h3>
        </div>
        <div class="test-view-stats">
          <div class="test-stat-pill">
            <span class="test-stat-label">Progreso</span>
            <strong>${answeredCount}/${total}</strong>
          </div>
          <div class="test-stat-pill">
            <span class="test-stat-label">Tiempo</span>
            <strong data-normal-test-time>${getRemainingSeconds() === null ? "Sin tiempo" : formatDuration(getRemainingSeconds())}</strong>
          </div>
        </div>
      </header>

      <div class="test-progress-track" aria-hidden="true">
        <span style="width: ${Math.round(((testSession.currentQuestionIndex + 1) / total) * 100)}%"></span>
      </div>

      <article class="test-question-card">
        <div class="test-question-meta">
          <span class="test-question-topic">${escapeHtml(question.temaNumero ? `Tema ${question.temaNumero}` : question.temaTitulo || question.topic || "Sin clasificar")}</span>
          <span class="test-question-difficulty">${escapeHtml(question.category || "bomberos")}</span>
        </div>
        <h3 class="test-question-title">${escapeHtml(question.prompt || question.question)}</h3>
        <div class="test-options-grid" data-test-options>
          ${question.options
            .map(
              (option, optionIndex) => `
                <button
                  type="button"
                  class="test-option-button ${Number(selectedAnswer) === optionIndex ? "is-selected" : ""}"
                  data-answer-index="${optionIndex}"
                  data-question-id="${escapeHtml(question.id)}"
                >
                  <span class="test-option-badge">${String.fromCharCode(65 + optionIndex)}</span>
                  <span class="test-option-label">${escapeHtml(option)}</span>
                </button>
              `
            )
            .join("")}
        </div>
      </article>

      <div class="test-action-row test-action-row--split">
        <button type="button" class="test-secondary-button" data-test-prev ${testSession.currentQuestionIndex <= 0 ? "disabled" : ""}>Anterior</button>
        <div class="test-action-row">
          <button type="button" class="test-secondary-button" data-test-next>${testSession.currentQuestionIndex >= total - 1 ? "Ir al final" : "Siguiente"}</button>
          <button type="button" class="test-primary-button" data-test-finish>Finalizar test</button>
        </div>
      </div>
    </section>
  `;
}

function renderResults() {
  const result = testSession.result;
  if (!result) {
    return renderGenerator();
  }

  return `
    <section class="test-result-card">
      <p class="test-result-kicker">Test finalizado</p>
      <h3 class="test-result-title">${result.correctCount} aciertos de ${result.total}</h3>
      <div class="test-result-grid">
        <div><span>Aciertos</span><strong>${result.correctCount}</strong></div>
        <div><span>Fallos</span><strong>${result.wrongCount}</strong></div>
        <div><span>Blancas</span><strong>${result.blankCount}</strong></div>
        <div><span>Porcentaje</span><strong>${result.scorePercent.toFixed(1)}%</strong></div>
        <div><span>Tiempo</span><strong>${formatDuration(result.duration)}</strong></div>
      </div>
      <p class="test-result-summary">
        Resultado guardado en el historial normal. Las preguntas falladas y en blanco quedan disponibles para repaso.
      </p>
      <div class="test-action-row">
        <button type="button" class="test-primary-button" data-test-new>Nuevo test</button>
        <button type="button" class="test-secondary-button" data-test-open-failed>Ver falladas</button>
        <button type="button" class="test-secondary-button" data-test-open-history>Historial</button>
      </div>
    </section>
  `;
}

function renderFailedQuestions() {
  const failedIds = Array.from(testSession.failedQuestionIds);
  const failedQuestions = getQuestions().filter((question) => failedIds.includes(question.id));

  if (!failedQuestions.length) {
    return `
      <section class="test-simple-panel">
        <p class="test-view-kicker">Repaso</p>
        <h3>Preguntas falladas</h3>
        <div class="test-empty-state">Todavia no hay preguntas falladas de tests normales.</div>
      </section>
    `;
  }

  return `
    <section class="test-simple-panel">
      <div class="test-section-heading">
        <div>
          <p class="test-view-kicker">Repaso</p>
          <h3>Preguntas falladas</h3>
        </div>
        <span class="test-builder-count">${failedQuestions.length} pregunta(s)</span>
      </div>
      <div class="test-action-row">
        <button type="button" class="test-primary-button" data-test-failed-start>Generar test con falladas</button>
        <button type="button" class="test-secondary-button" data-test-failed-review>Repasar falladas</button>
        <button type="button" class="test-secondary-button" data-test-failed-clear>Limpiar falladas resueltas</button>
      </div>
      ${
        testSession.failedMode === "review"
          ? `
            <div class="test-review-list">
              ${failedQuestions
                .map(
                  (question) => `
                    <article class="test-review-item">
                      <p class="test-view-kicker">${escapeHtml(question.temaNumero ? `Tema ${question.temaNumero}` : question.temaTitulo || "Repaso")}</p>
                      <h4>${escapeHtml(question.prompt)}</h4>
                      <p><strong>Respuesta correcta:</strong> ${escapeHtml(question.options[question.correctIndex] || "")}</p>
                      ${question.explanation ? `<p class="muted">${escapeHtml(question.explanation)}</p>` : ""}
                    </article>
                  `
                )
                .join("")}
            </div>
          `
          : ""
      }
    </section>
  `;
}

function renderHistory() {
  const results = [...testSession.results].sort((left, right) => String(right.createdAt).localeCompare(String(left.createdAt)));
  const totals = results.reduce(
    (acc, result) => {
      acc.tests += 1;
      acc.questions += Number(result.total || result.questionIds.length || 0);
      acc.correct += Number(result.correctCount || 0);
      acc.wrong += Number(result.wrongCount || 0);
      return acc;
    },
    { tests: 0, questions: 0, correct: 0, wrong: 0 }
  );
  const globalPercent = totals.questions ? (totals.correct / totals.questions) * 100 : 0;

  return `
    <section class="test-simple-panel">
      <div class="test-section-heading">
        <div>
          <p class="test-view-kicker">Historial normal</p>
          <h3>Resultados y estadisticas</h3>
        </div>
      </div>
      <div class="test-result-grid test-result-grid--compact">
        <div><span>Tests</span><strong>${totals.tests}</strong></div>
        <div><span>Preguntas</span><strong>${totals.questions}</strong></div>
        <div><span>Aciertos</span><strong>${totals.correct}</strong></div>
        <div><span>Fallos</span><strong>${totals.wrong}</strong></div>
        <div><span>Global</span><strong>${globalPercent.toFixed(1)}%</strong></div>
      </div>
      ${
        results.length
          ? `
            <div class="test-history-table" role="table" aria-label="Historial de tests normales">
              <div class="test-history-row is-head" role="row">
                <span>Fecha</span>
                <span>Preguntas</span>
                <span>Aciertos</span>
                <span>Fallos</span>
                <span>Blancas</span>
                <span>%</span>
                <span>Tiempo</span>
              </div>
              ${results
                .map(
                  (result) => `
                    <div class="test-history-row" role="row">
                      <span>${escapeHtml(new Date(result.createdAt).toLocaleDateString("es-ES"))}</span>
                      <span>${result.total || result.questionIds.length}</span>
                      <span>${result.correctCount}</span>
                      <span>${result.wrongCount}</span>
                      <span>${result.blankCount}</span>
                      <span>${Number(result.scorePercent || 0).toFixed(1)}%</span>
                      <span>${formatDuration(result.duration)}</span>
                    </div>
                  `
                )
                .join("")}
            </div>
          `
          : `<div class="test-empty-state">Todavia no hay tests normales en el historial.</div>`
      }
    </section>
  `;
}

function renderLiveTab() {
  const groups = getTopicGroups();
  const totalQuestions = getQuestions().length;

  if (testSession.role !== "admin") {
    return `
      <section class="test-simple-panel">
        <p class="test-view-kicker">Test en vivo</p>
        <h3>Acceso con nombre y codigo</h3>
        <p class="muted">El test en vivo esta separado del generador normal. Sus resultados no se mezclan con tu historial de socio.</p>
        <div class="test-action-row">
          <a class="test-primary-button test-link-button" href="/live-test.html">Entrar a un test en vivo</a>
        </div>
      </section>
    `;
  }

  return `
    <form class="test-simple-panel" data-live-session-form>
      <div class="test-section-heading">
        <div>
          <p class="test-view-kicker">Test en vivo</p>
          <h3>Crear sesion tipo Kahoot</h3>
        </div>
        <span class="test-builder-count">${totalQuestions} preguntas en banco</span>
      </div>
      <div class="test-generator-grid">
        <label class="test-inline-field">
          Titulo de la sesion
          <input name="liveTitle" type="text" value="Sesion en vivo Isocrona Zero" required />
        </label>
        <section class="test-config-block">
          <p class="test-view-kicker">Preguntas</p>
          ${renderQuestionCountOptions("liveQuestionCount", 25, [10, 25, 50])}
        </section>
      </div>
      <section class="test-topic-panel">
        <div class="test-section-heading">
          <div>
            <p class="test-view-kicker">Banco compartido</p>
            <h3>Bloques para la sesion</h3>
          </div>
        </div>
        ${renderTopicSelector({ mode: "live", groups })}
      </section>
      ${renderStatusMessage(testSession.liveMessage, testSession.liveMessageTone)}
      ${
        testSession.liveSession
          ? `
            <div class="test-live-code-card">
              <span>Codigo</span>
              <strong>${escapeHtml(testSession.liveSession.code)}</strong>
              <a href="/live-test.html?code=${encodeURIComponent(testSession.liveSession.code)}">Abrir acceso publico</a>
            </div>
          `
          : ""
      }
      <div class="test-action-row">
        <button type="submit" class="test-primary-button" ${!totalQuestions ? "disabled" : ""}>Crear sesion en vivo</button>
      </div>
    </form>
  `;
}

function renderBankTab() {
  return `
    <section class="test-builder-card">
      <div class="test-builder-header">
        <div>
          <p class="test-view-kicker">Administracion</p>
          <h3 class="test-builder-title">Banco de preguntas</h3>
        </div>
        <div class="test-builder-actions">
          <button type="button" class="test-secondary-button" data-test-generate-dummy>Cargar 30 de prueba</button>
          <span class="test-builder-count" data-test-question-count>${getQuestions().length} preguntas</span>
        </div>
      </div>
      <form class="test-builder-form" data-test-question-form>
        <label>
          <span>Enunciado</span>
          <input type="text" name="question" required />
        </label>
        <label>
          <span>Parte</span>
          <select name="part" required>
            <option value="comun">Parte comun</option>
            <option value="especifica" selected>Parte especifica</option>
          </select>
        </label>
        <label>
          <span>Categoria</span>
          <select name="category" required>
            <option value="legislacion">Legislacion</option>
            <option value="bomberos" selected>Bomberos</option>
          </select>
        </label>
        <label>
          <span>Manual / modulo</span>
          <input type="text" name="moduleTitle" value="Manual bomberos" />
        </label>
        <label>
          <span>Numero de tema</span>
          <input type="text" name="temaNumero" placeholder="1" />
        </label>
        <label>
          <span>Titulo del tema</span>
          <input type="text" name="temaTitulo" placeholder="Principios de la lucha contra incendios" required />
        </label>
        <label>
          <span>Opcion A</span>
          <input type="text" name="option0" required />
        </label>
        <label>
          <span>Opcion B</span>
          <input type="text" name="option1" required />
        </label>
        <label>
          <span>Opcion C</span>
          <input type="text" name="option2" required />
        </label>
        <label>
          <span>Opcion D</span>
          <input type="text" name="option3" required />
        </label>
        <label>
          <span>Respuesta correcta</span>
          <select name="correctAnswer" required>
            <option value="0">Opcion A</option>
            <option value="1">Opcion B</option>
            <option value="2">Opcion C</option>
            <option value="3">Opcion D</option>
          </select>
        </label>
        <label>
          <span>Explicacion opcional</span>
          <input type="text" name="explanation" />
        </label>
        <div class="test-builder-submit">
          <button type="submit" class="test-primary-button">Guardar pregunta</button>
        </div>
      </form>
      ${renderStatusMessage(testSession.message, testSession.messageTone)}
    </section>
  `;
}

function renderActiveTab() {
  if (testSession.activeTab === "generator") {
    if (testSession.mode === "taking") {
      return renderTakingTest();
    }
    if (testSession.mode === "results") {
      return renderResults();
    }
    return renderGenerator();
  }
  if (testSession.activeTab === "failed") {
    return renderFailedQuestions();
  }
  if (testSession.activeTab === "history") {
    return renderHistory();
  }
  if (testSession.activeTab === "live") {
    return renderLiveTab();
  }
  if (testSession.activeTab === "bank" && testSession.role === "admin") {
    return renderBankTab();
  }
  return renderGenerator();
}

function renderTestLayout(container) {
  container.innerHTML = `
    <section class="test-view test-view--academy">
      <header class="test-view-header">
        <div>
          <p class="test-view-kicker">Zona Test</p>
          <h2 class="test-view-title">Generador de test</h2>
          <p class="muted">Practica individual para socios y administracion, separada del test en vivo.</p>
        </div>
        <div class="test-view-stats">
          <div class="test-stat-pill">
            <span class="test-stat-label">Banco</span>
            <strong>${getQuestions().length}</strong>
          </div>
          <div class="test-stat-pill">
            <span class="test-stat-label">Falladas</span>
            <strong>${testSession.failedQuestionIds.size}</strong>
          </div>
        </div>
      </header>
      ${renderTabs()}
      ${renderActiveTab()}
    </section>
  `;

  if (testSession.mode === "taking") {
    startTimer(container);
  } else {
    stopTimer();
  }
}

function getCheckedTopicKeys(container, mode = "normal") {
  const selector = mode === "live" ? "[data-live-topic-checkbox]:checked" : "[data-topic-checkbox]:checked";
  return Array.from(container.querySelectorAll(selector)).map((input) => String(input.value || ""));
}

function syncSelectedTopicsFromDom(container, mode = "normal") {
  const keys = getCheckedTopicKeys(container, mode);
  if (mode === "live") {
    testSession.liveSelectedTopicKeys = new Set(keys);
  } else {
    testSession.selectedTopicKeys = new Set(keys);
  }
  return keys;
}

function startNormalTest(container) {
  const form = container.querySelector("[data-normal-test-form]");
  const formData = new FormData(form);
  testSession.questionCount = Number(formData.get("questionCount") || DEFAULT_QUESTION_COUNT);
  testSession.timeLimit = String(formData.get("timeLimit") || DEFAULT_TIME_LIMIT);
  const selectedTopicKeys = syncSelectedTopicsFromDom(container, "normal");

  if (!selectedTopicKeys.length) {
    setMessage("Selecciona al menos un bloque o tema.", "error");
    renderTestLayout(container);
    return;
  }

  try {
    testSession.currentTest = generateNormalTest(
      {
        questions: getQuestions(),
        modules: getModules(),
        questionCount: testSession.questionCount,
        selectedTopicKeys
      },
      testSession.role
    );
    testSession.answersByQuestionId = {};
    testSession.currentQuestionIndex = 0;
    testSession.startedAt = new Date();
    testSession.finishedAt = null;
    testSession.result = null;
    testSession.mode = "taking";
    setMessage("", "neutral");
    renderTestLayout(container);
  } catch (error) {
    setMessage(error.message || "No se pudo generar el test.", "error");
    renderTestLayout(container);
  }
}

function startFailedTest(container) {
  const failedQuestions = getQuestions().filter((question) => testSession.failedQuestionIds.has(question.id));
  if (!failedQuestions.length) {
    setMessage("No hay preguntas falladas disponibles para generar un test.", "error");
    renderTestLayout(container);
    return;
  }

  const requestedCount = Math.min(Number(testSession.questionCount || DEFAULT_QUESTION_COUNT), failedQuestions.length);
  testSession.currentTest = shuffleQuestions(failedQuestions).slice(0, requestedCount);
  testSession.answersByQuestionId = {};
  testSession.currentQuestionIndex = 0;
  testSession.startedAt = new Date();
  testSession.finishedAt = null;
  testSession.result = null;
  testSession.activeTab = "generator";
  testSession.mode = "taking";
  testSession.timeLimit = DEFAULT_TIME_LIMIT;
  setMessage("", "neutral");
  renderTestLayout(container);
}

async function finishNormalTest(container) {
  if (testSession.mode !== "taking" || testSession.result) {
    return;
  }

  stopTimer();
  testSession.finishedAt = new Date();
  const evaluation = evaluateNormalTest(testSession.currentTest, testSession.answersByQuestionId, testSession.role);
  const result = {
    id: `normal-result-${Date.now()}`,
    questionIds: testSession.currentTest.map((question) => question.id),
    answers: evaluation.answers,
    correctCount: evaluation.correctCount,
    wrongCount: evaluation.wrongCount,
    blankCount: evaluation.blankCount,
    scorePercent: evaluation.scorePercent,
    total: evaluation.total,
    duration: getDurationSeconds(),
    createdAt: new Date().toISOString(),
    selectedConfig: {
      questionCount: testSession.questionCount,
      timeLimit: testSession.timeLimit,
      selectedTopicKeys: Array.from(testSession.selectedTopicKeys)
    }
  };

  testSession.result = saveLocalResult(result);
  saveFailedQuestionIds(evaluation.failedQuestionIds);
  const correctIds = evaluation.answers.filter((answer) => answer.correct).map((answer) => answer.questionId);
  removeFailedQuestionIds(correctIds);
  testSession.mode = "results";
  renderTestLayout(container);

  const serverResult = await saveResultToServer(result);
  if (serverResult?.id) {
    testSession.result = saveLocalResult({ ...result, id: serverResult.id, createdAt: serverResult.createdAt || result.createdAt });
    renderTestLayout(container);
  }
}

function moveQuestion(container, direction) {
  const total = testSession.currentTest.length;
  testSession.currentQuestionIndex = Math.min(total - 1, Math.max(0, testSession.currentQuestionIndex + direction));
  renderTestLayout(container);
}

function handleAnswerClick(container, event) {
  const button = event.target.closest("[data-answer-index]");
  if (!button || testSession.mode !== "taking") {
    return false;
  }

  const questionId = String(button.dataset.questionId || "");
  testSession.answersByQuestionId[questionId] = Number(button.dataset.answerIndex);
  renderTestLayout(container);
  return true;
}

function handleTopicChange(container, event) {
  const block = event.target.closest("[data-topic-block], [data-live-topic-block]");
  if (block) {
    const mode = block.dataset.topicMode || "normal";
    const checked = block.checked;
    const keys = String(block.dataset.topicKeys || "").split(",").filter(Boolean);
    const selector = mode === "live" ? "[data-live-topic-checkbox]" : "[data-topic-checkbox]";
    container.querySelectorAll(selector).forEach((input) => {
      if (keys.includes(input.value)) {
        input.checked = checked;
      }
    });
    syncSelectedTopicsFromDom(container, mode);
    renderTestLayout(container);
    return true;
  }

  const topic = event.target.closest("[data-topic-checkbox], [data-live-topic-checkbox]");
  if (topic) {
    syncSelectedTopicsFromDom(container, topic.dataset.topicMode || "normal");
    renderTestLayout(container);
    return true;
  }

  return false;
}

async function handleQuestionFormSubmit(container, event) {
  const form = event.target.closest("[data-test-question-form]");
  if (!form) {
    return false;
  }

  event.preventDefault();

  try {
    const formData = new FormData(form);
    const question = createQuestion({
      question: String(formData.get("question") || "").trim(),
      options: [
        String(formData.get("option0") || "").trim(),
        String(formData.get("option1") || "").trim(),
        String(formData.get("option2") || "").trim(),
        String(formData.get("option3") || "").trim()
      ],
      correctAnswer: Number(formData.get("correctAnswer")),
      part: String(formData.get("part") || "especifica"),
      category: String(formData.get("category") || "bomberos"),
      moduleTitle: String(formData.get("moduleTitle") || "").trim(),
      temaNumero: String(formData.get("temaNumero") || "").trim(),
      temaTitulo: String(formData.get("temaTitulo") || "").trim(),
      explanation: String(formData.get("explanation") || "").trim(),
      createdBy: testSession.role
    });

    const serverQuestion = await saveQuestionToServer(question, testSession.role);
    if (!serverQuestion) {
      saveQuestion(question, testSession.role);
    }
    setMessage(
      serverQuestion
        ? "Pregunta guardada correctamente en el banco compartido."
        : "Pregunta guardada localmente. No se pudo sincronizar con el servidor.",
      serverQuestion ? "success" : "neutral"
    );
    form.reset();
    renderTestLayout(container);
  } catch (error) {
    setMessage(error.message || "No se pudo guardar la pregunta.", "error");
    renderTestLayout(container);
  }

  return true;
}

async function handleGenerateDummy(container) {
  try {
    const beforeIds = new Set(getQuestions().map((question) => question.id));
    const nextQuestions = generateDummyQuestions(testSession.role);
    const generatedQuestions = nextQuestions.filter((question) => !beforeIds.has(question.id));
    const syncedQuestions = await Promise.all(
      generatedQuestions.map((question) => saveQuestionToServer(question, testSession.role))
    );
    if (syncedQuestions.some(Boolean)) {
      await Promise.all([loadModulesFromServer(), loadQuestionsFromServer()]);
    }
    setMessage(
      syncedQuestions.some(Boolean)
        ? "Se han cargado 30 preguntas de prueba y se han sincronizado con el banco compartido."
        : "Se han cargado 30 preguntas de prueba en el banco local.",
      "success"
    );
    renderTestLayout(container);
  } catch (error) {
    setMessage(error.message || "No se pudieron generar preguntas de prueba.", "error");
    renderTestLayout(container);
  }
}

async function handleLiveSessionSubmit(container, event) {
  const form = event.target.closest("[data-live-session-form]");
  if (!form) {
    return false;
  }

  event.preventDefault();
  const formData = new FormData(form);
  const selectedTopicKeys = syncSelectedTopicsFromDom(container, "live");
  const questionCount = Number(formData.get("liveQuestionCount") || 25);
  const title = String(formData.get("liveTitle") || "Sesion en vivo Isocrona Zero").trim();

  try {
    const questions = generateNormalTest(
      {
        questions: getQuestions(),
        modules: getModules(),
        questionCount,
        selectedTopicKeys
      },
      testSession.role
    );

    const response = await fetch("/api/live-test-sessions", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        questionIds: questions.map((question) => question.id)
      })
    });
    const payload = await response.json();
    if (!response.ok || payload.ok === false) {
      throw new Error(payload.error || "No se pudo crear la sesion en vivo.");
    }
    testSession.liveSession = payload.session;
    setLiveMessage("Sesion en vivo creada. Comparte el codigo con los participantes.", "success");
  } catch (error) {
    setLiveMessage(error.message || "No se pudo crear la sesion en vivo.", "error");
  }

  renderTestLayout(container);
  return true;
}

async function hydrateTestData(container) {
  const token = ++testSession.hydrateToken;
  await Promise.all([loadModulesFromServer(), loadQuestionsFromServer(), loadResultsFromServer()]);
  if (token !== testSession.hydrateToken) {
    return;
  }
  testSession.hydrated = true;
  if (!testSession.selectedTopicKeys.size) {
    testSession.selectedTopicKeys = new Set(getAllTopicKeys());
  }
  if (!testSession.liveSelectedTopicKeys.size) {
    testSession.liveSelectedTopicKeys = new Set(getAllTopicKeys());
  }
  renderTestLayout(container);
}

export function renderTestView(container, role = "member") {
  stopTimer();
  testSession.role = role === "admin" ? "admin" : "member";
  testSession.activeTab = testSession.activeTab || "generator";
  testSession.mode = testSession.mode === "taking" ? "generator" : testSession.mode || "generator";
  loadQuestions();
  loadStoredModules();
  loadLocalResults();
  loadFailedQuestionIds();

  if (!testSession.selectedTopicKeys.size) {
    testSession.selectedTopicKeys = new Set(getAllTopicKeys());
  }
  if (!testSession.liveSelectedTopicKeys.size) {
    testSession.liveSelectedTopicKeys = new Set(getAllTopicKeys());
  }

  renderTestLayout(container);
  hydrateTestData(container);

  container.onclick = (event) => {
    const tab = event.target.closest("[data-test-tab]");
    if (tab) {
      testSession.activeTab = tab.dataset.testTab || "generator";
      if (testSession.activeTab !== "generator") {
        testSession.mode = "generator";
      }
      renderTestLayout(container);
      return;
    }

    if (handleAnswerClick(container, event)) {
      return;
    }

    if (event.target.closest("[data-test-prev]")) {
      moveQuestion(container, -1);
      return;
    }

    if (event.target.closest("[data-test-next]")) {
      moveQuestion(container, 1);
      return;
    }

    if (event.target.closest("[data-test-finish]")) {
      finishNormalTest(container);
      return;
    }

    if (event.target.closest("[data-test-new]")) {
      testSession.mode = "generator";
      testSession.result = null;
      renderTestLayout(container);
      return;
    }

    if (event.target.closest("[data-test-open-failed]")) {
      testSession.activeTab = "failed";
      testSession.mode = "generator";
      renderTestLayout(container);
      return;
    }

    if (event.target.closest("[data-test-open-history]")) {
      testSession.activeTab = "history";
      testSession.mode = "generator";
      renderTestLayout(container);
      return;
    }

    if (event.target.closest("[data-test-failed-start]")) {
      startFailedTest(container);
      return;
    }

    if (event.target.closest("[data-test-failed-review]")) {
      testSession.failedMode = testSession.failedMode === "review" ? "summary" : "review";
      renderTestLayout(container);
      return;
    }

    if (event.target.closest("[data-test-failed-clear]")) {
      removeFailedQuestionIds(Array.from(testSession.failedQuestionIds));
      renderTestLayout(container);
      return;
    }

    if (event.target.closest("[data-test-generate-dummy]")) {
      handleGenerateDummy(container);
    }
  };

  container.onchange = (event) => {
    handleTopicChange(container, event);
  };

  container.onsubmit = async (event) => {
    if (event.target.closest("[data-normal-test-form]")) {
      event.preventDefault();
      startNormalTest(container);
      return;
    }

    if (await handleLiveSessionSubmit(container, event)) {
      return;
    }

    await handleQuestionFormSubmit(container, event);
  };
}

export default renderTestView;
