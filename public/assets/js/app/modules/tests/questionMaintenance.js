import { getStoredQuestions, loadSharedQuestions, loadQuestionReports, reportQuestion, resolveQuestionReport, updateQuestion, deleteQuestion } from "./questionService.js";

const html = value => String(value ?? "").replace(/[&<>"']/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));

export function questionTools(questionId, admin = false) {
  if (!questionId) return "";
  return `<div class="test-zone-actions">
    <button type="button" class="test-zone-secondary-button" data-question-action="report" data-question-id="${html(questionId)}">Revisar pregunta</button>
    ${admin ? `<button type="button" class="test-zone-secondary-button" data-question-action="edit" data-question-id="${html(questionId)}">Editar pregunta</button>
    <button type="button" class="test-zone-secondary-button test-zone-delete-button" data-question-action="delete" data-question-id="${html(questionId)}">Eliminar pregunta</button>` : ""}
  </div>`;
}

export function questionManagementPanel() {
  return `<section class="test-zone-card" data-question-management>
    <h3>Revisión y gestión de preguntas</h3>
    <p class="muted">Revisa los avisos de los socios y corrige el banco compartido.</p>
    <button type="button" class="test-zone-secondary-button" data-refresh-question-bank>Actualizar banco y avisos</button>
    <div data-question-reports aria-live="polite"></div>
    <label class="test-zone-field"><span>Buscar pregunta, bloque o tema</span><input type="search" data-question-search placeholder="Escribe para buscar…" /></label>
    <div data-question-bank></div>
  </section>`;
}

function openDialog(container, title, content, onSubmit) {
  const trigger = document.activeElement;
  const dialog = document.createElement("dialog");
  dialog.className = "test-zone-dialog";
  dialog.setAttribute("aria-labelledby", "question-dialog-title");
  dialog.innerHTML = `<form class="test-zone-dialog-form"><h3 id="question-dialog-title">${html(title)}</h3>${content}
    <p data-dialog-error class="test-zone-inline-error" role="alert" hidden></p>
    <div class="test-zone-actions"><button class="test-zone-primary-button" type="submit">${title === "Eliminar pregunta" ? "Eliminar pregunta" : "Enviar"}</button>
    <button class="test-zone-secondary-button" type="button" data-close-dialog>Cancelar</button></div></form>`;
  container.append(dialog);
  dialog.addEventListener("close", () => { dialog.remove(); if (trigger?.isConnected) trigger.focus(); });
  dialog.querySelector("[data-close-dialog]").onclick = () => dialog.close();
  dialog.querySelector("form").onsubmit = async event => {
    event.preventDefault(); event.stopPropagation();
    const form = event.currentTarget;
    const button = form.querySelector('[type="submit"]');
    if (button.disabled) return;
    button.disabled = true;
    try { await onSubmit(new FormData(form), dialog); }
    catch (error) {
      const output = dialog.querySelector("[data-dialog-error]");
      output.hidden = false; output.textContent = error.message || "No se pudo guardar. Puedes volver a intentarlo.";
    } finally { button.disabled = false; }
  };
  dialog.showModal();
  return dialog;
}

export function bindQuestionMaintenance(container, { admin = false, onQuestionsChanged = () => {} } = {}) {
  const management = container.querySelector("[data-question-management]");
  let page = 0;
  const bindTools = root => root.querySelectorAll("[data-question-action]").forEach(button => {
    button.onclick = event => {
      event.preventDefault(); event.stopPropagation();
      const questionId = button.dataset.questionId;
      const question = getStoredQuestions().find(q => q.id === questionId);
      const action = button.dataset.questionAction;
      if (action === "report") {
        openDialog(container, "Solicitar revisión de pregunta", `<p>Indica qué habría que corregir: enunciado, opciones, respuesta o explicación.</p>
          <label class="test-zone-field"><span>Motivo de la revisión</span><textarea name="reason" rows="5" minlength="5" maxlength="2000" required></textarea></label>`, async (data, dialog) => {
          await reportQuestion(questionId, data.get("reason"));
          dialog.querySelector("form").innerHTML = '<h3>Revisión solicitada</h3><p role="status">La solicitud queda pendiente para que la revise un administrador.</p><button type="button" class="test-zone-primary-button">Volver al test</button>';
          const close = dialog.querySelector("button"); close.onclick = () => dialog.close(); close.focus();
          if (management) await refreshReports();
        });
        return;
      }
      if (!admin || !question) return;
      const expectedUpdatedAt = question.updatedAt || question.createdAt;
      if (action === "delete") {
        openDialog(container, "Eliminar pregunta", `<p>${html(question.prompt)}</p><p>Se retirará del banco y de la selección de preguntas de los cursos. Los resultados ya guardados se conservan.</p>`, async (_data, dialog) => {
          await deleteQuestion(questionId, expectedUpdatedAt);
          dialog.close(); await refreshBank();
        });
        return;
      }
      openDialog(container, "Editar pregunta", `<label class="test-zone-field"><span>Enunciado</span><textarea name="prompt" rows="3" required>${html(question.prompt)}</textarea></label>
        ${question.options.map((option, index) => `<label class="test-zone-field"><span>Opción ${String.fromCharCode(65 + index)}</span><input name="option${index}" value="${html(option)}" required /></label>`).join("")}
        <label class="test-zone-field"><span>Respuesta correcta</span><select name="correctIndex">${question.options.map((_, index) => `<option value="${index}" ${index === question.correctIndex ? "selected" : ""}>${String.fromCharCode(65 + index)}</option>`).join("")}</select></label>
        <label class="test-zone-field"><span>Explicación</span><textarea name="explanation" rows="3">${html(question.explanation)}</textarea></label>
        <label class="test-zone-field"><span>Bloque</span><input name="part" value="${html(question.part)}" required /></label>
        <label class="test-zone-field"><span>Tema</span><input name="category" value="${html(question.category)}" required /></label>`, async (data, dialog) => {
        await updateQuestion(questionId, { prompt: data.get("prompt"), options: question.options.map((_, i) => data.get(`option${i}`)),
          correctIndex: Number(data.get("correctIndex")), explanation: data.get("explanation"), part: data.get("part"), category: data.get("category"), expectedUpdatedAt });
        dialog.close(); await refreshBank();
      });
    };
  });
  const drawBank = () => {
    if (!management?.isConnected) return;
    const search = management.querySelector("[data-question-search]").value.toLocaleLowerCase("es").trim();
    const questions = getStoredQuestions().filter(q => `${q.prompt} ${q.part} ${q.category}`.toLocaleLowerCase("es").includes(search));
    page = Math.min(page, Math.max(0, Math.ceil(questions.length / 20) - 1));
    const bank = management.querySelector("[data-question-bank]");
    bank.innerHTML = `<p role="status">${questions.length} preguntas · Página ${page + 1} de ${Math.max(1, Math.ceil(questions.length / 20))}</p>
      ${questions.slice(page * 20, (page + 1) * 20).map(q => `<article class="test-zone-mini-card"><strong>${html(q.prompt)}</strong><p>${html(q.part)} · ${html(q.category)}</p>${questionTools(q.id, true)}</article>`).join("")}
      <div class="test-zone-actions"><button type="button" class="test-zone-secondary-button" data-bank-prev ${page ? "" : "disabled"}>Anterior</button>
      <button type="button" class="test-zone-secondary-button" data-bank-next ${(page + 1) * 20 < questions.length ? "" : "disabled"}>Siguiente</button></div>`;
    bank.querySelector("[data-bank-prev]").onclick = () => { page--; drawBank(); };
    bank.querySelector("[data-bank-next]").onclick = () => { page++; drawBank(); };
    bindTools(bank);
  };
  const refreshReports = async () => {
    if (!management) return;
    const output = management.querySelector("[data-question-reports]");
    try {
      const reports = (await loadQuestionReports()).filter(r => r.status === "pending");
      if (!management.isConnected) return;
      output.innerHTML = `<h4>Solicitudes pendientes (${reports.length})</h4>${reports.length ? reports.map(r => `<article class="test-zone-mini-card"><strong>${html(r.prompt)}</strong>
        <p class="test-zone-report-reason">${html(r.reason)}</p>${getStoredQuestions().some(q => q.id === r.questionId) ? questionTools(r.questionId, true) : "<p>Pregunta retirada del banco</p>"}
        <button type="button" class="test-zone-secondary-button" data-resolve-report="${html(r.id)}">Marcar revisión resuelta</button></article>`).join("") : "<p>No hay solicitudes pendientes.</p>"}`;
      bindTools(output);
      output.querySelectorAll("[data-resolve-report]").forEach(button => { button.onclick = async () => {
        button.disabled = true;
        try { await resolveQuestionReport(button.dataset.resolveReport); await refreshReports(); }
        catch (error) { button.disabled = false; button.textContent = `Reintentar: ${error.message}`; }
      }; });
    } catch (error) { output.textContent = `No se pudieron cargar los avisos: ${error.message}. Pulsa Actualizar banco y avisos para reintentar.`; }
  };
  const refreshBank = async () => {
    await loadSharedQuestions(); drawBank(); await refreshReports(); onQuestionsChanged();
  };
  bindTools(container);
  if (management) {
    drawBank(); void refreshReports();
    management.querySelector("[data-question-search]").oninput = () => { page = 0; drawBank(); };
    management.querySelector("[data-refresh-question-bank]").onclick = async event => {
      const button = event.currentTarget; button.disabled = true;
      try { await refreshBank(); } catch (error) { management.querySelector("[data-question-reports]").textContent = error.message; }
      finally { button.disabled = false; }
    };
  }
}
