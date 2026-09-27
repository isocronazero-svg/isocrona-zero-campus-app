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

Comprobar el estado de la PR `codex/finish-community-questions` y el despliegue del commit fusionado antes de afirmar que el bloque está publicado.

## Siguientes bloques

1. Reconciliar #197 (grupos/subgrupos, adjuntos y borradores) con main y verificar sus recorridos.
2. Completar patrocinadores desde #199: la petición original requiere 5–10 imágenes con rotación y uno/dos espacios superiores; la PR antigua solo ofrece tres banners estáticos y no cumple todavía esa experiencia.
3. Revisión visual y funcional real de socio/administrador, aportaciones y directo con varios participantes.
4. Corregir los fallos encontrados y comprobar el portal publicado.

El fallo conocido del segundo proyecto Railway `outstanding-wholeness` es independiente del servicio del portal. Comprobar siempre el contexto productivo correcto.
