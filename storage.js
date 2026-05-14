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

function normalizeIndependentTestModule(module, moduleIndex) {
  return {
    ...module,
    id: module?.id || `test-module-${Date.now()}-${moduleIndex}`,
    title: String(module?.title || "").trim(),
    description: String(module?.description || "").trim(),
    createdAt: module?.createdAt || new Date().toISOString()
  };
}

function normalizeIndependentTest(test, testIndex) {
  const parsedTimeLimitSeconds = Number(test?.timeLimitSeconds);
  const parsedQuestionsPerAttempt = Number(test?.questionsPerAttempt);
  const parsedWrongPenaltyNumerator = Number(test?.wrongPenaltyNumerator);
  const parsedWrongPenaltyDenominator = Number(test?.wrongPenaltyDenominator);
  return {
    ...test,
    id: test?.id || `test-${Date.now()}-${testIndex}`,
    moduleId: String(test?.moduleId || "").trim(),
    title: String(test?.title || "").trim(),
    description: String(test?.description || "").trim(),
    questionIds: Array.isArray(test?.questionIds) ? test.questionIds.map((item) => String(item || "").trim()).filter(Boolean) : [],
    published: Boolean(test?.published),
    timeLimitSeconds:
      Number.isFinite(parsedTimeLimitSeconds) && parsedTimeLimitSeconds > 0
        ? Math.floor(parsedTimeLimitSeconds)
        : null,
    questionsPerAttempt:
      Number.isInteger(parsedQuestionsPerAttempt) && parsedQuestionsPerAttempt > 0
        ? parsedQuestionsPerAttempt
        : null,
    shuffleQuestions: Boolean(test?.shuffleQuestions),
    shuffleOptions: Boolean(test?.shuffleOptions),
    negativeMarkingEnabled: Boolean(test?.negativeMarkingEnabled),
    wrongPenaltyNumerator:
      Number.isFinite(parsedWrongPenaltyNumerator) && parsedWrongPenaltyNumerator >= 0 ? parsedWrongPenaltyNumerator : 1,
    wrongPenaltyDenominator:
      Number.isFinite(parsedWrongPenaltyDenominator) && parsedWrongPenaltyDenominator > 0 ? parsedWrongPenaltyDenominator : 3,
    createdAt: test?.createdAt || new Date().toISOString()
  };
}

function normalizeIndependentQuestion(question, questionIndex) {
  const options = Array.isArray(question?.options)
    ? question.options.map((item) => String(item || "").trim())
    : [];
  return {
    ...question,
    id: question?.id || `question-bank-${Date.now()}-${questionIndex}`,
    moduleId: String(question?.moduleId || "").trim(),
    prompt: String(question?.prompt || question?.question || question?.enunciado || "").trim(),
    options,
    correctIndex: Number.isInteger(Number(question?.correctIndex ?? question?.correctAnswer ?? question?.respuestaCorrecta))
      ? Number(question?.correctIndex ?? question?.correctAnswer ?? question?.respuestaCorrecta)
      : 0,
    explanation: String(question?.explanation || "").trim(),
    topic: String(question?.topic || "").trim(),
    difficulty: String(question?.difficulty || "").trim(),
    createdAt: question?.createdAt || new Date().toISOString()
  };
}

function normalizeIndependentTestAttempt(attempt, attemptIndex) {
  const parsedDurationMs = Number(attempt?.durationMs);
  const parsedCorrectCount = Number(attempt?.correctCount);
  const parsedWrongCount = Number(attempt?.wrongCount);
  const parsedBlankCount = Number(attempt?.blankCount);
  const parsedRawScore = Number(attempt?.rawScore);
  const parsedPenalty = Number(attempt?.penalty);
  const parsedNetScore = Number(attempt?.netScore);
  const parsedPercentage = Number(attempt?.percentage);
  return {
    ...attempt,
    id: attempt?.id || `test-attempt-${Date.now()}-${attemptIndex}`,
    testId: String(attempt?.testId || "").trim(),
    memberId: String(attempt?.memberId || "").trim(),
    questionIds: Array.isArray(attempt?.questionIds) ? attempt.questionIds.map((value) => String(value || "").trim()).filter(Boolean) : [],
    answers: Array.isArray(attempt?.answers) ? attempt.answers.map((value) => Number(value)) : [],
    score: Number(attempt?.score || 0),
    total: Number(attempt?.total || 0),
    correctCount: Number.isFinite(parsedCorrectCount) && parsedCorrectCount >= 0 ? parsedCorrectCount : 0,
    wrongCount: Number.isFinite(parsedWrongCount) && parsedWrongCount >= 0 ? parsedWrongCount : 0,
    blankCount: Number.isFinite(parsedBlankCount) && parsedBlankCount >= 0 ? parsedBlankCount : 0,
    rawScore: Number.isFinite(parsedRawScore) && parsedRawScore >= 0 ? parsedRawScore : Number(attempt?.score || 0),
    penalty: Number.isFinite(parsedPenalty) && parsedPenalty >= 0 ? parsedPenalty : 0,
    netScore: Number.isFinite(parsedNetScore) && parsedNetScore >= 0 ? parsedNetScore : Number(attempt?.score || 0),
    percentage: Number.isFinite(parsedPercentage) && parsedPercentage >= 0 ? parsedPercentage : 0,
    durationMs: Number.isFinite(parsedDurationMs) && parsedDurationMs >= 0 ? Math.floor(parsedDurationMs) : null,
    timedOut: Boolean(attempt?.timedOut),
    createdAt: attempt?.createdAt || new Date().toISOString()
  };
}

function normalizePracticeTest(practiceTest, practiceTestIndex) {
  const parsedWrongPenaltyNumerator = Number(practiceTest?.wrongPenaltyNumerator);
  const parsedWrongPenaltyDenominator = Number(practiceTest?.wrongPenaltyDenominator);
  return {
    ...practiceTest,
    id: practiceTest?.id || `practice-test-${Date.now()}-${practiceTestIndex}`,
    memberId: String(practiceTest?.memberId || "").trim(),
    moduleId: String(practiceTest?.moduleId || "").trim(),
    title: String(practiceTest?.title || "").trim(),
    topic: String(practiceTest?.topic || "").trim(),
    difficulty: String(practiceTest?.difficulty || "").trim(),
    questionIds: Array.isArray(practiceTest?.questionIds)
      ? practiceTest.questionIds.map((value) => String(value || "").trim()).filter(Boolean)
      : [],
    negativeMarkingEnabled: Boolean(practiceTest?.negativeMarkingEnabled),
    wrongPenaltyNumerator:
      Number.isFinite(parsedWrongPenaltyNumerator) && parsedWrongPenaltyNumerator >= 0 ? parsedWrongPenaltyNumerator : 1,
    wrongPenaltyDenominator:
      Number.isFinite(parsedWrongPenaltyDenominator) && parsedWrongPenaltyDenominator > 0 ? parsedWrongPenaltyDenominator : 3,
    createdAt: practiceTest?.createdAt || new Date().toISOString(),
    expiresAt: practiceTest?.expiresAt || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
  };
}

function normalizePracticeAttempt(attempt, attemptIndex) {
  const parsedCorrectCount = Number(attempt?.correctCount);
  const parsedWrongCount = Number(attempt?.wrongCount);
  const parsedBlankCount = Number(attempt?.blankCount);
  const parsedRawScore = Number(attempt?.rawScore);
  const parsedPenalty = Number(attempt?.penalty);
  const parsedNetScore = Number(attempt?.netScore);
  const parsedPercentage = Number(attempt?.percentage);
  return {
    ...attempt,
    id: attempt?.id || `practice-attempt-${Date.now()}-${attemptIndex}`,
    practiceTestId: String(attempt?.practiceTestId || "").trim(),
    memberId: String(attempt?.memberId || "").trim(),
    questionIds: Array.isArray(attempt?.questionIds) ? attempt.questionIds.map((value) => String(value || "").trim()).filter(Boolean) : [],
    answers: Array.isArray(attempt?.answers) ? attempt.answers.map((value) => Number(value)) : [],
    score: Number(attempt?.score || 0),
    total: Number(attempt?.total || 0),
    correctCount: Number.isFinite(parsedCorrectCount) && parsedCorrectCount >= 0 ? parsedCorrectCount : 0,
    wrongCount: Number.isFinite(parsedWrongCount) && parsedWrongCount >= 0 ? parsedWrongCount : 0,
    blankCount: Number.isFinite(parsedBlankCount) && parsedBlankCount >= 0 ? parsedBlankCount : 0,
    rawScore: Number.isFinite(parsedRawScore) && parsedRawScore >= 0 ? parsedRawScore : Number(attempt?.score || 0),
    penalty: Number.isFinite(parsedPenalty) && parsedPenalty >= 0 ? parsedPenalty : 0,
    netScore: Number.isFinite(parsedNetScore) && parsedNetScore >= 0 ? parsedNetScore : Number(attempt?.score || 0),
    percentage: Number.isFinite(parsedPercentage) && parsedPercentage >= 0 ? parsedPercentage : 0,
    createdAt: attempt?.createdAt || new Date().toISOString()
  };
}

function normalizeTestZoneComparableText(value) {
  return String(value || "")
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function normalizeStoredTestZonePart(value) {
  const rawValue = String(value || "").trim();
  const normalized = normalizeTestZoneComparableText(rawValue);
  if (!rawValue) {
    return "";
  }
  if (normalized === "ivaspe") {
    return "IVASPE";
  }
  if (normalized.includes("espec")) {
    return "Parte específica";
  }
  if (normalized.includes("comun")) {
    return "Parte común";
  }
  return rawValue;
}

function normalizeStoredTestZoneDifficulty(value) {
  const rawValue = String(value || "").trim();
  const normalized = normalizeTestZoneComparableText(rawValue);
  if (!rawValue) {
    return "media";
  }
  if (["facil", "easy", "baja"].includes(normalized)) {
    return "facil";
  }
  if (["media", "medium"].includes(normalized)) {
    return "media";
  }
  if (["dificil", "hard", "alta"].includes(normalized)) {
    return "dificil";
  }
  return rawValue;
}

function normalizeTestZoneQuestion(question, questionIndex) {
  const options = Array.isArray(question?.options)
    ? question.options.map((item) => String(item || "").trim()).filter(Boolean)
    : [];
  return {
    ...question,
    id: question?.id || `test-zone-question-${Date.now()}-${questionIndex}`,
    prompt: String(question?.prompt || question?.question || "").trim(),
    options,
    correctIndex:
      Number.isInteger(Number(question?.correctIndex)) && Number(question.correctIndex) >= 0
        ? Number(question.correctIndex)
        : Number.isInteger(Number(question?.correctAnswer)) && Number(question.correctAnswer) >= 0
          ? Number(question.correctAnswer)
          : 0,
    part: normalizeStoredTestZonePart(question?.part),
    category: String(question?.category || "").trim(),
    difficulty: normalizeStoredTestZoneDifficulty(question?.difficulty),
    explanation: String(question?.explanation || "").trim(),
    temaNumero: String(question?.temaNumero || "").trim(),
    temaTitulo: String(question?.temaTitulo || "").trim(),
    moduleTitle: String(question?.moduleTitle || "IVASPE").trim() || "IVASPE",
    createdAt: question?.createdAt || new Date().toISOString(),
    createdBy: String(question?.createdBy || "").trim()
  };
}

function normalizeTestZoneResult(result, resultIndex) {
  const responses = Array.isArray(result?.responses)
    ? result.responses.map((response) => ({
        questionId: String(response?.questionId || "").trim(),
        selectedIndex:
          response?.selectedIndex === null || response?.selectedIndex === undefined
            ? null
            : Number.isFinite(Number(response.selectedIndex))
              ? Number(response.selectedIndex)
              : null,
        correctIndex:
          Number.isFinite(Number(response?.correctIndex)) && Number(response.correctIndex) >= 0
            ? Number(response.correctIndex)
            : 0,
        isCorrect: Boolean(response?.isCorrect),
        isBlank: Boolean(response?.isBlank),
        part: String(response?.part || "").trim(),
        category: String(response?.category || "").trim(),
        difficulty: String(response?.difficulty || "").trim(),
        prompt: String(response?.prompt || "").trim(),
        selectedAnswer: String(response?.selectedAnswer || "").trim(),
        correctAnswer: String(response?.correctAnswer || "").trim(),
        explanation: String(response?.explanation || "").trim(),
        topic: String(response?.topic || "").trim(),
        temaNumero: String(response?.temaNumero || "").trim(),
        temaTitulo: String(response?.temaTitulo || "").trim(),
        moduleTitle: String(response?.moduleTitle || "").trim()
      }))
    : [];
  return {
    ...result,
    id: result?.id || `test-zone-result-${Date.now()}-${resultIndex}`,
    accountId: String(result?.accountId || "").trim(),
    memberId: String(result?.memberId || "").trim(),
    guestName: String(result?.guestName || "").trim(),
    liveSessionId: String(result?.liveSessionId || "").trim(),
    liveCode: String(result?.liveCode || "").trim(),
    title: String(result?.title || "").trim(),
    mode: String(result?.mode || "general").trim(),
    source: String(result?.source || result?.filters?.source || "").trim(),
    questionIds: Array.isArray(result?.questionIds)
      ? result.questionIds.map((item) => String(item || "").trim()).filter(Boolean)
      : [],
    responses,
    correctCount: Number(result?.correctCount || 0),
    wrongCount: Number(result?.wrongCount || 0),
    blankCount: Number(result?.blankCount || 0),
    answeredCount: Number(result?.answeredCount || 0),
    total: Number(result?.total || 0),
    score: Number(result?.score || result?.correctCount || 0),
    percentage: Number(result?.percentage || 0),
    incorrectQuestionIds: Array.isArray(result?.incorrectQuestionIds)
      ? result.incorrectQuestionIds.map((item) => String(item || "").trim()).filter(Boolean)
      : [],
    filters:
      result?.filters && typeof result.filters === "object"
        ? {
            part: String(result.filters.part || "").trim(),
            category: String(result.filters.category || "").trim(),
            difficulty: String(result.filters.difficulty || "").trim(),
            source: String(result.filters.source || "").trim()
          }
        : { part: "", category: "", difficulty: "", source: "" },
    createdAt: result?.createdAt || new Date().toISOString()
  };
}

function normalizeTestZoneReviewMark(mark, markIndex) {
  const now = new Date().toISOString();
  const accountId = String(mark?.accountId || mark?.userId || "").trim();
  const rawStatus = String(mark?.status || "").trim();
  const rawSource = String(mark?.source || "").trim();
  const status = rawStatus || (rawSource === "manual" ? "review" : "reviewed");
  const source = rawSource || (status === "review" ? "manual" : "failed");
  const createdAt = mark?.createdAt || mark?.reviewedAt || now;
  const updatedAt = mark?.updatedAt || mark?.reviewedAt || createdAt;
  const shouldKeepReviewedAt = Boolean(mark?.reviewedAt) || status !== "review" || source !== "manual";
  return {
    ...mark,
    id: mark?.id || `test-zone-review-${Date.now()}-${markIndex}`,
    accountId,
    userId: accountId,
    memberId: String(mark?.memberId || "").trim(),
    questionId: String(mark?.questionId || "").trim(),
    status,
    source,
    createdAt,
    updatedAt,
    reviewedAt: shouldKeepReviewedAt ? mark?.reviewedAt || createdAt : "",
    reviewedResultId: String(mark?.reviewedResultId || "").trim(),
    reviewedFailureAt: shouldKeepReviewedAt ? mark?.reviewedFailureAt || mark?.reviewedAt || createdAt : ""
  };
}

function normalizeTestZoneLiveSession(session, sessionIndex) {
  const createdAt = session?.createdAt || new Date().toISOString();
  return {
    ...session,
    id: session?.id || `test-zone-live-${Date.now()}-${sessionIndex}`,
    code: String(session?.code || "").trim(),
    title: String(session?.title || "").trim(),
    questionIds: Array.isArray(session?.questionIds)
      ? session.questionIds.map((item) => String(item || "").trim()).filter(Boolean)
      : [],
    status: ["active", "closed", "expired"].includes(String(session?.status || "").trim())
      ? String(session.status).trim()
      : "active",
    questionCount: Number(session?.questionCount || 0),
    createdByAccountId: String(session?.createdByAccountId || "").trim(),
    createdByMemberId: String(session?.createdByMemberId || "").trim(),
    filters:
      session?.filters && typeof session.filters === "object"
        ? {
            part: String(session.filters.part || "").trim(),
            category: String(session.filters.category || "").trim(),
            difficulty: String(session.filters.difficulty || "").trim()
          }
        : { part: "", category: "", difficulty: "" },
    createdAt,
    expiresAt: session?.expiresAt || new Date(Date.parse(createdAt) + 24 * 60 * 60 * 1000).toISOString(),
    closedAt: session?.closedAt || ""
  };
}

function normalizeNormalTestResult(result, resultIndex) {
  const questionIds = Array.isArray(result?.questionIds)
    ? result.questionIds.map((item) => String(item || "").trim()).filter(Boolean)
    : [];
  const correctCount = Number(result?.correctCount ?? result?.score ?? 0);
  const total = Number(result?.total || questionIds.length || 0);
  const scorePercent = Number(result?.scorePercent ?? result?.percentage ?? (total ? (correctCount / total) * 100 : 0));
  return {
    ...result,
    id: result?.id || `test-result-${Date.now()}-${resultIndex}`,
    resultType: "normal",
    userId: String(result?.userId || "").trim(),
    memberId: String(result?.memberId || "").trim(),
    questionIds,
    answers: Array.isArray(result?.answers) ? result.answers : [],
    correctCount,
    wrongCount: Number(result?.wrongCount || 0),
    blankCount: Number(result?.blankCount || 0),
    score: correctCount,
    total,
    percentage: scorePercent,
    scorePercent,
    duration: Number(result?.duration || 0),
    selectedConfig: result?.selectedConfig && typeof result.selectedConfig === "object" ? result.selectedConfig : {},
    createdAt: result?.createdAt || new Date().toISOString()
  };
}

function normalizePublicLiveTestSession(session, sessionIndex) {
  return {
    ...session,
    id: session?.id || `live-test-public-session-${Date.now()}-${sessionIndex}`,
    code: String(session?.code || "").trim().toUpperCase(),
    title: String(session?.title || "Sesion en vivo Isocrona Zero").trim(),
    questionIds: Array.isArray(session?.questionIds)
      ? session.questionIds.map((item) => String(item || "").trim()).filter(Boolean)
      : [],
    status: ["draft", "active", "finished"].includes(String(session?.status || "").trim())
      ? String(session.status).trim()
      : "draft",
    createdBy: String(session?.createdBy || "").trim(),
    createdAt: session?.createdAt || new Date().toISOString()
  };
}

function normalizeLiveTestParticipantResult(result, resultIndex) {
  return {
    ...result,
    id: result?.id || `live-test-public-result-${Date.now()}-${resultIndex}`,
    sessionId: String(result?.sessionId || "").trim(),
    participantName: String(result?.participantName || "").trim(),
    answers: Array.isArray(result?.answers) ? result.answers : [],
    correctCount: Number(result?.correctCount || 0),
    wrongCount: Number(result?.wrongCount || 0),
    blankCount: Number(result?.blankCount || 0),
    scorePercent: Number(result?.scorePercent || 0),
    submittedAt: result?.submittedAt || new Date().toISOString()
  };
}

function normalizeMemberNotification(notification, notificationIndex) {
  const normalizedTargetType = String(notification?.targetType || "").trim() === "member" ? "member" : "all";
  const normalizedPriority = String(notification?.priority || "").trim() === "important" ? "important" : "normal";
  return {
    ...notification,
    id: notification?.id || `member-notification-${Date.now()}-${notificationIndex}`,
    title: String(notification?.title || "").trim(),
    body: String(notification?.body || "").trim(),
    targetType: normalizedTargetType,
    memberId: normalizedTargetType === "member" ? String(notification?.memberId || "").trim() : "",
    priority: normalizedPriority,
    createdByMemberId: String(notification?.createdByMemberId || "").trim(),
    createdAt: notification?.createdAt || new Date().toISOString(),
    readByMemberIds: Array.isArray(notification?.readByMemberIds)
      ? [...new Set(notification.readByMemberIds.map((value) => String(value || "").trim()).filter(Boolean))]
      : []
  };
}

function normalizeLiveTestSession(session, sessionIndex) {
  const parsedQuestionIndex = Number(session?.currentQuestionIndex);
  const parsedQuestionTimeLimitSeconds = Number(session?.questionTimeLimitSeconds);
  const normalizedStatus = ["lobby", "running", "finished"].includes(String(session?.status || "").trim())
    ? String(session.status).trim()
    : "lobby";
  const normalizedStartedAt = session?.startedAt || "";
  const normalizedQuestionStartedAt = session?.questionStartedAt || (normalizedStatus === "running" ? normalizedStartedAt : "");
  return {
    ...session,
    id: session?.id || `live-test-session-${Date.now()}-${sessionIndex}`,
    testId: String(session?.testId || "").trim(),
    pin: String(session?.pin || "").trim(),
    hostMemberId: String(session?.hostMemberId || "").trim(),
    status: normalizedStatus,
    currentQuestionIndex: Number.isInteger(parsedQuestionIndex) ? parsedQuestionIndex : -1,
    questionStartedAt: normalizedQuestionStartedAt,
    questionTimeLimitSeconds:
      Number.isFinite(parsedQuestionTimeLimitSeconds) && parsedQuestionTimeLimitSeconds >= 5 && parsedQuestionTimeLimitSeconds <= 120
        ? Math.floor(parsedQuestionTimeLimitSeconds)
        : 20,
    createdAt: session?.createdAt || new Date().toISOString(),
    startedAt: normalizedStartedAt,
    finishedAt: session?.finishedAt || ""
  };
}

function normalizeLiveTestPlayer(player, playerIndex) {
  return {
    ...player,
    id: player?.id || `live-test-player-${Date.now()}-${playerIndex}`,
    sessionId: String(player?.sessionId || "").trim(),
    memberId: String(player?.memberId || "").trim(),
    displayName: String(player?.displayName || "").trim(),
    score: Number(player?.score || 0),
    joinedAt: player?.joinedAt || new Date().toISOString(),
    lastSeenAt: player?.lastSeenAt || player?.joinedAt || new Date().toISOString()
  };
}

function normalizeLiveTestAnswer(answer, answerIndex) {
  const parsedSelectedIndex = Number(answer?.selectedIndex);
  const parsedResponseTimeMs = Number(answer?.responseTimeMs);
  const parsedPointsAwarded = Number(answer?.pointsAwarded);
  return {
    ...answer,
    id: answer?.id || `live-test-answer-${Date.now()}-${answerIndex}`,
    sessionId: String(answer?.sessionId || "").trim(),
    playerId: String(answer?.playerId || "").trim(),
    questionId: String(answer?.questionId || "").trim(),
    selectedIndex: Number.isInteger(parsedSelectedIndex) ? parsedSelectedIndex : 0,
    isCorrect: Boolean(answer?.isCorrect),
    isLate: Boolean(answer?.isLate),
    pointsAwarded: Number.isFinite(parsedPointsAwarded) && parsedPointsAwarded >= 0 ? Math.floor(parsedPointsAwarded) : 0,
    responseTimeMs: Number.isFinite(parsedResponseTimeMs) && parsedResponseTimeMs >= 0 ? Math.floor(parsedResponseTimeMs) : 0,
    submittedAt: answer?.submittedAt || new Date().toISOString()
  };
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
  const feedbackReminderLog =
    course.feedbackReminderLog && typeof course.feedbackReminderLog === "object"
      ? Object.fromEntries(
          Object.entries(course.feedbackReminderLog)
            .map(([memberId, sentAt]) => [String(memberId || "").trim(), String(sentAt || "").trim()])
            .filter(([memberId, sentAt]) => memberId && sentAt)
        )
      : {};
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
    feedbackReminderLog,
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
    autoSendFeedbackReminders: true,
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
  nextState.testModules = (state.testModules || []).map((module, index) =>
    normalizeIndependentTestModule(module, index)
  );
  nextState.tests = (state.tests || []).map((test, index) =>
    normalizeIndependentTest(test, index)
  );
  nextState.questions = (state.questions || []).map((question, index) =>
    normalizeIndependentQuestion(question, index)
  );
  nextState.testAttempts = (state.testAttempts || []).map((attempt, index) =>
    normalizeIndependentTestAttempt(attempt, index)
  );
  nextState.testResults = (state.testResults || []).map((result, index) =>
    normalizeNormalTestResult(result, index)
  );
  nextState.practiceTests = (state.practiceTests || []).map((practiceTest, index) =>
    normalizePracticeTest(practiceTest, index)
  );
  nextState.practiceAttempts = (state.practiceAttempts || []).map((attempt, index) =>
    normalizePracticeAttempt(attempt, index)
  );
  nextState.testZoneQuestions = (state.testZoneQuestions || []).map((question, index) =>
    normalizeTestZoneQuestion(question, index)
  );
  nextState.testZoneResults = (state.testZoneResults || []).map((result, index) =>
    normalizeTestZoneResult(result, index)
  );
  nextState.testZoneReviewMarks = (state.testZoneReviewMarks || []).map((mark, index) =>
    normalizeTestZoneReviewMark(mark, index)
  );
  nextState.testZoneLiveSessions = (state.testZoneLiveSessions || []).map((session, index) =>
    normalizeTestZoneLiveSession(session, index)
  );
  nextState.memberNotifications = (state.memberNotifications || []).map((notification, index) =>
    normalizeMemberNotification(notification, index)
  );
  nextState.liveTestSessions = (state.liveTestSessions || []).map((session, index) =>
    normalizeLiveTestSession(session, index)
  );
  nextState.liveTestPlayers = (state.liveTestPlayers || []).map((player, index) =>
    normalizeLiveTestPlayer(player, index)
  );
  nextState.liveTestAnswers = (state.liveTestAnswers || []).map((answer, index) =>
    normalizeLiveTestAnswer(answer, index)
  );
  nextState.liveTestPublicSessions = (state.liveTestPublicSessions || []).map((session, index) =>
    normalizePublicLiveTestSession(session, index)
  );
  nextState.liveTestParticipantResults = (state.liveTestParticipantResults || []).map((result, index) =>
    normalizeLiveTestParticipantResult(result, index)
  );
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
