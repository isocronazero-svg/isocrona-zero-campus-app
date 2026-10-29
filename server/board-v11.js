const { appendAuditEvent } = require("./audit-log");

function clean(value) {
  return String(value || "").trim();
}

function arrays(value) {
  return Array.isArray(value) ? value : [];
}

function resolveAccountAssociate(state, account) {
  if (!account) return null;
  const member = arrays(state.members).find((item) => item.id === account.memberId) || null;
  const associateId = clean(account.associateId || member?.associateId);
  return arrays(state.associates).find((associate) =>
    (associateId && associate.id === associateId) ||
    (account.id && associate.linkedAccountId === account.id) ||
    (account.memberId && associate.linkedMemberId === account.memberId)
  ) || null;
}

function canManageTreasury(state, account) {
  return Boolean(account && (account.role === "admin" || resolveAccountAssociate(state, account)?.treasuryEnabled === true));
}

function proofRequestNotificationId(courseId, submissionId) {
  return `course-proof-request__${encodeURIComponent(clean(courseId))}__${encodeURIComponent(clean(submissionId))}`;
}

function upsertProofRequestNotification(state, account, course, submission, member, note = "") {
  state.memberNotifications = arrays(state.memberNotifications);
  const id = proofRequestNotificationId(course.id, submission.id);
  const now = new Date().toISOString();
  const detail = clean(note);
  const body = [
    `Tesorería necesita que adjuntes el justificante de pago de la formación «${course.title || "Curso"}».`,
    detail ? `Observación: ${detail}` : "",
    "Entra en Cursos, abre esta formación y utiliza el apartado de inscripción/pago para adjuntarlo."
  ].filter(Boolean).join("\n\n");
  const current = state.memberNotifications.find((item) => item.id === id);
  const record = {
    ...(current || {}),
    id,
    title: `Justificante pendiente · ${course.title || "Curso"}`,
    body,
    targetType: "member",
    memberId: member.id,
    priority: "important",
    createdByAccountId: account.id || "",
    createdByMemberId: account.memberId || "",
    createdAt: now,
    readByMemberIds: [],
    attachments: [],
    courseId: course.id,
    submissionId: submission.id,
    resolvedAt: ""
  };
  if (current) Object.assign(current, record);
  else state.memberNotifications.unshift(record);
  return record;
}

function paymentCategory(course) {
  const type = `${clean(course?.courseClass)} ${clean(course?.journeyTypeId)} ${clean(course?.journeyTypeLabel)}`.toLowerCase();
  return /jornada|intensiv|traffic|vertical|rescate|incend/.test(type) && clean(course?.journeyTypeId) ? "jornada" : "curso";
}

function buildAccountingLedger(state) {
  const entries = [];
  for (const associate of arrays(state.associates)) {
    const member = arrays(state.members).find((item) => item.id === associate.linkedMemberId || item.associateId === associate.id) || null;
    for (const payment of arrays(associate.payments)) {
      const amount = Number(payment.amount || 0);
      if (!Number.isFinite(amount) || amount <= 0) continue;
      entries.push({
        id: `quota:${associate.id}:${clean(payment.id || payment.date || payment.year || entries.length)}`,
        sourceType: "associate-payment",
        sourceId: clean(payment.id),
        category: "cuota",
        concept: clean(payment.note) || `Cuota socio ${clean(payment.year) || ""}`.trim(),
        amount,
        date: clean(payment.date || payment.createdAt),
        exerciseYear: clean(payment.year) || String(new Date(payment.date || Date.now()).getFullYear()),
        method: clean(payment.method),
        associateId: associate.id,
        memberId: member?.id || associate.linkedMemberId || "",
        personName: [associate.firstName, associate.lastName].filter(Boolean).join(" ") || member?.name || associate.email || "Socio",
        courseId: "",
        courseTitle: "",
        validatedBy: clean(payment.recordedBy || payment.createdBy || payment.reviewedBy || "Administración"),
        validatedAt: clean(payment.reviewedAt || payment.createdAt || payment.date),
        proofName: clean(payment.proofFile || payment.paymentProof?.name)
      });
    }
  }
  for (const course of arrays(state.courses)) {
    for (const submission of arrays(course.enrollmentSubmissions)) {
      if (clean(submission.paymentStatus).toLowerCase() !== "validated") continue;
      const amount = Number(submission.amount || 0);
      if (!Number.isFinite(amount) || amount <= 0) continue;
      const member = arrays(state.members).find((item) => item.id === submission.memberId) || null;
      entries.push({
        id: `course:${course.id}:${submission.id}`,
        sourceType: "course-payment",
        sourceId: submission.id,
        category: paymentCategory(course),
        concept: course.title || "Formación",
        amount,
        date: clean(submission.paymentValidatedAt || submission.paymentReviewedAt || submission.updatedAt || submission.submittedAt),
        exerciseYear: String(new Date(course.startDate || submission.paymentValidatedAt || Date.now()).getFullYear()),
        method: clean(submission.method),
        associateId: member?.associateId || "",
        memberId: submission.memberId || "",
        personName: member?.name || member?.email || "Participante",
        courseId: course.id,
        courseTitle: course.title || "Curso",
        validatedBy: clean(submission.paymentValidatedBy || submission.paymentReviewedBy),
        validatedAt: clean(submission.paymentValidatedAt || submission.paymentReviewedAt),
        proofName: clean(submission.paymentProof?.name || submission.paymentProof?.fileName)
      });
    }
  }
  entries.sort((a, b) => String(b.validatedAt || b.date || "").localeCompare(String(a.validatedAt || a.date || "")));
  const byCategory = { cuota: 0, curso: 0, jornada: 0, otro: 0 };
  for (const entry of entries) {
    const key = Object.prototype.hasOwnProperty.call(byCategory, entry.category) ? entry.category : "otro";
    byCategory[key] += Number(entry.amount || 0);
  }
  return {
    entries,
    summary: {
      total: entries.reduce((sum, entry) => sum + Number(entry.amount || 0), 0),
      count: entries.length,
      byCategory
    }
  };
}

function csvCell(value) {
  const text = String(value ?? "");
  const safe = /^[=+\-@]/.test(text.trim()) ? `'${text}` : text;
  return `"${safe.replaceAll('"', '""')}"`;
}

function ledgerCsv(snapshot) {
  const rows = [["Fecha", "Categoría", "Concepto", "Persona", "Importe", "Método", "Ejercicio", "Validado por", "Validado el"]];
  for (const entry of snapshot.entries) rows.push([
    entry.date, entry.category, entry.concept, entry.personName, entry.amount, entry.method,
    entry.exerciseYear, entry.validatedBy, entry.validatedAt
  ]);
  return rows.map((row) => row.map(csvCell).join(";")).join("\n");
}

function validWhatsappUrl(value) {
  const raw = clean(value);
  if (!raw) return "";
  let url;
  try { url = new URL(raw); } catch { throw new Error("El enlace de WhatsApp no es válido"); }
  if (url.protocol !== "https:" || !/(^|\.)whatsapp\.com$|(^|\.)chat\.whatsapp\.com$|(^|\.)wa\.me$/i.test(url.hostname)) {
    throw new Error("Usa un enlace HTTPS oficial de WhatsApp");
  }
  return url.toString();
}

function createBoardV11Handler(deps) {
  return async function handle(req, res, url) {
    if (!url.pathname.startsWith("/api/v1.1/")) return false;
    let state = deps.readState();
    let account = deps.requireAuthenticatedAccount(req, res, state);
    if (!account) return true;

    if (url.pathname === "/api/v1.1/accounting-ledger" && req.method === "GET") {
      if (!canManageTreasury(state, account)) {
        deps.sendJson(res, 403, { ok: false, error: "No tienes permiso de tesorería" });
        return true;
      }
      deps.sendJson(res, 200, { ok: true, ...buildAccountingLedger(state) });
      return true;
    }

    if (url.pathname === "/api/v1.1/accounting-ledger.csv" && req.method === "GET") {
      if (!canManageTreasury(state, account)) {
        deps.sendJson(res, 403, { ok: false, error: "No tienes permiso de tesorería" });
        return true;
      }
      const csv = ledgerCsv(buildAccountingLedger(state));
      res.writeHead(200, {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="ingresos-isocrona-zero.csv"',
        "Cache-Control": "private, no-store"
      });
      res.end(`\uFEFF${csv}`);
      return true;
    }

    if (url.pathname === "/api/v1.1/whatsapp-channel" && req.method === "PUT") {
      if (account.role !== "admin") {
        deps.sendJson(res, 403, { ok: false, error: "Solo administración puede cambiar el canal de WhatsApp" });
        return true;
      }
      try {
        const payload = await deps.readJsonBody(req, 16 * 1024);
        state = deps.readState();
        account = deps.requireAuthenticatedAccount(req, res, state);
        if (!account) return true;
        if (account.role !== "admin") {
          deps.sendJson(res, 403, { ok: false, error: "Solo administración puede cambiar el canal de WhatsApp" });
          return true;
        }
        const inviteUrl = validWhatsappUrl(payload.url);
        state.settings = state.settings || {};
        state.settings.associates = state.settings.associates || {};
        const before = clean(state.settings.associates.whatsappChannelInviteUrl);
        state.settings.associates.whatsappChannelInviteUrl = inviteUrl;
        appendAuditEvent(state, {
          account,
          module: "settings",
          entityType: "whatsapp-channel",
          entityId: "association-whatsapp",
          entityLabel: "Canal de WhatsApp",
          action: "update-whatsapp-channel",
          before: { configured: Boolean(before) },
          after: { configured: Boolean(inviteUrl) }
        });
        deps.writeState(state);
        deps.sendJson(res, 200, { ok: true, configured: Boolean(inviteUrl), url: inviteUrl });
      } catch (error) {
        deps.sendJsonError(res, error, "No se pudo guardar el enlace de WhatsApp");
      }
      return true;
    }

    const requestProof = url.pathname.match(/^\/api\/v1\.1\/course-finance\/courses\/([^/]+)\/submissions\/([^/]+)\/request-proof$/);
    if (requestProof && req.method === "POST") {
      if (!canManageTreasury(state, account)) {
        deps.sendJson(res, 403, { ok: false, error: "No tienes permiso de tesorería" });
        return true;
      }
      try {
        const payload = await deps.readJsonBody(req, 16 * 1024);
        state = deps.readState();
        account = deps.requireAuthenticatedAccount(req, res, state);
        if (!account || !canManageTreasury(state, account)) {
          if (account) deps.sendJson(res, 403, { ok: false, error: "No tienes permiso de tesorería" });
          return true;
        }
        const courseId = decodeURIComponent(requestProof[1]);
        const submissionId = decodeURIComponent(requestProof[2]);
        const course = arrays(state.courses).find((item) => item.id === courseId);
        const submission = arrays(course?.enrollmentSubmissions).find((item) => item.id === submissionId);
        const member = arrays(state.members).find((item) => item.id === submission?.memberId);
        if (!course || !submission || !member) {
          deps.sendJson(res, 404, { ok: false, error: "Curso, inscripción o socio no encontrado" });
          return true;
        }
        if (Number(submission.amount || 0) <= 0) {
          deps.sendJson(res, 409, { ok: false, error: "Esta inscripción no requiere justificante de pago" });
          return true;
        }
        const note = clean(payload.note).slice(0, 800);
        const now = new Date().toISOString();
        const before = {
          proofRequestedAt: clean(submission.proofRequestedAt),
          proofRequestedBy: clean(submission.proofRequestedBy),
          paymentStatus: clean(submission.paymentStatus || "pending")
        };
        submission.proofRequestedAt = now;
        submission.proofRequestedBy = account.name || "Tesorería";
        submission.proofRequestNote = note;
        if (clean(submission.paymentStatus).toLowerCase() !== "validated") submission.paymentStatus = "pending";
        const notification = upsertProofRequestNotification(state, account, course, submission, member, note);
        appendAuditEvent(state, {
          account,
          module: "course-finance",
          entityType: "course-payment",
          entityId: submission.id,
          entityLabel: `${member.name || member.email || "Socio"} · ${course.title || "Curso"}`,
          action: "request-payment-proof",
          before,
          after: {
            proofRequestedAt: now,
            proofRequestedBy: submission.proofRequestedBy,
            paymentStatus: submission.paymentStatus
          },
          metadata: { courseId: course.id, memberId: member.id, notificationId: notification.id }
        });
        deps.writeState(state);
        deps.sendJson(res, 200, {
          ok: true,
          message: "Solicitud de justificante enviada al socio",
          requestedAt: now,
          notificationId: notification.id
        });
      } catch (error) {
        deps.sendJsonError(res, error, "No se pudo solicitar el justificante");
      }
      return true;
    }

    deps.sendJson(res, 405, { ok: false, error: "Ruta V1.1 no disponible" });
    return true;
  };
}

module.exports = {
  buildAccountingLedger,
  canManageTreasury,
  createBoardV11Handler,
  ledgerCsv,
  proofRequestNotificationId,
  upsertProofRequestNotification,
  validWhatsappUrl
};