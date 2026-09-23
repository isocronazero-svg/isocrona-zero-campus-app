const courseId = new URL(window.location.href).searchParams.get("courseId") || "";
const endpoint = `/api/courses/${encodeURIComponent(courseId)}/shared-test`;
const form = document.getElementById("quiz");
const status = document.getElementById("status");
const submit = document.getElementById("submit");
let test;
let saving = false;
let submission = null;
const attemptId = crypto.randomUUID();

function element(tag, text, className) {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  if (className) node.className = className;
  return node;
}
async function request(url, options = {}) {
  const response = await fetch(url, { ...options, headers: { "Content-Type": "application/json" } });
  const payload = await response.json().catch(() => null);
  if (!response.ok || !payload?.ok) {
    const error = new Error(payload?.error || "No se pudo confirmar la respuesta del servidor. Puedes reintentar sin duplicar el resultado.");
    error.status = response.status;
    throw error;
  }
  return payload;
}

async function load() {
  try {
    if (!courseId) throw new Error("Abre el test desde un curso del portal.");
    test = await request(endpoint);
    document.getElementById("title").textContent = test.course.title;
    status.textContent = test.preview
      ? "Vista previa del instructor: este intento no se guardará como resultado del alumnado."
      : "Test de práctica. Puedes dejar preguntas en blanco; el resultado se guardará en tu historial.";
    test.questions.forEach((question, index) => {
      const group = element("fieldset");
      group.append(element("legend", `${index + 1}. ${question.prompt}`));
      question.options.forEach((option, optionIndex) => {
        const label = element("label", undefined, "shared-test-option");
        const radio = element("input");
        radio.type = "radio"; radio.name = `question-${index}`; radio.value = String(optionIndex);
        label.append(radio, element("span", option)); group.append(label);
      });
      document.getElementById("questions").append(group);
    });
    form.hidden = false;
    if (test.preview) showLiveControls();
    if (test.results.length) {
      const history = document.getElementById("history");
      history.hidden = false; history.append(element("h2", "Tus últimos resultados"));
      test.results.forEach((result) => history.append(element("p", `${new Date(result.createdAt).toLocaleString("es-ES")} · ${result.correctCount}/${result.total} · ${result.percentage}%`)));
    }
  } catch (error) {
    status.textContent = error.message || "No se pudo cargar el test. Vuelve a entrar en el portal y recarga esta página.";
  }
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (saving) return;
  saving = true;
  if (!submission) {
    const data = new FormData(form);
    submission = { attemptId, version: test.version, questionIds: test.questions.map((question) => question.id),
      answers: test.questions.map((_, index) => data.has(`question-${index}`) ? Number(data.get(`question-${index}`)) : null) };
  }
  // Keep the same answer set and attempt ID after a connection failure.
  form.querySelectorAll("input, button").forEach((control) => { control.disabled = true; });
  status.textContent = "Corrigiendo respuestas…";
  try {
    const payload = await request(`${endpoint}/results`, { method: "POST", body: JSON.stringify(submission) });
    const result = payload.result;
    status.textContent = payload.preview ? "Vista previa corregida. No se han guardado resultados." : "Resultado guardado.";
    const panel = document.getElementById("result");
    panel.hidden = false;
    panel.replaceChildren(element("h2", `${result.correctCount}/${result.total} respuestas correctas · ${result.percentage}%`));
    result.responses.forEach((answer) => {
      const row = element("div", undefined, "shared-test-review");
      row.append(element("strong", answer.prompt), element("p", answer.isBlank ? "Sin responder" : answer.isCorrect ? "Correcta" : "Incorrecta"),
        element("p", `Respuesta correcta: ${answer.correctAnswer}`));
      if (answer.explanation) row.append(element("p", answer.explanation));
      panel.append(row);
    });
    const again = element("button", "Nuevo intento", "ghost-button");
    again.type = "button"; again.addEventListener("click", () => window.location.reload()); panel.append(again);
    submit.textContent = "Test corregido";
  } catch (error) {
    status.textContent = error.message || "Fallo de conexión. Reintenta con las mismas respuestas.";
    if (error.status === 409) {
      submit.textContent = "Es necesario recargar el test";
      const panel = document.getElementById("result"); panel.hidden = false;
      const reload = element("button", "Abrir la versión actual del test", "ghost-button");
      reload.type = "button"; reload.addEventListener("click", () => window.location.reload());
      panel.replaceChildren(reload);
    } else {
      submit.disabled = false; submit.textContent = "Reintentar estas respuestas";
    }
  } finally { saving = false; }
});

function showLiveControls() {
  const panel = document.getElementById("live"); panel.hidden = false;
  const button = element("button", "Crear sesión en vivo con estas preguntas", "ghost-button");
  button.type = "button";
  const message = element("p"); message.setAttribute("role", "status");
  button.addEventListener("click", async () => {
    button.disabled = true;
    try {
      const payload = await request("/api/test-zone/live-sessions", { method: "POST", body: JSON.stringify({ courseId }) });
      message.textContent = `Código: ${payload.session.code}. ${payload.session.questionCount} preguntas. Puedes gestionar la sesión desde Zona Test.`;
      const link = element("a", "Abrir entrada de participantes", "button-link");
      link.href = "/public-live-test.html"; link.target = "_blank"; link.rel = "noopener"; panel.append(link);
      const close = element("button", "Cerrar esta sesión", "ghost-button"); close.type = "button";
      close.addEventListener("click", async () => {
        close.disabled = true;
        try {
          await request(`/api/test-zone/live-sessions/${encodeURIComponent(payload.session.id)}/close`, { method: "POST", body: "{}" });
          message.textContent = "Sesión cerrada.";
        } catch (error) { message.textContent = error.message; close.disabled = false; }
      });
      panel.append(close);
    } catch (error) {
      message.textContent = `${error.message} Revisa las sesiones en Zona Test antes de crear otra.`;
      // A lost response may conceal a created session; do not resend blindly.
    }
  });
  panel.append(button, message);
}

load();
