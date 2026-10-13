# Estado del portal — 13 de octubre de 2026

Repositorio: `isocronazero-svg/isocrona-zero-campus-app`

Bitácora operativa vigente para continuar desde Desktop/Codex. Para historia anterior usar `docs/estado-web-2026-10-12.md` y Git.

## Estado consolidado — 13/10/2026 tarde, Europe/Madrid

### `main`
- HEAD verificado antes de esta actualización documental: `efa99c4e510691155cd352d8d3e9b0d5bc434a52`.
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

1. **#253 / PR #255** — cerrar el bloqueo móvil de revisión de altas.
2. **#252** — onboarding seguro por lotes de accesos Campus históricos.
3. **#247** — habilitación explícita de socios instructores.
4. **#245** — asistencia/cierre con permisos de instructor asignado.
5. **#248** — histórico/prioridad de jornadas.
6. **#227** — QA integral + QA productiva pendiente #241/#242/#249.

No empezar #247/#245/#248 mientras #253/#252 sigan siendo el cuello de botella de apertura a socios.

---

# #253 / PR #255 — revisión móvil de altas de socio

## Estado final de implementación — 13/10/2026, Desktop
- PR #255 abierta, NO fusionada ni desplegada; base actualizada a main `9f021a7` sin perder la bitácora posterior.
- Código final: `c5dec4fbdfa3cb611577f20cd6aee67571768c28`; recuperado el diff literal `6151266079` sin reconstruir la solución.
- [Actions #384 SUCCESS](https://github.com/isocronazero-svg/isocrona-zero-campus-app/actions/runs/38458722283) sobre ese SHA.
- Dos P2 corregidos y resueltos: conteo disjunto listas/bloqueadas y acción `Reabrir revision` en documentación pendiente. Revisión local completa sin P1/P2 pendientes; re-review remota solicitada.
- Archivos: `public/app.js`, `package.json`, `scripts/check-app.mjs`, `scripts/check-associate-review-navigation.mjs` y esta bitácora.
- Node22.23.3: targeted, frontend syntax, check:app completo, smoke14 y diff check PASS. Edge real 390/1440 PASS para los tres tipos de revisión, ambas ramas de estado, contexto obsoleto, enlaces, foco único, sin errores JS ni escrituras.
- Siguiente: #252 en PR separado desde main vigente. #255 no es dependencia funcional del backend de onboarding; preservar ambos cambios al integrarlos. No merge automático ni datos/correos reales. #254 ya estaba cerrado y había trasladado su handoff a este documento.

## Estado remoto anterior (contexto de recuperación)
- PR real: **#255** `Fix #253 mobile associate review detail and proof links`.
- Rama: `fix/253-mobile-associate-review`.
- Head remoto verificado: `1f21bf48dfe516f0bf6e06f1b82e2728c8a20f31`.
- Commits remotos:
  - `5c864c543d9121d38925e664b3f0cdf9e4cd4d06`: navegación/foco/detalle/proofs;
  - `1f21bf48dfe516f0bf6e06f1b82e2728c8a20f31`: contador correcto listas/bloqueadas.
- Actions `App checks` run #381 sobre `1f21bf4`: SUCCESS.
- Primer P2 Codex, contador listas/bloqueadas: resuelto y thread cerrado.
- Segundo P2 Codex, acción `Reabrir revision`: thread `PRRT_kwDOR63Ofc6r2n7m` / discussion `4258508999`, todavía abierto hasta que el fix esté realmente remoto.

## QA ya validada
- Node 22.23.3 `npm run check:app`: PASS.
- frontend syntax + `git diff --check`: PASS.
- smoke aislado: 14/14 PASS.
- Edge real 390/1440: solicitud/justificante/cambio de ficha abren el detalle correcto; foco/scroll único; selección obsoleta no contamina acciones; justificantes principal/secundario abren; sin overflow, errores JS ni mutación de registros.
- Foco accesible sobre la tarjeta real seleccionada y side panel acotado al modo activo.

## Último P2 — recuperación durable lista
El head remoto `1f21bf4` todavía muestra `Pedir doc.` también para `Pendiente de documentacion`. La tabla correcta distingue:
- `Pendiente de revision` → `Pedir doc.`;
- `Pendiente de documentacion` → `Reabrir revision`.

Codex hizo el follow-up local y todos los checks pasaron, pero no pudo hacer push. El **diff literal completo y aplicable** quedó preservado en PR #255 comentario **`6151266079`**:
- base exacta: `1f21bf48dfe516f0bf6e06f1b82e2728c8a20f31`;
- commit local reproducido: `3040196d412960a1c9be1a3b9b0d6ab0c053142d`;
- archivos: `package.json`, `public/app.js`, `scripts/check-associate-review-navigation.mjs`;
- añade comando `check:associate-review-navigation`;
- añade exclusión mutua de acciones por estado;
- Node22 targeted + `check:app` + frontend syntax + smoke14 + diff check: PASS.

Criterio final, comentario PR `6151246412`:
- `Pendiente de revision`: tiene `request-associate-info` y NO `reopen-associate-application`;
- `Pendiente de documentacion`: tiene `reopen-associate-application` y NO `request-associate-info`;
- Aprobar sigue condicionado por readiness; Rechazar se conserva; estados resueltos no recuperan acciones de pendiente.

### Siguiente paso #253
Esperar/revisar el CI del commit documental y la revisión final. Merge solo por decisión humana; cerrar #253 tras integración y QA del despliegue. No repetir la recuperación ni confundir QA local con QA productiva.

---

# #252 — alta masiva segura de accesos Campus

## Recuperación
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
