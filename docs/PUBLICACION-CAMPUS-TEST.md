# Publicacion de `campus-test`

## Objetivo
Subir el campus a una URL de prueba interna antes de abrirlo como produccion final.

URL recomendada:

- `https://campus-test.isocronazero.org`

## Recomendacion tecnica
En esta fase, publicar en:

- subdominio propio
- servicio Node separado de WordPress
- preferiblemente `Railway`, `Render` o un `VPS`

No usar todavia:

- `https://www.isocronazero.org/campus`

porque el frontend y la API trabajan mejor en raiz propia.

## Si usas Render

Usa esta guia:

- [C:\Users\charl\OneDrive\Desktop\Isocrona Zero\docs\RENDER.md](C:\Users\charl\OneDrive\Desktop\Isocrona Zero\docs\RENDER.md)

Y recuerda una condicion clave:

- montar `Persistent Disk`

porque el campus guarda datos vivos en base local y adjuntos.

## Si usas Railway

Usa esta guia:

- [C:\Users\charl\OneDrive\Desktop\Isocrona Zero\docs\RAILWAY.md](C:\Users\charl\OneDrive\Desktop\Isocrona Zero\docs\RAILWAY.md)

Y recuerda lo mismo:

- montar `Volume`

si no, el campus perdera los datos al reiniciar.

## Lo que hace falta antes de subir

1. Copiar [C:\Users\charl\OneDrive\Desktop\Isocrona Zero\.env.campus-test.example](C:\Users\charl\OneDrive\Desktop\Isocrona Zero\.env.campus-test.example) a `.env`
2. Ajustar:
   - `IZ_BASE_URL`
   - `PORT`
   - `IZ_DATA_DIR`
   - `SMTP_*`
   - `IZ_ASSOCIATE_SELF_EDIT_DAYS`
3. Comprobar que la base de datos y `data/` persistente esten en la maquina o disco que publicara el servicio
4. Arrancar el servicio con:
   - `npm start`
   - o [C:\Users\charl\OneDrive\Desktop\Isocrona Zero\iniciar-campus-test.bat](C:\Users\charl\OneDrive\Desktop\Isocrona Zero\iniciar-campus-test.bat)

## DNS y proxy

### DNS
Crear un registro para:

- `campus-test.isocronazero.org`

apuntando al servidor donde vaya a correr `node server.js`.

### Proxy inverso
El proxy debe enviar el trafico HTTPS al puerto interno del campus.

Ejemplo de idea:

- `https://campus-test.isocronazero.org` -> `http://127.0.0.1:3210`

## Comprobaciones minimas despues de subir

1. Abrir:
   - `/healthz`
2. Confirmar:
   - `ok: true`
3. Revisar:
   - portal de entrada
   - login admin
   - login socio
   - acceso `solo campus`
   - cursos publicos
   - grupos internos
   - diplomas

## Humo recomendado

### Admin
- entrar como `Carlos`
- abrir `Socios y cuotas`
- abrir un curso
- entrar en `Diplomas`

### Socio/alumno
- `Mi panel`
- `Campus > Avisos`
- `Campus > Cursos`
- `Mis diplomas`

### Solo campus
- alta desde portada
- ver cursos publicos
- comprobar que no ve grupos internos ni ficha de socio

## Punto de no retorno todavia
Aunque `campus-test` salga bien, no abrir aun como produccion final general sin:

- SMTP real verificado
- una pasada funcional completa
- y una revision corta de enlaces, avisos y diplomas

## Decision recomendada
Publicar primero `campus-test`, probar internamente, y despues decidir:

- mantener subdominio propio
- o adaptar mas adelante a la web principal
