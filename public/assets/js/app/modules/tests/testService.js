function randomize(items = []) {
  const next = [...(Array.isArray(items) ? items : [])];
  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
  }
  return next;
}

function matchesFilter(question, filters = {}) {
  const normalizedPart = String(filters.part || "").trim();
  const normalizedCategory = String(filters.category || "").trim();
  const normalizedDifficulty = String(filters.difficulty || "").trim();
  if (normalizedPart && normalizedPart !== "all" && String(question.part || "").trim() !== normalizedPart) {
    return false;
  }
  if (normalizedCategory && normalizedCategory !== "all" && String(question.category || "").trim() !== normalizedCategory) {
    return false;
  }
  if (normalizedDifficulty && normalizedDifficulty !== "all" && String(question.difficulty || "").trim() !== normalizedDifficulty) {
    return false;
  }
  return true;
}

export function generateTest(
  {
    questions = [],
    numQuestions = 20,
    filters = {},
    onlyQuestionIds = [],
    title = "Zona Test",
    mode = "general"
  } = {},
  role = "member"
) {
  if (!["admin", "member"].includes(String(role || "member"))) {
    throw new Error("No tienes permiso para generar tests.");
  }

  const safeQuestions = Array.isArray(questions) ? questions : [];
  const subsetIds = new Set((Array.isArray(onlyQuestionIds) ? onlyQuestionIds : []).map((item) => String(item || "").trim()).filter(Boolean));
  let pool = safeQuestions.filter((question) => matchesFilter(question, filters));

  if (subsetIds.size) {
    pool = pool.filter((question) => subsetIds.has(String(question.id || "").trim()));
  }

  const requestedCount = Math.max(Number(numQuestions || 0), 1);
  const selectedQuestions = randomize(pool).slice(0, Math.min(requestedCount, pool.length));
  if (!selectedQuestions.length) {
    throw new Error(
      subsetIds.size
        ? "Todavia no tienes preguntas falladas disponibles con esos filtros."
        : "No hay preguntas disponibles con los filtros seleccionados."
    );
  }

  return {
    id: `test-zone-run-${Date.now()}`,
    title,
    mode,
    filters: {
      part: String(filters.part || "").trim(),
      category: String(filters.category || "").trim(),
      difficulty: String(filters.difficulty || "").trim(),
      source: subsetIds.size ? "failed" : "bank"
    },
    questions: selectedQuestions
  };
}

export function evaluateTest(testRun, answers = [], role = "member") {
  if (!["admin", "member"].includes(String(role || "member"))) {
    throw new Error("No tienes permiso para evaluar tests.");
  }

  const questions = Array.isArray(testRun?.questions) ? testRun.questions : [];
  const responses = questions.map((question, index) => {
    const selectedIndex =
      answers[index] === null || answers[index] === undefined || answers[index] === ""
        ? null
        : Number.isInteger(Number(answers[index]))
          ? Number(answers[index])
          : null;
    const isBlank = selectedIndex === null;
    const isCorrect = !isBlank && selectedIndex === Number(question.correctIndex);
    return {
      questionId: question.id,
      prompt: question.prompt,
      part: question.part,
      category: question.category,
      difficulty: question.difficulty,
      selectedIndex,
      correctIndex: Number(question.correctIndex),
      isCorrect,
      isBlank
    };
  });

  const correctCount = responses.filter((response) => response.isCorrect).length;
  const blankCount = responses.filter((response) => response.isBlank).length;
  const wrongCount = Math.max(responses.length - correctCount - blankCount, 0);
  const answeredCount = responses.length - blankCount;
  const total = responses.length;
  const score = correctCount;
  const percentage = total ? Math.round((score / total) * 1000) / 10 : 0;

  return {
    title: String(testRun?.title || "Zona Test").trim(),
    mode: String(testRun?.mode || "general").trim(),
    filters: testRun?.filters || {},
    questionIds: questions.map((question) => question.id),
    responses,
    correctCount,
    wrongCount,
    blankCount,
    answeredCount,
    score,
    total,
    percentage
  };
}

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
    throw new Error(payload?.error || "No se pudo completar la operacion del test");
  }
  return payload;
}

export async function saveTestResult(result) {
  const payload = await fetchJson("/api/test-zone/results", {
    method: "POST",
    body: JSON.stringify({
      title: result?.title || "Zona Test",
      mode: result?.mode || "general",
      filters: result?.filters || {},
      questionIds: result?.questionIds || [],
      answers: (Array.isArray(result?.responses) ? result.responses : []).map((response) =>
        response.isBlank ? null : response.selectedIndex ?? null
      )
    })
  });
  return payload.result;
}

export default {
  generateTest,
  evaluateTest,
  saveTestResult
};
