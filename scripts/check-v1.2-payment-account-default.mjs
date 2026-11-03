import assert from "node:assert/strict";
import fs from "node:fs";

const defaults = fs.readFileSync(new URL("../public/assets/js/app/campus/associationPaymentDefaults.js", import.meta.url), "utf8");
const main = fs.readFileSync(new URL("../public/assets/js/app/main.js", import.meta.url), "utf8");

assert.ok(defaults.includes('ASSOCIATION_DEFAULT_IBAN = "ES23 0073 0100 5905 0627 3646"'), "Debe existir el IBAN oficial de Isócrona Zero");
assert.ok(defaults.includes('if (!String(field.value || "").trim()) field.value = ASSOCIATION_DEFAULT_IBAN'), "Solo debe preestablecerse cuando el campo esté vacío");
assert.ok(defaults.includes("Puedes modificarla solo para esta formación"), "El IBAN debe seguir siendo editable por formación");
assert.ok(defaults.includes("No modifica la cuenta oficial de la asociación"), "Una excepción no debe alterar el valor oficial");
assert.ok(main.includes("installAssociationPaymentDefaults();"), "El valor oficial debe instalarse en la aplicación");

console.log("V1.2 cuenta de pago: IBAN oficial preestablecido sin sobrescribir valores específicos.");
