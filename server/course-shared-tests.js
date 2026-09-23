const { createHmac, randomBytes } = require("node:crypto");

function sharedQuestions(state, ids) {
  if (!Array.isArray(ids) || ids.length > 200) throw new Error("Selecciona hasta 200 preguntas del banco comun");
  const unique = [...new Set(ids.map((id) => String(id).trim()))];
  const byId = new Map((state.testZoneQuestions || []).map((question) => [question.id, question]));
  return unique.map((id) => {
    const question = byId.get(id);
    if (!question || question.active === false || question.published === false) {
      throw new Error("Una pregunta seleccionada ya no esta disponible en la Zona Test");
    }
    return question;
  });
}

function courseTestConfig(state, payload, previous = {}) {
  const source = payload?.course || payload || {};
  const supplied = Object.prototype.hasOwnProperty.call(source, "sharedTestQuestionIds");
  const ids = supplied ? source.sharedTestQuestionIds : previous.sharedTestQuestionIds || [];
  // Validate explicit selections; unrelated course edits preserve existing references.
  const questionIds = supplied ? sharedQuestions(state, ids).map((question) => question.id) : ids;
  return {
    sharedTestQuestionIds: questionIds,
    sharedTestPublished: Object.prototype.hasOwnProperty.call(source, "sharedTestPublished")
      ? source.sharedTestPublished === true
      : previous.sharedTestPublished === true
  };
}

function createCourseSharedTestHandler(deps) {
  const secret = randomBytes(32);
  return async function handle(req, res, url) {
    const match = url.pathname.match(/^\/api\/courses\/([^/]+)\/shared-test(?:\/(results))?$/);
    if (!match) return false;
    const send = (status, payload) => { deps.sendJson(res, status, payload); return true; };
    try {
      if ((!match[2] && req.method !== "GET") || (match[2] && req.method !== "POST")) {
        return send(405, { ok: false, error: "Metodo no permitido" });
      }
      let state = deps.readState();
      if (!deps.requireAuthenticatedAccount(req, res, state)) return true;
      const payload = match[2] ? await deps.readJsonBody(req, deps.payloadLimit) : null;
      // Body reading yields; always authorize and resolve the course using fresh state.
      state = deps.readState();
      const account = deps.requireAuthenticatedAccount(req, res, state);
      if (!account) return true;
      const course = (state.courses || []).find((item) => item.id === decodeURIComponent(match[1]));
      if (!course) return send(404, { ok: false, error: "Curso no encontrado" });
      const preview = account.role === "admin";
      if (!preview && (!course.sharedTestPublished || !deps.canAccessCourse(state, account, course))) {
        return send(403, { ok: false, error: "El test no esta publicado o no estas inscrito en este curso" });
      }
      const questions = sharedQuestions(state, course.sharedTestQuestionIds || []).map(deps.normalizeQuestion);
      if (!questions.length) return send(409, { ok: false, error: "Este curso todavia no tiene preguntas seleccionadas" });
      const version = createHmac("sha256", secret)
        .update(JSON.stringify([course.id, course.sharedTestPublished, questions.map((q) => [q.id, q.prompt, q.options, q.correctIndex])]))
        .digest("hex");
      if (!match[2]) {
        return send(200, {
          ok: true, course: { id: course.id, title: course.title }, preview, version,
          questions: questions.map(deps.audienceQuestion),
          results: (state.testZoneResults || [])
            .filter((result) => result.courseId === course.id && result.accountId === account.id)
            .slice(0, 10).map((result) => deps.audienceResult(result))
        });
      }
      const attemptId = String(payload.attemptId || "");
      if (!/^[a-zA-Z0-9-]{16,100}$/.test(attemptId)) throw new Error("Identificador de intento no valido");
      const fingerprint = JSON.stringify([payload.questionIds, payload.answers]);
      const previous = (state.testZoneResults || []).find((result) =>
        result.courseId === course.id && result.accountId === account.id && result.attemptId === attemptId);
      if (previous) {
        if (previous.submissionFingerprint !== fingerprint) return send(409, { ok: false, error: "Este intento ya fue guardado con otras respuestas" });
        return send(200, { ok: true, preview: false, result: deps.audienceResult(previous, { includeReviewDetails: true }) });
      }
      if (payload.version !== version) return send(409, { ok: false, error: "El test ha cambiado. Recarga la pagina para responder a la version actual" });
      const result = deps.createResult(state, payload, {
        accountId: account.id, memberId: account.memberId || "", mode: "course",
        source: "course", title: `Test del curso: ${course.title}`, allowedQuestionIds: questions.map((question) => question.id)
      });
      Object.assign(result, { courseId: course.id, attemptId, submissionFingerprint: fingerprint });
      if (!preview) deps.writeState(state);
      return send(201, { ok: true, preview, result: deps.audienceResult(result, { includeReviewDetails: true }) });
    } catch (error) {
      deps.sendJsonError(res, error, "No se pudo completar el test del curso");
      return true;
    }
  };
}

module.exports = { sharedQuestions, courseTestConfig, createCourseSharedTestHandler };
