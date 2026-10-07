# Estado del portal — 6 de octubre de 2026

Repositorio: `isocronazero-svg/isocrona-zero-campus-app`.
Portal: `https://portal.isocronazero.org`.

Este documento fija el punto de continuidad para evitar reconstruir contexto en futuras sesiones. Sustituye como referencia operativa al estado del 3 de octubre y se ha actualizado tras la auditoría de backlog del 7 de octubre.

## 1. Punto de partida actual

- `main` incorpora la PR #223 mediante el commit `d59f44143f70e4ab1ad8d3c873869bd5a62a84a7`.
- PR #223: corrección de diplomas/certificados.
  - Anverso y reverso A4 horizontal.
  - Contraste corregido.
  - Temario real completo, sin contenidos genéricos inventados.
  - Anexos cuando el contenido no cabe.
  - Vista previa y PDF comparten el mismo layout.
- GitHub Actions de `main`, ejecución App checks #290: `success`.
- El documento de continuidad se añadió inicialmente en el commit `100491e2efb7002d05584a152f5ea34667b57c27`.
- En esta sesión no se ha realizado una verificación independiente del despliegue de Railway posterior a #223; no debe afirmarse que producción ya sirve un SHA concreto sin comprobarlo.

## 2. PR #224 — simplificación de inscripción

Estado: **abierta y no debe fusionarse todavía**.

Head: `6ef9a737a78a1c971892677ee30930bedb47bdc0`.

GitHub informa `mergeable: true` y `mergeable_state: clean` frente al `main` actualizado.

### Cambios ya preparados

- Un único CTA de inscripción por curso.
- Eliminación de banners/acciones duplicadas.
- Apertura directa del formulario de inscripción.
- Estados claros: inscrito, solicitud en espera y curso completo.
- Vista de alumno más limpia.
- Protección frente a doble envío del justificante.
- Tests automáticos y QA de móvil/escritorio ya realizados en la rama.

### Único bloqueo localizado

Existe una revisión P2 de Codex aún sin resolver en `public/app.js`, alrededor de `courseEnrollmentProofUpdateForm`.

En caso de error de validación o subida se llama a:

```js
showToast(syncStatus, "error");
```

La función tiene la firma:

```js
showToast(message, type = "success", preserveView = false)
```

El toast puede provocar un render y desmontar el formulario, perdiendo archivo y nota. Corrección prevista:

```js
showToast(syncStatus, "error", true);
```

Después de aplicar esa línea repetir como mínimo:

- `scripts/check-member-rendering.mjs`.
- `npm run check:app`.
- `npm run smoke:campus-test`.
- Resolver/revisar el hilo P2.

Solo entonces fusionar #224.

## 3. Test en Vivo — V1

El flujo actual ya tiene temporizador, recuperación de sesión, identidades separadas, puntuación por rapidez, clasificación y podio.

### Comportamiento actual confirmado

- Tras enviar una respuesta, el cliente marca `answered = true`.
- Los radio buttons se deshabilitan cuando `answered` es verdadero.
- El submit bloquea un segundo envío si `state.liveSession.answered` es verdadero.
- El backend tiene una regresión que exige HTTP 409 al intentar cambiar una respuesta ya enviada por otra distinta.
- Repetir exactamente la misma respuesta es idempotente.
- El administrador ve `Respuestas recibidas: X de Y`.
- Una vez cerrada la pregunta se revela respuesta correcta, puntos y clasificación provisional.

### Tarea V1 creada: #225

`V1 · Test en Vivo: permitir rectificar y cerrar al responder todos`

Alcance cerrado:

1. Permitir cambiar la respuesta mientras la pregunta siga abierta.
2. La última respuesta válida es la que cuenta.
3. No duplicar respuestas ni puntuación.
4. Cuando todos los participantes activos hayan respondido, cerrar/revelar automáticamente sin esperar al final del contador.
5. Mantener ocultos `correctIndex`, explicación, puntos y clasificación antes del cierre.
6. Mantener paso explícito del anfitrión a `Siguiente pregunta` / `Finalizar` tras mostrar resultados.
7. Actualizar las regresiones que actualmente esperan 409 al cambiar una respuesta.

Fuera de V1: pausa del profesor, controles avanzados, selección manual sofisticada de preguntas, ranking global, XP y ligas.

## 4. Test normal — modo aprendizaje V1

El Test normal actual ya dispone de:

- preguntas falladas,
- marcadas para repasar,
- historial,
- estadísticas personales,
- revisión detallada,
- explicación,
- respuesta correcta y respuesta elegida.

### Tarea V1 creada: #226

`V1 · Test normal: añadir modo aprendizaje con corrección inmediata`

Alcance:

- Selector sencillo entre modo normal y modo aprendizaje.
- En aprendizaje: una pregunta cada vez.
- Después de enviar respuesta: correcta/incorrecta, opción correcta y explicación cuando exista.
- Una pregunta ya corregida queda bloqueada.
- Se conserva marcar para repasar.
- El resultado final alimenta falladas, estadísticas e historial actuales.
- El modo normal no cambia.
- No exponer `correctIndex` ni explicación en el payload inicial del socio; la corrección debe entregarse solo después de responder.

Fuera de V1: repetición espaciada, IA adaptativa, gamificación y cambios de Test en Vivo.

## 5. QA y congelación de V1

### Tarea V1 creada: #227

`V1 · QA final, regresiones y congelación de producto`

Solo ejecutar tras integrar #224, #225 y #226.

Debe validar:

- login/logout y permisos;
- admin y Modo Socio;
- socios/perfil/navegación;
- cursos, inscripción, pago/justificante, espera y aula;
- diplomas y verificación pública;
- Test normal, aprendizaje, falladas, marcadas, revisión, historial y estadísticas;
- Test en Vivo completo;
- avisos, adjuntos y compartir por WhatsApp según funcionalidad actual;
- responsive aproximado 390 / 768 / 1440 px;
- suite completa y consola limpia en recorridos principales.

Tras QA verde, congelar V1: cualquier funcionalidad nueva pasa a backlog V2.

## 6. Auditoría de backlog realizada el 7 de octubre

Se detectaron numerosas issues antiguas que seguían abiertas pese a estar ya implementadas. Se cerraron como completadas para evitar que futuros agentes rehagan trabajo existente.

Cerradas por estar ya resueltas en el código/PR previas:

- #91 privacidad y validación Test Zone — resuelta por PR #95.
- #92 marcado de preguntas para repasar.
- #93 modo Repasar marcadas.
- #102 estadísticas básicas Test Zone.
- #103 revisión detallada post-test.
- #108 pulido sencillo Test Zone.
- #113 importador CSV maestro — resuelto por PR #114 y trabajos posteriores.
- #139 navegación extraída de `public/app.js`.
- #140 carga de `public/app.js` como módulo ES.
- #144 formatters frontend extraídos.
- #146 constantes de acciones admin extraídas.
- #148 grupos por defecto de Campus extraídos.
- #150 helpers de almacenamiento local extraídos.
- #154 preservación de diplomas emitidos — resuelta por PR #155 ya fusionada.

Esto reduce de forma importante el backlog aparente y evita gastar créditos en trabajo duplicado.

## 7. Trabajo abierto que NO es bloqueador de V1 funcional

### Producción / Railway

- #134: importar las preguntas IVASPE en producción Railway si todavía no están cargadas.
- #136: automatización de importación IVASPE en Railway.
- PR #161: `Add Railway SSH known hosts`, rama antigua y actualmente desfasada respecto a `main`; solo revisarla si la importación remota de Railway sigue siendo necesaria.

`main` ya contiene un workflow manual `import-test-zone-ivaspe.yml` con dry-run, preflight de persistencia y ejecución remota por Railway SSH. No invertir créditos adicionales aquí hasta comprobar que la producción real lo necesita.

### Contenido

- #111: ampliar el banco de preguntas Test Zone.
- #112: continuar bloques IVASPE pendientes. Actualmente el repositorio ya contiene siete CSV de 25 preguntas (175 preguntas) y el pipeline de validación/importación está preparado.

El contenido adicional puede seguir creciendo después de V1 y no debe bloquear el cierre funcional.

### Deuda técnica / V2

- #109: refactor incremental de arquitectura backend.

Es importante a medio plazo, pero no debe mezclarse con el sprint de cierre de V1 salvo que aparezca una regresión que lo haga imprescindible.

## 8. Orden recomendado cuando vuelva el cupo de agente

1. #224: aplicar la línea P2, ejecutar checks y fusionar.
2. #225: Test en Vivo, rectificación + cierre automático al responder todos.
3. #226: modo aprendizaje del Test normal.
4. #227: QA final, regresiones, documentación y congelación.
5. Solo después decidir si #134/#136 son necesarios para producción y si se amplía contenido (#111/#112).
6. Mantener #109 para V2 salvo necesidad real.

## 9. Estimación actual de créditos

Tras limpiar backlog y cerrar especificaciones, el trabajo que realmente requiere agente queda concentrado:

- #224: corrección + regresión + integración: aproximadamente 3–8 créditos.
- #225 Test en Vivo: aproximadamente 15–30 créditos.
- #226 modo aprendizaje: aproximadamente 10–20 créditos.
- #227 QA final: aproximadamente 10–15 créditos si no aparecen regresiones relevantes.

Rango de planificación: **aprox. 38–73 créditos**. Como objetivo operativo, reservar alrededor de **45–60 créditos** parece razonable si las especificaciones se ejecutan sin ampliar alcance.

## 10. Norma de continuidad

Antes de iniciar una tarea de agente:

1. Leer este documento.
2. Revisar PR/commits posteriores.
3. No reabrir funcionalidades ya implementadas salvo regresión demostrada.
4. Trabajar una issue V1 cerrada de alcance cada vez.
5. Agrupar implementar + tests + corrección + PR en un único encargo.
6. No convertir el sprint final en un refactor general.

El objetivo es terminar producto, no seguir añadiendo superficie de desarrollo.