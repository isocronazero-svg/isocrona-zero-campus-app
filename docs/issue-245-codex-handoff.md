# #245 — handoff de implementación

Base esperada: `main` después de #247 (`44bc5e4`). Esta rama contiene solo pretrabajo; no fusionar la documentación como sustituto del patch funcional.

## Qué YA existe

No crear un sistema académico nuevo. La aplicación ya dispone de:
- `PATCH /api/courses/:courseId/members/:memberId/academic` para asistencia/evaluación individual;
- `PATCH /api/courses/:courseId/academic` para bulk académico;
- `POST /api/courses/:courseId/members/:memberId/close` para cierre individual;
- `POST /api/courses/:courseId/close` para cierre masivo;
- tabla operativa de inscritos con asistencia, progreso, evaluación, feedback y diploma;
- acciones frontend `mark-attendance`, `set-member-attendance`, `set-member-evaluation`, `set-all-attendance`, `set-all-evaluations-apt` y cierre;
- `scripts/check-course-academic.mjs`, que ya cubre límites académicos, waiting y práctico sin contenido online.

## Patch mínimo

### 1. Autorización backend

Crear/reutilizar un helper único equivalente a `canManageCourseAcademic(account, course)`:
- `admin` => true;
- `instructor` => true únicamente cuando `account.associateId` existe y está incluido en `course.instructorAssociateIds`;
- cualquier otro caso => false.

No exigir `associate.instructorEnabled` para una asignación histórica ya existente: #247 lo usa para nuevas asignaciones, no para invalidar relaciones antiguas.

Aplicar esta autorización a los cuatro endpoints académicos existentes (individual/bulk academic y individual/bulk close). Mantener `401` sin sesión y `403` autenticado sin permiso.

No ampliar permisos de edición general del curso, diplomas administrativos, socios, configuración ni `/api/state`.

### 2. Integridad

- Los endpoints individuales deben rechazar `memberId` fuera de `course.enrolledIds`, aunque exista globalmente o esté en `waitingIds`.
- Bulk opera solo sobre `enrolledIds`; waiting nunca se modifica.
- No escribir `diplomaReady` directamente desde UI ni crear un segundo cierre: reutilizar `/close` y sus blockers.
- Repetir PATCH/cierre debe ser idempotente y no duplicar emisiones/outbox.

### 3. Frontend

Reutilizar el workbench existente. No crear otra pantalla paralela.

Añadir helper frontend equivalente a `canManageCourseAcademic(course)`:
- admin;
- instructor de sesión cuyo `associateId` figure en `course.instructorAssociateIds`.

Sustituir `isAdminSession()` solo en las acciones académicas de este bloque, sin abrir el resto de acciones administrativas.

En cada inscrito añadir atajos claramente visibles:
- `Asistió` => PATCH individual `{ attendance: 100, evaluation: "Apto" }`;
- `No asistió` => PATCH individual `{ attendance: 0, evaluation: "No apto" }`.

Conservar edición avanzada actual de porcentaje/evaluación y los indicadores de progreso/feedback/diploma.

Móvil ~390 px: tarjeta/fila compacta, nombre/nº socio y estado legibles, dos atajos accionables sin overflow. Feedback inmediato de guardado/error.

### 4. Tests

Ampliar `scripts/check-course-academic.mjs` en vez de crear una suite duplicada. Crear datos sintéticos de instructor con `account.associateId` y curso con `instructorAssociateIds`.

Casos mínimos:
1. admin academic/close => permitido;
2. instructor asignado => individual + bulk academic y close permitidos;
3. mismo instructor en otro curso => 403;
4. instructor no asignado => 403;
5. socio/alumno => 403, incluso sobre sí mismo;
6. waiting => rechazo y sin mutación;
7. presencial sin requisitos + 100/Apto + close => `diplomaReady` una sola vez;
8. 0/No apto => no diploma;
9. requisito obligatorio pendiente => close bloqueado pese a 100/Apto;
10. bulk no toca waiting ni otro curso;
11. cierre repetido idempotente.

Añadir/ajustar regresión frontend si existe check específico del workbench académico.

## Validación antes de PR

- `npm run check:app`
- `npm run smoke:campus-test`
- prueba navegador 390 px y 1440 px como admin e instructor asignado
- instructor ajeno no ve/ejecuta controles de gestión
- revisar consola/overflow
- `git diff --check`

Un único PR para #245. No mezclar #248 ni #259. No tocar datos reales, Railway ni migraciones. Pedir revisión P1/P2 y no fusionar automáticamente.