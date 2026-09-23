# Banco compartido de preguntas — 23/09/2026

## Cambios

Zona Test conserva el banco central `testZoneQuestions`. Los cursos guardan una selección de identificadores, sin copiar preguntas. La selección también permite crear sesiones en vivo con código usando las mismas preguntas.

En administración, abre Campus, selecciona un curso y despliega **Test del curso · Banco común de Zona Test**. Busca por texto o categoría, marca las preguntas (hasta 200), activa la publicación si corresponde y guarda el curso. El enlace **Vista previa y test en vivo (selección guardada)** permite probarlo y crear/cerrar una sesión con código.

El alumnado inscrito encuentra **Hacer el test de práctica del curso** en el curso. Las respuestas se corrigen en el servidor, se muestran las explicaciones al terminar y se conserva el historial. Los intentos de vista previa del administrador no se guardan. Un reintento de una respuesta perdida no duplica resultados.

Si cambia la selección o las respuestas correctas durante un intento, se pide recargar. Tras un reinicio del servidor también hay que recargar los intentos todavía no enviados. Los intentos ya guardados conservan sus resultados.

## Alcance

- No se modifican socios, cuotas, contenidos ni preguntas existentes durante el despliegue.
- La evaluación académica y la expedición de diplomas siguen bajo control del instructor. Este test es de práctica.
- Se reutiliza la sesión en vivo existente con código; queda pendiente un modo sincronizado pregunta a pregunta, con temporizador y clasificación al estilo Kahoot.
- Se mantienen los tests anteriores para no romper cursos existentes.

## Verificación

`npm run check:app` completado correctamente: navegación, formularios, socios, cuotas, cursos, diplomas, permisos, límites, almacenamiento, Zona Test y sesiones en vivo.

Pruebas adicionales dentro de `check-course-academic.mjs`: selección válida e inválida, deduplicación, publicación, acceso por matrícula, ausencia de respuestas correctas antes del envío, corrección en servidor, reintentos, separación de calificaciones, sesión en vivo desde curso, selección obsoleta y persistencia tras reinicio.

Sintaxis de los nuevos módulos comprobada y añadida a las comprobaciones de inicio. La revisión visual local no pudo completarse porque el navegador remoto bloqueó el acceso al servidor local.
