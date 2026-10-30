const ADVANCED_DETAILS_CLASS = "iz-course-advanced";

function fieldContainer(id) {
  const field = document.getElementById(id);
  if (!field) return null;
  return field.closest("label") || field.closest(".inline-field") || field.parentElement;
}

function ensureAdvancedDetails(root, anchor) {
  if (!root || !anchor) return null;
  let details = root.querySelector(`.${ADVANCED_DETAILS_CLASS}`);
  if (details) return details;

  details = document.createElement("details");
  details.className = ADVANCED_DETAILS_CLASS;
  details.innerHTML = `
    <summary>
      <span>Opciones avanzadas</span>
      <small>Configuración que normalmente no necesitas tocar</small>
    </summary>
    <div class="studio-grid iz-course-advanced-grid"></div>
  `;
  anchor.insertAdjacentElement("afterend", details);
  return details;
}

function moveFieldsToAdvanced(root, anchor, ids) {
  const nodes = ids.map(fieldContainer).filter(Boolean);
  if (!nodes.length) return;
  const details = ensureAdvancedDetails(root, anchor);
  const grid = details?.querySelector(".iz-course-advanced-grid");
  if (!grid) return;
  nodes.forEach((node) => {
    if (!grid.contains(node)) grid.appendChild(node);
  });
}

function simplifyInstructorPicker(id) {
  const picker = document.getElementById(id);
  if (!picker || picker.dataset.izSimplified === "true") return;
  picker.dataset.izSimplified = "true";
  const label = picker.querySelector("label.inline-field");
  if (label) label.textContent = "Instructores";

  const help = document.createElement("p");
  help.className = "field-hint iz-instructor-hint";
  help.textContent = "Selecciona uno o varios instructores. Se usarán también para su historial y certificados de instructor.";
  const selection = picker.querySelector(".instructor-selection");
  (selection || picker).insertAdjacentElement(selection ? "beforebegin" : "beforeend", help);
}

function simplifyContentStatus() {
  const select = document.getElementById("editCourseContentStatus");
  if (!select || select.dataset.izLabels === "true") return;
  select.dataset.izLabels = "true";
  const labels = {
    draft: "Borrador",
    outline: "En preparación",
    ready: "Listo"
  };
  Array.from(select.options).forEach((option) => {
    if (labels[option.value]) option.textContent = labels[option.value];
  });
}

function simplifyCreateCourseForm() {
  const form = document.getElementById("courseForm");
  if (!form || form.dataset.izSimplified === "true") return;
  form.dataset.izSimplified = "true";

  const module = form.querySelector(".content-module");
  const heading = module?.querySelector(".module-head h4");
  const intro = module?.querySelector(".module-head .muted");
  if (heading) heading.textContent = "Crear formación";
  if (intro) intro.textContent = "Completa lo esencial. La configuración menos habitual queda agrupada en Opciones avanzadas.";

  simplifyInstructorPicker("courseInstructors");

  const mainGrid = document.getElementById("courseTitle")?.closest(".studio-grid")
    || document.getElementById("courseCapacity")?.closest(".studio-grid");
  if (!mainGrid) return;

  moveFieldsToAdvanced(form, mainGrid, [
    "courseClass",
    "courseTemplate",
    "courseCoordinator",
    "courseAudience"
  ]);
}

function simplifyEditCourseForm() {
  const title = document.getElementById("editCourseTitle");
  if (!title) return;

  const root = title.closest("form") || title.closest(".content-module") || title.closest("section") || title.parentElement?.parentElement;
  if (!root || root.dataset.izSimplified === "true") {
    simplifyContentStatus();
    simplifyInstructorPicker("editCourseInstructors");
    return;
  }
  root.dataset.izSimplified = "true";

  simplifyContentStatus();
  simplifyInstructorPicker("editCourseInstructors");

  const mainGrid = title.closest(".studio-grid") || title.parentElement?.parentElement;
  if (!mainGrid) return;

  moveFieldsToAdvanced(root, mainGrid, [
    "editCourseClass",
    "editCourseTemplate",
    "editCourseContentStatus",
    "editCourseCoordinator",
    "editCourseAudience"
  ]);
}

function simplifyCourseForms() {
  simplifyCreateCourseForm();
  simplifyEditCourseForm();
}

let scheduled = false;
function scheduleSimplify() {
  if (scheduled) return;
  scheduled = true;
  requestAnimationFrame(() => {
    scheduled = false;
    simplifyCourseForms();
  });
}

const observer = new MutationObserver(scheduleSimplify);
observer.observe(document.body, { childList: true, subtree: true });

document.addEventListener("DOMContentLoaded", scheduleSimplify);
scheduleSimplify();
