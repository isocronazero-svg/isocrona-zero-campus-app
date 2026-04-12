import { canPerformTestAction } from "../../router/viewPermissions.js";
import { getQuestions } from "./testStore.js";

export function createTestService() {
  return {};
}

export function generateTest({ numQuestions = 10, topic = null } = {}, role = "member") {
  if (!canPerformTestAction(role, "generateTest")) {
    throw new Error("No tienes permiso para generar tests.");
  }

  let pool = getQuestions();

  if (topic) {
    pool = pool.filter((question) => question.topic === topic);
  }

  const shuffled = [...pool].sort(() => 0.5 - Math.random());

  return shuffled.slice(0, numQuestions);
}

export function evaluateTest(test, answers, role = "member") {
  if (!canPerformTestAction(role, "evaluateTest")) {
    throw new Error("No tienes permiso para responder o evaluar tests.");
  }

  let score = 0;

  test.forEach((question, index) => {
    if (answers[index] === question.correctAnswer) {
      score++;
    }
  });

  return {
    score,
    total: test.length,
    percentage: test.length > 0 ? (score / test.length) * 100 : 0
  };
}

export function loadTests() {}

export function saveTest() {}

export default createTestService;
