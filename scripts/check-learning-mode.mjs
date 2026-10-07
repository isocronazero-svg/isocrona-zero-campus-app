import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { webcrypto } from "node:crypto";
import { checkLearningAnswer, evaluateTest, generateTest, saveTestResult } from "../public/assets/js/app/modules/tests/testService.js";
import { escapeHtml } from "../public/assets/js/app/ui/formatters.js";
import { remainingSeconds, formatDuration, correctionLabel } from "../public/assets/js/app/modules/tests/practiceTiming.js";

const source = readFileSync("public/assets/js/app/views/testView.js", "utf8");
function extract(start, end) {
  assert.ok(source.includes(start) && source.includes(end));
  return source.slice(source.indexOf(start), source.indexOf(end));
}
class Form {
  values = {};
  querySelectorAll() { return []; }
  hasAttribute(name) { return name === "data-test-zone-attempt"; }
}
const questions = [0, 1].map(index => ({ id: `q${index}`, revision: `v${index}`, prompt: `Pregunta ${index}`, options: ["A", "B"] }));
const session = { accountId: "member", role: "member", filters: { questionCount: 2, timeLimitMinutes: 0, penaltyDivisor: 0, practiceMode: "exam" } };
const marked = new Set();
let renders = 0, checks = 0, saved = 0, fail = false, heldCheck, resolveCheck;
const container = { querySelector: () => null };
const context = vm.createContext({
  testSession: session, Date, crypto: webcrypto, clearInterval() {},
  HTMLFormElement: Form, HTMLInputElement: class {}, HTMLSelectElement: class {},
  FormData: class { constructor(form) { this.form = form; } get(key) { return this.form.values[key] ?? null; } },
  getManualReviewQuestionIds: () => marked,
  getTestState: () => ({ questions, results: [], failedQuestionIds: [] }),
  escapeHtml, remainingSeconds, formatDuration, correctionLabel,
  questionTools: () => "", buildQuestionMapMarkup: () => "EXAM_MAP", changeTopicPicker: () => false,
  generateTest, evaluateTest,
  checkLearningAnswer: async (run, index) => {
    checks++;
    if (fail) throw new Error("Sin conexion");
    if (heldCheck) await new Promise(resolve => { resolveCheck = resolve; });
    return { questionId: run.questions[index].id, selectedIndex: run.answers[index], correctIndex: 0, correctAnswer: "A", isCorrect: run.answers[index] === 0, explanation: index === 0 ? '<img src=x onerror="alert(1)">' : "" };
  },
  saveTestResult: async result => { saved++; return { ...result, id: "saved-result" }; },
  loadTestHistory: async () => {},
  renderTestView: async () => { renders++; },
  markQuestionForReview: async id => { marked.add(id); },
  unmarkQuestionForReview: async id => { marked.delete(id); }
});
for (const [start, end] of [
  ["function buildRunTitle(", "function getCurrentQuestionMap("],
  ["function setActiveRun(", "export function resetTestView("],
  ["function captureActiveAnswers(", "function buildQuestionMapMarkup("],
  ["function buildQuestionAttemptMarkup(", "function getReviewStatus("],
  ["function formatAnswerOption(", "function formatSelectedReviewAnswer("],
  ["async function startGeneratedTest(", "async function startReviewMarkedTest("],
  ["async function handleLearningCheck(", "async function handleQuestionFormSubmit("],
  ["function bindActions(", "export async function renderTestView("]
]) vm.runInContext(extract(start, end), context);

await context.startGeneratedTest();
assert.equal(session.activeRun.mode, "general", "Exam remains the default");
assert.match(context.buildQuestionAttemptMarkup(), /EXAM_MAP/);
assert.equal((context.buildQuestionAttemptMarkup().match(/<article /g) || []).length, 2);
context.setActiveRun(null);
session.filters.practiceMode = "learning";
await context.startGeneratedTest();
const run = session.activeRun;
assert.equal(run.mode, "learning");
context.bindActions(container);
const form = new Form();
container.querySelector = selector => selector === "[data-test-zone-attempt]" ? form : null;
const submit = () => container.onsubmit({ target: form, preventDefault() {} });
const action = (name, questionId) => container.onclick({ target: { closest: () => ({ dataset: { action: name, questionId } }) } });
assert.equal((context.buildQuestionAttemptMarkup().match(/<article /g) || []).length, 1);
assert.doesNotMatch(context.buildQuestionAttemptMarkup(), /EXAM_MAP|Respuesta correcta/);
await submit();
assert.match(run.error, /Selecciona/);
assert.equal(checks, 0);
await action("next-learning-question");
assert.equal(run.learningIndex, 0, "Cannot skip an unchecked question");
form.values["question-0"] = "1";
fail = true;
await submit();
assert.match(run.error, /Sin conexion/);
assert.equal(run.answers[0], 1);
assert.equal(run.checking, false);
fail = false;
heldCheck = true;
const pending = submit();
await submit();
assert.equal(checks, 2, "Double submit does not issue a second correction");
resolveCheck();
await pending;
heldCheck = false;
assert.equal(run.feedback[0].isCorrect, false);
assert.equal(saved, 0, "Correction is not a result submission");
assert.match(context.buildQuestionAttemptMarkup(), /Incorrecta|Respuesta correcta/);
assert.match(context.buildQuestionAttemptMarkup(), /&lt;img/);
assert.doesNotMatch(context.buildQuestionAttemptMarkup(), /<img/);
assert.match(context.buildQuestionAttemptMarkup(), /disabled/);
const changedAnswer = new context.HTMLInputElement();
Object.assign(changedAnswer, { value: "0", dataset: { questionIndex: "0" }, matches: () => true });
container.onchange({ target: changedAnswer });
assert.equal(run.answers[0], 1, "A revealed answer cannot be changed through the input handler");
form.values = {};
await action("toggle-review-mark", run.questions[0].id);
assert.ok(marked.has(run.questions[0].id));
assert.equal(run.answers[0], 1, "Disabled radios do not erase checked answers when bookmarking");
await action("next-learning-question");
assert.equal(run.learningIndex, 1);
assert.doesNotMatch(context.buildQuestionAttemptMarkup(), /Respuesta correcta/);
form.values = { "question-1": "0" };
await submit();
assert.deepEqual(Array.from(run.answers), [1, 0], "Invisible answers survive later questions");
assert.match(context.buildQuestionAttemptMarkup(), /Finalizar test/);
assert.match(context.buildQuestionAttemptMarkup(), /Esta pregunta no tiene explicacion disponible/);
form.values = {};
await submit();
assert.equal(saved, 1);
assert.equal(session.activeRun, null);
assert.equal(session.latestResult.mode, "learning");
assert.deepEqual(Array.from(session.latestResult.responses, response => response.selectedIndex), [1, 0]);

await context.startGeneratedTest();
const timedRun = session.activeRun;
form.values = { "question-0": "0" };
heldCheck = true;
const delayed = submit();
timedRun.deadline = 1;
await context.handleAttemptSubmit(container, form);
resolveCheck();
await delayed;
assert.equal(session.activeRun, null, "Late correction cannot restore a completed attempt");
assert.equal(saved, 2);
assert.equal(session.latestResult.timedOut, true);
assert.equal(session.latestResult.responses[0].selectedIndex, 0, "Timeout preserves disabled pending selection");

const originalFetch = globalThis.fetch;
try {
  const requests = [];
  globalThis.fetch = async (url, options) => {
    requests.push({ url, options, body: JSON.parse(options.body) });
    return { ok: true, json: async () => ({ ok: true, feedback: { isCorrect: false }, result: { id: "final" } }) };
  };
  await checkLearningAnswer(run, 0);
  assert.equal(requests[0].url, "/api/test-zone/practice/check-answer");
  assert.equal(requests[0].options.credentials, "include");
  assert.deepEqual(requests[0].body, { expectedAccountId: "member", questionId: run.questions[0].id, questionVersion: run.questions[0].revision, selectedIndex: 1 });
  await saveTestResult(evaluateTest(run, run.answers));
  assert.equal(requests[1].url, "/api/test-zone/results");
  assert.equal(requests[1].body.mode, "learning");
  assert.deepEqual(requests[1].body.answers, [1, 0]);
} finally { globalThis.fetch = originalFetch; }
assert.ok(renders > 0);
console.log("Learning mode passed: sequential correction, bookmarks, escaping, retry, timeout, one final result and exam compatibility.");
