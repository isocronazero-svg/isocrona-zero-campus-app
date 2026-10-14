import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const app = readFileSync(new URL("../public/app.js", import.meta.url), "utf8").replace(/\r\n/g, "\n");

function extractAction(action, nextAction) {
  const start = app.indexOf(`  if (action === "${action}") {`);
  const end = app.indexOf(`  if (action === "${nextAction}"`, start);
  assert.ok(start >= 0 && end > start, `Handler ${action} must exist`);
  return app.slice(start, end);
}

const handlers = [
  extractAction("select-associate-application", "select-next-associate-application"),
  extractAction("select-associate-payment-submission", "select-associate-profile-request"),
  extractAction("select-associate-profile-request", "select-associate")
].join("\n");
const focusStart = app.indexOf("function focusAssociatesSidePanel() {");
const focusEnd = app.indexOf("\nfunction focusAssociatesWorkbench()", focusStart);
assert.ok(focusStart >= 0 && focusEnd > focusStart, "Associate side-panel focus helper must exist");

function runHandler(action, dataset) {
  const events = [];
  const context = {
    action,
    actionTarget: { dataset },
    state: {},
    associatesSectionMode: "directory",
    render: () => events.push("render"),
    requestAnimationFrame: (callback) => {
      events.push("animation-frame");
      callback();
    },
    findAssociatePaymentSubmission: () => ({ associateId: "associate-payment" }),
    findAssociateProfileRequest: () => ({ associateId: "associate-profile" }),
    sidePanel: {
      querySelector: () => ({
        scrollIntoView: (options) => events.push(["scrollIntoView", options]),
        focus: (options) => events.push(["focus", options])
      }),
      scrollTo: (options) => events.push(["scrollTo", options]),
      scrollIntoView: (options) => events.push(["scrollIntoView", options])
    }
  };

  vm.runInNewContext(`${app.slice(focusStart, focusEnd)}\n(function () {\n${handlers}\n})();`, context);
  return { context, events };
}

const cases = [
  ["select-associate-application", { applicationId: "application-qa" }, "selectedAssociateApplicationId", "application-qa", undefined, "applications"],
  ["select-associate-payment-submission", { submissionId: "submission-qa" }, "selectedAssociatePaymentSubmissionId", "submission-qa", "associate-payment", "fees"],
  ["select-associate-profile-request", { requestId: "request-qa" }, "selectedAssociateProfileRequestId", "request-qa", "associate-profile", "profiles"]
];

for (const [action, dataset, selectedKey, selectedValue, associateId, mode] of cases) {
  const { context, events } = runHandler(action, dataset);
  assert.equal(context.state[selectedKey], selectedValue);
  assert.equal(context.state.selectedAssociateId, associateId);
  assert.equal(context.associatesSectionMode, mode);
  assert.equal(events[0], "render", "The selected detail must render before moving focus");
  assert.equal(events[1], "animation-frame", "Focus must wait for the selected detail to render");
  assert.equal(events[2][0], "scrollTo");
  assert.equal(events[2][1].top, 0, "Mobile review must start at the top of the side panel");
  assert.equal(events[2][1].behavior, "smooth");
  assert.equal(events[3][0], "scrollIntoView");
  assert.equal(events[3][1].behavior, "smooth");
  assert.equal(events[3][1].block, "nearest", "Desktop review must avoid an unnecessary page jump");
  assert.equal(events[3][1].inline, "nearest");
  assert.equal(events[4][0], "focus");
  assert.equal(events[4][1].preventScroll, true, "Keyboard focus must not undo the smooth scroll");
  assert.equal(events.length, 5, "Exactly one focus/scroll sequence per click");
}

const sideStart = app.indexOf("function renderAssociatesSide() {");
const sideEnd = app.indexOf("\nfunction renderLegacyPaymentProofs", sideStart);
assert.ok(sideStart >= 0 && sideEnd > sideStart, "Associate side-panel renderer must exist");

function renderSelectedApplication(application, mode = "applications") {
  const associate = { id: "associate-old", firstName: "Otro socio", associateNumber: 8 };
  const payment = { id: "payment-old", associateId: associate.id, status: "Pendiente de revision" };
  const profile = { id: "profile-old", associateId: associate.id, status: "Pendiente de revision" };
  const context = {
    associatesSectionMode: mode,
    state: {
      selectedAssociateApplicationId: application.id,
      selectedAssociatePaymentSubmissionId: payment.id,
      selectedAssociateProfileRequestId: profile.id,
      selectedAssociateId: associate.id,
      associateApplications: [application],
      associatePaymentSubmissions: [payment],
      associateProfileRequests: [profile],
      associates: [associate]
    },
    isAdminView: () => true,
    findAssociateApplication: (id) => id === application.id ? application : null,
    findAssociatePaymentSubmission: () => payment,
    findAssociateProfileRequest: () => profile,
    findAssociate: () => associate,
    getAssociateFullName: () => "Otro socio",
    findAccountByAssociate: () => null,
    findMember: () => null,
    getAssociatePayments: () => [],
    getAssociateApplicationReadiness: () => ({ ready: true, blockers: [], flags: {} }),
    getNextPendingAssociateApplication: () => null,
    isAssociateApplicationPending: () => true,
    getAssociateQuotaGap: () => 0,
    getAssociateApplicantName: () => "Solicitud QA",
    escapeHtml: (value) => String(value),
    formatCurrency: (value) => String(value),
    ASSOCIATE_SECTION_LINKS: [],
    renderProfileReviewInlineEditor: () => "",
    renderAssociateProfileRequestComparison: () => "",
    encodeURIComponent
  };
  return vm.runInNewContext(`(${app.slice(sideStart, sideEnd)})(state.associateApplications[0])`, context);
}

const withProofs = renderSelectedApplication({
  id: "application-qa",
  status: "Pendiente de revision",
  email: "qa@example.test",
  paymentProof: "folder/proof one.pdf",
  paymentProof2: "proof-two.pdf"
});
assert.match(withProofs, />Abrir justificante<\/a>/);
assert.match(withProofs, />Abrir justificante 2<\/a>/);
assert.match(withProofs, /href="\/api\/associates\/files\/folder%2Fproof%20one\.pdf"/);
assert.match(withProofs, /href="\/api\/associates\/files\/proof-two\.pdf"/);
assert.match(withProofs, /data-associate-review-detail tabindex="-1"/);
assert.match(withProofs, /Solicitud activa: Solicitud QA/);
assert.doesNotMatch(withProofs, /Ficha activa: Otro socio|data-action="approve-associate-payment"|data-action="approve-associate-profile-request"/);
assert.match(withProofs, /data-action="reject-associate"/);
assert.match(withProofs, /data-action="request-associate-info"/);
assert.doesNotMatch(withProofs, /data-action="reopen-associate-application"/);

const pendingDocumentation = renderSelectedApplication({
  id: "application-pending-documentation",
  status: "Pendiente de documentacion",
  email: "qa@example.test"
});
assert.match(pendingDocumentation, /data-action="reopen-associate-application"/);
assert.doesNotMatch(pendingDocumentation, /data-action="request-associate-info"/);
assert.match(pendingDocumentation, /data-action="reject-associate"/);

for (const status of ["Aprobada", "Rechazada"]) {
  const resolved = renderSelectedApplication({ id: "resolved-application", status });
  assert.doesNotMatch(resolved, /data-action="(?:request-associate-info|reopen-associate-application|reject-associate)"/);
}

const withoutProofs = renderSelectedApplication({
  id: "application-without-proofs",
  status: "Pendiente de revision",
  email: "qa@example.test"
});
assert.doesNotMatch(withoutProofs, /Abrir justificante/);
assert.doesNotMatch(withoutProofs, /\/api\/associates\/files\//);

for (const [mode, action] of [["fees", "approve-associate-payment"], ["profiles", "approve-associate-profile-request"]]) {
  const html = renderSelectedApplication({ id: "stale-application", paymentProof: "stale.pdf" }, mode);
  assert.match(html, new RegExp(`data-action="${action}"`));
  assert.doesNotMatch(html, /data-action="approve-associate"|stale\.pdf|Solicitud activa/);
}
// Rendering the applications list previously threw before the focus callback could run.
assert.doesNotMatch(app, /blockedFilteredApplications/);
const blockedCount = app.match(/\$\{(selectableApplications\.filter\(\(item\) => !getAssociateApplicationReadiness\(item\)\.ready\)\.length)\}/)?.[1];
assert.ok(blockedCount);
assert.equal(vm.runInNewContext(blockedCount, {
  selectableApplications: [{ ready: true }, { ready: false }],
  getAssociateApplicationReadiness: item => item
}), 1);
const readyCount = app.match(/\$\{(selectableApplications\.filter\(\(item\) => getAssociateApplicationReadiness\(item\)\.ready\)\.length)\}/)?.[1];
assert.ok(readyCount, "Ready count must exclude blocked applications");
for (const readiness of [[], [true], [false], [true, false]]) {
  const context = { selectableApplications: readiness.map(ready => ({ ready })), getAssociateApplicationReadiness: item => item };
  const ready = vm.runInNewContext(readyCount, context);
  const blocked = vm.runInNewContext(blockedCount, context);
  assert.equal(ready, readiness.filter(Boolean).length);
  assert.equal(ready + blocked, readiness.length, "Pending categories must not overlap");
}

console.log("Associate review navigation check passed.");
