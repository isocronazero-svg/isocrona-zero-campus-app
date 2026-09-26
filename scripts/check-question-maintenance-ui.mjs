import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const source = readFileSync("public/assets/js/app/views/testView.js", "utf8");
const toolsSource = readFileSync("public/assets/js/app/modules/tests/questionMaintenance.js", "utf8");
const toolContext = vm.createContext({});
vm.runInContext(toolsSource.slice(toolsSource.indexOf("const html"), toolsSource.indexOf("function openDialog")).replaceAll("export function", "function"), toolContext);
assert.match(toolContext.questionTools('q"<img>', false), /Revisar pregunta/);
assert.doesNotMatch(toolContext.questionTools('q"<img>', false), /Editar pregunta|Eliminar pregunta|<img>/);
assert.match(toolContext.questionTools("q", true), /Editar pregunta[\s\S]*Eliminar pregunta/);

let rendered = 0, focused = 0, scrolled = 0;
const session = { activeRun: null, latestResult: { id: "finished" }, error: "old", role: "member", filters: { timeLimitMinutes: 15 } };
const container = { querySelector: selector => selector === "[data-test-zone-controls]" ? {
  closest: () => ({ scrollIntoView: () => scrolled++ }),
  querySelector: () => ({ focus: () => focused++ })
} : null };
const context = vm.createContext({
  testSession: session,
  setActiveRun: run => { session.activeRun = run; },
  renderTestView: async () => { rendered++; }
});
vm.runInContext(source.slice(source.indexOf("function bindActions("), source.indexOf("export async function renderTestView")), context);
context.bindActions(container);
await container.onclick({ target: { closest: () => ({ dataset: { action: "another-test" } }) } });
assert.equal(session.latestResult, null, "Otro test vuelve al selector sin dejar el resultado abierto");
assert.equal(session.error, "");
assert.equal(session.filters.timeLimitMinutes, 15, "Conserva las preferencias del siguiente test");
assert.equal(rendered, 1);
assert.equal(focused, 1);
assert.equal(scrolled, 1);
console.log("Question tools escaping, member/admin visibility and another-test navigation checks passed.");
