let installed = false;
let observer = null;
let latestState = null;
let selectedAssociateId = "";
let financeAvailable = false;
let financeFilter = "pending";
let selectedFinanceCourseId = "all";

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

function formatMoney(value) {
  const amount = Number(value || 0);
  if (amount <= 0) return "Sin coste";
  return new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(amount);
}

function rememberState(payload) {
  if (!payload || typeof payload !== "object") return;
  latestState = payload;
  selectedAssociateId = clean(payload.selectedAssociateId || selectedAssociateId);
  const ownAssociate = (payload.associates || []).find((item) => item.id === payload.selectedAssociateId) || null;
  financeAvailable = payload.role === "admin" || ownAssociate?.treasuryEnabled === true;
}

function trackAssociateSelection(event) {
  const target = event.target?.closest?.("[data-associate-id]");
  const id = clean(target?.dataset?.associateId);
  if (id) selectedAssociateId = id;
}

function selectedAssociate() {
  return (latestState?.associates || []).find((item) => item.id === selectedAssociateId) || null;
}

function enhanceAssociateForm() {
  const form = document.getElementById("associateEditForm");
  if (!form || form.dataset.treasuryEnhanced === "true") return;
  const instructorInput = form.querySelector("#editAssociateInstructorEnabled");
  const anchor = instructorInput?.closest("label") || form.querySelector("#editAssociateAccountRole")?.closest("label");
  if (!anchor) return;
  const associate = selectedAssociate();
  const label = document.createElement("label");
  label.className = "inline-field";
  label.innerHTML = `
    <span><input id="editAssociateTreasuryEnabled" type="checkbox" ${associate?.treasuryEnabled === true ? "checked" : ""} /> Responsable de tesorería</span>
    <span class="field-hint">Puede revisar y validar pagos de cursos sin recibir permisos generales de administración.</span>
  `;
  anchor.after(label);
  form.dataset.treasuryEnhanced = "true";
}

function ensureFinanceStyles() {
  if (document.getElementById("courseFinanceStyles")) return;
  const style = document.createElement("style");
  style.id = "courseFinanceStyles";
  style.textContent = `
    #courseFinanceDialog{width:min(1100px,96vw);max-height:92vh;border:0;border-radius:18px;padding:0;overflow:hidden}
    #courseFinanceDialog::backdrop{background:rgba(0,0,0,.55)}
    .course-finance-shell{padding:20px;overflow:auto;max-height:92vh}
    .course-finance-head{display:flex;gap:12px;align-items:flex-start;justify-content:space-between;flex-wrap:wrap}
    .course-finance-metrics{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:10px;margin:14px 0}
    .course-finance-metric{padding:12px;border:1px solid rgba(127,127,127,.25);border-radius:12px}
    .course-finance-toolbar{display:flex;gap:8px;flex-wrap:wrap;align-items:end;margin:12px 0}
    .course-finance-toolbar label{min-width:220px;flex:1}
    .course-finance-list{display:grid;gap:10px}
    .course-finance-row{padding:14px;border:1px solid rgba(127,127,127,.25);border-radius:14px}
    .course-finance-row-head{display:flex;gap:12px;justify-content:space-between;align-items:flex-start;flex-wrap:wrap}
    .course-finance-meta{display:flex;gap:6px;flex-wrap:wrap;margin-top:8px}
    .course-finance-actions{display:flex;gap:6px;flex-wrap:wrap;margin-top:10px}
    .course-finance-status{font-weight:700}
    @media(max-width:600px){.course-finance-shell{padding:14px}.course-finance-row{padding:12px}#courseFinanceDialog{width:100vw;max-width:100vw;max-height:100vh;height:100vh;border-radius:0}.course-finance-shell{max-height:100vh}}
  `;
  document.head.append(style);
}

function ensureFinanceDialog() {
  let dialog = document.getElementById("courseFinanceDialog");
  if (dialog) return dialog;
  ensureFinanceStyles();
  dialog = document.createElement("dialog");
  dialog.id = "courseFinanceDialog";
  dialog.innerHTML = '<div class="course-finance-shell"><p class="muted">Cargando tesorería…</p></div>';
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
  });
  document.body.append(dialog);
  return dialog;
}

function ensureFinanceButton() {
  const existing = document.getElementById("courseFinanceNavButton");
  if (!financeAvailable) {
    existing?.remove();
    return;
  }
  if (existing) return;
  const nav = document.getElementById("nav");
  if (!nav) return;
  const button = document.createElement("button");
  button.id = "courseFinanceNavButton";
  button.type = "button";
  button.className = "ghost-button";
  button.textContent = "Tesorería";
  button.addEventListener("click", openFinanceDialog);
  nav.append(button);
}

async function api(path, options = {}) {
  const response = await fetch(path, {
    ...options,
    headers: options.body
      ? { "Content-Type": "application/json", Accept: "application/json", ...(options.headers || {}) }
      : { Accept: "application/json", ...(options.headers || {}) }
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload.ok === false) throw new Error(payload.error || "No se pudo completar la operación");
  return payload;
}

function statusLabel(status) {
  if (status === "validated") return "Validado";
  if (status === "incident") return "Incidencia";
  if (status === "not-required") return "No requiere pago";
  return "Pendiente";
}

function filterRows(snapshot) {
  let rows = (snapshot.courses || []).flatMap((course) => course.rows || []);
  if (selectedFinanceCourseId !== "all") rows = rows.filter((row) => row.courseId === selectedFinanceCourseId);
  if (financeFilter === "pending") rows = rows.filter((row) => row.paymentStatus === "pending" && Number(row.amount || 0) > 0);
  if (financeFilter === "incident") rows = rows.filter((row) => row.paymentStatus === "incident");
  if (financeFilter === "validated") rows = rows.filter((row) => row.paymentStatus === "validated");
  return rows;
}

function renderFinance(snapshot) {
  const dialog = ensureFinanceDialog();
  const rows = filterRows(snapshot);
  const summary = snapshot.summary || {};
  dialog.querySelector(".course-finance-shell").innerHTML = `
    <div class="course-finance-head">
      <div><p class="eyebrow">Tesorería · cursos</p><h3>Gestión económica de formaciones</h3><p class="muted">Justificante adjunto y pago validado son estados distintos.</p></div>
      <button type="button" class="ghost-button" data-finance-close>Cerrar</button>
    </div>
    <div class="course-finance-metrics">
      <div class="course-finance-metric"><strong>${Number(summary.pending || 0)}</strong><div class="muted">Pendientes</div></div>
      <div class="course-finance-metric"><strong>${Number(summary.validated || 0)}</strong><div class="muted">Validados</div></div>
      <div class="course-finance-metric"><strong>${Number(summary.incidents || 0)}</strong><div class="muted">Incidencias</div></div>
      <div class="course-finance-metric"><strong>${Number(summary.noPaymentRequired || 0)}</strong><div class="muted">Sin pago</div></div>
    </div>
    <div class="course-finance-toolbar">
      <label class="inline-field">Curso<select data-finance-course><option value="all">Todos los cursos</option>${(snapshot.courses || []).map((course) => `<option value="${escapeHtml(course.id)}" ${course.id === selectedFinanceCourseId ? "selected" : ""}>${escapeHtml(course.title)} · ${course.pendingCount || 0} pendiente(s)</option>`).join("")}</select></label>
      <div class="chip-row compact-chip-row">
        <button type="button" class="${financeFilter === "pending" ? "primary-button" : "ghost-button"}" data-finance-filter="pending">Pendientes</button>
        <button type="button" class="${financeFilter === "incident" ? "primary-button" : "ghost-button"}" data-finance-filter="incident">Incidencias</button>
        <button type="button" class="${financeFilter === "validated" ? "primary-button" : "ghost-button"}" data-finance-filter="validated">Validados</button>
        <button type="button" class="${financeFilter === "all" ? "primary-button" : "ghost-button"}" data-finance-filter="all">Todos</button>
      </div>
    </div>
    <div class="course-finance-list">
      ${rows.length ? rows.map((row) => `
        <article class="course-finance-row">
          <div class="course-finance-row-head">
            <div><strong>${escapeHtml(row.name)}</strong><div class="muted">${escapeHtml(row.courseTitle)}</div></div>
            <div class="course-finance-status">${escapeHtml(statusLabel(row.paymentStatus))}</div>
          </div>
          <div class="course-finance-meta">
            <span class="small-chip">${row.participantType === "member" ? "Socio" : "No socio"}</span>
            <span class="small-chip">${escapeHtml(formatMoney(row.amount))}</span>
            <span class="small-chip">Justificante: ${row.hasPaymentProof ? "adjunto" : "no adjunto"}</span>
            <span class="small-chip">Inscripción: ${escapeHtml(row.enrollmentStatus || "-")}</span>
          </div>
          ${row.paymentValidatedBy ? `<p class="muted">Validado por ${escapeHtml(row.paymentValidatedBy)}${row.paymentValidatedAt ? ` · ${escapeHtml(new Date(row.paymentValidatedAt).toLocaleString("es-ES"))}` : ""}</p>` : ""}
          ${row.paymentIncidentNote ? `<p class="status-note warning">Incidencia: ${escapeHtml(row.paymentIncidentNote)}</p>` : ""}
          <div class="course-finance-actions">
            ${row.hasPaymentProof ? `<a class="mini-button" target="_blank" rel="noreferrer" href="/api/course-finance/courses/${encodeURIComponent(row.courseId)}/submissions/${encodeURIComponent(row.submissionId)}/proof">Abrir justificante</a>` : ""}
            ${row.paymentStatus !== "not-required" ? `
              <button type="button" class="mini-button" data-finance-status="validated" data-course-id="${escapeHtml(row.courseId)}" data-submission-id="${escapeHtml(row.submissionId)}">Validar pago</button>
              <button type="button" class="mini-button" data-finance-status="incident" data-course-id="${escapeHtml(row.courseId)}" data-submission-id="${escapeHtml(row.submissionId)}">Marcar incidencia</button>
              ${row.paymentStatus !== "pending" ? `<button type="button" class="mini-button" data-finance-status="pending" data-course-id="${escapeHtml(row.courseId)}" data-submission-id="${escapeHtml(row.submissionId)}">Volver a pendiente</button>` : ""}
            ` : ""}
          </div>
        </article>
      `).join("") : '<div class="empty-state">No hay pagos que coincidan con este filtro.</div>'}
    </div>
  `;

  dialog.querySelector("[data-finance-close]")?.addEventListener("click", () => dialog.close());
  dialog.querySelector("[data-finance-course]")?.addEventListener("change", (event) => {
    selectedFinanceCourseId = event.target.value || "all";
    renderFinance(snapshot);
  });
  dialog.querySelectorAll("[data-finance-filter]").forEach((button) => button.addEventListener("click", () => {
    financeFilter = button.dataset.financeFilter || "pending";
    renderFinance(snapshot);
  }));
  dialog.querySelectorAll("[data-finance-status]").forEach((button) => button.addEventListener("click", async () => {
    const paymentStatus = button.dataset.financeStatus;
    let note = "";
    if (paymentStatus === "incident") {
      note = clean(window.prompt("Describe brevemente la incidencia del pago:", ""));
      if (!note) return;
    }
    button.disabled = true;
    try {
      await api(`/api/course-finance/courses/${encodeURIComponent(button.dataset.courseId)}/submissions/${encodeURIComponent(button.dataset.submissionId)}`, {
        method: "PATCH",
        body: JSON.stringify({ paymentStatus, note })
      });
      await refreshFinanceDialog();
    } catch (error) {
      window.alert(error.message || "No se pudo actualizar el pago");
      button.disabled = false;
    }
  }));
}

async function refreshFinanceDialog() {
  const snapshot = await api("/api/course-finance");
  renderFinance(snapshot);
}

async function openFinanceDialog() {
  const dialog = ensureFinanceDialog();
  if (!dialog.open) dialog.showModal();
  dialog.querySelector(".course-finance-shell").innerHTML = '<p class="muted">Cargando pagos…</p>';
  try {
    await refreshFinanceDialog();
  } catch (error) {
    dialog.querySelector(".course-finance-shell").innerHTML = `<div class="status-note warning">${escapeHtml(error.message || "No se pudo cargar tesorería")}</div><button type="button" class="ghost-button" data-finance-close>Cerrar</button>`;
    dialog.querySelector("[data-finance-close]")?.addEventListener("click", () => dialog.close());
  }
}

function enhanceUi() {
  enhanceAssociateForm();
  ensureFinanceButton();
}

function injectTreasuryPermission(target, init) {
  if (String(init?.method || "GET").toUpperCase() !== "PATCH" || !/^\/api\/associates\/[^/]+$/.test(target.pathname)) return init;
  const checkbox = document.getElementById("editAssociateTreasuryEnabled");
  if (!checkbox || typeof init.body !== "string") return init;
  try {
    const payload = JSON.parse(init.body || "{}");
    payload.treasuryEnabled = checkbox.checked === true;
    return { ...init, body: JSON.stringify(payload) };
  } catch {
    return init;
  }
}

async function rememberStateResponse(response, target) {
  if (!response?.ok || target.pathname !== "/api/state") return response;
  try {
    const payload = await response.clone().json();
    rememberState(payload);
    queueMicrotask(enhanceUi);
  } catch {
    // Keep the original response untouched.
  }
  return response;
}

export function installCourseFinanceEnhancer() {
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
    const nextInit = target.origin === window.location.origin ? injectTreasuryPermission(target, init) : init;
    const response = await baseFetch(input, nextInit);
    return target.origin === window.location.origin ? rememberStateResponse(response, target) : response;
  };
  document.addEventListener("click", trackAssociateSelection, true);
  enhanceUi();
  if (typeof MutationObserver !== "undefined") {
    observer = new MutationObserver(enhanceUi);
    observer.observe(document.body, { childList: true, subtree: true });
  }
}
