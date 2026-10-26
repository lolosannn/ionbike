# IonBikeStore

Tienda online propia de IonBikeStore (Monte Grande), en reemplazo de Tiendanube.

**Stack:** Next.js 15 (App Router) · PostgreSQL + Prisma · Mercado Pago Checkout Pro · Docker para el hosting propio.

## Qué incluye

- **Inicio**: carrusel de banners (pasa solo, con flechas y puntos; se configura en `banners`, en `store.ts`, con las imágenes en `public/banners/`), beneficios, cinta animada de marcas, más vendidos, disciplinas, bloque "¿Cuál es tu talle?" que lleva a la guía, secciones, local (foto de cliente + mapa) y adelanto de "Quiénes somos" que lleva a contacto.
- **Categorías** (`/categoria/[slug]`): subcategorías y filtros por rodado, marca, color, precio y envío gratis; orden por ventas, precio o novedad.
- **Ficha de producto** (`/producto/[slug]`): galería, precio en efectivo/transferencia y de lista, tabla de **financiación** (planes en `financing`, en `store.ts`: cuotas y recargo), beneficios, envío, selección de color y rodado con stock por variante, botón de asesoramiento por WhatsApp y **especificaciones desplegables** por parte de la bici, con ícono y en orden de importancia (`src/lib/specs.ts`: partes, orden y nombres alternativos).
- **Carrito** guardado en el navegador, con barra de avance al envío gratis, **cotizador de envío** (código postal + provincia) y cuánto sale el carrito con cada forma de pago. **Checkout** con envío a domicilio o retiro en el local.
- **Envíos con Andreani**: gratis a todo el país desde $300.000. Debajo de ese monto, con las credenciales `ANDREANI_*` en `.env` se cotiza en vivo con la API de Andreani (`src/lib/andreani.ts`); sin ellas, o si la API no responde, se usa la tabla por zona de `shipping` en `store.ts` (CABA y GBA, centro, norte/Cuyo/Comahue y Patagonia sur; caja chica para repuestos, accesorios y ropa, y una caja grande por bici). El servidor siempre recalcula el envío al crear el pedido.
- **Pagos**: Mercado Pago (crédito hasta 12 cuotas, débito, dinero en cuenta, Pago Fácil y Rapipago), transferencia con 25% off y efectivo al retirar en el local con 25% off. El descuento no se aplica al envío.
- **Pedidos**: el stock se descuenta al confirmar; el webhook de Mercado Pago marca el pedido como pagado.
- **Productos a pedido** (gama alta sin stock): campo `onRequest` del producto. En lugar de comprar, muestran "Contactanos por WhatsApp" con el nombre del modelo ya escrito en el mensaje.
- **Guía de talles** (`/guia-de-talles`, en el menú principal): calculadora por altura, tablas de MTB, ruta/gravel e infantiles, y video explicativo animado (`public/talles/guia-de-talles.mp4`). El video se arma en `video/guia-de-talles/` (HTML animado + `render.mjs`, que lo exporta con Playwright y ffmpeg); el guion para la locución está en `video/guia-de-talles/guion.md`.
- **Quiénes somos** (`/contacto#quienes-somos`): texto, destacados, video del local y 4 fotos. El texto y la descripción de cada foto se editan en `about`, en `src/config/store.ts`; las fotos van en `public/nosotros/1.jpg` … `4.jpg` y el video en `public/nosotros/local.mp4` (portada opcional `local.jpg`).
- **Disciplinas del inicio**: Mountain Bike, Dirt Jump, Ruta, Gravel y E-Bike (orden en `disciplineOrder`, `src/lib/catalog.ts`), con foto en `public/disciplinas/<slug>.jpg`.
- **Mapa del local** en el inicio y en contacto (Google Maps, sin clave de API).
- **Taller** (`/taller`): los 7 servicios y agenda de turnos para dejar la bici. El cliente elige servicios, día y horario libre y deja sus datos; el turno se guarda (modelo `Appointment`) respetando el cupo por horario, y al final puede avisar al local por WhatsApp. Servicios, precios, horarios y cupos en `src/config/workshop.ts`.
- Buscador, contacto, botón de arrepentimiento y botón flotante de WhatsApp.

Las reglas comerciales (descuento por transferencia, envío gratis, cuotas, datos bancarios y de contacto) están en `src/config/store.ts`.

## Desarrollo local

Requiere Node 22 y PostgreSQL 16.

```bash
cp .env.example .env          # completar DATABASE_URL
npm install
npm run db:migrate            # crea las tablas
npm run db:seed               # carga categorías y productos de ejemplo
npm run dev                   # http://localhost:3000
```

`npm run lint` corre el chequeo de tipos.

## Vista previa en GitHub Pages

Cada push a la rama publica una vista previa en https://lolosannn.github.io/ionbike/ (workflow `.github/workflows/pages.yml`).

Es una versión estática: lee el catálogo de ejemplo de `src/data/catalog.ts` en vez de la base de datos, y el checkout se simula (no crea pedidos ni cobra). Para generarla localmente: `PAGES_BASE_PATH=/ionbike npm run build:pages` (queda en `out/`).

Los archivos `*.server.tsx` / `*.server.ts` son solo de la tienda real y `*.demo.tsx` solo de la vista previa (ver `pageExtensions` en `next.config.ts`).

## Producción (servidor propio)

En un VPS con Docker:

```bash
cp .env.example .env          # completar POSTGRES_PASSWORD, SITE_URL (https://www.ionbikestore.com), MP_*
docker compose up -d --build
```

Levanta PostgreSQL, aplica las migraciones y deja la tienda en el puerto 3000. Delante va un proxy con HTTPS (Caddy o Nginx + Let's Encrypt) apuntando al dominio.

### Mercado Pago

1. Crear una aplicación en el [panel de desarrolladores](https://www.mercadopago.com.ar/developers/panel/app) y copiar el *Access Token* de producción en `MP_ACCESS_TOKEN`.
2. En *Webhooks*, configurar `https://www.ionbikestore.com/api/webhooks/mercadopago` con el evento **Pagos** y copiar la clave secreta en `MP_WEBHOOK_SECRET`.
3. Las cuotas sin interés se configuran en la cuenta de Mercado Pago.

Sin `MP_ACCESS_TOKEN` el checkout solo ofrece transferencia.

## Pendientes

- [ ] Panel de administración: productos, fotos, stock, pedidos y turnos del taller (hoy los turnos se ven en la base de datos y llegan por WhatsApp si el cliente avisa).
- [ ] Precios, duraciones y horarios reales del taller (`src/config/workshop.ts`). Agregar una variante a un producto existente tiene que ser rápido (hoy es lo que más tiempo les lleva).
- [ ] Sincronización de stock con Mercado Libre vía Ecommap (hoy conectado a Tiendanube).
- [ ] Chatbot de preguntas frecuentes.
- [x] Video animado de la guía de talles.
- [ ] Grabar la locución con ElevenLabs (`video/guia-de-talles/guion.md`), guardarla como `video/guia-de-talles/voz.mp3` y volver a renderizar.
- [ ] Validar la tabla de talles con las marcas que trabaja el local (`src/app/guia-de-talles/sizes.ts`).
- [ ] Página de Taller con pedido de turnos (service general y full, tubelizado, líquido tubeless, centrado, lavado, purgado de frenos).
- [ ] Inicio con más impacto: carrusel de promociones y destacados.
- [ ] Cargar las credenciales de Andreani (`ANDREANI_*`) cuando esté el contrato, y ajustar la tabla de `shipping` en `store.ts` con las tarifas que pase Andreani (hoy son estimadas).
- [ ] Cargar el alias, CBU/CVU, titular y CUIT reales para transferencias (`bank` en `store.ts`).
- [ ] Importar el catálogo real desde Tiendanube (exportación CSV) y borrar el de muestra (`src/data/catalog.ts`) con sus ilustraciones (`public/demo/`).
- [ ] Emails de confirmación de pedido.
- [ ] Historia del local para "Quiénes somos" y video del local.
- [ ] Link de reseñas de Google del local (`googleReviewsUrl` en `store.ts`), horarios y redes sociales.
- [ ] Planes de cuotas reales con sus recargos (`financing` en `store.ts`; hoy 3, 6 y 12 sin interés).
- [ ] Fotos reales, logo original, alias de Mercado Pago y horarios (marcados entre corchetes).
- [ ] Términos y condiciones, y políticas de cambios y envíos.
