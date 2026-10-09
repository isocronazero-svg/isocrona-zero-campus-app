import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { once } from "node:events";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { fileURLToPath } from "node:url";
import { crc32 } from "node:zlib";

const repo = fileURLToPath(new URL("../", import.meta.url));
const root = mkdtempSync(path.join(os.tmpdir(), "iz-workbook-import-"));
const password = `Import-${randomUUID()}`;
const seed = JSON.parse(readFileSync(path.join(repo, "data/default-state.json"), "utf8"));
for (const account of seed.accounts) {
  account.password = password;
  account.passwordHash = "";
}
for (const key of Object.keys(seed.settings.automation)) seed.settings.automation[key] = false;
seed.settings.smtp = {};
seed.emailOutbox = [];
seed.settings.associates.nextAssociateNumber = 100;
seed.associates = [{
  id: "import-existing", associateNumber: 40, firstName: "Alpha", lastName: "Fixture",
  email: "alpha@example.invalid", dni: "12345678Z", phone: "600000001", service: "QA",
  status: "Baja", annualAmount: 125, joinedAt: "2024-01-02T00:00:00.000Z", lastQuotaMonth: "Junio",
  observations: "Original preserved", manualYearlyFees: { "2025": 30, "2026": 20, "2028": 70 },
  payments: [{ id: "import-payment", year: "2026", amount: 30, date: "2026-01-01" }],
  linkedAccountId: "account-2", linkedMemberId: "member-1"
}, {
  id: "import-fill", associateNumber: 41, firstName: "Beta", lastName: "Fixture",
  email: "beta@example.invalid", dni: "23456789D", phone: "", service: "QA", status: "Activa",
  annualAmount: 100, joinedAt: "2024-01-01T00:00:00.000Z", manualYearlyFees: { "2028": 80 }
}, ...[1, 2].map(index => ({
  id: `ambiguous-${index}`, associateNumber: 50 + index, firstName: "Ambiguous", lastName: "Fixture",
  email: "ambiguous@example.invalid", dni: "", status: "Activa"
}))];
const seedPath = path.join(root, "seed.json");
writeFileSync(seedPath, JSON.stringify(seed));
const probe = net.createServer();
probe.listen(0, "127.0.0.1");
await once(probe, "listening");
const port = probe.address().port;
await new Promise(resolve => probe.close(resolve));
const base = `http://127.0.0.1:${port}`;
let server;

// Minimal stored ZIP fixture, including CRCs. No real workbook or external dependency.
function zip(entries) {
  const local = [], central = [];
  let offset = 0;
  for (const [entryName, text] of Object.entries(entries)) {
    const name = Buffer.from(entryName), data = Buffer.from(text), crc = crc32(data);
    const header = Buffer.alloc(30);
    header.writeUInt32LE(0x04034b50); header.writeUInt16LE(20, 4);
    header.writeUInt32LE(crc, 14); header.writeUInt32LE(data.length, 18);
    header.writeUInt32LE(data.length, 22); header.writeUInt16LE(name.length, 26);
    const record = Buffer.alloc(46);
    record.writeUInt32LE(0x02014b50); record.writeUInt16LE(20, 4); record.writeUInt16LE(20, 6);
    record.writeUInt32LE(crc, 16); record.writeUInt32LE(data.length, 20);
    record.writeUInt32LE(data.length, 24); record.writeUInt16LE(name.length, 28);
    record.writeUInt32LE(offset, 42);
    local.push(header, name, data); central.push(record, name);
    offset += header.length + name.length + data.length;
  }
  const directory = Buffer.concat(central), end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50); end.writeUInt16LE(Object.keys(entries).length, 8);
  end.writeUInt16LE(Object.keys(entries).length, 10); end.writeUInt32LE(directory.length, 12);
  end.writeUInt32LE(offset, 16);
  return Buffer.concat([...local, directory, end]);
}

const headers = ["Marca temporal", "Nombre", "Apellidos", "DNI", "Tel\u00e9fono", "E-mail",
  "Servicio al que pertenece", "Justificante de pago", "2024", "2025", "2026",
  "MES DE LA ULTIMA CUOTA", "Anual", "Observaciones", "2027", "Numero de socio"];
const xmlEscape = value => String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
function workbook(records, { omitRowNumbers = false, duplicateRowNumbers = false } = {}) {
  const rows = [headers, ...records.map(row => headers.map(header => row[header] ?? ""))];
  const sheet = rows.map((row, i) => `<row${omitRowNumbers ? "" : ` r="${duplicateRowNumbers && i > 0 ? 2 : i + 1}"`}>${row.map((value, j) =>
    `<c r="${String.fromCharCode(65 + j)}${i + 1}" t="inlineStr"><is><t>${xmlEscape(value)}</t></is></c>`
  ).join("")}</row>`).join("");
  const buffer = zip({
    "[Content_Types].xml": '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>',
    "_rels/.rels": '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>',
    "xl/workbook.xml": '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Listado de socios" sheetId="1" r:id="rId1"/></sheets></workbook>',
    "xl/_rels/workbook.xml.rels": '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>',
    "xl/worksheets/sheet1.xml": `<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>${sheet}</sheetData></worksheet>`
  });
  return { name: "synthetic-members.xlsx", contentBase64: buffer.toString("base64") };
}

function row(index, overrides = {}) {
  return { Nombre: `Fixture${index}`, Apellidos: "Synthetic", DNI: `${10000000 + index}A`,
    "Tel\u00e9fono": "600000099", "E-mail": `fixture${index}@example.invalid`,
    "Servicio al que pertenece": "QA", "Numero de socio": 600 + index, ...overrides };
}

async function start() {
  const env = { ...process.env, NODE_ENV: "test", HOST: "127.0.0.1", PORT: String(port), DATABASE_URL: "",
    IZ_DATA_DIR: path.join(root, "data"), IZ_DEFAULT_STATE_PATH: seedPath, IZ_BASE_URL: base,
    AUTOMATION_INTERVAL_MS: "86400000", IZ_RECOVERY_ADMIN_PASSWORD: "" };
  for (const key of Object.keys(env)) if (key.startsWith("SMTP_") || key.startsWith("IZ_BOOTSTRAP_ADMIN_")) env[key] = "";
  server = spawn(process.execPath, ["server.js"], { cwd: repo, env, stdio: ["ignore", "pipe", "pipe"] });
  server.stdout.resume(); server.stderr.resume();
  for (let i = 0; i < 100; i++) {
    if (server.exitCode !== null) throw new Error(`Fixture server exited (${server.exitCode})`);
    try {
      const response = await fetch(base + "/healthz", { signal: AbortSignal.timeout(1000) });
      await response.arrayBuffer();
      if (response.ok) return;
    } catch {}
    await delay(100);
  }
  throw new Error("Import fixture server did not start");
}
async function stop() {
  if (server && server.exitCode === null && server.signalCode === null) {
    const exited = once(server, "exit"); server.kill(); await exited;
  }
}
async function request(route, cookie = "", body, status = 200) {
  const response = await fetch(base + route, { method: body === undefined ? "GET" : "POST",
    signal: AbortSignal.timeout(10000), headers: { Cookie: cookie, "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body) });
  const data = await response.json();
  assert.equal(response.status, status, `${route}: ${data.error || ""}`);
  return { data, headers: response.headers };
}
async function login(email) {
  const { headers } = await request("/api/login", "", { email, password });
  return headers.getSetCookie().map(value => value.split(";")[0]).join("; ");
}
const previewRoute = "/api/import/associate-workbook/preview";
const commitRoute = "/api/import/associate-workbook/commit";
let admin;
const state = async () => (await request("/api/storage/export-state", admin)).data;
async function preview(file) {
  const result = await request(previewRoute, admin, { workbookFile: file });
  assert.equal(result.headers.get("cache-control"), "no-store");
  return result.data.preview;
}
async function commit(file, view, approvedReviewRowIds = [], status = 200) {
  const result = await request(commitRoute, admin, { workbookFile: file, previewToken: view.previewToken, approvedReviewRowIds }, status);
  assert.equal(result.headers.get("cache-control"), "no-store");
  return result.data;
}

try {
  await start();
  admin = await login("admin@isocronazero.org");
  const member = await login("lucia@isocronazero.org");
  const preserveRow = { Nombre: "Alpha", Apellidos: "Fixture", "E-mail": "alpha@example.invalid" };
  const file = workbook([preserveRow]);
  for (const route of [previewRoute, commitRoute]) {
    await request(route, "", { workbookFile: file }, 401);
    await request(route, member, { workbookFile: file }, 403);
  }
  const before = await state();
  let view = await preview(file);
  assert.equal(view.summary.reviewRows, 1);
  assert.equal(view.rows[0].yearlyFees["2026"], null, "Blank is not an imported zero");
  await request(commitRoute, admin, { workbookFile: file }, 409);
  await commit(file, view, [], 400);
  await commit(file, view, ["unknown"], 400);
  await commit(file, view, ["row-1", "row-1"], 400);
  await commit(file, view, [2], 400);
  await request(commitRoute, admin, { workbookFile: file, previewToken: view.previewToken, approvedReviewRows: [2] }, 400);
  assert.deepEqual((await state()).associates, before.associates, "Rejected commits do not persist changes");
  await commit(file, view, ["row-1"]);
  let actual = await state();
  const original = before.associates.find(item => item.id === "import-existing");
  const preserved = actual.associates.find(item => item.id === original.id);
  for (const key of Object.keys(original).filter(key => key !== "observations")) {
    assert.deepEqual(preserved[key], original[key], `Preserve existing ${key}`);
  }
  for (const key of ["accounts", "members", "courses", "emailOutbox", "automationRuns"]) {
    assert.deepEqual(actual[key], before[key], `Import does not trigger ${key} side effects`);
  }

  const invalid = workbook([
    ...["50 euros", "-1", "Infinity", "NaN", "0x32"].map((amount, i) => row(i + 1, { "2025": amount })),
    row(10, { "Numero de socio": "1.7" }),
    { ...preserveRow, Nombre: "Changed", "2026": 40, "2025": 0 },
    row(11, { "Numero de socio": 40 }),
    row(12, { "Numero de socio": 999 }), row(13, { "Numero de socio": 999 }),
    { Nombre: "Ambiguous", Apellidos: "Fixture", "E-mail": "ambiguous@example.invalid" }
  ]);
  const invalidView = await preview(invalid);
  assert.equal(invalidView.rows.filter(item => item.importStatus !== "blocked").length, 1, "Only the first unused number is eligible");
  assert.ok(invalidView.rows[6].blockers.some(reason => reason.startsWith("Cuota 2025")), "An explicit zero cannot erase a paid year");
  assert.ok(invalidView.rows.at(-1).blockers.includes("identidad ambigua entre fichas existentes"));
  await commit(invalid, invalidView, ["row-1"], 400);
  await commit(workbook([row(90)]), view, [], 409);

  const fillFile = workbook([row(40, { Nombre: "Beta", Apellidos: "Fixture", "E-mail": "beta@example.invalid",
    DNI: "23456789D", "Numero de socio": "", "2026": "25,50" })]);
  const fillView = await preview(fillFile);
  assert.equal(fillView.rows[0].importStatus, "review");
  assert.ok(fillView.rows[0].changes.some(change => change.field === "phone"));
  assert.ok(fillView.rows[0].changes.some(change => change.field === "manualYearlyFees.2026"));
  await commit(fillFile, fillView, ["row-1"]);
  const filled = (await state()).associates.find(item => item.id === "import-fill");
  assert.equal(filled.phone, "600000099");
  assert.equal(filled.associateNumber, 41);
  assert.equal(filled.yearlyFees["2026"], 25.5);
  assert.equal(filled.yearlyFees["2028"], 80);
  assert.equal(filled.annualAmount, 100);

  const selectionFile = workbook([
    row(50, { "Numero de socio": "" }), row(51, { "2026": 50 }),
    row(52, { Observaciones: "Review this synthetic row" })
  ]);
  const selectionView = await preview(selectionFile);
  assert.equal(new Set(selectionView.rows.map(item => item.previewRowId)).size, selectionView.rows.length);
  assert.deepEqual((await preview(selectionFile)).rows.map(item => item.previewRowId), selectionView.rows.map(item => item.previewRowId), "IDs are stable for the same workbook");
  assert.deepEqual(selectionView.summary, { totalRows: 3, readyRows: 1, reviewRows: 2, blockedRows: 0 });
  const selected = await commit(selectionFile, selectionView, ["row-1"]);
  assert.equal(selected.result.importedCount, 2);
  assert.equal(selected.result.skippedCount, 1);
  actual = await state();
  assert.equal(actual.associates.some(item => item.email === "fixture52@example.invalid"), false);
  const generatedNumber = actual.associates.find(item => item.email === "fixture50@example.invalid").associateNumber;
  assert.ok(generatedNumber > 652, "Generated numbers reserve all supplied numbers first");
  assert.equal(new Set(actual.associates.map(item => item.associateNumber)).size, actual.associates.length);
  await commit(selectionFile, selectionView, ["row-1"], 409);
  const repeatFile = workbook([row(51, { "2026": 50 })]);
  await commit(repeatFile, await preview(repeatFile));
  const repeated = await state();
  assert.equal(repeated.associates.length, actual.associates.length);
  assert.equal(repeated.associates.find(item => item.email === "fixture51@example.invalid").yearlyFees["2026"], 50);

  const paymentFile = workbook([{ ...preserveRow, "2026": 50 }]);
  await commit(paymentFile, await preview(paymentFile), ["row-1"]);
  const paid = (await state()).associates.find(item => item.id === "import-existing");
  assert.equal(paid.manualYearlyFees["2026"], 20, "Do not count existing recorded payments twice");
  assert.equal(paid.yearlyFees["2026"], 50);
  const noRowNumbers = workbook([row(70, { DNI: "" }), row(71, { DNI: "" })], { omitRowNumbers: true });
  const inferred = await preview(noRowNumbers);
  assert.deepEqual(inferred.rows.map(item => item.sourceRow), [0, 0], "Source row is only traceability, not authorization");
  assert.deepEqual(inferred.rows.map(item => item.previewRowId), ["row-1", "row-2"]);
  await commit(noRowNumbers, inferred, ["row-1"]);
  const afterInferred = await state();
  assert.ok(afterInferred.associates.some(item => item.email === "fixture70@example.invalid"));
  assert.equal(afterInferred.associates.some(item => item.email === "fixture71@example.invalid"), false, "Unselected row remains excluded");
  const duplicateRows = workbook([row(72, { DNI: "" }), row(73, { DNI: "" })], { duplicateRowNumbers: true });
  const duplicateView = await preview(duplicateRows);
  assert.deepEqual(duplicateView.rows.map(item => item.sourceRow), [2, 2]);
  assert.deepEqual(duplicateView.rows.map(item => item.previewRowId), ["row-1", "row-2"]);
  await commit(duplicateRows, duplicateView, ["row-1", "row-1"], 400);
  assert.deepEqual((await state()).associates, afterInferred.associates, "Duplicate approval IDs cannot cause partial writes");
  await commit(duplicateRows, duplicateView, ["row-2"]);
  const afterDuplicate = await state();
  assert.equal(afterDuplicate.associates.some(item => item.email === "fixture72@example.invalid"), false);
  assert.ok(afterDuplicate.associates.some(item => item.email === "fixture73@example.invalid"));
  const expected = (await state()).associates;
  await stop(); await start(); admin = await login("admin@isocronazero.org");
  assert.deepEqual((await state()).associates, expected, "Import survives restart without losing existing data");

  const app = readFileSync(path.join(repo, "public/app.js"), "utf8");
  assert.ok(app.includes("data-associate-workbook-review"));
  assert.ok(app.includes("workbookFile: associateWorkbookDraftFile, previewToken, approvedReviewRowIds"));
  assert.ok(app.includes('value="${escapeHtml(item.previewRowId)}"'));
  console.log("Associate workbook import check passed (synthetic XLSX, permissions, review, preservation, conflicts, restart).");
} finally {
  await stop();
  const resolved = path.resolve(root);
  assert.ok(resolved.startsWith(path.resolve(os.tmpdir()) + path.sep) && path.basename(resolved).startsWith("iz-workbook-import-"));
  rmSync(resolved, { recursive: true, force: true });
}
