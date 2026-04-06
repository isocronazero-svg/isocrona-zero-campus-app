# Render paso a paso

## Objetivo
Publicar el campus en una URL de prueba tipo:

- `https://campus-test.isocronazero.org`

sin mezclarlo con WordPress y sin perder datos.

## Antes de empezar

Necesitas:

- una cuenta en Render
- el proyecto subido a GitHub
- acceso al DNS del dominio para apuntar el subdominio

## 1. Subir el proyecto a GitHub

En el proyecto ya esta preparado:

- [C:\Users\charl\OneDrive\Desktop\Isocrona Zero\.gitignore](C:\Users\charl\OneDrive\Desktop\Isocrona Zero\.gitignore)

para no subir:

- `node_modules`
- `.env`
- bases de datos locales
- backups
- adjuntos reales
- logs

## 2. Crear el servicio en Render

En Render:

1. `New +`
2. `Web Service`
3. conectar el repositorio
4. usar estos valores:

- Runtime: `Node`
- Build Command: `npm install`
- Start Command: `npm start`

## 3. Configurar variables

Pon como minimo:

- `PORT=3210`
- `IZ_BASE_URL=https://campus-test.isocronazero.org`
- `IZ_DATA_DIR=/var/data/isocrona-zero`
- `IZ_ASSOCIATE_SELF_EDIT_DAYS=30`
- `AUTOMATION_INTERVAL_MS=300000`

Si quieres correo real:

- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_SECURE`
- `SMTP_USER`
- `SMTP_PASS`
- `SMTP_FROM`

## 4. Anadir disco persistente

Esto es obligatorio para no perder:

- socios
- cursos
- diplomas
- avisos
- adjuntos

En Render:

1. abre el servicio
2. `Disks`
3. `Add Disk`
4. monta el disco en:

- `/var/data/isocrona-zero`

Tamano recomendado:

- `5 GB`

## 5. Publicar

Render levantara el servicio y debe quedar comprobable en:

- `/healthz`

## 6. Poner el dominio

En Render:

1. `Settings`
2. `Custom Domains`
3. anadir:

- `campus-test.isocronazero.org`

## 7. Configurar DNS

En el proveedor DNS del dominio:

- crear el registro que te pida Render para ese subdominio

## 8. Pasar humo

Cuando el dominio responda, comprobar:

- `https://campus-test.isocronazero.org/healthz`

Y luego:

- portada
- login admin
- login socio
- `Mi panel`
- `Campus > Avisos`
- `Cursos`
- `Mis diplomas`
- `Grupos internos`

## 9. Recordatorio importante

WordPress y el campus no tienen que vivir en el mismo runtime.

La idea correcta es:

- `www.isocronazero.org` o `campus.isocronazero.org` en WordPress, si asi lo quereis
- `campus-test.isocronazero.org` en Render para la prueba del campus Node

## 10. Cuando pase bien

Despues se decide:

- dejar Render como servicio final
- o migrarlo mas adelante a VPS
