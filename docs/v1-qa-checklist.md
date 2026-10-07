# V1 — Checklist final de QA

Documento operativo para ejecutar la issue #227 después de integrar #224, #225 y #226.

Regla: esta checklist valida y corrige regresiones. No autoriza nuevas funcionalidades.

## 0. Precondiciones

- [ ] `main` contiene #224.
- [ ] `main` contiene #225.
- [ ] `main` contiene #226.
- [ ] App checks de `main` en verde.
- [ ] Usar datos de QA/temporales cuando una prueba pueda modificar información.
- [ ] Anotar SHA de `main` probado.
- [ ] Abrir consola del navegador durante los flujos principales y registrar cualquier error.

## 1. Autenticación y permisos

### Invitado
- [ ] La portada/login carga sin error.
- [ ] Un invitado no puede abrir rutas/acciones privadas.
- [ ] El Test en Vivo público permite entrar solo con el flujo previsto de nombre + código.
- [ ] La verificación pública de diploma funciona sin exponer datos privados extra.

### Socio
- [ ] Login correcto.
- [ ] Logout invalida la sesión visible.
- [ ] El socio no ve acciones administrativas.
- [ ] El socio solo ve sus resultados, marcas, inscripción, progreso y documentos permitidos.
- [ ] No aparecen respuestas correctas de Test Zone antes de finalizar/revelar.

### Administrador / Modo Socio
- [ ] Admin conserva sus vistas de gestión.
- [ ] Al activar Modo Socio, opera con su identidad propia y no con la de otro socio.
- [ ] Volver a modo admin restaura las vistas administrativas.
- [ ] No hay fuga de permisos entre ambos modos.

## 2. Navegación y responsive

Probar cada bloque principal en aproximadamente 390 px, 768 px y 1440 px.

- [ ] Menú móvil abre/cierra correctamente.
- [ ] No existe overflow horizontal no intencionado.
- [ ] Botones principales son visibles y pulsables.
- [ ] Inputs/selectores no desbordan tarjetas.
- [ ] Tablas/listados tienen comportamiento usable en móvil.
- [ ] Modales/paneles mantienen acción de cerrar/volver accesible.
- [ ] No hay texto crítico solapado, truncado o fuera de pantalla.
- [ ] Foco visible y navegación básica por teclado en formularios principales.

## 3. Cursos e inscripción

### Catálogo y ficha
- [ ] Socio ve catálogo disponible sin bloques duplicados innecesarios.
- [ ] Abrir un curso muestra resumen, fechas, horas, modalidad, precio/estado y programa disponibles.
- [ ] Existe un único CTA principal de inscripción cuando procede.

### Inscripción gratuita
- [ ] `Inscribirme ahora` abre el formulario correcto.
- [ ] No aparece justificante de pago cuando el curso no lo requiere.
- [ ] Enviar una vez crea una sola solicitud.
- [ ] Doble pulsación no duplica la inscripción.
- [ ] Estado posterior es claro: inscrito / pendiente / espera según corresponda.

### Inscripción con pago
- [ ] Se muestra importe/instrucción de pago correcta.
- [ ] Se puede adjuntar justificante cuando procede.
- [ ] Si la subida falla, archivo y nota permanecen disponibles para reintentar.
- [ ] Reintentar no crea dos solicitudes.
- [ ] Tras éxito se refleja el estado correcto.

### Plazas y lista de espera
- [ ] Curso con plazas permite inscripción.
- [ ] Curso completo muestra lista de espera, no inscripción normal.
- [ ] Solicitud en espera queda identificada sin CTA duplicado.

## 4. Aula / progreso de curso

- [ ] Socio inscrito puede entrar al aula correspondiente.
- [ ] Socio no inscrito no obtiene acceso indebido.
- [ ] Progreso de contenido pertenece al socio actual.
- [ ] Recursos/documentos visibles respetan permisos.
- [ ] Recargar página conserva el estado esperado.

## 5. Diplomas

### Generación y vista
- [ ] Solo aparece diploma cuando el flujo de curso lo permite.
- [ ] Vista previa coincide visualmente con PDF.
- [ ] PDF A4 horizontal genera anverso y reverso correctamente.
- [ ] Contraste permite leer todos los textos.
- [ ] Temario real aparece completo; si no cabe, usa anexos previstos.

### Persistencia y verificación
- [ ] Diploma ya emitido sigue existiendo después de automatizaciones/recalculo de elegibilidad.
- [ ] Código público del diploma emitido continúa verificando.
- [ ] Descarga propia funciona para socio autorizado.
- [ ] Otro socio no puede descargar diploma ajeno.

## 6. Test normal — modo normal

- [ ] Crear test con filtros disponibles.
- [ ] Número de preguntas respetado dentro de las disponibles.
- [ ] Contrarreloj funciona cuando se activa.
- [ ] Corrección/penalización seleccionada se refleja en resultado.
- [ ] Durante el intento no se expone respuesta correcta ni explicación.
- [ ] Se puede navegar por la parrilla según comportamiento actual.
- [ ] Se puede marcar/desmarcar para repasar.
- [ ] Finalizar guarda resultado una sola vez.
- [ ] Revisión final muestra elegida, correcta, explicación, estado y tema/categoría.
- [ ] Falladas se actualizan.
- [ ] Marcadas persisten.
- [ ] Estadísticas e historial incorporan el resultado.
- [ ] `Realizar otro test` reinicia correctamente el flujo.

## 7. Test normal — modo aprendizaje

- [ ] Selector Normal / Aprendizaje es claro.
- [ ] Crear aprendizaje no altera el modo normal.
- [ ] Se presenta una pregunta cada vez.
- [ ] Antes de responder no existe `correctIndex`/explicación accesible en payload del participante.
- [ ] Respuesta correcta muestra feedback inmediato correcto.
- [ ] Respuesta incorrecta muestra elegida + correcta + explicación cuando exista.
- [ ] Pregunta corregida ya no permite cambiar la respuesta.
- [ ] Se puede marcar/desmarcar para repasar.
- [ ] Siguiente pregunta no hereda selección anterior.
- [ ] Última pregunta permite finalizar correctamente.
- [ ] Resultado final alimenta historial, estadísticas y falladas.
- [ ] Recarga/reintento no permite revelar soluciones ajenas ni duplicar resultado.

## 8. Preguntas falladas y marcadas

- [ ] `Preguntas falladas` solo incluye las del usuario actual.
- [ ] Crear test de falladas usa solo preguntas válidas existentes.
- [ ] `Marcadas para repasar` muestra contador coherente.
- [ ] Crear test de marcadas usa solo marcas del usuario actual.
- [ ] Desmarcar actualiza estado sin afectar a otros usuarios.
- [ ] Una pregunta repasada puede volver a falladas si vuelve a fallarse, según modelo actual.

## 9. Test en Vivo

### Crear sala y lobby
- [ ] Admin/instructor autorizado crea sesión.
- [ ] Código de acceso visible.
- [ ] Participantes pueden entrar una sola vez; refrescar/reintentar no los duplica.
- [ ] Invitado no recibe preguntas durante lobby.
- [ ] Admin ve número correcto de participantes.

### Inicio
- [ ] Solo anfitrión autorizado puede iniciar.
- [ ] Al iniciar se muestra una única pregunta activa al participante.
- [ ] Temporizador sincroniza de forma razonable con servidor.
- [ ] No se expone correcta, puntos ni leaderboard antes de cierre.

### Responder y rectificar
- [ ] Primera respuesta queda guardada.
- [ ] El participante ve cuál es su respuesta actualmente guardada.
- [ ] Mientras la pregunta siga abierta puede cambiar A→B.
- [ ] Cambiar respuesta sustituye la anterior y no crea doble puntuación.
- [ ] Reenviar la misma opción es idempotente.
- [ ] El contador `X de Y` usa participantes únicos.

### Cierre automático
- [ ] Con 2+ participantes, responder solo uno NO cierra la pregunta.
- [ ] Cuando responde el último participante activo, la pregunta se cierra/revela automáticamente.
- [ ] Tras cierre aparece respuesta correcta y clasificación provisional.
- [ ] Tras cierre ya no se acepta cambiar respuesta.
- [ ] Si no responden todos, el flujo de tiempo/cierre previsto sigue funcionando.

### Continuación y final
- [ ] Host pasa explícitamente a siguiente pregunta.
- [ ] Nueva pregunta no hereda respuestas de la anterior.
- [ ] En última pregunta, finalizar muestra podio.
- [ ] Sesión finalizada no admite nuevos participantes.
- [ ] Refrescar participante recupera posición/estado esperado sin exponer preguntas terminadas indebidamente.

## 10. Avisos y adjuntos

- [ ] Admin publica aviso de texto.
- [ ] Adjuntar imagen/documento funciona según límites actuales.
- [ ] Socio ve solo avisos que le corresponden.
- [ ] Enlace/acción de compartir por WhatsApp funciona según implementación actual.
- [ ] No considerar V1 bloqueada por automatización completa de publicación a una Comunidad de WhatsApp; esa integración queda fuera si sigue requiriendo proveedor externo.

## 11. Regresiones técnicas

Ejecutar todos los checks que formen parte de CI. Como mínimo:

```bash
npm run check:app
npm run smoke:campus-test
npm run smoke:campus-live-test
```

Y, si forman parte del repositorio/CI actual:

```bash
node scripts/check-test-zone.mjs
node scripts/check-live-multiplayer-ui.mjs
node scripts/check-member-rendering.mjs
```

- [ ] Todos los checks aplicables pasan.
- [ ] Si un comando ya no existe, documentar el sustituto real; no inventar éxito.
- [ ] No quedan errores de consola en flujos principales.
- [ ] No quedan hilos de review P1/P2 sin resolver en PRs de V1.

## 12. Cierre

Registrar:

- SHA final de `main`:
- Fecha de QA:
- App checks run:
- Producción verificada: sí / no
- Incidencias conocidas aceptadas:
- Pendientes V2:

Criterio de salida: CI verde + recorridos V1 anteriores aprobados + documentación de riesgos residuales. A partir de ese punto se congela V1.