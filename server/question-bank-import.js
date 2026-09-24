const fs = require("node:fs");
const path = require("node:path");
const BLOCKS = ["IVASPE", "TEMARIO COMÚN", "GUADALAJARA"];
const HEADER = "prompt,optionA,optionB,optionC,optionD,correctIndex,part,category,difficulty,explanation,temaNumero,temaTitulo,moduleTitle";
function blockName(value) {
  const key = String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase();
  if (["parte comun", "temario comun"].includes(key)) return "TEMARIO COMÚN";
  return BLOCKS.find(item => item.toLowerCase() === key) || String(value || "").trim();
}
function createQuestionBankImportHandler(deps) {
  return async (req, res, url) => {
    if (!/^\/api\/test-zone\/import(?:\/(preview|apply))?$/.test(url.pathname)) return false;
    const send = (status, body) => { deps.sendJson(res, status, body); return true; };
    try {
      if (!deps.requireAdminAccount(req, res, deps.readState())) return true;
      if (req.method === "GET" && url.pathname === "/api/test-zone/import") {
        const questions = deps.readState().testZoneQuestions || [];
        const blocks = [...new Set([...BLOCKS, ...questions.map(q => blockName(q.part)).filter(Boolean)])].map(part => {
          const own = questions.filter(q => blockName(q.part) === part);
          const topics = [...new Set(own.map(q => q.category || "Sin tema"))].sort().map(name => ({ name, count: own.filter(q => (q.category || "Sin tema") === name).length }));
          return { part, count: own.length, topics };
        });
        return send(200, { ok: true, blocks, template: HEADER + '\n"Pregunta de ejemplo","Opcion A","Opcion B","Opcion C","Opcion D",0,"IVASPE","Nombre del tema","media","Explicacion de la respuesta","1","Titulo del tema","IVASPE"\n' });
      }
      if (req.method !== "POST" || !/\/(preview|apply)$/.test(url.pathname)) return send(405, { ok: false, error: "Metodo no permitido" });
      const payload = await deps.readJsonBody(req, 5 * 1024 * 1024);
      const { buildImportPlan } = await import("../scripts/import-test-zone-questions.mjs");
      // Resolve fresh state after asynchronous input/import; no partial writes.
      const state = deps.readState();
      const account = deps.requireAdminAccount(req, res, state);
      if (!account) return true;
      const part = blockName(payload.part);
      if (!BLOCKS.includes(part)) throw new Error("Selecciona IVASPE, TEMARIO COMÚN o GUADALAJARA");
      let files = payload.files;
      if (payload.bundled === true) {
        if (part !== "IVASPE") throw new Error("El paquete incluido pertenece a IVASPE");
        const dir = path.join(__dirname, "..", "data", "test-zone", "ivaspe");
        files = fs.readdirSync(dir).filter(name => name.endsWith(".csv") && !name.startsWith("_")).sort().map(name => ({ name, csv: fs.readFileSync(path.join(dir, name), "utf8") }));
      }
      if (!Array.isArray(files) || !files.length || files.length > 20) throw new Error("Selecciona entre 1 y 20 archivos CSV");
      const existing = (state.testZoneQuestions || []).filter(q => blockName(q.part) === part);
      const imported = [], errors = [], summaries = [];
      let duplicates = 0;
      for (const file of files) {
        if (typeof file.csv !== "string" || !file.csv.trim()) throw new Error("Archivo CSV vacio");
        let plan;
        try { plan = buildImportPlan(file.csv.replace(/^\uFEFF/, ""), [...existing, ...imported]); }
        catch (error) { errors.push({ file: String(file.name || "CSV"), message: error.message }); continue; }
        const questions = plan.imported.map(q => ({ ...q, part, moduleTitle: part, createdBy: account.name || account.id }));
        imported.push(...questions);
        duplicates += plan.duplicates.length;
        plan.errors.forEach(error => errors.push({ file: String(file.name || "CSV"), row: error.rowNumber, message: error.errors.join("; ") }));
        summaries.push({ file: String(file.name || "CSV"), ready: questions.length, duplicates: plan.duplicates.length, topics: [...new Set(questions.map(q => q.category))] });
      }
      if (imported.length > 5000) throw new Error("Carga un maximo de 5000 preguntas por lote");
      const apply = url.pathname.endsWith("/apply");
      if (apply && errors.length) return send(400, { ok: false, error: "Corrige los errores antes de importar. No se ha guardado ninguna pregunta.", errors });
      if (apply && imported.length) {
        state.testZoneQuestions = [...(state.testZoneQuestions || []), ...imported];
        deps.writeState(state);
      }
      return send(200, { ok: true, applied: apply, part, ready: imported.length, duplicates, errors, files: summaries });
    } catch (error) { deps.sendJsonError(res, error, "No se pudo importar el banco de preguntas"); return true; }
  };
}
module.exports = { BLOCKS, blockName, createQuestionBankImportHandler };
