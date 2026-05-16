import {
  createLiveSession,
  createQuestion,
  getQuestionFilters,
  getStoredQuestions,
  loadLiveSessions,
  loadReviewMarks,
  loadSharedQuestions,
  loadTestHistory,
  markQuestionForReview,
  markQuestionReviewed,
  saveQuestion,
  unmarkQuestionForReview
} from "../modules/tests/questionService.js";
import { evaluateTest, generateTest, saveTestResult } from "../modules/tests/testService.js";
import { getTestState } from "../modules/tests/testStore.js";

const testSession = {
  role: "member",
  loading: false,
  activeRun: null,
  latestResult: null,
  loadedRole: "",
  filters: {
    part: "all",
    category: "all",
    difficulty: "all",
    questionCount: 20
  }
};

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatDate(value) {
  if (!value) {
    return "";
  }
  try {
    return new Date(value).toLocaleString("es-ES", {
      dateStyle: "medium",
      timeStyle: "short"
    });
  } catch (error) {
    return String(value);
  }
}

function buildRunTitle(filters = {}, mode = "general") {
  const parts = [];
  if (mode === "failed") {
    parts.push("Repaso de falladas");
  } else {
    parts.push("Test de entrenamiento");
  }
  if (filters.part && filters.part !== "all") {
    parts.push(filters.part);
  }
  if (filters.category && filters.category !== "all") {
    parts.push(filters.category);
  }
  return parts.join(" · ");
}

function getCurrentQuestionMap() {
  return new Map((getStoredQuestions() || []).map((question) => [String(question.id || "").trim(), question]));
}

function getFailedQuestions() {
  const store = getTestState();
  const questionMap = getCurrentQuestionMap();
  return (store.failedQuestionIds || []).map((questionId) => questionMap.get(questionId)).filter(Boolean);
}

function getManualReviewQuestionIds() {
  const store = getTestState();
  return new Set(
    (store.reviewMarks || [])
      .filter((mark) => String(mark.status || "").trim() === "review" && String(mark.source || "").trim() === "manual")
      .map((mark) => String(mark.questionId || "").trim())
      .filter(Boolean)
  );
}

function isQuestionAvailableForReview(question = {}) {
  if (Object.prototype.hasOwnProperty.call(question, "active") && question.active === false) {
    return false;
  }
  if (Object.prototype.hasOwnProperty.call(question, "published") && question.published === false) {
    return false;
  }
  return true;
}

function getReviewMarkedQuestions() {
  const questionMap = getCurrentQuestionMap();
  return [...getManualReviewQuestionIds()]
    .map((questionId) => questionMap.get(questionId))
    .filter((question) => question && isQuestionAvailableForReview(question));
}

function setActiveRun(run) {
  testSession.activeRun = run
    ? {
        ...run,
        answers: Array.isArray(run.answers) ? [...run.answers] : Array.from({ length: run.questions.length }, () => null)
      }
    : null;
}

function captureActiveAnswers(form) {
  const run = testSession.activeRun;
  if (!run || !(form instanceof HTMLFormElement)) {
    return;
  }
  const formData = new FormData(form);
  run.answers = run.questions.map((question, index) => {
    const value = formData.get(`question-${index}`);
    return value === null ? null : Number(value);
  });
}

function buildQuestionMapMarkup(run, markedQuestionIds) {
  if (!run?.questions?.length) {
    return "";
  }
  return `
    <div class="test-zone-question-map" aria-label="Parrilla de preguntas">
      ${run.questions
        .map((question, index) => {
          const questionId = String(question.id || "").trim();
          const marked = markedQuestionIds.has(questionId);
          return `
            <button
              type="button"
              class="test-zone-question-map-button ${marked ? "is-marked" : ""}"
              data-action="jump-test-question"
              data-question-index="${index}"
              aria-label="${escapeHtml(`Ir a pregunta ${index + 1}${marked ? " marcada para repasar" : ""}`)}"
            >
              ${index + 1}
            </button>
          `;
        })
        .join("")}
    </div>
  `;
}

function normalizeResultSource(result = {}) {
  const source = String(result.source || result.filters?.source || "").trim();
  if (source === "reviewMarks") {
    return "reviewMarks";
  }
  if (source === "failed" || String(result.mode || "").trim() === "failed") {
    return "failed";
  }
  return "bank";
}

function buildSourceBreakdown(results = []) {
  const rows = {
    bank: { label: "Test normal", tests: 0, questions: 0, correct: 0, percentageSum: 0 },
    failed: { label: "Preguntas falladas", tests: 0, questions: 0, correct: 0, percentageSum: 0 },
    reviewMarks: { label: "Marcadas para repasar", tests: 0, questions: 0, correct: 0, percentageSum: 0 }
  };

  (Array.isArray(results) ? results : []).forEach((result) => {
    const row = rows[normalizeResultSource(result)] || rows.bank;
    row.tests += 1;
    row.questions += Number(result.total || 0);
    row.correct += Number(result.correctCount || 0);
    row.percentageSum += Number(result.percentage || 0);
  });

  return Object.values(rows).map((row) => ({
    ...row,
    averagePercentage: row.tests ? row.percentageSum / row.tests : 0
  }));
}

function getLatestProgressActivity(results = [], reviewMarks = []) {
  const timestamps = [
    ...(Array.isArray(results) ? results : []).map((result) => result.createdAt),
    ...(Array.isArray(reviewMarks) ? reviewMarks : []).map((mark) => mark.updatedAt || mark.createdAt)
  ]
    .map((value) => Date.parse(String(value || "")))
    .filter((value) => Number.isFinite(value));
  if (!timestamps.length) {
    return "Sin actividad";
  }
  return formatDate(new Date(Math.max(...timestamps)).toISOString());
}

function buildProgressStatsPanel() {
  const { results, failedQuestionIds, reviewMarks } = getTestState();
  const ownResults = (Array.isArray(results) ? results : []).filter((result) => !String(result.liveCode || "").trim());
  const totalTests = ownResults.length;
  const answeredQuestions = ownResults.reduce((total, result) => total + Number(result.answeredCount || 0), 0);
  const averagePercentage = totalTests
    ? ownResults.reduce((total, result) => total + Number(result.percentage || 0), 0) / totalTests
    : 0;
  const reviewMarkedQuestions = getReviewMarkedQuestions();
  const sourceBreakdown = buildSourceBreakdown(ownResults);
  const metrics = [
    { label: "Tests realizados", value: totalTests, hint: "Tests guardados" },
    { label: "% medio acierto", value: `${Number(averagePercentage || 0).toFixed(1)}%`, hint: "Media de tus tests" },
    { label: "Preguntas respondidas", value: answeredQuestions, hint: "Sin contar blancas" },
    { label: "Preguntas falladas", value: (failedQuestionIds || []).length, hint: "Pendientes" },
    { label: "Marcadas para repasar", value: reviewMarkedQuestions.length, hint: "Guardadas por ti" },
    {
      label: "Ultima actividad",
      value: getLatestProgressActivity(ownResults, reviewMarks),
      hint: "Test o marca reciente",
      compact: true
    }
  ];
  return `
    <section class="test-zone-card test-zone-progress-panel">
      <div class="test-zone-card-head">
        <div>
          <p class="test-zone-kicker">Progreso personal</p>
          <h3>Tu avance</h3>
          <p class="muted">Un vistazo rapido a tus tests y repasos.</p>
        </div>
      </div>
      <div class="test-zone-metrics">
        ${metrics
          .map(
            (metric) => `
              <article class="test-zone-metric-card">
                <p class="test-zone-kicker">${escapeHtml(metric.label)}</p>
                <strong class="${metric.compact ? "test-zone-metric-compact" : ""}">${escapeHtml(metric.value)}</strong>
                <span>${escapeHtml(metric.hint)}</span>
              </article>
            `
          )
          .join("")}
      </div>
      ${
        totalTests
          ? `<div class="test-zone-source-breakdown" aria-label="Desglose por tipo de test">
              ${sourceBreakdown
                .map(
                  (row) => `
                    <article class="test-zone-source-row">
                      <strong>${escapeHtml(row.label)}</strong>
                      <span>${escapeHtml(`${row.tests} tests`)}</span>
                      <span>${escapeHtml(`${row.questions} preguntas`)}</span>
                      <span>${escapeHtml(`${Number(row.averagePercentage || 0).toFixed(1)}% medio`)}</span>
                    </article>
                  `
                )
                .join("")}
            </div>`
          : '<div class="test-zone-empty test-zone-empty-compact">Todavia no has hecho ningun test.</div>'
      }
    </section>
  `;
}

function buildFilterSelect(name, value, options) {
  return `
    <label class="test-zone-field">
      <span>${escapeHtml(name === "part" ? "Parte" : name === "category" ? "Bloque" : "Dificultad")}</span>
      <select name="${escapeHtml(name)}">
        <option value="all">Todas</option>
        ${options
          .map(
            (option) => `
              <option value="${escapeHtml(option)}" ${String(value || "") === String(option) ? "selected" : ""}>${escapeHtml(option)}</option>
            `
          )
          .join("")}
      </select>
    </label>
  `;
}

function buildEmptyStateMarkup(role) {
  const adminGuidance = role === "admin"
    ? `<p class="muted">Importa un banco de preguntas desde administración para activar esta zona.</p>`
    : "";
  return `
    <section class="test-zone-card">
      <div class="test-zone-card-head">
        <div>
          <p class="test-zone-kicker">Estado vacío</p>
          <h3>No hay preguntas cargadas todavía.</h3>
          <p class="muted">Cuando el administrador importe un banco de preguntas, podrás practicar desde aquí.</p>
          ${adminGuidance}
        </div>
      </div>
    </section>
  `;
}

function buildControlsMarkup() {
  const { parts, categories, difficulties } = getQuestionFilters(getStoredQuestions());
  return `
    <section class="test-zone-card">
      <div class="test-zone-card-head">
        <div>
          <p class="test-zone-kicker">Crear test normal</p>
          <h3>Nuevo test</h3>
          <p class="muted">Elige filtros, numero de preguntas y empieza.</p>
        </div>
        <div class="test-zone-inline-summary">
          <span>${escapeHtml(`${getStoredQuestions().length} preguntas disponibles`)}</span>
        </div>
      </div>
      <form class="test-zone-controls" data-test-zone-controls>
        ${buildFilterSelect("part", testSession.filters.part, parts)}
        ${buildFilterSelect("category", testSession.filters.category, categories)}
        ${buildFilterSelect("difficulty", testSession.filters.difficulty, difficulties)}
        <label class="test-zone-field">
          <span>Numero de preguntas</span>
          <input type="number" name="questionCount" min="1" max="100" value="${escapeHtml(testSession.filters.questionCount)}" />
        </label>
        <div class="test-zone-actions">
          <button type="submit" class="test-zone-primary-button">Crear test normal</button>
        </div>
      </form>
    </section>
  `;
}

function buildQuestionAttemptMarkup() {
  const run = testSession.activeRun;
  if (!run) {
    return "";
  }
  const markedQuestionIds = getManualReviewQuestionIds();
  const runModeLabel = run.source === "reviewMarks" ? "marcadas para repasar" : run.mode === "failed" ? "preguntas falladas" : "test normal";
  const reviewMarkToggleDisabled = run.source === "reviewMarks";
  return `
    <section class="test-zone-card">
      <div class="test-zone-card-head">
        <div>
          <p class="test-zone-kicker">Test activo</p>
          <h3>${escapeHtml(run.title)}</h3>
          ${run.source === "reviewMarks" ? `<p class="muted">${escapeHtml(runModeLabel)}</p>` : ""}
          <p class="muted">${escapeHtml(`${run.questions.length} preguntas · ${runModeLabel}`)}</p>
        </div>
        <div class="test-zone-actions">
          <button type="button" class="test-zone-secondary-button" data-action="cancel-active-test">Cancelar</button>
        </div>
      </div>
      ${buildQuestionMapMarkup(run, markedQuestionIds)}
      <form data-test-zone-attempt>
        <div class="test-zone-question-list">
          ${run.questions
            .map((question, index) => {
              const questionId = String(question.id || "").trim();
              const marked = markedQuestionIds.has(questionId);
              return `
                <article class="test-zone-question-card" id="test-zone-question-card-${index}">
                  <div class="test-zone-question-head">
                    <div>
                      <p class="test-zone-question-index">Pregunta ${index + 1}</p>
                      <h4>${escapeHtml(question.prompt)}</h4>
                    </div>
                    <div class="test-zone-tag-row">
                      <span class="test-zone-tag">${escapeHtml(question.part || "Parte común")}</span>
                      <span class="test-zone-tag">${escapeHtml(question.category || "Legislación")}</span>
                      <span class="test-zone-tag">${escapeHtml(question.difficulty || "media")}</span>
                    </div>
                    <button
                      type="button"
                      class="test-zone-secondary-button test-zone-review-toggle ${marked ? "is-active" : ""}"
                      data-action="toggle-review-mark"
                      data-question-id="${escapeHtml(questionId)}"
                      aria-label="${escapeHtml(reviewMarkToggleDisabled ? `Marca de repaso bloqueada durante el test de la pregunta ${index + 1}` : marked ? `Quitar marca de repaso de la pregunta[...]
                      aria-pressed="${marked ? "true" : "false"}"
                      ${reviewMarkToggleDisabled ? "disabled" : ""}
                    >
                      ${marked ? "Marcada para repasar" : "Marcar para repasar"}
                    </button>
                  </div>
                  <div class="test-zone-option-list">
                    ${(Array.isArray(question.options) ? question.options : [])
                      .map(
                        (option, optionIndex) => `
                          <label class="test-zone-option-row">
                            <input
                              type="radio"
                              name="question-${index}"
                              value="${optionIndex}"
                              data-test-zone-answer
                              data-question-index="${index}"
                              ${run.answers?.[index] !== null && run.answers?.[index] !== undefined && Number(run.answers?.[index]) === optionIndex ? "checked" : ""}
                            />
                            <span class="test-zone-option-badge">${String.fromCharCode(65 + optionIndex)}</span>
                            <span class="test-zone-option-copy">${escapeHtml(option)}</span>
                          </label>
                        `
                      )
                      .join("")}
                  </div>
                </article>
              `;
            })
            .join("")}
        </div>
        <div class="test-zone-footer-actions">
          <button type="submit" class="test-zone-primary-button">Finalizar test</button>
        </div>
      </form>
    </section>
  `;
}

function getReviewStatus(response = {}) {
  if (response.isBlank) {
    return { className: "is-blank", label: "En blanco" };
  }
  if (response.isCorrect) {
    return { className: "is-correct", label: "Correcta" };
  }
  return { className: "is-wrong", label: "Incorrecta" };
}

function formatAnswerOption(index, text) {
  if (index === null || index === undefined || index === "") {
    return String(text || "").trim() || "No disponible";
  }
  const normalizedIndex = Number(index);
  const prefix = Number.isInteger(normalizedIndex) && normalizedIndex >= 0
    ? `${String.fromCharCode(65 + normalizedIndex)}) `
    : "";
  const normalizedText = String(text || "").trim();
  if (normalizedText) {
    return `${prefix}${normalizedText}`;
  }
  return prefix ? `Opcion ${String.fromCharCode(65 + normalizedIndex)}` : "No disponible";
}

function formatSelectedReviewAnswer(response = {}) {
  if (response.isBlank || response.selectedIndex === null || response.selectedIndex === undefined) {
    return "Sin respuesta";
  }
  return formatAnswerOption(response.selectedIndex, response.selectedAnswer);
}

function formatCorrectReviewAnswer(response = {}) {
  return formatAnswerOption(response.correctIndex, response.correctAnswer);
}

function buildReviewMetaTags(response = {}) {
  const temaNumero = String(response.temaNumero || "").trim();
  const temaTitulo = String(response.temaTitulo || "").trim();
  const topicLabel =
    temaNumero || temaTitulo
      ? `${temaNumero ? `Tema ${temaNumero}` : "Tema"}${temaTitulo ? ` - ${temaTitulo}` : ""}`
      : String(response.topic || response.moduleTitle || "").trim();
  return [response.part, response.category, topicLabel, response.difficulty]
    .map((item) => String(item || "").trim())
    .filter(Boolean)
    .map((item) => `<span class="test-zone-tag">${escapeHtml(item)}</span>`)
    .join("");
}

function buildResultReviewMarkup(result = {}) {
  const responses = Array.isArray(result.responses) ? result.responses : [];
  if (!responses.length) {
    return "";
  }
  const markedQuestionIds = getManualReviewQuestionIds();
  return `
    <div class="test-zone-result-review">
      <div class="test-zone-card-head">
        <div>
          <p class="test-zone-kicker">Revision detallada</p>
          <h4>Preguntas revisadas</h4>
          <p class="muted">Las soluciones se muestran solo despues de finalizar el intento.</p>
        </div>
      </div>
      <div class="test-zone-review-map" aria-label="Navegacion de revision">
        ${responses
          .map((response, index) => {
            const status = getReviewStatus(response);
            return `
              <button
                type="button"
                class="test-zone-review-map-button ${status.className}"
                data-action="jump-result-review-question"
                data-review-index="${index}"
                aria-label="${escapeHtml(`Ir a revision de pregunta ${index + 1}: ${status.label}`)}"
              >
                ${index + 1}
              </button>
            `;
          })
          .join("")}
      </div>
      <div class="test-zone-review-list">
        ${responses
          .map((response, index) => {
            const questionId = String(response.questionId || "").trim();
            const marked = markedQuestionIds.has(questionId);
            const status = getReviewStatus(response);
            return `
              <article class="test-zone-review-card ${status.className}" id="test-zone-review-card-${index}">
                <div class="test-zone-question-head">
                  <div>
                    <p class="test-zone-question-index">Pregunta ${index + 1}</p>
                    <h4>${escapeHtml(response.prompt || "Pregunta sin enunciado")}</h4>
                  </div>
                  <span class="test-zone-review-status">${escapeHtml(status.label)}</span>
                </div>
                <div class="test-zone-tag-row">${buildReviewMetaTags(response)}</div>
                <div class="test-zone-review-answer-grid">
                  <div class="test-zone-review-answer ${response.isBlank ? "is-blank" : response.isCorrect ? "is-correct" : "is-wrong"}">
                    <span>Tu respuesta</span>
                    <strong>${escapeHtml(formatSelectedReviewAnswer(response))}</strong>
                  </div>
                  <div class="test-zone-review-answer is-correct">
                    <span>Respuesta correcta</span>
                    <strong>${escapeHtml(formatCorrectReviewAnswer(response))}</strong>
                  </div>
                </div>
                ${
                  String(response.explanation || "").trim()
                    ? `<div class="test-zone-review-explanation"><strong>Explicacion</strong><p>${escapeHtml(response.explanation)}</p></div>`
                    : ""
                }
                <div class="test-zone-actions">
                  <button
                    type="button"
                    class="test-zone-secondary-button test-zone-review-toggle ${marked ? "is-active" : ""}"
                    data-action="toggle-review-mark"
                    data-question-id="${escapeHtml(questionId)}"
                    aria-label="${escapeHtml(marked ? `Quitar marca de repaso de la pregunta ${index + 1}` : `Marcar pregunta ${index + 1} para repasar`)}"
                    aria-pressed="${marked ? "true" : "false"}"
                    ${questionId ? "" : "disabled"}
                  >
                    ${marked ? "Marcada para repasar" : "Marcar para repasar"}
                  </button>
                </div>
              </article>
            `;
          })
          .join("")}
      </div>
    </div>
  `;
}

function buildLatestResultMarkup() {
  const result = testSession.latestResult;
  if (!result) {
    return "";
  }
  return `
    <section class="test-zone-card test-zone-card-highlight">
      <p class="test-zone-kicker">Último resultado</p>
      <h3>${escapeHtml(result.title || "Test finalizado")}</h3>
      <p class="test-zone-result-line">
        Aciertos: ${escapeHtml(result.correctCount)} · Fallos: ${escapeHtml(result.wrongCount)} · Blancas: ${escapeHtml(result.blankCount)} · Nota: ${escapeHtml(result.score)}/${escapeHtml(res[...]
      </p>
      <p class="muted">${escapeHtml(formatDate(result.createdAt))}</p>
      ${buildResultReviewMarkup(result)}
    </section>
  `;
}

function buildFailedQuestionsMarkup() {
  const failedQuestions = getFailedQuestions();
  return `
    <section class="test-zone-card">
      <div class="test-zone-card-head">
        <div>
          <p class="test-zone-kicker">Preguntas falladas</p>
          <h3>Preguntas falladas</h3>
          <p class="muted">Practica solo las preguntas que has fallado.</p>
        </div>
        <div class="test-zone-actions">
          <button type="button" class="test-zone-secondary-button" data-action="start-failed-test" ${failedQuestions.length ? "" : "disabled"}>Hacer test con falladas</button>
        </div>
      </div>
      ${
        failedQuestions.length
          ? `<div class="test-zone-failed-list">
              ${failedQuestions
                .slice(0, 12)
                .map(
                  (question) => `
                    <article class="test-zone-mini-card">
                      <strong>${escapeHtml(question.prompt)}</strong>
                      <p class="muted">${escapeHtml(`${question.part} · ${question.category} · ${question.difficulty}`)}</p>
                      <div class="test-zone-actions">
                        <button type="button" class="test-zone-secondary-button" data-action="mark-reviewed" data-question-id="${escapeHtml(question.id)}">Marcar repasada</button>
                      </div>
                    </article>
                  `
                )
                .join("")}
            </div>`
          : '<div class="test-zone-empty">No tienes preguntas falladas pendientes.</div>'
      }
    </section>
  `;
}

function buildReviewMarkedQuestionsMarkup() {
  const reviewMarkedQuestions = getReviewMarkedQuestions();
  return `
    <section class="test-zone-card">
      <div class="test-zone-card-head">
        <div>
          <p class="test-zone-kicker">Marcadas para repasar</p>
          <h3>Marcadas para repasar</h3>
          <p class="muted">Agrupa las preguntas que quieres volver a mirar.</p>
        </div>
        <div class="test-zone-actions">
          <button type="button" class="test-zone-secondary-button" data-action="start-review-marked-test" ${reviewMarkedQuestions.length ? "" : "disabled"}>
            Hacer test con marcadas (${escapeHtml(reviewMarkedQuestions.length)})
          </button>
        </div>
      </div>
      ${
        reviewMarkedQuestions.length
          ? `<div class="test-zone-failed-list">
              ${reviewMarkedQuestions
                .slice(0, 12)
                .map(
                  (question) => `
                    <article class="test-zone-mini-card">
                      <strong>${escapeHtml(question.prompt)}</strong>
                      <p class="muted">${escapeHtml(`${question.part} - ${question.category} - ${question.difficulty}`)}</p>
                    </article>
                  `
                )
                .join("")}
            </div>`
          : '<div class="test-zone-empty">No tienes preguntas marcadas para repasar.</div>'
      }
    </section>
  `;
}

function buildHistoryMarkup() {
  const { results, stats } = getTestState();
  return `
    <section class="test-zone-card">
      <div class="test-zone-card-head">
        <div>
          <p class="test-zone-kicker">Historial</p>
          <h3>Historial</h3>
          <p class="muted">Tus ultimos tests guardados.</p>
        </div>
      </div>
      <div class="test-zone-evolution-list">
        ${
          (stats.evolution || []).length
            ? stats.evolution
                .slice(-8)
                .map(
                  (point) => `
                    <div class="test-zone-evolution-item">
                      <strong>${escapeHtml(point.date)}</strong>
                      <span>${escapeHtml(`${Number(point.percentage || 0).toFixed(1)}%`)}</span>
                    </div>
                  `
                )
                .join("")
            : '<span class="muted">Todavia no has hecho ningun test.</span>'
        }
      </div>
      ${
        results.length
          ? `<div class="test-zone-history-list">
              ${results
                .map(
                  (result) => `
                    <article class="test-zone-history-item">
                      <div>
                        <strong>${escapeHtml(result.title || "Test")}</strong>
                        <p class="muted">${escapeHtml(formatDate(result.createdAt))}</p>
                        <p class="muted">${escapeHtml(`Aciertos ${result.correctCount} · Fallos ${result.wrongCount} · Blancas ${result.blankCount}`)}</p>
                      </div>
                      <div class="test-zone-history-side">
                        <strong>${escapeHtml(`${result.score}/${result.total}`)}</strong>
                        <span>${escapeHtml(`${Number(result.percentage || 0).toFixed(1)}%`)}</span>
                        <button type="button" class="test-zone-secondary-button" data-action="repeat-result-failed" data-result-id="${escapeHtml(result.id)}" ${result.incorrectQuestionIds?.length[...]
                          Repetir falladas
                        </button>
                      </div>
                    </article>
                  `
                )
                .join("")}
            </div>`
          : '<div class="test-zone-empty">Todavia no has hecho ningun test.</div>'
      }
    </section>
  `;
}

function buildAdminQuestionForm() {
  if (testSession.role !== "admin") {
    return "";
  }
  const liveSessions = getTestState().liveSessions || [];
  return `
    <section class="test-zone-card">
      <div class="test-zone-card-head">
        <div>
          <p class="test-zone-kicker">Administración</p>
          <h3>Banco y test en vivo</h3>
          <p class="muted">Mantén el banco compartido y abre sesiones de test en vivo con código para externos.</p>
        </div>
      </div>
      <form class="test-zone-admin-form" data-test-zone-question-form>
        <label class="test-zone-field test-zone-field-full">
          <span>Pregunta</span>
          <textarea name="prompt" rows="3" required></textarea>
        </label>
        <label class="test-zone-field"><span>Opción A</span><input type="text" name="option0" required /></label>
        <label class="test-zone-field"><span>Opción B</span><input type="text" name="option1" required /></label>
        <label class="test-zone-field"><span>Opción C</span><input type="text" name="option2" required /></label>
        <label class="test-zone-field"><span>Opción D</span><input type="text" name="option3" required /></label>
        <label class="test-zone-field">
          <span>Correcta</span>
          <select name="correctIndex">
            <option value="0">A</option>
            <option value="1">B</option>
            <option value="2">C</option>
            <option value="3">D</option>
          </select>
        </label>
        <label class="test-zone-field">
          <span>Parte</span>
          <select name="part">
            <option value="Parte común">Parte común</option>
            <option value="Parte específica">Parte específica</option>
          </select>
        </label>
        <label class="test-zone-field">
          <span>Bloque</span>
          <select name="category">
            <option value="Legislación">Legislación</option>
            <option value="Bomberos">Bomberos</option>
          </select>
        </label>
        <label class="test-zone-field">
          <span>Dificultad</span>
          <select name="difficulty">
            <option value="baja">baja</option>
            <option value="media" selected>media</option>
            <option value="alta">alta</option>
          </select>
        </label>
        <div class="test-zone-actions test-zone-field-full">
          <button type="submit" class="test-zone-primary-button">Guardar pregunta</button>
        </div>
      </form>
      <form class="test-zone-live-form" data-test-zone-live-form>
        <label class="test-zone-field test-zone-field-full">
          <span>Título del test en vivo</span>
          <input type="text" name="title" placeholder="Ej. Simulacro abierto de legislación" />
        </label>
        <label class="test-zone-field">
          <span>Parte</span>
          <select name="part">
            <option value="all">Todas</option>
            <option value="Parte común">Parte común</option>
            <option value="Parte específica">Parte específica</option>
          </select>
        </label>
        <label class="test-zone-field">
          <span>Bloque</span>
          <select name="category">
            <option value="all">Todos</option>
            <option value="Legislación">Legislación</option>
            <option value="Bomberos">Bomberos</option>
          </select>
        </label>
        <label class="test-zone-field">
          <span>Dificultad</span>
          <select name="difficulty">
            <option value="all">Todas</option>
            <option value="baja">baja</option>
            <option value="media">media</option>
            <option value="alta">alta</option>
          </select>
        </label>
        <label class="test-zone-field">
          <span>Preguntas</span>
          <input type="number" name="questionCount" min="1" max="100" value="20" />
        </label>
        <div class="test-zone-actions test-zone-field-full">
          <button type="submit" class="test-zone-secondary-button">Abrir test en vivo</button>
        </div>
      </form>
      <div class="test-zone-live-list">
        ${
          liveSessions.length
            ? liveSessions
                .slice(0, 6)
                .map(
                  (session) => `
                    <article class="test-zone-mini-card">
                      <strong>${escapeHtml(session.title || "Test en vivo")}</strong>
                      <p class="muted">Código ${escapeHtml(session.code)} · ${escapeHtml(`${session.questionCount} preguntas`)}</p>
                      <p class="muted">${escapeHtml(formatDate(session.createdAt))}</p>
                    </article>
                  `
                )
                .join("")
            : '<div class="test-zone-empty">Todavía no hay tests en vivo creados.</div>'
        }
      </div>
    </section>
  `;
}

function buildLayout() {
  const hasQuestions = getStoredQuestions().length > 0;
  
  return `
    <section class="test-zone-view">
      <header class="test-zone-hero">
        <div>
          <p class="test-zone-kicker">Zona Test</p>
          <h2>Tests rapidos para socios</h2>
          <p class="muted">Crea un test, revisa fallos y guarda preguntas para repasar.</p>
        </div>
      </header>
      ${hasQuestions ? buildProgressStatsPanel() : buildEmptyStateMarkup(testSession.role)}
      ${hasQuestions ? buildControlsMarkup() : ""}
      ${buildQuestionAttemptMarkup()}
      ${buildLatestResultMarkup()}
      ${hasQuestions ? buildFailedQuestionsMarkup() : ""}
      ${hasQuestions ? buildReviewMarkedQuestionsMarkup() : ""}
      ${hasQuestions ? buildHistoryMarkup() : ""}
      ${buildAdminQuestionForm()}
    </section>
  `;
}

async function refreshData(role) {
  testSession.loading = true;
  try {
    await loadSharedQuestions();
    await loadTestHistory();
    await loadReviewMarks();
    if (role === "admin") {
      await loadLiveSessions();
    }
  } finally {
    testSession.loading = false;
  }
}

async function startGeneratedTest(failedOnly = false) {
  const store = getTestState();
  const onlyQuestionIds = failedOnly ? store.failedQuestionIds || [] : [];
  setActiveRun(
    generateTest(
      {
        questions: store.questions || [],
        numQuestions: testSession.filters.questionCount,
        filters: {
          part: testSession.filters.part,
          category: testSession.filters.category,
          difficulty: testSession.filters.difficulty
        },
        onlyQuestionIds,
        title: buildRunTitle(testSession.filters, failedOnly ? "failed" : "general"),
        mode: failedOnly ? "failed" : "general"
      },
      testSession.role
    )
  );
  testSession.latestResult = null;
}

async function startReviewMarkedTest() {
  const store = getTestState();
  const markedQuestions = getReviewMarkedQuestions();
  if (!markedQuestions.length) {
    throw new Error("No tienes preguntas marcadas para repasar.");
  }
  setActiveRun(
    generateTest(
      {
        questions: store.questions || [],
        numQuestions: testSession.filters.questionCount,
        filters: {
          part: "all",
          category: "all",
          difficulty: "all"
        },
        onlyQuestionIds: markedQuestions.map((question) => question.id),
        title: "Marcadas para repasar",
        mode: "failed",
        source: "reviewMarks"
      },
      testSession.role
    )
  );
  testSession.latestResult = null;
}

async function handleAttemptSubmit(container, form) {
  const run = testSession.activeRun;
  if (!run) {
    return;
  }
  captureActiveAnswers(form);
  const answers = Array.isArray(run.answers) ? run.answers : [];
  const evaluated = evaluateTest(run, answers, testSession.role);
  const savedResult = await saveTestResult(evaluated);
  setActiveRun(null);
  const historyPayload = await loadTestHistory();
  const detailedResult = (historyPayload.results || []).find(
    (result) => String(result.id || "") === String(savedResult?.id || "")
  );
  testSession.latestResult = detailedResult || savedResult;
  renderTestView(container, testSession.role);
}

async function handleQuestionFormSubmit(container, form) {
  const formData = new FormData(form);
  const question = createQuestion({
    prompt: String(formData.get("prompt") || "").trim(),
    options: [
      String(formData.get("option0") || "").trim(),
      String(formData.get("option1") || "").trim(),
      String(formData.get("option2") || "").trim(),
      String(formData.get("option3") || "").trim()
    ],
    correctIndex: Number(formData.get("correctIndex")),
    part: String(formData.get("part") || "").trim(),
    category: String(formData.get("category") || "").trim(),
    difficulty: String(formData.get("difficulty") || "").trim()
  });
  await saveQuestion(question);
  form.reset();
  await refreshData(testSession.role);
  renderTestView(container, testSession.role);
}

async function handleLiveFormSubmit(container, form) {
  const formData = new FormData(form);
  await createLiveSession({
    title: String(formData.get("title") || "").trim(),
    questionCount: Number(formData.get("questionCount") || 20),
    filters: {
      part: String(formData.get("part") || "").trim(),
      category: String(formData.get("category") || "").trim(),
      difficulty: String(formData.get("difficulty") || "").trim()
    }
  });
  form.reset();
  await refreshData(testSession.role);
  renderTestView(container, testSession.role);
}

function bindActions(container) {
  container.onclick = async (event) => {
    const actionTarget = event.target.closest("[data-action]");
    if (!actionTarget) {
      return;
    }

    const action = String(actionTarget.dataset.action || "").trim();
    if (action === "cancel-active-test") {
      setActiveRun(null);
      renderTestView(container, testSession.role);
      return;
    }
    if (action === "start-failed-test") {
      try {
        await startGeneratedTest(true);
      } catch (error) {
        testSession.latestResult = null;
        container.querySelector(".test-zone-view")?.insertAdjacentHTML(
          "afterbegin",
          `<div class="test-zone-inline-error">${escapeHtml(error.message || "No se pudo generar el repaso de falladas.")}</div>`
        );
      }
      renderTestView(container, testSession.role);
      return;
    }
    if (action === "start-review-marked-test") {
      try {
        await startReviewMarkedTest();
      } catch (error) {
        testSession.latestResult = null;
        container.querySelector(".test-zone-view")?.insertAdjacentHTML(
          "afterbegin",
          `<div class="test-zone-inline-error">${escapeHtml(error.message || "No se pudo crear el test con marcadas.")}</div>`
        );
      }
      renderTestView(container, testSession.role);
      return;
    }
    if (action === "mark-reviewed") {
      await markQuestionReviewed(actionTarget.dataset.questionId || "");
      await refreshData(testSession.role);
      renderTestView(container, testSession.role);
      return;
    }
    if (action === "toggle-review-mark") {
      if (testSession.activeRun?.source === "reviewMarks") {
        return;
      }
      const questionId = String(actionTarget.dataset.questionId || "").trim();
      captureActiveAnswers(container.querySelector("[data-test-zone-attempt]"));
      if (getManualReviewQuestionIds().has(questionId)) {
        await unmarkQuestionForReview(questionId);
      } else {
        await markQuestionForReview(questionId);
      }
      renderTestView(container, testSession.role);
      return;
    }
    if (action === "jump-test-question") {
      const index = Number(actionTarget.dataset.questionIndex || 0);
      container.querySelector(`#test-zone-question-card-${index}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    if (action === "jump-result-review-question") {
      const index = Number(actionTarget.dataset.reviewIndex || 0);
      container.querySelector(`#test-zone-review-card-${index}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    if (action === "repeat-result-failed") {
      const result = (getTestState().results || []).find((entry) => String(entry.id || "") === String(actionTarget.dataset.resultId || ""));
      if (result?.incorrectQuestionIds?.length) {
        testSession.activeRun = generateTest(
          {
            questions: getTestState().questions || [],
            numQuestions: result.incorrectQuestionIds.length,
            filters: {
              part: testSession.filters.part,
              category: testSession.filters.category,
              difficulty: testSession.filters.difficulty
            },
            onlyQuestionIds: result.incorrectQuestionIds,
            title: "Repetición de falladas",
            mode: "failed"
          },
          testSession.role
        );
        testSession.latestResult = null;
        renderTestView(container, testSession.role);
      }
    }
  };

  container.onchange = (event) => {
    const target = event.target;
    if (!(target instanceof HTMLInputElement) || !target.matches("[data-test-zone-answer]")) {
      return;
    }
    const run = testSession.activeRun;
    const index = Number(target.dataset.questionIndex || -1);
    if (!run || !Number.isInteger(index) || index < 0) {
      return;
    }
    run.answers = Array.isArray(run.answers) ? run.answers : Array.from({ length: run.questions.length }, () => null);
    run.answers[index] = Number(target.value);
  };

  container.onsubmit = async (event) => {
    const target = event.target;
    if (!(target instanceof HTMLFormElement)) {
      return;
    }
    event.preventDefault();

    if (target.hasAttribute("data-test-zone-controls")) {
      const formData = new FormData(target);
      testSession.filters = {
        part: String(formData.get("part") || "all").trim() || "all",
        category: String(formData.get("category") || "all").trim() || "all",
        difficulty: String(formData.get("difficulty") || "all").trim() || "all",
        questionCount: Math.max(Number(formData.get("questionCount") || 20), 1)
      };
      try {
        await startGeneratedTest(false);
      } catch (error) {
        setActiveRun(null);
        testSession.latestResult = {
          title: "No se pudo iniciar el test",
          correctCount: 0,
          wrongCount: 0,
          blankCount: 0,
          score: 0,
          total: 0,
          percentage: 0,
          createdAt: new Date().toISOString()
        };
      }
      renderTestView(container, testSession.role);
      return;
    }

    if (target.hasAttribute("data-test-zone-attempt")) {
      await handleAttemptSubmit(container, target);
      return;
    }

    if (target.hasAttribute("data-test-zone-question-form")) {
      await handleQuestionFormSubmit(container, target);
      return;
    }

    if (target.hasAttribute("data-test-zone-live-form")) {
      await handleLiveFormSubmit(container, target);
    }
  };
}

export async function renderTestView(container, role = "member") {
  testSession.role = String(role || "member").trim() || "member";

  if (testSession.loading) {
    container.innerHTML = '<section class="test-zone-view"><div class="test-zone-empty">Cargando Zona Test...</div></section>';
    return;
  }

  if (
    testSession.loadedRole !== testSession.role ||
    !(getTestState().questions || []).length ||
    (!(getTestState().results || []).length && testSession.role !== "admin")
  ) {
    testSession.loading = true;
    container.innerHTML = '<section class="test-zone-view"><div class="test-zone-empty">Cargando Zona Test...</div></section>';
    try {
      await refreshData(testSession.role);
      testSession.loadedRole = testSession.role;
    } catch (error) {
      testSession.loading = false;
      container.innerHTML = `<section class="test-zone-view"><div class="test-zone-inline-error">${escapeHtml(error.message || "No se pudo cargar la Zona Test.")}</div></section>`;
      return;
    }
  }

  container.innerHTML = buildLayout();
  bindActions(container);
}

export default renderTestView;
