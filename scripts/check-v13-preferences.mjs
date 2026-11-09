import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { normalizeV13Preferences, projectV13Export } = require("../server/v13-preferences.js");

assert.deepEqual(normalizeV13Preferences({ shirtSize: "XL", shirtCut: "unisex", diplomaLanguage: "es-va" }), {
  shirtSize: "XL", shirtCut: "unisex", diplomaLanguage: "es-va"
});
assert.deepEqual(normalizeV13Preferences({ shirtSize: "M" }, { diplomaLanguage: "es" }), {
  shirtSize: "M", diplomaLanguage: "es"
});
assert.throws(() => normalizeV13Preferences({ diplomaLanguage: "fr" }), RangeError);
assert.throws(() => normalizeV13Preferences({ shirtSize: "XXXL-no" }), RangeError);
const members = [
  { id: "1", name: "=HYPERLINK(1)", surname: "Ejemplo", v13Preferences: { shirtSize: "M", shirtCut: "mujer", diplomaLanguage: "es-va", shirtConfirmed: true } },
  { id: "2", name: "Socio", surname: "Sin datos" }
];
const shirts = projectV13Export(members, "shirts");
assert.equal(shirts.rows[0][1], "'=HYPERLINK(1)");
assert.deepEqual(shirts.rows[0].slice(3), ["M", "mujer", "Sí"]);
assert.deepEqual(shirts.rows[1].slice(3), ["", "", "No"]);
assert.equal(projectV13Export(members, "diplomas").rows[0][3], "Castellano + valenciano");
assert.equal(projectV13Export(members, "diplomas").rows[1][3], "Castellano");
console.log("V1.3 preferencias y exportaciones: OK");
