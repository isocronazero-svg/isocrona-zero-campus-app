const { buildDiplomaLayout, renderDiplomaPagesHtml } = require("./diploma-layout");

function clean(value) {
  return String(value || "").trim();
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function safeDate(value) {
  const raw = clean(value);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return "";
  const date = new Date(`${raw}T12:00:00Z`);
  return Number.isFinite(date.getTime()) ? date : null;
}

function formatDate(value) {
  const date = safeDate(value);
  if (!date) return clean(value) || "fecha por definir";
  return new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(date);
}

function formatDateRange(startDate, endDate) {
  const start = clean(startDate);
  const end = clean(endDate);
  if (!start && !end) return "Fechas por definir";
  if (!end || start === end) return `Realizado el ${formatDate(start || end)}`;
  return `Realizado del ${formatDate(start)} al ${formatDate(end)}`;
}

function normalizeContents(value) {
  if (!Array.isArray(value)) return [];
  return value.map((item) => clean(item)).filter(Boolean).slice(0, 250);
}

function buildSections(course) {
  const certificateContents = normalizeContents(course.certificateContents);
  if (certificateContents.length) {
    const grouped = [];
    let looseItems = [];
    for (const line of certificateContents) {
      const separator = line.indexOf("|");
      if (separator > 0) {
        const title = clean(line.slice(0, separator));
        const items = line.slice(separator + 1).split(";").map(clean).filter(Boolean);
        if (title && items.length) grouped.push({ title, items });
      } else {
        looseItems.push(line);
      }
    }
    if (looseItems.length) grouped.unshift({ title: "Contenidos formativos", items: looseItems });
    if (grouped.length) return grouped;
  }

  const modules = Array.isArray(course.modules) ? course.modules : [];
  const moduleSections = modules.map((module, index) => {
    const lessons = Array.isArray(module?.lessons) ? module.lessons : [];
    const items = lessons.map((lesson) => clean(lesson?.title || lesson?.takeaway || lesson?.instructions)).filter(Boolean);
    if (!items.length && clean(module?.goal)) items.push(clean(module.goal));
    return { title: clean(module?.title) || `Bloque ${index + 1}`, items };
  }).filter((section) => section.items.length);
  if (moduleSections.length) return moduleSections;

  const objectives = normalizeContents(course.objectives);
  if (objectives.length) return [{ title: "Objetivos", items: objectives }];
  return [];
}

function normalizePreviewCourse(payload = {}) {
  const course = payload.course && typeof payload.course === "object" ? payload.course : payload;
  return {
    id: clean(course.id || "preview-course"),
    title: clean(course.title) || "NOMBRE DEL CURSO",
    startDate: clean(course.startDate),
    endDate: clean(course.endDate),
    hours: Math.max(0, Number(course.hours || 0)),
    diplomaTemplate: clean(course.diplomaTemplate || "Aprovechamiento"),
    certificateCity: clean(course.certificateCity),
    certificateContents: normalizeContents(course.certificateContents),
    modules: Array.isArray(course.modules) ? course.modules : [],
    objectives: normalizeContents(course.objectives)
  };
}

function buildPreviewModel(state, course) {
  return {
    kind: "student",
    preview: true,
    certificateTitle: "CERTIFICADO DE APROVECHAMIENTO",
    member: { id: "preview-member", name: "NOMBRE APELLIDOS" },
    documentId: "00000000X",
    course,
    registryNumber: "VISTA PREVIA",
    code: "SIN VALIDEZ",
    dateRange: formatDateRange(course.startDate, course.endDate),
    issueDate: formatDate(new Date().toISOString().slice(0, 10)),
    city: course.certificateCity || state.settings?.certificateCity || "Madrid",
    sections: buildSections(course)
  };
}

function createDiplomaPreviewHandler(deps) {
  return async function handle(req, res, url) {
    if (url.pathname !== "/api/admin/diploma-preview") return false;
    const state = deps.readState();
    const account = deps.requireAuthenticatedAccount(req, res, state);
    if (!account) return true;
    if (account.role !== "admin") {
      deps.sendJson(res, 403, { ok: false, error: "La previsualizacion del diploma esta reservada a administracion" });
      return true;
    }
    if (req.method !== "POST") {
      deps.sendJson(res, 405, { ok: false, error: "Metodo no permitido" });
      return true;
    }
    try {
      const payload = await deps.readJsonBody(req, 256 * 1024);
      const course = normalizePreviewCourse(payload);
      const model = buildPreviewModel(state, course);
      const pages = buildDiplomaLayout(model, state.settings || {}, "");
      const html = renderDiplomaPagesHtml(pages, `Vista previa · ${course.title}`, escapeHtml)
        .replace("<body>", '<body><div style="position:fixed;right:14px;bottom:14px;z-index:99;padding:8px 12px;border-radius:999px;background:#b91c32;color:white;font:700 12px Arial">VISTA PREVIA · SIN VALIDEZ</div>');
      res.writeHead(200, {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff"
      });
      res.end(html);
      return true;
    } catch (error) {
      deps.sendJsonError(res, error, "No se pudo generar la vista previa del diploma");
      return true;
    }
  };
}

module.exports = {
  buildPreviewModel,
  buildSections,
  createDiplomaPreviewHandler,
  normalizePreviewCourse
};
