import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { once } from "node:events";
import { mkdtempSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const repo = fileURLToPath(new URL("../", import.meta.url));
const app = readFileSync(path.join(repo, "public/app.js"), "utf8").replace(/\r\n/g, "\n");
function source(name) {
  const start = app.search(new RegExp(`(?:async )?function ${name}\\(`));
  const rest = app.slice(start + 1);
  const end = rest.search(/\n(?:async )?function /);
  assert.ok(start >= 0 && end >= 0, name);
  return app.slice(start, start + 1 + end);
}
const moduleFixture = (id = "module-qa") => ({ id, title: "Subgrupo QA", summary: "", documents: [], practiceSheets: [], videos: [], links: [] });
const file = { name: "qa.txt", type: "text/plain", size: 7, contentBase64: Buffer.from("QA file").toString("base64") };
const group = { id: "group-qa", title: "Grupo QA", summary: "Resumen", allowedMemberIds: ["member-1"], modules: [moduleFixture(), moduleFixture("module-other")] };
group.modules[0].documents = [{ id: "visible", title: "Visible", attachment: file }, { id: "hidden", title: "Oculto" }];
const storage = new Map();
const fields = { campusGroupSummary: { value: "" }, campusGroupModuleSummary: { value: "" } };
const row = { dataset: { entryId: "visible" }, querySelector: (selector) => ({ value: selector.includes('="title"') ? "Editado" : "" }) };
const context = vm.createContext({
  session: {accountId:"qa-admin"}, campusGroupPendingUploads: 0,
  campusGroupAutosaveIds: new Set(), campusGroupAutosaveRunning: false, campusGroupSessionEpoch: 0,
  campusGroupPendingFileReads: new Set(),
  campusGroupFileSelections: new Map(), campusGroupAttachmentBases: {},
  window: { confirm: () => false }, toasts: [],
  state: { campusGroups: [structuredClone(group)] }, selectedCampusGroupModuleId: "module-qa",
  campusGroupAttachmentDrafts: {}, isAdminView: () => true,
  getCampusDraftStorageKey: (id) => id,
  sessionStorage: { setItem: (key, value) => storage.set(key, value), getItem: (key) => storage.get(key), removeItem: key => storage.delete(key) },
  document: { getElementById: (id) => fields[id], querySelectorAll: (selector) => selector.includes('="documents"') ? [row] : [] },
  buildDefaultCampusGroups: () => []
});
const helpers = ["normalizeCampusGroupEntry", "normalizeCampusGroupModule", "normalizeCampusGroup", "getCampusGroupAttachmentDraftKey", "getSelectedCampusGroupModule", "readCampusGroupEditorDraft", "sanitizeCampusDraftAttachment", "sanitizeCampusDraftEntry", "buildCampusDraftData", "saveCampusDraft", "loadCampusDraft"];
vm.runInContext(helpers.map(source).join("\n"), context);
let edited = vm.runInContext("readCampusGroupEditorDraft(state.campusGroups[0])", context);
assert.equal(edited.modules[0].documents.length, 2, "Filtering must not delete hidden resources");
assert.equal(edited.modules[0].documents[0].title, "Editado");
assert.equal(edited.summary, "", "Clearing summaries must work");
assert.deepEqual([...edited.allowedMemberIds], ["member-1"], "Normalization must preserve access rules");
context.edited = edited;
vm.runInContext("saveCampusDraft(edited.id, edited)", context);
assert.ok(!storage.get(group.id).includes(file.contentBase64), "Session storage must not contain attachment bytes");
context.selectedCampusGroupModuleId = "module-other";
edited = vm.runInContext("loadCampusDraft('group-qa')", context);
assert.equal(edited.modules[0].documents[0].attachment.contentBase64, file.contentBase64, "Switching subgroups must keep pending bytes");
Object.assign(context, {
  file: { ...file, name: "replacement.txt" },
  target: { groupId: group.id, moduleId: "module-qa", category: "documents", entryId: "visible" },
  pendingCampusGroupFileTarget: null, render: () => {}, showToast: (message, kind) => context.toasts.push({ message, kind }), formatFileSize: String,
  AbortSignal, campusGroupSaving: false, clearCampusDraft: (id) => storage.delete(id),
  readJsonResponse: (response) => response.json(),
  fetch: async (url, options) => {
    assert.equal(url, "/api/campus-groups/group-qa");
    assert.deepEqual(Object.keys(JSON.parse(options.body)), ["group"]);
    return { ok: false, json: async () => ({ error: "Fallo de red simulado" }) };
  }
});
vm.runInContext(["getCampusGroupFileMaxBytes", "applyCampusGroupFileSelection", "saveCampusGroupAndRender",
  "hasPendingCampusAttachmentBytes", "beginCampusGroupFileSelection", "confirmCampusAttachmentNavigation", "warnPendingCampusAttachments", "flushCampusGroupAutoSaves"].map(source).join("\n"), context);
await vm.runInContext("applyCampusGroupFileSelection(file, target)", context);
assert.equal(context.state.campusGroups[0].modules[0].documents[0].attachment.name, "replacement.txt");
assert.equal(context.state.campusGroups[0].modules[1].documents.length, 0, "Async uploads must keep their original target");
assert.equal(await vm.runInContext("saveCampusGroupAndRender(state.campusGroups[0])", context), false);
assert.ok(storage.has(group.id), "Failed saves must preserve the draft for retry");
assert.equal(context.campusGroupSaving, false);
assert.equal(context.toasts.filter(t => t.kind === "success").length, 0, "Failed autosave must not announce success");
assert.equal(vm.runInContext("hasPendingCampusAttachmentBytes()", context), true);
assert.equal(vm.runInContext("confirmCampusAttachmentNavigation()", context), false, "User can cancel navigation/logout with pending bytes");
let unloadPrevented = false;
context.unloadEvent = { preventDefault: () => { unloadPrevented = true; } };
vm.runInContext("warnPendingCampusAttachments(unloadEvent)", context);
assert.equal(unloadPrevented, true);
context.fetch = async () => ({ ok: false, status: 409, json: async () => ({error:"Revision en conflicto"}) });
assert.equal(await vm.runInContext("saveCampusGroupAndRender(state.campusGroups[0])", context), false);
assert.equal(context.campusGroupAttachmentDrafts["group-qa::module-qa::documents::visible"].contentBase64, file.contentBase64);
assert.match(context.syncStatus, /pendiente de guardar/);
assert.ok(!storage.get(group.id).includes(file.contentBase64));
assert.equal(context.toasts.filter(t => t.kind === "success").length, 0, "409 must not announce success");
context.fetch = async () => { throw new TypeError("Failed to fetch"); };
assert.equal(await vm.runInContext("saveCampusGroupAndRender(state.campusGroups[0])", context), false);
assert.equal(context.campusGroupAttachmentDrafts["group-qa::module-qa::documents::visible"].contentBase64, file.contentBase64);
assert.ok(storage.has(group.id), "Network rejection retains metadata and bytes for retry");
context.campusGroupPendingUploads = 1;
context.fetch = () => { throw new Error("Must not send while a file is being read"); };
assert.equal(await vm.runInContext("saveCampusGroupAndRender(state.campusGroups[0])", context), false);
context.campusGroupPendingUploads = 0;
let finishSave;
context.fetch = () => new Promise(resolve => { finishSave = resolve; });
const pendingSave = vm.runInContext("saveCampusGroupAndRender(state.campusGroups[0])", context);
context.session = {accountId:"another-admin"};
finishSave({ok:true,status:200,json:async()=>({group:{...group,title:"Late response"}})});
assert.equal(await pendingSave, false);
assert.notEqual(context.state.campusGroups[0].title, "Late response", "Old account response cannot mutate the new view");
context.session = {accountId:"qa-admin"};
const previousSessionSave = vm.runInContext("saveCampusGroupAndRender(state.campusGroups[0])", context);
context.campusGroupSessionEpoch++;
context.campusGroupSaving = false;
finishSave({ok:true,status:200,json:async()=>({group:{...group,title:"Previous login"}})});
assert.equal(await previousSessionSave, false, "Logout/relogin with the same account also invalidates old responses");
assert.notEqual(context.state.campusGroups[0].title, "Previous login");
context.campusGroupSessionEpoch = 0;
const storageSource=readFileSync(path.join(repo,"public/assets/js/app/storage/localStorage.js"),"utf8");
const {getCampusDraftStorageKey}=await import(`data:text/javascript;base64,${Buffer.from(storageSource).toString("base64")}`);
assert.notEqual(getCampusDraftStorageKey("group-qa","admin-a"),getCampusDraftStorageKey("group-qa","admin-b"),"Drafts must be scoped to the account");
context.isAdminView = () => false;
assert.equal(vm.runInContext("loadCampusDraft('group-qa')", context), null, "Members must not see admin drafts on a shared browser");
assert.doesNotMatch(source("renderCampusGroupEntryList"), /JSON\.stringify\(visibleAttachment\)/, "Do not embed base64 in HTML attributes");
context.campusGroupAttachmentDrafts = {};
unloadPrevented = false;
vm.runInContext("warnPendingCampusAttachments(unloadEvent)", context);
assert.equal(unloadPrevented, false, "Metadata-only drafts must not trigger beforeunload");
assert.equal(vm.runInContext("confirmCampusAttachmentNavigation()", context), true);
assert.match(app, /window\.addEventListener\("beforeunload", warnPendingCampusAttachments\)/);
for (const button of ["logoutButton", "passwordLogoutButton"]) {
  assert.ok(app.includes(button + '.addEventListener("click", async () => {\n  if (!confirmCampusAttachmentNavigation()) return;'));
}

const root = mkdtempSync(path.join(os.tmpdir(), "iz-groups-check-"));
const password = `QA-${randomUUID()}`;
const seed = JSON.parse(readFileSync(path.join(repo, "data/default-state.json"), "utf8"));
for (const account of seed.accounts) { account.password = password; account.passwordHash = ""; }
for (const key of Object.keys(seed.settings.automation)) seed.settings.automation[key] = false;
seed.settings.smtp = {};
for (let i = 0; i < 2; i++) {
  const member = seed.members[i], associate = seed.associates[i];
  associate.email = member.email; associate.linkedMemberId = member.id;
  associate.yearlyFees = { [new Date().getFullYear()]: associate.annualAmount };
  member.associateId = associate.id;
  seed.accounts.find((account) => account.memberId === member.id).associateId = associate.id;
}
seed.campusGroups = [group, { ...structuredClone(group), id: "untouched", title: "No tocar", allowedMemberIds: ["member-2"] }];
const seedPath = path.join(root, "seed.json");
writeFileSync(seedPath, JSON.stringify(seed));
const probe = net.createServer();
probe.listen(0, "127.0.0.1"); await once(probe, "listening");
const port = probe.address().port;
await new Promise((resolve) => probe.close(resolve));
const base = `http://127.0.0.1:${port}`;
let server;
let logs = "";
async function start() {
  const env = { ...process.env, NODE_ENV: "test", HOST: "127.0.0.1", PORT: String(port), DATABASE_URL: "", IZ_DATA_DIR: path.join(root, "data"), IZ_DEFAULT_STATE_PATH: seedPath, IZ_BASE_URL: base, AUTOMATION_INTERVAL_MS: "86400000" };
  for (const key of Object.keys(env)) if (key.startsWith("SMTP_") || key.startsWith("IZ_BOOTSTRAP_ADMIN_")) env[key] = "";
  server = spawn(process.execPath, ["server.js"], { cwd: repo, env, stdio: ["ignore", "pipe", "pipe"] });
  server.stdout.on("data", (chunk) => { logs += chunk; });
  server.stderr.on("data", (chunk) => { logs += chunk; });
  for (let attempt = 0; attempt < 100; attempt++) {
    try { if ((await fetch(`${base}/healthz`)).ok) return; } catch {}
    if (server.exitCode !== null) throw new Error(logs);
    await delay(100);
  }
  throw new Error(`Server did not start: ${logs}`);
}
async function stop() {
  if (server && server.exitCode === null) { const exited = once(server, "exit"); server.kill(); await exited; }
}
async function request(url, cookie = "", method = "GET", body) {
  return fetch(new URL(url, base), { method, headers: { Cookie: cookie, "Content-Type": "application/json" }, body: body === undefined ? undefined : JSON.stringify(body) });
}
async function login(email) {
  const response = await request("/api/login", "", "POST", { email, password });
  assert.equal(response.status, 200);
  return response.headers.getSetCookie().map((item) => item.split(";")[0]).join("; ");
}
try {
  await start();
  let admin = await login("admin@isocronazero.org");
  const member = await login("lucia@isocronazero.org");
  const other = await login("javier@isocronazero.org");
  const endpoint = `/api/campus-groups/${group.id}`;
  assert.equal((await request(endpoint, "", "PUT", {})).status, 401);
  assert.equal((await request(endpoint, member, "PUT", {})).status, 403);
  assert.equal((await request(endpoint, admin, "PUT", {})).status, 400);
  const updated = structuredClone(group);
  const oldState = await (await request("/api/state", admin)).json();
  updated.title = "Grupo actualizado";
  updated.modules.push(moduleFixture("new-subgroup"));
  updated.modules[2].documents = [{ id: "new-file", title: "Nuevo archivo", attachment: file }];
  let response = await request(endpoint, admin, "PUT", { group: updated });
  assert.equal(response.status, 200, await response.clone().text());
  let saved = (await response.json()).group;
  assert.equal(saved.contentRevision, 1);
  assert.equal((await request(endpoint, admin, "PUT", { group: updated })).status, 409, "Old tabs cannot overwrite a newer save");
  assert.deepEqual(saved.allowedMemberIds, ["member-1"]);
  assert.equal(saved.modules.length, 3);
  const attachment = saved.modules[2].documents[0].attachment;
  assert.equal(attachment.contentBase64, "");
  const url = new URL(attachment.transportUrl, base);
  const filePath = url.pathname + url.search;
  assert.equal(await (await request(filePath, member)).text(), "QA file");
  assert.equal((await request(filePath, other)).status, 403);
  assert.equal((await request(filePath)).status, 401);
  saved.allowedMemberIds = [];
  response = await request(endpoint, admin, "PUT", { group: saved });
  assert.equal(response.status, 200);
  saved = (await response.json()).group;
  assert.equal((await request(filePath, other)).status, 403, "A content save must not overwrite access rules");
  assert.equal((await request("/api/state", admin, "POST", oldState)).status, 200);
  const state = await (await request("/api/state", admin)).json();
  assert.equal(state.campusGroups.find(g => g.id === group.id).title, "Grupo actualizado", "Unrelated stale saves must preserve library content");
  const lostReplacement = structuredClone(saved);
  lostReplacement.modules[2].documents[0].attachment = {name:"replacement-lost.txt",pendingUpload:true};
  assert.equal((await request(endpoint, admin, "PUT", {group:lostReplacement})).status, 400, "Reloading cannot silently substitute the old file for a pending replacement");
  assert.equal(state.campusGroups.find((g) => g.id === "untouched").title, "No tocar");
  assert.equal((await (await request("/api/state", member)).json()).campusGroups.length, 1);
  const broken = structuredClone(saved);
  broken.modules[2].documents.push({ id: "missing", attachment: { name: "lost.txt" } });
  assert.equal((await request(endpoint, admin, "PUT", { group: broken })).status, 400, "Missing upload bytes must never be silently discarded");
  const tooLarge = await fetch(base + endpoint, { method: "PUT", headers: { Cookie: admin, "Content-Type": "application/json" }, body: JSON.stringify({ padding: "x".repeat(40_000_001) }) });
  assert.equal(tooLarge.status, 413);
  assert.equal(tooLarge.headers.get("cache-control"), "no-store");

  // Run the real frontend upload/save functions against the dedicated API, not a parallel uploader.
  Object.assign(context, {
    state: structuredClone(state), session: {accountId:"qa-admin"}, isAdminView: () => true,
    campusGroupAttachmentDrafts: {}, campusGroupAutosaveIds: new Set(),
    campusGroupSaving: false, campusGroupAutosaveRunning: false, campusGroupPendingUploads: 0,
    selectedCampusGroupModuleId: "module-qa", pendingCampusGroupFileTarget: null
  });
  storage.clear();
  const requests = [];
  const realFetch = async (url, options) => {
    requests.push(JSON.parse(options.body).group.contentRevision);
    return fetch(base + url, { ...options, headers: { ...options.headers, Cookie: admin } });
  };
  context.fetch = realFetch;
  context.file = {...file, name:"autosaved.txt"};
  context.target = {accountId:"qa-admin",epoch:0,groupId:group.id,moduleId:"module-qa",category:"documents",entryId:"visible"};
  context.toasts = [];
  await vm.runInContext("applyCampusGroupFileSelection(file, target)", context);
  assert.equal(requests.length, 1, "Selecting a file automatically issues PUT");
  assert.equal(vm.runInContext("hasPendingCampusAttachmentBytes()", context), false);
  assert.equal(storage.has(group.id), false);
  assert.ok(context.toasts.some(t => t.kind === "success"));
  const afterUpload = await (await request("/api/state", admin)).json();
  assert.equal(afterUpload.campusGroups.find(g => g.id === group.id).modules[0].documents[0].attachment.name, "autosaved.txt");

  // A second FileReader finishing during PUT must keep its bytes and use the acknowledged revision.
  let releasePut, putStarted;
  const started = new Promise(resolve => { putStarted = resolve; });
  let first = true;
  context.fetch = async (url, options) => {
    if (first) {
      first = false;
      await new Promise(resolve => { releasePut = resolve; putStarted(); });
    }
    return realFetch(url, options);
  };
  context.file = {...file, name:"first.txt"};
  const firstUpload = vm.runInContext("applyCampusGroupFileSelection(file, target)", context);
  await started;
  context.secondFile = {...file, name:"second.txt",contentBase64:Buffer.from("Second file").toString("base64"),size:11};
  context.secondTarget = {...context.target,entryId:"hidden"};
  await vm.runInContext("applyCampusGroupFileSelection(secondFile, secondTarget)", context);
  releasePut();
  await firstUpload;
  assert.deepEqual(requests, [2, 3, 4], "Consecutive uploads use sequential server revisions");
  assert.equal(vm.runInContext("hasPendingCampusAttachmentBytes()", context), false);
  assert.equal(storage.has(group.id), false);

  // Exercise the actual change/FileReader handler while the visible group changes.
  const changeStart = app.indexOf('  if (event.target.dataset.campusGroupFileInput === "true"');
  const changeEnd = app.indexOf('  if (event.target.dataset.action === "toggle-associate-application-selection")', changeStart);
  let finishRead;
  Object.assign(context, {
    isAdminSession: () => true,
    getSelectedCampusGroup: () => context.state.campusGroups.find(g => g.id === context.state.selectedCampusGroupId),
    readFileInput: () => new Promise(resolve => { finishRead = resolve; }),
    event: { target: {dataset:{campusGroupFileInput:"true",category:"documents",entryId:"visible"},files:[{size:7}],value:"file"} }
  });
  context.state.selectedCampusGroupId = group.id;
  context.selectedCampusGroupModuleId = "module-qa";
  vm.runInContext('(function(event){' + app.slice(changeStart, changeEnd) + '})(event)', context);
  assert.equal(context.campusGroupPendingUploads, 1);
  assert.equal(vm.runInContext("hasPendingCampusAttachmentBytes()", context), true, "A selected file being read is not yet durable");
  assert.equal(await vm.runInContext("saveCampusGroupAndRender(state.campusGroups[0])", context), false);
  context.state.selectedCampusGroupId = "untouched";
  context.selectedCampusGroupModuleId = "module-other";
  finishRead({...file,name:"original-target.txt"});
  for (let i=0; i<100 && (context.campusGroupPendingUploads || context.campusGroupSaving || context.campusGroupAutosaveRunning); i++) await delay(30);
  assert.equal(context.campusGroupPendingUploads, 0);
  assert.equal(context.state.selectedCampusGroupId, "untouched", "Late file completion must not change the current view");
  assert.equal(context.selectedCampusGroupModuleId, "module-other");
  assert.equal(context.state.campusGroups.find(g => g.id === "untouched").modules[0].documents[0].attachment.name, "qa.txt");
  assert.ok([...storage.values()].every(value => !value.includes("contentBase64") && !value.includes(file.contentBase64)));

  // Latest selection wins even when the older FileReader finishes last.
  context.state.selectedCampusGroupId = group.id;
  context.selectedCampusGroupModuleId = "module-qa";
  const reads = [];
  context.readFileInput = () => new Promise(resolve => reads.push(resolve));
  for (let i=0;i<2;i++) vm.runInContext('(function(event){' + app.slice(changeStart, changeEnd) + '})(event)', context);
  reads[1]({...file,name:"newest-selection.txt"});
  await delay(10);
  reads[0]({...file,name:"old-slow-selection.txt"});
  for (let i=0;i<100 && (context.campusGroupPendingUploads || context.campusGroupSaving || context.campusGroupAutosaveRunning);i++) await delay(30);
  let latestState = await (await request("/api/state",admin)).json();
  assert.equal(latestState.campusGroups.find(g=>g.id===group.id).modules[0].documents[0].attachment.name,"newest-selection.txt");

  // Two individually valid 15.1 MB files exceed 40 MB together after base64 encoding.
  const largeGroup = context.state.campusGroups.find(g=>g.id===group.id);
  largeGroup.modules[1].documents = [{id:"large-a",title:"Grande A"},{id:"large-b",title:"Grande B"}];
  context.largeGroup = largeGroup;
  vm.runInContext("saveCampusDraft(largeGroup.id,largeGroup)",context);
  context.campusGroupPendingUploads = 2;
  const largeBytes = Buffer.alloc(15_100_000,65).toString("base64");
  for (const id of ["large-a","large-b"]) {
    context.largeFile = {name:id+".txt",type:"text/plain",size:15_100_000,contentBase64:largeBytes};
    context.largeTarget = {...context.target,moduleId:"module-other",entryId:id};
    await vm.runInContext("applyCampusGroupFileSelection(largeFile,largeTarget)",context);
  }
  context.campusGroupPendingUploads = 0;
  assert.equal(await vm.runInContext("flushCampusGroupAutoSaves()",context),true,"Valid large attachments must save in separate PUTs");
  assert.equal(vm.runInContext("hasPendingCampusAttachmentBytes()",context),false);
  latestState = await (await request("/api/state",admin)).json();
  for (const entry of latestState.campusGroups.find(g=>g.id===group.id).modules[1].documents) {
    assert.equal((await (await request(entry.attachment.transportUrl,admin)).arrayBuffer()).byteLength,15_100_000);
  }

  const storeMetadata = context.sessionStorage.setItem;
  context.sessionStorage.setItem = () => { throw new Error("QuotaExceededError"); };
  context.fetch = async () => { throw new TypeError("Offline"); };
  context.file = {...file,name:"quota-safe.txt"};
  await vm.runInContext("applyCampusGroupFileSelection(file, target)", context);
  assert.equal(storage.has(group.id), false, "Unwritable storage must not retain an older draft");
  assert.equal(context.state.campusGroups.find(g => g.id === group.id).modules[0].documents[0].attachment.name,"quota-safe.txt");
  assert.equal(vm.runInContext("hasPendingCampusAttachmentBytes()", context), true);
  context.sessionStorage.setItem = storeMetadata;
  context.fetch = realFetch;
  assert.equal(await vm.runInContext("saveCampusGroupAndRender(state.campusGroups.find(g => g.id === target.groupId))", context),true);

  await request("/api/logout", admin, "POST");
  admin = await login("admin@isocronazero.org");
  let reloaded = await (await request("/api/state", admin)).json();
  let reloadedGroup = reloaded.campusGroups.find(g => g.id === group.id);
  assert.equal(reloadedGroup.modules[0].documents[0].attachment.name, "quota-safe.txt");
  assert.equal(reloadedGroup.modules[0].documents[1].attachment.name, "second.txt");
  assert.equal(await (await request(reloadedGroup.modules[0].documents[1].attachment.transportUrl, admin)).text(), "Second file");
  reloadedGroup.summary = "Metadata after autosave";
  assert.equal((await request(endpoint, admin, "PUT", {group:reloadedGroup})).status,200);
  await stop(); await start();
  admin = await login("admin@isocronazero.org");
  assert.equal(await (await request(filePath, admin)).text(), "QA file", "Attachments must survive restart");
  const restarted = await (await request("/api/state", admin)).json();
  assert.equal(restarted.campusGroups.find((g) => g.id === group.id).modules.length, 3);
  reloadedGroup = restarted.campusGroups.find(g => g.id === group.id);
  assert.equal(reloadedGroup.summary, "Metadata after autosave");
  assert.equal(await (await request(reloadedGroup.modules[0].documents[1].attachment.transportUrl, admin)).text(), "Second file");
  console.log("Campus groups check passed: drafts, filtering, uploads, scoped saving, permissions and restart persistence.");
} finally {
  await stop();
  rmSync(root, { recursive: true, force: true });
}
