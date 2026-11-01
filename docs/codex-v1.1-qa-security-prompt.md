# Prompt para Codex · hardening QA V1.1

Trabaja en el repositorio `isocronazero-svg/isocrona-zero-campus-app`, exclusivamente sobre la rama `feature/v1.1` y el PR #292. No tocar `main`, no fusionar, no desplegar producción y no modificar el volumen/datos productivos.

## Objetivo

Resolver el issue #299: separar definitivamente los fixtures públicos de CI de cualquier credencial utilizable en un entorno QA/producción.

## Contexto ya preparado

- El repositorio es público.
- Railway QA: proyecto `isocrona-zero-v1-1-qa`, entorno `qa`, servicio `portal-v1-1-qa`.
- El dominio público del QA ha sido eliminado; actualmente no debe quedar accesible desde Internet.
- QA tiene volumen propio, separado de producción.
- Existe `data/qa-private-seed.json`: seed limpio, sin cuentas, contraseñas ni datos personales.
- Existe `docs/v1.1-qa-security.md` con las reglas de seguridad.
- `storage.js` ya soporta `IZ_DEFAULT_STATE_PATH`.
- El mecanismo existente de bootstrap usa `IZ_BOOTSTRAP_ADMIN_EMAIL`, `IZ_BOOTSTRAP_ADMIN_PASSWORD` e `IZ_BOOTSTRAP_ADMIN_NAME`.
- `check-production-demo-admin-guard.mjs` ya protege el admin demo histórico, pero hay que ampliar el concepto a todas las cuentas demo/fixtures.

## Trabajo requerido

1. Inspecciona primero `db.js`, `server/auth.js`, `storage.js`, `data/default-state.json`, `scripts/check-production-demo-admin-guard.mjs` y todos los checks que dependan de las cuentas demo.

2. Define una política centralizada de cuentas fixture/demo. Evita listas duplicadas repartidas por el código. Debe distinguir claramente:
   - entorno `test/development`: fixtures permitidos para CI/local;
   - entorno `production`: ningún fixture/demo puede autenticarse, salvo que exista una excepción de emergencia explícita y muy acotada ya soportada para recuperación.

3. Amplía la protección productiva para que no bloquee solo `admin@isocronazero.org`: también debe impedir login/uso de las cuentas miembro/instructor demo del `default-state.json` cuando `NODE_ENV=production`.

4. Mantén compatibilidad con los tests históricos. Si conviene, migra progresivamente identidades demo a `example.test`, pero no hagas una sustitución masiva ciega. Prioridad: seguridad productiva + CI verde.

5. QA privado:
   - deja preparado que `IZ_DEFAULT_STATE_PATH=/app/data/qa-private-seed.json` pueda inicializar un volumen QA limpio;
   - el seed no debe contener cuentas ni contraseñas;
   - el admin QA real se crea únicamente con `IZ_BOOTSTRAP_ADMIN_*` desde variables secretas de Railway;
   - no escribas ninguna contraseña QA en GitHub, logs, docs o tests.

6. Añade o amplía regresiones para demostrar como mínimo:
   - producción con admin demo histórico => bloqueada/rechazada;
   - producción con member demo => no puede autenticarse;
   - producción con instructor/demo adicional => no puede autenticarse;
   - producción con bootstrap admin no-demo => arranca y login correcto;
   - `test/development` conserva fixtures necesarios para los checks;
   - `data/qa-private-seed.json` tiene `accounts: []` y no contiene campos de password/email de usuarios;
   - no se imprimen secretos bootstrap en logs.

7. Ejecuta `npm run check:app` y el smoke completo. No des por terminado el trabajo con checks parciales.

8. Revisa que el PR #292 siga en borrador y que producción Railway siga conectada a `main` sin cambios.

## Criterios de aceptación

- Cero credenciales QA privadas en GitHub.
- Ninguna cuenta fixture pública puede iniciar sesión con `NODE_ENV=production`.
- Seed QA limpio y utilizable mediante `IZ_DEFAULT_STATE_PATH`.
- CI completa verde.
- Sin regresiones en V1.1.
- No tocar producción.

## Informe final

Devuelve:
- commits realizados;
- archivos modificados;
- explicación de la política demo/QA;
- tests nuevos/modificados;
- resultado exacto de `npm run check:app` y smoke;
- cualquier paso manual que quede en Railway (especialmente introducir los secretos `IZ_BOOTSTRAP_ADMIN_*`, que deben ser introducidos por el usuario y nunca por el código).
