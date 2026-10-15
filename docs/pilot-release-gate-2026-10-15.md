# Gate de apertura — piloto de socios

Fecha: 15/10/2026

Objetivo: decidir con evidencia si el Campus puede abrirse a un primer grupo de 5–10 socios reales. Este documento no autoriza despliegues, reinicios, cambios de variables, altas reales ni envíos de correo.

## Gate A — código

- [x] PR #260 integrada mediante merge normal.
- [x] `npm run check:app` verde.
- [x] `npm run smoke:campus-test` verde, 14 rutas sintéticas.
- [x] `git diff --check` verde.
- [x] Sin findings P1/P2 abiertos en #260.
- [x] PR #261 sincronizada con `main` mediante merge normal, resolviendo conflictos sin perder funcionalidad de #260 ni #261.
- [x] Regresión académica de #261 verde.
- [x] QA local móvil/escritorio verde.
- [x] CI PR #428 SUCCESS.
- [x] PR #261 fusionada mediante merge normal.
- [x] CI de `main` #429 SUCCESS.
- [x] SHA integrado final identificado: `819f7624be148b987ce9997924fd38efbfd234aa`.
- [x] Cero P1/P2 conocidos pendientes de integración.

**Gate A: COMPLETO.**

## Gate B — persistencia Railway

Bloqueante para socios reales.

- [x] Servicio productivo y entorno correctos identificados.
- [x] `IZ_DATA_DIR` no vacío.
- [x] `IZ_DATA_DIR` apunta dentro de un Railway Volume persistente.
- [x] Evidencia autenticada de almacenamiento confirma DB/app_state/uploads dentro del volumen.
- [x] Backup externo recuperable realizado antes de operaciones reales.
- [x] Archivo sintético subido y recuperable antes del reinicio/redeploy.
- [x] Restart/redeploy solo tras autorización expresa.
- [x] Descarga normal del mismo archivo después del restart/redeploy: enlace oficial, 208 bytes y SHA-256 idénticos tras corregir IZ_BASE_URL (#263).
- [x] Estado de socios/cursos no cambia tras la prueba.

Evidencia inicial autenticada 15/10, 21:12 Europe/Madrid (histórica; resultado final debajo):
- `zealous-warmth / production / isocrona-zero-campus-test`, dominio `https://portal.isocronazero.org`.
- SHA activo `6cb7577fd9773da2a8dba41c2e9884407c56f472`; despliegue `1ec54a54-e130-458e-a364-6f6025f1f2c9`.
- Mount Path del Volume e `IZ_DATA_DIR`: `/var/data/isocrona-zero`. Montaje real ext4 rw confirmado desde el contenedor.
- SQLite, snapshot, uploads y backups resuelven dentro del mismo montaje. `quick_check=ok`, snapshot idéntico a app_state, salud HTTP 200.
- Baseline orientativo: 153 socios, 7 members, 3 cursos y 5 grupos internos.
- 30 snapshots locales; Railway Backups muestra `No Backups`. Copia externa y restauración todavía NO verificadas.

**Gate B: COMPLETO — #259 y #263 verificadas y cerradas.**

Evidencia final tras autorización específica de Carlos (21:57 Europe/Madrid):
- Copia externa cifrada y kit privados guardados; descifrado, inventario de 366 archivos, SQLite, 3 uploads y arranque aislado verificados antes de reiniciar.
- Adjunto ficticio de 208 bytes guardado por autosave y conservado tras el Restart autorizado (~21:46), reload y posterior redeploy de configuración.
- Se cambió SOLO `IZ_BASE_URL` al dominio oficial, sin salto final. Railway mostró exactamente una variable; despliegue `69e8ec1c-880e-4dd9-b1b4-a7fb915cb22b` ACTIVE / successful, mismo SHA `6cb7577`.
- Descarga mediante clic en el enlace normal del campus después del redeploy: PASS, bytes idénticos y SHA-256 `26338a62592d090077326f460c7b1b93bc75ea11514c6123089824d73e0b3039`. Ver online muestra el contenido ficticio desde el origen oficial.
- A las 20:01:52 UTC: salud HTTP 200 con `ok:true`, SQLite `quick_check=ok`, snapshot idéntico. Montaje real ext4 rw en `/var/data/isocrona-zero`; DB/snapshot/uploads/backups en el mismo dispositivo.
- Hashes de associates/members/courses/campusGroups idénticos al baseline anterior; recuentos 153/7/3/5. Outbox 7 queued, 0 sending/sent/failed. No correos ni altas.
- Enlaces existentes de certificado/PDF/validación inspeccionados: dominio oficial. No se emitieron ni enviaron diplomas; no equivale a validar el recorrido completo de certificados/permisos.

Handoff en PR #262, rama separada y borrador. La autorización cubrió un Restart y este redeploy de configuración; no autoriza merge documental ni piloto. Ver bitácora del 15/10 para el histórico y la evidencia.

Si una comprobación de persistencia vuelve a fallar, reabrir #259 y Gate B antes de abrir el piloto.

## Gate C — QA productiva corta

Registrar PASS / FAIL reproducible / BLOQUEADO / NO APLICA.

- [x] `/healthz` correcto y SHA desplegado conocido (15/10 20:01:52 UTC tras redeploy, SHA 6cb7577; no acredita el resto de Gate C).
- [ ] Login/logout admin: logout y permanencia en acceso público tras reload PASS; nueva autenticación pendiente de credenciales seguras.
- [ ] Login/logout socio de prueba.
- [x] Modo socio desde administración y permisos visibles correctos: perfil/cursos/grupos revisados, sin controles de gestión; retorno a administración PASS. No sustituye el login de una cuenta socio independiente.
- [ ] Móvil ~390 px sin overflow bloqueante en login, inicio, cursos y perfil: BLOQUEADO en este navegador de ancho fijo; escritorio 1348 px comprobado por separado.
- [ ] Onboarding controlado sin duplicar cuenta/identidad.
- [ ] Inscripción a curso: estados, espera y justificante/reintento.
- [ ] #241: apertura configurada a 3–5 minutos; rechazo antes y aceptación desde el minuto correcto; edición muestra hora local correcta.
- [ ] Certificados/instructores: permisos, curso cerrado/finalizado y descarga correcta.
- [x] Grupos internos: adjunto ficticio seleccionado queda realmente persistido y reaparece tras reload con sesión recuperada y restart (bytes comprobados).
- [x] Grupos internos: Descargar usa el dominio oficial y devuelve bytes/hash idénticos después del redeploy; Ver online muestra el texto correcto desde el origen oficial (#263).
- [ ] No aparecen errores JS bloqueantes en los recorridos anteriores.

Evidencia de acceso/modo socio del 15/10 en la bitácora y PR #262. Descarga en modo socio: 208 bytes/hash original PASS; baseline operativo sin cambios a las 20:11:17 UTC. Nueva autenticación admin, cuenta socio independiente y viewport móvil siguen pendientes. Gate C PARCIAL.

## Gate D — piloto

Solo si A+B+C están verdes.

- [ ] Seleccionar 5–10 socios de confianza.
- [ ] Tener backup externo inmediatamente anterior.
- [ ] Alta/onboarding por lotes pequeños y verificables; no alta masiva completa.
- [ ] Confirmar acceso desde móvil de al menos dos socios.
- [ ] Confirmar una inscripción real controlada.
- [ ] Confirmar que no hay duplicados de identidad/cuenta.
- [ ] Registrar incidencias durante 24–48 h.
- [ ] Cero P1/P2 abiertos antes de ampliar.

## Escalado

1. 5–10 socios.
2. Si 24–48 h sin P1/P2: 20–30 socios.
3. Si sigue estable: apertura progresiva al resto.

#245 ya está integrada mediante #261. #248 permanece post-V1 y no bloquea el primer acceso controlado al Campus si los gates A+B+C están verdes.

## Rollback

Ante pérdida de datos, corrupción, duplicación de identidades, permisos incorrectos o fallo persistente de almacenamiento:
- detener nuevas altas/operaciones;
- no intentar reparaciones masivas sobre producción;
- conservar evidencia y SHA desplegado;
- restaurar únicamente desde procedimiento/backup probado y con autorización;
- reabrir el gate correspondiente antes de continuar.
