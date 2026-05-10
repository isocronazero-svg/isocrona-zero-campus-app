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

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  async function fetchJson(url, options = {}) {
    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {})
      },
      ...options
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || payload?.ok === false) {
      throw new Error(payload?.error || "No se pudo completar la operación");
    }
    return payload;
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
        <p class="status-note ${state.tone === "error" ? "warning" : ""}">${escapeHtml(state.status)}</p>
      </section>
    `;
  }

  function renderAttempt() {
    if (!state.liveSession) {
      return "";
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
    const attemptForm = document.getElementById("publicLiveAttemptForm");

    joinForm?.addEventListener("submit", async (event) => {
      event.preventDefault();
      const formData = new FormData(joinForm);
      state.guestName = String(formData.get("guestName") || "").trim();
      state.code = String(formData.get("code") || "").trim();
      try {
        const payload = await fetchJson("/api/test-zone/live/join", {
          method: "POST",
          body: JSON.stringify({
            guestName: state.guestName,
            code: state.code
          })
        });
        state.liveSession = payload.liveSession;
        state.result = null;
        state.status = "Acceso concedido. Completa el test y finaliza para guardar tu resultado.";
        state.tone = "success";
      } catch (error) {
        state.status = error.message || "No se pudo entrar al test en vivo.";
        state.tone = "error";
      }
      render();
    });

    attemptForm?.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (!state.liveSession) {
        return;
      }
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
      } catch (error) {
        state.status = error.message || "No se pudo guardar el resultado.";
        state.tone = "error";
      }
      render();
    });
  }

  render();
})();
