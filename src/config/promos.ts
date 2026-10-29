// Promociones de la tienda. Hasta que esté el panel de administración se cargan acá;
// después van a salir de la base de datos con esta misma forma.
//
// Cada promo elige en qué lugares de la web aparece (`placements`):
//   "barra"    → la barra amarilla de arriba, con los mensajes que van rotando (todas las páginas)
//   "inicio"   → el banner grande del inicio, debajo del video
//   "listado"  → una tarjeta entre los productos de las categorías y de Ofertas
//   "producto" → un sello en las tarjetas y un recuadro en la ficha de los productos a los que aplica
//   "carrito"  → un aviso arriba del carrito
//
// `categories` / `products` (slugs) limitan a qué aplica: en los listados y productos solo aparece
// donde corresponde. Sin ninguno de los dos, es una promo general (y no lleva sello en los productos).
// Fechas "AAAA-MM-DD" (hora de Argentina): antes de `from` y después de `until` no se muestra sola.
// Faltando menos de 3 días para `until`, se muestra la cuenta regresiva.
// Foto opcional para el banner del inicio: public/promos/<id>.jpg (o .png / .webp).
//
// Las de abajo son de ejemplo: reemplazarlas por las promos reales.

export type PromoPlacement = "barra" | "inicio" | "listado" | "producto" | "carrito";

export type Promo = {
  id: string;
  title: string;
  text?: string;
  // Sello corto para las tarjetas de producto ("Hot Sale", "Combo")
  tag?: string;
  href?: string;
  cta?: string;
  from?: string;
  until?: string;
  categories?: string[];
  products?: string[];
  placements: PromoPlacement[];
  // Mayor número, primero
  priority?: number;
};

export const promos: Promo[] = [
  {
    id: "bicis-en-oferta",
    title: "Hasta 15% OFF en bicis seleccionadas",
    text: "Precios especiales en modelos de MTB y Dirt Jump, con envío gratis a todo el país.",
    tag: "Oferta",
    href: "/ofertas",
    cta: "Ver ofertas",
    from: "2026-10-01",
    until: "2026-12-31",
    categories: ["bicicletas"],
    placements: ["barra", "inicio", "listado"],
    priority: 3,
  },
  {
    id: "zion-combo-luces",
    title: "Kit de luces al 50% con tu Zion",
    text: "Llevate cualquier Zion rodado 29 y sumá el kit de luces delantera y trasera a mitad de precio.",
    tag: "Combo",
    href: "/categoria/mtb",
    cta: "Ver las Zion",
    from: "2026-10-01",
    until: "2026-12-31",
    products: ["bicicleta-mtb-zion-aspro-rodado-29-21v", "bicicleta-mtb-zion-ovanta-r29-monoplato"],
    placements: ["barra", "inicio", "listado", "producto"],
    priority: 2,
  },
  {
    id: "service-20-off",
    title: "Service completo con 20% OFF",
    text: "Pedí tu turno en el taller: ajuste general, limpieza de transmisión y centrado de ruedas.",
    href: "/taller",
    cta: "Pedir turno",
    from: "2026-10-01",
    until: "2026-12-31",
    placements: ["barra", "inicio", "carrito"],
    priority: 1,
  },
];
