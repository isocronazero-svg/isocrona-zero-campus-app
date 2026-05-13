import assert from "node:assert/strict";
import { buildImportPlan } from "./import-test-zone-questions.mjs";

const csv = `prompt,optionA,optionB,optionC,optionD,correctIndex,part,category,difficulty,explanation,temaNumero,temaTitulo,moduleTitle
"¿Frecuencia correcta de RCP?","60-80","80-90","100-120","150-180",2,"IVASPE","Sanitario operativo","media","La frecuencia correcta es 100-120.","5","SVB","IVASPE"
"¿Frecuencia correcta de RCP?","A","B","C","D",0,"IVASPE","Sanitario operativo","media","Duplicada.","","","IVASPE"
"Pregunta invalida","A","B","C","D",7,"IVASPE","Sanitario operativo","extrema","Error","","","IVASPE"`;

const existingQuestions = [
  {
    prompt: "¿Pregunta ya existente?"
  }
];

const plan = buildImportPlan(csv, existingQuestions);

assert.equal(plan.imported.length, 1);
assert.equal(plan.duplicates.length, 1);
assert.equal(plan.errors.length, 1);
assert.equal(plan.imported[0].difficulty, "media");
assert.equal(plan.imported[0].part, "IVASPE");
assert.equal(plan.imported[0].options.length, 4);
assert.ok(plan.imported[0].id);

console.log("CSV importer checks passed.");
