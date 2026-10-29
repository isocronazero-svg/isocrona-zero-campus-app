let installed = false;
let observer = null;
let latestState = null;
let selectedAssociateId = "";

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

function rememberState(payload) {
  if (!payload || typeof payload !== "object") return;
  latestState = payload;
  selectedAssociateId = clean(payload.selectedAssociateId || selectedAssociateId);
}

function trackAssociateSelection(event) {
  const target = event.target?.closest?.("[data-associate-id]");
  const id = clean(target?.dataset?.associateId);
  if (id) {
    selectedAssociateId = id;
    queueMicrotask(enhanceAssociateForm);
  }
}

function selectedAssociate() {
  return (latestState?.associates || []).find((item) => item.id === selectedAssociateId) || null;
}

async function updateYear(associate, nextYear, box) {
  const response = await fetch(`/api/v1.1/associates/${encodeURIComponent(associate.id)}/membership-fee-year`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ year: nextYear })
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload.ok === false) throw new Error(payload.error || "No se pudo actualizar el año de cuota");
  associate.membershipFeeYear = payload.membershipFeeYear;
  associate.membershipFeeYearSource = "manual-admin";
  renderBox(box, associate);
}

function renderBox(box, associate) {
  const year = Number(associate?.membershipFeeYear || 0);
  box.innerHTML = year
    ? `<div><span class="muted">Imputación de cuota</span><br><strong>Cuota correspondiente a ${escapeHtml(year)}</strong></div><button type="button" class="mini-button" data-correct-fee-year>Corregir año</button>`
    : `<div><span class="muted">Imputación de cuota</span><br><strong>Año de cuota pendiente de asignar</strong></div>`;
  box.querySelector("[data-correct-fee-year]")?.addEventListener("click", async (event) => {
    const button = event.currentTarget;
    const current = Number(associate.membershipFeeYear || new Date().getFullYear());
    const raw = window.prompt("Año al que corresponde esta cuota:", String(current));
    if (raw === null) return;
    const nextYear = Number(raw);
    button.disabled = true;
    try {
      await updateYear(associate, nextYear, box);
    } catch (error) {
      window.alert(error.message || "No se pudo actualizar el año de cuota");
      button.disabled = false;
    }
  });
}

function ensureStyles() {
  if (document.getElementById("membershipFeeYearStyles")) return;
  const style = document.createElement("style");
  style.id = "membershipFeeYearStyles";
  style.textContent = `.membership-fee-year-box{display:flex;gap:12px;align-items:center;justify-content:space-between;flex-wrap:wrap;padding:12px 14px;margin:10px 0;border:1px solid rgba(127,127,127,.28);border-radius:12px;background:rgba(59,130,246,.07)}`;
  document.head.append(style);
}

function enhanceAssociateForm() {
  const form = document.getElementById("associateEditForm");
  const associate = selectedAssociate();
  if (!form || !associate || latestState?.role !== "admin") return;
  ensureStyles();
  let box = form.querySelector("#membershipFeeYearBox");
  if (!box) {
    box = document.createElement("div");
    box.id = "membershipFeeYearBox";
    box.className = "membership-fee-year-box";
    form.prepend(box);
  }
  renderBox(box, associate);
}

async function rememberStateResponse(response, target) {
  if (!response?.ok || target.pathname !== "/api/state") return response;
  try {
    rememberState(await response.clone().json());
    queueMicrotask(enhanceAssociateForm);
  } catch {
    // Preserve original response.
  }
  return response;
}

export function installMembershipFeeYearEnhancer() {
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
  document.addEventListener("click", trackAssociateSelection, true);
  enhanceAssociateForm();
  if (typeof MutationObserver !== "undefined") {
    observer = new MutationObserver(enhanceAssociateForm);
    observer.observe(document.body, { childList: true, subtree: true });
  }
}
