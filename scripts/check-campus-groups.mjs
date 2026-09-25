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
const app = readFileSync(path.join(repo, "public/app.js"), "utf8");
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
  state: { campusGroups: [structuredClone(group)] }, selectedCampusGroupModuleId: "module-qa",
  campusGroupAttachmentDrafts: {}, isAdminView: () => true,
  getCampusDraftStorageKey: (id) => id,
  sessionStorage: { setItem: (key, value) => storage.set(key, value), getItem: (key) => storage.get(key) },
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
  pendingCampusGroupFileTarget: null, render: () => {}, showToast: () => {}, formatFileSize: String,
  campusGroupSaving: false, clearCampusDraft: (id) => storage.delete(id),
  readJsonResponse: (response) => response.json(),
  fetch: async (url, options) => {
    assert.equal(url, "/api/campus-groups/group-qa");
    assert.deepEqual(Object.keys(JSON.parse(options.body)), ["group"]);
    return { ok: false, json: async () => ({ error: "Fallo de red simulado" }) };
  }
});
vm.runInContext(["getCampusGroupFileMaxBytes", "applyCampusGroupFileSelection", "saveCampusGroupAndRender"].map(source).join("\n"), context);
await vm.runInContext("applyCampusGroupFileSelection(file, target)", context);
assert.equal(context.state.campusGroups[0].modules[0].documents[0].attachment.name, "replacement.txt");
assert.equal(context.state.campusGroups[0].modules[1].documents.length, 0, "Async uploads must keep their original target");
assert.equal(await vm.runInContext("saveCampusGroupAndRender(state.campusGroups[0])", context), false);
assert.ok(storage.has(group.id), "Failed saves must preserve the draft for retry");
assert.equal(context.campusGroupSaving, false);
context.isAdminView = () => false;
assert.equal(vm.runInContext("loadCampusDraft('group-qa')", context), null, "Members must not see admin drafts on a shared browser");
assert.doesNotMatch(source("renderCampusGroupEntryList"), /JSON\.stringify\(visibleAttachment\)/, "Do not embed base64 in HTML attributes");

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
  return fetch(base + url, { method, headers: { Cookie: cookie, "Content-Type": "application/json" }, body: body === undefined ? undefined : JSON.stringify(body) });
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
  updated.title = "Grupo actualizado";
  updated.modules.push(moduleFixture("new-subgroup"));
  updated.modules[2].documents = [{ id: "new-file", title: "Nuevo archivo", attachment: file }];
  let response = await request(endpoint, admin, "PUT", { group: updated });
  assert.equal(response.status, 200, await response.clone().text());
  const saved = (await response.json()).group;
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
  assert.equal((await request(endpoint, admin, "PUT", { group: saved })).status, 200);
  assert.equal((await request(filePath, other)).status, 403, "A content save must not overwrite access rules");
  const state = await (await request("/api/state", admin)).json();
  assert.equal(state.campusGroups.find((g) => g.id === "untouched").title, "No tocar");
  assert.equal((await (await request("/api/state", member)).json()).campusGroups.length, 1);
  const broken = structuredClone(saved);
  broken.modules[2].documents.push({ id: "missing", attachment: { name: "lost.txt" } });
  assert.equal((await request(endpoint, admin, "PUT", { group: broken })).status, 400, "Missing upload bytes must never be silently discarded");
  const tooLarge = await fetch(base + endpoint, { method: "PUT", headers: { Cookie: admin, "Content-Type": "application/json" }, body: JSON.stringify({ padding: "x".repeat(40_000_001) }) });
  assert.equal(tooLarge.status, 413);
  assert.equal(tooLarge.headers.get("cache-control"), "no-store");
  await stop(); await start();
  admin = await login("admin@isocronazero.org");
  assert.equal(await (await request(filePath, admin)).text(), "QA file", "Attachments must survive restart");
  const restarted = await (await request("/api/state", admin)).json();
  assert.equal(restarted.campusGroups.find((g) => g.id === group.id).modules.length, 3);
  console.log("Campus groups check passed: drafts, filtering, uploads, scoped saving, permissions and restart persistence.");
} finally {
  await stop();
  rmSync(root, { recursive: true, force: true });
}
