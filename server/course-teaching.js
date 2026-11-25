const { createHash, randomUUID } = require("node:crypto");
const { canManageAssignedCourse } = require("./course-permissions");

function teachingVersion(course) {
  return createHash("sha256").update(JSON.stringify([
    course.resources || [], course.sharedTestQuestionIds || [], course.sharedTestPublished === true
  ])).digest("hex");
}

function createCourseTeachingHandler(deps) {
  return async (req, res, url) => {
    const match = url.pathname.match(/^\/api\/courses\/([^/]+)\/teaching(?:\/resources\/([^/]+))?$/);
    if (!match) return false;
    const send = (code, body) => { deps.sendJson(res, code, body); return true; };
    res.setHeader("Cache-Control", "no-store");
    try {
      if (!["GET", "PATCH"].includes(req.method) || (match[2] && req.method !== "GET")) return send(405, { error: "Metodo no permitido" });
      if (!deps.requireAuthenticatedAccount(req, res, deps.readState())) return true;
      const payload = req.method === "PATCH" ? await deps.readJsonBody(req, 28_000_000) : null;
      const state = deps.readState();
      const account = deps.requireAuthenticatedAccount(req, res, state);
      if (!account) return true;
      const course = (state.courses || []).find(item => item.id === decodeURIComponent(match[1]));
      if (!course) return send(404, { error: "Curso no encontrado" });
      const manages = canManageAssignedCourse(account, course);
      if (match[2]) {
        if (!manages && !deps.canAccessCourse(state, account, course)) return send(403, { error: "No tienes acceso al curso" });
        const resource = (course.resources || []).find(item => item.id === decodeURIComponent(match[2]));
        if (!resource?.attachment?.contentBase64 || (!manages && ["interno", "instructores"].includes(resource.visibility))) return send(404, { error: "Documento no encontrado" });
        const bytes = Buffer.from(resource.attachment.contentBase64, "base64");
        res.writeHead(200, { "Content-Type": "application/octet-stream", "Content-Length": bytes.length,
          "X-Content-Type-Options": "nosniff", "Content-Disposition": `attachment; filename="${String(resource.attachment.name || "documento").replace(/[^a-zA-Z0-9._-]/g, "_")}"` });
        res.end(bytes);
        return true;
      }
      if (!manages) return send(403, { error: "Solo puedes gestionar cursos en los que estas asignado" });
      if (payload) {
        if (payload.version !== teachingVersion(course)) return send(409, { error: "El contenido ha cambiado. Actualiza antes de guardar; conserva el archivo seleccionado." });
        if (payload.action === "resource") {
          const title = String(payload.title || "").trim();
          if (!title || title.length > 200) return send(400, { error: "Indica un titulo de hasta 200 caracteres" });
          const existing = (course.resources || []).find(item => item.id === payload.id);
          if (payload.id && !existing) return send(404, { error: "Recurso no encontrado" });
          let attachment = existing?.attachment;
          if (payload.attachment) {
            const input = payload.attachment;
            const encoded = String(input.contentBase64 || "");
            const bytes = Buffer.from(encoded, "base64");
            if (!bytes.length || bytes.length > 20_000_000 || bytes.toString("base64") !== encoded) return send(400, { error: "Archivo invalido o superior a 20 MB" });
            attachment = { name: String(input.name || "documento").slice(0, 200), type: "application/octet-stream", size: bytes.length, contentBase64: encoded };
          }
          const id = existing?.id || `resource-${randomUUID()}`;
          const link = existing?.url || "";
          if (!attachment && !link) return send(400, { error: "Selecciona un archivo" });
          const resource = { ...existing, id, label: title, type: "Documento", description: String(payload.description || "").slice(0, 2000),
            visibility: existing?.visibility || "alumnado", ...(attachment ? { attachment } : {}),
            url: attachment ? `/api/courses/${encodeURIComponent(course.id)}/teaching/resources/${encodeURIComponent(id)}` : link };
          course.resources = existing ? course.resources.map(item => item.id === id ? resource : item) : [...(course.resources || []), resource];
        } else if (payload.action === "remove-resource") {
          if (!(course.resources || []).some(item => item.id === payload.id)) return send(404, { error: "Recurso no encontrado" });
          course.resources = course.resources.filter(item => item.id !== payload.id);
        } else if (payload.action === "test") {
          const questions = deps.sharedQuestions(state, payload.questionIds);
          if (payload.published === true && !questions.length) return send(400, { error: "Selecciona preguntas antes de publicar" });
          course.sharedTestQuestionIds = questions.map(item => item.id);
          course.sharedTestPublished = payload.published === true;
        } else return send(400, { error: "Operacion no permitida" });
        // No SMTP, enrollment, finance or global automation is invoked by teaching edits.
        course.teachingRevision = Number(course.teachingRevision || 0) + 1;
        deps.writeState(state);
        Object.assign(course, deps.readState().courses.find(item => item.id === course.id));
      }
      return send(200, { ok: true, course: { id: course.id, title: course.title }, version: teachingVersion(course),
        resources: (course.resources || []).map(({ attachment, ...resource }) => ({ ...resource, hasAttachment: Boolean(attachment) })),
        questionIds: course.sharedTestQuestionIds || [], published: course.sharedTestPublished === true,
        questions: (state.testZoneQuestions || []).filter(q => !q.deletedAt && q.active !== false && q.published !== false)
          .map(q => ({ id: q.id, prompt: q.prompt })),
        results: (state.testZoneResults || []).filter(result => result.courseId === course.id).map(result => ({
          id: result.id, name: (state.members || []).find(member => member.id === result.memberId)?.name || "Participante",
          score: result.score, total: result.total, createdAt: result.createdAt
        })) });
    } catch (error) {
      deps.sendJsonError(res, error, "No se pudo guardar el contenido docente");
      return true;
    }
  };
}

module.exports = { createCourseTeachingHandler, teachingVersion };
