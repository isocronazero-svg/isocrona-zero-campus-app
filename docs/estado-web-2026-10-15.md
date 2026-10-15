# Estado del portal — 15 de octubre de 2026

Repositorio: `isocronazero-svg/isocrona-zero-campus-app`.
Portal: `https://portal.isocronazero.org`.

> Esta es la bitácora operativa vigente desde el 15/10/2026. Conserva `docs/estado-web-2026-10-09.md` como histórico. Antes de trabajar: leer este documento y revisar commits, PR, CI y comentarios posteriores.

## Auditoría Railway — 15/10/2026, 21:12 Europe/Madrid

Comprobación autenticada y de solo lectura en Railway. Esta evidencia sustituye las referencias de rutas pendientes de confirmar; NO acredita todavía supervivencia a un reinicio.

### Producción y almacenamiento: PASS
- Proyecto `zealous-warmth`, entorno `production`, servicio `isocrona-zero-campus-test`, dominio `portal.isocronazero.org`.
- GitHub Actions App checks #430 SUCCESS sobre ese SHA (run 38789471290).
- Servicio `88140fe1-79d1-425d-b54b-0a287ea9487e`; entorno `507ab4af-8eb7-42ad-bcca-e3e0dc5a575d`.
- Despliegue activo `1ec54a54-e130-458e-a364-6f6025f1f2c9`, Railway Deployment successful. SHA confirmado además dentro del contenedor: `6cb7577fd9773da2a8dba41c2e9884407c56f472` (incluye #260 y #261).
- Volume `eb7b0ddb-4ec4-4199-bc7f-1a0245d776f5`, `isocrona-zero-campus-test-volume`, 5 GB. Mount Path e `IZ_DATA_DIR` coinciden exactamente: `/var/data/isocrona-zero`.
- La consola autenticada del contenedor confirma `RAILWAY_VOLUME_MOUNT_PATH` y un montaje real ext4 `rw` en esa ruta; no es solo una variable.
- `campus.db`, `state.json`, `uploads/` y `backups/` existen, sus realpaths están dentro del Volume y comparten el dispositivo montado.
- SQLite abierto con `readOnly:true`: `PRAGMA quick_check` devuelve `ok`; la fila `app_state/campus_state` existe y su contenido coincide byte a byte con `state.json`.
- Recuentos de referencia: 153 associates, 7 members, 3 courses y 5 campusGroups. Son entidades distintas; no confundir 7 members con el censo de 153 socios.
- Estado leído a las 19:12:00 UTC, actualizado a las 19:09:50 UTC, 6.577.428 bytes; SHA-256 `c397a698c29481d791d8ea52a0d75c33b56ce045a32d5428bc06c623518ec557`.
- `/healthz` dentro del contenedor: HTTP 200, `status: ok`.

### Copias: pendiente externo
- Hay 30 snapshots automáticos dentro del mismo Volume. NO son una copia externa ni una copia completa de SQLite/uploads.
- Railway Backups muestra explícitamente `No Backups`. La opción de crear nuevas copias desde ese panel requiere Pro; no se ha contratado ni cambiado ningún plan.
- No se ha descargado ni publicado información personal, credenciales ni backups reales.

### Prueba final pendiente
1. Obtener una copia externa privada y coherente de estado/SQLite/uploads; comprobar inventario, hashes y recuperabilidad aislada, sin conectar SMTP ni credenciales productivas.
2. Registrar baseline fresco y usar un único adjunto sintético identificado, sin tocar socios, cursos, cuotas, diplomas ni correo.
3. Recuperarlo y comprobar su hash antes del reinicio.
4. Reiniciar solamente este servicio, con autorización específica de Carlos y avisando de la breve interrupción y posible necesidad de volver a iniciar sesión.
5. Repetir salud/SHA/rutas, recuperar el mismo archivo y comparar hash y baseline de socios/cursos.
6. Cerrar #259 únicamente con resultado completo. El piloto y #248 siguen fuera de esta intervención.

### Límite de esta sesión
No se han cambiado variables, Volume, datos de aplicación, SMTP ni ejecutado restart/redeploy. La conexión a consola solo se ha usado para consultas de filesystem, SQLite de solo lectura y salud.
La documentación se prepara en una rama separada: escribir en `main` dispararía un despliegue automático de Railway y todavía no hay autorización específica para reiniciar. No fusionar este handoff por inercia.

## 1. Base integrada

Base funcional revisada antes de #259: `44bc5e4bf9424ee0faf8986ebdea345106f359c1` — #247/#258, instructores asociados y selección dinámica, integrado.

`main` documental `719674c` incorporado a #260 mediante merge normal `0ecb012666cc35c8f0b88d10a6c8cb593b983a4e`, sin conflictos ni force push. Sin cambios funcionales adicionales: el codigo coincide con `3917716`. Esta sincronizacion NO fusiona la PR en main.

Integrado previamente:
- #241: corrección de apertura de inscripción por zona horaria; código terminado, QA manual productiva pendiente.
- #242/#249: certificados/instructores; código terminado, QA manual productiva pendiente.
- #252/#256: onboarding seguro de socios integrado.
- #253/#255: revisión móvil de socios integrada.
- #247/#258: `instructorEnabled`, selección de uno/múltiples instructores y protecciones de concurrencia integrado.

No confundir CI verde con producción validada.

## 2. #259 — persistencia de archivos y almacenamiento — PRIORIDAD DE RELEASE

PR **#260 integrada** mediante merge normal `cd933d5ad448a054843e1188d0643e81b85c4d89`, autorizado por Carlos. HEAD integrado `4050732343a3e773759feae0fda7cf28f8bdf83b`; App checks #421 SUCCESS y CI de main #427 SUCCESS. #259 permanece abierta: persistencia productiva sin verificar.
HEAD funcional revisado: `3917716da688f892512cfee430e92c3d6aa3756e`.
App checks #416 sobre ese HEAD: **SUCCESS**.

Sincronizacion final validada: `0ecb012666cc35c8f0b88d10a6c8cb593b983a4e`; [App checks #420 SUCCESS](https://github.com/isocronazero-svg/isocrona-zero-campus-app/actions/runs/38743343295). `npm run check:app` Node22.23.3, `npm run smoke:campus-test` (14 rutas), `git diff --check` y QA Edge390/1440 repetidos: PASS. Sin nuevos P1/P2 ni threads abiertos; READY FOR MERGE tecnico, pendiente decision humana. Este ultimo cambio es solo documental; comprobar tambien su CI antes de fusionar. Normalizacion LF de question-bank.js solo local por harness Windows, fuera del PR.

Cambios revisados en:
- `public/app.js`;
- `storage.js`;
- `scripts/check-campus-groups.mjs`;
- `scripts/check-navigation.mjs`;
- `scripts/check-production-storage-guard.mjs`.

Resultado:
- producción exige `IZ_DATA_DIR`; `DATABASE_URL` ya no se considera sustituto del almacenamiento local de `app_state`, SQLite, sesiones, snapshots, backups y uploads;
- escape de emergencia sigue siendo explícito mediante `IZ_ALLOW_EPHEMERAL_STORAGE_IN_PRODUCTION=true`, con advertencia fuerte;
- selección de adjunto en grupos dispara persistencia automática real por el endpoint existente;
- bytes pendientes no se guardan en sessionStorage/localStorage;
- fallo de red/409 conserva bytes en la pestaña y ofrece reintento, sin falso éxito;
- cargas concurrentes se serializan para evitar superar el límite agregado y conservar `contentRevision`;
- la selección más reciente gana aunque un FileReader anterior termine después;
- cambio de vista/sesión no permite que respuestas antiguas muten la sesión nueva;
- archivos vacíos se rechazan antes de aparentar persistencia;
- navegación/logout/reload avisan solo cuando existen bytes realmente pendientes.

Review #260:
- se detectaron 4 findings P1/P2 durante el ciclo;
- todos tienen corrección y regresión;
- los 4 threads están resueltos;
- revisión final de `3917716`: no se identificó un nuevo P1/P2 bloqueante;
- GitHub no permite que la misma cuenta apruebe formalmente su propia PR; revisión final documentada en la conversación de #260.

La autorizacion de merge no incluye operaciones sobre Railway ni QA con datos reales.

### Bloqueo de infraestructura antes del piloto

Aunque #260 esté lista funcionalmente, #259 NO debe darse por cerrada y NO deben incorporarse socios reales hasta verificar en Railway:
1. `IZ_DATA_DIR` existe y no está vacío;
2. apunta a una ruta dentro de un Railway Volume persistente;
3. `/api/debug/storage`/evidencia equivalente confirma que DB/uploads están dentro del volumen;
4. crear un adjunto sintético y verificar persistencia tras restart/redeploy controlado.

No reiniciar/redesplegar producción sin autorización explícita. Si no existe Volume persistente, tratar como P1 de release.

## 3. #245 — asistencia y certificacion presencial — PR #261

- Implementacion completa en [PR #261](https://github.com/isocronazero-svg/isocrona-zero-campus-app/pull/261), rama `codex/course-attendance-certification-245` desde main719674c. Codigo `c18cc9b67b1a1d1569a0f9d0ecefb206f31bd721`. Sin merge, despliegue ni cambios productivos; #260 permanece independiente.
- Contrato definitivo: Asistio=100/Apto; No asistio=0/No apto. /close valida sin autoaprobar ni completar contenido; respeta blockers y conserva diplomas ya emitidos. Admin o instructor con associateId asignado (incluidas asignaciones historicas); waiting y alumnos ajenos excluidos.
- GET academico minimo sobre el recurso existente, sin ampliar /api/state. Misma seccion operativa/workbench: acciones rapidas, controles avanzados y cierre individual/bulk; instructor entra desde Cursos que imparto. Roster solo en memoria y vinculado a la sesion.
- Escritura academica sin awaits tras releer permisos/inscritos. No llama al motor global/SMTP dentro de la peticion: entrega manual/programada existente. Repetir marcado/cierre no duplica actividad, diplomas ni outbox.
- Dos P1 de review reproducidos y corregidos: navegador conservaba curso obsoleto; POST /api/state reconstruido perdia el baseline durante body lento. Ahora el admin incorpora el curso confirmado y refresca sin reenviar; el coordinador reconcilia antes de automatizar y protege el guardado posterior. Regresiones red/green, incluido refresco fallido, body HTTP lento y await posterior. Ambos threads resueltos con CI verde.
- Dos findings posteriores (P1/P2) corregidos en8570ace: SMTP revalida sincronamente tras354 y antes de transmitir DATA, sin bloqueos globales; el admin conserva tambien activityLog confirmado antes de refrescar. Regresiones deterministas red/green: corregir a No apto durante negociacion cancela el mensaje; corregir despues del compromiso conserva el diploma ya emitido sin reenvio; fallo de refreshState seguido de dos POST /api/state conserva el evento exactamente una vez. SMTP exclusivamente local.
- Regresion derivada corregida en c18cc9b: tipo explicito de diploma/recordatorio y compatibilidad con diplomas legacy. Recordatorios de valoracion manuales y automaticos se envian aunque falte la valoracion; no se consideran entregas de diploma. Regresion SMTP local red/green. Cinco threads del ciclo resueltos con tests/CI verdes.
- Archivos: server.js, server/onboarding-state.js, smtp.js, public/app.js, public/styles.css, scripts/check-course-academic.mjs y esta bitacora. Sin suite paralela.
- Validacion en codigo c18cc9b: check-course-academic y check:app completos Node22.23.3 PASS; smoke:campus-test14 PASS; git diff --check PASS. Edge390/1440 admin/asignado/ajeno/alumno PASS, cierres efectivos admin/instructor, waiting sin controles, sin overflow bloqueante ni errores JS. App checks #425 SUCCESS (38755124944). Question-bank LF solo local por harness Windows, excluido.
- Revision final de c18cc9b completada sin problemas importantes (comentario6195053804); cero P1/P2 abiertos. Preparada tecnicamente para merge, pendiente decision expresa de Carlos y CI del ultimo commit documental (consultar PR para HEAD/resultado final). No fusionar ni iniciar #248/piloto por inercia.
- Pendiente: QA productiva requiere autorizacion y gate #259/Volume. Un diploma emitido no se revoca al corregir asistencia. No datos reales, SMTP productivo, onboarding, variables ni restart/redeploy utilizados.


## 4. #248 — histórico de jornadas y prioridad

Implementar después de #245. V1 informativa, sin asignación automática de plazas.

Fuente de verdad: participaciones reales finalizadas como alumno en jornadas estructuradas, nunca contador manual ni texto del título. Excluir espera, no aptos/no-show, instructor-only y cursos no jornada. Dedupe por curso + socio. Orden de prioridad: menor número de jornadas primero; empate por nombre estable. CSV suficiente para V1.

Rama de preparación: `chatgpt/248-journey-priority`.

## 5. Piloto de socios

Criterio de apertura recomendado:
1. #260 integrada y CI verde tras sincronizar con `main`;
2. Railway Volume/`IZ_DATA_DIR` verificado;
3. QA productiva corta: login/logout, onboarding, móvil, inscripción, #241, certificados/permisos, subida/recuperación de un archivo;
4. piloto controlado 5–10 socios;
5. observar 24–48 h y corregir cualquier P1/P2;
6. ampliar a 20–30 y después al resto si no aparecen bloqueos.

No es necesario esperar a #248 para el piloto. #245 tampoco bloquea el acceso inicial, pero sí la operativa presencial completa.

## 6. PR/documentación antigua

- #257: documentación anterior al estado actual; no fusionar automáticamente.
- #240: implementación histórica alternativa de instructores; no fusionar con el modelo vigente basado en associates/#247.
- #161: Railway SSH/known_hosts antigua; no tocar salvo fallo real reproducido.

## 7. Orden de trabajo vigente

1. #260 integrada en main; #259 sigue abierta por el gate productivo de persistencia.
2. Integrar main en #261 mediante merge normal, conservando ambos cambios. Carlos autoriza resolver conflictos y fusionar #261 solo tras tests, CI y revision P1/P2 verdes.
3. Conflicto de public/app.js: conservar tanto academicRoster/academicBusy como el estado de autoguardado de grupos y beforeunload. Conflicto documental resuelto conservando ambos historiales.
4. Validacion local de la combinacion: check:app completo, check-course-academic, smoke:campus-test (14 rutas) y git diff --check PASS con Node22.23.3. QA Edge390/1440 admin/instructor asignado/ajeno/socio PASS, sin errores JS ni overflow. Comparacion mecanica de app.js contra ambos padres: mismas lineas funcionales de ambas PR, un solo beforeunload; backend academico y storage identicos a sus respectivos padres. Sin nuevos P1/P2. CI del commit de sincronizacion pendiente; no confundir esta sincronizacion con el merge de #261.
5. Despues, detenerse: no iniciar #248 ni operaciones productivas. El siguiente gate V1 es verificar Volume/IZ_DATA_DIR y persistencia, con autorizacion especifica; despues QA/piloto autorizado.

## 8. Reglas de continuidad

GitHub + esta bitácora mandan. No crear planes paralelos desde móvil/escritorio/Codex.

No hacer sin autorización explícita:
- merge de PR funcional;
- restart/redeploy de producción;
- cambio de variables/Volume Railway;
- operaciones con datos reales;
- creación/envío masivo de cuentas o correos reales.

Sí continuar de forma autónoma con: auditoría, tests, documentación, comentarios/issues, ramas de preparación, revisión P1/P2 y handoffs de Codex.

Última actualización: 15/10/2026, #260 integrada y CI de main verde. Conflictos de #261 con main cd933d5 resueltos conservando ambos cambios, tests/QA locales PASS. Pendiente CI remoto y merge autorizado condicionado a verde. Sin operaciones productivas. #259 permanece abierta.
