## Estado de prepublicacion - 2 abril 2026

### Bloqueos cerrados hoy

- `api/state` ya no se cae al entrar como administracion.
- El censo real vuelve a cargar correctamente para cuentas admin.
- Los adjuntos de `Grupos internos` ya no viajan enteros dentro del estado del campus.
- `Ver online` y `Descargar` siguen funcionando para adjuntos de grupos internos.
- La base URL publica del campus ya puede configurarse con `IZ_BASE_URL`.

### Causa del fallo principal

El estado completo del campus estaba creciendo demasiado por los adjuntos de `Grupos internos`, que se enviaban en base64 dentro de `api/state`.

Eso provocaba:

- respuestas enormes para administracion
- caidas del proceso al pedir el estado completo
- sensacion de que no habia socios o no cargaba el campus

### Solucion aplicada

- `api/state` ahora devuelve `campusGroups` compactados para transporte.
- Los adjuntos se sirven por una ruta dedicada:
  - `/api/campus-groups/attachment`
- Al guardar desde administracion, el backend reinyecta los adjuntos reales para no perder archivos.

### Comprobaciones pasadas

- `login` de Carlos: correcto
- `GET /api/state`: `200`
- tamaño de respuesta admin tras compactacion: manejable
- `GET /api/public-campus/courses`: `200`
- sintaxis:
  - `public/app.js`
  - `server.js`

### Siguiente foco recomendado

1. Pasada funcional completa:
   - administrador
   - socio y alumno
   - acceso solo campus

2. Revisar:
   - inscripcion a cursos
   - lista de espera
   - diploma y validacion publica
   - grupos internos con archivos reales

3. Solo despues:
   - entorno web de prueba
   - `IZ_BASE_URL` real
   - despliegue de preproduccion
