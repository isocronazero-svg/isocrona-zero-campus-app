import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const source = readFileSync(new URL("../public/assets/js/app/campus/courseFinanceEnhancer.js",import.meta.url),"utf8");
assert.match(source,/const scopedRows = \(snapshot\.courses \|\| \[\]\)/);
assert.match(source,/selectedFinanceCourseId === "all" \|\| course\.id === selectedFinanceCourseId/);
for (const status of ["pending","incident","validated","not-required"]) assert.ok(source.includes('row.paymentStatus === "'+status+'"'));
assert.match(source,/const rows = filterRows\(snapshot\)/);
console.log("Tesorería: indicadores limitados al curso seleccionado OK");
