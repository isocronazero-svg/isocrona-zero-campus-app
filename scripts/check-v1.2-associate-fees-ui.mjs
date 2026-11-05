import fs from "node:fs";
import assert from "node:assert/strict";

const simplifier = fs.readFileSync("public/assets/js/app/admin/associateFormSimplifier.js", "utf8");
const feeEnhancer = fs.readFileSync("public/assets/js/app/admin/membershipFeeYearEnhancer.js", "utf8");
const app = fs.readFileSync("public/app.js", "utf8");

for (const id of ["editAssociateFee2024", "editAssociateFee2025", "editAssociateFee2026", "editAssociateFee2027"]) {
  assert.match(simplifier, new RegExp(`"${id}"`), `${id} debe conservarse en ajustes históricos`);
  assert.match(app, new RegExp(`id=\\"${id}\\"`), `${id} debe seguir existiendo en el formulario real`);
}

assert.match(simplifier, /Ajustes históricos de cuota/, "debe existir un bloque explícito para ajustes históricos");
assert.match(simplifier, /pago ordinario se registra en el bloque de pagos/, "debe diferenciar ajuste manual y pago ordinario");
assert.match(feeEnhancer, /Cuota activa/, "la cuota vigente debe quedar visible de forma compacta");
assert.match(app, /id=\"associatePaymentForm\"/, "el registro de pagos debe mantenerse");
assert.match(app, /Historial de movimientos/, "el historial de pagos debe mantenerse");
assert.match(app, /data-action=\"delete-associate-payment\"/, "las operaciones existentes sobre movimientos no deben desaparecer");

console.log("V1.2 associate fees UI checks: OK");
