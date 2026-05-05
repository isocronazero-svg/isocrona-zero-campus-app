# Isocrona Zero Campus

## Configuracion de PostgreSQL SSL

- `DATABASE_URL`: cadena de conexion de PostgreSQL
- `DATABASE_SSL`: activa SSL cuando vale `true`
- `DB_SSL_ALLOW_SELF_SIGNED`: permite certificados self-signed solo en desarrollo
- `NODE_ENV`: entorno de ejecucion

## Reglas

- Si `DATABASE_SSL=false`, no usa SSL
- Si `DATABASE_SSL=true`, usa SSL con validacion estricta por defecto
- `DB_SSL_ALLOW_SELF_SIGNED=true` solo debe usarse en desarrollo
- En `production`, no se permite `DB_SSL_ALLOW_SELF_SIGNED=true`

## Comprobacion minima de frontend

- Ejecuta `npm run check:frontend-syntax` para validar la sintaxis de `public/app.js` antes de fusionar cambios del frontend.

## Comprobacion minima de app

- Ejecuta `npm run check:app` antes de fusionar cambios para validar:
  - sintaxis de `public/app.js`
  - sintaxis de `server.js`
  - sintaxis de `storage.js`
  - ausencia de marcadores de conflicto en `public/app.js`, `server.js`, `storage.js`, `package.json` y `README.md`
  - smoke checks live de Tests independientes

## Deploy / Produccion

### Variables obligatorias

- `NODE_ENV=production`
- `IZ_BASE_URL=https://...`
- `IZ_DATA_DIR=...`
- `IZ_RECOVERY_ADMIN_EMAIL=...`
- `IZ_RECOVERY_ADMIN_PASSWORD=...`

### Variables recomendadas

- `PORT`
- `AUTOMATION_INTERVAL_MS`
- `IZ_ASSOCIATE_SELF_EDIT_DAYS`
- `DATABASE_URL` si se usa PostgreSQL
- `DATABASE_SSL`
- `DB_SSL_ALLOW_SELF_SIGNED`
- SMTP:
  - `SMTP_HOST`
  - `SMTP_PORT`
  - `SMTP_SECURE`
  - `SMTP_USER`
  - `SMTP_PASS`
  - `SMTP_FROM`

### Checklist antes de publicar

- Ejecutar `npm run check:app`
- Confirmar que `IZ_BASE_URL` usa `https://`
- Confirmar que `IZ_DATA_DIR` apunta a un disco persistente
- Guardar un export inicial del estado antes de abrir la app a usuarios reales
- Confirmar acceso con cuenta admin normal y con recovery admin
- Confirmar que SMTP esta configurado o que la operacion se hara en modo manual
- Probar un smoke manual de live con 2 usuarios

### Smoke manual post-deploy

- Abrir `/healthz`
- Hacer login admin
- Hacer login member
- Crear un test independiente
- Crear una sesion live
- Unir un member con PIN
- Responder una pregunta live
- Finalizar la sesion live
- Exportar el estado
- Revisar la consola del navegador

### Backups y rollback

- Hacer un export manual antes de cada deploy
- Mantener un snapshot diario fuera del host
- Si el deploy falla, volver al commit anterior
- Restaurar el ultimo export valido si el estado queda dudoso
- Congelar automatizaciones antes de restaurar si hay dudas sobre el estado persistido

### Notas de seguridad

- `IZ_RECOVERY_ADMIN_PASSWORD` debe ser fuerte y mantenerse fuera del repo
- No publicar con `IZ_BASE_URL=http://...`
- La cookie `iz_session` usa `Secure` en despliegues HTTPS o `NODE_ENV=production`
- No subir el `.env` real al repo
