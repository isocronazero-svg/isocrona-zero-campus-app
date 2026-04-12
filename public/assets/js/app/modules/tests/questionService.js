import { canPerformTestAction } from "../../router/viewPermissions.js";
import {
  addQuestion as addQuestionToStore,
  getQuestions,
  setQuestions
} from "./testStore.js";

const QUESTION_STORAGE_KEY = "iz-test-questions";
const DUMMY_TOPICS = ["era", "rescate", "trafico", "ascensores", "extincion"];
const DUMMY_DIFFICULTIES = ["easy", "medium", "hard"];

export function createQuestionService() {
  return {};
}

function canUseLocalStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function buildQuestionId(prefix = "question") {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeQuestionPayload(question) {
  return createQuestion({
    ...question,
    id: question.id || buildQuestionId("question"),
    options: Array.isArray(question.options) ? question.options.slice(0, 4) : []
  });
}

function persistQuestions() {
  if (!canUseLocalStorage()) {
    return getQuestions();
  }

  const questions = getQuestions();
  window.localStorage.setItem(QUESTION_STORAGE_KEY, JSON.stringify(questions));
  return questions;
}

export function createQuestion({
  id,
  question,
  options = [],
  correctAnswer,
  topic = "general",
  difficulty = "medium",
  createdBy = "admin"
}) {
  return {
    id,
    question,
    options,
    correctAnswer,
    topic,
    difficulty,
    createdBy,
    createdAt: new Date().toISOString()
  };
}

export function loadQuestions() {
  if (!canUseLocalStorage()) {
    return getQuestions();
  }

  const rawQuestions = window.localStorage.getItem(QUESTION_STORAGE_KEY);
  if (!rawQuestions) {
    return getQuestions();
  }

  try {
    const parsedQuestions = JSON.parse(rawQuestions);
    const dedupedQuestions = [];
    const seenIds = new Set();

    for (const question of Array.isArray(parsedQuestions) ? parsedQuestions : []) {
      if (!question || !question.id || seenIds.has(question.id)) {
        continue;
      }

      seenIds.add(question.id);
      dedupedQuestions.push(question);
    }

    setQuestions(dedupedQuestions);
    persistQuestions();
    return dedupedQuestions;
  } catch (error) {
    console.error("No se pudieron cargar las preguntas guardadas.", error);
    return getQuestions();
  }
}

export function getStoredQuestions() {
  return getQuestions();
}

export function addQuestion(question, role = "member") {
  if (!canPerformTestAction(role, "addQuestion")) {
    throw new Error("No tienes permiso para añadir preguntas.");
  }

  const normalizedQuestion = normalizeQuestionPayload(question);
  addQuestionToStore(normalizedQuestion);
  return persistQuestions();
}

export function saveQuestion(question, role = "member") {
  return addQuestion(question, role);
}

export function generateDummyQuestions(role = "admin") {
  if (!canPerformTestAction(role, "addQuestion")) {
    throw new Error("No tienes permiso para generar preguntas de prueba.");
  }

  const generatedQuestions = Array.from({ length: 20 }, (_, index) => {
    const topic = DUMMY_TOPICS[index % DUMMY_TOPICS.length];
    const correctAnswer = Math.floor(Math.random() * 4);

    return createQuestion({
      id: buildQuestionId(`dummy-${topic}`),
      question: `Pregunta de prueba ${index + 1} sobre ${topic}`,
      options: [
        `Opción A ${index + 1}`,
        `Opción B ${index + 1}`,
        `Opción C ${index + 1}`,
        `Opción D ${index + 1}`
      ],
      correctAnswer,
      topic,
      difficulty: DUMMY_DIFFICULTIES[index % DUMMY_DIFFICULTIES.length],
      createdBy: "system"
    });
  });

  generatedQuestions.forEach((question) => {
    addQuestionToStore(question);
  });

  persistQuestions();
  return getQuestions();
}

export default createQuestionService;
