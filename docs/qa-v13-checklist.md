# QA V1.3 — camisetas, exportaciones y diplomas bilingües

## Entorno aislado (09/11/2026)
- Railway proyecto `isocrona-v13-qa-aislado` (`d0ca2d37-a0bb-431d-a389-27be6160bd6f`), entorno `qa`.
- Servicio `portal-v13-qa` (`c80d2dc4-16b8-4834-98c7-4cb7a8674e2d`).
- Volumen **exclusivo de QA** `v13-qa-only-data`, 1 GB, montado en `/var/data/isocrona-zero`; variable `IZ_DATA_DIR` apuntando a ese directorio.
- `NODE_ENV=development` solo para este entorno de pruebas; **nunca reutilizar en producción**.
- Commit fijado: `7c23c38720f61ac3348ef181007193f07b7fc9c8`. Despliegue `bd665d0c-2265-4337-8f0f-107c2cea7b4d`: SUCCESS; estado online, una réplica, cero alertas.
- `IZ_QA_ISOLATED=true` impide los envíos de correo SMTP y Resend, incluso los de prueba, mediante `server/mail-delivery.js`; prueba automática `scripts/check-v13-qa-mail-guard.mjs` integrada en la batería específica V1.3.
- `IZ_EMAIL_ENABLED=false` está configurada en Railway QA como defensa adicional; no sustituye la protección por `IZ_QA_ISOLATED` para SMTP.
- Sin dominio público. **No generar dominio mientras no exista una barrera de acceso adicional verificada.**
- En la rama V1.3, `server/fixture-account-policy.js` bloquea autenticación con cuentas o contraseñas del fixture si `IZ_QA_ISOLATED=true`, incluso bajo `NODE_ENV=development`. Prueba `scripts/check-v13-qa-fixture-auth.mjs` incorporada a CI. **Esta corrección no sustituye la barrera externa ni demuestra que el volumen persistente esté saneado.**
- No compartir secretos, bases de datos, volúmenes ni credenciales con el portal de socios de producción.

## Automatización superada
- GitHub Actions «App checks» y «V1.3 regression checks» en commit `7c23c38`: success.
- Esto NO sustituye la prueba real de los flujos con sesión iniciada.

## Pruebas funcionales pendientes (usar únicamente cuentas y socios ficticios)
- [ ] Preparar acceso temporal restringido, sin exponer cuentas demo a Internet; documentar responsable y retirada del acceso.
- [ ] Alta/identificación de socio ficticio y vinculación correcta con su ficha.
- [ ] GET de preferencias iniciales y PATCH con talla, corte, sexo opcional e idioma. Recargar y confirmar persistencia tras reinicio.
- [ ] Confirmación de camiseta sin talla/corte: error claro. Cambio de talla después de confirmar: confirmar que se invalida la confirmación anterior.
- [ ] Cambiar a `es-va` y verificar diploma individual y certificado acumulado, anverso y reverso; cambiar a `es` y verificar que no queda texto valenciano.
- [ ] Administrador: descargar Excel de camisetas y de idiomas; comprobar nombres, tallas, confirmaciones y caracteres especiales.
- [ ] Socio sin privilegios y usuario sin sesión: exportaciones bloqueadas (403/401 según mecanismo de sesión).
- [ ] Cerrar sesión mientras carga preferencias; no mostrar datos después del cierre. Reabrir con otra cuenta y comprobar aislamiento.
- [ ] Abrir/cerrar formulario varias veces mientras una solicitud tarda; no reescribir valores con respuestas obsoletas.
- [ ] Verificar navegación móvil y escritorio y mensajes de error ante pérdida de red.
- [ ] Revisar logs, salud, almacenamiento y ausencia de datos reales en QA.

## Criterio de publicación
No fusionar PR #349 ni publicar en `main` hasta completar las casillas, confirmar los permisos y dejar evidencia del resultado. No trasladar a producción las variables `NODE_ENV=development` ni ninguna excepción de seguridad para cuentas demo.

## Preparación segura antes de abrir QA al navegador
1. La plantilla existente `.env.qa.example` exige `NODE_ENV=production`, `IZ_DEFAULT_STATE_PATH=/app/data/qa-private-seed.json` e `IZ_EMAIL_ENABLED=false`; el archivo `data/qa-private-seed.json` se verifica sin cuentas ni socios precargados.
2. **No basta con cambiar `NODE_ENV` en el servicio ya iniciado**: el volumen persistente puede contener un estado previo con administrador demo. Comprobar y sanear primero el estado del volumen QA, sin afectar jamás el volumen de producción. Si no puede verificarse, preparar un volumen QA nuevo y vacío.
3. Configurar `IZ_BOOTSTRAP_ADMIN_EMAIL` y `IZ_BOOTSTRAP_ADMIN_PASSWORD` como secretos privados de Railway, nunca en Git. Estas variables se consumen desde `db.js` **solo si `NODE_ENV=production`**; en el QA actual (`development`) no crean el administrador. No cambiar a producción sin comprobar primero el volumen y el arranque. Confirmar que no hay otras cuentas demo accesibles.
4. Añadir una barrera externa de acceso (autenticación previa o red restringida) y verificarla **antes** de generar un dominio público. Una contraseña en el login de la aplicación por sí sola no equivale a restringir la exposición del entorno.
5. Tras cambiar configuración, ejecutar las pruebas de login, autorización y persistencia con datos ficticios; comprobar que no se envían correos.
6. Retirar el dominio temporal y las credenciales de prueba al finalizar.
