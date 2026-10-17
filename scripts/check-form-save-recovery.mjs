import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { createRequire } from "node:module";
const EnrollmentTime = createRequire(import.meta.url)("../public/enrollment-time.js");

// Exercise the shipped helper and submit handler, without bootstrapping a real campus.
const source = readFileSync(new URL("../public/app.js", import.meta.url), "utf8");
function between(start, end) {
  const from = source.indexOf(start);
  const to = source.indexOf(end, from + start.length);
  assert.ok(from >= 0 && to > from, `Missing source boundary: ${start}`);
  return source.slice(from, to);
}
const helpers = between("function setFormSaveStatus(", "function getAssociateDeletionImpactSummary(");
const jsonReader = between("async function readJsonResponse(", "async function loadStorageMeta(");
const submit = between('document.addEventListener("submit", async (event) => {', "\nbootstrap();");

function fixture(id = "courseEditForm") {
  const fields = new Map();
  const attributes = new Map();
  const form = {
    id,
    dataset: {},
    elements: [],
    status: null,
    resets: 0,
    getAttribute: (key) => attributes.get(key) ?? null,
    setAttribute: (key, value) => attributes.set(key, value),
    removeAttribute: (key) => attributes.delete(key),
    querySelector: () => form.status,
    append: (status) => { form.status = status; },
    reset() {
      form.resets++;
      for (const field of fields.values()) field.value = "";
    }
  };
  function field(name, value, disabled = false, type = "text") {
    const control = { value, disabled, type };
    fields.set(name, control);
    form.elements.push(control);
    return control;
  }
  const title = field("title", "Titulo escrito sin guardar");
  const submitButton = field("submit", "", false, "submit");
  const originallyDisabled = field("readonly", "no cambiar", true);
  const requests = [];
  const toasts = [];
  const context = vm.createContext({
    EnrollmentTime,
    console, Response, structuredClone,
    document: {
      getElementById: (name) => fields.get(name) || null,
      createElement: () => ({ dataset: {}, setAttribute() {} }),
      addEventListener: (event, handler) => { context.submit = handler; }
    },
    hasLoaded: true,
    session: { role: "admin" },
    state: { selectedAssociateId: "associate-test", settings: {} },
    normalizeCampusAccountRole: (value) => value,
    ASSOCIATE_ADMIN_ONLY_FORM_IDS: new Set(),
    isAdminView: () => true,
    isAdminSession: () => true,
    findAssociate: () => ({ id: "associate-test" }),
    getTodayDateInput: () => "2026-09-23",
    getSelectedCourse: () => ({ id: "course-test", title: "Antes" }),
    normalizeCourse: (course) => course,
    buildCourseBlueprint: () => ({}),
    inferCourseTemplate: () => "operativo",
    readCourseSharedTestSelection: () => ({ sharedTestQuestionIds: [], sharedTestPublished: false }),
    normalizeCourseAccessScope: () => "members",
    normalizeDateTimeLocalInput: (value) => value,
    readCourseTrimmedValue: () => "Curso editado",
    readCourseFieldValue: (field) => ({ editCourseEnrollmentOpensAt: "2026-10-10T22:26", editCourseEnrollmentClosesAt: "",
      editCourseStart: "2026-10-12", editCourseEnd: "2026-10-13" })[field] ?? "Valor",
    readCourseNumberValue: () => 10,
    hasCourseModuleEditors: () => false,
    hasCourseResourceEditors: () => false,
    buildModulesFromSessions: () => [],
    requestAnimationFrame: () => {},
    readInstructorSelection: () => [],
    readJourneyClassification: (course = {}) => ({ journeyTypeId: course.journeyTypeId || "", journeyTypeLabel: course.journeyTypeLabel || "" }),
    journeyTypeIdForLabel: (label) => "journey-" + label.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    syncStatus: "",
    membersSectionMode: "import",
    coursesSectionMode: "import",
    courseWorkbenchMode: "ficha",
    campusSectionMode: "courses",
    renderCount: 0,
    render: () => {
      context.renderCount++;
      // Re-rendering replaces the form and destroys values not yet in state.
      for (const control of fields.values()) control.value = "";
    },
    fetch: async (url, options) => {
      requests.push({ url, ...options });
      return new Response(JSON.stringify({ ok: true, message: "Guardado" }));
    },
    refreshState: async () => {},
    applySessionToState: () => {},
    syncAssociateSelectionTargets: () => {},
    showToast: (message, kind) => toasts.push({ message, kind })
  });
  vm.runInContext(jsonReader + helpers + between("async function persistAdminSettingsAndRender(", "function mergeScopedMemberChangesIntoFullState(") + submit, context);
  return { context, form, field, title, submitButton, originallyDisabled, requests, toasts };
}

function save(f) {
  return f.context.invokeJsonAction("/api/courses/course-test", { title: f.title.value }, "Guardado", "PATCH", f.form);
}

// Validation, gateway, empty and malformed responses must leave the draft usable.
for (const [body, status, expected] of [
  ['{"ok":false,"error":"Faltan fechas"}', 400, /Faltan fechas/],
  ["<html>Application failed to respond</html>", 502, /No se pudo confirmar/],
  ["", 200, /No se pudo confirmar/],
  ["null", 200, /No se pudo confirmar/]
]) {
  const f = fixture();
  f.context.fetch = async () => new Response(body, { status });
  assert.equal(await save(f), false);
  assert.equal(f.title.value, "Titulo escrito sin guardar");
  assert.equal(f.context.renderCount, 0);
  assert.equal(f.form.resets, 0);
  assert.equal(f.submitButton.disabled, false);
  assert.equal(f.originallyDisabled.disabled, true);
  assert.equal(f.form.getAttribute("aria-busy"), null);
  assert.match(f.form.status.textContent, expected);
}

// Rejected network request keeps the draft and permits a subsequent successful save.
{
  const f = fixture();
  const fetch = f.context.fetch;
  f.context.fetch = async () => { throw new TypeError("Failed to fetch"); };
  assert.equal(await save(f), false);
  assert.match(f.form.status.textContent, /Comprueba la conexion/);
  f.context.fetch = fetch;
  assert.equal(await save(f), true);
  assert.equal(f.context.renderCount, 1);
  assert.equal(f.requests.length, 1);
}

// A second submit while the first request is pending never sends a second mutation.
{
  const f = fixture();
  let release;
  let count = 0;
  f.context.fetch = () => {
    count++;
    return new Promise((resolve) => { release = resolve; });
  };
  const first = save(f);
  assert.equal(f.form.getAttribute("aria-busy"), "true");
  assert.equal(f.submitButton.disabled, true);
  assert.equal(f.title.disabled, true);
  assert.equal(f.title.value, "Titulo escrito sin guardar");
  assert.equal(await save(f), false);
  assert.equal(count, 1);
  release(new Response('{"ok":true}'));
  assert.equal(await first, true);
  assert.equal(f.submitButton.disabled, false);
  assert.equal(f.title.disabled, false);
  assert.equal(f.originallyDisabled.disabled, true);
}

// A confirmed write followed by a failed refresh must not offer to repeat the payment/import.
{
  const f = fixture("associatePaymentForm");
  f.context.refreshState = async () => { throw new Error("Refresh unavailable"); };
  assert.equal(await save(f), false);
  assert.equal(f.form.dataset.saveConfirmed, "true");
  assert.equal(f.submitButton.disabled, true);
  assert.equal(f.title.value, "Titulo escrito sin guardar");
  assert.equal(f.context.renderCount, 0);
  assert.match(f.form.status.textContent, /Guardado confirmado/);
  assert.equal(await save(f), false);
  assert.equal(f.requests.length, 1);
}

// Exercise the real submit wiring for all protected forms.
for (const id of ["memberImportForm", "courseImportForm", "associatePaymentForm", "courseEditForm", "courseForm", "associateEditForm", "settingsForm", "smtpSettingsForm"]) {
  const f = fixture(id);
  if (["associateEditForm", "settingsForm", "smtpSettingsForm"].includes(id)) {
    const block = between(`if (event.target.id === "${id}"`, '\n  if (event.target.id ===');
    for (const match of block.matchAll(/document\.getElementById\("([^"]+)"\)/g)) {
      f.field(match[1], "Dato que debe conservarse");
    }
  }
  f.field("memberImportCsv", "nombre,email\nPrueba,prueba@example.test");
  f.field("courseImportCsv", "titulo\nCurso de prueba");
  for (const [name, value] of Object.entries({
    associatePaymentDate: "2026-09-23", associatePaymentAmount: "50", associatePaymentYear: "2026",
    associatePaymentMethod: "Transferencia", associatePaymentNote: "Nota que debe conservarse",
    courseCreationMode: "course", intensiveDayTitle: "", intensiveDayDate: "", courseTitle: "Curso nuevo", courseClass: "practico", courseType: "Practica", courseStart: "2026-10-01",
    courseEnd: "2026-10-02", courseHours: "8", courseCapacity: "12", courseCoordinator: "Coordinacion",
    courseAudience: "Socios", courseAccessScope: "members", courseEnrollmentOpensAt: "", courseTemplate: "operativo"
  })) f.field(name, value);
  f.context.fetch = async () => new Response('{"ok":false,"error":"Error simulado"}', { status: 503 });
  await f.context.submit({ target: f.form, preventDefault() {} });
  assert.equal(f.form.resets, 0, `${id}: must not reset on failure`);
  assert.equal(f.context.renderCount, 0, `${id}: must not remount on failure`);
  assert.equal(f.context.membersSectionMode, "import");
  assert.equal(f.context.coursesSectionMode, "import");
  assert.equal(f.title.value, "Titulo escrito sin guardar");
  assert.match(f.form.status.textContent, /Error simulado/);
  f.context.fetch = async () => new Response('{"ok":true,"message":"Guardado"}');
  await f.context.submit({ target: f.form, preventDefault() {} });
  assert.equal(f.form.resets, ["courseEditForm", "associateEditForm", "settingsForm", "smtpSettingsForm"].includes(id) ? 0 : 1, `${id}: successful submit completes`);
  assert.ok(f.context.renderCount > 0);
  if (id === "memberImportForm") assert.equal(f.context.membersSectionMode, "directory");
  if (id === "courseImportForm") assert.equal(f.context.coursesSectionMode, "catalog");
}

// Invalid intensive-day submissions show an actionable error and keep the draft untouched.
{
  const f = fixture("courseForm");
  for (const [name, value] of Object.entries({
    courseCreationMode: "intensive", intensiveDayTitle: "RIT", intensiveDayDate: "",
    courseTitle: "", courseClass: "", courseType: "", courseStart: "", courseEnd: "",
    courseHours: "0", courseCapacity: "2.5", courseCoordinator: "", courseAudience: "",
    courseAccessScope: "members", courseEnrollmentOpensAt: "", courseTemplate: "operativo"
  })) f.field(name, value);
  await f.context.submit({ target: f.form, preventDefault() {} });
  assert.equal(f.requests.length, 0);
  assert.equal(f.form.resets, 0);
  assert.equal(f.context.renderCount, 0);
  assert.equal(f.context.document.getElementById("intensiveDayTitle").value, "RIT");
  assert.match(f.form.status.textContent, /fecha de la jornada/);
  assert.match(f.form.status.textContent, /horas deben ser mayores/);
  assert.match(f.form.status.textContent, /plazas deben ser un número entero/);
}

// Exercise the real intensive submit, including stale values from normal-course mode.
for (const title of ["Accidentes de tráfico", "Rescate vertical", "RIT", "Incendios Estructurales",
  "Riesgos Tecnológicos", "Rescate en ríos", "GOM"]) {
  const f = fixture("courseForm");
  for (const [name, value] of Object.entries({
    courseCreationMode: "intensive", intensiveDayTitle: title, intensiveDayDate: "2026-11-15",
    courseTitle: "Borrador de curso", courseClass: "teorico", courseType: "Otra especialidad",
    courseStart: "2026-11-01", courseEnd: "2026-11-04", courseHours: "6.5", courseCapacity: "16",
    courseCoordinator: "Texto previo", courseAudience: "Otro publico", courseAccessScope: "members",
    courseEnrollmentOpensAt: "", courseTemplate: "operativo"
  })) f.field(name, value);
  f.field("courseGenerateContent", "on", true, "checkbox").checked = true;
  f.context.readInstructorSelection = () => ["instructor-one", "instructor-two", "instructor-three"];
  f.context.buildCourseBlueprint = () => { throw new Error("Intensive day must not generate hidden content"); };
  await f.context.submit({ target: f.form, preventDefault() {} });
  assert.equal(f.requests.length, 1);
  assert.equal(f.requests[0].url, "/api/courses");
  assert.equal(f.requests[0].method, "POST");
  const { course } = JSON.parse(f.requests[0].body);
  assert.equal(course.title, title);
  assert.equal(course.startDate, "2026-11-15");
  assert.equal(course.endDate, course.startDate);
  assert.equal(course.courseClass, "practico");
  assert.equal(course.type, "Jornada intensiva");
  assert.equal(course.status, "Planificacion");
  assert.equal(course.modality, "Presencial");
  assert.equal(course.diplomaTemplate, "Aprovechamiento");
  assert.equal(course.contentTemplate, "intensivo");
  assert.equal(course.hours, 6.5);
  assert.equal(course.capacity, 16);
  assert.equal(course.coordinator, "");
  assert.equal(course.audience, "");
  assert.deepEqual(course.instructorAssociateIds, ["instructor-one", "instructor-two", "instructor-three"]);
  assert.equal(f.form.resets, 1);
}

// Editing an unrelated field keeps fractional hours in the actual PATCH handler.
for (const hours of [0.5, 6.5]) {
  const f = fixture("courseEditForm");
  f.context.getSelectedCourse = () => ({ id: "fractional-day", title: "RIT", hours });
  f.context.readCourseNumberValue = (id) => id === "editCourseHours" ? hours : 10;
  f.context.readCourseTrimmedValue = () => "Titulo editado";
  await f.context.submit({ target: f.form, preventDefault() {} });
  assert.equal(f.requests.length, 1);
  assert.equal(f.requests[0].url, "/api/courses/fractional-day");
  assert.equal(f.requests[0].method, "PATCH");
  const payload = JSON.parse(f.requests[0].body);
  assert.equal(payload.title, "Titulo editado");
  assert.equal(payload.hours, hours);
}

// Non-form actions retain their existing refresh and rendering behavior.
// A bad close, on creation or edit, must never clear/remount the administrator's draft.
for (const id of ["courseForm", "courseEditForm"]) {
  const f = fixture(id);
  const values = {
    courseCreationMode: "intensive", intensiveDayTitle: "RIT", intensiveDayDate: "2099-02-01",
    courseHours: "4", courseCapacity: "10", courseAccessScope: "members",
    courseEnrollmentOpensAt: "2099-01-01T09:00", courseEnrollmentClosesAt: "2099-02-01T12:00"
  };
  for (const [name, value] of Object.entries(values)) f.field(name, value);
  f.context.readCourseFieldValue = (name, fallback) => ({
    editCourseStart: "2099-02-01", editCourseEnd: "2099-02-01",
    editCourseEnrollmentOpensAt: values.courseEnrollmentOpensAt,
    editCourseEnrollmentClosesAt: values.courseEnrollmentClosesAt
  })[name] ?? fallback;
  await f.context.submit({ target: f.form, preventDefault() {} });
  assert.equal(f.requests.length, 0);
  assert.equal(f.form.resets, 0);
  assert.equal(f.context.renderCount, 0);
  assert.match(f.form.status.textContent, /cierre.*anterior/);
  assert.equal(f.context.document.getElementById("courseEnrollmentClosesAt").value, values.courseEnrollmentClosesAt);
}

{
  const f = fixture();
  assert.equal(await f.context.invokeJsonAction("/api/action", {}, "Listo"), true);
  assert.equal(f.context.renderCount, 2);
}

console.log("Form save recovery check passed (draft preservation, double submit, confirmed saves and form wiring).");

// A toast expiring while the user types or uploads must leave the form DOM intact.
{
  let expire, renders = 0, clears = 0;
  const context = {
    toastMessage: '', toastType: '', toastTimer: null,
    render: () => { renders++; },
    toastLayer: { replaceChildren: () => { clears++; } },
    setTimeout: callback => { expire = callback; return 1; }, clearTimeout: () => {}
  };
  vm.runInNewContext(between('function showToast(', 'function renderSidePanel(') + '\nshowToast("Guardado");', context);
  assert.equal(renders, 1);
  expire();
  assert.equal(renders, 1, 'Closing a toast must not replace a form or cancel an upload');
  assert.equal(clears, 1);
  assert.equal(context.toastMessage, '');
}
