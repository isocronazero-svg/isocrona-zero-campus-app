const applicationTokenInput = document.getElementById("applicationToken");
const loadApplicationButton = document.getElementById("loadApplicationButton");
const applicationStatus = document.getElementById("applicationStatus");
const applicationDetail = document.getElementById("applicationDetail");

let currentApplication = null;
let currentToken = "";

bootstrap();

loadApplicationButton.addEventListener("click", async () => {
  const token = extractToken(applicationTokenInput.value.trim());
  if (!token) {
    applicationStatus.textContent = "Introduce un token o abre esta pagina desde el enlace recibido.";
    return;
  }

  await loadApplication(token);
});

document.addEventListener("submit", async (event) => {
  if (event.target.id !== "applicationReplyForm") {
    return;
  }

  event.preventDefault();
  if (!currentApplication || !currentToken) {
    return;
  }

  applicationStatus.textContent = "Enviando documentacion...";

  const replyDocumentFile = await readFileInput(document.getElementById("applicationReplyDocument"));
  const replyDocumentFile2 = await readFileInput(document.getElementById("applicationReplyDocument2"));
  const payload = {
    note: document.getElementById("applicationReplyNote").value.trim(),
    replyDocumentFile,
    replyDocumentFile2
  };

  try {
    const response = await fetch(`/api/associates/applications/public/${encodeURIComponent(currentToken)}/reply`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const result = await response.json();
    if (!response.ok || result.ok === false) {
      throw new Error(result.error || "No se pudo registrar la respuesta");
    }

    applicationStatus.textContent = result.message || "Documentacion recibida correctamente.";
    currentApplication = result.application;
    renderApplication();
  } catch (error) {
    applicationStatus.textContent = error.message || "No se pudo registrar la documentacion";
  }
});

async function bootstrap() {
  const tokenFromUrl = new URLSearchParams(window.location.search).get("token") || "";
  if (tokenFromUrl) {
    applicationTokenInput.value = tokenFromUrl;
    await loadApplication(tokenFromUrl);
  }
}

async function loadApplication(token) {
  applicationStatus.textContent = "Cargando solicitud...";
  try {
    const response = await fetch(`/api/associates/applications/public/${encodeURIComponent(token)}`);
    const result = await response.json();
    if (!response.ok || result.ok === false) {
      throw new Error(result.error || "No se ha encontrado la solicitud");
    }

    currentToken = token;
    currentApplication = result.application;
    applicationTokenInput.value = token;
    applicationStatus.textContent = `Solicitud cargada. Estado actual: ${currentApplication.status}.`;
    renderApplication();
  } catch (error) {
    currentToken = "";
    currentApplication = null;
    applicationDetail.innerHTML = "";
    applicationStatus.textContent = error.message || "No se ha podido cargar la solicitud";
  }
}

function renderApplication() {
  if (!currentApplication) {
    applicationDetail.innerHTML = "";
    return;
  }

  const canReply = currentApplication.status === "Pendiente de documentacion";
  const statusLabel = getApplicationStatusLabel(currentApplication.status);
  const nextStepLabel = getApplicationNextStep(currentApplication);
  const replyDocuments = Array.isArray(currentApplication.applicantReplyDocuments)
    ? currentApplication.applicantReplyDocuments
    : [];

  applicationDetail.innerHTML = `
    <div class="course-grid">
      <div class="metric-card">
        <span class="muted">Estado de tu alta</span>
        <strong>${escapeHtml(statusLabel)}</strong>
        <p class="muted">${escapeHtml(nextStepLabel)}</p>
      </div>
      <div class="metric-card">
        <span class="muted">Ultimo movimiento</span>
        <strong>${escapeHtml(formatDateTime(currentApplication.applicantReplyAt || currentApplication.infoRequestedAt || currentApplication.submittedAt))}</strong>
        <p class="muted">${escapeHtml(currentApplication.infoRequestedAt ? "La solicitud ya tiene una revision activa." : "Tu solicitud sigue su curso normal de revision.")}</p>
      </div>
    </div>

    <div class="course-grid">
      <div class="mail-card">
        <p class="eyebrow">Solicitud</p>
        <h3 style="margin: 0 0 8px;">${escapeHtml(getApplicantName(currentApplication))}</h3>
        <p>${escapeHtml(currentApplication.email)} | ${escapeHtml(currentApplication.phone)}</p>
        <p>Servicio: ${escapeHtml(currentApplication.service || "-")}</p>
        <p>Enviada: ${escapeHtml(formatDateTime(currentApplication.submittedAt))}</p>
        <p><strong>Estado actual:</strong> ${escapeHtml(statusLabel)}</p>
      </div>

      <div class="mail-card">
        <p class="eyebrow">Revision</p>
        <h3 style="margin: 0 0 8px;">Situacion administrativa</h3>
        <p>Acuse: ${escapeHtml(currentApplication.receiptEmailStatus || "pending")}</p>
        <p>Subsanacion: ${escapeHtml(currentApplication.infoRequestEmailStatus || "pending")}</p>
        <p>Acuse de tu respuesta: ${escapeHtml(currentApplication.applicantReplyReceiptStatus || "pending")}</p>
        <p>Resolucion: ${escapeHtml(currentApplication.decisionEmailStatus || "pending")}</p>
        ${
          currentApplication.infoRequestedAt
            ? `<p class="muted">Ultima peticion: ${escapeHtml(formatDateTime(currentApplication.infoRequestedAt))}</p>`
            : `<p class="muted">Todavia no hay una peticion de subsanacion registrada.</p>`
        }
      </div>
    </div>

    <div class="mail-card">
      <p class="eyebrow">Pendiente de subsanacion</p>
      <h3 style="margin: 0 0 8px;">Lo que administracion necesita</h3>
      ${
        currentApplication.infoRequestMessage
          ? `<p>${escapeHtml(currentApplication.infoRequestMessage)}</p>`
          : `<p class="muted">No hay una peticion abierta ahora mismo.</p>`
      }
      ${
        currentApplication.infoRequestedBy
          ? `<p class="muted">Gestionado por: ${escapeHtml(currentApplication.infoRequestedBy)}</p>`
          : ""
      }
    </div>

    <div class="mail-card">
      <p class="eyebrow">Tu ultima respuesta</p>
      <h3 style="margin: 0 0 8px;">Aclaraciones y documentos aportados</h3>
      ${
        currentApplication.applicantReplyAt
          ? `<p>Recibida: ${escapeHtml(formatDateTime(currentApplication.applicantReplyAt))}</p>`
          : `<p class="muted">Todavia no has aportado documentacion adicional desde este portal.</p>`
      }
      ${
        currentApplication.applicantReplyReceiptSentAt
          ? `<p class="muted">Acuse enviado: ${escapeHtml(formatDateTime(currentApplication.applicantReplyReceiptSentAt))}</p>`
          : ""
      }
      ${
        currentApplication.applicantReplyNote
          ? `<p>${escapeHtml(currentApplication.applicantReplyNote)}</p>`
          : ""
      }
      ${
        replyDocuments.length
          ? `<p>Documentos registrados:<br />${replyDocuments.map((file) => `<span class="small-chip">${escapeHtml(file)}</span>`).join(" ")}</p>`
          : ""
      }
    </div>

    ${
      canReply
        ? `
          <form id="applicationReplyForm" class="mail-card stack">
            <p class="eyebrow">Responder ahora</p>
            <h3 style="margin: 0;">Aporta la documentacion o aclaracion solicitada</h3>
            <label class="inline-field">
              Aclaracion
              <textarea id="applicationReplyNote" placeholder="Describe aqui la aclaracion o los documentos que estas aportando"></textarea>
            </label>
            <div class="course-grid">
              <label class="inline-field">
                Documento 1
                <input id="applicationReplyDocument" type="file" accept=".pdf,image/*" />
              </label>
              <label class="inline-field">
                Documento 2
                <input id="applicationReplyDocument2" type="file" accept=".pdf,image/*" />
              </label>
            </div>
            <div class="chip-row">
              <button class="primary-button" type="submit">Enviar documentacion</button>
            </div>
          </form>
        `
        : `
          <div class="mail-card">
            <p class="eyebrow">Siguiente paso</p>
            <p class="muted">${escapeHtml(nextStepLabel)}</p>
          </div>
        `
    }
  `;
}

function getApplicantName(application) {
  return [application.firstName, application.lastName].filter(Boolean).join(" ");
}

function formatDateTime(value) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("es-ES", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(date);
}

async function readFileInput(input) {
  const file = input.files && input.files[0];
  if (!file) {
    return null;
  }

  const contentBase64 = await readFileAsBase64(file);
  return {
    name: file.name,
    type: file.type,
    size: file.size,
    contentBase64
  };
}

function readFileAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || "");
      resolve(result.includes(",") ? result.split(",")[1] : result);
    };
    reader.onerror = () => reject(new Error("No se pudo leer el archivo seleccionado"));
    reader.readAsDataURL(file);
  });
}

function extractToken(value) {
  if (!value) {
    return "";
  }

  try {
    const maybeUrl = new URL(value);
    return maybeUrl.searchParams.get("token") || value;
  } catch (error) {
    return value;
  }
}

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function getApplicationStatusLabel(status) {
  switch (status) {
    case "Pendiente de revision":
      return "Pendiente de revision administrativa";
    case "Pendiente de documentacion":
      return "Pendiente de documentacion";
    case "Aprobada":
      return "Aprobada";
    case "Rechazada":
      return "Cerrada sin aprobacion";
    default:
      return status || "Pendiente";
  }
}

function getApplicationNextStep(application) {
  switch (application.status) {
    case "Pendiente de revision":
      return "Tu solicitud ya esta en revision administrativa. Si hace falta algo mas, te lo pediremos por este mismo portal y por correo.";
    case "Pendiente de documentacion":
      return "Administracion ha pedido una subsanacion. Puedes responder ahora mismo desde esta misma pagina.";
    case "Aprobada":
      return "Tu solicitud ya esta aprobada. Revisa tambien el correo de bienvenida al campus para acceder.";
    case "Rechazada":
      return "La solicitud ya tiene una resolucion registrada. Si necesitas aclarar algo, responde al correo recibido.";
    default:
      return "Tu solicitud sigue en proceso de revision.";
  }
}
