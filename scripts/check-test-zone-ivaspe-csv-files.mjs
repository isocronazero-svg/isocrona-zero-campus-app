import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildImportPlan } from "./import-test-zone-questions.mjs";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ivaspeDir = path.join(repoRoot, "data", "test-zone", "ivaspe");
const expectedHeader =
  "prompt,optionA,optionB,optionC,optionD,correctIndex,part,category,difficulty,explanation,temaNumero,temaTitulo,moduleTitle";
const validDifficulties = new Set(["facil", "media", "dificil"]);

function normalizePrompt(value) {
  return String(value || "")
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[¿?¡!.,;:()[\]{}"'`´]/g, "")
    .replace(/\s+/g, " ")
    .toLowerCase();
}

const csvFiles = readdirSync(ivaspeDir)
  .filter((name) => name.endsWith(".csv") && !name.startsWith("_"))
  .sort();

assert.ok(csvFiles.length > 0, "No hay CSV IVASPE para validar.");

const seenPrompts = new Map();
const summary = [];

for (const fileName of csvFiles) {
  const filePath = path.join(ivaspeDir, fileName);
  const csv = readFileSync(filePath, "utf8");
  const header = csv.split(/\r?\n/, 1)[0];
  assert.equal(header, expectedHeader, `${fileName}: cabecera CSV invalida`);

  const plan = buildImportPlan(csv, []);
  assert.equal(plan.errors.length, 0, `${fileName}: contiene errores de importacion`);
  assert.equal(plan.duplicates.length, 0, `${fileName}: contiene duplicados internos`);
  assert.equal(plan.imported.length, 25, `${fileName}: debe contener exactamente 25 preguntas`);

  const difficultyCounts = {};

  for (const question of plan.imported) {
    assert.equal(question.part, "IVASPE", `${fileName}: part debe ser IVASPE`);
    assert.ok(question.category, `${fileName}: category obligatoria`);
    assert.ok(validDifficulties.has(question.difficulty), `${fileName}: difficulty invalida`);
    assert.equal(question.options.length, 4, `${fileName}: cada pregunta debe tener 4 opciones`);
    assert.ok(Number.isInteger(question.correctIndex), `${fileName}: correctIndex debe ser entero`);
    assert.ok(question.correctIndex >= 0 && question.correctIndex <= 3, `${fileName}: correctIndex fuera de rango`);
    assert.ok(question.explanation, `${fileName}: explanation obligatoria`);
    assert.ok(question.moduleTitle, `${fileName}: moduleTitle obligatorio`);

    const promptKey = normalizePrompt(question.prompt);
    assert.ok(promptKey, `${fileName}: prompt normalizado vacio`);
    assert.ok(!seenPrompts.has(promptKey), `${fileName}: prompt duplicado con ${seenPrompts.get(promptKey)}`);
    seenPrompts.set(promptKey, fileName);

    difficultyCounts[question.difficulty] = (difficultyCounts[question.difficulty] || 0) + 1;
  }

  summary.push(`${fileName}: ${plan.imported.length} preguntas (${JSON.stringify(difficultyCounts)})`);
}

console.log("IVASPE CSV files check passed.");
summary.forEach((line) => console.log(`- ${line}`));
