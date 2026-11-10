# Registro de ciclos autónomos V1.3

## 2026-11-10 — #345
- Base: `main`; PR #349 V1.3 y PR #350 gobernanza abiertas, CI de ambas en verde antes de este cambio.
- Railway QA aislado: proyecto `isocrona-v13-qa-aislado`, servicio `portal-v13-qa`; último despliegue consultado SUCCESS (2026-11-09 22:38 UTC). Sin despliegues ni acceso a datos reales.
- Cambio: prueba Playwright móvil con respuesta sintética 403 para el visor de justificantes PDF. No cambia lógica de permisos ni contenido del portal.
- Commit inicial: `8c677012350cf79d941a66d3a038e93611c2f155`.
- Pruebas locales: NOT RUN (conector GitHub sin terminal). CI de este commit: pendiente de comprobar. El test de navegador puede requerir ejecución Playwright independiente.
- Riesgo: prueba exclusivamente; rollback: revertir el commit.
- Próximo paso: verificar CI de PR #351 y ejecutar test Playwright en entorno aislado; ampliar a 401/404 solo tras validar el primer escenario.
- Consumo de créditos: no disponible; sin APIs de pago ni cambios productivos.
