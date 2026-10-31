let installed = false;
let observer = null;
let latestState = null;
let proofObjectUrl = "";

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
  return new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(Number(value || 0));
}

function ownAssociate() {
  if (!latestState) return null;
  const selected = clean(latestState.selectedAssociateId);
  return (latestState.associates || []).find((item) => item.id === selected) || (latestState.associates || [])[0] || null;
}

function canUseTreasury() {
  return latestState?.role === "admin" || ownAssociate()?.treasuryEnabled === true;
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

function ensureStyles() {
  if (document.getElementById("boardV11Styles")) return;
  const style = document.createElement("style");
  style.id = "boardV11Styles";
  style.textContent = `
    #proofPreviewDialog,#accountingLedgerDialog{width:min(1100px,96vw);max-height:94vh;border:0;border-radius:18px;padding:0;overflow:hidden}
    #proofPreviewDialog::backdrop,#accountingLedgerDialog::backdrop{background:rgba(0,0,0,.58)}
    .proof-preview-shell,.accounting-ledger-shell{padding:18px;max-height:94vh;overflow:auto}
    .proof-preview-head,.accounting-ledger-head{display:flex;gap:12px;align-items:flex-start;justify-content:space-between;flex-wrap:wrap;margin-bottom:12px}
    .proof-preview-frame{width:100%;height:min(72vh,850px);border:1px solid rgba(127,127,127,.25);border-radius:12px;background:#fff}
    .proof-preview-image{display:block;max-width:100%;max-height:75vh;margin:auto;border-radius:12px}
    .ledger-metrics{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:10px;margin:14px 0}
    .ledger-metric{padding:12px;border:1px solid rgba(127,127,127,.25);border-radius:12px}
    .ledger-list{display:grid;gap:8px}
    .ledger-row{display:grid;grid-template-columns:minmax(180px,1.4fr) minmax(90px,.5fr) minmax(110px,.6fr);gap:10px;padding:12px;border:1px solid rgba(127,127,127,.22);border-radius:12px;align-items:center}
    .course-proof-request-notice{margin:0 0 14px;padding:13px 14px;border-radius:14px;border:1px solid #d97706;background:rgba(245,158,11,.12)}
    .whatsapp-member-card{margin:12px 0;padding:13px 14px;border-radius:14px;border:1px solid rgba(34,197,94,.35);background:rgba(34,197,94,.09)}
    @media(max-width:650px){#proofPreviewDialog,#accountingLedgerDialog{width:100vw;height:100vh;max-width:100vw;max-height:100vh;border-radius:0}.proof-preview-shell,.accounting-ledger-shell{max-height:100vh;padding:14px}.ledger-row{grid-template-columns:1fr}.proof-preview-frame{height:76vh}}
  `;
  document.head.append(style);
}

function ensureProofDialog() {
  ensureStyles();
  let dialog = document.getElementById("proofPreviewDialog");
  if (dialog) return dialog;
  dialog = document.createElement("dialog");
  dialog.id = "proofPreviewDialog";
  dialog.innerHTML = '<div class="proof-preview-shell"></div>';
  dialog.addEventListener("close", () => {
    if (proofObjectUrl) URL.revokeObjectURL(proofObjectUrl);
    proofObjectUrl = "";
  });
  dialog.addEventListener("click", (event) => { if (event.target === dialog) dialog.close(); });
  document.body.append(dialog);
  return dialog;
}

async function openProofPreview(href, label = "Justificante") {
  const dialog = ensureProofDialog();
  const shell = dialog.querySelector(".proof-preview-shell");
  shell.innerHTML = `<div class="proof-preview-head"><div><p class="eyebrow">Tesorería</p><h3>${escapeHtml(label)}</h3></div><button class="ghost-button" type="button" data-proof-close>Cerrar</button></div><p class="muted">Cargando justificante…</p>`;
  shell.querySelector("[data-proof-close]")?.addEventListener("click", () => dialog.close());
  if (!dialog.open) dialog.showModal();
  try {
    const response = await fetch(href, { credentials: "same-origin" });
    if (!response.ok) throw new Error("No se pudo abrir el justificante");
    const blob = await response.blob();
    if (proofObjectUrl) URL.revokeObjectURL(proofObjectUrl);
    proofObjectUrl = URL.createObjectURL(blob);
    const type = clean(blob.type).toLowerCase();
    const viewer = type.startsWith("image/")
      ? `<img class="proof-preview-image" src="${proofObjectUrl}" alt="Justificante" />`
      : `<iframe class="proof-preview-frame" src="${proofObjectUrl}" title="Justificante"></iframe>`;
    shell.innerHTML = `<div class="proof-preview-head"><div><p class="eyebrow">Tesorería</p><h3>${escapeHtml(label)}</h3><p class="muted">Revisión online · no es necesario descargar el archivo.</p></div><button class="ghost-button" type="button" data-proof-close>Cerrar</button></div>${viewer}`;
    shell.querySelector("[data-proof-close]")?.addEventListener("click", () => dialog.close());
  } catch (error) {
    shell.innerHTML = `<div class="proof-preview-head"><h3>${escapeHtml(label)}</h3><button class="ghost-button" type="button" data-proof-close>Cerrar</button></div><div class="status-note warning">${escapeHtml(error.message || "No se pudo abrir el justificante")}</div>`;
    shell.querySelector("[data-proof-close]")?.addEventListener("click", () => dialog.close());
  }
}

function isProofHref(href) {
  const value = clean(href);
  return /\/api\/course-finance\/courses\/[^/]+\/submissions\/[^/]+\/proof(?:$|\?)/.test(value) || /\/api\/associates\/files\//.test(value);
}

function handleProofLink(event) {
  const link = event.target?.closest?.("a[href]");
  if (!link || !isProofHref(link.getAttribute("href"))) return;
  event.preventDefault();
  openProofPreview(link.href, clean(link.textContent) || "Justificante");
}

function enhanceFinanceProofRequests() {
  document.querySelectorAll(".course-finance-row").forEach((row) => {
    if (row.querySelector("[data-request-payment-proof]")) return;
    const source = row.querySelector("[data-finance-status][data-course-id][data-submission-id]");
    if (!source) return;
    const actions = row.querySelector(".course-finance-actions");
    if (!actions) return;
    const hasProof = Boolean(row.querySelector('a[href*="/api/course-finance/"][href*="/proof"]'));
    const button = document.createElement("button");
    button.type = "button";
    button.className = "mini-button";
    button.dataset.requestPaymentProof = "true";
    button.textContent = hasProof ? "Solicitar nuevo justificante" : "Solicitar justificante";
    button.addEventListener("click", async () => {
      const note = clean(window.prompt("Nota opcional para el socio:", ""));
      button.disabled = true;
      try {
        const result = await api(`/api/v1.1/course-finance/courses/${encodeURIComponent(source.dataset.courseId)}/submissions/${encodeURIComponent(source.dataset.submissionId)}/request-proof`, {
          method: "POST",
          body: JSON.stringify({ note })
        });
        button.textContent = "Justificante solicitado";
        window.alert(result.message || "Solicitud enviada al socio");
      } catch (error) {
        window.alert(error.message || "No se pudo solicitar el justificante");
        button.disabled = false;
      }
    });
    actions.append(button);
  });
}

function ensureLedgerDialog() {
  ensureStyles();
  let dialog = document.getElementById("accountingLedgerDialog");
  if (dialog) return dialog;
  dialog = document.createElement("dialog");
  dialog.id = "accountingLedgerDialog";
  dialog.innerHTML = '<div class="accounting-ledger-shell"></div>';
  dialog.addEventListener("click", (event) => { if (event.target === dialog) dialog.close(); });
  document.body.append(dialog);
  return dialog;
}

function categoryLabel(value) {
  return value === "cuota" ? "Cuota" : value === "jornada" ? "Jornada" : value === "curso" ? "Curso" : "Otro";
}

function renderLedger(snapshot) {
  const dialog = ensureLedgerDialog();
  const summary = snapshot.summary || {};
  const by = summary.byCategory || {};
  const shell = dialog.querySelector(".accounting-ledger-shell");
  shell.innerHTML = `
    <div class="accounting-ledger-head">
      <div><p class="eyebrow">Tesorería</p><h3>Libro interno de ingresos validados</h3><p class="muted">Solo aparecen cuotas y pagos de formaciones ya confirmados.</p></div>
      <div class="chip-row"><a class="mini-button" href="/api/v1.1/accounting-ledger.csv">Exportar CSV</a><button class="ghost-button" type="button" data-ledger-close>Cerrar</button></div>
    </div>
    <div class="ledger-metrics">
      <div class="ledger-metric"><strong>${escapeHtml(formatMoney(summary.total || 0))}</strong><div class="muted">Total validado</div></div>
      <div class="ledger-metric"><strong>${escapeHtml(formatMoney(by.cuota || 0))}</strong><div class="muted">Cuotas</div></div>
      <div class="ledger-metric"><strong>${escapeHtml(formatMoney(by.curso || 0))}</strong><div class="muted">Cursos</div></div>
      <div class="ledger-metric"><strong>${escapeHtml(formatMoney(by.jornada || 0))}</strong><div class="muted">Jornadas</div></div>
    </div>
    <div class="ledger-list">
      ${(snapshot.entries || []).length ? snapshot.entries.map((entry) => `
        <article class="ledger-row">
          <div><strong>${escapeHtml(entry.concept)}</strong><div class="muted">${escapeHtml(entry.personName)} · ${escapeHtml(entry.date || entry.validatedAt || "")}</div></div>
          <div><span class="small-chip">${escapeHtml(categoryLabel(entry.category))}</span><div class="muted">${escapeHtml(entry.method || "")}</div></div>
          <div><strong>${escapeHtml(formatMoney(entry.amount))}</strong><div class="muted">Ejercicio ${escapeHtml(entry.exerciseYear || "-")}</div></div>
        </article>`).join("") : '<div class="empty-state">Todavía no hay ingresos validados.</div>'}
    </div>`;
  shell.querySelector("[data-ledger-close]")?.addEventListener("click", () => dialog.close());
}

async function openLedger() {
  const dialog = ensureLedgerDialog();
  if (!dialog.open) dialog.showModal();
  dialog.querySelector(".accounting-ledger-shell").innerHTML = '<p class="muted">Cargando ingresos validados…</p>';
  try {
    renderLedger(await api("/api/v1.1/accounting-ledger"));
  } catch (error) {
    dialog.querySelector(".accounting-ledger-shell").innerHTML = `<div class="status-note warning">${escapeHtml(error.message || "No se pudo cargar el libro de ingresos")}</div><button type="button" class="ghost-button" data-ledger-close>Cerrar</button>`;
    dialog.querySelector("[data-ledger-close]")?.addEventListener("click", () => dialog.close());
  }
}

function ensureLedgerButton() {
  const existing = document.getElementById("accountingLedgerNavButton");
  if (!canUseTreasury()) {
    existing?.remove();
    return;
  }
  if (existing) return;
  const nav = document.getElementById("nav");
  if (!nav) return;
  const button = document.createElement("button");
  button.id = "accountingLedgerNavButton";
  button.type = "button";
  button.className = "ghost-button";
  button.textContent = "Ingresos";
  button.addEventListener("click", openLedger);
  nav.append(button);
}

function whatsappUrl() {
  return clean(latestState?.settings?.associates?.whatsappChannelInviteUrl);
}

function ensureWhatsappAdminButton() {
  const existing = document.getElementById("whatsappChannelAdminButton");
  if (latestState?.role !== "admin") {
    existing?.remove();
    return;
  }
  if (existing) return;
  const nav = document.getElementById("nav");
  if (!nav) return;
  const button = document.createElement("button");
  button.id = "whatsappChannelAdminButton";
  button.type = "button";
  button.className = "ghost-button";
  button.textContent = "Canal WhatsApp";
  button.addEventListener("click", async () => {
    const next = window.prompt("Enlace oficial de invitación al canal/grupo de WhatsApp (vacío para quitarlo):", whatsappUrl());
    if (next === null) return;
    try {
      const result = await api("/api/v1.1/whatsapp-channel", { method: "PUT", body: JSON.stringify({ url: clean(next) }) });
      latestState.settings = latestState.settings || {};
      latestState.settings.associates = latestState.settings.associates || {};
      latestState.settings.associates.whatsappChannelInviteUrl = result.url || "";
      enhanceUi();
      window.alert(result.configured ? "Enlace de WhatsApp actualizado" : "Enlace de WhatsApp retirado");
    } catch (error) {
      window.alert(error.message || "No se pudo guardar el enlace");
    }
  });
  nav.append(button);
}

function ensureWhatsappMemberCard() {
  const existing = document.getElementById("whatsappMemberCard");
  const url = whatsappUrl();
  const isMember = latestState?.role === "member" && Boolean(ownAssociate());
  if (!url || !isMember) {
    existing?.remove();
    return;
  }
  if (existing) {
    existing.querySelector("a")?.setAttribute("href", url);
    return;
  }
  const hero = document.getElementById("hero");
  if (!hero) return;
  const card = document.createElement("div");
  card.id = "whatsappMemberCard";
  card.className = "whatsapp-member-card";
  card.innerHTML = `<strong>Canal de WhatsApp de Isócrona Zero</strong><p class="muted">Únete directamente para recibir las comunicaciones de la asociación.</p><a class="primary-button button-link" href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">Unirme al canal de WhatsApp</a>`;
  hero.after(card);
}

function parseProofRequestId(value) {
  const raw = clean(value);
  if (!raw.startsWith("course-proof-request__")) return null;
  const parts = raw.slice("course-proof-request__".length).split("__");
  if (parts.length !== 2) return null;
  try { return { courseId: decodeURIComponent(parts[0]), submissionId: decodeURIComponent(parts[1]) }; } catch { return null; }
}

function focusCoursePaymentForm() {
  const fileInput = document.querySelector('#courseEnrollmentForm input[type="file"]');
  if (fileInput) {
    fileInput.scrollIntoView({ behavior: "smooth", block: "center" });
    fileInput.focus();
    return;
  }
  document.querySelector("#courseEnrollmentForm")?.scrollIntoView({ behavior: "smooth", block: "center" });
}

function enhanceMemberProofNotices() {
  document.querySelectorAll("[data-notification-id]").forEach((control) => {
    const parsed = parseProofRequestId(control.dataset.notificationId);
    if (!parsed) return;
    const card = control.closest(".notice-card,.mail-card,.status-note") || control.parentElement?.parentElement;
    if (!card || card.querySelector("[data-proof-request-cta]")) return;
    const button = document.createElement("button");
    button.type = "button";
    button.className = "mini-button";
    button.dataset.proofRequestCta = "true";
    button.textContent = "Adjuntar justificante";
    button.addEventListener("click", () => {
      const candidate = document.querySelector(`[data-course-id="${CSS.escape(parsed.courseId)}"]`);
      candidate?.click?.();
      setTimeout(focusCoursePaymentForm, 80);
    });
    control.parentElement?.append(button);
  });

  const panel = document.getElementById("mainPanel");
  if (!panel || latestState?.role !== "member") return;
  const selectedCourseId = clean(latestState.selectedCourseId);
  const request = (latestState.memberNotifications || []).find((notification) => {
    const parsed = parseProofRequestId(notification.id);
    return parsed?.courseId === selectedCourseId && clean(notification.title).startsWith("Justificante pendiente");
  });
  let notice = document.getElementById("courseProofRequestNotice");
  if (!request) {
    notice?.remove();
    return;
  }
  if (!notice) {
    notice = document.createElement("div");
    notice.id = "courseProofRequestNotice";
    notice.className = "course-proof-request-notice";
    panel.prepend(notice);
  }
  notice.innerHTML = `<strong>Justificante de pago solicitado</strong><p>${escapeHtml(request.body || "Tesorería necesita que adjuntes el justificante de esta formación.")}</p><button type="button" class="mini-button" data-focus-payment-proof>Adjuntar justificante</button>`;
  notice.querySelector("[data-focus-payment-proof]")?.addEventListener("click", focusCoursePaymentForm);
}

function enhanceUi() {
  ensureStyles();
  ensureLedgerButton();
  ensureWhatsappAdminButton();
  ensureWhatsappMemberCard();
  enhanceFinanceProofRequests();
  enhanceMemberProofNotices();
}

async function rememberStateResponse(response, target) {
  if (!response?.ok || target.pathname !== "/api/state") return response;
  try {
    latestState = await response.clone().json();
    queueMicrotask(enhanceUi);
  } catch {
    // Keep state response untouched.
  }
  return response;
}

export function installBoardEnhancer() {
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
  document.addEventListener("click", handleProofLink, true);
  enhanceUi();
  if (typeof MutationObserver !== "undefined") {
    observer = new MutationObserver(enhanceUi);
    observer.observe(document.body, { childList: true, subtree: true });
  }
}
