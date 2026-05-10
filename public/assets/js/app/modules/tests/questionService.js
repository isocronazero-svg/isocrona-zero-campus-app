import { getQuestions, setQuestions, setResults, setLiveSessions } from "./testStore.js";

async function fetchJson(url, options = {}) {
  const response = await fetch(url, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    },
    ...options
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload?.ok === false) {
    throw new Error(payload?.error || "No se pudo completar la operacion de tests");
  }
  return payload;
}

export function createQuestion({
  prompt,
  options = [],
  correctIndex,
  part = "Parte común",
  category = "Legislación",
  difficulty = "media",
  explanation = ""
}) {
  const normalizedPrompt = String(prompt || "").trim();
  const normalizedOptions = Array.isArray(options)
    ? options.map((option) => String(option || "").trim()).filter(Boolean)
    : [];
  const normalizedCorrectIndex = Number(correctIndex);

  if (!normalizedPrompt) {
    throw new Error("La pregunta necesita un enunciado.");
  }
  if (normalizedOptions.length < 2) {
    throw new Error("La pregunta necesita al menos dos opciones.");
  }
  if (
    !Number.isInteger(normalizedCorrectIndex) ||
    normalizedCorrectIndex < 0 ||
    normalizedCorrectIndex >= normalizedOptions.length
  ) {
    throw new Error("La respuesta correcta no es valida.");
  }

  return {
    prompt: normalizedPrompt,
    options: normalizedOptions,
    correctIndex: normalizedCorrectIndex,
    part: String(part || "Parte común").trim() || "Parte común",
    category: String(category || "Legislación").trim() || "Legislación",
    difficulty: String(difficulty || "media").trim() || "media",
    explanation: String(explanation || "").trim()
  };
}

export async function loadQuestions() {
  return getQuestions();
}

export async function loadSharedQuestions() {
  const payload = await fetchJson("/api/test-zone/questions", { method: "GET" });
  setQuestions(payload.questions || []);
  return getQuestions();
}

export async function loadTestHistory() {
  const payload = await fetchJson("/api/test-zone/results/me", { method: "GET" });
  setResults(
    payload.results || [],
    payload.stats || null,
    payload.failedQuestionIds || [],
    payload.reviewedQuestionIds || []
  );
  return payload;
}

export async function loadLiveSessions() {
  const payload = await fetchJson("/api/test-zone/live-sessions", { method: "GET" });
  setLiveSessions(payload.sessions || []);
  return payload.sessions || [];
}

export async function saveQuestion(question) {
  const payload = await fetchJson("/api/test-zone/questions", {
    method: "POST",
    body: JSON.stringify(question)
  });
  await loadSharedQuestions();
  return payload.question;
}

export async function markQuestionReviewed(questionId) {
  await fetchJson(`/api/test-zone/questions/${encodeURIComponent(String(questionId || ""))}/review`, {
    method: "POST"
  });
  return loadTestHistory();
}

export async function createLiveSession(payload) {
  const response = await fetchJson("/api/test-zone/live-sessions", {
    method: "POST",
    body: JSON.stringify(payload)
  });
  return response.session;
}

export function getStoredQuestions() {
  return getQuestions();
}

export function getQuestionFilters(questions = []) {
  const safeQuestions = Array.isArray(questions) ? questions : [];
  return {
    parts: [...new Set(safeQuestions.map((question) => String(question.part || "").trim()).filter(Boolean))],
    categories: [...new Set(safeQuestions.map((question) => String(question.category || "").trim()).filter(Boolean))],
    difficulties: [...new Set(safeQuestions.map((question) => String(question.difficulty || "").trim()).filter(Boolean))]
  };
}
