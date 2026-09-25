// Scoped question maintenance: reports belong to their author; moderation is admin-only.
module.exports = async function handleQuestionMaintenance(req, res, url, deps) {
  const questionMatch = url.pathname.match(/^\/api\/test-zone\/questions\/([^/]+)$/);
  const reportMatch = url.pathname.match(/^\/api\/test-zone\/question-reports\/([^/]+)\/resolve$/);
  const reportsPath = url.pathname === "/api/test-zone/question-reports";
  if (!(questionMatch && ["PUT", "DELETE"].includes(req.method)) &&
      !(reportsPath && ["GET", "POST"].includes(req.method)) && !(reportMatch && req.method === "POST")) return false;
  const { readState, writeState, requireAuthenticatedAccount, requireAdminAccount, readJsonBody,
    sendJson, sendJsonError, buildQuestion, adminPayload, generateId } = deps;
  const adminOnly = Boolean(questionMatch || reportMatch);
  const authorize = adminOnly ? requireAdminAccount : requireAuthenticatedAccount;
  let state = readState();
  let account = authorize(req, res, state);
  if (!account) return true;
  try {
    // Re-read after awaiting the body so simultaneous reports cannot overwrite each other.
    const payload = req.method === "GET" ? {} : await readJsonBody(req, 32768);
    state = readState();
    account = authorize(req, res, state);
    if (!account) return true;
    state.testZoneQuestionReports ||= [];
    if (reportsPath && req.method === "GET") {
      const reports = state.testZoneQuestionReports.filter(report => account.role === "admin" || report.accountId === account.id);
      sendJson(res, 200, { ok: true, reports });
    } else if (reportsPath) {
      const questionId = String(payload.questionId || "");
      const question = (state.testZoneQuestions || []).find(q => q.id === questionId && !q.deletedAt);
      if (!question) { sendJson(res, 404, { ok: false, error: "Esta pregunta ya no está disponible." }); return true; }
      const reason = String(payload.reason || "").trim();
      if (reason.length < 5 || reason.length > 2000) throw new Error("Describe el problema con entre 5 y 2000 caracteres.");
      let report = state.testZoneQuestionReports.find(r => r.questionId === questionId && r.accountId === account.id && r.status === "pending");
      if (!report) {
        report = { id: generateId("question-report"), questionId, prompt: question.prompt, reason,
          accountId: account.id, status: "pending", createdAt: new Date().toISOString() };
        state.testZoneQuestionReports.unshift(report);
        writeState(state);
      }
      sendJson(res, 200, { ok: true, report });
    } else if (reportMatch) {
      const report = state.testZoneQuestionReports.find(r => r.id === decodeURIComponent(reportMatch[1]));
      if (!report) { sendJson(res, 404, { ok: false, error: "Solicitud no encontrada." }); return true; }
      report.status = "resolved";
      report.resolvedAt = new Date().toISOString();
      report.resolvedBy = account.id;
      writeState(state);
      sendJson(res, 200, { ok: true, report });
    } else {
      const question = (state.testZoneQuestions || []).find(q => q.id === decodeURIComponent(questionMatch[1]) && !q.deletedAt);
      if (!question) { sendJson(res, 404, { ok: false, error: "Pregunta no encontrada." }); return true; }
      if (payload.expectedUpdatedAt !== (question.updatedAt || question.createdAt)) {
        sendJson(res, 409, { ok: false, error: "La pregunta ha cambiado. Cierra el editor y actualiza el banco antes de editarla." }); return true;
      }
      if (req.method === "DELETE") {
        const { previousVersions, ...snapshot } = question;
        question.previousVersions = [...(previousVersions || []), snapshot].slice(-20);
        question.deletedAt = new Date().toISOString();
        question.active = false;
        question.published = false;
        for (const course of state.courses || []) {
          if (!Array.isArray(course.sharedTestQuestionIds) || !course.sharedTestQuestionIds.includes(question.id)) continue;
          course.sharedTestQuestionIds = course.sharedTestQuestionIds.filter(id => id !== question.id);
          if (!course.sharedTestQuestionIds.length) course.sharedTestPublished = false;
        }
      } else {
        // Keep import metadata, identity and historical results intact.
        if (!Array.isArray(payload.options) || payload.options.some(option => typeof option !== "string" || !option.trim())) {
          throw new Error("Todas las opciones deben tener texto.");
        }
        const edited = buildQuestion({ ...question, ...payload }, account);
        const { previousVersions, ...snapshot } = question;
        question.previousVersions = [...(previousVersions || []), snapshot].slice(-20);
        for (const key of ["prompt", "options", "correctIndex", "explanation", "part", "category", "difficulty"]) question[key] = edited[key];
      }
      question.updatedAt = new Date(Math.max(Date.now(), Date.parse(question.updatedAt || question.createdAt) + 1)).toISOString();
      question.updatedBy = account.id;
      writeState(state);
      sendJson(res, 200, { ok: true, question: adminPayload(question) });
    }
  } catch (error) {
    sendJsonError(res, error, "No se pudo completar la revisión de la pregunta.");
  }
  return true;
};
