# Alta masiva de accesos Campus (V1)

El lote solo puede iniciarlo administración y siempre sigue dos pasos: `POST /api/associates/onboarding/preview` y, con el token de 15 minutos recibido, `POST /api/associates/onboarding/execute` con `confirmed: true` y `associateIds` explícitos (1–20). El preview no escribe estado y clasifica fichas elegibles, ya vinculadas, sin email, con email inválido o duplicado y con incidencias. Devuelve `smtpReady`; sin SMTP configurado no se consume token ni se crea ninguna cuenta.

Antes de ejecutar en producción son obligatorios un backup externo recuperable, la revisión del preview y una autorización expresa. Las pruebas usan exclusivamente fixtures sintéticos; nunca deben apuntar al estado ni al SMTP reales.

La ejecución es secuencial. Crea una sola cuenta cuando falta y genera en ese momento una contraseña aleatoria mediante un generador criptográfico. La contraseña queda asociada a esa cuenta y un reintento SMTP no la rota ni crea otra cuenta. `mustChangePassword` es obligatorio hasta que la persona cambia la contraseña; el flujo existente limpia entonces `temporaryPassword`.

Los resultados del lote solo exponen identificadores y estados (`without_access`, `access_created`, `email_sent`, `email_error`), nunca credenciales. La bienvenida usa `https://portal.isocronazero.org`. Un fallo SMTP conserva la cuenta, registra el error y permite reintentar.

## Riesgo acotado de V1

La credencial temporal continúa almacenada en claro en la ficha hasta el primer cambio porque el correo de reintento necesita recuperar exactamente la credencial generada una sola vez. No debe aparecer en logs, listados o respuestas para socios. Eliminar esa persistencia exige un mecanismo de primer acceso por token y queda fuera de esta V1.

El outbox de bienvenida NUEVO guarda siempre un cuerpo redactado, incluso antes del envío; el texto con credencial solo se reconstruye en memoria dentro del transporte SMTP existente. Un fallo reutiliza el mismo registro de correo. El estado transportado a no-admin elimina `temporaryPassword`, y los cuerpos legacy se redactan en transporte. No se migran ni borran históricos reales: un backup antiguo puede contener credenciales heredadas y exige custodia privada.

## Reglas operativas

- Preview ligado al administrador, identidades, credenciales, estado de entrega y configuración SMTP; caduca en 15 minutos, se invalida con cambios y es de un solo uso. Cada ficha pendiente se compara con la revisada antes de su turno: si cambia durante otra entrega SMTP, se omite sin crear acceso ni enviar a una identidad nueva y requiere otro preview. Tras reiniciar hay que generar otro.
- SMTP también se compara antes de cada alta; si cambia o deja de estar configurado, se omiten los siguientes destinatarios antes de provisionar. Durante una bienvenida `sending`, el editor rechaza cambios de nombre/email y el reset no rota la contraseña, pero se permiten datos ajenos a la identidad; la reconciliación de entrega comprueba también destinatario y vínculo de alumno.
- Elegibles: Activa, Pendiente cuota y Revisar documentacion legacy con identidad mínima. Baja, solicitudes no aprobadas, estados desconocidos, links rotos, identidades ambiguas y gmail.con se bloquean.
- No adoptar cuentas/alumnos por email. Cuentas manuales o privilegiadas nunca reciben bienvenida por el lote. Solo un acceso member marcado por este onboarding, coherente, pendiente/fallido y con temporal válida admite retry.
- Selección inicial vacía; atajos 5/10/20 solo seleccionan. El servidor deduplica IDs, comprueba el subset y rechaza manipulaciones antes de consumir el token.
- Una ejecución simultánea por proceso, SMTP secuencial y persistencia antes del envío. Cada socio se revalida tras la espera anterior; la respuesta SMTP se combina con el estado recién leído. Los formularios completos obsoletos no borran accesos/outbox de onboarding.
- Los escritores de estado del servidor, incluida la cola SMTP y la automatización, preservan en el punto común de guardado los cambios concurrentes en registros de acceso/bienvenida. No se restaura una contraseña ni una cuenta borrada por un guardado atrasado. La restauración explícita de backup y la limpieza autorizada conservan su semántica de reemplazo.
- Los reintentos genéricos actualizan también el estado/fecha/error del socio; reutilizan la bienvenida fallida y no dejan una copia pendiente tras el envío correcto. Cada entrega de onboarding persiste `sending` y su resultado antes de liberar el bloqueo, sin esperar al guardado final de toda la cola.
- Si una cola espera otro correo antes de llegar a la bienvenida, el transporte vuelve a comparar identidad, cuenta, alumno, credencial y SMTP con el estado actual. Un cambio bloquea ese envío antes de contactar SMTP; no se envía una contraseña anterior al reset. El siguiente intento debe partir de una lectura nueva. El guardado atrasado conserva los cambios concurrentes de nombre y SMTP, además de acceso/outbox.
- El agente no genera ni ejecuta altas `associate_legacy_access`; los avisos antiguos también se rechazan sin crear acceso. Los accesos históricos por lote pasan por el preview/subset. Se mantienen los endpoints individuales explícitos existentes.
- Tras un reinicio, `queued`/`failed` reutilizan el registro existente; nunca crean otra bienvenida para ese intento. Si el proceso se interrumpe con un correo `sending`, todos los resolutores de bienvenida y transporte lo bloquean: revisar entrega con el proveedor antes de habilitar un reintento. El preview indica reconciliación manual. SMTP no ofrece garantía absoluta de entrega exactamente una vez (aceptación seguida de desconexión puede ser ambigua).
- V1 asume un único proceso escritor, como el almacenamiento actual. No desplegar múltiples réplicas para ejecutar lotes; los locks/tokens en memoria no son distribuidos.

## Barrera de producción

No ejecutar cuentas/correos reales hasta tener backup externo recuperable verificado, dry-run real revisado y autorización expresa de Carlos. Comprobar primero que el censo ya está en `state.associates`; el onboarding NO importa Excel. El censo leído en una hoja no demuestra qué contiene producción.

El export privado de `/api/storage/export-state` permite rollback lógico de esta operación; no incluye uploads, sesiones recordadas ni una copia integral del volumen. Ensayar restauración aislada. Las copias dentro del mismo volumen no sustituyen una externa.

Tras merge/deploy revisados: confirmar recepción del test SMTP existente; revisar preview real y cuentas manuales; autorizar piloto 5–10; comprobar login/cambio de clave; continuar solo en lotes de hasta 20. No inferir autorización a partir del botón de confirmación.

## Validación

`npm run check:associate-onboarding` usa estado temporal y SMTP localhost; comprueba identidad, permisos, categorías, tokens, SMTP ausente/fallido, retry sin duplicados, redacción, cambio de clave, guardado obsoleto, concurrencia, reinicio y rollback. Está integrado en `check:app`. Completar con frontend syntax y smoke sobre servidor aislado.
