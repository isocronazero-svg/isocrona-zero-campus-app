import { getStoredQuestions, loadLivePresets, saveLivePreset, deleteLivePreset } from "./questionService.js";
import { getTestGeneration } from "./testStore.js";
import { escapeHtml } from "../../ui/formatters.js";

const mounted = new WeakSet();

export async function mountLiveTestLibrary(container) {
  const root = container.querySelector("[data-live-test-library]");
  if (!root || mounted.has(root)) return;
  mounted.add(root);
  const generation = getTestGeneration();
  const current = () => root.isConnected && generation === getTestGeneration();
  const form = root.closest("form");
  const field = name => form.elements.namedItem(name);
  let presets = [], active = null, selected = new Set(), busy = false, dirty = false, shown = 50;
  root.innerHTML = `
    <div class="live-library-toolbar">
      <label class="test-zone-field"><span>Mis tests guardados</span><select data-preset-list><option value="new">Nuevo test</option></select></label>
      <button type="button" class="test-zone-secondary-button" data-preset-reload>Recargar biblioteca</button>
      <button type="button" class="test-zone-secondary-button" data-preset-save>Guardar test</button>
      <button type="button" class="test-zone-secondary-button test-zone-delete-button" data-preset-delete disabled>Eliminar test</button>
    </div>
    <label class="live-library-toggle"><input type="checkbox" data-preset-explicit /> Seleccionar preguntas concretas</label>
    <input type="hidden" name="liveQuestionIds" value="" />
    <details data-preset-picker hidden><summary>Preguntas seleccionadas: <span data-preset-count>0</span> / 100</summary>
      <label class="test-zone-field"><span>Buscar preguntas</span><input type="search" data-preset-search /></label>
      <div class="live-library-questions" data-preset-questions></div>
      <button type="button" class="test-zone-secondary-button" data-preset-more>Mostrar m\u00e1s</button>
    </details>
    <p class="muted" data-preset-status role="status"></p>`;
  const find = selector => root.querySelector(selector);
  const list = find("[data-preset-list]"), explicit = find("[data-preset-explicit]");
  const picker = find("[data-preset-picker]"), status = find("[data-preset-status]");
  const buttons = [...root.querySelectorAll("button")];
  const questions = getStoredQuestions().filter(q => !q.deletedAt && q.active !== false);
  const byId = new Map(questions.map(q => [q.id, q]));
  const message = text => { if (current()) status.textContent = text; };
  function sync() {
    field("liveQuestionIds").value = explicit.checked ? JSON.stringify([...selected]) : "";
    picker.hidden = !explicit.checked;
    find("[data-preset-count]").textContent = String(selected.size);
    for (const name of ["part", "category", "difficulty", "questionCount"]) {
      field(name).disabled = explicit.checked;
      field(name).closest("label").hidden = explicit.checked;
    }
  }
  function renderQuestions() {
    const search = find("[data-preset-search]").value.trim().toLocaleLowerCase();
    const matches = questions.filter(q => `${q.prompt} ${q.part} ${q.category}`.toLocaleLowerCase().includes(search));
    // Selected questions remain reachable even when a filter hides them or the bank has retired them.
    const visible = [...selected].map(id => byId.get(id) || { id, prompt: "Pregunta retirada: " + id });
    visible.push(...matches.filter(q => !selected.has(q.id)).slice(0, shown));
    find("[data-preset-questions]").innerHTML = visible.length ? visible.map(q => `
      <label class="live-library-question"><input type="checkbox" data-question-id="${escapeHtml(q.id)}" ${selected.has(q.id) ? "checked" : ""} />
      <span>${escapeHtml(q.prompt)}</span></label>`).join("") : "<p>No hay preguntas disponibles.</p>";
    find("[data-preset-more]").hidden = matches.filter(q => !selected.has(q.id)).length <= shown;
    sync();
  }
  function renderList() {
    list.innerHTML = '<option value="new">Nuevo test</option>' + presets.map(p => `<option value="${escapeHtml(p.id)}">${escapeHtml(p.title)} (${p.questionIds.length})</option>`).join("");
    list.value = active?.id || "new";
    find("[data-preset-delete]").disabled = !active || busy;
  }
  function setBusy(value) {
    busy = value;
    for (const button of buttons) button.disabled = value;
    list.disabled = value;
    form.querySelector('button[type="submit"]').disabled = value;
    find("[data-preset-delete]").disabled = value || !active;
  }
  const discard = () => !dirty || window.confirm("Hay cambios sin guardar. \u00bfDescartarlos?");
  async function load() {
    setBusy(true);
    try {
      const loaded = await loadLivePresets();
      if (!current()) return;
      presets = loaded; renderList(); message(presets.length ? `${presets.length} tests guardados.` : "Todav\u00eda no hay tests guardados.");
    } catch (error) { message(error.message); }
    finally { if (current()) setBusy(false); }
  }
  form.addEventListener("input", event => {
    if (["title", "questionTimeLimitSeconds"].includes(event.target.name)) dirty = true;
  });
  form.addEventListener("reset", () => queueMicrotask(() => {
    if (!current()) return;
    active = null; selected.clear(); explicit.checked = false; dirty = false;
    field("liveQuestionIds").value = ""; renderList(); renderQuestions();
  }));
  list.addEventListener("change", () => {
    if (!discard()) { list.value = active?.id || "new"; return; }
    active = presets.find(p => p.id === list.value) || null;
    selected = new Set(active?.questionIds || []);
    field("title").value = active?.title || "";
    field("questionTimeLimitSeconds").value = String(active?.questionTimeLimitSeconds || 20);
    explicit.checked = !!active; dirty = false; picker.open = !!active;
    renderList(); renderQuestions(); message("");
  });
  explicit.addEventListener("change", () => { dirty = true; picker.open = explicit.checked; renderQuestions(); });
  find("[data-preset-search]").addEventListener("input", () => { shown = 50; renderQuestions(); });
  find("[data-preset-search]").addEventListener("keydown", event => { if (event.key === "Enter") event.preventDefault(); });
  find("[data-preset-questions]").addEventListener("change", event => {
    const input = event.target.closest("[data-question-id]");
    if (!input) return;
    if (input.checked && selected.size >= 100) { input.checked = false; message("El m\u00e1ximo es de 100 preguntas por test."); return; }
    if (input.checked) selected.add(input.dataset.questionId); else selected.delete(input.dataset.questionId);
    dirty = true; sync();
  });
  find("[data-preset-more]").addEventListener("click", () => { shown += 50; renderQuestions(); });
  find("[data-preset-reload]").addEventListener("click", async () => {
    if (!busy && discard()) {
      active = null; selected.clear(); explicit.checked = false; dirty = false;
      renderQuestions(); await load();
    }
  });
  find("[data-preset-save]").addEventListener("click", async () => {
    if (busy) return;
    if (!explicit.checked || !selected.size) { message("Selecciona las preguntas que quieres guardar."); explicit.checked = true; picker.open = true; renderQuestions(); return; }
    const payload = { title: field("title").value, questionIds: [...selected],
      questionTimeLimitSeconds: Number(field("questionTimeLimitSeconds").value), updatedAt: active?.updatedAt };
    setBusy(true);
    try {
      const saved = await saveLivePreset(payload, active?.id || "");
      if (!current()) return;
      presets = [...presets.filter(p => p.id !== saved.id), saved]; active = saved;
      // Keep edits made while the request was in flight marked as unsaved.
      dirty = JSON.stringify(payload.questionIds) !== JSON.stringify([...selected]) || payload.title !== field("title").value || payload.questionTimeLimitSeconds !== Number(field("questionTimeLimitSeconds").value) || !explicit.checked;
      renderList(); message(dirty ? "Test guardado. Quedan cambios nuevos sin guardar." : "Test guardado.");
    } catch (error) { message(error.message); }
    finally { if (current()) setBusy(false); }
  });
  find("[data-preset-delete]").addEventListener("click", async () => {
    if (busy || !active || !window.confirm("\u00bfEliminar este test guardado? Las salas y resultados anteriores se conservan.")) return;
    const id = active.id; setBusy(true);
    try {
      await deleteLivePreset(id);
      if (!current()) return;
      presets = presets.filter(p => p.id !== id); active = null; dirty = true;
      renderList(); message("Test eliminado de la biblioteca.");
    } catch (error) { message(error.message); }
    finally { if (current()) setBusy(false); }
  });
  renderQuestions(); await load();
}
