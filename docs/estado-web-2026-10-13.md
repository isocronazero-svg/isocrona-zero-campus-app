# Estado del portal — 13 de octubre de 2026

Repositorio: `isocronazero-svg/isocrona-zero-campus-app`

Bitácora operativa vigente para continuar desde Desktop/Codex. Para historia anterior usar `docs/estado-web-2026-10-12.md` y Git.

## Estado consolidado — 14/10/2026, Europe/Madrid

### `main`
- HEAD verificado: `3b2f0efed264c0866d224a646c7dddfddf065084` (#253 / PR #255 integrada).
- #246 / PR #250 está fusionada y desplegada; jornadas intensivas funcionales. Squash funcional `e298e06caea094b22c46f3b87fad1c595de8bd30`.
- #249 / PR #251 está fusionada y desplegada. Squash `deb4188103a3a4e4cdab31960b4d59b2a05a9415`.
- No recrear ramas/patches de #244/#250/#251.
- Los commits documentales de esta bitácora pueden dejar PRs funcionales un commit por detrás; al fusionar preservar siempre la bitácora más nueva.

### Producción conocida
- Portal: `https://portal.isocronazero.org`.
- Railway activo: `zealous-warmth - isocrona-zero-campus-test` aunque el nombre interno sea confuso.
- `outstanding-wholeness - isocrona-zero-campus` es paralelo/ruidoso; no confundir ni borrar sin verificar dominio/volumen/datos.
- CI verde o smoke público no equivale a QA autenticada productiva.

## Orden vigente de lanzamiento

1. **#252 / PR #256** — terminar revisión; #253 / PR #255 ya integrada.
2. **#247** — habilitación explícita de socios instructores, trabajo posterior; NO iniciarlo en el encargo vigente.
3. **#245** — asistencia/cierre con permisos de instructor asignado.
4. **#248** — histórico/prioridad de jornadas.
5. **#227** — QA integral + QA productiva pendiente #241/#242/#249 (implementaciones terminadas).

No empezar #247/#245/#248 mientras #253/#252 sigan siendo el cuello de botella de apertura a socios.

---

# #253 / PR #255 — FUSIONADA (14/10/2026)

- Autorización expresa de Carlos en el encargo del 14 octubre. Squash real en main: `3b2f0efed264c0866d224a646c7dddfddf065084`. Issue #253 cerrada como implementación completada.
- HEAD aprobado: `b26b4b9a6b8e2e5c09f5d1fe37f159ec4d6a245b`; código `c5dec4fbdfa3cb611577f20cd6aee67571768c28`.
- [CI PR #385 SUCCESS](https://github.com/isocronazero-svg/isocrona-zero-campus-app/actions/runs/38459013756); [CI main #386 SUCCESS](https://github.com/isocronazero-svg/isocrona-zero-campus-app/actions/runs/38490893742).
- Ambos P2 resueltos: listas/bloqueadas disjuntas; documentación pendiente ofrece `reopen-associate-application`, revisión ofrece `request-associate-info`. Review `6154036414` sin problemas importantes, cero threads abiertos al merge.
- Node22: targeted, frontend syntax, check:app, smoke14 y diff check PASS. Edge390/1440: tres tipos de revisión, contexto obsoleto, enlaces de justificantes, foco/scroll único, sin errores JS ni escrituras.
- Recuperación aplicada de comentarios `6143102157` y `6151266079`; NO repetir. Archivos: app.js, package.json, check-app, check-associate-review-navigation y bitácora.
- Bitácora conservada al integrar. #254 ya estaba cerrado tras trasladar su handoff documental.
- QA autenticada productiva NO realizada. No inferir despliegue verificado solo por merge/CI; recorrido productivo pendiente en #227.

---

# #252 — alta masiva segura de accesos Campus

## Implementación publicada — 14/10/2026
- [PR #256](https://github.com/isocronazero-svg/isocrona-zero-campus-app/pull/256), rama `codex/associate-onboarding-252`, base main `3b2f0ef`; código `9d117b98b008929d8b0865f53da4e23006b6e659`. NO fusionada ni desplegada.
- Reutilizado baseline durable `6143098248` y aplicados contrato `6151415338`/anexo `6151519842`. No buscar commits locales perdidos ni rehacer el trabajo.
- Preview read-only y token15min ligado a admin/estado; subset explícito1–20, 0 seleccionados, SMTP obligatorio antes del alta; identidades explícitas, estados consolidados, emails canónicos, colisiones bloqueadas, cuentas manuales/privilegiadas excluidas.
- Provisionado separado de entrega, retry sin cuenta/clave nueva, outbox redactado desde su creación, temporal ausente en state no-admin. Protección de snapshots antiguos y combinación del resultado SMTP con estado actual.
- P1 preventivos corregidos: adopción por email, secretos en outbox/state de socio, ejecución sin SMTP, doble lote y rollback por snapshot/espera SMTP. P2 móvil corregido en panel acotado, sin rediseño global.
- Review: P1 `sHoaH`, P2 `sHoaN` y nuevo P2 `sLcBB` corregidos/respondidos/resueltos tras CI verde. Commits `6b0de79`, `ff21a0d`, `03df97f`: preservación común de cambios concurrentes de acceso/outbox; entrega durable por correo; estado del socio reconciliado; reintentos/Resolver todo sin clones ni envíos duplicados. Agente legacy ya no crea accesos fuera del preview/subset; avisos antiguos bloqueados.
- Tres P2 posteriores también corregidos/respondidos/resueltos: `sLkCH` bloquea sending tras interrupción/reinicio; `sLqZu` compara cada ficha con la confirmada antes de su turno; `sLqZz` reutiliza queued tras reinicio. Regresiones: cero envíos ambiguos, ningún envío al email modificado durante SMTP y máximo una entrega/outbox en recuperación queued, conservando cuenta/temporal.
- P2 adicionales `sRuhE`/`sRuhS` corregidos/resueltos: SMTP ligado al preview y revalidado antes de cada alta; no se puede cambiar nombre/email durante sending. Reconciliación comprueba destinatario y vínculo; edición de teléfono sigue permitida. Regresiones SMTP cambiado/vaciado y PATCH concurrente PASS.
- P2 `sR6ak` corregido en `bc400f0` y resuelto: reset bloqueado durante sending activo o persistido; fuera de ese estado sigue operativo. Nueve threads históricos resueltos.
- Re-review local de `bc400f0`: reproducido envío desde una cola obsoleta tras reset/cambio de destinatario o SMTP, y rollback de nombre/SMTP al guardar esa cola. Corregido en `9d117b9`: validación del contexto actual justo antes de SMTP y preservación de cambios concurrentes. Regresión red/green con tres esperas SMTP sintéticas: cero envíos obsoletos, retry con clave vigente/login válido, mismo outbox y cambios preservados. Sin otros P1/P2 detectados en revisión local.
- Node22.23.3: check focalizado, `check:associate-onboarding`, `check:app` completo y diff check PASS. [Actions #398 SUCCESS](https://github.com/isocronazero-svg/isocrona-zero-campus-app/actions/runs/38558538689) sobre código `9d117b9`, incluido smoke. Frontend syntax/smoke14/Edge390/1440 locales anteriores PASS; sin cambios nuevos en frontend ni rutas del smoke, no repetidos. Los commits documentales posteriores deben tener también CI verde antes del merge.
- **BLOCKED por revisión final pendiente**, no por tests: última review automática completada sobre `ab2eb54`; la petición para `bc400f0` fue rechazada por cuota (comentario `6166870067`). Nueva petición de `9d117b9`: `6167580884`. No afirmar aprobación automática del HEAD nuevo. Siguiente acción: completar revisión final del código vigente cuando esté disponible o con revisión humana independiente; resolver cualquier P1/P2 y, solo entonces, decisión humana de Carlos sobre el merge. No iniciar otros issues.
- Archivos: server.js, server/onboarding-state.js, server/state-transport.js, public/app.js, public/styles.css, package.json, scripts/check-app.mjs, scripts/check-associate-onboarding.mjs, docs/associate-onboarding.md y esta bitácora.
- Cero cuentas/correos/datos productivos tocados. Encargo vigente: dejar SOLO #256 lista para decisión humana; sin merge automático ni inicio de #247/#245/#248.
- Límites documentados: single-writer, token/lock en memoria, envío `sending` interrumpido exige reconciliación manual; SMTP no garantiza exactamente una entrega ante desconexión ambigua. Temporal heredada en ficha admin hasta cambio; backups antiguos sensibles.
- Gates reales: censo presente en state, backup externo recuperable verificado (export-state = rollback lógico, no uploads/volumen), test SMTP recibido, dry-run revisado y autorización expresa de Carlos para piloto5–10.

## Recuperación histórica (ya aplicada)
- Rama remota `issue-252-member-access-launch` seguía en la base histórica `a043b3beb15b5d8e49d9b3b88a15a4d0be0f9bba`; no hay implementación funcional publicada.
- NO reimplementar desde cero.
- Baseline completo como **diff literal durable** en issue #252 comentario **`6143098248`**; commit local reconstruido `42d964635745edbb676b6ebda702f45c1fa33448`.
- Archivos baseline: `docs/associate-onboarding.md`, `package.json`, `public/app.js`, `scripts/check-associate-onboarding.mjs`, `server.js`.
- Baseline ya probó Node22, onboarding sintético, associate-update, frontend syntax, check:app, smoke y diff check.

## Referencia única de implementación
El **contrato consolidado definitivo** es el comentario #252 **`6151415338`**. Si un comentario previo contradice ese contrato, prevalece `6151415338`.

Desktop/Codex debe:
1. cerrar/fusionar #253 primero;
2. partir del `main` vigente después de #253 y de esta bitácora;
3. reutilizar el baseline `6143098248`;
4. portar/ajustar hunks con conflictos sin revertir #253;
5. implementar exactamente el contrato `6151415338`;
6. un solo PR #252, sin mezclar #247/#245/#248.

## Reglas finales #252

### Preview
- solo admin, read-only, token/fingerprint 15 min, cero mutación;
- email canónico `trim().toLowerCase()`;
- clasificación por estado/email/duplicados/identidad antes de declarar ejecutable;
- devolver `smtpReady`, resumen e items sin credenciales.

### Estados
No usar `/activa/i` ni exigir solo `Activa`.
- `Activa`: permitido si pasa el resto;
- `Pendiente cuota`: permitido; sigue siendo socio;
- `Revisar documentacion`: permitido solo si es legacy importado (`Importado desde Excel legacy`) y tiene nombre + apellidos + email canónico válido;
- `Baja`: nunca ejecutable aunque tenga links/cuenta;
- `Solicitud recibida`, `En revision` y equivalentes no consolidados: bloqueados;
- estado desconocido: `incident`.

### Email
- canónico también al crear/enlazar associate/member/account;
- duplicados normalizados bloqueados;
- bloquear explícitamente `gmail.con` como caso real sospechoso; no montar un validador DNS universal;
- espacios/mayúsculas no crean identidades distintas.

### Identidad
No “adoptar” member/account por simple coincidencia de email:
- resolver primero `linkedMemberId`/`linkedAccountId`;
- link roto o incompatible => `incident`;
- member/account mismo email de otra identidad => `incident`;
- member huérfano ambiguo sin vínculo explícito suficiente => `incident`;
- link coherente del mismo socio puede reutilizarse;
- execute vuelve a validar antes de mutar.

### Cuenta ya existente
- cuenta manual operativa existente: `already_linked`, NO ejecutable por lote;
- retry solo si es onboarding realmente incompleto/fallido: links coherentes + `mustChangePassword=true` + `associate.temporaryPassword` válida + bienvenida pending/failed;
- retry no crea cuenta ni rota contraseña.

### Selección/lotes
- execute recibe `associateIds` explícitos;
- default tras preview: 0 seleccionados;
- máximo **20** por ejecución;
- 0 o 21+ => 400 antes de consumir token y con cero mutación;
- IDs manipulados/no elegibles => 400 y token no consumido;
- solo después de validar request/fingerprint/SMTP consumir token;
- SMTP secuencial por socio;
- UI: checkboxes + `Seleccionados X/20` + `Seleccionar 5` + `Seleccionar 10` + `Seleccionar hasta 20` + `Limpiar selección`;
- los botones de selección nunca ejecutan automáticamente;
- botón `Procesar X seleccionados` disabled con X=0.

### SMTP — P1
El flujo existente con `strict:false` puede devolver `smtp_missing` sin lanzar. Por eso:
- preview indica `smtpReady`;
- execute valida `isSmtpConfigured(state)` **antes de consumir token y antes de crear una cuenta**;
- SMTP ausente => 400, cero mutación;
- UI bloquea execute si SMTP no está listo.

### Contraseña/bienvenida
- mantener `randomBytes(18).toString("base64url")`;
- generar una sola vez al crear/reset explícito;
- retry SMTP reutiliza la credencial;
- `mustChangePassword=true` hasta el primer cambio;
- cambio real limpia `temporaryPassword`;
- no filtrar password/hash/token/credenciales SMTP en responses/logs/listados de socio;
- bienvenida incluye portal oficial `https://portal.isocronazero.org`.

### Error visible seguro
- fallo SMTP: cuenta persiste una sola vez, bienvenida `failed`, retryable;
- guardar `welcomeEmailError` saneado y mostrar motivo útil solo a admin;
- jamás incluir contraseña temporal, hash, token o secreto SMTP en ese error;
- éxito limpia el error.

## Tests obligatorios #252
La lista exhaustiva está en `6151415338`. Cubrir como mínimo:
- permisos 401/403/admin;
- preview no mutante;
- Activa/Pendiente cuota/legacy Revisar doc elegibles;
- Baja/request/unknown bloqueados;
- missing/invalid/duplicate/`gmail.con`;
- normalización de email;
- colisión member/account/links rotos;
- manual account no ejecutable;
- retry onboarding sí;
- SMTP ausente cero mutación;
- 0 IDs, 21 IDs, subset 5/N, IDs manipulados;
- fingerprint/token TTL/reutilización;
- fallo SMTP + retry misma cuenta/credencial;
- mustChangePassword + limpieza;
- no fuga de credenciales;
- `check:associate-onboarding`, `check:associate-update`, frontend syntax, `check:app` Node22, smoke14, `git diff --check`.

## Operación REAL — solo después de merge/deploy y autorización
- `/api/storage/export-state` descarga el estado completo mediante `JSON.stringify(state)`: backup sensible.
- Guardar `campus-backup-*.json` privado fuera del host; nunca GitHub/issues/adjunto público; verificar JSON; restore solo aislado salvo autorización expresa.
- Ya existe `smtp-test` → `/api/smtp/test`: configurar `testTo`, enviar un único test y confirmar recepción real.
- Después: preview productivo → corregir incidencias → Carlos autoriza primer subset **5–10** → comprobar accesos/correo/cambio de contraseña → continuar en lotes de **máximo 20**.
- Cero cuentas/emails reales durante desarrollo/CI.

## Censo read-only de preparación
Fuente conectada `CUOTAS SOCIOS`, sin escrituras:
- 153 emails consolidados, 153 distintos tras trim/lower, 0 duplicados exactos;
- 8 emails con espacios sobrantes;
- al menos un dominio `gmail.con` sospechoso;
- 8 bajas expresas;
- numeración visible 1..143 + 10 filas consolidadas sin número;
- una alta posterior adicional en formulario: total potencial 154 / activo aparente ~146, a confirmar contra producción;
- existen varios accesos manuales previos, que deben quedar fuera del envío masivo por defecto.

---

# QA productiva pendiente

## #241 — apertura/zona horaria
- Código fusionado.
- Pendiente prueba autenticada con apertura 3–5 min por delante en hora española: rechazo antes y aceptación desde umbral exacto.
- Mantener Europe/Madrid/DST/backend como autoridad.

## #242 — certificados de instructor
- Fusionado vía PR #244.
- Pendiente varios instructores, PDF admin/propio instructor, permisos laterales y bloqueo hasta pasar completamente `endDate`.

## #249 — cierre de inscripción
- Fusionado vía PR #251.
- Cierre explícito + fallback `startDate 00:00 Europe/Madrid`, backend autoritativo y retry de justificante existente preservado.
- Issue abierta hasta QA productiva de frontera real.

---

# Después de #252

## #247 — instructor habilitado + selector múltiple
- `instructorEnabled`, default legacy false, solo admin;
- nuevas asignaciones solo habilitados y validadas backend;
- deshabilitar no borra historia/certificado;
- selector + añadir + chips/quitar, 1/2/3/4+ sin límite artificial, dedupe;
- proteger frente a `/api/state` obsoleto;
- reutilizar `instructorAssociateIds` y `server/instructor-certificate.js`.

## #245 — asistencia/cierre
- reutilizar verdad/endpoints académicos existentes;
- UX móvil `Asistió` / `No asistió`;
- instructor asignado solo su curso; otro instructor 403; alumno nunca se autoedita/autocierra;
- waiting no se toca; blockers adicionales se conservan; no `/api/state` como bypass.

## #248 — histórico/prioridad
- derivado, no contador manual;
- solo Jornada intensiva realmente realizada como alumno;
- dedupe course+member;
- excluir waiting/rechazado/cancelado/no asistió/no apto/instructor puro;
- agregador servidor único para UI/export;
- ordenar por menor nº de jornadas; V1 informa/ordena, no adjudica plazas automáticamente.

---

# QA integral #227
Recorrido objetivo final:
1. crear jornada;
2. apertura/cierre hora local;
3. instructores habilitados;
4. inscripción + justificante/retry;
5. asistencia/aptitud/cierre;
6. diplomas alumno/instructor;
7. histórico/prioridad/export;
8. responsive 390/768/1440;
9. backup externo + restore aislado ensayado antes de operaciones reales relevantes.

# Otros
- PR #240: referencia histórica; modelo docente incompatible, no fusionar tal cual.
- #109 refactor backend: V2.
- #112 ampliación IVASPE: independiente.
- #134 importación IVASPE Railway: operación productiva separada; requiere backup + dry-run + autorización.

# Regla de continuidad
Antes de tocar código desde cualquier chat/Desktop:
1. refrescar `main`, esta bitácora, #227, PRs/issues/checks recientes;
2. GitHub + esta bitácora son fuente común; no crear plan paralelo;
3. un PR por tema;
4. #253 antes de #252; #252 antes de #247/#245/#248;
5. leer todos los comments/reviews/threads P1/P2 antes de merge;
6. si cambia plan/estado, actualizar esta bitácora y #227;
7. no confundir CI verde con QA productiva;
8. no datos reales, migraciones, altas masivas ni emails reales sin backup recuperable + preview/dry-run + autorización explícita.
