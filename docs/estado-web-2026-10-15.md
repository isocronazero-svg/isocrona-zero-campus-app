# Estado del portal — 15 de octubre de 2026

Repositorio: `isocronazero-svg/isocrona-zero-campus-app`.
Portal: `https://portal.isocronazero.org`.

> Esta es la bitácora operativa vigente desde el 15/10/2026. Conserva `docs/estado-web-2026-10-09.md` como histórico. Antes de trabajar: leer este documento y revisar commits, PR, CI y comentarios posteriores.

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

PR funcional abierta: **#260**.
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

**No fusionar #260 sin autorización explícita de Carlos.**

### Bloqueo de infraestructura antes del piloto

Aunque #260 esté lista funcionalmente, #259 NO debe darse por cerrada y NO deben incorporarse socios reales hasta verificar en Railway:
1. `IZ_DATA_DIR` existe y no está vacío;
2. apunta a una ruta dentro de un Railway Volume persistente;
3. `/api/debug/storage`/evidencia equivalente confirma que DB/uploads están dentro del volumen;
4. crear un adjunto sintético y verificar persistencia tras restart/redeploy controlado.

No reiniciar/redesplegar producción sin autorización explícita. Si no existe Volume persistente, tratar como P1 de release.

## 3. #245 — asistencia y certificación presencial — SIGUIENTE FUNCIONAL

Pretrabajo en rama `chatgpt/245-attendance-certification`.
Commits de preparación conocidos: `48125e0` y `3952f95`.

Hallazgo clave: la aplicación YA dispone de bloque `Asistencia y certificación`, controles individuales/masivos y endpoints académicos. No crear un segundo sistema.

Implementación mínima:
- backend: permitir gestión académica a admin o instructor asignado mediante `account.associateId ∈ course.instructorAssociateIds`;
- aplicar a PATCH académico individual, PATCH académico masivo, cierre individual y cierre masivo;
- instructor asignado solo su curso; no asignado 403; alumno 403 incluso sobre sí mismo; espera nunca modificable;
- frontend: sustituir solo en acciones académicas el guard exclusivo de admin por `canManageCourseAcademic(course)`;
- acciones rápidas móvil: `Asistió` => 100% + Apto; `No asistió` => 0% + No apto;
- conservar controles avanzados para cursos con requisitos adicionales;
- cierre reutiliza blockers existentes; no escribir `diplomaReady` directamente desde UI;
- acciones repetidas/cierre deben ser idempotentes.

Extender `scripts/check-course-academic.mjs`; no crear suite paralela. Validar `npm run check:app`, `npm run smoke:campus-test`, `git diff --check`, móvil 390 y escritorio 1440. Un PR, sin merge automático, sin datos reales, sin Railway.

#245 no bloquea un piloto pequeño si #259/infraestructura y QA de onboarding están validados, pero sí conviene cerrarla antes de operar jornadas reales de forma completa.

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

1. #260 sincronizada y validada; mantener sin merge hasta autorizacion y confirmar CI del HEAD documental.
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

Última actualización: 15/10/2026, sincronizacion #260 con main719674c sin conflictos, CI #420 y validaciones locales verdes. Sin merge, cambios de datos ni operaciones productivas. #259 sigue abierta por QA de persistencia productiva pendiente de autorizacion.
