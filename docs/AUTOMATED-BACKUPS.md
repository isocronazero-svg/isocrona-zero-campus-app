# Copias externas automatizadas del Campus

Fecha de implantacion inicial: 18/10/2026.

## Objetivo

Separar las copias externas del volumen persistente que utiliza el Campus. El sistema no sustituye los snapshots internos de `IZ_DATA_DIR`; añade otra capa independiente y esta preparado para duplicar la copia cifrada en Google Drive.

## Arquitectura

- Servicio web principal: `isocrona-zero-campus-test`.
- Volumen principal: montado en `/var/data/isocrona-zero`.
- Servicio de backup: Railway Function `isocrona-campus-backup`.
- Almacenamiento externo inmediato: bucket privado `isocrona-campus-backups` en region `ams`.
- Destino Google Drive previsto: carpeta restringida `Isocrona Zero - Copias restringidas`.
- Retencion: 30 copias.
- Horario productivo: diario a las 03:30 UTC.

El servicio de backup no monta el volumen del Campus. Se autentica contra el Campus con variables referenciadas de Railway, descarga el `export-state` administrativo y consulta el estado de transporte para descubrir archivos privados.

## Contenido de cada copia

Cada ejecucion crea un prefijo/carpeta independiente con:

- `state.json.aes256gcm`: estado administrativo completo cifrado;
- `file-XXXX.bin.aes256gcm`: archivos privados referenciados por el estado;
- `manifest.json.aes256gcm`: manifiesto cifrado con ruta logica, tipo MIME, tamano y SHA-256 de cada elemento.

La deteccion cubre `transportUrl`/`downloadUrl` y los ficheros de socios guardados como nombres internos: `proofFile`, `paymentProof`, `paymentProof2` y `applicantReplyDocuments`.

Las sesiones recordadas no son necesarias para la recuperacion de negocio: tras una restauracion los usuarios pueden volver a iniciar sesion.

## Cifrado

Todo el contenido se cifra antes de salir del proceso de backup mediante AES-256-GCM con IV aleatorio por objeto. La clave se guarda exclusivamente como variable privada de Railway (`BACKUP_AES_KEY_B64`); no se guarda en GitHub, en el codigo ni en la carpeta de copias.

Debe existir una segunda custodia recuperable de esa clave fuera de Railway antes de considerar el sistema completamente resistente a la perdida total de la cuenta/proyecto de Railway.

## Google Drive

El codigo de la funcion soporta Google Drive mediante:

- `GDRIVE_FOLDER_ID`;
- `GDRIVE_SERVICE_ACCOUNT_JSON`.

`GDRIVE_FOLDER_ID` apunta a la carpeta restringida ya creada. La subida a Drive queda desactivada de forma segura mientras no exista `GDRIVE_SERVICE_ACCOUNT_JSON`.

La credencial de Google no debe guardarse en GitHub. El destino y el tipo de identidad deben ser compatibles antes de generar claves. El flujo implementado crea una subcarpeta `IsocronaZero-auto-<timestamp>`, sube los mismos objetos cifrados y aplica la misma retencion de 30 copias, pero su activacion sigue pendiente de la comprobacion descrita abajo.

## Seguridad operativa

- La funcion no modifica socios, cursos, pagos, diplomas ni estado del Campus.
- Las peticiones de backup usan una sesion administrativa efimera y `Cache-Control: no-store`.
- No se registran contrasenas, claves de cifrado ni contenido de usuarios en logs.
- Los nombres de los archivos privados se sustituyen por identificadores genericos en el destino; la correspondencia queda dentro del manifiesto cifrado.
- Un fallo de backup no detiene el Campus principal.

## Validacion productiva del 18/10/2026

Primera ejecucion controlada:

- Resultado Railway: `Last run succeeded`.
- Ejecucion: 18/10/2026 06:35:05 UTC.
- Estado exportado: 6.614.863 bytes.
- Archivos privados incluidos inicialmente: 2.

La revision posterior detecto que justificantes y documentos de solicitudes usan tambien rutas `/api/associates/files/...` construidas desde nombres internos. Se amplio la deteccion y se realizo una segunda ejecucion real:

- Resultado Railway: `Last run succeeded`.
- Ejecucion: 18/10/2026 06:45:22 UTC.
- Estado exportado: 6.614.863 bytes.
- Rutas privadas descubiertas: 4.
- Archivos privados copiados: 4.
- Referencias locales no recuperables: 0.
- Prefijo de la copia: `campus/20261018T064514669Z/`.
- Retencion configurada: 30 copias.
- Google Drive: preparado pero no activado (`driveEnabled=false`) al faltar la credencial tecnica de Google.
- El Campus principal permanecio online y sin incidencias durante ambas pruebas.

Tras la validacion se restauro y desplego el horario productivo `30 3 * * *` (03:30 UTC diario).

## Pendientes para cerrar la segunda copia en Google Drive

1. Resolver la compatibilidad de identidad/destino: OAuth autorizado para la carpeta actual de Mi unidad, o cuenta de servicio con una unidad compartida Workspace autorizada. No crear una cuenta de servicio esperando que Editor en Mi unidad le otorgue cuota.
2. Revisar/reutilizar proyecto, API y credenciales existentes en Google Cloud despues del inicio de sesion humano. Configurar solo la credencial compatible en el servicio de backup, con permisos minimos y sin exponer su contenido.
3. Ejecutar una prueba y confirmar la nueva subcarpeta cifrada en Drive.
4. Custodiar una segunda copia de la clave AES fuera de Railway.
5. Realizar periodicamente un ensayo de descifrado/restauracion en un entorno aislado.

No publicar claves, credenciales ni paquetes descifrados en issues, PR, logs o repositorios.

## Comprobacion de continuidad: 18/10/2026 06:59 UTC (08:59 Madrid)

Estado: **BLOQUEADO para cerrar la segunda copia**, no validado en Drive.

- Railway: reutilizados por lectura los dos servicios existentes, volumen de 5000 MB y bucket en ams. Sin cambios staged. Cron confirmado `30 3 * * *`; no se ha cambiado ni disparado una ejecucion nueva.
- Log estructurado de la ejecucion existente, 06:45:18 UTC: `ok=true`, `stateBytes=6614863`, `discoveredFileRoutes=4`, `referencedFiles=4`, `missingReferencedFiles=0`, `s3RetentionCount=30`, `driveEnabled=false`. Es evidencia de aquella ejecucion en bucket, no de una copia nueva en Drive ni de una restauracion.
- La carpeta restringida existente esta en Mi unidad de una cuenta personal de Google: sin `driveId`, no compartida, unico permiso de propietario. La consulta de unidades compartidas accesibles devuelve cero. No hay subcarpetas `IsocronaZero-auto-*`; se conserva la copia manual cifrada anterior y los dos artefactos de ensayo.
- **Bloqueo de compatibilidad:** las cuentas de servicio no tienen cuota de Drive ni pueden ser propietarias de archivos. Compartir esta carpeta personal con permiso Editor no habilita la subida prevista. Google indica usar unidades compartidas u OAuth en nombre de un usuario: [documentacion oficial, storageQuotaExceeded](https://developers.google.com/workspace/drive/api/guides/handle-errors#storageQuotaExceeded).
- El codigo desplegado usa GoogleAuth con la credencial JSON, sin delegacion de usuario. No se ha generado una cuenta/clave inutil ni concedido permisos adicionales. OAuth con la cuenta de la asociacion es la alternativa propuesta para conservar la carpeta actual; pendiente de decision y consentimiento, no activada.
- Google Cloud Console requiere inicio de sesion en el navegador de Codex. No se ha podido verificar todavia el proyecto, Drive API o las cuentas de servicio existentes. La conexion del plugin Drive no da acceso administrativo a Google Cloud.
- El servicio principal sigue en estado SUCCESS y `/healthz` devuelve HTTP200 con `ok=true`. Sin cambios de codigo operativo, claves AES/bucket, variables, cron, retencion, permisos, datos, correos o reinicios/despliegues en esta comprobacion.

## Continuidad Google Cloud: 18/10/2026 13:32 UTC (15:32 Madrid)

- Carlos eligio expresamente OAuth con la cuenta de la asociacion para conservar la carpeta de Mi unidad. La propuesta de cuenta de servicio queda descartada para este destino.
- Inicio de sesion completado. Condiciones de Google Cloud aceptadas con autorizacion expresa; sin activar facturacion ni prueba de pago.
- Inventario de recursos sin proyectos visibles tras refresco. Creado y comprobado proyecto `isocrona-zero-backups` (Isocrona Zero Backups); reutilizarlo, no crear otro. Google Drive API muestra estado Habilitada.
- Sin clientes OAuth ni cuentas de servicio en el proyecto. Preparado, pero NO enviado, asistente de identidad `Isocrona Zero - Copias cifradas`, audiencia externa por tratarse de Gmail. Detenido en la aceptacion de la Politica de Datos del Usuario de APIs de Google; confirmacion especifica solicitada a Carlos.
- No se han generado credenciales, concedido acceso a Drive, cambiado permisos de carpeta ni configurado secretos Railway. Sin nuevas ejecuciones de backup, cambios de cron/retencion, claves AES/bucket o servicio principal en esta continuacion.
- Siguiente: finalizar identidad tras confirmacion; configurar cliente y consentimiento OAuth con alcance minimo `drive.file` y seleccion explicita de carpeta. Verificar que la autorizacion operativa no queda limitada a los siete dias del modo de pruebas. La compatibilidad de la credencial OAuth con la funcion existente debe validarse antes de activar Drive.

**Pendiente de cierre operativo:** comprobar una ejecucion real con `driveEnabled=true`, carpeta y objetos cifrados presentes, integridad/recuperacion de todos los archivos y Campus sano. La preparacion de Google Cloud no acredita estos resultados. La PR sigue siendo exclusivamente documental y permanece abierta.
