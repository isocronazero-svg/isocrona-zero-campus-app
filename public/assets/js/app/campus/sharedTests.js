import { escapeHtml } from "../ui/formatters.js";

export function readCourseSharedTestSelection(course) {
  const editor = document.getElementById("courseSharedTestEditor");
  if (!editor) return {
    sharedTestQuestionIds: course.sharedTestQuestionIds || [],
    sharedTestPublished: course.sharedTestPublished === true
  };
  return {
    sharedTestQuestionIds: [...editor.querySelectorAll("[data-shared-question]:checked")].map((input) => input.value),
    sharedTestPublished: editor.querySelector("[data-shared-published]").checked
  };
}

export function renderCourseSharedTestEditor(course, bank = []) {
  const selected = new Set(course.sharedTestQuestionIds || []);
  const available = bank.filter((question) => question.active !== false && question.published !== false);
  const known = new Set(available.map((question) => question.id));
  const questions = [...available, ...[...selected].filter((id) => !known.has(id)).map((id) => ({ id, prompt: "Pregunta no disponible: desmarcala antes de guardar" }))];
  return `<details id="courseSharedTestEditor" class="content-module">
    <summary><strong>Test del curso · Banco común de Zona Test</strong> (<span data-shared-count>${selected.size}</span> seleccionadas)</summary>
    <p class="muted">Elige hasta 200 preguntas. Se reutilizan las mismas preguntas de Zona Test y de las sesiones en vivo. Guarda el curso para aplicar la selección.</p>
    <label class="inline-field">Buscar por texto o categoría <input type="search" data-shared-search placeholder="Ej.: incendios, rescate…" /></label>
    <div class="panel-stack" style="max-height:22rem;overflow:auto;margin-block:1rem">
      ${questions.map((question) => `<label class="timeline-item" data-shared-row>
        <input type="checkbox" data-shared-question value="${escapeHtml(question.id)}" ${selected.has(question.id) ? "checked" : ""} />
        <span>${escapeHtml(question.prompt)}</span>
        <small class="muted">${escapeHtml([question.category, question.difficulty].filter(Boolean).join(" · "))}</small>
      </label>`).join("") || '<p class="muted">Añade o importa preguntas en Zona Test para seleccionarlas aquí.</p>'}
    </div>
    <label><input type="checkbox" data-shared-published ${course.sharedTestPublished ? "checked" : ""} /> Publicar el test de práctica para el alumnado inscrito</label>
    <p class="muted">Los resultados quedan en el historial del test. La evaluación académica y los diplomas siguen bajo control del instructor.</p>
    ${selected.size ? `<a class="button-link" href="/course-test.html?courseId=${encodeURIComponent(course.id)}" target="_blank" rel="noopener">Vista previa y test en vivo (selección guardada)</a>` : ""}
  </details>`;
}

document.addEventListener("input", (event) => {
  const editor = event.target.closest?.("#courseSharedTestEditor");
  if (!editor) return;
  const normalize = (value) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const query = normalize(editor.querySelector("[data-shared-search]").value.trim());
  editor.querySelectorAll("[data-shared-row]").forEach((row) => { row.hidden = !normalize(row.textContent).includes(query); });
  editor.querySelector("[data-shared-count]").textContent = editor.querySelectorAll("[data-shared-question]:checked").length;
});
