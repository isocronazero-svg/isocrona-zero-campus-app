# Correo del campus con Resend (Railway Hobby)

## Estado

Integración por HTTPS para diplomas, bienvenidas y avisos que usan el envío común del campus. SMTP sigue disponible para instalaciones que lo soporten. El proveedor se elige explícitamente en el servidor; no se cambia automáticamente al detectar una clave.

La configuración inicial de Resend está **en pausa**. Tener una clave y un remitente no habilita envíos a socios. El endpoint administrativo de prueba funciona durante esa pausa y únicamente utiliza el destinatario configurado para la prueba.

La clave se lee del entorno del servidor. No se guarda en SQLite, snapshots, formularios, respuestas de `/api/state` ni la bitácora. El estado visible para administración muestra proveedor, remitente, dirección de respuesta y si está activo/en pausa. Las cuentas de socio no reciben esa configuración.

## Preparación de cuenta y dominio

1. Acceder o crear la cuenta de la asociación en Resend. El titular completa la autenticación y cualquier aceptación contractual.
2. Añadir y verificar `isocronazero.org` para el remitente propuesto `campus@isocronazero.org`. Si se opta por un subdominio de envío, cambiar el remitente para que pertenezca al dominio verificado.
3. Copiar **los registros exactos que muestre Resend** en el DNS del dominio. No inventar valores de DKIM/SPF ni sustituir registros MX de recepción existentes. Los registros del subdominio de retorno que pida el proveedor se distinguen del MX del buzón habitual. No hace falta habilitar recepción de correo en Resend.
4. Crear una clave limitada a envío y al dominio verificado. Introducirla directamente en las variables privadas de Railway, sin copiarla al chat, GitHub ni capturas.
5. Las respuestas se dirigen al Gmail de la asociación mediante `reply_to`; esto no crea un buzón nuevo ni cambia la recepción del Gmail.

Documentación oficial:
- [Railway: restricciones de SMTP por plan](https://docs.railway.com/networking/outbound-networking)
- [Resend: dominios verificados](https://resend.com/docs/dashboard/domains/introduction)
- [Resend: claves de API](https://resend.com/docs/dashboard/api-keys/introduction)
- [Resend: enviar correo y reply_to](https://resend.com/docs/api-reference/emails/send-email)
- [Resend: idempotencia y límite de 24 horas](https://resend.com/docs/dashboard/emails/idempotency-keys)

## Variables del servicio del portal

Servicio activo: proyecto `zealous-warmth`, entorno `production`, servicio `isocrona-zero-campus-test`. El nombre interno `test` no significa que sea un entorno desechable. No configurar el proyecto legado paralelo.

| Variable | Valor inicial |
| --- | --- |
| `IZ_EMAIL_PROVIDER` | `resend` |
| `RESEND_API_KEY` | Clave privada del titular con permiso de envío |
| `IZ_EMAIL_FROM` | `campus@isocronazero.org`, si ese dominio está verificado |
| `IZ_EMAIL_FROM_NAME` | `Isócrona Zero · Campus` |
| `IZ_EMAIL_REPLY_TO` | `isocronazero@gmail.com` |
| `IZ_EMAIL_TEST_TO` | `isocronazero@gmail.com` |
| `IZ_EMAIL_ENABLED` | `false` |

Las variables opcionales no se rellenan con datos SMTP antiguos. Un proveedor desconocido o Resend incompleto bloquea el envío, sin fallback silencioso a SMTP. Con `IZ_EMAIL_PROVIDER` ausente sigue funcionando la configuración SMTP existente.

## Activación controlada

1. Revisar PR/CI y la autorización de despliegue antes de fusionar: `main` dispara autodeploy. Conservar copia recuperable y baseline de datos.
2. Aplicar primero las variables anteriores con `IZ_EMAIL_ENABLED=false`. El despliegue debe mostrar **En pausa** en Correo saliente. Guardar ajustes no puede habilitar Resend.
3. Desactivar y guardar `Ejecutar al guardar`, `Enviar diplomas`, `Avisar cuotas` y `Pedir valoración final` antes de activar el envío. Revisar también cualquier agente que pueda procesar la bandeja. Estas acciones cambian configuración productiva y se concretan con el titular.
4. Pulsar **Probar correo** una vez. Este endpoint exige administración, utiliza exclusivamente `IZ_EMAIL_TEST_TO` y no procesa la bandeja ni el motor global. Comprobar recepción, nombre del remitente y que Responder dirige al Gmail. Revisar también spam y el registro del proveedor.
5. Revisar la bandeja pendiente: puede incluir mensajes antiguos y bienvenida con credenciales temporales. No pulsar Enviar todos como prueba. Confirmar el único destinatario/diploma real autorizado para la primera entrega.
6. Activar `IZ_EMAIL_ENABLED=true` con el despliegue autorizado. Enviar el único diploma aprobado y comprobar su enlace desde el dominio oficial. Revisar la bandeja antes de reactivar cada automatización.
7. Una aceptación de Resend se registra como `sent`, con `transport=resend` y `providerMessageId`. Significa que el proveedor aceptó el correo; no confirma recepción en la bandeja del socio. Esta versión no implementa webhooks de rebotes/entrega.

## Diploma adjunto

Los correos de diploma incluyen un PDF con el mismo documento emitido que se descarga desde el portal. Se genera en memoria tras la comprobación académica final y se adjunta tanto por Resend (contenido Base64) como por SMTP (MIME multipart). No se guardan los bytes del PDF en la configuración ni en la bandeja. Si el diploma no está emitido o falla la generación del PDF, el correo falla antes de transmitir; no se sustituye por un mensaje de texto sin adjunto.

La descarga `.eml` también prepara el PDF vigente como adjunto. Es una reconstrucción al descargar, no una copia de los bytes aceptados anteriormente por el proveedor. Los avisos de valoración, bienvenidas y pruebas de configuración mantienen su contenido sin añadir diplomas.

Un correo enviado antes de esta corrección permanece en el historial con su aceptación original. Para entregar el adjunto que faltaba, usar **Reenviar** en ese registro concreto después de comprobar curso y destinatario. El reenvío deliberado crea una entrega nueva; no hay reenvíos automáticos de mensajes ya aceptados ni hay que procesar toda la bandeja.

Referencia del proveedor: https://resend.com/docs/api-reference/emails/send-email (campo `attachments`, contenido Base64 y nombre del archivo).

## Fallos y reintentos

- **Avisar ficha** en una tarjeta individual exige administración y envía solo la resolución de esa solicitud. Funciona con el agente desactivado, sin habilitar sus permisos ni los automatismos. El agente y la resolución masiva mantienen su política de permisos; el envío manual no procesa las demás tarjetas.

- Se muestran errores de configuración/pausa antes de intentar un lote. Si falla una entrega, el aviso del lote se muestra como error y conserva el primer motivo legible.
- Errores HTTP de clave, dominio, cuota o servicio no se registran como enviados. No se guardan respuestas crudas del proveedor ni se exponen secretos en los errores.
- Los reintentos conservan el registro pendiente y la misma clave de idempotencia si el contenido es idéntico. Las entregas ya aceptadas por SMTP o Resend se excluyen de Enviar pendientes. Reenviar deliberadamente un correo ya aceptado crea una entrega nueva.
- La bandeja general agrupa los diplomas antiguos repetidos por curso y alumno. Cada lote intenta un solo registro por diploma, incluso si falla el proveedor. Tras una aceptación, las otras copias pendientes se conservan como `superseded` (omitidas), vinculadas al registro enviado; no se marcan como entregadas. La aceptación se guarda antes de continuar el lote, y un guardado antiguo no puede devolver esas copias a pendientes. Los avisos de valoración y otros correos no se agrupan como diplomas.
- La deduplicación del proveedor dura **24 horas**. Ante timeout, respuesta sin identificador, caída del proceso o incertidumbre de entrega, consultar primero el registro de Resend; no lanzar repetidamente un lote ni prometer entrega exactamente una vez fuera de esa ventana.
- HTTP 429 indica un límite del proveedor. El código no hace reintentos ocultos ni aumenta cuotas: esperar y revisar límites antes de reintentar. Esta integración inicial no es un planificador de campañas masivas.
- La validación académica se ejecuta de forma síncrona inmediatamente antes de la transmisión HTTPS, igual que la protección existente antes de SMTP DATA. Corregir un alumno a No apto antes de transmitir impide esa entrega.

## Verificación local y reversión

`npm run check:mail` cubre el adaptador y las rutas HTTP reales en un servidor aislado, con proveedor falso y conexiones externas bloqueadas. Incluye pausa/prueba, roles, ausencia de claves en estado, reply-to, errores, reinicio y reintento, reconocimiento de diplomas ya aceptados y mensaje de error en la interfaz. `npm run check:app` incluye esta comprobación y las regresiones previas, incluido SMTP local.

Para detener los correos de Resend: volver a `IZ_EMAIL_ENABLED=false` y aplicar el despliegue autorizado. No cambiar a SMTP en Railway Hobby. No borrar la bandeja ni los identificadores del proveedor. La reversión de código debe planificarse manteniendo el correo en pausa y conservando la copia y la evidencia de envíos.
