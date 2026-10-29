# Prompt para Codex · evaluar y, si es seguro, privatizar el repositorio

Trabaja con `isocronazero-svg/isocrona-zero-campus-app`. Este encargo es de **seguridad de infraestructura**, no de funcionalidad.

## Objetivo

Comprobar si el repositorio puede pasar de `public` a `private` sin romper GitHub Actions ni los despliegues Railway de producción/QA. Solo cambiar la visibilidad si todas las comprobaciones previas son satisfactorias.

## Reglas críticas

- No tocar código funcional, datos, volúmenes ni secretos.
- No fusionar PR #292.
- No reiniciar ni redeployar producción solo para comprobar esto.
- No cambiar la visibilidad hasta verificar que la GitHub App/integración de Railway tiene acceso al repo privado tras el cambio.
- Si no puedes demostrar esa compatibilidad antes de la mutación, **NO cambies la visibilidad**: informa del bloqueo y deja pasos manuales concretos.

## Estado conocido

- Repo actual: público.
- Producción Railway: proyecto `zealous-warmth`, servicio `isocrona-zero-campus-test`, rama `main`.
- QA Railway: proyecto `isocrona-zero-v1-1-qa`, servicio `portal-v1-1-qa`, rama `feature/v1.1`, actualmente sin dominio público.
- GitHub Actions usa el propio repositorio y debe seguir funcionando en privado.

## Comprobaciones previas

1. Verifica permisos del usuario propietario sobre el repositorio.
2. Verifica la instalación/permisos de la GitHub App de Railway para este repositorio y si incluye repos privados.
3. Comprueba que producción y QA están conectados por la integración GitHub autorizada y no por una URL pública anónima.
4. Revisa si existe alguna integración externa que dependa de clonar el repo sin autenticación.
5. Documenta el riesgo y el rollback antes de mutar.

## Si todas las comprobaciones son positivas

1. Cambia la visibilidad del repositorio a `private` mediante una acción administrativa oficial de GitHub (`gh repo edit ... --visibility private` o API autenticada equivalente).
2. No borres historial ni branches.
3. Comprueba inmediatamente que:
   - GitHub sigue mostrando `visibility=private`;
   - PR #292 sigue abierto/draft;
   - GitHub Actions sigue disponible;
   - Railway sigue viendo el source repo de producción y QA;
   - producción continúa online en el mismo deployment y `main`;
   - QA sigue sin dominio público.
4. No fuerces un deployment de producción salvo necesidad real y autorización explícita.

## Si alguna comprobación no es concluyente

No cambies nada. Devuelve exactamente qué permiso o integración falta comprobar y los pasos de interfaz necesarios.

## Informe final

Indica:
- si se cambió o no la visibilidad;
- evidencia de acceso de Railway antes/después;
- estado de producción y QA;
- cualquier riesgo o paso manual pendiente.
