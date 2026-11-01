import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import {
  contextStorageKey,
  normalizeAdminIdentity,
  rewriteAdminStatePayload,
  sanitizeAdminStateWrite
} from "../public/assets/js/app/admin/adminContextEnhancer.js";

const members = [
  { id: "member-admin-a", name: "Admin A" },
  { id: "member-admin-b", name: "Admin B" },
  { id: "member-socio-1", name: "Socio Uno" },
  { id: "member-socio-2", name: "Socio Dos" }
];

const adminA = normalizeAdminIdentity({
  role: "admin",
  accountId: "account-admin-a",
  memberId: "member-admin-a",
  name: "Admin A"
});
const adminB = normalizeAdminIdentity({
  role: "admin",
  accountId: "account-admin-b",
  memberId: "member-admin-b",
  name: "Admin B"
});

assert.ok(adminA);
assert.ok(adminB);
assert.notEqual(contextStorageKey(adminA.accountId), contextStorageKey(adminB.accountId),
  "Cada administrador debe tener una clave de contexto independiente");

const sharedServerState = {
  role: "admin",
  selectedMemberId: "member-socio-2",
  members
};

const viewA = rewriteAdminStatePayload(sharedServerState, adminA, "member-socio-1");
const viewB = rewriteAdminStatePayload(sharedServerState, adminB, "member-socio-2");
assert.equal(viewA.selectedMemberId, "member-socio-1");
assert.equal(viewB.selectedMemberId, "member-socio-2");
assert.equal(sharedServerState.selectedMemberId, "member-socio-2",
  "Reescribir el contexto del navegador no debe mutar el estado compartido del servidor");

const freshLoginA = rewriteAdminStatePayload(sharedServerState, adminA, "");
const freshLoginB = rewriteAdminStatePayload(sharedServerState, adminB, "");
assert.equal(freshLoginA.selectedMemberId, "member-admin-a",
  "Un login nuevo de Admin A debe empezar en su propio perfil");
assert.equal(freshLoginB.selectedMemberId, "member-admin-b",
  "Un login nuevo de Admin B debe empezar en su propio perfil");

const invalidStored = rewriteAdminStatePayload(sharedServerState, adminA, "member-no-existe");
assert.equal(invalidStored.selectedMemberId, "member-admin-a",
  "Un contexto guardado obsoleto debe caer al perfil propio");

const outgoing = {
  ...sharedServerState,
  selectedMemberId: "member-socio-1",
  selectedCourseId: "course-qa"
};
const sanitized = sanitizeAdminStateWrite(outgoing, adminA);
assert.equal(sanitized.selectedMemberId, null,
  "El perfil de trabajo no debe persistirse como selección global");
assert.equal(sanitized.selectedCourseId, null, "El curso seleccionado tampoco debe ser global");
assert.equal(sanitized.selectedAssociateId, null, "La ficha seleccionada tampoco debe ser global");
const records = { ...sharedServerState, associates: [
  { id: "associate-a", linkedMemberId: adminA.memberId },
  { id: "associate-b", linkedMemberId: adminB.memberId }, { id: "associate-1" }, { id: "associate-2" }
], courses: [{ id: "course-1" }, { id: "course-2" }], selectedAssociateId: "associate-2", selectedCourseId: "course-2" };
const contextA = rewriteAdminStatePayload(records, adminA, "member-socio-1", { selectedAssociateId: "associate-1", selectedCourseId: "course-1" });
const contextB = rewriteAdminStatePayload(records, adminB, "member-socio-2", { selectedAssociateId: "associate-2", selectedCourseId: "course-2" });
assert.equal(contextA.selectedAssociateId, "associate-1");
assert.equal(contextB.selectedAssociateId, "associate-2");
assert.equal(contextA.selectedCourseId, "course-1");
assert.equal(contextB.selectedCourseId, "course-2");
assert.equal(rewriteAdminStatePayload(records, adminA).selectedAssociateId, "associate-a");
assert.equal(rewriteAdminStatePayload(records, adminB).selectedAssociateId, "associate-b");
assert.equal(rewriteAdminStatePayload(records, adminA).selectedCourseId, null);
assert.ok(normalizeAdminIdentity({ role: "admin", accountId: "bootstrap", memberId: "" }), "Bootstrap sin ficha tambien debe aislar contexto");
assert.equal(outgoing.selectedMemberId, "member-socio-1",
  "El saneado no debe mutar el objeto original del cliente");

assert.equal(normalizeAdminIdentity({ role: "member", accountId: "member", memberId: "member" }), null);

// Exercise the installed fetch/DOM observer path, not only the pure helpers.
const pending = [];
const nodes = new Map();
const listeners = new Map();
const stored = new Map();
let observerCallback;
let htmlWrites = 0;
function mutation() {
  if (observerCallback) pending.push(observerCallback);
}
function element(id = "") {
  let html = "";
  let button = null;
  return {
    id, className: "", offsetParent: {}, value: "",
    get innerHTML() { return html; },
    set innerHTML(value) {
      htmlWrites += 1;
      // Browsers normalize entities on serialization; raw HTML equality is unsafe.
      html = value.replaceAll("&#039;", "'");
      button = value.includes("data-return-own-profile") ? {
        handlers: [], addEventListener(type, fn) { this.handlers.push(fn); }
      } : null;
      mutation();
    },
    querySelector() { return button; },
    before(node) { nodes.set(node.id, node); mutation(); },
    remove() { nodes.delete(this.id); mutation(); },
    dispatchEvent() { listeners.get("change")?.({ target: this }); }
  };
}
nodes.set("hero", element("hero"));
nodes.set("shell", element("shell"));
nodes.set("memberSwitcher", element("memberSwitcher"));
let responsePayload;
const sandbox = vm.createContext({
  URL, Request, Response, Headers, Event,
  sessionStorage: { getItem: key => stored.get(key), setItem: (key, value) => stored.set(key, value), removeItem: key => stored.delete(key) },
  queueMicrotask: callback => pending.push(callback),
  MutationObserver: class {
    constructor(callback) { this.callback = callback; }
    observe() { observerCallback = this.callback; }
  },
  document: {
    body: {}, head: { append(node) { nodes.set(node.id, node); mutation(); } },
    getElementById: id => nodes.get(id) || null,
    createElement: () => element(),
    addEventListener: (type, callback) => listeners.set(type, callback)
  },
  window: {
    location: { href: "http://qa.invalid/", origin: "http://qa.invalid" },
    fetch: async () => new Response(JSON.stringify(responsePayload), {
      headers: { "Content-Type": "application/json" }
    })
  }
});
const source = readFileSync(new URL("../public/assets/js/app/admin/adminContextEnhancer.js", import.meta.url), "utf8");
vm.runInContext(source.replace(/^export (?=function )/gm, "") + "\ninstallAdminContextEnhancer();", sandbox);
function settle() {
  for (let turn = 0; pending.length && turn < 30; turn += 1) pending.shift()();
  assert.equal(pending.length, 0, "Admin context observer must settle without starving the browser");
}
async function receive(path, payload) {
  responsePayload = payload;
  await sandbox.window.fetch(path);
  settle();
}
await receive("/api/login", { session: adminA });
await receive("/api/state", { role: "admin", members: members.map(member => member.id === adminA.memberId
  ? { ...member, name: "Admin O'Neil <QA>" } : member) });
assert.ok(nodes.get("adminContextBanner").innerHTML.includes("Admin O'Neil &lt;QA&gt;"));
const ownWrites = htmlWrites;
mutation(); settle(); mutation(); settle();
assert.equal(htmlWrites, ownWrites, "Unrelated mutations must not rewrite the banner");
const switcher = nodes.get("memberSwitcher");
switcher.value = "member-socio-1";
switcher.dispatchEvent(); settle();
const returnButton = nodes.get("adminContextBanner").querySelector();
assert.equal(returnButton.handlers.length, 1);
mutation(); settle();
assert.equal(nodes.get("adminContextBanner").querySelector(), returnButton);
assert.equal(returnButton.handlers.length, 1, "Observer deliveries cannot duplicate click listeners");
returnButton.handlers[0](); settle();
assert.equal(switcher.value, adminA.memberId);
assert.equal(nodes.get("adminContextBanner").querySelector(), null);
await receive("/api/login", { session: adminB });
await receive("/api/state", sharedServerState);
assert.ok(nodes.get("adminContextBanner").innerHTML.includes("Admin B"));
nodes.get("adminContextBanner").remove(); settle();
assert.ok(nodes.get("adminContextBanner"), "A replaced banner must be rendered again");
await receive("/api/logout", { ok: true });
assert.equal(nodes.has("adminContextBanner"), false);

console.log("V1.1 admin context isolation and bounded DOM observer: OK.");
