import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const app = readFileSync(new URL("../public/app.js", import.meta.url), "utf8");
function source(name) {
  const start = app.indexOf(`function ${name}(`);
  const end = app.indexOf("\nfunction ", start + 1);
  assert.ok(start >= 0 && end > start, `${name} must exist`);
  return app.slice(start, end);
}
const escapeHtml = (value) => String(value ?? "").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
for (const associated of [true, false]) {
  const context = {
    session: { name: "QA", email: "qa@example.test" },
    isAdminView: () => false,
    getCurrentAssociate: () => associated ? { annualAmount: 50 } : null,
    getCurrentMember: () => ({ name: "QA", email: "qa@example.test" }),
    getUnreadMemberNotifications: () => [{}],
    getAssociatePortalSnapshot: () => ({ status: "Activa", firstName: "QA <texto>", associateNumber: "1" }),
    getAssociatePayments: () => [],
    getAssociateFeeHistoryRows: () => [],
    getAssociatePaymentSubmissionsForCurrentAssociate: () => [],
    getAssociateProfileRequestsForCurrentAssociate: () => [],
    getAssociateLegacyReviewIssues: () => [],
    getAssociateQuotaGap: () => 0,
    getAssociateCurrentYearFee: () => 50,
    isMemberPreviewSession: () => false,
    escapeHtml,
    formatCurrency: (value) => `${value} EUR`
  };
  const html = vm.runInNewContext(`${source("renderJoinView")}\nrenderJoinView();`, context);
  assert.match(html, associated ? /Solicitar cambio de ficha/ : /Tu acceso actual es solo campus/);
  if (associated) { assert.match(html, /QA &lt;texto&gt;/); assert.match(html, /notice-count">1 sin leer/); }
}

const course = {
  id: "course-qa",
  modules: [{ id: "module-qa", title: "Modulo QA", lessons: [
    { id: "lesson-1", title: "Leccion actual", blocks: [
      { id: "block-1", title: "Primer bloque", required: true },
      { id: "block-2", title: "Segundo bloque", required: true }
    ] },
    { id: "lesson-2", title: "Leccion siguiente", blocks: [] }
  ] }]
};
for (const previewOnly of [true, false]) {
  const context = {
    course, options: { role: "member", memberId: "member-qa", interactive: !previewOnly, previewOnly },
    state: {}, escapeHtml,
    getLearnerCourseModules: (value) => value.modules,
    getLearnerCourseContentStats: () => ({ lessonsCompleted: 0, lessonsTotal: 2, blocksCompleted: 0, blocksTotal: 2, blockProgress: 0 }),
    getCourseProgressEntry: () => ({ lessonIds: [], blockIds: [] }),
    getLearnerActiveModuleIndex: () => 0,
    getLearnerUnlockedModuleIndex: () => 0,
    getLearnerActiveLessonId: () => "lesson-1",
    getCourseBlockFlowMeta: () => ({ chipLabel: "Texto", description: "Contenido QA" }),
    renderLessonBlockPreview: () => "<p>Contenido seguro QA</p>"
  };
  const html = vm.runInNewContext(`${source("renderCourseRoadmap")}\nrenderCourseRoadmap(course, options);`, context);
  assert.match(html, /Leccion actual/);
  assert.match(html, /Leccion siguiente/);
  assert.match(html, /Completa antes Primer bloque/);
  assert.equal(html.includes('data-action="toggle-block-complete"'), !previewOnly);
}
console.log("Member profile and course rendering check passed.");

const normalizeContext = {
  escapeHtml: Object.assign(escapeHtml, { normalizeDisplayText: value => value }),
  normalizeCourseClass: value => value, normalizeCourseAccessScope: () => "members",
  normalizeDateTimeLocalInput: value => value, normalizeCourseModule: value => value,
  normalizeCourseResource: value => value, normalizeCourseQuestion: value => value,
  buildModulesFromSessions: sessions => sessions.map(s => ({ title: s.title, lessons: [] }))
};
for (const [modules, expected] of [[[], 0], [undefined, 1], [[{ title: "Conservar", lessons: [] }], 1]]) {
  const normalized = vm.runInNewContext(`${source("normalizeCourse")}\nnormalizeCourse(course);`, {
    ...normalizeContext, course: { sessions: [{ title: "Practica" }], ...(modules === undefined ? {} : { modules }) }
  });
  assert.equal(normalized.modules.length, expected);
}
const draft = vm.runInNewContext(`${source("readCourseEditorDraft")}\nreadCourseEditorDraft(course);`, {
  course: { modules: [], resources: [], sessions: [{ title: "Presencial" }] },
  document: { getElementById: id => id === "courseEditForm" ? {} : null }, normalizeCourse: c => c,
  hasCourseModuleEditors: () => false, hasCourseResourceEditors: () => false,
  readCourseSharedTestSelection: () => ({}), readCourseTrimmedValue: (_, fallback) => fallback,
  readCourseFieldValue: (_, fallback) => fallback, readCourseNumberValue: (_, fallback) => fallback
});
assert.equal(draft.modules.length, 0);
assert.equal(draft.sessions.length, 1);
for (const modules of [[], [{ id: "module", lessons: [] }]]) {
  const html = vm.runInNewContext(`${source("renderMemberCourseWorkspace")}\nrenderMemberCourseWorkspace(course);`, {
    course: { id: "course", title: "Practico", courseClass: "practico", modules, feedbackEnabled: false },
    state: { selectedMemberId: "member" }, learnerCourseWorkspaceMode: "roadmap", escapeHtml, formatDate: String,
    isMemberPreviewSession: () => false, getLearnerCourseJourney: () => ({ hasDiploma: false }), findMember: () => null,
    normalizeCourseClass: v => v, getLearnerCourseModules: c => c.modules, getVisibleCourseResources: () => [{}],
    describeCourseType: () => "Practico", renderLearnerProgressGuard: () => "",
    renderCourseRoadmap: () => "RECORRIDO_QA", renderCourseResources: () => "DOCUMENTOS_QA"
  });
  assert.ok(html.includes(modules.length ? "RECORRIDO_QA" : "DOCUMENTOS_QA"));
  if (modules.length) assert.match(html, /Documentacion/);
}
assert.match(app, /id="courseGenerateContent" type="checkbox" \/>/);
assert.match(app, /getElementById\("courseGenerateContent"\)\?\.checked/);
console.log("Optional course content rendering and empty editor draft checks passed.");

const switchStart = app.indexOf('  if (action === "set-course-curriculum-mode") {');
const switchEnd = app.indexOf('\n  if (action ===', switchStart + 1);
assert.ok(switchStart >= 0 && switchEnd > switchStart);
for (const mode of ["modules", "resources"]) {
  const selected = { modules: [], resources: [] };
  const edited = { modules: [{ title: "Modulo editado" }], resources: [{ label: "Documento editado", url: "https://example.test/qa" }] };
  let renders = 0;
  const context = {
    action: "set-course-curriculum-mode", actionTarget: { dataset: { mode } }, courseCurriculumMode: "old",
    getSelectedCourse: () => selected, isAdminSession: () => true, readCourseEditorDraft: () => edited,
    render: () => { assert.deepEqual(selected, edited, "Capture the DOM draft before rerendering"); renders++; },
    requestAnimationFrame: callback => callback(), focusCoursesWorkbench: () => {}
  };
  vm.runInNewContext(`(() => {${app.slice(switchStart, switchEnd)}})();`, context);
  assert.equal(renders, 1);
  assert.equal(context.courseCurriculumMode, mode);
}
console.log("Switching curriculum tabs preserves unsaved module and document fields.");

// Scoped student payloads hide classmates' IDs but retain the total occupancy.
for (const course of [
  { capacity: 12, enrolledCount: 10, enrolledIds: [] },
  { capacity: 12, enrolledCount: 12, enrolledIds: ["self"] },
  { capacity: 2, enrolledIds: ["a", "b", "c"] }
]) {
  const available = vm.runInNewContext(`${source("getCourseEnrolledCount")}\n${source("getCourseSeatsLeft")}\ngetCourseSeatsLeft(course);`, { course });
  assert.equal(available, Math.max(0, course.capacity - (course.enrolledCount ?? course.enrolledIds.length)));
}
console.log("Student seat counts check passed.");

const emptyJourney = {
  enrolled: true, waiting: false, hasDiploma: false, hasDocumentId: true,
  attendance: 0, evaluation: "Pendiente", pendingSteps: ["Asistencia pendiente"],
  progress: { lessonsTotal: 0, blocksTotal: 0, blocksCompleted: 0, blockProgress: 0 }
};
const completedContent = { lessonsTotal: 1, blocksTotal: 2, blocksCompleted: 2, blockProgress: 100 };
for (const [changes, headline] of [
  [{}, "Aula sin contenido publicado"],
  [{ progress: completedContent }, "Requisitos pendientes"],
  [{ progress: completedContent, pendingSteps: [] }, "Contenido completado"],
  [{ hasDiploma: true }, "Diploma disponible"],
  [{ enrolled: false }, "Pendiente de inscripcion"],
  [{ enrolled: false, waiting: true }, "Pendiente de plaza"],
  [{ nextStep: { lessonTitle: "Leccion pendiente", moduleTitle: "Modulo" } }, "Leccion pendiente"]
]) {
  const html = vm.runInNewContext(`${source("renderLearnerJourneyCard")}\nrenderLearnerJourneyCard(course, "member-qa");`, {
    course, session: { role: "member", memberId: "member-qa" }, escapeHtml,
    getLearnerCourseJourney: () => ({ ...emptyJourney, ...changes }),
    getCourseFinalTestStatus: () => ({ exists: false }),
    isMemberPreviewSession: () => false
  });
  assert.ok(html.includes(`<strong>${headline}</strong>`), headline);
  assert.doesNotMatch(html, /Curso completado/);
  if (headline === "Aula sin contenido publicado") assert.match(html, /Todavia no hay contenido publicado/);
  if (headline === "Diploma disponible") assert.match(html, /Ir a Mis diplomas/);
}
console.log("Learner journey distinguishes content progress from diploma completion.");

function renderEnrollment({ fee = 0, submission = null, waiting = false, full = false, intent = true, mode = "status", preview = false, open = true } = {}) {
  return vm.runInNewContext(`${source("renderSelectedCourse")}\nrenderSelectedCourse(course);`, {
    course: { ...course, title: "Curso QA", status: "Inscripcion abierta", capacity: 10,
      enrollmentFee: fee, enrollmentPaymentInstructions: "Transferencia QA", hours: 1 },
    state: { selectedMemberId: "member-qa" }, learnerCourseDetailsMode: mode, learnerEnrollmentIntent: intent,
    escapeHtml, formatDate: String, isAdminView: () => false, isMemberPreviewSession: () => preview,
    normalizeCourseClass: () => "teorico", describeCourseType: () => "Curso",
    getLearnerCourseJourney: () => ({ ...emptyJourney, enrolled: Boolean(submission) && !waiting, waiting }),
    getCertificateSections: () => [], getVisibleCourseResources: () => [],
    getCourseEnrolledCount: () => 1, isCourseOpenForEnrollment: () => open, getPublishedLessonCount: () => 0,
    getCourseEnrollmentCall: () => ({ waitlistMode: full, audienceLabel: "Solo socios", statusLabel: "Plazas disponibles", ctaLabel: full ? "Unirme a lista de espera" : "Inscribirme ahora" }),
    getCourseEnrollmentSubmission: () => submission, renderLearnerJourneyCard: () => "",
    getEnrollmentSubmissionStatusLabel: (status) => status, getEnrollmentSubmissionTone: () => "neutral",
    renderStoredProofLink: (proof) => proof ? '<a href="/qa-proof">Abrir justificante</a>' : ""
  });
}
for (const fee of [0, 25]) {
  const html = renderEnrollment({ fee });
  assert.match(html, /id="courseEnrollmentForm"/);
  assert.match(html, /id="courseEnrollmentNote"/);
  for (const id of ["courseEnrollmentAmount", "courseEnrollmentMethod", "courseEnrollmentProof"]) {
    assert.equal(html.includes(`id="${id}"`), fee > 0, `${id} for fee ${fee}`);
  }
  assert.equal(html.includes("Indicaciones de pago"), fee > 0);
  if (!fee) assert.match(html, /Confirma tu inscripcion sin coste/);
}
const freeSubmission = { status: "confirmed", amount: 0, method: "Transferencia", note: "Nota <QA>" };
for (const waiting of [false, true]) {
  const html = renderEnrollment({ submission: { ...freeSubmission, status: waiting ? "waiting" : "confirmed" }, waiting });
  assert.doesNotMatch(html, /courseEnrollmentProofUpdateForm|Justificante pendiente|Adjunta ahora la transferencia/);
  assert.match(html, /Inscripcion sin coste/);
  assert.match(html, /Nota &lt;QA&gt;/);
}
for (const [fee, amount] of [[25, 25], [25, 0], [0, 25], [0, 0]]) {
  const html = renderEnrollment({ fee, submission: { ...freeSubmission, amount, status: "pending-proof" } });
  assert.match(html, /id="courseEnrollmentProofUpdateForm"/);
  assert.match(html, /Justificante pendiente/);
  if (!fee && !amount) assert.match(html, /Justificante solicitado por administracion/);
}
const proofHtml = renderEnrollment({ fee: 25, submission: { ...freeSubmission, amount: 25, paymentProof: { name: "prueba.pdf" } } });
assert.match(proofHtml, /Abrir justificante/);
assert.doesNotMatch(proofHtml, /courseEnrollmentProofUpdateForm/);
console.log("Free enrollment omits payment requests while paid and historical submissions retain them.");

for (const mode of ["overview", "sessions", "resources", "certificate", "status"]) {
  for (const full of [false, true]) {
    const html = renderEnrollment({ mode, intent: false, full });
    assert.equal((html.match(/data-action="prepare-course-enrollment"/g) || []).length, 1);
    assert.match(html, full ? /Curso completo/ : /Inscribirme ahora/);
    if (full) assert.doesNotMatch(html, /Inscribirme ahora/);
  }
}
assert.doesNotMatch(renderEnrollment(), /data-action="prepare-course-enrollment"/);
assert.match(renderEnrollment(), /id="courseEnrollmentRequestForm" tabindex="-1"/);
for (const options of [{ preview: true }, { open: false }, { waiting: true }, { submission: freeSubmission }]) {
  assert.doesNotMatch(renderEnrollment(options), /data-action="prepare-course-enrollment"|id="courseEnrollmentForm"/);
}
assert.match(renderEnrollment({ submission: freeSubmission }), /Ya estás inscrito/);
const enrollmentHandler = app.slice(app.indexOf('if (event.target.id === "courseEnrollmentForm"'), app.indexOf('if (event.target.id === "courseFeedbackForm"'));
assert.doesNotMatch(enrollmentHandler, /window\.confirm/);
assert.match(enrollmentHandler, /if \(button.disabled\) return/);
assert.match(source("focusCourseEnrollment"), /getElementById\("courseEnrollmentRequestForm"\)/);
assert.doesNotMatch(source("renderCompactCourseCard"), /quick-enroll-banner/);
assert.doesNotMatch(source("renderCompactCourseBucket"), /renderQuickEnrollmentStrip/);

const proofHandler = app.slice(app.indexOf('if (event.target.id === "courseEnrollmentProofUpdateForm"'), app.indexOf('if (event.target.id === "courseEnrollmentForm"'));
const input = { files: [{ name: "qa.pdf" }] };
const button = { disabled: false, textContent: "Enviar justificante" };
const form = { querySelector: selector => selector.startsWith("button") ? button : selector.endsWith("Note") ? { value: "Nota QA" } : input };
let renders = 0;
let requests = 0;
const context = {
  event: { target: { id: "courseEnrollmentProofUpdateForm", ...form }, preventDefault() {} },
  isAdminView: () => false, getSelectedCourse: () => ({ id: "qa" }), isMemberPreviewSession: () => false,
  readFileInput: async element => { assert.equal(element, input); assert.equal(renders, 0); return { name: "qa.pdf" }; },
  fetch: async (_, options) => { requests++; assert.deepEqual(JSON.parse(options.body), { note: "Nota QA", paymentProof: { name: "qa.pdf" } }); return { ok: false, json: async () => ({ error: "Reintentar QA" }) }; },
  render: () => renders++, escapeHtml, toastTimer: null,
  toastLayer: { innerHTML: "", replaceChildren() {} }, setTimeout: () => 1, clearTimeout() {}
};
vm.runInNewContext(source("showToast"), context);
await vm.runInNewContext(`(async () => {${proofHandler}})();`, context);
assert.equal(renders, 0, "Failed upload must retain the selected file");
assert.equal(button.disabled, false);
button.disabled = true;
await vm.runInNewContext(`(async () => {${proofHandler}})();`, context);
assert.equal(requests, 1, "Ignore duplicate submission");
console.log("Single enrollment CTA, direct form, states and proof retry checks passed.");
const sectionRule = source("renderCourses").match(/const showCourseSection = [^;]+;/)[0];
for (const admin of [true, false]) {
  const visible = vm.runInNewContext(`${sectionRule} ["all", "catalog", "details", "workbench"].filter(showCourseSection);`, {
    isAdminView: () => admin, coursesSectionMode: "all"
  });
  assert.deepEqual(Array.from(visible), admin ? ["all", "catalog", "details", "workbench"] : ["all"]);
}
