# Estado del portal — 3 de octubre de 2026

Repositorio: `isocronazero-svg/isocrona-zero-campus-app`.
Portal: https://portal.isocronazero.org.

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
