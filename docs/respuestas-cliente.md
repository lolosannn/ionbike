# Respuestas del cuestionario — ionbikestore

Respuestas del encargado de la web y la publicidad (versión detallada).

## Respuestas

1. **Carga de productos:** desde un sistema de gestión sincronizado con Mercado Libre (**Ecommap**).
2. **Lo que más tiempo lleva:** agregar una variante nueva a una publicación que ya existe; prácticamente hay que crearla de cero.
3. **Quién actualiza la página:** los chicos del local.
4. **Qué conservar:** la estética actual y los datos que aparecen en la pantalla de inicio.
5. **Qué mejorar para vender más:**
   - **Envío gratis:** en el checkout aparece el costo del envío gratis y la diferencia de precio con el envío a domicilio. Confunde al cliente y puede hacer que abandone la compra.
   - **Pago por transferencia:** Tiendanube genera un CVU aleatorio al que hay que transferir el importe exacto para que se genere el comprobante. Afecta la confianza. Prefieren ofrecer un **alias de Mercado Pago**.
   - **Diseño:** la página no resulta tan amigable ni atractiva. Quieren un inicio con más impacto visual, que destaque mejor productos y promociones, una navegación más intuitiva y que transmita más confianza.
6. **Funciones nuevas:**
   - Guía de talles para elegir bicicletas.
   - Mostrar modelos de gama alta que no estén en stock, con un botón **"Contactanos por WhatsApp"**.
   - Chatbot para responder preguntas frecuentes y bajar las consultas por WhatsApp.
   - Mapa con la ubicación del local.
7. *(Sin respuesta)*
8. **Servicios de taller:** service general, service full, tubelizado de ruedas, reposición de líquido tubeless, centrado de ruedas, lavado de bicicletas y purgado de frenos. Quieren **pedir turnos desde la web**.
9. **Canales de contacto:** WhatsApp y teléfono.
10. **Cierre de la venta:** compra directa en la web.
11. **Objetivo principal:** concretar más ventas a través de la web.

## Qué implica para la tienda

| Pedido | Estado en la tienda nueva |
|---|---|
| Envío gratis sin confusión en el checkout | Resuelto: si el carrito supera el mínimo, el envío figura como "Gratis" y no se muestra ninguna diferencia. Revisar que siga así al integrar Andreani. |
| Transferencia a alias fijo de Mercado Pago | Resuelto en la estructura: se muestran titular, CBU/CVU, alias y CUIT fijos (`src/config/store.ts`). Falta cargar el alias real. |
| Conservar estética y datos del inicio | Se mantuvieron negro + amarillo, banner, beneficios, disciplinas, más vendidos y marcas. |
| Inicio con más impacto y promociones | Parcial: hay banner de oferta. Falta un carrusel de promos y destacados editables. |
| Compra directa en la web | Hecho: carrito, checkout y Mercado Pago. |
| WhatsApp y teléfono como contacto | Hecho: botón flotante y página de contacto. |
| Guía de talles | Pendiente. |
| Gama alta sin stock con "Contactanos por WhatsApp" | Pendiente: productos "a pedido" que reemplacen el botón de compra por WhatsApp con mensaje prearmado. |
| Chatbot de preguntas frecuentes | Pendiente. |
| Mapa del local | Pendiente. |
| Turnos de taller | Pendiente: página de Taller con servicios y formulario de turno. |
| Variantes fáciles de agregar y sincronización con Ecommap | Pendiente: panel de administración donde se agrega una variante a un producto existente, e integración con Ecommap / Mercado Libre. Lo usan los chicos del local, así que tiene que ser simple. |
