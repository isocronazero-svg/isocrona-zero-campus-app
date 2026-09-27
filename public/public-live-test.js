(function () {
  const root = document.getElementById("publicLiveTestApp");
  if (!root) {
    return;
  }

  const state = {
    guestName: "",
    code: "",
    liveSession: null,
    result: null,
    status: "Introduce tu nombre y el código del test en vivo.",
    tone: "info"
  };
  let pollTimer = null;
  let pollController = null;
  let pollBusy = false;
  let joining = false;
  let submitting = false;
  let answering = false;
  let requestVersion = 0;
  let pageClosed = false;
  let pollDelay = 5000;
  let retryNotBefore = 0;
  let questionTimerId = null;

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  async function fetchJson(url, options = {}) {
    let response;
    try {
      response = await fetch(url, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          ...(options.headers || {})
        }
      });
    } catch (error) {
      if (error.name === "TypeError") {
        throw new Error("No se pudo conectar. Comprueba tu conexion y vuelve a intentarlo.");
      }
      throw error;
    }
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || payload?.ok === false) {
      const error = new Error(payload?.error || "No se pudo completar la operación");
      error.status = response.status;
      const retryAfter = Number(response.headers.get("Retry-After") || payload?.retryAfterSeconds || 5);
      error.retryAfterSeconds = Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter : 5;
      throw error;
    }
    return payload;
  }

  function updateStatus(message, tone = "info") {
    state.status = message;
    state.tone = tone;
    const note = document.getElementById("publicLiveStatus");
    if (note) {
      note.textContent = message;
      note.className = `status-note ${tone === "error" ? "warning" : ""}`;
    }
  }

  function getQuestionRemainingSeconds(session = state.liveSession) {
    const deadlineMs = Date.parse(String(session?.questionDeadlineAt || ""));
    const serverNowMs = Date.parse(String(session?.serverNow || ""));
    const receivedAtMs = Number(session?._receivedAtMs);
    const limitSeconds = Number(session?.questionTimeLimitSeconds || 20);
    if (!Number.isFinite(deadlineMs) || !Number.isFinite(serverNowMs)) {
      return Math.max(0, Math.ceil(limitSeconds));
    }
    const elapsedSinceResponse = Number.isFinite(receivedAtMs) ? Math.max(0, Date.now() - receivedAtMs) : 0;
    const estimatedServerNow = serverNowMs + elapsedSinceResponse;
    return Math.max(0, Math.ceil((deadlineMs - estimatedServerNow) / 1000));
  }

  function stopQuestionCountdown() {
    if (questionTimerId !== null) {
      clearInterval(questionTimerId);
      questionTimerId = null;
    }
  }

  function startQuestionCountdown() {
    stopQuestionCountdown();
    const session = state.liveSession;
    if (
      !session ||
      session.status !== "active" ||
      session.guided !== true ||
      session.questionClosed === true ||
      session._timerExpiredLocally === true
    ) {
      return;
    }
    const tick = () => {
      const remainingSeconds = getQuestionRemainingSeconds(session);
      const output = document.getElementById("publicLiveCountdown");
      if (output) {
        output.textContent = `${remainingSeconds} s`;
      }
      if (remainingSeconds <= 0) {
        session._timerExpiredLocally = true;
        stopQuestionCountdown();
        updateStatus("Tiempo agotado. Espera a que se muestre la respuesta correcta.", "info");
        render();
        scheduleLobbyRefresh(0);
      }
    };
    tick();
    if (getQuestionRemainingSeconds(session) > 0) {
      questionTimerId = setInterval(tick, 1000);
    }
  }

  function stopLobbyRefresh() {
    clearTimeout(pollTimer);
    pollTimer = null;
    pollController?.abort();
  }

  function scheduleLobbyRefresh(delay = 5000) {
    clearTimeout(pollTimer);
    const liveStatus = String(state.liveSession?.status || "");
    const shouldPoll = liveStatus === "lobby" || (liveStatus === "active" && state.liveSession?.guided === true);
    if (pageClosed || document.hidden || !shouldPoll) return;
    pollTimer = setTimeout(refreshLobby, Math.max(delay, retryNotBefore - Date.now()));
  }

  async function refreshLobby() {
    const liveStatus = String(state.liveSession?.status || "");
    const shouldPoll = liveStatus === "lobby" || (liveStatus === "active" && state.liveSession?.guided === true);
    if (pollBusy || pageClosed || document.hidden || !shouldPoll) return;
    if (Date.now() < retryNotBefore) {
      scheduleLobbyRefresh();
      return;
    }
    clearTimeout(pollTimer);
    pollBusy = true;
    const version = requestVersion;
    const session = state.liveSession;
    const controller = new AbortController();
    pollController = controller;
    const timeout = setTimeout(() => controller.abort(), 10000);
    const button = document.getElementById("publicLiveRefreshButton");
    if (button) button.disabled = true;
    try {
      const payload = await fetchJson(`/api/test-zone/live-sessions/${encodeURIComponent(session.id)}/participant`, {
        method: "GET", cache: "no-store", signal: controller.signal,
        headers: { "X-Live-Participant": session.participantId }
      });
      if (version !== requestVersion || pageClosed) return;
      const previousStatus = String(state.liveSession?.status || "");
      const previousQuestionIndex = state.liveSession?.currentQuestionIndex;
      const previousQuestionClosed = state.liveSession?.questionClosed === true;
      state.liveSession = payload.liveSession;
      if (state.liveSession) state.liveSession._receivedAtMs = Date.now();
      retryNotBefore = 0;
      pollDelay = state.liveSession?.status === "active" && state.liveSession?.guided === true ? 2500 : 5000;
      if (state.liveSession?.status === "active") {
        const questionChanged = previousQuestionIndex !== state.liveSession.currentQuestionIndex;
        const revealChanged = previousQuestionClosed !== (state.liveSession.questionClosed === true);
        updateStatus(
          questionChanged && previousStatus === "active"
            ? "El administrador ha pasado a la siguiente pregunta."
            : state.liveSession.questionClosed === true
              ? "Pregunta cerrada. Ya puedes revisar la respuesta correcta."
              : "El test está en curso.",
          "success"
        );
        if (previousStatus !== "active" || questionChanged || revealChanged) {
          render();
        }
      } else {
        updateStatus("Sigues en la sala de espera.");
      }
    } catch (error) {
      if (version !== requestVersion || pageClosed || document.hidden) return;
      updateStatus(error.name === "AbortError" ? "La conexion tarda en responder. Volveremos a intentarlo." : error.message, "error");
      if ([401, 403, 404, 410].includes(error.status)) {
        state.liveSession = null;
        render();
      } else {
        pollDelay = Math.min(60000, pollDelay * 2);
        if (error.status === 429) retryNotBefore = Date.now() + Math.max(5000, error.retryAfterSeconds * 1000);
      }
    } finally {
      clearTimeout(timeout);
      if (version === requestVersion) {
        pollBusy = false;
        pollController = null;
        if (button) button.disabled = false;
        scheduleLobbyRefresh(pollDelay);
      }
    }
  }

  function renderJoinForm() {
    return `
      <section class="mail-card">
        <form id="publicLiveJoinForm" class="test-zone-controls">
          <label class="test-zone-field">
            <span>Nombre</span>
            <input type="text" name="guestName" value="${escapeHtml(state.guestName)}" required />
          </label>
          <label class="test-zone-field">
            <span>Código del test</span>
            <input type="text" name="code" value="${escapeHtml(state.code)}" required />
          </label>
          <div class="test-zone-actions">
            <button type="submit" class="test-zone-primary-button">Entrar al test en vivo</button>
          </div>
        </form>
        <p id="publicLiveStatus" aria-live="polite" class="status-note ${state.tone === "error" ? "warning" : ""}">${escapeHtml(state.status)}</p>
      </section>
    `;
  }

  function renderAttempt() {
    if (!state.liveSession || state.result) {
      return "";
    }
    if (String(state.liveSession.status || "") === "lobby") {
      return `
        <section class="test-zone-card test-zone-card-highlight">
          <p class="test-zone-kicker">Sala de espera</p>
          <h3>${escapeHtml(state.liveSession.title || "Test en vivo")}</h3>
          <p class="muted">Código ${escapeHtml(state.liveSession.code)} · ${escapeHtml(state.liveSession.questionCount)} preguntas</p>
          <p><strong>${escapeHtml(state.guestName)}</strong>, ya estás dentro.</p>
          <p class="status-note">Espera a que el administrador inicie el test.</p>
          <button type="button" id="publicLiveRefreshButton" class="test-zone-secondary-button">Comprobar si ha comenzado</button>
        </section>
      `;
    }
    if (state.liveSession.guided === true) {
      const question = (state.liveSession.questions || [])[0];
      const questionNumber = Number(state.liveSession.currentQuestionIndex || 0) + 1;
      const answered = state.liveSession.answered === true;
      const questionClosed = state.liveSession.questionClosed === true;
      const correctIndex = Number.isInteger(state.liveSession.correctIndex) ? state.liveSession.correctIndex : null;
      const currentAnswerIndex = Number.isInteger(state.liveSession.currentAnswerIndex) ? state.liveSession.currentAnswerIndex : null;
      const remainingSeconds = getQuestionRemainingSeconds(state.liveSession);
      const questionLocked = questionClosed || remainingSeconds <= 0;
      const answerResult =
        questionClosed && correctIndex !== null
          ? `<div class="status-note"><strong>Respuesta correcta:</strong> ${escapeHtml(String.fromCharCode(65 + correctIndex))}. ${escapeHtml(question?.options?.[correctIndex] || "")}${
              currentAnswerIndex !== null
                ? `<br><strong>Tu respuesta:</strong> ${escapeHtml(String.fromCharCode(65 + currentAnswerIndex))}. ${escapeHtml(question?.options?.[currentAnswerIndex] || "")} · ${currentAnswerIndex === correctIndex ? "Correcta" : "Incorrecta"}`
                : "<br>No enviaste respuesta antes del cierre."
            }</div>`
          : "";
      if (!question) {
        return `
          <section class="test-zone-card test-zone-card-highlight">
            <p class="test-zone-kicker">Sesión activa</p>
            <h3>${escapeHtml(state.liveSession.title || "Test en vivo")}</h3>
            <p class="status-note">Esperando la pregunta activa.</p>
          </section>
        `;
      }
      return `
        <section class="test-zone-card">
          <div class="test-zone-card-head">
            <div>
              <p class="test-zone-kicker">Sesión activa</p>
              <h3>${escapeHtml(state.liveSession.title || "Test en vivo")}</h3>
              <p class="muted">Pregunta ${escapeHtml(questionNumber)} de ${escapeHtml(state.liveSession.questionCount)} · Tiempo: <strong id="publicLiveCountdown">${escapeHtml(remainingSeconds)} s</strong></p>
            </div>
          </div>
          <form id="publicLiveQuestionForm">
            <article class="test-zone-question-card">
              <div class="test-zone-question-head">
                <div>
                  <p class="test-zone-question-index">Pregunta ${escapeHtml(questionNumber)}</p>
                  <h4>${escapeHtml(question.prompt)}</h4>
                </div>
                <div class="test-zone-tag-row">
                  <span class="test-zone-tag">${escapeHtml(question.part || "Parte común")}</span>
                  <span class="test-zone-tag">${escapeHtml(question.category || "Legislación")}</span>
                </div>
              </div>
              <div class="test-zone-option-list">
                ${(question.options || [])
                  .map(
                    (option, optionIndex) => `
                      <label class="test-zone-option-row">
                        <input
                          type="radio"
                          name="answerIndex"
                          value="${optionIndex}"
                          ${Number.isInteger(state.liveSession.currentAnswerIndex) && state.liveSession.currentAnswerIndex === optionIndex ? "checked" : ""}
                          ${answered || questionLocked ? "disabled" : ""}
                        />
                        <span class="test-zone-option-badge">${String.fromCharCode(65 + optionIndex)}</span>
                        <span class="test-zone-option-copy">${escapeHtml(option)}</span>
                      </label>
                    `
                  )
                  .join("")}
              </div>
              ${answerResult}
            </article>
            <div class="test-zone-footer-actions">
              ${questionClosed
                ? '<p class="status-note">Pregunta cerrada. Espera a que el administrador continúe.</p>'
                : remainingSeconds <= 0
                  ? '<p class="status-note">Tiempo agotado. Espera a que se muestre la respuesta correcta.</p>'
                  : answered
                    ? '<p class="status-note">Respuesta enviada. Espera a que el administrador cierre la pregunta.</p>'
                    : '<button type="submit" class="test-zone-primary-button">Enviar respuesta</button>'}
            </div>
          </form>
        </section>
      `;
    }
    return `
      <section class="test-zone-card">
        <div class="test-zone-card-head">
          <div>
            <p class="test-zone-kicker">Sesión activa</p>
            <h3>${escapeHtml(state.liveSession.title || "Test en vivo")}</h3>
            <p class="muted">Código ${escapeHtml(state.liveSession.code)} · ${escapeHtml(state.liveSession.questionCount)} preguntas</p>
          </div>
        </div>
        <form id="publicLiveAttemptForm">
          <div class="test-zone-question-list">
            ${(state.liveSession.questions || [])
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
                      </div>
                    </div>
                    <div class="test-zone-option-list">
                      ${(question.options || [])
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

  function renderResult() {
    if (!state.result) {
      return "";
    }
    return `
      <section class="test-zone-card test-zone-card-highlight">
        <p class="test-zone-kicker">Resultado guardado</p>
        <h3>${escapeHtml(state.result.title || "Test en vivo")}</h3>
        <p class="test-zone-result-line">
          Aciertos: ${escapeHtml(state.result.correctCount)} · Fallos: ${escapeHtml(state.result.wrongCount)} · Blancas: ${escapeHtml(state.result.blankCount)} · Nota: ${escapeHtml(state.result.score)}/${escapeHtml(state.result.total)} · ${escapeHtml(Number(state.result.percentage || 0).toFixed(1))}%
        </p>
      </section>
    `;
  }

  function render() {
    root.innerHTML = `
      ${renderJoinForm()}
      ${renderAttempt()}
      ${renderResult()}
    `;

    const joinForm = document.getElementById("publicLiveJoinForm");
    const questionForm = document.getElementById("publicLiveQuestionForm");
    const attemptForm = document.getElementById("publicLiveAttemptForm");
    const refreshButton = document.getElementById("publicLiveRefreshButton");

    refreshButton?.addEventListener("click", refreshLobby);

    joinForm?.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (joining || submitting) return;
      joining = true;
      requestVersion++;
      stopLobbyRefresh();
      pollBusy = false;
      retryNotBefore = 0;
      pollDelay = 5000;
      const formData = new FormData(joinForm);
      state.guestName = String(formData.get("guestName") || "").trim();
      state.code = String(formData.get("code") || "").trim();
      state.liveSession = null;
      state.result = null;
      joinForm.querySelector('button[type="submit"]').disabled = true;
      try {
        const payload = await fetchJson("/api/test-zone/live/join", {
          method: "POST",
          body: JSON.stringify({
            guestName: state.guestName,
            code: state.code
          })
        });
        state.liveSession = payload.liveSession;
      if (state.liveSession) state.liveSession._receivedAtMs = Date.now();
        state.result = null;
        state.status =
          String(state.liveSession?.status || "") === "lobby"
            ? "Has entrado. Espera a que el administrador inicie el test."
            : state.liveSession?.guided === true
              ? "El test está en curso. Responde la pregunta activa."
              : "Acceso concedido. Completa el test y finaliza para guardar tu resultado.";
        state.tone = "success";
      } catch (error) {
        state.status = error.message || "No se pudo entrar al test en vivo.";
        state.tone = "error";
      }
      joining = false;
      render();
      scheduleLobbyRefresh();
    });

    questionForm?.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (
        !state.liveSession ||
        state.result ||
        answering ||
        joining ||
        state.liveSession.answered ||
        state.liveSession.questionClosed ||
        getQuestionRemainingSeconds(state.liveSession) <= 0
      ) {
        return;
      }
      const formData = new FormData(questionForm);
      const rawAnswerIndex = formData.get("answerIndex");
      if (rawAnswerIndex === null) {
        updateStatus("Selecciona una respuesta antes de enviarla.", "error");
        return;
      }
      answering = true;
      requestVersion++;
      stopLobbyRefresh();
      pollBusy = false;
      const button = questionForm.querySelector('button[type="submit"]');
      if (button) button.disabled = true;
      try {
        const payload = await fetchJson(
          `/api/test-zone/live-sessions/${encodeURIComponent(state.liveSession.id)}/answer`,
          {
            method: "POST",
            headers: { "X-Live-Participant": state.liveSession.participantId },
            body: JSON.stringify({
              questionId: state.liveSession.currentQuestionId,
              answerIndex: Number(rawAnswerIndex)
            })
          }
        );
        state.liveSession = payload.liveSession;
      if (state.liveSession) state.liveSession._receivedAtMs = Date.now();
        state.status = "Respuesta enviada. Espera a que el administrador cierre la pregunta.";
        state.tone = "success";
        render();
        scheduleLobbyRefresh(2500);
      } catch (error) {
        updateStatus(error.message || "No se pudo guardar la respuesta.", "error");
      } finally {
        answering = false;
        if (button) button.disabled = false;
        scheduleLobbyRefresh(2500);
      }
    });

    startQuestionCountdown();

    attemptForm?.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (!state.liveSession || state.result || submitting || joining) {
        return;
      }
      submitting = true;
      const button = attemptForm.querySelector('button[type="submit"]');
      button.disabled = true;
      const formData = new FormData(attemptForm);
      const answers = (state.liveSession.questions || []).map((question, index) => {
        const value = formData.get(`question-${index}`);
        return value === null ? null : Number(value);
      });
      try {
        const payload = await fetchJson(`/api/test-zone/live-sessions/${encodeURIComponent(state.liveSession.id)}/attempt`, {
          method: "POST",
          body: JSON.stringify({
            guestName: state.guestName,
            questionIds: (state.liveSession.questions || []).map((question) => question.id),
            answers
          })
        });
        state.result = payload.result;
        state.status = "Resultado guardado correctamente.";
        state.tone = "success";
        render();
      } catch (error) {
        updateStatus(error.message || "No se pudo guardar el resultado.", "error");
      } finally {
        submitting = false;
        button.disabled = false;
      }
    });
  }

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stopLobbyRefresh();
    else scheduleLobbyRefresh(0);
  });
  window.addEventListener("pagehide", () => {
    pageClosed = true;
    requestVersion++;
    pollBusy = false;
    stopLobbyRefresh();
    stopQuestionCountdown();
  });
  window.addEventListener("pageshow", () => {
    pageClosed = false;
    scheduleLobbyRefresh(0);
  });
  render();
})();
