# Estado del portal — 6 de octubre de 2026

Repositorio: `isocronazero-svg/isocrona-zero-campus-app`.
Portal: `https://portal.isocronazero.org`.

Este documento fija el punto de continuidad para evitar volver a reconstruir el contexto en futuras sesiones. Sustituye como referencia operativa al estado del 3 de octubre para los trabajos posteriores aquí descritos.

## 1. Punto de partida actual

- `main` incorpora la PR #223 mediante el commit `d59f44143f70e4ab1ad8d3c873869bd5a62a84a7`.
- PR #223: corrección de diplomas/certificados.
  - Anverso y reverso A4 horizontal.
  - Contraste corregido.
  - Temario real completo, sin contenidos genéricos inventados.
  - Anexos cuando el contenido no cabe.
  - Vista previa y PDF comparten el mismo layout.
- GitHub Actions de `main`, ejecución App checks #290: `success`.
- En esta sesión no se ha realizado una verificación independiente del despliegue de Railway posterior a #223, por lo que no debe afirmarse aquí que producción ya sirve ese commit sin comprobarlo.

## 2. PR #224 — simplificación de inscripción

Estado: **abierta y no debe fusionarse todavía**.

Head: `6ef9a737a78a1c971892677ee30930bedb47bdc0`.

GitHub informa actualmente `mergeable: true` y `mergeable_state: clean` frente al `main` actualizado. La aparente incompatibilidad observada inmediatamente después de fusionar #223 fue transitoria durante el recálculo de GitHub; no hay conflicto estructural entre ambas ramas.

### Cambios ya preparados en #224

- Un único CTA de inscripción por curso.
- Eliminación de banners/acciones duplicadas.
- Apertura directa del formulario de inscripción.
- Estados claros: inscrito, solicitud en espera y curso completo.
- Vista de alumno más limpia.
- Protección frente a doble envío del justificante.
- Tests automáticos y QA de móvil/escritorio ya realizados en la rama.

### Bloqueo localizado antes de fusionar

Existe una revisión P2 de Codex aún sin resolver en `public/app.js`, alrededor de la gestión del formulario `courseEnrollmentProofUpdateForm`.

Problema: en caso de error de validación o subida del justificante se llama a:

```js
showToast(syncStatus, "error");
```

`showToast` tiene la firma:

```js
showToast(message, type = "success", preserveView = false)
```

Por tanto el toast vuelve a renderizar la vista y puede desmontar el formulario, perdiendo el archivo seleccionado y la nota. Esto contradice precisamente el objetivo de reintento de #224.

Corrección prevista:

```js
showToast(syncStatus, "error", true);
```

Después de aplicar esa corrección hay que repetir como mínimo:

- `scripts/check-member-rendering.mjs`.
- `npm run check:app`.
- `npm run smoke:campus-test`.
- Revisión del hilo P2 y, si todo queda verde, fusionar #224.

No fusionar #224 antes de resolver esta observación.

## 3. Test en Vivo — auditoría del comportamiento actual

El flujo actual ya tiene temporizador, recuperación de sesión, identidades separadas, puntuación por rapidez, clasificación y podio.

### Comportamiento actual confirmado en código

- Tras enviar una respuesta, el cliente marca `answered = true`.
- Los radio buttons se deshabilitan cuando `answered` es verdadero.
- El submit del participante también bloquea un segundo envío si `state.liveSession.answered` es verdadero.
- El backend está cubierto por una regresión que exige HTTP 409 si el participante intenta cambiar una respuesta ya enviada por otra distinta.
- Repetir exactamente la misma respuesta es idempotente.
- El administrador ve `Respuestas recibidas: X de Y`.
- La pregunta se cierra manualmente mediante `Cerrar y mostrar respuesta`, o por agotamiento de tiempo.
- Una vez cerrada se revela la respuesta correcta, puntos y clasificación provisional.

### Mejora pendiente acordada

Modificar el flujo para que:

1. El participante pueda seleccionar y volver a enviar otra opción mientras la pregunta siga abierta y quede tiempo.
2. La respuesta válida sea siempre la última enviada antes del cierre.
3. Mientras falten participantes, quien ya respondió pueda rectificar.
4. Cuando todos los participantes activos hayan respondido, la pregunta se cierre automáticamente sin esperar al final del temporizador.
5. Al cerrarse se muestre la solución, puntuación y clasificación con el flujo ya existente.
6. Después del resultado el anfitrión continúa con `Siguiente pregunta`/`Finalizar`, manteniendo el recorrido controlado.
7. Seguir rechazando respuestas después del cierre, después de vencer el tiempo o para una pregunta que ya no sea la activa.

La implementación debe cambiar tanto frontend como backend y actualizar las regresiones que actualmente esperan 409 al cambiar una respuesta.

## 4. Test normal — modo aprendizaje pendiente

El Test normal actual guarda las respuestas y muestra la revisión detallada únicamente al finalizar el intento. Ya existe la infraestructura para:

- preguntas falladas,
- marcar preguntas para repasar,
- historial,
- explicación de la respuesta,
- respuesta correcta y respuesta elegida.

Siguiente mejora: añadir un modo de aprendizaje/práctica en el que, al responder cada pregunta, pueda verse inmediatamente si se ha acertado o fallado, la opción correcta y la explicación cuando exista, manteniendo la posibilidad de marcar esa pregunta para repasar. El Test normal convencional debe seguir disponible sin revelar soluciones antes de finalizar.

Mantener el alcance simplificado acordado el 5 de octubre: no reintroducir los puntos 3 y 4 que se descartaron de aquella propuesta hasta recibir más uso real y opiniones.

## 5. Orden recomendado de continuación

1. Corregir el P2 de #224 y repetir sus checks.
2. Fusionar #224 solo con checks verdes.
3. Verificar `main` y despliegue productivo.
4. Implementar rectificación + cierre automático por respuestas completas en Test en Vivo.
5. Implementar el modo aprendizaje del Test normal reutilizando el sistema de revisión/marcado existente.
6. Ejecutar suite completa, smoke y QA visual a 390 y 1440 px.
7. Probar recorridos reales: inscripción, curso, aviso, Test normal, Test en Vivo y diploma.
8. Congelar la V1 y abrir nuevas funciones únicamente a partir de incidencias/opiniones reales.

## 6. Estimación de trabajo restante

La integración de diplomas ya no forma parte del pendiente y el problema de #224 está localizado en una corrección muy pequeña. Estimación orientativa para el trabajo que todavía requiera agente de desarrollo:

- #224, corrección + regresión + integración: 3–10 créditos.
- Test en Vivo, rectificación y cierre automático: 15–30 créditos.
- Test normal, modo aprendizaje: 10–20 créditos.
- QA final, regresiones y publicación: 10–20 créditos.

Rango de planificación actual: **aprox. 38–80 créditos**, con objetivo razonable de cerrar la V1 alrededor de 50–65 si no aparecen regresiones relevantes.

## 7. Norma de continuidad

Antes de iniciar una nueva tarea de agente, leer este documento y revisar las PR/commits posteriores. No volver a implementar bloques ya publicados. Agrupar cada encargo en un único ciclo: implementar, probar, corregir, abrir PR y actualizar este estado. El objetivo es minimizar uso de agente y evitar trabajo duplicado.
