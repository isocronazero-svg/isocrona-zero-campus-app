## Estado de prepublicacion - 3 abril 2026

### Situacion general

El campus ya esta en un punto valido para **prepublicacion interna** en la web de Isocrona Zero, siempre que se haga primero en una ruta o subdominio de prueba y no todavia como acceso final para todos.

### Lo que hoy ya queda suficientemente estable

- Portal de entrada con tres caminos claros:
  - socio
  - acceso solo campus
  - hazte socio
- Censo real cargado desde Excel:
  - `125 socios`
- Acceso de Carlos funcionando como:
  - administracion
  - socio y alumno
- `Socios y cuotas` visible de nuevo para administracion y bastante mas ligero.
- `Cursos` y `Curso activo` simplificados para reducir duplicidades visuales.
- `Inscripcion` y `lista de espera` mas claras.
- `Grupos internos` con:
  - modulos
  - recursos
  - adjuntos
  - `Ver online`
  - `Descargar`
  - busqueda y filtros
- Visor PDF propio dentro del campus.
- Validacion publica y diplomas funcionando.

### Mejoras cerradas hoy

- Limpieza fuerte de `Socios y cuotas`:
  - sin modo `Todo` visible
  - sin bloque resumen redundante
  - sin buscador secundario duplicado
  - filtros mas compactos
- Limpieza de `Curso activo`:
  - menos filas de tarjetas repetidas
  - una sola capa clara de orientacion
- `Vista alumno` desde `Curso activo > Alumnado` entra ya en modo real de previsualizacion.
- El contenido del diploma ya no arrastra `[object Object]`.
- `Ver online` de PDFs ya no depende del visor del navegador.

### Riesgos residuales antes de publicar en produccion

- Falta configurar correo real SMTP y probarlo con cuentas reales.
- Hay que hacer una pasada manual corta de humo en web de prueba:
  - login socio
  - admin
  - acceso solo campus
  - inscripcion publica
  - grupos internos
  - diploma
- Conviene revisar 2 o 3 socios reales mas, ademas de Carlos, para detectar datos heredados del Excel.

### Recomendacion honesta

Mañana ya se puede decir:

- **Si**, podemos preparar una **prepublicacion** en la web.
- **No**, todavia no recomendaria abrirlo directamente como produccion final para todos sin una fase previa de prueba.

### Siguiente paso recomendado

1. Crear entorno web de prueba:
   - por ejemplo `campus-test` o un subdominio equivalente
2. Configurar:
   - `IZ_BASE_URL`
   - SMTP
3. Hacer una prueba operativa corta con:
   - Carlos admin
   - Carlos socio/alumno
   - un externo solo campus
4. Si eso pasa bien, abrir prepublicacion interna.
