# Despliegue en Railway

## Recomendacion

Para una `prepublicacion` rapida del campus, Railway es una buena alternativa si Render esta dando problemas con la tarjeta o el alta.

## Importante antes de publicar

Este campus guarda datos vivos en disco:

- `campus.db`
- `state.json`
- `uploads/`

Por eso en Railway hay que usar:

- un `Volume`

si no, al reiniciar o redeplegar se perderan socios, cursos, diplomas y adjuntos.

## Variables de entorno minimas

- `PORT=3210`
- `IZ_BASE_URL=https://campus-test.isocronazero.org`
- `IZ_DATA_DIR=/data/isocrona-zero`
- `IZ_ASSOCIATE_SELF_EDIT_DAYS=30`
- `AUTOMATION_INTERVAL_MS=300000`

SMTP opcional para correo real:

- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_SECURE`
- `SMTP_USER`
- `SMTP_PASS`
- `SMTP_FROM`

## Comandos

Railway deberia detectar Node de forma automatica.

Si te pide comandos manuales:

- Build: `npm install`
- Start: `npm start`

## Volume

El volume debe montarse de forma que el proyecto pueda escribir en:

- `/data/isocrona-zero`

Ese mismo valor debe ponerse en:

- `IZ_DATA_DIR`

## Dominio

Despues del despliegue:

1. anadir dominio personalizado
2. usar:
   - `campus-test.isocronazero.org`
3. apuntar DNS segun las instrucciones de Railway

## Comprobaciones minimas

1. abrir `/healthz`
2. revisar:
   - portada
   - login admin
   - login socio
   - `Mi panel`
   - `Campus > Avisos`
   - `Cursos`
   - `Mis diplomas`
   - `Grupos internos`

## Idea recomendada

1. publicar primero en Railway
2. validar internamente `campus-test`
3. luego decidir si se queda en Railway o se migra a VPS
