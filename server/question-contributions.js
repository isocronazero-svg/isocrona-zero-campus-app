const { randomUUID, createHash } = require("node:crypto");
const key = q => createHash("sha256").update(JSON.stringify([String(q.part).normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLocaleLowerCase("es"), String(q.prompt).trim().toLocaleLowerCase("es"), q.options.map(o => String(o).trim().toLocaleLowerCase("es"))])).digest("hex");

function queueQuestions(state, account, questions) {
  state.testZoneContributions ||= [];
  const ownPending = state.testZoneContributions.filter(c => c.accountId === account.id && c.status === "pending").length;
  const existing = new Set([
    ...(state.testZoneQuestions || []).map(key),
    ...state.testZoneContributions.filter(c => c.accountId === account.id && c.status === "pending").map(c => key(c.question))
  ]);
  const unique = [];
  for (const question of questions) {
    const fingerprint = key(question);
    if (!existing.has(fingerprint)) { unique.push(question); existing.add(fingerprint); }
  }
  if (ownPending + unique.length > 1000) throw new Error("Puedes tener hasta 1.000 preguntas pendientes. Espera a que se revisen antes de enviar más.");
  let queued = 0;
  for (const question of unique) {
    const fingerprint = key(question);
    state.testZoneContributions.unshift({ id: randomUUID(), accountId: account.id, author: account.name || "Socio",
      question, status: "pending", revision: 1, createdAt: new Date().toISOString() });
    existing.add(fingerprint); queued++;
  }
  return queued;
}

function createQuestionContributionsHandler(deps) {
  return async (req, res, url) => {
    const match = url.pathname.match(/^\/api\/test-zone\/contributions(?:\/([^/]+))?$/);
    if (!match) return false;
    const send = (code, payload) => { deps.sendJson(res, code, payload); return true; };
    try {
      let state = deps.readState();
      const authorize = match[1] ? deps.requireAdminAccount : deps.requireAuthenticatedAccount;
      let account = authorize(req, res, state);
      if (!account) return true;
      if (!match[1] && req.method === "GET") {
        const admin = account.role === "admin" && url.searchParams.get("mode") !== "member";
        const status = url.searchParams.get("status") || (admin ? "pending" : "all");
        const own = (state.testZoneContributions || []).filter(c => (admin || c.accountId === account.id) && (status === "all" || c.status === status));
        const page = Math.max(0, Math.min(Math.floor(Number(url.searchParams.get("page"))) || 0, Math.max(0, Math.ceil(own.length / 20) - 1)));
        return send(200, { ok: true, items: own.slice(page * 20, page * 20 + 20), total: own.length, page, admin });
      }
      if (req.method !== "POST") return send(405, { ok: false, error: "Método no permitido" });
      const body = await deps.readJsonBody(req, 32768);
      state = deps.readState();
      account = authorize(req, res, state);
      if (!account) return true;
      const validate = input => {
        if (!input || typeof input !== "object" || Array.isArray(input)) throw new Error("Completa la pregunta.");
        for (const [field, limit] of [["prompt", 4000], ["category", 150], ["part", 150], ["explanation", 6000]]) {
          if ((input[field] != null && typeof input[field] !== "string") || String(input[field] || "").length > limit) throw new Error(`Revisa el campo ${field}: máximo ${limit} caracteres.`);
        }
        if (!Array.isArray(input?.options) || input.options.length !== 4 || input.options.some(o => typeof o !== "string" || !o.trim() || o.length > 1000)) throw new Error("Completa las cuatro opciones de respuesta.");
        if (!Number.isInteger(input.correctIndex) || input.correctIndex < 0 || input.correctIndex > 3) throw new Error("Indica la respuesta correcta (A, B, C o D).");
        if (!String(input.part || "").trim() || !String(input.category || "").trim()) throw new Error("Completa el bloque y el tema.");
        return deps.buildQuestion(input, account);
      };
      if (!match[1]) {
        const question = validate(body.question);
        if (account.role === "admin" && body.submitForReview !== true) {
          const duplicate = (state.testZoneQuestions || []).find(q => key(q) === key(question));
          if (!duplicate) {
            question.updatedAt = question.createdAt;
            (state.testZoneQuestions ||= []).unshift(question);
            deps.writeState(state);
          }
          return send(200, { ok: true, published: !duplicate, duplicate: Boolean(duplicate) });
        }
        const queued = queueQuestions(state, account, [question]);
        if (queued) deps.writeState(state);
        return send(200, { ok: true, queued, duplicate: !queued });
      }
      const item = (state.testZoneContributions || []).find(c => c.id === decodeURIComponent(match[1]));
      if (!item) return send(404, { ok: false, error: "Aportación no encontrada" });
      if (item.status !== "pending" || body.revision !== item.revision) return send(409, { ok: false, error: "La aportación ya ha cambiado. Actualiza la lista antes de revisarla." });
      if (!["save", "approve", "reject"].includes(body.action)) throw new Error("Acción de revisión no válida");
      if (body.action !== "reject") {
        const edited = validate(body.question);
        item.question = { ...item.question, ...edited, id: item.question.id, createdAt: item.question.createdAt };
      }
      if (body.action === "approve") {
        let published = (state.testZoneQuestions || []).find(q => key(q) === key(item.question));
        if (published?.deletedAt) throw new Error("Esta pregunta coincide con una retirada del banco. Modifícala antes de validarla.");
        if (!published) {
          published = { ...item.question, id: randomUUID(), contributionId: item.id, createdBy: item.author,
            reviewedBy: account.id, updatedAt: new Date().toISOString() };
          (state.testZoneQuestions ||= []).unshift(published);
        }
        item.status = "approved"; item.publishedQuestionId = published.id;
      } else if (body.action === "reject") item.status = "rejected";
      item.revision++;
      item.reviewedBy = account.id;
      item.updatedAt = new Date().toISOString();
      deps.writeState(state);
      return send(200, { ok: true, item });
    } catch (error) { deps.sendJsonError(res, error, "No se pudo guardar la aportación"); return true; }
  };
}
module.exports = { queueQuestions, createQuestionContributionsHandler };
