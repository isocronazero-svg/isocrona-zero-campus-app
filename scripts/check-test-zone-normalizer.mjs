import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const serverSource = readFileSync(path.join(repoRoot, "server.js"), "utf8");
const storageSource = readFileSync(path.join(repoRoot, "storage.js"), "utf8");

assert.match(serverSource, /normalized === "ivaspe"[\s\S]*return "IVASPE";/);
assert.match(serverSource, /return String\(value \|\| ""\)\.trim\(\);/);
assert.match(serverSource, /\["facil", "easy", "baja"\]\.includes\(normalized\)[\s\S]*return "facil";/);
assert.match(serverSource, /\["dificil", "hard", "alta"\]\.includes\(normalized\)[\s\S]*return "dificil";/);
assert.match(serverSource, /temaNumero: String\(question\?\.temaNumero \|\| ""\)\.trim\(\)/);
assert.match(serverSource, /temaTitulo: String\(question\?\.temaTitulo \|\| ""\)\.trim\(\)/);
assert.match(serverSource, /moduleTitle: String\(question\?\.moduleTitle \|\| "IVASPE"\)\.trim\(\) \|\| "IVASPE"/);

assert.match(storageSource, /normalized === "ivaspe"[\s\S]*return "IVASPE";/);
assert.match(storageSource, /category: String\(question\?\.category \|\| ""\)\.trim\(\)/);
assert.match(storageSource, /difficulty: normalizeStoredTestZoneDifficulty\(question\?\.difficulty\)/);

const tempRoot = mkdtempSync(path.join(os.tmpdir(), "test-zone-normalizer-"));
const csvPath = path.join(tempRoot, "ivaspe.csv");
const defaultStatePath = path.join(tempRoot, "default-state.json");

const csv = `prompt,optionA,optionB,optionC,optionD,correctIndex,part,category,difficulty,explanation,temaNumero,temaTitulo,moduleTitle
"Pregunta IVASPE baja","A","B","C","D",0,"IVASPE","Sanitario operativo","baja","Explicacion sanitaria.","5","SVB",""
"Pregunta IVASPE alta","A","B","C","D",1,"IVASPE","Riesgo quimico y mercancias peligrosas","alta","Explicacion riesgo.","9","Riesgo quimico","IVASPE"
"Pregunta IVASPE facil","A","B","C","D",2,"IVASPE","Incendios urbanos","facil","Explicacion incendio.","2","Incendios urbanos","IVASPE"`;

try {
  writeFileSync(csvPath, csv, "utf8");
  writeFileSync(defaultStatePath, JSON.stringify({ testZoneQuestions: [] }, null, 2), "utf8");
  const importResult = spawnSync(process.execPath, ["scripts/import-test-zone-questions.mjs", csvPath], {
    cwd: repoRoot,
    env: {
      ...process.env,
      IZ_DATA_DIR: tempRoot,
      IZ_DEFAULT_STATE_PATH: defaultStatePath
    },
    encoding: "utf8"
  });

  assert.equal(importResult.status, 0, importResult.stderr || importResult.stdout);

  const state = JSON.parse(readFileSync(path.join(tempRoot, "state.json"), "utf8"));
  const questions = state.testZoneQuestions || [];
  assert.equal(questions.length, 3);
  assert.equal(questions[0].part, "IVASPE");
  assert.equal(questions[0].category, "Sanitario operativo");
  assert.equal(questions[0].difficulty, "facil");
  assert.equal(questions[0].temaNumero, "5");
  assert.equal(questions[0].temaTitulo, "SVB");
  assert.equal(questions[0].moduleTitle, "IVASPE");
  assert.equal(questions[1].category, "Riesgo quimico y mercancias peligrosas");
  assert.equal(questions[1].difficulty, "dificil");
  assert.equal(questions[2].category, "Incendios urbanos");
  assert.equal(questions[2].difficulty, "facil");
} finally {
  rmSync(tempRoot, { recursive: true, force: true });
}

console.log("Test zone normalizer checks passed.");
