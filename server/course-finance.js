const { appendAuditEvent } = require("./audit-log");
const { getApplicableCourseFee } = require("./course-pricing");

function clean(value) {
  return String(value || "").trim();
}

function arrays(value) {
  return Array.isArray(value) ? value : [];
}

function resolveAccountAssociate(state, account) {
  if (!account) return null;
  const member = arrays(state?.members).find((item) => item.id === account.memberId) || null;
  const associateId = clean(account.associateId || member?.associateId);
  return arrays(state?.associates).find((associate) =>
    (associateId && associate.id === associateId) ||
    (account.id && associate.linkedAccountId === account.id) ||
    (account.memberId && associate.linkedMemberId === account.memberId)
  ) || null;
}

function canManageCourseFinance(state, account) {
  if (!account) return false;
  if (account.role === "admin") return true;
  return resolveAccountAssociate(state, account)?.treasuryEnabled === true;
}

function participantTypeForMember(state, member) {
  if (!member) return "external";
  const associateId = clean(member.associateId);
  const isAssociate = arrays(state?.associates).some((associate) =>
    (associateId && associate.id === associateId) || associate.linkedMemberId === member.id
  );
  return isAssociate ? "member" : "external";
}

function normalizedPaymentStatus(submission, amount) {
  if (Number(amount || 0) <= 0) return "not-required";
  const explicit = clean(submission?.paymentStatus).toLowerCase();
  return ["pending", "validated", "incident"].includes(explicit) ? explicit : "pending";
}

function compactProof(proof) {
  if (!proof || typeof proof !== "object") return null;
  return {
    name: clean(proof.name || proof.fileName || "justificante"),
    type: clean(proof.type || proof.mimeType || "application/octet-stream"),
    size: Number(proof.size || 0)
  };
}

function buildFinanceRow(state, course, submission) {
  const member = arrays(state.members).find((item) => item.id === submission.memberId) || null;
  const participantType = submission.participantType === "external"
    ? "external"
    : submission.participantType === "member"
      ? "member"
      : participantTypeForMember(state, member);
  const configuredAmount = getApplicableCourseFee(course, participantType);
  const hasStoredAmount = Object.prototype.hasOwnProperty.call(submission || {}, "amount") &&
    Number.isFinite(Number(submission.amount));
  const amount = hasStoredAmount ? Number(submission.amount) : configuredAmount;
  const paymentStatus = normalizedPaymentStatus(submission, amount);
  return {
    courseId: course.id,
    courseTitle: course.title || "Curso",
    submissionId: submission.id,
    memberId: submission.memberId || "",
    name: member?.name || "Participante",
    email: member?.email || "",
    participantType,
    priceCategory: participantType === "member" ? "member" : "non-member",
    configuredAmount,
    amount,
    enrollmentStatus: clean(submission.status || "pending"),
    paymentStatus,
    paymentProof: compactProof(submission.paymentProof),
    hasPaymentProof: Boolean(submission.paymentProof?.contentBase64),
    paymentReviewedBy: clean(submission.paymentReviewedBy || submission.paymentValidatedBy),
    paymentReviewedAt: clean(submission.paymentReviewedAt || submission.paymentValidatedAt),
    paymentValidatedBy: clean(submission.paymentValidatedBy),
    paymentValidatedAt: clean(submission.paymentValidatedAt),
    paymentIncidentNote: clean(submission.paymentIncidentNote),
    submittedAt: clean(submission.submittedAt),
    updatedAt: clean(submission.updatedAt)
  };
}

function buildCourseFinanceSnapshot(state) {
  const courses = arrays(state.courses).map((course) => {
    const rows = arrays(course.enrollmentSubmissions).map((submission) => buildFinanceRow(state, course, submission));
    return {
      id: course.id,
      title: course.title || "Curso",
      status: course.status || "",
      startDate: course.startDate || "",
      memberEnrollmentFee: Number(course.memberEnrollmentFee ?? course.enrollmentFee ?? 0),
      nonMemberEnrollmentFee: Number(course.nonMemberEnrollmentFee ?? course.enrollmentFee ?? 0),
      rows,
      pendingCount: rows.filter((row) => row.paymentStatus === "pending" && row.amount > 0).length,
      incidentCount: rows.filter((row) => row.paymentStatus === "incident").length,
      validatedCount: rows.filter((row) => row.paymentStatus === "validated").length
    };
  });
  const rows = courses.flatMap((course) => course.rows);
  return {
    courses,
    summary: {
      total: rows.length,
      pending: rows.filter((row) => row.paymentStatus === "pending" && row.amount > 0).length,
      validated: rows.filter((row) => row.paymentStatus === "validated").length,
      incidents: rows.filter((row) => row.paymentStatus === "incident").length,
      noPaymentRequired: rows.filter((row) => row.paymentStatus === "not-required").length
    }
  };
}

function appendFinanceActivity(state, account, message) {
  state.activityLog = arrays(state.activityLog);
  state.activityLog.unshift({
    id: `activity-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    at: new Date().toISOString(),
    actor: account?.name || "Tesoreria",
    type: account?.role || "member",
    message
  });
}

function safeFileName(value) {
  return clean(value || "justificante").replace(/[\r\n"\\/]/g, "_").slice(0, 140) || "justificante";
}

function sendProof(res, proof) {
  if (!proof?.contentBase64) {
    res.writeHead(404, { "Content-Type": "application/json; charset=utf-8" });
    res.end(JSON.stringify({ ok: false, error: "No hay justificante adjunto" }));
    return;
  }
  const bytes = Buffer.from(String(proof.contentBase64), "base64");
  res.writeHead(200, {
    "Content-Type": clean(proof.type || proof.mimeType) || "application/octet-stream",
    "Content-Length": String(bytes.length),
    "Content-Disposition": `inline; filename="${safeFileName(proof.name || proof.fileName)}"`,
    "Cache-Control": "private, no-store"
  });
  res.end(bytes);
}

function createCourseFinanceHandler(deps) {
  return async function handle(req, res, url) {
    if (!url.pathname.startsWith("/api/course-finance")) return false;
    let state = deps.readState();
    let account = deps.requireAuthenticatedAccount(req, res, state);
    if (!account) return true;
    if (!canManageCourseFinance(state, account)) {
      deps.sendJson(res, 403, { ok: false, error: "No tienes permiso de tesoreria" });
      return true;
    }

    if (url.pathname === "/api/course-finance" && req.method === "GET") {
      deps.sendJson(res, 200, { ok: true, ...buildCourseFinanceSnapshot(state) });
      return true;
    }

    const proofMatch = url.pathname.match(/^\/api\/course-finance\/courses\/([^/]+)\/submissions\/([^/]+)\/proof$/);
    if (proofMatch && req.method === "GET") {
      const course = arrays(state.courses).find((item) => item.id === decodeURIComponent(proofMatch[1]));
      const submission = arrays(course?.enrollmentSubmissions).find((item) => item.id === decodeURIComponent(proofMatch[2]));
      if (!course || !submission) {
        deps.sendJson(res, 404, { ok: false, error: "Curso o pago no encontrado" });
        return true;
      }
      sendProof(res, submission.paymentProof);
      return true;
    }

    const updateMatch = url.pathname.match(/^\/api\/course-finance\/courses\/([^/]+)\/submissions\/([^/]+)$/);
    if (updateMatch && req.method === "PATCH") {
      try {
        const payload = await deps.readJsonBody(req, deps.payloadLimit);
        // Body IO yields. Resolve permission and target again on fresh state.
        state = deps.readState();
        account = deps.requireAuthenticatedAccount(req, res, state);
        if (!account) return true;
        if (!canManageCourseFinance(state, account)) {
          deps.sendJson(res, 403, { ok: false, error: "No tienes permiso de tesoreria" });
          return true;
        }
        const courseId = decodeURIComponent(updateMatch[1]);
        const submissionId = decodeURIComponent(updateMatch[2]);
        const course = arrays(state.courses).find((item) => item.id === courseId);
        const submission = arrays(course?.enrollmentSubmissions).find((item) => item.id === submissionId);
        if (!course || !submission) {
          deps.sendJson(res, 404, { ok: false, error: "Curso o pago no encontrado" });
          return true;
        }
        const beforeRow = buildFinanceRow(state, course, submission);
        if (beforeRow.amount <= 0) {
          deps.sendJson(res, 409, { ok: false, error: "Este curso no requiere pago" });
          return true;
        }
        const nextStatus = clean(payload.paymentStatus).toLowerCase();
        if (!["pending", "validated", "incident"].includes(nextStatus)) {
          deps.sendJson(res, 400, { ok: false, error: "Estado de pago no valido" });
          return true;
        }
        const now = new Date().toISOString();
        submission.paymentStatus = nextStatus;
        submission.paymentReviewedBy = account.name || "Tesoreria";
        submission.paymentReviewedAt = now;
        submission.paymentIncidentNote = nextStatus === "incident" ? clean(payload.note) : "";
        if (nextStatus === "validated") {
          submission.paymentValidatedBy = account.name || "Tesoreria";
          submission.paymentValidatedAt = now;
        } else {
          submission.paymentValidatedBy = "";
          submission.paymentValidatedAt = "";
        }
        submission.updatedAt = now;
        const member = arrays(state.members).find((item) => item.id === submission.memberId);
        appendFinanceActivity(
          state,
          account,
          `Ha marcado el pago de ${member?.name || "un participante"} en ${course.title} como ${nextStatus}`
        );
        const afterRow = buildFinanceRow(state, course, submission);
        appendAuditEvent(state, {
          account,
          module: "course-finance",
          entityType: "course-payment",
          entityId: submission.id,
          entityLabel: `${member?.name || "Participante"} · ${course.title}`,
          action: nextStatus === "validated" ? "validate-payment" : nextStatus === "incident" ? "mark-payment-incident" : "reset-payment-pending",
          before: {
            paymentStatus: beforeRow.paymentStatus,
            amount: beforeRow.amount,
            paymentReviewedBy: beforeRow.paymentReviewedBy,
            paymentReviewedAt: beforeRow.paymentReviewedAt,
            paymentIncidentNote: beforeRow.paymentIncidentNote
          },
          after: {
            paymentStatus: afterRow.paymentStatus,
            amount: afterRow.amount,
            paymentReviewedBy: afterRow.paymentReviewedBy,
            paymentReviewedAt: afterRow.paymentReviewedAt,
            paymentIncidentNote: afterRow.paymentIncidentNote
          },
          metadata: { courseId: course.id, memberId: submission.memberId, priceCategory: afterRow.priceCategory }
        });
        deps.writeState(state);
        deps.sendJson(res, 200, {
          ok: true,
          message: nextStatus === "validated" ? "Pago validado" : nextStatus === "incident" ? "Incidencia registrada" : "Pago pendiente de revision",
          row: afterRow,
          summary: buildCourseFinanceSnapshot(state).summary
        });
        return true;
      } catch (error) {
        deps.sendJsonError(res, error, "No se pudo actualizar el pago");
        return true;
      }
    }

    deps.sendJson(res, 405, { ok: false, error: "Ruta de tesoreria no disponible" });
    return true;
  };
}

module.exports = {
  buildCourseFinanceSnapshot,
  buildFinanceRow,
  canManageCourseFinance,
  createCourseFinanceHandler,
  normalizedPaymentStatus,
  resolveAccountAssociate
};
