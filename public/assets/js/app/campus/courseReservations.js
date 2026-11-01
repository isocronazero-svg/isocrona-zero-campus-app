import { formatCourseFee, getApplicableCourseFee } from "./coursePricing.js";

const PANEL_ID = "adminCourseReservationsPanel";
let enhancing = false;
let scheduled = false;

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

function unique(values) {
  return [...new Set((Array.isArray(values) ? values : []).filter(Boolean))];
}

function courseIdFromStudentPanel(roster) {
  const container = roster.closest(".content-module") || roster.parentElement;
  return clean(container?.querySelector('[data-course-id]')?.dataset.courseId);
}

async function readAdminState() {
  const response = await fetch("/api/state", { headers: { Accept: "application/json" } });
  const payload = await response.json().catch(() => null);
  if (!response.ok || !payload) throw new Error(payload?.error || "No se pudo cargar el curso");
  if (payload.role !== "admin") return null;
  return payload;
}

async function reservationRequest(courseId, { method = "POST", reservationId = "", body = null } = {}) {
  const suffix = reservationId ? `/${encodeURIComponent(reservationId)}` : "";
  const response = await fetch(`/api/admin/courses/${encodeURIComponent(courseId)}/reservations${suffix}`, {
    method,
    headers: body ? { "Content-Type": "application/json", Accept: "application/json" } : { Accept: "application/json" },
    body: body ? JSON.stringify(body) : undefined
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok || payload?.ok === false) {
    throw new Error(payload?.error || payload?.message || "No se pudo gestionar la reserva");
  }
  return payload;
}

function getCourse(state, courseId) {
  return (state.courses || []).find((course) => course.id === courseId) || null;
}

function getMember(state, memberId) {
  return (state.members || []).find((member) => member.id === memberId) || null;
}

function activeReservation(submission) {
  return !["rejected", "cancelled"].includes(clean(submission?.status).toLowerCase());
}

function seatsLeft(course) {
  const capacity = Math.max(0, Number(course?.capacity || 0));
  return Math.max(capacity - unique(course?.enrolledIds).length, 0);
}

function reservationOptions(state, course) {
  const occupied = new Set([
    ...(course.enrolledIds || []),
    ...(course.waitingIds || []),
    ...(course.enrollmentSubmissions || []).filter(activeReservation).map((item) => item.memberId)
  ]);
  return (state.associates || [])
    .filter((associate) => associate.linkedMemberId && !occupied.has(associate.linkedMemberId))
    .map((associate) => {
      const member = getMember(state, associate.linkedMemberId);
      if (!member) return null;
      const number = associate.associateNumber ? ` · socio #${associate.associateNumber}` : "";
      return { id: member.id, label: `${member.name || [associate.firstName, associate.lastName].filter(Boolean).join(" ")}${number}` };
    })
    .filter(Boolean)
    .sort((left, right) => left.label.localeCompare(right.label, "es"));
}

function buildPanel(state, course) {
  const options = reservationOptions(state, course);
  const reservations = (course.enrollmentSubmissions || []).filter(
    (submission) => submission.source === "admin-reservation" && activeReservation(submission)
  );
  const free = seatsLeft(course);
  const capacity = Math.max(0, Number(course.capacity || 0));
  const occupied = capacity - free;
  const memberFee = getApplicableCourseFee(course, "member");
  const nonMemberFee = getApplicableCourseFee(course, "external");

  const panel = document.createElement("div");
  panel.className = "mail-card";
  panel.id = PANEL_ID;
  panel.dataset.courseId = course.id;
  panel.dataset.memberFee = String(memberFee);
  panel.dataset.nonMemberFee = String(nonMemberFee);
  panel.innerHTML = `
    <div class="row-between">
      <div>
        <p class="eyebrow">Antes de abrir inscripciones</p>
        <h4>Reservas administrativas</h4>
        <p class="muted">Añade socios o invitados externos. La plaza queda descontada del aforo desde este momento.</p>
        <p class="muted">Precio socio: <strong>${escapeHtml(formatCourseFee(memberFee))}</strong> · Precio no socio: <strong>${escapeHtml(formatCourseFee(nonMemberFee))}</strong></p>
      </div>
      <span class="small-chip">${occupied}/${capacity} ocupadas · ${free} libres</span>
    </div>
    <div class="chip-row" style="margin-top: 12px;">
      <button class="primary-button" type="button" data-reservation-toggle ${free <= 0 ? "disabled" : ""}>Añadir participante / Reservar plaza</button>
    </div>
    ${free <= 0 ? '<p class="status-note warning">El curso está completo. Libera una plaza antes de crear otra reserva.</p>' : ""}
    <form data-reservation-form class="stack" hidden style="margin-top: 14px;">
      <label class="inline-field">
        Tipo de participante
        <select name="participantType">
          <option value="member">Socio</option>
          <option value="external">Invitado externo</option>
        </select>
      </label>
      <p class="status-note" data-reservation-price>Precio aplicable: ${escapeHtml(formatCourseFee(memberFee))}</p>
      <div data-reservation-member>
        <label class="inline-field">
          Socio
          <select name="memberId">
            <option value="">Selecciona un socio</option>
            ${options.map((item) => `<option value="${escapeHtml(item.id)}">${escapeHtml(item.label)}</option>`).join("")}
          </select>
        </label>
        ${options.length ? "" : '<p class="muted">No quedan socios elegibles en el listado para este curso.</p>'}
      </div>
      <div data-reservation-external hidden>
        <div class="studio-grid">
          <label class="inline-field">Nombre<input name="firstName" type="text" autocomplete="off" /></label>
          <label class="inline-field">Apellidos<input name="lastName" type="text" autocomplete="off" /></label>
          <label class="inline-field">Email<input name="email" type="email" autocomplete="off" required /></label>
          <label class="inline-field">Teléfono<input name="phone" type="text" autocomplete="off" placeholder="Opcional" /></label>
        </div>
      </div>
      <label class="inline-field">Nota interna<input name="note" type="text" placeholder="Opcional" /></label>
      <div class="chip-row">
        <button class="primary-button" type="submit">Reservar plaza</button>
        <button class="ghost-button" type="button" data-reservation-cancel>Cancelar</button>
      </div>
      <p class="status-note" data-reservation-status role="status"></p>
    </form>
    <div class="stack compact-list" data-reservation-list style="margin-top: 14px;">
      ${reservations.length ? reservations.map((reservation) => {
        const member = getMember(state, reservation.memberId);
        const type = reservation.participantType === "external" ? "Invitado externo" : "Socio";
        const payment = reservation.status === "pending-proof" ? " · pago pendiente" : "";
        const amount = formatCourseFee(Number(reservation.amount || 0));
        return `<div class="timeline-item compact-timeline-item">
          <div class="row-between">
            <div><strong>${escapeHtml(member?.name || "Participante")}</strong><p class="muted">Reserva administrativa · ${type} · ${escapeHtml(amount)}${payment}</p></div>
            <button class="mini-button" type="button" data-release-reservation="${escapeHtml(reservation.id)}">Liberar plaza</button>
          </div>
        </div>`;
      }).join("") : '<p class="muted">No hay plazas reservadas manualmente en este curso.</p>'}
    </div>
  `;
  return panel;
}

function setStatus(panel, message, warning = false) {
  const status = panel.querySelector("[data-reservation-status]");
  if (!status) return;
  status.className = warning ? "status-note warning" : "status-note";
  status.textContent = message;
}

function updateReservationPrice(panel) {
  const type = panel.querySelector('[name="participantType"]')?.value || "member";
  const price = type === "member" ? Number(panel.dataset.memberFee || 0) : Number(panel.dataset.nonMemberFee || 0);
  const label = panel.querySelector("[data-reservation-price]");
  if (label) label.textContent = `Precio aplicable: ${formatCourseFee(price)}`;
}

function toggleParticipantFields(panel) {
  const type = panel.querySelector('[name="participantType"]')?.value || "member";
  const member = panel.querySelector("[data-reservation-member]");
  const external = panel.querySelector("[data-reservation-external]");
  if (member) member.hidden = type !== "member";
  if (external) external.hidden = type !== "external";
  const email = external?.querySelector('[name="email"]');
  if (email) email.required = type === "external";
  updateReservationPrice(panel);
}

async function createReservation(panel, form) {
  const courseId = panel.dataset.courseId;
  const data = new FormData(form);
  const participantType = clean(data.get("participantType"));
  const payload = {
    participantType,
    memberId: clean(data.get("memberId")),
    firstName: clean(data.get("firstName")),
    lastName: clean(data.get("lastName")),
    email: clean(data.get("email")).toLowerCase(),
    phone: clean(data.get("phone")),
    note: clean(data.get("note")),
    method: "Transferencia"
  };

  if (participantType === "member" && !payload.memberId) throw new Error("Selecciona un socio");
  if (participantType === "external") {
    if (!payload.firstName || !payload.lastName) throw new Error("Indica el nombre y apellidos del invitado");
    if (!payload.email) throw new Error("Indica el correo electrónico del invitado");
  }

  setStatus(panel, "Guardando reserva...");
  await reservationRequest(courseId, { method: "POST", body: payload });
  setStatus(panel, "Plaza reservada correctamente.");
  window.location.reload();
}

async function releaseReservation(panel, reservationId) {
  await reservationRequest(panel.dataset.courseId, { method: "DELETE", reservationId });
  window.location.reload();
}

function bindPanel(panel) {
  const form = panel.querySelector("[data-reservation-form]");
  panel.querySelector("[data-reservation-toggle]")?.addEventListener("click", () => {
    if (!form) return;
    form.hidden = false;
    toggleParticipantFields(panel);
    form.querySelector("select, input")?.focus();
  });
  panel.querySelector("[data-reservation-cancel]")?.addEventListener("click", () => {
    if (form) form.hidden = true;
  });
  panel.querySelector('[name="participantType"]')?.addEventListener("change", () => toggleParticipantFields(panel));
  form?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const submit = form.querySelector('[type="submit"]');
    if (submit) submit.disabled = true;
    try {
      await createReservation(panel, form);
    } catch (error) {
      setStatus(panel, error.message || "No se pudo reservar la plaza", true);
      if (submit) submit.disabled = false;
    }
  });
  panel.querySelectorAll("[data-release-reservation]").forEach((button) => {
    button.addEventListener("click", async () => {
      if (!window.confirm("¿Liberar esta plaza reservada?")) return;
      button.disabled = true;
      try {
        await releaseReservation(panel, button.dataset.releaseReservation);
      } catch (error) {
        setStatus(panel, error.message || "No se pudo liberar la plaza", true);
        button.disabled = false;
      }
    });
  });
}

async function enhance() {
  if (enhancing) return;
  const roster = document.getElementById("courseStudentsRoster");
  if (!roster || document.getElementById(PANEL_ID)) return;
  const courseId = courseIdFromStudentPanel(roster);
  if (!courseId) return;

  enhancing = true;
  try {
    const state = await readAdminState();
    if (!state) return;
    const course = getCourse(state, courseId);
    if (!course) return;
    const panel = buildPanel(state, course);
    roster.before(panel);
    bindPanel(panel);
  } catch (error) {
    // The legacy renderer can be between views while the observer runs; retry on the next DOM change.
  } finally {
    enhancing = false;
  }
}

function scheduleEnhance() {
  if (scheduled) return;
  scheduled = true;
  queueMicrotask(() => {
    scheduled = false;
    enhance();
  });
}

export function installCourseReservationEnhancer() {
  if (typeof document === "undefined" || typeof MutationObserver === "undefined") return;
  scheduleEnhance();
  const observer = new MutationObserver(scheduleEnhance);
  observer.observe(document.body, { childList: true, subtree: true });
}
