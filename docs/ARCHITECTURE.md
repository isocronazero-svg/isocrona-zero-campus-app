# Architecture Overview - Isocrona Zero Campus

Este documento resume la arquitectura actual para que futuras tareas de IA puedan orientarse rapido sin leer el repositorio completo. No sustituye al codigo fuente; es una guia de entrada para localizar responsabilidades, riesgos y checks.

## 1. Objetivo de la app

Isocrona Zero Campus es una aplicacion web para gestionar una comunidad formativa: socios, solicitudes, cursos, inscripciones, cuotas/pagos, diplomas, notificaciones y una Zona Test con tests privados, tests live y tests publicos en vivo.

El producto combina:

- Area privada de administracion.
- Area privada de socio/member.
- Flujos publicos de registro, verificacion y test live.
- Persistencia local/servidor con JSON, SQLite y PostgreSQL opcional.

## 2. Stack tecnico

- Runtime: Node.js >= 22.
- Backend: servidor HTTP nativo, sin Express.
- Frontend: HTML, CSS y JavaScript vanilla.
- Persistencia principal: `storage.js`.
- Base de datos opcional: `db.js` con PostgreSQL para usuarios/resultados cuando esta configurado.
- Autenticacion: cookies/sesiones legacy y soporte DB.
- CI/checks: scripts Node en `scripts/`.

## 3. Estructura principal de carpetas

| Ruta | Responsabilidad |
| --- | --- |
| `server.js` | Router principal y gran parte de la logica de negocio backend. |
| `server/` | Modulos extraidos de backend: HTTP, auth, transporte de estado y helpers de routing. |
| `storage.js` | Lectura/escritura del estado persistente y adaptadores de almacenamiento. |
| `db.js` | Integracion opcional con PostgreSQL. |
| `public/` | Frontend, paginas publicas, area privada y assets. |
| `public/assets/js/app/` | Modulos frontend nuevos/parciales para router, permisos, estado, API y vistas. |
| `scripts/` | Checks, smoke tests, importadores y utilidades de mantenimiento. |
| `docs/` | Documentacion tecnica y operativa. |

## 4. Archivos criticos

| Archivo | Que contiene | Precaucion |
| --- | --- | --- |
| `server.js` | Endpoints, routing, integracion de storage, socios, cursos, diplomas, Test Zone, live tests, email, import/export y automatizaciones. | Evitar cambios amplios. Tocar solo el bloque/endpoints necesarios. |
| `storage.js` | Persistencia del estado, backups, modo JSON/SQLite y helpers de lectura/escritura. | Revisar riesgos de perdida de datos y compatibilidad al cambiar esquemas. |
| `db.js` | Conexion y helpers PostgreSQL opcionales. | Mantener compatibilidad cuando no haya DB configurada. |
| `server/http.js` | `sendJson`, `sendJsonError`, `PayloadTooLargeError`, `readJsonBody`, `readJsonBodyOrDefault`, `sendPayloadTooLarge`, `sendRateLimited`, `checkRateLimit`, `getClientIp`, limites de payload. | Mantener codigos HTTP, headers y formato JSON. |
| `server/auth.js` | Sesiones/cookies, `getAuthenticatedAccount`, `requireAuthenticatedAccount`, `requireAdminAccount`, roles, auth DB/legacy y checks de acceso a recursos. | No cambiar formato de cookies/sesiones sin migracion. |
| `server/state-transport.js` | `prepareStateForTransport`, `buildMemberScopedState`, `sanitizeStateForAccount`, merge de estado scoped. | Critico para privacidad de `/api/state`. |
| `server/router-utils.js` | Wrappers reutilizables como `handleRoute`, `withAuth`, `withAdmin`, `withJsonBodyLimit`. | Usar incrementalmente; no reescribir router completo de golpe. |
| `public/assets/js/app/` | Cliente API, store, router, permisos de vistas y vistas parciales. | Aun convive con frontend monolitico en `public/app.js`. |
| `scripts/` | Checks automaticos y smokes. | Cualquier helper nuevo debe estar cubierto por check cuando sea razonable. |

## 5. Mapa de roles

| Rol | Donde aparece | Capacidades esperadas |
| --- | --- | --- |
| `admin` | Backend, frontend y estado. | Acceso completo a administracion, estado completo, socios, solicitudes, cursos, diplomas, emails, import/export y sesiones live. |
| `member` / socio | Backend legacy y frontend. En algunos datos DB puede mapear desde rol de socio. | Acceso autenticado a su estado scoped, perfil, cursos permitidos, inscripciones, pagos propios, diplomas propios, notificaciones propias y Zona Test de socio. |
| `instructor` | Puede existir como rol de dominio/plataforma en datos de socio. | No tratar como admin por defecto. Verificar cada endpoint antes de conceder permisos elevados. |
| Invitado | Usuario no autenticado. | Solo paginas/endpoints publicos: login, registro/solicitud, verificacion, cursos publicos y test live publico. |
| Participante live publico | Invitado con nombre + codigo de sesion. | Puede unirse y enviar respuestas a una sesion live publica activa/caducidad valida. No debe acceder a area privada ni respuestas correctas antes de enviar. |

## 6. Endpoints y familias principales

| Familia | Ejemplos | Acceso esperado |
| --- | --- | --- |
| Salud/publico | `/healthz`, paginas estaticas | Publico, sin datos internos sensibles. |
| Auth | `/api/login`, `/api/auth/login`, `/api/auth/register`, `/api/auth/me`, `/api/session`, `/api/logout`, `/api/account/change-password` | Publico para login/register; autenticado para `me`, session y cambio de password. |
| Recuperacion admin | `/api/recovery-admin` | Publico pero endurecido con rate limit y secretos/configuracion. |
| Estado | `/api/state` | Autenticado. Admin ve estado completo sanitizado; socio ve estado scoped. |
| Socios publicos | `/api/associates/public-config`, `/api/associates/apply`, `/api/public-campus/register`, `/api/public-campus/courses` | Publico, con limites de payload/rate limit. |
| Socios privados | `/api/associate-payments/submit`, `/api/associate-profile-requests`, `/api/member/courses/:id/enroll` | Socio autenticado o admin segun accion. |
| Admin socios/campus | `/api/admin/users`, endpoints de solicitudes, pagos, cursos, inscripciones | Solo admin salvo acciones de socio explicitamente permitidas. |
| Diplomas | `/api/diplomas/...`, `/api/verify`, `/api/verify/pdf` | Propios/admin para descarga privada; verificacion publica por codigo. |
| Zona Test | `/api/test-zone/questions`, `/api/test-zone/results`, `/api/test-zone/review-marks`, `/api/test-zone/live-sessions` | Admin para gestion completa; socio para vista scoped/resultados propios; publico solo live endpoints previstos. |
| Test live publico | `/api/test-zone/live/join`, `/api/test-zone/live-sessions/:id/attempt`, `/api/live-test-sessions/:code`, `/api/live-test-sessions/:code/submit` | Publico con codigo/nombre, rate limit, limites de payload y validacion de sesion. |
| Import/export/debug | `/api/storage*`, `/api/import/*`, `/api/debug/storage`, reportes CSV | Solo admin o deshabilitado fuera de desarrollo segun endpoint. |
| Email/SMTP/automation | `/api/smtp/test`, `/api/automation/*`, `/api/agent/*`, `/api/emails/*` | Solo admin salvo recursos propios con checks explicitos. |

Antes de tocar un endpoint, confirmar su condicion exacta en `server.js` y helpers de `server/auth.js`.

## 7. Flujo de `/api/state`

1. El cliente pide `/api/state`.
2. Backend autentica con helpers de `server/auth.js`.
3. Backend lee el estado desde `storage.js`.
4. Si el usuario es admin, prepara estado completo con sanitizacion de transporte.
5. Si el usuario es socio/member, construye estado scoped con `buildMemberScopedState` y despues lo pasa por `prepareStateForTransport`.
6. El estado scoped debe filtrar, como minimo:
   - preguntas con respuestas correctas/explicaciones cuando no correspondan;
   - resultados de otros socios;
   - resultados de invitados;
   - marcas de repaso de otros usuarios;
   - sesiones live completas si no es admin;
   - datos privados de otros socios.
7. En `POST /api/state`, admin puede persistir cambios completos; socio solo debe poder mergear campos permitidos con helpers scoped.

Este flujo es critico de privacidad. Cualquier cambio aqui debe incluir checks de scoping.

## 8. Flujo de Zona Test

- Banco de preguntas: normalmente en `state.testZoneQuestions`.
- Admin: crea/importa/edita preguntas, resultados y sesiones live.
- Socio: genera/evalua tests, guarda resultados propios, consulta historial, preguntas falladas y marcas de repaso.
- Publico live nuevo: usa `public-live-test.html` y endpoints `/api/test-zone/live/*`.

Puntos sensibles:

- No enviar respuestas correctas/explicaciones a socios o invitados cuando no corresponda.
- Resultados siempre asociados a socio, invitado o participante correcto.
- Evitar acceso lateral a resultados o marcas de repaso.
- Una pregunta marcada como repasada debe volver a aparecer si se falla de nuevo despues.

## 9. Flujo de test live

Hay dos sistemas que conviven y no deben confundirse:

| Sistema | Frontend | Endpoints | Uso |
| --- | --- | --- | --- |
| Test Zone live publico | `public-live-test.html` | `/api/test-zone/live/join`, `/api/test-zone/live-sessions/:id/attempt` | Sesiones publicas vinculadas a Zona Test. |
| Live test legacy/independiente | `live-test.html` y vistas privadas de tests | `/api/live-test-sessions/:code`, `/api/live-test-sessions/:code/submit`, `/api/live-tests*` | Tests live independientes o historicos. |

Reglas importantes:

- Validar siempre que las preguntas enviadas pertenecen a la sesion.
- Rechazar preguntas duplicadas o mas preguntas de las esperadas.
- Rechazar sesiones cerradas, inactivas o caducadas.
- Mantener limites amplios para clases con varios alumnos desde la misma red.
- No filtrar respuestas correctas antes de que proceda.

## 10. Flujo de socios, cursos y diplomas

1. Invitado consulta cursos publicos o solicita ser socio.
2. Solicitud publica entra por endpoints de `associates`/`public-campus`.
3. Admin revisa solicitud, pide informacion, aprueba/rechaza y puede crear acceso al campus.
4. Socio autenticado ve solo su estado, perfil, pagos, cursos, inscripciones, documentos, notificaciones y diplomas.
5. Socio puede inscribirse a cursos permitidos, subir justificantes y solicitar cambios de perfil.
6. Admin gestiona cuotas, pagos, inscripciones, asistencia, evaluaciones, contenido y disponibilidad de diplomas.
7. Diplomas se descargan de forma privada por socio/admin y se verifican publicamente por codigo.

Riesgos habituales:

- Acceso lateral por IDs de socio, curso, pago, diploma o adjunto.
- Formularios que guardan en frontend pero no persisten en `storage.js`.
- Estados de curso/inscripcion duplicados entre estructuras legacy y nuevas.

## 11. Checks disponibles

| Comando | Uso |
| --- | --- |
| `npm run check:app` | Check principal. Debe ejecutarse en casi cualquier PR. |
| `npm run smoke:campus-test` | Smoke funcional de campus/test. Ejecutar en cambios backend/frontend relevantes. |
| `npm run smoke:campus-live-test` | Checks de live tests. |
| `npm run check:frontend-syntax` | Sintaxis frontend. |
| `npm run check:test-zone-csv` | Importador CSV de Zona Test. |
| `npm run check:test-zone-ivaspe-csv` | CSV IVASPE de Zona Test. |
| `npm run check:test-zone-normalizer` | Normalizacion de preguntas Zona Test. |

Checks especificos frecuentes en `scripts/`:

- `check-auth-utils.mjs`
- `check-router-utils.mjs`
- `check-state-transport.mjs`
- `check-security-hardening.mjs`
- `check-rate-limits.mjs`
- `check-payload-limits.mjs`
- `check-live-tests.mjs`
- `check-member-notifications.mjs`
- `check-test-zone.mjs`

Antes de crear PR, ejecutar como minimo el check relacionado con el area tocada. Para cambios funcionales generales, ejecutar tambien `npm run check:app` y `npm run smoke:campus-test`.

## 12. Reglas para Codex y futuras tareas de IA

- No leer el repositorio completo.
- Empezar por este documento, `README.md`, `package.json` y solo los archivos directamente afectados.
- Para permisos frontend, revisar primero `public/assets/js/app/router/viewPermissions.js`.
- Para vistas, abrir solo los archivos necesarios en `public/assets/js/app/views/` y, si hace falta, el bloque concreto en `public/app.js`.
- Para backend, abrir primero el modulo especializado (`server/http.js`, `server/auth.js`, `server/state-transport.js`, `server/router-utils.js`) y despues el bloque concreto de `server.js`.
- No hacer refactors incidentales.
- Cambios pequenos y con alcance claro.
- Un PR por tarea.
- No push directo a `main`.
- Crear ramas con prefijo `codex/`.
- Ejecutar checks obligatorios antes de pedir merge.
- Mantener compatibilidad con auth legacy, auth DB y modo sin PostgreSQL.
- Mantener privacidad por defecto: socios e invitados nunca deben ver datos de otros usuarios.
- Confirmar si una tarea afecta al live nuevo de Zona Test o al live legacy antes de editar.

## 13. Lectura recomendada por tipo de tarea

| Tarea | Leer primero |
| --- | --- |
| Auth, login, cookies, roles | `server/auth.js`, bloque de endpoints auth en `server.js`, `public/assets/js/app/api/authApi.js`. |
| Payload/rate limit/HTTP | `server/http.js`, `server/router-utils.js`, endpoint concreto en `server.js`. |
| `/api/state` o privacidad de socio | `server/state-transport.js`, endpoint `/api/state` en `server.js`, checks de state/security. |
| Zona Test | Endpoints `test-zone` en `server.js`, `public/assets/js/app/views/testView.js`, `scripts/check-test-zone*.mjs`. |
| Live tests | Confirmar sistema: `public-live-test.*` para Zona Test live o `live-test.*`/`testsView.js` para legacy. |
| Socios/cursos/diplomas | Bloques `associates`, `public-campus`, `member/courses`, `diplomas` en `server.js`, vistas frontend relacionadas. |
| Checks/CI | `package.json`, `.github/workflows/app-checks.yml`, scripts concretos en `scripts/`. |

