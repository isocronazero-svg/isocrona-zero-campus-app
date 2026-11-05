import assert from "node:assert/strict";
import fs from "node:fs";

const app = fs.readFileSync(new URL("../public/app.js", import.meta.url), "utf8");
const server = fs.readFileSync(new URL("../server.js", import.meta.url), "utf8");
const storage = fs.readFileSync(new URL("../storage.js", import.meta.url), "utf8");
const join = fs.readFileSync(new URL("../public/join.html", import.meta.url), "utf8");
const iban = "ES23 0073 0100 5905 0627 3646";

assert.ok(join.includes(iban) && join.includes("Pago de la cuota:") && join.includes("adjunta el justificante"));

assert.match(app, /<textarea id="courseEnrollmentInstructions" rows="2">ES23 0073 0100 5905 0627 3646<\/textarea>/);
assert.match(app, /enrollmentPaymentInstructions: document\.getElementById\("courseEnrollmentInstructions"\)\?\.value\.trim\(\) \|\| ""/);
assert.match(app, /"editCourseEnrollmentInstructions"[\s\S]{0,120}course\.enrollmentPaymentInstructions/);
assert.match(app, /enrollmentPaymentInstructions,\s*audience:/);
assert.ok(server.includes('readString("enrollmentPaymentInstructions", existingCourse ? "" : "' + iban + '")'));
assert.match(storage, /enrollmentPaymentInstructions: course\.enrollmentPaymentInstructions \|\| ""/);
console.log("V1.2: cuenta oficial en alta, editable y persistida; ediciones históricas conservadas.");
