const RESET_PARAM = "reset";

function createElement(tag, attrs = {}, text = "") {
  const element = document.createElement(tag);
  Object.entries(attrs).forEach(([key, value]) => {
    if (key === "class") element.className = value;
    else if (key === "htmlFor") element.htmlFor = value;
    else if (key === "hidden") element.hidden = Boolean(value);
    else element.setAttribute(key, String(value));
  });
  if (text) element.textContent = text;
  return element;
}

function installStyles() {
  if (document.getElementById("passwordRecoveryStyles")) return;
  const style = document.createElement("style");
  style.id = "passwordRecoveryStyles";
  style.textContent = `
    .iz-password-recovery-link {
      border: 0;
      background: transparent;
      padding: .35rem 0;
      margin: .15rem 0 .45rem;
      font: inherit;
      font-weight: 700;
      color: inherit;
      text-decoration: underline;
      text-underline-offset: 3px;
      cursor: pointer;
    }
    .iz-password-recovery-overlay {
      position: fixed;
      inset: 0;
      z-index: 10000;
      display: grid;
      place-items: center;
      padding: 1rem;
      background: rgba(9, 18, 28, .66);
    }
    .iz-password-recovery-overlay[hidden] { display: none; }
    .iz-password-recovery-card {
      width: min(100%, 430px);
      max-height: min(90vh, 680px);
      overflow: auto;
      border-radius: 18px;
      padding: 1.25rem;
      background: #fff;
      color: #17202a;
      box-shadow: 0 22px 70px rgba(0,0,0,.28);
    }
    .iz-password-recovery-head {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 1rem;
      margin-bottom: .75rem;
    }
    .iz-password-recovery-head h2 { margin: 0; font-size: 1.35rem; }
    .iz-password-recovery-close {
      border: 0;
      background: transparent;
      font: inherit;
      font-size: 1.4rem;
      line-height: 1;
      cursor: pointer;
      padding: .15rem .3rem;
    }
    .iz-password-recovery-card p { line-height: 1.45; }
    .iz-password-recovery-card label {
      display: grid;
      gap: .4rem;
      margin: .85rem 0;
      font-weight: 700;
    }
    .iz-password-recovery-card input {
      width: 100%;
      box-sizing: border-box;
      border: 1px solid #b7c0ca;
      border-radius: 10px;
      padding: .8rem .9rem;
      font: inherit;
    }
    .iz-password-recovery-card button[type="submit"],
    .iz-password-recovery-primary {
      width: 100%;
      border: 0;
      border-radius: 10px;
      padding: .85rem 1rem;
      font: inherit;
      font-weight: 800;
      cursor: pointer;
      background: #17202a;
      color: #fff;
    }
    .iz-password-recovery-card button:disabled { opacity: .55; cursor: wait; }
    .iz-password-recovery-status {
      min-height: 1.4em;
      margin: .8rem 0 0;
      font-size: .95rem;
    }
    .iz-password-recovery-status[data-tone="error"] { color: #a32323; }
    .iz-password-recovery-status[data-tone="success"] { color: #176b3a; }
    .iz-password-recovery-help { color: #53606d; font-size: .93rem; }
    .iz-password-recovery-secondary {
      margin-top: .8rem;
      width: 100%;
      border: 1px solid #b7c0ca;
      border-radius: 10px;
      padding: .75rem 1rem;
      background: #fff;
      color: #17202a;
      font: inherit;
      font-weight: 700;
      cursor: pointer;
    }
  `;
  document.head.appendChild(style);
}

function buildModal() {
  const overlay = createElement("div", {
    class: "iz-password-recovery-overlay",
    id: "passwordRecoveryOverlay",
    role: "dialog",
    "aria-modal": "true",
    "aria-labelledby": "passwordRecoveryTitle",
    hidden: true
  });
  const card = createElement("section", { class: "iz-password-recovery-card" });
  const head = createElement("div", { class: "iz-password-recovery-head" });
  const title = createElement("h2", { id: "passwordRecoveryTitle" }, "Recuperar contraseña");
  const close = createElement("button", {
    class: "iz-password-recovery-close",
    type: "button",
    "aria-label": "Cerrar"
  }, "×");
  head.append(title, close);

  const requestPane = createElement("div", { id: "passwordRecoveryRequestPane" });
  requestPane.append(
    createElement("p", {}, "Indica el correo con el que accedes al Portal Socios. Te enviaremos un enlace para crear una nueva contraseña."),
    createElement("p", { class: "iz-password-recovery-help" }, "No enviaremos tu contraseña actual ni la mostraremos en ningún momento.")
  );
  const requestForm = createElement("form", { id: "passwordRecoveryRequestForm" });
  const emailLabel = createElement("label", { htmlFor: "passwordRecoveryEmail" }, "Correo electrónico");
  const emailInput = createElement("input", {
    id: "passwordRecoveryEmail",
    type: "email",
    autocomplete: "email",
    required: true,
    placeholder: "tu@email.com"
  });
  emailLabel.appendChild(emailInput);
  const requestSubmit = createElement("button", { type: "submit" }, "Enviar enlace");
  const requestStatus = createElement("p", {
    class: "iz-password-recovery-status",
    id: "passwordRecoveryRequestStatus",
    role: "status",
    "aria-live": "polite"
  });
  requestForm.append(emailLabel, requestSubmit, requestStatus);
  requestPane.appendChild(requestForm);

  const resetPane = createElement("div", { id: "passwordRecoveryResetPane", hidden: true });
  resetPane.append(
    createElement("p", {}, "Crea una nueva contraseña para tu cuenta."),
    createElement("p", { class: "iz-password-recovery-help" }, "El enlace solo funciona una vez y caduca a los 30 minutos.")
  );
  const resetForm = createElement("form", { id: "passwordRecoveryResetForm" });
  const newLabel = createElement("label", { htmlFor: "passwordRecoveryNew" }, "Nueva contraseña");
  const newInput = createElement("input", {
    id: "passwordRecoveryNew",
    type: "password",
    autocomplete: "new-password",
    minlength: "8",
    required: true
  });
  newLabel.appendChild(newInput);
  const confirmLabel = createElement("label", { htmlFor: "passwordRecoveryConfirm" }, "Repite la nueva contraseña");
  const confirmInput = createElement("input", {
    id: "passwordRecoveryConfirm",
    type: "password",
    autocomplete: "new-password",
    minlength: "8",
    required: true
  });
  confirmLabel.appendChild(confirmInput);
  const resetSubmit = createElement("button", { type: "submit" }, "Guardar nueva contraseña");
  const resetStatus = createElement("p", {
    class: "iz-password-recovery-status",
    id: "passwordRecoveryResetStatus",
    role: "status",
    "aria-live": "polite"
  });
  const backToRequest = createElement("button", {
    class: "iz-password-recovery-secondary",
    id: "passwordRecoveryBackToRequest",
    type: "button",
    hidden: true
  }, "Solicitar un enlace nuevo");
  resetForm.append(newLabel, confirmLabel, resetSubmit, resetStatus, backToRequest);
  resetPane.appendChild(resetForm);

  card.append(head, requestPane, resetPane);
  overlay.appendChild(card);
  document.body.appendChild(overlay);

  return {
    overlay,
    title,
    close,
    requestPane,
    requestForm,
    emailInput,
    requestSubmit,
    requestStatus,
    resetPane,
    resetForm,
    newInput,
    confirmInput,
    resetSubmit,
    resetStatus,
    backToRequest
  };
}

function setStatus(element, message, tone = "") {
  element.textContent = message || "";
  if (tone) element.dataset.tone = tone;
  else delete element.dataset.tone;
}

function cleanResetParam() {
  const url = new URL(window.location.href);
  url.searchParams.delete(RESET_PARAM);
  history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
}

async function installPasswordRecoveryUi() {
  const loginForm = document.getElementById("loginForm");
  if (!loginForm || document.getElementById("passwordRecoveryLink")) return;

  installStyles();
  const ui = buildModal();
  const link = createElement("button", {
    id: "passwordRecoveryLink",
    class: "iz-password-recovery-link",
    type: "button"
  }, "¿Has olvidado tu contraseña?");
  // Keep password recovery beside the sign-in action, before the secondary routes.
  const submitRow = loginForm.querySelector(".chip-row");
  if (submitRow) {
    submitRow.insertAdjacentElement("afterend", link);
  } else {
    loginForm.appendChild(link);
  }

  let activeToken = "";

  function showRequest() {
    activeToken = "";
    ui.title.textContent = "Recuperar contraseña";
    ui.requestPane.hidden = false;
    ui.resetPane.hidden = true;
    ui.backToRequest.hidden = true;
    setStatus(ui.requestStatus, "");
    const loginEmail = document.getElementById("loginEmail");
    if (!ui.emailInput.value && loginEmail?.value) ui.emailInput.value = loginEmail.value;
    ui.overlay.hidden = false;
    queueMicrotask(() => ui.emailInput.focus());
  }

  async function showReset(token) {
    activeToken = token;
    ui.title.textContent = "Crear nueva contraseña";
    ui.requestPane.hidden = true;
    ui.resetPane.hidden = false;
    ui.backToRequest.hidden = true;
    ui.resetSubmit.disabled = true;
    setStatus(ui.resetStatus, "Comprobando enlace...");
    ui.overlay.hidden = false;

    try {
      const response = await fetch(`/api/password-recovery/validate?token=${encodeURIComponent(token)}`, {
        method: "GET",
        credentials: "same-origin",
        headers: { Accept: "application/json" }
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload.valid) {
        setStatus(ui.resetStatus, "Este enlace ha caducado o ya se ha utilizado.", "error");
        ui.backToRequest.hidden = false;
        return;
      }
      ui.resetSubmit.disabled = false;
      setStatus(ui.resetStatus, "");
      queueMicrotask(() => ui.newInput.focus());
    } catch {
      setStatus(ui.resetStatus, "No se ha podido comprobar el enlace. Inténtalo de nuevo.", "error");
      ui.backToRequest.hidden = false;
    }
  }

  function closeModal() {
    ui.overlay.hidden = true;
  }

  link.addEventListener("click", showRequest);
  ui.close.addEventListener("click", closeModal);
  ui.overlay.addEventListener("click", (event) => {
    if (event.target === ui.overlay) closeModal();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !ui.overlay.hidden) closeModal();
  });

  ui.requestForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    ui.requestSubmit.disabled = true;
    setStatus(ui.requestStatus, "Enviando enlace...");
    try {
      const response = await fetch("/api/password-recovery/request", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ email: ui.emailInput.value.trim() })
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "No se pudo procesar la solicitud.");
      setStatus(ui.requestStatus, payload.message || "Si existe una cuenta con ese correo, recibirás un enlace.", "success");
    } catch (error) {
      setStatus(ui.requestStatus, error.message || "No se pudo procesar la solicitud.", "error");
    } finally {
      ui.requestSubmit.disabled = false;
    }
  });

  ui.resetForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!activeToken) return;
    if (ui.newInput.value !== ui.confirmInput.value) {
      setStatus(ui.resetStatus, "Las contraseñas no coinciden.", "error");
      return;
    }
    ui.resetSubmit.disabled = true;
    setStatus(ui.resetStatus, "Actualizando contraseña...");
    try {
      const response = await fetch("/api/password-recovery/reset", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          token: activeToken,
          newPassword: ui.newInput.value,
          confirmPassword: ui.confirmInput.value
        })
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "No se pudo actualizar la contraseña.");
      activeToken = "";
      ui.newInput.value = "";
      ui.confirmInput.value = "";
      cleanResetParam();
      setStatus(ui.resetStatus, payload.message || "Contraseña actualizada. Ya puedes iniciar sesión.", "success");
      ui.resetSubmit.hidden = true;
      ui.backToRequest.hidden = true;
      const done = createElement("button", {
        class: "iz-password-recovery-secondary",
        type: "button"
      }, "Volver al acceso");
      done.addEventListener("click", () => {
        closeModal();
        document.getElementById("loginPassword")?.focus();
      }, { once: true });
      ui.resetForm.appendChild(done);
    } catch (error) {
      setStatus(ui.resetStatus, error.message || "No se pudo actualizar la contraseña.", "error");
      ui.resetSubmit.disabled = false;
      if (/caducado|utilizado/i.test(String(error.message || ""))) ui.backToRequest.hidden = false;
    }
  });

  ui.backToRequest.addEventListener("click", () => {
    cleanResetParam();
    showRequest();
  });

  const tokenFromUrl = new URL(window.location.href).searchParams.get(RESET_PARAM);
  if (tokenFromUrl) await showReset(tokenFromUrl);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", installPasswordRecoveryUi, { once: true });
} else {
  installPasswordRecoveryUi();
}
