const testState = {
  tests: [],
  questions: [],
  activeTestId: null
};

export function getTestState() {
  return testState;
}

export function addQuestion(question) {
  const exists = testState.questions.some((currentQuestion) => currentQuestion.id === question.id);
  if (exists) {
    return testState.questions;
  }

  testState.questions.push(question);
  return testState.questions;
}

export function getQuestions() {
  return testState.questions;
}

export function getQuestionsByTopic(topic) {
  return testState.questions.filter((question) => question.topic === topic);
}

export function setTestState(nextState = {}) {
  Object.assign(testState, nextState);
  return testState;
}

export function setQuestions(questions = []) {
  testState.questions = Array.isArray(questions) ? [...questions] : [];
  return testState.questions;
}

export function resetTestState() {
  testState.tests = [];
  testState.questions = [];
  testState.activeTestId = null;
  return testState;
}

export default testState;
