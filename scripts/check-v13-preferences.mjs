import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { normalizeV13Preferences, projectV13Export } = require("../server/v13-preferences.js");
const { workbookXlsx } = require("../server/v13-xlsx.js");
import { inflateRawSync } from "node:zlib";
import { readFileSync } from "node:fs";

assert.deepEqual(normalizeV13Preferences({ shirtSize: "XL", shirtCut: "unisex", diplomaLanguage: "es-va" }), {
  shirtSize: "XL", shirtCut: "unisex", diplomaLanguage: "es-va"
});
assert.deepEqual(normalizeV13Preferences({ shirtSize: "M" }, { diplomaLanguage: "es" }), {
  shirtSize: "M", diplomaLanguage: "es"
});
assert.throws(() => normalizeV13Preferences({ diplomaLanguage: "fr" }), RangeError);
assert.throws(() => normalizeV13Preferences({ sex: "invalid" }), RangeError);
assert.equal(normalizeV13Preferences({ sex: "prefiero-no-indicar" }).sex, "prefiero-no-indicar");
assert.throws(() => normalizeV13Preferences({ shirtSize: "XXXL-no" }), RangeError);
assert.throws(() => normalizeV13Preferences({ shirtConfirmed: true }), RangeError);
assert.throws(() => normalizeV13Preferences({ shirtSize: "M", shirtConfirmed: "true" }), RangeError);
assert.equal(normalizeV13Preferences({ shirtSize: "M", shirtCut: "unisex", shirtConfirmed: true }).shirtConfirmed, true);
assert.equal(normalizeV13Preferences({ shirtSize: "L" }, { shirtSize: "M", shirtCut: "unisex", shirtConfirmed: true }).shirtConfirmed, false);
const members = [
  { id: "1", name: "=HYPERLINK(1)", surname: "Ejemplo", v13Preferences: { sex: "mujer", shirtSize: "M", shirtCut: "mujer", diplomaLanguage: "es-va", shirtConfirmed: true } },
  { id: "2", name: "Socio", surname: "Sin datos" }
];
const shirts = projectV13Export(members, "shirts");
assert.equal(shirts.rows[0][1], "'=HYPERLINK(1)");
assert.deepEqual(shirts.rows[0].slice(3), ["mujer", "M", "mujer", "Sí"]);
assert.deepEqual(shirts.rows[1].slice(3), ["", "", "", "No"]);
assert.equal(projectV13Export(members, "diplomas").rows[0][3], "Castellano + valenciano");
assert.equal(projectV13Export(members, "diplomas").rows[1][3], "Castellano");
const file = workbookXlsx(shirts);
assert.equal(file.readUInt32LE(0), 0x04034b50);
assert.equal(file.readUInt16LE(6), 0, "ZIP flags must not claim an absent data descriptor");
assert.equal(file.readUInt32LE(file.length - 22), 0x06054b50);
assert.equal(file.readUInt16LE(file.length - 12), 5);
let pos = 0, sheetXml = "";
while (file.readUInt32LE(pos) === 0x04034b50) {
  const compressedSize = file.readUInt32LE(pos + 18);
  const nameLength = file.readUInt16LE(pos + 26);
  const extraLength = file.readUInt16LE(pos + 28);
  const name = file.subarray(pos + 30, pos + 30 + nameLength).toString();
  const dataStart = pos + 30 + nameLength + extraLength;
  if (name === "xl/worksheets/sheet1.xml") {
    sheetXml = inflateRawSync(file.subarray(dataStart, dataStart + compressedSize)).toString();
  }
  pos = dataStart + compressedSize;
}
assert.match(sheetXml, /Castellano|Talla/);
assert.match(sheetXml, /&apos;=HYPERLINK/);
const server = readFileSync(new URL("../server.js", import.meta.url), "utf8");
const exportStart = server.indexOf('if (requestUrl.pathname === "/api/v1.3/export"');
assert.ok(exportStart >= 0, "Admin export route must exist");
const exportRoute = server.slice(exportStart, exportStart + 2100);
assert.match(exportRoute, /getAuthenticatedAccount\(req, exportState\)/);
assert.match(exportRoute, /cookieAccount\.role !== "admin"/);
assert.match(exportRoute, /requireAdminDbUser\(req, res\)/);
const frontend = readFileSync(new URL("../public/assets/js/v13-preferences.js", import.meta.url), "utf8");
assert.match(frontend, /const version = \+\+roleCheckVersion/);
assert.match(frontend, /if \(version !== roleCheckVersion\) return/);
assert.match(frontend, /document\.getElementById\("logoutButton"\)\?\.addEventListener\("click", \(\) => \{\s*roleCheckVersion\+\+;/);
assert.match(frontend, /const requestVersion = \+\+preferencesRequestVersion/);
assert.match(frontend, /requestVersion !== preferencesRequestVersion \|\| !dialog\.open/);
assert.match(frontend, /dialog\.addEventListener\("close", \(\) => \{ preferencesRequestVersion\+\+; preferencesLoaded = false; \}\)/);
console.log("V1.3 preferencias, XLSX, permisos y cancelación de respuestas obsoletas: OK");
