# Migración de socios — matriz de QA

Documento operativo para PR #231 y para la futura importación real del Excel de socios.

Regla: esta matriz no autoriza importar datos reales. Primero debe existir código sin P1/P2 abiertos, CI verde, copia externa recuperable y autorización explícita.

## 1. Autenticación y seguridad

- [ ] Invitado: preview devuelve 401.
- [ ] Invitado: commit devuelve 401.
- [ ] Socio no admin: preview devuelve 403.
- [ ] Socio no admin: commit devuelve 403.
- [ ] Preview y commit responden con `Cache-Control: no-store`.
- [ ] Un payload inválido no persiste cambios parciales.
- [ ] Un commit fallido no ejecuta automatizaciones ni correos.

## 2. Identificador único de fila — bloqueo P2 actual

- [ ] XLSX normal con `row@r`: cada fila tiene un `previewRowId` único.
- [ ] XLSX sin `row@r`: cada fila sigue teniendo un `previewRowId` único.
- [ ] `sourceRow` se usa solo para visualización/auditoría, nunca para autorizar una fila.
- [ ] Marcar una fila `review` importa solo esa fila.
- [ ] Dos filas sin `row@r` no pueden compartir autorización.
- [ ] ID de preview desconocido: commit rechazado.
- [ ] ID de preview duplicado en la selección: commit rechazado o normalizado de forma explícita y comprobada; preferencia: rechazo.
- [ ] ID duplicado generado por el propio preview: preview/commit bloqueado.
- [ ] Frontend usa `previewRowId` en checkbox/API.
- [ ] Backend valida `previewRowId` contra una única fila `review`.

## 3. `previewToken` y concurrencia

- [ ] Preview seguido de commit sin cambios: permitido.
- [ ] Cambiar el Excel después del preview: 409 y exige reanalizar.
- [ ] Cambiar el censo de socios después del preview: 409 y exige reanalizar.
- [ ] Cambiar configuración de socios relevante después del preview: 409.
- [ ] Commit sin `previewToken`: 409.
- [ ] Reutilizar un preview después de un commit exitoso: rechazado.
- [ ] No hay `await` ni tarea externa entre la validación final del estado y `writeState` que permita una sobrescritura silenciosa.

## 4. Socio existente — preservación

- [ ] Coincidencia exacta por email: conserva ID, número, estado, alta, pagos, cuentas vinculadas y campos no relacionados.
- [ ] Coincidencia exacta por DNI: mismo comportamiento.
- [ ] Email y DNI apuntan a la misma ficha: se reconoce como una única identidad.
- [ ] Email y DNI apuntan a fichas distintas: fila bloqueada.
- [ ] Dato existente no vacío y Excel diferente: bloqueado, no sobrescribe.
- [ ] Excel deja un campo vacío: conserva el valor del portal.
- [ ] Portal tiene un campo vacío y Excel lo aporta: aparece como cambio explícito y requiere revisión cuando corresponda.
- [ ] Cuenta/miembro vinculado permanece sin modificación.
- [ ] No se sincroniza automáticamente email/nombre de cuentas vinculadas durante la importación.
- [ ] Observaciones existentes se conservan.
- [ ] La anotación de importación no se duplica al repetir una importación.

## 5. Socio nuevo

- [ ] Número válido y libre: se conserva.
- [ ] Sin número: se asigna uno nuevo solo tras la revisión prevista.
- [ ] Número decimal: bloqueado.
- [ ] Número cero/negativo: bloqueado.
- [ ] Número ya usado por otra ficha: bloqueado.
- [ ] Dos filas nuevas con el mismo número: duplicado detectado.
- [ ] La asignación automática reserva antes todos los números válidos aportados por el Excel.
- [ ] No se generan números duplicados con `nextAssociateNumber` ni con fichas existentes.
- [ ] Alta nueva no crea cuenta de campus ni manda bienvenida automáticamente como efecto lateral de la importación.

## 6. Identidades duplicadas/ambiguas

- [ ] Email duplicado dentro del Excel: bloqueado.
- [ ] DNI duplicado dentro del Excel: bloqueado.
- [ ] Email ya usado por otra ficha distinta: bloqueado.
- [ ] DNI ya usado por otra ficha distinta: bloqueado.
- [ ] Dos fichas existentes con el mismo email: identidad ambigua, bloqueada.
- [ ] Dos fichas existentes con el mismo DNI: identidad ambigua, bloqueada.
- [ ] Normalización de email mayúsculas/minúsculas no crea duplicados falsos.
- [ ] Normalización de DNI/NIE no permite duplicados por formato equivalente.

## 7. Cuotas y pagos

Probar 2024, 2025, 2026 y 2027.

- [ ] Celda vacía: se interpreta como ausencia de dato, no como 0 importado.
- [ ] Cero explícito: no borra un importe ya registrado.
- [ ] Importe positivo en año vacío: se propone/completa sin tocar otros años.
- [ ] Importe diferente de un total ya registrado: bloqueado para revisión fuera de la importación.
- [ ] Pago ya registrado + cuota manual existente: no se contabiliza dos veces.
- [ ] Años fuera del Excel (por ejemplo 2028) se conservan.
- [ ] `payments` existentes se conservan byte a byte cuando no se actúa sobre ellos.
- [ ] Importes negativos: bloqueados.
- [ ] `NaN`, `Infinity`, hexadecimal y texto tipo `50 euros`: bloqueados.
- [ ] Decimal con coma (`25,50`): interpretado correctamente.
- [ ] Revisar específicamente el significado real de la columna `Anual` antes de la migración productiva; no asumir que debe sobrescribir `annualAmount`.

## 8. Estado, baja y observaciones

- [ ] Ficha existente `Baja`: la importación no la reactiva.
- [ ] Ficha existente `Activa`: el Excel no cambia el estado automáticamente por un dato no autorizado.
- [ ] Alta nueva con observación que indique baja: clasificación prevista revisada con el secretario antes de producción.
- [ ] Fila con observaciones queda visible para revisión cuando corresponda.
- [ ] Observaciones del Excel se muestran escapadas; no permiten inyectar HTML.

## 9. UI de preview

- [ ] Todas las filas muestran estado: Lista / Revisar / Bloqueada.
- [ ] Los cambios propuestos muestran valor anterior → nuevo.
- [ ] Contenido del Excel se escapa correctamente en HTML.
- [ ] Solo filas `review` tienen checkbox de aprobación.
- [ ] Filas bloqueadas no pueden aprobarse.
- [ ] Confirmación muestra número real de filas que entrarán.
- [ ] Cancelar confirmación no cambia datos.
- [ ] Tras error que invalida el preview se exige analizar de nuevo.
- [ ] Móvil: tabla/controles siguen siendo utilizables sin overflow de página crítico.

## 10. Persistencia y efectos laterales

Comparar antes/después:

- [ ] `accounts` sin cambios.
- [ ] `members` sin cambios.
- [ ] `courses` sin cambios.
- [ ] `emailOutbox` sin cambios.
- [ ] `automationRuns` sin cambios causados por el endpoint.
- [ ] pagos existentes sin cambios indebidos.
- [ ] reiniciar servidor conserva exactamente el resultado de la importación.
- [ ] repetir la misma importación no crea socios duplicados ni dobla cuotas.

Nota: el scheduler general sigue siendo independiente; antes de producción comprobar que las fichas importadas no quedan en un estado que provoque acciones automáticas no deseadas posteriormente.

## 11. Archivo XLSX y parser

- [ ] Workbook con `row@r` presente.
- [ ] Workbook sin `row@r`.
- [ ] Filas vacías intermedias.
- [ ] Celdas vacías.
- [ ] Inline strings.
- [ ] Shared strings si el Excel real las usa.
- [ ] Fechas/números en el formato real del libro.
- [ ] Archivo corrupto: error claro, cero persistencia.
- [ ] Archivo que no contiene la hoja esperada: error claro, cero persistencia.
- [ ] Archivo superior al límite de UI: rechazado antes de importar.

Antes de producción conviene generar una copia anonimizada de la estructura del Excel real para verificar que el parser cubre las variantes que realmente aparecen.

## 12. Backup obligatorio antes de datos reales

- [ ] Export/snapshot del estado actual.
- [ ] Copia de SQLite/JSON según almacenamiento productivo real.
- [ ] Copia externa de uploads/justificantes relevantes.
- [ ] Copia fuera del mismo volumen de Railway.
- [ ] Acceso restringido a la copia por contener datos personales.
- [ ] Ensayo de restauración aislado siguiendo `docs/BACKUP-RECOVERY.md`.
- [ ] Registrar fecha, responsable y SHA de la aplicación antes de importar.

## 13. Validación técnica final de #231

Después de corregir el P2:

```bash
node scripts/check-associate-workbook-import.mjs
npm run check:app
npm run smoke:campus-test
```

Además:

- [ ] CI de la PR verde.
- [ ] Cero hilos P1/P2 sin resolver.
- [ ] Diff revisado contra `main` actual.
- [ ] No introducir refactor no relacionado.
- [ ] No fusionar automáticamente.

## 14. Condición para migración real

Solo proceder cuando se cumplan todas:

1. #231 corregida y fusionada con autorización explícita.
2. #227/V1 estable o, como mínimo, sin regresiones relacionadas con socios/persistencia.
3. Reglas de negocio revisadas con el secretario.
4. Backup externo recuperable y ensayo realizado.
5. Preview del Excel real revisado antes de confirmar.
6. Importación real expresamente autorizada.

Si una condición falla, no importar.