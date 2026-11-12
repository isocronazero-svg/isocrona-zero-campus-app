# Ejecución autónoma · 2026-11-12 · #347

- Verificado acceso de escritura, PR #349 fusionada, #350 gobernanza abierta; normas leídas en automation/agent-governance-v1.
- Railway QA aislado: portal-v13-qa SUCCESS en c9f43b5 (06:37 UTC); no se ha modificado.
- Cambio mínimo: el endpoint autenticado de justificantes ahora incluye códigos estructurados NO_ATTACHED e INVALID_FILE en sus errores 404/422. Conserva mensajes, HTTP, autorización y cabeceras anteriores.
- Rama: fix/v13-proof-error-code-347; commit 5b630fcb29f695086db5b7a11d29efd7c3b6aee7.
- npm run check:app: NOT RUN; conector GitHub no ejecuta comandos y no hay checkout local autenticado confirmado.
- CI: pendiente de comprobar en PR; no afirmar PASS sin evidencia.
- Alcance incompleto: falta distinguir NOT_FOUND, PREVIEW_UNSUPPORTED y NETWORK_ERROR en UI y verificar PDF real/Safari con datos sintéticos.
- Riesgo: bajo, cambio aditivo en JSON de error. Rollback: revertir commit o cerrar PR. Sin cambios en producción, FIREZONE ni infraestructura.
- Consumo medido: no disponible.

## 2026-11-12 · Pruebas sintéticas de #347
- Añadidas aserciones al chequeo existente `scripts/check-course-finance.mjs` para NO_ATTACHED (404), INVALID_FILE (422), cabecera no-store y denegación 403 sin filtración de códigos de archivo.
- Commit: a6ee5ae5ce258665c2d72bdd68e7b58e62340639; misma rama y PR #357 en borrador, sin duplicar CI ni abrir otra PR.
- Prueba local `npm run check:app`: NOT RUN, sin checkout autenticado ejecutable. Consultar CI del commit antes de aprobar.
- Pendiente: validación Safari con PDF sintético y mensajes UI; no fusionar ni desplegar.
