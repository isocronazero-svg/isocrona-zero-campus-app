import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const source = readFileSync(new URL('../public/assets/js/app/modules/tests/publicLiveHost.js', import.meta.url), 'utf8');
function harness() {
  const timers = new Map(), clocks = new Map(), events = {}, requests = [], replies = [];
  let id = 0, generation = 0, html = '', renders = 0, now = 1000;
  const form = { value: 'Borrador sin guardar', focused: true };
  const status = { textContent: '' };
  const countdown = { dataset: { deadline: new Date(11000).toISOString(), serverNow: new Date(1000).toISOString(), receivedAt: '1000' }, textContent: '' };
  const list = {
    isConnected: true,
    contains: node => node?.inList === true,
    querySelectorAll: selector => selector.includes('countdown') ? [countdown] : [],
    get innerHTML() { return html; }, set innerHTML(value) { html = value; renders++; }
  };
  const container = { querySelector: selector => selector === '[data-live-host-list]' ? list : status };
  const document = { hidden: false, activeElement: form,
    addEventListener: (name, cb) => { events[name] = cb; }, removeEventListener: name => { delete events[name]; } };
  const window = { addEventListener: (name, cb) => { events[name] = cb; }, removeEventListener: name => { delete events[name]; } };
  const context = vm.createContext({ document, window, AbortController,
    Date: class extends Date { static now() { return now; } },
    setTimeout: (cb, ms) => { const next = ++id; timers.set(next, { cb, ms }); return next; },
    clearTimeout: key => timers.delete(key),
    setInterval: cb => { const next = ++id; clocks.set(next, cb); return next; }, clearInterval: key => clocks.delete(key)
  });
  vm.runInContext(source.replace(/^export /gm, '') + '\nglobalThis.api = { startPublicLiveHost, stopPublicLiveHost };', context);
  const loadSessions = async options => {
    requests.push(options); assert.ok(replies.length, 'Every request has an explicit response');
    return replies.shift()();
  };
  context.api.startPublicLiveHost({ container, loadSessions,
    renderSessions: sessions => JSON.stringify(sessions), getGeneration: () => generation });
  return { timers, clocks, events, requests, replies, list, status, form, document, countdown,
    get renders() { return renders; }, get html() { return html; },
    advance(ms) { now += ms; }, changeAccount() { generation++; }, stop: context.api.stopPublicLiveHost,
    reply(sessions) { replies.push(async () => sessions); },
    tick() {
      const [key, timer] = [...timers.entries()].sort((a, b) => a[1].ms - b[1].ms)[0];
      timers.delete(key); return timer.cb();
    }
  };
}
const room = { id: 'room', status: 'active', answeredCount: 0, participants: [{ name: 'Carlos' }], serverNow: 'time-a' };
const h = harness();
assert.equal([...h.timers.values()][0].ms, 3000);
h.reply([room]); await h.tick();
assert.equal(h.renders, 1); assert.equal(h.form.value, 'Borrador sin guardar'); assert.equal(h.form.focused, true);
h.reply([{ ...room, serverNow: 'time-b' }]); await h.tick();
assert.equal(h.renders, 1, 'An unchanged room must not replace focused controls');
h.reply([{ ...room, answeredCount: 1 }]); await h.tick();
assert.equal(h.renders, 2); assert.match(h.html, /"answeredCount":1/);
h.advance(3000); [...h.clocks.values()][0](); assert.equal(h.countdown.textContent, '7 s');
h.advance(8000); [...h.clocks.values()][0](); assert.equal(h.countdown.textContent, 'Tiempo agotado');
h.replies.push(async () => { throw new Error('Offline'); }); await h.tick();
assert.match(h.status.textContent, /Reintentando/); assert.equal([...h.timers.values()][0].ms, 6000);
assert.equal(h.form.value, 'Borrador sin guardar');
h.reply([room]); await h.tick(); assert.equal([...h.timers.values()][0].ms, 3000);
h.document.hidden = true; h.events.visibilitychange(); assert.equal(h.timers.size, 0);
h.document.hidden = false; h.events.visibilitychange(); assert.equal([...h.timers.values()][0].ms, 0);
h.events.pagehide(); assert.equal(h.clocks.size, 0); assert.equal(h.timers.size, 0);
h.events.pageshow(); assert.equal(h.clocks.size, 1); assert.equal([...h.timers.values()][0].ms, 0);
h.stop(); assert.equal(h.timers.size, 0); assert.equal(h.clocks.size, 0); assert.deepEqual(Object.keys(h.events), []);

const stale = harness(); let resolvePending;
stale.replies.push(() => new Promise(resolve => { resolvePending = resolve; }));
const pending = stale.tick();
assert.equal(stale.requests.length, 1);
stale.document.hidden = true; stale.events.visibilitychange();
assert.equal(stale.requests[0].signal.aborted, true, 'Hidden page aborts its pending read');
stale.document.hidden = false; stale.events.visibilitychange(); await stale.tick();
assert.equal(stale.requests.length, 1, 'No overlapping reads while the previous request settles');
stale.changeAccount();
assert.equal(stale.requests[0].isCurrent(), false, 'Old account cannot update shared test state');
resolvePending([room]); await pending;
assert.equal(stale.renders, 0, 'Late data cannot restore the old account view');
[...stale.clocks.values()][0](); assert.equal(stale.clocks.size, 0);

const left = harness(); let resolveLeft;
left.replies.push(() => new Promise(resolve => { resolveLeft = resolve; }));
const leftPending = left.tick(); left.list.isConnected = false;
resolveLeft([room]); await leftPending; assert.equal(left.renders, 0);
[...left.clocks.values()][0](); assert.equal(left.timers.size, 0); assert.equal(left.clocks.size, 0);

const denied = harness(); denied.replies.push(async () => { throw Object.assign(new Error('Forbidden'), { status: 403 }); });
await denied.tick(); assert.equal(denied.timers.size, 0); assert.equal(denied.clocks.size, 0);
assert.match(denied.status.textContent, /iniciar sesión/);
console.log('Live host UI passed: automatic updates, stable form/focus, clock, backoff, hidden/history restore, abort, account/navigation races and permission expiry.');
