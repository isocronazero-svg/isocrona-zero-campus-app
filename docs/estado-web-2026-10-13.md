# Estado del portal — 13 de octubre de 2026

Repositorio: `isocronazero-svg/isocrona-zero-campus-app`

Esta es la bitácora operativa vigente para continuar desde Desktop/Codex. Continúa `docs/estado-web-2026-10-12.md`; no perder el detalle técnico histórico de ese documento.

## Estado al handoff — 13/10/2026 05:50 Europe/Madrid

### `main`
- HEAD validado al cierre de la sesión móvil: `e298e06caea094b22c46f3b87fad1c595de8bd30`.
- Ese commit fusionó PR #250 / issue #246: jornadas intensivas, guardado fiable, formulario simplificado y preservación de horas decimales.
- #250 está fusionada/cerrada. No recrear esa rama, patch ni PR.

### #241 — apertura de inscripción y zona horaria
- Código ya fusionado en `main`.
- NO cerrar todavía la issue solo por estar implementada.
- Pendiente QA manual en producción: configurar apertura a pocos minutos en hora española y verificar que antes rechaza y desde la hora exacta acepta sin desfase UTC.
- Mantener backend como autoridad y compatibilidad `Europe/Madrid`/DST.

### #242 — certificados de instructor
- Código ya fusionado mediante PR #244.
- P1/P2 de código resueltos y CI verde antes del merge.
- NO cerrar todavía la issue: queda QA manual productiva.
- Comprobar selector/edición con varios instructores, PDF desde admin y desde el propio instructor, permisos laterales y que un curso cerrado hoy no habilita certificado hasta haber pasado completamente `endDate`.

## Orden de desarrollo confirmado

1. **#249 — cierre automático/configurable de inscripciones**
2. **#247 — habilitación explícita de socios instructores**
3. **#245 — asistencia presencial y cierre de alumnos**
4. **#248 — histórico de jornadas y prioridad por menor participación**

No empezar #248 antes de consolidar #245 y #247: su fuente de verdad depende de asistencia/cierre real y de distinguir alumnado de instructores.

## #249 — siguiente tarea inmediata

Implementar en un PR específico sobre `main` actual. Alcance ya cerrado:
- añadir `enrollmentClosesAt` opcional;
- si existe, cerrar exactamente en ese instante;
- si no existe, cierre implícito a `startDate 00:00 Europe/Madrid` mientras no haya hora de inicio específica;
- validar `opens < closes <= inicio del curso`;
- backend rechaza nuevas inscripciones fuera de ventana aunque `course.status` siga obsoleto;
- UI muestra `Inscripción cerrada` y no ofrece CTA;
- no romper lista de espera, reintento de justificante ni expedientes ya creados;
- reutilizar la infraestructura temporal introducida por #241, sin crear un segundo parser de fechas;
- cubrir invierno/verano, DST, frontera exacta, cierre explícito e implícito y POST directo fuera de ventana;
- ejecutar `npm run check:app` y `npm run smoke:campus-test`;
- pedir revisión P1/P2 antes de merge.

Objetivo de eficiencia para Codex: antes de modificar código, localizar y reutilizar `EnrollmentTime`, `isCourseEnrollmentWindowOpen`, alta/edición de cursos y `scripts/check-enrollment-time.mjs`. No explorar ni refactorizar áreas no relacionadas.

## #247 — preparado para después de #249

- `instructorEnabled` booleano en socio, default `false`;
- solo socios habilitados seleccionables en nuevas asignaciones;
- backend debe rechazar IDs manipulados/no habilitados;
- deshabilitar no borra relaciones ni certificados históricos;
- selector incremental `Añadir instructor`, sin límite artificial de dos;
- evitar duplicados y conservar 1, 2, 3, 4+ instructores tras recarga;
- reutilizar `instructorAssociateIds` ya introducido por #242/#244.

## #245 — preparado para después de #247

Reutilizar, no duplicar:
- `PATCH /api/courses/:courseId/academic`;
- `POST /api/courses/:courseId/members/:memberId/close`;
- blockers académicos y `diplomaReady` existentes.

UX móvil prioritaria: `Asistencia y certificación`, acciones rápidas `Asistió` / `No asistió`, cierre por alumno y permisos de admin/instructor asignado. No usar `/api/state` como bypass.

## #248 — preparado pero bloqueado por #245/#247

- derivar histórico de la verdad académica; no contador manual;
- contar solo participación real como alumno en jornadas finalizadas/validadas;
- deduplicar por jornada + alumno;
- excluir espera, anulados, no asistencia, no aptos e instructor puro;
- ordenar por menor nº de jornadas para informar prioridad;
- V1 no adjudica plazas automáticamente;
- vista web principal y exportación como apoyo.

## Pendientes que NO deben distraer el siguiente arranque

- #109 refactor backend: V2, no mezclar con estas funcionalidades.
- #112 ampliación de preguntas IVASPE: trabajo independiente.
- #134 importación IVASPE en Railway: operación productiva, no mezclar con cambios funcionales.
- #227 sigue siendo paraguas de QA/cierre V1; no interpretar su texto antiguo como motivo para revertir los avances posteriores ya autorizados e integrados.

## Instrucción de arranque en Desktop

Antes de tocar código:
1. `git fetch` / actualizar `main` y confirmar HEAD;
2. leer este documento y `docs/estado-web-2026-10-12.md` si hace falta detalle histórico;
3. comprobar PRs/issues recientes por si hubo cambios después de este handoff;
4. trabajar únicamente #249 en un PR específico;
5. ejecutar checks, revisión P1/P2 y corregir hallazgos antes de plantear merge;
6. actualizar esta bitácora y #227 cuando cambie el estado.

No tocar datos reales, migraciones ni operaciones productivas sin backup/dry-run y autorización explícita.