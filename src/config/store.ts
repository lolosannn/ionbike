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
  hours: "Lun a vie de 8 a 17 h · Sáb de 8 a 13 h",
  // Link para dejar reseña en Google. Reemplazar por el de la ficha del local
  // (Google Business > "Pedir reseñas"); mientras tanto abre la búsqueda en Maps.
  googleReviewsUrl: "https://www.google.com/maps/search/?api=1&query=Ion%20Bike%20Store%2C%20Av.%20Fair%20328%2C%20Monte%20Grande",
  social: {
    instagram: "#",
    facebook: "#",
    tiktok: "#",
  },
  // Descuento por pago con transferencia o efectivo (porcentaje). No se aplica al envío.
  transferDiscountPct: 25,
  // true: el efectivo en Pago Fácil o Rapipago también tiene el descuento (como el efectivo
  // en el local). Ojo que ese cobro pasa por Mercado Pago y tiene su comisión.
  ticketDiscount: true,
  // Envío gratis a partir de este monto (en centavos)
  freeShippingFrom: 300_000_00,
  // Envíos con Andreani. Si están cargadas las credenciales (ANDREANI_* en .env) la tienda
  // cotiza en vivo con la API; si no, o si la API no responde, usa esta tabla por zona.
  // Montos en centavos, IVA incluido: "small" es una caja chica (repuestos, accesorios,
  // ropa: todo lo del pedido viaja junto) y "bike" es cada bicicleta en su caja.
  shipping: {
    zones: {
      amba: { label: "CABA y GBA", days: "1 a 3 días hábiles", small: 9_900_00, bike: 34_900_00 },
      centro: { label: "Región centro", days: "3 a 5 días hábiles", small: 13_900_00, bike: 52_900_00 },
      norte: { label: "Norte, Cuyo y Comahue", days: "4 a 7 días hábiles", small: 16_900_00, bike: 67_900_00 },
      sur: { label: "Patagonia sur", days: "5 a 9 días hábiles", small: 21_900_00, bike: 89_900_00 },
    },
    // Medidas y peso de cada bulto para la cotización de Andreani
    packages: {
      small: { kilos: 3, cm: [40, 30, 20] },
      bike: { kilos: 18, cm: [145, 80, 25] },
    },
  },
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
  // Horas que un pedido impago reserva el stock. Pasado ese plazo se cancela solo y el stock
  // vuelve a estar disponible (así nadie puede dejar la tienda "sin stock" con pedidos que no paga).
  orderHoldHours: {
    CARD: 2,
    MERCADOPAGO: 2,
    QR: 2,
    TRANSFER: 48,
    CASH: 72,
    // El cupón de Pago Fácil / Rapipago vence un día antes, para dar tiempo a la acreditación
    TICKET: 96,
  },
  // Topes contra el abuso: pedidos impagos por cliente (DNI, email o teléfono) y turnos
  // futuros del taller por teléfono
  maxPendingOrders: 3,
  maxUpcomingAppointments: 2,
  // Datos del responsable de la tienda para las páginas legales (Ley 24.240 y 25.326)
  legal: {
    razonSocial: "[RAZÓN SOCIAL]",
    cuit: "[CUIT]",
    domicilio: "Av. Fair 328, Monte Grande, provincia de Buenos Aires",
  },
  // Datos para transferencia (cuenta bancaria o de Mercado Pago, con alias fijo)
  bank: {
    holder: "[TITULAR DE LA CUENTA]",
    cbu: "[CBU / CVU]",
    alias: "[ALIAS]",
    cuit: "[CUIT]",
  },
  paymentBrands: [
    "Visa", "Mastercard", "Amex", "Diners", "Cabal", "Naranja X", "Nativa",
    "Argencard", "Maestro", "MODO", "Banelco", "Link", "Pago Fácil", "Rapipago", "Provincia",
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
