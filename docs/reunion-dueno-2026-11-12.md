# Reunión con el dueño — 12/11/2026

Lista para llevar: qué mostrar, qué preguntar y qué definir.

## 1. Panel de administración (mostrar y que lo confirmen)

Hoy tiene: Estadísticas, Pedidos, Consultas a pedido, Turnos del taller, Promociones, Actividad y Productos (fotos, precios, variantes y stock).

Preguntar si les sirve así y si quieren sumar algo. Ideas para ofrecer:

- [ ] **Aumento masivo de precios** (ej.: +8% a una marca o categoría de una vez). Clave con la inflación.
- [ ] **Categorías** editables desde el panel (hoy están fijas).
- [ ] **Servicios y precios del taller**, horarios y cupos desde el panel (hoy en el código).
- [ ] **Datos de la tienda** desde el panel: alias, horarios, envío gratis, cuotas, texto de la barra de arriba.
- [ ] **Usuarios** desde el panel (hoy se crean por consola). ¿Cuántos chicos lo van a usar? ¿Todos con los mismos permisos?
- [ ] **Avisos**: email o WhatsApp cuando entra un pedido, una consulta o un turno.
- [ ] **Alerta de stock bajo**.
- [ ] **Importar / exportar Excel** de productos y precios.
- [ ] ¿Qué es lo que más les molesta hoy de cargar en Tiendanube? (dijeron: agregar una variante; ya está resuelto, mostrarlo).

## 2. Ecommap (EcommApp) — entrar y ver cómo trabajan

Que nos muestren una carga real de punta a punta. Anotar:

- [ ] ¿Dónde se cargan **fotos, precios, stock y variantes**? ¿En Ecommap, en Mercado Libre o en Tiendanube? ¿Cuál manda?
- [ ] ¿Cada variante tiene **código / SKU**? (lo necesitamos para cruzar productos).
- [ ] ¿**Precio distinto por canal**? (Mercado Libre suele estar más caro por la comisión). ¿Cuál va en la web?
- [ ] ¿Con qué **canales** se conecta? ¿Solo Tiendanube y Mercado Libre, o también tienda propia / WooCommerce / API?
- [ ] ¿Tiene **API, webhooks o exportación** (CSV/Excel)? Pedir la documentación o el contacto de soporte.
- [ ] ¿**Factura** (ARCA/AFIP) desde Ecommap? Si es así, los pedidos de la web nueva tienen que llegar a Ecommap para facturar y descontar stock.
- [ ] ¿Qué **plan** tienen y cuánto pagan? ¿La integración que necesitemos está en su plan?
- [ ] Pedir un **usuario de solo lectura** (o que nos den acceso) para probar.

### Caminos posibles según lo que veamos

| Si Ecommap… | Cómo conectamos la web nueva |
|---|---|
| Tiene API | Directo: traemos productos, fotos, precios y stock, y le mandamos los pedidos. Lo ideal. |
| No tiene API, pero sigue sincronizando con Tiendanube | **Usamos Tiendanube de puente**: Tiendanube tiene API pública; leemos de ahí productos y stock y le cargamos los pedidos. Tiendanube queda prendida solo como "depósito" (puede tener la tienda cerrada al público). |
| Solo sincroniza con Mercado Libre | Leemos de la API de Mercado Libre (ojo con el precio por canal). |
| Solo exporta Excel | Importación periódica + stock a mano. La peor opción. |

## 3. Plan de lanzamiento sin dar de baja Tiendanube

1. Conectar la web nueva a los datos reales (por el camino que elijamos) en un **subdominio de prueba** (ej.: `nueva.ionbikestore.com`), sin tocar la tienda actual.
2. Importar el catálogo real y borrar el de ejemplo.
3. Probar en paralelo unos días: stock que coincide, compras de prueba con Mercado Pago, envío, turnos.
4. Cuando esté todo bien: **cambiar el dominio** a la web nueva (la Tiendanube queda de respaldo o como puente).
5. Fijar fecha de lanzamiento.

Para esto necesitamos: acceso al **dominio / DNS** (¿quién lo tiene?), un **servidor (VPS)** y quién lo paga, y las credenciales de **Mercado Pago** de producción.

## 4. Datos que faltan (pedirlos en la reunión)

- [ ] Alias, CBU/CVU, titular y CUIT para transferencias.
- [ ] Razón social y CUIT para los textos legales.
- [ ] Cuotas reales: ¿12 o 24? ¿Con qué recargos?
- [ ] Confirmar precios del taller con el 40% OFF en service general y full (¿hasta cuándo?).
- [ ] Contrato con **Andreani** (credenciales de la API) o tarifas reales.
- [ ] Historia del local, video y fotos para "Quiénes somos"; fotos reales y logo original.
- [ ] Link de reseñas de Google y redes sociales.
- [ ] Validar la guía de talles con las marcas que venden.

## 5. Para charlar / definir

- [ ] **Chatbot** de preguntas frecuentes: ¿lo siguen queriendo? ¿Qué preguntas son las más comunes?
- [ ] **Emails** de confirmación de pedido al cliente.
- [ ] Quién **mantiene** la web después del lanzamiento (servidor, backups, cambios) y costo mensual.
- [ ] Revisión de los textos legales por un contador o abogado, y registro de la base ante la AAIP.
- [ ] Fecha objetivo de lanzamiento.
