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
