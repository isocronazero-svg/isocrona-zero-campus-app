import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const source = readFileSync(new URL("../public/public-live-test.js", import.meta.url), "utf8");
const lobby = { id: "room-a", code: "123456", title: "Sala A", status: "lobby", participantId: "participant-a", questions: [] };
const active = {
  ...lobby,
  status: "active",
  guided: true,
  questionCount: 2,
  currentQuestionIndex: 0,
  currentQuestionId: "q1",
  questionStartedAt: new Date(1000).toISOString(),
  questionTimeLimitSeconds: 20,
  questionDeadlineAt: new Date(21000).toISOString(),
  serverNow: new Date(1000).toISOString(),
  answered: false,
  currentAnswerIndex: null,
  questions: [{ id: "q1", prompt: "Pregunta uno", options: ["A", "B"] }]
};
const activeSecond = {
  ...active,
  currentQuestionIndex: 1,
  currentQuestionId: "q2",
  answered: false,
  currentAnswerIndex: null,
  questions: [{ id: "q2", prompt: "Pregunta dos", options: ["C", "D"] }]
};
const legacyActive = {
  ...lobby,
  status: "active",
  guided: false,
  questions: [{ id: "q1", prompt: "Pregunta", options: ["A", "B"] }]
};

function harness() {
  const timers = new Map(), intervals = new Map(), requests = [], replies = [], events = {}, elements = new Map();
  let renders = 0, markup = "", timerId = 0, now = 1000;
  const element = () => ({ listeners: {}, values: {}, disabled: false,
    addEventListener(event, callback) { this.listeners[event] = callback; },
    querySelector() { return this.button ||= { disabled: false }; }
  });
  const root = {};
  Object.defineProperty(root, "innerHTML", { set(value) {
    markup = value; renders++; elements.clear();
    for (const match of value.matchAll(/id="([^"]+)"/g)) elements.set(match[1], element());
  } });
  const document = { hidden: false,
    getElementById: id => id === "publicLiveTestApp" ? root : elements.get(id),
    addEventListener: (event, callback) => { events[event] = callback; }
  };
  const context = vm.createContext({
    document, window: { addEventListener: (event, callback) => { events[event] = callback; } },
    AbortController, encodeURIComponent,
    Date: class extends Date { static now() { return now; } },
    FormData: class { constructor(form) { this.values = form.values; } get(key) { return this.values[key] ?? null; } },
    setTimeout: (callback, ms) => { const id = ++timerId; timers.set(id, { callback, ms }); return id; },
    clearTimeout: id => timers.delete(id),
    setInterval: (callback, ms) => { const id = ++timerId; intervals.set(id, { callback, ms }); return id; },
    clearInterval: id => intervals.delete(id),
    fetch: async (url, options) => {
      requests.push({ url, options });
      assert.ok(replies.length, "Unexpected request: " + url);
      return await replies.shift()();
    }
  });
  vm.runInContext(source, context);
  const reply = (body, status = 200, retry = "") => replies.push(async () => ({
    ok: status < 400, status, headers: { get: () => retry }, json: async () => body
  }));
  return {
    document, events, timers, intervals, requests, replies, elements, reply,
    get markup() { return markup; }, get renders() { return renders; },
    advance(ms) { now += ms; },
    async join(session = lobby) {
      const form = elements.get("publicLiveJoinForm");
      form.values = { guestName: "Alumno", code: session.code };
      reply({ ok: true, liveSession: session });
      await form.listeners.submit({ preventDefault() {} });
    },
    tick() {
      const [id, timer] = [...timers.entries()].sort((a, b) => a[1].ms - b[1].ms)[0];
      timers.delete(id);
      return timer.callback();
    }
  };
}

const h = harness();
assert.equal(h.timers.size, 0);
await h.join();
assert.equal([...h.timers.values()][0].ms, 5000);
const renders = h.renders;
h.reply({ ok: true, liveSession: lobby });
await h.tick();
assert.equal(h.renders, renders, "Waiting must not replace the form or typed input");
assert.equal(h.requests.at(-1).options.method, "GET");
assert.equal(h.requests.at(-1).options.headers["X-Live-Participant"], lobby.participantId);
assert.equal(h.requests.filter(r => r.url.endsWith("/join")).length, 1, "Polling never rejoins");

h.reply({ ok: true, liveSession: active });
await h.tick();
assert.match(h.markup, /publicLiveQuestionForm/);
assert.match(h.markup, /Pregunta uno/);
assert.match(h.markup, /Tiempo:/);
assert.match(h.markup, /20 s/);
assert.equal(h.intervals.size, 1, "La pregunta activa inicia un contador visible");
assert.doesNotMatch(h.markup, /checked/, "An unanswered question must not preselect option A");
assert.equal([...h.timers.values()][0].ms, 2500, "Guided active sessions keep polling for the next question");

let form = h.elements.get("publicLiveQuestionForm");
form.values = { answerIndex: "1" };
const beforeFailure = h.renders;
h.replies.push(async () => { throw new TypeError("Failed to fetch"); });
await form.listeners.submit({ preventDefault() {} });
assert.equal(h.renders, beforeFailure, "A failed answer save must preserve the selected answer");
assert.equal(form.button.disabled, false);
assert.match(h.elements.get("publicLiveStatus").textContent, /No se pudo conectar/);

h.reply({ ok: true, liveSession: { ...active, answered: true, currentAnswerIndex: 1 } });
const answerRequestsBefore = h.requests.filter(r => r.url.endsWith("/answer")).length;
const saving = form.listeners.submit({ preventDefault() {} });
await form.listeners.submit({ preventDefault() {} });
await saving;
assert.equal(
  h.requests.filter(r => r.url.endsWith("/answer")).length,
  answerRequestsBefore + 1,
  "Double submit adds no duplicate answer request"
);
assert.match(h.markup, /Respuesta enviada/);
assert.match(h.markup, /Espera a que el administrador cierre la pregunta/);
assert.doesNotMatch(h.markup, /Puntos:/, "La puntuacion no se muestra antes del cierre");

h.reply({
  ok: true,
  liveSession: {
    ...active,
    answered: true,
    currentAnswerIndex: 1,
    questionClosed: true,
    correctIndex: 1,
    isCorrect: true,
    pointsAwarded: 142,
    score: 142,
    responseTimeMs: 3200,
    leaderboard: [
      { rank: 1, name: "Alumno", score: 142 },
      { rank: 2, name: "Rival", score: 0 }
    ],
    currentRank: { rank: 1, name: "Alumno", score: 142 }
  }
});
await h.tick();
assert.match(h.markup, /Respuesta correcta/);
assert.match(h.markup, /Tu respuesta/);
assert.match(h.markup, /Correcta/);
assert.match(h.markup, /Puntos:/);
assert.match(h.markup, /\+142/);
assert.match(h.markup, /Total:/);
assert.match(h.markup, /Clasificación provisional/);
assert.match(h.markup, /1\. Alumno/);
assert.match(h.markup, /2\. Rival/);
assert.match(h.markup, /Tu posición:/);
assert.match(h.markup, /Pregunta cerrada/);

h.reply({ ok: true, liveSession: activeSecond });
await h.tick();
assert.match(h.markup, /Pregunta dos/);
assert.match(h.markup, /Pregunta 2 de 2/);
assert.match(h.markup, /publicLiveQuestionForm/);
assert.equal([...h.timers.values()][0].ms, 2500);

h.reply({
  ok: true,
  liveSession: {
    ...activeSecond,
    status: "finished",
    finishedAt: new Date(30000).toISOString(),
    questions: [],
    questionClosed: true,
    score: 142,
    leaderboard: [
      { rank: 1, name: "Alumno", score: 142 },
      { rank: 2, name: "Rival", score: 80 },
      { rank: 3, name: "Tercero", score: 50 }
    ],
    currentRank: { rank: 1, name: "Alumno", score: 142 }
  }
});
await h.tick();
assert.match(h.markup, /Test finalizado/);
assert.match(h.markup, /Podio final/);
assert.match(h.markup, /1\. Alumno/);
assert.match(h.markup, /2\. Rival/);
assert.match(h.markup, /3\. Tercero/);
assert.match(h.markup, /Tu posición final:/);
assert.doesNotMatch(h.markup, /publicLiveQuestionForm/);
assert.equal(h.timers.size, 0, "El podio final detiene el polling");

const legacy = harness();
await legacy.join(legacyActive);
assert.match(legacy.markup, /publicLiveAttemptForm/, "A previous active session keeps the legacy full-attempt UI");
assert.equal(legacy.timers.size, 0, "Legacy active sessions do not enter guided polling");

const blocked = harness();
await blocked.join();
blocked.reply({ error: "Espera", retryAfterSeconds: 60 }, 429, "60");
await blocked.tick();
assert.equal([...blocked.timers.values()][0].ms, 60000);
const beforeManual = blocked.requests.length;
await blocked.elements.get("publicLiveRefreshButton").listeners.click();
assert.equal(blocked.requests.length, beforeManual, "Manual refresh respects Retry-After");
blocked.advance(60000);
blocked.reply({ error: "La sesion ha terminado" }, 404);
await blocked.tick();
assert.equal(blocked.timers.size, 0);
assert.doesNotMatch(blocked.markup, /publicLiveRefreshButton/);
assert.match(blocked.markup, /La sesion ha terminado/);

const visibility = harness();
await visibility.join();
visibility.document.hidden = true;
visibility.events.visibilitychange();
assert.equal(visibility.timers.size, 0);
visibility.document.hidden = false;
visibility.events.visibilitychange();
assert.equal([...visibility.timers.values()][0].ms, 0);
visibility.events.pagehide();
assert.equal(visibility.timers.size, 0);
visibility.events.pageshow();
assert.equal(visibility.timers.size, 1);

const stale = harness();
await stale.join();
let resolveOld;
stale.replies.push(() => new Promise(resolve => { resolveOld = resolve; }));
const oldRequest = stale.tick();
await stale.elements.get("publicLiveRefreshButton").listeners.click();
assert.equal(stale.requests.length, 2, "Only one poll can be in flight");
await stale.join({ ...lobby, id: "room-b", code: "654321", title: "Sala B", participantId: "participant-b" });
resolveOld({ ok: true, status: 200, json: async () => ({ liveSession: active }) });
await oldRequest;
assert.match(stale.markup, /Sala B/);
assert.doesNotMatch(stale.markup, /publicLiveAttemptForm/, "An obsolete response cannot restore the previous room");
assert.equal(stale.timers.size, 1);
console.log("Public live UI passed: lobby start, synchronized questions, scoring, provisional ranking, final podium, answer recovery, throttling, visibility and stale responses.");
