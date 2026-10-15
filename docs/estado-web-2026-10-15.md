# Estado del portal — 15 de octubre de 2026

Repositorio: `isocronazero-svg/isocrona-zero-campus-app`.
Portal: `https://portal.isocronazero.org`.

> Esta es la bitácora operativa vigente desde el 15/10/2026. Conserva `docs/estado-web-2026-10-09.md` como histórico. Antes de trabajar: leer este documento y revisar commits, PR, CI y comentarios posteriores.

## QA inicial de acceso y modo socio — 15/10/2026

Carlos autorizó comenzar por acceso, permisos visibles y vista móvil. Se revisó la sesión administrativa ya abierta y su modo socio con la cuenta propia.

- PASS: cambio Administración → Modo Socio → Administración; el retorno recupera el menú y la vista administrativa.
- PASS de UI: en modo socio aparecen Mi aula, Cursos, Grupos internos, Mis diplomas y Mi perfil; desaparecen Socios y cuotas, Informes y validación y el selector de otra persona.
- PASS de UI: perfil propio accesible, con solicitudes de cambio y justificantes; no ofrece cambiar directamente número de socio, rol, estado o cuotas. No se enviaron formularios.
- PASS de UI: cursos e historial accesibles, sin Gestionar/Eliminar curso/Emitir/Enviar/Cerrar. Mi aula dirige a la ficha de socio conforme a la navegación actual; no se interpretó como error.
- PASS de UI: biblioteca accesible y sin Guardar grupo/Anadir recurso/Eliminar. Descarga del adjunto ficticio también completada en este modo: 208 bytes y mismo SHA-256 `26338a62592d090077326f460c7b1b93bc75ea11514c6123089824d73e0b3039`.
- PASS del ciclo login/logout administrativo: Cerrar sesión vuelve al acceso público y permanece desconectado tras reload. Nueva entrada mediante el formulario seguro completada por el titular; la UI confirma la sesión administrativa de Carlos, los menús de gestión y Datos cargados. Un segundo reload conserva esa sesión y la vista administrativa.
- Escritorio: ancho CSS 1348 px, scrollWidth 1348 en perfil, cursos y grupos, sin overflow horizontal de página en esas vistas.
- Móvil a ~390 px: BLOQUEADO por capacidad del navegador de esta sesión (ancho fijo; no expone ajuste de viewport). No se sustituye por recorte de captura ni se acredita QA móvil productiva. La QA local móvil anterior sigue siendo evidencia separada.
- Consola del recorrido: los 12 errores registrados en este intervalo comparten `Error sending browser metadata to extension: Object`; no se identificó un error JS específico del portal en las vistas visitadas. La comprobación global de errores de Gate C sigue pendiente.
- Baseline leído en SQLite en solo lectura a las `2026-10-15T20:11:17.609Z`: hashes de associates/members/courses/campusGroups sin cambios; recuentos 153/7/3/5; outbox conserva 7 queued. Sin altas, correos, modificaciones de fichas, cursos ni recursos.

Límite de permisos: se ha comprobado la UI de modo socio dentro de una sesión autenticada como administrador. Esto NO acredita el aislamiento backend de una cuenta independiente con rol socio. El acceso de una cuenta socio independiente sigue pendiente; la ampliación autorizada para crear una identidad ficticia se detalla a continuación. Gate C continúa PARCIAL; piloto cerrado. PR #262 permanece en borrador, sin merge ni nuevo despliegue.


### Alta ficticia solicitada por Carlos: preparada, todavía SIN enviar

Después de esta QA, Carlos pidió expresamente crear un alta ficticia, aprobarla con su cuenta administrativa y probar el acceso de socio independiente. Esta autorización amplía la revisión anterior para UNA identidad sintética.

Datos introducidos en el formulario público `/join.html`:
- Nombre: `PRUEBA QA Campus 20261015`.
- Identificador de prueba: `QA20261015`; teléfono no operativo `000000000`.
- Correo de solicitud y remitente: `qa-campus-20261015@isocronazero.invalid`, sin destinatario real.
- Servicio: `PRUEBA TECNICA — NO REAL — SIN PAGO`.
- Adjunto de prueba preparado: imagen SVG con el texto explícito `PRUEBA QA — NO REAL / SIN PAGO · SIN VALIDEZ ECONÓMICA`. La carga del archivo NO llegó a completarse.
- No se marcaron los consentimientos ni se pulsó Enviar solicitud. No existe una solicitud/cuenta de prueba creada por esta intervención ni se aprobó ninguna alta.

Preflight del flujo desplegado:
- Consulta autenticada de solo lectura confirma `smtpConfigured=false`, `autoCreateCampusAccess=true` y las automatizaciones activadas. No se cambió ninguna configuración.
- El alta pública intenta enviar acuse si existe SMTP. Aprobar crea socio/alumno/cuenta, asigna número y cuota anual, genera una contraseña temporal y llama también al motor global de automatización. Antes de ejecutarlo hay que volver a comprobar configuración/baseline y comparar después todos los registros previos, separando únicamente el alta QA esperada.
- La contraseña inicial y su cambio deberán tratarse mediante la entrada segura/manual del titular; no copiarla a la bitácora, GitHub ni salidas de herramientas.

Bloqueo concreto: después de la autenticación segura, el navegador impidió nuevas operaciones por protección de credenciales retenidas. Se siguió la recuperación que indicó (documento nuevo y reinicio de runtime), pero continuó devolviendo `native credential state cannot be safely resumed`. Se detuvo la interacción sin eludir esa protección. La sesión administrativa se había verificado antes del bloqueo; su estado posterior no se volvió a observar.

Pendiente al restablecer el navegador: enviar la solicitud QA y revisar/aprobar SOLO esa solicitud, completar el primer acceso de la cuenta de prueba con el titular, comprobar permisos reales y logout/login, y comparar los datos previos. No abrir piloto ni marcar onboarding/cuenta socio independiente como PASS. La QA móvil productiva continúa pendiente por el viewport.

## Corrección del dominio y cierre de persistencia — 15/10/2026

Carlos autorizó específicamente a las 21:57 Europe/Madrid cambiar SOLO `IZ_BASE_URL` a `https://portal.isocronazero.org` y aplicar el redespliegue necesario. Railway mostró exactamente un cambio pendiente de una variable, revisado antes de desplegar.

- Valor aplicado y confirmado dentro del nuevo contenedor: `https://portal.isocronazero.org`, sin salto final.
- Despliegue `69e8ec1c-880e-4dd9-b1b4-a7fb915cb22b`: ACTIVE / Deployment successful. SHA conservado `6cb7577fd9773da2a8dba41c2e9884407c56f472`, Node 22.23.3.
- Portal recargado: sesión administrativa recuperada y adjunto ficticio visible. El enlace normal Descargar usa ahora el dominio oficial. Clic real en ese enlace después del redeploy: descarga completada, 208 bytes idénticos al original y SHA-256 `26338a62592d090077326f460c7b1b93bc75ea11514c6123089824d73e0b3039`.
- Ver online abre la vista previa con el texto ficticio correcto desde un blob del origen oficial. Los enlaces existentes de certificado, PDF y Validar este diploma también usan `portal.isocronazero.org`; solo se inspeccionaron sus URL, sin emitir, cerrar ni enviar diplomas. Esto no sustituye la QA completa de certificados/permisos de Gate C.
- Comprobación a las `2026-10-15T20:01:52Z`: salud interna HTTP 200 con `ok:true`, SQLite abierto en solo lectura con `quick_check=ok`, snapshot idéntico a app_state.
- `IZ_DATA_DIR` y `RAILWAY_VOLUME_MOUNT_PATH` siguen en `/var/data/isocrona-zero`; montaje real ext4 rw confirmado. DB, snapshot, uploads y backups comparten el dispositivo del Volume.
- 153 associates, 7 members, 3 courses y 5 campusGroups. Los cuatro hashes de dominio coinciden exactamente con el baseline anterior al restart/redeploy, incluido el adjunto sintético ya autorizado. Outbox sigue en 7 queued y 0 sending/sent/failed.
- No se modificaron socios/cursos, SMTP, bootstrap, Volume ni el proyecto paralelo. No se enviaron correos ni se crearon cuentas.

**Resultado: #259 y #263 verificadas y cerradas; Gate B COMPLETO.** La copia externa recuperable ya validada, el autosave y la conservación tras restart y redeploy quedan acreditados. El antiguo 502 de la sección histórica siguiente queda resuelto por esta intervención.

**Pendiente:** Gate C conserva el resto de la QA productiva sin ejecutar; Gate D/piloto y #248 siguen fuera del alcance autorizado. PR #262 continúa en borrador, solo documentación en rama separada; no fusionar por inercia porque main dispara autodeploy.

## Resultado de la intervención autorizada — 15/10/2026, 21:50 Europe/Madrid

Carlos autorizó expresamente la copia privada, un adjunto ficticio y un reinicio controlado del servicio. Operación realizada sobre el mismo servicio productivo; SIN cambio de variables, Volume, código, SMTP ni proyecto paralelo.

### Copia externa recuperable: PASS
- Captura coherente creada a las `2026-10-15T19:33:57.360Z`: API nativa de backup online de SQLite, estado antes/copia/después idéntico y uploads comprobados por bytes/hashes.
- Incluye `campus.db` (app_state y sesiones recordadas), snapshot equivalente, los 3 archivos externos de uploads y el runtime desplegado. No incluye variables de entorno ni los 30 snapshots históricos; se excluyó el enlace auxiliar de `node_modules/.bin`, innecesario para arrancar.
- Cifrado AES-256-GCM con clave envuelta mediante RSA-OAEP/SHA-256; clave privada separada, nunca enviada a Railway.
- Copia y kit guardados de forma privada fuera de Railway: `Respaldo_Campus_2026-10-15.tar.gz` y `Clave_recuperacion_Campus_2026-10-15.zip`. No adjuntar estos archivos ni claves a GitHub.
- El ensayo local descifró la copia, comprobó los hashes de los 366 archivos, integridad SQLite y equivalencia de snapshot. Verificó los 3 uploads.
- Arranque aislado del mismo código `6cb7577`: salud correcta y datos de socios/members/cursos/grupos idénticos, con SMTP vaciado exclusivamente en la copia de ensayo, automatización diferida y conexiones salientes bloqueadas.
- Límite del ensayo: Node local 24.19.0; producción Node 22.23.3. No se conectó la copia a recursos productivos ni se ensayó una restauración sobre producción.

### Adjunto y reinicio: persistencia PASS
- Carga por la UI, SIN pulsar Guardar después de seleccionar archivo; el autosave terminó en `Grupo interno guardado`.
- Recurso ficticio `PRUEBA TÉCNICA — Persistencia Railway #259`, en Multidisciplinar → Apertura de puertas → Documentos.
- Archivo `prueba-persistencia-railway-2026-10-15.txt`, 208 bytes, sin datos personales.
- SHA-256 antes y después del restart: `26338a62592d090077326f460c7b1b93bc75ea11514c6123089824d73e0b3039`.
- ID `campus-group-entry-documents-1792093305695-0`; grupo `campus-group-multidisciplinary`, módulo `group-module-multi-door-entry`.
- Descarga autenticada ANTES del restart usando el dominio correcto: bytes idénticos al fichero original.
- Un único `Restart` de Railway confirmado mediante su diálogo, aproximadamente 21:46 Europe/Madrid. No Redeploy ni merge. Despliegue `1ec54a54-e130-458e-a364-6f6025f1f2c9`, SHA `6cb7577fd9773da2a8dba41c2e9884407c56f472` conservados.
- Nuevo proceso servidor PID 89, uptime 208 s a las 19:49:27 UTC, acredita el nuevo arranque.
- DESPUÉS: portal recargado con sesión administrativa recuperada y recurso visible; SQLite de solo lectura confirma los mismos bytes del adjunto. Integridad `quick_check=ok`, snapshot igual a app_state, DB y montaje todavía en `/var/data/isocrona-zero`; salud interna HTTP 200.
- Recuentos: 153 associates, 7 members, 3 courses, 5 campusGroups. Los cuatro hashes de dominio coinciden exactamente antes/después del restart; socios/members/cursos también coinciden con la copia anterior a la prueba. Outbox conserva 7 queued, 0 sending/sent/failed. No hubo envíos ni altas.
- El archivo ficticio queda identificado en la biblioteca; no se han borrado recursos existentes.

### Bloqueo reproducido: enlace al dominio antiguo — #263
- El enlace Descargar normal de la UI apunta a `https://campustest.isocronazero.org/api/campus-groups/attachment` y devuelve 502 / Connection refused.
- `IZ_BASE_URL` se confirmó en el contenedor y en Railway Variables: `https://campustest.isocronazero.org` con salto final. El dominio oficial es `https://portal.isocronazero.org`.
- El contenido NO está perdido: la ruta autenticada en el dominio oficial funcionó antes del restart y los bytes/estado/UI permanecen idénticos después.
- La descarga normal sigue FAIL. No marcar PASS de descarga posterior al restart: una pestaña de descarga quedó en una página interna de error y no pudo reutilizarse; se verificaron bytes y visibilidad por las vías autenticadas anteriores, sin eludir restricciones del navegador.
- [Issue #263](https://github.com/isocronazero-svg/isocrona-zero-campus-app/issues/263) contiene la intervención mínima propuesta: cambiar SOLO `IZ_BASE_URL` a `https://portal.isocronazero.org`, sin salto final; aplicar el despliegue necesario y repetir Descargar/Ver online y hashes/baseline.
- Ese cambio de variable y el despliegue adicional NO están ejecutados: requieren autorización específica. No tocar bootstrap, SMTP, Volume ni el segundo proyecto.
- #259 permanece ABIERTA hasta validar la descarga normal tras resolver #263. Gate B acredita persistencia física pero conserva pendiente su última descarga; Gate C/piloto siguen sin aprobar.

### Continuidad
La PR documental #262 conserva ambos historiales y esta evidencia en una rama separada. No fusionarla automáticamente: un push a main dispara autodeploy. No iniciar #248, onboarding, correos ni piloto por este resultado.

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
