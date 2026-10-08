# Copias y recuperacion antes del piloto

Verificado con datos sinteticos el 8 de octubre de 2026, sobre main de2b125.
Este procedimiento no autoriza operaciones sobre produccion ni acredita que exista
una copia externa real. Ensayar primero en un entorno aislado.

## Que contiene cada copia

| Elemento | Contenido y limite |
| --- | --- |
| `IZ_DATA_DIR/state.json` | Snapshot de estado; se actualiza en cada escritura correcta. Incluye cuentas legacy con hashes, socios, cursos, diplomas, tests y adjuntos que esten embebidos. NO incluye todos los archivos del disco. |
| `IZ_DATA_DIR/backups/campus-backup-*.json` | Mismo formato del estado. Por defecto se crea al escribir, como mucho una cada 5 minutos, y se conservan 30. No es un horario garantizado ni una copia externa. |
| `GET /api/storage/export-state` | Descarga del estado actual, solo admin. No es un ZIP del volumen ni un export de PostgreSQL. Contiene datos personales y material de autenticacion; tratar como secreto. |
| `IZ_DATA_DIR/uploads/` | Archivos externos, incluidos justificantes de socios. Copiar junto al estado para recuperarlos. |
| `IZ_DATA_DIR/campus.db` | SQLite operativo: estado principal y sesiones recordadas. Conservar una copia coherente; no copiar solo este fichero mientras haya escrituras/WAL activo. |
| PostgreSQL opcional | Cuentas/resultados del modo DB necesitan copia y restauracion propias. `DATABASE_URL` NO convierte el resto del estado SQLite ni los uploads en datos PostgreSQL. |

Los snapshots automaticos viven en el mismo volumen: no protegen frente a su perdida.
Una descarga de `/api/state` esta sanitizada y NO sustituye una copia de recuperacion.
No poner JSON, archivos de socios, hashes, cookies, claves o copias en Git, logs,
issues ni adjuntos publicos. La descarga requiere admin y `Cache-Control: no-store`;
esto no cifra el archivo descargado ni borra copias anteriores del navegador.

## Captura real: pendiente de autorizacion

1. Confirmar servicio, volumen persistente, SHA y responsable. No reutilizar un
   proyecto Railway distinto solo porque tenga un nombre parecido.
2. Acordar una ventana sin escrituras. Con autorizacion, detener el proceso y las
   automatizaciones que escriban. Una copia JSON y una de uploads tomadas en
   instantes distintos pueden no corresponderse.
3. Copiar el directorio persistente completo de forma coherente, incluidos
   `state.json`, `uploads`, SQLite y sus archivos auxiliares si existen. Usar una
   herramienta de backup SQLite consistente si no se puede detener el proceso;
   no asumir que copiar `campus.db` en caliente es seguro.
4. Guardar fuera del volumen, con acceso restringido y cifrado. Registrar fecha,
   SHA, inventario y sumas de comprobacion, sin contenidos sensibles. Conservar
   por separado la configuracion necesaria, en un gestor de secretos.
5. Si hay PostgreSQL, incluir una copia consistente de esa base. Reanudar servicio
   y comprobar salud. No retirar la copia anterior hasta validar la nueva.

## Restauracion de ensayo

1. Trabajar exclusivamente con una copia autorizada, en un directorio nuevo,
   vacio y fuera de produccion. Comprobar su ruta absoluta. Mantener la fuente
   intacta y no usar `reset`, limpieza de prepublicacion ni import en produccion.
2. Usar el mismo SHA y Node >=22. Restaurar `state.json` y `uploads/` juntos. Para
   ensayar recuperacion desde JSON, NO poner una SQLite previa en el destino:
   `storage.js` da prioridad a una `campus.db` existente y no la sustituye con JSON.
3. Arrancar con `IZ_DATA_DIR` apuntando al destino, `HOST=127.0.0.1`, puerto libre,
   `IZ_BASE_URL` local y `NODE_ENV=test`. No copiar `.env` productivo al ensayo.
   Vaciar `SMTP_*`, `DATABASE_URL`, bootstrap y recovery admin; desactivar
   automatizaciones en la copia aislada y bloquear salida SMTP. Esto no modifica
   la fuente. No usar bypasses de produccion.
4. Para una recuperacion DB real, usar una base PostgreSQL tambien restaurada y
   aislada; no conectar el ensayo a la base productiva. Esa variante requiere su
   propia validacion y no esta cubierta por el check de este PR.
5. Verificar login con hashes recuperados, recuentos/IDs, cursos e inscripciones,
   codigo y PDF de diploma, resultados/marcas, documentos y justificantes por
   bytes. Probar denegacion al invitado y aislamiento entre socios.
6. Reiniciar y repetir una descarga y consulta. Una restauracion desde JSON no
   incluye la tabla de sesiones recordadas: volver a iniciar sesion es normal.
7. Detener el ensayo, guardar solo evidencia sin datos personales y eliminar las
   copias temporales segun la politica acordada. Documentar tiempo y punto de
   recuperacion; nunca afirmar que una copia es valida solo porque se descarga.

Restaurar produccion requiere autorizacion especifica, una copia previa del estado
actual, ventana sin escrituras y plan de vuelta atras. El endpoint de importacion
reemplaza estado y no restaura archivos ni PostgreSQL; no usarlo como prueba inocua.

## Check automatico seguro

```sh
node scripts/check-backup-recovery.mjs
npm run check:app
```

El check ignora el directorio/DB productivos y usa solo `mkdtemp`, servidor local y
datos ficticios. Descarga un export admin, obtiene un snapshot automatico y prueba
ambos en directorios nuevos sin SQLite. Comprueba hashes/login, datos academicos,
tests, marcas, permisos, codigo/PDF y contenido de documentos. Reproduce un
justificante ausente con JSON solo, restaura uploads y verifica los mismos bytes
tras reiniciar. Limpia sus procesos/directorios al terminar.

Limitaciones: no verifica backups reales de Railway, credenciales reales, SMTP,
restauracion PostgreSQL, copia SQLite en caliente, retencion externa ni recuperacion
ante un fallo de disco. Antes del piloto falta guardar y restaurar una copia real
autorizada y registrar duracion, fecha de recuperacion y responsable.
