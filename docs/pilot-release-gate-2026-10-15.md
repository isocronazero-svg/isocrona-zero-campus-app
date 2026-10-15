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
- [ ] Backup externo recuperable realizado antes de operaciones reales.
- [ ] Archivo sintético subido y recuperable antes del reinicio/redeploy.
- [ ] Restart/redeploy solo tras autorización expresa.
- [ ] El mismo archivo sintético sigue disponible después del restart/redeploy.
- [ ] Estado de socios/cursos no cambia tras la prueba.

Evidencia autenticada 15/10, 21:12 Europe/Madrid:
- `zealous-warmth / production / isocrona-zero-campus-test`, dominio `https://portal.isocronazero.org`.
- SHA activo `6cb7577fd9773da2a8dba41c2e9884407c56f472`; despliegue `1ec54a54-e130-458e-a364-6f6025f1f2c9`.
- Mount Path del Volume e `IZ_DATA_DIR`: `/var/data/isocrona-zero`. Montaje real ext4 rw confirmado desde el contenedor.
- SQLite, snapshot, uploads y backups resuelven dentro del mismo montaje. `quick_check=ok`, snapshot idéntico a app_state, salud HTTP 200.
- Baseline orientativo: 153 socios, 7 members, 3 cursos y 5 grupos internos.
- 30 snapshots locales; Railway Backups muestra `No Backups`. Copia externa y restauración todavía NO verificadas.

**Gate B: PARCIAL.** No cerrar #259 ni abrir piloto. Falta copia externa privada y prueba de adjunto antes/después de reinicio autorizado. Ver bitácora del 15/10 para evidencia y secuencia.

Handoff en rama separada: fusionar documentación en main dispara autodeploy; no hacerlo sin autorización específica.

Si cualquiera de estas comprobaciones falla: NO abrir piloto; #259 permanece P1 de release.

## Gate C — QA productiva corta

Registrar PASS / FAIL reproducible / BLOQUEADO / NO APLICA.

- [x] `/healthz` correcto y SHA desplegado conocido (15/10 21:12, SHA 6cb7577; no acredita el resto de Gate C).
- [ ] Login/logout admin.
- [ ] Login/logout socio de prueba.
- [ ] Modo socio desde administración y permisos visibles correctos.
- [ ] Móvil ~390 px sin overflow bloqueante en login, inicio, cursos y perfil.
- [ ] Onboarding controlado sin duplicar cuenta/identidad.
- [ ] Inscripción a curso: estados, espera y justificante/reintento.
- [ ] #241: apertura configurada a 3–5 minutos; rechazo antes y aceptación desde el minuto correcto; edición muestra hora local correcta.
- [ ] Certificados/instructores: permisos, curso cerrado/finalizado y descarga correcta.
- [ ] Grupos internos: adjunto seleccionado queda realmente persistido y reaparece tras reload/relogin.
- [ ] No aparecen errores JS bloqueantes en los recorridos anteriores.

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
