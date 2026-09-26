import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { remainingSeconds, formatDuration } from "../public/assets/js/app/modules/tests/practiceTiming.js";
import { getTestState, resetTestState } from "../public/assets/js/app/modules/tests/testStore.js";
import { loadSharedQuestions, loadTestHistory, loadReviewMarks, loadLiveSessions } from "../public/assets/js/app/modules/tests/questionService.js";
import { renderTestView, resetTestView } from "../public/assets/js/app/views/testView.js";

assert.equal(remainingSeconds({ deadline: 61000 }, 1000), 60);
assert.equal(remainingSeconds({ deadline: 61000 }, 60900), 1);
assert.equal(remainingSeconds({ deadline: 61000 }, 90000), 0, "Suspender la pestaña no alarga el plazo");
assert.equal(remainingSeconds({}), null);
assert.equal(formatDuration(90), "1:30");
assert.equal(formatDuration(null), "Sin limite");

const source = readFileSync("public/assets/js/app/views/testView.js", "utf8");
function extract(start, end) { return source.slice(source.indexOf(start), source.indexOf(end)); }
const timeOptions = source.match(/\$\{(\[0, \.\.\.Array\.from\(.*)\.map\(minutes =>/)[1];
assert.deepEqual(Array.from(vm.runInNewContext(timeOptions)), [0, ...Array.from({ length: 18 }, (_, i) => (i + 1) * 10)]);
assert.match(source, /timeLimitMinutes: 30/, "A countdown is enabled by default");
const clockContext = vm.createContext({
  testSession: { filters: { timeLimitMinutes: 20, penaltyDivisor: 0 }, accountId: "admin-self" },
  Date: { now: () => 1000 }, crypto: { randomUUID: () => "attempt" }, clearInterval: () => {}
});
vm.runInContext(extract("function setActiveRun(", "export function resetTestView(") + '\nsetActiveRun({questions: [{}]});', clockContext);
assert.equal(clockContext.testSession.activeRun.deadline, 1201000);
assert.equal(clockContext.testSession.activeRun.timeLimitSeconds, 1200);
let saves = 0, renders = 0, failSave = true, tick, cleared = 0;
const run = { answers: [0, null], deadline: 1, accountId: "member-a" };
const session = { activeRun: run, accountId: run.accountId, role: "member" };
const form = { querySelectorAll: () => [] };
const container = { querySelector: selector => selector === "[data-test-zone-attempt]" ? form : null };
const context = vm.createContext({
  testSession: session, Date, remainingSeconds, formatDuration,
  setInterval: callback => { tick = callback; return 1; }, clearInterval: () => { cleared++; },
  captureActiveAnswers: () => {}, evaluateTest: item => item,
  saveTestResult: async () => { saves++; if (failSave) throw new Error("Sin conexion"); return { id: "saved" }; },
  setActiveRun: value => { session.activeRun = value; },
  loadTestHistory: async () => { throw new Error("Historial no disponible"); },
  renderTestView: async () => { renders++; }
});
vm.runInContext(extract("function startPracticeTimer(", "function captureActiveAnswers("), context);
vm.runInContext(extract("async function handleAttemptSubmit(", "async function handleQuestionFormSubmit("), context);
vm.runInContext("startPracticeTimer(container)", vm.createContext({ ...context, container }));
await new Promise(resolve => setImmediate(resolve));
assert.equal(saves, 1);
assert.equal(run.timedOut, true);
assert.ok(run.finishedAt);
assert.match(run.error, /Sin conexion/);
assert.ok(cleared);
failSave = false;
await context.handleAttemptSubmit(container, form);
assert.equal(saves, 2);
assert.equal(session.activeRun, null);
assert.equal(session.latestResult.id, "saved", "Un fallo del historial no pierde el resultado guardado");
assert.ok(renders);

const originalFetch = globalThis.fetch;
try {
  for (const load of [loadSharedQuestions, loadTestHistory, loadReviewMarks, loadLiveSessions]) {
    let finishOld;
    globalThis.fetch = () => new Promise(resolve => { finishOld = resolve; });
    const stale = load();
    const rejection = assert.rejects(stale, { name: "AbortError" });
    resetTestState();
    finishOld({ ok: true, json: async () => ({
      questions: [{ id: "old-private" }], results: [{ id: "old-result" }],
      marks: [{ id: "old-mark" }], sessions: [{ id: "old-room" }]
    }) });
    await rejection;
    assert.equal(getTestState().questions.length + getTestState().results.length +
      getTestState().reviewMarks.length + getTestState().liveSessions.length, 0);
  }
  let finishOld;
  globalThis.fetch = () => new Promise(resolve => { finishOld = resolve; });
  const target = { innerHTML: "", querySelector: () => null, querySelectorAll: () => [] };
  const staleRender = renderTestView(target, "member", "old-account");
  resetTestView();
  globalThis.fetch = async () => ({ ok: true, json: async () => ({ questions: [], results: [], marks: [] }) });
  await renderTestView(target, "member", "new-account");
  const currentHtml = target.innerHTML;
  assert.match(currentHtml, /Nuevo test/, "New account must not stay stuck loading");
  finishOld({ ok: true, json: async () => ({ questions: [{ id: "private-old" }] }) });
  await staleRender;
  assert.equal(target.innerHTML, currentHtml, "Stale render cannot replace the current account");
  assert.equal(getTestState().questions.length, 0);
} finally {
  globalThis.fetch = originalFetch;
  resetTestView();
}
console.log("Practice timer checks passed.");
