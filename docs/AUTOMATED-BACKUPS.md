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
- Retencion objetivo: 30 copias.
- Horario objetivo: diario a las 03:30 UTC.

El servicio de backup no monta el volumen del Campus. Se autentica contra el Campus con variables referenciadas de Railway, descarga el `export-state` administrativo y consulta el estado de transporte para descubrir archivos privados referenciados mediante `transportUrl` o `downloadUrl`.

## Contenido de cada copia

Cada ejecucion crea un prefijo/carpeta independiente con:

- `state.json.aes256gcm`: estado administrativo completo cifrado;
- `file-XXXX.bin.aes256gcm`: archivos privados referenciados por el estado transportado;
- `manifest.json.aes256gcm`: manifiesto cifrado con ruta logica, tipo MIME, tamano y SHA-256 de cada elemento.

Las sesiones recordadas no son necesarias para la recuperacion de negocio: tras una restauracion los usuarios pueden volver a iniciar sesion.

## Cifrado

Todo el contenido se cifra antes de salir del proceso de backup mediante AES-256-GCM con IV aleatorio por objeto. La clave se guarda exclusivamente como variable privada de Railway (`BACKUP_AES_KEY_B64`); no se guarda en GitHub, en el codigo ni en la carpeta de copias.

Debe existir una segunda custodia recuperable de esa clave fuera de Railway antes de considerar el sistema completamente resistente a la perdida total de la cuenta/proyecto de Railway.

## Google Drive

El codigo de la funcion soporta Google Drive mediante:

- `GDRIVE_FOLDER_ID`;
- `GDRIVE_SERVICE_ACCOUNT_JSON`.

`GDRIVE_FOLDER_ID` apunta a la carpeta restringida ya creada. La subida a Drive queda desactivada de forma segura mientras no exista `GDRIVE_SERVICE_ACCOUNT_JSON`.

La credencial de Google no debe guardarse en GitHub. Debe pertenecer a una identidad tecnica con acceso unicamente a la carpeta de backups. Una vez configurada, cada ejecucion crea una subcarpeta `IsocronaZero-auto-<timestamp>`, sube los mismos objetos cifrados y aplica la misma retencion de 30 copias.

## Seguridad operativa

- La funcion no modifica socios, cursos, pagos, diplomas ni estado del Campus.
- Las peticiones de backup usan una sesion administrativa efimera y `Cache-Control: no-store`.
- No se registran contrasenas, claves de cifrado ni contenido de usuarios en logs.
- Los nombres de los archivos privados se sustituyen por identificadores genericos en el destino; la correspondencia queda dentro del manifiesto cifrado.
- Un fallo de backup no detiene el Campus principal.

## Validacion necesaria

Antes de declarar el sistema cerrado:

1. Obtener una ejecucion real correcta y revisar el log resumido (`ok`, bytes, numero de archivos y prefijo de backup).
2. Confirmar que la copia existe en el bucket independiente.
3. Restaurar el horario diario tras cualquier prueba temporal.
4. Crear la identidad tecnica de Google y compartir solo la carpeta restringida con ella.
5. Configurar `GDRIVE_SERVICE_ACCOUNT_JSON` como secreto de Railway y comprobar una copia real en Drive.
6. Custodiar una segunda copia de la clave AES fuera de Railway.
7. Realizar periodicamente un ensayo de descifrado/restauracion en un entorno aislado.

No publicar claves, credenciales ni paquetes descifrados en issues, PR, logs o repositorios.
