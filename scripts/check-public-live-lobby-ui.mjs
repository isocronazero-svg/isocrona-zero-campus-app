import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const source = readFileSync(new URL("../public/public-live-test.js", import.meta.url), "utf8");
const lobby = { id: "room-a", code: "123456", title: "Sala A", status: "lobby", participantId: "participant-a", questions: [] };
const active = { ...lobby, status: "active", questions: [{ id: "q1", prompt: "Pregunta", options: ["A", "B"] }] };

function harness() {
  const timers = new Map(), requests = [], replies = [], events = {}, elements = new Map();
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
    document, events, timers, requests, replies, elements, reply,
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
assert.match(h.markup, /publicLiveAttemptForm/);
assert.equal(h.timers.size, 0, "Stop polling once answering begins");

const form = h.elements.get("publicLiveAttemptForm");
form.values = { "question-0": "1" };
const beforeFailure = h.renders;
h.replies.push(async () => { throw new TypeError("Failed to fetch"); });
await form.listeners.submit({ preventDefault() {} });
assert.equal(h.renders, beforeFailure, "A failed save must preserve selected answers");
assert.equal(form.button.disabled, false);
assert.match(h.elements.get("publicLiveStatus").textContent, /No se pudo conectar/);
h.reply({ result: { title: "Sala A", score: 0, total: 1, correctCount: 0, wrongCount: 1, blankCount: 0, percentage: 0 } });
const saving = form.listeners.submit({ preventDefault() {} });
await form.listeners.submit({ preventDefault() {} });
await saving;
assert.equal(h.requests.filter(r => r.url.endsWith("/attempt")).length, 2, "Double submit adds no duplicate request");
assert.doesNotMatch(h.markup, /publicLiveAttemptForm/, "A saved attempt cannot be submitted again through the same form");
assert.match(h.markup, /Resultado guardado/);

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
console.log("Public live lobby UI passed: automatic start, throttling, visibility, stale responses and save recovery.");
