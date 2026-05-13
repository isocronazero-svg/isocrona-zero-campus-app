import {
  createLiveSession,
  createQuestion,
  getQuestionFilters,
  getStoredQuestions,
  loadLiveSessions,
  loadSharedQuestions,
  loadTestHistory,
  markQuestionReviewed,
  saveQuestion
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

function buildMetricCards() {
  const { stats } = getTestState();
  const metrics = [
    { label: "Tests realizados", value: stats.totalTests || 0, hint: "Intentos guardados" },
    { label: "Preguntas respondidas", value: stats.answered || 0, hint: "Sin contar blancas" },
    { label: "Aciertos", value: stats.correct || 0, hint: "Total acumulado" },
    { label: "Fallos", value: stats.wrong || 0, hint: "Pendientes de repaso" },
    { label: "% acierto", value: `${Number(stats.accuracy || 0).toFixed(1)}%`, hint: "Global acumulado" }
  ];
  return `
    <div class="test-zone-metrics">
      ${metrics
        .map(
          (metric) => `
            <article class="test-zone-metric-card">
              <p class="test-zone-kicker">${escapeHtml(metric.label)}</p>
              <strong>${escapeHtml(metric.value)}</strong>
              <span>${escapeHtml(metric.hint)}</span>
            </article>
          `
        )
        .join("")}
    </div>
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

function buildControlsMarkup() {
  const { parts, categories, difficulties } = getQuestionFilters(getStoredQuestions());
  const failedQuestions = getFailedQuestions();
  return `
    <section class="test-zone-card">
      <div class="test-zone-card-head">
        <div>
          <p class="test-zone-kicker">Configuración</p>
          <h3>Generar entrenamiento</h3>
          <p class="muted">Filtra por estructura oficial y lanza tests normales o solo con preguntas falladas.</p>
        </div>
        <div class="test-zone-inline-summary">
          <span>${escapeHtml(`${getStoredQuestions().length} preguntas en banco`)}</span>
          <span>${escapeHtml(`${failedQuestions.length} falladas pendientes`)}</span>
        </div>
      </div>
      <form class="test-zone-controls" data-test-zone-controls>
        ${buildFilterSelect("part", testSession.filters.part, parts)}
        ${buildFilterSelect("category", testSession.filters.category, categories)}
        ${buildFilterSelect("difficulty", testSession.filters.difficulty, difficulties)}
        <label class="test-zone-field">
          <span>Preguntas</span>
          <input type="number" name="questionCount" min="1" max="100" value="${escapeHtml(testSession.filters.questionCount)}" />
        </label>
        <div class="test-zone-actions">
          <button type="submit" class="test-zone-primary-button">Empezar test</button>
          <button type="button" class="test-zone-secondary-button" data-action="start-failed-test" ${failedQuestions.length ? "" : "disabled"}>
            Solo falladas
          </button>
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
  return `
    <section class="test-zone-card">
      <div class="test-zone-card-head">
        <div>
          <p class="test-zone-kicker">Test activo</p>
          <h3>${escapeHtml(run.title)}</h3>
          <p class="muted">${escapeHtml(`${run.questions.length} preguntas · modo ${run.mode === "failed" ? "repaso" : "entrenamiento"}`)}</p>
        </div>
        <div class="test-zone-actions">
          <button type="button" class="test-zone-secondary-button" data-action="cancel-active-test">Cancelar</button>
        </div>
      </div>
      <form data-test-zone-attempt>
        <div class="test-zone-question-list">
          ${run.questions
            .map(
              (question, index) => `
                <article class="test-zone-question-card">
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
                  </div>
                  <div class="test-zone-option-list">
                    ${(Array.isArray(question.options) ? question.options : [])
                      .map(
                        (option, optionIndex) => `
                          <label class="test-zone-option-row">
                            <input type="radio" name="question-${index}" value="${optionIndex}" />
                            <span class="test-zone-option-badge">${String.fromCharCode(65 + optionIndex)}</span>
                            <span class="test-zone-option-copy">${escapeHtml(option)}</span>
                          </label>
                        `
                      )
                      .join("")}
                  </div>
                </article>
              `
            )
            .join("")}
        </div>
        <div class="test-zone-footer-actions">
          <button type="submit" class="test-zone-primary-button">Finalizar test</button>
        </div>
      </form>
    </section>
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
        Aciertos: ${escapeHtml(result.correctCount)} · Fallos: ${escapeHtml(result.wrongCount)} · Blancas: ${escapeHtml(result.blankCount)} · Nota: ${escapeHtml(result.score)}/${escapeHtml(result.total)} · ${escapeHtml(Number(result.percentage || 0).toFixed(1))}%
      </p>
      <p class="muted">${escapeHtml(formatDate(result.createdAt))}</p>
    </section>
  `;
}

function buildFailedQuestionsMarkup() {
  const failedQuestions = getFailedQuestions();
  return `
    <section class="test-zone-card">
      <div class="test-zone-card-head">
        <div>
          <p class="test-zone-kicker">Repaso</p>
          <h3>Preguntas falladas</h3>
          <p class="muted">Tu bolsa de repaso usa las últimas respuestas incorrectas todavía no marcadas como repasadas.</p>
        </div>
        <div class="test-zone-actions">
          <button type="button" class="test-zone-secondary-button" data-action="start-failed-test" ${failedQuestions.length ? "" : "disabled"}>Repetir falladas</button>
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

function buildHistoryMarkup() {
  const { results, stats } = getTestState();
  return `
    <section class="test-zone-card">
      <div class="test-zone-card-head">
        <div>
          <p class="test-zone-kicker">Historial</p>
          <h3>Estadísticas y evolución</h3>
          <p class="muted">Consulta tu histórico de entrenamiento y la evolución por fecha.</p>
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
            : '<span class="muted">Todavía no hay evolución registrada.</span>'
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
                        <button type="button" class="test-zone-secondary-button" data-action="repeat-result-failed" data-result-id="${escapeHtml(result.id)}" ${result.incorrectQuestionIds?.length ? "" : "disabled"}>
                          Repetir falladas
                        </button>
                      </div>
                    </article>
                  `
                )
                .join("")}
            </div>`
          : '<div class="test-zone-empty">Todavía no hay tests guardados.</div>'
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
  return `
    <section class="test-zone-view">
      <header class="test-zone-hero">
        <div>
          <p class="test-zone-kicker">Zona Test</p>
          <h2>Entrenamiento real con historial y repasos</h2>
          <p class="muted">La práctica libre ahora guarda resultados, detecta fallos y permite repetir solo las preguntas que peor llevas.</p>
        </div>
      </header>
      ${buildMetricCards()}
      ${buildControlsMarkup()}
      ${buildQuestionAttemptMarkup()}
      ${buildLatestResultMarkup()}
      ${buildFailedQuestionsMarkup()}
      ${buildHistoryMarkup()}
      ${buildAdminQuestionForm()}
    </section>
  `;
}

async function refreshData(role) {
  testSession.loading = true;
  try {
    await loadSharedQuestions();
    await loadTestHistory();
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
  testSession.activeRun = generateTest(
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
  );
  testSession.latestResult = null;
}

async function handleAttemptSubmit(container, form) {
  const run = testSession.activeRun;
  if (!run) {
    return;
  }
  const formData = new FormData(form);
  const answers = run.questions.map((question, index) => {
    const value = formData.get(`question-${index}`);
    return value === null ? null : Number(value);
  });
  const evaluated = evaluateTest(run, answers, testSession.role);
  const savedResult = await saveTestResult(evaluated);
  testSession.latestResult = savedResult;
  testSession.activeRun = null;
  await loadTestHistory();
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
      testSession.activeRun = null;
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
    if (action === "mark-reviewed") {
      await markQuestionReviewed(actionTarget.dataset.questionId || "");
      await refreshData(testSession.role);
      renderTestView(container, testSession.role);
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
        testSession.activeRun = null;
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
