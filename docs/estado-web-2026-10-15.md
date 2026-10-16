# Estado del portal — 15 de octubre de 2026

Repositorio: `isocronazero-svg/isocrona-zero-campus-app`.
Portal: `https://portal.isocronazero.org`.

> Esta es la bitácora operativa vigente desde el 15/10/2026. Conserva `docs/estado-web-2026-10-09.md` como histórico. Antes de trabajar: leer este documento y revisar commits, PR, CI y comentarios posteriores.

## Correo por Resend — preparación autorizada, 15/10/2026

Carlos mostró un fallo en Enviar diplomas pendientes y autorizó preparar Resend para usar un remitente del campus y dirigir respuestas al Gmail de la asociación. Railway confirma el plan **Hobby** en el espacio de trabajo; la documentación oficial de Railway restringe SMTP a Pro o superior.

- Incidencia #264. Rama de desarrollo `feat/resend-email-delivery`, desde `main` `6cb7577`.
- Adaptador HTTPS con clave solo en entorno del servidor, remitente y reply-to configurables y habilitación explícita. Resend comienza en pausa incluso con la clave presente; solo administración puede enviar la prueba al destinatario configurado.
- El estado de administración distingue proveedor/pausa/disponibilidad, sin exponer la clave ni guardar esa información derivada en SQLite. Los socios no reciben configuración de envío.
- El flujo común conserva el control académico inmediatamente antes de transmitir, registra el identificador del proveedor y reconoce entregas Resend para no repetir diplomas pendientes. Se reutilizan los registros fallidos para reintentos con clave de idempotencia estable (ventana del proveedor: 24 h).
- El lote muestra el motivo del fallo y usa un aviso de error cuando hay entregas fallidas.
- Guía de conexión/activación: `docs/correo-resend.md`. Pendientes cuenta/dominio/clave, revisión de bandeja, prueba real y activación productiva autorizada. No se han cambiado variables, DNS, plan, datos ni enviado mensajes reales.
- Pruebas locales en Node 22.23.3: batería `check:app` completa PASS, incluido `check-mail-delivery` (HTTP sin red externa, pausa, roles, fallos, reinicio/reintento y envíos simultáneos), onboarding, control académico, ajustes, permisos y SMTP local. `smoke:campus-test` 14/14 PASS en un servidor aislado con Resend en pausa y sin clave. `git diff --check` PASS.
- Carlos autoriza expresamente el 15/10/2026 a las 23:01 Europe/Madrid publicar `feat/resend-email-delivery` en el repositorio privado del campus y abrir una PR en borrador. Esta autorización no incluye fusionar ni desplegar. Publicación/CI en curso; consultar el HEAD y los controles de la PR para el resultado vigente.

La auditoría productiva más reciente sigue en la PR documental #262 (borrador): Gate B completo; Gate C parcial y piloto cerrado. Esta rama no sustituye ni revierte su evidencia y no habilita #248. Fusionar una PR funcional o cambiar Railway requiere autorización concreta; preparar código/pruebas/PR queda dentro del trabajo autorizado.

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

## 16/10/2026 - Aprobacion bloqueada por DNI/NIE pendiente

La prueba autorizada de alta con adjunto revela un bloqueo poco visible: el DNI/NIE vacio impide aprobar, pero la portada lo muestra como `DNI OK`. El formulario publico no exigia el dato y el seguimiento no permitia completarlo.

- El alta publica exige ahora DNI/NIE. Las solicitudes anteriores pueden completar unicamente el DNI/NIE pendiente desde su enlace de seguimiento; se conserva la revision administrativa y la aprobacion exclusiva de administracion.
- La operacion usa el token de la solicitud, valida formato y duplicados, rechaza solicitudes resueltas y no permite sustituir un DNI/NIE existente. El dato no se publica en la respuesta del seguimiento. Reintentar el mismo valor no duplica actividad.
- Completar el dato no envia correos ni ejecuta el motor global; no crea socio, cuenta ni acceso. Los datos adicionales enviados por el cliente se ignoran.
- El DNI/NIE completado se conserva ante formularios administrativos antiguos y escritores asincronos iniciados antes de la correccion; las demas operaciones conservan sus permisos y requisitos.
- La portada muestra los motivos concretos de bloqueo y permite abrir la solicitud. Email, telefono y DNI/NIE vacios se marcan como pendientes, con los requisitos de aprobacion preservados.
- Regresiones en las suites existentes de revision y actualizacion: indicadores, formulario, respuesta obsoleta, token incorrecto, formato/duplicados, inmutabilidad, ausencia de efectos ajenos y aprobacion administrativa posterior.
- Validacion local: `check:app` completo PASS, `check:associate-update`, `check:associate-review-navigation`, sintaxis frontend y `git diff --check` PASS. Rama `fix/associate-approval-blocked`. Publicacion y comprobacion productiva pendientes; no marcar el piloto como abierto por estas pruebas aisladas.

## 16/10/2026 - Justificante aportado en subsanacion

- Estado verificado antes de esta correccion: PR #271 integrada en `main` (`be0f503`) y desplegada con exito. La solicitud QA autorizada tiene identificador sintetico y adjunto, y sigue pendiente de aprobacion por el usuario; el primer acceso independiente y la apertura del piloto aun no estan verificados.
- Reproduccion local: aportar el justificante mediante un documento adicional lo guarda, pero no satisface el requisito de justificante principal y la aprobacion sigue bloqueada. Un documento adicional puede ser una identificacion: no se reclasifica automaticamente como pago.
- El seguimiento muestra un campo especifico de justificante de pago cuando administracion pide documentacion y falta el principal. Solo ese campo registra el justificante principal, mantiene la revision administrativa y conserva los documentos adicionales para otras aclaraciones. No sustituye justificantes existentes ni modifica solicitudes resueltas.
- El justificante se conserva ante formularios administrativos antiguos y escritores asincronos. El formulario captura la solicitud antes de leer los archivos y descarta respuestas obsoletas al cambiar de seguimiento; los errores de lectura se muestran en pantalla.
- Regresiones en las suites existentes: archivo almacenado con los bytes originales, documento adicional insuficiente para acreditar pago, subsanacion y aprobacion administrativa, ausencia de alta automatica, rechazo de sustitucion sin archivo huerfano, preservacion del justificante, visibilidad del campo y cambios de solicitud durante lectura/envio. Todas usan datos sinteticos y servidor aislado.
- No se aprueba la solicitud productiva, no se procesan avisos a otros socios y no se abre el piloto por estas pruebas. Consultar la PR de `fix/application-proof-reply` para resultados finales de CI y despliegue.

- Validacion de esta correccion: reproduccion antes/despues con las funciones exactas del servidor, `check:associate-update`, `check:associate-review-navigation`, sintaxis frontend, `git diff --check` y `check:app` completo PASS. Publicacion/despliegue pendientes al registrar esta evidencia; el resultado productivo se documenta en la PR.

## 16/10/2026 - Inscripcion QA y fechas de calendario

- El usuario confirma primer acceso, logout/relogin y navegacion como socio. El seguimiento productivo muestra la solicitud QA aprobada con identificador y adjunto conservados; el estado de envio de resolucion es `sent`.
- Ensayo productivo autorizado: curso `PRUEBA QA - Inscripcion gratuita - 16/10/2026`, cinco plazas, 0 euros, solo socios, marcado como prueba tecnica sin actividad/pago/acreditacion real. Con la cuenta QA en sesion independiente se confirma la inscripcion gratuita: solicitud confirmada, una plaza ocupada y cuatro libres; reload conserva una sola matricula visible y `1/5`. No se editaron los otros tres cursos.
- En ese recorrido el formulario conserva inicio/fin `2026-10-17`, pero un navegador al oeste de UTC muestra el dia 16. Reproduccion automatizada con el formateador real: New York produce `16 oct 2026` para una fecha de calendario `2026-10-17`.
- El formateador compartido conserva ahora el dia para cadenas `YYYY-MM-DD` en cualquier zona del navegador; los timestamps, objetos Date y valores numericos mantienen su visualizacion local anterior. No cambia datos guardados ni las reglas de apertura/cierre de inscripcion.
- Regresiones en la suite existente de horarios: UTC, Madrid, New York, Honolulu y Kiritimati; limites de cambio horario y ano; tarjeta real de curso; compatibilidad de timestamps. Gate C sigue parcial: pendientes apertura programada productiva, espera/pago y certificados/instructores. No se abre el piloto por estas pruebas parciales. CI/despliegue y evidencia final se registran en la PR de `fix/calendar-date-display`.

## 16/10/2026 - QA aislada y cambio de dia de certificados

- Ensayo con servidor local UTC y datos exclusivamente ficticios, sobre el arbol de codigo `49612d14a4cbf06f797f91601f0dddf234d66dd7` de `main` (`2c3e03e`). PDF de instructor real generado por la ruta del servidor: una pagina A4 horizontal, 587434 bytes, texto y render revisados sin cortes ni solapamientos. El propietario descarga, otra cuenta recibe 403 y sin sesion devuelve 401; curso abierto/futuro devuelve 409. Deshabilitar la elegibilidad conserva la descarga historica y el rol socio; cero diplomas de alumno y certificado de formacion recibida no disponible.
- Apertura aislada con control local de Los Angeles `16/10/2026 10:52`, equivalente a `19:52 Europe/Madrid` y `17:52Z`. La peticion real a las `17:51:40.676Z` se rechaza; a las `17:52:00.153Z` se confirma. Reintento idempotente: una matricula y una solicitud; reinicio conserva horario y matricula. Estas pruebas no sustituyen el criterio productivo de #241 ni el recorrido real de #242.
- La revision del limite diario reproduce otro desfase: un curso cerrado y finalizado el dia anterior en Madrid mantiene bloqueado el certificado hasta medianoche UTC (dos horas en verano, una en invierno). Se reproduce antes del arreglo con la funcion real del servidor a las `00:00 Europe/Madrid`.
- Pantalla y servidor comparan ahora el dia de calendario en `Europe/Madrid` mediante el modulo horario compartido. Se conserva el requisito de curso cerrado y dia final completamente transcurrido; no cambian identidad, permisos, diplomas, horas, datos guardados ni horarios de inscripcion.
- Regresiones en la suite existente de certificados: instante anterior, exacto y posterior a medianoche de Madrid en invierno, verano y los dos cambios horarios; servidor y render real administrativo/socio coinciden en UTC, Madrid, Los Angeles y Kiritimati. La prueba nueva falla con el codigo anterior y pasa con el arreglo. Suites de certificados, horarios, sintaxis frontend, diff y `check:app` completo PASS; resultado de CI/despliegue en la PR de `fix/instructor-madrid-midnight`.
- El navegador remoto sigue bloqueado por recuperacion insegura del estado de credenciales. Quedan la descarga y el recorrido horario productivos, y restaurar `instructorEnabled=false` exclusivamente en el socio ficticio QA #154. Su rol permanece socio/alumno. Gate C parcial y piloto cerrado; no se usan credenciales productivas, socios reales ni correo externo en el ensayo aislado.

## 16/10/2026 - Sesion caducada en Operativa

- Nueva captura del usuario: Operativa conserva la vista administrativa y el alumnado QA mientras la peticion responde `Inicia sesion para acceder al campus`. Se reproduce con el wrapper y las funciones reales de la pantalla: HTTP 401 deja la sesion anterior visible. Las sesiones no recordadas del servidor residen en memoria y pueden invalidarse al desplegar; el desencadenante concreto de la sesion del usuario no se ha comprobado inspeccionando cookies ni credenciales.
- Un 401 de una API privada del mismo origen descarta ahora la sesion cliente, los datos privados en memoria y el alumnado/test de la cuenta anterior; muestra el acceso con `La sesion ha caducado. Vuelve a entrar para continuar.`. No vuelve a enviar peticiones de guardado, asistencia o cierre. La respuesta original sigue disponible para el controlador que la solicito.
- Quedan excluidos login/recuperacion, verificacion, APIs publicas, identificacion de participantes del test en vivo, peticiones sin credenciales y otros origenes. Un 403, un error de servidor o de conexion conserva la sesion. Un 401 tardio de otra sesion, incluso de la misma cuenta recien autenticada, no cierra el nuevo acceso; rechazos concurrentes limpian una sola vez.
- Regresion en `check-remember-me`: wrapper y funciones reales de acceso, limpieza y Operativa; administracion/socio/instructor; GET de alumnado y PATCH academico sin reenvio; almacenamiento de sesion eliminado y borradores persistidos por cuenta conservados; entradas URL/Request, errores y respuestas tardias. La prueba falla con el wrapper anterior y pasa con el arreglo. Se mantienen los tests de cookies, reinicio, caducidad, logout, cambio de clave y revocacion de acceso.
- Suites dirigidas, sintaxis frontend, diff y `check:app` completo final PASS. Una primera pasada completa encontro `UND_ERR_SOCKET` en el fixture HTTP local de correo; la repeticion completa final pasa tambien ese escenario. CI y despliegue finales se registran en la PR de `fix/expired-session-recovery`.
- No cambia la duracion de las sesiones ni activa Recordarme por defecto. No modifica cursos, asistencia, diplomas, cuotas ni envios. La descarga del certificado y el ensayo horario productivos siguen pendientes por las restricciones del navegador de trabajo; #227 permanece abierta y el piloto sin abrir. La restauracion del indicador QA ya se completo y esta documentada en #227/#242; la nota anterior se conserva como historial del momento del ensayo aislado.

## 16/10/2026 - Catalogo y navegacion de cursos

- El usuario pide simplificar una seccion de cursos ambigua, repetitiva y poco visual. Se aplica antes del piloto una mejora de presentacion sobre `main` d908b02; no se incorporan reglas nuevas de matricula, pagos, permisos ni certificacion.
- Una sola entrada al catalogo y una tarjeta por curso. Socios: Disponibles, Mis cursos e Historial; administracion: Todos, Inscripcion abierta, En preparacion, Por cerrar y Cerrados, con contadores y estados vacios. Las tarjetas destacan fechas, duracion, plazas e importe, con una accion principal adaptada a la situacion real (gestion, aula, solicitud, inscripcion, espera, apertura o diploma).
- Los enlaces antiguos a Todo resuelven al catalogo, sin montar simultaneamente altas, importacion y editor. Crear curso e Importar CSV siguen accesibles por separado. Se elimina la cabecera repetida de Campus y el resumen lateral duplicado exclusivamente en Cursos; otras secciones mantienen su panel y sus vistas previas.
- En el editor queda una sola barra de secciones. Preparacion/cierre se recoge en un desplegable, con los controles previos conservados. La seleccion del test compartido aparece en Contenido; sus cambios pendientes sobreviven al cambio de pestana mediante la captura de borrador existente.
- Regresiones en la suite existente `check-member-rendering`: catalogo unico por rol, dedupe y filtros sin mutar datos, modos antiguos, exclusividad de formularios, una accion principal, libre/pago/espera/programada/cerrada/vista previa y ausencia de gestion para socios; el panel lateral de diplomas se conserva. Sintaxis y diff PASS; resultado completo y CI/despliegue en la PR de `fix/course-navigation`.
- QA de navegador real contra servidor local aislado con datos/cuentas ficticios, correo deshabilitado y peticiones externas bloqueadas: administracion y socio en 390/768/1440 px; catalogo/filtros, editor sin navegacion duplicada, diagnostico plegado, borrador del test, acceso a alta/importacion, aula, historial, CTA de espera e inscripcion gratuita completa conservada tras reload. Sin errores JS ni overflow horizontal de pagina; renders revisados visualmente. No equivale a un recorrido privado nuevo en produccion, cuyo navegador remoto sigue restringido.
- El usuario confirma visualmente en produccion a las 20:59 el diploma QA recibido por correo con PDF adjunto y el certificado de instructor de una pagina abierto en movil. Registrado en #227/#242; no demuestra que la descarga se hiciera desde sesion propia de socio ni la separacion productiva de horas. El indicador temporal de instructor QA ya esta restaurado a false.
- Siguen pendientes la apertura programada productiva #241 y los extremos productivos de permisos/horas de #242. Gate C parcial, piloto sin abrir. No se modifican socios, cursos, asistencia, diplomas, cuotas ni automatismos productivos para esta mejora visual.
