import { canPerformTestAction } from "../../router/viewPermissions.js";
import { getQuestions } from "./testStore.js";
import { normalizeQuestionPayload } from "./questionService.js";

const PART_LABELS = Object.freeze({
  comun: "Parte comun",
  especifica: "Parte especifica"
});

const CATEGORY_LABELS = Object.freeze({
  legislacion: "Legislacion",
  bomberos: "Bomberos"
});

export function createTestService() {
  return {};
}

function normalizeText(value, fallback = "") {
  return String(value ?? fallback ?? "").trim();
}

function normalizeTopicKeyPart(value, fallback = "sin-definir") {
  return normalizeText(value || fallback)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || fallback;
}

function getPartLabel(part) {
  const normalizedPart = normalizeTopicKeyPart(part, "especifica");
  return PART_LABELS[normalizedPart] || normalizeText(part || "Parte especifica");
}

function getCategoryLabel(category) {
  const normalizedCategory = normalizeTopicKeyPart(category, "bomberos");
  return CATEGORY_LABELS[normalizedCategory] || normalizeText(category || "Bomberos");
}

function getModuleTitle(question, moduleMap) {
  return (
    normalizeText(question.moduleTitle) ||
    normalizeText(moduleMap.get(question.moduleId)?.title) ||
    normalizeText(question.manual) ||
    normalizeText(question.modulo) ||
    normalizeText(question.block) ||
    ""
  );
}

function getTopicTitle(question, moduleMap) {
  return (
    normalizeText(question.temaTitulo) ||
    normalizeText(question.topic) ||
    normalizeText(question.title) ||
    getModuleTitle(question, moduleMap) ||
    "Sin clasificar"
  );
}

function buildTopicKey(question, moduleMap) {
  return [
    normalizeTopicKeyPart(question.part, "especifica"),
    normalizeTopicKeyPart(question.category, "bomberos"),
    normalizeTopicKeyPart(getModuleTitle(question, moduleMap), "general"),
    normalizeTopicKeyPart(question.temaNumero || "0", "0"),
    normalizeTopicKeyPart(getTopicTitle(question, moduleMap), "sin-clasificar")
  ].join("|");
}

function buildTopicLabel(question, moduleMap) {
  const topicTitle = getTopicTitle(question, moduleMap);
  const topicNumber = normalizeText(question.temaNumero);
  if (topicNumber) {
    return `Tema ${topicNumber} - ${topicTitle}`;
  }
  return topicTitle;
}

function compareByText(left, right) {
  return String(left || "").localeCompare(String(right || ""), "es", {
    numeric: true,
    sensitivity: "base"
  });
}

export function normalizeQuestionForTest(question) {
  return normalizeQuestionPayload(question);
}

export function buildQuestionTopicGroups(questions = [], modules = []) {
  const moduleMap = new Map((Array.isArray(modules) ? modules : []).map((module) => [module.id, module]));
  const blockMap = new Map();

  for (const rawQuestion of Array.isArray(questions) ? questions : []) {
    const question = normalizeQuestionForTest(rawQuestion);
    if (!question.active || !question.prompt || question.options.length < 2) {
      continue;
    }

    const part = normalizeTopicKeyPart(question.part, "especifica");
    const category = normalizeTopicKeyPart(question.category, "bomberos");
    const blockKey = `${part}|${category}|${normalizeTopicKeyPart(getModuleTitle(question, moduleMap), "general")}`;
    const topicKey = buildTopicKey(question, moduleMap);
    const moduleTitle = getModuleTitle(question, moduleMap);

    if (!blockMap.has(blockKey)) {
      blockMap.set(blockKey, {
        key: blockKey,
        part,
        category,
        label: `${getPartLabel(part)} · ${getCategoryLabel(category)}`,
        moduleTitle,
        topics: new Map(),
        count: 0
      });
    }

    const block = blockMap.get(blockKey);
    block.count += 1;

    if (!block.topics.has(topicKey)) {
      block.topics.set(topicKey, {
        key: topicKey,
        label: buildTopicLabel(question, moduleMap),
        moduleTitle,
        topicNumber: normalizeText(question.temaNumero),
        count: 0,
        questionIds: []
      });
    }

    const topic = block.topics.get(topicKey);
    topic.count += 1;
    topic.questionIds.push(question.id);
  }

  return Array.from(blockMap.values())
    .map((block) => ({
      ...block,
      topics: Array.from(block.topics.values()).sort((left, right) => {
        const numberDiff = compareByText(left.topicNumber, right.topicNumber);
        return numberDiff || compareByText(left.label, right.label);
      })
    }))
    .sort((left, right) => {
      const partDiff = compareByText(left.part, right.part);
      const categoryDiff = compareByText(left.category, right.category);
      return partDiff || categoryDiff || compareByText(left.moduleTitle, right.moduleTitle);
    });
}

export function getQuestionTopicKey(question, modules = []) {
  const moduleMap = new Map((Array.isArray(modules) ? modules : []).map((module) => [module.id, module]));
  return buildTopicKey(normalizeQuestionForTest(question), moduleMap);
}

export function getQuestionsForTopicSelection(questions = [], selectedTopicKeys = [], modules = []) {
  const selectedKeys = new Set(Array.isArray(selectedTopicKeys) ? selectedTopicKeys : []);
  const hasSelection = selectedKeys.size > 0;

  return (Array.isArray(questions) ? questions : [])
    .map(normalizeQuestionForTest)
    .filter((question) => question.active && question.prompt && question.options.length >= 2)
    .filter((question) => !hasSelection || selectedKeys.has(getQuestionTopicKey(question, modules)));
}

export function shuffleQuestions(questions = []) {
  return [...questions]
    .map((question) => ({ question, sort: Math.random() }))
    .sort((left, right) => left.sort - right.sort)
    .map(({ question }) => question);
}

export function generateNormalTest(
  { questions = getQuestions(), modules = [], questionCount = 25, selectedTopicKeys = [], questionIds = null } = {},
  role = "member"
) {
  if (!canPerformTestAction(role, "generateTest")) {
    throw new Error("No tienes permiso para generar tests.");
  }

  const requestedCount = Number(questionCount || 25);
  const forcedIds = Array.isArray(questionIds) ? new Set(questionIds.map((item) => String(item))) : null;
  const pool = forcedIds
    ? (Array.isArray(questions) ? questions : [])
        .map(normalizeQuestionForTest)
        .filter((question) => forcedIds.has(question.id) && question.active && question.prompt && question.options.length >= 2)
    : getQuestionsForTopicSelection(questions, selectedTopicKeys, modules);

  if (!pool.length) {
    throw new Error("No hay preguntas activas para los bloques seleccionados.");
  }

  if (pool.length < requestedCount) {
    throw new Error(`Solo hay ${pool.length} pregunta(s) disponibles para esa seleccion. Elige menos preguntas o mas temas.`);
  }

  return shuffleQuestions(pool).slice(0, requestedCount);
}

export function generateTest({ numQuestions = 10, topic = null } = {}, role = "member") {
  const pool = topic ? getQuestions().filter((question) => question.topic === topic) : getQuestions();
  return generateNormalTest({ questions: pool, questionCount: numQuestions }, role);
}

export function evaluateNormalTest(testQuestions = [], answersByQuestionId = {}, role = "member") {
  if (!canPerformTestAction(role, "evaluateTest")) {
    throw new Error("No tienes permiso para responder o evaluar tests.");
  }

  let correctCount = 0;
  let wrongCount = 0;
  let blankCount = 0;
  const answers = [];
  const failedQuestionIds = [];

  const questions = (Array.isArray(testQuestions) ? testQuestions : []).map(normalizeQuestionForTest);

  for (const question of questions) {
    const answerValue = answersByQuestionId?.[question.id];
    const answerIndex = answerValue === null || answerValue === undefined || answerValue === "" ? null : Number(answerValue);
    const isBlank = answerIndex === null || !Number.isInteger(answerIndex);
    const isCorrect = !isBlank && answerIndex === Number(question.correctIndex);

    if (isBlank) {
      blankCount += 1;
      failedQuestionIds.push(question.id);
    } else if (isCorrect) {
      correctCount += 1;
    } else {
      wrongCount += 1;
      failedQuestionIds.push(question.id);
    }

    answers.push({
      questionId: question.id,
      answerIndex,
      correctIndex: Number(question.correctIndex),
      correct: isCorrect,
      blank: isBlank
    });
  }

  const total = questions.length;
  const scorePercent = total ? (correctCount / total) * 100 : 0;

  return {
    total,
    correctCount,
    wrongCount,
    blankCount,
    score: correctCount,
    percentage: scorePercent,
    scorePercent,
    answers,
    failedQuestionIds
  };
}

export function evaluateTest(test, answers, role = "member") {
  const answersByQuestionId = {};
  (Array.isArray(test) ? test : []).forEach((question, index) => {
    answersByQuestionId[question.id] = Array.isArray(answers) ? answers[index] : null;
  });
  return evaluateNormalTest(test, answersByQuestionId, role);
}

export function loadTests() {}

export function saveTest() {}

export default createTestService;
