# Test en vivo dirigido — 25 de septiembre de 2026

Desde **Zona Test → Dirigir test en vivo**, administración elige título, bloque, tema, número de preguntas y segundos por pregunta. Desde la vista previa de un curso puede abrir la misma sala usando la selección guardada en ese curso.

1. Crear sala: aparece un PIN de seis cifras y un enlace para compartir.
2. Los participantes entran por `/play-live.html` con nombre y PIN, sin cuenta del campus. Se evita repetir nombres dentro de la sala.
3. Iniciar test: todos reciben una sola pregunta. El servidor controla el plazo.
4. El profesor puede cerrar antes una pregunta; al agotarse el tiempo se cierra automáticamente. Aparecen respuesta correcta, explicación, distribución y clasificación.
5. El profesor avanza a la siguiente pregunta o finaliza. La última termina en clasificación final descargable en CSV.

Cada acierto vale entre 500 y 1.000 puntos según rapidez. Un fallo o una pregunta no contestada no suma puntos. El resultado académico de un curso y los diplomas siguen bajo control del instructor; la puntuación del juego no modifica esas evaluaciones.

## Fiabilidad

- Una respuesta por participante y pregunta; reintentar la misma no duplica puntos. Cambiar una respuesta enviada se rechaza.
- Las acciones del profesor incluyen la revisión actual: una doble pulsación no salta dos preguntas.
- Cuenta atrás calculada con la hora del servidor; al cerrar la pregunta se rechazan nuevas respuestas.
- El participante conserva su acceso en la pestaña. Recargar recupera la sala y las respuestas confirmadas. La pantalla del profesor se recupera desde su enlace o la lista de sesiones recientes.
- Preguntas fijadas al crear la partida: editar el banco no cambia una pregunta durante la clase.
- Las partidas se guardan en la tabla `live_quizzes` de `campus.db`, fuera del estado general del portal. Un guardado de cursos no puede sobrescribirlas. Los tokens de participantes se guardan como hash.
- La sesión caduca después de 24 horas. Máximo de 200 participantes por sala. Las pantallas consultan el estado cada segundo; no requieren servicios externos.
- El CSV descarga la clasificación. Para copia completa de partidas se debe respaldar `campus.db`; el export del estado general del portal no incluye esta tabla.

Se conservan los antiguos tests con código para responder a ritmo propio, identificados como tales. El acceso principal de test en vivo lleva al modo dirigido.

## Validación

`node scripts/check-live-quiz.mjs` comprueba permisos, creación repetida, entrada y reentrada, separación entre salas, respuestas simultáneas, reintentos, plazo, clasificación, reinicio, selección del curso y resultados finales con una base temporal.

La prueba se incorpora a `npm run check:app`. No usa ni modifica datos de producción.

Verificación en navegador: profesor en escritorio y dos participantes en pantallas móviles; recorrido hasta clasificación final, reintento tras fallo de red, recargas de profesor y participante, export CSV y comprobación de desbordamiento horizontal. Revisión visual de pregunta, corrección y resultado final.
