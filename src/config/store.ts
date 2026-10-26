// Datos y reglas comerciales de la tienda. Cambiar acá impacta en todo el sitio.
export const store = {
  name: "IonBikeStore",
  phone: "+54 11 2829-1177",
  whatsapp: "5491128291177",
  email: "ionbikestore@gmail.com",
  address: "Av. Fair 328, Monte Grande",
  // Nombre de la ficha del local en Google Maps: los links abren el negocio, no solo la dirección
  mapsName: "Ion Bike Store",
  // Opcional: ID de lugar de Google (Place ID) para clavar la ficha exacta del local
  mapsPlaceId: "",
  hours: "[HORARIOS DEL LOCAL]",
  // Link para dejar reseña en Google. Reemplazar por el de la ficha del local
  // (Google Business > "Pedir reseñas"); mientras tanto abre la búsqueda en Maps.
  googleReviewsUrl: "https://www.google.com/maps/search/?api=1&query=Ion%20Bike%20Store%2C%20Av.%20Fair%20328%2C%20Monte%20Grande",
  social: {
    instagram: "#",
    facebook: "#",
    tiktok: "#",
  },
  // Descuento por pago con transferencia (porcentaje)
  transferDiscountPct: 25,
  // Envío gratis a partir de este monto (en centavos)
  freeShippingFrom: 300_000_00,
  // Costo de envío fijo mientras no esté la integración con Andreani (en centavos)
  shippingFlatRate: 15_000_00,
  installments: 12,
  // Planes de cuotas de la ficha de producto. recargoPct es el recargo total sobre el
  // precio de lista (0 = sin interés). Para sumar planes con interés, por ejemplo:
  // { cuotas: 18, recargoPct: 20 }, { cuotas: 24, recargoPct: 35 }
  financing: [
    { cuotas: 3, recargoPct: 0 },
    { cuotas: 6, recargoPct: 0 },
    { cuotas: 12, recargoPct: 0 },
  ],
  // Video de la guía de talles: ID de YouTube (lo que va después de "v=") o URL de un .mp4.
  // Vacío usa el video propio de public/talles/guia-de-talles.mp4 (o un aviso si no está).
  sizeGuideVideo: "",
  // Datos para transferencia bancaria
  bank: {
    holder: "[TITULAR DE LA CUENTA]",
    cbu: "[CBU]",
    alias: "[ALIAS]",
    cuit: "[CUIT]",
  },
  paymentBrands: [
    "Visa", "Mastercard", "Amex", "Diners", "Cabal", "Naranja X", "Nativa",
    "Argencard", "Maestro", "Banelco", "Link", "Pago Fácil", "Rapipago", "Provincia",
  ],
} as const;

/** Link de WhatsApp con un mensaje ya escrito (opcional). */
export function whatsappUrl(text?: string) {
  return `https://wa.me/${store.whatsapp}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
}

// Texto de "Quiénes somos" (página de contacto). Cada elemento es un párrafo.
export const about = {
  title: "Somos IonBikeStore",
  paragraphs: [
    "Somos una bicicletería de Monte Grande. Vendemos bicis de MTB, gravel, ruta, dirt jump y eléctricas, además de repuestos, accesorios e indumentaria.",
    "Nos gusta asesorar: te ayudamos a elegir la bici y el talle según cómo y por dónde vas a rodar. Y con nuestro taller propio te acompañamos después de la compra, para que tu bici siga rodando como el primer día.",
    "[HISTORIA DEL LOCAL: desde cuándo están, quiénes lo llevan adelante, qué los diferencia]",
  ],
  highlights: [
    // icon: "taller" (llave), "asesoramiento" (estrella) o "envios" (camión)
    { icon: "taller", title: "Taller propio", text: "Service, tubeless, centrado de ruedas, purgado de frenos y lavado." },
    { icon: "asesoramiento", title: "Asesoramiento", text: "Te ayudamos con el talle y la bici ideal para vos." },
    { icon: "envios", title: "Todo el país", text: "Envíos con Andreani o retiro sin cargo en el local." },
  ],
  // Video del local: public/nosotros/local.mp4 (con portada opcional local.jpg)
  // Fotos: public/nosotros/1.jpg, 2.jpg, ... en este orden. El texto describe la foto.
  photos: [
    "Bicis, cascos y accesorios en el local",
    "Asesoramiento personalizado en el local",
    "Vidriera del local",
    "Salida grupal con clientes",
  ],
};

// Carrusel del inicio, en este orden. file: imagen en public/banners/ (unos 1775 x 558 px).
// Opcionales: mobile (imagen para celular, más alta, en la misma carpeta) y href (adónde lleva al tocarla).
export const banners: { file: string; alt: string; mobile?: string; href?: string }[] = [
  {
    file: "oferta-dallas-benz.webp",
    alt: "Oferta especial: Eurobike Dallas y Gravity Benz con 20% de descuento",
    href: "/categoria/bicicletas",
  },
];

export const nav = [
  { label: "Inicio", href: "/" },
  { label: "Bicicletas", href: "/categoria/bicicletas" },
  { label: "Taller", href: "/taller" },
  { label: "Repuestos", href: "/categoria/repuestos" },
  { label: "Accesorios", href: "/categoria/accesorios" },
  { label: "Indumentaria", href: "/categoria/indumentaria" },
  { label: "Guía de talles", href: "/guia-de-talles" },
  { label: "Contacto", href: "/contacto" },
];
