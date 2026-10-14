# Alta masiva de accesos Campus (V1)

El lote solo puede iniciarlo administración y siempre sigue dos pasos: `POST /api/associates/onboarding/preview` y, con el token de 15 minutos recibido, `POST /api/associates/onboarding/execute` con `confirmed: true`. El preview no escribe estado y clasifica fichas elegibles, ya vinculadas, sin email, con email inválido o duplicado y con incidencias.

Antes de ejecutar en producción son obligatorios un backup externo recuperable, la revisión del preview y una autorización expresa. Las pruebas usan exclusivamente fixtures sintéticos; nunca deben apuntar al estado ni al SMTP reales.

La ejecución es secuencial. Crea una sola cuenta cuando falta y genera en ese momento una contraseña aleatoria mediante un generador criptográfico. La contraseña queda asociada a esa cuenta y un reintento SMTP no la rota ni crea otra cuenta. `mustChangePassword` es obligatorio hasta que la persona cambia la contraseña; el flujo existente limpia entonces `temporaryPassword`.

Los resultados del lote solo exponen identificadores y estados (`without_access`, `access_created`, `email_sent`, `email_error`), nunca credenciales. La bienvenida usa `https://portal.isocronazero.org`. Un fallo SMTP conserva la cuenta, registra el error y permite reintentar.

## Riesgo acotado de V1

La credencial temporal continúa almacenada en claro en la ficha hasta el primer cambio porque el correo de reintento necesita recuperar exactamente la credencial generada una sola vez. No debe aparecer en logs, listados o respuestas para socios. Eliminar esa persistencia exige un mecanismo de primer acceso por token y queda fuera de esta V1.
