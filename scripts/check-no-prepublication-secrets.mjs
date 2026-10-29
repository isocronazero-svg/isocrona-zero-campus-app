import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const checklist = readFileSync(new URL("../docs/CHECKLIST-PRUEBAS-FINALES.md", import.meta.url), "utf8");
const script = readFileSync(new URL("./run-prepublication-checklist.mjs", import.meta.url), "utf8");
const combined = `${checklist}\n${script}`;

assert.doesNotMatch(combined, /@gmail\.com/i, "Los checks públicos no deben contener correos personales Gmail");
assert.doesNotMatch(combined, /C:[\\/]Users[\\/]/i, "Los checks públicos no deben contener rutas personales de Windows");
assert.match(script, /IZ_PREPUBLICATION_ADMIN_EMAIL/, "El login de prepublicación debe recibir el email por entorno");
assert.match(script, /IZ_PREPUBLICATION_ADMIN_PASSWORD/, "El login de prepublicación debe recibir la contraseña por entorno");
assert.match(script, /password:\s*adminPassword/, "La petición debe usar la variable privada, no un literal");
assert.doesNotMatch(script, /password:\s*["'][^"']+["']/, "No debe existir una contraseña literal en el login admin del checklist");

console.log("Prepublication secret check passed: sin credenciales personales embebidas.");
