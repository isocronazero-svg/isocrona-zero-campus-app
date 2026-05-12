const joinForm = document.getElementById("liveJoinForm");
const nameInput = document.getElementById("liveParticipantName");
const codeInput = document.getElementById("liveSessionCode");
const statusElement = document.getElementById("liveStatus");
const stageElement = document.getElementById("liveTestStage");

const liveState = {
  participantName: "",
  code: "",
  session: null,
  questions: [],
  answers: {},
  result: null
};

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function setStatus(message, isWarning = false) {
  statusElement.textContent = message;
  statusElement.classList.toggle("warning", Boolean(isWarning));
}

function applyQueryParams() {
  const params = new URLSearchParams(window.location.search);
  const code = String(params.get("code") || "").trim();
  const participantName = String(params.get("participantName") || "").trim();
  if (code) {
    codeInput.value = code.toUpperCase();
  }
  if (participantName) {
    nameInput.value = participantName;
  }
}

async function loadSession() {
  const response = await fetch(`/api/live-test-sessions/${encodeURIComponent(liveState.code)}`);
  const payload = await response.json();
  if (!response.ok || payload.ok === false) {
    throw new Error(payload.error || "No se pudo cargar la sesion en vivo.");
  }
  liveState.session = payload.session;
  liveState.questions = Array.isArray(payload.questions) ? payload.questions : [];
  liveState.answers = {};
}

function renderLiveQuestions() {
  joinForm.hidden = true;
  stageElement.hidden = false;
  stageElement.innerHTML = `
    <header class="test-view-header">
      <div>
        <p class="test-view-kicker">Test en vivo</p>
        <h2 class="test-view-title">${escapeHtml(liveState.session?.title || "Sesion en vivo")}</h2>
        <p class="muted">${escapeHtml(liveState.participantName)} · Codigo ${escapeHtml(liveState.code)}</p>
      </div>
      <div class="test-view-stats">
        <div class="test-stat-pill">
          <span class="test-stat-label">Preguntas</span>
          <strong>${liveState.questions.length}</strong>
        </div>
      </div>
    </header>
    <form id="liveAnswerForm" class="test-review-list">
      ${liveState.questions
        .map(
          (question, questionIndex) => `
            <article class="test-question-card">
              <div class="test-question-meta">
                <span class="test-question-topic">${escapeHtml(question.temaNumero ? `Tema ${question.temaNumero}` : question.temaTitulo || "En vivo")}</span>
                <span class="test-question-difficulty">${escapeHtml(String(questionIndex + 1))}/${liveState.questions.length}</span>
              </div>
              <h3 class="test-question-title">${escapeHtml(question.prompt)}</h3>
              <div class="test-options-grid">
                ${(question.options || [])
                  .map(
                    (option, optionIndex) => `
                      <label class="test-option-button">
                        <input type="radio" name="question-${escapeHtml(question.id)}" value="${optionIndex}" />
                        <span class="test-option-badge">${String.fromCharCode(65 + optionIndex)}</span>
                        <span class="test-option-label">${escapeHtml(option)}</span>
                      </label>
                    `
                  )
                  .join("")}
              </div>
            </article>
          `
        )
        .join("")}
      <div class="test-action-row">
        <button type="submit" class="test-primary-button">Enviar respuestas</button>
      </div>
    </form>
  `;
}

function renderResult() {
  const result = liveState.result;
  stageElement.innerHTML = `
    <section class="test-result-card">
      <p class="test-result-kicker">Resultado enviado</p>
      <h3 class="test-result-title">${result.correctCount} aciertos de ${liveState.questions.length}</h3>
      <div class="test-result-grid">
        <div><span>Aciertos</span><strong>${result.correctCount}</strong></div>
        <div><span>Fallos</span><strong>${result.wrongCount}</strong></div>
        <div><span>Blancas</span><strong>${result.blankCount || 0}</strong></div>
        <div><span>Porcentaje</span><strong>${Number(result.scorePercent || 0).toFixed(1)}%</strong></div>
      </div>
      <p class="test-result-summary">Este resultado pertenece al test en vivo y no se mezcla con el historial normal de socios.</p>
      <div class="test-action-row">
        <a class="test-primary-button test-link-button" href="/index.html">Volver al portal</a>
      </div>
    </section>
  `;
}

async function submitLiveAnswers(event) {
  event.preventDefault();
  const formData = new FormData(event.target);
  const answers = {};
  liveState.questions.forEach((question) => {
    const value = formData.get(`question-${question.id}`);
    answers[question.id] = value === null ? null : Number(value);
  });

  const response = await fetch(`/api/live-test-sessions/${encodeURIComponent(liveState.code)}/submit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      participantName: liveState.participantName,
      answers
    })
  });
  const payload = await response.json();
  if (!response.ok || payload.ok === false) {
    throw new Error(payload.error || "No se pudo guardar el resultado.");
  }
  liveState.result = payload.result;
  renderResult();
}

joinForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  liveState.participantName = String(nameInput.value || "").trim();
  liveState.code = String(codeInput.value || "").trim().toUpperCase();
  if (!liveState.participantName || !liveState.code) {
    setStatus("Indica tu nombre y el codigo de la sesion.", true);
    return;
  }

  try {
    setStatus("Cargando sesion en vivo...");
    await loadSession();
    renderLiveQuestions();
  } catch (error) {
    setStatus(error.message || "No se pudo entrar al test en vivo.", true);
  }
});

stageElement?.addEventListener("submit", async (event) => {
  try {
    await submitLiveAnswers(event);
  } catch (error) {
    setStatus(error.message || "No se pudo enviar el test en vivo.", true);
  }
});

applyQueryParams();
