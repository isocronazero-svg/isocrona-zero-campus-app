# Estado del portal — 9 de octubre de 2026

Repositorio: `isocronazero-svg/isocrona-zero-campus-app`.
Portal: `https://portal.isocronazero.org`.

Este documento es la referencia operativa actual para continuar el trabajo desde cualquier chat/dispositivo. Antes de iniciar una tarea nueva hay que leer esta bitácora y revisar commits/PR posteriores.

## 1. Estado general

La V1 funcional está prácticamente cerrada en código.

Último bloque funcional integrado y revisado: `94804766fe4e57538318821536fdfd31a1ce7cf6` (#230, backup/recovery).

Después se añadieron commits documentales de continuidad/QA. App checks #307 sobre `320ddf1041e04cf373fef44166a4dc897404b8ff`: `success`.

La prioridad ya no es añadir funciones. La prioridad es cerrar #231 si se decide usar la migración de socios, ejecutar #227, corregir solo regresiones demostradas y congelar V1.

## 2. Bloques V1 ya terminados

### Cursos e inscripción
#224 fusionada. CTA único, formulario directo, estados claros, vista de alumno simplificada, protección frente a doble envío y reintento de justificante sin perder archivo/nota.

### Test en Vivo
#225 completada mediante PR #228. Issue #225 cerrada administrativamente el 09/10.

Comportamiento actual:
- tocar una opción guarda directamente;
- rectificación mientras la pregunta esté abierta;
- última respuesta válida sustituye a la anterior;
- sin doble puntuación;
- cierre automático cuando responden todos;
- cierre por tiempo si faltan respuestas;
- sin solución/puntos/ranking antes del cierre;
- reveal con corrección, distribución y clasificación;
- salas nuevas UI: autoavance ~6 s a siguiente pregunta/podio;
- salas legacy/API sin `autoAdvance`: avance manual.

### Test normal — Modo Aprendizaje
#226 completada mediante PR #229. Issue #226 cerrada administrativamente el 09/10.

Resultado:
- selector Examen / Aprendizaje;
- Examen por defecto;
- corrección pregunta a pregunta;
- respuesta corregida bloqueada;
- feedback + explicación;
- sin `correctIndex`/explicación en payload inicial;
- marcado para repasar;
- resultado final integrado en historial/estadísticas/falladas.

Riesgo residual aceptado: el intento en curso no se recupera tras recargar antes de finalizar.

### Diplomas
#223 fusionada: A4 horizontal anverso/reverso, contraste corregido, temario real, anexos cuando no cabe, preview/PDF alineados. Diplomas emitidos protegidos por #155.

### Backup y recuperación
#230 fusionada: export admin `no-store`, restauración aislada verificada, uploads externos comprobados y `docs/BACKUP-RECOVERY.md`.

Importante: una copia en el mismo volumen no sustituye una copia externa recuperable.

## 3. Única issue V1 abierta: #227

`V1 · QA final, regresiones y congelación de producto`.

Precondiciones funcionales cumplidas. Usar `docs/v1-qa-checklist.md`.

### Cobertura automática ya confirmada

`npm run check:app` cubre, entre otros:
- backup/recovery;
- diplomas y diplomas emitidos;
- certificado acumulado;
- instructor/live, flujo live, lobby y UI host;
- modo Aprendizaje;
- Test Zone;
- navegación;
- render socio/cursos;
- avisos/adjuntos;
- banners;
- auth/remember-me;
- state transport/permisos;
- hardening/rate limits/payload limits;
- pagos/actualización de socios;
- curso académico/journey;
- recuperación de formularios.

App checks #307 de `main`: verde.

### QA manual restante — no repetir lo que ya cubre CI

El QA manual/productivo debe concentrarse en:
1. login/logout real, admin ↔ Modo Socio y permisos visibles;
2. responsive real ~390 / 768 / 1440 px, overflow, foco y navegación;
3. curso de prueba: inscripción, espera y reintento de justificante sin duplicado;
4. diploma de prueba: vista/PDF anverso-reverso y legibilidad;
5. Test normal Examen + Aprendizaje en navegador real;
6. Test en Vivo con anfitrión + al menos 2 participantes/dispositivos: rectificación, cierre al último y autoavance ~6 s;
7. aviso con adjunto y compartir por WhatsApp según flujo actual;
8. copia externa/ensayo de recuperación antes de migración real.

Esta separación quedó registrada también como comentario en #227 el 09/10.

Regla: CI verde no basta para cerrar #227. Falta pasada manual/productiva. No añadir funciones durante el QA.

## 4. PR #231 — migración segura del Excel de socios

PR: `Protect member workbook imports from silent data loss`.

Estado revisado 09/10:
- abierta;
- `mergeable: true`;
- 4 archivos modificados;
- 1 commit (`23b41b3...`);
- CI de rama verde antes de auditoría;
- sin datos reales ni producción modificada.

Objetivo:
- conservar datos existentes;
- completar solo huecos tras revisión;
- bloquear discrepancias no vacías;
- distinguir vacío de 0;
- detectar números duplicados/identidades ambiguas;
- selección individual de filas `review`;
- `previewToken` contra cambios de Excel/censo;
- sin automatizaciones durante commit;
- sin sincronizar cuentas vinculadas;
- sin persistir desde `catch`.

### Auditoría manual 09/10

Revisados:
- `public/app.js`;
- `server.js`;
- `scripts/check-associate-workbook-import.mjs`;
- `scripts/check-app.mjs`.

Conclusión actual: no se ha identificado otro P1/P2 dentro del alcance revisado además del P2 ya abierto sobre identificadores de fila. Ese P2 sigue bloqueando merge.

### P2 bloqueante — identificador de fila usado como autorización

`sourceRow` depende del atributo opcional XLSX `row@r`. Si falta, varias filas pueden terminar con `sourceRow = 0`.

Hoy `sourceRow` se reutiliza como valor de checkbox, payload de aprobación, validación backend y decisión final de importación. Riesgo: aprobar una fila `0` podría aprobar varias.

Corrección cerrada:
1. `sourceRow` solo para trazabilidad/visualización.
2. Crear `previewRowId` único y estable por fila.
3. Usarlo en checkbox/API/aprobaciones.
4. Backend rechaza IDs desconocidos y duplicados.
5. Fixture XLSX sin `row@r` que demuestre aislamiento entre filas.
6. Repetir `check-associate-workbook-import`, `check:app` y smoke.
7. Resolver hilo P2 solo con tests verdes.

No fusionar #231 antes de esto.

### Matriz QA de migración preparada

`docs/member-import-qa.md` creada el 09/10 y enlazada dentro de #231.

Cubre:
- auth/401/403/no-store;
- `previewRowId` y XLSX sin `row@r`;
- `previewToken` y preview obsoleto;
- preservación de fichas;
- altas/numeración;
- duplicados/identidad ambigua;
- cuotas/pagos 2024-2027 + años externos;
- estados/bajas/observaciones;
- UI de preview;
- persistencia/efectos laterales;
- variantes parser XLSX;
- backup y condición de migración real.

El agente que corrija #231 debe reutilizar esa matriz, no rediseñar las pruebas.

### Decisiones de negocio pendientes antes de datos reales

Revisar con secretario:
- estados/bajas;
- discrepancias Excel ↔ portal;
- prioridad de número de socio;
- cuotas 2024-2027;
- observaciones heredadas;
- altas nuevas;
- campos de cuentas vinculadas.

Criterio recomendado: un dato no vacío del portal no se reemplaza automáticamente por el Excel.

## 5. Backlog no bloqueador de V1

### Railway / IVASPE
- #134 importar preguntas en producción si sigue haciendo falta.
- #136 automatización Railway.
- PR #161 known_hosts: antigua/desfasada; no tocar sin necesidad real.

### Contenido
- #111 ampliar banco.
- #112 continuar bloques IVASPE.

Hay 175 preguntas en siete CSV de 25 y pipeline preparado. No bloquea V1.

### Deuda técnica
- #109 refactor backend incremental: V2, no mezclar con #227/#231.

## 6. Trabajo adelantado sin créditos el 09/10

Completado:
1. auditoría completa del diff #231;
2. especificación exacta del P2;
3. review/comentario de continuidad dentro de #231;
4. cierre administrativo #225 y #226;
5. creación `docs/member-import-qa.md`;
6. enlace de esa matriz en #231;
7. separación QA automático vs manual en #227;
8. confirmación App checks #307 verde;
9. actualización de esta bitácora.

Siguiente trabajo sin créditos posible:
- preparar reglas reales de migración con secretario;
- preparar copia externa/ensayo de restauración;
- ejecutar QA manual de #227;
- comprobar si #134/#136 siguen siendo necesarios.

## 7. Próximo uso recomendado de créditos

No gastar en #224, #225/#228 ni #226/#229.

Orden:
1. corregir P2 de #231 si migración prioritaria;
2. ejecutar #227 y corregir solo regresiones;
3. copia/ensayo + migración real solo con autorización explícita;
4. después Railway/IVASPE/V2.

Estimación si no aparecen regresiones serias:
- #231: ~5–15 créditos;
- #227: ~5–15 créditos.

Reserva objetivo: ~10–30 créditos.

## 8. Norma de continuidad móvil / escritorio

GitHub + esta bitácora mandan.

Al comenzar:
1. leer este documento;
2. revisar commits/PR posteriores;
3. respetar decisiones registradas;
4. no crear plan paralelo.

Al terminar una sesión que cambie estado/plan:
1. actualizar bitácora;
2. indicar qué se hizo;
3. indicar qué NO hacer todavía;
4. dejar siguiente paso.

No fusionar #231 con P2 abierto. No iniciar funciones nuevas hasta cerrar #227.