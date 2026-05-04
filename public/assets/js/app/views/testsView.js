const testsViewState = {
  role: "member",
  modules: [],
  tests: [],
  questionsByTestId: {},
  attemptsByTestId: {},
  activeTestId: "",
  result: null,
  message: "",
  tone: "neutral",
  renderToken: 0
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

function getAttemptsForTest(testId) {
  return Array.isArray(testsViewState.attemptsByTestId[testId]) ? testsViewState.attemptsByTestId[testId] : [];
}

async function loadAdminData() {
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
  testsViewState.questionsByTestId = {};
  testsViewState.attemptsByTestId = {};

  await Promise.all(
    testsViewState.tests.map(async (test) => {
      const response = await client.get(`/api/questions?testId=${encodeURIComponent(test.id)}`);
      testsViewState.questionsByTestId[test.id] = Array.isArray(response.questions) ? response.questions : [];
    })
  );
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
  testsViewState.questionsByTestId = {};
  testsViewState.attemptsByTestId = {};
  testsViewState.result = null;

  const visibleTests = testsViewState.tests.filter((test) => Boolean(test.published));
  if (!visibleTests.length) {
    testsViewState.activeTestId = "";
    return;
  }

  const hasActiveVisibleTest = visibleTests.some((test) => test.id === testsViewState.activeTestId);
  testsViewState.activeTestId = hasActiveVisibleTest ? testsViewState.activeTestId : visibleTests[0].id;
  await ensureStudentActiveTestQuestions();
  await ensureStudentActiveTestAttempts();
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

function buildAdminModuleMarkup(module) {
  const tests = getTestsForModule(module.id);
  return `
    <article class="course-card">
      <div class="course-topline">
        <span class="tag">Modulo</span>
        <span class="status-chip">${tests.length} test(s)</span>
      </div>
      <h3>${escapeHtml(module.title)}</h3>
      <p class="course-meta">${escapeHtml(module.description || "Sin descripcion")}</p>

      <div class="panel-stack">
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
                      <div class="course-topline">
                        <span class="tag">Test</span>
                        <span class="status-chip">${test.published ? "Publicado" : "Borrador"}</span>
                      </div>
                      <h4>${escapeHtml(test.title)}</h4>
                      <p class="muted">${escapeHtml(test.description || "Sin descripcion")}</p>
                      <ol class="stack">
                        ${
                          questions.length
                            ? questions
                                .map(
                                  (question) => `
                                    <li>
                                      <strong>${escapeHtml(question.prompt)}</strong>
                                      <p class="muted">Correcta: opcion ${Number(question.correctIndex) + 1}</p>
                                    </li>
                                  `
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
                          <label class="inline-field">
                            Opcion 1
                            <input type="text" name="option0" required />
                          </label>
                          <label class="inline-field">
                            Opcion 2
                            <input type="text" name="option1" required />
                          </label>
                          <label class="inline-field">
                            Opcion 3
                            <input type="text" name="option2" required />
                          </label>
                          <label class="inline-field">
                            Opcion 4
                            <input type="text" name="option3" required />
                          </label>
                        </div>
                        <label class="inline-field">
                          Indice correcto
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
  if (!test || !questions.length) {
    return '<div class="empty-state">Este test aun no tiene preguntas disponibles.</div>';
  }

  return `
    <form class="stack" data-tests-student-form="attempt" data-test-id="${escapeHtml(test.id)}">
      <div>
        <p class="eyebrow">Test activo</p>
        <h3>${escapeHtml(test.title)}</h3>
        <p class="muted">${escapeHtml(test.description || "Sin descripcion")}</p>
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
        ${
          attempts.length
            ? `
              <ul class="stack">
                ${attempts
                  .map(
                    (attempt) => `
                      <li>
                        <strong>${escapeHtml(`${attempt.score}/${attempt.total}`)}</strong>
                        <p class="muted">${escapeHtml(formatAttemptDate(attempt.createdAt))}</p>
                      </li>
                    `
                  )
                  .join("")}
              </ul>
            `
            : '<p class="muted">Todavia no has realizado intentos en este test.</p>'
        }
      </section>
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
          testsViewState.result
            ? `Ultimo resultado: ${testsViewState.result.score}/${testsViewState.result.total}`
            : testsViewState.message || "Elige un test publicado y responde desde aqui."
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
  } catch (error) {
    if (renderToken !== testsViewState.renderToken) {
      return;
    }
    setTestsViewMessage(error.message || "No se pudo cargar la vista de tests", "error");
    renderTestsMarkup(container);
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
  } else if (formType === "test") {
    await client.post("/api/tests", {
      moduleId: String(form.dataset.moduleId || "").trim(),
      title: String(formData.get("title") || "").trim(),
      description: String(formData.get("description") || "").trim(),
      published: formData.get("published") === "on"
    });
    setTestsViewMessage("Test creado correctamente.", "success");
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
  }

  await refreshTestsView(container, testsViewState.role);
}

async function handleStudentTestSelection(container, testId) {
  testsViewState.activeTestId = String(testId || "").trim();
  testsViewState.result = null;
  setTestsViewMessage("", "neutral");
  await refreshTestsView(container, testsViewState.role);
}

async function handleStudentAttemptSubmit(container, form) {
  const client = getApiClient();
  if (!client) {
    throw new Error("Cliente API no disponible");
  }

  const testId = String(form.dataset.testId || "").trim();
  const questions = getQuestionsForTest(testId);
  const formData = new FormData(form);
  const answers = questions.map((question, index) => {
    const selected = formData.get(`question-${index}`);
    return selected === null ? null : Number(selected);
  });

  const response = await client.post(`/api/tests/${encodeURIComponent(testId)}/attempt`, {
    answers
  });

  testsViewState.result = {
    score: Number(response.score || 0),
    total: Number(response.total || 0)
  };
  await ensureStudentActiveTestAttempts();
  setTestsViewMessage(`Resultado guardado: ${testsViewState.result.score}/${testsViewState.result.total}.`, "success");
  renderTestsMarkup(container);
}

export function renderTestsView(container, role = "member") {
  container.onclick = async (event) => {
    const openTestButton = event.target.closest('[data-action="open-test"]');
    if (!openTestButton) {
      return;
    }

    event.preventDefault();
    try {
      await handleStudentTestSelection(container, openTestButton.dataset.testId);
    } catch (error) {
      setTestsViewMessage(error.message || "No se pudo abrir el test.", "error");
      renderTestsMarkup(container);
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
    }
  };

  refreshTestsView(container, role);
}

export default renderTestsView;
