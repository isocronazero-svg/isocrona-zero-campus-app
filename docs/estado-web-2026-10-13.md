# Estado del portal — 13 de octubre de 2026

Repositorio: `isocronazero-svg/isocrona-zero-campus-app`

Esta es la bitácora operativa vigente para continuar desde Desktop/Codex. Continúa `docs/estado-web-2026-10-12.md`; no perder el detalle técnico histórico de ese documento.

## Estado al handoff — 13/10/2026 05:50 Europe/Madrid

### `main`
- HEAD validado al cierre de la sesión móvil: `e298e06caea094b22c46f3b87fad1c595de8bd30`.
- Ese commit fusionó PR #250 / issue #246: jornadas intensivas, guardado fiable, formulario simplificado y preservación de horas decimales.
- #250 está fusionada/cerrada. No recrear esa rama, patch ni PR.
- Verificacion Desktop del 12/10: CI PR #372 y main #373 SUCCESS; Railway deployment `306b97f1-93de-4691-8b70-01ff63dd9bf7` SUCCESS para `e298e06` en el servicio del portal. Healthz y smoke publico 14/14 PASS; app.js/styles.css publicados coinciden por SHA256. No datos, variables ni permisos modificados. QA autenticada productiva pendiente.

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

## #249 — PR #251 abierta, codigo/CI/review aprobados

13/10 Desktop: [PR #251](https://github.com/isocronazero-svg/isocrona-zero-campus-app/pull/251), rama `codex/enrollment-closing-window` sobre `c875221` (main con este handoff). Codigo `cdc912c736ddf0286b5b495a2a51d68a31bc7d01`. No merge ni despliegue autorizados de #249.

- `EnrollmentTime` compartido calcula cierre explicito/fallback y distingue future/open/closed; no parser nuevo ni migracion. Por la aclaracion de la issue #249 (comentario 6127911743), cierre EXPLICITO debe ser estrictamente anterior al inicio; solo el cierre implicito coincide con startDate 00:00 Europe/Madrid.
- Backend: POST/PATCH de cursos valida el conjunto temporal; POST /api/state preserva el cierre explicito actual, propiedad de la API de cursos, y revalida cambios temporales sin bloquear ediciones ajenas de ventanas legacy sin cambios. Un snapshot global obsoleto no borra ni resucita un cierre. Catalogo publico expone cierre/estado; alta de alumno rechaza fuera de ventana aunque status siga abierto. Justificantes de solicitudes existentes permanecen permitidos.
- UI: campos de apertura/cierre juntos en alta/edicion, cierre opcional conservado por normalizacion/PATCH/subacciones; error visible sin destruir borrador. Tarjetas/publico/resumen sin CTA tras cierre; no confundir cierre con apertura futura. No se modifica el estado academico para forzar el bloqueo.
- Check temporal red/green reproduce el bug anterior. Fronteras exactas, DST, verano/invierno, TZ UTC/Madrid/New York, validacion POST/PATCH/state, permiso de justificantes y no duplicacion cubiertos. check:app completo PASS y smoke local14 PASS. Check de Windows contributions-ui requiere normalizacion LF SOLO LOCAL de question-bank.js, sin incluirla en el diff.
- QA navegador sintetica: cierre invalido conserva borrador; cierre valido en Madrid persiste como UTC y recarga a la misma hora. Socio/admin propio conserva inscripcion/justificante; participante externo no ve grupos privados ni CTA del curso cerrado. Consola sin errores. Capturas locales en Gestion/issue249-ui, no versionadas.
- [App checks #375 SUCCESS](https://github.com/isocronazero-svg/isocrona-zero-campus-app/actions/runs/38346619317) sobre codigo cdc912c. Re-review finalizada sin problemas importantes ([comentario6138306404](https://github.com/isocronazero-svg/isocrona-zero-campus-app/pull/251#issuecomment-6138306404)); sin P1/P2 abiertos. Los commits posteriores son solo esta bitacora. #227 registra HEAD/CI documental final sin crear otra PR.
- Pendiente: CI del ultimo commit documental y autorizacion expresa antes de merge. No datos reales; QA productiva a pocos minutos de frontera despues de autorizacion/merge. Preview sintetica local http://127.0.0.1:54143, no es produccion. #247 solo despues de cerrar esta integracion.

Implementar en un PR específico sobre `main` actual. Alcance ya cerrado:
- añadir `enrollmentClosesAt` opcional;
- si existe, cerrar exactamente en ese instante;
- si no existe, cierre implícito a `startDate 00:00 Europe/Madrid` mientras no haya hora de inicio específica;
- validar apertura < cierre efectivo; cierre explicito < inicio, fallback = inicio del curso;
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
