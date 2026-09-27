import { questionManagementPanel, bindQuestionMaintenance } from './assets/js/app/modules/tests/questionMaintenance.js';
import { loadSharedQuestions } from './assets/js/app/modules/tests/questionService.js';
const $ = id => document.getElementById(id);
const params = new URLSearchParams(location.search);
const memberMode = params.get('mode') === 'member';
if (params.get('embedded') === '1') document.body.classList.add('embedded');
let pending = null, busy = false, template = '', admin = false, page = 0, queueBusy = false;
const node = (tag, text) => { const el = document.createElement(tag); el.textContent = text; return el; };
const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
async function request(path, payload) {
  const response = await fetch(path, { method: payload === undefined ? 'GET' : 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, ...(payload === undefined ? {} : { body: JSON.stringify(payload) }), signal: AbortSignal.timeout(20000) });
  const data = await response.json().catch(() => null);
  if (!response.ok || !data?.ok) throw new Error(data?.error || 'No se pudo confirmar la respuesta. Comprueba la conexión y vuelve a intentarlo.');
  return data;
}
const api = (suffix = '', payload) => request(`/api/test-zone/import${suffix}`, payload);
function fields(q = {}) {
  const parts = [...new Set(['IVASPE', 'TEMARIO COMÚN', 'GUADALAJARA', q.part].filter(Boolean))];
  return `<div class="contribution-fields"><label class="full">Enunciado<textarea name="prompt" rows="3" maxlength="4000" required>${esc(q.prompt)}</textarea></label>
    ${[0,1,2,3].map(i => `<label>Opción ${String.fromCharCode(65+i)}<input name="option${i}" maxlength="1000" value="${esc(q.options?.[i])}" required></label>`).join('')}
    <label>Respuesta correcta<select name="correctIndex">${[0,1,2,3].map(i => `<option value="${i}" ${i === q.correctIndex ? 'selected' : ''}>${String.fromCharCode(65+i)}</option>`).join('')}</select></label>
    <label>Dificultad<select name="difficulty">${[['facil','Fácil'],['media','Media'],['dificil','Difícil']].map(([v,l]) => `<option value="${v}" ${v === (q.difficulty || 'media') ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
    <label>Bloque<select name="part">${parts.map(p => `<option ${p === q.part ? 'selected' : ''}>${esc(p)}</option>`).join('')}</select></label>
    <label>Tema<input name="category" value="${esc(q.category)}" maxlength="150" placeholder="Ej.: Incendios forestales" required></label>
    <label class="full">Explicación y fuente (recomendadas)<textarea name="explanation" rows="3" maxlength="6000" placeholder="Explica por qué es correcta e indica la fuente o referencia.">${esc(q.explanation)}</textarea></label></div>`;
}
function readQuestion(form) {
  const data = new FormData(form);
  return { prompt:data.get('prompt'), options:[0,1,2,3].map(i => data.get(`option${i}`)), correctIndex:Number(data.get('correctIndex')), part:data.get('part'), category:data.get('category'), difficulty:data.get('difficulty'), explanation:data.get('explanation') };
}
function lock(value) {
  busy = value;
  ['preview','bundled','files','part'].forEach(id => { $(id).disabled = value; });
  $('apply').disabled = value || !pending;
}
async function refreshBank() {
  const data = await api(); template = data.template; admin = data.admin && !memberMode;
  $('controls').hidden = false; $('blocks').replaceChildren();
  $('bundled-section').hidden = !admin;
  $('manual-submit').textContent = admin ? 'Publicar pregunta' : 'Enviar a revisión';
  $('apply').textContent = admin ? 'Publicar preguntas comprobadas' : 'Enviar preguntas a revisión';
  $('contributions-title').textContent = admin ? 'Aportaciones pendientes de validar' : 'Mis aportaciones';
  $('review-explanation').textContent = admin ? 'Tus preguntas se publican directamente. Las aportaciones de los socios permanecen pendientes hasta que un administrador las revise, corrija y valide.' : 'Tus preguntas quedarán pendientes. Un administrador podrá corregirlas, validarlas y publicarlas o retirarlas si no son adecuadas. Hasta 1.000 preguntas pendientes por persona.';
  data.blocks.forEach(block => {
    const card = node('article', ''); card.className = 'timeline-item';
    card.append(node('h3', `${block.part} · ${block.count} preguntas`));
    if (!block.topics.length) card.append(node('p', 'Todavía no hay preguntas en este bloque. ¡Puedes aportar las primeras!'));
    block.topics.forEach(topic => card.append(node('p', `${topic.name}: ${topic.count}`)));
    $('blocks').append(card);
  });
}
async function refreshManagement() {
  if (!admin) return;
  await loadSharedQuestions();
  $('management').hidden = false;
  $('management').innerHTML = questionManagementPanel();
  bindQuestionMaintenance($('management'), { admin:true, onQuestionsChanged:() => { void refreshBank().catch(error => { $('status').textContent = error.message; }); } });
}
async function refreshContributions() {
  if (queueBusy) return;
  queueBusy = true; $('refresh-contributions').disabled = true;
  try {
    const data = await request(`/api/test-zone/contributions?page=${page}${memberMode ? '&mode=member' : ''}`); page = data.page;
    const states = { pending:'Pendiente de revisión', approved:'Validada y publicada', rejected:'Retirada tras revisión' };
    $('contributions').innerHTML = data.items.map(item => `<article class="contribution-card" data-contribution="${esc(item.id)}"><span class="badge ${esc(item.status)}">${esc(states[item.status] || item.status)}</span>
      <p>${admin ? `Aportación de ${esc(item.author)} · ` : ''}${esc(new Date(item.createdAt).toLocaleDateString('es-ES'))}</p>
      ${admin ? `<details><summary>${esc(item.question.prompt)}</summary><form class="contribution-form" data-review-form data-id="${esc(item.id)}" data-revision="${item.revision}">${fields(item.question)}<div class="contribution-actions"><button type="submit" name="action" value="save" class="ghost-button">Guardar cambios</button><button type="submit" name="action" value="approve" class="primary-button">Validar y publicar</button><button type="submit" name="action" value="reject" class="ghost-button danger" formnovalidate>Eliminar aportación</button></div><p data-review-status role="status" aria-live="polite"></p></form></details>` : `<h3>${esc(item.question.prompt)}</h3><p>${esc(item.question.part)} · ${esc(item.question.category)}</p>${item.status === 'rejected' ? '<p>La pregunta no se ha publicado. Puedes preparar una versión corregida y volver a enviarla.</p>' : ''}`}</article>`).join('');
    $('contributions-status').textContent = data.total ? `${data.total} ${admin ? 'aportaciones pendientes' : 'aportaciones enviadas'}.` : admin ? 'No hay aportaciones pendientes. Gracias por ayudar a cuidar el banco.' : 'Todavía no has enviado preguntas. Tu primera aportación puede ayudar a muchos compañeros.';
    $('page-label').textContent = `Página ${page+1} de ${Math.max(1,Math.ceil(data.total/20))}`;
    $('previous').disabled = !page; $('next').disabled = (page+1)*20 >= data.total;
  } catch (error) { $('contributions-status').textContent = error.message; }
  finally { queueBusy = false; $('refresh-contributions').disabled = false; }
}
$('contributions').addEventListener('submit', async event => {
  event.preventDefault();
  const form = event.target.closest('[data-review-form]');
  if (!form || form.dataset.busy === 'true') return;
  const action = event.submitter?.value;
  if (!['save','approve','reject'].includes(action)) return;
  if (action === 'reject' && !confirm('¿Eliminar esta aportación pendiente? No se publicará y el socio verá que se ha retirado.')) return;
  const question = readQuestion(form), output = form.querySelector('[data-review-status]');
  form.dataset.busy = 'true'; [...form.elements].forEach(el => { el.disabled = true; });
  try {
    const result = await request(`/api/test-zone/contributions/${encodeURIComponent(form.dataset.id)}`, {action,revision:Number(form.dataset.revision),question});
    form.dataset.revision = String(result.item.revision);
    form.closest('details').querySelector('summary').textContent = result.item.question.prompt;
    output.textContent = action === 'save' ? 'Cambios guardados. Sigue pendiente de validación.' : action === 'approve' ? 'Pregunta validada y publicada.' : 'Aportación eliminada de la cola de revisión.';
    if (action !== 'save') {
      const badge = form.closest('article').querySelector('.badge'); badge.className = `badge ${result.item.status}`; badge.textContent = action === 'approve' ? 'Validada y publicada' : 'Retirada tras revisión';
      form.dataset.completed = 'true';
      $('contributions-status').textContent = 'Revisión guardada. Actualiza la lista para ver las aportaciones que quedan pendientes.';
      if (action === 'approve') { try { await refreshBank(); await refreshManagement(); } catch { output.textContent += ' Actualiza el banco para ver el cambio.'; } }
    }
  } catch (error) { output.textContent = error.message; }
  finally { form.dataset.busy = 'false'; if (form.dataset.completed !== 'true') [...form.elements].forEach(el => { el.disabled = false; }); }
});
$('manual-fields').innerHTML = fields();
$('manual-form').addEventListener('submit', async event => {
  event.preventDefault(); const form = event.currentTarget, button = $('manual-submit'); if (button.disabled) return;
  const question = readQuestion(form); [...form.elements].forEach(el => { el.disabled = true; });
  try {
    const data = await request('/api/test-zone/contributions', {question,submitForReview:!admin});
    $('manual-status').textContent = data.duplicate ? 'Esta pregunta ya está en el banco o entre tus aportaciones pendientes.' : admin ? 'Pregunta publicada. Ya está disponible para los tests.' : '¡Gracias por colaborar! Tu pregunta está pendiente de revisión.';
    form.reset(); page = 0; await refreshContributions();
    if (admin) { try { await refreshBank(); await refreshManagement(); } catch { $('manual-status').textContent += ' Actualiza el banco para ver el cambio.'; } }
  } catch (error) { $('manual-status').textContent = error.message; }
  finally { [...form.elements].forEach(el => { el.disabled = false; }); }
});
async function preview(payload) {
  if (busy) return; pending = null; lock(true);
  $('status').textContent = 'Comprobando documentos…';
  try {
    payload.submitForReview = !admin;
    const data = await api('/preview', payload);
    $('preview-panel').hidden = false; $('summary').replaceChildren(node('p', `${data.part}: ${data.ready} preguntas nuevas, ${data.duplicates} ya existentes, ${data.errors.length} errores.`));
    data.files.forEach(file => $('summary').append(node('p', `${file.file}: ${file.ready} nuevas · ${file.duplicates} duplicadas · ${file.topics.join(', ')}`)));
    data.errors.forEach(error => $('summary').append(node('p', `${error.file}${error.row ? `, fila ${error.row}` : ''}: ${error.message}`)));
    if (!data.errors.length && data.ready) pending = payload;
    $('status').textContent = data.errors.length ? 'Corrige los errores del lote. No se ha guardado ninguna pregunta.' : data.ready ? `Archivos comprobados. ${admin ? 'Pulsa Publicar preguntas comprobadas para incorporarlas al banco.' : 'Pulsa Enviar preguntas a revisión. Un administrador las validará antes de publicarlas.'}` : 'Todas estas preguntas ya están en el banco o entre tus aportaciones pendientes.';
  } catch (error) { $('status').textContent = error.message; }
  finally { lock(false); }
}
$('import-form').addEventListener('submit', async event => {
  event.preventDefault(); if (busy) return;
  const files = [...$('files').files];
  if (!files.length || files.length > 20 || files.reduce((sum,file) => sum+file.size,0) > 4*1024*1024) { $('status').textContent = 'Selecciona entre 1 y 20 CSV, con un máximo de 4 MB de archivos.'; return; }
  const part = $('part').value;
  lock(true);
  try { const payload = {part,files:await Promise.all(files.map(async file => ({name:file.name,csv:await file.text()})))}; lock(false); await preview(payload); }
  catch (error) { $('status').textContent = error.message; lock(false); }
});
$('bundled').addEventListener('click', () => preview({part:'IVASPE',bundled:true}));
for (const id of ['files','part']) $(id).addEventListener('change', () => { pending = null; $('apply').disabled = true; $('preview-panel').hidden = true; });
$('apply').addEventListener('click', async () => {
  if (busy || !pending) return; lock(true);
  try {
    const data = await api('/apply',pending); pending = null;
    $('status').textContent = data.moderationRequired ? `¡Gracias por colaborar! ${data.ready} preguntas enviadas a revisión; ${data.duplicates} duplicadas omitidas.` : `Carga guardada: ${data.ready} preguntas publicadas; ${data.duplicates} duplicadas omitidas.`;
    $('preview-panel').hidden = true; page = 0; await refreshContributions();
    try { await refreshBank(); if (admin) await refreshManagement(); } catch { $('status').textContent += ' Actualiza la página para ver los contadores.'; }
  } catch (error) { $('status').textContent = error.message; }
  finally { lock(false); }
});
$('template').addEventListener('click', () => {
  const url = URL.createObjectURL(new Blob(['\uFEFF',template],{type:'text/csv;charset=utf-8'}));
  const link = node('a',''); link.href = url; link.download = 'plantilla-preguntas.csv'; link.click(); setTimeout(() => URL.revokeObjectURL(url),1000);
});
$('refresh-contributions').onclick = refreshContributions;
$('previous').onclick = () => { if (!queueBusy && page) { page--; void refreshContributions(); } };
$('next').onclick = () => { if (!queueBusy) { page++; void refreshContributions(); } };
async function boot() {
  try { await refreshBank(); await refreshContributions(); $('status').textContent = 'Elige cómo colaborar: una pregunta o un lote CSV.'; await refreshManagement(); }
  catch (error) { $('status').textContent = `${error.message} Accede al portal con tu cuenta e inténtalo de nuevo.`; }
}
void boot();
