# Auditoría técnica del campus — 20 de septiembre de 2026

_Actualizada el 21 de septiembre de 2026._

## Situación consolidada

- Portal operativo: `https://portal.isocronazero.org`.
- Servicio activo en Railway: `zealous-warmth / isocrona-zero-campus-test`.
- Persistencia montada en `/var/data/isocrona-zero`.
- Censo importado: 149 socios.
- Socios activos tras la migración: 80.
- Registros en revisión documental: 69.
- Duplicados o filas bloqueadas durante la importación: 0.

## Cambios publicados

| PR | Cambio | Resultado |
|---|---|---|
| #167 | Recuperación segura de la vista tras limpiar/importar datos | Evita `views[state.activeView] is not a function` |
| #168 | Listado de socios adaptable a pantallas estrechas | Acciones y columnas utilizables en portátil y móvil |
| #169 | Paginación de la revisión legacy | Permite recorrer todas las fichas pendientes |
| #170 | Guardado específico de fichas de socio | Evita enviar el campus completo y elimina el timeout principal |
| #171 | Lectura segura de respuestas HTTP | Evita fallos silenciosos en validación, inscripciones y mantenimiento |
| #172 | Escrituras atómicas y copias espaciadas | Reduce carga y evita snapshots parciales |
| #173 | Filtros de revisión legacy | Separa incidencias por teléfono, DNI, servicio, acceso y cierre |
| #174 | Conservación del formulario cuando falla el guardado | Los datos escritos no se pierden y se puede reintentar |
| #175 | Recuperación de la cola de guardado | Un fallo anterior ya no bloquea los guardados posteriores |
| #176 | Auditoría técnica consolidada | Deja inventario de estado, riesgos y próximos pasos |
| #177 | Corrección de función JavaScript duplicada | Recupera la carga completa del portal y del menú lateral |
| #178 | Validación de sintaxis antes del arranque | Bloquea un despliegue nuevo si el frontend contiene JavaScript inválido |
| #179 | Prueba del guardado de fichas | Verifica permisos, persistencia, duplicados, email y fichas inexistentes |

## Protección de datos

- SQLite continúa siendo la fuente principal.
- `state.json` se escribe de forma atómica.
- Las copias automáticas completas se generan como máximo una vez cada cinco minutos.
- Se conservan hasta 30 copias automáticas.
- El intervalo puede ajustarse con `IZ_AUTOMATIC_BACKUP_INTERVAL_MS`.
- Las operaciones realizadas durante esta auditoría no borraron ni modificaron socios reales.

## Validaciones ejecutadas

- `npm run check:frontend-syntax`
- `npm run check:app`
- Comprobaciones de autenticación y endurecimiento de seguridad.
- Comprobaciones de almacenamiento en producción.
- Límites de carga y rate limiting.
- Preservación de diplomas emitidos.
- Flujos de avisos y notificaciones.
- Zona de tests y bancos IVASPE.
- Confirmación de despliegue de Railway para el servicio utilizado por el portal.
- Recarga del portal público después de los despliegues #178 y #179, sin errores propios de la aplicación.
- Prueba aislada del endpoint `PATCH /api/associates/:id`, ejecutada con éxito sobre datos temporales.

## Uso recomendado tras la auditoría

1. Entrar en modo **Administrador**.
2. Abrir **Socios y cuotas → Legacy**.
3. Filtrar por tipo de incidencia.
4. Abrir una ficha, corregirla y pulsar **Guardar ficha de socio**.
5. Cerrar la revisión solamente cuando los datos mínimos sean correctos.
6. Descargar periódicamente una copia manual desde **Informes y validación → Almacenamiento**.

## Riesgos y trabajo pendiente

1. El guardado general del campus todavía transporta un estado amplio para algunos módulos antiguos. Conviene migrarlos gradualmente a endpoints específicos.
2. Las automatizaciones configuradas para ejecutarse al guardar pueden aumentar el tiempo de algunas operaciones generales.
3. Debe comprobarse manualmente un guardado real de ficha con sesión administrativa después de cada cambio importante de infraestructura.
4. El segundo proyecto de Railway (`outstanding-wholeness`) presenta despliegues fallidos o pendientes y no debe confundirse con el servicio productivo actual.
5. `public/app.js` sigue siendo un archivo muy grande; conviene dividirlo gradualmente por módulos para reducir el radio de impacto de cada cambio.

## Criterio para siguientes iteraciones

Priorizar cambios pequeños, reversibles y verificables. No realizar limpiezas masivas, cierres automáticos de revisión ni modificaciones del censo sin una copia descargada y una validación administrativa.
