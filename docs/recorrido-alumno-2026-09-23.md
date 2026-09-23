# Comprobación del recorrido del alumno — 23/09/2026

Verificación automatizada contra un servidor local real y una base de datos temporal. No se han creado cuentas, cursos ni diplomas en producción.

## Recorrido comprobado

- Curso en planificación: inscripción y test bloqueados.
- Apertura, inscripción gratuita y reintento sin duplicar matrícula.
- Curso lleno: segundo alumno en lista de espera, sin acceso al test.
- Lectura de contenidos publicados y guardado del progreso.
- Test con preguntas del banco común, corrección, historial y reintento sin duplicados.
- El test de práctica no emite un diploma por sí solo.
- Validación académica por administración, emisión y descarga del PDF por su titular.
- Descarga bloqueada para visitantes y otros alumnos; validación pública por código.
- Sesión en vivo con las mismas preguntas, respuesta del participante, resultado y cierre.
- Matrícula, progreso, resultado y diploma conservados tras reiniciar el servidor.

## Corrección

Las plazas libres usaban la lista de identificadores de alumnos. Por privacidad, el servidor solo envía al alumno su propio identificador, por lo que el contador podía mostrar plazas libres en un curso lleno. Ahora usa el total de inscritos enviado por el servidor, igual que el contador de ocupación.

## Comprobaciones permanentes

`scripts/check-course-journey.mjs` reproduce el recorrido y forma parte de `npm run check:app`. `scripts/check-member-rendering.mjs` verifica las plazas disponibles con datos filtrados para el alumno.

Esta comprobación cubre solicitudes al servidor y lógica de interfaz. No sustituye una revisión visual completa en navegador de todas las pantallas.
