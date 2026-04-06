# Prepublicacion del Campus

## Objetivo
Dejar el campus listo para publicarse primero en una ruta de prueba de la web de Isocrona Zero y, despues, en produccion.

## Fase 1. Congelar estructura
- Mantener ya fija la estructura principal:
  - Portal de acceso
  - Socios y cuotas
  - Campus
  - Grupos internos
  - Informes y validacion
  - Actividad y auditoria
  - Asistente y automatizacion
- Evitar cambios grandes de arquitectura durante la fase de subida.

## Fase 2. Datos reales
- Confirmar que el Excel real de socios es la fuente maestra.
- Revisar:
  - numeros de socio
  - emails
  - cargos institucionales
  - accesos al campus
- Limpiar o separar demos antiguas si ya no aportan.

## Fase 3. Pruebas operativas minimas
- Socio real:
  - login
  - ver ficha
  - editar datos durante ventana de autoedicion
  - inscribirse a curso
  - entrar al aula
  - ver diploma
- Administracion:
  - buscar socio
  - abrir ficha
  - validar cambios
  - crear acceso
  - enviar bienvenida
  - validar inscripciones
  - cerrar curso
- Acceso solo campus:
  - alta externa
  - ver solo cursos publicos
  - inscripcion a curso publico
- Grupos internos:
  - crear modulo
  - subir documento
  - ver online
  - descargar
  - buscar y filtrar

## Fase 4. Infraestructura web
- Publicar primero en una ruta de prueba:
  - ejemplo: `https://www.isocronazero.org/campus-test`
- Configurar `IZ_BASE_URL` con esa URL.
- Confirmar que:
  - validacion publica usa la URL correcta
  - enlaces de solicitudes publicas usan la URL correcta
  - correos de bienvenida apuntan a la ruta correcta

## Fase 5. Correo real
- Configurar SMTP real.
- Probar:
  - bienvenida
  - acuse de solicitud
  - peticion de documentacion
  - resolucion

## Fase 6. Seguridad y acceso
- Revisar cuentas admin reales.
- Revisar cuentas de socio.
- Revisar acceso solo campus para externos.
- Confirmar que:
  - socios ven su ficha y campus
  - externos solo ven cursos publicos o propios
  - admin ve modulos administrativos completos

## Fase 7. Publicacion controlada
- Publicar primero para pruebas internas.
- Revisar durante varios dias:
  - errores de login
  - errores de guardado
  - inscripciones
  - diplomas
  - grupos internos
- Solo despues abrir el acceso general.

## Variables recomendadas
Usar como base [C:\Users\charl\OneDrive\Desktop\Isocrona Zero\.env.example](C:\Users\charl\OneDrive\Desktop\Isocrona Zero\.env.example)

## Señal de listo para web
El campus se puede considerar listo para subida de prueba cuando:
- el censo real este estable
- Carlos pueda usar admin y socio sin fallos
- un socio nuevo complete el circuito entero
- un externo complete el circuito de curso publico
- los correos y enlaces publicos ya no dependan de localhost
