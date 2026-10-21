# V1 · Entrada de socios directamente al Campus

Feedback del piloto (21/10/2026): los socios perciben como engorroso que cada inicio de sesión aterrice en su ficha personal/cuota/documentación.

## Cambio V1

Para una cuenta de socio normal, después de un login correcto y en la carga inicial de una sesión autenticada:

- abrir `Campus` como vista principal;
- usar el modo de cursos del socio como destino inicial (`campusSectionMode = courses`);
- mantener `Mi perfil` disponible desde navegación para cuota, datos y documentación;
- no crear dashboard, inicio nuevo ni funcionalidades adicionales;
- no cambiar la pantalla inicial de administración;
- no ampliar permisos ni alterar el scoping del socio;
- si el socio está limitado por cuota y la lógica vigente fuerza `join`, conservar ese bloqueo y no saltárselo;
- no forzar Campus después de cada refresh/mutación: el cambio es solo para entrada/carga inicial, para no expulsar al usuario de la sección que esté usando.

## Regresión mínima

- socio normal: login -> Campus/Cursos;
- reload de sesión recién iniciada: mantiene un destino válido sin exponer vistas admin;
- navegación manual a Mi perfil sigue funcionando;
- admin: conserva su entrada actual;
- Modo Socio del admin: no obtiene permisos extra;
- socio limitado por cuota: conserva `join`;
- 401/caducidad y nuevo login vuelven a Campus para socio normal;
- móvil 390 px y escritorio sin overflow/regresión de navegación.

## Validación

Ejecutar `npm run check:app` y `npm run smoke:campus-test`, con revisión específica de `scripts/check-navigation.mjs`. No tocar datos productivos. PR pequeño y específico para V1.
