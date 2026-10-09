# Migración de socios — reglas de negocio propuestas

Estado: **BORRADOR PARA VALIDAR CON SECRETARÍA**.

Objetivo: fijar decisiones antes de importar datos reales. Este documento no autoriza ninguna migración y no sustituye `docs/member-import-qa.md` ni `docs/BACKUP-RECOVERY.md`.

Principio general recomendado: **la migración debe ser conservadora**. Un dato existente y no vacío en el portal no se modifica automáticamente por un Excel legacy.

## 1. Identidad del socio

Propuesta:
- intentar identificar por email normalizado y DNI/NIE normalizado;
- si ambos apuntan a la misma ficha, tratar como socio existente;
- si apuntan a fichas distintas, BLOQUEAR;
- si un email/DNI está repetido entre fichas existentes, BLOQUEAR;
- si el mismo email/DNI aparece duplicado en el Excel, BLOQUEAR la colisión;
- no fusionar fichas automáticamente.

Decisión secretaría: **APROBAR / CAMBIAR**.

## 2. Prioridad portal ↔ Excel

Propuesta:
- ficha existente: el portal es la fuente autoritativa para campos no vacíos;
- Excel solo puede completar huecos;
- si Excel y portal contienen valores distintos no vacíos, no elegir automáticamente: mostrar discrepancia y dejar la fila bloqueada/revisable;
- nunca borrar un dato del portal porque la celda de Excel venga vacía.

Aplica a nombre, apellidos, email, DNI/NIE, teléfono, servicio, mes de cuota y número de socio.

Decisión secretaría: **APROBAR / CAMBIAR**.

## 3. Número de socio

Propuesta:
- socio existente con número: conservar siempre el número del portal;
- socio existente sin número + Excel con número válido y libre: completar tras revisión;
- socio nuevo con número válido y libre en Excel: conservarlo;
- número repetido en Excel o ya asignado a otra ficha: BLOQUEAR;
- socio nuevo sin número: asignar el siguiente número libre después de reservar todos los números válidos del Excel;
- nunca renumerar socios existentes durante esta migración.

Decisión secretaría: **APROBAR / CAMBIAR**.

## 4. Estado: activa / baja / revisión

Propuesta:
- socio existente: conservar el estado actual del portal; el Excel no reactiva ni da de baja automáticamente;
- si una observación del Excel contradice el estado del portal, dejar aviso para revisión humana;
- socio nuevo con indicación clara de baja: no crear como activa automáticamente; requerir revisión explícita y decidir si se importa como `Baja`;
- socio nuevo con datos incompletos pero importables: `Revisar documentación` cuando corresponda;
- no enviar comunicaciones automáticas durante la migración.

Decisión secretaría: **APROBAR / CAMBIAR**.

## 5. Fecha de alta

Propuesta:
- socio existente: conservar la fecha de alta del portal;
- socio nuevo: usar la fecha legacy solo si es válida y su significado está confirmado;
- si el Excel no contiene una fecha fiable, no inventar una fecha histórica; registrar la limitación y usar la política que decida secretaría.

Decisión necesaria: definir qué columna/fecha legacy representa realmente el alta y qué hacer cuando falte.

## 6. Cuotas 2024–2027

Propuesta:
- una celda vacía significa “sin dato”, no `0`;
- un `0` explícito se conserva como dato explícito, pero nunca debe borrar/reducir un pago positivo ya registrado en portal;
- si portal ya tiene importe positivo y Excel trae otro importe distinto, BLOQUEAR/revisar;
- si portal no tiene importe para ese año y Excel trae importe válido positivo, permitir completar tras revisión;
- los pagos ya registrados no se vuelven a sumar;
- años existentes en portal fuera de 2024–2027 no se eliminan ni sobrescriben.

Decisión secretaría: confirmar si los importes del Excel representan **pagado acumulado**, **cuota exigida** u otro concepto. No importar datos reales hasta aclararlo.

## 7. Campo “Anual / acumulado”

Propuesta:
- tratarlo como dato de control durante preview;
- no usarlo para sobrescribir automáticamente cuotas por año ni pagos;
- si no cuadra con el desglose anual, mostrar discrepancia para revisión.

Decisión secretaría: definir su significado exacto y si debe persistirse como campo independiente.

## 8. Mes de última cuota

Propuesta:
- ficha existente con valor: conservar portal;
- ficha existente vacía: completar desde Excel si el valor es reconocible;
- discrepancia no vacía: revisar, no sobrescribir;
- socio nuevo: importar valor normalizado si es válido.

Decisión secretaría: **APROBAR / CAMBIAR**.

## 9. Observaciones

Propuesta:
- nunca sustituir observaciones existentes del portal;
- añadir una nota de procedencia de migración sin duplicarla en reimportaciones;
- conservar observación legacy relevante como contexto, pero no usar texto libre para ejecutar cambios sensibles sin revisión;
- no incluir información sensible innecesaria en logs o issues públicos.

Decisión secretaría: **APROBAR / CAMBIAR**.

## 10. Cuenta vinculada / acceso al campus

Propuesta:
- socio existente: conservar `linkedAccountId`, `linkedMemberId`, acceso, contraseña temporal y estado de bienvenida;
- no sincronizar/crear/reasignar cuentas vinculadas durante la importación masiva;
- socio nuevo importado: crear la ficha de socio sin conceder acceso automáticamente, salvo flujo posterior explícito;
- no mandar emails de bienvenida durante la migración.

Decisión secretaría: **APROBAR / CAMBIAR**.

## 11. Justificantes y archivos

La PR #231 no concilia justificantes históricos ni hojas auxiliares.

Propuesta:
- no inferir pagos a partir de nombres/rutas de archivos durante esta migración;
- no borrar ni mover justificantes existentes;
- tratar conciliación de justificantes como trabajo separado si realmente hace falta.

Decisión secretaría: **APROBAR / CAMBIAR**.

## 12. Reimportación e idempotencia

Propuesta:
- volver a analizar el mismo Excel no debe duplicar socios ni pagos;
- cada commit requiere `previewToken` vigente;
- cualquier cambio del Excel o del censo entre preview y commit obliga a analizar de nuevo;
- filas dudosas requieren aprobación individual con `previewRowId` único;
- una segunda importación debe conservar todos los datos existentes y añadir únicamente cambios autorizados pendientes.

Decisión secretaría: **APROBAR / CAMBIAR**.

## 13. Condiciones previas a la importación real

Obligatorias:
1. #231 sin P1/P2 abiertos y tests verdes.
2. Reglas de este documento validadas por secretaría.
3. Identificar el Excel exacto y congelar una copia fuente.
4. Confirmar servicio, volumen y SHA de producción.
5. Crear copia externa recuperable de estado + uploads + bases aplicables.
6. Ensayar restauración aislada.
7. Ejecutar preview/dry-run y revisar recuentos.
8. Registrar cuántas filas están `ready`, `review` y `blocked`.
9. Autorizar explícitamente el commit real.
10. Verificar después recuentos, una muestra de fichas y reinicio/persistencia.

## 14. Criterio de abortar

No continuar si:
- no existe copia recuperable;
- los recuentos del preview no cuadran con el Excel esperado;
- aparecen identidades ambiguas no entendidas;
- cuotas/pagos no tienen significado confirmado;
- el SHA/servicio/volumen no son los esperados;
- existe cualquier P1/P2 abierto en la PR que se vaya a desplegar.

## Decisiones pendientes — resumen para secretaría

Marcar antes de migrar:
- [ ] Portal gana frente al Excel en datos no vacíos.
- [ ] Política de estados/bajas aprobada.
- [ ] Política de números de socio aprobada.
- [ ] Significado de cuotas 2024–2027 confirmado.
- [ ] Significado de “Anual/acumulado” confirmado.
- [ ] Política de fecha de alta definida.
- [ ] Observaciones legacy: conservar como contexto, sin automatismos sensibles.
- [ ] No crear cuentas ni enviar emails durante la importación.
- [ ] Justificantes quedan fuera de esta migración.
- [ ] Backup + restauración de ensayo obligatorios.