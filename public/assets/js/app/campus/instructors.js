import { escapeHtml } from "../ui/formatters.js";

function renderRow(state, entry = {}, issued = false) {
  const options = (state.members || []).filter(member => member.id === entry.memberId ||
    (state.associates || []).some(associate => associate.id === member.associateId || associate.linkedMemberId === member.id));
  return `<div class="course-instructor-row" data-instructor-row>
    <label class="inline-field">Socio instructor
      <select data-instructor-member aria-label="Socio instructor" ${issued ? "disabled" : ""}>
        <option value="">Seleccionar socio</option>
        ${options.map(item => `<option value="${escapeHtml(item.id)}" ${item.id === entry.memberId ? "selected" : ""}>${escapeHtml(item.name)}</option>`).join("")}
      </select>
    </label>
    <label class="inline-field">Horas impartidas
      <input data-instructor-hours aria-label="Horas impartidas" type="number" min="0.01" step="0.01" value="${escapeHtml(entry.hours ?? "")}" ${issued ? "readonly" : ""}>
    </label>
    ${issued ? '<span class="small-chip">Diploma emitido</span>' : '<button type="button" class="mini-button" data-action="remove-course-instructor">Quitar</button>'}
  </div>`;
}

export function renderCourseInstructors(state, course, id) {
  const entries = [...(course.instructors || [])];
  for (const issued of course.instructorDiplomas || []) {
    const index = entries.findIndex(item => item.memberId === issued.memberId);
    if (index >= 0) entries[index] = issued;
    else entries.push(issued);
  }
  return `<fieldset id="${id}" class="course-instructors studio-full">
    <legend>Equipo instructor</legend>
    <div data-instructor-rows>${entries.map(item => renderRow(state, item,
      (course.instructorDiplomas || []).some(record => record.memberId === item.memberId))).join("")}</div>
    <button type="button" class="mini-button" data-action="add-course-instructor">Anadir instructor</button>
  </fieldset>`;
}

export function readCourseInstructors(id, fallback = []) {
  const editor = document.getElementById(id);
  if (!editor) return fallback;
  return Array.from(editor.querySelectorAll("[data-instructor-row]")).map(row => ({
    memberId: row.querySelector("[data-instructor-member]").value,
    hours: Number(row.querySelector("[data-instructor-hours]").value)
  })).filter(item => item.memberId || item.hours);
}

export function handleCourseInstructorAction(target, state) {
  const editor = target.closest(".course-instructors");
  if (!editor) return;
  if (target.dataset.action === "remove-course-instructor") target.closest("[data-instructor-row]")?.remove();
  if (target.dataset.action === "add-course-instructor") {
    editor.querySelector("[data-instructor-rows]").insertAdjacentHTML("beforeend", renderRow(state));
    editor.querySelector("[data-instructor-row]:last-child select")?.focus();
  }
}

export function renderInstructorDiplomas(course, members, memberId = "") {
  const records = course.instructorDiplomas || [];
  const ids = [...new Set([...(course.instructors || []).map(item => item.memberId), ...records.map(item => item.memberId)])];
  return ids.filter(id => !memberId || id === memberId).map(id => {
    const record = records.find(item => item.memberId === id);
    const member = members.find(item => item.id === id);
    const hours = record?.hours ?? course.instructors.find(item => item.memberId === id)?.hours;
    const base = `/api/diplomas/${encodeURIComponent(course.id)}/${encodeURIComponent(id)}`;
    return `<article class="table-card instructor-diploma-card">
      <p class="eyebrow">Instructor de Isocrona Zero</p>
      <h4>${escapeHtml(record?.title || course.title)}</h4>
      <p>${escapeHtml(member?.name || "")} · ${escapeHtml(Number(hours).toLocaleString("es-ES"))} h impartidas</p>
      <p class="muted">${record ? "Diploma de instructor disponible" : "Pendiente de finalizacion y cierre del curso"}</p>
      ${record ? `<div class="chip-row">
        <a class="button-link" href="${base}?role=instructor" target="_blank" rel="noopener noreferrer">Ver diploma de instructor</a>
        <a class="mini-button" href="${base}.pdf?role=instructor">Descargar PDF de instructor</a>
      </div>` : ""}
    </article>`;
  }).join("");
}
