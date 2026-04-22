const fs = require("fs");
const path = require("path");
const { DatabaseSync } = require("node:sqlite");

const bundledDataDir = path.join(__dirname, "data");
const configuredDataDir = String(process.env.IZ_DATA_DIR || "").trim();
const dataDir = path.resolve(configuredDataDir || "/data");
const uploadsDir = path.join(dataDir, "uploads");
const associateUploadsDir = path.join(uploadsDir, "associates");
const dbPath = path.join(dataDir, "campus.db");
const defaultStatePath = process.env.IZ_DEFAULT_STATE_PATH
  ? path.resolve(process.env.IZ_DEFAULT_STATE_PATH)
  : path.join(bundledDataDir, "default-state.json");
const stateSnapshotPath = path.join(dataDir, "state.json");
const stateBackupDir = path.join(dataDir, "backups");
const maxAutomaticBackups = Number(process.env.IZ_MAX_AUTOMATIC_BACKUPS || 30);

ensureDataDir();

const db = new DatabaseSync(dbPath);
db.exec(`
  PRAGMA journal_mode = WAL;
  CREATE TABLE IF NOT EXISTS app_state (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
`);

seedDatabaseIfNeeded();

function readState() {
  ensureDataDir();
  const row = db.prepare("SELECT value FROM app_state WHERE key = ?").get("campus_state");
  if (!row) {
    const seeded = loadSeedState();
    writeState(seeded);
    return seeded;
  }

  return normalizeState(JSON.parse(row.value));
}

function writeState(state) {
  ensureDataDir();
  const normalized = normalizeState(state);
  const serialized = JSON.stringify(normalized, null, 2);
  const now = new Date().toISOString();
  db.prepare(
    `
      INSERT INTO app_state (key, value, updated_at)
      VALUES (?, ?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
    `
  ).run("campus_state", serialized, now);

  // Keep a readable snapshot alongside the database for easy inspection and manual backups.
  fs.writeFileSync(stateSnapshotPath, serialized);
  writeAutomaticBackup(serialized, now);
}

function resetState() {
  ensureDataDir();
  const seeded = JSON.parse(fs.readFileSync(defaultStatePath, "utf8"));
  writeState(seeded);
  return normalizeState(seeded);
}

function getStorageMeta() {
  ensureDataDir();
  const row = db.prepare("SELECT updated_at FROM app_state WHERE key = ?").get("campus_state");
  return {
    IZ_DATA_DIR: configuredDataDir,
    dataDir,
    uploadsDir,
    associateUploadsDir,
    dbPath,
    snapshotPath: stateSnapshotPath,
    backupDir: stateBackupDir,
    defaultStatePath,
    updatedAt: row ? row.updated_at : null
  };
}

function ensureDataDir() {
  [dataDir, uploadsDir, associateUploadsDir, stateBackupDir].forEach((targetPath) => {
    if (!fs.existsSync(targetPath)) {
      fs.mkdirSync(targetPath, { recursive: true });
    }
  });
}

function writeAutomaticBackup(serialized, timestamp) {
  const safeTimestamp = String(timestamp || new Date().toISOString()).replace(/[:.]/g, "-");
  const backupPath = path.join(stateBackupDir, `campus-backup-${safeTimestamp}.json`);
  fs.writeFileSync(backupPath, serialized);
  pruneAutomaticBackups();
}

function pruneAutomaticBackups() {
  const backupFiles = fs
    .readdirSync(stateBackupDir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && /^campus-backup-.*\.json$/i.test(entry.name))
    .map((entry) => ({
      name: entry.name,
      path: path.join(stateBackupDir, entry.name),
      modifiedAt: fs.statSync(path.join(stateBackupDir, entry.name)).mtimeMs
    }))
    .sort((a, b) => b.modifiedAt - a.modifiedAt);

  backupFiles.slice(maxAutomaticBackups).forEach((entry) => {
    fs.rmSync(entry.path, { force: true });
  });
}

function seedDatabaseIfNeeded() {
  const row = db.prepare("SELECT key FROM app_state WHERE key = ?").get("campus_state");
  if (row) {
    return;
  }

  writeState(loadSeedState());
}

function loadSeedState() {
  if (fs.existsSync(stateSnapshotPath)) {
    return normalizeState(JSON.parse(fs.readFileSync(stateSnapshotPath, "utf8")));
  }

  return normalizeState(JSON.parse(fs.readFileSync(defaultStatePath, "utf8")));
}

function normalizeCourseLesson(lesson, moduleIndex, lessonIndex) {
  return {
    id: lesson.id || `lesson-${Date.now()}-${moduleIndex}-${lessonIndex}`,
    title: lesson.title || `Leccion ${lessonIndex + 1}`,
    type: lesson.type || "Practica",
    duration: Number(lesson.duration || 0),
    resource: lesson.resource || "",
    instructions: lesson.instructions || "",
    body: lesson.body || "",
    activity: lesson.activity || "",
    takeaway: lesson.takeaway || "",
    assetLabel: lesson.assetLabel || "",
    assetUrl: lesson.assetUrl || "",
    publicationStatus: lesson.publicationStatus || "draft",
    blocks: Array.isArray(lesson.blocks)
      ? lesson.blocks.map((block, blockIndex) => ({
          id: block.id || `block-${Date.now()}-${moduleIndex}-${lessonIndex}-${blockIndex}`,
          type: block.type || "document",
          title: block.title || `Bloque ${blockIndex + 1}`,
          content: block.content || "",
          url: block.url || "",
          questions: Array.isArray(block.questions)
            ? block.questions.map((question, questionIndex) =>
                normalizeCourseQuestion(
                  question,
                  `question-${Date.now()}-${moduleIndex}-${lessonIndex}-${blockIndex}-${questionIndex}`
                )
              )
            : [],
          required: Boolean(block.required),
          finalTest: Boolean(block.finalTest),
          ...block,
          required: Boolean(block.required),
          finalTest: Boolean(block.finalTest)
        }))
      : [],
    ...lesson,
    duration: Number(lesson.duration || 0)
  };
}

function normalizeCourseQuestion(question, fallbackId = "") {
  return {
    id: question?.id || fallbackId || `question-${Date.now()}`,
    prompt: question?.prompt || "Pregunta",
    options: Array.isArray(question?.options) ? question.options.filter(Boolean) : [],
    correctAnswer: question?.correctAnswer || "",
    explanation: question?.explanation || "",
    label: question?.label || question?.prompt || "",
    sourceModuleId: question?.sourceModuleId || "",
    sourceLessonId: question?.sourceLessonId || "",
    createdAt: question?.createdAt || "",
    updatedAt: question?.updatedAt || "",
    ...question
  };
}

function normalizeCourseModule(module, moduleIndex) {
  return {
    id: module.id || `module-${Date.now()}-${moduleIndex}`,
    title: module.title || `Modulo ${moduleIndex + 1}`,
    goal: module.goal || "",
    format: module.format || "Sesion guiada",
    deliverable: module.deliverable || "",
    lessons: Array.isArray(module.lessons)
      ? module.lessons.map((lesson, lessonIndex) => normalizeCourseLesson(lesson, moduleIndex, lessonIndex))
      : [],
    ...module
  };
}

function normalizeCourseResource(resource, resourceIndex) {
  return {
    id: resource.id || `resource-${Date.now()}-${resourceIndex}`,
    label: resource.label || `Recurso ${resourceIndex + 1}`,
    type: resource.type || "Documento",
    url: resource.url || "",
    description: resource.description || "",
    visibility: resource.visibility || "alumnado",
    ...resource
  };
}

function normalizeCourseClass(value) {
  const source = String(value || "").trim().toLowerCase();
  if (source.includes("teor") && source.includes("pract")) {
    return "teorico-practico";
  }
  if (source.includes("teor")) {
    return "teorico";
  }
  if (source.includes("pract")) {
    return "practico";
  }
  return "teorico-practico";
}

function buildModulesFromSessions(sessions) {
  return (Array.isArray(sessions) ? sessions : []).map((session, index) =>
    normalizeCourseModule(
      {
        title: session.title || `Modulo ${index + 1}`,
        goal: session.focus || "",
        format: index === 0 ? "Briefing y contexto" : index === sessions.length - 1 ? "Cierre y validacion" : "Practica guiada",
        deliverable:
          index === sessions.length - 1
            ? "Evidencia de cierre y comprobacion final"
            : "Registro de aprendizaje y puntos operativos",
        lessons: [
          {
            title: index === 0 ? "Apertura y encuadre" : "Arranque del bloque",
            type: "Briefing",
            duration: Math.max(0.5, Number(session.duration || 0) > 1 ? Math.round(Number(session.duration || 0) * 0.25 * 10) / 10 : 0.5),
            resource: "Guion del instructor",
            instructions: session.focus || "Presentar objetivos, riesgos y secuencia de trabajo.",
            body: "Introduce el contexto del bloque, el por que y el resultado esperado.",
            activity: "Alinear al grupo y dejar claro el itinerario del modulo.",
            takeaway: "El alumno sale sabiendo que va a trabajar y con que criterios.",
            assetLabel: "Guion de apertura",
            assetUrl: "",
            publicationStatus: "draft",
            blocks: [
              { type: "document", title: "Contexto del bloque", content: "Explica el contexto inicial y el objetivo del bloque.", url: "", required: true },
              { type: "checklist", title: "Puntos previos", content: "Repasar riesgos, material y roles antes de empezar.", url: "", required: true }
            ]
          },
          {
            title: session.title || `Practica ${index + 1}`,
            type: index === sessions.length - 1 ? "Evaluacion" : "Practica",
            duration: Math.max(0.5, Number(session.duration || 0) > 1 ? Math.round(Number(session.duration || 0) * 0.5 * 10) / 10 : 0.5),
            resource: "Presentacion, checklist y material operativo",
            instructions: session.focus || "Desarrollar el contenido principal del bloque.",
            body: "Desarrolla aqui la explicacion central, el caso o la maniobra del bloque.",
            activity: "Practica guiada o ejercicio principal del modulo.",
            takeaway: "Registrar que criterio demuestra el alumno al finalizar.",
            assetLabel: "Ficha principal del modulo",
            assetUrl: "",
            publicationStatus: "draft",
            blocks: [
              { type: "practice", title: "Desarrollo principal", content: "Describe aqui el ejercicio o contenido central del bloque.", url: "", required: true },
              { type: "download", title: "Ficha de apoyo", content: "Material o plantilla que acompana la actividad.", url: "", required: false }
            ]
          },
          {
            title: index === sessions.length - 1 ? "Cierre y evidencias" : "Debrief y cierre",
            type: "Checklist",
            duration: Math.max(0.3, Number(session.duration || 0) > 1 ? Math.round(Number(session.duration || 0) * 0.25 * 10) / 10 : 0.3),
            resource: "Hoja de seguimiento",
            instructions: "Recoger incidencias, aprendizajes y tareas pendientes.",
            body: "Resume hallazgos, errores, puntos fuertes y siguientes pasos.",
            activity: "Checklist final y confirmacion de evidencias.",
            takeaway: "El alumno sabe que se valida y que queda pendiente.",
            assetLabel: "Checklist de cierre",
            assetUrl: "",
            publicationStatus: "draft",
            blocks: [
              { type: "checklist", title: "Chequeo final", content: "Lista de comprobacion del cierre del bloque.", url: "", required: true },
              { type: "evaluation", title: "Criterio de validacion", content: "Criterio rapido para validar el bloque.", url: "", required: false }
            ]
          }
        ]
      },
      index
    )
  );
}

function normalizeCourse(course) {
  const sessions = Array.isArray(course.sessions) ? course.sessions : [];
  const modules = Array.isArray(course.modules) && course.modules.length
    ? course.modules.map((module, moduleIndex) => normalizeCourseModule(module, moduleIndex))
    : buildModulesFromSessions(sessions);
  const resources = Array.isArray(course.resources)
    ? course.resources.map((resource, resourceIndex) => normalizeCourseResource(resource, resourceIndex))
    : [];
  const questionBank = Array.isArray(course.questionBank)
    ? course.questionBank.map((question, questionIndex) =>
        normalizeCourseQuestion(question, `question-bank-${Date.now()}-${questionIndex}`)
      )
    : [];
  const feedbackResponses = Array.isArray(course.feedbackResponses)
    ? course.feedbackResponses.map((response, responseIndex) => ({
        id: response.id || `feedback-${Date.now()}-${responseIndex}`,
        memberId: response.memberId || "",
        submittedAt: response.submittedAt || "",
        activityScore: Math.max(1, Math.min(5, Number(response.activityScore || 0) || 0)),
        contentsScore: Math.max(1, Math.min(5, Number(response.contentsScore || 0) || 0)),
        organizationScore: Math.max(1, Math.min(5, Number(response.organizationScore || 0) || 0)),
        teacherClarityScore: Math.max(1, Math.min(5, Number(response.teacherClarityScore || 0) || 0)),
        teacherUsefulnessScore: Math.max(1, Math.min(5, Number(response.teacherUsefulnessScore || 0) || 0)),
        teacherSupportScore: Math.max(1, Math.min(5, Number(response.teacherSupportScore || 0) || 0)),
        recommendationScore: Math.max(1, Math.min(5, Number(response.recommendationScore || 0) || 0)),
        comment: response.comment || "",
        teacherComment: response.teacherComment || "",
        ...response
      }))
    : [];
  return {
    id: course.id || `course-${Date.now()}`,
    title: course.title || "",
    courseClass: normalizeCourseClass(course.courseClass || course.classType),
    type: course.type || "",
    status: course.status || "Planificacion",
    summary: course.summary || "",
    startDate: course.startDate || "",
    endDate: course.endDate || "",
    hours: Number(course.hours || 0),
    capacity: Number(course.capacity || 0),
    modality: course.modality || "Presencial",
    audience: course.audience || "Socios y voluntariado operativo",
    coordinator: course.coordinator || "",
    contentTemplate: course.contentTemplate || "operativo",
    objectives: Array.isArray(course.objectives) ? course.objectives : [],
    sessions,
    modules,
    resources,
    questionBank,
    materials: Array.isArray(course.materials) ? course.materials : [],
    evaluationCriteria: Array.isArray(course.evaluationCriteria) ? course.evaluationCriteria : [],
    contentStatus: course.contentStatus || "draft",
    certificateCity: course.certificateCity || "",
    certificateContents: Array.isArray(course.certificateContents) ? course.certificateContents : [],
    enrollmentFee: Number(course.enrollmentFee || 0),
    enrollmentPaymentInstructions: course.enrollmentPaymentInstructions || "",
    enrollmentSubmissions: Array.isArray(course.enrollmentSubmissions)
      ? course.enrollmentSubmissions.map((submission, submissionIndex) => ({
          id: submission.id || `enrollment-${Date.now()}-${submissionIndex}`,
          memberId: submission.memberId || "",
          submittedAt: submission.submittedAt || "",
          status: submission.status || "pending",
          note: submission.note || "",
          paymentProof: submission.paymentProof || null,
          amount: Number(submission.amount || 0),
          method: submission.method || "Transferencia",
          ...submission
        }))
      : [],
    feedbackEnabled: course.feedbackEnabled !== false,
    feedbackRequiredForDiploma: Boolean(course.feedbackRequiredForDiploma),
    feedbackTeachers: Array.isArray(course.feedbackTeachers)
      ? course.feedbackTeachers
      : String(course.coordinator || "")
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
    feedbackResponses,
    contentProgress: course.contentProgress || {},
    enrolledIds: Array.isArray(course.enrolledIds) ? course.enrolledIds : [],
    waitingIds: Array.isArray(course.waitingIds) ? course.waitingIds : [],
    attendance: course.attendance || {},
    evaluations: course.evaluations || {},
    diplomaTemplate: course.diplomaTemplate || "Aprovechamiento",
    diplomaReady: Array.isArray(course.diplomaReady) ? course.diplomaReady : [],
    mailsSent: Array.isArray(course.mailsSent) ? course.mailsSent : [],
    ...course,
    hours: Number(course.hours || 0),
    capacity: Number(course.capacity || 0),
    modality: course.modality || "Presencial",
    audience: course.audience || "Socios y voluntariado operativo",
    coordinator: course.coordinator || "",
    contentTemplate: course.contentTemplate || "operativo",
    objectives: Array.isArray(course.objectives) ? course.objectives : [],
    sessions,
    modules,
    resources,
    questionBank,
    materials: Array.isArray(course.materials) ? course.materials : [],
    evaluationCriteria: Array.isArray(course.evaluationCriteria) ? course.evaluationCriteria : [],
    contentStatus: course.contentStatus || "draft",
    contentProgress: course.contentProgress || {},
    enrolledIds: Array.isArray(course.enrolledIds) ? course.enrolledIds : [],
    waitingIds: Array.isArray(course.waitingIds) ? course.waitingIds : [],
    attendance: course.attendance || {},
    evaluations: course.evaluations || {},
    diplomaReady: Array.isArray(course.diplomaReady) ? course.diplomaReady : [],
    mailsSent: Array.isArray(course.mailsSent) ? course.mailsSent : []
  };
}

function normalizeState(state) {
  const nextState = { ...state };
  nextState.settings = { ...(state.settings || {}) };
  nextState.settings.automation = {
    autoGenerateDiplomas: true,
    autoPromoteWaitlist: true,
    autoAdvanceCourseStatus: true,
    autoSendDiplomas: true,
    autoSendFeeReminders: true,
    autoDetectRenewals: true,
    autoDetectFailedEmails: true,
    autoRunOnSave: true,
    ...(state.settings?.automation || {})
  };
  nextState.settings.agent = {
    enabled: true,
    canResolveInbox: true,
    canSendDiplomas: true,
    canCloseCourses: true,
    notes:
      "No modificar apto/no apto ni asistencia sin validacion humana. Puede resolver bandeja automatica y preparar trabajo.",
    ...(state.settings?.agent || {})
  };
  nextState.settings.associates = {
    defaultAnnualAmount: 50,
    nextAssociateNumber: 1,
    applicationFormNotice:
      "La solicitud queda registrada y pasa a revision administrativa antes de activar el numero de socio.",
    autoCreateCampusAccess: true,
    autoSendWelcomeEmail: true,
    autoSendApplicationReceipt: true,
    autoSendApplicationInfoRequest: true,
    autoSendApplicationDecision: true,
    autoSendApplicantReplyNotification: true,
    autoSendApplicantReplyReceipt: true,
    defaultMemberRole: "Socio",
    ...(state.settings?.associates || {})
  };
  nextState.settings.smtp = {
    host: "",
    port: 465,
    secure: true,
    startTls: false,
    username: "",
    password: "",
    fromEmail: "",
    fromName: "Isocrona Zero Campus",
    testTo: "",
    ...(state.settings?.smtp || {})
  };
  nextState.accounts = (state.accounts || []).map((account) => ({
    ...account,
    id: account.id || `account-${Date.now()}`,
    name: account.name || "",
    email: account.email || "",
    password: account.password || "cambiar123",
    role: account.role || "member",
    memberId: account.memberId || "",
    associateId: account.associateId || "",
    mustChangePassword: Boolean(account.mustChangePassword)
  }));
  nextState.members = (state.members || []).map((member) => ({
    id: member.id || `member-${Date.now()}`,
    name: member.name || "",
    role: member.role || "",
    email: member.email || "",
    certifications: member.certifications || [],
    renewalsDue: Number(member.renewalsDue || 0),
    associateId: member.associateId || "",
    source: member.source || "campus",
    ...member
  }));
  nextState.courses = (state.courses || []).map((course) => normalizeCourse(course));
  nextState.emailOutbox = (state.emailOutbox || []).map((mail) => ({
    status: "queued",
    transport: "manual",
    attemptCount: 0,
    deliveryError: "",
    deliveredAt: null,
    ...mail
  }));
  nextState.activityLog = (state.activityLog || []).map((item) => ({
    id: item.id || `activity-${Date.now()}`,
    at: item.at || new Date().toISOString(),
    actor: item.actor || "Sistema",
    type: item.type || "info",
    message: item.message || "",
    ...item
  }));
  nextState.associateApplications = (state.associateApplications || []).map((item) => ({
    id: item.id || `associate-application-${Date.now()}`,
    publicAccessToken: item.publicAccessToken || `${item.id || `associate-application-${Date.now()}`}-access`,
    submittedAt: item.submittedAt || new Date().toISOString(),
    source: item.source || "web",
    status: item.status || "Pendiente de revision",
    firstName: item.firstName || "",
    lastName: item.lastName || "",
    dni: item.dni || "",
    phone: item.phone || "",
    email: item.email || "",
    service: item.service || "",
    paymentProof: item.paymentProof || "",
    paymentProof2: item.paymentProof2 || "",
    submitterEmail: item.submitterEmail || "",
    notes: item.notes || "",
    receiptEmailStatus: item.receiptEmailStatus || "pending",
    receiptEmailSentAt: item.receiptEmailSentAt || "",
    infoRequestMessage: item.infoRequestMessage || "",
    infoRequestedAt: item.infoRequestedAt || "",
    infoRequestedBy: item.infoRequestedBy || "",
    infoRequestEmailStatus: item.infoRequestEmailStatus || "pending",
    infoRequestEmailSentAt: item.infoRequestEmailSentAt || "",
    applicantReplyNote: item.applicantReplyNote || "",
    applicantReplyAt: item.applicantReplyAt || "",
    applicantReplyDocuments: Array.isArray(item.applicantReplyDocuments) ? item.applicantReplyDocuments : [],
    applicantReplyReceiptStatus: item.applicantReplyReceiptStatus || "pending",
    applicantReplyReceiptSentAt: item.applicantReplyReceiptSentAt || "",
    applicantReplyNotificationStatus: item.applicantReplyNotificationStatus || "pending",
    applicantReplyNotificationSentAt: item.applicantReplyNotificationSentAt || "",
    reopenedAt: item.reopenedAt || "",
    reopenedBy: item.reopenedBy || "",
    reopenNote: item.reopenNote || "",
    decisionEmailStatus: item.decisionEmailStatus || "pending",
    decisionEmailSentAt: item.decisionEmailSentAt || "",
    ...item
  }));
  nextState.associatePaymentSubmissions = (state.associatePaymentSubmissions || []).map((item) => ({
    id: item.id || `associate-payment-submission-${Date.now()}`,
    associateId: item.associateId || "",
    memberId: item.memberId || "",
    submittedAt: item.submittedAt || new Date().toISOString(),
    year: String(item.year || new Date().getFullYear()),
    amount: Number(item.amount || 0),
    method: item.method || "Transferencia",
    note: item.note || "",
    proofFile: item.proofFile || "",
    status: item.status || "Pendiente de revision",
    reviewedAt: item.reviewedAt || "",
    reviewedBy: item.reviewedBy || "",
    reviewNote: item.reviewNote || "",
    notificationStatus: item.notificationStatus || "pending",
    notificationSentAt: item.notificationSentAt || "",
    ...item
  }));
  nextState.associateProfileRequests = (state.associateProfileRequests || []).map((item) => {
    const proposedData = (() => {
      if (item.proposedData && typeof item.proposedData === "object") {
        return item.proposedData;
      }
      const raw = String(item.datos_propuestos_json || "").trim();
      if (!raw) {
        return {};
      }
      try {
        const parsed = JSON.parse(raw);
        return parsed && typeof parsed === "object" ? parsed : {};
      } catch (error) {
        return {};
      }
    })();
    const statusFromEstado =
      item.estado === "aprobada"
        ? "Aprobado"
        : item.estado === "rechazada"
          ? "Rechazado"
          : item.estado === "pendiente"
            ? "Pendiente de revision"
            : "";
    const associateId = item.associateId || item.socio_id || "";
    const submittedAt = item.submittedAt || item.fecha_solicitud || new Date().toISOString();
    const reviewedAt = item.reviewedAt || item.fecha_resolucion || "";
    const reviewNote = item.reviewNote || item.comentario_admin || "";
    return {
      ...item,
      id: item.id || `associate-profile-request-${Date.now()}`,
      socio_id: associateId,
      associateId,
      memberId: item.memberId || "",
      datos_propuestos_json: item.datos_propuestos_json || JSON.stringify(proposedData),
      proposedData,
      estado: item.estado || "pendiente",
      comentario_admin: item.comentario_admin || reviewNote,
      fecha_solicitud: item.fecha_solicitud || submittedAt,
      fecha_resolucion: item.fecha_resolucion || reviewedAt,
      submittedAt,
      status: item.status || statusFromEstado || "Pendiente de revision",
      firstName: item.firstName || proposedData.firstName || "",
      lastName: item.lastName || proposedData.lastName || "",
      dni: item.dni || proposedData.dni || "",
      phone: item.phone || proposedData.phone || "",
      email: item.email || proposedData.email || "",
      service: item.service || proposedData.service || "",
      note: item.note || proposedData.note || "",
      reviewedAt,
      reviewedBy: item.reviewedBy || "",
      reviewNote,
      notificationStatus: item.notificationStatus || "pending",
      notificationSentAt: item.notificationSentAt || ""
    };
  });
  nextState.associates = (state.associates || []).map((item) => {
    const payments = (item.payments || []).map((payment) => ({
      id: payment.id || `associate-payment-${Date.now()}`,
      date: payment.date || new Date().toISOString().slice(0, 10),
      year: String(payment.year || new Date().getFullYear()),
      amount: Number(payment.amount || 0),
      method: payment.method || "Transferencia",
      note: payment.note || "",
      createdAt: payment.createdAt || new Date().toISOString(),
      createdBy: payment.createdBy || "Sistema",
      ...payment
    }));
    const manualYearlyFees = {
      "2024": 0,
      "2025": 0,
      "2026": 0,
      "2027": 0,
      ...(item.manualYearlyFees || item.yearlyFees || {})
    };
    const paymentTotals = payments.reduce((acc, payment) => {
      const year = String(payment.year || new Date(payment.date || Date.now()).getFullYear());
      acc[year] = Number(acc[year] || 0) + Number(payment.amount || 0);
      return acc;
    }, {});
    const yearlyFees = {
      "2024": Number(manualYearlyFees["2024"] || 0) + Number(paymentTotals["2024"] || 0),
      "2025": Number(manualYearlyFees["2025"] || 0) + Number(paymentTotals["2025"] || 0),
      "2026": Number(manualYearlyFees["2026"] || 0) + Number(paymentTotals["2026"] || 0),
      "2027": Number(manualYearlyFees["2027"] || 0) + Number(paymentTotals["2027"] || 0)
    };

    return {
      id: item.id || `associate-${Date.now()}`,
      associateNumber: Number(item.associateNumber || 0),
      applicationId: item.applicationId || "",
      status: item.status || "Pendiente de revision",
      firstName: item.firstName || "",
      lastName: item.lastName || "",
      dni: item.dni || "",
      phone: item.phone || "",
      email: item.email || "",
      service: item.service || "",
      joinedAt: item.joinedAt || new Date().toISOString(),
      linkedMemberId: item.linkedMemberId || "",
    linkedAccountId: item.linkedAccountId || "",
    campusAccessStatus: item.campusAccessStatus || "pending",
    temporaryPassword: item.temporaryPassword || "",
    welcomeEmailSentAt: item.welcomeEmailSentAt || "",
    welcomeEmailStatus: item.welcomeEmailStatus || "pending",
    lastQuotaReminderAt: item.lastQuotaReminderAt || "",
    lastQuotaMonth: item.lastQuotaMonth || "",
      annualAmount: Number(item.annualAmount || 0),
      observations: item.observations || "",
      manualYearlyFees,
      yearlyFees,
      payments,
      ...item,
      manualYearlyFees,
      yearlyFees,
      payments
    };
  });
  nextState.agentLog = (state.agentLog || []).map((item) => ({
    id: item.id || `agent-log-${Date.now()}`,
    at: item.at || new Date().toISOString(),
    actor: item.actor || "Agente",
    action: item.action || "",
    itemType: item.itemType || "",
    target: item.target || "",
    outcome: item.outcome || "info",
    detail: item.detail || "",
    ...item
  }));
  nextState.automationInbox = (state.automationInbox || []).map((item) => ({
    id: item.id || `automation-${Date.now()}`,
    key: item.key || `${item.type || "task"}:${item.courseId || ""}:${item.memberId || ""}:${item.emailId || ""}`,
    status: item.status || "open",
    createdAt: item.createdAt || new Date().toISOString(),
    ...item
  }));
  nextState.automationMeta = {
    lastRunAt: "",
    lastReason: "",
    lastSummary: null,
    ...(state.automationMeta || {})
  };
  nextState.selectedAssociatePaymentSubmissionId =
    nextState.selectedAssociatePaymentSubmissionId || null;
  nextState.selectedAssociateProfileRequestId =
    nextState.selectedAssociateProfileRequestId || null;
  if (!nextState.selectedAssociateApplicationId && nextState.associateApplications[0]) {
    nextState.selectedAssociateApplicationId = nextState.associateApplications[0].id;
  }
  if (!nextState.selectedAssociatePaymentSubmissionId && nextState.associatePaymentSubmissions[0]) {
    nextState.selectedAssociatePaymentSubmissionId = nextState.associatePaymentSubmissions[0].id;
  }
  if (!nextState.selectedAssociateProfileRequestId && nextState.associateProfileRequests[0]) {
    nextState.selectedAssociateProfileRequestId = nextState.associateProfileRequests[0].id;
  }
  if (!nextState.selectedAssociateId && nextState.associates[0]) {
    nextState.selectedAssociateId = nextState.associates[0].id;
  }
  return nextState;
}

function pathExists(targetPath) {
  return fs.existsSync(targetPath);
}

function pathWritable(targetPath) {
  try {
    const probePath = fs.existsSync(targetPath) ? targetPath : path.dirname(targetPath);
    fs.accessSync(probePath, fs.constants.W_OK);
    return true;
  } catch (error) {
    return false;
  }
}

function getStorageDebugInfo() {
  ensureDataDir();
  return {
    IZ_DATA_DIR: configuredDataDir,
    resolvedDataDir: dataDir,
    dataDir: {
      path: dataDir,
      exists: pathExists(dataDir),
      writable: pathWritable(dataDir)
    },
    database: {
      path: dbPath,
      exists: pathExists(dbPath),
      writable: pathWritable(dbPath)
    },
    uploads: {
      path: associateUploadsDir,
      exists: pathExists(associateUploadsDir),
      writable: pathWritable(associateUploadsDir)
    },
    state: {
      path: stateSnapshotPath,
      exists: pathExists(stateSnapshotPath),
      writable: pathWritable(stateSnapshotPath)
    },
    backups: {
      path: stateBackupDir,
      exists: pathExists(stateBackupDir),
      writable: pathWritable(stateBackupDir)
    },
    defaultState: {
      path: defaultStatePath,
      exists: pathExists(defaultStatePath),
      writable: pathWritable(defaultStatePath)
    }
  };
}

module.exports = {
  associateUploadsDir,
  dataDir,
  dbPath,
  getStorageMeta,
  getStorageDebugInfo,
  stateBackupDir,
  stateSnapshotPath,
  readState,
  resetState,
  writeState
};
