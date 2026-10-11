# Estado del portal — 9 de octubre de 2026

Repositorio: `isocronazero-svg/isocrona-zero-campus-app`.
Portal: `https://portal.isocronazero.org`.

Este documento es la referencia operativa para continuar desde cualquier chat/dispositivo. Antes de iniciar una tarea: leer esta bitácora y revisar commits/PR posteriores.

## 1. Estado general

**Continuidad actualizada el 11/10/2026:** ver la ultima seccion de este documento. Los estados de PR de los apartados anteriores son historicos, no una cola de trabajo vigente.

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

## Actualización 11/10/2026 — #242 (rama independiente)

Esta bitácora sigue vigente; los apartados del 09/10 son histórico. Base revisada: main `4e4dc00ce6bfdc4a92a653a7b9b0f534fa245473`; #231–#239 ya integrados. Alcance autorizado: primero #241, después #242, sin otras funcionalidades ni operaciones reales de datos.

#241 propuesta en PR #243, SHA `272677944da456f4c8ec55a8fa4b431ba6a14473`: ISO UTC para nuevas aperturas, legacy Europe/Madrid, UI local y rechazo de horas inexistentes de marzo. P2 automático corregido, regresión y check:app/smoke locales verdes; revisar CI nuevo y QA productivo antes de merge.

#242: selector de uno o varios instructores desde fichas `associates`, guarda `instructorAssociateIds`. Socio normal y admin con ficha son elegibles; cuenta admin sin ficha no. Coordinación libre queda informativa, sin conversión automática. Backend valida IDs, protege asignaciones de guardados globales obsoletos y retira el vínculo al eliminar una ficha. PDF específico INSTRUCTOR/A con nombre/apellidos/DNI de la ficha actual, curso, fechas, duración del curso, plantilla y firmantes institucionales. Descarga privada solo administración o propio socio. No modifica diplomaReady, inscripción, diplomas de alumnado ni acumulado de formación recibida.

Validación local: check:app completo PASS, regresión de certificados integrada y smoke:campus-test PASS con servidor/datos sintéticos aislados. Revisión propia P1/P2: sin hallazgos pendientes. La duración indicada es la del curso; el modelo actual no registra horas individuales impartidas. No se inventan esas horas.
QA manual pendiente: selector múltiple en móvil/escritorio; alta/edición/persistencia; dos PDFs con plantilla y firmantes reales; descargas desde socio y administración; acumulado sin horas de docencia. No marcar producción PASS ni cerrar #227 solo por CI. No se han tocado datos reales ni hecho migraciones. Mantener un PR por tema, ambos con base main, sin fusionar con pruebas rojas.

## 10. Norma de continuidad móvil / escritorio

GitHub + esta bitácora mandan.

Al comenzar: leer documento, revisar commits/PR posteriores, respetar decisiones y no crear plan paralelo.

Al terminar una sesión que cambie estado/plan: actualizar bitácora, indicar qué se hizo, qué NO hacer y siguiente paso.

No fusionar #231 con P2 abierto. No iniciar funciones nuevas hasta cerrar #227.
## Actualización 11/10/2026 — #241

Esta bitácora sigue vigente; sus apartados del 09/10 quedan como histórico.
Base revisada: main `4e4dc00ce6bfdc4a92a653a7b9b0f534fa245473`.
#231–#239 ya están integrados según commits y #227. Prioridad autorizada: #241 y después #242, un PR por tema, sin otras funcionalidades ni datos reales.

#241: nuevas aperturas guardadas como ISO UTC; control datetime-local mantiene hora local del navegador. Legacy sin offset se interpreta explícitamente en Europe/Madrid, independientemente de TZ del proceso. Backend conserva la decisión final. No se ejecuta migración. Hora repetida de otoño: primera ocurrencia; hora inexistente de primavera: rechazada al guardar.
Validación: regresión automática integrada en check:app (tres TZ, invierno/verano, límites 22:25/22:26/22:31, vacío, ISO/offset, normalización backend y retorno UI). Smoke ejecutado con servidor y datos de demostración aislados.
QA manual pendiente: curso de prueba en producción, alta/edición mostrando misma hora, rechazo antes de apertura y aceptación desde la hora exacta. No marcar producción PASS ni cerrar #227 por pruebas locales. Revisar P1/P2 y CI antes de cualquier merge.

## Actualización operativa 11/10/2026 — #241, #242 y nuevo #245

### #241 — apertura de inscripción por zona horaria
- PR #243 fusionada en `main`.
- Merge de referencia: `dbb6d274823bdcf11f4016c91cdf6fd21c6ab80e`.
- Objetivo resuelto en código: nuevas fechas canónicas con zona/UTC, `datetime-local` conserva hora local, legacy sin offset se interpreta como `Europe/Madrid`, backend autoridad final.
- Queda QA manual en producción: crear curso con apertura a 3–5 minutos vista, comprobar rechazo antes y aceptación desde el minuto exacto; verificar también edición mostrando la hora local configurada.
- No cerrar #241 como validada en producción hasta ese PASS manual.

### #242 / PR #244 — certificados de instructor vinculados a socios
Estado actual: PR #244 abierta, rama `feat/242-instructor-certificates`, último head revisado `8212798e8d563722332839c4d64325d28f5bdc4b`.

Decisiones de negocio cerradas:
- Instructor certificable = persona con ficha de socio (`associates`), sea socio normal o personal de administración.
- Admin sin ficha de socio NO es certificable.
- Selección por IDs estables (`instructorAssociateIds`), nunca por nombre libre.
- `course.coordinator` puede mantenerse solo como texto legacy/informativo; no crea identidad certificable.
- Uno o varios instructores por curso.
- Certificado específico de `INSTRUCTOR/A`, separado del diploma del alumno.
- Datos personales del certificado se resuelven desde la ficha del socio.
- Las horas impartidas NO se suman al certificado acumulado de formación recibida.
- No mezclar con `diplomaReady` de alumnado.

Bloqueos de review que deben quedar corregidos antes de merge:
1. P1: no se puede generar/mostrar/descargar certificado de instructor antes de que el curso esté finalizado/cerrado. Backend debe rechazar incluso URL directa y también a admin.
2. P2: cambios de instructores no pueden perderse al usar subacciones del editor (`Generar estructura`, `Aplicar plantilla`, `Añadir módulo`, etc.). No usar `/api/state` como bypass de validación.

Instrucción ya enviada a Codex en PR #244: incorporar `main` actual con #241, corregir ambos findings, añadir regresiones, ejecutar `npm run check:app` + `npm run smoke:campus-test`, responder/resolver threads solo con tests verdes y solicitar nueva review. No mergear con P1/P2 pendientes.

QA manual pendiente tras merge de #244:
- selector múltiple móvil/escritorio;
- admin con ficha y socio normal seleccionables; admin sin ficha no;
- persistencia tras editar y usar subacciones;
- dos instructores => dos certificados independientes;
- permisos de descarga admin/instructor;
- curso no finalizado => certificado bloqueado;
- curso finalizado => certificado disponible;
- docencia no aumenta horas de formación acumulada.

### #245 — Gestión presencial de asistencia y cierre de alumnos por instructor/admin
Issue creada: `#245 Gestión presencial de asistencia y cierre de alumnos por instructor/admin`.

Motivo: para jornadas/cursos presenciales sin test, trabajo ni contenido online obligatorio, el backend ya dispone de `attendance`, `evaluations`, `diplomaReady` y cierre académico manual, pero falta una operativa clara para que instructor/admin valide quién asistió al terminar la jornada.

Dependencia: implementar sobre `main` una vez #244 esté fusionada, para reutilizar `instructorAssociateIds` y no duplicar identidad/permisos de instructor.

Flujo objetivo UX, prioritario en móvil:
- sección `Asistencia y certificación` dentro del curso;
- listado compacto de inscritos con nombre, nº de socio si existe, asistencia, evaluación/estado y diploma;
- acción `Asistió` => en curso puramente presencial sin evaluación adicional: 100% + `Apto`;
- acción `No asistió` => 0% + `No apto`;
- ajuste manual de porcentaje/evaluación cuando existan otros requisitos;
- cierre/validación por alumno usando la lógica backend existente;
- solo sin blockers se añade a `diplomaReady`;
- no asistente / `No apto` nunca obtiene diploma;
- cursos con test/trabajo/contenido obligatorio siguen respetando esos blockers; asistencia sola no los puentea;
- diploma ya emitido no se retira automáticamente por cambios posteriores, manteniendo comportamiento actual.

Permisos #245:
- admin: cualquier curso;
- instructor asignado por `instructorAssociateIds`: solo su curso;
- instructor no asignado: 403;
- alumno: solo lectura de su estado, nunca puede modificarse/cerrarse a sí mismo;
- lista de espera nunca se modifica;
- backend autoridad final.

Tests mínimos #245:
- admin marca asistió/no asistió y cierra alumno;
- instructor asignado puede hacerlo en su curso y no en otro;
- alumno no puede modificar/cerrar;
- waiting rechazado;
- jornada presencial sin extras + asistió => cierre y diploma;
- no asistió => no diploma;
- requisito adicional pendiente => cierre bloqueado aunque asistencia 100%;
- acciones masivas, si se añaden, no tocan espera ni expedientes incorrectos;
- `diplomaReady` y certificado acumulado solo reflejan cierres válidos.

Validación #245: PR específica, `npm run check:app`, `npm run smoke:campus-test`, revisión P1/P2, QA móvil/escritorio. No datos reales ni migraciones.

### Orden de trabajo vigente
1. Terminar #244 y corregir P1/P2.
2. Re-review #244; si verde y sin findings, fusionar.
3. Hacer QA manual de #242 en producción.
4. Implementar #245 en PR separada sobre `main` ya con #244.
5. QA manual de asistencia/cierre desde móvil como instructor y como admin.
6. Actualizar #227 + esta bitácora con SHA final, CI, deploy y PASS/pendientes.
7. Mantener #241 pendiente solo de su QA manual de hora exacta hasta validarlo.

### Regla de continuidad reforzada
GitHub + esta bitácora son la fuente común para móvil, escritorio y Codex. Antes de continuar cualquier tarea: leer esta sección y revisar commits/PR posteriores. No crear un plan paralelo. Si cambia estado, dependencias o siguiente paso, actualizar esta bitácora en la misma sesión.

## Continuacion local 11/10/2026: correcciones de #244 y criterio del acumulado

- Base incorporada: main `5565d78`, incluida #241/`dbb6d27`, sin reescribir su correccion horaria. Se actualiza la PR #244 existente, no se crea otra ni se fusiona.
- P1 corregido: generacion y enlaces docentes solo con estado real `Cerrado` y fecha fin valida alcanzada. Planificacion, inscripcion abierta, curso activo, cierre pendiente y fechas futuras/vacias quedan bloqueados; URL directa devuelve 409 tambien a admin. Sin usar diplomaReady de alumnos.
- P1 corregido en `01f7acb47661453a64d1932de74d511b97311ca3`: subacciones del editor guardan contenido e instructores en UN PATCH del curso, seguido solo de GET para refrescar. Sustituye el doble guardado anterior de `dffdaab`, que podia perder el outbox y duplicar envios. /api/state mantiene la proteccion de instructorAssociateIds frente a estados obsoletos. invokeJsonAction conserva borrador y bloqueo de reenvio si falla el refresco de un guardado confirmado.
- P2 identidad: backend rechaza 400 antes de persistir si editar una ficha asignada deja su nombre vacio; /api/state tambien valida ese cambio. Renombrar a otro nombre valido mantiene su PDF. Socios no asignados conservan reglas anteriores; asignaciones historicas incompletas no bloquean guardados ajenos. DNI/NIE sigue opcional conforme a #242, confirmado por el propietario; no migraciones ni desvinculacion automatica.
- P2 legacy: transporte usa el socio resuelto canonicamente para que curso privado y ficha propia lleguen al render del certificado. Tests por email/nombre, aislamiento de terceros y cuentas sin miembro. P2 borrado: dialogo y backend cuentan docencia aunque no haya expediente de alumno; requiere confirmacion explicita (409 sin force) antes de eliminar el vinculo.
- Ultima correccion de codigo: `d2017f51fdd89f1c929b067d687e48f7ff5a1e2f`. Re-review detecto homonimos legacy que podian imponerse a vinculos explicitos e IDs docentes borrados que bloqueaban guardados obsoletos. Resolver prioriza ID/vinculos, rechaza fallback ambiguo o ID explicito huerfano, y /api/state descarta IDs docentes entrantes antes de usar los actuales. El ultimo P2 del banco de preguntas tambien corregido: questionBank forma parte del payload editable y no desaparece al refrescar.
- Validacion de `d2017f5`: check:app completo PASS, smoke 14 rutas PASS, regresion instructor y scoping PASS. API real + sumidero SMTP local: una mutacion/automatizacion por subaccion, un solo envio, outbox sent estable con attemptCount=1 y seleccion/contenido persistidos. PATCH solo campos del editor: expediente sintetico de 600 KB preservado en servidor, sin 413 ni cambio de limites. Test red/green ejecuta save-question-to-bank real antes de las tres subacciones y confirma banco persistido. Homonimos => PDF ajeno 403 y DNI no expuesto; propio 200; ID docente borrado en seleccion obsoleta => guardado 200 sin reponer vinculo.
- CI: [App checks #356 SUCCESS](https://github.com/isocronazero-svg/isocrona-zero-campus-app/actions/runs/38166495047) sobre codigo `d2017f5`; #354/#355 tambien PASS para versiones anteriores. Esta entrada documental no cambia codigo; #227 registra HEAD y CI finales.
- Review: ocho hilos respondidos/resueltos con tests locales y CI verdes; nueva `@codex review` solicitada sobre `d2017f5` (comentario 6112594860). Comprobar su respuesta y el estado vivo de hilos antes de autorizar merge, no confundir ausencia temporal de comentarios con aprobacion. Sin merge, despliegue ni datos/correos reales; #245 sigue bloqueada por #244.
- QA pendiente: prueba humana final movil/escritorio de selector/subacciones, error al borrar nombre, confirmacion de borrado, socio legacy y certificados de dos instructores tras merge autorizado. QA visual anterior de `dffdaab` a 390/1440 PASS no equivale a validar produccion de este SHA. Servidor sintetico detenido; portal real intacto. #227 recoge SHA final/CI y pendientes.
- Decision directa del usuario en esta conversacion: **una sola hoja acumulada con horas de alumno y de instructor y dos totales separados**. No sumar docencia a formacion recibida. Sustituye el criterio anterior que excluia docencia del documento acumulado; esta correccion de #244 aun no implementa esa ampliacion.
- Existe PR #240 (`codex/instructor-diplomas-hours`, `fd9b8e4`) con otra implementacion docente basada en miembros campus. No fusionar #240 y #244 juntas: modelos incompatibles. Conservar #240 como referencia para reutilizar el acumulado y la proteccion de emisiones sobre el modelo associates de #244 en un PR incremental; no perder trabajo ni crear dos fuentes de identidad.
- Siguiente: CI/re-review de #244; revisar todos los findings antes de solicitar autorizacion de merge. Despues, certificado acumulado separado por rol y #245 en PRs independientes. #241 sigue pendiente de QA horaria productiva. No se autoriza merge/despliegue ni operaciones reales por esta entrada.
