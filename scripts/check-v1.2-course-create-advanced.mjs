import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const source = readFileSync(new URL("../public/app.js", import.meta.url), "utf8");
const start = source.indexOf('<form id="courseForm"');
const end = source.indexOf('</form>', start);
assert.ok(start >= 0 && end > start, "Formulario de alta presente");
const form = source.slice(start, end);
const open = form.indexOf('<summary>Opciones avanzadas de contenido (opcional)</summary>');
const close = form.indexOf('</details>', open);
assert.ok(open >= 0 && close > open, "Opciones avanzadas plegables");
for (const id of ["courseTemplate", "courseGenerateContent", "courseType"]) {
  const position = form.indexOf('id="' + id + '"');
  assert.ok(position > open && position < close, id + " permanece en opciones avanzadas");
}
for (const id of ["courseTitle", "courseStart", "courseEnd", "courseHours", "courseCapacity", "courseEnrollmentInstructions", "courseAccessScope", "courseEnrollmentOpensAt", "courseEnrollmentClosesAt"]) {
  assert.ok(form.includes('id="' + id + '"'), id + " permanece disponible");
}
assert.ok(form.includes('renderInstructorSelector("courseInstructors")'), "Se conservan instructores");
console.log("Alta simplificada: campos esenciales e instructores conservados.");
