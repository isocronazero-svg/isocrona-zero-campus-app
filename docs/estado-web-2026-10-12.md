# Estado del portal — 12 de octubre de 2026

Repositorio: `isocronazero-svg/isocrona-zero-campus-app`.
Portal: `https://portal.isocronazero.org`.

Esta bitácora sustituye operativamente a `docs/estado-web-2026-10-09.md`. El documento del 09/10 queda como histórico. Antes de iniciar trabajo desde cualquier chat/dispositivo: leer primero este archivo y revisar commits, PRs, issues y review threads posteriores.

## 1. Fuente de verdad y norma de continuidad

GitHub + esta bitácora mandan. Móvil y escritorio son superficies de ejecución, no planes independientes.

Al comenzar una tarea:
1. revisar `main` y últimos commits;
2. revisar PRs/issues abiertas relevantes;
3. revisar threads P1/P2 antes de fusionar;
4. respetar el orden y decisiones aquí registradas;
5. si cambia el plan/estado, actualizar esta bitácora y #227.

No tocar datos reales, migraciones o importaciones productivas sin backup externo recuperable, ensayo/dry-run y autorización explícita.

## 2. Estado de #241 — apertura de inscripción por zona horaria

#241 está resuelta en código y fusionada mediante `dbb6d274823bdcf11f4016c91cdf6fd21c6ab80e`.

Comportamiento integrado:
- `datetime-local` se guarda canónicamente con zona/UTC;
- edición conserva hora local del navegador;
- legacy sin offset se interpreta como `Europe/Madrid`;
- backend es autoridad final;
- hora inexistente de primavera se rechaza;
- hora repetida de otoño usa primera ocurrencia.

Pendiente: QA manual en producción con apertura a 3–5 minutos vista, rechazo antes y aceptación desde la hora exacta. No marcar #241 como validada en producción sin esa prueba.

## 3. Estado de #242 / PR #244 — certificados de instructor

PR: #244 `Certificados de instructor vinculados a fichas de socios (#242)`.
Estado al 12/10: abierta, mergeable, head `33ff4393b4f2ac11e1d3cbda2dbed0d52b0ad0e3`, base `main`.
GitHub Actions App checks run #360: `success`.

Modelo actual de la PR:
- identidad de instructor por `instructorAssociateIds`;
- uno o varios instructores;
- sin nombres libres como identidad certificable;
- admin sin ficha de socio no certificable;
- `course.coordinator` legacy solo informativo;
- PDF docente privado e independiente de `diplomaReady` del alumnado;
- DNI/NIE opcional si está registrado, conforme a #242;
- certificado docente solo disponible cuando el curso está `Cerrado` y la fecha fin ha pasado completamente;
- backend y UI bloquean emisión anticipada.

Correcciones ya realizadas en la revisión:
- emisión anticipada antes del cierre;
- pérdida de selección de instructores en subacciones del editor;
- doble automatización/doble envío tras PATCH de instructor;
- edición de ficha que dejaba sin nombre a instructor asignado;
- propiedad legacy por email/nombre y enlaces explícitos;
- filtrado de cursos privados para propietarios legacy legítimos;
- impacto de borrar socio usado solo como instructor;
- snapshots obsoletos de `/api/state` con IDs de instructor borrados;
- pérdida de `questionBank` en subacciones;
- esperar al día posterior a `endDate` para emitir certificado;
- escalada por coincidencia de nombre desde cuentas `public-campus` nuevas.

Todos los threads anteriores están resueltos salvo el último P1 de seguridad, que permanece abierto únicamente a la espera de confirmar CI verde sobre `33ff439...`. El código de ese P1 ya está corregido; App checks #360 terminó `success`. Antes de merge: refrescar review threads y comprobar que no apareció un nuevo P1/P2.

No fusionar #240 junto con #244. #240 usa un modelo docente diferente y solo sirve como referencia histórica.

## 4. Decisión nueva — solo socios habilitados pueden ser instructores

Cambio de negocio confirmado el 12/10:

No todos los socios deben aparecer como instructores. Administración debe poder marcar expresamente qué fichas de socio están habilitadas como instructor.

Issue nueva: #247 `Socios instructores · habilitación explícita y selector en cursos/jornadas`.

Objetivo:
- añadir flag estable tipo `instructorEnabled` en ficha de socio;
- solo `instructorEnabled=true` aparece en selector de cursos/jornadas;
- backend rechaza IDs de socios no habilitados;
- permitir varios instructores;
- preservar relaciones históricas sin borrarlas silenciosamente;
- identidad/certificado sigue resolviéndose desde la ficha de socio.

IMPORTANTE: #247 es follow-up de #244. No ampliar #244 ahora con esta funcionalidad salvo decisión explícita posterior; primero consolidar la base de certificados.

## 5. Issue #245 — asistencia presencial y cierre de alumnos

#245 `Gestión presencial de asistencia y cierre de alumnos por instructor/admin`.

Objetivo operativo:
- pantalla `Asistencia y certificación` dentro del curso/jornada;
- lista de inscritos;
- acciones rápidas `Asistió` / `No asistió`;
- para jornada puramente presencial: `Asistió` => 100% + Apto; `No asistió` => 0% + No apto;
- cierre/validación por alumno mediante la lógica académica existente;
- solo quien cumple requisitos entra en `diplomaReady`;
- cursos con test/trabajo/contenido obligatorio mantienen sus blockers;
- admin puede gestionar cualquier curso;
- instructor asignado solo su curso;
- socio/alumno no puede modificar ni cerrarse a sí mismo;
- UX móvil prioritaria.

Dependencia: consolidar #244 y, para el modelo definitivo de permisos docentes, coordinar con #247.

## 6. Issue #246 — creación de jornadas intensivas

Problema reproducido por el usuario el 12/10: al intentar crear una jornada desde la web, el formulario no se guardó. Hay que reproducir y encontrar la causa real; no asumirla.

Issue: #246 `Jornadas intensivas · corregir guardado y añadir nombres predeterminados`.

Cuando el tipo sea `Jornada intensiva`, el nombre debe seleccionarse de esta lista inicial:
- Accidentes de tráfico
- Rescate vertical
- RIT
- Incendios Estructurales
- Riesgos Tecnológicos
- Rescate en ríos
- GOM

Requisitos clave:
- selector rápido de nombre;
- posibilidad de ampliar catálogo más adelante;
- error visible si no guarda;
- conservar borrador si falla validación;
- no exigir campos irrelevantes para una jornada presencial sencilla;
- móvil 390 px y escritorio;
- no romper alta de cursos normales.

Este bug de guardado es una regresión funcional y debe priorizarse pronto tras cerrar #244.

## 7. Issue #248 — histórico de participación y prioridad

Regla de negocio confirmada:
La asociación da prioridad a las personas que menos veces han participado como alumnos en jornadas.

Ejemplo conceptual:
- Carlos Salvador — 5 jornadas
- Óscar Corell — 7 jornadas
=> Carlos tendría prioridad por haber tenido menos oportunidades.

Issue: #248 `Histórico de participación en jornadas y prioridad por menor asistencia`.

Diseño decidido:
- la fuente principal será una vista web, no un Excel independiente;
- se podrá exportar CSV/XLSX como apoyo;
- el contador se deriva de participaciones reales cerradas/validadas como alumno, no de inscripciones;
- no cuentan lista de espera, anulados, no asistió, no apto ni actividad como instructor;
- evitar doble conteo en la misma jornada;
- búsqueda por nombre/nº socio;
- orden ascendente/descendente por número de jornadas;
- detalle opcional de jornadas y fechas;
- mostrar indicador de prioridad en solicitudes/inscritos de una nueva jornada;
- V1 no adjudica automáticamente plazas: administración decide con la información visible.

Dependencias: #245 para saber con fiabilidad quién asistió/cerró como alumno y #247 para separar claramente rol docente de alumno.

## 8. Orden de trabajo actualizado

Orden operativo recomendado y autorizado:

1. **Cerrar #244**: refrescar review threads, confirmar que no queda P1/P2 abierto con código pendiente, CI verde y mergeable; después fusionar.
2. **Actualizar #227 + esta bitácora** con SHA de merge de #244 y QA pendiente.
3. **#246**: reproducir y corregir el fallo de guardado de jornadas + selector de nombres predeterminados. Es una regresión de uso real y debe ir antes de añadir más complejidad.
4. **#247**: habilitación explícita de socios como instructores y selector filtrado.
5. **#245**: asistencia presencial/cierre académico por admin e instructor asignado.
6. **#248**: histórico de jornadas realizadas como alumno, ranking de prioridad y exportación.
7. QA manual móvil/escritorio del circuito completo: crear jornada → asignar instructores → inscripción → asistencia/cierre → diploma alumno/instructor → histórico/prioridad.
8. Actualizar #227 y bitácora tras cada merge significativo.

No mezclar estas cuatro issues nuevas en una sola PR. Un tema por PR para poder revisar y revertir con seguridad.

## 9. Criterios comunes de validación para #246–#248 y #245

Cada PR debe:
- ejecutar `npm run check:app`;
- ejecutar `npm run smoke:campus-test`;
- revisar P1/P2 antes de merge;
- usar datos sintéticos en pruebas;
- no tocar datos reales ni migraciones;
- mantener backend como autoridad;
- evitar `/api/state` como bypass de validaciones específicas;
- comprobar móvil ~390 px y escritorio;
- registrar QA productiva pendiente sin inventar PASS.

## 10. Producción / Railway

El portal activo corresponde al contexto Railway `zealous-warmth - isocrona-zero-campus-test`, pese al nombre interno. Existe un segundo contexto Railway `outstanding-wholeness - isocrona-zero-campus` paralelo/legado que genera ruido y no debe confundirse con el portal activo.

No afirmar despliegue productivo solo porque CI esté verde. Tras cada merge relevante comprobar el estado del servicio activo y hacer QA manual de la funcionalidad afectada.

## 11. Otros pendientes que siguen separados

- #227: QA final/regresiones/congelación.
- #134: importación/verificación real de 175 preguntas IVASPE en producción; operación, no desarrollo ordinario.
- #112: ampliación de contenido IVASPE.
- #109: deuda técnica V2, extracción incremental de dominios de `server.js`.

No mezclar esos trabajos con #244–#248 salvo necesidad demostrada.
