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

## Corrección de navegación preparada en Work

Durante la revisión se encontró la PR #189 abierta, con sus comprobaciones de GitHub superadas.
Se revisó el cambio y se incorporó a la validación conjunta con los formularios:

- Destinos correctos en los botones del menú administrativo.
- Recarga del socio sin solicitar información de almacenamiento reservada a administración.
- Corrección de referencias indefinidas que bloqueaban la ficha y «Mis diplomas».
- Conservación de la pantalla activa tras guardar y del curso elegido por el administrador.

La prueba visual anterior está descrita en la PR #189. Esta sesión repite sus pruebas automáticas
junto con las nuevas pruebas de formularios; no afirma haber repetido aquella sesión de navegador.

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


---

## Actualización — 26 de septiembre de 2026

### Avances incorporados desde el último estado

Se han fusionado y están ya en `main` las siguientes mejoras posteriores a este documento:

| PR | Estado | Funcionalidad |
| --- | --- | --- |
| #189 | Fusionada | Corrección de bloqueos de navegación de socios y administración |
| #190 | Fusionada | Conservación de formularios ante fallos de guardado |
| #191 | Fusionada | Banco común de preguntas para cursos y sesiones en vivo |
| #192 | Fusionada | Corrección de plazas disponibles y verificación del recorrido completo del alumno |
| #193 | Fusionada | Carga CSV y selección múltiple de temas en Zona Test |
| #194 | Fusionada | Respuestas de test mediante recuadros pulsables y correcciones de estilos |
| #195 | Fusionada | Opción de recordar el acceso y mejoras de persistencia de formularios |
| #198 | Fusionada | Contrarreloj, corrección visible y revisión de preguntas en Zona Test |
| #200 | Fusionada | Unificación de la entrada pública de Test en Vivo |

La entrada pública canónica de Test en Vivo es ahora `public-live-test.html`. La antigua `live-test.html` se conserva únicamente como redirección de compatibilidad.

### Test en Vivo: trabajo actual

Objetivo funcional acordado: evolucionar Test en Vivo hacia un flujo dirigido tipo Kahoot:

`sala de espera → inicio por administrador → una pregunta cada vez → respuestas → cierre → clasificación → siguiente pregunta → podio final`.

Se está desarrollando de forma incremental para reducir riesgo.

**PR #201 — Add Test en Vivo waiting room**

Estado actual: abierta como borrador y **no fusionada**.

Implementado en la rama de trabajo:

- Las nuevas sesiones nacen en estado `lobby`.
- El participante entra mediante nombre y código/PIN.
- Los participantes quedan registrados en la sesión.
- El administrador puede consultar los participantes de la sala.
- Se ha añadido la acción administrativa para iniciar la sesión.
- Mientras la sesión está en `lobby`, el cliente público no debe recibir las preguntas.
- Se han ampliado las comprobaciones automáticas del flujo.

### Incidencia pendiente en PR #201

Los checks automáticos han detectado una incoherencia en el ciclo de estado de la sala. Tras entrar un participante, el flujo puede dejar la sesión fuera de `lobby`, provocando después un `409` al ejecutar la acción administrativa **Iniciar test**.

La corrección que debe aplicarse es mantener la entrada del participante libre de efectos secundarios sobre el estado:

- entrar/unirse registra al participante;
- unirse **no cambia** `lobby → active`;
- únicamente la acción administrativa de inicio puede realizar esa transición.

El PR #201 no debe fusionarse hasta que esta secuencia pase las comprobaciones automáticas.

Los últimos checks también muestran fallos de compatibilidad en pruebas de recorrido académico que esperan preguntas inmediatamente en sesiones live. Esas pruebas deben adaptarse al nuevo flujo de sala de espera/inicio explícito sin debilitar la validación existente.

### Trabajo posterior, todavía no iniciado

Después de estabilizar y fusionar #201, el siguiente bloque será la sincronización **de una sola pregunta cada vez** entre administrador y participantes. En ese bloque todavía no se incorporarán temporizador, clasificación ni podio; se añadirán posteriormente y por separado.

### PR abiertas que no deben confundirse con este trabajo

- #196 — flujo live dirigido anterior: abierta y no fusionada.
- #197 — grupos internos/subgrupos: abierta y no fusionada.
- #199 — banners propios configurables: abierta y no fusionada.

No deben mezclarse automáticamente con #201.

### Criterio de trabajo actual

Continuar con cambios pequeños, comprobables y reversibles. No tocar datos reales de producción, Railway, DNS, socios, pagos o cursos para desarrollar Test en Vivo. Ningún cambio del nuevo flujo live se fusionará mientras los checks relevantes estén en rojo.


---

## Actualización de situación — 27 de septiembre de 2026

### Estado general

La rama productiva `main` está actualmente en el commit `be19afd5a857c62c2a141b1fc9b2ac0722819b64`.

La base funcional principal del portal está ya construida: gestión administrativa, socios, pagos, cursos, seguimiento académico, diplomas, Zona Test, banco compartido de preguntas, importación CSV y acceso recordado. Las mejoras fusionadas hasta la PR #200 forman parte de `main`.

### Cambio importante respecto a la actualización anterior

La incidencia de la PR #201 descrita en la actualización del 26 de septiembre ha sido corregida en su rama.

**PR #201 — Add Test en Vivo waiting room**
- Estado: abierta como borrador; todavía no fusionada ni publicada en `main`.
- GitHub indica que es fusionable.
- Último commit revisado: `04b33482e4b31e5b0fdda58511ab47abe43cbb2d`.
- La ejecución `App checks` #210 ha terminado correctamente.
- Por tanto, el bloqueo técnico que impedía avanzar con la sala de espera ya no está presente en los checks automáticos.

Antes de publicar esta PR se debe hacer la revisión final del cambio, pasarla de borrador a lista para revisión y fusionarla.

### Qué falta por terminar

#### 1. Test en Vivo

Es el bloque funcional principal todavía incompleto.

Secuencia objetivo:

`sala de espera → administrador inicia → pregunta actual → respuestas → cierre de pregunta → clasificación → siguiente pregunta → resultado/podio final`.

Situación:
- Entrada pública única: terminada y fusionada en #200.
- Sala de espera: implementada en #201, checks superados, pendiente de revisión final y fusión.
- Una pregunta sincronizada cada vez: pendiente.
- Control del avance por el administrador: pendiente de completar sobre el flujo nuevo.
- Temporizador por pregunta: pendiente en el flujo canónico.
- Registro de respuesta por participante y pregunta: pendiente de completar.
- Cierre de pregunta y revelado de respuesta correcta: pendiente.
- Clasificación provisional entre preguntas: pendiente.
- Siguiente pregunta sincronizada: pendiente.
- Clasificación/podio final: pendiente.
- Prueba completa con varios participantes simultáneos: pendiente.

La PR #196 contiene un desarrollo anterior de test dirigido con temporizador y clasificación, pero sigue abierta y no debe fusionarse directamente sin reconciliarla con la arquitectura canónica creada por #200/#201.

#### 2. Grupos internos y subgrupos

**PR #197 — Fix internal group uploads, subgroups and draft persistence**
- Abierta.
- No fusionada.
- GitHub la marca actualmente como no fusionable con `main`.
- Debe revisarse/rebasarse y comprobar qué partes siguen siendo necesarias antes de publicar.

#### 3. Banners/patrocinadores

**PR #199 — Add configurable own banners, disabled by default**
- Abierta y no fusionada.
- Contiene el trabajo para banners propios configurables.
- Debe actualizarse respecto a `main`, revisar conflictos/compatibilidad y validar visualmente antes de publicar.
- Sigue pendiente completar/verificar la experiencia final de patrocinadores prevista para el portal.

#### 4. Validación final de administración y socio

Aunque existen checks automáticos, antes de considerar la web terminada se mantiene pendiente una pasada funcional real de los recorridos principales:
- acceso y opción de recordar sesión;
- administrador usando también la experiencia de socio;
- ficha de socio;
- pagos;
- alta/edición de cursos;
- inscripción y plazas;
- asistencia/evaluación;
- cierre de expediente;
- diplomas;
- Zona Test;
- carga y revisión de preguntas;
- Test en Vivo completo cuando esté terminado.

### Qué falta por publicar

En este momento no deben considerarse publicadas las funcionalidades que permanecen únicamente en PR abiertas:

| PR | Funcionalidad | Situación |
| --- | --- | --- |
| #201 | Sala de espera de Test en Vivo | Checks verdes; pendiente de revisión final y fusión |
| #196 | Test dirigido, temporizador y clasificación (implementación anterior) | Pendiente de reconciliar; no fusionar directamente |
| #197 | Grupos internos/subgrupos y persistencia de borradores | Pendiente; actualmente no fusionable |
| #199 | Banners/patrocinadores configurables | Pendiente de actualizar, validar y fusionar |

### Orden recomendado de cierre

1. Revisar y fusionar #201.
2. Terminar el Test en Vivo canónico por bloques pequeños hasta completar pregunta-a-pregunta, temporizador, clasificación y podio.
3. Cerrar o reaprovechar #196 para no mantener dos implementaciones competidoras.
4. Resolver #197 y comprobar grupos/subgrupos.
5. Resolver #199 y validar banners/patrocinadores.
6. Ejecutar una prueba integral de administrador y socio.
7. Corregir únicamente los fallos encontrados en esa prueba.
8. Publicación final y comprobación del portal real.

### Criterio para considerar la web terminada

No basta con que las pantallas existan. La versión final debe tener un único flujo para cada función, checks automáticos verdes, recorridos principales probados y ninguna PR antigua que pueda introducir una implementación duplicada o incompatible.
