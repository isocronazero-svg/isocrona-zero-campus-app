import { canPerformTestAction } from "../../router/viewPermissions.js";
import {
  addQuestion as addQuestionToStore,
  getQuestions,
  getTestModules,
  setQuestions,
  setTestModules
} from "./testStore.js";

const QUESTION_STORAGE_KEY = "iz-test-questions";
const MODULE_STORAGE_KEY = "iz-test-modules";
const DUMMY_TOPICS = [
  { number: 1, title: "Principios de la lucha contra incendios" },
  { number: 2, title: "Incendios en interiores" },
  { number: 3, title: "Incendios forestales" },
  { number: 4, title: "Equipos de respiracion autonoma" },
  { number: 5, title: "Rescate y salvamento" }
];
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

function normalizeText(value, fallback = "") {
  return String(value ?? fallback ?? "").trim();
}

function normalizeCorrectIndex(question, options) {
  const rawIndex = question.correctIndex ?? question.correctAnswer ?? question.respuestaCorrecta;
  const numericIndex = Number(rawIndex);
  if (Number.isInteger(numericIndex) && numericIndex >= 0 && numericIndex < options.length) {
    return numericIndex;
  }

  const rawText = normalizeText(rawIndex).toLowerCase();
  if (rawText) {
    const matchedIndex = options.findIndex((option) => normalizeText(option).toLowerCase() === rawText);
    if (matchedIndex >= 0) {
      return matchedIndex;
    }
  }

  return 0;
}

export function normalizeQuestionPayload(question = {}) {
  const options = Array.isArray(question.options)
    ? question.options.map((option) => normalizeText(option)).filter(Boolean).slice(0, 6)
    : [];
  const temaTitulo =
    normalizeText(question.temaTitulo) ||
    normalizeText(question.topicTitle) ||
    normalizeText(question.topic) ||
    normalizeText(question.title) ||
    "General";
  const temaNumero = normalizeText(question.temaNumero || question.topicNumber || question.topicIndex);
  const moduleTitle =
    normalizeText(question.moduleTitle) ||
    normalizeText(question.manual) ||
    normalizeText(question.modulo) ||
    normalizeText(question.module) ||
    "";

  return {
    id: normalizeText(question.id) || buildQuestionId("question"),
    moduleId: normalizeText(question.moduleId),
    moduleTitle,
    prompt:
      normalizeText(question.prompt) ||
      normalizeText(question.question) ||
      normalizeText(question.enunciado),
    question:
      normalizeText(question.question) ||
      normalizeText(question.prompt) ||
      normalizeText(question.enunciado),
    options,
    correctIndex: normalizeCorrectIndex(question, options),
    correctAnswer: normalizeCorrectIndex(question, options),
    explanation: normalizeText(question.explanation || question.explicacion),
    part: normalizeText(question.part || question.parte || "especifica").toLowerCase(),
    category: normalizeText(question.category || question.categoria || "bomberos").toLowerCase(),
    block: normalizeText(question.block || question.bloque || question.manual),
    manual: normalizeText(question.manual),
    modulo: normalizeText(question.modulo),
    temaNumero,
    temaTitulo,
    topic: temaTitulo,
    difficulty: normalizeText(question.difficulty || question.dificultad || "medium"),
    active: question.active !== false && question.activo !== false,
    metadata: question.metadata && typeof question.metadata === "object" ? question.metadata : {},
    createdBy: normalizeText(question.createdBy || "admin"),
    createdAt: question.createdAt || new Date().toISOString()
  };
}

function persistQuestions() {
  if (!canUseLocalStorage()) {
    return getQuestions();
  }

  const questions = getQuestions();
  window.localStorage.setItem(QUESTION_STORAGE_KEY, JSON.stringify(questions));
  return questions;
}

function persistModules() {
  if (!canUseLocalStorage()) {
    return getTestModules();
  }

  const modules = getTestModules();
  window.localStorage.setItem(MODULE_STORAGE_KEY, JSON.stringify(modules));
  return modules;
}

export function createQuestion({
  id,
  question,
  prompt,
  options = [],
  correctAnswer,
  correctIndex,
  topic = "General",
  temaTitulo,
  temaNumero,
  part = "especifica",
  category = "bomberos",
  moduleId = "",
  moduleTitle = "",
  difficulty = "medium",
  explanation = "",
  createdBy = "admin"
}) {
  return normalizeQuestionPayload({
    id,
    question: question || prompt,
    prompt: prompt || question,
    options,
    correctAnswer: correctAnswer ?? correctIndex,
    correctIndex: correctIndex ?? correctAnswer,
    topic,
    temaTitulo: temaTitulo || topic,
    temaNumero,
    part,
    category,
    moduleId,
    moduleTitle,
    difficulty,
    explanation,
    createdBy
  });
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
      const normalizedQuestion = normalizeQuestionPayload(question);
      if (!normalizedQuestion.id || seenIds.has(normalizedQuestion.id)) {
        continue;
      }

      seenIds.add(normalizedQuestion.id);
      dedupedQuestions.push(normalizedQuestion);
    }

    setQuestions(dedupedQuestions);
    persistQuestions();
    return dedupedQuestions;
  } catch (error) {
    console.error("No se pudieron cargar las preguntas guardadas.", error);
    return getQuestions();
  }
}

export function loadStoredModules() {
  if (!canUseLocalStorage()) {
    return getTestModules();
  }

  const rawModules = window.localStorage.getItem(MODULE_STORAGE_KEY);
  if (!rawModules) {
    return getTestModules();
  }

  try {
    const modules = JSON.parse(rawModules);
    setTestModules(Array.isArray(modules) ? modules : []);
    return getTestModules();
  } catch (error) {
    console.error("No se pudieron cargar los modulos de test guardados.", error);
    return getTestModules();
  }
}

export async function loadQuestionsFromServer() {
  if (typeof fetch !== "function") {
    return getQuestions();
  }

  try {
    const response = await fetch("/api/questions", { credentials: "same-origin" });
    if (!response.ok) {
      return getQuestions();
    }
    const payload = await response.json();
    const questions = Array.isArray(payload.questions)
      ? payload.questions.map(normalizeQuestionPayload).filter((question) => question.prompt && question.options.length >= 2)
      : [];
    if (questions.length) {
      setQuestions(questions);
      persistQuestions();
    }
    return getQuestions();
  } catch (error) {
    console.warn("No se pudo sincronizar el banco de preguntas.", error);
    return getQuestions();
  }
}

export async function loadModulesFromServer() {
  if (typeof fetch !== "function") {
    return getTestModules();
  }

  try {
    const response = await fetch("/api/test-modules", { credentials: "same-origin" });
    if (!response.ok) {
      return getTestModules();
    }
    const payload = await response.json();
    const modules = Array.isArray(payload.testModules)
      ? payload.testModules.map((module) => ({
          id: normalizeText(module.id),
          title: normalizeText(module.title || module.name || "Modulo"),
          description: normalizeText(module.description),
          createdAt: module.createdAt || ""
        }))
      : [];
    setTestModules(modules);
    persistModules();
    return getTestModules();
  } catch (error) {
    console.warn("No se pudieron sincronizar los modulos de test.", error);
    return getTestModules();
  }
}

export function getStoredQuestions() {
  return getQuestions();
}

export function getStoredModules() {
  return getTestModules();
}

export function addQuestion(question, role = "member") {
  if (!canPerformTestAction(role, "addQuestion")) {
    throw new Error("No tienes permiso para anadir preguntas.");
  }

  const normalizedQuestion = normalizeQuestionPayload(question);
  addQuestionToStore(normalizedQuestion);
  return persistQuestions();
}

export function saveQuestion(question, role = "member") {
  return addQuestion(question, role);
}

export async function saveQuestionToServer(question, role = "member") {
  if (!canPerformTestAction(role, "addQuestion") || typeof fetch !== "function") {
    return null;
  }

  const normalizedQuestion = normalizeQuestionPayload(question);
  try {
    const response = await fetch("/api/questions", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt: normalizedQuestion.prompt,
        question: normalizedQuestion.question,
        options: normalizedQuestion.options,
        correctIndex: normalizedQuestion.correctIndex,
        correctAnswer: normalizedQuestion.correctAnswer,
        explanation: normalizedQuestion.explanation,
        moduleId: normalizedQuestion.moduleId,
        moduleTitle: normalizedQuestion.moduleTitle || normalizedQuestion.manual || "Manual bomberos",
        part: normalizedQuestion.part,
        category: normalizedQuestion.category,
        temaNumero: normalizedQuestion.temaNumero,
        temaTitulo: normalizedQuestion.temaTitulo,
        active: normalizedQuestion.active,
        metadata: normalizedQuestion.metadata
      })
    });
    if (!response.ok) {
      return null;
    }
    const payload = await response.json();
    if (payload.question) {
      addQuestionToStore(normalizeQuestionPayload(payload.question));
      persistQuestions();
    }
    if (payload.question?.moduleId) {
      await loadModulesFromServer();
    }
    return payload.question || null;
  } catch (error) {
    return null;
  }
}

export function generateDummyQuestions(role = "admin") {
  if (!canPerformTestAction(role, "addQuestion")) {
    throw new Error("No tienes permiso para generar preguntas de prueba.");
  }

  const generatedQuestions = Array.from({ length: 30 }, (_, index) => {
    const topic = DUMMY_TOPICS[index % DUMMY_TOPICS.length];
    const correctAnswer = index % 4;

    return createQuestion({
      id: buildQuestionId(`demo-bomberos-${topic.number}`),
      question: `Pregunta de prueba ${index + 1} sobre ${topic.title}`,
      options: [
        `Respuesta correcta ${index + 1}`,
        `Distractor operativo ${index + 1}`,
        `Distractor normativo ${index + 1}`,
        `Distractor de seguridad ${index + 1}`
      ],
      correctAnswer,
      topic: topic.title,
      temaTitulo: topic.title,
      temaNumero: topic.number,
      part: "especifica",
      category: "bomberos",
      moduleTitle: "Manual bomberos",
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
