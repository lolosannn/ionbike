// Datos y reglas comerciales de la tienda. Cambiar acá impacta en todo el sitio.
export const store = {
  name: "IonBikeStore",
  phone: "+54 11 2829-1177",
  whatsapp: "5491128291177",
  email: "ionbikestore@gmail.com",
  address: "Av. Fair 328, Monte Grande",
  hours: "[HORARIOS DEL LOCAL]",
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

export const nav = [
  { label: "Inicio", href: "/" },
  { label: "Bicicletas", href: "/categoria/bicicletas" },
  { label: "E-Bike", href: "/categoria/e-bike" },
  { label: "Repuestos", href: "/categoria/repuestos" },
  { label: "Accesorios", href: "/categoria/accesorios" },
  { label: "Indumentaria", href: "/categoria/indumentaria" },
  { label: "Contacto", href: "/contacto" },
];
