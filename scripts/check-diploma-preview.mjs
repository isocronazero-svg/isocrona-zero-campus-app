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

console.log("Diploma preview V1.1: borrador, permisos, contenido y no-emision OK.");
