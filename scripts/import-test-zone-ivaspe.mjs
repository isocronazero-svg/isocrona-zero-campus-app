import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { fileURLToPath } from "node:url";
import { buildImportPlan, importQuestionsFromCsv } from "./import-test-zone-questions.mjs";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ivaspeDir = path.join(repoRoot, "data", "test-zone", "ivaspe");
const configuredDataDir = String(process.env.IZ_DATA_DIR || "").trim();
const dataDir = path.resolve(configuredDataDir || "/data");
const dbPath = path.join(dataDir, "campus.db");
const stateSnapshotPath = path.join(dataDir, "state.json");
const defaultStatePath = process.env.IZ_DEFAULT_STATE_PATH
  ? path.resolve(process.env.IZ_DEFAULT_STATE_PATH)
  : path.join(repoRoot, "data", "default-state.json");
const dryRun = process.argv.includes("--dry-run");

const csvFiles = readdirSync(ivaspeDir)
  .filter((name) => name.endsWith(".csv") && !name.startsWith("_"))
  .sort();

if (!csvFiles.length) {
  throw new Error("No hay CSV IVASPE para importar.");
}

function printPlanLine(fileName, plan) {
  console.log(
    `${fileName}: importadas=${plan.imported.length}; duplicadas=${plan.duplicates.length}; errores=${plan.errors.length}`
  );
  plan.errors.forEach((item) => {
    console.log(`  - Fila ${item.rowNumber}: ${item.errors.join("; ")}`);
  });
}

function readJsonFileIfExists(filePath) {
  if (!existsSync(filePath)) {
    return null;
  }
  return JSON.parse(readFileSync(filePath, "utf8"));
}

function readSqliteStateIfExists() {
  if (!existsSync(dbPath)) {
    return null;
  }

  let database = null;
  try {
    database = new DatabaseSync(dbPath, { readOnly: true });
    const row = database.prepare("SELECT value FROM app_state WHERE key = ?").get("campus_state");
    return row ? JSON.parse(row.value) : null;
  } finally {
    if (database) {
      database.close();
    }
  }
}

function readStateForDryRun() {
  return readSqliteStateIfExists() || readJsonFileIfExists(stateSnapshotPath) || readJsonFileIfExists(defaultStatePath) || {};
}

let totalImported = 0;
let totalDuplicates = 0;
let totalErrors = 0;

if (dryRun) {
  const state = readStateForDryRun();
  const simulatedQuestions = Array.isArray(state.testZoneQuestions) ? [...state.testZoneQuestions] : [];

  for (const fileName of csvFiles) {
    const relativePath = path.join("data", "test-zone", "ivaspe", fileName);
    const csv = readFileSync(path.join(repoRoot, relativePath), "utf8");
    const plan = buildImportPlan(csv, simulatedQuestions);
    printPlanLine(fileName, plan);
    simulatedQuestions.push(...plan.imported);
    totalImported += plan.imported.length;
    totalDuplicates += plan.duplicates.length;
    totalErrors += plan.errors.length;
  }
} else {
  for (const fileName of csvFiles) {
    const relativePath = path.join("data", "test-zone", "ivaspe", fileName);
    const plan = importQuestionsFromCsv(relativePath);
    printPlanLine(fileName, plan);
    totalImported += plan.imported.length;
    totalDuplicates += plan.duplicates.length;
    totalErrors += plan.errors.length;
  }
}

console.log("");
console.log(`${dryRun ? "Vista previa" : "Importacion"} IVASPE finalizada.`);
console.log(`Total importadas: ${totalImported}`);
console.log(`Total duplicadas: ${totalDuplicates}`);
console.log(`Total errores: ${totalErrors}`);

if (totalErrors) {
  process.exitCode = 1;
}
