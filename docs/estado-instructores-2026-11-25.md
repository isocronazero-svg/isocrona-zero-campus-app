# Acceso docente urgente - 25/11/2026

## Alcance y diagnostico

Base: main 9964ea7cd5fe10d5a7a41f717d7a4d7b9b3a867c.
Rama independiente: codex/urgent-assigned-instructor-access. No incluye PR #377.

El acceso academico y su interfaz exigian role=instructor ademas de la
asignacion instructorAssociateIds. Un socio asignado no obtenia acceso.
La edicion de cursos y bibliotecas seguia siendo exclusivamente administrativa.

## Correccion

- Permiso de curso determinado en servidor por asignacion actual para socios e
  instructores, conservando el acceso administrativo. Sin cambiar cuentas/roles.
- Campus muestra "Mis cursos como instructor" para socios con cursos asignados.
- Ruta docente limitada: alumnado mediante API academica existente; documentos
  del curso, seleccion/publicacion del test existente del banco y resultados.
- Archivos limitados a 20 MB; descarga autenticada, sin ejecutar HTML/SVG.
- Aportacion a subgrupos existentes solo para docentes con acceso al grupo;
  no concede administracion de grupos ni cambia sus reglas de acceso.
- Estado fresco tras lectura del cuerpo, conflicto de contenido obsoleto,
  preservacion de cambios docentes ante escritores administrativos concurrentes.
- Bytes excluidos del estado enviado al navegador y de respuestas docentes;
  persistencia en el almacenamiento existente, sin nuevo servicio externo.
- Sin permisos de tesoreria, cuotas o edicion global para el docente.
- Sin cambios en matriculas, certificados ni historicos; sin SMTP/automatizacion
  en las operaciones de contenido docente.

## Comprobaciones locales

Node 22.23.3, Windows. Solo datos ficticios y servidores en loopback.

- check:app: superado.
- check-course-academic: superado, incluyendo socio docente, curso ajeno,
  desasignacion en la misma sesion, documentos consecutivos, edicion, descarga,
  conflicto obsoleto, publicacion de test y aportaciones a grupos restringidos.
- check-state-transport y check-member-rendering: superados.
- check:frontend-syntax y git diff --check: superados.
- Playwright docente: escritorio Chromium, Android emulado e iPhone WebKit
  superados. Suite completa final: 12/12 superadas, incluyendo smoke HTTP.
  PR #378: https://github.com/isocronazero-svg/isocrona-zero-campus-app/pull/378
  CI del HEAD definitivo: consultar los checks de la PR; no se considera verde
  hasta que hayan terminado ambos workflows.
- Smoke HTTP aislado: superado (14 rutas).
- Revision P1/P2: protegidas aportaciones a grupos en la reconciliacion comun;
  los cambios administrativos de contenido versionado incrementan su revision,
  tanto por PATCH de curso como por estado. Regresiones de dos editores y de
  documento eliminado sin resurreccion superadas.
- Documento con visibilidad `interno`: oculto del estado del alumno y descarga
  directa denegada, conservando el acceso del docente asignado. Regresion HTTP
  con alumno inscrito y cambio de visibilidad superada.

## Pendiente antes de publicar

- CI y revision de la PR urgente en el HEAD definitivo.
- Verificacion de la cuenta real afectada: no se pudo consultar la vinculacion
  porque la pestana productiva muestra login. Se ha solicitado acceso admin;
  no se han consultado ni modificado datos reales.
- Confirmar en lectura account.associateId y la asignacion al curso afectado.
- Autorizacion de publicacion y comprobacion funcional tras el despliegue.
- Moviles fisicos: no probados en esta intervencion; pruebas automatizadas
  usan emulacion Android/WebKit, no dispositivos reales.

No se ha publicado, fusionado ni modificado Railway, produccion o FIREZONE.
