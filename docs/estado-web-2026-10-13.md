# Estado del portal — 13 de octubre de 2026

Repositorio: `isocronazero-svg/isocrona-zero-campus-app`

Esta es la bitácora operativa vigente para continuar desde Desktop/Codex. Continúa `docs/estado-web-2026-10-12.md`; usar ese documento para detalle histórico anterior.

## Estado consolidado — 13/10/2026 06:57 Europe/Madrid

### `main`
- HEAD funcional consolidado antes de esta actualización documental: `deb4188103a3a4e4cdab31960b4d59b2a05a9415`.
- Ese commit fusionó PR #251 / issue #249.
- PR #250 / issue #246 ya estaba fusionada previamente en `e298e06caea094b22c46f3b87fad1c595de8bd30`.
- No recrear ramas/patches de #244, #250 ni #251.

### #246 / PR #250 — jornadas intensivas
- FUSIONADA y desplegada.
- Incluye modo Jornada intensiva, siete nombres predefinidos, guardado fiable, validación visible, borrador preservado, plazas enteras > 0, horas > 0 y edición compatible con horas decimales como 6,5 h.
- CI PR #372 y main #373: SUCCESS.
- Railway oficial del portal: SUCCESS sobre `e298e06`.
- Smoke público 14/14 PASS; `app.js` y `styles.css` publicados coincidieron por SHA256 con Git.
- QA autenticada productiva específica de este flujo sigue formando parte de la pasada final de #227.

### #249 / PR #251 — cierre de inscripciones
- FUSIONADA y desplegada con autorización expresa del usuario.
- Squash en `main`: `deb4188103a3a4e4cdab31960b4d59b2a05a9415`.
- HEAD validado de la PR: `49747680e66fe4d12006185911d1d11c738c800f`; código funcional revisado: `cdc912c736ddf0286b5b495a2a51d68a31bc7d01`.
- CI HEAD #377 y main #378: SUCCESS.
- Re-review Codex sin problemas importantes; cero P1/P2 abiertos al merge.
- Railway oficial SUCCESS: deployment `7f35d0b9-5104-45fc-8388-5bb5e426d406` en `zealous-warmth - isocrona-zero-campus-test`, que corresponde al portal activo `portal.isocronazero.org`.
- `outstanding-wholeness - isocrona-zero-campus` sigue dando un estado fallido/noisy y NO debe confundirse con el servicio activo del portal.
- Verificación posterior de solo lectura: `/healthz` 200, smoke público 14/14 PASS y bytes/SHA256 de `app.js`, `styles.css` y `enrollment-time.js` iguales a Git en `deb4188`.
- Implementado: `enrollmentClosesAt` opcional; fallback a `startDate 00:00 Europe/Madrid`; cierre explícito estrictamente anterior al inicio; apertura < cierre efectivo; backend bloquea nuevas altas fuera de ventana aunque el status siga abierto; UI sin CTA tras cierre; `/api/state` preserva el cierre actual frente a snapshots obsoletos; justificantes posteriores de solicitudes existentes siguen permitidos sin duplicar matrícula/lista de espera.
- Issue #249 permanece ABIERTA hasta QA autenticada productiva/frontera real, igual que #241/#242.

### #241 — apertura de inscripción y zona horaria
- Código fusionado.
- Pendiente QA manual en producción: apertura configurada a pocos minutos en hora española; verificar rechazo antes y aceptación desde el instante exacto sin desfase UTC.
- Mantener `Europe/Madrid`, DST y backend como autoridad.

### #242 — certificados de instructor
- Código fusionado mediante PR #244.
- P1/P2 de código resueltos y CI verde antes del merge.
- Pendiente QA manual productiva: varios instructores, PDF desde admin y propio instructor, permisos laterales y bloqueo de certificado hasta que haya pasado completamente `endDate`.

## Siguiente tarea activa: #247 — habilitación explícita de socios instructores

No existe todavía rama/PR de #247 al consolidar esta bitácora. Empezar desde `main` actualizado tras este commit documental.

Contrato ya cerrado:
- `instructorEnabled` booleano persistente en `associate`, default seguro `false` para legacy;
- solo administración puede cambiarlo;
- solo socios existentes, con nombre válido e `instructorEnabled=true`, pueden añadirse como NUEVOS instructores;
- backend valida cada nueva asignación; no confiar solo en UI;
- si un instructor ya estaba históricamente en `course.instructorAssociateIds` y luego se deshabilita, se conserva relación/certificado histórico y puede quitarse solo por acción administrativa explícita;
- reactivar lo vuelve seleccionable para nuevas asignaciones;
- no límite artificial de dos: cubrir 1, 2, 3 y 4+ instructores;
- deduplicación frontend/backend;
- UX: selector de elegibles + `Añadir instructor` + chips/lista con `Quitar`, mostrando nombre y nº de socio;
- un instructor histórico deshabilitado debe seguir visible al editar como no disponible para nuevas asignaciones, sin desaparecer al guardar;
- reutilizar `instructorAssociateIds` y `server/instructor-certificate.js`; no crear otra identidad docente;
- `storage.js` debe normalizar/persistir el flag;
- proteger `instructorEnabled` frente a guardados legacy/obsoletos por `/api/state` para que un navegador viejo no lo borre ni cambie al guardar otra cosa;
- las subacciones del editor deben conservar todos los IDs como ya resolvió #244.

Validación mínima #247:
- legacy sin campo => no seleccionable;
- habilitar => aparece;
- deshabilitar => desaparece de nuevas selecciones;
- histórico deshabilitado permanece tras recarga/edición y conserva certificado;
- payload manipulado de instructor no habilitado => rechazo backend;
- 1/2/3/4 instructores, dedupe, quitar uno sin perder los demás;
- `npm run check:app`, `npm run smoke:campus-test`, revisión P1/P2 y QA móvil/escritorio sintética.

## Después de #247: #245 — asistencia presencial y cierre

No construir un segundo sistema: gran parte de la UI/flujo ya existe.
- reutilizar `PATCH /api/courses/:courseId/members/:memberId/academic` y `PATCH /api/courses/:courseId/academic`;
- reutilizar `POST /api/courses/:courseId/members/:memberId/close` y cierre masivo existente;
- reutilizar blockers académicos, `attendance`, `evaluations` y `diplomaReady`;
- la UI ya dispone de asistencia/evaluación, `Todo al 100%`, `Marcar aptos`, cierre individual/masivo y tabla de progreso/diploma;
- trabajo principal: UX móvil rápida `Asistió` / `No asistió` y permisos backend/frontend para instructor ASIGNADO al curso mediante `instructorAssociateIds`;
- instructor de otro curso => 403; alumno nunca puede autoeditar/autocerrarse;
- waiting no se toca; curso con requisitos adicionales mantiene blockers; jornada presencial pura + Asistió/Apto puede cerrarse correctamente;
- no usar `/api/state` como bypass.

## Después de #245: #248 — histórico y prioridad

Bloqueada hasta consolidar #247 y #245.
- no contador manual persistido;
- derivar desde verdad académica consolidada, preferentemente `diplomaReady`/cierre válido;
- contar solo `Jornada intensiva` realmente realizada como alumno;
- deduplicar por `course.id + memberId`;
- excluir espera, anulados/rechazados, No asistió, No apto e instructor puro;
- un único agregador en servidor debe alimentar vista y exportación para evitar discrepancias;
- ordenar por menor nº de jornadas para informar prioridad;
- V1 informa/ordena, no adjudica automáticamente plazas;
- vista admin completa; instructor asignado solo contexto necesario de su jornada; socio normal sin ranking global;
- CSV/XLSX como apoyo, no fuente de verdad independiente.

## Orden confirmado

1. #247 — instructor habilitado + selector múltiple incremental.
2. #245 — asistencia/cierre con permisos de instructor asignado.
3. #248 — histórico/prioridad/exportación.
4. QA integral final #227: crear jornada → apertura/cierre inscripción → instructores → inscripción → asistencia/cierre → diplomas alumno/instructor → histórico/prioridad.
5. QA productiva pendiente de #241/#242/#249 y resto de recorrido V1.

## PR #240

Sigue abierta como referencia histórica, pero usa un modelo docente incompatible basado en otra identidad. NO fusionar junto al modelo `associates` de #244. Solo reutilizar ideas puntuales si se adaptan explícitamente al modelo actual.

## Pendientes que no deben distraer

- #109 refactor backend: V2; no mezclar.
- #112 ampliación de preguntas IVASPE: independiente.
- #134 importación IVASPE en Railway: operación productiva separada.
- No datos reales, migraciones ni operaciones productivas sin backup recuperable, dry-run y autorización explícita.

## Regla de continuidad

Antes de tocar código desde cualquier chat/Desktop:
1. refrescar `main`, esta bitácora, PRs/issues y checks recientes;
2. un PR por tema;
3. no mezclar #247/#245/#248;
4. actualizar #227 y esta bitácora cuando cambie el estado significativo;
5. no confundir CI verde con QA productiva.
