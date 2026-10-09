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

Backlog abierto tras limpieza 09/10: solo #227 (V1), #134 (operación producción IVASPE), #112 (contenido) y #109 (deuda técnica V2). PR #231 sigue abierta aparte.

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

### Documentos de preparación
- `docs/member-import-qa.md`: contrato de tests técnicos; el agente debe reutilizarlo.
- `docs/member-import-business-rules.md`: borrador de reglas a validar con secretaría antes de datos reales.

El borrador propone: portal autoritativo para datos no vacíos, no renumerar existentes, no cambiar estados automáticamente, no reducir pagos/cuotas existentes, no crear/sincronizar cuentas ni mandar emails durante la migración, justificantes fuera del alcance y discrepancias a revisión humana.

Pendientes de validar con secretaría: estados/bajas, prioridad portal↔Excel, número socio, significado de cuotas 2024-2027, campo anual/acumulado, fecha de alta, observaciones, altas nuevas y cuentas vinculadas.

## 5. Railway / IVASPE

### #136 — automatización Railway: CERRADA 09/10
Ya implementada en `main`: workflow manual, `dry_run=true`, secrets, `railway ssh`, preflight persistencia, validación posterior y check estático en `check:app`.

No gastar créditos en #136.

### #134 — importación real IVASPE en producción: ABIERTA
Es una operación/verificación de producción, no desarrollo.

Evidencia:
- repositorio/pipeline valida 175 preguntas;
- entre 200 runs recientes no aparece ejecución del workflow manual IVASPE;
- dos ejecuciones antiguas de `Import Test Zone Temario Comun to Railway` (25/09, runs #1/#2) terminaron `failure`;
- NO asumir que Railway contiene las 175 preguntas.

Secuencia segura: confirmar servicio/volumen/SHA → backup externo → dry-run → revisar → autorización real → importar → verificar recuento/filtros → reiniciar/redeployar → verificar persistencia → cerrar #134.

No gastar créditos salvo fallo concreto reproducido.

### PR #161
`known_hosts` antigua/desfasada. No fusionar preventivamente; solo si el workflow actual reproduce un problema real SSH/host-key.

## 6. Contenido — #112

#111 fue cerrada 09/10 como duplicada/sustituida por #112 para evitar dos backlogs paralelos.

#112 queda como único hilo de ampliación IVASPE por tandas de 25.

Estado real del repositorio: 7 CSV x 25 = 175 preguntas:
- Incendios urbanos y estructurales: 25;
- Incendios forestales: 25;
- Rescate y salvamento: 25;
- Sanitario operativo 01: 25;
- Sanitario operativo 02: 25;
- Riesgo químico y mercancías peligrosas: 25;
- Material, equipos y herramientas: 25.

Respecto al plan original siguen pendientes:
- Legislación y organización — 25;
- Mando, control y comunicaciones — 25.

Sanitario ya tiene 50. Cuando se retome contenido, siguiente bloque recomendado: Legislación y organización, salvo decisión explícita distinta.

No mezclar #112 con el cierre V1. La carga en Railway se controla aparte en #134.

## 7. Deuda técnica V2 — #109

#109 sigue abierta pero fue reencuadrada 09/10.

Fases ya realizadas y que NO deben repetirse:
- utilidades HTTP → `server/http.js`;
- wrappers/router → `server/router-utils.js`;
- auth/session → `server/auth.js`;
- transporte/sanitización de estado → `server/state-transport.js`.

Además ya existen módulos de notices, live, question contributions/maintenance/import, shared tests, banners, diplomas y certificados.

Pendiente V2: medir dominios que siguen en `server.js` y extraer incrementalmente, especialmente socios/cuotas/documentos y lógica restante de Test Zone/live. Un dominio por PR, sin reescritura total ni cambio de framework.

Fuera del sprint #227.

## 8. Trabajo adelantado sin créditos el 09/10

Completado:
1. auditoría #231 + especificación P2;
2. review de continuidad en #231;
3. cierre #225/#226;
4. `docs/member-import-qa.md`;
5. `docs/member-import-business-rules.md`;
6. separación QA automático/manual en #227;
7. App checks #307 confirmado verde;
8. `docs/v1-manual-qa-runbook.md`;
9. revisión deploy Railway/README y criterio SHA productivo;
10. auditoría #136 y cierre como completada;
11. auditoría Actions y redefinición #134 como operación productiva;
12. auditoría contenido: #111 cerrada duplicada, #112 actualizada con 175 reales y 2 bloques pendientes;
13. auditoría arquitectura #109 y reencuadre V2 para no repetir fases ya hechas;
14. backlog reducido a cuatro issues abiertas con responsabilidades claras;
15. bitácora actualizada.

Siguiente trabajo sin créditos:
- ejecutar runbook manual #227 desde móvil/escritorio y registrar PASS/FAIL;
- validar `docs/member-import-business-rules.md` con secretaría;
- preparar copia externa/ensayo real de restauración cuando se autorice;
- no empezar nuevas funciones antes de congelar V1.

## 9. Próximo uso recomendado de créditos

No gastar en #224, #225/#228, #226/#229, #111 ni #136.

Orden:
1. corregir P2 #231 si migración prioritaria;
2. #227: solo corregir regresiones del QA;
3. backup/ensayo + operaciones reales con autorización;
4. después #112 / #109 / otras V2.

Estimación si no aparecen regresiones serias:
- #231: ~5–15 créditos;
- #227: ~5–15 créditos;
- reserva objetivo total: ~10–30 créditos.

## 10. Norma de continuidad móvil / escritorio

GitHub + esta bitácora mandan.

Al comenzar: leer documento, revisar commits/PR posteriores, respetar decisiones y no crear plan paralelo.

Al terminar una sesión que cambie estado/plan: actualizar bitácora, indicar qué se hizo, qué NO hacer y siguiente paso.

No fusionar #231 con P2 abierto. No iniciar funciones nuevas hasta cerrar #227.