# Carga de preguntas por bloques y temas

## Organización

Los bloques principales son IVASPE, TEMARIO COMÚN y GUADALAJARA. Cada bloque contiene temas (columna `category` del CSV). Se conservan los bloques anteriores que ya tengan preguntas; no se reclasifican automáticamente como IVASPE.

En Zona Test, administración dispone de **Importar documentos de preguntas**, al principio de la pantalla. También se puede entrar en `/question-bank.html` con la sesión de administrador.

## Cargar documentos

1. Elegir el bloque principal.
2. Seleccionar uno o varios CSV completos de la plantilla habitual (hasta 20 archivos por lote).
3. Pulsar **Revisar archivos**. Se muestran preguntas nuevas, duplicadas y errores por archivo/fila.
4. Pulsar **Importar preguntas revisadas**.

El bloque elegido se aplica a todo el lote. Los temas se obtienen de `category`. Si un archivo contiene errores, no se escribe ninguna pregunta del lote. Las preguntas existentes del mismo bloque se omiten por enunciado normalizado; no se sustituyen sus respuestas ni identificadores. Repetir una carga no duplica las preguntas. El mismo enunciado puede existir en bloques distintos.

La página ofrece la descarga de la plantilla CSV. Se conserva la cabecera original y `correctIndex` usa 0=A, 1=B, 2=C, 3=D. Solo se admite CSV en esta entrega, no Word, PDF ni XLSX.

## Archivos aportados

Los siete CSV recibidos coinciden, salvo saltos de línea, con los incluidos en el proyecto: 175 preguntas sin errores de estructura ni duplicados entre archivos.

| Tema IVASPE | Preguntas |
|---|---:|
| Incendios forestales | 25 |
| Incendios urbanos y estructurales | 25 |
| Material, equipos y herramientas | 25 |
| Rescate y salvamento | 25 |
| Riesgo químico y mercancías peligrosas | 25 |
| Sanitario operativo | 50 |

El botón **Revisar las 175 preguntas IVASPE** permite cargar este paquete sin volver a seleccionar los siete archivos. Requiere después **Importar preguntas revisadas** en la sesión administrativa. El despliegue no importa contenido automáticamente en la base de producción.

## Comprobación

La importación de las 175 preguntas, su repetición sin duplicados, la previsualización sin escritura, la carga atómica, los permisos, los tres bloques y la corrección de una pregunta importada están probados contra una base temporal. `npm run check:app` pasa completo. La validación de los CSV comprueba su estructura, no constituye revisión técnica del contenido.

El banco sigue siendo `testZoneQuestions`, compartido por Zona Test, selección de cursos y sesiones en vivo.

## Generador por selección múltiple

El generador permite marcar un temario completo o temas sueltos de distintos temarios. Cada fila muestra el número de preguntas cargadas. La selección parcial aparece en la casilla del temario. Se mantienen separados los temas con igual nombre pertenecientes a bloques distintos. Una selección vacía muestra un aviso; no genera un test de todos los temas por defecto. Puede combinarse con la dificultad y el número de preguntas. No se añade temporizador en esta entrega.
