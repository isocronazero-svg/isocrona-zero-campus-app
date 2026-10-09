# Estado del portal — 9 de octubre de 2026

Repositorio: `isocronazero-svg/isocrona-zero-campus-app`.
Portal: `https://portal.isocronazero.org`.

Este documento es la referencia operativa posterior a `docs/estado-web-2026-10-06.md`.

## 1. Estado de `main`

SHA actual revisado: `94804766fe4e57538318821536fdfd31a1ce7cf6`.

Último App checks de `main` revisado: ejecución #304, `success`.

Desde la bitácora anterior se han integrado:

- #224 `Simplify course enrollment and preserve proof uploads` → commit `edc8dab9...`.
- #228 `Allow live answer changes and automatic question progression` → commit `e54b9f18...`; cierra #225.
- #229 `Add optional learning mode to personal tests` → commit `de2b1252...`; cierra #226.
- #230 `Verify backup recovery before the member pilot` → commit `94804766...`.

Por tanto, los tres bloques funcionales que se consideraban pendientes de la V1 (#224, #225 y #226) ya están integrados en `main`.

## 2. Cursos e inscripción

#224 ya está fusionada.

Resultado:

- un único CTA principal de inscripción;
- formulario directo y estados claros;
- vista del alumno simplificada;
- doble envío protegido;
- el justificante y la nota permanecen montados tras un error para permitir reintento.

La observación P2 de la bitácora anterior quedó corregida antes del merge.

## 3. Test en Vivo

#225 quedó implementada mediante PR #228.

Comportamiento V1 actual:

- tocar una opción guarda la respuesta directamente;
- se puede rectificar mientras la pregunta esté abierta;
- la última respuesta válida sustituye a la anterior;
- no se duplica puntuación;
- cuando responden todos los participantes activos, la pregunta se cierra automáticamente;
- también se cierra al agotarse el tiempo;
- durante pregunta abierta no se expone solución, puntos ni ranking;
- al cerrar se muestra corrección, distribución agregada y clasificación;
- las salas nuevas creadas desde UI avanzan automáticamente tras 6 segundos a la siguiente pregunta o al podio final;
- salas antiguas/API sin `autoAdvance` conservan el avance manual.

Nota importante: la checklist antigua decía que el anfitrión debía pulsar `Siguiente pregunta`; esto ya no es correcto para las salas nuevas V1 y debe validarse el avance automático de 6 s.

## 4. Test normal — Modo Aprendizaje

#226 quedó implementada mediante PR #229.

Resultado:

- selector Examen / Aprendizaje;
- Examen sigue siendo el modo por defecto;
- Aprendizaje corrige pregunta por pregunta;
- respuesta corregida queda bloqueada;
- muestra correcta/incorrecta y explicación cuando existe;
- no entrega `correctIndex` ni explicación en el banco inicial del socio;
- endpoint autenticado de comprobación por pregunta con límites y `no-store`;
- conserva marcar/desmarcar para repasar;
- resultado final único alimenta historial, estadísticas y falladas;
- QA sintética realizada en móvil y escritorio en la PR.

Riesgo residual aceptado: un intento en curso sigue en memoria de la página; recargar antes de finalizar no recupera el borrador. Los resultados finalizados y las marcas sí persisten.

## 5. Backup y recuperación

PR #230 ya está fusionada.

Se añadió:

- `Cache-Control: no-store` al export completo de estado;
- prueba automática de restauración en un directorio aislado;
- comprobación de usuarios/hash, cursos, documentos, justificantes, diplomas, historial y marcas;
- control de recuperación de uploads externos;
- `docs/BACKUP-RECOVERY.md` con procedimiento operativo.

Limitación importante: los backups automáticos del mismo volumen no sustituyen una copia externa. Antes de una migración real de socios sigue siendo recomendable hacer una copia externa autorizada y un ensayo de recuperación.

## 6. V1 funcional

La V1 funcional está aproximadamente cerrada en código.

Única issue V1 todavía abierta:

- #227 `V1 · QA final, regresiones y congelación de producto`.

La precondición de #227 ya se cumple porque #224, #225/#228 y #226/#229 están integradas.

El siguiente bloque correcto NO es añadir funciones: es ejecutar la checklist final, corregir solo regresiones demostradas, verificar producción y congelar la V1.

## 7. PR abierta nueva: #231 — migración segura de socios

PR #231: `Protect member workbook imports from silent data loss`.

Estado revisado:

- abierta;
- `mergeable: true`;
- App checks #305: `success`;
- usa solo fixtures sintéticos; no ha importado el Excel real ni tocado datos productivos.

Objetivo: que la futura importación del Excel de socios no sobrescriba silenciosamente información existente y requiera selección explícita de filas dudosas.

### Bloqueo actual P2

Hay un hilo de review P2 sin resolver en `server.js`.

Problema: la aprobación de filas en estado `review` usa `sourceRow`. En un XLSX válido que omita el atributo opcional `row@r`, el parser puede asignar `sourceRow = 0` a varias filas. Aprobar una fila `0` podría aprobar todas las filas con ese mismo identificador.

Requisito antes de mergear:

- usar un identificador de preview único por fila (ordinal inferido o ID equivalente);
- rechazar identificadores duplicados;
- añadir regresión con XLSX sin `row@r`;
- repetir `check-associate-workbook-import`, `check:app` y smoke;
- resolver el hilo P2.

No fusionar #231 mientras ese P2 siga abierto.

## 8. Backlog abierto no bloqueador de V1

### Producción / Test Zone

- #134: importar preguntas IVASPE en producción Railway si todavía no están cargadas.
- #136: automatización de importación IVASPE en Railway.
- PR #161: known_hosts para Railway SSH; rama antigua/desfasada. Revisar solo si se retoma la importación remota.

### Contenido

- #111: ampliar banco de preguntas.
- #112: continuar bloques IVASPE. El repositorio contiene actualmente 175 preguntas en siete CSV de 25 preguntas, con pipeline de validación/importación preparado.

### Deuda técnica

- #109: refactor backend incremental. Mantener para V2 salvo regresión real.

## 9. Qué se puede adelantar sin gastar créditos de agente

1. Mantener esta bitácora y la checklist de QA actualizadas.
2. Auditar manualmente PR #231 y dejar cerrada la especificación del arreglo P2 antes de pedir código.
3. Preparar los casos de prueba exactos del XLSX de socios: fila normal, fila sin `row@r`, duplicados, discrepancias, cuotas vacías/cero, bajas y socios nuevos.
4. Revisar con el secretario las reglas reales de migración: estados/bajas, numeración, cuotas 2024-2027, observaciones y qué campos tienen prioridad cuando Excel y portal difieren.
5. Preparar la copia externa y el ensayo de recuperación que exige la migración real, sin tocar aún producción.
6. Ejecutar QA manual sobre el portal publicado siguiendo `docs/v1-qa-checklist.md`, anotando solo fallos reproducibles.
7. Limpiar backlog/documentación: actualizar #111/#112 con contenido real existente y mantener #109 fuera del sprint V1.
8. Comprobar si #134/#136 siguen siendo necesarios antes de gastar créditos en Railway; no asumir que producción carece de preguntas sin verificarlo.

## 10. Próximo uso recomendado de créditos

No gastarlos en #224, #225 ni #226: ya están hechos.

Prioridad de gasto cuando haya cupo:

1. corregir el P2 de #231 si la migración de socios es prioritaria;
2. ejecutar #227 y corregir únicamente regresiones detectadas;
3. solo después abordar Railway/IVASPE o nuevas funciones.

Con el estado actual, ya no hace falta reservar 45-60 créditos para cerrar las funciones V1. El consumo pendiente depende principalmente de cuántas regresiones aparezcan en #227 y de si se decide terminar #231. Si ambos salen limpios, el tramo de código restante debería ser sensiblemente menor que la estimación anterior.

## 11. Norma de continuidad

Antes de iniciar una tarea de agente:

1. leer este documento;
2. revisar commits y PR posteriores;
3. no reimplementar #224/#228/#229;
4. no mezclar QA V1 con refactor #109;
5. no fusionar #231 con el P2 de identificadores de fila abierto;
6. cualquier función nueva pasa a V2 hasta cerrar #227.
