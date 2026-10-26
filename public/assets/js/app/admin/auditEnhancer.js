let installed = false;
let observer = null;
let isAdmin = false;
let auditFilters = { user: "", module: "", action: "", entity: "", courseId: "" };
let knownCourses = [];

function clean(value) {
  return String(value || "").trim();
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function pretty(value) {
  if (value === null || value === undefined) return "—";
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function rememberState(payload) {
  if (!payload || typeof payload !== "object") return;
  isAdmin = payload.role === "admin";
  knownCourses = isAdmin && Array.isArray(payload.courses)
    ? payload.courses.map((course) => ({ id: clean(course.id), title: clean(course.title || "Curso") })).filter((course) => course.id)
    : [];
}

function ensureStyles() {
  if (document.getElementById("auditLogStyles")) return;
  const style = document.createElement("style");
  style.id = "auditLogStyles";
  style.textContent = `
    #auditLogDialog{width:min(1180px,96vw);max-height:92vh;border:0;border-radius:18px;padding:0;overflow:hidden}
    #auditLogDialog::backdrop{background:rgba(0,0,0,.55)}
    .audit-shell{padding:20px;overflow:auto;max-height:92vh}
    .audit-head{display:flex;gap:12px;align-items:flex-start;justify-content:space-between;flex-wrap:wrap}
    .audit-filters{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:10px;margin:14px 0}
    .audit-list{display:grid;gap:10px}
    .audit-row{padding:14px;border:1px solid rgba(127,127,127,.25);border-radius:14px}
    .audit-row-head{display:flex;gap:10px;justify-content:space-between;align-items:flex-start;flex-wrap:wrap}
    .audit-meta{display:flex;gap:6px;flex-wrap:wrap;margin-top:8px}
    .audit-diff{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:10px}
    .audit-diff pre{white-space:pre-wrap;word-break:break-word;font-size:.8rem;max-height:300px;overflow:auto;margin:6px 0 0}
    @media(max-width:700px){#auditLogDialog{width:100vw;max-width:100vw;max-height:100vh;height:100vh;border-radius:0}.audit-shell{max-height:100vh;padding:14px}.audit-diff{grid-template-columns:1fr}}
  `;
  document.head.append(style);
}

function ensureDialog() {
  let dialog = document.getElementById("auditLogDialog");
  if (dialog) return dialog;
  ensureStyles();
  dialog = document.createElement("dialog");
  dialog.id = "auditLogDialog";
  dialog.innerHTML = '<div class="audit-shell"><p class="muted">Cargando auditoría…</p></div>';
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
  });
  document.body.append(dialog);
  return dialog;
}

function ensureButton() {
  const existing = document.getElementById("auditLogNavButton");
  if (!isAdmin) {
    existing?.remove();
    return;
  }
  if (existing) return;
  const nav = document.getElementById("nav");
  if (!nav) return;
  const button = document.createElement("button");
  button.type = "button";
  button.id = "auditLogNavButton";
  button.className = "ghost-button";
  button.textContent = "Auditoría";
  button.addEventListener("click", openAuditDialog);
  nav.append(button);
}

async function requestAudit() {
  const params = new URLSearchParams({ limit: "250" });
  Object.entries(auditFilters).forEach(([key, value]) => {
    if (clean(value)) params.set(key, clean(value));
  });
  const response = await fetch(`/api/audit-log?${params.toString()}`, { headers: { Accept: "application/json" } });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload.ok === false) throw new Error(payload.error || "No se pudo cargar la auditoría");
  return payload;
}

function actionLabel(action) {
  const labels = {
    "validate-payment": "Pago validado",
    "mark-payment-incident": "Incidencia de pago",
    "reset-payment-pending": "Pago devuelto a pendiente",
    "create-reservation": "Reserva creada",
    "release-reservation": "Reserva liberada"
  };
  return labels[action] || action || "Cambio";
}

function renderAudit(payload) {
  const dialog = ensureDialog();
  const events = Array.isArray(payload.events) ? payload.events : [];
  const modules = [...new Set(events.map((event) => clean(event.module)).filter(Boolean))].sort();
  const actions = [...new Set(events.map((event) => clean(event.action)).filter(Boolean))].sort();
  dialog.querySelector(".audit-shell").innerHTML = `
    <div class="audit-head">
      <div>
        <p class="eyebrow">Administración</p>
        <h3>Registro de auditoría</h3>
        <p class="muted">Quién cambió qué, cuándo y cuál era el valor anterior. Las credenciales y datos sensibles se excluyen o redactan.</p>
      </div>
      <button type="button" class="ghost-button" data-audit-close>Cerrar</button>
    </div>
    <form class="audit-filters" data-audit-form>
      <label class="inline-field">Usuario<input name="user" type="search" value="${escapeHtml(auditFilters.user)}" placeholder="Nombre o cuenta" /></label>
      <label class="inline-field">Módulo<select name="module"><option value="">Todos</option>${modules.map((module) => `<option value="${escapeHtml(module)}" ${module === auditFilters.module ? "selected" : ""}>${escapeHtml(module)}</option>`).join("")}</select></label>
      <label class="inline-field">Acción<select name="action"><option value="">Todas</option>${actions.map((action) => `<option value="${escapeHtml(action)}" ${action === auditFilters.action ? "selected" : ""}>${escapeHtml(actionLabel(action))}</option>`).join("")}</select></label>
      <label class="inline-field">Curso<select name="courseId"><option value="">Todos</option>${knownCourses.map((course) => `<option value="${escapeHtml(course.id)}" ${course.id === auditFilters.courseId ? "selected" : ""}>${escapeHtml(course.title)}</option>`).join("")}</select></label>
      <label class="inline-field">Elemento<input name="entity" type="search" value="${escapeHtml(auditFilters.entity)}" placeholder="Socio, curso, pago…" /></label>
      <div class="chip-row"><button type="submit" class="primary-button">Filtrar</button><button type="button" class="ghost-button" data-audit-clear>Limpiar</button></div>
    </form>
    <p class="muted">Mostrando ${events.length} evento(s) · ${Number(payload.totalStored || 0)} almacenados.</p>
    <div class="audit-list">
      ${events.length ? events.map((event) => `
        <article class="audit-row">
          <div class="audit-row-head">
            <div><strong>${escapeHtml(actionLabel(event.action))}</strong><div class="muted">${escapeHtml(event.entityLabel || event.entityId || event.entityType || "Elemento")}</div></div>
            <time class="muted">${escapeHtml(event.at ? new Date(event.at).toLocaleString("es-ES") : "")}</time>
          </div>
          <div class="audit-meta">
            <span class="small-chip">${escapeHtml(event.actor?.name || "Sistema")}</span>
            <span class="small-chip">${escapeHtml(event.actor?.role || "")}</span>
            <span class="small-chip">${escapeHtml(event.module || "general")}</span>
            <span class="small-chip">${escapeHtml(event.result || "success")}</span>
          </div>
          ${(event.before !== null || event.after !== null) ? `<details><summary>Ver cambios</summary><div class="audit-diff"><div><strong>Antes</strong><pre>${escapeHtml(pretty(event.before))}</pre></div><div><strong>Después</strong><pre>${escapeHtml(pretty(event.after))}</pre></div></div></details>` : ""}
        </article>
      `).join("") : '<div class="empty-state">No hay eventos que coincidan con los filtros.</div>'}
    </div>
  `;
  dialog.querySelector("[data-audit-close]")?.addEventListener("click", () => dialog.close());
  dialog.querySelector("[data-audit-clear]")?.addEventListener("click", async () => {
    auditFilters = { user: "", module: "", action: "", entity: "", courseId: "" };
    await refreshAudit();
  });
  dialog.querySelector("[data-audit-form]")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    auditFilters = {
      user: clean(data.get("user")),
      module: clean(data.get("module")),
      action: clean(data.get("action")),
      entity: clean(data.get("entity")),
      courseId: clean(data.get("courseId"))
    };
    await refreshAudit();
  });
}

async function refreshAudit() {
  const dialog = ensureDialog();
  try {
    renderAudit(await requestAudit());
  } catch (error) {
    dialog.querySelector(".audit-shell").innerHTML = `<div class="status-note warning">${escapeHtml(error.message || "No se pudo cargar la auditoría")}</div><button class="ghost-button" type="button" data-audit-close>Cerrar</button>`;
    dialog.querySelector("[data-audit-close]")?.addEventListener("click", () => dialog.close());
  }
}

async function openAuditDialog() {
  const dialog = ensureDialog();
  if (!dialog.open) dialog.showModal();
  dialog.querySelector(".audit-shell").innerHTML = '<p class="muted">Cargando auditoría…</p>';
  await refreshAudit();
}

async function rememberStateResponse(response, target) {
  if (!response?.ok || target.pathname !== "/api/state") return response;
  try {
    const payload = await response.clone().json();
    rememberState(payload);
    queueMicrotask(ensureButton);
  } catch {
    // Keep state loading unaffected if the enhancer cannot inspect the response.
  }
  return response;
}

export function installAuditEnhancer() {
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
  ensureButton();
  if (typeof MutationObserver !== "undefined") {
    observer = new MutationObserver(ensureButton);
    observer.observe(document.body, { childList: true, subtree: true });
  }
}
