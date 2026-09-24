const blocks = ["IVASPE", "TEMARIO COMÚN", "GUADALAJARA"];
const escape = value => String(value ?? "").replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
export function topicKey(question) { return JSON.stringify([String(question.part || ""), String(question.category || "")]); }
export function matchesTopics(question, topics) {
  return !Array.isArray(topics) || topics.some(topic => topic.part === question.part && topic.category === question.category);
}
export function renderTopicPicker(questions, topics = null) {
  const parts = [...new Set([...blocks, ...questions.map(q => q.part).filter(Boolean)])];
  return `<div data-topic-picker style="grid-column:1/-1"><h4>Elige temarios y temas</h4><p class="muted">Marca un temario completo o combina temas de distintos temarios. Los números indican preguntas disponibles antes de filtrar por dificultad.</p>${parts.map(part => {
    const own = questions.filter(q => q.part === part);
    const categories = [...new Set(own.map(q => q.category))].sort();
    const selected = own.filter(q => matchesTopics(q, topics));
    return `<fieldset data-topic-group style="border:1px solid var(--line);border-radius:14px;padding:14px;margin-block:12px;min-width:0"><legend><label><input type="checkbox" data-topic-all ${own.length && selected.length === own.length ? "checked" : ""} ${own.length ? "" : "disabled"}> <strong>${escape(part)}</strong> (${own.length})</label></legend>${categories.map(category => {
      const count = own.filter(q => q.category === category).length;
      const checked = matchesTopics({ part, category }, topics);
      return `<label style="display:flex;gap:10px;align-items:center;padding:10px;border-bottom:1px solid var(--line)"><input type="checkbox" data-topic-item data-count="${count}" value="${escape(JSON.stringify([part, category]))}" ${checked ? "checked" : ""}><span>${escape(category)} <strong>(${count})</strong></span></label>`;
    }).join("") || '<p class="muted">Todavía no hay preguntas cargadas en este temario.</p>'}</fieldset>`;
  }).join("")}<p data-topic-total role="status"></p></div>`;
}
export function readTopics(form) {
  return [...form.querySelectorAll("[data-topic-item]:checked")].map(input => { const [part, category] = JSON.parse(input.value); return { part, category }; });
}
export function syncTopicPicker(root) {
  root.querySelectorAll("[data-topic-group]").forEach(group => {
    const all = group.querySelector("[data-topic-all]");
    const items = [...group.querySelectorAll("[data-topic-item]")];
    const count = items.filter(input => input.checked).length;
    all.checked = !!items.length && count === items.length;
    all.indeterminate = count > 0 && count < items.length;
  });
  const total = root.querySelector("[data-topic-total]");
  if (total) total.textContent = `${[...root.querySelectorAll("[data-topic-item]:checked")].reduce((sum, input) => sum + Number(input.dataset.count), 0)} preguntas en los temas seleccionados.`;
}
export function changeTopicPicker(target) {
  const root = target.closest?.("[data-topic-picker]");
  if (!root) return false;
  if (target.matches("[data-topic-all]")) target.closest("[data-topic-group]").querySelectorAll("[data-topic-item]").forEach(item => { item.checked = target.checked; });
  syncTopicPicker(root); return true;
}
