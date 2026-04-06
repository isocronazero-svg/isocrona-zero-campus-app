# Despliegue web del campus

## Recomendacion actual
Para la primera publicacion de prueba, usar una de estas dos opciones:

- subdominio:
  - `https://campus.isocronazero.org`
- o dominio/ruta servida como raiz real del servicio:
  - `https://www.isocronazero.org` con proxy dedicado al campus

## Importante
Ahora mismo el frontend sigue usando muchas rutas absolutas tipo:

- `/api/...`
- `/join.html`
- `/verify.html`

Eso significa que la opcion mas segura en esta fase es:

- **subdominio propio**
- o **proxy en raiz**

Si se quisiera montar exactamente en una subruta como:

- `https://www.isocronazero.org/campus`

habria que hacer una pasada adicional para soportar `base path` en:

- frontend
- enlaces internos
- fetch a la API
- archivos publicos

## Variables clave
Definir en `.env`:

- `PORT`
- `IZ_BASE_URL`
- `IZ_ASSOCIATE_SELF_EDIT_DAYS`
- parametros SMTP si se quiere correo real

Ejemplo de `IZ_BASE_URL`:

- `https://campus.isocronazero.org`

## Orden recomendado
1. Publicar primero en una URL de prueba.
2. Revisar login, socios, cursos, inscripciones y diplomas.
3. Activar SMTP real.
4. Abrir a pruebas internas.
5. Luego decidir si se mantiene en subdominio o se adapta a una subruta de la web principal.
