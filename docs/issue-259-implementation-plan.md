# Issue #259 — plan de implementación y QA

Estado de partida: `main` tras integrar #247/#258 (`44bc5e4`). Este documento no cambia producción ni datos reales.

## Hallazgos confirmados

1. `storage.js` mantiene `app_state`, `campus.db`, `state.json`, backups y uploads bajo `IZ_DATA_DIR`; si falta, usa `/data`.
2. `assertProductionStorageIsConfigured()` permite arrancar producción cuando existe `DATABASE_URL`, aunque `IZ_DATA_DIR` esté vacío. PostgreSQL no sustituye `app_state`, por lo que esta condición no demuestra persistencia del SQLite/adjuntos.
3. Ya existe `scripts/check-campus-groups.mjs` y cubre una base importante: permisos, borradores sin base64 en sessionStorage, conservación de bytes pendientes al cambiar de subgrupo, error de red conservando borrador, rechazo de payload incompleto, aislamiento por cuenta, protección frente a `/api/state` obsoleto y persistencia tras reinicio cuando `IZ_DATA_DIR` apunta a un directorio persistente.
4. El hueco UX sigue siendo que seleccionar un archivo lo deja preparado en memoria/estado local y la persistencia real depende de `Guardar grupo interno`; abandonar/recargar antes de guardar puede perder los bytes pendientes.

## Cambio mínimo recomendado

### A. Guardia de almacenamiento en producción

En `storage.js`, `DATABASE_URL` no debe satisfacer por sí sola la precondición de persistencia del `app_state`.

Comportamiento esperado:
- fuera de producción: sin cambio;
- producción + `IZ_DATA_DIR` configurado: arranque permitido;
- producción sin `IZ_DATA_DIR`: arranque bloqueado aunque exista `DATABASE_URL`;
- excepción únicamente con `IZ_ALLOW_EPHEMERAL_STORAGE_IN_PRODUCTION=true`, mostrando warning explícito de que SQLite, snapshots, backups y uploads pueden perderse;
- mensaje de error debe pedir `IZ_DATA_DIR` apuntando a un Volume persistente, no `DATABASE_URL o IZ_DATA_DIR`.

Añadir regresión aislada que lance un proceso Node con combinaciones de variables y verifique los casos anteriores sin tocar producción.

### B. Adjuntos de Grupos internos

Objetivo V1: al terminar de leer/preparar correctamente un archivo, persistir el grupo automáticamente mediante el endpoint específico `PUT /api/campus-groups/:id`, reutilizando `saveCampusGroupAndRender` y sus protecciones de revisión/concurrencia.

Reglas:
- no enviar mientras `campusGroupPendingUploads > 0`;
- no declarar éxito definitivo antes del `PUT` 200;
- si el PUT falla, conservar el borrador y los bytes en memoria para reintento; mostrar error accionable;
- no meter base64 en `sessionStorage`;
- si existe otra lectura de archivo en curso, esperar a que finalice antes de persistir;
- dos selecciones consecutivas no deben hacer que una respuesta tardía reemplace la otra;
- cambiar de subgrupo no debe mover el archivo a otro destino;
- una pestaña obsoleta debe recibir conflicto y conservar el borrador para reconciliación;
- una respuesta de una sesión/cuenta anterior no puede mutar la vista nueva.

Si el autosave resulta demasiado invasivo para la arquitectura actual, alternativa aceptable solo como fallback: estado visual inequívoco `Archivo pendiente de guardar`, CTA `Guardar ahora` y warning `beforeunload`/navegación mientras existan bytes no persistidos. No dejar el estado actual ambiguo.

### C. Tests que deben quedar verdes

Extender `scripts/check-campus-groups.mjs` para cubrir:
- selección de archivo -> PUT automático -> recarga -> archivo presente;
- dos archivos consecutivos persisten ambos;
- fallo de red conserva draft/bytes y no muestra éxito definitivo;
- navegación/recarga con pendiente no puede ser silenciosa;
- posterior edición de metadatos no elimina adjuntos;
- `/api/state` obsoleto no elimina biblioteca;
- no base64 en sessionStorage;
- reinicio con `IZ_DATA_DIR` conserva adjunto.

Añadir check específico de guardia de producción y engancharlo a `check:app` o al agregador de checks existente.

## QA de infraestructura pendiente — requiere acceso Railway/autorización

Antes de cerrar #259 comprobar en producción:
- `IZ_DATA_DIR` no vacío;
- ruta dentro del Volume real (esperada `/data/isocrona-zero` o la configurada);
- `/api/debug/storage` autenticado: `dbPath`, snapshot y `backupDir` dentro del Volume;
- escritura válida;
- adjunto sintético controlado sobrevive a restart/redeploy.

No hacer esta prueba destructiva ni reiniciar producción sin autorización de Carlos.

## Prioridad

Si Railway no tiene Volume persistente, #259 es P1 y debe resolverse antes de nuevas cargas reales/piloto de socios. Si el Volume está correctamente montado, la corrección de guardia + UX puede desarrollarse en paralelo, y el siguiente bloque funcional sigue siendo #245 -> #248.
