# Seguridad de la tienda

Estado al 29 de octubre de 2026. Para reportar una falla, ver [`SECURITY.md`](../SECURITY.md).

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

### Panel de administración
- Sin registro público: los usuarios se crean por consola en el servidor (`npm run admin`).
- Ingreso con email, contraseña y **código de app de autenticación (2FA, TOTP)** en el mismo paso. El mismo código no sirve dos veces.
- Contraseñas con scrypt y sal propia (mínimo 12 caracteres, se rechazan las obvias). El secreto del 2FA se guarda cifrado (AES-256-GCM) con `ADMIN_SECRET`, que vive solo en `.env`: con una copia de la base sola no se pueden generar códigos.
- Mensaje de error único ("email, contraseña o código incorrectos") y la misma demora exista o no el email. Límite de 10 intentos por IP cada 15 minutos y bloqueo de la cuenta 15 minutos tras 5 fallos.
- **Sesiones cortas**: se cierran tras 1 hora sin uso y siempre a las 8 horas. La cookie es `__Host-`, `HttpOnly`, `Secure` y `SameSite=Strict`; en la base se guarda solo el hash del token. Salir borra la sesión del servidor.
- Cada página y cada acción del panel vuelve a validar la sesión en el servidor (no alcanza con esconder botones). Las acciones de Next verifican el origen del pedido; la subida de fotos además exige el mismo origen.
- Todo lo que llega del navegador se vuelve a validar en el servidor (largos, precios, SKUs, links de fotos); los productos se guardan en una transacción, con aviso si otra persona los cambió mientras tanto.
- **Fotos**: solo con sesión, hasta 15 MB, límite por IP; se decodifican y se vuelven a generar desde cero con sharp (WebP, sin metadatos), con nombre aleatorio. Nunca se sirve el archivo original. Se sirven con `nosniff` y CSP `sandbox`.
- **Registro de acciones** (`AdminLog`): ingresos, fallos, bloqueos, salidas, fotos subidas y cada alta, cambio (qué campos), borrado, publicación u ocultamiento de productos, con usuario, IP y hora.
- `/admin` va sin caché, con `noindex` y fuera de los buscadores.
- Las promociones solo aceptan links internos (`/…`) o `https://` (nada de `javascript:`), y fotos subidas al panel.

### Estadísticas
- Propias, sin cookies ni scripts de terceros. No se guarda la IP: cada visitante es un HMAC diario de IP + navegador con `ADMIN_SECRET` (no se puede revertir ni cruzar entre días). Robots y el propio panel no cuentan.
- El endpoint `/api/v` limita tamaño y cantidad de pedidos por IP y valida todo lo que recibe; los eventos de más de 13 meses se borran solos.
- El formulario de consultas por bicis a pedido tiene campo trampa, validación en el servidor y límite por IP.

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
| 2 | Panel de administración | Desarrollo | Hecho (ver arriba), con la sección Actividad para revisar el registro y aviso en pantalla si hay varios ingresos fallidos. Falta: avisos por email de ingresos nuevos. Mantener `ADMIN_SECRET` fuera de cualquier backup de la base. |
| 3 | CAPTCHA (Cloudflare Turnstile) | Desarrollo + cuenta Cloudflare | Los límites por IP y el honeypot frenan bots simples; uno distribuido en muchas IPs necesita CAPTCHA o un WAF (Cloudflare delante del servidor). |
| 4 | Servidor (VPS) | Quien lo administre | Firewall solo con 22/80/443, SSH solo con llave, actualizaciones automáticas (`unattended-upgrades`), fail2ban. |
| 5 | Backups de la base y las fotos | Quien lo administre | `pg_dump` diario y copia del volumen `uploads` (fotos del panel), cifrados y fuera del servidor, con prueba de restauración. |
| 6 | Monitoreo y alertas | Desarrollo | Hoy los avisos (pagos tardíos, montos menores) quedan solo en el log. Falta mandarlos por email o a un servicio como Sentry. |
| 7 | Credenciales de Mercado Pago | Dueño | Usar las de producción solo en el servidor, activar 2FA en la cuenta y rotar el token si alguien que lo vio deja el proyecto. |
| 8 | Datos legales reales | Dueño | Razón social y CUIT (`legal` en `store.ts`), datos bancarios, y confirmar la política de cambios (hoy 30 días). Hacer revisar los textos legales por un abogado o contador. |
| 9 | Registro de la base ante la AAIP | Dueño | La Ley 25.326 pide inscribir las bases de datos con datos personales en el Registro Nacional de Bases de Datos. |
| 10 | Borrado periódico | Hecho | Al abrir las estadísticas del panel se anonimizan turnos y consultas de más de 2 años y se borran las estadísticas de más de 13 meses. Si el panel no se usa por meses, no corre: conviene sumar una tarea programada. |
| 11 | CSP con nonces | Desarrollo | La CSP permite scripts inline porque Next los necesita; con nonces se puede sacar `'unsafe-inline'`, a costo de que todas las páginas pasen a ser dinámicas. |
| 12 | Límite por IP en memoria | Desarrollo | Sirve con un solo servidor. Si algún día hay varias instancias, pasarlo a Redis. |
