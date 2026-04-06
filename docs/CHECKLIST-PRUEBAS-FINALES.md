# Checklist de pruebas finales

## 1. Acceso y sesiones
- Entrar como administrador real:
  - `sal.ro.carlos@gmail.com`
  - `IZ-carl-1`
- Cambiar entre:
  - `Administracion`
  - `Mi perfil socio y alumno`
  - `Previsualizar otra persona`
- Confirmar que no se pierde el estado al cambiar de vista.

## 2. Socios y cuotas
- Abrir `Socios y cuotas`.
- Pulsar `Ver todo el censo`.
- Buscar por:
  - nombre
  - numero de socio
  - DNI
  - email
- Abrir una ficha.
- Revisar:
  - telefono
  - DNI/NIE
  - email
  - servicio
  - cuota anual
- Probar:
  - crear acceso
  - enviar bienvenida
  - cerrar revision

## 3. Mi perfil socio
- Entrar en `Mi perfil socio y alumno`.
- Abrir `Mi ficha de socio`.
- Confirmar que:
  - la ficha carga
  - los avisos de pendientes son reales y no heredados
  - se puede guardar durante la ventana de autoedicion
- Si ya no hay cambios, el sistema debe decirlo claramente.

## 4. Cursos
- Entrar en `Campus > Cursos`.
- Revisar:
  - cursos abiertos
  - proximos cursos
  - historial
- Abrir un curso:
  - con inscripcion abierta
  - en espera
  - ya completado
- Confirmar que el CTA principal siempre coincide con el estado real:
  - inscribirme
  - ver solicitud
  - entrar al aula
  - ir a mis diplomas

## 5. Inscripcion
- Entrar en la pestana `Inscripcion`.
- Confirmar:
  - plazas libres
  - lista de espera
  - importe
  - justificante
  - siguiente paso
- En admin:
  - revisar solicitud
  - pedir justificante
  - validar
  - rechazar

## 6. Aula virtual
- Abrir `Mi aula`.
- Probar:
  - `Ruta`
  - `Sesiones`
  - `Recursos`
  - `Valoracion`
- Confirmar que:
  - no hay bloques duplicados
  - el diploma no aparece duplicado dentro del aula
  - el curso completado empuja a `Mis diplomas`

## 7. Diplomas
- Entrar en `Mis diplomas`.
- Abrir HTML.
- Descargar PDF.
- Probar `Informes y validacion`.
- Confirmar que la validacion publica funciona.

## 8. Grupos internos
- Entrar en `Campus > Grupos internos`.
- Elegir un grupo y un modulo.
- Probar:
  - anadir documento
  - anadir enlace
  - `Ver online`
  - `Descargar`
  - buscar
  - filtrar por `Con archivo` y `Solo enlaces`

## 9. Acceso solo campus
- Cerrar sesion.
- Crear un acceso `solo campus`.
- Confirmar:
  - ve solo cursos publicos
  - tras inscribirse solo ve sus cursos
  - no ve partes internas de socio o administracion

## 10. Correos y enlaces
- Revisar bienvenida.
- Revisar enlace de seguimiento de solicitud.
- Revisar validacion publica.
- Confirmar que no apuntan ya a rutas incorrectas.
