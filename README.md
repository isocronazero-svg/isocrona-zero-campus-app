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
