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

Estado actual: **fusionada en `main`** el 27 de septiembre de 2026.

Queda incorporado:

- Las nuevas sesiones nacen en estado `lobby`.
- El participante entra mediante nombre y código/PIN.
- Los participantes quedan registrados en la sesión.
- El administrador puede consultar los participantes de la sala.
- Solo el administrador puede iniciar la sesión y realizar la transición `lobby → active`.
- Mientras la sesión está en `lobby`, el cliente público no recibe preguntas.
- La incidencia de estado detectada durante el desarrollo quedó corregida antes de fusionar.
- La ejecución `App checks` #210 terminó correctamente.

**PR #203 — Synchronize one live question at a time**

Estado actual: **fusionada en `main`**.

Queda incorporado:

- Una sola pregunta activa cada vez mediante `currentQuestionIndex`.
- El participante recibe únicamente la pregunta actual.
- El administrador puede avanzar a la siguiente pregunta.
- Cada participante puede contestar una sola vez por pregunta.
- Las respuestas quedan ligadas al participante y a la pregunta.
- Las respuestas atrasadas se rechazan al cambiar de pregunta.
- Se mantiene compatibilidad con sesiones antiguas.
- La ejecución `App checks` #219 terminó correctamente.

### Trabajo posterior

El siguiente bloque es **cerrar la pregunta actual y revelar la respuesta correcta de forma controlada**. Todavía no se deben mezclar temporizador, ranking provisional ni podio en este mismo cambio.

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

La rama productiva `main` está actualmente en el commit `539a9cf621af016ac8ebdc8d294425293ba1e07e`.

La base funcional principal del portal está ya construida: gestión administrativa, socios, pagos, cursos, seguimiento académico, diplomas, Zona Test, banco compartido de preguntas, importación CSV y acceso recordado. Las mejoras fusionadas hasta la PR #200 forman parte de `main`.

### Cambio importante respecto a la actualización anterior

La sala de espera de la PR #201 ya está fusionada y el siguiente bloque, PR #203, también está terminado y fusionado. El flujo canónico ya llega hasta **una pregunta activa sincronizada, respuesta individual y avance a la siguiente pregunta**.

El siguiente trabajo activo pasa a ser el **cierre de pregunta y revelado controlado de la respuesta correcta**.

### Qué falta por terminar

#### 1. Test en Vivo

Es el bloque funcional principal todavía incompleto.

Secuencia objetivo:

`sala de espera → administrador inicia → pregunta actual → respuestas → cierre de pregunta → clasificación → siguiente pregunta → resultado/podio final`.

Situación:
- Entrada pública única: terminada y fusionada en #200.
- Sala de espera: terminada y fusionada en #201.
- Una pregunta sincronizada cada vez: terminada y fusionada en #203.
- Registro de respuesta por participante y pregunta: terminado en #203.
- Avance del administrador a la siguiente pregunta: terminado en #203.
- Cierre de pregunta y revelado de respuesta correcta: **siguiente bloque a implementar**.
- Temporizador por pregunta: pendiente.
- Clasificación provisional entre preguntas: pendiente.
- Paso desde resultado a siguiente pregunta: pendiente de integrar con el cierre/revelado.
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
| #201 | Sala de espera de Test en Vivo | Fusionada en `main` |
| #196 | Test dirigido, temporizador y clasificación (implementación anterior) | Pendiente de reconciliar; no fusionar directamente |
| #197 | Grupos internos/subgrupos y persistencia de borradores | Pendiente; actualmente no fusionable |
| #199 | Banners/patrocinadores configurables | Pendiente de actualizar, validar y fusionar |

### Orden recomendado de cierre

1. Implementar cierre de pregunta y revelado controlado de la respuesta correcta.
2. Continuar el Test en Vivo canónico por bloques pequeños: temporizador, puntuación, clasificación y podio.
3. Cerrar o reaprovechar #196 para no mantener dos implementaciones competidoras.
4. Resolver #197 y comprobar grupos/subgrupos.
5. Resolver #199 y validar banners/patrocinadores.
6. Ejecutar una prueba integral de administrador y socio.
7. Corregir únicamente los fallos encontrados en esa prueba.
8. Publicación final y comprobación del portal real.

### Criterio para considerar la web terminada

No basta con que las pantallas existan. La versión final debe tener un único flujo para cada función, checks automáticos verdes, recorridos principales probados y ninguna PR antigua que pueda introducir una implementación duplicada o incompatible.


---

## Avance — 27 de septiembre de 2026: pregunta sincronizada

Se ha completado y fusionado la **PR #203 — Synchronize one live question at a time**.

Commit incorporado a `main`: `73e8bfe47dd6d161c24183f7a6d58a1b1406d13f`.

### Qué queda ya funcionando en Test en Vivo

El flujo canónico incorpora ahora:

`crear sala → participantes entran → administrador inicia → una única pregunta activa → participante responde → administrador avanza → siguiente pregunta`.

Cambios principales:

- Las sesiones nuevas usan una pregunta activa identificada por `currentQuestionIndex`.
- El participante solo recibe la pregunta que corresponde en ese momento.
- El administrador ve el número de pregunta actual y puede pasar a la siguiente.
- Los participantes siguen consultando el estado mientras el test está activo para recibir el cambio de pregunta.
- Cada participante puede enviar una única respuesta por pregunta.
- La respuesta queda almacenada por participante y pregunta.
- Repetir exactamente la misma respuesta es idempotente; intentar cambiarla después queda bloqueado.
- Una respuesta atrasada se rechaza si el administrador ya ha cambiado de pregunta.
- El flujo dirigido ya no puede utilizar el endpoint antiguo de envío completo para saltarse el control pregunta a pregunta.
- Las sesiones antiguas activas sin estado guiado mantienen compatibilidad con el flujo anterior.
- Se corrigió un caso en el que una respuesta vacía podía interpretarse como la opción A.
- Se evitó una carrera entre el polling activo y el guardado de la respuesta.
- Se han adaptado las pruebas de cursos y recorrido del alumno al nuevo flujo.

### Validación

La ejecución `App checks` #219 terminó correctamente antes de fusionar.

### Siguiente bloque pendiente de Test en Vivo

El siguiente paso debe ser el **cierre de la pregunta y revelado controlado de la respuesta correcta**, todavía sin ranking general ni podio.

Después:

1. Temporizador por pregunta.
2. Puntuación por acierto y, si se decide, velocidad.
3. Clasificación provisional entre preguntas.
4. Paso controlado a la siguiente pregunta desde la pantalla de resultado.
5. Cierre de sesión.
6. Clasificación/podio final.
7. Prueba real con varios participantes simultáneos.

No conviene mezclar todavía estos bloques en un único cambio grande.


---

## Avance — 27 de septiembre de 2026: cierre y revelado de pregunta

Se ha abierto la **PR #204 — Close and reveal each live question**, todavía en validación y sin fusionar.

El bloque añade:

- cierre explícito de la pregunta por el administrador;
- bloqueo de nuevas respuestas una vez cerrada;
- revelado de la respuesta correcta únicamente después del cierre;
- comparación de la respuesta del participante con la correcta;
- obligación de cerrar la pregunta antes de avanzar;
- apertura limpia de la siguiente pregunta sin revelar su solución;
- mantenimiento del flujo antiguo para sesiones legacy.

Todavía **no** incorpora temporizador, puntuación por velocidad, clasificación provisional ni podio.

La PR #204 solo se fusionará si los checks automáticos terminan en verde. Después, el siguiente bloque será el temporizador por pregunta.
