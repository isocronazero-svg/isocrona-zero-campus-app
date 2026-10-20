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

async function writeAdminState(state) {
  const response = await fetch("/api/state", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ ...state, role: "admin" })
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok || payload?.ok === false) {
    throw new Error(payload?.error || payload?.message || "No se pudo guardar la reserva");
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

function findReusableGuest(state, email) {
  const normalized = clean(email).toLowerCase();
  if (!normalized) return null;
  return (state.members || []).find(
    (member) => member.source === "admin-course-guest" && clean(member.email).toLowerCase() === normalized
  ) || null;
}

function memberHasOtherReferences(state, memberId, excludedCourseId) {
  return (state.courses || []).some((course) => {
    if (course.id === excludedCourseId) return false;
    return (course.enrolledIds || []).includes(memberId) ||
      (course.waitingIds || []).includes(memberId) ||
      (course.diplomaReady || []).includes(memberId) ||
      (course.enrollmentSubmissions || []).some((submission) => submission.memberId === memberId);
  });
}

function buildPanel(state, course) {
  const options = reservationOptions(state, course);
  const reservations = (course.enrollmentSubmissions || []).filter(
    (submission) => submission.source === "admin-reservation" && activeReservation(submission)
  );
  const free = seatsLeft(course);
  const capacity = Math.max(0, Number(course.capacity || 0));
  const occupied = capacity - free;

  const panel = document.createElement("div");
  panel.className = "mail-card";
  panel.id = PANEL_ID;
  panel.dataset.courseId = course.id;
  panel.innerHTML = `
    <div class="row-between">
      <div>
        <p class="eyebrow">Antes de abrir inscripciones</p>
        <h4>Reservas administrativas</h4>
        <p class="muted">Añade socios o invitados externos. La plaza queda descontada del aforo desde este momento.</p>
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
          <label class="inline-field">Email<input name="email" type="email" autocomplete="off" placeholder="Opcional" /></label>
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
        return `<div class="timeline-item compact-timeline-item">
          <div class="row-between">
            <div><strong>${escapeHtml(member?.name || "Participante")}</strong><p class="muted">Reserva administrativa · ${type}${payment}</p></div>
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

function toggleParticipantFields(panel) {
  const type = panel.querySelector('[name="participantType"]')?.value || "member";
  const member = panel.querySelector("[data-reservation-member]");
  const external = panel.querySelector("[data-reservation-external]");
  if (member) member.hidden = type !== "member";
  if (external) external.hidden = type !== "external";
}

async function createReservation(panel, form) {
  const courseId = panel.dataset.courseId;
  const data = new FormData(form);
  const type = clean(data.get("participantType"));
  setStatus(panel, "Guardando reserva...");
  const state = await readAdminState();
  if (!state) throw new Error("Solo administración puede reservar plazas");
  const course = getCourse(state, courseId);
  if (!course) throw new Error("Curso no encontrado");
  if (seatsLeft(course) <= 0) throw new Error("El curso ya está completo");

  let member = null;
  let createdGuest = false;
  if (type === "member") {
    const memberId = clean(data.get("memberId"));
    member = getMember(state, memberId);
    if (!member) throw new Error("Selecciona un socio");
  } else {
    const firstName = clean(data.get("firstName"));
    const lastName = clean(data.get("lastName"));
    const name = [firstName, lastName].filter(Boolean).join(" ");
    if (!name) throw new Error("Indica el nombre y apellidos del invitado");
    const email = clean(data.get("email")).toLowerCase();
    member = findReusableGuest(state, email);
    if (!member) {
      member = {
        id: `member-guest-${crypto.randomUUID()}`,
        name,
        role: "Participante externo",
        email,
        phone: clean(data.get("phone")),
        certifications: [],
        renewalsDue: 0,
        source: "admin-course-guest",
        createdAt: new Date().toISOString()
      };
      state.members = Array.isArray(state.members) ? state.members : [];
      state.members.push(member);
      createdGuest = true;
    }
  }

  const alreadyRegistered = (course.enrolledIds || []).includes(member.id) ||
    (course.waitingIds || []).includes(member.id) ||
    (course.enrollmentSubmissions || []).some((submission) => submission.memberId === member.id && activeReservation(submission));
  if (alreadyRegistered) {
    if (createdGuest) state.members = state.members.filter((item) => item.id !== member.id);
    throw new Error("Esta persona ya figura en el curso");
  }

  if (seatsLeft(course) <= 0) {
    if (createdGuest) state.members = state.members.filter((item) => item.id !== member.id);
    throw new Error("El curso ya está completo");
  }

  const now = new Date().toISOString();
  const fee = Number(course.enrollmentFee || 0);
  course.enrolledIds = unique([...(course.enrolledIds || []), member.id]);
  course.waitingIds = (course.waitingIds || []).filter((id) => id !== member.id);
  course.enrollmentSubmissions = Array.isArray(course.enrollmentSubmissions) ? course.enrollmentSubmissions : [];
  course.enrollmentSubmissions.push({
    id: `reservation-${crypto.randomUUID()}`,
    memberId: member.id,
    submittedAt: now,
    updatedAt: now,
    status: fee > 0 ? "pending-proof" : "confirmed",
    note: clean(data.get("note")),
    paymentProof: null,
    amount: Number.isFinite(fee) ? fee : 0,
    method: "Transferencia",
    source: "admin-reservation",
    participantType: type === "external" ? "external" : "member",
    reservedAt: now
  });

  await writeAdminState(state);
  setStatus(panel, "Plaza reservada correctamente.");
  window.location.reload();
}

async function releaseReservation(panel, reservationId) {
  const state = await readAdminState();
  if (!state) throw new Error("Solo administración puede liberar reservas");
  const course = getCourse(state, panel.dataset.courseId);
  if (!course) throw new Error("Curso no encontrado");
  const submission = (course.enrollmentSubmissions || []).find(
    (item) => item.id === reservationId && item.source === "admin-reservation"
  );
  if (!submission) throw new Error("Reserva administrativa no encontrada");

  const memberId = submission.memberId;
  course.enrolledIds = (course.enrolledIds || []).filter((id) => id !== memberId);
  course.waitingIds = (course.waitingIds || []).filter((id) => id !== memberId);
  course.enrollmentSubmissions = (course.enrollmentSubmissions || []).filter((item) => item.id !== reservationId);

  const member = getMember(state, memberId);
  if (member?.source === "admin-course-guest" &&
      !memberHasOtherReferences(state, memberId, course.id) &&
      !(state.accounts || []).some((account) => account.memberId === memberId)) {
    state.members = (state.members || []).filter((item) => item.id !== memberId);
  }

  await writeAdminState(state);
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
