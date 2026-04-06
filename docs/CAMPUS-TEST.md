# Campus test - salida a web

## URL recomendada
Para la primera prepublicacion, usar una URL propia del campus:

- `https://campus-test.isocronazero.org`

Tambien valdria un subdominio equivalente. En esta fase sigue siendo mejor que una subruta tipo `/campus-test`.

## Preparacion minima

1. Copiar:
   - [C:\Users\charl\OneDrive\Desktop\Isocrona Zero\.env.campus-test.example](C:\Users\charl\OneDrive\Desktop\Isocrona Zero\.env.campus-test.example)
   - a `.env`
2. Ajustar:
   - `IZ_BASE_URL`
   - `SMTP_*`
3. Arrancar el servicio con:
   - [C:\Users\charl\OneDrive\Desktop\Isocrona Zero\iniciar-campus-test.bat](C:\Users\charl\OneDrive\Desktop\Isocrona Zero\iniciar-campus-test.bat)
   - o `npm start`

## Comprobaciones minimas

### Salud del servicio
- `GET /healthz`
- ejemplo local: [http://localhost:3210/healthz](http://localhost:3210/healthz)

### Humo minimo
- Portal de entrada
- Login de socio
- Login de admin
- Alta `solo campus`
- Cursos publicos
- Grupos internos
- Diploma y validacion publica

## Checklist corta de salida

1. `IZ_BASE_URL` apunta a la URL real de pruebas.
2. `healthz` responde `ok: true`.
3. Carlos entra como admin y como socio.
4. Un usuario `solo campus` entra y ve solo lo que toca.
5. El correo de bienvenida y los enlaces publicos ya no apuntan a `localhost`.

## Recomendacion
No abrir todavia como produccion final general. Primero usar `campus-test` con pruebas internas.
