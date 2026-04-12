import { evaluateTest, generateTest } from "../modules/tests/testService.js";
import {
  createQuestion,
  generateDummyQuestions,
  getStoredQuestions,
  saveQuestion
} from "../modules/tests/questionService.js";

const QUESTION_TIME_SECONDS = 10;
const ANSWER_FEEDBACK_DELAY_MS = 1200;

const testSession = {
  currentTest: [],
  answers: [],
  currentQuestionIndex: 0,
  timeLeft: QUESTION_TIME_SECONDS,
  timerId: null,
  score: 0,
  role: "member",
  isLocked: false
};

function resetSession(role) {
  stopTimer();
  testSession.currentTest = generateTest({ numQuestions: 5 }, role);
  testSession.answers = [];
  testSession.currentQuestionIndex = 0;
  testSession.timeLeft = QUESTION_TIME_SECONDS;
  testSession.score = 0;
  testSession.role = role;
  testSession.isLocked = false;
}

function stopTimer() {
  if (testSession.timerId) {
    clearInterval(testSession.timerId);
    testSession.timerId = null;
  }
}

function getCurrentQuestion() {
  return testSession.currentTest[testSession.currentQuestionIndex] || null;
}

function getQuestionProgressLabel() {
  return `${testSession.currentQuestionIndex + 1}/${testSession.currentTest.length}`;
}

function updateHeader(container) {
  const timerEl = container.querySelector('[data-test-timer]');
  const scoreEl = container.querySelector('[data-test-score]');
  const progressEl = container.querySelector('[data-test-progress]');

  if (timerEl) {
    timerEl.innerText = String(testSession.timeLeft);
  }

  if (scoreEl) {
    scoreEl.innerText = `${testSession.score}`;
  }

  if (progressEl) {
    progressEl.innerText = getQuestionProgressLabel();
  }
}

function buildOptionMarkup(option, optionIndex) {
  return `
    <button
      type="button"
      class="test-option-button"
      data-answer-index="${optionIndex}"
    >
      <span class="test-option-badge">${optionIndex + 1}</span>
      <span class="test-option-label">${option}</span>
    </button>
  `;
}

function renderQuestion(container) {
  const question = getCurrentQuestion();
  const stageEl = container.querySelector('[data-test-stage]');

  if (!stageEl) {
    return;
  }

  if (!question) {
    stageEl.innerHTML = '<div class="test-empty-state">No hay preguntas disponibles.</div>';
    return;
  }

  stageEl.innerHTML = `
    <div class="test-question-card">
      <div class="test-question-meta">
        <span class="test-question-topic">${question.topic || "general"}</span>
        <span class="test-question-difficulty">${question.difficulty || "medium"}</span>
      </div>
      <h3 class="test-question-title">${question.question}</h3>
      <div class="test-options-grid" data-test-options>
        ${question.options.map((option, optionIndex) => buildOptionMarkup(option, optionIndex)).join("")}
      </div>
    </div>
  `;
}

function renderFinalResults(container) {
  stopTimer();
  const result = evaluateTest(testSession.currentTest, testSession.answers, testSession.role);
  const stageEl = container.querySelector('[data-test-stage]');
  const resultEl = container.querySelector('[data-test-result]');

  if (stageEl) {
    stageEl.innerHTML = `
      <div class="test-result-card">
        <p class="test-result-kicker">Test finalizado</p>
        <h3 class="test-result-title">${result.score} aciertos de ${result.total}</h3>
        <p class="test-result-summary">Puntuación final: ${result.percentage.toFixed(1)}%</p>
        <button type="button" class="test-restart-button" data-test-restart>Repetir test</button>
      </div>
    `;
  }

  if (resultEl) {
    resultEl.innerText = `Resultado: ${result.score}/${result.total} (${result.percentage.toFixed(1)}%)`;
  }

  updateHeader(container);
}

function goToNextQuestion(container) {
  stopTimer();
  testSession.currentQuestionIndex += 1;
  testSession.timeLeft = QUESTION_TIME_SECONDS;
  testSession.isLocked = false;

  if (testSession.currentQuestionIndex >= testSession.currentTest.length) {
    renderFinalResults(container);
    return;
  }

  renderQuestion(container);
  updateHeader(container);
  startTimer(container);
}

function revealAnswer(container, selectedAnswerIndex = null) {
  const question = getCurrentQuestion();
  const optionsContainer = container.querySelector('[data-test-options]');

  if (!question || !optionsContainer) {
    return;
  }

  const buttons = Array.from(optionsContainer.querySelectorAll('[data-answer-index]'));

  buttons.forEach((button) => {
    const answerIndex = Number(button.dataset.answerIndex);
    button.disabled = true;
    button.classList.remove("is-correct", "is-incorrect", "is-unanswered");

    if (answerIndex === question.correctAnswer) {
      button.classList.add("is-correct");
    } else if (selectedAnswerIndex !== null && answerIndex === selectedAnswerIndex) {
      button.classList.add("is-incorrect");
    } else if (selectedAnswerIndex === null) {
      button.classList.add("is-unanswered");
    }
  });
}

function submitAnswer(container, selectedAnswerIndex = null) {
  if (testSession.isLocked) {
    return;
  }

  testSession.isLocked = true;
  stopTimer();

  const question = getCurrentQuestion();
  const questionIndex = testSession.currentQuestionIndex;

  if (!question) {
    renderFinalResults(container);
    return;
  }

  if (selectedAnswerIndex !== null) {
    testSession.answers[questionIndex] = selectedAnswerIndex;
    if (selectedAnswerIndex === question.correctAnswer) {
      testSession.score += 1;
    }
  } else {
    testSession.answers[questionIndex] = null;
  }

  revealAnswer(container, selectedAnswerIndex);
  updateHeader(container);

  window.setTimeout(() => {
    goToNextQuestion(container);
  }, ANSWER_FEEDBACK_DELAY_MS);
}

function startTimer(container) {
  stopTimer();
  updateHeader(container);

  testSession.timerId = window.setInterval(() => {
    testSession.timeLeft -= 1;
    updateHeader(container);

    if (testSession.timeLeft <= 0) {
      submitAnswer(container, null);
    }
  }, 1000);
}

function handleOptionClick(container, event) {
  const button = event.target.closest('[data-answer-index]');
  if (!button) {
    return;
  }

  const selectedAnswerIndex = Number(button.dataset.answerIndex);
  submitAnswer(container, selectedAnswerIndex);
}

function handleRestart(container) {
  resetSession(testSession.role);
  renderTestLayout(container);
  renderQuestion(container);
  updateHeader(container);
  startTimer(container);
}

function renderTestLayout(container) {
  const canAccessQuestionTools = ["admin", "member"].includes(String(testSession.role || "member"));

  container.innerHTML = `
    <section class="test-view test-view--kahoot">
      <header class="test-view-header">
        <div>
          <p class="test-view-kicker">Modo test</p>
          <h2 class="test-view-title">Entrenamiento rápido</h2>
        </div>
        <div class="test-view-stats">
          <div class="test-stat-pill">
            <span class="test-stat-label">Pregunta</span>
            <strong data-test-progress>1/1</strong>
          </div>
          <div class="test-stat-pill">
            <span class="test-stat-label">Tiempo</span>
            <strong data-test-timer>${QUESTION_TIME_SECONDS}</strong>
          </div>
          <div class="test-stat-pill">
            <span class="test-stat-label">Puntos</span>
            <strong data-test-score>0</strong>
          </div>
        </div>
      </header>
      ${
        canAccessQuestionTools
          ? `
            <section class="test-builder-card">
              <div class="test-builder-header">
                <div>
                  <p class="test-view-kicker">Banco de preguntas</p>
                  <h3 class="test-builder-title">Alta rápida de preguntas</h3>
                </div>
                <div class="test-builder-actions">
                  <button type="button" class="test-secondary-button" data-test-generate-dummy>
                    Cargar 20 de prueba
                  </button>
                  <span class="test-builder-count" data-test-question-count>${getStoredQuestions().length}</span>
                </div>
              </div>
              <form class="test-builder-form" data-test-question-form>
                <label>
                  <span>Pregunta</span>
                  <input type="text" name="question" required />
                </label>
                <label>
                  <span>Opción 1</span>
                  <input type="text" name="option0" required />
                </label>
                <label>
                  <span>Opción 2</span>
                  <input type="text" name="option1" required />
                </label>
                <label>
                  <span>Opción 3</span>
                  <input type="text" name="option2" required />
                </label>
                <label>
                  <span>Opción 4</span>
                  <input type="text" name="option3" required />
                </label>
                <label>
                  <span>Respuesta correcta</span>
                  <select name="correctAnswer" required>
                    <option value="0">Opción 1</option>
                    <option value="1">Opción 2</option>
                    <option value="2">Opción 3</option>
                    <option value="3">Opción 4</option>
                  </select>
                </label>
                <label>
                  <span>Tema</span>
                  <input type="text" name="topic" value="general" required />
                </label>
                <div class="test-builder-submit">
                  <button type="submit" class="test-restart-button">Guardar pregunta</button>
                </div>
              </form>
              <div class="test-builder-message" data-test-builder-message></div>
            </section>
          `
          : ""
      }
      <div data-test-stage></div>
      <div class="test-view-footer">
        <div class="test-result-inline" data-test-result>Responde antes de que termine el contador.</div>
      </div>
    </section>
  `;
}

function updateQuestionCount(container) {
  const countEl = container.querySelector("[data-test-question-count]");
  if (countEl) {
    countEl.innerText = `${getStoredQuestions().length} preguntas`;
  }
}

function setBuilderMessage(container, message, tone = "neutral") {
  const messageEl = container.querySelector("[data-test-builder-message]");
  if (!messageEl) {
    return;
  }

  messageEl.className = `test-builder-message is-${tone}`;
  messageEl.innerText = message;
}

function handleQuestionFormSubmit(container, event) {
  const form = event.target.closest("[data-test-question-form]");
  if (!form) {
    return false;
  }

  event.preventDefault();

  try {
    const formData = new FormData(form);
    const question = createQuestion({
      question: String(formData.get("question") || "").trim(),
      options: [
        String(formData.get("option0") || "").trim(),
        String(formData.get("option1") || "").trim(),
        String(formData.get("option2") || "").trim(),
        String(formData.get("option3") || "").trim()
      ],
      correctAnswer: Number(formData.get("correctAnswer")),
      topic: String(formData.get("topic") || "general").trim() || "general",
      createdBy: testSession.role
    });

    saveQuestion(question, testSession.role);
    updateQuestionCount(container);
    setBuilderMessage(container, "Pregunta guardada correctamente.", "success");
    form.reset();
  } catch (error) {
    setBuilderMessage(container, error.message || "No se pudo guardar la pregunta.", "error");
  }

  return true;
}

function handleGenerateDummy(container) {
  try {
    generateDummyQuestions(testSession.role);
    updateQuestionCount(container);
    setBuilderMessage(container, "Se han cargado 20 preguntas de prueba.", "success");
  } catch (error) {
    setBuilderMessage(container, error.message || "No se pudieron generar preguntas de prueba.", "error");
  }
}

export function renderTestView(container, role = "member") {
  resetSession(role);
  renderTestLayout(container);
  renderQuestion(container);
  updateHeader(container);
  updateQuestionCount(container);
  startTimer(container);

  container.onclick = (event) => {
    if (event.target.closest('[data-test-restart]')) {
      handleRestart(container);
      return;
    }

    if (event.target.closest("[data-test-generate-dummy]")) {
      handleGenerateDummy(container);
      return;
    }

    handleOptionClick(container, event);
  };

  container.onsubmit = (event) => {
    handleQuestionFormSubmit(container, event);
  };
}

export default renderTestView;
