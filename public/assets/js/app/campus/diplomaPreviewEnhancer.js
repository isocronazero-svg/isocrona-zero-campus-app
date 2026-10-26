let installed = false;
let observer = null;
let isAdmin = false;
let selectedCourseId = "";
let coursesById = new Map();

function clean(value) {
  return String(value || "").trim();
}

function numberValue(id, fallback = 0) {
  const element = document.getElementById(id);
  const value = Number(element?.value);
  return Number.isFinite(value) && value >= 0 ? value : Number(fallback || 0);
}

function value(id, fallback = "") {
  const element = document.getElementById(id);
  return element ? clean(element.value) : clean(fallback);
}

function listFromTextarea(id, fallback = []) {
  const element = document.getElementById(id);
  if (!element) return Array.isArray(fallback) ? fallback : [];
  return String(element.value || "").split(/\r?\n/).map(clean).filter(Boolean);
}

function rememberState(payload) {
  if (!payload || typeof payload !== "object") return;
  isAdmin = payload.role === "admin";
  if (!isAdmin) {
    coursesById = new Map();
    selectedCourseId = "";
    return;
  }
  selectedCourseId = clean(payload.selectedCourseId || selectedCourseId);
  coursesById = new Map((Array.isArray(payload.courses) ? payload.courses : []).map((course) => [course.id, course]));
}

function trackCourseSelection(event) {
  const target = event.target?.closest?.("[data-course-id]");
  const id = clean(target?.dataset?.courseId);
  if (id) selectedCourseId = id;
}

function buildEditDraft() {
  const base = coursesById.get(selectedCourseId) || {};
  return {
    ...base,
    id: clean(base.id || selectedCourseId || "preview-course"),
    title: value("editCourseTitle", base.title || "NOMBRE DEL CURSO"),
    startDate: value("editCourseStart", base.startDate),
    endDate: value("editCourseEnd", base.endDate),
    hours: numberValue("editCourseHours", base.hours),
    diplomaTemplate: value("editCourseDiploma", base.diplomaTemplate || "Aprovechamiento"),
    certificateCity: value("editCourseCertificateCity", base.certificateCity),
    certificateContents: listFromTextarea("editCourseCertificateContents", base.certificateContents),
    objectives: listFromTextarea("editCourseObjectives", base.objectives),
    modules: Array.isArray(base.modules) ? base.modules : []
  };
}

function buildCreateDraft() {
  const intensive = value("courseCreationMode") === "intensive";
  const intensiveChoice = value("intensiveDayTitle");
  const intensiveTitle = intensiveChoice === "__custom" ? value("intensiveDayCustomTitle") : intensiveChoice;
  const startDate = intensive ? value("intensiveDayDate") : value("courseStart");
  return {
    id: "preview-new-course",
    title: intensive ? intensiveTitle || "JORNADA FORMATIVA" : value("courseTitle") || "NOMBRE DEL CURSO",
    startDate,
    endDate: intensive ? startDate : value("courseEnd"),
    hours: numberValue("courseHours", 0),
    diplomaTemplate: "Aprovechamiento",
    certificateCity: "",
    certificateContents: [],
    objectives: [],
    modules: []
  };
}

function ensureDialog() {
  let dialog = document.getElementById("diplomaPreviewDialog");
  if (dialog) return dialog;
  const style = document.createElement("style");
  style.id = "diplomaPreviewStyles";
  style.textContent = `
    #diplomaPreviewDialog{width:min(1200px,98vw);height:min(900px,94vh);max-width:none;max-height:none;border:0;border-radius:18px;padding:0;overflow:hidden;background:#f2f3f5}
    #diplomaPreviewDialog::backdrop{background:rgba(0,0,0,.58)}
    .diploma-preview-shell{display:grid;grid-template-rows:auto 1fr;height:100%}
    .diploma-preview-toolbar{display:flex;gap:10px;justify-content:space-between;align-items:center;padding:10px 14px;background:white;border-bottom:1px solid rgba(127,127,127,.25)}
    .diploma-preview-frame{width:100%;height:100%;border:0;background:#e8eaed}
    @media(max-width:600px){#diplomaPreviewDialog{width:100vw;height:100vh;max-width:100vw;max-height:100vh;border-radius:0}}
  `;
  document.head.append(style);
  dialog = document.createElement("dialog");
  dialog.id = "diplomaPreviewDialog";
  dialog.innerHTML = `
    <div class="diploma-preview-shell">
      <div class="diploma-preview-toolbar"><div><strong>Vista previa del diploma</strong><div class="muted">No emite certificados ni guarda histórico.</div></div><button type="button" class="ghost-button" data-diploma-preview-close>Cerrar</button></div>
      <iframe class="diploma-preview-frame" title="Vista previa del diploma"></iframe>
    </div>
  `;
  dialog.querySelector("[data-diploma-preview-close]")?.addEventListener("click", () => dialog.close());
  document.body.append(dialog);
  return dialog;
}

async function openPreview(course) {
  const dialog = ensureDialog();
  const frame = dialog.querySelector("iframe");
  frame.srcdoc = '<!doctype html><html><body style="font-family:Arial;padding:24px">Generando vista previa…</body></html>';
  if (!dialog.open) dialog.showModal();
  try {
    const response = await fetch("/api/admin/diploma-preview", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "text/html" },
      body: JSON.stringify({ course })
    });
    const html = await response.text();
    if (!response.ok) {
      let message = "No se pudo generar la vista previa";
      try { message = JSON.parse(html).error || message; } catch {}
      throw new Error(message);
    }
    frame.srcdoc = html.replace("<head>", `<head><base href="${window.location.origin}/">`);
  } catch (error) {
    frame.srcdoc = `<!doctype html><html><body style="font-family:Arial;padding:24px"><h3>No se pudo generar la vista previa</h3><p>${String(error.message || error).replace(/[<>&]/g, "")}</p></body></html>`;
  }
}

function addPreviewButton(form, mode) {
  if (!form || form.dataset.diplomaPreviewEnhanced === "true" || !isAdmin) return;
  const submit = form.querySelector('button[type="submit"], input[type="submit"]');
  if (!submit) return;
  const button = document.createElement("button");
  button.type = "button";
  button.className = "ghost-button";
  button.dataset.diplomaPreview = mode;
  button.textContent = "Previsualizar diploma";
  button.addEventListener("click", () => openPreview(mode === "edit" ? buildEditDraft() : buildCreateDraft()));
  submit.before(button);
  form.dataset.diplomaPreviewEnhanced = "true";
}

function enhanceForms() {
  if (!isAdmin) return;
  addPreviewButton(document.getElementById("courseForm"), "create");
  addPreviewButton(document.getElementById("courseEditForm"), "edit");
}

async function rememberStateResponse(response, target) {
  if (!response?.ok || target.pathname !== "/api/state") return response;
  try {
    rememberState(await response.clone().json());
    queueMicrotask(enhanceForms);
  } catch {
    // Do not disturb the main state request.
  }
  return response;
}

export function installDiplomaPreviewEnhancer() {
  if (installed || typeof window === "undefined" || typeof document === "undefined") return;
  installed = true;
  const baseFetch = window.fetch.bind(window);
  window.fetch = async (input, init = {}) => {
    let target;
    try {
      const raw = typeof input === "string" ? input : input?.url || String(input || "");
      target = new URL(raw, window.location.href);
    } catch {
      return baseFetch(input, init);
    }
    const response = await baseFetch(input, init);
    return target.origin === window.location.origin ? rememberStateResponse(response, target) : response;
  };
  document.addEventListener("click", trackCourseSelection, true);
  enhanceForms();
  if (typeof MutationObserver !== "undefined") {
    observer = new MutationObserver(enhanceForms);
    observer.observe(document.body, { childList: true, subtree: true });
  }
}
