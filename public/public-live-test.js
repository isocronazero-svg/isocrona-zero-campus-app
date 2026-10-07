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
  let pendingAnswer = null;
  let requestVersion = 0;
  let pageClosed = false;
  let pollDelay = 5000;
  let retryNotBefore = 0;
  let questionTimerId = null;
  const resumeStorageKey = "iz-public-live-participant-v1";
  let joinIdentity = null;

  function prepareJoinIdentity(guestName, code) {
    if (joinIdentity?.guestName === guestName && joinIdentity?.code === code) return joinIdentity.joinKey;
    const bytes = window.crypto.getRandomValues(new Uint8Array(16));
    const joinKey = Array.from(bytes, value => value.toString(16).padStart(2, "0")).join("");
    joinIdentity = { guestName, code, joinKey };
    return joinKey;
  }

  function clearSavedParticipant() {
    try { window.sessionStorage.removeItem(resumeStorageKey); } catch {}
  }

  function saveParticipant() {
    const session = state.liveSession;
    if (!joinIdentity && (!session?.id || !session.participantId || session.guided !== true)) return;
    // Keep only this tab's access details. Questions, answers and scores always
    // come from the server, including when restoring a finished podium.
    try {
      window.sessionStorage.setItem(resumeStorageKey, JSON.stringify({
        id: session?.id, participantId: session?.participantId,
        guestName: state.guestName, code: state.code, savedAt: Date.now(),
        ...(joinIdentity ? { joinKey: joinIdentity.joinKey } : {})
      }));
    } catch {}
  }

  function restoreParticipant() {
    try {
      const saved = JSON.parse(window.sessionStorage.getItem(resumeStorageKey) || "null");
      if (!saved) return;
      if (![saved.code, saved.guestName].every(value =>
        typeof value === "string" && value.trim() && value.length <= 128
      ) || !Number.isFinite(saved.savedAt) || saved.savedAt > Date.now() || Date.now() - saved.savedAt > 12 * 60 * 60 * 1000) {
        clearSavedParticipant(); return;
      }
      state.guestName = saved.guestName;
      state.code = saved.code;
      if (typeof saved.joinKey === "string" && /^[a-f0-9]{32}$/.test(saved.joinKey)) {
        joinIdentity = { guestName: saved.guestName, code: saved.code, joinKey: saved.joinKey };
      }
      if (![saved.id, saved.participantId].every(value => typeof value === "string" && value && value.length <= 128)) {
        if (!joinIdentity) clearSavedParticipant();
        else state.status = "Pulsa Entrar para recuperar tu entrada pendiente.";
        return;
      }
      state.liveSession = { id: saved.id, participantId: saved.participantId, status: "lobby", _restoring: true };
      state.status = "Recuperando tu participación…";
    } catch { clearSavedParticipant(); }
  }

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
    if (pollBusy || answering || pageClosed || document.hidden || !shouldPoll) return;
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
      const previousAnswered = state.liveSession?.answered === true;
      const previousAnswerIndex = state.liveSession?.currentAnswerIndex;
      const wasRestoring = state.liveSession?._restoring === true;
      state.liveSession = payload.liveSession;
      if (state.liveSession) state.liveSession._receivedAtMs = Date.now();
      saveParticipant();
      retryNotBefore = 0;
      pollDelay = state.liveSession?.status === "active" && state.liveSession?.guided === true ? 2500 : 5000;
      if (state.liveSession?.status === "active") {
        const questionChanged = previousQuestionIndex !== state.liveSession.currentQuestionIndex;
        const revealChanged = previousQuestionClosed !== (state.liveSession.questionClosed === true);
        updateStatus(
          questionChanged && previousStatus === "active"
            ? "Siguiente pregunta."
            : state.liveSession.questionClosed === true
              ? "Pregunta cerrada. Ya puedes revisar la respuesta correcta."
              : state.liveSession.answered === true
                ? "Respuesta guardada. Puedes cambiarla mientras siga abierta."
                : "El test está en curso.",
          "success"
        );
        if (wasRestoring || previousStatus !== "active" || questionChanged || revealChanged || previousAnswered !== (state.liveSession.answered === true) || previousAnswerIndex !== state.liveSession.currentAnswerIndex) {
          render();
          if (questionChanged || previousStatus !== "active" || revealChanged) {
            document.getElementById("publicLiveQuestionForm")?.scrollIntoView?.({ block: "start" });
          }
        }
        const counts = document.getElementById("publicLiveCounts");
        if (counts) counts.textContent = `Respuestas: ${state.liveSession.answeredCount || 0} / ${state.liveSession.activeCount || 0} conectados`;
      } else if (state.liveSession?.status === "finished") {
        stopQuestionCountdown();
        updateStatus("Test finalizado. Consulta el podio final.", "success");
        render();
      } else {
        updateStatus("Sigues en la sala de espera.");
        if (wasRestoring) render();
      }
    } catch (error) {
      if (version !== requestVersion || pageClosed || document.hidden) return;
      updateStatus(error.name === "AbortError" ? "La conexion tarda en responder. Volveremos a intentarlo." : error.message, "error");
      if ([401, 403, 404, 410].includes(error.status)) {
        clearSavedParticipant();
        stopQuestionCountdown();
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
      </section>
    `;
  }

  function renderAttempt() {
    if (!state.liveSession || state.liveSession._restoring || state.result) {
      return "";
    }
    if (String(state.liveSession.status || "") === "lobby") {
      return `
        <section class="test-zone-card test-zone-card-highlight">
          <p class="test-zone-kicker">Sala de espera</p>
          <h3>${escapeHtml(state.liveSession.title || "Test en vivo")}</h3>
          <p class="muted">Código ${escapeHtml(state.liveSession.code)} · ${escapeHtml(state.liveSession.questionCount)} preguntas</p>
          <p><strong>${escapeHtml(state.liveSession.participantName || state.guestName)}</strong>, ya estás dentro.</p>
          <p class="status-note">Espera a que el administrador inicie el test.</p>
          <button type="button" id="publicLiveRefreshButton" class="test-zone-secondary-button">Comprobar si ha comenzado</button>
        </section>
      `;
    }
    if (String(state.liveSession.status || "") === "finished") {
      const podium = Array.isArray(state.liveSession.leaderboard) ? state.liveSession.leaderboard.slice(0, 3) : [];
      const currentRank = state.liveSession.currentRank && typeof state.liveSession.currentRank === "object"
        ? state.liveSession.currentRank
        : null;
      return `
        <section class="test-zone-card test-zone-card-highlight">
          <p class="test-zone-kicker">Test finalizado</p>
          <h3>${escapeHtml(state.liveSession.title || "Test en vivo")}</h3>
          <div class="test-zone-live-list">
            <h4>Podio final</h4>
            ${podium.length
              ? podium.map((row) => `<p><strong>${escapeHtml(row.rank)}. ${escapeHtml(row.name)}</strong> · ${escapeHtml(Number(row.score || 0))} puntos</p>`).join("")
              : '<p class="muted">No hay participantes clasificados.</p>'}
          </div>
          ${currentRank
            ? `<p class="status-note"><strong>Tu posición final:</strong> ${escapeHtml(currentRank.rank)} · ${escapeHtml(Number(currentRank.score || 0))} puntos</p>`
            : ""}
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
      const leaderboard = Array.isArray(state.liveSession.leaderboard) ? state.liveSession.leaderboard : [];
      const currentRank = state.liveSession.currentRank && typeof state.liveSession.currentRank === "object"
        ? state.liveSession.currentRank
        : null;
      const answerResult =
        questionClosed && correctIndex !== null
          ? `<div class="status-note"><strong>Respuesta correcta:</strong> ${escapeHtml(String.fromCharCode(65 + correctIndex))}. ${escapeHtml(question?.options?.[correctIndex] || "")}${
              currentAnswerIndex !== null
                ? `<br><strong>Tu respuesta:</strong> ${escapeHtml(String.fromCharCode(65 + currentAnswerIndex))}. ${escapeHtml(question?.options?.[currentAnswerIndex] || "")} · ${state.liveSession.isCorrect === true ? "Correcta" : "Incorrecta"}`
                : "<br>No enviaste respuesta antes del cierre."
            }<br><strong>Puntos:</strong> +${escapeHtml(Number(state.liveSession.pointsAwarded || 0))} · <strong>Total:</strong> ${escapeHtml(Number(state.liveSession.score || 0))}</div>`
          : "";
      const rankingResult =
        questionClosed && leaderboard.length
          ? `<div class="test-zone-live-list">
              <h4>Clasificación provisional</h4>
              ${leaderboard
                .map((row) => `<p><strong>${escapeHtml(row.rank)}. ${escapeHtml(row.name)}</strong> · ${escapeHtml(Number(row.score || 0))} puntos</p>`)
                .join("")}
              ${currentRank ? `<p class="status-note"><strong>Tu posición:</strong> ${escapeHtml(currentRank.rank)} · ${escapeHtml(Number(currentRank.score || 0))} puntos</p>` : ""}
            </div>`
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
              <p class="muted">Participante: ${escapeHtml(state.liveSession.participantName || state.guestName)}</p>
              <p class="muted">Pregunta ${escapeHtml(questionNumber)} de ${escapeHtml(state.liveSession.questionCount)} · Tiempo: <strong id="publicLiveCountdown">${questionClosed ? "Cerrada" : `${escapeHtml(remainingSeconds)} s`}</strong></p>
              <p class="muted" id="publicLiveCounts">Respuestas: ${escapeHtml(state.liveSession.answeredCount || 0)} / ${escapeHtml(state.liveSession.activeCount || 0)} conectados</p>
              <p class="muted">${escapeHtml(Math.max(0, Number(state.liveSession.questionCount) - questionNumber))} preguntas restantes</p>
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
              <div class="test-zone-option-list" ${questionClosed ? 'hidden' : ''}>
                ${(question.options || [])
                  .map(
                    (option, optionIndex) => `
                      <label class="test-zone-option-row">
                        <input
                          type="radio"
                          name="answerIndex"
                          value="${optionIndex}"
                          ${Number.isInteger(state.liveSession.currentAnswerIndex) && state.liveSession.currentAnswerIndex === optionIndex ? "checked" : ""}
                          ${questionLocked ? "disabled" : ""}
                        />
                        <span class="test-zone-option-badge">${String.fromCharCode(65 + optionIndex)}</span>
                        <span class="test-zone-option-copy">${escapeHtml(option)}</span>
                      </label>
                    `
                  )
                  .join("")}
              </div>
              ${answerResult}
              ${questionClosed && Array.isArray(state.liveSession.answerCounts) ? `<p class="muted">Respuestas: ${state.liveSession.answerCounts.map((count, index) => `${String.fromCharCode(65 + index)}: ${Number(count)}`).join(" · ")}</p>` : ""}
              ${rankingResult}
            </article>
            <div class="test-zone-footer-actions">
              ${questionClosed
                ? `<p class="status-note">Pregunta cerrada. ${state.liveSession.autoAdvance ? "Siguiente paso automático tras 6 segundos de resultados." : "Espera a que el anfitrión continúe."}</p>`
                : remainingSeconds <= 0
                  ? '<p class="status-note">Tiempo agotado. Espera a que se muestre la respuesta correcta.</p>'
                  : answered
                    ? '<p class="status-note">Respuesta guardada. Puedes cambiarla mientras siga abierta.</p>'
                    : ''}
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
      ${state.liveSession ? `<details><summary>Cambiar de sala</summary>${renderJoinForm()}</details>` : renderJoinForm()}
      <p id="publicLiveStatus" aria-live="polite" class="status-note ${state.tone === "error" ? "warning" : ""}">${escapeHtml(state.status)}</p>
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
      if (joining || submitting || answering) return;
      joining = true;
      requestVersion++;
      stopLobbyRefresh();
      stopQuestionCountdown();
      clearSavedParticipant();
      pollBusy = false;
      retryNotBefore = 0;
      pollDelay = 5000;
      const formData = new FormData(joinForm);
      const guestName = String(formData.get("guestName") || "").trim().slice(0, 60).trim();
      const code = String(formData.get("code") || "").trim();
      const resumeId = state.guestName === guestName && state.code === code ? state.liveSession?.participantId : "";
      state.guestName = guestName;
      state.code = code;
      state.liveSession = null;
      state.result = null;
      joinForm.querySelector('button[type="submit"]').disabled = true;
      try {
        const joinKey = prepareJoinIdentity(guestName, code);
        // Persist before sending so a lost join response can be retried safely.
        saveParticipant();
        const payload = await fetchJson("/api/test-zone/live/join", {
          method: "POST",
          headers: resumeId ? { "X-Live-Participant": resumeId } : {},
          body: JSON.stringify({
            guestName: state.guestName,
            code: state.code,
            joinKey
          })
        });
        state.liveSession = payload.liveSession;
        if (state.liveSession) state.liveSession._receivedAtMs = Date.now();
        saveParticipant();
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

    async function saveSelectedAnswer(event) {
      if (event.type === "submit") event.preventDefault();
      if (!state.liveSession || state.result || joining || state.liveSession.questionClosed ||
          getQuestionRemainingSeconds(state.liveSession) <= 0) return;
      const rawAnswerIndex = new FormData(questionForm).get("answerIndex");
      if (rawAnswerIndex === null) return;
      pendingAnswer = { questionId: state.liveSession.currentQuestionId, answerIndex: Number(rawAnswerIndex) };
      if (answering) return;
      answering = true;
      requestVersion++;
      stopLobbyRefresh();
      pollBusy = false;
      updateStatus("Guardando respuesta...");
      try {
        while (pendingAnswer && !state.liveSession.questionClosed) {
          const answer = pendingAnswer;
          pendingAnswer = null;
          if (answer.questionId !== state.liveSession.currentQuestionId) break;
          if (state.liveSession.answered && state.liveSession.currentAnswerIndex === answer.answerIndex) continue;
          const payload = await fetchJson(
            `/api/test-zone/live-sessions/${encodeURIComponent(state.liveSession.id)}/answer`,
            { method: "POST", headers: { "X-Live-Participant": state.liveSession.participantId },
              body: JSON.stringify(answer) }
          );
          state.liveSession = payload.liveSession;
          state.liveSession._receivedAtMs = Date.now();
          saveParticipant();
        }
        state.status = state.liveSession.questionClosed
          ? "Pregunta cerrada. Ya puedes revisar la respuesta correcta."
          : "Respuesta guardada. Puedes cambiarla mientras siga abierta.";
        state.tone = "success";
        render();
        if (state.liveSession.questionClosed) document.getElementById("publicLiveQuestionForm")?.scrollIntoView?.({ block: "start" });
      } catch (error) {
        updateStatus(error.message || "No se pudo guardar la respuesta. Vuelve a tocar una opción.", "error");
      } finally {
        answering = false;
        pendingAnswer = null;
        scheduleLobbyRefresh(2500);
      }
    }
    questionForm?.addEventListener("submit", saveSelectedAnswer);
    questionForm?.addEventListener("click", event => {
      if (event.target?.name === "answerIndex") return saveSelectedAnswer(event);
    });
    questionForm?.addEventListener("change", event => {
      if (event.target?.name === "answerIndex") return saveSelectedAnswer(event);
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
    startQuestionCountdown();
    scheduleLobbyRefresh(0);
  });
  restoreParticipant();
  render();
  if (state.liveSession?._restoring) scheduleLobbyRefresh(0);
})();
