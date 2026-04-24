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
