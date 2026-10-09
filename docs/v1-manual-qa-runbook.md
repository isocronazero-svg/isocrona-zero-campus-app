# V1 — Runbook corto de QA manual

Objetivo: cerrar la issue #227 con una pasada manual/productiva corta, reproducible y sin añadir funciones nuevas.

Este documento complementa `docs/v1-qa-checklist.md`. CI sigue siendo la referencia para regresiones automatizadas; aquí solo se prueban comportamientos que necesitan navegador, dispositivos o producción real.

## Antes de empezar

Registrar:
- fecha/hora;
- SHA de `main` que se pretende validar;
- URL de producción;
- navegador/dispositivo usado;
- cuenta admin de prueba y cuenta socio de prueba;
- confirmar que no se usarán datos reales irreversibles.

No ejecutar migraciones de socios durante este QA. La PR #231 sigue separada.

## Recorrido 1 — Salud, login y permisos

1. Abrir `/healthz` y confirmar respuesta correcta.
2. Abrir portal en ventana normal y privada.
3. Login admin → PASS si carga administración sin errores visibles.
4. Activar Modo Socio → PASS si solo aparecen vistas/acciones del socio actual.
5. Volver a admin → PASS si recupera administración.
6. Login con socio de prueba → PASS si no aparecen acciones administrativas.
7. Logout → PASS si la sesión deja de dar acceso privado.

Registrar errores de consola si los hay.

## Recorrido 2 — Responsive

Probar al menos:
- móvil aproximado 390 px;
- tablet aproximado 768 px;
- escritorio aproximado 1440 px.

En portada, cursos, Test Zone y área de socio comprobar:
- sin scroll horizontal inesperado;
- botones principales pulsables;
- menús abren/cierran;
- formularios no se salen de pantalla;
- modales pueden cerrarse;
- textos críticos legibles.

## Recorrido 3 — Curso e inscripción

Con un curso de prueba:
1. Abrir ficha.
2. Confirmar un único CTA principal.
3. Probar inscripción gratuita si existe.
4. Probar inscripción con justificante usando archivo de QA, no documentación real.
5. Si es posible provocar/reproducir un fallo de subida controlado, comprobar que archivo y nota siguen montados para reintento.
6. Doble pulsación/reintento no debe crear dos solicitudes.
7. Curso lleno debe mostrar espera, no inscripción normal.

No alterar plazas/cursos reales sin autorización.

## Recorrido 4 — Diploma

Con diploma de prueba ya emitido:
1. Abrir vista previa.
2. Descargar/abrir PDF.
3. Confirmar A4 horizontal, anverso y reverso.
4. Comprobar contraste y temario legible.
5. Verificar código público.
6. Comprobar que otro socio no puede descargar diploma ajeno.

## Recorrido 5 — Test normal

### Examen
1. Crear test corto.
2. Responder varias preguntas.
3. Marcar una para repasar.
4. Finalizar.
5. Confirmar revisión, historial, estadísticas, falladas y marcadas.

### Aprendizaje
1. Crear test corto en Aprendizaje.
2. Antes de responder no debe verse solución.
3. Responder bien una y mal otra.
4. Confirmar feedback inmediato y explicación.
5. Intentar cambiar una respuesta ya corregida: no debe permitirlo.
6. Finalizar y confirmar resultado único en historial/estadísticas.

## Recorrido 6 — Test en Vivo

Necesita anfitrión + al menos dos participantes/dispositivos.

1. Crear sala nueva desde UI.
2. Entrar con dos participantes distintos.
3. Confirmar que lobby no duplica usuarios tras refrescar.
4. Iniciar pregunta.
5. Participante A responde y cambia A→B mientras sigue abierta.
6. Confirmar que sigue abierta mientras B no ha respondido.
7. Participante B responde.
8. Confirmar cierre automático al último participante.
9. Confirmar reveal de solución/distribución/clasificación.
10. Esperar ~6 s y confirmar avance automático sin pulsación del anfitrión.
11. Finalizar y confirmar podio.
12. Tras cierre, intentar cambiar respuesta: debe rechazarse.

Este recorrido es prioritario porque combina tiempo real, polling y varios clientes.

## Recorrido 7 — Avisos y WhatsApp

1. Publicar aviso de QA si existe espacio seguro para ello.
2. Adjuntar imagen/documento de prueba.
3. Confirmar visibilidad para socio previsto.
4. Confirmar que el adjunto abre con permisos correctos.
5. Probar la acción actual de compartir por WhatsApp.

No exigir publicación automática completa en Comunidad WhatsApp: está fuera de V1 mientras requiera integración externa.

## Recorrido 8 — Backup pre-cierre

Antes de cualquier migración real o piloto:
1. confirmar SHA desplegado y servicio/volumen correctos;
2. crear copia externa autorizada del estado persistente y uploads relevantes;
3. registrar fecha, responsable e inventario sin exponer datos sensibles;
4. hacer ensayo de recuperación aislado siguiendo `docs/BACKUP-RECOVERY.md`;
5. solo considerar PASS si la copia puede restaurarse y validarse, no solo descargarse.

## Registro de resultado

Para cada recorrido usar:
- PASS;
- FAIL reproducible;
- BLOQUEADO (indicar dependencia);
- NO APLICA.

Para cada FAIL anotar:
- pasos exactos;
- dispositivo/navegador;
- cuenta/rol de prueba sin credenciales;
- resultado esperado;
- resultado real;
- captura si ayuda;
- error de consola si existe.

## Criterio de cierre #227

Se puede cerrar #227 cuando:
- `main` tiene CI verde;
- los recorridos anteriores están en PASS o con riesgos residuales aceptados/documentados;
- no quedan P1/P2 en PR que vaya a integrarse en V1;
- producción corresponde al SHA validado o se documenta claramente la diferencia;
- existe plan de rollback y copia recuperable antes de operaciones de datos.

A partir de ese momento, nuevas funcionalidades pasan a V2.