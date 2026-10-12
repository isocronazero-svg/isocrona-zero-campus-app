import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const app = readFileSync(new URL("../public/app.js", import.meta.url), "utf8");
const server = readFileSync(new URL("../server.js", import.meta.url), "utf8");
const styles = readFileSync(new URL("../public/styles.css", import.meta.url), "utf8");

const titles = [
  "Accidentes de tráfico",
  "Rescate vertical",
  "RIT",
  "Incendios Estructurales",
  "Riesgos Tecnológicos",
  "Rescate en ríos",
  "GOM"
];

for (const title of titles) {
  assert.ok(app.includes(`"${title}"`), `Falta el nombre predefinido ${title}`);
}

assert.match(app, /const endDate = intensive \? startDate/);
assert.match(app, /const courseClass = intensive \? "practico"/);
assert.match(app, /const type = intensive \? "Jornada intensiva"/);
assert.match(app, /status: "Planificacion"/);
assert.match(app, /diplomaTemplate: "Aprovechamiento"/);
assert.match(app, /modality: intensive \? "Presencial"/);
assert.match(app, /invokeJsonAction\("\/api\/courses"[\s\S]+"POST"/);
assert.match(app, /setFormSaveStatus\(event\.target,[\s\S]+Los datos introducidos se conservan/);
assert.match(app, /Number\.isInteger\(capacity\)/);
assert.match(server, /Number\.isInteger\(capacity\)/);
assert.match(server, /endDate < startDate/);
assert.match(styles, /@media \(max-width: 480px\)[\s\S]+#courseForm \.studio-grid/);

// Native browser validation must accept the same fractional hours on both forms.
for (const id of ["courseHours", "editCourseHours"]) {
  const input = app.match(new RegExp(`<input id="${id}"[^>]*>`))?.[0];
  assert.ok(input, `Missing hours input ${id}`);
  assert.match(input, /min="0\.1"/, `${id} must accept durations below one hour`);
  assert.match(input, /step="0\.1"/, `${id} must allow editing 6.5 hours unchanged`);
}

const mode = { value: "intensive" };
const sections = ["course", "intensive"].map(courseMode => ({
  dataset: { courseMode }, hidden: false, controls: [{ value: "draft", disabled: false }],
  querySelectorAll() { return this.controls; }
}));
const form = { dataset: {}, querySelectorAll: () => sections };
const context = vm.createContext({ document: { getElementById: id => id === "courseCreationMode" ? mode : form } });
const from = app.indexOf("function syncCourseCreationMode(");
const to = app.indexOf("\nconst COURSE_CLASS_LABELS", from);
assert.ok(from >= 0 && to > from);
vm.runInContext(app.slice(from, to), context);
for (const value of ["intensive", "course", "intensive"]) {
  mode.value = value;
  context.syncCourseCreationMode();
  assert.equal(form.dataset.creationMode, value);
  for (const section of sections) {
    assert.equal(section.hidden, section.dataset.courseMode !== value);
    assert.equal(section.controls[0].disabled, section.hidden, "Hidden inputs must not block browser validation");
    assert.equal(section.controls[0].value, "draft", "Switching mode preserves the other draft");
  }
}

console.log("Intensive-day check passed (catalogue, payload defaults, validation, endpoint and responsive guard). ");
