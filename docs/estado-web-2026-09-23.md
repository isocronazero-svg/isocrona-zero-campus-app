# Estado de la web — 23 de septiembre de 2026

## Punto de partida verificado

Repositorio: `isocronazero-svg/isocrona-zero-campus-app`.
Portal: `https://portal.isocronazero.org`.
Servicio productivo: `zealous-warmth / isocrona-zero-campus-test`.

La revisión parte de `e305c641dbd4da5d2f52e0bfd1f9b1bb55b8648a` (PR #188).
GitHub informa de despliegue correcto para el servicio productivo de Railway.
El despliegue fallido del segundo proyecto `outstanding-wholeness` es independiente.

Los avances de Work del 22 de septiembre ya están incorporados:

| PR | Funcionalidad |
| --- | --- |
| #183 | Guardado específico de configuración administrativa y SMTP |
| #184 | Registro, eliminación y regularización de pagos de socios |
| #185 | Guardado de asistencia, evaluación y seguimiento académico |
| #186 | Cierre de expedientes de cursos |
| #187 | Generación de diplomas |
| #188 | Creación y edición de cursos |

La rama antigua `codex/manual-payments-safe-save` quedó superada por #184; no se ha fusionado.

## Corrección de formularios

Problema encontrado: `invokeJsonAction` reconstruía la pantalla al iniciar la petición y al fallar.
Eso eliminaba los valores escritos que aún no figuraban en el estado guardado.
Los formularios de importación, además, se vaciaban sin comprobar el resultado.

Cambios:

- Conservar el formulario de creación/edición de cursos, pagos manuales e importaciones de personas y cursos durante el guardado y ante errores.
- Deshabilitar sus controles mientras la petición está en curso para evitar doble envío y edición durante la operación.
- Restaurar el estado previo de los controles al finalizar; los controles ya deshabilitados permanecen así.
- Mostrar el error junto al formulario, sin borrar lo escrito.
- Vaciar y cambiar de sección en las importaciones solo después del éxito.
- Leer de forma segura las respuestas inválidas de servidor/proxy.
- Diferenciar un guardado confirmado de un fallo posterior al actualizar la pantalla. En ese caso se bloquea repetir el envío y se indica recargar.

## Validación

Se han ejecutado sobre una copia aislada del código y datos temporales:

- Sintaxis del frontend.
- Configuración administrativa, pagos y cursos, incluida persistencia tras reiniciar los servidores de prueba.
- Prueba de recuperación de formularios con el código real del helper y del manejador de envío: errores de validación, fallo de red, respuesta HTML, respuesta vacía, doble envío, reintento y fallo de refresco tras una escritura confirmada.
- `npm run check:app`: comprobación completa de la aplicación, superada.

No se han modificado socios, cuotas, cursos ni credenciales del portal real durante estas pruebas.
Las pruebas del formulario simulan el DOM y la red; no sustituyen una prueba visual con sesión administrativa real.

## Siguientes prioridades

1. Comprobar el uso habitual en el portal: editar una ficha, registrar un pago y gestionar un curso.
2. Proteger frente a errores los formularios restantes, especialmente configuración y fichas de personas; estas últimas todavía usan el guardado general.
3. Revisar los reintentos cuando se pierde la respuesta antes de recibir confirmación del servidor. El doble clic se bloquea, pero la operación puede haberse guardado aunque no llegara su respuesta: se debe comprobar antes de repetir un pago o una importación.
4. Mantener el alcance en funcionamiento esencial; no añadir módulos ni rehacer el diseño en esta fase.
