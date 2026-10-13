# Estado del portal — 13 de octubre de 2026

Repositorio: `isocronazero-svg/isocrona-zero-campus-app`

Esta es la **bitácora operativa vigente** para continuar desde Desktop/Codex. Continúa `docs/estado-web-2026-10-12.md`; usar Git y los documentos anteriores para detalle histórico ya cerrado.

## Estado consolidado — 13/10/2026 tarde, Europe/Madrid

### `main`
- HEAD verificado antes de esta actualización documental: `a043b3beb15b5d8e49d9b3b88a15a4d0be0f9bba` (`docs: sync handoff after #251 merge`).
- #246 / PR #250 está fusionada y desplegada; jornadas intensivas funcionales. Squash funcional: `e298e06caea094b22c46f3b87fad1c595de8bd30`.
- #249 / PR #251 está fusionada y desplegada. Squash: `deb4188103a3a4e4cdab31960b4d59b2a05a9415`.
- No recrear ramas/patches de #244, #250 ni #251.
- Este commit documental puede dejar PRs funcionales abiertas un commit por detrás de `main`; conservar siempre esta bitácora al fusionar.

### Producción conocida
- Portal oficial: `https://portal.isocronazero.org`.
- Servicio Railway activo, aunque su nombre interno confunda: `zealous-warmth - isocrona-zero-campus-test`.
- `outstanding-wholeness - isocrona-zero-campus` sigue siendo servicio paralelo/ruidoso; no confundirlo con el portal activo ni eliminarlo sin verificar dominio/volumen/datos.
- CI verde o smoke público NO equivalen a QA autenticada productiva.

## Prioridad de lanzamiento actual

El orden anterior `#247 → #245 → #248` queda **temporalmente desplazado** por dos bloqueos de lanzamiento descubiertos al probar altas de socios:

1. **#253 / PR #255** — terminar revisión móvil de solicitudes de socio.
2. **#252** — alta masiva segura de accesos Campus para socios históricos.
3. **#247** — habilitación explícita de socios instructores.
4. **#245** — asistencia/cierre presencial con permisos de instructor asignado.
5. **#248** — histórico/prioridad de jornadas.
6. QA integral #227 + QA productiva pendiente #241/#242/#249.

No iniciar #247/#245/#248 mientras #253/#252 sigan siendo el cuello de botella de apertura a socios.

---

## #253 / PR #255 — revisión móvil de altas de socio

### Estado remoto
- PR real: **#255** `Fix #253 mobile associate review detail and proof links`.
- Rama: `fix/253-mobile-associate-review`.
- Head remoto verificado antes de esta actualización: `1f21bf48dfe516f0bf6e06f1b82e2728c8a20f31`.
- Commits funcionales remotos:
  - `5c864c543d9121d38925e664b3f0cdf9e4cd4d06` — navegación/foco/detalle/proofs;
  - `1f21bf48dfe516f0bf6e06f1b82e2728c8a20f31` — contador correcto de listas vs bloqueadas.
- GitHub Actions `App checks` run #381 sobre `1f21bf4`: **SUCCESS**.
- PR mergeable; NO fusionar hasta cerrar el P2 restante y repetir review/checks sobre el head final.

### Ya validado
- Node 22.23.3: `npm run check:app` PASS.
- `npm run check:frontend-syntax` y `git diff --check` PASS.
- smoke `campus-test`: 14/14 PASS en almacenamiento aislado.
- QA real Edge 390/1440: `Pendiente de revisar → Abrir` para solicitud/justificante/cambio de ficha; un foco/scroll por click; detalle correcto incluso con selección previa obsoleta; justificante principal/secundario abren; sin errores JS, overflow ni mutación de registros.
- La tarjeta seleccionada recibe foco accesible (`tabindex=-1`, `preventScroll`) y el side panel queda acotado al modo activo.
- Los contadores `lista para aprobar` / `bloqueada` ya se calculan mediante `getAssociateApplicationReadiness()` y no se solapan.

### P2 restante
Codex detectó en el head `1f21bf4`:
- si la solicitud está en `Pendiente de documentacion`, el detalle lateral muestra `Pedir doc.` cuando la tabla ofrece correctamente `Reabrir revision`;
- como móvil enfoca directamente ese detalle, hay riesgo de volver a solicitar documentación por error.

Se pidió a Codex corregir SOLO este P2 en comentario PR `6150992953`.
Codex declaró una corrección local `58f34c1` con:
- `Pendiente de revision` → conserva `Pedir doc.`;
- `Pendiente de documentacion` → `Reabrir revision` (`reopen-associate-application`);
- regresión de ambas ramas;
- `check:associate-review-navigation`, `check:app`, frontend syntax, smoke14 y diff check PASS en Node22.

**Importante:** al último refresh `58f34c1` NO estaba en la rama remota. Se pidió diff literal durable en comentario PR `6151194185`. No dar #253 por terminada hasta materializar ese follow-up, CI verde y re-review sin P1/P2.

### Próximo paso #253
1. Recuperar/aplicar el diff literal de `58f34c1` sobre el head remoto actual.
2. Push a la misma rama.
3. Ejecutar Actions Node22.
4. `@codex review` final y leer todos los threads/comentarios.
5. Cerrar solo P1/P2 realmente resueltos.
6. Fusionar manualmente cuando head/checks/review estén limpios; no auto-merge.
7. Verificar `main` y despliegue; QA móvil productiva de `Abrir` queda para el recorrido final si no puede hacerse automáticamente.

---

## #252 — alta masiva segura de accesos Campus

### Estado remoto y recuperación
- Rama remota `issue-252-member-access-launch` sigue en la base `a043b3beb15b5d8e49d9b3b88a15a4d0be0f9bba`; no hay implementación funcional publicada todavía.
- NO reconstruir desde cero.
- Implementación V1 completa preservada como **diff literal durable** en issue #252, comentario **`6143098248`**.
- Commit local reconstruido referido por ese material: `42d964635745edbb676b6ebda702f45c1fa33448`.
- Ese patch incluye `docs/associate-onboarding.md`, `package.json`, `public/app.js`, `scripts/check-associate-onboarding.mjs` y `server.js`.
- Validación declarada del patch base: Node22 `check:associate-onboarding`, `check:associate-update`, frontend syntax, `check:app`, smoke y diff check PASS, con fixtures sintéticos y SMTP local.

### Lo bueno que debe conservarse
- preview admin sin mutación con token/fingerprint de 15 min;
- clasificación elegible / ya vinculado / sin email / inválido / duplicado / incidencia;
- ejecución admin explícita e idempotente;
- SMTP estrictamente secuencial;
- fallo SMTP conserva cuenta y estado reintentable;
- reintento no duplica cuenta ni rota credencial;
- contraseña temporal criptográfica generada una sola vez mediante `randomBytes`, no deducible por nombre/nº de socio;
- `mustChangePassword` obligatorio y limpieza de `temporaryPassword` al cambiarla;
- no fuga de credenciales en respuestas/listados no administrativos;
- bienvenida con portal oficial;
- cero datos/correos reales durante CI.

### Revisión previa al lanzamiento — OBLIGATORIA antes de PR
Contrato durable en comentarios #252 `6151049460`, `6151097339`, `6151164035` y `6151178796`.

1. **P1 — ejecución por subconjunto, no todos de golpe.**
   - El patch base recorre todos los `item.executable`; no sirve para un rollout 5–10 → 10–20 → resto.
   - `execute` debe aceptar `associateIds` explícitos pertenecientes al preview vigente.
   - UI: selección consciente, contador y **default ninguno seleccionado**.
   - Rechazar IDs manipulados/no elegibles y deduplicar.
   - Token/fingerprint siguen invalidando el preview si cambia el censo.

2. **P1 — bajas/inactivas nunca ejecutables.**
   - Validar estado antes de tratar `linkedAccountId` como retry.
   - No usar `/activa/i`: `Inactiva` también hace match.
   - Normalizar y exigir el estado activo real (`Activa`).
   - Tests `Baja` e `Inactiva`, también con cuenta enlazada.

3. **P1 — cuentas manuales existentes no reciben bienvenida masiva por defecto.**
   - `already_linked && welcomeEmailStatus !== sent` es demasiado amplio.
   - Retry automático solo para onboarding real pendiente/fallido: cuenta enlazada válida + credencial temporal válida + `mustChangePassword` + estado de bienvenida pendiente/fallido.
   - Cuenta manual ya operativa => visible como enlazada, pero NO ejecutable en lote.

4. **P1/P2 — email canónico también en ejecución.**
   - Preview ya usa `trim().toLowerCase()`, pero el provisionado histórico usa email crudo.
   - Antes de crear/enlazar, normalizar `associate.email`, member/account y comparaciones (`trim + lowercase`).
   - Test con espacios y mayúsculas.

5. **P2 — link roto/incompatible = incidencia.**
   - `linkedAccountId` debe resolver una cuenta real y coherente; si no, bloquear y pedir revisión.

6. **P2 — dominio sospechoso real.**
   - `isLikelyEmail()` actual solo valida estructura (`algo@algo.algo`), por lo que `gmail.con` puede pasar.
   - El censo real contiene al menos un `gmail.con`; bloquearlo explícitamente como inválido/incidencia y cubrir regresión, sin convertir #252 en un validador DNS universal.

7. **Orden seguro de gates del preview:**
   1. estado `Activa` real;
   2. email canónico presente, formato/dominio aceptable y sin duplicidad;
   3. resolver vínculo de cuenta;
   4. decidir alta nueva / ya vinculada no ejecutable / retry onboarding.

### Regresiones adicionales #252
- baja+linked nunca ejecuta;
- `Inactiva` nunca ejecuta;
- cuenta manual existente no recibe bienvenida de lote;
- retry real de onboarding sí es ejecutable y no rota contraseña;
- email con espacios crea/enlaza identidad canónica;
- `gmail.con` bloqueado;
- subset 5 de N crea/envía solo esos 5;
- IDs manipulados/no elegibles rechazados;
- reejecución/re-preview no duplica cuentas ni correos enviados;
- preview sigue siendo no mutante.

### Gates operativos reales — fuera de CI
- El sistema ya dispone de `smtp-test` → `/api/smtp/test`; NO crear otra feature.
- Antes del primer lote real: configurar `testTo`, enviar **un único correo de prueba** y confirmar recepción.
- `/api/storage/export-state` exporta literalmente el estado completo (`JSON.stringify(state)`), por lo que `campus-backup-*.json` es **sensible**.
- Guardar backup fuera del host en ubicación privada/recuperable; nunca GitHub/issues ni adjunto público.
- Verificar que abre como JSON y conservar intacto.
- Restauración solo en entorno aislado para ensayo; nunca sobrescribir producción sin autorización.
- Después: preview real → corregir incidencias → primer subset 5–10 expresamente autorizado → validar accesos/correos → 10–20 → resto.

### Auditoría read-only del censo
Fuente conectada `CUOTAS SOCIOS`, sin escrituras:
- 153 emails en `Listado de socios`; 153 distintos tras `trim + lowercase`; 0 duplicados exactos;
- 8 emails con espacios sobrantes;
- al menos 1 `gmail.con` claramente sospechoso;
- 8 bajas expresas;
- numeración visible 1..143 y 10 filas consolidadas posteriores sin número;
- una alta posterior adicional en formulario: total potencial 154 / activo aparente ~146, pendiente de confirmar contra producción;
- ya existen varios accesos creados manualmente, que deben quedar fuera del envío masivo por defecto.

**Prohibido** crear cuentas reales o enviar bienvenida masiva desde esta fase. Hace falta merge/deploy + backup recuperable + SMTP test + preview + autorización expresa del subset.

---

## #241 / #242 / #249 — QA productiva pendiente

### #241 — apertura y zona horaria
- Código fusionado.
- Pendiente prueba autenticada con apertura configurada 3–5 min por delante en hora española: rechazo antes y aceptación desde umbral exacto, sin desfase UTC.
- Mantener `Europe/Madrid`, DST y backend como autoridad.

### #242 — certificados de instructor
- Código fusionado vía PR #244.
- Pendiente: varios instructores, PDF admin/propio instructor, permisos laterales y bloqueo hasta que haya pasado completamente `endDate`.

### #249 — cierre de inscripciones
- Código fusionado vía PR #251.
- Implementado cierre explícito + fallback `startDate 00:00 Europe/Madrid`, backend autoritativo y preservación del retry de justificante existente.
- Issue permanece abierta hasta QA productiva de frontera real.

---

## #247 — instructor habilitado + selector múltiple

Ejecutar **después de #252**.

Contrato cerrado:
- `instructorEnabled` persistente; legacy/default seguro `false`;
- solo admin cambia el flag;
- nuevas asignaciones: solo socio existente, nombre válido e `instructorEnabled=true`;
- backend valida cada nueva asignación;
- deshabilitar impide nuevas asignaciones pero conserva relaciones/certificados históricos;
- histórico deshabilitado sigue visible al editar y no desaparece al guardar;
- reactivar lo hace seleccionable otra vez;
- sin límite artificial: cubrir 1/2/3/4+ instructores;
- dedupe frontend/backend;
- selector + `Añadir instructor` + chips/lista `Quitar`;
- reutilizar `instructorAssociateIds` y `server/instructor-certificate.js`;
- proteger el flag frente a snapshots `/api/state` obsoletos;
- payload manipulado de socio no habilitado => rechazo backend.

---

## #245 — asistencia presencial y cierre

Ejecutar después de #247.
- Reutilizar endpoints/verdad académica existentes; no construir sistema paralelo.
- UX móvil rápida `Asistió` / `No asistió`.
- Instructor asignado puede actuar solo en su curso; otro instructor => 403; alumno nunca se autoedita/autocierra.
- Waiting no se toca; requisitos adicionales conservan blockers; jornada presencial pura puede cerrarse correctamente con asistencia/aptitud.
- No usar `/api/state` como bypass.

---

## #248 — histórico y prioridad

Ejecutar después de #247/#245.
- derivar, no persistir contador manual;
- contar solo `Jornada intensiva` realmente realizada como alumno;
- dedupe `course.id + memberId`;
- excluir espera/rechazado/cancelado/no asistió/no apto/instructor puro;
- un único agregador servidor para UI + exportación;
- ordenar por menor nº de jornadas; V1 informa/ordena, no adjudica automáticamente plazas;
- admin ve ranking completo; socio normal no.

---

## QA integral final #227

Recorrido objetivo tras #248:
1. crear jornada intensiva;
2. apertura/cierre inscripción con hora local;
3. asignar instructores habilitados;
4. inscripción + justificante + retry;
5. asistencia/aptitud/cierre;
6. diplomas alumno/instructor;
7. histórico/prioridad/exportación;
8. responsive 390/768/1440;
9. backup externo + restauración aislada ensayada antes de operaciones reales relevantes.

## PR #240
- Referencia histórica únicamente; usa modelo docente incompatible. No fusionar tal cual con el modelo de `associates`/`instructorAssociateIds`.

## Pendientes que no deben distraer
- #109 refactor backend: V2.
- #112 ampliación preguntas IVASPE: independiente.
- #134 importación IVASPE Railway: operación productiva separada; no ejecutar sin backup + dry-run + autorización.

## Regla de continuidad
Antes de tocar código desde cualquier chat/Desktop:
1. refrescar `main`, esta bitácora, #227, PRs/issues/checks recientes;
2. GitHub + esta bitácora son fuente común; no crear plan paralelo;
3. un PR por tema y no mezclar #253/#252/#247/#245/#248;
4. si cambia plan/estado, actualizar esta bitácora y #227;
5. leer **todos** los comments/reviews/threads P1/P2 antes de merge;
6. no confundir CI verde con QA productiva;
7. no datos reales, migraciones, altas masivas ni emails reales sin backup recuperable + preview/dry-run + autorización explícita.
