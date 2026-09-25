const root = document.getElementById('liveApp');
const notice = document.getElementById('notice');
const host = document.body.dataset.liveRole === 'host';
const params = new URLSearchParams(location.search);
let session = null, busy = false, timer, clockOffset = 0, polling = false, sequence = 0, appliedSequence = 0;
let sessionId = host ? params.get('session') || '' : '';
let identity = null, pending = null, questions = [];
const createRequestId = crypto.randomUUID();
const labels = { lobby: 'Sala de espera', question: 'Pregunta abierta', reveal: 'Corrección y clasificación', finished: 'Sesión finalizada' };
const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const status = (message = '', error = false) => { notice.textContent = message; notice.classList.toggle('error', error); };
const storageKey = 'iz-live-quiz-participant';
function saveIdentity() { try { sessionStorage.setItem(storageKey, JSON.stringify({ ...identity, pending })); } catch { /* The current tab remains usable without storage. */ } }
function loadIdentity() { try { return JSON.parse(sessionStorage.getItem(storageKey) || 'null'); } catch { return null; } }
async function request(path, body, token = '') {
  const started = Date.now();
  const response = await fetch(path, { method: body === undefined ? 'GET' : 'POST', credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json', ...(token ? { 'X-Live-Token': token } : {}) },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }), signal: AbortSignal.timeout(12000) });
  const payload = await response.json().catch(() => null);
  if (!response.ok || payload?.ok !== true) {
    const error = new Error(payload?.error || 'No se pudo confirmar la respuesta del servidor. Comprueba la conexión.');
    error.status = response.status; throw error;
  }
  if (payload.session) clockOffset = payload.session.serverNow - (started + Date.now()) / 2;
  return payload;
}
function apply(payload, seq) {
  if (seq < appliedSequence || !payload.session) return;
  const previousView = JSON.stringify({ ...session, serverNow: 0 });
  appliedSequence = seq; session = payload.session; sessionId = session.id;
  if (!host && pending && (session.player?.answered || session.question?.id !== pending.questionId || session.phase !== 'question')) {
    pending = null; saveIdentity();
  }
  if (previousView !== JSON.stringify({ ...session, serverNow: 0 })) renderSession();
  else tick();
}
function rankMarkup() {
  if (!session.leaderboard.length) return '<p class="empty">La clasificación aparece al cerrar la pregunta.</p>';
  return `<ol class="rank">${session.leaderboard.map(p => `<li class="${p.id === session.player?.id ? 'me' : ''}"><span class="place">${p.rank}</span><span class="name">${esc(p.name)}${p.id === session.player?.id ? ' · Tú' : ''}</span><strong>${p.score} <small>pts</small></strong></li>`).join('')}</ol>`;
}
function questionMarkup() {
  const q = session.question;
  if (!q) return '';
  const reveal = session.phase === 'reveal';
  const disabled = host || reveal || session.player?.answered || pending || busy;
  return `<div class="row between"><p class="kicker">Pregunta ${session.index + 1} de ${session.total}</p><span class="counter" id="countdown" aria-label="Segundos restantes"></span></div>
    <div class="progress" aria-hidden="true"><i id="timebar"></i></div><h2>${esc(q.prompt)}</h2>
    <div class="options">${q.options.map((option, index) => `<button type="button" class="option ${session.player?.selectedIndex === index || pending?.selectedIndex === index ? 'selected' : ''} ${reveal && q.correctIndex === index ? 'correct' : ''}" data-answer="${index}" ${disabled ? 'disabled' : ''}>
      <b>${String.fromCharCode(65 + index)}</b><span>${esc(option)}${reveal ? `<br><small>${q.counts[index]} respuesta(s)${q.correctIndex === index ? ' · Correcta' : ''}</small>` : ''}</span></button>`).join('')}</div>
    ${reveal && q.explanation ? `<p class="explanation">${esc(q.explanation)}</p>` : ''}
    ${!host ? reveal ? `<p class="result">${session.player?.answer ? session.player.answer.correct ? `¡Correcta! +${session.player.answer.points} puntos` : 'Esta vez no. La respuesta correcta está marcada arriba.' : 'No respondiste a esta pregunta.'}</p>`
      : session.player?.answered ? '<p class="result">Respuesta guardada. Espera a la corrección.</p>'
      : pending ? '<p class="status">Confirmando tu respuesta…</p><button type="button" data-retry-answer>Reintentar la misma respuesta</button>'
      : '<p class="muted" style="margin-top:1rem">Elige una respuesta. Una vez enviada, no se puede cambiar.</p>' : ''}`;
}
function renderSession() {
  const focusedAction = document.activeElement?.getAttribute("data-host-action");
  const lobby = session.phase === 'lobby', finished = session.phase === 'finished';
  const joinUrl = `${location.origin}/play-live.html?code=${encodeURIComponent(session.code)}`;
  root.innerHTML = `<div class="row between" style="margin-bottom:1rem"><div><p class="kicker">${esc(labels[session.phase])}</p><h1>${esc(session.title)}</h1></div><span class="pill">${esc(session.code)} · ${session.playersCount} participantes</span></div>
    <div class="grid"><section class="card">
      ${lobby ? `<p>${host ? 'Comparte este código y espera a que entren los participantes.' : `Hola, ${esc(session.player?.name)}. Ya estás en la sala.`}</p><div class="pin">${esc(session.code)}</div>
        <p>${host ? `<a class="link" href="${esc(joinUrl)}" target="_blank" rel="noopener">${esc(joinUrl)}</a>` : 'El profesor iniciará la primera pregunta. Esta pantalla se actualiza sola.'}</p>
        <p class="muted">${session.total} preguntas · ${session.seconds} segundos por pregunta · Hasta 1.000 puntos por acierto, según rapidez.</p>
        ${host ? '<div class="actions"><button type="button" data-copy>Copiar enlace</button><button type="button" class="secondary" data-fullscreen>Pantalla completa</button></div>' : ''}`
      : finished ? `<div class="result"><p class="kicker">${session.expired ? 'La sala ha caducado' : 'Resultado final'}</p><h2>${session.leaderboard[0] ? `1.º ${esc(session.leaderboard[0].name)}` : 'Sesión finalizada'}</h2>
        <strong>${session.leaderboard[0]?.score || 0} pts</strong>${session.player ? `<p>Tu puntuación: <b>${session.player.score}</b> puntos.</p>` : ''}<p>Los resultados de esta partida quedan guardados.</p></div>
        <div class="actions">${host ? '<button type="button" data-export>Descargar clasificación CSV</button><a class="button secondary" href="/live-host.html">Crear otra sesión</a>' : '<button type="button" data-leave>Entrar a otra sesión</button>'}</div>`
      : questionMarkup()}
      ${host && !finished ? `<div class="actions">
        ${lobby ? '<button type="button" data-host-action="start">Iniciar test</button>' : session.phase === 'question' ? '<button type="button" data-host-action="reveal">Cerrar pregunta y mostrar resultados</button>' : `<button type="button" data-host-action="next">${session.index + 1 >= session.total ? 'Ver resultado final' : 'Siguiente pregunta'}</button>`}
        <button type="button" class="secondary" data-host-action="finish">Finalizar sesión</button></div>` : ''}
    </section><aside class="card"><h2>${lobby ? 'En la sala' : 'Clasificación'}</h2>${rankMarkup()}
      ${host && session.phase === 'question' ? `<p class="status">${session.answersCount} de ${session.playersCount} respuestas recibidas</p><div class="people">${session.players.map(p => `<span class="pill">${esc(p.name)}${p.answered ? ' ✓' : ''}</span>`).join('')}</div>` : ''}
      ${!host && !finished ? '<div class="actions"><button type="button" class="secondary" data-leave>Salir de esta pantalla</button></div>' : ''}</aside></div>`;
  root.querySelectorAll('[data-host-action], [data-retry-answer]').forEach(button => { button.disabled = busy; });
  if (focusedAction) root.querySelector(`[data-host-action="${focusedAction}"]`)?.focus({ preventScroll: true });
  tick();
}
function tick() {
  if (!session) return;
  const left = session.phase === 'question' ? Math.max(0, session.deadline - Date.now() - clockOffset) : 0;
  const counter = document.getElementById('countdown'), bar = document.getElementById('timebar');
  if (counter) counter.textContent = session.phase === 'reveal' ? 'Cerrada' : `${Math.ceil(left / 1000)} s`;
  if (bar) bar.style.width = `${Math.min(100, 100 * left / (session.seconds * 1000))}%`;
  if (!left) root.querySelectorAll('[data-answer]').forEach(button => { button.disabled = true; });
}
async function poll() {
  if (!sessionId || busy || polling || document.hidden || session?.phase === 'finished') return;
  polling = true; const seq = ++sequence;
  try {
    apply(await request(`/api/live-quiz/${encodeURIComponent(sessionId)}${host ? '/host' : ''}`, undefined, identity?.token), seq);
    if (notice.dataset.connectionError === 'true') { status(); delete notice.dataset.connectionError; }
  } catch (error) {
    if (!session) root.innerHTML = '<section class="card"><p>No se pudo abrir la sala.</p><a class="button secondary" href="/index.html">Volver al portal</a></section>';
    notice.dataset.connectionError = 'true';
    status(error.status === 401 || error.status === 403 ? 'Tu acceso ha caducado. Vuelve a entrar desde el portal.' : 'Conexión interrumpida. Intentando recuperar la sesión; tus respuestas confirmadas siguen guardadas.', true);
  } finally { polling = false; }
}
async function sendAnswer() {
  if (busy || !pending) return;
  busy = true; renderSession(); const seq = ++sequence;
  try { apply(await request(`/api/live-quiz/${session.id}/answer`, pending, identity.token), seq); status(); }
  catch (error) { status(error.message || 'No se pudo confirmar la respuesta. Reintenta la misma opción.', true); }
  finally { busy = false; renderSession(); }
}
root.addEventListener('click', async event => {
  const button = event.target.closest('button');
  if (!button || busy) return;
  if (button.hasAttribute('data-answer')) {
    pending = { questionId: session.question.id, selectedIndex: Number(button.dataset.answer) }; saveIdentity(); await sendAnswer();
  } else if (button.hasAttribute('data-retry-answer')) await sendAnswer();
  else if (button.dataset.hostAction) {
    if (button.dataset.hostAction === 'finish' && !confirm('¿Finalizar esta sesión y mostrar los resultados?')) return;
    const body = { action: button.dataset.hostAction, revision: session.revision };
    busy = true; renderSession(); const seq = ++sequence;
    try { apply(await request(`/api/live-quiz/${session.id}/action`, body), seq); status(); }
    catch (error) { status(error.message || 'No se pudo confirmar el cambio. La sesión se actualizará.', true); }
    finally { busy = false; renderSession(); await poll(); }
  } else if (button.hasAttribute('data-copy')) {
    try { await navigator.clipboard.writeText(`${location.origin}/play-live.html?code=${session.code}`); status('Enlace copiado.'); }
    catch { status('Puedes copiar el enlace que aparece debajo del código.'); }
  } else if (button.hasAttribute('data-fullscreen')) {
    try { await document.documentElement.requestFullscreen(); } catch { status('Este dispositivo no permite pantalla completa.'); }
  } else if (button.hasAttribute('data-export')) {
    const csvCell = value => `"${String(value).replace(/^[=+@-]/, "'$&").replaceAll('"', '""')}"`;
    const rows = [['Puesto','Participante','Puntos','Aciertos','Respondidas','Preguntas'], ...session.leaderboard.map(p => [p.rank,p.name,p.score,p.correct,p.answered,session.total])];
    const url = URL.createObjectURL(new Blob(['\ufeff' + rows.map(row => row.map(csvCell).join(';')).join('\r\n')], {type:'text/csv;charset=utf-8'}));
    const link = document.createElement('a'); link.href = url; link.download = `clasificacion-${session.code}.csv`; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  } else if (button.hasAttribute('data-leave')) { sessionId = ''; session = null; pending = null; identity = null; try { sessionStorage.removeItem(storageKey); } catch {} location.href = '/play-live.html'; }
});
function joinMarkup(code = '', name = '') {
  root.innerHTML = `<section class="card join"><p class="kicker">Acceso de participantes</p><h1>Entra en la sala</h1><p class="muted">Solo necesitas tu nombre y el código del profesor.</p><form id="joinQuiz" class="fields"><label>Tu nombre<input name="guestName" required maxlength="60" autocomplete="nickname" value="${esc(name)}"></label><label>Código de 6 cifras<input name="code" inputmode="numeric" pattern="[0-9]{6}" maxlength="6" required value="${esc(code)}"></label><button type="submit">Entrar al test</button></form><p class="muted" style="margin-top:1rem">¿Te han dado un test para responder a tu ritmo? <a href="/public-live-test.html">Abrir ese acceso</a>.</p></section>`;
}
async function showCreate() {
  const [bank, history] = await Promise.all([request('/api/test-zone/questions'), request('/api/live-quiz')]);
  questions = bank.questions || [];
  const parts = [...new Set(questions.map(q => q.part))].filter(Boolean).sort();
  const courseId = params.get('courseId') || '';
  root.innerHTML = `<div class="grid"><section class="card"><p class="kicker">Profesor · Test en vivo</p><h1>Prepara la sala</h1><p class="muted">Todos responden a la misma pregunta. Tú marcas el ritmo entre preguntas.</p>
    <form id="createQuiz" class="fields"><label class="full">Título<input name="title" maxlength="150" placeholder="Ej.: Repaso de incendios estructurales" required></label>
      ${courseId ? '<p class="full status">Se usarán las preguntas guardadas en el test del curso.</p>' : `<label>Bloque<select name="part"><option value="all">Todos los bloques</option>${parts.map(p => `<option>${esc(p)}</option>`).join('')}</select></label><label>Tema<select name="category"><option value="all">Todos los temas</option></select></label><label>Preguntas<input name="questionCount" type="number" min="1" max="100" value="20" required></label>`}
      <label>Segundos por pregunta<select name="seconds">${[10,15,20,30,45,60,90,120].map(n => `<option value="${n}" ${n === 20 ? 'selected' : ''}>${n} segundos</option>`).join('')}</select></label>
      <p class="full muted" id="available"></p><button type="submit" class="full">Crear sala y mostrar código</button></form></section>
      <aside class="card session-list"><h2>Sesiones recientes</h2>${history.sessions.map(s => `<a href="/live-host.html?session=${encodeURIComponent(s.id)}"><strong>${esc(s.title)}</strong><br>${esc(s.code)} · ${esc(labels[s.phase])} · ${s.playersCount} participantes</a>`).join('') || '<p class="muted">Todavía no hay partidas.</p>'}</aside></div>`;
  function updateTopics() {
    const part = root.querySelector('[name=part]')?.value || 'all';
    const select = root.querySelector('[name=category]');
    if (select) select.innerHTML = '<option value="all">Todos los temas</option>' + [...new Set(questions.filter(q => part === 'all' || q.part === part).map(q => q.category))].filter(Boolean).sort().map(c => `<option>${esc(c)}</option>`).join('');
    updateCount();
  }
  function updateCount() {
    const part = root.querySelector('[name=part]')?.value || 'all', category = root.querySelector('[name=category]')?.value || 'all';
    document.getElementById('available').textContent = courseId ? 'Puedes volver al curso para editar la selección antes de crear la sala.' : `${questions.filter(q => (part === 'all' || q.part === part) && (category === 'all' || q.category === category)).length} preguntas disponibles. Se eligen al azar hasta la cantidad indicada.`;
  }
  root.querySelector('[name=part]')?.addEventListener('change', updateTopics);
  root.querySelector('[name=category]')?.addEventListener('change', updateCount); updateTopics();
}
root.addEventListener('submit', async event => {
  event.preventDefault(); if (busy) return;
  const form = event.target, data = new FormData(form), controls = [...form.elements];
  busy = true; controls.forEach(c => { c.disabled = true; }); status('Conectando…');
  try {
    const seq = ++sequence;
    if (form.id === 'joinQuiz') {
      const code = String(data.get('code')).trim(), name = String(data.get('guestName')).trim();
      if (!identity || identity.code !== code) identity = { code, name, token: crypto.randomUUID() };
      saveIdentity();
      const result = await request('/api/live-quiz/join', {code,guestName:name,participantToken:identity.token});
      identity.sessionId = result.session.id; identity.name = result.session.player.name; saveIdentity(); apply(result, seq);
    } else if (form.id === 'createQuiz') {
      const result = await request('/api/live-quiz', { requestId:createRequestId, title:data.get('title'), seconds:Number(data.get('seconds')),
        courseId:params.get('courseId') || '', questionCount:Number(data.get('questionCount') || 20), filters:{part:data.get('part') || 'all',category:data.get('category') || 'all'} });
      history.replaceState(null, '', `/live-host.html?session=${encodeURIComponent(result.session.id)}`); apply(result, seq);
    }
    status();
  } catch (error) { status(error.status === 401 ? 'Inicia sesión como administrador en el portal y vuelve aquí.' : error.message || 'No se pudo conectar. Puedes volver a intentarlo.', true); }
  finally { busy = false; controls.forEach(c => { c.disabled = false; }); if (session) renderSession(); }
});
async function boot() {
  try {
    if (host) { if (sessionId) await poll(); else await showCreate(); }
    else {
      const saved = loadIdentity(), code = params.get('code') || saved?.code || '';
      if (saved?.sessionId && (!params.get('code') || saved.code === params.get('code'))) {
        identity = saved; pending = saved.pending || null; sessionId = saved.sessionId;
        const seq = ++sequence;
        try { apply(await request(`/api/live-quiz/${sessionId}`, undefined, identity.token), seq); }
        catch { sessionId = ''; joinMarkup(code, saved.name); status('Vuelve a entrar para recuperar la sesión.', true); }
      } else joinMarkup(code);
    }
  } catch (error) { status(error.status === 401 || error.status === 403 ? 'Inicia sesión como administrador en el portal para dirigir el test.' : error.message, true); root.innerHTML = '<section class="card"><a class="button" href="/index.html">Abrir el portal</a><button type="button" class="secondary" onclick="location.reload()">Reintentar</button></section>'; }
  timer = setInterval(tick, 200); setInterval(poll, 1000);
}
document.addEventListener('visibilitychange', () => { if (!document.hidden) poll(); });
window.addEventListener('online', poll);
boot();
