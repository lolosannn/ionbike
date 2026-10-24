# IonBikeStore

Tienda online propia de IonBikeStore (Monte Grande), en reemplazo de Tiendanube.

**Stack:** Next.js 15 (App Router) · PostgreSQL + Prisma · Mercado Pago Checkout Pro · Docker para el hosting propio.

## Qué incluye

- **Inicio**: banner de oferta, beneficios, disciplinas, buscador de talle (lleva a la guía con el resultado), más vendidos, secciones, cinta animada de marcas y local.
- **Categorías** (`/categoria/[slug]`): subcategorías y filtros por rodado, marca, color, precio y envío gratis; orden por ventas, precio o novedad.
- **Ficha de producto** (`/producto/[slug]`): galería, selección de color y rodado con stock por variante, precios con tarjeta, transferencia y cuotas.
- **Carrito** guardado en el navegador y **checkout** con envío a domicilio o retiro en el local.
- **Pagos**: Mercado Pago (tarjetas, cuotas, efectivo) y transferencia con 25% off.
- **Pedidos**: el stock se descuenta al confirmar; el webhook de Mercado Pago marca el pedido como pagado.
- **Productos a pedido** (gama alta sin stock): campo `onRequest` del producto. En lugar de comprar, muestran "Contactanos por WhatsApp" con el nombre del modelo ya escrito en el mensaje.
- **Guía de talles** (`/guia-de-talles`, en el menú principal): calculadora por altura, tablas de MTB, ruta/gravel e infantiles, y lugar para el video explicativo.
- **Mapa del local** en el inicio y en contacto (Google Maps, sin clave de API).
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

- [ ] Panel de administración: productos, fotos, stock y pedidos. Agregar una variante a un producto existente tiene que ser rápido (hoy es lo que más tiempo les lleva).
- [ ] Sincronización de stock con Mercado Libre vía Ecommap (hoy conectado a Tiendanube).
- [ ] Chatbot de preguntas frecuentes.
- [ ] Video animado de la guía de talles (cuando esté, poner el ID de YouTube o la URL del .mp4 en `sizeGuideVideo`, en `store.ts`).
- [ ] Validar la tabla de talles con las marcas que trabaja el local (`src/app/guia-de-talles/sizes.ts`).
- [ ] Página de Taller con pedido de turnos (service general y full, tubelizado, líquido tubeless, centrado, lavado, purgado de frenos).
- [ ] Inicio con más impacto: carrusel de promociones y destacados.
- [ ] Cotización de envíos con la API de Andreani (hoy es una tarifa fija en `store.ts`).
- [ ] Importar el catálogo real desde Tiendanube (exportación CSV).
- [ ] Emails de confirmación de pedido.
- [ ] Logos de las marcas: poner los archivos en `public/marcas/` como `zion.svg`, `spy.png`, etc. (si falta, se muestra el nombre).
- [ ] Fotos reales, logo original, alias de Mercado Pago y horarios (marcados entre corchetes).
- [ ] Términos y condiciones, y políticas de cambios y envíos.
