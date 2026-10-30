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

function madridYearMonth(value = new Date()) {
  const date = value instanceof Date ? value : new Date(value || Date.now());
  const safeDate = Number.isFinite(date.getTime()) ? date : new Date();
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Madrid",
    year: "numeric",
    month: "2-digit"
  }).formatToParts(safeDate);
  return {
    year: Number(parts.find((part) => part.type === "year")?.value || safeDate.getUTCFullYear()),
    month: Number(parts.find((part) => part.type === "month")?.value || safeDate.getUTCMonth() + 1)
  };
}

function rolloverBenefit(associate) {
  const feeYear = Number(associate?.membershipFeeYear || 0);
  const sourceDate = associate?.joinedAt || associate?.campusOnboardingCreatedAt || associate?.createdAt;
  if (!feeYear || !sourceDate) return null;
  const { year, month } = madridYearMonth(sourceDate);
  if (month < 10 || feeYear !== year + 1) return null;
  return { feeYear, joinedYear: year };
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
    queueMicrotask(enhanceMembershipFeeYearUi);
  }
}

function selectedAssociate() {
  return (latestState?.associates || []).find((item) => item.id === selectedAssociateId) || null;
}

function ownAssociate() {
  if (latestState?.role !== "member") return null;
  const selected = clean(latestState.selectedAssociateId);
  return (latestState.associates || []).find((item) => item.id === selected) || (latestState.associates || [])[0] || null;
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
  renderMemberBenefitCard();
}

function benefitHtml(associate) {
  const benefit = rolloverBenefit(associate);
  if (!benefit) return "";
  return `<div class="membership-fee-year-benefit"><strong>Alta activa desde ahora.</strong><span>Los meses restantes de ${escapeHtml(benefit.joinedYear)} están incluidos sin coste adicional. La cuota abonada cubre ${escapeHtml(benefit.feeYear)}.</span></div>`;
}

function renderBox(box, associate) {
  const year = Number(associate?.membershipFeeYear || 0);
  box.innerHTML = year
    ? `<div><span class="muted">Imputación de cuota</span><br><strong>Cuota correspondiente a ${escapeHtml(year)}</strong>${benefitHtml(associate)}</div><button type="button" class="mini-button" data-correct-fee-year>Corregir año</button>`
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
  style.textContent = `
    .membership-fee-year-box{display:flex;gap:12px;align-items:center;justify-content:space-between;flex-wrap:wrap;padding:12px 14px;margin:10px 0;border:1px solid rgba(127,127,127,.28);border-radius:12px;background:rgba(59,130,246,.07)}
    .membership-fee-year-benefit{display:grid;gap:3px;margin-top:8px;padding:9px 10px;border-radius:10px;background:rgba(34,197,94,.1);border:1px solid rgba(34,197,94,.28);font-size:.92rem}
    .membership-fee-benefit-card{margin:12px 0;padding:14px 16px;border-radius:14px;border:1px solid rgba(34,197,94,.34);background:rgba(34,197,94,.1)}
    .membership-fee-benefit-card p{margin:6px 0 0}
  `;
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

function renderMemberBenefitCard() {
  const existing = document.getElementById("membershipFeeBenefitCard");
  const associate = ownAssociate();
  const benefit = rolloverBenefit(associate);
  if (!benefit) {
    existing?.remove();
    return;
  }
  ensureStyles();
  const html = `<strong>Tu cuota corresponde a ${escapeHtml(benefit.feeYear)}</strong><p>Tu alta está activa desde ahora. Los meses restantes de ${escapeHtml(benefit.joinedYear)} están incluidos por Isócrona Zero sin coste adicional, y puedes participar con normalidad en las actividades para socios.</p>`;
  if (existing) {
    existing.innerHTML = html;
    return;
  }
  const hero = document.getElementById("hero");
  if (!hero) return;
  const card = document.createElement("div");
  card.id = "membershipFeeBenefitCard";
  card.className = "membership-fee-benefit-card";
  card.innerHTML = html;
  hero.after(card);
}

function enhanceMembershipFeeYearUi() {
  enhanceAssociateForm();
  renderMemberBenefitCard();
}

async function rememberStateResponse(response, target) {
  if (!response?.ok || target.pathname !== "/api/state") return response;
  try {
    rememberState(await response.clone().json());
    queueMicrotask(enhanceMembershipFeeYearUi);
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
  enhanceMembershipFeeYearUi();
  if (typeof MutationObserver !== "undefined") {
    observer = new MutationObserver(enhanceMembershipFeeYearUi);
    observer.observe(document.body, { childList: true, subtree: true });
  }
}
