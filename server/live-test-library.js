const { randomUUID } = require("node:crypto");

function selectLiveQuestions(available, ids) {
  if (!Array.isArray(ids) || !ids.length || ids.length > 100 ||
      ids.some(id => typeof id !== "string" || !id.trim()) || new Set(ids).size !== ids.length) {
    throw new Error("Selecciona entre 1 y 100 preguntas, sin duplicados");
  }
  const byId = new Map(available.filter(question => !question.deletedAt && question.active !== false).map(question => [question.id, question]));
  const questions = ids.map(id => byId.get(id));
  if (questions.some(question => !question)) throw new Error("Hay preguntas retiradas o no disponibles. Revisa la seleccion antes de continuar");
  return questions;
}

function createLiveTestLibraryHandler({ readState, writeState, requireLiveHostAccount, readJsonBody, sendJson, sendJsonError, availableQuestions, normalizeTime }) {
  return async (req, res, url) => {
    const match = url.pathname.match(/^\/api\/test-zone\/live-presets(?:\/([^/]+))?$/);
    if (!match) return false;
    res.setHeader("Cache-Control", "no-store");
    try {
      if (!requireLiveHostAccount(req, res, readState())) return true;
      const payload = ["POST", "PUT"].includes(req.method) ? await readJsonBody(req, 32768) : null;
      const state = readState();
      const account = requireLiveHostAccount(req, res, state);
      if (!account) return true;
      const presets = Array.isArray(state.testZoneLivePresets) ? state.testZoneLivePresets : [];
      const own = presets.filter(preset => preset.createdByAccountId === account.id);
      const id = match[1] ? decodeURIComponent(match[1]) : "";
      const existing = id ? own.find(preset => preset.id === id) : null;
      if (id && !existing) { sendJson(res, 404, { ok: false, error: "Test guardado no encontrado" }); return true; }
      if (req.method === "GET" && !id) {
        sendJson(res, 200, { ok: true, presets: own });
      } else if ((!id && req.method === "POST") || (id && req.method === "PUT")) {
        if (!payload || typeof payload !== "object" || Array.isArray(payload)) throw new Error("Datos de test no validos");
        const title = String(payload.title || "").trim();
        if (!title || title.length > 160) throw new Error("Indica un titulo de hasta 160 caracteres");
        const questions = selectLiveQuestions(availableQuestions(state), payload.questionIds);
        if (!existing && own.length >= 100) throw new Error("Puedes guardar hasta 100 tests. Edita uno existente o elimina uno que no necesites");
        if (existing && payload.updatedAt !== existing.updatedAt) {
          sendJson(res, 409, { ok: false, error: "El test ha cambiado. Vuelve a cargarlo antes de guardar" }); return true;
        }
        const now = new Date(Math.max(Date.now(), (Date.parse(existing?.updatedAt) || 0) + 1)).toISOString();
        const preset = { id: existing?.id || randomUUID(), createdByAccountId: account.id,
          title, questionIds: questions.map(question => question.id),
          questionTimeLimitSeconds: normalizeTime(payload.questionTimeLimitSeconds),
          createdAt: existing?.createdAt || now, updatedAt: now };
        state.testZoneLivePresets = existing ? presets.map(item => item.id === id ? preset : item) : [...presets, preset];
        writeState(state);
        sendJson(res, existing ? 200 : 201, { ok: true, preset });
      } else if (id && req.method === "DELETE") {
        state.testZoneLivePresets = presets.filter(item => item.id !== id);
        writeState(state);
        sendJson(res, 200, { ok: true });
      } else {
        sendJson(res, 405, { ok: false, error: "Metodo no permitido" });
      }
    } catch (error) { sendJsonError(res, error, "No se pudo guardar el test" ); }
    return true;
  };
}

module.exports = { selectLiveQuestions, createLiveTestLibraryHandler };
