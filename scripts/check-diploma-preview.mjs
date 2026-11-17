import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const {
  buildPreviewModel,
  buildSections,
  createDiplomaPreviewHandler,
  normalizePreviewCourse
} = require("../server/diploma-preview.js");

{
  const sections = buildSections({
    certificateContents: [
      "Ventilacion tactica | Lectura de humos; Presion positiva",
      "Seguridad operativa"
    ]
  });
  assert.equal(sections.length, 2);
  assert.equal(sections[0].title, "Contenidos formativos");
  assert.deepEqual(sections[0].items, ["Seguridad operativa"]);
  assert.equal(sections[1].title, "Ventilacion tactica");
  assert.deepEqual(sections[1].items, ["Lectura de humos", "Presion positiva"]);
}

{
  const course = normalizePreviewCourse({ course: {
    title: "Curso QA",
    startDate: "2026-10-20",
    endDate: "2026-10-21",
    hours: 8,
    certificateCity: "Castellon",
    certificateContents: ["Bloque 1 | Item A; Item B"]
  }});
  const model = buildPreviewModel({ settings: { certificateCity: "Madrid" } }, course);
  assert.equal(model.preview, true);
  assert.equal(model.registryNumber, "VISTA PREVIA");
  assert.equal(model.code, "SIN VALIDEZ");
  assert.equal(model.city, "Castellon");
  assert.equal(model.course.title, "Curso QA");
  assert.match(model.dateRange, /20 de octubre de 2026/);
}

function createResponseRecorder() {
  return {
    status: null,
    headers: null,
    body: "",
    writeHead(status, headers) { this.status = status; this.headers = headers; },
    end(body = "") { this.body = String(body); }
  };
}

{
  const state = { settings: { certificateCity: "Valencia", diplomaSignerA: "Formacion", diplomaSignerB: "Presidencia" } };
  let account = { id: "member-1", role: "member", name: "Socio" };
  let jsonResponse = null;
  const handler = createDiplomaPreviewHandler({
    readState: () => structuredClone(state),
    requireAuthenticatedAccount: () => account,
    readJsonBody: async (req) => req.body || {},
    sendJson: (_res, status, payload) => { jsonResponse = { status, payload }; },
    sendJsonError: (_res, error, fallback) => { jsonResponse = { status: 400, payload: { ok: false, error: error.message || fallback } }; }
  });

  const denied = createResponseRecorder();
  await handler({ method: "POST", body: { course: { title: "Curso" } } }, denied, new URL("http://test/api/admin/diploma-preview"));
  assert.equal(jsonResponse.status, 403);

  account = { id: "admin-1", role: "admin", name: "Admin" };
  jsonResponse = null;
  const res = createResponseRecorder();
  await handler({
    method: "POST",
    body: { course: {
      title: "Rescate vertical QA",
      startDate: "2026-10-20",
      endDate: "2026-10-21",
      hours: 12,
      certificateContents: ["Maniobras | Ascenso; Descenso; Rescate"]
    }}
  }, res, new URL("http://test/api/admin/diploma-preview"));
  assert.equal(res.status, 200);
  assert.match(res.headers["Content-Type"], /text\/html/);
  assert.match(res.headers["Cache-Control"], /no-store/);
  assert.match(res.body, /VISTA PREVIA/);
  assert.match(res.body, /SIN VALIDEZ/);
  assert.match(res.body, /Rescate vertical QA/);
  assert.match(res.body, /aria-label="Anverso"/);
  assert.match(res.body, /aria-label="Reverso"/);
  assert.equal(state.issuedDiplomas, undefined, "La vista previa no debe emitir ni guardar diplomas");
}



{
  const fields = new Map([
    ["editCourseTitle", { value: "Tráfico y ascensores" }],
    ["editCourseCertificateContents", { value: "Maniobras | Levantamiento; Ampliación" }]
  ]);
  let previewButton;
  const editForm = {
    dataset: {},
    querySelector: () => ({ before: (button) => { previewButton = button; } })
  };
  const frame = {};
  const dialog = { open: true, querySelector: () => frame };
  const capturedBodies = [];
  const fixture = {
    role: "admin",
    selectedCourseId: "course-test",
    courses: [{
      id: "course-test",
      title: "Curso guardado",
      attachments: [{ dataUrl: "x".repeat(300 * 1024) }],
      modules: [{
        title: "Práctica",
        goal: "Objetivo",
        lessons: [{
          instructions: "Instrucciones de la maniobra",
          texture: "x".repeat(300 * 1024)
        }]
      }]
    }]
  };
  globalThis.document = {
    getElementById: (id) => {
      if (id === "courseEditForm") return editForm;
      if (id === "diplomaPreviewDialog") return dialog;
      return fields.get(id);
    },
    createElement: () => ({
      dataset: {},
      addEventListener(_event, handler) { this.click = handler; }
    }),
    addEventListener() {}
  };
  globalThis.window = {
    location: { href: "https://preview.test/", origin: "https://preview.test" },
    async fetch(input, init) {
      if (input === "/api/state") return { ok: true, clone: () => ({ json: async () => fixture }) };
      assert.equal(input, "/api/admin/diploma-preview");
      capturedBodies.push(init.body);
      return { ok: true, text: async () => "<html><head></head><body></body></html>" };
    }
  };
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (...args) => window.fetch(...args);
  try {
    const { installDiplomaPreviewEnhancer } = await import("../public/assets/js/app/campus/diplomaPreviewEnhancer.js");
    installDiplomaPreviewEnhancer();
    await window.fetch("/api/state");
    await previewButton.click();
    const { course } = JSON.parse(capturedBodies[0]);
    assert.ok(Buffer.byteLength(capturedBodies[0]) < 256 * 1024);
    assert.equal(course.title, "Tráfico y ascensores");
    assert.deepEqual(buildSections(course), [{ title: "Maniobras", items: ["Levantamiento", "Ampliación"] }]);
    fields.get("editCourseCertificateContents").value = "";
    await previewButton.click();
    assert.notEqual(capturedBodies[0], capturedBodies[1]);
    assert.deepEqual(buildSections(JSON.parse(capturedBodies[1]).course), [
      { title: "Práctica", items: ["Instrucciones de la maniobra"] }
    ]);
  } finally {
    globalThis.fetch = originalFetch;
    delete globalThis.window;
    delete globalThis.document;
  }
}

console.log("Diploma preview V1.1: borrador, permisos, contenido y no-emision OK.");
