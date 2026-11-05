import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../public/assets/js/app/campus/courseFinanceEnhancer.js", import.meta.url), "utf8");

[
  "Pagos que requieren atención",
  "Pendientes",
  "Incidencias",
  "Validados",
  "Todas las formaciones",
  "Socio",
  "No socio",
  "Justificante: ${row.hasPaymentProof ? \"adjunto\" : \"pendiente\"}",
  "Ver justificante",
  "Validar pago",
  "Marcar incidencia",
  "Más detalles",
  "Validado por",
  "Volver a pendiente",
  "/api/course-finance/courses/"
].forEach((token) => assert.ok(source.includes(token), `Falta en tesorería V1.2: ${token}`));

assert.ok(source.includes('data-payment-status="${escapeHtml(row.paymentStatus)}"'), "Debe conservar el estado de pago por fila");
assert.ok(source.includes('financeFilter = "pending"'), "La vista debe abrir priorizando pendientes");
assert.ok(source.includes("@media(max-width:600px)"), "Debe conservar adaptación móvil");

console.log("V1.2 tesorería cursos: operativa prioritaria, detalle secundario y acciones críticas presentes.");
