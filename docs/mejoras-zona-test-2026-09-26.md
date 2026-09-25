# Zona Test: contrarreloj y revisión de preguntas

- El selector **Contrarreloj** permite entrenar sin límite o con cuenta atrás de 1 a 180 minutos. El intento se envía al agotarse el plazo; un fallo de guardado conserva las respuestas para reintentar. Incluye la implementación anterior de la PR #198.
- La corrección muestra tarjetas verdes o rojas, respuestas con fondo intenso, parrilla de colores y etiquetas explícitas. Las respuestas en blanco se diferencian en gris.
- **Revisar pregunta** abre un formulario durante el intento o desde el resultado. No reinicia el reloj ni vuelve a dibujar el test. Los avisos se guardan para revisión administrativa; repetir el envío de un aviso pendiente del mismo socio no crea duplicados.
- El administrador tiene un banco con búsqueda y paginación, editor de enunciado, opciones, respuesta correcta, explicación, bloque y tema, eliminación confirmada y bandeja de avisos pendientes con acción para resolverlos.
- Eliminar retira la pregunta de nuevos tests y de la selección de los cursos. Si un curso se queda sin preguntas, se despublica su test. Se conservan el registro interno, los intentos y los resultados anteriores. Los guardados generales antiguos no deshacen correcciones ni eliminaciones.
- **Realizar otro test** aparece al principio y al final del resultado y lleva al selector conservando los filtros anteriores.

## Verificación y límites

Checks de API: permisos 401/403, payload 413, validación de opciones, conflicto de edición 409, aislamiento de avisos entre socios, idempotencia, resolución, historial intacto, guardados antiguos y persistencia tras reiniciar. Checks de interfaz: texto escapado, controles según rol y navegación al selector.

El reloj es una ayuda de entrenamiento local. Recargar o cerrar la pestaña abandona el intento que todavía no se ha guardado. Los nuevos intentos de práctica envían la versión de cada pregunta: la corrección mantiene esa versión aunque se edite el banco durante el intento. Se conservan las últimas 20 versiones de cada pregunta; una versión más antigua se rechaza con un aviso. Los cursos ya disponen de su control de versión.

La comprobación visual en navegador de esta ampliación está pendiente: el navegador remoto no tiene acceso al servidor local de esta sesión. No se han alterado datos de producción durante las pruebas.
