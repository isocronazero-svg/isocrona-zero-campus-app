import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { once } from "node:events";
import { mkdtempSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
import { setTimeout as delay } from "node:timers/promises";
import policy from "../public/membership-fee-policy.js";
import onboarding from "../server/onboarding-state.js";

const { membershipFeeYearForDate, effectiveMembershipFeeYear, rolloverBenefit } = policy;
for (const [date, year] of [
  ["2026-09-30T21:59:59Z", 2026], ["2026-09-30T22:00:00Z", 2027],
  ["2026-11-15T12:00:00Z", 2027], ["2026-12-31T22:59:59Z", 2027],
  ["2026-12-31T23:00:00Z", 2027], ["2027-01-01T12:00:00Z", 2027]
]) assert.equal(membershipFeeYearForDate(date), year, date);
const newJoin = { id: "new", joinedAt: "2026-11-15T10:00:00Z", membershipFeeYear: 2027 };
assert.equal(effectiveMembershipFeeYear(newJoin, "2026-11-15T12:00Z"), 2027);
assert.equal(effectiveMembershipFeeYear(newJoin, "2027-12-31T22:59Z"), 2027);
assert.equal(effectiveMembershipFeeYear(newJoin, "2027-12-31T23:00Z"), 2028);
assert.equal(effectiveMembershipFeeYear({ joinedAt: "2024-11-01" }, "2026-11-15"), 2026);
assert.equal(effectiveMembershipFeeYear({ ...newJoin, membershipFeeYear: 2026, membershipFeeYearSource: "manual-admin" }, "2026-11-15"), 2026);
assert.equal(rolloverBenefit(newJoin, "2028-01-01"), null);
{
  let stored = { associates: [{ ...newJoin }], settings: {} };
  const access = onboarding.createOnboardingStateAccess({ readState: () => structuredClone(stored), writeState: s => { stored = structuredClone(s); } });
  const stale = access.readState();
  const correction = access.readState();
  Object.assign(correction.associates[0], { membershipFeeYear: 2026, membershipFeeYearSource: "manual-admin" });
  access.writeState(correction);
  access.writeState(stale);
  assert.equal(stored.associates[0].membershipFeeYear, 2026, "Concurrent writer preserves fee correction even without onboarding");
}

const root = fileURLToPath(new URL("../", import.meta.url));
const serverSource = readFileSync(path.join(root, "server.js"), "utf8");
function serverFunction(name) {
  const start = serverSource.indexOf(`function ${name}(`);
  const end = serverSource.indexOf("\n}", start) + 2;
  assert.ok(start >= 0 && end > start);
  return serverSource.slice(start, end);
}
const welcomeContext = {
  rolloverBenefit: associate => rolloverBenefit(associate, "2026-11-15"),
  getAssociateFullName: () => "Socio prueba", getSmtpSettings: () => ({})
};
vm.createContext(welcomeContext);
vm.runInContext(serverFunction("buildAssociateWelcomeEmailBody"), welcomeContext);
const welcome = welcomeContext.buildAssociateWelcomeEmailBody({}, newJoin, {}, {});
assert.match(welcome, /Tu cuota corresponde al año 2027/);
assert.match(welcome, /restantes de 2026 están incluidos sin coste adicional/);
assert.match(welcome, /https:\/\/portal\.isocronazero\.org/);
assert.doesNotMatch(welcomeContext.buildAssociateWelcomeEmailBody({}, { joinedAt: "2026-09-30", membershipFeeYear: 2026 }, {}, {}), /restantes de/);
const reminderContext = vm.createContext({ effectiveMembershipFeeYear: a => effectiveMembershipFeeYear(a, "2026-11-15") });
vm.runInContext(serverFunction("getAssociateYearFeeGap") + "\nasync " + serverFunction("maybeSendAssociateFeeReminder"), reminderContext);
const reminder = await reminderContext.maybeSendAssociateFeeReminder({}, { ...newJoin, annualAmount: 50, yearlyFees: { 2027: 50 } }, { force: true, strict: true });
assert.equal(reminder.reason, "already_paid", "Even forced/manual reminders skip a paid rollover member before touching SMTP");

// Exercise the observer, including re-render, correction and a different selected member.
const nodes = new Map();
const pending = [];
let callback;
let writes = 0;
function element(id = "") {
  let html = "";
  return { id, className: "", handlers: [],
    get innerHTML() { return html; },
    set innerHTML(value) { html = value; writes++; if (callback) pending.push(callback); },
    querySelector(selector) { return selector === "#membershipFeeYearBox" ? nodes.get("membershipFeeYearBox") : null; },
    prepend(node) { nodes.set(node.id, node); if (callback) pending.push(callback); },
    after(node) { this.prepend(node); },
    remove() { nodes.delete(this.id); if (callback) pending.push(callback); }
  };
}
nodes.set("hero", element("hero"));
nodes.set("associateEditForm", element("associateEditForm"));
let responsePayload;
const ui = vm.createContext({ URL, Response, queueMicrotask: fn => pending.push(fn),
  MembershipFeePolicy: { ...policy, rolloverBenefit: a => rolloverBenefit(a, "2026-11-15") },
  MutationObserver: class { constructor(fn) { callback = fn; } observe() {} },
  document: { body: {}, head: { append(node) { nodes.set(node.id, node); } }, createElement: () => element(),
    getElementById: id => nodes.get(id), addEventListener() {} },
  window: { location: { href: "http://local.test/", origin: "http://local.test" },
    fetch: async () => new Response(JSON.stringify(responsePayload)) }
});
const uiSource = readFileSync(path.join(root, "public/assets/js/app/admin/membershipFeeYearEnhancer.js"), "utf8");
vm.runInContext(uiSource.replace(/^import .*;\r?\n/gm, "").replace(/^export /gm, "") + "\ninstallMembershipFeeYearEnhancer();", ui);
async function render(payload) {
  responsePayload = payload;
  await ui.window.fetch("/api/state");
  for (let i = 0; pending.length && i < 30; i++) pending.shift()();
  assert.equal(pending.length, 0, "Membership card observer must settle");
}
await render({ role: "admin", selectedAssociateId: "new", associates: [newJoin] });
assert.match(nodes.get("membershipFeeYearBox").innerHTML, /2027/);
const previousWrites = writes;
await render({ role: "admin", selectedAssociateId: "new", associates: [newJoin] });
assert.equal(writes, previousWrites);
await render({ role: "member", selectedAssociateId: "new", associates: [newJoin] });
assert.match(nodes.get("membershipFeeBenefitCard").innerHTML, /2026/);
await render({ role: "member", associates: [{ id: "old" }] });
assert.equal(nodes.has("membershipFeeBenefitCard"), false);

// The application is started only against disposable local data and synthetic accounts.
const dir = mkdtempSync(path.join(os.tmpdir(), "iz-fee-year-"));
const password = randomUUID();
const seed = JSON.parse(readFileSync(path.join(root, "data/default-state.json"), "utf8"));
seed.accounts = [{ id: "admin", email: "fee-admin@example.test", name: "Admin prueba", role: "admin", password }];
seed.associates = [];
seed.members = [];
seed.associateApplications = [];
seed.associatePaymentSubmissions = [];
seed.emailOutbox = [];
seed.settings.smtp = { enabled: false };
seed.settings.automation.autoRunOnSave = false;
seed.settings.automation.autoSendFeeReminders = false;
seed.settings.associates.autoSendWelcomeEmail = false;
seed.courses = [{ ...seed.courses[0], id: "fee-course", title: "Formacion prueba cuotas", status: "Inscripcion abierta",
  startDate: "2029-01-01", endDate: "2029-01-02", enrollmentOpensAt: "", enrollmentClosesAt: "", accessScope: "members",
  enrollmentFee: 0, memberPrice: 0, enrolledIds: [], waitingIds: [], enrollmentSubmissions: [], capacity: 20 }];
writeFileSync(path.join(dir, "seed.json"), JSON.stringify(seed));
// A child-only clock; no clock controls or credentials are added to the application.
writeFileSync(path.join(dir, "clock.cjs"), `const RealDate = Date; const started = RealDate.now();
const base = RealDate.parse(process.env.TEST_CLOCK);
global.Date = class extends RealDate { constructor(...args) { super(...(args.length ? args : [base + RealDate.now() - started])); }
static now() { return base + RealDate.now() - started; } };`);
const probe = net.createServer();
probe.listen(0, "127.0.0.1"); await once(probe, "listening");
const port = probe.address().port; await new Promise(resolve => probe.close(resolve));
const base = `http://127.0.0.1:${port}`;
let child;
let logs = "";
async function start(date) {
  child = spawn(process.execPath, ["--require", path.join(dir, "clock.cjs"), "server.js"], {
    cwd: root, env: { ...process.env, NODE_ENV: "test", HOST: "127.0.0.1", PORT: String(port),
      IZ_DATA_DIR: path.join(dir, "data"), IZ_DEFAULT_STATE_PATH: path.join(dir, "seed.json"), IZ_BASE_URL: base,
      DATABASE_URL: "", IZ_BOOTSTRAP_ADMIN_EMAIL: "", IZ_BOOTSTRAP_ADMIN_PASSWORD: "", IZ_RECOVERY_ADMIN_PASSWORD: "",
      AUTOMATION_INTERVAL_MS: "3600000", TEST_CLOCK: date }, stdio: ["ignore", "pipe", "pipe"]
  });
  child.stdout.on("data", chunk => { logs += chunk; }); child.stderr.on("data", chunk => { logs += chunk; });
  for (let i = 0; i < 80; i++) {
    try { if ((await fetch(`${base}/healthz`)).ok) return; } catch {}
    if (child.exitCode !== null) break;
    await delay(100);
  }
  throw new Error(`Local server failed: ${logs}`);
}
async function stop() {
  if (child && child.exitCode === null && child.signalCode === null) {
    const done = once(child, "exit"); child.kill(); await done;
  }
}
function client() {
  let cookie = "";
  return async (method, url, body, expected = 200) => {
    const res = await fetch(base + url, { method, headers: { "Content-Type": "application/json", Cookie: cookie }, body: body === undefined ? undefined : JSON.stringify(body) });
    if (res.headers.get("set-cookie")) cookie = res.headers.get("set-cookie").split(";")[0];
    const result = await res.json();
    assert.equal(res.status, expected, `${method} ${url}: ${result.error || res.status}`);
    return result;
  };
}
try {
  await start("2026-11-15T10:00:00Z");
  let admin = client();
  await admin("POST", "/api/login", { email: "fee-admin@example.test", password });
  const guest = client();
  const application = await guest("POST", "/api/associates/apply", { firstName: "Nueva", lastName: "Prueba", dni: "12345678Z",
    email: "new-fee@example.test", phone: "600000000", service: "Prueba local", privacyConsent: true,
    paymentProofFile: { name: "cuota.txt", contentBase64: Buffer.from("justificante sintetico").toString("base64") } });
  const approved = await admin("POST", `/api/associates/applications/${application.applicationId}/approve`);
  const associate = approved.associate;
  assert.equal(associate.membershipFeeYear, 2027);
  assert.equal(associate.status, "Activa");
  assert.equal(associate.payments.length, 1);
  assert.equal(associate.payments[0].year, "2027");
  assert.equal(associate.yearlyFees[2027], 50);
  assert.equal(associate.yearlyFees[2026] || 0, 0);
  await admin("POST", `/api/associates/applications/${application.applicationId}/approve`, undefined, 400);
  let state = await admin("GET", "/api/state");
  assert.equal(state.associates[0].yearlyFees[2027], 50, "No double counting on persistence");
  assert.equal(state.automationInbox.some(item => item.type === "associate_fee" && item.memberId === associate.id), false);
  const member = client();
  await member("POST", "/api/login", { email: associate.email, password: associate.temporaryPassword });
  const own = await member("GET", "/api/state");
  assert.ok(own.courses.some(course => course.id === "fee-course"), "Member has full course visibility");
  await member("POST", "/api/member/courses/fee-course/enroll", {});
  const ledger = await admin("GET", "/api/v1.1/accounting-ledger");
  const quotas = ledger.entries.filter(entry => entry.category === "cuota");
  assert.equal(quotas.length, 1); assert.equal(quotas[0].exerciseYear, "2027");
  assert.match(quotas[0].concept, /2027/);
  state = await admin("GET", "/api/state");
  assert.equal(state.auditLog.filter(event => event.action === "approve-initial-membership-payment").length, 1);
  // Manual join uses the existing state save + payment endpoint; an old renewal keeps 2026.
  state.associates.push({ id: "manual", firstName: "Manual", lastName: "Prueba", email: "manual@example.test", service: "QA",
    status: "Pendiente cuota", joinedAt: "2026-11-15T10:00:00Z", annualAmount: 50, payments: [], manualYearlyFees: {} });
  state.associates.push({ id: "renewal", firstName: "Antiguo", lastName: "Prueba", email: "old@example.test", service: "QA",
    status: "Pendiente cuota", joinedAt: "2024-03-01", annualAmount: 50, payments: [], manualYearlyFees: {} });
  await admin("POST", "/api/state", state);
  state = await admin("GET", "/api/state");
  assert.equal(state.associates.find(a => a.id === "manual").membershipFeeYear, 2027);
  const settled = await admin("POST", "/api/associates/payments/settle", { effectiveYear: true, associateIds: ["manual", "renewal"] });
  assert.equal(settled.payments.find(p => p.associateId === "manual").payment.year, "2027");
  assert.equal(settled.payments.find(p => p.associateId === "renewal").payment.year, "2026");
  await admin("PATCH", "/api/v1.1/associates/manual/membership-fee-year", { year: 2026 });
  const fresh = await admin("GET", "/api/state");
  fresh.associates.find(a => a.id === "manual").membershipFeeYear = 2027;
  await admin("POST", "/api/state", fresh);
  state = await admin("GET", "/api/state");
  assert.equal(state.associates.find(a => a.id === "manual").membershipFeeYear, 2026);
  assert.ok(state.auditLog.some(e => e.action === "update-membership-fee-year"));
  await stop(); await start("2026-11-15T11:00:00Z");
  admin = client(); await admin("POST", "/api/login", { email: "fee-admin@example.test", password });
  state = await admin("GET", "/api/state");
  const restored = state.associates.find(a => a.id === associate.id);
  assert.equal(restored.joinedAt, associate.joinedAt);
  assert.equal(restored.membershipFeeYear, 2027); assert.equal(restored.payments.length, 1);
  assert.equal(restored.yearlyFees[2027], 50); assert.equal(restored.yearlyFees[2026] || 0, 0);
  for (const [index, date] of ["2026-09-30T12:00:00Z", "2026-10-01T00:00:00Z", "2026-12-31T12:00:00Z", "2027-01-01T00:00:00Z"].entries()) {
    await stop(); await start(date);
    admin = client(); await admin("POST", "/api/login", { email: "fee-admin@example.test", password });
    const request = await client()("POST", "/api/associates/apply", { firstName: "Fecha", lastName: `Prueba ${index}`, dni: `2234567${index}Z`,
      email: `date-${index}@example.test`, phone: "600000000", service: "Prueba local", privacyConsent: true, paymentProof: "justificante sintetico" });
    const response = await admin("POST", `/api/associates/applications/${request.applicationId}/approve`);
    assert.equal(response.associate.membershipFeeYear, membershipFeeYearForDate(date));
    assert.equal(response.associate.status, "Activa");
    assert.equal(response.associate.payments.length, 1);
    assert.equal(response.associate.yearlyFees[membershipFeeYearForDate(date)], 50);
  }
  await stop(); await start("2028-01-01T00:00:00Z");
  admin = client(); await admin("POST", "/api/login", { email: "fee-admin@example.test", password });
  await admin("POST", `/api/associates/${associate.id}/mark-reviewed`);
  await admin("POST", "/api/automation/run");
  state = await admin("GET", "/api/state");
  assert.equal(state.associates.find(a => a.id === associate.id).status, "Pendiente cuota");
  assert.ok(state.automationInbox.some(item => item.key === `associate_fee:${associate.id}:2028`));
  assert.ok(!state.emailOutbox.some(mail => mail.subject.includes("Recordatorio de cuota")), "No real email transport used");
  console.log("Membership effective year: Madrid boundaries, web/manual join, access/enrollment, renewal, single ledger/audit, stale save, restart and 2028 OK.");
} finally {
  await stop();
  rmSync(dir, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 });
}
