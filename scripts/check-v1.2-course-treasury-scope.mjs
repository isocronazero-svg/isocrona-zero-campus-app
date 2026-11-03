import assert from "node:assert/strict";
import fs from "node:fs";

const finance = fs.readFileSync(new URL("../public/assets/js/app/campus/courseFinanceEnhancer.js", import.meta.url), "utf8");
assert.ok(finance.includes("/api/course-finance"));
assert.ok(finance.includes("paymentStatus"));
assert.ok(finance.includes("paymentIncidentNote"));
assert.ok(finance.includes("paymentValidatedBy"));
console.log("V1.2 tesorería: contrato funcional existente conservado.");
