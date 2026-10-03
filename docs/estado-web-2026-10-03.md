# Estado del portal — 3 de octubre de 2026

Repositorio: `isocronazero-svg/isocrona-zero-campus-app`.
Portal: https://portal.isocronazero.org.

## Continuación: identidades y panel del administrador

Esta sección es la actualización más reciente; las anotaciones de bloqueo de
las 09:04 que aparecen después se conservan como histórico.

- La revisión de permisos ha permitido reanudar las pruebas.
- Prueba multijugador real superada con administrador, dos socios y un invitado:
  dos participantes introducen el mismo nombre y reciben identidades/etiquetas
  diferentes. Se comprueba que sus respuestas y puntuaciones no se mezclan.
- La entrada cuyo resultado HTTP se pierde se recupera tras recargar y reintentar
  sin duplicar participantes. La recuperación de respuestas y del podio sigue funcionando.
- El panel del anfitrión actualiza automáticamente participantes, respuestas y
  estado cada tres segundos; reloj por pregunta, formulario y foco conservados.
- Comprobados reintentos del anfitrión tras desconexión y cancelación al salir
  de Test en Vivo. El cierre por tiempo habilita el podio sin actualización manual.
- Añadida comprobación automatizada del panel: respuestas tardías tras cambio de
  cuenta/vista, permisos caducados, solicitudes sin solapamiento, pausa al ocultar
  la pestaña y recuperación al volver desde el historial del navegador.
- `scripts/check-live-multiplayer-ui.mjs`, checks específicos de interfaz y
  suite completa `npm run check:app` correctos. Confirmar CI y despliegue en la
  PR de esta rama antes de considerarla publicada.

### Coordinación entre móvil y portátil

El usuario ha informado de que hoy también ha encargado tareas del proyecto
mediante ChatGPT escritorio en su portátil. Se han consultado el contexto
recuperable, las PR de hoy y las ramas compartidas. No se han recuperado las
instrucciones concretas del otro chat ni aparece otra PR de hoy aparte de #214.
No debe afirmarse que se conocen o han incorporado esos encargos.

Este bloque se limita a Test en Vivo, en `codex/live-identities-host-refresh`.
Se comprobará de nuevo `main` y la rama antes de integrar y se conservarán los
cambios concurrentes. Las tareas del portátil que aún no estén compartidas
requieren el texto, una captura o una referencia a su rama/PR para contrastarlas.
No se han modificado otras ramas del proyecto.

## Actualización de seguimiento — 09:04, Europe/Madrid

Esta sección prevalece sobre el histórico de trabajo que sigue.

### Publicado y verificado

- PR #214 fusionada: `af8e4e76b3e3ae5ae4f41834d70b89efda60eedc`.
- Recuperación de partida al recargar, confirmación de respuestas tras fallos
  de conexión, recuperación del reloj y podio correcto tras cierre por tiempo.
- App checks #263 y #264 superados. Railway productivo
  `zealous-warmth / isocrona-zero-campus-test` correcto para ese commit.
- Portal y archivos públicos verificados tras la publicación. El JavaScript
  publicado coincidía byte a byte con el validado. La consulta actual a GitHub
  confirma que `main` continúa en #214.
- Los bloques anteriores de preguntas, grupos, patrocinadores e interfaz
  (#210–#213) también permanecen integrados.

### Preparado, pendiente de validación final y publicación

Rama de trabajo: `codex/live-identities-host-refresh`, basada en #214.

- Identidades independientes para participantes con el mismo nombre. La sala
  asigna etiquetas como «Carlos» y «Carlos (2)», con respuestas y puntos separados.
- Clave aleatoria de entrada por pestaña para reintentar una entrada cuya
  confirmación se perdió, sin crear otro participante; persistencia del hash
  en servidor y recuperación de participantes antiguos mediante su identificador.
- Panel del administrador con actualización cada tres segundos, contador de
  respuestas recibidas, reloj y reintento tras errores de red.
- Actualización limitada a la lista de salas para conservar valores y foco del
  formulario. Cancelación de consultas al abandonar la vista o cambiar de cuenta.
- Prueba de navegador ampliada para nombres repetidos, confirmación de entrada
  perdida, recarga, borrador del administrador y salida de la vista.

Comprobaciones realizadas sobre este bloque:

- `scripts/check-test-zone.mjs`: correcto, incluida separación de nombres,
  puntuaciones independientes, reintentos, permisos y persistencia tras reinicio.
- `scripts/check-public-live-lobby-ui.mjs`: correcto (DOM simulado).
- Sintaxis de los archivos modificados y `git diff --check`: correctos.
- La nueva prueba multijugador en Chromium **no se ha ejecutado**. La revisión
  automática de permisos rechazó el lanzamiento porque no pudo completarse al
  alcanzarse el límite de uso. No fue un fallo de la aplicación ni un dictamen de
  que la acción fuera insegura. No se ha intentado eludir ese bloqueo.
- La suite completa todavía **no se ha repetido** para este segundo bloque.

### Orden de continuación

1. Reanudar la prueba multijugador en navegador cuando pueda completarse la
   revisión de permisos; corregir lo que detecte.
2. Revisar los cambios tardíos de vista/cuenta, pausa de consultas al ocultar la
   página y recuperación al volver desde el historial del navegador.
3. Ejecutar la suite completa, abrir la PR y comprobar CI.
4. Fusionar y publicar con la autorización existente; verificar el portal.
5. Siguiente bloque funcional: revisión visual de los recorridos académicos
   largos (curso, evaluación y diploma).

Este segundo bloque se conserva como trabajo pendiente. No está fusionado ni
publicado y no debe describirse como validado en navegador.

## Punto de partida verificado

`main` en `c87904eccff24b683f1065686c6cdd60465b4c65` (#213).
Añadir preguntas (#210), grupos (#211), patrocinadores (#212) e interfaz (#213)
ya estaban integrados. El pendiente inmediato era el recorrido real de Test en
Vivo con varias sesiones. No retomar las implementaciones antiguas #196/#202.

## Bloque completado: recuperación y podio de Test en Vivo

- Al recargar, la pestaña recupera su participante mediante consulta al servidor.
  Conserva la respuesta registrada, la puntuación y el podio final sin volver a
  unirse ni duplicar asistentes. Solo guarda los datos de acceso de esa pestaña;
  preguntas y resultados se obtienen de nuevo del servidor.
- Si se pierde la confirmación HTTP de una respuesta aceptada, la consulta
  siguiente actualiza la pantalla a «Respuesta enviada» y bloquea las opciones.
- Al regresar desde el historial del navegador se reactiva el reloj.
- Se corrige el podio vacío cuando la última pregunta se cierra por tiempo:
  finalizar conserva el cierre y permite mostrar clasificación y posición.
  También se interpreta correctamente el cierre de sesiones ya finalizadas.

## Verificación

- `npm run check:app`: suite completa correcta, incluida regresión de cierre por
  tiempo, recuperación de pestaña, confirmación perdida y almacenamiento no disponible.
- `scripts/check-portal-ui.mjs`: Chromium real, acceso y navegación en ordenador
  y móvil, administrador/socio, modo socio y patrocinadores, sin errores.
- `scripts/check-live-multiplayer-ui.mjs`: administrador y tres participantes
  (dos socios con sesión y un invitado externo) en contextos de navegador separados.
  Alta de sala desde la interfaz, entrada desde el portal del socio, inicio,
  preguntas sincronizadas, respuesta con fallo de red y reintento, recarga,
  reconexión tras avanzar el administrador, aciertos/fallos, puntuación,
  clasificación, cierre natural por tiempo, podio y recuperación del podio.
- Vistas de 1440, 390 y 320 px; capturas revisadas, sin desbordamiento horizontal
  ni excepciones JavaScript durante el recorrido.
- Todas las partidas y cuentas de prueba usan un servidor temporal con datos
  sintéticos. No se crean partidas ni se modifican socios en producción.

El check de navegador es opcional y acepta `IZ_PLAYWRIGHT_MODULE`,
`IZ_CHROMIUM_EXECUTABLE` e `IZ_UI_SCREENSHOTS`; no añade dependencias al servidor.

## Alcance y continuidad

La recuperación es de la misma pestaña, depende de sessionStorage y de que el
servidor siga conservando la sala. Con almacenamiento bloqueado se mantiene el
flujo de entrada manual. No se cambia la evaluación académica ni los diplomas.

Pendientes para un siguiente bloque: identidad de invitados con nombres
coincidentes (la entrada actual reutiliza el participante por nombre),
actualización automática del panel del anfitrión y revisión visual de los
recorridos académicos largos. La prueba multijugador usa nombres distintos.

La publicación sigue la autorización recuperada de la conversación del 28 de
septiembre. Consultar la PR de esta rama y los checks/despliegues asociados para
confirmar el estado de publicación; este documento registra el árbol validado.
