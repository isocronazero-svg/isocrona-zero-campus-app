# Estado actual — 28 de septiembre de 2026

Repositorio: `isocronazero-svg/isocrona-zero-campus-app`.
Portal: https://portal.isocronazero.org.

## Base verificada al retomar

- `main`: `5bffd899e9b0a7cb82cc7a8d97c5f8fbeba58006`, PR #209 fusionada.
- Railway confirma éxito para `zealous-warmth / isocrona-zero-campus-test` en ese commit.
- Test en Vivo canónico completo: sala, pregunta sincronizada, temporizador, revelado, puntuación, clasificación y podio (#200, #201, #203–#208).
- Modo Socio del administrador y navegación unificada integrados (#209).
- #196 y #202 cerradas sin fusionar por estar superadas. No recuperar sus implementaciones live.
- Los apartados antiguos de `estado-web-2026-09-23.md` son un histórico; prevalece este estado.

## Bloque completado en esta sesión: Añadir preguntas

Rama: `codex/finish-community-questions`, construida desde el main actual.

- Tercera entrada de Zona Test, disponible para socios y administración.
- Formulario de pregunta individual, guía de colaboración y mensaje de trabajo en equipo.
- CSV modelo descargable, comprobación previa, lote de hasta 20 archivos y control de duplicados.
- Aportaciones de socios pendientes de validación. No aparecen en los tests ni se comparten entre socios antes de aprobarlas.
- Administración puede corregir, guardar, validar/publicar o retirar una aportación. Edición y retirada de preguntas publicadas mediante el gestor existente.
- El administrador en Modo Socio ve y envía sus propias aportaciones a revisión.
- Control de revisión concurrente, preservación ante guardados generales antiguos y persistencia tras reinicio.
- Formularios manuales bloqueados durante el envío, conservados ante error y seguros frente a doble clic.

### Validación ejecutada

- `npm run check:app`: PASS, incluyendo Test en Vivo y recorridos académicos existentes.
- Integración real con servidor local y datos sintéticos: permisos, privacidad, manual/CSV, corrección, aprobación, rechazo, reintento, conflicto de versiones, guardado antiguo y reinicio.
- UI mediante DOM simulado: socio/admin como socio, contenido escapado, conservación ante fallo de red y doble envío.
- `npm run smoke:campus-test`: PASS en ocho rutas, incluidas página/JS/CSS de preguntas.
- Revisión visual pendiente: el entorno carecía de navegador y la descarga del ejecutable falló. No se afirma QA visual.
- No se cambiaron datos reales de socios, pagos, cursos o preguntas para realizar estas pruebas.

### Publicación autorizada

El usuario autorizó el 28 de septiembre subir estos cambios a `isocronazero-svg/isocrona-zero-campus-app`, fusionarlos tras checks verdes y publicarlos en el portal. El bloqueo previo de autorización queda resuelto.

PR #210 fusionada y publicada: `b94cf57d197df4a62511d34d88a1dcaaa9e5f85d`. App checks #255 y servicio productivo Railway correctos. Portal comprobado: health 200, HTML/JS/CSS de preguntas y navegación coinciden exactamente con el código, API de aportaciones sin sesión devuelve 401.

## Siguientes bloques

1. Grupos publicados en #211; #197 cerrada por estar superada.
2. Publicar el bloque de patrocinadores rotatorios descrito debajo; sustituye #199.
3. Revisión visual y funcional real de socio/administrador, aportaciones y directo con varios participantes.
4. Corregir los fallos encontrados y comprobar el portal publicado.

El fallo conocido del segundo proyecto Railway `outstanding-wholeness` es independiente del servicio del portal. Comprobar siempre el contexto productivo correcto.


## Grupos internos: bloque publicado el 28 de septiembre

Rama `codex/finish-campus-groups`, basada en el main publicado de #210. Reaprovecha #197 y resuelve su conflicto de integración manteniendo todas las comprobaciones nuevas de Zona Test.

- Adjuntos pendientes conservados al navegar entre subgrupos/categorías y al fallar un guardado.
- Guardar con filtros mantiene los recursos no visibles; las descripciones pueden vaciarse.
- Nuevo guardado limitado al grupo activo, exclusivo de administración y sin cambiar permisos de acceso ni otros grupos.
- Control de versión: una pestaña antigua recibe 409 en lugar de borrar la actualización reciente. Guardados generales antiguos tampoco revierten contenido ya guardado por este endpoint.
- Los borradores se separan por cuenta. Respuestas de guardado de una cuenta anterior no alteran la vista de otra cuenta.
- El guardado espera a que termine de leerse el archivo; cada subida conserva su destino original.
- Máximo 20 MB por archivo / 40 MB por petición. Los archivos pendientes sin bytes deben seleccionarse otra vez tras recargar, incluidos reemplazos de archivos existentes.
- Estado de cambios pendientes, actualización de biblioteca y descarte explícito del borrador con confirmación.
- Los socios ven únicamente los grupos autorizados y no reciben controles ni borradores de administración.

Validación local: suite completa correcta; prueba específica de grupos ampliada con filtros, vaciado, permisos 401/403, contenido ajeno intacto, descargas, 413, reinicio, versiones obsoletas, reemplazos pendientes, cambio de cuenta y subida en curso. Sintaxis y diff sin errores. Pruebas con datos sintéticos; revisión visual no repetida en este entorno.

PR #211 fusionada y publicada: `c27ffd03969c052256a5a304f952c222e24fd858`. App checks #257 correctos, Railway productivo y archivos del portal verificados. #197 cerrada por estar superada.


## Patrocinadores rotatorios: bloque preparado el 28 de septiembre

Rama `codex/rotating-sponsors`, basada en #211. Sustituye la propuesta estática de #199.

- Administración → Informes y validación → Patrocinadores: hasta diez imágenes, carga individual o múltiple, vista previa, nombre y enlace opcional.
- Adaptación de PNG/JPEG/WebP a un máximo de 1600 × 600, sin recorte, con límite de 500 KB por imagen preparada. También admite URL HTTPS o local.
- Uno o dos espacios superiores; uno en móvil. Intervalo configurable de 5–30 segundos. Desactivado inicialmente hasta cargar y activar contenido real.
- Pausa/reanudación, anterior/siguiente, pausa con cursor, foco o pestaña oculta; preferencia de movimiento reducido respetada. No aparece en Zona Test.
- Solo administración puede guardar. Control de versión, reintento idempotente, protección ante guardados generales antiguos y formularios conservados cuando falla la petición.
- La carga múltiple se aplica completa después de validar todas las imágenes; un archivo dañado no deja un lote a medias. Enlaces y datos de imagen validados en servidor.
- Los socios y visitantes solo reciben imágenes activas. Ningún logo ni dato real se ha añadido como parte del desarrollo.

Pruebas específicas: rotación de diez imágenes, móvil simulado, pausa, movimiento reducido, fallos de imagen/red, cambios de navegación, cargas múltiples, límites, permisos, versiones, reinicio y aislamiento de ajustes existentes. La revisión visual con navegador real sigue pendiente por falta de ejecutable en este entorno. Confirmar CI, fusión y Railway antes de considerar este bloque publicado.

Validación local final: `npm run check:app` completo correcto, prueba específica de cargas múltiples correcta y smoke local de diez rutas correcto, incluidos módulo JS y API pública de patrocinadores.
