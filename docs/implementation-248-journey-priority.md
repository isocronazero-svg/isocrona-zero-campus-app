# #248 · Histórico de jornadas y prioridad — plan cerrado

Dependencias: #246 ya integrada/cerrada. Esperar a #245 para usar una fuente de verdad presencial fiable.

## Fuente de verdad
- No crear contador manual persistido (`timesAttended`, etc.).
- Derivar el histórico desde cursos/jornadas cerrados.
- Una actividad cuenta solo si está clasificada estructuralmente como jornada (`type === "Jornada intensiva"` y/o `contentTemplate === "intensivo"`, normalizados).
- Participación válida: `memberId` presente en `course.diplomaReady` (o estado de cierre equivalente si #245 introduce uno más explícito).
- Deduplicar por `course.id + memberId`.
- No cuentan waiting, solicitudes pendientes/rechazadas, No asistió, No apto, cursos normales ni participación solo como instructor.
- Si una persona es instructor y además alumno válido en esa misma jornada, cuenta una sola participación como alumno.

## Arquitectura recomendada
Crear un agregador compartido en servidor, por ejemplo `server/journey-participation.js`, que recorra el estado y devuelva filas canónicas:
- memberId
- nombre
- nº socio
- email cuando permisos lo permitan
- journeyCount
- última jornada
- detalle [{ courseId, title, startDate, endDate }]

Orden por defecto: `journeyCount ASC`, después nombre estable.

La vista web y la exportación deben consumir estas mismas filas; no recalcular en frontend.

## Permisos
- Admin: vista global completa.
- Instructor asignado: solo contexto de su jornada concreta; no directorio global.
- Socio normal: 403 al ranking global/privado.

## API / informes
Reutilizar el patrón de informes existente y `toCsv(rows)`:
- endpoint JSON para vista web
- CSV obligatorio desde el mismo agregador
- XLSX opcional; no añadir dependencia pesada solo para duplicar CSV

Para instructor, exigir `courseId` y validar que su associateId figura en `course.instructorAssociateIds`.

## UI V1
Admin, preferiblemente en Informes:
- sección `Participación en jornadas`
- búsqueda por nombre / nº socio
- orden ascendente/descendente por nº jornadas
- detalle desplegable de jornadas/fechas

En solicitudes/inscritos de una jornada:
- chip `X jornadas previas`
- orden por menor participación
- solo informativo; NO adjudicación automática en V1

## Tests mínimos
1. 0/1/5/7 jornadas válidas.
2. curso normal con diplomaReady excluido.
3. waiting excluido.
4. No asistió/No apto sin diplomaReady excluido.
5. instructor-only excluido.
6. instructor + alumno válido cuenta una sola participación.
7. duplicado memberId en diplomaReady no duplica.
8. orden ascendente estable.
9. CSV coincide exactamente con agregador.
10. admin global permitido.
11. instructor solo su courseId.
12. instructor ajeno 403.
13. socio 403.

## Validación
- `npm run check:app`
- `npm run smoke:campus-test`
- revisión P1/P2
- QA con datos sintéticos
- PR exclusivo #248
- sin datos reales ni contador histórico persistido

No implementar hasta que #245 esté integrada para no crear dos definiciones de “jornada realizada”.
