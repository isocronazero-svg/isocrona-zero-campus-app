import crypto from "node:crypto";
import { createRequire } from "node:module";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const require = createRequire(import.meta.url);

const REQUIRED_COLUMNS = Object.freeze([
  "prompt",
  "optionA",
  "optionB",
  "optionC",
  "optionD",
  "correctIndex",
  "part",
  "category",
  "difficulty",
  "explanation",
  "temaNumero",
  "temaTitulo",
  "moduleTitle"
]);

const VALID_DIFFICULTIES = new Set(["facil", "media", "dificil"]);

function normalizeText(value) {
  return String(value ?? "")
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ");
}

function normalizePromptKey(value) {
  return normalizeText(value)
    .toLowerCase()
    .replace(/[¿?¡!.,;:()\[\]{}"'`´]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeDifficulty(value) {
  const normalized = normalizeText(value).toLowerCase();
  if (normalized === "facil" || normalized === "easy" || normalized === "baja") {
    return "facil";
  }
  if (normalized === "media" || normalized === "medium") {
    return "media";
  }
  if (normalized === "dificil" || normalized === "hard" || normalized === "alta") {
    return "dificil";
  }
  return normalized;
}

function parseCsv(content) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;

  for (let index = 0; index < content.length; index += 1) {
    const char = content[index];
    const nextChar = content[index + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        field += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      row.push(field);
      field = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && nextChar === "\n") {
        index += 1;
      }
      row.push(field);
      if (row.some((cell) => String(cell).trim() !== "")) {
        rows.push(row);
      }
      row = [];
      field = "";
      continue;
    }

    field += char;
  }

  row.push(field);
  if (row.some((cell) => String(cell).trim() !== "")) {
    rows.push(row);
  }

  if (inQuotes) {
    throw new Error("CSV mal formado: hay comillas sin cerrar.");
  }

  return rows;
}

function assertHeader(header) {
  const normalizedHeader = header.map((column) => String(column || "").trim());
  const expected = REQUIRED_COLUMNS.join(",");
  const received = normalizedHeader.join(",");
  if (received !== expected) {
    throw new Error(`Cabecera CSV invalida. Esperada: ${expected}. Recibida: ${received}`);
  }
}

function validateAndBuildQuestion(rawRow, rowNumber, seenPromptKeys) {
  const row = Object.fromEntries(REQUIRED_COLUMNS.map((column, index) => [column, String(rawRow[index] ?? "").trim()]));
  const errors = [];

  for (const field of ["prompt", "optionA", "optionB", "optionC", "optionD", "category", "explanation"]) {
    if (!row[field]) {
      errors.push(`${field} obligatorio`);
    }
  }

  const correctIndex = Number(row.correctIndex);
  if (!row.correctIndex || !Number.isInteger(correctIndex) || correctIndex < 0 || correctIndex > 3) {
    errors.push("correctIndex obligatorio y entre 0 y 3");
  }

  const difficulty = normalizeDifficulty(row.difficulty);
  if (!row.difficulty || !VALID_DIFFICULTIES.has(difficulty)) {
    errors.push("difficulty obligatoria y debe ser facil, media o dificil");
  }

  const promptKey = normalizePromptKey(row.prompt);
  if (!promptKey) {
    errors.push("prompt normalizado vacio");
  } else if (seenPromptKeys.has(promptKey)) {
    errors.push("prompt duplicado en el CSV");
  }

  if (rawRow.length !== REQUIRED_COLUMNS.length) {
    errors.push(`numero de columnas invalido: ${rawRow.length}; esperado: ${REQUIRED_COLUMNS.length}`);
  }

  if (errors.length) {
    return { ok: false, rowNumber, errors, prompt: row.prompt };
  }

  seenPromptKeys.add(promptKey);
  return {
    ok: true,
    rowNumber,
    promptKey,
    question: {
      id: crypto.randomUUID(),
      prompt: row.prompt,
      options: [row.optionA, row.optionB, row.optionC, row.optionD],
      correctIndex,
      part: row.part || "IVASPE",
      category: row.category,
      difficulty,
      explanation: row.explanation,
      temaNumero: row.temaNumero,
      temaTitulo: row.temaTitulo,
      moduleTitle: row.moduleTitle || "IVASPE",
      createdAt: new Date().toISOString(),
      createdBy: "csv-importer"
    }
  };
}

function loadStorage() {
  return require(path.join(repoRoot, "storage.js"));
}

export function buildImportPlan(csvContent, existingQuestions = []) {
  const rows = parseCsv(csvContent);
  if (!rows.length) {
    throw new Error("CSV vacio.");
  }

  const [header, ...dataRows] = rows;
  assertHeader(header);

  const existingPromptKeys = new Set(
    (Array.isArray(existingQuestions) ? existingQuestions : [])
      .map((question) => normalizePromptKey(question?.prompt || question?.question || ""))
      .filter(Boolean)
  );
  const seenPromptKeys = new Set();
  const imported = [];
  const duplicates = [];
  const errors = [];

  dataRows.forEach((rawRow, index) => {
    const rowNumber = index + 2;
    const result = validateAndBuildQuestion(rawRow, rowNumber, seenPromptKeys);
    if (!result.ok) {
      errors.push(result);
      return;
    }

    if (existingPromptKeys.has(result.promptKey)) {
      duplicates.push({ rowNumber, prompt: result.question.prompt });
      return;
    }

    existingPromptKeys.add(result.promptKey);
    imported.push(result.question);
  });

  return { imported, duplicates, errors };
}

export function importQuestionsFromCsv(csvPath) {
  const absoluteCsvPath = path.resolve(process.cwd(), csvPath || "");
  if (!csvPath || !existsSync(absoluteCsvPath)) {
    throw new Error(`No se encuentra el CSV: ${csvPath || "(sin ruta)"}`);
  }

  const { readState, writeState } = loadStorage();
  const state = readState();
  state.testZoneQuestions = Array.isArray(state.testZoneQuestions) ? state.testZoneQuestions : [];

  const csvContent = readFileSync(absoluteCsvPath, "utf8");
  const plan = buildImportPlan(csvContent, state.testZoneQuestions);

  if (plan.imported.length) {
    state.testZoneQuestions = [...state.testZoneQuestions, ...plan.imported];
    writeState(state);
  }

  return plan;
}

function printSummary(plan) {
  console.log(`Importadas: ${plan.imported.length}`);
  console.log(`Saltadas por duplicado: ${plan.duplicates.length}`);
  console.log(`Errores: ${plan.errors.length}`);

  if (plan.duplicates.length) {
    console.log("\nDuplicados:");
    plan.duplicates.forEach((item) => console.log(`- Fila ${item.rowNumber}: ${item.prompt}`));
  }

  if (plan.errors.length) {
    console.log("\nErrores:");
    plan.errors.forEach((item) => console.log(`- Fila ${item.rowNumber}: ${item.errors.join("; ")}`));
  }
}

async function main() {
  const csvPath = process.argv[2];
  if (!csvPath) {
    console.error("Uso: node scripts/import-test-zone-questions.mjs data/test-zone/ivaspe/legislacion-organizacion.csv");
    process.exit(1);
  }

  try {
    const plan = importQuestionsFromCsv(csvPath);
    printSummary(plan);
    if (plan.errors.length) {
      process.exit(1);
    }
  } catch (error) {
    console.error(error.message || error);
    process.exit(1);
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] || "").href) {
  main();
}
