import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { buildDiplomaLayout } = require("../server/diploma-layout.js");
const model = {
  diplomaLanguage: "es-va", preview: false, certificateTitle: "Diploma de formación",
  member: { name: "Persona Ejemplo" }, documentId: "00000000T",
  course: { title: "Rescate", hours: 8 }, dateRange: "9/11/2026",
  city: "Castellón", issueDate: "9/11/2026", registryNumber: "IZ-001",
  sections: [], code: "IZ-TEST"
};
const pages = buildDiplomaLayout(model, {}, "");
const front = pages[0].filter(x => x.type === "text").map(x => x.text).join(" ");
assert.match(front, /associació/);
assert.match(front, /ACTIVITAT FORMATIVA/);
assert.match(front, /Duració/);
assert.match(front, /Certificat/);
const reverse = pages[1].filter(x => x.type === "text").map(x => x.text).join(" ");
assert.match(reverse, /CONTINGUTS FORMATIUS/);
assert.match(reverse, /verificació/);
model.diplomaLanguage = "es";
const spanish = buildDiplomaLayout(model, {}, "")[0].filter(x => x.type === "text").map(x => x.text).join(" ");
assert.doesNotMatch(spanish, /associació|Duració:|Certificat núm\./);
const spanishReverse = buildDiplomaLayout(model, {}, "")[1].filter(x => x.type === "text").map(x => x.text).join(" ");
assert.doesNotMatch(spanishReverse, /CONTINGUTS FORMATIUS|verificació/);
console.log("V1.3 diploma individual bilingüe: OK");
