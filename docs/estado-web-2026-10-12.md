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

Regla de eficiencia añadida el 12/10: si una PR funcional está esperando integrar `main`, agrupar actualizaciones documentales para no mover `main` repetidamente y volver a dejar la PR atrás. Se puede registrar pretrabajo temporalmente en issues/#227 y consolidarlo en esta bitácora tras el merge significativo.

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

**Fusionado en `main` el 12/10.**

Merge squash final: `6f92d69ff46adb7121a6f09810c1f1e6e866ff8d`.
Head validado antes de merge: `a10a16ff0bcf9d93da33be9b4d41f3b066a843d6`.
App checks #366: `success`.
Todos los review threads P1/P2 estaban resueltos antes de fusionar.

Modelo integrado:
- identidad docente por `instructorAssociateIds`;
- uno o varios instructores;
- sin nombres libres como identidad certificable;
- certificado docente privado;
- DNI/NIE opcional si consta;
- solo disponible cuando el curso está `Cerrado` y la fecha fin ya ha pasado completamente;
- backend/UI bloquean emisión anticipada;
- no mezclar con `diplomaReady` del alumnado;
- protección frente a identidad legacy insegura, snapshots obsoletos y dobles automatizaciones;
- borrar un socio usado como instructor exige confirmación/force y muestra impacto.

QA productiva pendiente:
- selector/edición de varios instructores;
- descarga PDF desde admin y desde el propio instructor;
- permisos laterales;
- curso cerrado hoy sigue bloqueado hasta el día siguiente.

No fusionar #240 junto a este modelo; queda solo como referencia histórica.

## 4. #246 — jornadas intensivas: guardado y formulario simplificado

**Tarea activa: implementada y verificada en Desktop; pendiente de PR/CI/review.**

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
- instructores se añadirán mediante #247;
- horas > 0 y plazas > 0 con error claro;
- cursos normales mantienen su flujo actual;
- móvil ~390 px y escritorio.

Tests mínimos:
- los 7 nombres crean, recargan y editan correctamente;
- campo obligatorio ausente muestra error y conserva formulario;
- jornada de un día persiste mismo inicio/fin;
- curso normal no regresa.

### Recuperacion en Desktop (12/10)

- Base actual `a0770b0f8fc552bcdcdbd363af2e261c3eafcb1d`, incluye #244 fusionada y el handoff movil completo.
- Patch del comentario #6125783195 recuperado y revisado. Rama local `codex/fix-intensive-day-creation`; publicacion prevista sobre la remota existente `issue-246-jornadas-intensivas`, sin crear un segundo desarrollo.
- Reproduccion red/green: submit incompleto no creaba mensaje de estado; ahora muestra causas y conserva borrador. Jornada deriva fechas/defaults y guarda por POST /api/courses. Validacion backend de plazas enteras y orden de fechas.
- Corregido adicionalmente el cambio de modo: campos ocultos deshabilitados, borrador normal conservado al volver y jornada no hereda instructores/contenido/coordinador ocultos. Error de apertura horaria conserva formulario. Sin implementar #249/#247/#245/#248.
- Node 24.14.0 (>=22): check:app completo, check:course-academic, check:form-save-recovery y smoke 14 rutas PASS. Check intensive-days incluido en suite; alta/recarga/edicion API de los siete nombres y handlers reales probados.
- QA navegador sintetico: 1440/390 px sin overflow, errores visibles, alta de Rescate en rios con 6.5 horas, recarga y edicion a 7 horas; curso normal y cambio de modo conservan borrador. Sin errores de consola ni datos reales. CI/review y SHA/PR finales se registraran en #227 y esta entrada.
- No merge ni despliegue desde Desktop; no se interpreta el orden propuesto como permiso de fusionar. QA productiva pendiente tras autorizacion e integracion.

### Handoff anterior (conservado como referencia)

Codex llegó a recrear dos veces la implementación, pero sus commits locales no quedaron publicados en GitHub por limitaciones del entorno de ejecución. No considerar `cceffab`, `bd9bce4` ni `010085265deddeb2672b3e46e49b080f0f8f8a70` como commits remotos: sirven solo como referencias de trabajo previo.

El material útil sí quedó preservado:
- comentario de recuperación completo: **#6125783195**;
- base exacta del patch: `31c8bf5065668a20173ebc6bc8140e7523bc1fb0`;
- archivos afectados: `package.json`, `public/app.js`, `public/styles.css`, `scripts/check-app.mjs`, `scripts/check-course-academic.mjs`, `scripts/check-form-save-recovery.mjs`, `server.js` y nuevo `scripts/check-intensive-days.mjs`;
- checks que Codex consiguió pasar durante la reconstrucción: `check:intensive-days`, `check:frontend-syntax`, `check:form-save-recovery` y `git diff --check`;
- `check:app` y `smoke:campus-test` quedaron sin validación completa en su entorno por Node 20 / ausencia de `node:sqlite`.

Rama remota creada desde este chat:
- `issue-246-jornadas-intensivas`;
- creada sobre `31c8bf5065668a20173ebc6bc8140e7523bc1fb0`;
- en el momento de este handoff **no contiene aún el patch funcional** y no existe PR válida de #246.

Siguiente paso recomendado desde Desktop:
1. recuperar/aplicar el patch del comentario #6125783195 sobre `issue-246-jornadas-intensivas` o recrear exactamente ese alcance directamente en la rama;
2. no añadir #249/#247/#245/#248;
3. ejecutar con Node 22: `npm run check:intensive-days`, `npm run check:form-save-recovery`, `npm run check:app`, `npm run smoke:campus-test`;
4. revisar diff y hacer `git diff --check`;
5. push de la rama y abrir PR específica de #246;
6. pedir `@codex review` y corregir cualquier P1/P2;
7. solo después fusionar;
8. tras el merge, actualizar #227 y esta bitácora y pasar a #249.

Importante: esta actualización documental hace avanzar `main` después de crear la rama #246. La rama puede quedarse un commit documental por detrás; no es un conflicto funcional. Antes de mergear #246, sincronizar con el `main` vigente preservando esta bitácora.

## 5. #249 — cierre automático/configurable de inscripciones

Regla de negocio:
- una jornada del día 12 no puede seguir aceptando inscripciones el día 13;
- añadir `enrollmentClosesAt` opcional;
- si existe, se cierra exactamente en ese instante;
- si no existe, se cierra por defecto al comenzar el día del curso (`startDate 00:00 Europe/Madrid`) mientras no haya hora de inicio específica;
- `opens < closes <= inicio del curso`;
- backend bloquea nuevas inscripciones aunque `course.status` esté obsoleto;
- UI muestra `Inscripción cerrada` y elimina CTA;
- no romper reintentos de justificante ni expedientes ya existentes.

Pretrabajo ya cerrado:
- reutilizar `EnrollmentTime` y ampliar `isCourseEnrollmentWindowOpen`;
- ampliar `scripts/check-enrollment-time.mjs`;
- cubrir invierno/verano, frontera exacta, cierre implícito, DST y POST directo tras cierre;
- comentario técnico inicial #6119196324;
- matriz adicional de pruebas y reglas documentada en la issue el 12/10.

No empezar implementación funcional hasta cerrar #246.

## 6. #247 — socios habilitados como instructores

Solo los socios expresamente habilitados deben aparecer como instructores.

Diseño cerrado:
- booleano estable `instructorEnabled` en ficha de socio;
- default `false` para no habilitar accidentalmente a socios existentes;
- backend rechaza nuevas asignaciones de socios no habilitados;
- históricos no se borran al deshabilitar;
- deshabilitar afecta solo a nuevas asignaciones, no a relaciones/certificados históricos;
- un curso/jornada puede tener 1, 2, 3, 4 o más instructores, sin límite artificial de dos;
- UI con selector + botón `Añadir instructor`;
- lista/chips de seleccionados con `Quitar` individual;
- evitar duplicados;
- recarga conserva toda la selección;
- cada instructor conserva certificado independiente cuando corresponda.

Puntos de implementación sobre el `main` ya fusionado de #244:
- normalización/persistencia de `associates`;
- edición administrativa de ficha de socio;
- validación del PATCH de associate;
- selector de alta/edición de curso basado en `instructorAssociateIds`;
- regresiones de 1, 2, 3 y 4 instructores;
- histórico preservado al deshabilitar.

Comentario técnico: #6119194061 + ampliación de matriz el 12/10.

## 7. #245 — asistencia presencial y cierre de alumnos

Objetivo: que admin/instructor pueda terminar una jornada presencial marcando quién asistió y habilitando el diploma solo a quien corresponda.

Arquitectura existente a reutilizar:
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
- cursos con test/trabajo mantienen requisitos.

Permisos a cubrir:
- admin global;
- instructor asignado vía `instructorAssociateIds` solo en su curso;
- otro instructor no puede editar/cerrar;
- estudiante no puede autoeditarse aunque manipule petición.

Idempotencia: repetir asistencia/cierre no debe duplicar diploma/emisión ni romper el expediente.

Comentario técnico: #6119188550.

## 8. #248 — histórico de jornadas y prioridad por menor participación

Regla: prioridad a quien menos veces haya participado como alumno en jornadas.

Diseño:
- vista web principal + exportación CSV/XLSX;
- no guardar contador manual `timesAttended`;
- derivarlo de la verdad académica existente;
- contar jornadas cerradas/validadas donde el alumno realmente completó la actividad (`diplomaReady` o cierre equivalente consolidado por #245);
- deduplicar por `course.id + memberId`;
- no contar lista de espera, anulados, no asistió, no apto ni actividad solo como instructor;
- no contar cursos normales;
- ordenar ascendente para mostrar primero a quien menos oportunidades ha tenido;
- búsqueda por nombre/nº socio;
- indicador de prioridad en solicitudes/inscritos;
- V1 informa: administración decide plazas, sin adjudicación automática.

La misma función agregadora debe alimentar pantalla y exportación.

Comentario técnico: #6119191402.

## 9. Orden operativo actual

1. **Materializar y cerrar #246** — patch → rama → PR → Node 22 → review P1/P2 → merge.
2. **#249** — cierre automático/configurable de inscripción.
3. **#247** — `instructorEnabled` + `Añadir instructor` múltiple.
4. **#245** — asistencia presencial/cierre por admin e instructor.
5. **#248** — histórico/ranking/exportación.
6. QA circuito completo: crear jornada → ventana de inscripción → varios instructores → inscripción → asistencia/cierre → diploma alumno/instructor → histórico/prioridad.
7. QA productiva pendiente de #241 y #244 dentro del recorrido final.

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

No mezclar estos trabajos con #245–#249 salvo necesidad demostrada.

## 13. Handoff móvil → Desktop — 12/10/2026

Último `main` comprobado antes de esta actualización documental: `31c8bf5065668a20173ebc6bc8140e7523bc1fb0`.

Trabajo completado en esta sesión móvil:
- #244 desbloqueada, sincronizada, CI verde y fusionada como `6f92d69ff46adb7121a6f09810c1f1e6e866ff8d`;
- #245 preparado técnicamente reutilizando endpoints académicos/cierre existentes;
- #247 preparado con `instructorEnabled`, múltiples instructores sin límite artificial e históricos preservados;
- #248 preparado sin contador manual, derivando participación de cierre académico válido;
- #249 preparado reutilizando `EnrollmentTime` y con cierre explícito/implícito definido;
- #246 especificado e implementado varias veces por Codex en workspace temporal; patch completo preservado en issue #246 comentario #6125783195;
- rama remota `issue-246-jornadas-intensivas` creada en GitHub sobre la base exacta del patch;
- #227 actualizado durante la sesión con el estado y bloqueos.

Qué falta al retomar desde Desktop:
- **primero #246**: aplicar/recrear patch en la rama remota, pasar suite completa Node 22, push, PR, review P1/P2 y merge;
- después continuar exactamente en este orden: #249 → #247 → #245 → #248;
- no iniciar implementación paralela de varias issues;
- tras cada merge significativo, actualizar #227 y esta bitácora;
- hacer QA productiva solo después de deploy real y no confundir CI con producción.

Si Desktop encuentra cambios posteriores en `main`, PRs o issues, prevalece el estado más nuevo de GitHub; actualizar esta bitácora antes de continuar si cambia el plan.
