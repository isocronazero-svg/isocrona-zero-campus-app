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

#224 está fusionada.

Resultado:
- un único CTA principal de inscripción;
- formulario directo;
- estados claros de inscrito / pendiente / espera;
- vista de alumno simplificada;
- protección frente a doble envío;
- justificante y nota permanecen disponibles para reintentar cuando hay un error.

La observación P2 que existía antes del merge quedó corregida.

### Test en Vivo

#225 está completada mediante PR #228 y la issue #225 se cerró administrativamente el 09/10.

Comportamiento actual:
- tocar una opción guarda directamente;
- puede rectificarse mientras la pregunta esté abierta;
- la última respuesta sustituye a la anterior;
- no se duplica puntuación;
- cierre automático cuando responden todos los participantes activos;
- cierre por tiempo si faltan respuestas;
- solución/puntos/ranking ocultos antes del cierre;
- tras revelar se muestra corrección, distribución agregada y clasificación;
- salas nuevas creadas desde UI avanzan automáticamente tras aproximadamente 6 s a la siguiente pregunta o al podio;
- salas antiguas/API sin `autoAdvance` conservan avance manual.

### Test normal — Modo Aprendizaje

#226 está completada mediante PR #229 y la issue #226 se cerró administrativamente el 09/10.

Resultado:
- selector Examen / Aprendizaje;
- Examen continúa como modo por defecto;
- Aprendizaje corrige pregunta a pregunta;
- una respuesta ya corregida queda bloqueada;
- feedback correcta/incorrecta y explicación cuando existe;
- no se expone `correctIndex` ni explicación en el banco inicial del socio;
- marcado para repasar disponible;
- resultado final único alimenta historial, estadísticas y falladas.

Riesgo residual aceptado: un intento de aprendizaje en curso vive en memoria de la página; recargar antes de terminar no recupera el borrador. Resultados terminados y marcas sí persisten.

### Diplomas

#223 está fusionada:
- PDF A4 horizontal anverso/reverso;
- contraste corregido;
- temario real, sin inventar contenido;
- anexos cuando no cabe;
- vista previa y PDF alineados.

Los diplomas emitidos siguen protegidos frente a recalculados por el trabajo previo #155.

### Backup y recuperación

#230 está fusionada:
- export admin con `Cache-Control: no-store`;
- prueba de restauración aislada;
- verificación de usuarios/hash, cursos, documentos, justificantes, diplomas, historial y marcas;
- recuperación de uploads externos comprobada;
- procedimiento `docs/BACKUP-RECOVERY.md`.

Importante: un backup automático en el mismo volumen no sustituye una copia externa recuperable. Antes de una migración real debe existir copia externa y ensayo de restauración.

## 3. Única issue V1 abierta: #227

`V1 · QA final, regresiones y congelación de producto`.

Las precondiciones funcionales ya están cumplidas. Usar `docs/v1-qa-checklist.md` como matriz obligatoria.

Debe validarse como mínimo:
- autenticación/permisos;
- admin y Modo Socio;
- cursos/inscripción/justificante/espera/aula;
- diplomas/PDF/verificación pública;
- Test normal Examen y Aprendizaje;
- falladas/marcadas/revisión/historial/estadísticas;
- Test en Vivo completo con rectificación, cierre automático y autoavance de 6 s;
- avisos/adjuntos/WhatsApp según implementación actual;
- responsive aproximado 390 / 768 / 1440 px;
- backup/recuperación antes de migraciones reales;
- todos los checks vigentes.

Regla de #227: no añadir funcionalidades. Solo corregir regresiones reproducibles y documentar riesgos residuales.

## 4. PR #231 — migración segura del Excel de socios

PR: `Protect member workbook imports from silent data loss`.

Estado revisado el 09/10:
- abierta;
- `mergeable: true`;
- 4 archivos modificados;
- 1 commit de implementación (`23b41b3...`);
- CI de la rama estaba verde antes de la auditoría;
- no se han importado datos reales ni tocado producción.

Objetivo correcto de la PR:
- conservar información ya existente;
- solo completar huecos tras revisión;
- no sobrescribir silenciosamente discrepancias;
- distinguir cuota vacía de cuota 0;
- detectar números duplicados/identidades ambiguas;
- exigir selección individual de filas `review`;
- usar `previewToken` para obligar a reanalizar si cambia Excel/censo;
- no ejecutar automatizaciones durante el commit;
- no sincronizar cuentas vinculadas durante la migración;
- no persistir desde el `catch`.

### Auditoría manual 09/10

Se revisaron los cuatro archivos modificados:
- `public/app.js`;
- `server.js`;
- `scripts/check-associate-workbook-import.mjs`;
- `scripts/check-app.mjs`.

Conclusión actual: no se ha identificado otro bloqueo P1/P2 dentro del alcance revisado además del P2 ya abierto sobre identificadores de filas. No significa que la PR esté autorizada para merge: ese P2 sigue siendo bloqueante.

### P2 bloqueante — identificador de fila usado como autorización

El parser obtiene `sourceRow` desde el atributo opcional `row@r`. Un XLSX válido puede omitirlo; en ese caso varias filas reciben `sourceRow = 0`.

Actualmente `sourceRow` se reutiliza para:
- valor del checkbox de aprobación;
- `approvedReviewRows` enviado por frontend;
- validación en backend;
- decisión final de si una fila `review` se importa.

Riesgo: aprobar una fila con ID `0` podría autorizar varias filas que el administrador no marcó.

Corrección cerrada y registrada también como review en #231:
1. `sourceRow` debe quedar solo para visualización/trazabilidad.
2. Generar un `previewRowId` (o equivalente) único y estable por fila durante el preview.
3. Usar ese ID en checkbox, API y selección aprobada.
4. Backend debe rechazar IDs desconocidos y duplicados.
5. Añadir fixture XLSX que omita `row@r` y demuestre que aprobar una fila no aprueba otra.
6. Repetir:
   - `node scripts/check-associate-workbook-import.mjs`;
   - `npm run check:app`;
   - `npm run smoke:campus-test`.
7. Resolver el hilo P2 solo después de tests verdes.

No fusionar #231 antes de esto.

### Matriz de QA de migración preparada

Se añadió `docs/member-import-qa.md` el 09/10 y se enlazó dentro de la PR #231.

La matriz deja cerrados antes de gastar créditos los casos que deberán cubrirse:
- auth/403/401 y `no-store`;
- `previewRowId` y XLSX sin `row@r`;
- `previewToken` y estado obsoleto;
- preservación de fichas existentes;
- altas nuevas y numeración;
- identidades duplicadas/ambiguas;
- cuotas/pagos 2024-2027 y años externos;
- estados/bajas/observaciones;
- UI de preview;
- persistencia y efectos laterales;
- variantes del parser XLSX;
- backup externo y condición de salida.

El agente que corrija #231 debe reutilizar esta matriz, no rediseñar la estrategia de pruebas.

### Decisiones de negocio pendientes antes de importar datos reales

Aunque el código quede verde, revisar con el secretario antes de migrar:
- qué estados/bajas deben conservarse exactamente;
- qué hacer cuando Excel y portal discrepan;
- prioridad de número de socio;
- tratamiento de cuotas 2024-2027;
- observaciones heredadas;
- altas nuevas;
- campos de cuentas ya vinculadas.

Criterio recomendado: un dato no vacío ya existente en el portal no debe ser reemplazado automáticamente por el Excel.

## 5. Backlog no bloqueador de V1

### Railway / IVASPE
- #134: importar preguntas IVASPE en producción si todavía fuera necesario.
- #136: automatización de importación IVASPE en Railway.
- PR #161: known_hosts para Railway SSH; antigua/desfasada. No tocar sin comprobar necesidad real.

### Contenido
- #111: ampliar banco de preguntas.
- #112: continuar bloques IVASPE.

El repositorio dispone de 175 preguntas en siete CSV de 25 y pipeline de validación/importación preparado. El contenido adicional no bloquea V1.

### Deuda técnica
- #109: refactor backend incremental.

Mantener para V2. No mezclar con #227 ni #231 salvo necesidad real demostrada.

## 6. Trabajo adelantado sin créditos de agente el 09/10

Completado:
1. auditoría manual completa del diff de #231;
2. especificación exacta del P2 de identificadores de fila;
3. comentario/review de continuidad dentro de #231;
4. cierre administrativo de issues #225 y #226;
5. creación de `docs/member-import-qa.md`;
6. enlace de esa matriz dentro de #231;
7. actualización de esta bitácora;
8. confirmación de App checks #307 en verde.

Siguiente trabajo sin créditos posible:
- preparar/revisar reglas reales de migración con el secretario;
- preparar copia externa y ensayo de restauración;
- ejecutar QA manual de #227;
- comprobar si #134/#136 siguen siendo necesarios antes de gastar créditos.

## 7. Próximo uso recomendado de créditos

No gastar créditos en #224, #225/#228 ni #226/#229: están terminados.

Orden recomendado:
1. corregir el P2 de #231 si la migración de socios sigue siendo prioritaria;
2. ejecutar #227 y corregir solo regresiones;
3. realizar copia/ensayo y migración real únicamente con autorización explícita;
4. después decidir Railway/IVASPE y V2.

Estimación orientativa restante si no aparecen regresiones serias:
- #231: aproximadamente 5–15 créditos;
- #227: aproximadamente 5–15 créditos.

Objetivo de reserva: aproximadamente 10–30 créditos, sensiblemente por debajo de la previsión antigua de 45–60.

## 8. Norma de continuidad móvil / escritorio

GitHub + esta bitácora son la fuente común de verdad.

Al comenzar una sesión:
1. leer este documento;
2. revisar commits/PR posteriores;
3. respetar decisiones ya registradas;
4. no crear un plan paralelo desde otro dispositivo.

Al terminar una sesión que cambie el estado o el plan:
1. actualizar esta bitácora;
2. dejar claro qué se hizo;
3. dejar claro qué NO se debe hacer todavía;
4. indicar el siguiente paso.

No fusionar #231 con el P2 abierto. No iniciar funciones nuevas hasta cerrar #227.