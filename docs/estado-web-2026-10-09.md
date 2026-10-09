# Estado del portal — 9 de octubre de 2026

Repositorio: `isocronazero-svg/isocrona-zero-campus-app`.
Portal: `https://portal.isocronazero.org`.

Este documento es la referencia operativa para continuar desde cualquier chat/dispositivo. Antes de iniciar una tarea: leer esta bitácora y revisar commits/PR posteriores.

## 1. Estado general

La V1 funcional está prácticamente cerrada en código.

Último bloque funcional integrado y revisado: `94804766fe4e57538318821536fdfd31a1ce7cf6` (#230, backup/recovery). Después se añadieron commits documentales de continuidad/QA. App checks #307 sobre `320ddf1041e04cf373fef44166a4dc897404b8ff`: `success`.

Prioridad actual:
1. #231 solo si se va a usar la migración de socios; no fusionar con el P2 abierto.
2. #227 QA final, corregir solo regresiones demostradas y congelar V1.
3. Operaciones reales de datos/Railway solo con backup, dry-run y autorización explícita.

## 2. Bloques V1 terminados

### Cursos e inscripción
#224 fusionada: CTA único, formulario directo, estados claros, vista alumno simplificada, protección frente a doble envío y reintento de justificante sin perder archivo/nota.

### Test en Vivo
#225 completada por PR #228 y cerrada administrativamente.

Comportamiento V1:
- tocar opción guarda directamente;
- rectificación mientras esté abierta;
- última respuesta válida sustituye a anterior;
- sin doble puntuación;
- cierre automático cuando responden todos o por tiempo;
- sin solución/puntos/ranking antes de cierre;
- reveal con corrección, distribución y clasificación;
- salas nuevas UI: autoavance ~6 s a siguiente pregunta/podio;
- legacy/API sin `autoAdvance`: avance manual.

### Test normal — Aprendizaje
#226 completada por PR #229 y cerrada administrativamente.

Resultado: selector Examen/Aprendizaje, corrección pregunta a pregunta, respuesta corregida bloqueada, feedback/explicación, sin soluciones en payload inicial, marcado para repasar y resultado integrado en historial/estadísticas/falladas.

Riesgo residual aceptado: intento de aprendizaje sin finalizar no se recupera tras refrescar.

### Diplomas
#223 fusionada: A4 horizontal anverso/reverso, contraste, temario real, anexos, preview/PDF alineados. Diplomas emitidos protegidos por #155.

### Backup y recuperación
#230 fusionada: export admin `no-store`, restauración aislada verificada, uploads comprobados y `docs/BACKUP-RECOVERY.md`.

Una copia en el mismo volumen NO sustituye una copia externa recuperable.

## 3. Única issue V1 abierta: #227

`V1 · QA final, regresiones y congelación de producto`.

Precondiciones funcionales cumplidas. Documentos:
- `docs/v1-qa-checklist.md` — checklist extensa;
- `docs/v1-manual-qa-runbook.md` — recorrido manual corto.

### Cobertura automática
`npm run check:app` cubre, entre otros: backup/recovery, diplomas, certificados, live, modo Aprendizaje, Test Zone, navegación, render socio/cursos, avisos/adjuntos, banners, auth, state transport/permisos, hardening, rate/payload limits, socios/pagos, journey de cursos y recuperación de formularios.

App checks #307 de `main`: verde.

### QA manual pendiente
No repetir CI. Concentrarse en:
1. login/logout real, admin ↔ Modo Socio y permisos visibles;
2. responsive ~390/768/1440 px;
3. curso/inscripción/espera/justificante/reintento;
4. diploma preview/PDF/verificación;
5. Test Examen + Aprendizaje en navegador real;
6. Test en Vivo con host + 2 participantes: rectificación, cierre al último, reveal y autoavance ~6 s;
7. aviso/adjunto/compartir WhatsApp actual;
8. copia externa + ensayo de recuperación antes de migración/piloto.

Registrar PASS / FAIL reproducible / BLOQUEADO / NO APLICA.

### Producción / deploy
`railway.json`: `npm start`, `/healthz`, restart `ON_FAILURE`.

README exige post-deploy: `/healthz`, login admin, login socio, test, live, export estado y consola; y rollback/export previo/snapshot externo.

Para cerrar #227 hay que registrar el SHA realmente desplegado. CI verde de `main` no demuestra que producción ejecute ese SHA.

El portal no fue accesible desde el navegador técnico de esta sesión; no marcar producción PASS sin evidencia real.

## 4. PR #231 — migración segura del Excel de socios

PR abierta, `mergeable: true`, 1 commit `23b41b3...`, 4 archivos, CI de rama verde previo a auditoría. No ha tocado Excel real ni producción.

Objetivo: conservar datos existentes, completar solo huecos tras revisión, bloquear discrepancias, distinguir vacío/0, detectar duplicados/identidades ambiguas, selección explícita de filas review, `previewToken`, sin automatizaciones ni efectos laterales de cuentas.

### Auditoría 09/10
Revisados `public/app.js`, `server.js`, `scripts/check-associate-workbook-import.mjs` y `scripts/check-app.mjs`. No se encontró otro P1/P2 dentro del alcance además del P2 ya abierto.

### P2 bloqueante
`sourceRow` depende de `row@r`, atributo opcional del XLSX. Si falta, varias filas pueden acabar con `sourceRow=0`; hoy ese valor se usa como autorización de importación.

Corrección obligatoria:
1. `sourceRow` solo trazabilidad/visualización;
2. `previewRowId` único y estable por fila;
3. usarlo en checkbox/API/aprobaciones;
4. backend rechaza IDs desconocidos y duplicados;
5. fixture XLSX sin `row@r` que seleccione una sola fila review;
6. repetir check de importador, `check:app` y smoke;
7. resolver P2 solo con tests verdes.

No fusionar #231 antes de esto.

### Contrato QA
`docs/member-import-qa.md` creado y enlazado en #231. El agente debe reutilizarlo; no rediseñar pruebas.

### Reglas de negocio pendientes
Confirmar con secretario: estados/bajas, prioridad portal↔Excel, número socio, cuotas 2024-2027, observaciones, altas nuevas y cuentas vinculadas.

Criterio recomendado: dato no vacío del portal no se reemplaza automáticamente por Excel.

## 5. Railway / IVASPE

### #136 — automatización Railway: CERRADA 09/10
Auditoría confirma que ya está implementada en `main`:
- workflow manual `Import Test Zone IVASPE to Railway`;
- `dry_run=true` por defecto;
- `RAILWAY_TOKEN` y `RAILWAY_SSH_PRIVATE_KEY` desde Secrets;
- ejecución remota por `railway ssh`, no `railway run` local;
- preflight de persistencia;
- dry-run obligatorio antes de real;
- validación posterior de `testZoneQuestions`;
- `scripts/check-railway-ivaspe-workflow.mjs` integrado en `check:app` y controles para no imprimir secretos.

No gastar créditos de Codex en #136.

### #134 — importación real IVASPE en producción: ABIERTA
Ya no es una tarea de desarrollo: es una operación/verificación de producción.

Evidencia actual:
- repositorio/pipeline valida 175 preguntas;
- entre los 200 runs recientes revisados no aparece ninguna ejecución del workflow manual IVASPE;
- sí aparecen dos ejecuciones antiguas de `Import Test Zone Temario Comun to Railway` el 25/09/2026, runs #1 y #2, ambas `failure`;
- por tanto NO asumir que Railway contiene las 175 preguntas.

Secuencia segura para cerrar #134 cuando se autorice:
1. confirmar servicio, volumen y SHA desplegado;
2. copia externa recuperable;
3. ejecutar workflow IVASPE con `dry_run=true`;
4. revisar salida/persistencia;
5. autorización explícita para importación real;
6. verificar recuento, deduplicación y filtros UI;
7. reiniciar/redeployar y verificar persistencia;
8. registrar evidencia y cerrar #134.

No gastar créditos en #134 salvo que se reproduzca un fallo concreto de código/infraestructura.

### PR #161
`known_hosts` antigua/desfasada. No fusionar preventivamente. Revisar solo si el workflow actual reproduce un fallo real de host-key/SSH.

## 6. Contenido y V2 — no bloquean V1

- #111 ampliar banco de preguntas.
- #112 continuar bloques IVASPE.
- #109 refactor backend incremental: V2.

Hay 175 preguntas en siete CSV de 25 y pipeline preparado. No bloquea V1.

## 7. Trabajo adelantado sin créditos el 09/10

Completado:
1. auditoría #231 + especificación P2;
2. review de continuidad en #231;
3. cierre #225/#226;
4. `docs/member-import-qa.md`;
5. separación QA automático/manual en #227;
6. App checks #307 confirmado verde;
7. `docs/v1-manual-qa-runbook.md`;
8. revisión deploy Railway/README y criterio SHA productivo;
9. auditoría #136 y cierre como completada;
10. auditoría de Actions: workflow IVASPE sin ejecución encontrada entre 200 runs; dos runs antiguos Temario Común fallidos;
11. #134 redefinida/documentada como operación de producción;
12. bitácora actualizada.

Siguiente trabajo sin créditos:
- ejecutar runbook manual #227 desde móvil/escritorio y registrar resultados;
- preparar reglas reales de migración con secretario;
- preparar copia externa/ensayo de restauración;
- auditar #111/#112 para separar contenido existente de contenido realmente pendiente.

## 8. Próximo uso recomendado de créditos

No gastar en #224, #225/#228, #226/#229 ni #136.

Orden:
1. corregir P2 #231 si migración prioritaria;
2. #227: solo corregir regresiones que aparezcan en QA;
3. backup/ensayo + operaciones reales solo con autorización;
4. después contenido/Railway/V2.

Estimación si no aparecen regresiones serias:
- #231: ~5–15 créditos;
- #227: ~5–15 créditos;
- reserva objetivo total: ~10–30 créditos.

## 9. Norma de continuidad móvil / escritorio

GitHub + esta bitácora mandan.

Al comenzar: leer documento, revisar commits/PR posteriores, respetar decisiones y no crear plan paralelo.

Al terminar una sesión que cambie estado/plan: actualizar bitácora, indicar qué se hizo, qué NO hacer y siguiente paso.

No fusionar #231 con P2 abierto. No iniciar funciones nuevas hasta cerrar #227.