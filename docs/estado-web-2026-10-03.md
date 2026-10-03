# Estado del portal — 3 de octubre de 2026

Repositorio: `isocronazero-svg/isocrona-zero-campus-app`.
Portal: https://portal.isocronazero.org.

## Continuación móvil y portátil: PR #216 preparada

La PR #217 de avisos está fusionada y publicada en el portal, con CI y Railway
correctos y comprobación de los archivos servidos. Esta continuación integra ese
estado (`661a6d2`) en la rama del portátil `codex/fix-member-campus-access`,
conservando su trabajo y resolviendo el conflicto de avisos.

### Cambios de la PR #216 revisados

- Campus aparece en el menú de socio con Cursos, Avisos y Grupos internos. Las
  cuentas externas conservan sus restricciones. El menú móvil se cierra al entrar.
- El administrador puede aprender e inscribirse con su propia cuenta, sin crear
  una ficha de socio ni saltarse fechas de inscripción o aforo.
- La vista previa de otra persona usa sus permisos, ficha y accesos a grupos;
  no hereda los del administrador.
- La inscripción conserva método de pago, nota y justificante. Si falla el envío,
  mantiene el formulario y permite reintentarlo.
- Se conservan los adjuntos protegidos y el botón para compartir avisos en WhatsApp
  de la entrega publicada. El envío a WhatsApp sigue requiriendo confirmación allí.

### Comprobaciones y siguiente paso

- `npm run check:app`: correcto, incluidas pruebas de avisos, navegación, permisos,
  inscripción propia, cursos cerrados/futuros y lista de espera por aforo.
- `scripts/check-campus-access-ui.mjs`: Chromium a 1440 y 390 píxeles; inscripción
  con PDF, fallo de red y recuperación, acceso a grupos, restricciones externas,
  avisos y menú móvil. Sin errores de JavaScript ni desbordamiento horizontal móvil.
  Incluye `scripts/smoke-campus-test.mjs` con servidor y datos temporales.
- Actualización de la misma PR #216 para mantener coordinadas ambas sesiones.
  Sus comprobaciones remotas y el commit final quedan enlazados en la PR.
- **Pendiente de confirmación para fusionar y publicar #216:** su descripción del
  portátil incluye «No hacer merge automatico». Esta continuación deja el cambio
  probado y revisable; todavía no lo considera publicado.

## Nueva entrega: avisos con adjuntos y compartir en WhatsApp

Solicitud confirmada desde el móvil el 3 de octubre. Rama: `codex/notice-attachments-whatsapp`.

### Cambios incluidos

- Administración puede publicar desde **Campus > Avisos** y desde el gestor de novedades.
  Los socios tienen un acceso **Avisos** en Mi perfil. Los avisos internos a socios también admiten adjuntos.
- Hasta cinco archivos por aviso: PDF, Word (DOC/DOCX), PNG, JPG, WebP y GIF.
  Límite de 5 MB por archivo y 10 MB por aviso; tipo y contenido se validan en el servidor.
- Imágenes visibles, documentos descargables y enlace individual al aviso. El inicio de
  sesión conserva el enlace y devuelve al aviso. Los archivos respetan destinatarios,
  curso, visibilidad y caducidad; no se convierten en archivos públicos.
- **Compartir en WhatsApp** prepara título y enlace. El administrador elige el grupo y
  confirma el envío en WhatsApp. No hay envío automático a la comunidad. Los avisos
  dirigidos a una sola persona no ofrecen el botón de difusión.
- Reintentar una publicación cuya respuesta se haya perdido no duplica avisos ni correos.
  El formulario y los archivos se conservan al fallar el envío. Los guardados de una
  sesión antigua no borran avisos nuevos, adjuntos, lecturas ni correos de los avisos.
- Corregido el filtrado de novedades para socios y externos en el estado enviado por el
  servidor, incluido «Socios activos». Corregidas referencias de cursos inexistentes en
  el código de avisos que impedían renderizar algunos contenidos.

### Validación y coordinación

- `npm run check:app`: suite completa superada, con el nuevo
  `scripts/check-notice-attachments.mjs` (audiencias, permisos, archivos, reintentos,
  ocultación/eliminación y conservación ante guardados de otra sesión).
- Chromium: publicación con archivos, pérdida de confirmación y reintento, retorno tras
  iniciar sesión, descarga, texto escapado y enlace WhatsApp. Pantallas de 320, 390 y
  1440 píxeles. Solo datos sintéticos; no se enviaron mensajes ni correos reales.
- La PR #215 está publicada y verificada en el portal. Se ha localizado la nueva
  **PR #216 del portátil**, sobre navegación Campus e inscripción del administrador.
  Esta entrega no fusiona ni modifica esa rama. Ambas tocan archivos compartidos;
  al integrar #216 hay que conservar las mejoras de avisos y su corrección de cursos.
- La publicación y sus comprobaciones de CI/Railway quedan registradas en la PR de
  `codex/notice-attachments-whatsapp`. La automatización completa de WhatsApp continúa
  pendiente de elegir y validar una integración compatible con la comunidad.

## Continuación: identidades y panel del administrador

Esta sección recoge la entrega anterior; las anotaciones de bloqueo de
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
