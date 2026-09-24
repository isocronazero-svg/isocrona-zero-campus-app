const $ = id => document.getElementById(id);
let pending = null, busy = false, template = "";
const node = (tag, text) => { const el = document.createElement(tag); el.textContent = text; return el; };
async function api(suffix = "", payload) {
  const response = await fetch(`/api/test-zone/import${suffix}`, { method: payload ? "POST" : "GET", headers: { "Content-Type": "application/json" }, ...(payload ? { body: JSON.stringify(payload) } : {}) });
  const data = await response.json().catch(() => null);
  if (!response.ok || !data?.ok) throw new Error(data?.error || "No se pudo confirmar la respuesta. Puedes repetir la carga: las preguntas existentes no se duplican.");
  return data;
}
function lock(value) {
  busy = value;
  ["preview", "bundled", "files", "part"].forEach(id => { $(id).disabled = value; });
  $("apply").disabled = value || !pending;
}
async function refresh() {
  const data = await api(); template = data.template;
  $("controls").hidden = false; $("blocks").replaceChildren();
  data.blocks.forEach(block => {
    const card = node("article", ""); card.className = "timeline-item";
    card.append(node("h3", `${block.part} · ${block.count} preguntas`));
    if (!block.topics.length) card.append(node("p", "Sin preguntas todavía. Puedes cargar los documentos de este bloque arriba."));
    block.topics.forEach(topic => card.append(node("p", `${topic.name}: ${topic.count}`)));
    $("blocks").append(card);
  });
}
async function preview(payload) {
  if (busy) return; pending = null; lock(true);
  $("status").textContent = "Revisando documentos…";
  try {
    const data = await api("/preview", payload);
    $("preview-panel").hidden = false; $("summary").replaceChildren(node("p", `${data.part}: ${data.ready} preguntas nuevas, ${data.duplicates} ya existentes, ${data.errors.length} errores.`));
    data.files.forEach(file => $("summary").append(node("p", `${file.file}: ${file.ready} nuevas · ${file.duplicates} duplicadas · ${file.topics.join(", ")}`)));
    data.errors.forEach(error => $("summary").append(node("p", `${error.file}${error.row ? `, fila ${error.row}` : ""}: ${error.message}`)));
    if (!data.errors.length && data.ready) pending = payload;
    $("status").textContent = data.errors.length ? "Corrige los errores del lote antes de importarlo. No se ha guardado nada." : data.ready ? "Revisión terminada. Pulsa Importar preguntas revisadas para guardarlas." : "Todas estas preguntas ya están en el banco.";
  } catch (error) { $("status").textContent = error.message; }
  finally { lock(false); }
}
$("import-form").addEventListener("submit", async event => {
  event.preventDefault(); if (busy) return;
  const files = [...$("files").files];
  if (!files.length || files.length > 20 || files.reduce((sum, file) => sum + file.size, 0) > 4 * 1024 * 1024) {
    $("status").textContent = "Selecciona entre 1 y 20 CSV, con un máximo de 4 MB de archivos (5 MB al enviarlos)."; return;
  }
  const part = $("part").value;
  try { await preview({ part, files: await Promise.all(files.map(async file => ({ name: file.name, csv: await file.text() }))) }); }
  catch (error) { $("status").textContent = error.message; }
});
$("bundled").addEventListener("click", () => preview({ part: "IVASPE", bundled: true }));
for (const id of ["files", "part"]) $(id).addEventListener("change", () => { pending = null; $("apply").disabled = true; $("preview-panel").hidden = true; });
$("apply").addEventListener("click", async () => {
  if (busy || !pending) return; lock(true);
  try {
    const data = await api("/apply", pending); pending = null;
    $("status").textContent = `Carga guardada: ${data.ready} preguntas nuevas; ${data.duplicates} duplicadas omitidas.`;
    $("preview-panel").hidden = true;
    try { await refresh(); } catch { $("status").textContent += " Recarga esta página para actualizar los contadores."; }
  } catch (error) { $("status").textContent = error.message; }
  finally { lock(false); }
});
$("template").addEventListener("click", () => {
  const url = URL.createObjectURL(new Blob(["\uFEFF", template], { type: "text/csv;charset=utf-8" }));
  const link = node("a", ""); link.href = url; link.download = "plantilla-preguntas.csv"; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
});
refresh().then(() => { $("status").textContent = "Banco cargado. Elige un bloque para importar sus preguntas."; }).catch(error => { $("status").textContent = error.message + " Entra como administrador en el portal."; });
