import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { remainingSeconds, formatDuration } from "../public/assets/js/app/modules/tests/practiceTiming.js";

assert.equal(remainingSeconds({ deadline: 61000 }, 1000), 60);
assert.equal(remainingSeconds({ deadline: 61000 }, 60900), 1);
assert.equal(remainingSeconds({ deadline: 61000 }, 90000), 0, "Suspender la pestaña no alarga el plazo");
assert.equal(remainingSeconds({}), null);
assert.equal(formatDuration(90), "1:30");
assert.equal(formatDuration(null), "Sin limite");

const source = readFileSync("public/assets/js/app/views/testView.js", "utf8");
function extract(start, end) { return source.slice(source.indexOf(start), source.indexOf(end)); }
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
  renderTestView: () => { renders++; }
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
console.log("Practice timer checks passed.");
