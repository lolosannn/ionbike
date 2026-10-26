// Reseñas del local copiadas de Google Maps (texto tal cual lo dejó cada cliente).
// Para sumar una, agregarla a la lista; se reparten solas entre las dos filas del carrusel.
export type Review = { name: string; text: string; stars: number; localGuide?: boolean };

export const reviews: Review[] = [
  { name: "Valentin Ovalle", stars: 5, text: "Muy buena atención, el lugar super nuevo y novedoso. Bicis de todos los tipos a precios accesibles." },
  { name: "Leandro Alvarez", stars: 5, localGuide: true, text: "Muy buena calidad de bicicletas con variedad de opciones... Gracias por la atención y asesoramiento" },
  { name: "Comflex S.A.", stars: 5, text: "Muy buena la atención excelentes productos a muy buen precio." },
  { name: "Beatriz D'Alessandro", stars: 5, text: "Muy conforme con la atención y cumplimiento con la entrega en tiempo y forma!!" },
  { name: "Fernando Becerra", stars: 5, text: "Excelente atención y predisposición, calidad y precio 100% recomendable" },
  { name: "walter florencio", stars: 5, text: "Excelente atención y buen servicio post venta, altamente recomendable. Por más negocios que funcionen así!" },
  { name: "Laura baez acosta", stars: 5, localGuide: true, text: "Exelente lugar ; exelente trato y atención de cada uno de los integrantes del lugar super amables" },
  { name: "Andrea Alvarez", stars: 5, localGuide: true, text: "Muy buena atención , buenos productos y variedad de precios para cada bolsillo." },
  { name: "Luis Antonio Muñoz", stars: 5, text: "Realicé dos compras y llegaron muy rápido, responsables y de confianza para comprar." },
  { name: "franco gimenez", stars: 5, text: "Siempre con una atención y amabilidad de parte de todo su equipo para con el cliente !!!" },
  { name: "Damian Alejandro Barrionuevo Soto", stars: 5, text: "Excelente atención, amabilidad, profesionalismo, predisposición, garantía, entrega, etc." },
  { name: "sebastian bai", stars: 5, text: "Excelente atención y servicio. Salió todo mejor de lo que esperaba." },
];
