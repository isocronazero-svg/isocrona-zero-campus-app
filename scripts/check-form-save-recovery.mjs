import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

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
    console, Response, structuredClone,
    document: {
      getElementById: (name) => fields.get(name) || null,
      createElement: () => ({ dataset: {}, setAttribute() {} }),
      addEventListener: (event, handler) => { context.submit = handler; }
    },
    hasLoaded: true,
    session: { role: "admin" },
    state: { selectedAssociateId: "associate-test" },
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
    readCourseFieldValue: () => "Valor",
    readCourseNumberValue: () => 10,
    hasCourseModuleEditors: () => false,
    hasCourseResourceEditors: () => false,
    buildModulesFromSessions: () => [],
    requestAnimationFrame: () => {},
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
  vm.runInContext(jsonReader + helpers + submit, context);
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

// Exercise the real submit wiring for all five protected forms.
for (const id of ["memberImportForm", "courseImportForm", "associatePaymentForm", "courseEditForm", "courseForm"]) {
  const f = fixture(id);
  f.field("memberImportCsv", "nombre,email\nPrueba,prueba@example.test");
  f.field("courseImportCsv", "titulo\nCurso de prueba");
  for (const [name, value] of Object.entries({
    associatePaymentDate: "2026-09-23", associatePaymentAmount: "50", associatePaymentYear: "2026",
    associatePaymentMethod: "Transferencia", associatePaymentNote: "Nota que debe conservarse",
    courseTitle: "Curso nuevo", courseClass: "practico", courseType: "Practica", courseStart: "2026-10-01",
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
  assert.equal(f.form.resets, id === "courseEditForm" ? 0 : 1, `${id}: successful submit completes`);
  assert.ok(f.context.renderCount > 0);
  if (id === "memberImportForm") assert.equal(f.context.membersSectionMode, "directory");
  if (id === "courseImportForm") assert.equal(f.context.coursesSectionMode, "catalog");
}

// Non-form actions retain their existing refresh and rendering behavior.
{
  const f = fixture();
  assert.equal(await f.context.invokeJsonAction("/api/action", {}, "Listo"), true);
  assert.equal(f.context.renderCount, 2);
}

console.log("Form save recovery check passed (draft preservation, double submit, confirmed saves and form wiring).");
