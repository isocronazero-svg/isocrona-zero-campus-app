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
  if (associated) assert.match(html, /QA &lt;texto&gt;/);
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
