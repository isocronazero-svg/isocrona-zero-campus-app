# SMTP para avisos a socios activos

Objetivo: poder escribir a los socios activos importados desde el Excel sin crearles cuenta de campus uno por uno.

## 1. Crear o usar un buzon real

Usa una cuenta real del dominio, por ejemplo:

- `campus@isocronazero.org`
- `info@isocronazero.org`

No pegues la contrasena en el chat. Debe guardarse solo dentro de la configuracion del campus o del proveedor.

## 2. Configuracion SMTP habitual en Hostinger

Opcion recomendada:

- Host: `smtp.hostinger.com`
- Puerto: `465`
- SSL / seguro: activado
- STARTTLS: desactivado
- Usuario: el correo completo, por ejemplo `campus@isocronazero.org`
- Contrasena: la contrasena del buzon
- Remitente: el mismo correo del buzon
- Nombre remitente: `Isocrona Zero Campus`

Alternativa si el proveedor lo pide:

- Puerto: `587`
- SSL / seguro: desactivado
- STARTTLS: activado

## 3. Probar antes de enviar a socios

En el campus:

1. Entra como administracion.
2. Ve a `Informes y validacion > Agente`.
3. Rellena la seccion SMTP.
4. Pon tu correo en `Destinatario de prueba`.
5. Guarda.
6. Pulsa `Probar SMTP`.

Si el correo de prueba llega, ya puedes preparar una novedad.

## 4. Crear una novedad para socios activos

1. Ve a `Asistente y automatizacion > Novedades`.
2. Escribe titulo y mensaje.
3. En `Destinatarios`, elige `Socios activos`.
4. Marca `Registrar tambien en salida de correo`.
5. Pulsa `Publicar novedad`.

Esto crea el aviso en el campus y deja los correos preparados en la bandeja de salida.

## 5. Enviar la bandeja

1. Ve a `Asistente y automatizacion > Salida`.
2. Revisa el contador de pendientes.
3. Pulsa `Enviar pendientes por SMTP`.

El sistema procesa un lote de hasta 200 correos por pulsacion para evitar envios demasiado grandes de golpe.

