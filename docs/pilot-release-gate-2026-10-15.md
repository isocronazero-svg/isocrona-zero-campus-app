# Gate de apertura — piloto de socios

Fecha: 15/10/2026

Objetivo: decidir con evidencia si el Campus puede abrirse a un primer grupo de 5–10 socios reales. Este documento no autoriza despliegues, reinicios, cambios de variables, altas reales ni envíos de correo.

## Gate A — código

- [ ] PR #260 sincronizada con `main` sin reescritura forzada.
- [ ] `npm run check:app` verde sobre el HEAD final.
- [ ] `npm run smoke:campus-test` verde sobre el HEAD final.
- [ ] Sin findings P1/P2 abiertos en #260.
- [ ] Merge de #260 expresamente autorizado.
- [ ] SHA integrado identificado y registrado.

## Gate B — persistencia Railway

Bloqueante para socios reales.

- [ ] Servicio productivo y entorno correctos identificados.
- [ ] `IZ_DATA_DIR` no vacío.
- [ ] `IZ_DATA_DIR` apunta dentro de un Railway Volume persistente.
- [ ] Evidencia autenticada de almacenamiento confirma DB/app_state/uploads dentro del volumen.
- [ ] Backup externo recuperable realizado antes de operaciones reales.
- [ ] Archivo sintético subido y recuperable antes del reinicio/redeploy.
- [ ] Restart/redeploy solo tras autorización expresa.
- [ ] El mismo archivo sintético sigue disponible después del restart/redeploy.
- [ ] Estado de socios/cursos no cambia tras la prueba.

Si cualquiera de estas comprobaciones falla: NO abrir piloto; #259 permanece P1 de release.

## Gate C — QA productiva corta

Registrar PASS / FAIL reproducible / BLOQUEADO / NO APLICA.

- [ ] `/healthz` correcto y SHA desplegado conocido.
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

#245 (asistencia/cierre presencial) y #248 (histórico/prioridad) mejoran la operativa de jornadas, pero no bloquean el primer acceso controlado al Campus si los gates A+B+C están verdes.

## Rollback

Ante pérdida de datos, corrupción, duplicación de identidades, permisos incorrectos o fallo persistente de almacenamiento:
- detener nuevas altas/operaciones;
- no intentar reparaciones masivas sobre producción;
- conservar evidencia y SHA desplegado;
- restaurar únicamente desde procedimiento/backup probado y con autorización;
- reabrir el gate correspondiente antes de continuar.