# Seguridad de la tienda

Estado al 26 de octubre de 2026. Para reportar una falla, ver [`SECURITY.md`](../SECURITY.md).

## Medidas implementadas

### Pagos y pedidos
- Los precios, descuentos y envíos se calculan siempre en el servidor con los datos de la base; lo que manda el navegador (precios, totales) se ignora.
- El stock se descuenta en una transacción con control de concurrencia: dos compras simultáneas no venden la misma unidad.
- **Vencimiento de pedidos impagos**: cada pedido reserva el stock por un plazo según el medio de pago (`orderHoldHours` en `src/config/store.ts`); después se cancela solo y el stock vuelve. La preferencia de Mercado Pago y el cupón vencen junto con la reserva.
- Si igual llega un pago aprobado de un pedido vencido, se registra (la plata entró) y queda un aviso en el log para revisar el stock.
- **Tope por cliente**: máximo 3 pedidos impagos por DNI, email o teléfono.
- **Webhook de Mercado Pago**: valida la firma HMAC (`x-signature`) con comparación en tiempo constante, valida el formato del ID, limita el tamaño del cuerpo y nunca confía en su contenido: consulta el pago a la API de Mercado Pago y controla moneda (ARS) y monto (≥ total). Es idempotente, así que reenviar notificaciones viejas no tiene efecto.
- El link de cada pedido usa un token aleatorio de 192 bits, se valida su formato y la página va sin caché, sin indexar y sin Referer.

### Abuso y bots
- Límite de intentos por IP (en memoria) en checkout, turnos, cotizador de envío y QR (`src/lib/rate-limit.ts`).
- Campo trampa (honeypot) en el checkout y en los turnos.
- Tope de 2 turnos futuros por teléfono en el taller.
- Validación en el servidor de DNI, teléfono, email y largos máximos de todos los campos; tope de 200 KB por envío de formulario.

### Navegador
- Cabeceras: `Content-Security-Policy` (solo recursos propios más Google Maps y YouTube), `Strict-Transport-Security`, `X-Frame-Options: DENY` y `frame-ancestors 'none'` (anti clickjacking), `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy` y `Cross-Origin-Opener-Policy`. Sin cabecera `X-Powered-By`.
- React escapa todo el contenido; el único HTML inyectado es el SVG del QR, que lo genera la librería `qrcode` en el servidor.
- Sin cookies de seguimiento. El carrito vive solo en el navegador.

### Servidor
- Caddy adelante con HTTPS automático, redirección de http a https y tope de 1 MB por pedido.
- La app y la base no se exponen a internet; la base está en una red de Docker sin salida.
- El contenedor de la app corre como usuario sin privilegios, con sistema de archivos de solo lectura, sin capacidades de Linux y con `no-new-privileges`.
- Ningún secreto entra en la imagen de Docker (`.dockerignore`); los secretos van en `.env` con permisos 600.

### Dependencias y repositorio
- `npm audit` sin vulnerabilidades (postcss y deepmerge-ts forzados a versiones corregidas con `overrides`).
- Workflow `Seguridad` en GitHub Actions: `npm audit` y chequeo de tipos en cada push, cada PR y todos los lunes.
- Dependabot para npm, GitHub Actions y Docker.

### Legales
- Política de privacidad (Ley 25.326, con la leyenda obligatoria de la AAIP), términos y condiciones, cambios, garantía y botón de arrepentimiento. El checkout pide aceptarlos.

## Pendientes (fuera del código o a decidir)

| # | Punto | Quién | Detalle |
|---|---|---|---|
| 1 | Activar en GitHub: secret scanning, push protection, Dependabot alerts, CodeQL y protección de la rama principal | Dueño del repo | Settings → Code security, y Settings → Branches. |
| 2 | Panel de administración | Desarrollo | Todavía no existe. Cuando se haga: login con 2FA, sesiones cortas, registro de acciones. Es lo más delicado del proyecto. |
| 3 | CAPTCHA (Cloudflare Turnstile) | Desarrollo + cuenta Cloudflare | Los límites por IP y el honeypot frenan bots simples; uno distribuido en muchas IPs necesita CAPTCHA o un WAF (Cloudflare delante del servidor). |
| 4 | Servidor (VPS) | Quien lo administre | Firewall solo con 22/80/443, SSH solo con llave, actualizaciones automáticas (`unattended-upgrades`), fail2ban. |
| 5 | Backups de la base | Quien lo administre | `pg_dump` diario, cifrado y fuera del servidor, con prueba de restauración. |
| 6 | Monitoreo y alertas | Desarrollo | Hoy los avisos (pagos tardíos, montos menores) quedan solo en el log. Falta mandarlos por email o a un servicio como Sentry. |
| 7 | Credenciales de Mercado Pago | Dueño | Usar las de producción solo en el servidor, activar 2FA en la cuenta y rotar el token si alguien que lo vio deja el proyecto. |
| 8 | Datos legales reales | Dueño | Razón social y CUIT (`legal` en `store.ts`), datos bancarios, y confirmar la política de cambios (hoy 30 días). Hacer revisar los textos legales por un abogado o contador. |
| 9 | Registro de la base ante la AAIP | Dueño | La Ley 25.326 pide inscribir las bases de datos con datos personales en el Registro Nacional de Bases de Datos. |
| 10 | Borrado periódico | Desarrollo | Tarea que anonimice turnos de más de 2 años (lo que promete la política de privacidad). |
| 11 | CSP con nonces | Desarrollo | La CSP permite scripts inline porque Next los necesita; con nonces se puede sacar `'unsafe-inline'`, a costo de que todas las páginas pasen a ser dinámicas. |
| 12 | Límite por IP en memoria | Desarrollo | Sirve con un solo servidor. Si algún día hay varias instancias, pasarlo a Redis. |
