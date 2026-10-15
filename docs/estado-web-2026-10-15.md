# Estado del portal — 15 de octubre de 2026

Repositorio: `isocronazero-svg/isocrona-zero-campus-app`.
Portal: `https://portal.isocronazero.org`.

> Esta es la bitácora operativa vigente desde el 15/10/2026. Conserva `docs/estado-web-2026-10-09.md` como histórico. Antes de trabajar: leer este documento y revisar commits, PR, CI y comentarios posteriores.

## 1. Base integrada

Base funcional revisada antes de #259: `44bc5e4bf9424ee0faf8986ebdea345106f359c1` — #247/#258, instructores asociados y selección dinámica, integrado.

Desde esa base, `main` contiene además esta bitácora documental. Por ello PR #260 puede aparecer temporalmente detrás/divergida de `main`; la diferencia conocida es documental y no debe resolverse forzando refs ni reescribiendo historia. Antes del merge funcional, incorporar/rebasar `main` de forma normal y repetir CI si GitHub lo exige.

Integrado previamente:
- #241: corrección de apertura de inscripción por zona horaria; código terminado, QA manual productiva pendiente.
- #242/#249: certificados/instructores; código terminado, QA manual productiva pendiente.
- #252/#256: onboarding seguro de socios integrado.
- #253/#255: revisión móvil de socios integrada.
- #247/#258: `instructorEnabled`, selección de uno/múltiples instructores y protecciones de concurrencia integrado.

No confundir CI verde con producción validada.

## 2. #259 — persistencia de archivos y almacenamiento — PRIORIDAD DE RELEASE

PR funcional abierta: **#260**.
HEAD funcional revisado: `3917716da688f892512cfee430e92c3d6aa3756e`.
App checks #416 sobre ese HEAD: **SUCCESS**.

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

**No fusionar #260 sin autorización explícita de Carlos.**

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

1. Mantener #260 sin merge hasta autorización; antes del merge sincronizar su rama con `main` de forma normal y repetir CI si corresponde.
2. Verificar Railway en modo lectura cuando exista acceso/conector; no cambiar configuración.
3. Avanzar #245 en su rama y preparar implementación/PR.
4. Tras autorización, merge #260 y verificar deploy/Volume/persistencia.
5. Ejecutar QA productiva mínima y abrir piloto 5–10 socios si PASS.
6. Completar #245 y después #248.
7. Actualizar #227 y esta bitácora en cada cambio de estado relevante.

## 8. Reglas de continuidad

GitHub + esta bitácora mandan. No crear planes paralelos desde móvil/escritorio/Codex.

No hacer sin autorización explícita:
- merge de PR funcional;
- restart/redeploy de producción;
- cambio de variables/Volume Railway;
- operaciones con datos reales;
- creación/envío masivo de cuentas o correos reales.

Sí continuar de forma autónoma con: auditoría, tests, documentación, comentarios/issues, ramas de preparación, revisión P1/P2 y handoffs de Codex.

Última actualización: 15/10/2026, después de CI #416 verde, resolución de los cuatro threads P1/P2 de PR #260 y creación de la bitácora vigente.
