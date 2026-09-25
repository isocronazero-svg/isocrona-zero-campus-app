const { DatabaseSync } = require('node:sqlite');
const { randomUUID, randomInt, createHash } = require('node:crypto');
const { dbPath } = require('../storage');

const hash = value => createHash('sha256').update(value).digest('hex');
const fail = (message, statusCode = 400) => Object.assign(new Error(message), { statusCode });
const tokenPattern = /^[a-zA-Z0-9-]{32,100}$/;

function createLiveQuizHandler(deps) {
  // Separate from app_state: editing a course or refreshing the portal cannot overwrite a live answer.
  const db = new DatabaseSync(dbPath);
  db.exec(`PRAGMA busy_timeout=5000; CREATE TABLE IF NOT EXISTS live_quizzes (
    id TEXT PRIMARY KEY, code TEXT UNIQUE NOT NULL, owner_id TEXT NOT NULL,
    request_id TEXT NOT NULL, value TEXT NOT NULL, UNIQUE(owner_id, request_id)
  );`);
  const save = session => db.prepare('UPDATE live_quizzes SET value=? WHERE id=?').run(JSON.stringify(session), session.id);
  const read = (key, byCode = false) => {
    const row = db.prepare(`SELECT value FROM live_quizzes WHERE ${byCode ? 'code' : 'id'}=?`).get(key);
    if (!row) throw fail('No existe una sesión en vivo con ese código.', 404);
    return JSON.parse(row.value);
  };
  const transaction = fn => {
    db.exec('BEGIN IMMEDIATE');
    try { const result = fn(); db.exec('COMMIT'); return result; }
    catch (error) { db.exec('ROLLBACK'); throw error; }
  };
  function reconcile(session) {
    if (session.phase !== 'finished' && Date.now() >= session.expiresAt) {
      session.phase = 'finished'; session.expired = true; session.revision++; session.finishedAt = Date.now(); save(session);
    } else if (session.phase === 'question' && Date.now() >= session.deadline) {
      session.phase = 'reveal'; session.revision++; save(session);
    }
  }
  function rankings(session) {
    return session.players.map(player => {
      const answers = Object.values(player.answers);
      return { id: player.id, name: player.name, score: answers.reduce((sum, answer) => sum + answer.points, 0),
        correct: answers.filter(answer => answer.correct).length, answered: answers.length, joinedAt: player.joinedAt };
    }).sort((a, b) => b.score - a.score || b.correct - a.correct || a.joinedAt - b.joinedAt)
      .map((player, index) => ({ ...player, rank: index + 1 }));
  }
  function audience(session, player = null, host = false) {
    const question = session.questions[session.index];
    const revealed = ['reveal', 'finished'].includes(session.phase);
    const answer = question && player?.answers[question.id];
    const leaderboard = rankings(session);
    const counts = question ? question.options.map((_, optionIndex) => session.players.filter(p => p.answers[question.id]?.selectedIndex === optionIndex).length) : [];
    return {
      id: session.id, code: session.code, title: session.title, courseId: session.courseId,
      phase: session.phase, revision: session.revision, index: session.index, total: session.questions.length,
      seconds: session.seconds, deadline: session.deadline, serverNow: Date.now(), expired: Boolean(session.expired),
      playersCount: session.players.length, answersCount: counts.reduce((a, b) => a + b, 0),
      createdAt: session.createdAt, finishedAt: session.finishedAt || null,
      question: question && session.phase !== 'finished' ? {
        id: question.id, prompt: question.prompt, options: question.options,
        ...(revealed ? { correctIndex: question.correctIndex, explanation: question.explanation || '', counts } : {})
      } : null,
      // No correctness, points or rankings while answers are still being collected.
      leaderboard: revealed || session.phase === 'lobby' ? leaderboard : [],
      player: player ? { id: player.id, name: player.name, answered: Boolean(answer), selectedIndex: answer?.selectedIndex ?? null,
        ...(revealed ? { answer: answer ? { correct: answer.correct, points: answer.points } : null,
          score: leaderboard.find(item => item.id === player.id)?.score || 0 } : {}) } : null,
      ...(host ? { players: session.players.map(p => ({ id: p.id, name: p.name, answered: Boolean(question && p.answers[question.id]) })) } : {})
    };
  }
  function identify(session, req, body) {
    const token = String(req.headers['x-live-token'] || body?.participantToken || '');
    if (!tokenPattern.test(token)) throw fail('Vuelve a entrar con tu nombre y el código.', 401);
    const player = session.players.find(item => item.tokenHash === hash(token));
    if (!player) throw fail('Este acceso no pertenece a la sesión.', 403);
    return player;
  }
  function buildSession(state, account, body) {
    if (!tokenPattern.test(String(body.requestId || ''))) throw fail('No se pudo identificar la solicitud. Recarga la página.');
    const count = Number(body.questionCount ?? 20), seconds = Number(body.seconds ?? 20);
    if (!Number.isInteger(count) || count < 1 || count > 100) throw fail('Elige entre 1 y 100 preguntas.');
    if (!Number.isInteger(seconds) || seconds < 5 || seconds > 120) throw fail('El tiempo debe estar entre 5 y 120 segundos.');
    const existing = db.prepare('SELECT value FROM live_quizzes WHERE owner_id=? AND request_id=?').get(account.id, body.requestId);
    if (existing) return JSON.parse(existing.value);
    const selected = deps.selectQuestions(state, body);
    const questions = selected.map(q => ({ id: q.id, prompt: q.prompt, options: q.options, correctIndex: q.correctIndex, explanation: q.explanation || '' }));
    if (!questions.length) throw fail('No hay preguntas para esta selección.');
    if (questions.length > 200) throw fail('Selecciona un máximo de 200 preguntas para el curso.');
    let code;
    do { code = String(randomInt(100000, 1000000)); }
    while (db.prepare('SELECT id FROM live_quizzes WHERE code=?').get(code) || (state.testZoneLiveSessions || []).some(item => item.code === code));
    const session = { id: randomUUID(), code, title: String(body.title || 'Test en vivo').trim().slice(0, 150) || 'Test en vivo',
      courseId: String(body.courseId || ''), ownerId: account.id, requestId: body.requestId,
      questions, players: [], phase: 'lobby', revision: 0, index: -1, seconds, deadline: null,
      createdAt: Date.now(), expiresAt: Date.now() + 24 * 60 * 60 * 1000 };
    db.prepare('INSERT INTO live_quizzes(id,code,owner_id,request_id,value) VALUES(?,?,?,?,?)')
      .run(session.id, session.code, account.id, body.requestId, JSON.stringify(session));
    return session;
  }
  function hostAction(session, body) {
    if (body.revision !== session.revision) throw fail('La sesión ha avanzado. Se actualizará la pantalla.', 409);
    const action = body.action;
    if (action === 'finish') {
      if (session.phase === 'finished') return;
      session.phase = 'finished'; session.finishedAt = Date.now();
    } else if (action === 'start' && session.phase === 'lobby') {
      if (!session.players.length) throw fail('Espera a que entre al menos un participante.');
      session.index = 0; session.phase = 'question'; session.deadline = Date.now() + session.seconds * 1000;
    } else if (action === 'reveal' && session.phase === 'question') {
      session.phase = 'reveal';
    } else if (action === 'next' && session.phase === 'reveal') {
      if (session.index + 1 >= session.questions.length) { session.phase = 'finished'; session.finishedAt = Date.now(); }
      else { session.index++; session.phase = 'question'; session.deadline = Date.now() + session.seconds * 1000; }
    } else throw fail('Esta acción no está disponible ahora.', 409);
    session.revision++; save(session);
  }
  return async function handle(req, res, url) {
    if (!url.pathname.startsWith('/api/live-quiz')) return false;
    const send = (status, body) => { deps.sendJson(res, status, body); return true; };
    try {
      const match = url.pathname.match(/^\/api\/live-quiz(?:\/([^/]+)(?:\/(host|action|answer))?)?$/);
      if (!match) return send(404, { ok: false, error: 'Ruta no encontrada.' });
      const [, id, operation] = match;
      const join = id === 'join' && !operation;
      const host = !id || operation === 'host' || operation === 'action';
      if (!['GET', 'POST'].includes(req.method) || (join && req.method !== 'POST') ||
        (operation === 'host' && req.method !== 'GET') ||
        (['action', 'answer'].includes(operation) && req.method !== 'POST') ||
        (id && !join && !operation && req.method !== 'GET')) return send(405, { ok: false, error: 'Método no permitido.' });
      if (req.method === 'POST') {
        const origin = req.headers.origin;
        if (origin && origin !== new URL(process.env.IZ_BASE_URL || `http://${req.headers.host}`).origin && origin !== `http://${req.headers.host}`) {
          return send(403, { ok: false, error: 'Origen no permitido.' });
        }
      }
      // Await the body before reading state and entering the synchronous transaction.
      const body = req.method === 'POST' ? await deps.readJsonBody(req, 16 * 1024) : {};
      let account;
      let state;
      if (host) {
        state = deps.readState(); account = deps.requireAdminAccount(req, res, state);
        if (!account) return true;
      }
      if (join && deps.enforceRateLimit(res, `live-quiz-join:${deps.getClientIp(req)}`, 300, 60000)) return true;
      if (!id && req.method === 'GET') {
        const sessions = transaction(() => db.prepare('SELECT value FROM live_quizzes ORDER BY rowid DESC LIMIT 50').all().map(row => {
          const session = JSON.parse(row.value); reconcile(session);
          return { id: session.id, code: session.code, title: session.title, phase: session.phase, total: session.questions.length, playersCount: session.players.length };
        }));
        return send(200, { ok: true, sessions });
      }
      const result = transaction(() => {
        if (!id) return { session: audience(buildSession(state, account, body), null, true) };
        const session = read(join ? String(body.code || '').trim() : id, join);
        reconcile(session);
        if (host) {
          if (operation === 'action') hostAction(session, body);
          return { session: audience(session, null, true) };
        }
        if (join) {
          const token = String(body.participantToken || ''), name = String(body.guestName || '').trim().slice(0, 60);
          if (!tokenPattern.test(token) || !name) throw fail('Indica tu nombre y vuelve a intentarlo.');
          let player = session.players.find(item => item.tokenHash === hash(token));
          if (!player) {
            if (session.phase === 'finished') throw fail('La sesión ya ha finalizado.', 410);
            if (session.players.length >= 200) throw fail('La sala está completa (200 participantes).', 409);
            if (session.players.some(p => p.name.toLocaleLowerCase('es') === name.toLocaleLowerCase('es'))) throw fail('Ese nombre ya está en la sala. Añade tu apellido.', 409);
            player = { id: randomUUID(), name, tokenHash: hash(token), joinedAt: Date.now(), answers: {} };
            session.players.push(player); save(session);
          }
          return { session: audience(session, player) };
        }
        const player = identify(session, req, body);
        if (operation === 'answer') {
          const question = session.questions[session.index];
          const existing = player.answers[String(body.questionId || '')];
          if (existing) {
            if (existing.selectedIndex !== body.selectedIndex) throw fail('Tu respuesta ya está guardada y no se puede cambiar.', 409);
            return { session: audience(session, player), accepted: true };
          }
          if (session.phase !== 'question' || !question || body.questionId !== question.id || Date.now() >= session.deadline) throw fail('El tiempo de esta pregunta ha terminado.', 409);
          if (!Number.isInteger(body.selectedIndex) || body.selectedIndex < 0 || body.selectedIndex >= question.options.length) throw fail('Selecciona una respuesta válida.');
          const correct = body.selectedIndex === question.correctIndex;
          const points = correct ? 500 + Math.round(500 * Math.min(1, Math.max(0, (session.deadline - Date.now()) / (session.seconds * 1000)))) : 0;
          player.answers[question.id] = { selectedIndex: body.selectedIndex, correct, points, submittedAt: Date.now() };
          save(session);
          return { session: audience(session, player), accepted: true };
        }
        return { session: audience(session, player) };
      });
      return send(req.method === 'POST' && !id ? 201 : 200, { ok: true, ...result });
    } catch (error) {
      return send(error.statusCode || 400, { ok: false, error: error.message || 'No se pudo completar la operación.' });
    }
  };
}
module.exports = { createLiveQuizHandler };
