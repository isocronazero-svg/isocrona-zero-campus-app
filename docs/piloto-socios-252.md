# Piloto de acceso Campus: 5-10 socios

Estado 14/10/2026: #256 fusionada, #252 cerrada como implementacion, main `a92dabe9ea7fd7f4d9de18e5f823155a252768ff`, CI #402 y despliegue del portal correctos. Piloto NO ejecutado ni autorizado. Esta guia no autoriza acciones productivas.

## Barrera previa: administracion de emergencia

El arranque observado mantiene `IZ_ALLOW_DEMO_ADMIN_IN_PRODUCTION=true` y aplica bootstrap admin. El aviso NO confirma una cuenta demo utilizable; no se probaron esas credenciales. Mientras existan las variables de bootstrap, cada arranque vuelve a imponer la credencial configurada y puede invalidar sesiones recordadas.

Carlos debe coordinar una ventana: verificar su acceso admin real y una copia recuperable; autorizar la retirada del bypass y de `IZ_BOOTSTRAP_ADMIN_EMAIL`/`IZ_BOOTSTRAP_ADMIN_PASSWORD` temporales; redeploy controlado; verificar healthz, login admin y ausencia de esos avisos. No retirar variables a ciegas ni activar otro bypass si falla el arranque. No publicar secretos en GitHub/chat. Estas acciones NO se han ejecutado.

## Checklist operativa

1. **Backup externo recuperable.** Antes de cambios de configuracion/datos, preparar copia ACTUAL de estado/SQLite y uploads, cifrada fuera del volumen. Comprobar recuperacion en entorno aislado, nunca restaurar produccion. La clave debe estar custodiada fuera del PC. La copia del 10/10 no prueba el estado actual y su custodia externa de clave seguia pendiente.
2. **Export JSON valido.** Como admin usar `Descargar state.json actual` o `Descargar copia actual del campus`. Guardar privado/cifrado, verificar parseo y arrays `associates`, `members`, `accounts`, `emailOutbox`. Calcular hash y verificar la copia descargada. Contiene secretos: no adjuntarlo a issues. El export es rollback logico, NO sustituye uploads/volumen/sesiones.
3. **Censo actual.** Revisar Socios de la app, no dar por valido el recuento de una hoja antigua. No reimportar Excel. Confirmar identidad y consentimiento del grupo candidato en un registro privado.
4. **Excepciones.** Excluir bajas, solicitudes no aprobadas, emails vacios/invalidos/duplicados y vinculos ambiguos. Revisar cuentas existentes; nunca crear otra ni adoptar una por email. Legacy en revision requiere procedencia y nombre/apellidos.
5. **SMTP y operacion.** Revisar host, puerto, TLS, remitente y `Correo de prueba` (buzon controlado por Carlos). Confirmar una sola replica/proceso escritor, sin otro lote en marcha. No cambiar credenciales SMTP durante el lote ni lanzar `Enviar bandeja`/`Resolver todo` en paralelo.
6. **Prueba SMTP controlada.** Solo con autorizacion expresa, pulsar una vez `Probar SMTP`; confirmar recepcion en el buzon de prueba y revisar spam. Es un correo real y requiere permiso, aunque no contenga credenciales. NO se ha enviado en esta entrega.
7. **Preview.** En Socios, bloque `Accesos de socios`, pulsar `Revisar accesos`. Verificar SMTP preparado, clasificaciones y cero seleccionados. No pulsar todavia `Procesar`.
8. **Preview sin escrituras.** Con ventana sin otras operaciones, comparar export privado inmediatamente antes/despues del preview: no deben cambiar cuentas, vinculos ni outbox por el preview. Hash identico acredita igualdad completa; si difiere por automatismos, investigar y no asumir que lo causo el preview. No continuar sin aclararlo.
9. **Seleccion minima.** Empezar por 5; ampliar como maximo a 10 en este piloto. `Seleccionar 5/10` solo selecciona, no envia. Revisar individualmente los IDs, nombres y emails elegidos; guardar la lista solo en registro restringido. Maximo tecnico del lote: 20.
10. **Autorizacion de Carlos.** Confirmar expresamente ese subconjunto, backup, SMTP recibido y ventana operativa. El permiso de merge NO autoriza el lote; la casilla/dialogo tampoco sustituye esta autorizacion.
11. **Ejecutar una vez.** Pulsar `Procesar N seleccionados`, confirmar y esperar. El token dura 15 minutos y es de un uso. Ante timeout/caducidad o cambios, no repetir a ciegas: revisar estado y generar nuevo preview.
12. **Recepcion.** Cada persona seleccionada confirma un unico correo util, remitente correcto, enlace del portal y destinatario correcto. No copiar las contrasenas al registro de QA.
13. **Login.** Cada participante prueba su propio acceso en una sesion privada. Carlos no solicita ni registra contrasenas de socios.
14. **Cambio obligatorio.** Confirmar que aparece el cambio inicial, que se puede completar y que la clave temporal deja de permitir login. No enviar nuevamente la credencial antigua.
15. **Portal.** Revisar perfil propio, cursos, campus/grupos autorizados y diplomas propios; sin datos de otros socios ni controles de administracion.
16. **Inscripcion.** Solo con permiso para esa inscripcion real y un curso abierto adecuado, probar acceso al formulario y alta. No crear cursos, pagos o matriculas ficticios en produccion; si no hay caso autorizado, marcar pendiente.
17. **Trazabilidad.** Revisar resultado del lote, estado del socio y outbox: una cuenta vinculada, una bienvenida entregada, error vacio y sin duplicados. Si hay fallo, conservar cuenta/credencial y revisar la causa antes de reintentar desde un estado actualizado. No descargar/publicar logs con secretos.
18. **Parada.** Cualquier destinatario incorrecto, duplicado, cambio inesperado, problema de permisos o clave invalida detiene el piloto. `sending` tras interrupcion exige comprobar entrega con el proveedor antes de cualquier reintento; no resetear ni reenviar a ciegas. No seguir con otros lotes ni restaurar backups sin decision expresa.

## Evidencia y autorizaciones pendientes

- Preparado: codigo/CI/review, despliegue, smoke publico, QA anonima movil/escritorio y esta guia. No prueba SMTP ni preview autenticado productivos.
- Carlos: acceso admin y retirada autorizada de configuracion temporal, copia actual y custodia de clave, revision privada de censo/SMTP, permiso para prueba SMTP y permiso separado para los 5-10 IDs concretos.
- QA pendiente #241/#249: apertura/cierre de inscripcion en Europe/Madrid; #242: instructores asignados y certificados propios tras cierre; #253: Administracion > Pendiente de revisar > Abrir en movil. No reimplementar estas funcionalidades sin regresion demostrada.
- No analizar/implementar #247 mientras existan estas acciones productivas pendientes. Despues: plan quirurgico #247, sin implementarlo en este encargo; orden posterior #247 -> #245 -> #248. Conservar el worktree anterior de #247 sin mezclarlo con el cierre de #252.
