import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const source = readFileSync(new URL("../public/assets/js/app/campus/courseFinanceEnhancer.js", import.meta.url), "utf8");
assert.match(source, /paymentStatus === "validated" && !window\.confirm\(/);
assert.match(source, /El justificante por sí solo no acredita el cobro/);
console.log("Confirmación de cobro en tesorería: OK");
