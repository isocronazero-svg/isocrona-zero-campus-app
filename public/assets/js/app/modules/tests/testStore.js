const testState = {
  questions: [],
  results: [],
  stats: {
    totalTests: 0,
    totalQuestions: 0,
    answered: 0,
    correct: 0,
    wrong: 0,
    blank: 0,
    accuracy: 0,
    evolution: []
  },
  failedQuestionIds: [],
  reviewedQuestionIds: [],
  liveSessions: []
};

export function getTestState() {
  return testState;
}

export function setTestState(nextState = {}) {
  Object.assign(testState, nextState);
  return testState;
}

export function setQuestions(questions = []) {
  testState.questions = Array.isArray(questions) ? [...questions] : [];
  return testState.questions;
}

export function getQuestions() {
  return testState.questions;
}

export function setResults(results = [], stats = null, failedQuestionIds = [], reviewedQuestionIds = []) {
  testState.results = Array.isArray(results) ? [...results] : [];
  testState.stats = stats && typeof stats === "object" ? { ...testState.stats, ...stats } : { ...testState.stats };
  testState.failedQuestionIds = Array.isArray(failedQuestionIds) ? [...failedQuestionIds] : [];
  testState.reviewedQuestionIds = Array.isArray(reviewedQuestionIds) ? [...reviewedQuestionIds] : [];
  return testState.results;
}

export function setLiveSessions(sessions = []) {
  testState.liveSessions = Array.isArray(sessions) ? [...sessions] : [];
  return testState.liveSessions;
}

export function resetTestState() {
  testState.questions = [];
  testState.results = [];
  testState.stats = {
    totalTests: 0,
    totalQuestions: 0,
    answered: 0,
    correct: 0,
    wrong: 0,
    blank: 0,
    accuracy: 0,
    evolution: []
  };
  testState.failedQuestionIds = [];
  testState.reviewedQuestionIds = [];
  testState.liveSessions = [];
  return testState;
}

export default testState;
