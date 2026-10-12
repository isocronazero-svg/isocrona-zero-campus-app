# Estado del portal — 12 de octubre de 2026

Repositorio: `isocronazero-svg/isocrona-zero-campus-app`
Portal: `https://portal.isocronazero.org`

Esta es la bitácora operativa vigente. Sustituye como referencia diaria a `docs/estado-web-2026-10-09.md`. GitHub + esta bitácora son la fuente de verdad común entre móvil, escritorio y Codex.

## 1. Norma de continuidad

Antes de tocar código:
1. revisar `main` y últimos commits;
2. revisar PRs/issues abiertas relevantes;
3. revisar P1/P2 y checks;
4. respetar el orden de trabajo de este documento;
5. si cambia estado, alcance o siguiente paso, actualizar esta bitácora y #227.

No tocar datos reales, migraciones o importaciones productivas sin backup externo recuperable, dry-run y autorización explícita.

## 2. #241 — zona horaria de apertura de inscripción

Fusionado en `main` mediante `dbb6d274823bdcf11f4016c91cdf6fd21c6ab80e`.

Integrado:
- `datetime-local` se canonicaliza a ISO/UTC;
- edición vuelve a hora local;
- legacy sin offset se interpreta como `Europe/Madrid`;
- backend es autoridad;
- hora inexistente por DST se rechaza;
- hora repetida de otoño usa la primera ocurrencia.

Pendiente: QA manual productiva con apertura a pocos minutos vista.

## 3. #242 / PR #244 — certificados de instructor

PR #244: `Certificados de instructor vinculados a fichas de socios (#242)`.

Estado comprobado el 12/10:
- abierta;
- head `33ff4393b4f2ac11e1d3cbda2dbed0d52b0ad0e3`;
- App checks #360: success;
- todos los review threads P1/P2 están resueltos;
- GitHub muestra `mergeable: false` porque `main` ha seguido avanzando con documentación/bitácora mientras la rama sigue basada en `5565d78...`.

Codex recibió la instrucción en comentario #6119148620 de actualizar la rama con `main`, resolver solo integración, repetir `npm run check:app` + `npm run smoke:campus-test`, comprobar que no reaparece P1/P2 y dejar la PR lista para merge. No añadir #245–#249 a #244.

Modelo que debe conservarse:
- identidad docente por `instructorAssociateIds`;
- varios instructores;
- sin nombres libres como identidad certificable;
- certificado docente privado;
- DNI/NIE opcional si consta;
- solo disponible cuando el curso está `Cerrado` y la fecha fin ya ha pasado completamente;
- no mezclar con `diplomaReady` del alumnado.

No fusionar #240 junto a #244.

## 4. #246 — jornadas intensivas: guardado y formulario simplificado

Problema real reproducido: al crear una jornada, parecía que no se guardaba.

Hallazgo técnico:
- el submit actual puede hacer `return` silencioso si falta título, clase, tipo, inicio, fin, horas o plazas;
- la creación ya usa `POST /api/courses`, por lo que no hay que volver a `/api/state`;
- debe mostrarse error visible y conservar el borrador.

Nombres iniciales predefinidos:
- Accidentes de tráfico
- Rescate vertical
- RIT
- Incendios Estructurales
- Riesgos Tecnológicos
- Rescate en ríos
- GOM

Diseño funcional cerrado en comentario #6119278505:
- modo `Jornada intensiva` con formulario simplificado;
- campos visibles mínimos: nombre, fecha, horas, plazas, ámbito de acceso, apertura de inscripción y —cuando entre #249— cierre de inscripción;
- jornada de un día: `startDate = fecha` y `endDate = fecha` automáticamente;
- modalidad por defecto `Presencial`;
- estado inicial `Planificacion`;
- diploma por defecto `Aprovechamiento`;
- no pedir texto libre duplicado para clase/tipo;
- coordinador libre no acredita docencia;
- instructores se añadirán después mediante #247;
- horas > 0 y plazas > 0 con error claro;
- cursos normales mantienen su flujo actual;
- móvil ~390 px y escritorio.

Tests a preparar:
- los 7 nombres crean, recargan y editan correctamente;
- campo obligatorio ausente muestra error y conserva formulario;
- jornada de un día persiste mismo inicio/fin;
- curso normal no regresa.

## 5. #249 — cierre automático/configurable de inscripciones

Issue: `Inscripciones · cierre automático por fecha/hora y fin de disponibilidad`.

Regla de negocio:
- una jornada del día 12 no puede seguir aceptando inscripciones el día 13;
- añadir `enrollmentClosesAt` opcional;
- si existe, se cierra exactamente en ese instante;
- si no existe, se cierra por defecto al comenzar el día del curso (`startDate 00:00 Europe/Madrid`) mientras no haya hora de inicio específica;
- `opens < closes <= inicio del curso`;
- backend bloquea nuevas inscripciones aunque `course.status` esté obsoleto;
- UI muestra `Inscripción cerrada` y elimina CTA;
- no romper reintentos de justificante ni expedientes ya existentes.

Pretrabajo:
- reutilizar `EnrollmentTime` y ampliar `isCourseEnrollmentWindowOpen`;
- ampliar `scripts/check-enrollment-time.mjs`;
- comentario técnico #6119196324.

## 6. #247 — socios habilitados como instructores

Solo los socios expresamente habilitados deben aparecer como instructores.

Diseño cerrado:
- añadir booleano estable `instructorEnabled` en ficha de socio;
- backend rechaza nuevas asignaciones de socios no habilitados;
- históricos no se borran al deshabilitar;
- un curso/jornada puede tener 1, 2, 3, 4 o más instructores, sin límite artificial de dos;
- UI con selector + botón `Añadir instructor`;
- lista/chips de seleccionados con `Quitar` individual;
- evitar duplicados;
- recarga conserva toda la selección;
- cada instructor conserva certificado independiente cuando corresponda.

Comentario técnico: #6119194061.

Puntos de implementación previstos tras #244:
- normalización/persistencia de `associates`;
- edición administrativa de ficha de socio;
- validación del PATCH de associate;
- selector de alta/edición de curso basado en `instructorAssociateIds`;
- regresiones de 1, 2, 3 y 4 instructores.

## 7. #245 — asistencia presencial y cierre de alumnos

Objetivo: que admin/instructor pueda terminar una jornada presencial marcando quién asistió y habilitando el diploma solo a quien corresponda.

La arquitectura necesaria ya existe:
- `PATCH /api/courses/:courseId/academic` para asistencia/evaluación;
- `POST /api/courses/:courseId/members/:memberId/close` para cierre académico individual.

Decisión: reutilizar esos endpoints y blockers; no crear un segundo sistema ni guardar por `/api/state`.

UX objetivo:
- pantalla `Asistencia y certificación`;
- lista de inscritos;
- acciones rápidas `Asistió` / `No asistió`;
- jornada puramente presencial: asistió => 100% + Apto; no asistió => 0% + No apto;
- botón de cierre/validación por alumno;
- admin: cualquier curso;
- instructor asignado: solo sus cursos;
- alumno: solo lectura de su estado;
- cursos con test/trabajo mantienen sus requisitos.

Comentario técnico: #6119188550.

## 8. #248 — histórico de jornadas y prioridad por menor participación

Regla: se da prioridad a quien menos veces haya participado como alumno en jornadas.

Diseño:
- vista web principal + exportación CSV/XLSX;
- no guardar un contador manual tipo `timesAttended`;
- derivarlo de la verdad académica existente;
- preferencia: contar jornadas cerradas/validadas donde el alumno está realmente completado (`diplomaReady` o cierre equivalente consolidado por #245);
- deduplicar por `course.id + memberId`;
- no contar lista de espera, anulados, no asistió, no apto ni actividad solo como instructor;
- ordenar ascendente para mostrar primero a quien menos oportunidades ha tenido;
- búsqueda por nombre/nº socio;
- mostrar indicador de prioridad en solicitudes/inscritos;
- V1 informa: administración decide las plazas, no adjudicación automática.

La misma función agregadora debe alimentar pantalla y exportación para evitar discrepancias.

Comentario técnico: #6119191402.

## 9. Orden operativo actual

1. Cerrar integración de #244 con `main`, repetir checks y fusionar solo cuando vuelva a estar mergeable y sin P1/P2.
2. Actualizar #227 + esta bitácora con SHA de merge y QA pendiente.
3. #246 — corregir guardado y formulario simplificado de jornadas.
4. #249 — cierre automático/configurable de inscripción.
5. #247 — `instructorEnabled` + `Añadir instructor` múltiple.
6. #245 — asistencia presencial/cierre por admin e instructor.
7. #248 — histórico/ranking/exportación.
8. QA circuito completo: crear jornada → ventana de inscripción → varios instructores → inscripción → asistencia/cierre → diploma alumno/instructor → histórico/prioridad.

Un tema por PR. No mezclar estas issues.

## 10. Validación común

Cada PR debe:
- `npm run check:app`;
- `npm run smoke:campus-test`;
- revisión P1/P2;
- datos sintéticos;
- backend como autoridad;
- no usar `/api/state` para saltarse APIs específicas;
- comprobar móvil ~390 px y escritorio;
- no afirmar QA productiva sin probarla.

## 11. Producción / Railway

Portal activo: contexto Railway `zealous-warmth - isocrona-zero-campus-test` pese al nombre interno.
Existe un contexto paralelo/legado `outstanding-wholeness - isocrona-zero-campus` que genera ruido y no debe confundirse con producción activa.

CI verde no equivale a despliegue ni QA productiva.

## 12. Otros pendientes separados

- #227 — QA final/regresiones/congelación;
- #134 — importación/verificación real de 175 preguntas IVASPE;
- #112 — ampliación contenido IVASPE;
- #109 — deuda técnica V2.

No mezclar estos trabajos con #244–#249 salvo necesidad demostrada.
