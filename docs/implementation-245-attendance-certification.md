# #245 · Asistencia y certificación — plan de implementación cerrado

Base: `main` tras #247/#258.

## Hecho ya existente y que NO debe duplicarse
- Tabla operativa de alumnado con asistencia, evaluación, progreso, feedback y estado de diploma.
- Acciones individuales `mark-attendance` / `set-member-attendance` y `set-member-evaluation`.
- Bulk `set-all-attendance` y `set-all-evaluations-apt`.
- Cierre individual `POST /api/courses/:courseId/members/:memberId/close`.
- Cierre masivo `POST /api/courses/:courseId/close`.
- Bulk académico limitado a `enrolledIds`; waiting queda fuera.
- Blockers académicos actuales siguen siendo la autoridad para habilitar `diplomaReady`.

## Trabajo real pendiente
1. Backend: ampliar autorización de los endpoints académicos/cierre a:
   - admin; o
   - instructor cuyo `associateId` figure en `course.instructorAssociateIds`.
2. No exigir `instructorEnabled` para gestionar una actividad histórica ya asignada. Ese flag solo controla nuevas asignaciones.
3. Alumno/socio normal => 403, incluso sobre sí mismo.
4. Instructor asignado a otro curso => 403.
5. Rechazar memberId que no pertenezca a `course.enrolledIds`; nunca operar waiting.
6. Frontend: reemplazar guards `isAdminSession()` solo en la operativa académica por helper específico `canManageCourseAcademic(course)`; no abrir edición administrativa general del curso.
7. UX móvil prioritaria: añadir botones rápidos visibles por alumno:
   - `Asistió` => PATCH individual `{ attendance: 100, evaluation: "Apto" }`.
   - `No asistió` => PATCH individual `{ attendance: 0, evaluation: "No apto" }`.
   Mantener edición avanzada actual de porcentaje/evaluación.
8. Reutilizar el cierre masivo existente; no crear loops ni escribir `diplomaReady` directamente.
9. Mantener idempotencia: repetir Asistió/No asistió/cierre no duplica diploma, envío ni efectos laterales.

## Endpoints que deben quedar cubiertos por permisos de instructor asignado
- `PATCH /api/courses/:courseId/members/:memberId/academic`
- `PATCH /api/courses/:courseId/academic`
- `POST /api/courses/:courseId/members/:memberId/close`
- `POST /api/courses/:courseId/close`

## Regresiones mínimas a añadir/ampliar en `scripts/check-course-academic.mjs`
1. admin: individual Asistió/No asistió/cierre.
2. instructor asignado: 200 en academic individual, bulk, close individual y close bulk de su curso.
3. mismo instructor: 403 en otro curso.
4. instructor no asignado: 403.
5. alumno: 403 incluso sobre su propio memberId.
6. waiting: academic/cierre rechazado.
7. jornada presencial sin módulos/test/trabajo + 100/Apto => cierre añade una sola vez a `diplomaReady`.
8. 0/No apto => nunca diploma.
9. requisito obligatorio pendiente => cierre bloqueado aunque asistencia 100.
10. bulk no toca waiting ni otro curso.
11. cierre repetido idempotente.
12. diploma previamente emitido no se revoca automáticamente por cambios posteriores.

## Archivos previsibles
- `server.js`
- `public/app.js`
- `public/styles.css` solo si el responsive actual necesita ajuste
- `scripts/check-course-academic.mjs`
- helper de autorización pequeño solo si evita duplicación real

## Validación antes de PR
- `npm run check:app`
- `npm run smoke:campus-test`
- QA móvil ~390px y escritorio 1440px
- revisión P1/P2
- PR exclusivo de #245
- sin datos reales ni migraciones
- actualizar #227 y bitácora al cambiar estado

## Criterio de finalización
#245 queda lista cuando admin e instructor asignado pueden registrar asistencia/evaluación y cerrar alumnado desde la UI actual, con backend autoritativo, sin tocar waiting ni saltarse blockers académicos, y con operativa cómoda desde móvil.
