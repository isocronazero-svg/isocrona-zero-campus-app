# Despliegue en Render

## Recomendacion
Para publicar el campus en Render sin perder socios, cursos, diplomas ni adjuntos, hay que usar:

- `Web Service` de Node.js
- `Persistent Disk`

Este proyecto guarda su estado real en:

- `campus.db`
- `state.json`
- `uploads/`

Si no montas disco persistente, esos datos se perderan al reiniciar o volver a desplegar.

## URL recomendada

- prueba interna: `https://campus-test.isocronazero.org`

## Variables de entorno minimas

- `PORT=3210`
- `IZ_BASE_URL=https://campus-test.isocronazero.org`
- `IZ_DATA_DIR=/var/data/isocrona-zero`
- `IZ_ASSOCIATE_SELF_EDIT_DAYS=30`
- `AUTOMATION_INTERVAL_MS=300000`

SMTP opcional para correo real:

- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_SECURE`
- `SMTP_USER`
- `SMTP_PASS`
- `SMTP_FROM`

## Disco persistente

Montar un disco en:

- `/var/data/isocrona-zero`

Ese mismo valor debe ponerse en:

- `IZ_DATA_DIR`

## Comandos del servicio

- Build Command: `npm install`
- Start Command: `npm start`
- Health Check Path: `/healthz`

## Flujo recomendado

1. Crear servicio en Render desde el repositorio
2. Configurar las variables de entorno
3. Anadir el disco persistente
4. Publicar
5. Comprobar:
   - `/healthz`
   - portada
   - login admin
   - login socio
   - `Mi panel`
   - `Mis diplomas`
   - `Grupos internos`

## DNS

Cuando Render te de la URL del servicio, apuntar:

- `campus-test.isocronazero.org`

hacia ese servicio desde DNS.

## Importante

La primera vez que arranque con un disco vacio:

- el campus sembrara la base desde `default-state.json`

Los archivos del proyecto siguen saliendo del repo.
Los datos vivos del campus salen del disco persistente.

## Guia practica

Si quieres hacerlo paso a paso sin perderte:

- [C:\Users\charl\OneDrive\Desktop\Isocrona Zero\docs\RENDER-PASO-A-PASO.md](C:\Users\charl\OneDrive\Desktop\Isocrona Zero\docs\RENDER-PASO-A-PASO.md)
